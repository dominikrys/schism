interface PrintFunction {
  (output: string | number): void;
}

interface Environment {
  print: PrintFunction;
}

interface TickFunction {
  (): void;
}

interface Runtime {
  (src: string, environment: Environment): Promise<TickFunction>;
}
