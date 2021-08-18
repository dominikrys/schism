interface PrintFunction {
  (output: string | number): void;
}

interface ImportObject {
  print: PrintFunction;
  displayMemory: WebAssembly.Memory;
}

interface TickFunction {
  (): void;
}

interface Runtime {
  (src: string, importObject: ImportObject): Promise<TickFunction>;
}
