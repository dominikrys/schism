import { emitter } from "../src/emitter";

let wasm: Uint8Array;

beforeEach(async () => {
  wasm = emitter();
});

test("Successfully loads the module", async () => {
  await WebAssembly.instantiate(wasm);
});

test("Add function can add numbers", async () => {
  const { instance } = await WebAssembly.instantiate(wasm);
  const run = instance.exports.run as CallableFunction;
  expect(run(5, 6)).toEqual(11);
});
