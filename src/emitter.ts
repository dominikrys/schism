import { strToBinaryName, numToIeee754Array } from "./encoding";
import traverse from "./traverse";
import * as leb from "@thi.ng/leb128";

const flatten = (arr: any[]) => [].concat(...arr);

// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
enum Section {
  custom = 0,
  type = 1,
  import = 2,
  func = 3,
  table = 4,
  memory = 5,
  global = 6,
  export = 7,
  start = 8,
  element = 9,
  code = 10,
  data = 11,
}

// Reference: https://webassembly.github.io/spec/core/binary/types.html
enum Valtype {
  i32 = 0x7f,
  f32 = 0x7d,
}

// Reference: https://webassembly.github.io/spec/core/binary/instructions.html
enum Opcode {
  end = 0x0b,
  call = 0x10,
  get_local = 0x20,
  f32_const = 0x43,
  f32_eq = 0x5b,
  f32_lt = 0x5d,
  f32_gt = 0x5e,
  i32_and = 0x71,
  f32_add = 0x92,
  f32_sub = 0x93,
  f32_mul = 0x94,
  f32_div = 0x95,
}

const binaryOpcode = {
  "+": Opcode.f32_add,
  "-": Opcode.f32_sub,
  "*": Opcode.f32_mul,
  "/": Opcode.f32_div,
  "==": Opcode.f32_eq,
  ">": Opcode.f32_gt,
  "<": Opcode.f32_lt,
  "&&": Opcode.i32_and,
};

// Reference: http://webassembly.github.io/spec/core/binary/modules.html#export-section
enum ExportType {
  func = 0x00,
  table = 0x01,
  mem = 0x02,
  global = 0x03,
}

// Reference: http://webassembly.github.io/spec/core/binary/types.html#function-types
const functionType = 0x60;

const emptyArray = 0x0;

// Reference: https://webassembly.github.io/spec/core/binary/modules.html#binary-module
const magicModuleHeader = [0x00, 0x61, 0x73, 0x6d];
const moduleVersion = [0x01, 0x00, 0x00, 0x00];

// Reference: https://webassembly.github.io/spec/core/binary/conventions.html#vectors
const encodeVector = (data: any[]) => [
  ...leb.encodeULEB128(data.length),
  ...flatten(data),
];

// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
const createSection = (sectionType: Section, data: any[]) => [
  sectionType,
  ...encodeVector(data),
];

const codeFromAst = (ast: Program) => {
  const code: number[] = [];

  const emitExpression = (node: ExpressionNode) =>
    traverse(node, (node: ProgramNode) => {
      switch (node.type) {
        case "numberLiteral":
          code.push(Opcode.f32_const);
          code.push(...numToIeee754Array((node as NumberLiteralNode).value));
          break;
        case "binaryExpression":
          code.push(binaryOpcode[(node as BinaryExpresionNode).operator]);
          break;
      }
    });

  ast.forEach((statement) => {
    switch (statement.type) {
      case "printStatement":
        emitExpression(statement.expression);
        code.push(Opcode.call);
        code.push(...leb.encodeULEB128(0));
        break;
    }
  });

  return code;
};

// Reference: https://webassembly.github.io/spec/core/binary/modules.html
export const emitter: Emitter = (ast: Program) => {
  // Function types contain vectors of parameters and a return type
  // TODO: maybe rename the two consts below into something better
  const voidVoidType = [functionType, emptyArray, emptyArray];

  const floatVoidType = [
    functionType,
    ...encodeVector([Valtype.f32]) /* Parameter types */,
    emptyArray /* Return types */,
  ];

  // Vector of function types
  const typeSection = createSection(
    Section.type,
    encodeVector([voidVoidType, floatVoidType])
  );

  // Vector of type indices indicating the type of each function in the code section
  const funcSection = createSection(
    Section.func,
    encodeVector([0x00 /* Index of the type */])
  );

  // Vector of imported functions
  const printFunctionImport = [
    ...strToBinaryName("env"),
    ...strToBinaryName("print"),
    ExportType.func,
    0x01 /* Index of the type */,
  ];

  const importSection = createSection(
    Section.import,
    encodeVector([printFunctionImport])
  );

  // Vector of exported functions
  const exportSection = createSection(
    Section.export,
    encodeVector([
      [
        ...strToBinaryName("run"),
        ExportType.func,
        0x01 /* Index of the function */,
      ],
    ])
  );

  // Vectors of functions
  const functionBody = encodeVector([
    emptyArray /* Locals */,
    ...codeFromAst(ast),
    Opcode.end,
  ]);

  const codeSection = createSection(Section.code, encodeVector([functionBody]));

  return Uint8Array.from([
    ...magicModuleHeader,
    ...moduleVersion,
    ...typeSection,
    ...importSection,
    ...funcSection,
    ...exportSection,
    ...codeSection,
  ]);
};
