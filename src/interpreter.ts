import { tokenize } from "./tokenizer";
import { parse } from "./parser";
import { Constants } from "./constants";

const applyOperator = (operator: string, left: number, right: number) => {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "==":
      return left == right ? 1 : 0;
    case ">":
      return left > right ? 1 : 0;
    case "<":
      return left < right ? 1 : 0;
    case "&&":
      return left && right;
    case "||":
      return left || right;
  }
  throw Error(`Unknown binary operator ${operator}`);
};

export const runtime: Runtime =
  async (src, { print, displayMemory }) =>
  () => {
    const tokens = tokenize(src);
    const ast = parse(tokens);

    const symbols = new Map();

    const evaluateExpression = (expression: ExpressionNode): number => {
      switch (expression.type) {
        case "numberLiteral":
          return expression.value;
        case "binaryExpression":
          return applyOperator(
            expression.operator,
            evaluateExpression(expression.left),
            evaluateExpression(expression.right)
          );
        case "identifier":
          return symbols.get(expression.value);
      }
    };

    const executeStatements = (statements: StatementNode[]) => {
      statements.forEach((statement) => {
        switch (statement.type) {
          case "printStatement":
            print(evaluateExpression(statement.expression));
            break;
          case "variableDeclaration":
            symbols.set(
              statement.name,
              evaluateExpression(statement.initializer)
            );
            break;
          case "variableAssignment":
            symbols.set(statement.name, evaluateExpression(statement.value));
            break;
          case "whileStatement":
            while (evaluateExpression(statement.expression)) {
              executeStatements(statement.statements);
            }
            break;
          case "setpixelStatement": {
            const x = evaluateExpression(statement.x);
            const y = evaluateExpression(statement.y);
            const color = evaluateExpression(statement.color);
            const displayBuffer = new Uint8Array(displayMemory.buffer);
            displayBuffer[y * Constants.CANVAS_DIM + x] = color;
            break;
          }
        }
      });
    };

    executeStatements(ast);
  };
