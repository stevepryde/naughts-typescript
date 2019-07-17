import assert from "assert";
import { GamePlayer, PlayerState } from "../../lib/gameplayer";
import { GameInfo } from "../../lib/gamebase";
import { randomChoice, randomSample } from "../../lib/support/misc";
import { NodeBase } from "./nodebase";
import {
  NODE_INPUT,
  NODE_NOT,
  NODE_AND,
  NODE_OR,
  NODE_XOR,
  NODE_NAND,
  NODE_NOR,
  NODE_XNOR,
  NODE_OUTPUT
} from "./nodes";

function getNodeInstance(className: string): NodeBase {
  switch (className) {
    case "NODE_INPUT":
      return new NODE_INPUT();
    case "NODE_NOT":
      return new NODE_NOT();
    case "NODE_AND":
      return new NODE_AND();
    case "NODE_OR":
      return new NODE_OR();
    case "NODE_XOR":
      return new NODE_XOR();
    case "NODE_NAND":
      return new NODE_NAND();
    case "NODE_NOR":
      return new NODE_NOR();
    case "NODE_XNOR":
      return new NODE_XNOR();
    case "NODE_OUTPUT":
      return new NODE_OUTPUT();
    default:
      break;
  }

  assert.fail("Unknown node class: " + className);
  return new NODE_NOT();
}

export default class GenBot3 extends GamePlayer {
  private nodes: NodeBase[] = [];
  private outputNodes: NODE_OUTPUT[] = [];

  constructor() {
    super();
    this.genetic = true;
  }

  getRecipe(): string {
    let recipeBlocks: string[] = [];
    let nodeList = this.nodes.concat(this.outputNodes);

    for (let node of nodeList) {
      let name = node.constructor.name;
      let ingredientBlocks = [name];
      for (let inputNode of node.inputNodes) {
        ingredientBlocks.push(inputNode.index.toString());
      }

      recipeBlocks.push(ingredientBlocks.join(":"));
    }

    return recipeBlocks.join(",");
  }

  public getState(): PlayerState {
    return { name: "GenBot3", recipe: this.getRecipe() };
  }

  public setState(state: PlayerState): void {
    let recipe = state.recipe;
    this.createFromRecipe(recipe);
  }

  public create(gameInfo: GameInfo): void {
    this.nodes = [];
    this.outputNodes = [];

    // First create input nodes.
    for (let i = 0; i < gameInfo.inputCount; i++) {
      let node = new NODE_INPUT();
      node.index = i;
      this.nodes.push(new NODE_INPUT());
    }

    // Now generate random nodes.
    let numNodes = 100;
    let next_index = this.nodes.length;
    for (let n = 0; n < numNodes; n++) {
      // Create random node.
      let node = this.getRandomNodeInstance();
      node.index = next_index;

      // Connect up a random sample of input nodes.
      node.inputNodes = randomSample(this.nodes, node.numInputs);

      // Add this node.
      this.nodes.push(node);
      next_index++;
    }

    // Now add output nodes.
    for (let i = 0; i < gameInfo.outputCount; i++) {
      let node = new NODE_OUTPUT();
      node.inputNodes = randomSample(this.nodes, node.numInputs);
      this.outputNodes.push(node);
    }
  }

  createFromRecipe(recipe: string): void {
    this.nodes = [];
    this.outputNodes = [];

    let nodeIndex = 0;
    let recipeBlocks = recipe.split(",");
    for (let recipeBlock of recipeBlocks) {
      let ingredientBlocks = recipeBlock.split(":");
      let className = ingredientBlocks[0];
      let instance = getNodeInstance(className);

      if (className !== "NODE_INPUT") {
        // let inputsRequired = instance.numInputs;
        // assert.ok(ingredientBlocks.length === inputsRequired + 1);

        for (let inputNumber of ingredientBlocks.slice(1)) {
          instance.addInputNode(this.nodes[parseInt(inputNumber)]);
        }
        instance.numInputs = instance.inputNodes.length;
      }

      if (className === "NODE_OUTPUT") {
        this.outputNodes.push(instance);
      } else {
        this.nodes.push(instance);
        instance.index = nodeIndex;
        nodeIndex += 1;
      }
    }
  }

  public mutate(): void {
    let mutableNodeIndexes: number[] = [];
    this.nodes.forEach((node, index) => {
      if (node.inputNodes.length > 0) {
        mutableNodeIndexes.push(index);
      }
    });

    let nodeIndex = randomChoice(mutableNodeIndexes);
    let node = this.nodes[nodeIndex];
    if (randomChoice([0, 1]) === 1) {
      node = this.getRandomNodeInstance();
      node.index = nodeIndex;
      this.nodes[nodeIndex] = node;
    }

    // Also change/set inputs.
    let numInputs = node.numInputs;
    let inputsAvailable: number[] = [];
    for (let i = 0; i < node.index; i++) {
      inputsAvailable.push(i);
    }
    let inputNumbers = randomSample(inputsAvailable, numInputs);
    node.inputNodes = [];
    for (let num of inputNumbers) {
      node.inputNodes.push(this.nodes[num]);
    }
  }

  getRandomNodeInstance(): NodeBase {
    let nodePool = [
      "NODE_NOT",
      "NODE_AND",
      "NODE_OR",
      "NODE_XOR",
      "NODE_NAND",
      "NODE_NOR",
      "NODE_XNOR"
    ];
    let className = randomChoice(nodePool);
    return getNodeInstance(className);
  }

  public process(inputs: number[], availableMoves: number[]): number {
    inputs.forEach((inputValue, p) => {
      (this.nodes[p] as NODE_INPUT).setValue(inputValue);
    });

    // Engage brain.
    for (let index = inputs.length; index < this.nodes.length; index++) {
      this.nodes[index].update();
    }

    // And finally process the output nodes.
    for (let node of this.outputNodes) {
      node.update();
    }

    // Get best move.
    let bestMove = availableMoves[0];
    let bestOutput = 0;
    for (let m of availableMoves) {
      if (this.outputNodes[m].output > bestOutput) {
        bestMove = m;
        bestOutput = this.outputNodes[m].output;
      }
    }

    return bestMove;
  }
}
