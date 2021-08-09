import { emitter } from "../src/emitter";

test("Successfully loads the module", async () => {
  const wasm = emitter();
  await WebAssembly.instantiate(wasm);
});

test("Add function can add numbers", async () => {
  const wasm = emitter();
  const { instance } = await WebAssembly.instantiate(wasm);
  const run = instance.exports.run as CallableFunction;
  expect(run(5, 6)).toEqual(11);
});

// TODO: Can I add a setup
