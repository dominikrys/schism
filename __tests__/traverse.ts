import traverse from "../src/traverse";

it("Traverses postorder", () => {
  const ast = {
    type: "foo",
    bar: {
      type: "baz",
    },
  };

  const visited: string[] = [];
  const visitor: Visitor = (node) => visited.push(node.type);
  traverse(ast, visitor);

  expect(visited).toEqual(["baz", "foo"]);
});

it("Traverses array properties", () => {
  const ast = {
    type: "foo",
    bar: [
      {
        type: "baz",
      },
      {
        type: "bar",
      },
    ],
  };

  const visited: string[] = [];
  const visitor: Visitor = (node) => visited.push(node.type);
  traverse(ast, visitor);

  expect(visited).toEqual(["baz", "bar", "foo"]);
});

it("Traverses array root", () => {
  const ast = [
    {
      type: "baz",
    },
    {
      type: "bar",
    },
  ];

  const visited: string[] = [];
  const visitor: Visitor = (node) => visited.push(node.type);
  traverse(ast, visitor);

  expect(visited).toEqual(["baz", "bar"]);
});
