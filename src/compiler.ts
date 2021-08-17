import { emitter } from "./emitter";
import { tokenize } from "./tokenizer";
import { parse } from "./parser";

export const compile: Compiler = (src) => {
  const tokens = tokenize(src);
  const ast = parse(tokens);
  const wasm = emitter(ast);
  return wasm;
};

export const runtime: Runtime = async (src, env) => {
  const wasm = compile(src);
  const displayMemory = new WebAssembly.Memory({ initial: 1 });
  const result: any = await WebAssembly.instantiate(wasm, {
    env: { ...env, displayMemory },
  });
  return () => {
    result.instance.exports.run();
    // TODO: can these two lines below me removed?
    const displayBuffer = new Uint8Array(env.displayMemory.buffer);
    displayBuffer.set(new Uint8Array(displayMemory.buffer, 0, 10000));
  };
};
