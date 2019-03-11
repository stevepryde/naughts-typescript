import { NodeBase, NodeBase2 } from "./nodebase";

export class NodeInput extends NodeBase {
  public setValue(value: number): void {
    this.output = value;
  }
}

export class NodeNot extends NodeBase {
  public process(inputs: number[]): number {
    return !inputs[0] ? 1 : 0;
  }
}

export class NodeAnd extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] && inputs[1] ? 1 : 0;
  }
}

export class NodeOr extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] || inputs[1] ? 1 : 0;
  }
}

export class NodeXor extends NodeBase2 {
  public process(inputs: number[]): number {
    if (inputs[0] && inputs[1]) {
      return 0;
    }

    return inputs[0] || inputs[1] ? 1 : 0;
  }
}

export class NodeNand extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] && inputs[1] ? 0 : 1;
  }
}

export class NodeNor extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] || inputs[1] ? 0 : 1;
  }
}

export class NodeXnor extends NodeBase2 {
  public process(inputs: number[]): number {
    if (inputs[0] && inputs[1]) {
      return 1;
    }

    if (inputs[0] || inputs[1]) {
      return 0;
    }

    return 1;
  }
}

export class NodeOutput extends NodeBase {
  constructor() {
    super();
    this.numInputs = 10; // Some number greater than 9.
  }

  public process(inputs: number[]): number {
    let total: number = 0;
    for (let i of inputs) {
      total += i;
    }

    return total;
  }
}
