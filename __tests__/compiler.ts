import { runtime } from "../src/compiler";
import apps from "./__fixtures__/apps";

const executeCode = async (code: string, done: jest.DoneCallback) => {
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

apps.forEach((app) => {
  test(app.name, async (done) => {
    const result = await executeCode(app.input, done);
    expect(result);
    expect(result?.output).toEqual(app.expectedOutput);
  });
});
