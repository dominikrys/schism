interface ProgramNode {
  type: string;
}

interface NumberLiteralNode extends ProgramNode {
  type: "numberLiteral"; // // TODO: can these types be made into an enum? Also all other strings
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

type ExpressionNode = NumberLiteralNode | BinaryExpresionNode | IdentifierNode;

interface PrintStatementNode extends ProgramNode {
  type: "printStatement";
  expression: ExpressionNode;
}

interface VariableDeclarationNode extends ProgramNode {
  type: "variableDeclaration";
  name: string;
  initializer: ExpressionNode;
}

interface VariableAssignmentNode extends ProgramNode {
  type: "variableAssignment";
  name: string;
  value: ExpressionNode;
}

interface WhileStatementNode extends ProgramNode {
  type: "whileStatement";
  expression: ExpressionNode;
  statements: StatementNode[];
}

type StatementNode =
  | PrintStatementNode
  | VariableDeclarationNode
  | VariableAssignmentNode
  | WhileStatementNode;

type Program = StatementNode[];

interface Parser {
  (tokens: Token[]): Program;
}

interface ParserStep<T extends ProgramNode> {
  (): T;
}
