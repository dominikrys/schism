import { parse } from "../src/parser";

it("Parses single statements", () => {
  const tokens: Token[] = [
    { type: "keyword", value: "print" },
    { type: "number", value: "22" },
  ];

  const ast = parse(tokens);
  expect(ast.length).toEqual(1);
});

it("Parses multiple similar statements", () => {
  const tokens: Token[] = [
    // print 22
    { type: "keyword", value: "print" },
    { type: "number", value: "22" },

    // print 22
    { type: "keyword", value: "print" },
    { type: "number", value: "22" },
  ];

  const ast = parse(tokens);
  expect(ast.length).toEqual(2);
});

it("Parses print statement with unary expression", () => {
  const tokens: Token[] = [
    {
      type: "keyword",
      value: "print",
    },
    {
      type: "number",
      value: "22",
    },
  ];

  const ast = parse(tokens);
  const node = ast[0];

  expect(node).toEqual({
    type: "printStatement",
    expression: { type: "numberLiteral", value: 22 },
  });
});
