import assert from "assert";
import { GamePlayer, PlayerState } from "../../lib/gameplayer";
import { GameInfo } from "../../lib/gamebase";
import { NodeBase } from "./nodebase";
import {
  NodeInput,
  NodeNot,
  NodeAnd,
  NodeOr,
  NodeXor,
  NodeNand,
  NodeNor,
  NodeXnor,
  NodeOutput
} from "./nodes";

function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomSample<T>(items: T[], count: number): T[] {
  if (count >= items.length) {
    return items;
  }

  let indexes: number[] = [];
  for (let i = 0; i < items.length; i++) {
    indexes.push(i);
  }

  let values: T[] = [];
  for (let i = 0; i < count; i++) {
    let index = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
    values.push(items[index]);
  }

  return values;
}

function getNodeInstance(className: string): NodeBase {
  switch (className) {
    case "NodeInput":
      return new NodeInput();
    case "NodeNot":
      return new NodeNot();
    case "NodeAnd":
      return new NodeAnd();
    case "NodeOr":
      return new NodeOr();
    case "NodeXor":
      return new NodeXor();
    case "NodeNand":
      return new NodeNand();
    case "NodeNor":
      return new NodeNor();
    case "NodeXnor":
      return new NodeXnor();
    case "NodeOutput":
      return new NodeOutput();
    default:
      break;
  }

  assert.fail("Unknown node class: " + className);
  return new NodeNot();
}

export default class GenBot3 extends GamePlayer {
  private nodes: NodeBase[] = [];
  private outputNodes: NodeOutput[] = [];

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
      this.nodes.push(new NodeInput());
    }

    // Now generate random nodes.
    let numNodes = 100;
    for (let n = 0; n < numNodes; n++) {
      // Create random node.
      let node = this.getRandomNodeInstance();
      node.index = n;

      // Connect up a random sample of input nodes.
      node.inputNodes = randomSample(this.nodes, node.numInputs);

      // Add this node.
      this.nodes.push(node);
    }

    // Now add output nodes.
    for (let i = 0; i < gameInfo.outputCount; i++) {
      let node = new NodeOutput();
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

      if (className !== "NodeInput") {
        let inputsRequired = instance.numInputs;
        assert.ok(ingredientBlocks.length === inputsRequired + 1);

        for (let inputNumber of ingredientBlocks.slice(1)) {
          instance.addInputNode(this.nodes[parseInt(inputNumber)]);
        }
      }

      if (className === "NodeOutput") {
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
    let nodePool = ["NodeNot", "NodeAnd", "NodeOr", "NodeXor", "NodeNand", "NodeNor", "NodeXnor"];
    let className = randomChoice(nodePool);
    return getNodeInstance(className);
  }

  public process(inputs: number[], availableMoves: number[]): number {
    inputs.forEach((inputValue, p) => {
      (this.nodes[p] as NodeInput).setValue(inputValue);
    });

    // Engage brain.
    for (let index = inputs.length; index < this.nodes.length; index++) {
      this.nodes[index].update();
    }

    // And finally process the output nodes.
    for (let node of this.outputNodes) {
      node.update();
    }

    // Sort moves according to the value of the output nodes.
    let dsort = {};
    for (let move of availableMoves) {
      dsort[move] = this.outputNodes[move].output;
    }

    let sortedMoves = Object.keys(dsort).sort((moveA, moveB) => {
      return dsort[moveA] - dsort[moveB];
    });
    return parseInt(sortedMoves[0]);
  }
}
