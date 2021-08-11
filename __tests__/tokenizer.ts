import { tokenize } from "../src/tokenizer";

it("Tokenizes single token", () => {
  const input = " print";
  const tokens = tokenize(input);
  expect(tokens.length).toBe(1);
  expect(tokens[0].type).toBe("keyword");
});

it("Tokenizes multiple tokens", () => {
  const input = " printprint";
  const tokens = tokenize(input);
  expect(tokens.length).toBe(2);
});

it("Consumes whitespace", () => {
  const input = " print    print";
  const tokens = tokenize(input);
  expect(tokens.length).toBe(2);
});

it("Throws error on unrecognized token", () => {
  expect(() => {
    const input = " print foo   print";
    tokenize(input);
  }).toThrowError("Unexpected token f");
});

it("Tokenizes multiple mixed tokens", () => {
  const input = " print 2";
  const tokens = tokenize(input);
  expect(tokens.length).toBe(2);
  expect(tokens[0].type).toBe("keyword");
  expect(tokens[1].type).toBe("number");
});
