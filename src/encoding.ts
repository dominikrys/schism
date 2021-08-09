export const encodeString = (str: string) => [
  str.length,
  ...str.split("").map((s) => s.charCodeAt(0)),
];
