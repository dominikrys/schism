export const encodeString = (str: string) => [
  str.length,
  ...str.split("").map((s) => s.charCodeAt(0)),
];

// TODO: use library instead
export const unsignedLEB128 = (n: number) => {
  const buffer = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) {
      byte |= 0x80;
    }
    buffer.push(byte);
  } while (n !== 0);
  return buffer;
};
