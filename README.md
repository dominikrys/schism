# Schism

[![Build Status](https://img.shields.io/github/workflow/status/dominikrys/schism/Continuous%20Integration?style=flat-square)](https://github.com/dominikrys/wasm-compiler/actions)
[![Website](https://img.shields.io/website?down_color=lightgrey&style=flat-square&down_message=offline&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fdominikrys.com%2Fschism)](https://dominikrys.com/schism/)

Simple Compile-to-WebAssembly Language written in TypeScript.

[<ins>**Try it out online!**</ins>](http://dominikrys.com/schism/)

Based heavily off Colin Eberhardt's [chasm](https://github.com/ColinEberhardt/chasm) language and [its corresponding blog post](https://blog.scottlogic.com/2019/05/17/webassembly-compiler.html).

The aim of this project was to learn about compilers and TypeScript.

## Build and Run Instructions

Pre-requisites:

- [Node.js](https://nodejs.org/en/)
- [yarn](https://classic.yarnpkg.com/en/docs/install/)

To build:

```bash
yarn build
```

Run tests:

```bash
yarn test
```

Compile the website's TypeScript:

```bash
yarn bundle
```

Host the website locally from the `docs` directory:

```bash
python3 -m http.server
```

For automated pre-commit/pre-push checks, a [Lefthook](https://github.com/evilmartians/lefthook) script is included. Run `lefthook install` to initialize it.

## TODO

- finish tut
- go through again
- add info to readme on the language and syntax etc
- redo front-end. Add GitHub corner
- go through TODOs
- make repo public
