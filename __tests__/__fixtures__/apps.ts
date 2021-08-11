export default [
  { name: "Empty program", input: "", expectedOutput: [] },
  { name: "Print statement", input: "print 8", expectedOutput: [8] },
  {
    name: "Multiple statements",
    input: "print 8 print 24",
    expectedOutput: [8, 24],
  },
];
