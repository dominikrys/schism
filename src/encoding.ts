export const numToIeee754Array = (n: number): Uint8Array => {
  const buf = Buffer.allocUnsafe(4);
  buf.writeFloatLE(n, 0);
  return Uint8Array.from(buf);
};

// Reference: https://webassembly.github.io/spec/core/binary/values.html#binary-name
export const strToBytes = (str: string): number[] => [
  str.length,
  ...str.split("").map((s) => s.charCodeAt(0)),
];
