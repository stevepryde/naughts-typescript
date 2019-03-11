export class NodeBase {
  public numInputs: number = 1;
  public inputNodes: NodeBase[] = [];
  public output: number = 0;
  public index: number = 0;

  public addInputNode(node: NodeBase): void {
    this.inputNodes.push(node);
  }

  public process(inputs: number[]): number {
    return 1;
  }

  public update(): void {
    let inputs: number[] = [];
    for (let node of this.inputNodes) {
      inputs.push(node.output);
    }

    this.output = this.process(inputs);
  }
}

export class NodeBase2 extends NodeBase {
  constructor() {
    super();
    this.numInputs = 2;
  }
}
