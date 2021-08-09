export const encodeString = (str: string): number[] => [
  str.length,
  ...str.split("").map((s) => s.charCodeAt(0)),
];
