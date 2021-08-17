interface PrintFunction {
  (output: string | number): void;
}

// TODO: change to "ImportObject"
interface Environment {
  print: PrintFunction;
  displayMemory: WebAssembly.Memory;
}

interface TickFunction {
  (): void;
}

interface Runtime {
  (src: string, environment: Environment): Promise<TickFunction>;
}
