import { runtime } from "../src/interpreter";
import apps from "./apps";

// Execute the app while recording print statements and pixel writes
const executeCode = async (code: string) => {
  const output: any[] = [];

  const tick = await runtime(code, {
    print: (d: any) => output.push(d),
  });
  tick();

  return { output };
};

apps.forEach((app) => {
  test(app.name, async () => {
    const result = await executeCode(app.input);
    expect(result.output).toEqual(app.output);
  });
});
