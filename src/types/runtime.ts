interface PrintFunction {
  (output: string | number): void;
}

interface Environment {
  // TODO: fix this
  [key: string]: PrintFunction;
  print: PrintFunction;
  display: Uint8Array;
}

interface TickFunction {
  (): void;
}

interface Runtime {
  (src: string, environment: Environment): Promise<TickFunction>;
}
