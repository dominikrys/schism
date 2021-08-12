export const keywords = ["print"];
export const operators = ["+", "-", "*", "/", "==", "<", ">", "&&"];

const escapeRegex = (text: string) =>
  text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

export class TokenizerError extends Error {
  index: number;
  constructor(message: string, index: number) {
    super(message);
    this.index = index;
  }
}

// Returns a token if the regex matches at the current index
const regexMatcher =
  (regex: string, type: TokenType): Matcher =>
  (input, index) => {
    const match = input.substring(index).match(regex);
    return match && { type, value: match[0] };
  };

const matchers = [
  regexMatcher("^[.0-9]+", "number"),
  regexMatcher(`^(${keywords.join("|")})`, "keyword"),
  regexMatcher("^\\s+", "whitespace"),
  regexMatcher(`^(${operators.map(escapeRegex).join("|")})`, "operator"),
  regexMatcher("^[()]{1}", "parentheses"),
];

const locationForIndex = (input: string, index: number) => ({
  char: index - input.lastIndexOf("\n", index) - 1,
  line: input.substring(0, index).split("\n").length - 1,
});

export const tokenize: Tokenizer = (input) => {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const matches = matchers.map((m) => m(input, index)).filter((f) => f);
    if (matches.length > 0 && matches[0]) {
      // Take the highest priority match (at first index)
      const match = matches[0];
      if (match.type !== "whitespace") {
        tokens.push({ ...match, ...locationForIndex(input, index) });
      }
      index += match.value.length;
    } else {
      throw new TokenizerError(
        `Unexpected token ${input.substring(index, index + 1)}`,
        index
      );
    }
  }
  return tokens;
};
