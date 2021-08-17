interface App {
  name: string;
  input: string;
  expectedOutput: number[];
  expectedWrittenPixels?: [number, number][];
}

const apps: App[] = [
  { name: "Empty program", input: "", expectedOutput: [] },
  { name: "Print statement", input: "print 8", expectedOutput: [8] },
  {
    name: "Multiple statements",
    input: "print 8 print 24",
    expectedOutput: [8, 24],
  },
  { name: "Binary expressions", input: "print(2+ 4)", expectedOutput: [6] },
  {
    name: "Nested binary expressions",
    input: "print ((6-4)+10)",
    expectedOutput: [12],
  },
  {
    name: "Variable declaration",
    input: "var f = 22 print f",
    expectedOutput: [22],
  },
  {
    name: "Floating point variable declaration",
    input: "var f = 22.5 print f",
    expectedOutput: [22.5],
  },
  {
    name: "Variable assignment",
    input: "var f = 22 f = (f+1) print f",
    expectedOutput: [23],
  },
  {
    name: "Floating point variable assignment",
    input: "var f = 22.5 f = (f+1.5) print f",
    expectedOutput: [24],
  },
  {
    name: "While statements",
    input: "var f = 0 while (f < 5) f = (f + 1) print f endwhile",
    expectedOutput: [1, 2, 3, 4, 5],
  },
  {
    name: "setpixel statements",
    input: "setpixel 1 2 3",
    expectedOutput: [],
    expectedWrittenPixels: [[201, 3]],
  },
];

const executeCode = async (
  code: string,
  runtime: Runtime,
  done: jest.DoneCallback
) => {
  const output: any[] = [];
  const display = new Uint8Array(10000);
  const writtenPixels: any[] = [];

  try {
    const tick = await runtime(code, {
      print: (d: any) => output.push(d),
      display,
    });
    tick();

    // Find any pixels that have been written to
    display.forEach((value, index) => {
      if (value !== 0) {
        writtenPixels.push([index, value]);
      }
    });

    done();
    return { output, writtenPixels };
  } catch (e) {
    console.error(e);
    done.fail();
  }
};

export default (runtime: Runtime): void => {
  apps.forEach((app) => {
    test(app.name, async (done) => {
      const result = await executeCode(app.input, runtime, done);
      expect(result);
      expect(result?.output).toEqual(app.expectedOutput);
      if (app.expectedWrittenPixels) {
        expect(result?.writtenPixels).toEqual(app.expectedWrittenPixels);
      }
    });
  });
};
