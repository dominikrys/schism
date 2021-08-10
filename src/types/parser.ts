interface ProgramNode {
  type: string;
}

interface NumberLiteralNode extends ProgramNode {
  type: "numberLiteral"; // // TODO: can these types be made into an enum?
  value: number;
}

interface IdentifierNode extends ProgramNode {
  type: "identifier";
  value: string;
}

// TODO: add more expression types
type ExpressionNode = NumberLiteralNode;

interface PrintStatementNode extends ProgramNode {
  type: "printStatement";
  expression: ExpressionNode;
}

// TODO: add more statement types
type StatementNode = PrintStatementNode;

type Program = StatementNode[];

interface Parser {
  (tokens: Token[]): Program;
}

interface ParserStep<T extends ProgramNode> {
  (): T;
}
