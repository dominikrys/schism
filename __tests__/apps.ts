const apps = [
  { name: "Empty program", input: "", output: [] },
  { name: "Print statement", input: "print 8", output: [8] },
  { name: "Multiple statements", input: "print 8 print 24", output: [8, 24] },
];

test.skip("skip", () => {}); // eslint-disable-line

export default apps;
