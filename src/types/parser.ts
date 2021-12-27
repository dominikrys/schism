interface ProgramNode {
  type: string;
}

interface NumberLiteralNode extends ProgramNode {
  type: "numberLiteral";
  value: number;
}

type Operator = "+" | "-" | "/" | "*" | "==" | ">" | "<" | "&&" | "||";

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

interface SetPixelStatementNode extends ProgramNode {
  type: "setpixelStatement";
  x: ExpressionNode;
  y: ExpressionNode;
  color: ExpressionNode;
}

type StatementNode =
  | PrintStatementNode
  | VariableDeclarationNode
  | VariableAssignmentNode
  | WhileStatementNode
  | SetPixelStatementNode;

type Program = StatementNode[];

interface Parser {
  (tokens: Token[]): Program;
}

interface ParserStep<T extends ProgramNode> {
  (): T;
}
