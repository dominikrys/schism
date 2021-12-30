# Schism

[![Build Status](https://img.shields.io/github/workflow/status/dominikrys/schism/Continuous%20Integration?style=flat-square)](https://github.com/dominikrys/schism/actions)
[![Website](https://img.shields.io/website?down_color=lightgrey&style=flat-square&down_message=offline&up_color=brightgreen&up_message=online&url=https%3A%2F%2Fdominikrys.com%2Fschism)](https://dominikrys.com/schism/)

Simple programming language that compiles to WebAssembly, written in TypeScript.

[**Try it out online!**](http://dominikrys.com/schism/)

Based off Colin Eberhardt's [blog post on writing a WebAssembly compiler](https://blog.scottlogic.com/2019/05/17/webassembly-compiler.html), rewritten using up-to-date versions of TypeScript and Node.

The aim of this project was to learn about compilers, TypeScript, and front-end development.

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

Host the website locally and watch for changes:

```bash
yarn start
```

Compile the website for production:

```bash
yarn bundle
```

### Pre-Commit Checks

For automated pre-commit/pre-push checks, a [Lefthook](https://github.com/evilmartians/lefthook) script is included. Run `lefthook install` to initialize it.

### Upgrading Libraries

```bash
yarn upgrade
```

## Code Structure

- `src`: Compiler source code
- `__tests__`: Compiler tests
- `docs`: Website source code (JavaScript is generated)

## TODO

- bundle website + deploy
- deploy from CI: https://medium.com/front-end-weekly/ci-cd-with-github-actions-to-deploy-on-github-pages-73e225f8f131
- add images to README + note to check website for language info
- make sure the website looks fine on mobile (don't make the container fluid?)
- make repo public
- add repo to pinned project
- get live reload working (without gulp)? nodemon? then blog post?x
