interface ProgramNode {
  type: string;
}

interface NumberLiteralNode extends ProgramNode {
  type: "numberLiteral"; // // TODO: can these types be made into an enum?
  value: number;
}

type Operator = "+" | "-" | "/" | "*" | "==" | ">" | "<" | "&&";

interface BinaryExpresionNode extends ProgramNode {
  type: "binaryExpression";
  left: ExpressionNode;
  right: ExpressionNode;
  operator: Operator;
}

interface IdentifierNode extends ProgramNode {
  type: "identifier";
  value: string;
}

type ExpressionNode = NumberLiteralNode | BinaryExpresionNode;

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
