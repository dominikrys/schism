import { emitter } from "./emitter";
import { tokenize } from "./tokenizer";
import { parse } from "./parser";

export const compile: Compiler = (src) => {
  const tokens = tokenize(src);
  const ast = parse(tokens);
  const wasm = emitter(ast);
  return wasm;
};

export const runtime: Runtime = async (src, { print, displayMemory }) => {
  const wasm = compile(src);
  const importObject = {
    env: { print, 'memory': displayMemory },
  };
  const result: any = await WebAssembly.instantiate(wasm, importObject);
  return () => {
    result.instance.exports.run();
  };
};
