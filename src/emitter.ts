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
enum ValType {
  i32 = 0x7f,
  f32 = 0x7d,
}

// Reference: https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-BlockType
enum BlockType {
  void = 0x40,
}

// Reference: https://webassembly.github.io/spec/core/binary/instructions.html
enum Opcode {
  block = 0x02,
  loop = 0x03,
  br = 0x0c,
  br_if = 0x0d,
  end = 0x0b,
  call = 0x10,
  get_local = 0x20,
  set_local = 0x21,
  i32_store_8 = 0x3a,
  f32_const = 0x43,
  i32_eqz = 0x45,
  f32_eq = 0x5b,
  f32_lt = 0x5d,
  f32_gt = 0x5e,
  i32_and = 0x71,
  f32_add = 0x92,
  f32_sub = 0x93,
  f32_mul = 0x94,
  f32_div = 0x95,
  i32_trunc_f32_s = 0xa8,
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

// Reference: https://webassembly.github.io/spec/core/binary/modules.html#code-section
const encodeLocal = (count: number, type: ValType) => [
  ...leb.encodeULEB128(count),
  type,
];

// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
const createSection = (sectionType: Section, data: any[]) => [
  sectionType,
  ...encodeVector(data),
];

const codeFromAst = (ast: Program) => {
  const code: number[] = [];

  const symbols = new Map<string, number>();

  const localIndexForSymbol = (name: string): number => {
    if (!symbols.has(name)) {
      symbols.set(name, symbols.size);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return symbols.get(name)!;
  };

  const emitExpression = (node: ExpressionNode) =>
    traverse(node, (node: ProgramNode) => {
      switch (node.type) {
        case "numberLiteral":
          code.push(Opcode.f32_const);
          code.push(...numToIeee754Array((node as NumberLiteralNode).value));
          break;
        case "identifier":
          code.push(Opcode.get_local);
          code.push(
            ...leb.encodeULEB128(
              localIndexForSymbol((node as IdentifierNode).value)
            )
          );
          break;
        case "binaryExpression":
          code.push(binaryOpcode[(node as BinaryExpresionNode).operator]);
          break;
      }
    });

  const emitStatements = (statements: StatementNode[]) =>
    statements.forEach((statement) => {
      switch (statement.type) {
        case "printStatement":
          emitExpression(statement.expression);
          code.push(Opcode.call);
          code.push(...leb.encodeULEB128(0));
          break;
        case "variableDeclaration":
          emitExpression(statement.initializer);
          code.push(Opcode.set_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol(statement.name)));
          break;
        case "variableAssignment":
          emitExpression(statement.value);
          code.push(Opcode.set_local);
          code.push(...leb.encodeSLEB128(localIndexForSymbol(statement.name)));
          break;
        case "whileStatement":
          // Outer block
          code.push(Opcode.block);
          code.push(BlockType.void);

          // Inner loop
          code.push(Opcode.loop);
          code.push(BlockType.void);

          // Compute the while expression
          emitExpression(statement.expression);
          code.push(Opcode.i32_eqz);

          // br_if $label0
          code.push(Opcode.br_if);
          code.push(...leb.encodeSLEB128(1));

          // Nested logic
          emitStatements(statement.statements);

          // br $label1
          code.push(Opcode.br);
          code.push(...leb.encodeSLEB128(0));

          // End loop
          code.push(Opcode.end);

          // End block
          code.push(Opcode.end);
          break;
        case "setpixelStatement":
          // Compute and cache the parameters
          emitExpression(statement.x);
          code.push(Opcode.set_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("x")));

          emitExpression(statement.y);
          code.push(Opcode.set_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("y")));

          emitExpression(statement.color);
          code.push(Opcode.set_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("color")));

          // Compute the offset (x * 100) + y
          // TODO: work out how the stack machine works and where the 100 comes from
          code.push(Opcode.get_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("y")));
          code.push(Opcode.f32_const);
          code.push(...numToIeee754Array(100));
          code.push(Opcode.f32_mul);

          code.push(Opcode.get_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("x")));
          code.push(Opcode.f32_add);

          // Convert to an integer
          code.push(Opcode.i32_trunc_f32_s);

          // Fetch the color
          code.push(Opcode.get_local);
          code.push(...leb.encodeULEB128(localIndexForSymbol("color")));
          code.push(Opcode.i32_trunc_f32_s);

          // Write to memory
          code.push(Opcode.i32_store_8);
          code.push(...[0x00, 0x00]); // align and offset
          break;
      }
    });

  emitStatements(ast);

  return { code, localCount: symbols.size };
};

// Reference: https://webassembly.github.io/spec/core/binary/modules.html
export const emitter: Emitter = (ast: Program) => {
  // Function types contain vectors of parameters and a return type
  // TODO: maybe rename the two consts below into something better
  const voidVoidType = [functionType, emptyArray, emptyArray];

  const floatVoidType = [
    functionType,
    ...encodeVector([ValType.f32]) /* Parameter types */,
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

  const memoryImport = [
    ...strToBinaryName("env"),
    ...strToBinaryName("memory"),
    ExportType.mem,
    // Limits: https://webassembly.github.io/spec/core/binary/types.html#limits
    0x00,
    0x01,
  ];

  const importSection = createSection(
    Section.import,
    encodeVector([printFunctionImport, memoryImport])
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
  const { code, localCount } = codeFromAst(ast);
  const locals = localCount > 0 ? [encodeLocal(localCount, ValType.f32)] : [];

  const functionBody = encodeVector([
    ...encodeVector(locals),
    ...code,
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
