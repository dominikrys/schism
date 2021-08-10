export class ParserError extends Error {
  token: Token;
  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }
}

export const parse: Parser = (tokens) => {
  const tokenIterator = tokens[Symbol.iterator]();
  let currentToken = tokenIterator.next().value;

  const eatToken = () => (currentToken = tokenIterator.next().value);

  const parseExpression: ParserStep<ExpressionNode> = () => {
    let node: ExpressionNode;
    switch (currentToken.type) {
      default: // TODO: remove this
      case "number":
        node = {
          type: "numberLiteral",
          value: Number(currentToken.value),
        };
        eatToken();
        return node;
    }
  };

  const parseStatement: ParserStep<StatementNode> = () => {
    // if (currentToken.type === "keyword") { // TOOD: uncomment this
      switch (currentToken.value) {
        default: // TODO: remove this
        case "print":
          eatToken();
          return {
            type: "printStatement",
            expression: parseExpression(),
          };
      }
    // } // TOOD: uncomment this
  };

  const nodes: StatementNode[] = [];
  while (currentToken) {
    nodes.push(parseStatement());
  }

  return nodes;
};
