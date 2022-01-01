declare const CodeMirror: any;
declare const $: any;

import copy from "copy-to-clipboard";
import { marked } from "marked";

import { runtime as interpreterRuntime } from "../src/interpreter";
import { runtime as compilerRuntime } from "../src/compiler";
import { keywords } from "../src/tokenizer";
import { Constants } from "../src/constants";
import { ParserError } from "../src/parser";

const compileButton = document.getElementById("compile");
const interpretButton = document.getElementById("interpret");
const codeArea = document.getElementById("code") as HTMLTextAreaElement;
const consoleOutput = document.getElementById(
  "console-output"
) as HTMLTextAreaElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const shareUrlField = document.getElementById(
  "shareUrlField"
) as HTMLInputElement;
const copyUrlButton = document.getElementById(
  "copyUrlButton"
) as HTMLInputElement;
const description = document.getElementById("description") as HTMLDivElement;
const runSpinner = document.getElementById("run-spinner") as HTMLDivElement;

if (window.location.hash) {
  const codeBase64 = window.location.href.split("#")[1];
  const code = Buffer.from(codeBase64, "base64").toString("binary");
  codeArea.value = decodeURIComponent(code);
}

// Ref: https://stackoverflow.com/a/40772881/13749561
const scaleImageData = (
  imageData: ImageData,
  scale: number,
  ctx: CanvasRenderingContext2D
) => {
  const scaled = ctx.createImageData(
    imageData.width * scale,
    imageData.height * scale
  );
  const subLine = ctx.createImageData(scale, 1).data;
  for (let row = 0; row < imageData.height; row++) {
    for (let col = 0; col < imageData.width; col++) {
      const sourcePixel = imageData.data.subarray(
        (row * imageData.width + col) * 4,
        (row * imageData.width + col) * 4 + 4
      );
      for (let x = 0; x < scale; x++) subLine.set(sourcePixel, x * 4);
      for (let y = 0; y < scale; y++) {
        const destRow = row * scale + y;
        const destCol = col * scale;
        scaled.data.set(subLine, (destRow * scaled.width + destCol) * 4);
      }
    }
  }

  return scaled;
};

CodeMirror.defineSimpleMode("simplemode", {
  start: [
    {
      regex: new RegExp(`(${keywords.join("|")})`),
      token: "keyword",
    },
    {
      regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
      token: "number",
    },
    { regex: /[-+/*=<>!]+/, token: "operator" },
    { regex: /[a-z$][\w$]*/, token: "variable" },
  ],
});

const editor = CodeMirror.fromTextArea(codeArea, {
  mode: "simplemode",
  theme: "monokai",
  lineNumbers: true,
});

const logMessage = (message: string | number) => {
  consoleOutput.value = consoleOutput.value + message + "\n";
};

let errorMarker: any;

const markError = (token: Token) => {
  if (token.char) {
    errorMarker = editor.markText(
      { line: token.line, ch: token.char },
      { line: token.line, ch: token.char + token.value.length },
      { className: "error" }
    );
  }
};

const updateCanvas = (displayBuffer: Uint8Array) => {
  const ctx = canvas.getContext("2d");

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const imgData = ctx!.createImageData(
    Constants.CANVAS_DIM,
    Constants.CANVAS_DIM
  );
  for (let i = 0; i < Constants.CANVAS_DIM * Constants.CANVAS_DIM; i++) {
    imgData.data[i * 4] = displayBuffer[i]; // Red
    imgData.data[i * 4 + 1] = displayBuffer[i]; // Green
    imgData.data[i * 4 + 2] = displayBuffer[i]; // Blue
    imgData.data[i * 4 + 3] = 255; // Alpha
  }

  const scaleFactor = canvas.width / 100;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const data = scaleImageData(imgData, scaleFactor, ctx!);
  ctx?.putImageData(data, 0, 0);
};

const run = async (runtime: Runtime) => {
  if (errorMarker) {
    errorMarker.clear();
  }

  consoleOutput.value = "";

  runSpinner.hidden = false;

  const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  };

  await sleep(10);

  let tickFunction: TickFunction;

  try {
    const displayMemory = new WebAssembly.Memory({ initial: 1 });
    tickFunction = await runtime(editor.getValue(), {
      print: logMessage,
      displayMemory,
    });

    tickFunction();
    const displayBuffer = new Uint8Array(displayMemory.buffer);
    updateCanvas(displayBuffer);

    interpretButton?.classList.remove("active");
    compileButton?.classList.remove("active");
  } catch (e) {
    logMessage((e as ParserError).message);
    markError((e as ParserError).token);
  } finally {
    runSpinner.hidden = true;
  }
};

interpretButton?.addEventListener("click", async () => {
  interpretButton.classList.add("active");
  compileButton?.classList.remove("active");
  await run(interpreterRuntime);
});

compileButton?.addEventListener("click", async () => {
  compileButton.classList.add("active");
  interpretButton?.classList.remove("active");
  await run(compilerRuntime);
});

$("#shareModal").on("show.bs.modal", () => {
  const baseUrl = window.location.href.split("#")[0];
  const code = editor.getValue();
  const codeBase64 = Buffer.from(code, "binary").toString("base64");
  const encodedCodeBase64 = encodeURIComponent(codeBase64);
  shareUrlField.value = `${baseUrl}#${encodedCodeBase64}`;

  shareUrlField.select();
});

copyUrlButton.addEventListener("click", () => copy(shareUrlField.value));

const descriptionText = `

#### Schism

###### Compile-To-WebAssembly Language in TypeScript

When the code is run, it's first tokenised and parsed into an Abstract Syntax Tree. Then, it's either executed using the JavaScript runtime or compiled and executed using the WebAssembly runtime.

##### Language

Please refer to the example code to get started. As a summary of the main language features:

- Print a variable's value: \`print <variable>\`.

- Assign a value to a variable: \`var <name> = <value>\`.

- Set a pixel in the canvas: \`setpixel (<x>, <y>, <colour>)\`. \`x\` and \`y\` are in the range 1-100 inclusive and \`colour\` is a value in the range 0-255 inclusive (where 0 is black and 255 is white).

- While loop: \`while (<condition>) <code> endwhile\`

- Operators: \`+\`, \`-\`, \`*\`, \`/\`, \`==\`, \`<\`, \`>\`, \`&&\`, \`||\`.

- The language can parse scientific notation, floating points, and negative values.
`;

description.innerHTML = marked.parse(descriptionText);
