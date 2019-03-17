import { NodeBase, NodeBase2 } from "./nodebase";

export class NODE_INPUT extends NodeBase {
  public setValue(value: number): void {
    this.output = value;
  }
}

export class NODE_NOT extends NodeBase {
  public process(inputs: number[]): number {
    return !inputs[0] ? 1 : 0;
  }
}

export class NODE_AND extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] && inputs[1] ? 1 : 0;
  }
}

export class NODE_OR extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] || inputs[1] ? 1 : 0;
  }
}

export class NODE_XOR extends NodeBase2 {
  public process(inputs: number[]): number {
    if (inputs[0] && inputs[1]) {
      return 0;
    }

    return inputs[0] || inputs[1] ? 1 : 0;
  }
}

export class NODE_NAND extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] && inputs[1] ? 0 : 1;
  }
}

export class NODE_NOR extends NodeBase2 {
  public process(inputs: number[]): number {
    return inputs[0] || inputs[1] ? 0 : 1;
  }
}

export class NODE_XNOR extends NodeBase2 {
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

export class NODE_OUTPUT extends NodeBase {
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
