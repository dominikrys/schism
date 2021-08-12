// Postorder AST traversal for the stack machine (operands then operator)
const traverse: Traverse = (nodes, visitor) => {
  nodes = Array.isArray(nodes) ? nodes : [nodes];
  nodes.forEach((node) => {
    (Object.keys(node) as (keyof ProgramNode)[]).forEach((prop) => {
      const value = node[prop];
      const valueAsArray: string[] = Array.isArray(value) ? value : [value];
      valueAsArray.forEach((childNode: any) => {
        if (typeof childNode.type === "string") {
          traverse(childNode, visitor);
        }
      });
    });
    visitor(node);
  });
};

export default traverse;
