import {emitter} from "../src/emitter";

describe("emitter", () => {
    test("Successfully loads the module",
    async () => {
        const wasm = emitter();
        await WebAssembly.instantiate(wasm)
    })
});
