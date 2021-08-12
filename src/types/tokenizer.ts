// TODO: can this be made into an enum?
type TokenType =
  | "number"
  | "keyword"
  | "whitespace"
  | "parentheses"
  | "operator";

interface Token {
  type: TokenType;
  value: string;
  line?: number;
  char?: number;
}

interface Tokenizer {
  (input: string): Token[];
}

interface Matcher {
  (input: string, index: number): Token | null;
}
