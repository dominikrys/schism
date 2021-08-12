interface Visitor {
  (node: ProgramNode): void;
}

interface Traverse {
  (nodes: ProgramNode[] | ProgramNode, visitor: Visitor): void;
}
