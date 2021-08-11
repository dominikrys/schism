const apps = [
  { name: "Empty program", input: "", expectedOutput: [] },
  { name: "Print statement", input: "print 8", expectedOutput: [8] },
  {
    name: "Multiple statements",
    input: "print 8 print 24",
    expectedOutput: [8, 24],
  },
];

const executeCode = async (
  code: string,
  runtime: Runtime,
  done: jest.DoneCallback
) => {
  const output: any[] = [];

  try {
    const tick = await runtime(code, {
      print: (d: any) => output.push(d),
    });
    tick();

    done();
    return { output };
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
    });
  });
};