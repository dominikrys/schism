declare const CodeMirror: any;
declare const $: any;

import copy from "copy-to-clipboard";

import { runtime as interpreterRuntime } from "../src/interpreter";
import { runtime as compilerRuntime } from "../src/compiler";
import { keywords } from "../src/tokenizer";
import { Constants } from "../src/constants";
import { ParserError } from "../src/parser";

const compileButton = document.getElementById("compile");
const interpretButton = document.getElementById("interpret");
const codeArea = document.getElementById("code") as HTMLTextAreaElement;
const outputArea = document.getElementById("output") as HTMLTextAreaElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const shareUrlField = document.getElementById(
  "shareUrlField"
) as HTMLInputElement;
const copyUrlButton = document.getElementById(
  "copyUrlButton"
) as HTMLInputElement;

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
    { regex: /[-+\/*=<>!]+/, token: "operator" },
    { regex: /[a-z$][\w$]*/, token: "variable" },
  ],
});

const editor = CodeMirror.fromTextArea(codeArea, {
  mode: "simplemode",
  theme: "monokai",
  lineNumbers: true,
});

const logMessage = (message: string | number) => {
  outputArea.value = outputArea.value + message + "\n";
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
  const context = canvas.getContext("2d");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const imgData = context!.createImageData(
    Constants.CANVAS_DIM,
    Constants.CANVAS_DIM
  );
  for (let i = 0; i < Constants.CANVAS_DIM * Constants.CANVAS_DIM; i++) {
    imgData.data[i * 4] = displayBuffer[i]; // Red
    imgData.data[i * 4 + 1] = displayBuffer[i]; // Green
    imgData.data[i * 4 + 2] = displayBuffer[i]; // Blue
    imgData.data[i * 4 + 3] = 255; // Alpha
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const data = scaleImageData(imgData, 3, context!);
  context?.putImageData(data, 0, 0);
};

const run = async (runtime: Runtime) => {
  if (errorMarker) {
    errorMarker.clear();
  }

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

    outputArea.value = "";
    logMessage(`Executing ... `);

    tickFunction();
    const displayBuffer = new Uint8Array(displayMemory.buffer);
    updateCanvas(displayBuffer);

    interpretButton?.classList.remove("active");
    compileButton?.classList.remove("active");
  } catch (e) {
    logMessage((e as ParserError).message);
    markError((e as ParserError).token);
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
