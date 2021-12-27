# Schism

[![Build Status](https://img.shields.io/github/workflow/status/dominikrys/schism/Continuous%20Integration?style=flat-square)](https://github.com/dominikrys/wasm-compiler/actions)
[![Website](https://img.shields.io/website?down_color=lightgrey&style=flat-square&down_message=offline&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fdominikrys.com%2Fschism)](https://dominikrys.com/schism/)

Simple Compile-to-WebAssembly Language written in TypeScript.

[**Try it out online!**](http://dominikrys.com/schism/)

Based heavily off Colin Eberhardt's [chasm](https://github.com/ColinEberhardt/chasm) language and [its corresponding blog post](https://blog.scottlogic.com/2019/05/17/webassembly-compiler.html), rewritten using up-to-date versions of TypeScript and Node.

The aim of this project was to learn about compilers and TypeScript.

## Pre-requisites

- [Node.js](https://nodejs.org/en/)
- [yarn](https://classic.yarnpkg.com/en/docs/install/)

## Build and Run Instructions

Build compiler:

```bash
yarn build
```

Run compiler tests:

```bash
yarn test
```

Compile the website for production:

```bash
yarn bundle
```

Compile the website for debugging:

```bash
yarn bundle-debug
```

Host the website locally from the `docs` or `docs-debug` directory:

```bash
(cd docs && python3 -m http.server)
```

### Pre-Commit Checks

For automated pre-commit/pre-push checks, a [Lefthook](https://github.com/evilmartians/lefthook) script is included. Run `lefthook install` to initialize it.

## Code Structure

- `src`: Compiler source code
- `__tests__`: Compiler tests
- `docs`: Website source code (JavaScript is generated)

## Upgrading Libraries

```bash
yarn upgrade
```

## TODO

- add info to readme and website on the language and syntax etc
- front-end:
  - update bootstrap
  - redo to my liking including styling
  - add name of compiler
  - add description - say when "run" is clicked, code is tokenised and parsed into an AST. Interpreter uses JS to execute the AST, and compiler uses AST to compile into WASM
  - mention limits of screen being 0-99
- add images to README
- make repo public
