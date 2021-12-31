(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var copy_to_clipboard_1 = __importDefault(require("copy-to-clipboard"));
var marked_1 = require("marked");
var interpreter_1 = require("../src/interpreter");
var compiler_1 = require("../src/compiler");
var tokenizer_1 = require("../src/tokenizer");
var constants_1 = require("../src/constants");
var compileButton = document.getElementById("compile");
var interpretButton = document.getElementById("interpret");
var codeArea = document.getElementById("code");
var consoleOutput = document.getElementById("console-output");
var canvas = document.getElementById("canvas");
var shareUrlField = document.getElementById("shareUrlField");
var copyUrlButton = document.getElementById("copyUrlButton");
var description = document.getElementById("description");
var runSpinner = document.getElementById("run-spinner");
if (window.location.hash) {
    var codeBase64 = window.location.href.split("#")[1];
    var code = Buffer.from(codeBase64, "base64").toString("binary");
    codeArea.value = decodeURIComponent(code);
}
// Ref: https://stackoverflow.com/a/40772881/13749561
var scaleImageData = function (imageData, scale, ctx) {
    var scaled = ctx.createImageData(imageData.width * scale, imageData.height * scale);
    var subLine = ctx.createImageData(scale, 1).data;
    for (var row = 0; row < imageData.height; row++) {
        for (var col = 0; col < imageData.width; col++) {
            var sourcePixel = imageData.data.subarray((row * imageData.width + col) * 4, (row * imageData.width + col) * 4 + 4);
            for (var x = 0; x < scale; x++)
                subLine.set(sourcePixel, x * 4);
            for (var y = 0; y < scale; y++) {
                var destRow = row * scale + y;
                var destCol = col * scale;
                scaled.data.set(subLine, (destRow * scaled.width + destCol) * 4);
            }
        }
    }
    return scaled;
};
CodeMirror.defineSimpleMode("simplemode", {
    start: [
        {
            regex: new RegExp("(".concat(tokenizer_1.keywords.join("|"), ")")),
            token: "keyword",
        },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number",
        },
        { regex: /[-+/*=<>!]+/, token: "operator" },
        { regex: /[a-z$][\w$]*/, token: "variable" },
    ],
});
var editor = CodeMirror.fromTextArea(codeArea, {
    mode: "simplemode",
    theme: "monokai",
    lineNumbers: true,
});
var logMessage = function (message) {
    consoleOutput.value = consoleOutput.value + message + "\n";
};
var errorMarker;
var markError = function (token) {
    if (token.char) {
        errorMarker = editor.markText({ line: token.line, ch: token.char }, { line: token.line, ch: token.char + token.value.length }, { className: "error" });
    }
};
var updateCanvas = function (displayBuffer) {
    var ctx = canvas.getContext("2d");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    var imgData = ctx.createImageData(constants_1.Constants.CANVAS_DIM, constants_1.Constants.CANVAS_DIM);
    for (var i = 0; i < constants_1.Constants.CANVAS_DIM * constants_1.Constants.CANVAS_DIM; i++) {
        imgData.data[i * 4] = displayBuffer[i]; // Red
        imgData.data[i * 4 + 1] = displayBuffer[i]; // Green
        imgData.data[i * 4 + 2] = displayBuffer[i]; // Blue
        imgData.data[i * 4 + 3] = 255; // Alpha
    }
    var scaleFactor = canvas.width / 100;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    var data = scaleImageData(imgData, scaleFactor, ctx);
    ctx === null || ctx === void 0 ? void 0 : ctx.putImageData(data, 0, 0);
};
var run = function (runtime) { return __awaiter(void 0, void 0, void 0, function () {
    var sleep, tickFunction, displayMemory, displayBuffer, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (errorMarker) {
                    errorMarker.clear();
                }
                consoleOutput.value = "";
                runSpinner.hidden = false;
                sleep = function (ms) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, sleep(10)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, 5, 6]);
                displayMemory = new WebAssembly.Memory({ initial: 1 });
                return [4 /*yield*/, runtime(editor.getValue(), {
                        print: logMessage,
                        displayMemory: displayMemory,
                    })];
            case 3:
                tickFunction = _a.sent();
                tickFunction();
                displayBuffer = new Uint8Array(displayMemory.buffer);
                updateCanvas(displayBuffer);
                interpretButton === null || interpretButton === void 0 ? void 0 : interpretButton.classList.remove("active");
                compileButton === null || compileButton === void 0 ? void 0 : compileButton.classList.remove("active");
                return [3 /*break*/, 6];
            case 4:
                e_1 = _a.sent();
                logMessage(e_1.message);
                markError(e_1.token);
                return [3 /*break*/, 6];
            case 5:
                runSpinner.hidden = true;
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); };
interpretButton === null || interpretButton === void 0 ? void 0 : interpretButton.addEventListener("click", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                interpretButton.classList.add("active");
                compileButton === null || compileButton === void 0 ? void 0 : compileButton.classList.remove("active");
                return [4 /*yield*/, run(interpreter_1.runtime)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
compileButton === null || compileButton === void 0 ? void 0 : compileButton.addEventListener("click", function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                compileButton.classList.add("active");
                interpretButton === null || interpretButton === void 0 ? void 0 : interpretButton.classList.remove("active");
                return [4 /*yield*/, run(compiler_1.runtime)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
$("#shareModal").on("show.bs.modal", function () {
    var baseUrl = window.location.href.split("#")[0];
    var code = editor.getValue();
    var codeBase64 = Buffer.from(code, "binary").toString("base64");
    var encodedCodeBase64 = encodeURIComponent(codeBase64);
    shareUrlField.value = "".concat(baseUrl, "#").concat(encodedCodeBase64);
    shareUrlField.select();
});
copyUrlButton.addEventListener("click", function () { return (0, copy_to_clipboard_1.default)(shareUrlField.value); });
var descriptionText = "\n\n#### Schism\n\n###### Compile-To-WebAssembly Language in TypeScript\n\nWhen the code is run, it's first tokenised and parsed into an Abstract Syntax Tree. Then, it's either executed using the JavaScript runtime, or compiled and executed using the WebAssembly runtime.\n\n##### Language\n\nPlease refer to the example code to get started. As a summary of the main language features:\n\n- Print a variable's value: `print <variable>`.\n\n- Assign a value to a variable: `var <name> = <value>`.\n\n- Set a pixel in the canvas: `setpixel (<x>, <y>, <colour>)`. `x` and `y` are in the range 1-100 inclusive and `colour` is a value in the range 0-255 inclusive (where 0 is black and 255 is white).\n\n- While loop: `while (<condition>) <code> endwhile`\n\n- Operators: `+`, `-`, `*`, `/`, `==`, `<`, `>`, `&&`, `||`.\n\n- The language can parse scientific notation, floating points, and negative values.\n";
description.innerHTML = marked_1.marked.parse(descriptionText);

}).call(this)}).call(this,require("buffer").Buffer)

},{"../src/compiler":23,"../src/constants":24,"../src/interpreter":27,"../src/tokenizer":29,"buffer":17,"copy-to-clipboard":18,"marked":20}],2:[function(require,module,exports){
(function (process,global){(function (){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isDeref = (x) => x != null && typeof x["deref"] === "function";
const deref = (x) => (isDeref(x) ? x.deref() : x);

exports.LogLevel = void 0;
(function (LogLevel) {
    LogLevel[LogLevel["FINE"] = 0] = "FINE";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["SEVERE"] = 4] = "SEVERE";
    LogLevel[LogLevel["NONE"] = 5] = "NONE";
})(exports.LogLevel || (exports.LogLevel = {}));

exports.GLType = void 0;
(function (GLType) {
    GLType[GLType["I8"] = 5120] = "I8";
    GLType[GLType["U8"] = 5121] = "U8";
    GLType[GLType["I16"] = 5122] = "I16";
    GLType[GLType["U16"] = 5123] = "U16";
    GLType[GLType["I32"] = 5124] = "I32";
    GLType[GLType["U32"] = 5125] = "U32";
    GLType[GLType["F32"] = 5126] = "F32";
})(exports.GLType || (exports.GLType = {}));
const GL2TYPE = {
    [exports.GLType.I8]: "i8",
    [exports.GLType.U8]: "u8",
    [exports.GLType.I16]: "i16",
    [exports.GLType.U16]: "u16",
    [exports.GLType.I32]: "i32",
    [exports.GLType.U32]: "u32",
    [exports.GLType.F32]: "f32",
};
const TYPE2GL = {
    i8: exports.GLType.I8,
    u8: exports.GLType.U8,
    u8c: exports.GLType.U8,
    i16: exports.GLType.I16,
    u16: exports.GLType.U16,
    i32: exports.GLType.I32,
    u32: exports.GLType.U32,
    f32: exports.GLType.F32,
    f64: undefined,
};
const SIZEOF = {
    u8: 1,
    u8c: 1,
    i8: 1,
    u16: 2,
    i16: 2,
    u32: 4,
    i32: 4,
    f32: 4,
    f64: 8,
};
const FLOAT_ARRAY_CTORS = {
    f32: Float32Array,
    f64: Float64Array,
};
const INT_ARRAY_CTORS = {
    i8: Int8Array,
    i16: Int16Array,
    i32: Int32Array,
};
const UINT_ARRAY_CTORS = {
    u8: Uint8Array,
    u8c: Uint8ClampedArray,
    u16: Uint16Array,
    u32: Uint32Array,
};
const TYPEDARRAY_CTORS = Object.assign(Object.assign(Object.assign({}, FLOAT_ARRAY_CTORS), INT_ARRAY_CTORS), UINT_ARRAY_CTORS);
const asNativeType = (type) => {
    const t = GL2TYPE[type];
    return t !== undefined ? t : type;
};
const asGLType = (type) => {
    const t = TYPE2GL[type];
    return t !== undefined ? t : type;
};
const sizeOf = (type) => SIZEOF[asNativeType(type)];
function typedArray(type, ...xs) {
    return new TYPEDARRAY_CTORS[asNativeType(type)](...xs);
}
const typedArrayType = (x) => {
    if (Array.isArray(x))
        return "f64";
    for (let id in TYPEDARRAY_CTORS) {
        if (x instanceof TYPEDARRAY_CTORS[id])
            return id;
    }
    return "f64";
};
const uintTypeForSize = (x) => x <= 0x100 ? "u8" : x <= 0x10000 ? "u16" : "u32";
const intTypeForSize = (x) => x >= -0x80 && x < 0x80 ? "i8" : x >= -0x8000 && x < 0x8000 ? "i16" : "i32";
const uintTypeForBits = (x) => x > 16 ? "u32" : x > 8 ? "u16" : "u8";
const intTypeForBits = (x) => x > 16 ? "i32" : x > 8 ? "i16" : "i8";

const DEFAULT_EPS = 1e-6;
const SEMAPHORE = Symbol();
const NO_OP = () => { };
const EVENT_ALL = "*";
const EVENT_ENABLE = "enable";
const EVENT_DISABLE = "disable";

const assert = (() => {
    try {
        return (process.env.NODE_ENV !== "production" ||
            process.env.UMBRELLA_ASSERTS === "1");
    }
    catch (e) { }
    return false;
})()
    ? (test, msg = "assertion failed") => {
        if ((typeof test === "function" && !test()) || !test) {
            throw new Error(typeof msg === "function" ? msg() : msg);
        }
    }
    : NO_OP;

const exposeGlobal = (id, value, always = false) => {
    const glob = typeof global !== "undefined"
        ? global
        : typeof window !== "undefined"
            ? window
            : undefined;
    if (glob &&
        (always ||
            (() => {
                try {
                    return (process.env.NODE_ENV !== "production" ||
                        process.env.UMBRELLA_GLOBALS === "1");
                }
                catch (e) { }
                return false;
            })())) {
        glob[id] = value;
    }
};

const NULL_LOGGER = Object.freeze({
    level: exports.LogLevel.NONE,
    fine() { },
    debug() { },
    info() { },
    warn() { },
    severe() { },
});
class ConsoleLogger {
    constructor(id, level = exports.LogLevel.FINE) {
        this.id = id;
        this.level = level;
    }
    fine(...args) {
        this.level <= exports.LogLevel.FINE && this.log("FINE", args);
    }
    debug(...args) {
        this.level <= exports.LogLevel.DEBUG && this.log("DEBUG", args);
    }
    info(...args) {
        this.level <= exports.LogLevel.INFO && this.log("INFO", args);
    }
    warn(...args) {
        this.level <= exports.LogLevel.WARN && this.log("WARN", args);
    }
    severe(...args) {
        this.level <= exports.LogLevel.SEVERE && this.log("SEVERE", args);
    }
    log(level, args) {
        console.log(`[${level}] ${this.id}:`, ...args);
    }
}

const mixin = (behaviour, sharedBehaviour = {}) => {
    const instanceKeys = Reflect.ownKeys(behaviour);
    const sharedKeys = Reflect.ownKeys(sharedBehaviour);
    const typeTag = Symbol("isa");
    function _mixin(clazz) {
        for (let key of instanceKeys) {
            const existing = Object.getOwnPropertyDescriptor(clazz.prototype, key);
            if (!existing || existing.configurable) {
                Object.defineProperty(clazz.prototype, key, {
                    value: behaviour[key],
                    writable: true,
                });
            }
            else {
                console.log(`not patching: ${clazz.name}.${key.toString()}`);
            }
        }
        Object.defineProperty(clazz.prototype, typeTag, { value: true });
        return clazz;
    }
    for (let key of sharedKeys) {
        Object.defineProperty(_mixin, key, {
            value: sharedBehaviour[key],
            enumerable: sharedBehaviour.propertyIsEnumerable(key),
        });
    }
    Object.defineProperty(_mixin, Symbol.hasInstance, {
        value: (x) => !!x[typeTag],
    });
    return _mixin;
};

const configurable = (state) => function (_, __, descriptor) {
    descriptor.configurable = state;
};

const deprecated = (msg, log = console.log) => function (target, prop, descriptor) {
    const signature = `${target.constructor.name}#${prop.toString()}`;
    const fn = descriptor.value;
    assert(typeof fn === "function", `${signature} is not a function`);
    descriptor.value = function () {
        log(`DEPRECATED ${signature}: ${msg || "will be removed soon"}`);
        return fn.apply(this, arguments);
    };
    return descriptor;
};

const nomixin = (_, __, descriptor) => {
    descriptor.configurable = false;
};

const sealed = (constructor) => {
    Object.seal(constructor);
    Object.seal(constructor.prototype);
};

const IEnableMixin = mixin({
    _enabled: true,
    isEnabled() {
        return this._enabled;
    },
    enable() {
        $enable(this, true, EVENT_ENABLE);
    },
    disable() {
        $enable(this, false, EVENT_DISABLE);
    },
    toggle() {
        this._enabled ? this.disable() : this.enable();
        return this._enabled;
    },
});
const $enable = (target, state, id) => {
    target._enabled = state;
    if (target.notify) {
        target.notify({ id, target });
    }
};

const inotify_dispatch = (listeners, e) => {
    if (!listeners)
        return;
    for (let i = 0, n = listeners.length, l; i < n; i++) {
        l = listeners[i];
        l[0].call(l[1], e);
        if (e.canceled) {
            return;
        }
    }
};
const INotifyMixin = mixin({
    addListener(id, fn, scope) {
        let l = (this._listeners = this._listeners || {})[id];
        !l && (l = this._listeners[id] = []);
        if (this.__listener(l, fn, scope) === -1) {
            l.push([fn, scope]);
            return true;
        }
        return false;
    },
    removeListener(id, fn, scope) {
        let listeners;
        if (!(listeners = this._listeners))
            return false;
        const l = listeners[id];
        if (l) {
            const idx = this.__listener(l, fn, scope);
            if (idx !== -1) {
                l.splice(idx, 1);
                !l.length && delete listeners[id];
                return true;
            }
        }
        return false;
    },
    notify(e) {
        let listeners;
        if (!(listeners = this._listeners))
            return false;
        e.target === undefined && (e.target = this);
        inotify_dispatch(listeners[e.id], e);
        inotify_dispatch(listeners[EVENT_ALL], e);
    },
    __listener(listeners, f, scope) {
        let i = listeners.length;
        while (--i >= 0) {
            const l = listeners[i];
            if (l[0] === f && l[1] === scope) {
                break;
            }
        }
        return i;
    },
});

const iterable = (prop) => mixin({
    *[Symbol.iterator]() {
        yield* this[prop];
    },
});

const IWatchMixin = mixin({
    addWatch(id, fn) {
        this._watches = this._watches || {};
        if (this._watches[id]) {
            return false;
        }
        this._watches[id] = fn;
        return true;
    },
    removeWatch(id) {
        if (!this._watches)
            return;
        if (this._watches[id]) {
            delete this._watches[id];
            return true;
        }
        return false;
    },
    notifyWatches(oldState, newState) {
        if (!this._watches)
            return;
        const w = this._watches;
        for (let id in w) {
            w[id](id, oldState, newState);
        }
    },
});

exports.ConsoleLogger = ConsoleLogger;
exports.DEFAULT_EPS = DEFAULT_EPS;
exports.EVENT_ALL = EVENT_ALL;
exports.EVENT_DISABLE = EVENT_DISABLE;
exports.EVENT_ENABLE = EVENT_ENABLE;
exports.FLOAT_ARRAY_CTORS = FLOAT_ARRAY_CTORS;
exports.GL2TYPE = GL2TYPE;
exports.IEnableMixin = IEnableMixin;
exports.INT_ARRAY_CTORS = INT_ARRAY_CTORS;
exports.INotifyMixin = INotifyMixin;
exports.IWatchMixin = IWatchMixin;
exports.NO_OP = NO_OP;
exports.NULL_LOGGER = NULL_LOGGER;
exports.SEMAPHORE = SEMAPHORE;
exports.SIZEOF = SIZEOF;
exports.TYPE2GL = TYPE2GL;
exports.TYPEDARRAY_CTORS = TYPEDARRAY_CTORS;
exports.UINT_ARRAY_CTORS = UINT_ARRAY_CTORS;
exports.asGLType = asGLType;
exports.asNativeType = asNativeType;
exports.assert = assert;
exports.configurable = configurable;
exports.deprecated = deprecated;
exports.deref = deref;
exports.exposeGlobal = exposeGlobal;
exports.inotify_dispatch = inotify_dispatch;
exports.intTypeForBits = intTypeForBits;
exports.intTypeForSize = intTypeForSize;
exports.isDeref = isDeref;
exports.iterable = iterable;
exports.mixin = mixin;
exports.nomixin = nomixin;
exports.sealed = sealed;
exports.sizeOf = sizeOf;
exports.typedArray = typedArray;
exports.typedArrayType = typedArrayType;
exports.uintTypeForBits = uintTypeForBits;
exports.uintTypeForSize = uintTypeForSize;

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":21}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var compare = require('@thi.ng/compare');
var equiv = require('@thi.ng/equiv');
var checks = require('@thi.ng/checks');
var errors = require('@thi.ng/errors');
var api = require('@thi.ng/api');
var random = require('@thi.ng/random');

const binarySearch = (buf, x, key = (x) => x, cmp = compare.compare, low = 0, high = buf.length - 1) => {
    const kx = key(x);
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const c = cmp(key(buf[mid]), kx);
        if (c < 0) {
            low = mid + 1;
        }
        else if (c > 0) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -low - 1;
};
const binarySearchNumeric = (buf, x, cmp = compare.compareNumAsc, low = 0, high = buf.length - 1) => {
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const c = cmp(buf[mid], x);
        if (c < 0) {
            low = mid + 1;
        }
        else if (c > 0) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -low - 1;
};
const binarySearch2 = (buf, x) => {
    let idx = buf[1] <= x ? 1 : 0;
    return buf[idx] === x ? idx : buf[0] < x ? -idx - 2 : -1;
};
const binarySearch4 = (buf, x) => {
    let idx = buf[2] <= x ? 2 : 0;
    idx |= buf[idx + 1] <= x ? 1 : 0;
    return buf[idx] === x ? idx : buf[0] < x ? -idx - 2 : -1;
};
const binarySearch8 = (buf, x) => {
    let idx = buf[4] <= x ? 4 : 0;
    idx |= buf[idx + 2] <= x ? 2 : 0;
    idx |= buf[idx + 1] <= x ? 1 : 0;
    return buf[idx] === x ? idx : buf[0] < x ? -idx - 2 : -1;
};
const binarySearch16 = (buf, x) => {
    let idx = buf[8] <= x ? 8 : 0;
    idx |= buf[idx + 4] <= x ? 4 : 0;
    idx |= buf[idx + 2] <= x ? 2 : 0;
    idx |= buf[idx + 1] <= x ? 1 : 0;
    return buf[idx] === x ? idx : buf[0] < x ? -idx - 2 : -1;
};
const binarySearch32 = (buf, x) => {
    let idx = buf[16] <= x ? 16 : 0;
    idx |= buf[idx + 4] <= x ? 8 : 0;
    idx |= buf[idx + 4] <= x ? 4 : 0;
    idx |= buf[idx + 2] <= x ? 2 : 0;
    idx |= buf[idx + 1] <= x ? 1 : 0;
    return buf[idx] === x ? idx : buf[0] < x ? -idx - 2 : -1;
};
const bsLT = (i) => (i < 0 ? -i - 2 : i - 1);
const bsLE = (i) => (i < 0 ? -i - 2 : i);
const bsGT = (i, n) => ((i = i < 0 ? -i - 1 : i + 1), i < n ? i : -1);
const bsGE = (i, n) => ((i = i < 0 ? -i - 1 : i), i < n ? i : -1);
const bsEQ = (i) => (i < 0 ? -1 : i);

const bisect = (src, i = src.length >>> 1) => [
    src.slice(0, i),
    src.slice(i),
];
const bisectWith = (src, pred) => {
    const i = src.findIndex(pred);
    return i >= 0 ? bisect(src, i) : [src, []];
};

const endsWith = (buf, needle, equiv$1 = equiv.equiv) => {
    let i = buf.length;
    let j = needle.length;
    if (i < j)
        return false;
    while ((--i, --j >= 0 && equiv$1(buf[i], needle[j]))) { }
    return j < 0;
};

const ensureIterable = (x) => {
    (x == null || !x[Symbol.iterator]) &&
        errors.illegalArgs(`value is not iterable: ${x}`);
    return x;
};

const ensureArray = (x) => checks.isArray(x) ? x : [...ensureIterable(x)];
const ensureArrayLike = (x) => checks.isArrayLike(x) ? x : [...ensureIterable(x)];

const find = (buf, x, equiv$1 = equiv.equiv) => {
    const i = findIndex(buf, x, equiv$1);
    return i !== -1 ? buf[i] : undefined;
};
const findIndex = (buf, x, equiv$1 = equiv.equiv) => {
    for (let i = buf.length; --i >= 0;) {
        if (equiv$1(x, buf[i]))
            return i;
    }
    return -1;
};

const fillRange = (buf, index = 0, start = 0, end = buf.length, step = end > start ? 1 : -1) => {
    if (step > 0) {
        for (; start < end; start += step)
            buf[index++] = start;
    }
    else {
        for (; start > end; start += step)
            buf[index++] = start;
    }
    return buf;
};

const fuzzyMatch = (domain, query, equiv$1 = equiv.equiv) => {
    const nd = domain.length;
    const nq = query.length;
    if (nq > nd) {
        return false;
    }
    if (nq === nd) {
        return equiv$1(query, domain);
    }
    next: for (let i = 0, j = 0; i < nq; i++) {
        const q = query[i];
        while (j < nd) {
            if (equiv$1(domain[j++], q)) {
                continue next;
            }
        }
        return false;
    }
    return true;
};

const isSorted = (arr, cmp = compare.compare, start = 0, end = arr.length) => {
    let prev = arr[start];
    while (++start < end) {
        const curr = arr[start];
        if (cmp(prev, curr) > 0)
            return false;
        prev = curr;
    }
    return true;
};

const insert = (buf, x, i, k = Infinity) => i < 0 || i >= k || k < 1 ? buf : insertUnsafe(buf, x, i, k);
const insertUnsafe = (buf, x, i, k = Infinity) => {
    let j = buf.length < k ? buf.length + 1 : k;
    for (; --j > i;)
        buf[j] = buf[j - 1];
    buf[i] = x;
    return buf;
};

const into = (dest, src, max = Infinity) => {
    for (let x of src) {
        if (--max < 0)
            break;
        dest.push(x);
    }
    return dest;
};

function* arrayIterator(buf, start = 0, end) {
    if (!buf)
        return;
    start = start;
    end === undefined && (end = buf.length);
    const step = start <= end ? 1 : -1;
    for (; start !== end; start += step) {
        yield buf[start];
    }
}

const eqStrict = (a, b) => a === b;
const levenshtein = (a, b, maxDist = Infinity, equiv = eqStrict) => {
    if (a === b) {
        return 0;
    }
    if (a.length > b.length) {
        const tmp = a;
        a = b;
        b = tmp;
    }
    let la = a.length;
    let lb = b.length;
    while (la > 0 && equiv(a[~-la], b[~-lb])) {
        la--;
        lb--;
    }
    let offset = 0;
    while (offset < la && equiv(a[offset], b[offset])) {
        offset++;
    }
    la -= offset;
    lb -= offset;
    if (la === 0 || lb < 3) {
        return lb;
    }
    let x = 0;
    let y;
    let minDist;
    let d0;
    let d1;
    let d2;
    let d3;
    let dd;
    let dy;
    let ay;
    let bx0;
    let bx1;
    let bx2;
    let bx3;
    const _min = (d0, d1, d2, bx, ay) => {
        return d0 < d1 || d2 < d1
            ? d0 > d2
                ? d2 + 1
                : d0 + 1
            : equiv(ay, bx)
                ? d1
                : d1 + 1;
    };
    const vector = [];
    for (y = 0; y < la; y++) {
        vector.push(y + 1, a[offset + y]);
    }
    const len = vector.length - 1;
    const lb3 = lb - 3;
    for (; x < lb3;) {
        bx0 = b[offset + (d0 = x)];
        bx1 = b[offset + (d1 = x + 1)];
        bx2 = b[offset + (d2 = x + 2)];
        bx3 = b[offset + (d3 = x + 3)];
        dd = x += 4;
        minDist = Infinity;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            ay = vector[y + 1];
            d0 = _min(dy, d0, d1, bx0, ay);
            d1 = _min(d0, d1, d2, bx1, ay);
            d2 = _min(d1, d2, d3, bx2, ay);
            dd = _min(d2, d3, dd, bx3, ay);
            dd < minDist && (minDist = dd);
            vector[y] = dd;
            d3 = d2;
            d2 = d1;
            d1 = d0;
            d0 = dy;
        }
        if (minDist > maxDist)
            return Infinity;
    }
    for (; x < lb;) {
        bx0 = b[offset + (d0 = x)];
        dd = ++x;
        minDist = Infinity;
        for (y = 0; y < len; y += 2) {
            dy = vector[y];
            vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
            dd < minDist && (minDist = dd);
            d0 = dy;
        }
        if (minDist > maxDist)
            return Infinity;
    }
    return dd;
};
const normalizedLevenshtein = (a, b, maxDist = Infinity, equiv = eqStrict) => {
    const n = Math.max(a.length, b.length);
    return n > 0 ? levenshtein(a, b, maxDist, equiv) / n : 0;
};

const first = (buf) => buf[0];
const peek = (buf) => buf[buf.length - 1];

const swap = (arr, x, y) => {
    const t = arr[x];
    arr[x] = arr[y];
    arr[y] = t;
};
const multiSwap = (...xs) => {
    const [b, c, d] = xs;
    const n = xs.length;
    switch (n) {
        case 0:
            return swap;
        case 1:
            return (a, x, y) => {
                swap(a, x, y);
                swap(b, x, y);
            };
        case 2:
            return (a, x, y) => {
                swap(a, x, y);
                swap(b, x, y);
                swap(c, x, y);
            };
        case 3:
            return (a, x, y) => {
                swap(a, x, y);
                swap(b, x, y);
                swap(c, x, y);
                swap(d, x, y);
            };
        default:
            return (a, x, y) => {
                swap(a, x, y);
                for (let i = n; --i >= 0;)
                    swap(xs[i], x, y);
            };
    }
};

function quickSort(arr, _cmp = compare.compare, _swap = swap, start = 0, end = arr.length - 1) {
    if (start < end) {
        const pivot = arr[start + ((end - start) >> 1)];
        let s = start - 1;
        let e = end + 1;
        while (true) {
            do {
                s++;
            } while (_cmp(arr[s], pivot) < 0);
            do {
                e--;
            } while (_cmp(arr[e], pivot) > 0);
            if (s >= e)
                break;
            _swap(arr, s, e);
        }
        quickSort(arr, _cmp, _swap, start, e);
        quickSort(arr, _cmp, _swap, e + 1, end);
    }
    return arr;
}

const shuffleRange = (buf, start = 0, end = buf.length, rnd = random.SYSTEM) => {
    api.assert(start >= 0 && end >= start && end <= buf.length, `illegal range ${start}..${end}`);
    let n = end - start;
    const l = n;
    if (l > 1) {
        while (--n >= 0) {
            const a = (start + rnd.float(l)) | 0;
            const b = (start + rnd.float(l)) | 0;
            const t = buf[a];
            buf[a] = buf[b];
            buf[b] = t;
        }
    }
    return buf;
};
const shuffle = (buf, n = buf.length, rnd = random.SYSTEM) => shuffleRange(buf, 0, n, rnd);

const sortByCachedKey = (src, key, cmp = compare.compare) => {
    const keys = checks.isFunction(key) ? src.map(key) : key;
    api.assert(keys.length === src.length, `keys.length != src.length`);
    quickSort(keys, cmp, multiSwap(src));
    return src;
};

const startsWith = (buf, needle, equiv$1 = equiv.equiv) => {
    let i = buf.length;
    let j = needle.length;
    if (i < j)
        return false;
    while (-j >= 0 && equiv$1(buf[j], needle[j])) { }
    return j < 0;
};

const swizzle = (order) => {
    const [a, b, c, d, e, f, g, h] = order;
    switch (order.length) {
        case 0:
            return () => [];
        case 1:
            return (x) => [x[a]];
        case 2:
            return (x) => [x[a], x[b]];
        case 3:
            return (x) => [x[a], x[b], x[c]];
        case 4:
            return (x) => [x[a], x[b], x[c], x[d]];
        case 5:
            return (x) => [x[a], x[b], x[c], x[d], x[e]];
        case 6:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f]];
        case 7:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f], x[g]];
        case 8:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f], x[g], x[h]];
        default:
            return (x) => {
                const res = [];
                for (let i = order.length; --i >= 0;) {
                    res[i] = x[order[i]];
                }
                return res;
            };
    }
};

exports.arrayIterator = arrayIterator;
exports.binarySearch = binarySearch;
exports.binarySearch16 = binarySearch16;
exports.binarySearch2 = binarySearch2;
exports.binarySearch32 = binarySearch32;
exports.binarySearch4 = binarySearch4;
exports.binarySearch8 = binarySearch8;
exports.binarySearchNumeric = binarySearchNumeric;
exports.bisect = bisect;
exports.bisectWith = bisectWith;
exports.bsEQ = bsEQ;
exports.bsGE = bsGE;
exports.bsGT = bsGT;
exports.bsLE = bsLE;
exports.bsLT = bsLT;
exports.endsWith = endsWith;
exports.ensureArray = ensureArray;
exports.ensureArrayLike = ensureArrayLike;
exports.ensureIterable = ensureIterable;
exports.fillRange = fillRange;
exports.find = find;
exports.findIndex = findIndex;
exports.first = first;
exports.fuzzyMatch = fuzzyMatch;
exports.insert = insert;
exports.insertUnsafe = insertUnsafe;
exports.into = into;
exports.isSorted = isSorted;
exports.levenshtein = levenshtein;
exports.multiSwap = multiSwap;
exports.normalizedLevenshtein = normalizedLevenshtein;
exports.peek = peek;
exports.quickSort = quickSort;
exports.shuffle = shuffle;
exports.shuffleRange = shuffleRange;
exports.sortByCachedKey = sortByCachedKey;
exports.startsWith = startsWith;
exports.swap = swap;
exports.swizzle = swizzle;

},{"@thi.ng/api":2,"@thi.ng/checks":5,"@thi.ng/compare":6,"@thi.ng/equiv":8,"@thi.ng/errors":9,"@thi.ng/random":13}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const align = (addr, size) => (size--, (addr + size) & ~size);
const isAligned = (addr, size) => !(addr & (size - 1));

const F64 = new Float64Array(1);
const F32 = new Float32Array(F64.buffer);
const I32 = new Int32Array(F64.buffer);
const U32 = new Uint32Array(F64.buffer);
const IS_LE = ((F64[0] = 2), U32[1] === 0x40000000);
const floatToIntBits = (x) => ((F32[0] = x), I32[0]);
const floatToUintBits = (x) => ((F32[0] = x), U32[0]);
const intBitsToFloat = (x) => ((I32[0] = x), F32[0]);
const uintBitsToFloat = (x) => ((U32[0] = x), F32[0]);
const floatToIntBits64 = (x) => ((F64[0] = x), IS_LE ? [I32[1], I32[0]] : [I32[0], I32[1]]);
const floatToUintBits64 = (x) => ((F64[0] = x), IS_LE ? [U32[1], U32[0]] : [U32[0], U32[1]]);
const intBitsToFloat64 = (hi, lo) => {
    IS_LE ? ((I32[1] = hi), (I32[0] = lo)) : ((I32[0] = hi), (I32[1] = lo));
    return F64[0];
};
const uintBitsToFloat64 = (hi, lo) => {
    IS_LE ? ((U32[1] = hi), (U32[0] = lo)) : ((U32[0] = hi), (U32[1] = lo));
    return F64[0];
};
const floatToSortableInt = (x) => {
    if (x === -0)
        x = 0;
    const i = floatToIntBits(x);
    return x < 0 ? ~i | (1 << 31) : i;
};
const clamp11 = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const f32u8 = (x) => (clamp11(x) * 0x7f) & 0xff;
const f32u16 = (x) => (clamp11(x) * 0x7fff) & 0xffff;
const f32u24 = (x) => (clamp11(x) * 0x7fffff) & 0xffffff;
const f32u32 = (x) => (clamp11(x) * 0x7fffffff) >>> 0;
const u8f32 = (x) => ((x &= 0xff), (x | ((x >> 7) * 0xffffff00)) / 0x7f);
const u16f32 = (x) => ((x &= 0xffff), (x | ((x >> 15) * 0xffff0000)) / 0x7fff);
const u24f32 = (x) => ((x &= 0xffffff), (x | ((x >> 23) * 0xff000000)) / 0x7fffff);
const u32f32 = (x) => (x | 0) / 0x7fffffff;

const bytes16 = (x, le = false) => {
    const b0 = x & 0xff;
    const b1 = (x >> 8) & 0xff;
    return le ? [b0, b1] : [b1, b0];
};
const bytes24 = (x, le = false) => {
    const b0 = x & 0xff;
    const b1 = (x >> 8) & 0xff;
    const b2 = (x >> 16) & 0xff;
    return le ? [b0, b1, b2] : [b2, b1, b0];
};
const bytes32 = (x, le = false) => {
    const b0 = x & 0xff;
    const b1 = (x >> 8) & 0xff;
    const b2 = (x >> 16) & 0xff;
    const b3 = (x >> 24) & 0xff;
    return le ? [b0, b1, b2, b3] : [b3, b2, b1, b0];
};
const bytes64 = (hi, lo, le = false) => {
    return le
        ? bytes32(lo, le).concat(bytes32(hi, le))
        : bytes32(hi, le).concat(bytes32(lo, le));
};
const bytesF32 = (x, le = false) => bytes32(floatToUintBits(x), le);
const bytesF64 = (x, le = false) =>
bytes64(...floatToUintBits64(x), le);

const defBits = (n) => new Array(n).fill(0).map((_, i) => 1 << (n - 1 - i));
const MSB_BITS8 = defBits(8);
const MSB_BITS16 = defBits(16);
const MSB_BITS32 = defBits(32);
const MASKS = new Array(33).fill(0).map((_, i) => Math.pow(2, i) - 1);

const popCount = (x) => ((x = x - ((x >>> 1) & 0x55555555)),
    (x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)),
    (((x + (x >>> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24);
const hammingDist = (x, y) => popCount(x ^ y);
const clz32 = (x) => x !== 0 ? 31 - ((Math.log(x >>> 0) / Math.LN2) | 0) : 32;
const ctz32 = (x) => {
    let c = 32;
    x &= -x;
    x && c--;
    x & 0x0000ffff && (c -= 16);
    x & 0x00ff00ff && (c -= 8);
    x & 0x0f0f0f0f && (c -= 4);
    x & 0x33333333 && (c -= 2);
    x & 0x55555555 && (c -= 1);
    return c;
};
const bitSize = (x) => (x > 1 ? Math.ceil(Math.log2(x)) : 0);

const defMask = (a, b) => (~MASKS[a] & MASKS[b]) >>> 0;
const maskL = (n, x) => (x & MASKS[n]) >>> 0;
const maskH = (n, x) => (x & ~MASKS[n]) >>> 0;

const bitClear = (x, bit) => (x & ~(1 << bit)) >>> 0;
const bitFlip = (x, bit) => (x ^ (1 << bit)) >>> 0;
const bitSet = (x, bit) => (x | (1 << bit)) >>> 0;
const bitSetWindow = (x, y, from, to) => {
    const m = defMask(from, to);
    return (x & ~m) | ((y << (1 << from)) & m);
};
const bitClearWindow = (x, from, to) => x & ~defMask(from, to);

const encodeGray32 = (x) => (x ^ (x >>> 1)) >>> 0;
const decodeGray32 = (x) => {
    x = x ^ (x >>> 16);
    x = x ^ (x >>> 8);
    x = x ^ (x >>> 4);
    x = x ^ (x >>> 2);
    x = x ^ (x >>> 1);
    return x >>> 0;
};

const bitNot = (x) => ~x;
const bitAnd = (a, b) => a & b;
const bitNand = (a, b) => ~(a & b);
const bitOr = (a, b) => a | b;
const bitNor = (a, b) => ~(a | b);
const bitXor = (a, b) => a ^ b;
const bitXnor = (a, b) => ~(a ^ b);
const bitImply = (a, b) => ~a | b;
const bitAoi21 = (a, b, c) => ~(a | (b & c));
const bitOai21 = (a, b, c) => ~(a & (b | c));
const bitAoi22 = (a, b, c, d) => ~((a & b) | (c & d));
const bitOai22 = (a, b, c, d) => ~((a | b) & (c | d));
const bitMux = (a, b, s) => ((a & ~s) | (b & s)) >>> 0;
const bitDemux = (a, b, s) => [
    (a & ~s) >>> 0,
    (b & s) >>> 0,
];
const bitNotM = (n, x) => maskL(n, ~x);
const bitAndM = (n, a, b) => maskL(n, a & b);
const bitNandM = (n, a, b) => maskL(n, ~(a & b));
const bitOrM = (n, a, b) => maskL(n, a | b);
const bitNorM = (n, a, b) => maskL(n, ~(a | b));
const bitXorM = (n, a, b) => maskL(n, a ^ b);
const bitXnorM = (n, a, b) => maskL(n, ~(a ^ b));
const bitImplyM = (n, a, b) => maskL(n, ~a | b);
const bitAoi21M = (n, a, b, c) => maskL(n, ~(a | (b & c)));
const bitOai21M = (n, a, b, c) => maskL(n, ~(a & (b | c)));
const bitAoi22M = (n, a, b, c, d) => maskL(n, ~((a & b) | (c & d)));
const bitOai22M = (n, a, b, c, d) => maskL(n, ~((a | b) & (c | d)));
const bitMuxM = (n, a, b, s) => maskL(n, (a & ~s) | (b & s));
const bitDemuxM = (n, a, b, s) => [
    maskL(n, a & ~s),
    maskL(n, b & s),
];

const binaryOneHot = (x) => (1 << x) >>> 0;
const oneHotBinary = (x) => 31 - clz32(x);

const isPow2 = (x) => !!x && !(x & (x - 1));
const ceilPow2 = (x) => {
    x += (x === 0);
    --x;
    x |= x >>> 1;
    x |= x >>> 2;
    x |= x >>> 4;
    x |= x >>> 8;
    x |= x >>> 16;
    return x + 1;
};
const floorPow2 = (x) => {
    x |= x >>> 1;
    x |= x >>> 2;
    x |= x >>> 4;
    x |= x >>> 8;
    x |= x >>> 16;
    return x - (x >>> 1);
};

const rotateLeft = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
const rotateRight = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;

const splat4_24 = (x) => (x & 0xf) * 0x111111;
const splat4_32 = (x) => ((x & 0xf) * 0x11111111) >>> 0;
const splat8_24 = (x) => (x & 0xff) * 0x010101;
const splat8_32 = (x) => ((x & 0xff) * 0x01010101) >>> 0;
const splat16_32 = (x) => ((x &= 0xffff), ((x << 16) | x) >>> 0);
const same4 = (x) => ((x >> 4) & 0xf) === (x & 0xf);
const same8 = (x) => ((x >> 8) & 0xff) === (x & 0xff);
const interleave4_12_24 = (x) => ((x & 0xf00) * 0x1100) | ((x & 0xf0) * 0x110) | ((x & 0xf) * 0x11);
const interleave4_16_32 = (x) => (((x & 0xf000) * 0x11000) |
    ((x & 0xf00) * 0x1100) |
    ((x & 0xf0) * 0x110) |
    ((x & 0xf) * 0x11)) >>>
    0;

const lane16 = (x, lane) => (x >>> ((1 - lane) << 4)) & 0xffff;
const lane8 = (x, lane) => (x >>> ((3 - lane) << 3)) & 0xff;
const lane4 = (x, lane) => (x >>> ((7 - lane) << 2)) & 0xf;
const lane2 = (x, lane) => (x >>> ((15 - lane) << 1)) & 0x3;
const setLane16 = (x, y, lane) => lane ? mux(x, y, 0xffff) : mux(x, y << 16, 0xffff0000);
const setLane8 = (x, y, lane) => {
    const l = (3 - lane) << 3;
    return ((~(0xff << l) & x) | ((y & 0xff) << l)) >>> 0;
};
const setLane4 = (x, y, lane) => {
    const l = (7 - lane) << 2;
    return ((~(0xf << l) & x) | ((y & 0xf) << l)) >>> 0;
};
const setLane2 = (x, y, lane) => {
    const l = (15 - lane) << 1;
    return ((~(0x3 << l) & x) | ((y & 0x3) << l)) >>> 0;
};
const swizzle8 = (x, a, b, c, d) => ((lane8(x, a) << 24) |
    (lane8(x, b) << 16) |
    (lane8(x, c) << 8) |
    lane8(x, d)) >>>
    0;
const swizzle4 = (x, a, b, c, d, e, f, g, h) => ((lane4(x, a) << 28) |
    (lane4(x, b) << 24) |
    (lane4(x, c) << 20) |
    (lane4(x, d) << 16) |
    (lane4(x, e) << 12) |
    (lane4(x, f) << 8) |
    (lane4(x, g) << 4) |
    lane4(x, h)) >>>
    0;
const mux = (a, b, mask) => (~mask & a) | (mask & b);
const flip8 = (x) => ((x >>> 24) | ((x >> 8) & 0xff00) | ((x & 0xff00) << 8) | (x << 24)) >>> 0;
const flip16 = (x) => mux(x << 16, x >>> 16, 0xffff);
const flipBytes = flip8;
const swapLane02 = (x) => ((x & 0xff00) << 16) | ((x >>> 16) & 0xff00) | (x & 0x00ff00ff);
const swapLane13 = (x) => ((x & 0xff) << 16) | ((x >> 16) & 0xff) | (x & 0xff00ff00);

exports.IS_LE = IS_LE;
exports.MASKS = MASKS;
exports.MSB_BITS16 = MSB_BITS16;
exports.MSB_BITS32 = MSB_BITS32;
exports.MSB_BITS8 = MSB_BITS8;
exports.align = align;
exports.binaryOneHot = binaryOneHot;
exports.bitAnd = bitAnd;
exports.bitAndM = bitAndM;
exports.bitAoi21 = bitAoi21;
exports.bitAoi21M = bitAoi21M;
exports.bitAoi22 = bitAoi22;
exports.bitAoi22M = bitAoi22M;
exports.bitClear = bitClear;
exports.bitClearWindow = bitClearWindow;
exports.bitDemux = bitDemux;
exports.bitDemuxM = bitDemuxM;
exports.bitFlip = bitFlip;
exports.bitImply = bitImply;
exports.bitImplyM = bitImplyM;
exports.bitMux = bitMux;
exports.bitMuxM = bitMuxM;
exports.bitNand = bitNand;
exports.bitNandM = bitNandM;
exports.bitNor = bitNor;
exports.bitNorM = bitNorM;
exports.bitNot = bitNot;
exports.bitNotM = bitNotM;
exports.bitOai21 = bitOai21;
exports.bitOai21M = bitOai21M;
exports.bitOai22 = bitOai22;
exports.bitOai22M = bitOai22M;
exports.bitOr = bitOr;
exports.bitOrM = bitOrM;
exports.bitSet = bitSet;
exports.bitSetWindow = bitSetWindow;
exports.bitSize = bitSize;
exports.bitXnor = bitXnor;
exports.bitXnorM = bitXnorM;
exports.bitXor = bitXor;
exports.bitXorM = bitXorM;
exports.bytes16 = bytes16;
exports.bytes24 = bytes24;
exports.bytes32 = bytes32;
exports.bytes64 = bytes64;
exports.bytesF32 = bytesF32;
exports.bytesF64 = bytesF64;
exports.ceilPow2 = ceilPow2;
exports.clz32 = clz32;
exports.ctz32 = ctz32;
exports.decodeGray32 = decodeGray32;
exports.defMask = defMask;
exports.encodeGray32 = encodeGray32;
exports.f32u16 = f32u16;
exports.f32u24 = f32u24;
exports.f32u32 = f32u32;
exports.f32u8 = f32u8;
exports.flip16 = flip16;
exports.flip8 = flip8;
exports.flipBytes = flipBytes;
exports.floatToIntBits = floatToIntBits;
exports.floatToIntBits64 = floatToIntBits64;
exports.floatToSortableInt = floatToSortableInt;
exports.floatToUintBits = floatToUintBits;
exports.floatToUintBits64 = floatToUintBits64;
exports.floorPow2 = floorPow2;
exports.hammingDist = hammingDist;
exports.intBitsToFloat = intBitsToFloat;
exports.intBitsToFloat64 = intBitsToFloat64;
exports.interleave4_12_24 = interleave4_12_24;
exports.interleave4_16_32 = interleave4_16_32;
exports.isAligned = isAligned;
exports.isPow2 = isPow2;
exports.lane16 = lane16;
exports.lane2 = lane2;
exports.lane4 = lane4;
exports.lane8 = lane8;
exports.maskH = maskH;
exports.maskL = maskL;
exports.mux = mux;
exports.oneHotBinary = oneHotBinary;
exports.popCount = popCount;
exports.rotateLeft = rotateLeft;
exports.rotateRight = rotateRight;
exports.same4 = same4;
exports.same8 = same8;
exports.setLane16 = setLane16;
exports.setLane2 = setLane2;
exports.setLane4 = setLane4;
exports.setLane8 = setLane8;
exports.splat16_32 = splat16_32;
exports.splat4_24 = splat4_24;
exports.splat4_32 = splat4_32;
exports.splat8_24 = splat8_24;
exports.splat8_32 = splat8_32;
exports.swapLane02 = swapLane02;
exports.swapLane13 = swapLane13;
exports.swizzle4 = swizzle4;
exports.swizzle8 = swizzle8;
exports.u16f32 = u16f32;
exports.u24f32 = u24f32;
exports.u32f32 = u32f32;
exports.u8f32 = u8f32;
exports.uintBitsToFloat = uintBitsToFloat;
exports.uintBitsToFloat64 = uintBitsToFloat64;

},{}],5:[function(require,module,exports){
(function (process,global){(function (){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const existsAndNotNull = (x) => x != null;

const exists = (t) => t !== undefined;

const hasBigInt = () => typeof BigInt === "function";

const hasCrypto = () => typeof window !== "undefined" && window["crypto"] !== undefined;

const hasMaxLength = (len, x) => x != null && x.length <= len;

const hasMinLength = (len, x) => x != null && x.length >= len;

const isFunction = (x) => typeof x === "function";

const hasPerformance = () => typeof performance !== "undefined" && isFunction(performance.now);

const hasWASM = () => (typeof window !== "undefined" &&
    typeof window["WebAssembly"] !== "undefined") ||
    (typeof global !== "undefined" &&
        typeof global["WebAssembly"] !== "undefined");

const hasWebGL = () => {
    try {
        document.createElement("canvas").getContext("webgl");
        return true;
    }
    catch (e) {
        return false;
    }
};

const hasWebSocket = () => typeof WebSocket !== "undefined";

const implementsFunction = (x, fn) => x != null && typeof x[fn] === "function";

const isAlpha = (x) => /^[a-z]+$/i.test(x);
const isAlphaNum = (x) => /^[a-z0-9]+$/i.test(x);
const isNumeric = (x) => /^[0-9]+$/.test(x);

const isArray = Array.isArray;

const isArrayLike = (x) => x != null && typeof x !== "function" && x.length !== undefined;

const isASCII = (x) => /^[\x00-\x7f]+$/.test(x);
const isPrintableASCII = (x) => /^[\x20-\x7e]+$/.test(x);

const isAsyncIterable = (x) => x != null && typeof x[Symbol.asyncIterator] === "function";

const isBlob = (x) => x instanceof Blob;

const isBoolean = (x) => typeof x === "boolean";

const isChrome = () => typeof window !== "undefined" && !!window["chrome"];

const isDataURL = (x) => /^data:.+\/(.+);base64,/.test(x);

const isDate = (x) => x instanceof Date;

const isEven = (x) => x % 2 === 0;

const isFalse = (x) => x === false;

const isFile = (x) => x instanceof File;

const isFirefox = () => typeof window !== "undefined" && !!window["InstallTrigger"];

const RE$4 = /^(?:[-+]?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/;
const isFloatString = (x) => x.length > 0 && RE$4.test(x);

const isHex = (x) => /^[a-f0-9]+$/i.test(x);

const isString = (x) => typeof x === "string";

const RE$3 = /^#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})$/i;
const isHexColor = (x) => isString(x) && RE$3.test(x);

const isIE = () => typeof document !== "undefined" &&
    (typeof document["documentMode"] !== "undefined" ||
        navigator.userAgent.indexOf("MSIE") > 0);

const isInRange = (min, max, x) => x >= min && x <= max;

const isInt32 = (x) => typeof x === "number" && (x | 0) === x;

const RE$2 = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;
const isIntString = (x) => RE$2.test(x);

const isIterable = (x) => x != null && typeof x[Symbol.iterator] === "function";

const isMap = (x) => x instanceof Map;

const isMobile = () => typeof navigator !== "undefined" &&
    /mobile|tablet|ip(ad|hone|od)|android|silk|crios/i.test(navigator.userAgent);

const isNaN = (x) => x !== x;

const isNegative = (x) => typeof x === "number" && x < 0;

const isNil = (x) => x == null;

const isNode = () => typeof process === "object" &&
    typeof process.versions === "object" &&
    typeof process.versions.node !== "undefined";

const isNotStringAndIterable = (x) => x != null &&
    typeof x !== "string" &&
    typeof x[Symbol.iterator] === "function";

const isNull = (x) => x === null;

const isNumber = (x) => typeof x === "number";

const isNumericInt = (x) => /^[-+]?\d+$/.test(x);
const isNumericFloat = (x) => /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(x);

const isObject = (x) => x !== null && typeof x === "object";

const isOdd = (x) => x % 2 !== 0;

const OBJP = Object.getPrototypeOf;
const isPlainObject = (x) => {
    let p;
    return (x != null &&
        typeof x === "object" &&
        ((p = OBJP(x)) === null || OBJP(p) === null));
};

const isPositive = (x) => typeof x === "number" && x > 0;

const isPrimitive = (x) => {
    const t = typeof x;
    return t === "string" || t === "number";
};

const isPromise = (x) => x instanceof Promise;

const isPromiseLike = (x) => x instanceof Promise ||
    (implementsFunction(x, "then") && implementsFunction(x, "catch"));

const ILLEGAL_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const isIllegalKey = (x) => ILLEGAL_KEYS.has(x);
const isProtoPath = (path) => isArray(path)
    ? path.some(isIllegalKey)
    : isString(path)
        ? path.indexOf(".") !== -1
            ? path.split(".").some(isIllegalKey)
            : isIllegalKey(path)
        : false;

const isRegExp = (x) => x instanceof RegExp;

const isSafari = () => typeof navigator !== "undefined" &&
    /Safari/.test(navigator.userAgent) &&
    !isChrome();

const isSet = (x) => x instanceof Set;

const isSymbol = (x) => typeof x === "symbol";

const isTransferable = (x) => x instanceof ArrayBuffer ||
    (typeof SharedArrayBuffer !== "undefined" &&
        x instanceof SharedArrayBuffer) ||
    (typeof MessagePort !== "undefined" && x instanceof MessagePort);

const isTrue = (x) => x === true;

const isTypedArray = (x) => x &&
    (x instanceof Float32Array ||
        x instanceof Float64Array ||
        x instanceof Uint32Array ||
        x instanceof Int32Array ||
        x instanceof Uint8Array ||
        x instanceof Int8Array ||
        x instanceof Uint16Array ||
        x instanceof Int16Array ||
        x instanceof Uint8ClampedArray);

const isUint32 = (x) => typeof x === "number" && x >>> 0 === x;

const isUndefined = (x) => x === undefined;

const RE$1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (x) => RE$1.test(x);

const RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUIDv4 = (x) => RE.test(x);

const isZero = (x) => x === 0;

exports.exists = exists;
exports.existsAndNotNull = existsAndNotNull;
exports.hasBigInt = hasBigInt;
exports.hasCrypto = hasCrypto;
exports.hasMaxLength = hasMaxLength;
exports.hasMinLength = hasMinLength;
exports.hasPerformance = hasPerformance;
exports.hasWASM = hasWASM;
exports.hasWebGL = hasWebGL;
exports.hasWebSocket = hasWebSocket;
exports.implementsFunction = implementsFunction;
exports.isASCII = isASCII;
exports.isAlpha = isAlpha;
exports.isAlphaNum = isAlphaNum;
exports.isArray = isArray;
exports.isArrayLike = isArrayLike;
exports.isAsyncIterable = isAsyncIterable;
exports.isBlob = isBlob;
exports.isBoolean = isBoolean;
exports.isChrome = isChrome;
exports.isDataURL = isDataURL;
exports.isDate = isDate;
exports.isEven = isEven;
exports.isFalse = isFalse;
exports.isFile = isFile;
exports.isFirefox = isFirefox;
exports.isFloatString = isFloatString;
exports.isFunction = isFunction;
exports.isHex = isHex;
exports.isHexColor = isHexColor;
exports.isIE = isIE;
exports.isIllegalKey = isIllegalKey;
exports.isInRange = isInRange;
exports.isInt32 = isInt32;
exports.isIntString = isIntString;
exports.isIterable = isIterable;
exports.isMap = isMap;
exports.isMobile = isMobile;
exports.isNaN = isNaN;
exports.isNegative = isNegative;
exports.isNil = isNil;
exports.isNode = isNode;
exports.isNotStringAndIterable = isNotStringAndIterable;
exports.isNull = isNull;
exports.isNumber = isNumber;
exports.isNumeric = isNumeric;
exports.isNumericFloat = isNumericFloat;
exports.isNumericInt = isNumericInt;
exports.isObject = isObject;
exports.isOdd = isOdd;
exports.isPlainObject = isPlainObject;
exports.isPositive = isPositive;
exports.isPrimitive = isPrimitive;
exports.isPrintableASCII = isPrintableASCII;
exports.isPromise = isPromise;
exports.isPromiseLike = isPromiseLike;
exports.isProtoPath = isProtoPath;
exports.isRegExp = isRegExp;
exports.isSafari = isSafari;
exports.isSet = isSet;
exports.isString = isString;
exports.isSymbol = isSymbol;
exports.isTransferable = isTransferable;
exports.isTrue = isTrue;
exports.isTypedArray = isTypedArray;
exports.isUUID = isUUID;
exports.isUUIDv4 = isUUIDv4;
exports.isUint32 = isUint32;
exports.isUndefined = isUndefined;
exports.isZero = isZero;

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":21}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const compare = (a, b) => {
    if (a === b) {
        return 0;
    }
    if (a == null) {
        return b == null ? 0 : -1;
    }
    if (b == null) {
        return a == null ? 0 : 1;
    }
    if (typeof a.compare === "function") {
        return a.compare(b);
    }
    if (typeof b.compare === "function") {
        return -b.compare(a);
    }
    return a < b ? -1 : a > b ? 1 : 0;
};

const getKey = (k) => typeof k === "function" ? k : (x) => x[k];
function compareByKey(a, cmp = compare) {
    const k = getKey(a);
    return (x, y) => cmp(k(x), k(y));
}
function compareByKeys2(a, b, cmpA = compare, cmpB = compare) {
    const ka = getKey(a);
    const kb = getKey(b);
    return (x, y) => {
        let res = cmpA(ka(x), ka(y));
        return res === 0 ? cmpB(kb(x), kb(y)) : res;
    };
}
function compareByKeys3(a, b, c, cmpA = compare, cmpB = compare, cmpC = compare) {
    const ka = getKey(a);
    const kb = getKey(b);
    const kc = getKey(c);
    return (x, y) => {
        let res = cmpA(ka(x), ka(y));
        return res === 0
            ? (res = cmpB(kb(x), kb(y))) === 0
                ? cmpC(kc(x), kc(y))
                : res
            : res;
    };
}
function compareByKeys4(a, b, c, d, cmpA = compare, cmpB = compare, cmpC = compare, cmpD = compare) {
    const ka = getKey(a);
    const kb = getKey(b);
    const kc = getKey(c);
    const kd = getKey(d);
    return (x, y) => {
        let res = cmpA(ka(x), ka(y));
        return res === 0
            ? (res = cmpB(kb(x), kb(y))) === 0
                ? (res = cmpC(kc(x), kc(y))) === 0
                    ? cmpD(kd(x), kd(y))
                    : res
                : res
            : res;
    };
}

const compareNumAsc = (a, b) => a - b;
const compareNumDesc = (a, b) => b - a;

const reverse = (cmp) => (a, b) => -cmp(a, b);

exports.compare = compare;
exports.compareByKey = compareByKey;
exports.compareByKeys2 = compareByKeys2;
exports.compareByKeys3 = compareByKeys3;
exports.compareByKeys4 = compareByKeys4;
exports.compareNumAsc = compareNumAsc;
exports.compareNumDesc = compareNumDesc;
exports.reverse = reverse;

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var errors = require('@thi.ng/errors');

function comp(...fns) {
    let [a, b, c, d, e, f, g, h, i, j] = fns;
    switch (fns.length) {
        case 0:
            errors.illegalArity(0);
        case 1:
            return a;
        case 2:
            return (...xs) => a(b(...xs));
        case 3:
            return (...xs) => a(b(c(...xs)));
        case 4:
            return (...xs) => a(b(c(d(...xs))));
        case 5:
            return (...xs) => a(b(c(d(e(...xs)))));
        case 6:
            return (...xs) => a(b(c(d(e(f(...xs))))));
        case 7:
            return (...xs) => a(b(c(d(e(f(g(...xs)))))));
        case 8:
            return (...xs) => a(b(c(d(e(f(g(h(...xs))))))));
        case 9:
            return (...xs) => a(b(c(d(e(f(g(h(i(...xs)))))))));
        case 10:
        default:
            const fn = (...xs) => a(b(c(d(e(f(g(h(i(j(...xs))))))))));
            return fns.length === 10 ? fn : comp(fn, ...fns.slice(10));
    }
}
function compL(...fns) {
    return comp.apply(null, fns.reverse());
}
const compI = compL;

function complement(f) {
    return (...xs) => !f(...xs);
}

const constantly = (x) => () => x;

const delay = (body) => new Delay(body);
class Delay {
    constructor(body) {
        this.body = body;
        this.realized = false;
    }
    deref() {
        if (!this.realized) {
            this.value = this.body();
            this.realized = true;
        }
        return this.value;
    }
    isRealized() {
        return this.realized;
    }
}

const delayed = (x, t) => new Promise((resolve) => setTimeout(() => resolve(x), t));

const identity = (x) => x;

const ifDef = (f, x) => x != null ? f(x) : undefined;

function juxt(...fns) {
    const [a, b, c, d, e, f, g, h] = fns;
    switch (fns.length) {
        case 1:
            return (x) => [a(x)];
        case 2:
            return (x) => [a(x), b(x)];
        case 3:
            return (x) => [a(x), b(x), c(x)];
        case 4:
            return (x) => [a(x), b(x), c(x), d(x)];
        case 5:
            return (x) => [a(x), b(x), c(x), d(x), e(x)];
        case 6:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x)];
        case 7:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x), g(x)];
        case 8:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x), g(x), h(x)];
        default:
            return (x) => {
                let res = new Array(fns.length);
                for (let i = fns.length; --i >= 0;) {
                    res[i] = fns[i](x);
                }
                return res;
            };
    }
}

function partial(fn, ...args) {
    let [a, b, c, d, e, f, g, h] = args;
    switch (args.length) {
        case 1:
            return (...xs) => fn(a, ...xs);
        case 2:
            return (...xs) => fn(a, b, ...xs);
        case 3:
            return (...xs) => fn(a, b, c, ...xs);
        case 4:
            return (...xs) => fn(a, b, c, d, ...xs);
        case 5:
            return (...xs) => fn(a, b, c, d, e, ...xs);
        case 6:
            return (...xs) => fn(a, b, c, d, e, f, ...xs);
        case 7:
            return (...xs) => fn(a, b, c, d, e, f, g, ...xs);
        case 8:
            return (...xs) => fn(a, b, c, d, e, f, g, h, ...xs);
        default:
            errors.illegalArgs();
    }
}

const promisify = (fn) => new Promise((resolve, reject) => fn((err, result) => (err != null ? reject(err) : resolve(result))));

const threadFirst = (init, ...fns) => fns.reduce((acc, expr) => typeof expr === "function"
    ? expr(acc)
    : expr[0](acc, ...expr.slice(1)), init);

const threadLast = (init, ...fns) => fns.reduce((acc, expr) => typeof expr === "function"
    ? expr(acc)
    : expr[0](...expr.slice(1), acc), init);

const trampoline = (f) => {
    while (typeof f === "function") {
        f = f();
    }
    return f;
};

exports.Delay = Delay;
exports.comp = comp;
exports.compI = compI;
exports.compL = compL;
exports.complement = complement;
exports.constantly = constantly;
exports.delay = delay;
exports.delayed = delayed;
exports.identity = identity;
exports.ifDef = ifDef;
exports.juxt = juxt;
exports.partial = partial;
exports.promisify = promisify;
exports.threadFirst = threadFirst;
exports.threadLast = threadLast;
exports.trampoline = trampoline;

},{"@thi.ng/errors":9}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const OBJP = Object.getPrototypeOf({});
const FN = "function";
const STR = "string";
const equiv = (a, b) => {
    let proto;
    if (a === b) {
        return true;
    }
    if (a != null) {
        if (typeof a.equiv === FN) {
            return a.equiv(b);
        }
    }
    else {
        return a == b;
    }
    if (b != null) {
        if (typeof b.equiv === FN) {
            return b.equiv(a);
        }
    }
    else {
        return a == b;
    }
    if (typeof a === STR || typeof b === STR) {
        return false;
    }
    if (((proto = Object.getPrototypeOf(a)), proto == null || proto === OBJP) &&
        ((proto = Object.getPrototypeOf(b)), proto == null || proto === OBJP)) {
        return equivObject(a, b);
    }
    if (typeof a !== FN &&
        a.length !== undefined &&
        typeof b !== FN &&
        b.length !== undefined) {
        return equivArrayLike(a, b);
    }
    if (a instanceof Set && b instanceof Set) {
        return equivSet(a, b);
    }
    if (a instanceof Map && b instanceof Map) {
        return equivMap(a, b);
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.toString() === b.toString();
    }
    return a !== a && b !== b;
};
const equivArrayLike = (a, b, _equiv = equiv) => {
    let l = a.length;
    if (l === b.length) {
        while (--l >= 0 && _equiv(a[l], b[l]))
            ;
    }
    return l < 0;
};
const equivSet = (a, b, _equiv = equiv) => a.size === b.size && _equiv([...a.keys()].sort(), [...b.keys()].sort());
const equivMap = (a, b, _equiv = equiv) => a.size === b.size && _equiv([...a].sort(), [...b].sort());
const equivObject = (a, b, _equiv = equiv) => {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    for (let k in a) {
        if (!b.hasOwnProperty(k) || !_equiv(a[k], b[k])) {
            return false;
        }
    }
    return true;
};

exports.equiv = equiv;
exports.equivArrayLike = equivArrayLike;
exports.equivMap = equivMap;
exports.equivObject = equivObject;
exports.equivSet = equivSet;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const defError = (prefix, suffix = (msg) => (msg !== undefined ? ": " + msg : "")) => class extends Error {
    constructor(msg) {
        super(prefix(msg) + suffix(msg));
    }
};

const IllegalArgumentError = defError(() => "illegal argument(s)");
const illegalArgs = (msg) => {
    throw new IllegalArgumentError(msg);
};

const IllegalArityError = defError(() => "illegal arity");
const illegalArity = (n) => {
    throw new IllegalArityError(n);
};

const IllegalStateError = defError(() => "illegal state");
const illegalState = (msg) => {
    throw new IllegalStateError(msg);
};

const OutOfBoundsError = defError(() => "index out of bounds");
const outOfBounds = (index) => {
    throw new OutOfBoundsError(index);
};
const ensureIndex = (index, min, max) => (index < min || index >= max) && outOfBounds(index);
const ensureIndex2 = (x, y, maxX, maxY) => (x < 0 || x >= maxX || y < 0 || y >= maxY) && outOfBounds([x, y]);

const UnsupportedOperationError = defError(() => "unsupported operation");
const unsupported = (msg) => {
    throw new UnsupportedOperationError(msg);
};

exports.IllegalArgumentError = IllegalArgumentError;
exports.IllegalArityError = IllegalArityError;
exports.IllegalStateError = IllegalStateError;
exports.OutOfBoundsError = OutOfBoundsError;
exports.UnsupportedOperationError = UnsupportedOperationError;
exports.defError = defError;
exports.ensureIndex = ensureIndex;
exports.ensureIndex2 = ensureIndex2;
exports.illegalArgs = illegalArgs;
exports.illegalArity = illegalArity;
exports.illegalState = illegalState;
exports.outOfBounds = outOfBounds;
exports.unsupported = unsupported;

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const P32 = 0x100000000;
const HEX = "0123456789abcdef";
const U4 = (x) => HEX[x & 0xf];
const U8 = (x) => HEX[(x >>> 4) & 0xf] + HEX[x & 0xf];
const U8A = (x, i) => U8(x[i]);
const U16 = (x) => U8(x >>> 8) + U8(x & 0xff);
const U16BE = (x, i) => U8(x[i]) + U8(x[i + 1]);
const U16LE = (x, i) => U8(x[i + 1]) + U8(x[i]);
const U24 = (x) => U8(x >>> 16) + U16(x);
const U24BE = (x, i) => U8(x[i]) + U16BE(x, i + 1);
const U24LE = (x, i) => U8(x[i + 2]) + U16LE(x, i);
const U32 = (x) => U16(x >>> 16) + U16(x);
const U32BE = (x, i) => U16BE(x, i) + U16BE(x, i + 2);
const U32LE = (x, i) => U16LE(x, i + 2) + U16LE(x, i);
const U48 = (x) => U48HL(x / P32, x % P32);
const U48HL = (hi, lo) => U16(hi) + U32(lo);
const U48BE = (x, i) => U16BE(x, i) + U32BE(x, i + 2);
const U48LE = (x, i) => U16LE(x, i + 4) + U32LE(x, i);
const U64 = (x) => U64HL(x / P32, x % P32);
const U64HL = (hi, lo) => U32(hi) + U32(lo);
const U64BE = (x, i) => U32BE(x, i) + U32BE(x, i + 4);
const U64LE = (x, i) => U32LE(x, i + 4) + U32LE(x, i);
const uuid = (id, i = 0) =>
`${U32BE(id, i)}-${U16BE(id, i + 4)}-${U16BE(id, i + 6)}-${U16BE(id, i + 8)}-${U48BE(id, i + 10)}`;

exports.HEX = HEX;
exports.U16 = U16;
exports.U16BE = U16BE;
exports.U16LE = U16LE;
exports.U24 = U24;
exports.U24BE = U24BE;
exports.U24LE = U24LE;
exports.U32 = U32;
exports.U32BE = U32BE;
exports.U32LE = U32LE;
exports.U4 = U4;
exports.U48 = U48;
exports.U48BE = U48BE;
exports.U48HL = U48HL;
exports.U48LE = U48LE;
exports.U64 = U64;
exports.U64BE = U64BE;
exports.U64HL = U64HL;
exports.U64LE = U64LE;
exports.U8 = U8;
exports.U8A = U8A;
exports.uuid = uuid;

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var checks = require('@thi.ng/checks');
var errors = require('@thi.ng/errors');
var transducersBinary = require('@thi.ng/transducers-binary');

const BINARY = "AGFzbQEAAAABDQNgAXwBf2AAAXxgAAADBgUCAAEAAQUDAQACBioHfwBBgAgLfwBBgAgLfwBBiggLfwBBgAgLfwBBkIgEC38AQQALfwBBAQsH0QENBm1lbW9yeQIAEV9fd2FzbV9jYWxsX2N0b3JzAAASbGViMTI4X2VuY29kZV91X2pzAAEDYnVmAwASbGViMTI4X2RlY29kZV91X2pzAAISbGViMTI4X2VuY29kZV9zX2pzAAMSbGViMTI4X2RlY29kZV9zX2pzAAQMX19kc29faGFuZGxlAwEKX19kYXRhX2VuZAMCDV9fZ2xvYmFsX2Jhc2UDAwtfX2hlYXBfYmFzZQMEDV9fbWVtb3J5X2Jhc2UDBQxfX3RhYmxlX2Jhc2UDBgqWBAUDAAELegICfwF+AkACfiAARAAAAAAAAPBDYyAARAAAAAAAAAAAZnEEQCAAsQwBC0IACyIDQoABWgRAA0AgAUGACGogA6dB/wBxIANCB4giA0IAUiICQQd0cjoAACABQQFqIQEgAg0ACwwBC0GACCADPAAAQQEhAQsgAUH/AXELWwIDfwJ+QXYhAANAAkAgAEUEQEEKIQEMAQsgAUEBaiEBIABBighqLAAAIgJB/wBxrSADhiAEhCEEIABBAWohACADQgd8IQMgAkEASA0BCwtBgAggAToAACAEugu7AQIBfgR/AkACfiAAmUQAAAAAAADgQ2MEQCAAsAwBC0KAgICAgICAgIB/CyIBQkB9QoABWgRAQQEhAwNAIANFDQIgAaciA0HAAHEhBAJ/QgEgAUIHhyIBIAQbUEUEQCADQYB/ciEFQQEgBEUgAUJ/UnINARoLIANB/wBxIQVBAAshAyACQYAIaiAFOgAAIAJBAWohAgwACwALQYAIIAFCOYinQcAAcSABp0E/cXI6AABBASECCyACQf8BcQt8AgN/A35BfyEAA0ACQCADQgd8IQUgAEGBCGotAAAiAkEYdEEYdSEBIAJB/wBxrSADhiAEhCEEIABBAWoiAEEISw0AIAUhAyABQQBIDQELC0GACCAAQQFqOgAAIARCfyAFhkIAIAFBwABxQQZ2G0IAIABB/wFxQQlJG4S5CwAaCXByb2R1Y2VycwEIbGFuZ3VhZ2UBA0M5OQA=";

let wasm;
let U8;
if (checks.hasWASM()) {
    const inst = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([...transducersBinary.base64Decode(BINARY)])));
    wasm = inst.exports;
    U8 = new Uint8Array(wasm.memory.buffer, wasm.buf, 16);
}
const ensureWASM = () => !wasm && errors.unsupported("WASM module unavailable");
const encode = (op) => (x) => {
    ensureWASM();
    return U8.slice(0, wasm[op](x));
};
const decode = (op) => (src, idx = 0) => {
    ensureWASM();
    U8.set(src.subarray(idx, Math.min(idx + 10, src.length)), 0);
    return [wasm[op](0, 0), U8[0]];
};
const encodeSLEB128 = encode("leb128_encode_s_js");
const decodeSLEB128 = decode("leb128_decode_s_js");
const encodeULEB128 = encode("leb128_encode_u_js");
const decodeULEB128 = decode("leb128_decode_u_js");

exports.decodeSLEB128 = decodeSLEB128;
exports.decodeULEB128 = decodeULEB128;
exports.encodeSLEB128 = encodeSLEB128;
exports.encodeULEB128 = encodeULEB128;

},{"@thi.ng/checks":5,"@thi.ng/errors":9,"@thi.ng/transducers-binary":14}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const PI = Math.PI;
const TAU = PI * 2;
const HALF_PI = PI / 2;
const THIRD_PI = PI / 3;
const QUARTER_PI = PI / 4;
const SIXTH_PI = PI / 6;
const INV_PI = 1 / PI;
const INV_TAU = 1 / TAU;
const INV_HALF_PI = 1 / HALF_PI;
const DEG2RAD = PI / 180;
const RAD2DEG = 180 / PI;
const PHI = (1 + Math.sqrt(5)) / 2;
const SQRT2 = Math.SQRT2;
const SQRT3 = Math.sqrt(3);
const SQRT2_2 = SQRT2 / 2;
const SQRT2_3 = SQRT3 / 2;
const THIRD = 1 / 3;
const TWO_THIRD = 2 / 3;
const SIXTH = 1 / 6;
let EPS = 1e-6;

const absDiff = (x, y) => Math.abs(x - y);
const sign = (x, eps = EPS) => (x > eps ? 1 : x < -eps ? -1 : 0);

const sincos = (theta, n = 1) => [
    Math.sin(theta) * n,
    Math.cos(theta) * n,
];
const cossin = (theta, n = 1) => [
    Math.cos(theta) * n,
    Math.sin(theta) * n,
];
const absTheta = (theta) => ((theta %= TAU), theta < 0 ? TAU + theta : theta);
const absInnerAngle = (theta) => ((theta = Math.abs(theta)), theta > PI ? TAU - theta : theta);
const angleDist = (a, b) => absInnerAngle(absTheta((b % TAU) - (a % TAU)));
const atan2Abs = (y, x) => absTheta(Math.atan2(y, x));
const quadrant = (theta) => (absTheta(theta) * INV_HALF_PI) | 0;
const deg = (theta) => theta * RAD2DEG;
const rad = (theta) => theta * DEG2RAD;
const csc = (theta) => 1 / Math.sin(theta);
const sec = (theta) => 1 / Math.cos(theta);
const cot = (theta) => 1 / Math.tan(theta);
const loc = (a, b, gamma) => Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(gamma));
const normCos = (x) => {
    const x2 = x * x;
    return 1.0 + x2 * (-4 + 2 * x2);
};
const __fastCos = (x) => {
    const x2 = x * x;
    return 0.99940307 + x2 * (-0.49558072 + 0.03679168 * x2);
};
const fastCos = (theta) => {
    theta %= TAU;
    theta < 0 && (theta = -theta);
    switch ((theta * INV_HALF_PI) | 0) {
        case 0:
            return __fastCos(theta);
        case 1:
            return -__fastCos(PI - theta);
        case 2:
            return -__fastCos(theta - PI);
        default:
            return __fastCos(TAU - theta);
    }
};
const fastSin = (theta) => fastCos(HALF_PI - theta);

const abs = Math.abs;
const max = Math.max;
const eqDelta = (a, b, eps = EPS) => abs(a - b) <= eps;
const eqDeltaScaled = (a, b, eps = EPS) => abs(a - b) <= eps * max(1, abs(a), abs(b));

const isCrossOver = (a1, a2, b1, b2) => a1 < b1 && a2 > b2;
const isCrossUnder = (a1, a2, b1, b2) => a1 > b1 && a2 < b2;
const classifyCrossing = (a1, a2, b1, b2, eps = EPS) => eqDelta(a1, b1, eps) && eqDelta(a2, b2, eps)
    ? eqDelta(a1, b2, eps)
        ? "flat"
        : "equal"
    : isCrossOver(a1, a2, b1, b2)
        ? "over"
        : isCrossUnder(a1, a2, b1, b2)
            ? "under"
            : "other";

const isMinima = (a, b, c) => a > b && b < c;
const isMaxima = (a, b, c) => a < b && b > c;
const index = (pred, values, from = 0, to = values.length) => {
    to--;
    for (let i = from + 1; i < to; i++) {
        if (pred(values[i - 1], values[i], values[i + 1])) {
            return i;
        }
    }
    return -1;
};
const minimaIndex = (values, from = 0, to = values.length) => index(isMinima, values, from, to);
const maximaIndex = (values, from = 0, to = values.length) => index(isMaxima, values, from, to);
function* indices(fn, vals, from = 0, to = vals.length) {
    while (from < to) {
        const i = fn(vals, from, to);
        if (i < 0)
            return;
        yield i;
        from = i + 1;
    }
}
const minimaIndices = (values, from = 0, to = values.length) => indices(minimaIndex, values, from, to);
const maximaIndices = (values, from = 0, to = values.length) => indices(minimaIndex, values, from, to);

const clamp = (x, min, max) => (x < min ? min : x > max ? max : x);
const clamp0 = (x) => (x > 0 ? x : 0);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const clamp11 = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const clamp05 = (x) => (x < 0 ? 0 : x > 0.5 ? 0.5 : x);
const wrap = (x, min, max) => {
    if (min === max)
        return min;
    if (x > max) {
        const d = max - min;
        x -= d;
        if (x > max)
            x -= d * (((x - min) / d) | 0);
    }
    else if (x < min) {
        const d = max - min;
        x += d;
        if (x < min)
            x += d * (((min - x) / d + 1) | 0);
    }
    return x;
};
const wrapOnce = (x, min, max) => x < min ? x - min + max : x > max ? x - max + min : x;
const wrap01 = (x) => (x < 0 ? x + 1 : x > 1 ? x - 1 : x);
const wrap11 = (x) => (x < -1 ? x + 2 : x > 1 ? x - 2 : x);
const min2id = (a, b) => (a <= b ? 0 : 1);
const min3id = (a, b, c) => a <= b ? (a <= c ? 0 : 2) : b <= c ? 1 : 2;
const min4id = (a, b, c, d) => a <= b
    ? a <= c
        ? a <= d
            ? 0
            : 3
        : c <= d
            ? 2
            : 3
    : b <= c
        ? b <= d
            ? 1
            : 3
        : c <= d
            ? 2
            : 3;
const max2id = (a, b) => (a >= b ? 0 : 1);
const max3id = (a, b, c) => a >= b ? (a >= c ? 0 : 2) : b >= c ? 1 : 2;
const max4id = (a, b, c, d) => a >= b
    ? a >= c
        ? a >= d
            ? 0
            : 3
        : c >= d
            ? 2
            : 3
    : b >= c
        ? b >= d
            ? 1
            : 3
        : c >= d
            ? 2
            : 3;
const minNonZero2 = (a, b) => a !== 0 ? (b !== 0 ? Math.min(a, b) : a) : b;
const minNonZero3 = (a, b, c) => minNonZero2(minNonZero2(a, b), c);
const smin = (a, b, k) => smax(a, b, -k);
const smax = (a, b, k) => {
    const ea = Math.exp(a * k);
    const eb = Math.exp(b * k);
    return (a * ea + b * eb) / (ea + eb);
};
const sclamp = (x, min, max, k) => smin(smax(x, min, k), max, k);
const absMin = (a, b) => (Math.abs(a) < Math.abs(b) ? a : b);
const absMax = (a, b) => (Math.abs(a) > Math.abs(b) ? a : b);
const foldback = (e, x) => x < -e || x > e ? Math.abs(Math.abs((x - e) % (4 * e)) - 2 * e) - e : x;
const inRange = (x, min, max) => x >= min && x <= max;
const inOpenRange = (x, min, max) => x > min && x < max;

const norm = (x, a, b) => (b !== a ? (x - a) / (b - a) : 0);
const fit = (x, a, b, c, d) => c + (d - c) * norm(x, a, b);
const fitClamped = (x, a, b, c, d) => c + (d - c) * clamp01(norm(x, a, b));
const fit01 = (x, a, b) => a + (b - a) * clamp01(x);
const fit10 = (x, a, b) => b + (a - b) * clamp01(x);
const fit11 = (x, a, b) => a + (b - a) * (0.5 + 0.5 * clamp11(x));

const M8 = 0xff;
const M16 = 0xffff;
const signExtend8 = (a) => ((a &= M8), a & 0x80 ? a | ~M8 : a);
const signExtend16 = (a) => ((a &= M16), a & 0x8000 ? a | ~M16 : a);
const addi8 = (a, b) => signExtend8((a | 0) + (b | 0));
const divi8 = (a, b) => signExtend8((a | 0) / (b | 0));
const muli8 = (a, b) => signExtend8((a | 0) * (b | 0));
const subi8 = (a, b) => signExtend8((a | 0) - (b | 0));
const andi8 = (a, b) => signExtend8((a | 0) & (b | 0));
const ori8 = (a, b) => signExtend8(a | 0 | (b | 0));
const xori8 = (a, b) => signExtend8((a | 0) ^ (b | 0));
const noti8 = (a) => signExtend8(~a);
const lshifti8 = (a, b) => signExtend8((a | 0) << (b | 0));
const rshifti8 = (a, b) => signExtend8((a | 0) >> (b | 0));
const addi16 = (a, b) => signExtend16((a | 0) + (b | 0));
const divi16 = (a, b) => signExtend16((a | 0) / (b | 0));
const muli16 = (a, b) => signExtend16((a | 0) * (b | 0));
const subi16 = (a, b) => signExtend16((a | 0) - (b | 0));
const andi16 = (a, b) => signExtend16((a | 0) & (b | 0));
const ori16 = (a, b) => signExtend16(a | 0 | (b | 0));
const xori16 = (a, b) => signExtend16((a | 0) ^ (b | 0));
const noti16 = (a) => signExtend16(~a);
const lshifti16 = (a, b) => signExtend16((a | 0) << (b | 0));
const rshifti16 = (a, b) => signExtend16((a | 0) >> (b | 0));
const addi32 = (a, b) => ((a | 0) + (b | 0)) | 0;
const divi32 = (a, b) => ((a | 0) / (b | 0)) | 0;
const muli32 = (a, b) => ((a | 0) * (b | 0)) | 0;
const subi32 = (a, b) => ((a | 0) - (b | 0)) | 0;
const andi32 = (a, b) => (a | 0) & (b | 0);
const ori32 = (a, b) => a | 0 | (b | 0);
const xori32 = (a, b) => (a | 0) ^ (b | 0);
const lshifti32 = (a, b) => (a | 0) << (b | 0);
const rshifti32 = (a, b) => (a | 0) >> (b | 0);
const noti32 = (a) => ~a;
const addu8 = (a, b) => ((a & M8) + (b & M8)) & M8;
const divu8 = (a, b) => ((a & M8) / (b & M8)) & M8;
const mulu8 = (a, b) => ((a & M8) * (b & M8)) & M8;
const subu8 = (a, b) => ((a & M8) - (b & M8)) & M8;
const andu8 = (a, b) => a & M8 & (b & M8) & M8;
const oru8 = (a, b) => ((a & M8) | (b & M8)) & M8;
const xoru8 = (a, b) => ((a & M8) ^ (b & M8)) & M8;
const notu8 = (a) => ~a & M8;
const lshiftu8 = (a, b) => ((a & M8) << (b & M8)) & M8;
const rshiftu8 = (a, b) => ((a & M8) >>> (b & M8)) & M8;
const addu16 = (a, b) => ((a & M16) + (b & M16)) & M16;
const divu16 = (a, b) => ((a & M16) / (b & M16)) & M16;
const mulu16 = (a, b) => ((a & M16) * (b & M16)) & M16;
const subu16 = (a, b) => ((a & M16) - (b & M16)) & M16;
const andu16 = (a, b) => a & M16 & (b & M16) & M16;
const oru16 = (a, b) => ((a & M16) | (b & M16)) & M16;
const xoru16 = (a, b) => ((a & M16) ^ (b & M16)) & M16;
const notu16 = (a) => ~a & M16;
const lshiftu16 = (a, b) => ((a & M16) << (b & M16)) & M16;
const rshiftu16 = (a, b) => ((a & M16) >>> (b & M16)) & M16;
const addu32 = (a, b) => ((a >>> 0) + (b >>> 0)) >>> 0;
const divu32 = (a, b) => ((a >>> 0) / (b >>> 0)) >>> 0;
const mulu32 = (a, b) => ((a >>> 0) * (b >>> 0)) >>> 0;
const subu32 = (a, b) => ((a >>> 0) - (b >>> 0)) >>> 0;
const andu32 = (a, b) => ((a >>> 0) & (b >>> 0)) >>> 0;
const oru32 = (a, b) => ((a >>> 0) | (b >>> 0)) >>> 0;
const xoru32 = (a, b) => ((a >>> 0) ^ (b >>> 0)) >>> 0;
const notu32 = (a) => ~a >>> 0;
const lshiftu32 = (a, b) => ((a >>> 0) << (b >>> 0)) >>> 0;
const rshiftu32 = (a, b) => ((a >>> 0) >>> (b >>> 0)) >>> 0;

const copysign = (x, y) => Math.sign(y) * Math.abs(x);
const exp2 = (x) => 2 ** x;
const fdim = (x, y) => Math.max(x - y, 0);
const fma = (x, y, z) => x * y + z;
const fmod = (x, y) => x % y;
const frexp = (x) => {
    if (x === 0 || !isFinite(x))
        return [x, 0];
    const abs = Math.abs(x);
    let exp = Math.max(-1023, Math.floor(Math.log2(abs)) + 1);
    let y = abs * 2 ** -exp;
    while (y < 0.5) {
        y *= 2;
        exp--;
    }
    while (y >= 1) {
        y *= 0.5;
        exp++;
    }
    return [x < 0 ? -y : y, exp];
};
const ldexp = (x, exp) => x * 2 ** exp;
const remainder = (x, y) => x - y * Math.round(x / y);

const minError = (fn, error, q, res = 16, iter = 8, start = 0, end = 1, eps = EPS) => {
    if (iter <= 0)
        return (start + end) / 2;
    const delta = (end - start) / res;
    let minT = start;
    let minE = Infinity;
    for (let i = 0; i <= res; i++) {
        const t = start + i * delta;
        const e = error(q, fn(t));
        if (e < minE) {
            if (e <= eps)
                return t;
            minE = e;
            minT = t;
        }
    }
    return minError(fn, error, q, res, iter - 1, Math.max(minT - delta, 0), Math.min(minT + delta, 1));
};

const mix = (a, b, t) => a + (b - a) * t;
const mixBilinear = (a, b, c, d, u, v) => {
    const iu = 1 - u;
    const iv = 1 - v;
    return a * iu * iv + b * u * iv + c * iu * v + d * u * v;
};
const mixQuadratic = (a, b, c, t) => {
    const s = 1 - t;
    return a * s * s + b * 2 * s * t + c * t * t;
};
const mixCubic = (a, b, c, d, t) => {
    const t2 = t * t;
    const s = 1 - t;
    const s2 = s * s;
    return a * s2 * s + b * 3 * s2 * t + c * 3 * t2 * s + d * t2 * t;
};
const mixHermite = (a, b, c, d, t) => {
    const y1 = 0.5 * (c - a);
    const y2 = 1.5 * (b - c) + 0.5 * (d - a);
    return ((y2 * t + a - b + y1 - y2) * t + y1) * t + b;
};
const mixCubicHermite = (a, ta, b, tb, t) => {
    const s = t - 1;
    const t2 = t * t;
    const s2 = s * s;
    const h00 = (1 + 2 * t) * s2;
    const h10 = t * s2;
    const h01 = t2 * (3 - 2 * t);
    const h11 = t2 * s;
    return h00 * a + h10 * ta + h01 * b + h11 * tb;
};
const mixCubicHermiteFromPoints = (a, b, c, d, t) => {
    d *= 0.5;
    const aa = -0.5 * a + 1.5 * b - 1.5 * c + d;
    const bb = a - 2.5 * b + 2 * c - d;
    const cc = -0.5 * a + 0.5 * c;
    const dd = b;
    const t2 = t * t;
    return t * t2 * aa + t2 * bb + t * cc + dd;
};
const mixBicubic = (s00, s01, s02, s03, s10, s11, s12, s13, s20, s21, s22, s23, s30, s31, s32, s33, u, v) => mixCubicHermiteFromPoints(mixCubicHermiteFromPoints(s00, s01, s02, s03, u), mixCubicHermiteFromPoints(s10, s11, s12, s13, u), mixCubicHermiteFromPoints(s20, s21, s22, s23, u), mixCubicHermiteFromPoints(s30, s31, s32, s33, u), v);
const tangentCardinal = (prev, next, scale = 0.5, ta = 0, tc = 2) => scale * ((next - prev) / (tc - ta));
const tangentDiff3 = (prev, curr, next, ta = 0, tb = 1, tc = 2) => 0.5 * ((next - curr) / (tc - tb) + (curr - prev) / (tb - ta));
const tween = (f, from, to) => (t) => mix(from, to, f(t));
const circular = (t) => {
    t = 1 - t;
    return Math.sqrt(1 - t * t);
};
const invCircular = (t) => 1 - circular(1 - t);
const lens = (pos, strength, t) => {
    const impl = strength > 0 ? invCircular : circular;
    const tp = 1 - pos;
    const tl = t <= pos ? impl(t / pos) * pos : 1 - impl((1 - t) / tp) * tp;
    return mix(t, tl, Math.abs(strength));
};
const cosine = (t) => 1 - (Math.cos(t * PI) * 0.5 + 0.5);
const decimated = (n, t) => Math.floor(t * n) / n;
const bounce = (k, amp, t) => {
    const tk = t * k;
    return 1 - ((amp * Math.sin(tk)) / tk) * Math.cos(t * HALF_PI);
};
const ease = (ease, t) => Math.pow(t, ease);
const impulse = (k, t) => {
    const h = k * t;
    return h * Math.exp(1 - h);
};
const gain = (k, t) => t < 0.5 ? 0.5 * Math.pow(2 * t, k) : 1 - 0.5 * Math.pow(2 - 2 * t, k);
const parabola = (k, t) => Math.pow(4.0 * t * (1.0 - t), k);
const cubicPulse = (w, c, t) => {
    t = Math.abs(t - c);
    return t > w ? 0 : ((t /= w), 1 - t * t * (3 - 2 * t));
};
const sinc = (t) => (t !== 0 ? Math.sin(t) / t : 1);
const sincNormalized = (k, t) => sinc(PI * k * t);
const lanczos = (a, t) => t !== 0 ? (-a < t && t < a ? sinc(PI * t) * sinc((PI * t) / a) : 0) : 1;
const sigmoid = (bias, k, t) => t != bias ? 1 / (1 + Math.exp(-k * (t - bias))) : 0.5;
const sigmoid01 = (k, t) => sigmoid(0.5, k, t);
const sigmoid11 = (k, t) => sigmoid(0, k, t);
const schlick = (a, b, t) => t <= b
    ? (b * t) / (t + a * (b - t) + EPS)
    : ((1 - b) * (t - 1)) / (1 - t - a * (b - t) + EPS) + 1;
const expFactor = (a, b, num) => (b / a) ** (1 / num);
const gaussian = (bias, sigma, t) => Math.exp(-((t - bias) ** 2) / (2 * sigma * sigma));

const mod = (a, b) => a - b * Math.floor(a / b);
const fract = (x) => x - Math.floor(x);
const trunc = (x) => (x < 0 ? Math.ceil(x) : Math.floor(x));
const roundTo = (x, prec = 1) => Math.round(x / prec) * prec;
const floorTo = (x, prec = 1) => Math.floor(x / prec) * prec;
const ceilTo = (x, prec = 1) => Math.ceil(x / prec) * prec;
const roundEps = (x, eps = EPS) => {
    const f = fract(x);
    return f <= eps || f >= 1 - eps ? Math.round(x) : x;
};

const simplifyRatio = (num, denom) => {
    let e1 = Math.abs(num);
    let e2 = Math.abs(denom);
    while (true) {
        if (e1 < e2) {
            const t = e1;
            e1 = e2;
            e2 = t;
        }
        const r = e1 % e2;
        if (r) {
            e1 = r;
        }
        else {
            return [num / e2, denom / e2];
        }
    }
};

const safeDiv = (a, b) => (b !== 0 ? a / b : 0);

const derivative = (f, eps = EPS) => (x) => (f(x + eps) - f(x)) / eps;
const solveLinear = (a, b) => safeDiv(-b, a);
const solveQuadratic = (a, b, c, eps = 1e-9) => {
    const d = 2 * a;
    let r = b * b - 4 * a * c;
    return r < 0
        ? []
        : r < eps
            ? [-b / d]
            : ((r = Math.sqrt(r)), [(-b - r) / d, (-b + r) / d]);
};
const solveCubic = (a, b, c, d, eps = 1e-9) => {
    const aa = a * a;
    const bb = b * b;
    const ba3 = b / (3 * a);
    const p = (3 * a * c - bb) / (3 * aa);
    const q = (2 * bb * b - 9 * a * b * c + 27 * aa * d) / (27 * aa * a);
    if (Math.abs(p) < eps) {
        return [Math.cbrt(-q) - ba3];
    }
    else if (Math.abs(q) < eps) {
        return p < 0
            ? [-Math.sqrt(-p) - ba3, -ba3, Math.sqrt(-p) - ba3]
            : [-ba3];
    }
    else {
        const denom = (q * q) / 4 + (p * p * p) / 27;
        if (Math.abs(denom) < eps) {
            return [(-1.5 * q) / p - ba3, (3 * q) / p - ba3];
        }
        else if (denom > 0) {
            const u = Math.cbrt(-q / 2 - Math.sqrt(denom));
            return [u - p / (3 * u) - ba3];
        }
        else {
            const u = 2 * Math.sqrt(-p / 3), t = Math.acos((3 * q) / p / u) / 3, k = (2 * Math.PI) / 3;
            return [
                u * Math.cos(t) - ba3,
                u * Math.cos(t - k) - ba3,
                u * Math.cos(t - 2 * k) - ba3,
            ];
        }
    }
};

const step = (edge, x) => (x < edge ? 0 : 1);
const smoothStep = (edge, edge2, x) => {
    x = clamp01((x - edge) / (edge2 - edge));
    return (3 - 2 * x) * x * x;
};
const smootherStep = (edge, edge2, x) => {
    x = clamp01((x - edge) / (edge2 - edge));
    return x * x * x * (x * (x * 6 - 15) + 10);
};
const expStep = (k, n, x) => 1 - Math.exp(-k * Math.pow(x, n));

exports.DEG2RAD = DEG2RAD;
exports.EPS = EPS;
exports.HALF_PI = HALF_PI;
exports.INV_HALF_PI = INV_HALF_PI;
exports.INV_PI = INV_PI;
exports.INV_TAU = INV_TAU;
exports.PHI = PHI;
exports.PI = PI;
exports.QUARTER_PI = QUARTER_PI;
exports.RAD2DEG = RAD2DEG;
exports.SIXTH = SIXTH;
exports.SIXTH_PI = SIXTH_PI;
exports.SQRT2 = SQRT2;
exports.SQRT2_2 = SQRT2_2;
exports.SQRT2_3 = SQRT2_3;
exports.SQRT3 = SQRT3;
exports.TAU = TAU;
exports.THIRD = THIRD;
exports.THIRD_PI = THIRD_PI;
exports.TWO_THIRD = TWO_THIRD;
exports.absDiff = absDiff;
exports.absInnerAngle = absInnerAngle;
exports.absMax = absMax;
exports.absMin = absMin;
exports.absTheta = absTheta;
exports.addi16 = addi16;
exports.addi32 = addi32;
exports.addi8 = addi8;
exports.addu16 = addu16;
exports.addu32 = addu32;
exports.addu8 = addu8;
exports.andi16 = andi16;
exports.andi32 = andi32;
exports.andi8 = andi8;
exports.andu16 = andu16;
exports.andu32 = andu32;
exports.andu8 = andu8;
exports.angleDist = angleDist;
exports.atan2Abs = atan2Abs;
exports.bounce = bounce;
exports.ceilTo = ceilTo;
exports.circular = circular;
exports.clamp = clamp;
exports.clamp0 = clamp0;
exports.clamp01 = clamp01;
exports.clamp05 = clamp05;
exports.clamp11 = clamp11;
exports.classifyCrossing = classifyCrossing;
exports.copysign = copysign;
exports.cosine = cosine;
exports.cossin = cossin;
exports.cot = cot;
exports.csc = csc;
exports.cubicPulse = cubicPulse;
exports.decimated = decimated;
exports.deg = deg;
exports.derivative = derivative;
exports.divi16 = divi16;
exports.divi32 = divi32;
exports.divi8 = divi8;
exports.divu16 = divu16;
exports.divu32 = divu32;
exports.divu8 = divu8;
exports.ease = ease;
exports.eqDelta = eqDelta;
exports.eqDeltaScaled = eqDeltaScaled;
exports.exp2 = exp2;
exports.expFactor = expFactor;
exports.expStep = expStep;
exports.fastCos = fastCos;
exports.fastSin = fastSin;
exports.fdim = fdim;
exports.fit = fit;
exports.fit01 = fit01;
exports.fit10 = fit10;
exports.fit11 = fit11;
exports.fitClamped = fitClamped;
exports.floorTo = floorTo;
exports.fma = fma;
exports.fmod = fmod;
exports.foldback = foldback;
exports.fract = fract;
exports.frexp = frexp;
exports.gain = gain;
exports.gaussian = gaussian;
exports.impulse = impulse;
exports.inOpenRange = inOpenRange;
exports.inRange = inRange;
exports.invCircular = invCircular;
exports.isCrossOver = isCrossOver;
exports.isCrossUnder = isCrossUnder;
exports.isMaxima = isMaxima;
exports.isMinima = isMinima;
exports.lanczos = lanczos;
exports.ldexp = ldexp;
exports.lens = lens;
exports.loc = loc;
exports.lshifti16 = lshifti16;
exports.lshifti32 = lshifti32;
exports.lshifti8 = lshifti8;
exports.lshiftu16 = lshiftu16;
exports.lshiftu32 = lshiftu32;
exports.lshiftu8 = lshiftu8;
exports.max2id = max2id;
exports.max3id = max3id;
exports.max4id = max4id;
exports.maximaIndex = maximaIndex;
exports.maximaIndices = maximaIndices;
exports.min2id = min2id;
exports.min3id = min3id;
exports.min4id = min4id;
exports.minError = minError;
exports.minNonZero2 = minNonZero2;
exports.minNonZero3 = minNonZero3;
exports.minimaIndex = minimaIndex;
exports.minimaIndices = minimaIndices;
exports.mix = mix;
exports.mixBicubic = mixBicubic;
exports.mixBilinear = mixBilinear;
exports.mixCubic = mixCubic;
exports.mixCubicHermite = mixCubicHermite;
exports.mixCubicHermiteFromPoints = mixCubicHermiteFromPoints;
exports.mixHermite = mixHermite;
exports.mixQuadratic = mixQuadratic;
exports.mod = mod;
exports.muli16 = muli16;
exports.muli32 = muli32;
exports.muli8 = muli8;
exports.mulu16 = mulu16;
exports.mulu32 = mulu32;
exports.mulu8 = mulu8;
exports.norm = norm;
exports.normCos = normCos;
exports.noti16 = noti16;
exports.noti32 = noti32;
exports.noti8 = noti8;
exports.notu16 = notu16;
exports.notu32 = notu32;
exports.notu8 = notu8;
exports.ori16 = ori16;
exports.ori32 = ori32;
exports.ori8 = ori8;
exports.oru16 = oru16;
exports.oru32 = oru32;
exports.oru8 = oru8;
exports.parabola = parabola;
exports.quadrant = quadrant;
exports.rad = rad;
exports.remainder = remainder;
exports.roundEps = roundEps;
exports.roundTo = roundTo;
exports.rshifti16 = rshifti16;
exports.rshifti32 = rshifti32;
exports.rshifti8 = rshifti8;
exports.rshiftu16 = rshiftu16;
exports.rshiftu32 = rshiftu32;
exports.rshiftu8 = rshiftu8;
exports.safeDiv = safeDiv;
exports.schlick = schlick;
exports.sclamp = sclamp;
exports.sec = sec;
exports.sigmoid = sigmoid;
exports.sigmoid01 = sigmoid01;
exports.sigmoid11 = sigmoid11;
exports.sign = sign;
exports.signExtend16 = signExtend16;
exports.signExtend8 = signExtend8;
exports.simplifyRatio = simplifyRatio;
exports.sinc = sinc;
exports.sincNormalized = sincNormalized;
exports.sincos = sincos;
exports.smax = smax;
exports.smin = smin;
exports.smoothStep = smoothStep;
exports.smootherStep = smootherStep;
exports.solveCubic = solveCubic;
exports.solveLinear = solveLinear;
exports.solveQuadratic = solveQuadratic;
exports.step = step;
exports.subi16 = subi16;
exports.subi32 = subi32;
exports.subi8 = subi8;
exports.subu16 = subu16;
exports.subu32 = subu32;
exports.subu8 = subu8;
exports.tangentCardinal = tangentCardinal;
exports.tangentDiff3 = tangentDiff3;
exports.trunc = trunc;
exports.tween = tween;
exports.wrap = wrap;
exports.wrap01 = wrap01;
exports.wrap11 = wrap11;
exports.wrapOnce = wrapOnce;
exports.xori16 = xori16;
exports.xori32 = xori32;
exports.xori8 = xori8;
exports.xoru16 = xoru16;
exports.xoru32 = xoru32;
exports.xoru8 = xoru8;

},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var checks = require('@thi.ng/checks');
var api = require('@thi.ng/api');
var hex = require('@thi.ng/hex');

const INV_MAX = 1 / 0xffffffff;
class ARandom {
    float(norm = 1) {
        return this.int() * INV_MAX * norm;
    }
    norm(norm = 1) {
        return (this.int() * INV_MAX - 0.5) * 2 * norm;
    }
    minmax(min, max) {
        return this.float() * (max - min) + min;
    }
}

const random = Math.random;
class SystemRandom extends ARandom {
    int() {
        return (random() * 4294967296)  >>> 0;
    }
    float(norm = 1) {
        return random() * norm;
    }
    norm(norm = 1) {
        return (random() - 0.5) * 2 * norm;
    }
}
const SYSTEM = new SystemRandom();

const randomBytesFrom = (rnd, buf, start = 0, end = buf.length) => {
    for (let i = end; --i >= start;) {
        buf[i] = rnd.int() & 0xff;
    }
    return buf;
};
const randomBytes = checks.hasCrypto()
    ? (buf, start = 0, end = buf.length) => (window.crypto.getRandomValues(buf.subarray(start, end)), buf)
    : (buf, start, end) => randomBytesFrom(SYSTEM, buf, start, end);

class Crypto extends ARandom {
    constructor(size = 64) {
        super();
        this.buffer = new Uint8Array((size + 3) & ~3);
        this.u32 = new Uint32Array(this.buffer.buffer);
        this.i = size >>> 2;
    }
    copy() {
        return new Crypto(this.buffer.length);
    }
    bytes() {
        return new Uint8Array(this.buffer.buffer);
    }
    int() {
        if (this.i >= this.u32.length) {
            randomBytes(this.buffer);
            this.i = 0;
        }
        return this.u32[this.i++];
    }
}
const CRYPTO = new Crypto();

const DEFAULT_SEED_32 = 0xdecafbad;
const DEFAULT_SEED_128 = [
    0xdecafbad,
    0x2fa9d75b,
    0xe41f67e3,
    0x5c83ec1a,
];
const DEFAULT_SEED_160 = [...DEFAULT_SEED_128, 0xf69a5c71];

class Smush32 extends ARandom {
    constructor(seed = DEFAULT_SEED_32) {
        super();
        this.buffer = new Uint32Array([seed, 0]);
    }
    copy() {
        const gen = new Smush32();
        gen.buffer.set(this.buffer);
        return gen;
    }
    seed(s) {
        this.buffer.set([s, 0]);
        return this;
    }
    int() {
        const b = this.buffer;
        const m = 0x5bd1e995;
        const k = (b[1]++ * m) >>> 0;
        const s = (b[0] = ((k ^ (k >> 24) ^ ((b[0] * m) >>> 0)) * m) >>> 0);
        return (s ^ (s >>> 13)) >>> 0;
    }
}

class Xoshiro128 extends ARandom {
    constructor(seed = DEFAULT_SEED_128) {
        super();
        this.buffer = new Uint32Array(4);
        this.seed(seed);
    }
    copy() {
        return new Xoshiro128(this.buffer);
    }
    bytes() {
        return new Uint8Array(this.buffer.buffer);
    }
    seed(seed) {
        this.buffer.set(seed);
        return this;
    }
    int() {
        const s = this.buffer;
        let t = s[0] + s[3];
        const res = ((t << 7) | (t >>> 25)) >>> 0;
        t = s[1] << 9;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        t = s[3];
        s[3] = ((t << 11) | (t >>> 21)) >>> 0;
        return res;
    }
}

class XorShift128 extends ARandom {
    constructor(seed = DEFAULT_SEED_128) {
        super();
        this.buffer = new Uint32Array(4);
        this.seed(seed);
    }
    copy() {
        return new XorShift128(this.buffer);
    }
    bytes() {
        return new Uint8Array(this.buffer.buffer);
    }
    seed(seed) {
        this.buffer.set(seed);
        return this;
    }
    int() {
        const s = this.buffer;
        let t = s[3];
        let w;
        t ^= t << 11;
        t ^= t >>> 8;
        s[3] = s[2];
        s[2] = s[1];
        w = s[1] = s[0];
        return (s[0] = (t ^ w ^ (w >>> 19)) >>> 0);
    }
}

class XorWow extends ARandom {
    constructor(seed = DEFAULT_SEED_160) {
        super();
        this.buffer = new Uint32Array(5);
        this.seed(seed);
    }
    copy() {
        return new XorWow(this.buffer);
    }
    seed(seed) {
        this.buffer.set(seed);
        return this;
    }
    bytes() {
        return new Uint8Array(this.buffer.buffer);
    }
    int() {
        const s = this.buffer;
        let t = s[3];
        let w;
        t ^= t >>> 2;
        t ^= t << 1;
        s[3] = s[2];
        s[2] = s[1];
        w = s[1] = s[0];
        t ^= w;
        t ^= w << 4;
        s[0] = t;
        return (t + (s[4] += 0x587c5)) >>> 0;
    }
}

class XsAdd extends ARandom {
    constructor(seed = DEFAULT_SEED_32) {
        super();
        this.buffer = new Uint32Array(4);
        this.seed(seed);
    }
    bytes() {
        return new Uint8Array(this.buffer.buffer);
    }
    copy() {
        const gen = new XsAdd();
        gen.buffer.set(this.buffer);
        return gen;
    }
    seed(seed) {
        const s = this.buffer;
        s.set([seed, 0, 0, 0]);
        for (let j = 0, i = 1; i < 8; j = i++) {
            let x = (s[j & 3] ^ (s[j & 3] >>> 30)) >>> 0;
            x = (0x8965 * x + (((0x6c07 * x) & 0xffff) << 16)) >>> 0;
            s[i & 3] ^= (i + x) >>> 0;
        }
        return this;
    }
    int() {
        const s = this.buffer;
        let t = s[0];
        t ^= t << 15;
        t ^= t >>> 18;
        t ^= s[3] << 11;
        s[0] = s[1];
        s[1] = s[2];
        s[2] = s[3];
        s[3] = t;
        return (t + s[2]) >>> 0;
    }
}

const coin = (rnd = SYSTEM) => rnd.float() < 0.5;
const fairCoin = (rnd = SYSTEM) => {
    let a, b;
    do {
        a = coin(rnd);
        b = coin(rnd);
    } while (a === b);
    return a;
};

const randomID = (len = 4, prefix = "", syms = "abcdefghijklmnopqrstuvwxyz", rnd = SYSTEM) => {
    const n = syms.length;
    for (; --len >= 0;) {
        prefix += syms[rnd.int() % n];
    }
    return prefix;
};

const uniqueValuesFrom = (k, fn, existing = [], maxTrials = 100) => {
    let n = 0;
    while (n < k) {
        let i;
        let trials = maxTrials;
        do {
            i = fn();
        } while (existing.includes(i) && --trials > 0);
        if (trials <= 0)
            break;
        existing.push(i);
        n++;
    }
    return existing;
};
const uniqueIndices = (k, max, existing, maxTrials = max, rnd = SYSTEM) => {
    api.assert(k >= 0 && k <= max, `k must be in [0, ${max}] interval`);
    return uniqueValuesFrom(k, () => rnd.int() % max, existing, maxTrials);
};

const uuidv4Bytes = (buf, rnd) => {
    buf = buf || new Uint8Array(16);
    buf = rnd ? randomBytesFrom(rnd, buf) : randomBytes(buf);
    buf[6] = 0x40 | (buf[6] & 0x0f);
    buf[8] = 0x80 | (buf[8] & 0x3f);
    return buf;
};
const uuid = (id, i = 0) => hex.uuid(id || uuidv4Bytes(), i);

const weightedRandom = (choices, weights, rnd = SYSTEM) => {
    const n = choices.length;
    api.assert(n > 0, "no choices given");
    const opts = weights
        ? choices
            .map((x, i) => [weights[i] || 0, x])
            .sort((a, b) => b[0] - a[0])
        : choices.map((x) => [1, x]);
    const total = opts.reduce((acc, o) => acc + o[0], 0);
    total <= 0 && console.warn("total weights <= 0");
    return () => {
        const r = rnd.float(total);
        let sum = total;
        for (let i = 0; i < n; i++) {
            sum -= opts[i][0];
            if (sum <= r) {
                return opts[i][1];
            }
        }
        return undefined;
    };
};

const exponential = (rnd = SYSTEM, lambda = 10) => lambda === 0 ? () => Infinity : () => -Math.log(1 - rnd.float(1)) / lambda;

const gaussian = (rnd = SYSTEM, n = 24, offset = 0, scale = 1) => () => {
    let sum = 0;
    let m = n;
    while (m-- > 0)
        sum += rnd.norm(scale);
    return sum / n + offset;
};

const geometric = (rnd = SYSTEM, p = 0.5) => p <= 0
    ? () => Infinity
    : p >= 1
        ? () => 1
        : ((p = Math.log(1 - p)),
            () => Math.floor(Math.log(1 - rnd.float(1)) / p) + 1);

const normal = (rnd = SYSTEM, bias = 0, sigma = 1) => {
    let a;
    let b;
    let r;
    return () => {
        if (a != null) {
            b = a;
            a = null;
        }
        else {
            do {
                a = rnd.norm();
                b = rnd.norm();
                r = a * a + b * b;
            } while (r > 1 || r === 0);
        }
        return bias + sigma * b * Math.sqrt((-2 * Math.log(r)) / r);
    };
};

const uniform = (rnd = SYSTEM, min = 0, max = 1) => () => rnd.minmax(min, max);

exports.ARandom = ARandom;
exports.CRYPTO = CRYPTO;
exports.Crypto = Crypto;
exports.SYSTEM = SYSTEM;
exports.Smush32 = Smush32;
exports.SystemRandom = SystemRandom;
exports.XorShift128 = XorShift128;
exports.XorWow = XorWow;
exports.Xoshiro128 = Xoshiro128;
exports.XsAdd = XsAdd;
exports.coin = coin;
exports.exponential = exponential;
exports.fairCoin = fairCoin;
exports.gaussian = gaussian;
exports.geometric = geometric;
exports.normal = normal;
exports.randomBytes = randomBytes;
exports.randomBytesFrom = randomBytesFrom;
exports.randomID = randomID;
exports.uniform = uniform;
exports.uniqueIndices = uniqueIndices;
exports.uniqueValuesFrom = uniqueValuesFrom;
exports.uuid = uuid;
exports.uuidv4Bytes = uuidv4Bytes;
exports.weightedRandom = weightedRandom;

},{"@thi.ng/api":2,"@thi.ng/checks":5,"@thi.ng/hex":10}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var transducers = require('@thi.ng/transducers');
var binary = require('@thi.ng/binary');
var errors = require('@thi.ng/errors');
var compose = require('@thi.ng/compose');
var hex = require('@thi.ng/hex');
var random = require('@thi.ng/random');

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_SAFE = B64_CHARS.substr(0, 62) + "-_";
function base64Decode(src) {
    return src
        ? transducers.iterator1(base64Decode(), src)
        : (rfn) => {
            const r = rfn[2];
            let bc = 0, bs = 0;
            return transducers.compR(rfn, (acc, x) => {
                switch (x) {
                    case "-":
                        x = "+";
                        break;
                    case "_":
                        x = "/";
                        break;
                    case "=":
                        return transducers.reduced(acc);
                }
                let y = B64_CHARS.indexOf(x);
                bs = bc & 3 ? (bs << 6) + y : y;
                if (bc++ & 3) {
                    acc = r(acc, 255 & (bs >> ((-2 * bc) & 6)));
                }
                return acc;
            });
        };
}
function base64Encode(...args) {
    const iter = transducers.$iter(base64Encode, args, transducers.iterator);
    if (iter) {
        return [...iter].join("");
    }
    return ([init, complete, reduce]) => {
        let state = 0;
        let b;
        const opts = Object.assign({ safe: false, buffer: 1024 }, args[0]);
        const chars = opts.safe ? B64_SAFE : B64_CHARS;
        const buf = [];
        return [
            init,
            (acc) => {
                switch (state) {
                    case 1:
                        buf.push(chars[(b >> 18) & 0x3f], chars[(b >> 12) & 0x3f], "=", "=");
                        break;
                    case 2:
                        buf.push(chars[(b >> 18) & 0x3f], chars[(b >> 12) & 0x3f], chars[(b >> 6) & 0x3f], "=");
                        break;
                }
                while (buf.length && !transducers.isReduced(acc)) {
                    acc = reduce(acc, buf.shift());
                }
                return complete(acc);
            },
            (acc, x) => {
                switch (state) {
                    case 0:
                        state = 1;
                        b = x << 16;
                        break;
                    case 1:
                        state = 2;
                        b += x << 8;
                        break;
                    default:
                        state = 0;
                        b += x;
                        buf.push(chars[(b >> 18) & 0x3f], chars[(b >> 12) & 0x3f], chars[(b >> 6) & 0x3f], chars[b & 0x3f]);
                        if (buf.length >= opts.buffer) {
                            for (let i = 0, n = buf.length; i < n && !transducers.isReduced(acc); i++) {
                                acc = reduce(acc, buf[i]);
                            }
                            buf.length = 0;
                        }
                }
                return acc;
            },
        ];
    };
}

function utf8Decode(src) {
    return src
        ? [...transducers.iterator1(utf8Decode(), src)].join("")
        : (rfn) => {
            const r = rfn[2];
            let state = 0;
            let u0;
            let u1;
            let u2;
            let u3;
            let u4;
            return transducers.compR(rfn, (acc, x) => {
                switch (state) {
                    case 0:
                    default:
                        if (x < 0x80) {
                            return r(acc, String.fromCharCode(x));
                        }
                        u0 = x;
                        state = 1;
                        break;
                    case 1:
                        u1 = x & 0x3f;
                        if ((u0 & 0xe0) === 0xc0) {
                            state = 0;
                            return r(acc, String.fromCharCode(((u0 & 0x1f) << 6) | u1));
                        }
                        state = 2;
                        break;
                    case 2:
                        u2 = x & 0x3f;
                        if ((u0 & 0xf0) === 0xe0) {
                            state = 0;
                            return r(acc, String.fromCharCode(((u0 & 0x0f) << 12) | (u1 << 6) | u2));
                        }
                        state = 3;
                        break;
                    case 3:
                        u3 = x & 0x3f;
                        if ((u0 & 0xf8) === 0xf0) {
                            state = 0;
                            return r(acc, codePoint(((u0 & 7) << 18) |
                                (u1 << 12) |
                                (u2 << 6) |
                                u3));
                        }
                        state = 4;
                        break;
                    case 4:
                        u4 = x & 0x3f;
                        if ((u0 & 0xfc) === 0xf8) {
                            state = 0;
                            return r(acc, codePoint(((u0 & 3) << 24) |
                                (u1 << 18) |
                                (u2 << 12) |
                                (u3 << 6) |
                                u4));
                        }
                        state = 5;
                        break;
                    case 5:
                        state = 0;
                        return r(acc, codePoint(((u0 & 1) << 30) |
                            (u1 << 24) |
                            (u2 << 18) |
                            (u3 << 12) |
                            (u4 << 6) |
                            (x & 0x3f)));
                }
                return acc;
            });
        };
}
function utf8Encode(src) {
    return src != null
        ? transducers.iterator(utf8Encode(), src)
        : (rfn) => {
            const r = rfn[2];
            return transducers.compR(rfn, (acc, x) => {
                let u = x.charCodeAt(0), buf;
                if (u >= 0xd800 && u <= 0xdfff) {
                    u =
                        (0x10000 + ((u & 0x3ff) << 10)) |
                            (x.charCodeAt(1) & 0x3ff);
                }
                if (u < 0x80) {
                    return r(acc, u);
                }
                else if (u < 0x800) {
                    buf = [0xc0 | (u >> 6), 0x80 | (u & 0x3f)];
                }
                else if (u < 0x10000) {
                    buf = [
                        0xe0 | (u >> 12),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f),
                    ];
                }
                else if (u < 0x200000) {
                    buf = [
                        0xf0 | (u >> 18),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f),
                    ];
                }
                else if (u < 0x4000000) {
                    buf = [
                        0xf8 | (u >> 24),
                        0x80 | ((u >> 18) & 0x3f),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f),
                    ];
                }
                else {
                    buf = [
                        0xfc | (u >> 30),
                        0x80 | ((u >> 24) & 0x3f),
                        0x80 | ((u >> 18) & 0x3f),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f),
                    ];
                }
                for (let i = 0, n = buf.length; i < n; i++) {
                    acc = r(acc, buf[i]);
                    if (transducers.isReduced(acc)) {
                        break;
                    }
                }
                return acc;
            });
        };
}
const codePoint = (x) => x < 0x10000
    ? String.fromCharCode(x)
    : ((x -= 0x10000),
        String.fromCharCode(0xd800 | (x >> 10), 0xdc00 | (x & 0x3ff)));
const utf8Length = (str) => {
    const n = str.length;
    let len = 0;
    for (let i = 0; i < n; ++i) {
        let u = str.charCodeAt(i);
        if (u >= 0xd800 && u <= 0xdfff) {
            u = (0x10000 + ((u & 0x3ff) << 10)) | (str.charCodeAt(++i) & 0x3ff);
        }
        len +=
            u <= 0x7f
                ? 1
                : u <= 0x7ff
                    ? 2
                    : u <= 0xffff
                        ? 3
                        : u <= 0x1fffff
                            ? 4
                            : u <= 0x3ffffff
                                ? 5
                                : 6;
    }
    return len;
};

const i8 = (x) => ["i8", x];
const i8array = (x) => ["i8a", x];
const u8 = (x) => ["u8", x];
const u8array = (x) => ["u8a", x];
const i16 = (x, le = false) => ["i16", x, le];
const i16array = (x, le = false) => [
    "i16a",
    x,
    le,
];
const u16 = (x, le = false) => ["u16", x, le];
const u16array = (x, le = false) => [
    "u16a",
    x,
    le,
];
const i24 = (x, le = false) => ["i24", x, le];
const i24array = (x, le = false) => [
    "i24a",
    x,
    le,
];
const u24 = (x, le = false) => ["u24", x, le];
const u24array = (x, le = false) => [
    "u24a",
    x,
    le,
];
const i32 = (x, le = false) => ["i32", x, le];
const i32array = (x, le = false) => [
    "i32a",
    x,
    le,
];
const u32 = (x, le = false) => ["u32", x, le];
const u32array = (x, le = false) => [
    "u32a",
    x,
    le,
];
const f32 = (x, le = false) => ["f32", x, le];
const f32array = (x, le = false) => [
    "f32a",
    x,
    le,
];
const f64 = (x, le = false) => ["f64", x, le];
const f64array = (x, le = false) => [
    "f64a",
    x,
    le,
];
const str = (x) => ["str", x];
function asBytes(src) {
    return src
        ? transducers.iterator(asBytes(), src)
        : transducers.mapcat((x) => {
            const val = x[1];
            const le = x[2];
            switch (x[0]) {
                case "i8":
                case "u8":
                    return [val];
                case "i8a":
                case "u8a":
                    return x[1];
                case "i16":
                case "u16":
                    return binary.bytes16(val, le);
                case "i16a":
                case "u16a":
                    return transducers.mapcat((x) => binary.bytes16(x, le), x[1]);
                case "i24":
                case "u24":
                    return binary.bytes24(val, le);
                case "i24a":
                case "u24a":
                    return transducers.mapcat((x) => binary.bytes24(x, le), x[1]);
                case "i32":
                case "u32":
                    return binary.bytes32(val, le);
                case "i32a":
                case "u32a":
                    return transducers.mapcat((x) => binary.bytes32(x, le), x[1]);
                case "f32":
                    return binary.bytesF32(val, le);
                case "f32a":
                    return transducers.mapcat((x) => binary.bytesF32(x, le), x[1]);
                case "f64":
                    return binary.bytesF64(val, le);
                case "f64a":
                    return transducers.mapcat((x) => binary.bytesF64(x, le), x[1]);
                case "str":
                    return utf8Encode(x[1]);
                default:
                    errors.unsupported(`invalid struct item: ${x[0]}`);
            }
        });
}
function bytes(cap = 1024, src) {
    let view;
    let pos = 0;
    const ensure = (acc, size) => {
        if (pos + size <= cap)
            return acc;
        cap *= 2;
        const buf = new Uint8Array(cap);
        buf.set(acc);
        view = new DataView(buf.buffer);
        return buf;
    };
    const setArray = (fn, stride, acc, x, le) => {
        const n = x.length;
        acc = ensure(acc, stride * n);
        for (let i = 0; i < n; i++, pos += stride) {
            view[fn](pos, x[i], le);
        }
        return acc;
    };
    return src
        ? transducers.reduce(bytes(cap), src)
        : [
            () => new Uint8Array(cap),
            (acc) => acc.subarray(0, pos),
            (acc, [type, x, le = false]) => {
                if (!view || view.buffer !== acc.buffer) {
                    cap = acc.byteLength;
                    view = new DataView(acc.buffer, acc.byteOffset);
                }
                switch (type) {
                    case "i8":
                        acc = ensure(acc, 1);
                        view.setInt8(pos, x);
                        pos++;
                        break;
                    case "i8a": {
                        const n = x.length;
                        acc = ensure(acc, n);
                        new Int8Array(acc.buffer, acc.byteOffset).set(x, pos);
                        pos += n;
                        break;
                    }
                    case "u8":
                        acc = ensure(acc, 1);
                        view.setUint8(pos, x);
                        pos++;
                        break;
                    case "u8a": {
                        const n = x.length;
                        acc = ensure(acc, n);
                        acc.set(x, pos);
                        pos += n;
                        break;
                    }
                    case "i16":
                        acc = ensure(acc, 2);
                        view.setInt16(pos, x, le);
                        pos += 2;
                        break;
                    case "i16a":
                        acc = setArray("setInt16", 2, acc, x, le);
                        break;
                    case "u16":
                        acc = ensure(acc, 2);
                        view.setUint16(pos, x, le);
                        pos += 2;
                        break;
                    case "u16a":
                        acc = setArray("setUint16", 2, acc, x, le);
                        break;
                    case "i24":
                        acc = ensure(acc, 4);
                        view.setInt32(pos, x, le);
                        pos += 3;
                        break;
                    case "i24a":
                        acc = setArray("setInt32", 3, acc, x, le);
                        break;
                    case "u24":
                        acc = ensure(acc, 4);
                        view.setUint32(pos, x, le);
                        pos += 3;
                        break;
                    case "u24a":
                        acc = setArray("setUint32", 3, acc, x, le);
                        break;
                    case "i32":
                        acc = ensure(acc, 4);
                        view.setInt32(pos, x, le);
                        pos += 4;
                        break;
                    case "i32a":
                        acc = setArray("setInt32", 4, acc, x, le);
                        break;
                    case "u32":
                        acc = ensure(acc, 4);
                        view.setUint32(pos, x, le);
                        pos += 4;
                        break;
                    case "u32a":
                        acc = setArray("setUint32", 4, acc, x, le);
                        break;
                    case "f32":
                        acc = ensure(acc, 4);
                        view.setFloat32(pos, x, le);
                        pos += 4;
                        break;
                    case "f32a":
                        acc = setArray("setFloat32", 4, acc, x, le);
                        break;
                    case "f64":
                        acc = ensure(acc, 8);
                        view.setFloat64(pos, x, le);
                        pos += 8;
                        break;
                    case "f64a":
                        acc = setArray("setFloat64", 8, acc, x, le);
                        break;
                    case "str": {
                        let utf = [...utf8Encode(x)];
                        acc = ensure(acc, utf.length);
                        acc.set(utf, pos);
                        pos += utf.length;
                        break;
                    }
                }
                return acc;
            },
        ];
}

function bits(...args) {
    return (transducers.$iter(bits, args, transducers.iterator) ||
        ((rfn) => {
            const reduce = rfn[2];
            const size = args[0] || 8;
            const msb = args[1] !== false;
            return transducers.compR(rfn, msb
                ? (acc, x) => {
                    for (let i = size; --i >= 0 && !transducers.isReduced(acc);) {
                        acc = reduce(acc, (x >>> i) & 1);
                    }
                    return acc;
                }
                : (acc, x) => {
                    for (let i = 0; i < size && !transducers.isReduced(acc); i++) {
                        acc = reduce(acc, (x >>> i) & 1);
                    }
                    return acc;
                });
        }));
}

function hexDump(...args) {
    const iter = transducers.$iter(hexDump, args, transducers.iterator);
    if (iter) {
        return iter;
    }
    const { cols, address } = Object.assign({ cols: 16, address: 0 }, args[0]);
    return transducers.comp(transducers.padLast(cols, 0), transducers.map(compose.juxt(hex.U8, (x) => (x > 31 && x < 127 ? String.fromCharCode(x) : "."))), transducers.partition(cols, true), transducers.map(compose.juxt((x) => x.map((y) => y[0]).join(" "), (x) => x.map((y) => y[1]).join(""))), transducers.mapIndexed((i, [h, a]) => `${hex.U32(address + i * cols)} | ${h} | ${a}`));
}
const hexDumpString = (opts, src) => [...hexDump(opts, src)].join("\n");

function partitionBits(...args) {
    return (transducers.$iter(partitionBits, args, transducers.iterator) ||
        ((rfn) => {
            const destSize = args[0];
            const srcSize = args[1] || 8;
            return destSize < srcSize
                ? small(rfn, destSize, srcSize)
                : destSize > srcSize
                    ? large(rfn, destSize, srcSize)
                    : rfn;
        }));
}
const small = ([init, complete, reduce], n, wordSize) => {
    const maxb = wordSize - n;
    const m1 = (1 << wordSize) - 1;
    const m2 = (1 << n) - 1;
    let r = 0;
    let y = 0;
    return [
        init,
        (acc) => complete(r > 0 ? reduce(acc, y) : acc),
        (acc, x) => {
            let b = 0;
            do {
                acc = reduce(acc, y + ((x >>> (maxb + r)) & m2));
                b += n - r;
                x = (x << (n - r)) & m1;
                y = 0;
                r = 0;
            } while (b <= maxb && !transducers.isReduced(acc));
            r = wordSize - b;
            y = r > 0 ? (x >>> maxb) & m2 : 0;
            return acc;
        },
    ];
};
const large = ([init, complete, reduce], n, wordSize) => {
    const m1 = (1 << wordSize) - 1;
    let r = 0;
    let y = 0;
    return [
        init,
        (acc) => complete(r > 0 ? reduce(acc, y) : acc),
        (acc, x) => {
            if (r + wordSize <= n) {
                y |= (x & m1) << (n - wordSize - r);
                r += wordSize;
                if (r === n) {
                    acc = reduce(acc, y);
                    y = 0;
                    r = 0;
                }
            }
            else {
                const k = n - r;
                r = wordSize - k;
                acc = reduce(acc, y | ((x >>> r) & ((1 << k) - 1)));
                y = (x & ((1 << r) - 1)) << (n - r);
            }
            return acc;
        },
    ];
};

const randomBits = (prob, num, rnd = random.SYSTEM) => transducers.repeatedly(() => (rnd.float() < prob ? 1 : 0), num);

exports.asBytes = asBytes;
exports.base64Decode = base64Decode;
exports.base64Encode = base64Encode;
exports.bits = bits;
exports.bytes = bytes;
exports.f32 = f32;
exports.f32array = f32array;
exports.f64 = f64;
exports.f64array = f64array;
exports.hexDump = hexDump;
exports.hexDumpString = hexDumpString;
exports.i16 = i16;
exports.i16array = i16array;
exports.i24 = i24;
exports.i24array = i24array;
exports.i32 = i32;
exports.i32array = i32array;
exports.i8 = i8;
exports.i8array = i8array;
exports.partitionBits = partitionBits;
exports.randomBits = randomBits;
exports.str = str;
exports.u16 = u16;
exports.u16array = u16array;
exports.u24 = u24;
exports.u24array = u24array;
exports.u32 = u32;
exports.u32array = u32array;
exports.u8 = u8;
exports.u8array = u8array;
exports.utf8Decode = utf8Decode;
exports.utf8Encode = utf8Encode;
exports.utf8Length = utf8Length;

},{"@thi.ng/binary":4,"@thi.ng/compose":7,"@thi.ng/errors":9,"@thi.ng/hex":10,"@thi.ng/random":13,"@thi.ng/transducers":15}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var api = require('@thi.ng/api');
var checks = require('@thi.ng/checks');
var errors = require('@thi.ng/errors');
var compose = require('@thi.ng/compose');
var compare = require('@thi.ng/compare');
var math = require('@thi.ng/math');
var arrays = require('@thi.ng/arrays');
var random = require('@thi.ng/random');

const ensureTransducer = (x) => checks.implementsFunction(x, "xform") ? x.xform() : x;

class Reduced {
    constructor(val) {
        this.value = val;
    }
    deref() {
        return this.value;
    }
}
const reduced = (x) => new Reduced(x);
const isReduced = (x) => x instanceof Reduced;
const ensureReduced = (x) => x instanceof Reduced ? x : new Reduced(x);
const unreduced = (x) => (x instanceof Reduced ? x.deref() : x);

const parseArgs = (args) => args.length === 2
    ? [undefined, args[1]]
    : args.length === 3
        ? [args[1], args[2]]
        : errors.illegalArity(args.length);
function reduce(...args) {
    const rfn = args[0];
    const init = rfn[0];
    const complete = rfn[1];
    const reduce = rfn[2];
    args = parseArgs(args);
    const acc = args[0] == null ? init() : args[0];
    const xs = args[1];
    return unreduced(complete(checks.implementsFunction(xs, "$reduce")
        ? xs.$reduce(reduce, acc)
        : checks.isArrayLike(xs)
            ? reduceArray(reduce, acc, xs)
            : reduceIterable(reduce, acc, xs)));
}
function reduceRight(...args) {
    const rfn = args[0];
    const init = rfn[0];
    const complete = rfn[1];
    const reduce = rfn[2];
    args = parseArgs(args);
    let acc = args[0] == null ? init() : args[0];
    const xs = args[1];
    for (let i = xs.length; --i >= 0;) {
        acc = reduce(acc, xs[i]);
        if (isReduced(acc)) {
            acc = acc.deref();
            break;
        }
    }
    return unreduced(complete(acc));
}
const reduceArray = (rfn, acc, xs) => {
    for (let i = 0, n = xs.length; i < n; i++) {
        acc = rfn(acc, xs[i]);
        if (isReduced(acc)) {
            acc = acc.deref();
            break;
        }
    }
    return acc;
};
const reduceIterable = (rfn, acc, xs) => {
    for (let x of xs) {
        acc = rfn(acc, x);
        if (isReduced(acc)) {
            acc = acc.deref();
            break;
        }
    }
    return acc;
};
const reducer = (init, rfn) => [init, (acc) => acc, rfn];
const $$reduce = (rfn, args) => {
    const n = args.length - 1;
    return checks.isIterable(args[n])
        ? args.length > 1
            ? reduce(rfn.apply(null, args.slice(0, n)), args[n])
            : reduce(rfn(), args[0])
        : undefined;
};

function push(xs) {
    return xs
        ? [...xs]
        : reducer(() => [], (acc, x) => (acc.push(x), acc));
}

function* iterator(xform, xs) {
    const rfn = ensureTransducer(xform)(push());
    const complete = rfn[1];
    const reduce = rfn[2];
    for (let x of xs) {
        const y = reduce([], x);
        if (isReduced(y)) {
            yield* unreduced(complete(y.deref()));
            return;
        }
        if (y.length) {
            yield* y;
        }
    }
    yield* unreduced(complete([]));
}
function* iterator1(xform, xs) {
    const reduce = (ensureTransducer(xform)([api.NO_OP, api.NO_OP, (_, x) => x]))[2];
    for (let x of xs) {
        let y = reduce(api.SEMAPHORE, x);
        if (isReduced(y)) {
            y = unreduced(y.deref());
            if (y !== api.SEMAPHORE) {
                yield y;
            }
            return;
        }
        if (y !== api.SEMAPHORE) {
            yield y;
        }
    }
}
const $iter = (xform, args, impl = iterator1) => {
    const n = args.length - 1;
    return checks.isIterable(args[n])
        ? args.length > 1
            ? impl(xform.apply(null, args.slice(0, n)), args[n])
            : impl(xform(), args[0])
        : undefined;
};

const compR = (rfn, fn) => [rfn[0], rfn[1], fn];

function map(fn, src) {
    return checks.isIterable(src)
        ? iterator1(map(fn), src)
        : (rfn) => {
            const r = rfn[2];
            return compR(rfn, (acc, x) => r(acc, fn(x)));
        };
}

function transduce(...args) {
    return $transduce(transduce, reduce, args);
}
function transduceRight(...args) {
    return $transduce(transduceRight, reduceRight, args);
}
const $transduce = (tfn, rfn, args) => {
    let acc, xs;
    switch (args.length) {
        case 4:
            xs = args[3];
            acc = args[2];
            break;
        case 3:
            xs = args[2];
            break;
        case 2:
            return map((x) => tfn(args[0], args[1], x));
        default:
            errors.illegalArity(args.length);
    }
    return rfn(ensureTransducer(args[0])(args[1]), acc, xs);
};

const NO_OP_REDUCER = [api.NO_OP, api.NO_OP, api.NO_OP];
function run(tx, ...args) {
    if (args.length === 1) {
        transduce(tx, NO_OP_REDUCER, args[0]);
    }
    else {
        const fx = args[0];
        transduce(tx, [api.NO_OP, api.NO_OP, (_, x) => fx(x)], args[1]);
    }
}

const step = (tx) => {
    const { 1: complete, 2: reduce } = ensureTransducer(tx)(push());
    let done = false;
    return (x) => {
        if (!done) {
            let acc = reduce([], x);
            done = isReduced(acc);
            if (done) {
                acc = complete(acc.deref());
            }
            return acc.length === 1 ? acc[0] : acc.length > 0 ? acc : undefined;
        }
    };
};

const __mathop = (rfn, fn, initDefault, args) => {
    const res = $$reduce(rfn, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0] || initDefault;
    return reducer(() => init, fn);
};

function add(...args) {
    return __mathop(add, (acc, x) => acc + x, 0, args);
}

function assocMap(xs) {
    return xs
        ? reduce(assocMap(), xs)
        : reducer(() => new Map(), (acc, [k, v]) => acc.set(k, v));
}

function assocObj(xs) {
    return xs
        ? reduce(assocObj(), xs)
        : reducer(() => ({}), (acc, [k, v]) => ((acc[k] = v), acc));
}

function autoObj(prefix, xs) {
    let id = 0;
    return xs
        ? reduce(autoObj(prefix), xs)
        : reducer(() => ({}), (acc, v) => ((acc[prefix + id++] = v), acc));
}

function conj(xs) {
    return xs
        ? reduce(conj(), xs)
        : reducer(() => new Set(), (acc, x) => acc.add(x));
}

function count(...args) {
    const res = $$reduce(count, args);
    if (res !== undefined) {
        return res;
    }
    let offset = args[0] || 0;
    let step = args[1] || 1;
    return reducer(() => offset, (acc, _) => acc + step);
}

function div(init, xs) {
    return xs
        ? reduce(div(init), xs)
        : reducer(() => init, (acc, x) => acc / x);
}

function every(...args) {
    const res = $$reduce(every, args);
    if (res !== undefined) {
        return res;
    }
    const pred = args[0];
    return reducer(() => true, pred
        ? (acc, x) => (pred(x) ? acc : reduced(false))
        : (acc, x) => (x ? acc : reduced(false)));
}

function fill(...args) {
    const res = $$reduce(fill, args);
    if (res !== undefined) {
        return res;
    }
    let start = args[0] || 0;
    return reducer(() => [], (acc, x) => ((acc[start++] = x), acc));
}
function fillN(...args) {
    return fill(...args);
}

const __groupByOpts = (opts) => (Object.assign({ key: compose.identity, group: push() }, opts));

function groupByMap(...args) {
    const res = $$reduce(groupByMap, args);
    if (res !== undefined) {
        return res;
    }
    const opts = __groupByOpts(args[0]);
    const [init, complete, reduce] = opts.group;
    return [
        () => new Map(),
        (acc) => {
            for (let k of acc.keys()) {
                acc.set(k, complete(acc.get(k)));
            }
            return acc;
        },
        (acc, x) => {
            const k = opts.key(x);
            return acc.set(k, acc.has(k)
                ? reduce(acc.get(k), x)
                : reduce(init(), x));
        },
    ];
}

function frequencies(...args) {
    return ($$reduce(frequencies, args) ||
        groupByMap({ key: args[0] || compose.identity, group: count() }));
}

function groupByObj(...args) {
    const res = $$reduce(groupByObj, args);
    if (res) {
        return res;
    }
    const opts = __groupByOpts(args[0]);
    const [_init, complete, _reduce] = opts.group;
    return [
        () => ({}),
        (acc) => {
            for (let k in acc) {
                acc[k] = complete(acc[k]);
            }
            return acc;
        },
        (acc, x) => {
            const k = opts.key(x);
            acc[k] = acc[k]
                ? _reduce(acc[k], x)
                : _reduce(_init(), x);
            return acc;
        },
    ];
}

const branchPred = (key, b, l, r) => (x) => (key(x) & b ? r : l);
const groupBinary = (bits, key, branch, leaf, left = "l", right = "r") => {
    const init = branch || (() => ({}));
    let rfn = groupByObj({
        key: branchPred(key, 1, left, right),
        group: leaf || push(),
    });
    for (let i = 2, maxIndex = 1 << bits; i < maxIndex; i <<= 1) {
        rfn = groupByObj({
            key: branchPred(key, i, left, right),
            group: [init, rfn[1], rfn[2]],
        });
    }
    return [init, rfn[1], rfn[2]];
};

function last(xs) {
    return xs ? reduce(last(), xs) : reducer(api.NO_OP, (_, x) => x);
}

function max(xs) {
    return xs
        ? reduce(max(), xs)
        : reducer(() => -Infinity, (acc, x) => Math.max(acc, x));
}

function maxCompare(...args) {
    const res = $$reduce(maxCompare, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0];
    const cmp = args[1] || compare.compare;
    return reducer(init, (acc, x) => (cmp(acc, x) >= 0 ? acc : x));
}

function maxMag(xs) {
    return xs
        ? reduce(maxMag(), xs)
        : reducer(() => 0, (acc, x) => (Math.abs(x) > Math.abs(acc) ? x : acc));
}

function mean(xs) {
    let n = 1;
    return xs
        ? reduce(mean(), xs)
        : [
            () => (n = 0),
            (acc) => (n > 1 ? acc / n : acc),
            (acc, x) => (n++, acc + x),
        ];
}

function min(xs) {
    return xs
        ? reduce(min(), xs)
        : reducer(() => Infinity, (acc, x) => Math.min(acc, x));
}

function minCompare(...args) {
    const res = $$reduce(minCompare, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0];
    const cmp = args[1] || compare.compare;
    return reducer(init, (acc, x) => (cmp(acc, x) <= 0 ? acc : x));
}

function minMag(xs) {
    return xs
        ? reduce(minMag(), xs)
        : reducer(() => Infinity, (acc, x) => (Math.abs(x) < Math.abs(acc) ? x : acc));
}

function juxtR(...rs) {
    let [a, b, c] = rs;
    const n = rs.length;
    switch (n) {
        case 1: {
            const r = a[2];
            return [
                () => [a[0]()],
                (acc) => [a[1](acc[0])],
                (acc, x) => {
                    const aa1 = r(acc[0], x);
                    if (isReduced(aa1)) {
                        return reduced([unreduced(aa1)]);
                    }
                    return [aa1];
                },
            ];
        }
        case 2: {
            const ra = a[2];
            const rb = b[2];
            return [
                () => [a[0](), b[0]()],
                (acc) => [a[1](acc[0]), b[1](acc[1])],
                (acc, x) => {
                    const aa1 = ra(acc[0], x);
                    const aa2 = rb(acc[1], x);
                    if (isReduced(aa1) || isReduced(aa2)) {
                        return reduced([unreduced(aa1), unreduced(aa2)]);
                    }
                    return [aa1, aa2];
                },
            ];
        }
        case 3: {
            const ra = a[2];
            const rb = b[2];
            const rc = c[2];
            return [
                () => [a[0](), b[0](), c[0]()],
                (acc) => [a[1](acc[0]), b[1](acc[1]), c[1](acc[2])],
                (acc, x) => {
                    const aa1 = ra(acc[0], x);
                    const aa2 = rb(acc[1], x);
                    const aa3 = rc(acc[2], x);
                    if (isReduced(aa1) || isReduced(aa2) || isReduced(aa3)) {
                        return reduced([
                            unreduced(aa1),
                            unreduced(aa2),
                            unreduced(aa3),
                        ]);
                    }
                    return [aa1, aa2, aa3];
                },
            ];
        }
        default:
            return [
                () => rs.map((r) => r[0]()),
                (acc) => rs.map((r, i) => r[1](acc[i])),
                (acc, x) => {
                    let done = false;
                    const res = [];
                    for (let i = 0; i < n; i++) {
                        let a = rs[i][2](acc[i], x);
                        if (isReduced(a)) {
                            done = true;
                            a = unreduced(a);
                        }
                        res[i] = a;
                    }
                    return done ? reduced(res) : res;
                },
            ];
    }
}

const minMax = () => juxtR(min(), max());

function mul(...args) {
    return __mathop(mul, (acc, x) => acc * x, 1, args);
}

function normCount(...args) {
    const res = $$reduce(normCount, args);
    if (res !== undefined) {
        return res;
    }
    const norm = args[0];
    return [() => 0, (acc) => acc / norm, (acc) => acc + 1];
}

function normFrequencies(...args) {
    return ($$reduce(normFrequencies, args) ||
        groupByMap({
            key: args[1] || compose.identity,
            group: normCount(args[0]),
        }));
}

function normFrequenciesAuto(...args) {
    const res = $$reduce(normFrequenciesAuto, args);
    if (res !== undefined) {
        return res;
    }
    const [init, complete, reduce] = frequencies(...args);
    let norm = 0;
    return [
        init,
        (acc) => {
            acc = complete(acc);
            for (let p of acc) {
                acc.set(p[0], p[1] / norm);
            }
            return acc;
        },
        (acc, x) => (norm++, reduce(acc, x)),
    ];
}

const pushCopy = () => reducer(() => [], (acc, x) => ((acc = acc.slice()).push(x), acc));

function pushSort(cmp = compare.compare, xs) {
    return xs
        ? [...xs].sort(cmp)
        : [
            () => [],
            (acc) => acc.sort(cmp),
            (acc, x) => (acc.push(x), acc),
        ];
}

function reductions(rfn, xs) {
    const [init, complete, _reduce] = rfn;
    return xs
        ? reduce(reductions(rfn), xs)
        : [
            () => [init()],
            (acc) => ((acc[acc.length - 1] = complete(acc[acc.length - 1])), acc),
            (acc, x) => {
                const res = _reduce(acc[acc.length - 1], x);
                if (isReduced(res)) {
                    acc.push(res.deref());
                    return reduced(acc);
                }
                acc.push(res);
                return acc;
            },
        ];
}

function some(...args) {
    const res = $$reduce(some, args);
    if (res !== undefined) {
        return res;
    }
    const pred = args[0];
    return reducer(() => false, pred
        ? (acc, x) => (pred(x) ? reduced(true) : acc)
        : (acc, x) => (x ? reduced(true) : acc));
}

function str(sep, xs) {
    sep = sep || "";
    let first = true;
    return xs
        ? [...xs].join(sep)
        : reducer(() => "", (acc, x) => ((acc = first ? acc + x : acc + sep + x), (first = false), acc));
}

function sub(...args) {
    return __mathop(sub, (acc, x) => acc - x, 0, args);
}

function benchmark(src) {
    return checks.isIterable(src)
        ? iterator1(benchmark(), src)
        : (rfn) => {
            const r = rfn[2];
            let prev = Date.now();
            return compR(rfn, (acc, _) => {
                const t = Date.now();
                const x = t - prev;
                prev = t;
                return r(acc, x);
            });
        };
}

const cat = () => (rfn) => {
    const r = rfn[2];
    return compR(rfn, (acc, x) => {
        if (x) {
            for (let y of unreduced(x)) {
                acc = r(acc, y);
                if (isReduced(acc)) {
                    break;
                }
            }
        }
        return isReduced(x) ? ensureReduced(acc) : acc;
    });
};

function converge(...args) {
    return ($iter(converge, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0];
            let prev = api.SEMAPHORE;
            let done = false;
            return compR(rfn, (acc, x) => {
                if (done || (prev !== api.SEMAPHORE && pred(prev, x))) {
                    done = true;
                    return ensureReduced(r(acc, x));
                }
                prev = x;
                return r(acc, x);
            });
        }));
}

function range(from, to, step) {
    return new Range(from, to, step);
}
class Range {
    constructor(from, to, step) {
        if (from === undefined) {
            from = 0;
            to = Infinity;
        }
        else if (to === undefined) {
            to = from;
            from = 0;
        }
        step = step === undefined ? (from < to ? 1 : -1) : step;
        this.from = from;
        this.to = to;
        this.step = step;
    }
    *[Symbol.iterator]() {
        let { from, to, step } = this;
        if (step > 0) {
            while (from < to) {
                yield from;
                from += step;
            }
        }
        else if (step < 0) {
            while (from > to) {
                yield from;
                from += step;
            }
        }
    }
    $reduce(rfn, acc) {
        const step = this.step;
        if (step > 0) {
            for (let i = this.from, n = this.to; i < n && !isReduced(acc); i += step) {
                acc = rfn(acc, i);
            }
        }
        else {
            for (let i = this.from, n = this.to; i > n && !isReduced(acc); i += step) {
                acc = rfn(acc, i);
            }
        }
        return acc;
    }
}

function* range2d(...args) {
    let fromX, toX, stepX;
    let fromY, toY, stepY;
    switch (args.length) {
        case 6:
            stepX = args[4];
            stepY = args[5];
        case 4:
            [fromX, toX, fromY, toY] = args;
            break;
        case 2:
            [toX, toY] = args;
            fromX = fromY = 0;
            break;
        default:
            errors.illegalArity(args.length);
    }
    const rx = range(fromX, toX, stepX);
    for (let y of range(fromY, toY, stepY)) {
        for (let x of rx) {
            yield [x, y];
        }
    }
}

function* zip(...src) {
    const iters = src.map((s) => s[Symbol.iterator]());
    while (true) {
        const tuple = [];
        for (let i of iters) {
            let v = i.next();
            if (v.done) {
                return;
            }
            tuple.push(v.value);
        }
        yield tuple;
    }
}

const buildKernel1d = (weights, w) => {
    const w2 = w >> 1;
    return [...zip(weights, range(-w2, w2 + 1))];
};
const buildKernel2d = (weights, w, h = w) => {
    const w2 = w >> 1;
    const h2 = h >> 1;
    return [...zip(weights, range2d(-w2, w2 + 1, -h2, h2 + 1))];
};
const kernelLookup1d = (src, x, width, wrap, border) => wrap
    ? ({ 0: w, 1: ox }) => {
        const xx = x < -ox ? width + ox : x >= width - ox ? ox - 1 : x + ox;
        return w * src[xx];
    }
    : ({ 0: w, 1: ox }) => {
        return x < -ox || x >= width - ox ? border : w * src[x + ox];
    };
const kernelLookup2d = (src, x, y, width, height, wrap, border) => wrap
    ? ({ 0: w, 1: { 0: ox, 1: oy } }) => {
        const xx = x < -ox ? width + ox : x >= width - ox ? ox - 1 : x + ox;
        const yy = y < -oy ? height + oy : y >= height - oy ? oy - 1 : y + oy;
        return w * src[yy * width + xx];
    }
    : ({ 0: w, 1: { 0: ox, 1: oy } }) => {
        return x < -ox || y < -oy || x >= width - ox || y >= height - oy
            ? border
            : w * src[(y + oy) * width + x + ox];
    };
const kernelError = () => errors.illegalArgs(`no kernel or kernel config`);
function convolve1d(opts, indices) {
    if (indices) {
        return iterator1(convolve1d(opts), indices);
    }
    const { src, width } = opts;
    const wrap = opts.wrap !== false;
    const border = opts.border || 0;
    const rfn = opts.reduce || add;
    let kernel = opts.kernel;
    if (!kernel) {
        !(opts.weights && opts.kwidth) && kernelError();
        kernel = buildKernel1d(opts.weights, opts.kwidth);
    }
    return map((p) => transduce(map(kernelLookup1d(src, p, width, wrap, border)), rfn(), kernel));
}
function convolve2d(opts, indices) {
    if (indices) {
        return iterator1(convolve2d(opts), indices);
    }
    const { src, width, height } = opts;
    const wrap = opts.wrap !== false;
    const border = opts.border || 0;
    const rfn = opts.reduce || add;
    let kernel = opts.kernel;
    if (!kernel) {
        !(opts.weights && opts.kwidth && opts.kheight) && kernelError();
        kernel = buildKernel2d(opts.weights, opts.kwidth, opts.kheight);
    }
    return map((p) => transduce(map(kernelLookup2d(src, p[0], p[1], width, height, wrap, border)), rfn(), kernel));
}

function dedupe(...args) {
    return ($iter(dedupe, args) ||
        ((rfn) => {
            const r = rfn[2];
            const equiv = args[0];
            let prev = api.SEMAPHORE;
            return compR(rfn, equiv
                ? (acc, x) => {
                    acc =
                        prev !== api.SEMAPHORE && equiv(prev, x)
                            ? acc
                            : r(acc, x);
                    prev = x;
                    return acc;
                }
                : (acc, x) => {
                    acc = prev === x ? acc : r(acc, x);
                    prev = x;
                    return acc;
                });
        }));
}

const delayed = (t) => map((x) => compose.delayed(x, t));

function distinct(...args) {
    return ($iter(distinct, args) ||
        ((rfn) => {
            const r = rfn[2];
            const opts = (args[0] || {});
            const key = opts.key;
            const seen = (opts.cache || (() => new Set()))();
            return compR(rfn, key
                ? (acc, x) => {
                    const k = key(x);
                    return !seen.has(k) ? (seen.add(k), r(acc, x)) : acc;
                }
                : (acc, x) => !seen.has(x) ? (seen.add(x), r(acc, x)) : acc);
        }));
}

function throttle(pred, src) {
    return checks.isIterable(src)
        ? iterator1(throttle(pred), src)
        : (rfn) => {
            const r = rfn[2];
            const _pred = pred();
            return compR(rfn, (acc, x) => (_pred(x) ? r(acc, x) : acc));
        };
}

function dropNth(n, src) {
    if (checks.isIterable(src)) {
        return iterator1(dropNth(n), src);
    }
    n = math.clamp0(n - 1);
    return throttle(() => {
        let skip = n;
        return () => (skip-- > 0 ? true : ((skip = n), false));
    });
}

function dropWhile(...args) {
    return ($iter(dropWhile, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0];
            let ok = true;
            return compR(rfn, (acc, x) => (ok = ok && pred(x)) ? acc : r(acc, x));
        }));
}

function drop(n, src) {
    return checks.isIterable(src)
        ? iterator1(drop(n), src)
        : (rfn) => {
            const r = rfn[2];
            let m = n;
            return compR(rfn, (acc, x) => m > 0 ? (m--, acc) : r(acc, x));
        };
}

function duplicate(n = 1, src) {
    return checks.isIterable(src)
        ? iterator(duplicate(n), src)
        : (rfn) => {
            const r = rfn[2];
            return compR(rfn, (acc, x) => {
                for (let i = n; i >= 0 && !isReduced(acc); i--) {
                    acc = r(acc, x);
                }
                return acc;
            });
        };
}

function filter(pred, src) {
    return checks.isIterable(src)
        ? iterator1(filter(pred), src)
        : (rfn) => {
            const r = rfn[2];
            return compR(rfn, (acc, x) => (pred(x) ? r(acc, x) : acc));
        };
}

function filterFuzzy(...args) {
    const iter = args.length > 1 && $iter(filterFuzzy, args);
    if (iter) {
        return iter;
    }
    const query = args[0];
    const { key, equiv } = (args[1] || {});
    return filter((x) => arrays.fuzzyMatch(key != null ? key(x) : x, query, equiv));
}

function flattenWith(fn, src) {
    return checks.isIterable(src)
        ? iterator(flattenWith(fn), checks.isString(src) ? [src] : src)
        : (rfn) => {
            const reduce = rfn[2];
            const flatten = (acc, x) => {
                const xx = fn(x);
                if (xx) {
                    for (let y of xx) {
                        acc = flatten(acc, y);
                        if (isReduced(acc)) {
                            break;
                        }
                    }
                    return acc;
                }
                return reduce(acc, x);
            };
            return compR(rfn, flatten);
        };
}

function flatten(src) {
    return flattenWith((x) => (checks.isNotStringAndIterable(x) ? x : undefined), src);
}

function mapIndexed(...args) {
    return ($iter(mapIndexed, args) ||
        ((rfn) => {
            const r = rfn[2];
            const fn = args[0];
            let i = args[1] || 0;
            return compR(rfn, (acc, x) => r(acc, fn(i++, x)));
        }));
}

function indexed(...args) {
    const iter = $iter(indexed, args);
    if (iter) {
        return iter;
    }
    const from = args[0] || 0;
    return mapIndexed((i, x) => [from + i, x]);
}

function interleave(sep, src) {
    return checks.isIterable(src)
        ? iterator(interleave(sep), src)
        : (rfn) => {
            const r = rfn[2];
            const _sep = typeof sep === "function" ? sep : () => sep;
            return compR(rfn, (acc, x) => {
                acc = r(acc, _sep());
                return isReduced(acc) ? acc : r(acc, x);
            });
        };
}

function comp(...fns) {
    fns = fns.map(ensureTransducer);
    return compose.comp.apply(null, fns);
}

function* normRange(n, includeLast = true) {
    if (n > 0) {
        for (let i = 0, m = includeLast ? n + 1 : n; i < m; i++) {
            yield i / n;
        }
    }
}
function* normRange2d(nx, ny, includeLastX = true, includeLastY = true) {
    const rx = [...normRange(nx, includeLastX)];
    for (let y of normRange(ny, includeLastY)) {
        yield* map((x) => [x, y], rx);
    }
}
function* normRange3d(nx, ny, nz, includeLastX = true, includeLastY = true, includeLastZ = true) {
    const sliceXY = [...normRange2d(nx, ny, includeLastX, includeLastY)];
    for (let z of normRange(nz, includeLastZ)) {
        yield* map((xy) => [...xy, z], sliceXY);
    }
}

function mapcat(fn, src) {
    return checks.isIterable(src) ? iterator(mapcat(fn), src) : comp(map(fn), cat());
}

function partition(...args) {
    const iter = $iter(partition, args, iterator);
    if (iter) {
        return iter;
    }
    let size = args[0], all, step;
    if (typeof args[1] == "number") {
        step = args[1];
        all = args[2];
    }
    else {
        step = size;
        all = args[1];
    }
    return ([init, complete, reduce]) => {
        let buf = [];
        let skip = 0;
        return [
            init,
            (acc) => {
                if (all && buf.length > 0) {
                    acc = reduce(acc, buf);
                    buf = [];
                }
                return complete(acc);
            },
            (acc, x) => {
                if (skip <= 0) {
                    if (buf.length < size) {
                        buf.push(x);
                    }
                    if (buf.length === size) {
                        acc = reduce(acc, buf);
                        buf = step < size ? buf.slice(step) : [];
                        skip = step - size;
                    }
                }
                else {
                    skip--;
                }
                return acc;
            },
        ];
    };
}

function interpolate(fn, window, n, src) {
    return checks.isIterable(src)
        ? iterator(interpolate(fn, window, n), src)
        : comp(partition(window, 1), mapcat((chunk) => map((t) => fn(chunk, t), normRange(n, false))));
}

function interpolateHermite(n, src) {
    return interpolate((chunk, t) => math.mixHermite(...chunk, t), 4, n, src);
}

function interpolateLinear(n, src) {
    return interpolate((chunk, t) => math.mix(...chunk, t), 2, n, src);
}

function interpose(sep, src) {
    return checks.isIterable(src)
        ? iterator(interpose(sep), src)
        : (rfn) => {
            const r = rfn[2];
            const _sep = typeof sep === "function" ? sep : () => sep;
            let first = true;
            return compR(rfn, (acc, x) => {
                if (first) {
                    first = false;
                    return r(acc, x);
                }
                acc = r(acc, _sep());
                return isReduced(acc) ? acc : r(acc, x);
            });
        };
}

function keep(...args) {
    return ($iter(keep, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0] || compose.identity;
            return compR(rfn, (acc, x) => pred(x) != null ? r(acc, x) : acc);
        }));
}

function labeled(id, src) {
    return checks.isIterable(src)
        ? iterator1(labeled(id), src)
        : map(checks.isFunction(id) ? (x) => [id(x), x] : (x) => [id, x]);
}

const deepTransform = (spec) => {
    if (checks.isFunction(spec)) {
        return spec;
    }
    const mapfns = Object.keys(spec[1] || {}).reduce((acc, k) => ((acc[k] = deepTransform(spec[1][k])), acc), {});
    return (x) => {
        const res = Object.assign({}, x);
        for (let k in mapfns) {
            res[k] = mapfns[k](res[k]);
        }
        return spec[0](res);
    };
};

function mapDeep(spec, src) {
    return checks.isIterable(src)
        ? iterator1(mapDeep(spec), src)
        : map(deepTransform(spec));
}

function mapKeys(...args) {
    const iter = $iter(mapKeys, args);
    if (iter) {
        return iter;
    }
    const keys = args[0];
    const copy = args[1] !== false;
    return map((x) => {
        const res = copy ? Object.assign({}, x) : x;
        for (let k in keys) {
            res[k] = keys[k](x[k], x);
        }
        return res;
    });
}

function mapNth(...args) {
    const iter = $iter(mapNth, args);
    if (iter) {
        return iter;
    }
    let n = args[0] - 1;
    let offset;
    let fn;
    if (typeof args[1] === "number") {
        offset = args[1];
        fn = args[2];
    }
    else {
        fn = args[1];
        offset = 0;
    }
    return (rfn) => {
        const r = rfn[2];
        let skip = 0, off = offset;
        return compR(rfn, (acc, x) => {
            if (off === 0) {
                if (skip === 0) {
                    skip = n;
                    return r(acc, fn(x));
                }
                skip--;
            }
            else {
                off--;
            }
            return r(acc, x);
        });
    };
}

function mapVals(...args) {
    const iter = $iter(mapVals, args);
    if (iter) {
        return iter;
    }
    const fn = args[0];
    const copy = args[1] !== false;
    return map((x) => {
        const res = copy ? {} : x;
        for (let k in x) {
            res[k] = fn(x[k]);
        }
        return res;
    });
}

function mapcatIndexed(...args) {
    return ($iter(mapcatIndexed, args, iterator) ||
        comp(mapIndexed(args[0], args[1]), cat()));
}

function take(n, src) {
    return checks.isIterable(src)
        ? iterator(take(n), src)
        : (rfn) => {
            const r = rfn[2];
            let m = n;
            return compR(rfn, (acc, x) => --m > 0
                ? r(acc, x)
                : m === 0
                    ? ensureReduced(r(acc, x))
                    : reduced(acc));
        };
}

function matchFirst(pred, src) {
    return checks.isIterable(src)
        ? [...iterator1(matchFirst(pred), src)][0]
        : comp(filter(pred), take(1));
}

const __drain = (buf, complete, reduce) => (acc) => {
    while (buf.length && !isReduced(acc)) {
        acc = reduce(acc, buf.shift());
    }
    return complete(acc);
};

function takeLast(n, src) {
    return checks.isIterable(src)
        ? iterator(takeLast(n), src)
        : ([init, complete, reduce]) => {
            const buf = [];
            return [
                init,
                __drain(buf, complete, reduce),
                (acc, x) => {
                    if (buf.length === n) {
                        buf.shift();
                    }
                    buf.push(x);
                    return acc;
                },
            ];
        };
}

function matchLast(pred, src) {
    return checks.isIterable(src)
        ? [...iterator(matchLast(pred), src)][0]
        : comp(filter(pred), takeLast(1));
}

function movingAverage(period, src) {
    return checks.isIterable(src)
        ? iterator1(movingAverage(period), src)
        : (rfn) => {
            period |= 0;
            period < 2 && errors.illegalArgs("period must be >= 2");
            const reduce = rfn[2];
            const window = [];
            let sum = 0;
            return compR(rfn, (acc, x) => {
                const n = window.push(x);
                sum += x;
                n > period && (sum -= window.shift());
                return n >= period ? reduce(acc, sum / period) : acc;
            });
        };
}

const __sortOpts = (opts) => (Object.assign({ key: compose.identity, compare: compare.compare }, opts));

function movingMedian(...args) {
    const iter = $iter(movingMedian, args);
    if (iter) {
        return iter;
    }
    const { key, compare } = __sortOpts(args[1]);
    const n = args[0];
    const m = n >> 1;
    return comp(partition(n, 1, true), map((window) => window.slice().sort((a, b) => compare(key(a), key(b)))[m]));
}

function multiplex(...args) {
    return map(compose.juxt.apply(null, args.map(step)));
}

const renamer = (kmap) => {
    const ks = Object.keys(kmap);
    const [a2, b2, c2] = ks;
    const [a1, b1, c1] = ks.map((k) => kmap[k]);
    switch (ks.length) {
        case 3:
            return (x) => {
                const res = {};
                let v;
                (v = x[c1]), v !== undefined && (res[c2] = v);
                (v = x[b1]), v !== undefined && (res[b2] = v);
                (v = x[a1]), v !== undefined && (res[a2] = v);
                return res;
            };
        case 2:
            return (x) => {
                const res = {};
                let v;
                (v = x[b1]), v !== undefined && (res[b2] = v);
                (v = x[a1]), v !== undefined && (res[a2] = v);
                return res;
            };
        case 1:
            return (x) => {
                const res = {};
                let v = x[a1];
                v !== undefined && (res[a2] = v);
                return res;
            };
        default:
            return (x) => {
                let k, v;
                const res = {};
                for (let i = ks.length - 1; i >= 0; i--) {
                    (k = ks[i]),
                        (v = x[kmap[k]]),
                        v !== undefined && (res[k] = v);
                }
                return res;
            };
    }
};

function rename(...args) {
    const iter = args.length > 2 && $iter(rename, args);
    if (iter) {
        return iter;
    }
    let kmap = args[0];
    if (checks.isArray(kmap)) {
        kmap = kmap.reduce((acc, k, i) => ((acc[k] = i), acc), {});
    }
    if (args[1]) {
        const ks = Object.keys(kmap);
        return map((y) => transduce(comp(map((k) => [k, y[kmap[k]]]), filter((x) => x[1] !== undefined)), args[1], ks));
    }
    else {
        return map(renamer(kmap));
    }
}

function multiplexObj(...args) {
    const iter = $iter(multiplexObj, args);
    if (iter) {
        return iter;
    }
    const [xforms, rfn] = args;
    const ks = Object.keys(xforms);
    return comp(multiplex.apply(null, ks.map((k) => xforms[k])), rename(ks, rfn));
}

const noop = () => (rfn) => rfn;

function padLast(n, fill, src) {
    return checks.isIterable(src)
        ? iterator(padLast(n, fill), src)
        : ([init, complete, reduce]) => {
            let m = 0;
            return [
                init,
                (acc) => {
                    let rem = m % n;
                    if (rem > 0) {
                        while (++rem <= n && !isReduced(acc)) {
                            acc = reduce(acc, fill);
                        }
                    }
                    return complete(acc);
                },
                (acc, x) => (m++, reduce(acc, x)),
            ];
        };
}

function page(...args) {
    return ($iter(page, args) ||
        comp(drop(args[0] * (args[1] || 10)), take(args[1] || 10)));
}

function partitionBy(...args) {
    return ($iter(partitionBy, args, iterator) ||
        (([init, complete, reduce]) => {
            const fn = args[0];
            const f = args[1] === true ? fn() : fn;
            let prev = api.SEMAPHORE;
            let chunk;
            return [
                init,
                (acc) => {
                    if (chunk && chunk.length) {
                        acc = reduce(acc, chunk);
                        chunk = null;
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    const curr = f(x);
                    if (prev === api.SEMAPHORE) {
                        prev = curr;
                        chunk = [x];
                    }
                    else if (curr === prev) {
                        chunk.push(x);
                    }
                    else {
                        chunk && (acc = reduce(acc, chunk));
                        chunk = isReduced(acc) ? null : [x];
                        prev = curr;
                    }
                    return acc;
                },
            ];
        }));
}

function partitionOf(sizes, src) {
    return checks.isIterable(src)
        ? iterator(partitionOf(sizes), src)
        : partitionBy(() => {
            let i = 0, j = 0;
            return () => {
                if (i++ === sizes[j]) {
                    i = 1;
                    j = (j + 1) % sizes.length;
                }
                return j;
            };
        }, true);
}

function partitionSort(...args) {
    const iter = $iter(partitionSort, args, iterator);
    if (iter) {
        return iter;
    }
    const { key, compare } = __sortOpts(args[1]);
    return comp(partition(args[0], true), mapcat((window) => window.slice().sort((a, b) => compare(key(a), key(b)))));
}

function partitionSync(...args) {
    const iter = $iter(partitionSync, args, iterator);
    if (iter)
        return iter;
    const { key, mergeOnly, reset, all, backPressure } = Object.assign({ key: compose.identity, mergeOnly: false, reset: true, all: true, backPressure: 0 }, args[1]);
    const requiredKeys = checks.isArray(args[0])
        ? new Set(args[0])
        : args[0];
    const currKeys = new Set();
    const cache = new Map();
    let curr = {};
    const xform = ([init, complete, reduce]) => {
        let first = true;
        if (mergeOnly || backPressure < 1) {
            return [
                init,
                (acc) => {
                    if ((reset && all && currKeys.size > 0) ||
                        (!reset && first)) {
                        acc = reduce(acc, curr);
                        curr = {};
                        currKeys.clear();
                        first = false;
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    const k = key(x);
                    if (requiredKeys.has(k)) {
                        curr[k] = x;
                        currKeys.add(k);
                        if (mergeOnly ||
                            requiredInputs(requiredKeys, currKeys)) {
                            acc = reduce(acc, curr);
                            first = false;
                            if (reset) {
                                curr = {};
                                currKeys.clear();
                            }
                            else {
                                curr = Object.assign({}, curr);
                            }
                        }
                    }
                    return acc;
                },
            ];
        }
        else {
            return [
                init,
                (acc) => {
                    if (all && currKeys.size > 0) {
                        acc = reduce(acc, collect(cache, currKeys));
                        cache.clear();
                        currKeys.clear();
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    const k = key(x);
                    if (requiredKeys.has(k)) {
                        let slot = cache.get(k);
                        !slot && cache.set(k, (slot = []));
                        slot.length >= backPressure &&
                            errors.illegalState(`max back pressure (${backPressure}) exceeded for input: ${String(k)}`);
                        slot.push(x);
                        currKeys.add(k);
                        while (requiredInputs(requiredKeys, currKeys)) {
                            acc = reduce(acc, collect(cache, currKeys));
                            first = false;
                            if (isReduced(acc))
                                break;
                        }
                    }
                    return acc;
                },
            ];
        }
    };
    xform.keys = () => requiredKeys;
    xform.clear = () => {
        cache.clear();
        requiredKeys.clear();
        currKeys.clear();
        curr = {};
    };
    xform.add = (id) => {
        requiredKeys.add(id);
    };
    xform.delete = (id, clean = true) => {
        cache.delete(id);
        requiredKeys.delete(id);
        if (clean) {
            currKeys.delete(id);
            delete curr[id];
        }
    };
    return xform;
}
const requiredInputs = (required, curr) => {
    if (curr.size < required.size)
        return false;
    for (let id of required) {
        if (!curr.has(id))
            return false;
    }
    return true;
};
const collect = (cache, currKeys) => {
    const curr = {};
    for (let id of currKeys) {
        const slot = cache.get(id);
        curr[id] = slot.shift();
        !slot.length && currKeys.delete(id);
    }
    return curr;
};

function partitionTime(period, src) {
    return checks.isIterable(src)
        ? iterator(partitionTime(period), src)
        : partitionBy(() => {
            let last = 0;
            return () => {
                const t = Date.now();
                t - last >= period && (last = t);
                return last;
            };
        }, true);
}

function partitionWhen(...args) {
    return ($iter(partitionWhen, args, iterator) ||
        (([init, complete, reduce]) => {
            const pred = args[0];
            const f = args[1] === true ? pred() : pred;
            let chunk;
            return [
                init,
                (acc) => {
                    if (chunk && chunk.length) {
                        acc = reduce(acc, chunk);
                        chunk = null;
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    if (f(x)) {
                        chunk && (acc = reduce(acc, chunk));
                        chunk = isReduced(acc) ? null : [x];
                    }
                    else {
                        chunk ? chunk.push(x) : (chunk = [x]);
                    }
                    return acc;
                },
            ];
        }));
}

function peek(src) {
    return map(arrays.peek, src);
}

function pluck(key, src) {
    return checks.isIterable(src)
        ? iterator1(pluck(key), src)
        : map((x) => x[key]);
}

function sample(...args) {
    const iter = $iter(sample, args);
    if (iter) {
        return iter;
    }
    const prob = args[0];
    const rnd = args[1] || random.SYSTEM;
    return (rfn) => {
        const r = rfn[2];
        return compR(rfn, (acc, x) => rnd.float() < prob ? r(acc, x) : acc);
    };
}

function scan(...args) {
    return ((args.length > 2 && $iter(scan, args, iterator)) ||
        (([inito, completeo, reduceo]) => {
            const [initi, completei, reducei] = args[0];
            let acc = args.length > 1 && args[1] != null ? args[1] : initi();
            return [
                inito,
                (_acc) => {
                    let a = completei(acc);
                    if (a !== acc) {
                        _acc = unreduced(reduceo(_acc, a));
                    }
                    acc = a;
                    return completeo(_acc);
                },
                (_acc, x) => {
                    acc = reducei(acc, x);
                    if (isReduced(acc)) {
                        return ensureReduced(reduceo(_acc, acc.deref()));
                    }
                    return reduceo(_acc, acc);
                },
            ];
        }));
}

const keySelector = (keys) => renamer(keys.reduce((acc, x) => ((acc[x] = x), acc), {}));

function selectKeys(keys, src) {
    return checks.isIterable(src)
        ? iterator1(selectKeys(keys), src)
        : map(keySelector(keys));
}

const sideEffect = (fn) => map((x) => (fn(x), x));

function slidingWindow(...args) {
    const iter = $iter(slidingWindow, args);
    if (iter)
        return iter;
    const size = args[0];
    const partial = args[1] !== false;
    return (rfn) => {
        const reduce = rfn[2];
        let buf = [];
        return compR(rfn, (acc, x) => {
            buf.push(x);
            const _size = api.deref(size);
            if (partial || buf.length >= _size) {
                acc = reduce(acc, buf);
                buf = buf.slice(buf.length >= _size ? 1 : 0, _size);
            }
            return acc;
        });
    };
}

function streamShuffle(...args) {
    return ($iter(streamShuffle, args, iterator) ||
        (([init, complete, reduce]) => {
            const n = args[0];
            const maxSwaps = args[1] || n;
            const buf = [];
            return [
                init,
                (acc) => {
                    while (buf.length && !isReduced(acc)) {
                        arrays.shuffle(buf, maxSwaps);
                        acc = reduce(acc, buf.shift());
                    }
                    acc = complete(acc);
                    return acc;
                },
                (acc, x) => {
                    buf.push(x);
                    arrays.shuffle(buf, maxSwaps);
                    if (buf.length === n) {
                        acc = reduce(acc, buf.shift());
                    }
                    return acc;
                },
            ];
        }));
}

function streamSort(...args) {
    const iter = $iter(streamSort, args, iterator);
    if (iter) {
        return iter;
    }
    const { key, compare } = __sortOpts(args[1]);
    const n = args[0];
    return ([init, complete, reduce]) => {
        const buf = [];
        return [
            init,
            __drain(buf, complete, reduce),
            (acc, x) => {
                const idx = arrays.binarySearch(buf, x, key, compare);
                buf.splice(idx < 0 ? -(idx + 1) : idx, 0, x);
                if (buf.length === n) {
                    acc = reduce(acc, buf.shift());
                }
                return acc;
            },
        ];
    };
}

function struct(fields, src) {
    return checks.isIterable(src)
        ? iterator(struct(fields), src)
        : comp(partitionOf(fields.map((f) => f[1])), partition(fields.length), rename(fields.map((f) => f[0])), mapKeys(fields.reduce((acc, f) => (f[2] ? ((acc[f[0]] = f[2]), acc) : acc), {}), false));
}

function swizzle(order, src) {
    return checks.isIterable(src)
        ? iterator1(swizzle(order), src)
        : map(arrays.swizzle(order));
}

function takeNth(n, src) {
    if (checks.isIterable(src)) {
        return iterator1(takeNth(n), src);
    }
    n = math.clamp0(n - 1);
    return throttle(() => {
        let skip = 0;
        return () => (skip === 0 ? ((skip = n), true) : (skip--, false));
    });
}

function takeWhile(...args) {
    return ($iter(takeWhile, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0];
            let ok = true;
            return compR(rfn, (acc, x) => (ok = ok && pred(x)) ? r(acc, x) : reduced(acc));
        }));
}

function throttleTime(delay, src) {
    return checks.isIterable(src)
        ? iterator1(throttleTime(delay), src)
        : throttle(() => {
            let last = 0;
            return () => {
                const t = Date.now();
                return t - last >= delay ? ((last = t), true) : false;
            };
        });
}

function toggle(on, off, initial = false, src) {
    return checks.isIterable(src)
        ? iterator1(toggle(on, off, initial), src)
        : ([init, complete, reduce]) => {
            let state = initial;
            return [
                init,
                complete,
                (acc) => reduce(acc, (state = !state) ? on : off),
            ];
        };
}

const trace = (prefix = "") => sideEffect((x) => console.log(prefix, x));

function wordWrap(...args) {
    const iter = $iter(wordWrap, args, iterator);
    if (iter) {
        return iter;
    }
    const lineLength = args[0];
    const { delim, always } = Object.assign({ delim: 1, always: true }, args[1]);
    return partitionBy(() => {
        let n = 0;
        let flag = false;
        return (w) => {
            n += w.length + delim;
            if (n > lineLength + (always ? 0 : delim)) {
                flag = !flag;
                n = w.length + delim;
            }
            return flag;
        };
    }, true);
}

const lookup1d = (src) => (i) => src[i];
const lookup2d = (src, width) => (i) => src[i[0] + i[1] * width];
const lookup3d = (src, width, height) => {
    const stridez = width * height;
    return (i) => src[i[0] + i[1] * width + i[2] * stridez];
};

function* asIterable(src) {
    yield* src;
}

function* repeatedly(fn, n = Infinity) {
    for (let i = 0; i < n; i++) {
        yield fn(i);
    }
}

const choices = (choices, weights, rnd = random.SYSTEM) => repeatedly(weights
    ? random.weightedRandom(arrays.ensureArray(choices), weights, rnd)
    : () => choices[rnd.float(choices.length) | 0]);

function* concat(...xs) {
    for (let x of xs) {
        x != null && (yield* arrays.ensureIterable(x));
    }
}

function* curve(start, end, steps = 10, rate = 0.1) {
    const c = Math.exp(-Math.log((Math.abs(end - start) + rate) / rate) / steps);
    const offset = (start < end ? end + rate : end - rate) * (1 - c);
    steps > 0 && (yield start);
    for (let x = start; --steps >= 0;) {
        yield (x = offset + x * c);
    }
}

function* cycle(input, num = Infinity) {
    if (num < 1)
        return;
    let cache = [];
    for (let i of input) {
        cache.push(i);
        yield i;
    }
    if (cache.length > 0) {
        while (--num > 0) {
            yield* cache;
        }
    }
}

function dup(x) {
    return checks.isString(x)
        ? x + x
        : checks.isArray(x)
            ? x.concat(x)
            : ((x = arrays.ensureArray(x)), concat(x, x));
}

function* repeat(x, n = Infinity) {
    while (n-- > 0) {
        yield x;
    }
}

function* extendSides(src, numLeft = 1, numRight = numLeft) {
    let prev = api.SEMAPHORE;
    for (let x of src) {
        if (numLeft > 0 && prev === api.SEMAPHORE) {
            yield* repeat(x, numLeft);
            numLeft = 0;
        }
        yield x;
        prev = x;
    }
    if (numRight > 0 && prev !== api.SEMAPHORE) {
        yield* repeat(prev, numRight);
    }
}

function* iterate(fn, seed, num = Infinity) {
    for (let i = 1; i <= num; i++) {
        yield seed;
        seed = fn(seed, i);
    }
}

function* pairs(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield [k, x[k]];
        }
    }
}

function* permutations(...src) {
    const n = src.length - 1;
    if (n < 0) {
        return;
    }
    const step = new Array(n + 1).fill(0);
    const realized = src.map(arrays.ensureArrayLike);
    const total = realized.reduce((acc, x) => acc * x.length, 1);
    for (let i = 0; i < total; i++) {
        const tuple = [];
        for (let j = n; j >= 0; j--) {
            const r = realized[j];
            let s = step[j];
            if (s === r.length) {
                step[j] = s = 0;
                j > 0 && step[j - 1]++;
            }
            tuple[j] = r[s];
        }
        step[n]++;
        yield tuple;
    }
}
const permutationsN = (n, m = n, offsets) => {
    if (offsets && offsets.length < n) {
        errors.illegalArgs(`insufficient offsets, got ${offsets.length}, needed ${n}`);
    }
    const seqs = [];
    while (--n >= 0) {
        const o = offsets ? offsets[n] : 0;
        seqs[n] = range(o, o + m);
    }
    return permutations.apply(null, seqs);
};

const keyPermutations = (spec) => (map((x) => assocObj(partition(2, x)), permutations(...mapcat(([k, v]) => [[k], v], pairs(spec)))));

function* keys(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield k;
        }
    }
}

const line = (start, end, steps = 10) => {
    const delta = end - start;
    return map((t) => start + delta * t, normRange(steps));
};

const padSides = (src, x, numLeft = 1, numRight = numLeft) => numLeft > 0
    ? numRight > 0
        ? concat(repeat(x, numLeft), src, repeat(x, numRight))
        : concat(repeat(x, numLeft), src)
    : numRight > 0
        ? concat(src, repeat(x, numRight))
        : concat(src);

function* reverse(input) {
    const _input = arrays.ensureArray(input);
    let n = _input.length;
    while (--n >= 0) {
        yield _input[n];
    }
}

function palindrome(x) {
    return checks.isString(x)
        ? str("", concat([x], reverse(x)))
        : checks.isArray(x)
            ? x.concat(x.slice().reverse())
            : ((x = arrays.ensureArray(x)), concat(x, reverse(x)));
}

function* range3d(...args) {
    let fromX, toX, stepX;
    let fromY, toY, stepY;
    let fromZ, toZ, stepZ;
    switch (args.length) {
        case 9:
            stepX = args[6];
            stepY = args[7];
            stepZ = args[8];
        case 6:
            [fromX, toX, fromY, toY, fromZ, toZ] = args;
            break;
        case 3:
            [toX, toY, toZ] = args;
            fromX = fromY = fromZ = 0;
            break;
        default:
            errors.illegalArity(args.length);
    }
    const rx = range(fromX, toX, stepX);
    const ry = range(fromY, toY, stepY);
    for (let z of range(fromZ, toZ, stepZ)) {
        for (let y of ry) {
            for (let x of rx) {
                yield [x, y, z];
            }
        }
    }
}

const rangeNd = (min, max) => permutations.apply(null, ((max
    ? [...map(([a, b]) => range(a, b), zip(min, max))]
    : [...map(range, min)])));

function* sortedKeys(x, cmp = compare.compare) {
    yield* Object.keys(x).sort(cmp);
}

function* symmetric(src) {
    let head = undefined;
    for (let x of src) {
        head = { x, n: head };
        yield x;
    }
    while (head) {
        yield head.x;
        head = head.n;
    }
}

function* tween(opts) {
    const { min, max, num, init, mix, stops } = opts;
    const easing = opts.easing || ((x) => x);
    let l = stops.length;
    if (l < 1)
        return;
    if (l === 1) {
        yield* repeat(mix(init(stops[0][1], stops[0][1]), 0), num);
    }
    stops.sort((a, b) => a[0] - b[0]);
    stops[l - 1][0] < max && stops.push([max, stops[l - 1][1]]);
    stops[0][0] > min && stops.unshift([min, stops[0][1]]);
    const range = max - min;
    let start = stops[0][0];
    let end = stops[1][0];
    let delta = end - start;
    let interval = init(stops[0][1], stops[1][1]);
    let i = 1;
    l = stops.length;
    for (let t of normRange(num)) {
        t = min + range * t;
        if (t > end) {
            while (i < l && t > stops[i][0])
                i++;
            start = stops[i - 1][0];
            end = stops[i][0];
            delta = end - start;
            interval = init(stops[i - 1][1], stops[i][1]);
        }
        yield mix(interval, easing(delta !== 0 ? (t - start) / delta : 0));
    }
}

function* vals(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield x[k];
        }
    }
}

function* wrapSides(src, numLeft = 1, numRight = numLeft) {
    const _src = arrays.ensureArray(src);
    !(math.inRange(numLeft, 0, _src.length) && math.inRange(numRight, 0, _src.length)) &&
        errors.illegalArgs(`allowed wrap range: [0..${_src.length}]`);
    if (numLeft > 0) {
        for (let m = _src.length, i = m - numLeft; i < m; i++) {
            yield _src[i];
        }
    }
    yield* _src;
    if (numRight > 0) {
        for (let i = 0; i < numRight; i++) {
            yield _src[i];
        }
    }
}

exports.$$reduce = $$reduce;
exports.$iter = $iter;
exports.Range = Range;
exports.Reduced = Reduced;
exports.add = add;
exports.asIterable = asIterable;
exports.assocMap = assocMap;
exports.assocObj = assocObj;
exports.autoObj = autoObj;
exports.benchmark = benchmark;
exports.buildKernel1d = buildKernel1d;
exports.buildKernel2d = buildKernel2d;
exports.cat = cat;
exports.choices = choices;
exports.comp = comp;
exports.compR = compR;
exports.concat = concat;
exports.conj = conj;
exports.converge = converge;
exports.convolve1d = convolve1d;
exports.convolve2d = convolve2d;
exports.count = count;
exports.curve = curve;
exports.cycle = cycle;
exports.dedupe = dedupe;
exports.deepTransform = deepTransform;
exports.delayed = delayed;
exports.distinct = distinct;
exports.div = div;
exports.drop = drop;
exports.dropNth = dropNth;
exports.dropWhile = dropWhile;
exports.dup = dup;
exports.duplicate = duplicate;
exports.ensureReduced = ensureReduced;
exports.every = every;
exports.extendSides = extendSides;
exports.fill = fill;
exports.fillN = fillN;
exports.filter = filter;
exports.filterFuzzy = filterFuzzy;
exports.flatten = flatten;
exports.flattenWith = flattenWith;
exports.frequencies = frequencies;
exports.groupBinary = groupBinary;
exports.groupByMap = groupByMap;
exports.groupByObj = groupByObj;
exports.indexed = indexed;
exports.interleave = interleave;
exports.interpolate = interpolate;
exports.interpolateHermite = interpolateHermite;
exports.interpolateLinear = interpolateLinear;
exports.interpose = interpose;
exports.isReduced = isReduced;
exports.iterate = iterate;
exports.iterator = iterator;
exports.iterator1 = iterator1;
exports.juxtR = juxtR;
exports.keep = keep;
exports.keyPermutations = keyPermutations;
exports.keySelector = keySelector;
exports.keys = keys;
exports.labeled = labeled;
exports.last = last;
exports.line = line;
exports.lookup1d = lookup1d;
exports.lookup2d = lookup2d;
exports.lookup3d = lookup3d;
exports.map = map;
exports.mapDeep = mapDeep;
exports.mapIndexed = mapIndexed;
exports.mapKeys = mapKeys;
exports.mapNth = mapNth;
exports.mapVals = mapVals;
exports.mapcat = mapcat;
exports.mapcatIndexed = mapcatIndexed;
exports.matchFirst = matchFirst;
exports.matchLast = matchLast;
exports.max = max;
exports.maxCompare = maxCompare;
exports.maxMag = maxMag;
exports.mean = mean;
exports.min = min;
exports.minCompare = minCompare;
exports.minMag = minMag;
exports.minMax = minMax;
exports.movingAverage = movingAverage;
exports.movingMedian = movingMedian;
exports.mul = mul;
exports.multiplex = multiplex;
exports.multiplexObj = multiplexObj;
exports.noop = noop;
exports.normCount = normCount;
exports.normFrequencies = normFrequencies;
exports.normFrequenciesAuto = normFrequenciesAuto;
exports.normRange = normRange;
exports.normRange2d = normRange2d;
exports.normRange3d = normRange3d;
exports.padLast = padLast;
exports.padSides = padSides;
exports.page = page;
exports.pairs = pairs;
exports.palindrome = palindrome;
exports.partition = partition;
exports.partitionBy = partitionBy;
exports.partitionOf = partitionOf;
exports.partitionSort = partitionSort;
exports.partitionSync = partitionSync;
exports.partitionTime = partitionTime;
exports.partitionWhen = partitionWhen;
exports.peek = peek;
exports.permutations = permutations;
exports.permutationsN = permutationsN;
exports.pluck = pluck;
exports.push = push;
exports.pushCopy = pushCopy;
exports.pushSort = pushSort;
exports.range = range;
exports.range2d = range2d;
exports.range3d = range3d;
exports.rangeNd = rangeNd;
exports.reduce = reduce;
exports.reduceRight = reduceRight;
exports.reduced = reduced;
exports.reducer = reducer;
exports.reductions = reductions;
exports.rename = rename;
exports.renamer = renamer;
exports.repeat = repeat;
exports.repeatedly = repeatedly;
exports.reverse = reverse;
exports.run = run;
exports.sample = sample;
exports.scan = scan;
exports.selectKeys = selectKeys;
exports.sideEffect = sideEffect;
exports.slidingWindow = slidingWindow;
exports.some = some;
exports.sortedKeys = sortedKeys;
exports.step = step;
exports.str = str;
exports.streamShuffle = streamShuffle;
exports.streamSort = streamSort;
exports.struct = struct;
exports.sub = sub;
exports.swizzle = swizzle;
exports.symmetric = symmetric;
exports.take = take;
exports.takeLast = takeLast;
exports.takeNth = takeNth;
exports.takeWhile = takeWhile;
exports.throttle = throttle;
exports.throttleTime = throttleTime;
exports.toggle = toggle;
exports.trace = trace;
exports.transduce = transduce;
exports.transduceRight = transduceRight;
exports.tween = tween;
exports.unreduced = unreduced;
exports.vals = vals;
exports.wordWrap = wordWrap;
exports.wrapSides = wrapSides;
exports.zip = zip;

},{"@thi.ng/api":2,"@thi.ng/arrays":3,"@thi.ng/checks":5,"@thi.ng/compare":6,"@thi.ng/compose":7,"@thi.ng/errors":9,"@thi.ng/math":12,"@thi.ng/random":13}],16:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],17:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":16,"buffer":17,"ieee754":19}],18:[function(require,module,exports){
"use strict";

var deselectCurrent = require("toggle-selection");

var clipboardToIE11Formatting = {
  "text/plain": "Text",
  "text/html": "Url",
  "default": "Text"
}

var defaultMessage = "Copy to clipboard: #{key}, Enter";

function format(message) {
  var copyKey = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

function copy(text, options) {
  var debug,
    message,
    reselectPrevious,
    range,
    selection,
    mark,
    success = false;
  if (!options) {
    options = {};
  }
  debug = options.debug || false;
  try {
    reselectPrevious = deselectCurrent();

    range = document.createRange();
    selection = document.getSelection();

    mark = document.createElement("span");
    mark.textContent = text;
    // reset user styles for span element
    mark.style.all = "unset";
    // prevents scrolling to the end of the page
    mark.style.position = "fixed";
    mark.style.top = 0;
    mark.style.clip = "rect(0, 0, 0, 0)";
    // used to preserve spaces and line breaks
    mark.style.whiteSpace = "pre";
    // do not inherit user-select (it may be `none`)
    mark.style.webkitUserSelect = "text";
    mark.style.MozUserSelect = "text";
    mark.style.msUserSelect = "text";
    mark.style.userSelect = "text";
    mark.addEventListener("copy", function(e) {
      e.stopPropagation();
      if (options.format) {
        e.preventDefault();
        if (typeof e.clipboardData === "undefined") { // IE 11
          debug && console.warn("unable to use e.clipboardData");
          debug && console.warn("trying IE specific stuff");
          window.clipboardData.clearData();
          var format = clipboardToIE11Formatting[options.format] || clipboardToIE11Formatting["default"]
          window.clipboardData.setData(format, text);
        } else { // all other browsers
          e.clipboardData.clearData();
          e.clipboardData.setData(options.format, text);
        }
      }
      if (options.onCopy) {
        e.preventDefault();
        options.onCopy(e.clipboardData);
      }
    });

    document.body.appendChild(mark);

    range.selectNodeContents(mark);
    selection.addRange(range);

    var successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("copy command was unsuccessful");
    }
    success = true;
  } catch (err) {
    debug && console.error("unable to copy using execCommand: ", err);
    debug && console.warn("trying IE specific stuff");
    try {
      window.clipboardData.setData(options.format || "text", text);
      options.onCopy && options.onCopy(window.clipboardData);
      success = true;
    } catch (err) {
      debug && console.error("unable to copy using clipboardData: ", err);
      debug && console.error("falling back to prompt");
      message = format("message" in options ? options.message : defaultMessage);
      window.prompt(message, text);
    }
  } finally {
    if (selection) {
      if (typeof selection.removeRange == "function") {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark) {
      document.body.removeChild(mark);
    }
    reselectPrevious();
  }

  return success;
}

module.exports = copy;

},{"toggle-selection":22}],19:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],20:[function(require,module,exports){
/**
 * marked - a markdown parser
 * Copyright (c) 2011-2021, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 */

/**
 * DO NOT EDIT THIS FILE
 * The code in this file is generated from files in ./src/
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.marked = {}));
})(this, (function (exports) { 'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelperLoose(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (it) return (it = it.call(o)).next.bind(it);

    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      return function () {
        if (i >= o.length) return {
          done: true
        };
        return {
          done: false,
          value: o[i++]
        };
      };
    }

    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function getDefaults() {
    return {
      baseUrl: null,
      breaks: false,
      extensions: null,
      gfm: true,
      headerIds: true,
      headerPrefix: '',
      highlight: null,
      langPrefix: 'language-',
      mangle: true,
      pedantic: false,
      renderer: null,
      sanitize: false,
      sanitizer: null,
      silent: false,
      smartLists: false,
      smartypants: false,
      tokenizer: null,
      walkTokens: null,
      xhtml: false
    };
  }
  exports.defaults = getDefaults();
  function changeDefaults(newDefaults) {
    exports.defaults = newDefaults;
  }

  /**
   * Helpers
   */
  var escapeTest = /[&<>"']/;
  var escapeReplace = /[&<>"']/g;
  var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
  var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
  var escapeReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  var getEscapeReplacement = function getEscapeReplacement(ch) {
    return escapeReplacements[ch];
  };

  function escape(html, encode) {
    if (encode) {
      if (escapeTest.test(html)) {
        return html.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html)) {
        return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }

    return html;
  }
  var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
  function unescape(html) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(unescapeTest, function (_, n) {
      n = n.toLowerCase();
      if (n === 'colon') return ':';

      if (n.charAt(0) === '#') {
        return n.charAt(1) === 'x' ? String.fromCharCode(parseInt(n.substring(2), 16)) : String.fromCharCode(+n.substring(1));
      }

      return '';
    });
  }
  var caret = /(^|[^\[])\^/g;
  function edit(regex, opt) {
    regex = regex.source || regex;
    opt = opt || '';
    var obj = {
      replace: function replace(name, val) {
        val = val.source || val;
        val = val.replace(caret, '$1');
        regex = regex.replace(name, val);
        return obj;
      },
      getRegex: function getRegex() {
        return new RegExp(regex, opt);
      }
    };
    return obj;
  }
  var nonWordAndColonTest = /[^\w:]/g;
  var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
  function cleanUrl(sanitize, base, href) {
    if (sanitize) {
      var prot;

      try {
        prot = decodeURIComponent(unescape(href)).replace(nonWordAndColonTest, '').toLowerCase();
      } catch (e) {
        return null;
      }

      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
        return null;
      }
    }

    if (base && !originIndependentUrl.test(href)) {
      href = resolveUrl(base, href);
    }

    try {
      href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
      return null;
    }

    return href;
  }
  var baseUrls = {};
  var justDomain = /^[^:]+:\/*[^/]*$/;
  var protocol = /^([^:]+:)[\s\S]*$/;
  var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;
  function resolveUrl(base, href) {
    if (!baseUrls[' ' + base]) {
      // we can ignore everything in base after the last slash of its path component,
      // but we might need to add _that_
      // https://tools.ietf.org/html/rfc3986#section-3
      if (justDomain.test(base)) {
        baseUrls[' ' + base] = base + '/';
      } else {
        baseUrls[' ' + base] = rtrim(base, '/', true);
      }
    }

    base = baseUrls[' ' + base];
    var relativeBase = base.indexOf(':') === -1;

    if (href.substring(0, 2) === '//') {
      if (relativeBase) {
        return href;
      }

      return base.replace(protocol, '$1') + href;
    } else if (href.charAt(0) === '/') {
      if (relativeBase) {
        return href;
      }

      return base.replace(domain, '$1') + href;
    } else {
      return base + href;
    }
  }
  var noopTest = {
    exec: function noopTest() {}
  };
  function merge(obj) {
    var i = 1,
        target,
        key;

    for (; i < arguments.length; i++) {
      target = arguments[i];

      for (key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          obj[key] = target[key];
        }
      }
    }

    return obj;
  }
  function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    var row = tableRow.replace(/\|/g, function (match, offset, str) {
      var escaped = false,
          curr = offset;

      while (--curr >= 0 && str[curr] === '\\') {
        escaped = !escaped;
      }

      if (escaped) {
        // odd number of slashes means | is escaped
        // so we leave it alone
        return '|';
      } else {
        // add space before unescaped |
        return ' |';
      }
    }),
        cells = row.split(/ \|/);
    var i = 0; // First/last cell in a row cannot be empty if it has no leading/trailing pipe

    if (!cells[0].trim()) {
      cells.shift();
    }

    if (!cells[cells.length - 1].trim()) {
      cells.pop();
    }

    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) {
        cells.push('');
      }
    }

    for (; i < cells.length; i++) {
      // leading or trailing whitespace is ignored per the gfm spec
      cells[i] = cells[i].trim().replace(/\\\|/g, '|');
    }

    return cells;
  } // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
  // /c*$/ is vulnerable to REDOS.
  // invert: Remove suffix of non-c chars instead. Default falsey.

  function rtrim(str, c, invert) {
    var l = str.length;

    if (l === 0) {
      return '';
    } // Length of suffix matching the invert condition.


    var suffLen = 0; // Step left until we fail to match the invert condition.

    while (suffLen < l) {
      var currChar = str.charAt(l - suffLen - 1);

      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }

    return str.substr(0, l - suffLen);
  }
  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }

    var l = str.length;
    var level = 0,
        i = 0;

    for (; i < l; i++) {
      if (str[i] === '\\') {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;

        if (level < 0) {
          return i;
        }
      }
    }

    return -1;
  }
  function checkSanitizeDeprecation(opt) {
    if (opt && opt.sanitize && !opt.silent) {
      console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
    }
  } // copied from https://stackoverflow.com/a/5450113/806777

  function repeatString(pattern, count) {
    if (count < 1) {
      return '';
    }

    var result = '';

    while (count > 1) {
      if (count & 1) {
        result += pattern;
      }

      count >>= 1;
      pattern += pattern;
    }

    return result + pattern;
  }

  function outputLink(cap, link, raw, lexer) {
    var href = link.href;
    var title = link.title ? escape(link.title) : null;
    var text = cap[1].replace(/\\([\[\]])/g, '$1');

    if (cap[0].charAt(0) !== '!') {
      lexer.state.inLink = true;
      var token = {
        type: 'link',
        raw: raw,
        href: href,
        title: title,
        text: text,
        tokens: lexer.inlineTokens(text, [])
      };
      lexer.state.inLink = false;
      return token;
    } else {
      return {
        type: 'image',
        raw: raw,
        href: href,
        title: title,
        text: escape(text)
      };
    }
  }

  function indentCodeCompensation(raw, text) {
    var matchIndentToCode = raw.match(/^(\s+)(?:```)/);

    if (matchIndentToCode === null) {
      return text;
    }

    var indentToCode = matchIndentToCode[1];
    return text.split('\n').map(function (node) {
      var matchIndentInNode = node.match(/^\s+/);

      if (matchIndentInNode === null) {
        return node;
      }

      var indentInNode = matchIndentInNode[0];

      if (indentInNode.length >= indentToCode.length) {
        return node.slice(indentToCode.length);
      }

      return node;
    }).join('\n');
  }
  /**
   * Tokenizer
   */


  var Tokenizer = /*#__PURE__*/function () {
    function Tokenizer(options) {
      this.options = options || exports.defaults;
    }

    var _proto = Tokenizer.prototype;

    _proto.space = function space(src) {
      var cap = this.rules.block.newline.exec(src);

      if (cap) {
        if (cap[0].length > 1) {
          return {
            type: 'space',
            raw: cap[0]
          };
        }

        return {
          raw: '\n'
        };
      }
    };

    _proto.code = function code(src) {
      var cap = this.rules.block.code.exec(src);

      if (cap) {
        var text = cap[0].replace(/^ {1,4}/gm, '');
        return {
          type: 'code',
          raw: cap[0],
          codeBlockStyle: 'indented',
          text: !this.options.pedantic ? rtrim(text, '\n') : text
        };
      }
    };

    _proto.fences = function fences(src) {
      var cap = this.rules.block.fences.exec(src);

      if (cap) {
        var raw = cap[0];
        var text = indentCodeCompensation(raw, cap[3] || '');
        return {
          type: 'code',
          raw: raw,
          lang: cap[2] ? cap[2].trim() : cap[2],
          text: text
        };
      }
    };

    _proto.heading = function heading(src) {
      var cap = this.rules.block.heading.exec(src);

      if (cap) {
        var text = cap[2].trim(); // remove trailing #s

        if (/#$/.test(text)) {
          var trimmed = rtrim(text, '#');

          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            // CommonMark requires space before trailing #s
            text = trimmed.trim();
          }
        }

        var token = {
          type: 'heading',
          raw: cap[0],
          depth: cap[1].length,
          text: text,
          tokens: []
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }
    };

    _proto.hr = function hr(src) {
      var cap = this.rules.block.hr.exec(src);

      if (cap) {
        return {
          type: 'hr',
          raw: cap[0]
        };
      }
    };

    _proto.blockquote = function blockquote(src) {
      var cap = this.rules.block.blockquote.exec(src);

      if (cap) {
        var text = cap[0].replace(/^ *> ?/gm, '');
        return {
          type: 'blockquote',
          raw: cap[0],
          tokens: this.lexer.blockTokens(text, []),
          text: text
        };
      }
    };

    _proto.list = function list(src) {
      var cap = this.rules.block.list.exec(src);

      if (cap) {
        var raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine, line, nextLine, rawLine, itemContents, endEarly;
        var bull = cap[1].trim();
        var isordered = bull.length > 1;
        var list = {
          type: 'list',
          raw: '',
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : '',
          loose: false,
          items: []
        };
        bull = isordered ? "\\d{1,9}\\" + bull.slice(-1) : "\\" + bull;

        if (this.options.pedantic) {
          bull = isordered ? bull : '[*+-]';
        } // Get next list item


        var itemRegex = new RegExp("^( {0,3}" + bull + ")((?: [^\\n]*)?(?:\\n|$))"); // Check if current bullet point can start a new List Item

        while (src) {
          endEarly = false;

          if (!(cap = itemRegex.exec(src))) {
            break;
          }

          if (this.rules.block.hr.test(src)) {
            // End list if bullet was actually HR (possibly move into itemRegex?)
            break;
          }

          raw = cap[0];
          src = src.substring(raw.length);
          line = cap[2].split('\n', 1)[0];
          nextLine = src.split('\n', 1)[0];

          if (this.options.pedantic) {
            indent = 2;
            itemContents = line.trimLeft();
          } else {
            indent = cap[2].search(/[^ ]/); // Find first non-space char

            indent = indent > 4 ? 1 : indent; // Treat indented code blocks (> 4 spaces) as having only 1 indent

            itemContents = line.slice(indent);
            indent += cap[1].length;
          }

          blankLine = false;

          if (!line && /^ *$/.test(nextLine)) {
            // Items begin with at most one blank line
            raw += nextLine + '\n';
            src = src.substring(nextLine.length + 1);
            endEarly = true;
          }

          if (!endEarly) {
            var nextBulletRegex = new RegExp("^ {0," + Math.min(3, indent - 1) + "}(?:[*+-]|\\d{1,9}[.)])"); // Check if following lines should be included in List Item

            while (src) {
              rawLine = src.split('\n', 1)[0];
              line = rawLine; // Re-align to follow commonmark nesting rules

              if (this.options.pedantic) {
                line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
              } // End list item if found start of new bullet


              if (nextBulletRegex.test(line)) {
                break;
              }

              if (line.search(/[^ ]/) >= indent || !line.trim()) {
                // Dedent if possible
                itemContents += '\n' + line.slice(indent);
              } else if (!blankLine) {
                // Until blank line, item doesn't need indentation
                itemContents += '\n' + line;
              } else {
                // Otherwise, improper indentation ends this item
                break;
              }

              if (!blankLine && !line.trim()) {
                // Check if current line is blank
                blankLine = true;
              }

              raw += rawLine + '\n';
              src = src.substring(rawLine.length + 1);
            }
          }

          if (!list.loose) {
            // If the previous item ended with a blank line, the list is loose
            if (endsWithBlankLine) {
              list.loose = true;
            } else if (/\n *\n *$/.test(raw)) {
              endsWithBlankLine = true;
            }
          } // Check for task list items


          if (this.options.gfm) {
            istask = /^\[[ xX]\] /.exec(itemContents);

            if (istask) {
              ischecked = istask[0] !== '[ ] ';
              itemContents = itemContents.replace(/^\[[ xX]\] +/, '');
            }
          }

          list.items.push({
            type: 'list_item',
            raw: raw,
            task: !!istask,
            checked: ischecked,
            loose: false,
            text: itemContents
          });
          list.raw += raw;
        } // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic


        list.items[list.items.length - 1].raw = raw.trimRight();
        list.items[list.items.length - 1].text = itemContents.trimRight();
        list.raw = list.raw.trimRight();
        var l = list.items.length; // Item child tokens handled here at end because we needed to have the final item to trim it first

        for (i = 0; i < l; i++) {
          this.lexer.state.top = false;
          list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);

          if (!list.loose && list.items[i].tokens.some(function (t) {
            return t.type === 'space';
          })) {
            list.loose = true;
            list.items[i].loose = true;
          }
        }

        return list;
      }
    };

    _proto.html = function html(src) {
      var cap = this.rules.block.html.exec(src);

      if (cap) {
        var token = {
          type: 'html',
          raw: cap[0],
          pre: !this.options.sanitizer && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
          text: cap[0]
        };

        if (this.options.sanitize) {
          token.type = 'paragraph';
          token.text = this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]);
          token.tokens = [];
          this.lexer.inline(token.text, token.tokens);
        }

        return token;
      }
    };

    _proto.def = function def(src) {
      var cap = this.rules.block.def.exec(src);

      if (cap) {
        if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
        var tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
        return {
          type: 'def',
          tag: tag,
          raw: cap[0],
          href: cap[2],
          title: cap[3]
        };
      }
    };

    _proto.table = function table(src) {
      var cap = this.rules.block.table.exec(src);

      if (cap) {
        var item = {
          type: 'table',
          header: splitCells(cap[1]).map(function (c) {
            return {
              text: c
            };
          }),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          rows: cap[3] ? cap[3].replace(/\n[ \t]*$/, '').split('\n') : []
        };

        if (item.header.length === item.align.length) {
          item.raw = cap[0];
          var l = item.align.length;
          var i, j, k, row;

          for (i = 0; i < l; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }

          l = item.rows.length;

          for (i = 0; i < l; i++) {
            item.rows[i] = splitCells(item.rows[i], item.header.length).map(function (c) {
              return {
                text: c
              };
            });
          } // parse child tokens inside headers and cells
          // header child tokens


          l = item.header.length;

          for (j = 0; j < l; j++) {
            item.header[j].tokens = [];
            this.lexer.inlineTokens(item.header[j].text, item.header[j].tokens);
          } // cell child tokens


          l = item.rows.length;

          for (j = 0; j < l; j++) {
            row = item.rows[j];

            for (k = 0; k < row.length; k++) {
              row[k].tokens = [];
              this.lexer.inlineTokens(row[k].text, row[k].tokens);
            }
          }

          return item;
        }
      }
    };

    _proto.lheading = function lheading(src) {
      var cap = this.rules.block.lheading.exec(src);

      if (cap) {
        var token = {
          type: 'heading',
          raw: cap[0],
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1],
          tokens: []
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }
    };

    _proto.paragraph = function paragraph(src) {
      var cap = this.rules.block.paragraph.exec(src);

      if (cap) {
        var token = {
          type: 'paragraph',
          raw: cap[0],
          text: cap[1].charAt(cap[1].length - 1) === '\n' ? cap[1].slice(0, -1) : cap[1],
          tokens: []
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }
    };

    _proto.text = function text(src) {
      var cap = this.rules.block.text.exec(src);

      if (cap) {
        var token = {
          type: 'text',
          raw: cap[0],
          text: cap[0],
          tokens: []
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }
    };

    _proto.escape = function escape$1(src) {
      var cap = this.rules.inline.escape.exec(src);

      if (cap) {
        return {
          type: 'escape',
          raw: cap[0],
          text: escape(cap[1])
        };
      }
    };

    _proto.tag = function tag(src) {
      var cap = this.rules.inline.tag.exec(src);

      if (cap) {
        if (!this.lexer.state.inLink && /^<a /i.test(cap[0])) {
          this.lexer.state.inLink = true;
        } else if (this.lexer.state.inLink && /^<\/a>/i.test(cap[0])) {
          this.lexer.state.inLink = false;
        }

        if (!this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = true;
        } else if (this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          this.lexer.state.inRawBlock = false;
        }

        return {
          type: this.options.sanitize ? 'text' : 'html',
          raw: cap[0],
          inLink: this.lexer.state.inLink,
          inRawBlock: this.lexer.state.inRawBlock,
          text: this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0]
        };
      }
    };

    _proto.link = function link(src) {
      var cap = this.rules.inline.link.exec(src);

      if (cap) {
        var trimmedUrl = cap[2].trim();

        if (!this.options.pedantic && /^</.test(trimmedUrl)) {
          // commonmark requires matching angle brackets
          if (!/>$/.test(trimmedUrl)) {
            return;
          } // ending angle bracket cannot be escaped


          var rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');

          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          // find closing parenthesis
          var lastParenIndex = findClosingBracket(cap[2], '()');

          if (lastParenIndex > -1) {
            var start = cap[0].indexOf('!') === 0 ? 5 : 4;
            var linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = '';
          }
        }

        var href = cap[2];
        var title = '';

        if (this.options.pedantic) {
          // split pedantic href and title
          var link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

          if (link) {
            href = link[1];
            title = link[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : '';
        }

        href = href.trim();

        if (/^</.test(href)) {
          if (this.options.pedantic && !/>$/.test(trimmedUrl)) {
            // pedantic allows starting angle bracket without ending angle bracket
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }

        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
          title: title ? title.replace(this.rules.inline._escapes, '$1') : title
        }, cap[0], this.lexer);
      }
    };

    _proto.reflink = function reflink(src, links) {
      var cap;

      if ((cap = this.rules.inline.reflink.exec(src)) || (cap = this.rules.inline.nolink.exec(src))) {
        var link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
        link = links[link.toLowerCase()];

        if (!link || !link.href) {
          var text = cap[0].charAt(0);
          return {
            type: 'text',
            raw: text,
            text: text
          };
        }

        return outputLink(cap, link, cap[0], this.lexer);
      }
    };

    _proto.emStrong = function emStrong(src, maskedSrc, prevChar) {
      if (prevChar === void 0) {
        prevChar = '';
      }

      var match = this.rules.inline.emStrong.lDelim.exec(src);
      if (!match) return; // _ can't be between two alphanumerics. \p{L}\p{N} includes non-english alphabet/numbers as well

      if (match[3] && prevChar.match(/(?:[0-9A-Za-z\xAA\xB2\xB3\xB5\xB9\xBA\xBC-\xBE\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u0660-\u0669\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07C0-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u0870-\u0887\u0889-\u088E\u08A0-\u08C9\u0904-\u0939\u093D\u0950\u0958-\u0961\u0966-\u096F\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09E6-\u09F1\u09F4-\u09F9\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A66-\u0A6F\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AE6-\u0AEF\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B66-\u0B6F\u0B71-\u0B77\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0BE6-\u0BF2\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C5D\u0C60\u0C61\u0C66-\u0C6F\u0C78-\u0C7E\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDD\u0CDE\u0CE0\u0CE1\u0CE6-\u0CEF\u0CF1\u0CF2\u0D04-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D58-\u0D61\u0D66-\u0D78\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DE6-\u0DEF\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E86-\u0E8A\u0E8C-\u0EA3\u0EA5\u0EA7-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F20-\u0F33\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F-\u1049\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1090-\u1099\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1369-\u137C\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u1711\u171F-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A16\u1A20-\u1A54\u1A80-\u1A89\u1A90-\u1A99\u1AA7\u1B05-\u1B33\u1B45-\u1B4C\u1B50-\u1B59\u1B83-\u1BA0\u1BAE-\u1BE5\u1C00-\u1C23\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1CFA\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2070\u2071\u2074-\u2079\u207F-\u2089\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2150-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2C00-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2CFD\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u3192-\u3195\u31A0-\u31BF\u31F0-\u31FF\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\u3400-\u4DBF\u4E00-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7CA\uA7D0\uA7D1\uA7D3\uA7D5-\uA7D9\uA7F2-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA830-\uA835\uA840-\uA873\uA882-\uA8B3\uA8D0-\uA8D9\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA900-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF-\uA9D9\uA9E0-\uA9E4\uA9E6-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB69\uAB70-\uABE2\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDE80-\uDE9C\uDEA0-\uDED0\uDEE1-\uDEFB\uDF00-\uDF23\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDD70-\uDD7A\uDD7C-\uDD8A\uDD8C-\uDD92\uDD94\uDD95\uDD97-\uDDA1\uDDA3-\uDDB1\uDDB3-\uDDB9\uDDBB\uDDBC\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67\uDF80-\uDF85\uDF87-\uDFB0\uDFB2-\uDFBA]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC58-\uDC76\uDC79-\uDC9E\uDCA7-\uDCAF\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDD1B\uDD20-\uDD39\uDD80-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE40-\uDE48\uDE60-\uDE7E\uDE80-\uDE9F\uDEC0-\uDEC7\uDEC9-\uDEE4\uDEEB-\uDEEF\uDF00-\uDF35\uDF40-\uDF55\uDF58-\uDF72\uDF78-\uDF91\uDFA9-\uDFAF]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDD23\uDD30-\uDD39\uDE60-\uDE7E\uDE80-\uDEA9\uDEB0\uDEB1\uDF00-\uDF27\uDF30-\uDF45\uDF51-\uDF54\uDF70-\uDF81\uDFB0-\uDFCB\uDFE0-\uDFF6]|\uD804[\uDC03-\uDC37\uDC52-\uDC6F\uDC71\uDC72\uDC75\uDC83-\uDCAF\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD03-\uDD26\uDD36-\uDD3F\uDD44\uDD47\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDD0-\uDDDA\uDDDC\uDDE1-\uDDF4\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDEF0-\uDEF9\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC50-\uDC59\uDC5F-\uDC61\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE50-\uDE59\uDE80-\uDEAA\uDEB8\uDEC0-\uDEC9\uDF00-\uDF1A\uDF30-\uDF3B\uDF40-\uDF46]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCF2\uDCFF-\uDD06\uDD09\uDD0C-\uDD13\uDD15\uDD16\uDD18-\uDD2F\uDD3F\uDD41\uDD50-\uDD59\uDDA0-\uDDA7\uDDAA-\uDDD0\uDDE1\uDDE3\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE89\uDE9D\uDEB0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC50-\uDC6C\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD50-\uDD59\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDDA0-\uDDA9\uDEE0-\uDEF2\uDFB0\uDFC0-\uDFD4]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|\uD80B[\uDF90-\uDFF0]|[\uD80C\uD81C-\uD820\uD822\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879\uD880-\uD883][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDE70-\uDEBE\uDEC0-\uDEC9\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE96\uDF00-\uDF4A\uDF50\uDF93-\uDF9F\uDFE0\uDFE1\uDFE3]|\uD821[\uDC00-\uDFF7]|\uD823[\uDC00-\uDCD5\uDD00-\uDD08]|\uD82B[\uDFF0-\uDFF3\uDFF5-\uDFFB\uDFFD\uDFFE]|\uD82C[\uDC00-\uDD22\uDD50-\uDD52\uDD64-\uDD67\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD837[\uDF00-\uDF1E]|\uD838[\uDD00-\uDD2C\uDD37-\uDD3D\uDD40-\uDD49\uDD4E\uDE90-\uDEAD\uDEC0-\uDEEB\uDEF0-\uDEF9]|\uD839[\uDFE0-\uDFE6\uDFE8-\uDFEB\uDFED\uDFEE\uDFF0-\uDFFE]|\uD83A[\uDC00-\uDCC4\uDCC7-\uDCCF\uDD00-\uDD43\uDD4B\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4\uDD01-\uDD2D\uDD2F-\uDD3D\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD00-\uDD0C]|\uD83E[\uDFF0-\uDFF9]|\uD869[\uDC00-\uDEDF\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF38\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uD884[\uDC00-\uDF4A])/)) return;
      var nextChar = match[1] || match[2] || '';

      if (!nextChar || nextChar && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar))) {
        var lLength = match[0].length - 1;
        var rDelim,
            rLength,
            delimTotal = lLength,
            midDelimTotal = 0;
        var endReg = match[0][0] === '*' ? this.rules.inline.emStrong.rDelimAst : this.rules.inline.emStrong.rDelimUnd;
        endReg.lastIndex = 0; // Clip maskedSrc to same section of string as src (move to lexer?)

        maskedSrc = maskedSrc.slice(-1 * src.length + lLength);

        while ((match = endReg.exec(maskedSrc)) != null) {
          rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
          if (!rDelim) continue; // skip single * in __abc*abc__

          rLength = rDelim.length;

          if (match[3] || match[4]) {
            // found another Left Delim
            delimTotal += rLength;
            continue;
          } else if (match[5] || match[6]) {
            // either Left or Right Delim
            if (lLength % 3 && !((lLength + rLength) % 3)) {
              midDelimTotal += rLength;
              continue; // CommonMark Emphasis Rules 9-10
            }
          }

          delimTotal -= rLength;
          if (delimTotal > 0) continue; // Haven't found enough closing delimiters
          // Remove extra characters. *a*** -> *a*

          rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal); // Create `em` if smallest delimiter has odd char count. *a***

          if (Math.min(lLength, rLength) % 2) {
            var _text = src.slice(1, lLength + match.index + rLength);

            return {
              type: 'em',
              raw: src.slice(0, lLength + match.index + rLength + 1),
              text: _text,
              tokens: this.lexer.inlineTokens(_text, [])
            };
          } // Create 'strong' if smallest delimiter has even char count. **a***


          var text = src.slice(2, lLength + match.index + rLength - 1);
          return {
            type: 'strong',
            raw: src.slice(0, lLength + match.index + rLength + 1),
            text: text,
            tokens: this.lexer.inlineTokens(text, [])
          };
        }
      }
    };

    _proto.codespan = function codespan(src) {
      var cap = this.rules.inline.code.exec(src);

      if (cap) {
        var text = cap[2].replace(/\n/g, ' ');
        var hasNonSpaceChars = /[^ ]/.test(text);
        var hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);

        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }

        text = escape(text, true);
        return {
          type: 'codespan',
          raw: cap[0],
          text: text
        };
      }
    };

    _proto.br = function br(src) {
      var cap = this.rules.inline.br.exec(src);

      if (cap) {
        return {
          type: 'br',
          raw: cap[0]
        };
      }
    };

    _proto.del = function del(src) {
      var cap = this.rules.inline.del.exec(src);

      if (cap) {
        return {
          type: 'del',
          raw: cap[0],
          text: cap[2],
          tokens: this.lexer.inlineTokens(cap[2], [])
        };
      }
    };

    _proto.autolink = function autolink(src, mangle) {
      var cap = this.rules.inline.autolink.exec(src);

      if (cap) {
        var text, href;

        if (cap[2] === '@') {
          text = escape(this.options.mangle ? mangle(cap[1]) : cap[1]);
          href = 'mailto:' + text;
        } else {
          text = escape(cap[1]);
          href = text;
        }

        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [{
            type: 'text',
            raw: text,
            text: text
          }]
        };
      }
    };

    _proto.url = function url(src, mangle) {
      var cap;

      if (cap = this.rules.inline.url.exec(src)) {
        var text, href;

        if (cap[2] === '@') {
          text = escape(this.options.mangle ? mangle(cap[0]) : cap[0]);
          href = 'mailto:' + text;
        } else {
          // do extended autolink path validation
          var prevCapZero;

          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
          } while (prevCapZero !== cap[0]);

          text = escape(cap[0]);

          if (cap[1] === 'www.') {
            href = 'http://' + text;
          } else {
            href = text;
          }
        }

        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [{
            type: 'text',
            raw: text,
            text: text
          }]
        };
      }
    };

    _proto.inlineText = function inlineText(src, smartypants) {
      var cap = this.rules.inline.text.exec(src);

      if (cap) {
        var text;

        if (this.lexer.state.inRawBlock) {
          text = this.options.sanitize ? this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape(cap[0]) : cap[0];
        } else {
          text = escape(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
        }

        return {
          type: 'text',
          raw: cap[0],
          text: text
        };
      }
    };

    return Tokenizer;
  }();

  /**
   * Block-Level Grammar
   */

  var block = {
    newline: /^(?: *(?:\n|$))+/,
    code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
    fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
    hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
    heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3}bull)( [^\n]+?)?(?:\n|$)/,
    html: '^ {0,3}(?:' // optional indentation
    + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
    + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (6)
    + '|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) open tag
    + '|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n *)+\\n|$)' // (7) closing tag
    + ')',
    def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
    table: noopTest,
    lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
    // regex template, placeholders will be replaced according to different paragraph
    // interruption rules of commonmark and the original markdown spec:
    _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
    text: /^[^\n]+/
  };
  block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
  block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
  block.def = edit(block.def).replace('label', block._label).replace('title', block._title).getRegex();
  block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
  block.listItemStart = edit(/^( *)(bull) */).replace('bull', block.bullet).getRegex();
  block.list = edit(block.list).replace(/bull/g, block.bullet).replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))').replace('def', '\\n+(?=' + block.def.source + ')').getRegex();
  block._tag = 'address|article|aside|base|basefont|blockquote|body|caption' + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption' + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe' + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option' + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr' + '|track|ul';
  block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
  block.html = edit(block.html, 'i').replace('comment', block._comment).replace('tag', block._tag).replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
  block.paragraph = edit(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('|table', '').replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();
  block.blockquote = edit(block.blockquote).replace('paragraph', block.paragraph).getRegex();
  /**
   * Normal Block Grammar
   */

  block.normal = merge({}, block);
  /**
   * GFM Block Grammar
   */

  block.gfm = merge({}, block.normal, {
    table: '^ *([^\\n ].*\\|.*)\\n' // Header
    + ' {0,3}(?:\\| *)?(:?-+:? *(?:\\| *:?-+:? *)*)(?:\\| *)?' // Align
    + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells

  });
  block.gfm.table = edit(block.gfm.table).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('blockquote', ' {0,3}>').replace('code', ' {4}[^\\n]').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
  .getRegex();
  block.gfm.paragraph = edit(block._paragraph).replace('hr', block.hr).replace('heading', ' {0,3}#{1,6} ').replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
  .replace('table', block.gfm.table) // interrupt paragraphs with table
  .replace('blockquote', ' {0,3}>').replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n').replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
  .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)').replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();
  /**
   * Pedantic grammar (original John Gruber's loose markdown specification)
   */

  block.pedantic = merge({}, block.normal, {
    html: edit('^ *(?:comment *(?:\\n|\\s*$)' + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))').replace('comment', block._comment).replace(/tag/g, '(?!(?:' + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub' + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)' + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b').getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest,
    // fences not supported
    paragraph: edit(block.normal._paragraph).replace('hr', block.hr).replace('heading', ' *#{1,6} *[^\n]').replace('lheading', block.lheading).replace('blockquote', ' {0,3}>').replace('|fences', '').replace('|list', '').replace('|html', '').getRegex()
  });
  /**
   * Inline-Level Grammar
   */

  var inline = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noopTest,
    tag: '^comment' + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>',
    // CDATA section
    link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    reflinkSearch: 'reflink|nolink(?!\\()',
    emStrong: {
      lDelim: /^(?:\*+(?:([punct_])|[^\s*]))|^_+(?:([punct*])|([^\s_]))/,
      //        (1) and (2) can only be a Right Delimiter. (3) and (4) can only be Left.  (5) and (6) can be either Left or Right.
      //        () Skip orphan delim inside strong    (1) #***                (2) a***#, a***                   (3) #***a, ***a                 (4) ***#              (5) #***#                 (6) a***a
      rDelimAst: /^[^_*]*?\_\_[^_*]*?\*[^_*]*?(?=\_\_)|[punct_](\*+)(?=[\s]|$)|[^punct*_\s](\*+)(?=[punct_\s]|$)|[punct_\s](\*+)(?=[^punct*_\s])|[\s](\*+)(?=[punct_])|[punct_](\*+)(?=[punct_])|[^punct*_\s](\*+)(?=[^punct*_\s])/,
      rDelimUnd: /^[^_*]*?\*\*[^_*]*?\_[^_*]*?(?=\*\*)|[punct*](\_+)(?=[\s]|$)|[^punct*_\s](\_+)(?=[punct*\s]|$)|[punct*\s](\_+)(?=[^punct*_\s])|[\s](\_+)(?=[punct*])|[punct*](\_+)(?=[punct*])/ // ^- Not allowed for _

    },
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noopTest,
    text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
    punctuation: /^([\spunctuation])/
  }; // list of punctuation marks from CommonMark spec
  // without * and _ to handle the different emphasis markers * and _

  inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
  inline.punctuation = edit(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex(); // sequences em should skip over [title](link), `code`, <html>

  inline.blockSkip = /\[[^\]]*?\]\([^\)]*?\)|`[^`]*?`|<[^>]*?>/g;
  inline.escapedEmSt = /\\\*|\\_/g;
  inline._comment = edit(block._comment).replace('(?:-->|$)', '-->').getRegex();
  inline.emStrong.lDelim = edit(inline.emStrong.lDelim).replace(/punct/g, inline._punctuation).getRegex();
  inline.emStrong.rDelimAst = edit(inline.emStrong.rDelimAst, 'g').replace(/punct/g, inline._punctuation).getRegex();
  inline.emStrong.rDelimUnd = edit(inline.emStrong.rDelimUnd, 'g').replace(/punct/g, inline._punctuation).getRegex();
  inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;
  inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
  inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
  inline.autolink = edit(inline.autolink).replace('scheme', inline._scheme).replace('email', inline._email).getRegex();
  inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;
  inline.tag = edit(inline.tag).replace('comment', inline._comment).replace('attribute', inline._attribute).getRegex();
  inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
  inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;
  inline.link = edit(inline.link).replace('label', inline._label).replace('href', inline._href).replace('title', inline._title).getRegex();
  inline.reflink = edit(inline.reflink).replace('label', inline._label).getRegex();
  inline.reflinkSearch = edit(inline.reflinkSearch, 'g').replace('reflink', inline.reflink).replace('nolink', inline.nolink).getRegex();
  /**
   * Normal Inline Grammar
   */

  inline.normal = merge({}, inline);
  /**
   * Pedantic Inline Grammar
   */

  inline.pedantic = merge({}, inline.normal, {
    strong: {
      start: /^__|\*\*/,
      middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
      endAst: /\*\*(?!\*)/g,
      endUnd: /__(?!_)/g
    },
    em: {
      start: /^_|\*/,
      middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
      endAst: /\*(?!\*)/g,
      endUnd: /_(?!_)/g
    },
    link: edit(/^!?\[(label)\]\((.*?)\)/).replace('label', inline._label).getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace('label', inline._label).getRegex()
  });
  /**
   * GFM Inline Grammar
   */

  inline.gfm = merge({}, inline.normal, {
    escape: edit(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
  });
  inline.gfm.url = edit(inline.gfm.url, 'i').replace('email', inline.gfm._extended_email).getRegex();
  /**
   * GFM + Line Breaks Inline Grammar
   */

  inline.breaks = merge({}, inline.gfm, {
    br: edit(inline.br).replace('{2,}', '*').getRegex(),
    text: edit(inline.gfm.text).replace('\\b_', '\\b_| {2,}\\n').replace(/\{2,\}/g, '*').getRegex()
  });

  /**
   * smartypants text replacement
   */

  function smartypants(text) {
    return text // em-dashes
    .replace(/---/g, "\u2014") // en-dashes
    .replace(/--/g, "\u2013") // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018") // closing singles & apostrophes
    .replace(/'/g, "\u2019") // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201C") // closing doubles
    .replace(/"/g, "\u201D") // ellipses
    .replace(/\.{3}/g, "\u2026");
  }
  /**
   * mangle email addresses
   */


  function mangle(text) {
    var out = '',
        i,
        ch;
    var l = text.length;

    for (i = 0; i < l; i++) {
      ch = text.charCodeAt(i);

      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }

      out += '&#' + ch + ';';
    }

    return out;
  }
  /**
   * Block Lexer
   */


  var Lexer = /*#__PURE__*/function () {
    function Lexer(options) {
      this.tokens = [];
      this.tokens.links = Object.create(null);
      this.options = options || exports.defaults;
      this.options.tokenizer = this.options.tokenizer || new Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;
      this.tokenizer.lexer = this;
      this.inlineQueue = [];
      this.state = {
        inLink: false,
        inRawBlock: false,
        top: true
      };
      var rules = {
        block: block.normal,
        inline: inline.normal
      };

      if (this.options.pedantic) {
        rules.block = block.pedantic;
        rules.inline = inline.pedantic;
      } else if (this.options.gfm) {
        rules.block = block.gfm;

        if (this.options.breaks) {
          rules.inline = inline.breaks;
        } else {
          rules.inline = inline.gfm;
        }
      }

      this.tokenizer.rules = rules;
    }
    /**
     * Expose Rules
     */


    /**
     * Static Lex Method
     */
    Lexer.lex = function lex(src, options) {
      var lexer = new Lexer(options);
      return lexer.lex(src);
    }
    /**
     * Static Lex Inline Method
     */
    ;

    Lexer.lexInline = function lexInline(src, options) {
      var lexer = new Lexer(options);
      return lexer.inlineTokens(src);
    }
    /**
     * Preprocessing
     */
    ;

    var _proto = Lexer.prototype;

    _proto.lex = function lex(src) {
      src = src.replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ');
      this.blockTokens(src, this.tokens);
      var next;

      while (next = this.inlineQueue.shift()) {
        this.inlineTokens(next.src, next.tokens);
      }

      return this.tokens;
    }
    /**
     * Lexing
     */
    ;

    _proto.blockTokens = function blockTokens(src, tokens) {
      var _this = this;

      if (tokens === void 0) {
        tokens = [];
      }

      if (this.options.pedantic) {
        src = src.replace(/^ +$/gm, '');
      }

      var token, lastToken, cutSrc, lastParagraphClipped;

      while (src) {
        if (this.options.extensions && this.options.extensions.block && this.options.extensions.block.some(function (extTokenizer) {
          if (token = extTokenizer.call({
            lexer: _this
          }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }

          return false;
        })) {
          continue;
        } // newline


        if (token = this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);

          if (token.type) {
            tokens.push(token);
          }

          continue;
        } // code


        if (token = this.tokenizer.code(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1]; // An indented code block cannot interrupt a paragraph.

          if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }

          continue;
        } // fences


        if (token = this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // heading


        if (token = this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // hr


        if (token = this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // blockquote


        if (token = this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // list


        if (token = this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // html


        if (token = this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // def


        if (token = this.tokenizer.def(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];

          if (lastToken && (lastToken.type === 'paragraph' || lastToken.type === 'text')) {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.raw;
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }

          continue;
        } // table (gfm)


        if (token = this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // lheading


        if (token = this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // top-level paragraph
        // prevent paragraph consuming extensions by clipping 'src' to extension start


        cutSrc = src;

        if (this.options.extensions && this.options.extensions.startBlock) {
          (function () {
            var startIndex = Infinity;
            var tempSrc = src.slice(1);
            var tempStart = void 0;

            _this.options.extensions.startBlock.forEach(function (getStartIndex) {
              tempStart = getStartIndex.call({
                lexer: this
              }, tempSrc);

              if (typeof tempStart === 'number' && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });

            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src.substring(0, startIndex + 1);
            }
          })();
        }

        if (this.state.top && (token = this.tokenizer.paragraph(cutSrc))) {
          lastToken = tokens[tokens.length - 1];

          if (lastParagraphClipped && lastToken.type === 'paragraph') {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }

          lastParagraphClipped = cutSrc.length !== src.length;
          src = src.substring(token.raw.length);
          continue;
        } // text


        if (token = this.tokenizer.text(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];

          if (lastToken && lastToken.type === 'text') {
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
            this.inlineQueue.pop();
            this.inlineQueue[this.inlineQueue.length - 1].src = lastToken.text;
          } else {
            tokens.push(token);
          }

          continue;
        }

        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }

      this.state.top = true;
      return tokens;
    };

    _proto.inline = function inline(src, tokens) {
      this.inlineQueue.push({
        src: src,
        tokens: tokens
      });
    }
    /**
     * Lexing/Compiling
     */
    ;

    _proto.inlineTokens = function inlineTokens(src, tokens) {
      var _this2 = this;

      if (tokens === void 0) {
        tokens = [];
      }

      var token, lastToken, cutSrc; // String with links masked to avoid interference with em and strong

      var maskedSrc = src;
      var match;
      var keepPrevChar, prevChar; // Mask out reflinks

      if (this.tokens.links) {
        var links = Object.keys(this.tokens.links);

        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      } // Mask out other blocks


      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      } // Mask out escaped em & strong delimiters


      while ((match = this.tokenizer.rules.inline.escapedEmSt.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + '++' + maskedSrc.slice(this.tokenizer.rules.inline.escapedEmSt.lastIndex);
      }

      while (src) {
        if (!keepPrevChar) {
          prevChar = '';
        }

        keepPrevChar = false; // extensions

        if (this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some(function (extTokenizer) {
          if (token = extTokenizer.call({
            lexer: _this2
          }, src, tokens)) {
            src = src.substring(token.raw.length);
            tokens.push(token);
            return true;
          }

          return false;
        })) {
          continue;
        } // escape


        if (token = this.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // tag


        if (token = this.tokenizer.tag(src)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];

          if (lastToken && token.type === 'text' && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }

          continue;
        } // link


        if (token = this.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // reflink, nolink


        if (token = this.tokenizer.reflink(src, this.tokens.links)) {
          src = src.substring(token.raw.length);
          lastToken = tokens[tokens.length - 1];

          if (lastToken && token.type === 'text' && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }

          continue;
        } // em & strong


        if (token = this.tokenizer.emStrong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // code


        if (token = this.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // br


        if (token = this.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // del (gfm)


        if (token = this.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // autolink


        if (token = this.tokenizer.autolink(src, mangle)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // url (gfm)


        if (!this.state.inLink && (token = this.tokenizer.url(src, mangle))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        } // text
        // prevent inlineText consuming extensions by clipping 'src' to extension start


        cutSrc = src;

        if (this.options.extensions && this.options.extensions.startInline) {
          (function () {
            var startIndex = Infinity;
            var tempSrc = src.slice(1);
            var tempStart = void 0;

            _this2.options.extensions.startInline.forEach(function (getStartIndex) {
              tempStart = getStartIndex.call({
                lexer: this
              }, tempSrc);

              if (typeof tempStart === 'number' && tempStart >= 0) {
                startIndex = Math.min(startIndex, tempStart);
              }
            });

            if (startIndex < Infinity && startIndex >= 0) {
              cutSrc = src.substring(0, startIndex + 1);
            }
          })();
        }

        if (token = this.tokenizer.inlineText(cutSrc, smartypants)) {
          src = src.substring(token.raw.length);

          if (token.raw.slice(-1) !== '_') {
            // Track prevChar before string of ____ started
            prevChar = token.raw.slice(-1);
          }

          keepPrevChar = true;
          lastToken = tokens[tokens.length - 1];

          if (lastToken && lastToken.type === 'text') {
            lastToken.raw += token.raw;
            lastToken.text += token.text;
          } else {
            tokens.push(token);
          }

          continue;
        }

        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);

          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }

      return tokens;
    };

    _createClass(Lexer, null, [{
      key: "rules",
      get: function get() {
        return {
          block: block,
          inline: inline
        };
      }
    }]);

    return Lexer;
  }();

  /**
   * Renderer
   */

  var Renderer = /*#__PURE__*/function () {
    function Renderer(options) {
      this.options = options || exports.defaults;
    }

    var _proto = Renderer.prototype;

    _proto.code = function code(_code, infostring, escaped) {
      var lang = (infostring || '').match(/\S*/)[0];

      if (this.options.highlight) {
        var out = this.options.highlight(_code, lang);

        if (out != null && out !== _code) {
          escaped = true;
          _code = out;
        }
      }

      _code = _code.replace(/\n$/, '') + '\n';

      if (!lang) {
        return '<pre><code>' + (escaped ? _code : escape(_code, true)) + '</code></pre>\n';
      }

      return '<pre><code class="' + this.options.langPrefix + escape(lang, true) + '">' + (escaped ? _code : escape(_code, true)) + '</code></pre>\n';
    };

    _proto.blockquote = function blockquote(quote) {
      return '<blockquote>\n' + quote + '</blockquote>\n';
    };

    _proto.html = function html(_html) {
      return _html;
    };

    _proto.heading = function heading(text, level, raw, slugger) {
      if (this.options.headerIds) {
        return '<h' + level + ' id="' + this.options.headerPrefix + slugger.slug(raw) + '">' + text + '</h' + level + '>\n';
      } // ignore IDs


      return '<h' + level + '>' + text + '</h' + level + '>\n';
    };

    _proto.hr = function hr() {
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };

    _proto.list = function list(body, ordered, start) {
      var type = ordered ? 'ol' : 'ul',
          startatt = ordered && start !== 1 ? ' start="' + start + '"' : '';
      return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
    };

    _proto.listitem = function listitem(text) {
      return '<li>' + text + '</li>\n';
    };

    _proto.checkbox = function checkbox(checked) {
      return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"' + (this.options.xhtml ? ' /' : '') + '> ';
    };

    _proto.paragraph = function paragraph(text) {
      return '<p>' + text + '</p>\n';
    };

    _proto.table = function table(header, body) {
      if (body) body = '<tbody>' + body + '</tbody>';
      return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
    };

    _proto.tablerow = function tablerow(content) {
      return '<tr>\n' + content + '</tr>\n';
    };

    _proto.tablecell = function tablecell(content, flags) {
      var type = flags.header ? 'th' : 'td';
      var tag = flags.align ? '<' + type + ' align="' + flags.align + '">' : '<' + type + '>';
      return tag + content + '</' + type + '>\n';
    } // span level renderer
    ;

    _proto.strong = function strong(text) {
      return '<strong>' + text + '</strong>';
    };

    _proto.em = function em(text) {
      return '<em>' + text + '</em>';
    };

    _proto.codespan = function codespan(text) {
      return '<code>' + text + '</code>';
    };

    _proto.br = function br() {
      return this.options.xhtml ? '<br/>' : '<br>';
    };

    _proto.del = function del(text) {
      return '<del>' + text + '</del>';
    };

    _proto.link = function link(href, title, text) {
      href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);

      if (href === null) {
        return text;
      }

      var out = '<a href="' + escape(href) + '"';

      if (title) {
        out += ' title="' + title + '"';
      }

      out += '>' + text + '</a>';
      return out;
    };

    _proto.image = function image(href, title, text) {
      href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);

      if (href === null) {
        return text;
      }

      var out = '<img src="' + href + '" alt="' + text + '"';

      if (title) {
        out += ' title="' + title + '"';
      }

      out += this.options.xhtml ? '/>' : '>';
      return out;
    };

    _proto.text = function text(_text) {
      return _text;
    };

    return Renderer;
  }();

  /**
   * TextRenderer
   * returns only the textual part of the token
   */
  var TextRenderer = /*#__PURE__*/function () {
    function TextRenderer() {}

    var _proto = TextRenderer.prototype;

    // no need for block level renderers
    _proto.strong = function strong(text) {
      return text;
    };

    _proto.em = function em(text) {
      return text;
    };

    _proto.codespan = function codespan(text) {
      return text;
    };

    _proto.del = function del(text) {
      return text;
    };

    _proto.html = function html(text) {
      return text;
    };

    _proto.text = function text(_text) {
      return _text;
    };

    _proto.link = function link(href, title, text) {
      return '' + text;
    };

    _proto.image = function image(href, title, text) {
      return '' + text;
    };

    _proto.br = function br() {
      return '';
    };

    return TextRenderer;
  }();

  /**
   * Slugger generates header id
   */
  var Slugger = /*#__PURE__*/function () {
    function Slugger() {
      this.seen = {};
    }

    var _proto = Slugger.prototype;

    _proto.serialize = function serialize(value) {
      return value.toLowerCase().trim() // remove html tags
      .replace(/<[!\/a-z].*?>/ig, '') // remove unwanted chars
      .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '').replace(/\s/g, '-');
    }
    /**
     * Finds the next safe (unique) slug to use
     */
    ;

    _proto.getNextSafeSlug = function getNextSafeSlug(originalSlug, isDryRun) {
      var slug = originalSlug;
      var occurenceAccumulator = 0;

      if (this.seen.hasOwnProperty(slug)) {
        occurenceAccumulator = this.seen[originalSlug];

        do {
          occurenceAccumulator++;
          slug = originalSlug + '-' + occurenceAccumulator;
        } while (this.seen.hasOwnProperty(slug));
      }

      if (!isDryRun) {
        this.seen[originalSlug] = occurenceAccumulator;
        this.seen[slug] = 0;
      }

      return slug;
    }
    /**
     * Convert string to unique id
     * @param {object} options
     * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
     */
    ;

    _proto.slug = function slug(value, options) {
      if (options === void 0) {
        options = {};
      }

      var slug = this.serialize(value);
      return this.getNextSafeSlug(slug, options.dryrun);
    };

    return Slugger;
  }();

  /**
   * Parsing & Compiling
   */

  var Parser = /*#__PURE__*/function () {
    function Parser(options) {
      this.options = options || exports.defaults;
      this.options.renderer = this.options.renderer || new Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.textRenderer = new TextRenderer();
      this.slugger = new Slugger();
    }
    /**
     * Static Parse Method
     */


    Parser.parse = function parse(tokens, options) {
      var parser = new Parser(options);
      return parser.parse(tokens);
    }
    /**
     * Static Parse Inline Method
     */
    ;

    Parser.parseInline = function parseInline(tokens, options) {
      var parser = new Parser(options);
      return parser.parseInline(tokens);
    }
    /**
     * Parse Loop
     */
    ;

    var _proto = Parser.prototype;

    _proto.parse = function parse(tokens, top) {
      if (top === void 0) {
        top = true;
      }

      var out = '',
          i,
          j,
          k,
          l2,
          l3,
          row,
          cell,
          header,
          body,
          token,
          ordered,
          start,
          loose,
          itemBody,
          item,
          checked,
          task,
          checkbox,
          ret;
      var l = tokens.length;

      for (i = 0; i < l; i++) {
        token = tokens[i]; // Run any renderer extensions

        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
          ret = this.options.extensions.renderers[token.type].call({
            parser: this
          }, token);

          if (ret !== false || !['space', 'hr', 'heading', 'code', 'table', 'blockquote', 'list', 'html', 'paragraph', 'text'].includes(token.type)) {
            out += ret || '';
            continue;
          }
        }

        switch (token.type) {
          case 'space':
            {
              continue;
            }

          case 'hr':
            {
              out += this.renderer.hr();
              continue;
            }

          case 'heading':
            {
              out += this.renderer.heading(this.parseInline(token.tokens), token.depth, unescape(this.parseInline(token.tokens, this.textRenderer)), this.slugger);
              continue;
            }

          case 'code':
            {
              out += this.renderer.code(token.text, token.lang, token.escaped);
              continue;
            }

          case 'table':
            {
              header = ''; // header

              cell = '';
              l2 = token.header.length;

              for (j = 0; j < l2; j++) {
                cell += this.renderer.tablecell(this.parseInline(token.header[j].tokens), {
                  header: true,
                  align: token.align[j]
                });
              }

              header += this.renderer.tablerow(cell);
              body = '';
              l2 = token.rows.length;

              for (j = 0; j < l2; j++) {
                row = token.rows[j];
                cell = '';
                l3 = row.length;

                for (k = 0; k < l3; k++) {
                  cell += this.renderer.tablecell(this.parseInline(row[k].tokens), {
                    header: false,
                    align: token.align[k]
                  });
                }

                body += this.renderer.tablerow(cell);
              }

              out += this.renderer.table(header, body);
              continue;
            }

          case 'blockquote':
            {
              body = this.parse(token.tokens);
              out += this.renderer.blockquote(body);
              continue;
            }

          case 'list':
            {
              ordered = token.ordered;
              start = token.start;
              loose = token.loose;
              l2 = token.items.length;
              body = '';

              for (j = 0; j < l2; j++) {
                item = token.items[j];
                checked = item.checked;
                task = item.task;
                itemBody = '';

                if (item.task) {
                  checkbox = this.renderer.checkbox(checked);

                  if (loose) {
                    if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
                      item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;

                      if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                        item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                      }
                    } else {
                      item.tokens.unshift({
                        type: 'text',
                        text: checkbox
                      });
                    }
                  } else {
                    itemBody += checkbox;
                  }
                }

                itemBody += this.parse(item.tokens, loose);
                body += this.renderer.listitem(itemBody, task, checked);
              }

              out += this.renderer.list(body, ordered, start);
              continue;
            }

          case 'html':
            {
              // TODO parse inline content if parameter markdown=1
              out += this.renderer.html(token.text);
              continue;
            }

          case 'paragraph':
            {
              out += this.renderer.paragraph(this.parseInline(token.tokens));
              continue;
            }

          case 'text':
            {
              body = token.tokens ? this.parseInline(token.tokens) : token.text;

              while (i + 1 < l && tokens[i + 1].type === 'text') {
                token = tokens[++i];
                body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
              }

              out += top ? this.renderer.paragraph(body) : body;
              continue;
            }

          default:
            {
              var errMsg = 'Token with "' + token.type + '" type was not found.';

              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
        }
      }

      return out;
    }
    /**
     * Parse Inline Tokens
     */
    ;

    _proto.parseInline = function parseInline(tokens, renderer) {
      renderer = renderer || this.renderer;
      var out = '',
          i,
          token,
          ret;
      var l = tokens.length;

      for (i = 0; i < l; i++) {
        token = tokens[i]; // Run any renderer extensions

        if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[token.type]) {
          ret = this.options.extensions.renderers[token.type].call({
            parser: this
          }, token);

          if (ret !== false || !['escape', 'html', 'link', 'image', 'strong', 'em', 'codespan', 'br', 'del', 'text'].includes(token.type)) {
            out += ret || '';
            continue;
          }
        }

        switch (token.type) {
          case 'escape':
            {
              out += renderer.text(token.text);
              break;
            }

          case 'html':
            {
              out += renderer.html(token.text);
              break;
            }

          case 'link':
            {
              out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
              break;
            }

          case 'image':
            {
              out += renderer.image(token.href, token.title, token.text);
              break;
            }

          case 'strong':
            {
              out += renderer.strong(this.parseInline(token.tokens, renderer));
              break;
            }

          case 'em':
            {
              out += renderer.em(this.parseInline(token.tokens, renderer));
              break;
            }

          case 'codespan':
            {
              out += renderer.codespan(token.text);
              break;
            }

          case 'br':
            {
              out += renderer.br();
              break;
            }

          case 'del':
            {
              out += renderer.del(this.parseInline(token.tokens, renderer));
              break;
            }

          case 'text':
            {
              out += renderer.text(token.text);
              break;
            }

          default:
            {
              var errMsg = 'Token with "' + token.type + '" type was not found.';

              if (this.options.silent) {
                console.error(errMsg);
                return;
              } else {
                throw new Error(errMsg);
              }
            }
        }
      }

      return out;
    };

    return Parser;
  }();

  /**
   * Marked
   */

  function marked(src, opt, callback) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked(): input parameter is undefined or null');
    }

    if (typeof src !== 'string') {
      throw new Error('marked(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
    }

    if (typeof opt === 'function') {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});
    checkSanitizeDeprecation(opt);

    if (callback) {
      var highlight = opt.highlight;
      var tokens;

      try {
        tokens = Lexer.lex(src, opt);
      } catch (e) {
        return callback(e);
      }

      var done = function done(err) {
        var out;

        if (!err) {
          try {
            if (opt.walkTokens) {
              marked.walkTokens(tokens, opt.walkTokens);
            }

            out = Parser.parse(tokens, opt);
          } catch (e) {
            err = e;
          }
        }

        opt.highlight = highlight;
        return err ? callback(err) : callback(null, out);
      };

      if (!highlight || highlight.length < 3) {
        return done();
      }

      delete opt.highlight;
      if (!tokens.length) return done();
      var pending = 0;
      marked.walkTokens(tokens, function (token) {
        if (token.type === 'code') {
          pending++;
          setTimeout(function () {
            highlight(token.text, token.lang, function (err, code) {
              if (err) {
                return done(err);
              }

              if (code != null && code !== token.text) {
                token.text = code;
                token.escaped = true;
              }

              pending--;

              if (pending === 0) {
                done();
              }
            });
          }, 0);
        }
      });

      if (pending === 0) {
        done();
      }

      return;
    }

    try {
      var _tokens = Lexer.lex(src, opt);

      if (opt.walkTokens) {
        marked.walkTokens(_tokens, opt.walkTokens);
      }

      return Parser.parse(_tokens, opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';

      if (opt.silent) {
        return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
      }

      throw e;
    }
  }
  /**
   * Options
   */

  marked.options = marked.setOptions = function (opt) {
    merge(marked.defaults, opt);
    changeDefaults(marked.defaults);
    return marked;
  };

  marked.getDefaults = getDefaults;
  marked.defaults = exports.defaults;
  /**
   * Use Extension
   */

  marked.use = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var opts = merge.apply(void 0, [{}].concat(args));
    var extensions = marked.defaults.extensions || {
      renderers: {},
      childTokens: {}
    };
    var hasExtensions;
    args.forEach(function (pack) {
      // ==-- Parse "addon" extensions --== //
      if (pack.extensions) {
        hasExtensions = true;
        pack.extensions.forEach(function (ext) {
          if (!ext.name) {
            throw new Error('extension name required');
          }

          if (ext.renderer) {
            // Renderer extensions
            var prevRenderer = extensions.renderers ? extensions.renderers[ext.name] : null;

            if (prevRenderer) {
              // Replace extension with func to run new extension but fall back if false
              extensions.renderers[ext.name] = function () {
                for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                var ret = ext.renderer.apply(this, args);

                if (ret === false) {
                  ret = prevRenderer.apply(this, args);
                }

                return ret;
              };
            } else {
              extensions.renderers[ext.name] = ext.renderer;
            }
          }

          if (ext.tokenizer) {
            // Tokenizer Extensions
            if (!ext.level || ext.level !== 'block' && ext.level !== 'inline') {
              throw new Error("extension level must be 'block' or 'inline'");
            }

            if (extensions[ext.level]) {
              extensions[ext.level].unshift(ext.tokenizer);
            } else {
              extensions[ext.level] = [ext.tokenizer];
            }

            if (ext.start) {
              // Function to check for start of token
              if (ext.level === 'block') {
                if (extensions.startBlock) {
                  extensions.startBlock.push(ext.start);
                } else {
                  extensions.startBlock = [ext.start];
                }
              } else if (ext.level === 'inline') {
                if (extensions.startInline) {
                  extensions.startInline.push(ext.start);
                } else {
                  extensions.startInline = [ext.start];
                }
              }
            }
          }

          if (ext.childTokens) {
            // Child tokens to be visited by walkTokens
            extensions.childTokens[ext.name] = ext.childTokens;
          }
        });
      } // ==-- Parse "overwrite" extensions --== //


      if (pack.renderer) {
        (function () {
          var renderer = marked.defaults.renderer || new Renderer();

          var _loop = function _loop(prop) {
            var prevRenderer = renderer[prop]; // Replace renderer with func to run extension, but fall back if false

            renderer[prop] = function () {
              for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
              }

              var ret = pack.renderer[prop].apply(renderer, args);

              if (ret === false) {
                ret = prevRenderer.apply(renderer, args);
              }

              return ret;
            };
          };

          for (var prop in pack.renderer) {
            _loop(prop);
          }

          opts.renderer = renderer;
        })();
      }

      if (pack.tokenizer) {
        (function () {
          var tokenizer = marked.defaults.tokenizer || new Tokenizer();

          var _loop2 = function _loop2(prop) {
            var prevTokenizer = tokenizer[prop]; // Replace tokenizer with func to run extension, but fall back if false

            tokenizer[prop] = function () {
              for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
              }

              var ret = pack.tokenizer[prop].apply(tokenizer, args);

              if (ret === false) {
                ret = prevTokenizer.apply(tokenizer, args);
              }

              return ret;
            };
          };

          for (var prop in pack.tokenizer) {
            _loop2(prop);
          }

          opts.tokenizer = tokenizer;
        })();
      } // ==-- Parse WalkTokens extensions --== //


      if (pack.walkTokens) {
        var _walkTokens = marked.defaults.walkTokens;

        opts.walkTokens = function (token) {
          pack.walkTokens.call(this, token);

          if (_walkTokens) {
            _walkTokens.call(this, token);
          }
        };
      }

      if (hasExtensions) {
        opts.extensions = extensions;
      }

      marked.setOptions(opts);
    });
  };
  /**
   * Run callback for every token
   */


  marked.walkTokens = function (tokens, callback) {
    var _loop3 = function _loop3() {
      var token = _step.value;
      callback.call(marked, token);

      switch (token.type) {
        case 'table':
          {
            for (var _iterator2 = _createForOfIteratorHelperLoose(token.header), _step2; !(_step2 = _iterator2()).done;) {
              var cell = _step2.value;
              marked.walkTokens(cell.tokens, callback);
            }

            for (var _iterator3 = _createForOfIteratorHelperLoose(token.rows), _step3; !(_step3 = _iterator3()).done;) {
              var row = _step3.value;

              for (var _iterator4 = _createForOfIteratorHelperLoose(row), _step4; !(_step4 = _iterator4()).done;) {
                var _cell = _step4.value;
                marked.walkTokens(_cell.tokens, callback);
              }
            }

            break;
          }

        case 'list':
          {
            marked.walkTokens(token.items, callback);
            break;
          }

        default:
          {
            if (marked.defaults.extensions && marked.defaults.extensions.childTokens && marked.defaults.extensions.childTokens[token.type]) {
              // Walk any extensions
              marked.defaults.extensions.childTokens[token.type].forEach(function (childTokens) {
                marked.walkTokens(token[childTokens], callback);
              });
            } else if (token.tokens) {
              marked.walkTokens(token.tokens, callback);
            }
          }
      }
    };

    for (var _iterator = _createForOfIteratorHelperLoose(tokens), _step; !(_step = _iterator()).done;) {
      _loop3();
    }
  };
  /**
   * Parse Inline
   */


  marked.parseInline = function (src, opt) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked.parseInline(): input parameter is undefined or null');
    }

    if (typeof src !== 'string') {
      throw new Error('marked.parseInline(): input parameter is of type ' + Object.prototype.toString.call(src) + ', string expected');
    }

    opt = merge({}, marked.defaults, opt || {});
    checkSanitizeDeprecation(opt);

    try {
      var tokens = Lexer.lexInline(src, opt);

      if (opt.walkTokens) {
        marked.walkTokens(tokens, opt.walkTokens);
      }

      return Parser.parseInline(tokens, opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';

      if (opt.silent) {
        return '<p>An error occurred:</p><pre>' + escape(e.message + '', true) + '</pre>';
      }

      throw e;
    }
  };
  /**
   * Expose
   */


  marked.Parser = Parser;
  marked.parser = Parser.parse;
  marked.Renderer = Renderer;
  marked.TextRenderer = TextRenderer;
  marked.Lexer = Lexer;
  marked.lexer = Lexer.lex;
  marked.Tokenizer = Tokenizer;
  marked.Slugger = Slugger;
  marked.parse = marked;
  var options = marked.options;
  var setOptions = marked.setOptions;
  var use = marked.use;
  var walkTokens = marked.walkTokens;
  var parseInline = marked.parseInline;
  var parse = marked;
  var parser = Parser.parse;
  var lexer = Lexer.lex;

  exports.Lexer = Lexer;
  exports.Parser = Parser;
  exports.Renderer = Renderer;
  exports.Slugger = Slugger;
  exports.TextRenderer = TextRenderer;
  exports.Tokenizer = Tokenizer;
  exports.getDefaults = getDefaults;
  exports.lexer = lexer;
  exports.marked = marked;
  exports.options = options;
  exports.parse = parse;
  exports.parseInline = parseInline;
  exports.parser = parser;
  exports.setOptions = setOptions;
  exports.use = use;
  exports.walkTokens = walkTokens;

  Object.defineProperty(exports, '__esModule', { value: true });

}));

},{}],21:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],22:[function(require,module,exports){

module.exports = function () {
  var selection = document.getSelection();
  if (!selection.rangeCount) {
    return function () {};
  }
  var active = document.activeElement;

  var ranges = [];
  for (var i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }

  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML
    case 'INPUT':
    case 'TEXTAREA':
      active.blur();
      break;

    default:
      active = null;
      break;
  }

  selection.removeAllRanges();
  return function () {
    selection.type === 'Caret' &&
    selection.removeAllRanges();

    if (!selection.rangeCount) {
      ranges.forEach(function(range) {
        selection.addRange(range);
      });
    }

    active &&
    active.focus();
  };
};

},{}],23:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = exports.compile = void 0;
var emitter_1 = require("./emitter");
var tokenizer_1 = require("./tokenizer");
var parser_1 = require("./parser");
var compile = function (src) {
    var tokens = (0, tokenizer_1.tokenize)(src);
    var ast = (0, parser_1.parse)(tokens);
    var wasm = (0, emitter_1.emitter)(ast);
    return wasm;
};
exports.compile = compile;
var runtime = function (src, _a) {
    var print = _a.print, displayMemory = _a.displayMemory;
    return __awaiter(void 0, void 0, void 0, function () {
        var wasm, importObject, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    wasm = (0, exports.compile)(src);
                    importObject = {
                        env: { print: print, memory: displayMemory },
                    };
                    return [4 /*yield*/, WebAssembly.instantiate(wasm, importObject)];
                case 1:
                    result = _b.sent();
                    return [2 /*return*/, function () {
                            result.instance.exports.run();
                        }];
            }
        });
    });
};
exports.runtime = runtime;

},{"./emitter":25,"./parser":28,"./tokenizer":29}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
var Constants = /** @class */ (function () {
    function Constants() {
    }
    Constants.CANVAS_DIM = 100;
    return Constants;
}());
exports.Constants = Constants;

},{}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = void 0;
var encoding_1 = require("./encoding");
var traverse_1 = __importDefault(require("./traverse"));
var constants_1 = require("./constants");
var leb = __importStar(require("@thi.ng/leb128"));
var flatten = function (arr) { return [].concat.apply([], __spreadArray([], __read(arr), false)); };
// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
var Section;
(function (Section) {
    Section[Section["custom"] = 0] = "custom";
    Section[Section["type"] = 1] = "type";
    Section[Section["import"] = 2] = "import";
    Section[Section["func"] = 3] = "func";
    Section[Section["table"] = 4] = "table";
    Section[Section["memory"] = 5] = "memory";
    Section[Section["global"] = 6] = "global";
    Section[Section["export"] = 7] = "export";
    Section[Section["start"] = 8] = "start";
    Section[Section["element"] = 9] = "element";
    Section[Section["code"] = 10] = "code";
    Section[Section["data"] = 11] = "data";
})(Section || (Section = {}));
// Reference: https://webassembly.github.io/spec/core/binary/types.html
var ValType;
(function (ValType) {
    ValType[ValType["i32"] = 127] = "i32";
    ValType[ValType["f32"] = 125] = "f32";
})(ValType || (ValType = {}));
// Reference: https://webassembly.github.io/spec/core/syntax/instructions.html#syntax-BlockType
var BlockType;
(function (BlockType) {
    BlockType[BlockType["void"] = 64] = "void";
})(BlockType || (BlockType = {}));
// Reference: https://webassembly.github.io/spec/core/binary/instructions.html
var Opcode;
(function (Opcode) {
    Opcode[Opcode["block"] = 2] = "block";
    Opcode[Opcode["loop"] = 3] = "loop";
    Opcode[Opcode["br"] = 12] = "br";
    Opcode[Opcode["br_if"] = 13] = "br_if";
    Opcode[Opcode["end"] = 11] = "end";
    Opcode[Opcode["call"] = 16] = "call";
    Opcode[Opcode["get_local"] = 32] = "get_local";
    Opcode[Opcode["set_local"] = 33] = "set_local";
    Opcode[Opcode["i32_store_8"] = 58] = "i32_store_8";
    Opcode[Opcode["f32_const"] = 67] = "f32_const";
    Opcode[Opcode["i32_eqz"] = 69] = "i32_eqz";
    Opcode[Opcode["f32_eq"] = 91] = "f32_eq";
    Opcode[Opcode["f32_lt"] = 93] = "f32_lt";
    Opcode[Opcode["f32_gt"] = 94] = "f32_gt";
    Opcode[Opcode["i32_and"] = 113] = "i32_and";
    Opcode[Opcode["i32_or"] = 114] = "i32_or";
    Opcode[Opcode["f32_add"] = 146] = "f32_add";
    Opcode[Opcode["f32_sub"] = 147] = "f32_sub";
    Opcode[Opcode["f32_mul"] = 148] = "f32_mul";
    Opcode[Opcode["f32_div"] = 149] = "f32_div";
    Opcode[Opcode["i32_trunc_f32_s"] = 168] = "i32_trunc_f32_s";
})(Opcode || (Opcode = {}));
var binaryOpcode = {
    "+": Opcode.f32_add,
    "-": Opcode.f32_sub,
    "*": Opcode.f32_mul,
    "/": Opcode.f32_div,
    "==": Opcode.f32_eq,
    ">": Opcode.f32_gt,
    "<": Opcode.f32_lt,
    "&&": Opcode.i32_and,
    "||": Opcode.i32_or,
};
// Reference: http://webassembly.github.io/spec/core/binary/modules.html#export-section
var ExportType;
(function (ExportType) {
    ExportType[ExportType["func"] = 0] = "func";
    ExportType[ExportType["table"] = 1] = "table";
    ExportType[ExportType["mem"] = 2] = "mem";
    ExportType[ExportType["global"] = 3] = "global";
})(ExportType || (ExportType = {}));
// Reference: http://webassembly.github.io/spec/core/binary/types.html#function-types
var functionType = 0x60;
var emptyArray = 0x0;
// Reference: https://webassembly.github.io/spec/core/binary/modules.html#binary-module
var magicModuleHeader = [0x00, 0x61, 0x73, 0x6d];
var moduleVersion = [0x01, 0x00, 0x00, 0x00];
// Reference: https://webassembly.github.io/spec/core/binary/conventions.html#vectors
var encodeVector = function (data) { return __spreadArray(__spreadArray([], __read(leb.encodeULEB128(data.length)), false), __read(flatten(data)), false); };
// Reference: https://webassembly.github.io/spec/core/binary/modules.html#code-section
var encodeLocal = function (count, type) { return __spreadArray(__spreadArray([], __read(leb.encodeULEB128(count)), false), [
    type,
], false); };
// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
var createSection = function (sectionType, data) { return __spreadArray([
    sectionType
], __read(encodeVector(data)), false); };
var codeFromAst = function (ast) {
    var code = [];
    var symbols = new Map();
    var localIndexForSymbol = function (name) {
        if (!symbols.has(name)) {
            symbols.set(name, symbols.size);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return symbols.get(name);
    };
    var emitExpression = function (node) {
        return (0, traverse_1.default)(node, function (node) {
            switch (node.type) {
                case "numberLiteral":
                    code.push(Opcode.f32_const);
                    code.push.apply(code, __spreadArray([], __read((0, encoding_1.numToIeee754Array)(node.value)), false));
                    break;
                case "identifier":
                    code.push(Opcode.get_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol(node.value))), false));
                    break;
                case "binaryExpression":
                    code.push(binaryOpcode[node.operator]);
                    break;
            }
        });
    };
    var emitStatements = function (statements) {
        return statements.forEach(function (statement) {
            switch (statement.type) {
                case "printStatement":
                    emitExpression(statement.expression);
                    code.push(Opcode.call);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(0)), false));
                    break;
                case "variableDeclaration":
                    emitExpression(statement.initializer);
                    code.push(Opcode.set_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol(statement.name))), false));
                    break;
                case "variableAssignment":
                    emitExpression(statement.value);
                    code.push(Opcode.set_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeSLEB128(localIndexForSymbol(statement.name))), false));
                    break;
                case "whileStatement":
                    // Outer block
                    code.push(Opcode.block);
                    code.push(BlockType.void);
                    // Inner loop
                    code.push(Opcode.loop);
                    code.push(BlockType.void);
                    // Compute the while expression
                    emitExpression(statement.expression);
                    code.push(Opcode.i32_eqz);
                    // br_if $label0
                    code.push(Opcode.br_if);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeSLEB128(1)), false));
                    // Nested logic
                    emitStatements(statement.statements);
                    // br $label1
                    code.push(Opcode.br);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeSLEB128(0)), false));
                    // End loop
                    code.push(Opcode.end);
                    // End block
                    code.push(Opcode.end);
                    break;
                case "setpixelStatement":
                    // Compute and cache the parameters
                    emitExpression(statement.x);
                    code.push(Opcode.set_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("x"))), false));
                    emitExpression(statement.y);
                    code.push(Opcode.set_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("y"))), false));
                    emitExpression(statement.color);
                    code.push(Opcode.set_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("color"))), false));
                    // Compute the offset (y * 100) + x
                    code.push(Opcode.get_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("y"))), false));
                    code.push(Opcode.f32_const);
                    code.push.apply(code, __spreadArray([], __read((0, encoding_1.numToIeee754Array)(constants_1.Constants.CANVAS_DIM)), false));
                    code.push(Opcode.f32_mul);
                    code.push(Opcode.get_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("x"))), false));
                    code.push(Opcode.f32_add);
                    // Convert to an integer
                    code.push(Opcode.i32_trunc_f32_s);
                    // Fetch the color
                    code.push(Opcode.get_local);
                    code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(localIndexForSymbol("color"))), false));
                    code.push(Opcode.i32_trunc_f32_s);
                    // Write to memory
                    code.push(Opcode.i32_store_8);
                    code.push.apply(code, [0x00, 0x00]); // Memory align and offset attributes
                    break;
            }
        });
    };
    emitStatements(ast);
    return { code: code, localCount: symbols.size };
};
// Reference: https://webassembly.github.io/spec/core/binary/modules.html
var emitter = function (ast) {
    // Function types contain vectors of parameters and a return type
    var voidVoidType = [functionType, emptyArray, emptyArray];
    var floatVoidType = __spreadArray(__spreadArray([
        functionType
    ], __read(encodeVector([ValType.f32]) /* Parameter types */), false), [
        emptyArray /* Return types */,
    ], false);
    // Vector of function types
    var typeSection = createSection(Section.type, encodeVector([voidVoidType, floatVoidType]));
    // Vector of type indices indicating the type of each function in the code section
    var funcSection = createSection(Section.func, encodeVector([0x00 /* Index of the type */]));
    // Vector of imported functions
    var printFunctionImport = __spreadArray(__spreadArray(__spreadArray([], __read((0, encoding_1.strToBinaryName)("env")), false), __read((0, encoding_1.strToBinaryName)("print")), false), [
        ExportType.func,
        0x01 /* Index of the type */,
    ], false);
    var memoryImport = __spreadArray(__spreadArray(__spreadArray([], __read((0, encoding_1.strToBinaryName)("env")), false), __read((0, encoding_1.strToBinaryName)("memory")), false), [
        ExportType.mem,
        // Limits: https://webassembly.github.io/spec/core/binary/types.html#limits
        0x00,
        0x01,
    ], false);
    var importSection = createSection(Section.import, encodeVector([printFunctionImport, memoryImport]));
    // Vector of exported functions
    var exportSection = createSection(Section.export, encodeVector([
        __spreadArray(__spreadArray([], __read((0, encoding_1.strToBinaryName)("run")), false), [
            ExportType.func,
            0x01 /* Index of the function */,
        ], false),
    ]));
    // Vectors of functions
    var _a = codeFromAst(ast), code = _a.code, localCount = _a.localCount;
    var locals = localCount > 0 ? [encodeLocal(localCount, ValType.f32)] : [];
    var functionBody = encodeVector(__spreadArray(__spreadArray(__spreadArray([], __read(encodeVector(locals)), false), __read(code), false), [
        Opcode.end,
    ], false));
    var codeSection = createSection(Section.code, encodeVector([functionBody]));
    return Uint8Array.from(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(magicModuleHeader), false), __read(moduleVersion), false), __read(typeSection), false), __read(importSection), false), __read(funcSection), false), __read(exportSection), false), __read(codeSection), false));
};
exports.emitter = emitter;

},{"./constants":24,"./encoding":26,"./traverse":30,"@thi.ng/leb128":11}],26:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strToBinaryName = exports.numToIeee754Array = void 0;
var numToIeee754Array = function (n) {
    var buf = Buffer.allocUnsafe(4);
    buf.writeFloatLE(n, 0);
    return Uint8Array.from(buf);
};
exports.numToIeee754Array = numToIeee754Array;
// Reference: https://webassembly.github.io/spec/core/binary/values.html#binary-name
var strToBinaryName = function (str) { return __spreadArray([
    str.length
], __read(str.split("").map(function (s) { return s.charCodeAt(0); })), false); };
exports.strToBinaryName = strToBinaryName;

}).call(this)}).call(this,require("buffer").Buffer)

},{"buffer":17}],27:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtime = void 0;
var tokenizer_1 = require("./tokenizer");
var parser_1 = require("./parser");
var constants_1 = require("./constants");
var applyOperator = function (operator, left, right) {
    switch (operator) {
        case "+":
            return left + right;
        case "-":
            return left - right;
        case "*":
            return left * right;
        case "/":
            return left / right;
        case "==":
            return left == right ? 1 : 0;
        case ">":
            return left > right ? 1 : 0;
        case "<":
            return left < right ? 1 : 0;
        case "&&":
            return left && right;
        case "||":
            return left || right;
    }
    throw Error("Unknown binary operator ".concat(operator));
};
var runtime = function (src, _a) {
    var print = _a.print, displayMemory = _a.displayMemory;
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_b) {
            return [2 /*return*/, function () {
                    var tokens = (0, tokenizer_1.tokenize)(src);
                    var ast = (0, parser_1.parse)(tokens);
                    var symbols = new Map();
                    var evaluateExpression = function (expression) {
                        switch (expression.type) {
                            case "numberLiteral":
                                return expression.value;
                            case "binaryExpression":
                                return applyOperator(expression.operator, evaluateExpression(expression.left), evaluateExpression(expression.right));
                            case "identifier":
                                return symbols.get(expression.value);
                        }
                    };
                    var executeStatements = function (statements) {
                        statements.forEach(function (statement) {
                            switch (statement.type) {
                                case "printStatement":
                                    print(evaluateExpression(statement.expression));
                                    break;
                                case "variableDeclaration":
                                    symbols.set(statement.name, evaluateExpression(statement.initializer));
                                    break;
                                case "variableAssignment":
                                    symbols.set(statement.name, evaluateExpression(statement.value));
                                    break;
                                case "whileStatement":
                                    while (evaluateExpression(statement.expression)) {
                                        executeStatements(statement.statements);
                                    }
                                    break;
                                case "setpixelStatement": {
                                    var x = evaluateExpression(statement.x);
                                    var y = evaluateExpression(statement.y);
                                    var color = evaluateExpression(statement.color);
                                    var displayBuffer = new Uint8Array(displayMemory.buffer);
                                    displayBuffer[y * constants_1.Constants.CANVAS_DIM + x] = color;
                                    break;
                                }
                            }
                        });
                    };
                    executeStatements(ast);
                }];
        });
    });
};
exports.runtime = runtime;

},{"./constants":24,"./parser":28,"./tokenizer":29}],28:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.ParserError = void 0;
var ParserError = /** @class */ (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message, token) {
        var _this = _super.call(this, message) || this;
        _this.token = token;
        return _this;
    }
    return ParserError;
}(Error));
exports.ParserError = ParserError;
var parse = function (tokens) {
    var tokenIterator = tokens[Symbol.iterator]();
    var currentToken = tokenIterator.next().value;
    var currentTokenIsKeyword = function (name) {
        return currentToken.value === name && currentToken.type === "keyword";
    };
    var eatToken = function (value) {
        if (value && value !== currentToken.value) {
            throw new ParserError("Unexpected token value, expected ".concat(value, ", received ").concat(currentToken.value), currentToken);
        }
        currentToken = tokenIterator.next().value;
    };
    var parseExpression = function () {
        var node;
        switch (currentToken.type) {
            case "number":
                node = {
                    type: "numberLiteral",
                    value: Number(currentToken.value),
                };
                eatToken();
                return node;
            case "identifier":
                node = { type: "identifier", value: currentToken.value };
                eatToken();
                return node;
            case "parentheses": {
                eatToken("(");
                var left = parseExpression();
                var operator = currentToken.value;
                eatToken();
                var right = parseExpression();
                eatToken(")");
                return {
                    type: "binaryExpression",
                    left: left,
                    right: right,
                    operator: operator,
                };
            }
            default:
                throw new ParserError("Unexpected token type ".concat(currentToken.type), currentToken);
        }
    };
    var parsePrintStatement = function () {
        eatToken("print");
        return {
            type: "printStatement",
            expression: parseExpression(),
        };
    };
    var parseWhileStatement = function () {
        eatToken("while");
        var expression = parseExpression();
        var statements = [];
        while (!currentTokenIsKeyword("endwhile")) {
            statements.push(parseStatement());
        }
        eatToken("endwhile");
        return { type: "whileStatement", expression: expression, statements: statements };
    };
    var parseVariableAssignment = function () {
        var name = currentToken.value;
        eatToken();
        eatToken("=");
        return { type: "variableAssignment", name: name, value: parseExpression() };
    };
    var parseVariableDeclarationStatement = function () {
        eatToken("var");
        var name = currentToken.value;
        eatToken();
        eatToken("=");
        return {
            type: "variableDeclaration",
            name: name,
            initializer: parseExpression(),
        };
    };
    var parseSetPixelStatement = function () {
        eatToken("setpixel");
        return {
            type: "setpixelStatement",
            x: parseExpression(),
            y: parseExpression(),
            color: parseExpression(),
        };
    };
    var parseStatement = function () {
        if (currentToken.type === "keyword") {
            switch (currentToken.value) {
                case "print":
                    return parsePrintStatement();
                case "var":
                    return parseVariableDeclarationStatement();
                case "while":
                    return parseWhileStatement();
                case "setpixel":
                    return parseSetPixelStatement();
                default:
                    throw new ParserError("Unknown keyword ".concat(currentToken.value), currentToken);
            }
        }
        else if (currentToken.type === "identifier") {
            return parseVariableAssignment();
        }
        else {
            throw new ParserError("Unexpected token type ".concat(currentToken.value), currentToken);
        }
    };
    var nodes = [];
    while (currentToken) {
        nodes.push(parseStatement());
    }
    return nodes;
};
exports.parse = parse;

},{}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = exports.TokenizerError = exports.operators = exports.keywords = void 0;
exports.keywords = ["print", "var", "while", "endwhile", "setpixel"];
exports.operators = ["+", "-", "*", "/", "==", "<", ">", "&&", "||"];
var escapeRegex = function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
var TokenizerError = /** @class */ (function (_super) {
    __extends(TokenizerError, _super);
    function TokenizerError(message, index) {
        var _this = _super.call(this, message) || this;
        _this.index = index;
        return _this;
    }
    return TokenizerError;
}(Error));
exports.TokenizerError = TokenizerError;
// Returns a token if the regex matches at the current index
var regexMatcher = function (regex, type) {
    return function (input, index) {
        var match = input.substring(index).match(regex);
        return match && { type: type, value: match[0] };
    };
};
var matchers = [
    regexMatcher("^-?[.0-9]+([eE]-?[0-9]{2})?", "number"),
    regexMatcher("^(".concat(exports.keywords.join("|"), ")"), "keyword"),
    regexMatcher("^\\s+", "whitespace"),
    regexMatcher("^(".concat(exports.operators.map(escapeRegex).join("|"), ")"), "operator"),
    regexMatcher("^[a-zA-Z]+", "identifier"),
    regexMatcher("^=", "assignment"),
    regexMatcher("^[()]{1}", "parentheses"),
];
var locationForIndex = function (input, index) { return ({
    char: index - input.lastIndexOf("\n", index) - 1,
    line: input.substring(0, index).split("\n").length - 1,
}); };
var tokenize = function (input) {
    var tokens = [];
    var index = 0;
    while (index < input.length) {
        var matches = matchers.map(function (m) { return m(input, index); }).filter(function (f) { return f; });
        if (matches.length > 0 && matches[0]) {
            // Take the highest priority match (at first index)
            var match = matches[0];
            if (match.type !== "whitespace") {
                tokens.push(__assign(__assign({}, match), locationForIndex(input, index)));
            }
            index += match.value.length;
        }
        else {
            throw new TokenizerError("Unexpected token ".concat(input.substring(index, index + 1)), index);
        }
    }
    return tokens;
};
exports.tokenize = tokenize;

},{}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Postorder AST traversal for the stack machine (operands then operator)
var traverse = function (nodes, visitor) {
    nodes = Array.isArray(nodes) ? nodes : [nodes];
    nodes.forEach(function (node) {
        Object.keys(node).forEach(function (prop) {
            var value = node[prop];
            var valueAsArray = Array.isArray(value) ? value : [value];
            valueAsArray.forEach(function (childNode) {
                if (typeof childNode.type === "string") {
                    traverse(childNode, visitor);
                }
            });
        });
        visitor(node);
    });
};
exports.default = traverse;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkb2NzL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvYXBpL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2FycmF5cy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9iaW5hcnkvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvY2hlY2tzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2NvbXBhcmUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvY29tcG9zZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9lcXVpdi9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9lcnJvcnMvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvaGV4L2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2xlYjEyOC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9tYXRoL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL3JhbmRvbS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy90cmFuc2R1Y2Vycy1iaW5hcnkvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvdHJhbnNkdWNlcnMvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY29weS10by1jbGlwYm9hcmQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC51bWQuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RvZ2dsZS1zZWxlY3Rpb24vaW5kZXguanMiLCJzcmMvY29tcGlsZXIudHMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL2VtaXR0ZXIudHMiLCJzcmMvZW5jb2RpbmcudHMiLCJzcmMvaW50ZXJwcmV0ZXIudHMiLCJzcmMvcGFyc2VyLnRzIiwic3JjL3Rva2VuaXplci50cyIsInNyYy90cmF2ZXJzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0dBLHdFQUFxQztBQUNyQyxpQ0FBZ0M7QUFFaEMsa0RBQW1FO0FBQ25FLDRDQUE2RDtBQUM3RCw4Q0FBNEM7QUFDNUMsOENBQTZDO0FBRzdDLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekQsSUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3RCxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBd0IsQ0FBQztBQUN4RSxJQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUMzQyxnQkFBZ0IsQ0FDTSxDQUFDO0FBQ3pCLElBQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFzQixDQUFDO0FBQ3RFLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQzNDLGVBQWUsQ0FDSSxDQUFDO0FBQ3RCLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQzNDLGVBQWUsQ0FDSSxDQUFDO0FBQ3RCLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFtQixDQUFDO0FBQzdFLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFtQixDQUFDO0FBRTVFLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7SUFDeEIsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRSxRQUFRLENBQUMsS0FBSyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0NBQzNDO0FBRUQscURBQXFEO0FBQ3JELElBQU0sY0FBYyxHQUFHLFVBQ3JCLFNBQW9CLEVBQ3BCLEtBQWEsRUFDYixHQUE2QjtJQUU3QixJQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUNoQyxTQUFTLENBQUMsS0FBSyxHQUFHLEtBQUssRUFDdkIsU0FBUyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQ3pCLENBQUM7SUFDRixJQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDbkQsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDL0MsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDOUMsSUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQ3pDLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUNqQyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQ3RDLENBQUM7WUFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRTtnQkFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDOUIsSUFBTSxPQUFPLEdBQUcsR0FBRyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLElBQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ2xFO1NBQ0Y7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUVGLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUU7SUFDeEMsS0FBSyxFQUFFO1FBQ0w7WUFDRSxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsV0FBSSxvQkFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBRyxDQUFDO1lBQzVDLEtBQUssRUFBRSxTQUFTO1NBQ2pCO1FBQ0Q7WUFDRSxLQUFLLEVBQUUsb0RBQW9EO1lBQzNELEtBQUssRUFBRSxRQUFRO1NBQ2hCO1FBQ0QsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7UUFDM0MsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUU7S0FDN0M7Q0FDRixDQUFDLENBQUM7QUFFSCxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRTtJQUMvQyxJQUFJLEVBQUUsWUFBWTtJQUNsQixLQUFLLEVBQUUsU0FBUztJQUNoQixXQUFXLEVBQUUsSUFBSTtDQUNsQixDQUFDLENBQUM7QUFFSCxJQUFNLFVBQVUsR0FBRyxVQUFDLE9BQXdCO0lBQzFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQzdELENBQUMsQ0FBQztBQUVGLElBQUksV0FBZ0IsQ0FBQztBQUVyQixJQUFNLFNBQVMsR0FBRyxVQUFDLEtBQVk7SUFDN0IsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO1FBQ2QsV0FBVyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQzNCLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFDcEMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUN6RCxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FDdkIsQ0FBQztLQUNIO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsSUFBTSxZQUFZLEdBQUcsVUFBQyxhQUF5QjtJQUM3QyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXBDLG9FQUFvRTtJQUNwRSxJQUFNLE9BQU8sR0FBRyxHQUFJLENBQUMsZUFBZSxDQUNsQyxxQkFBUyxDQUFDLFVBQVUsRUFDcEIscUJBQVMsQ0FBQyxVQUFVLENBQ3JCLENBQUM7SUFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcscUJBQVMsQ0FBQyxVQUFVLEdBQUcscUJBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDcEUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTTtRQUM5QyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUNwRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTztRQUNuRCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUTtLQUN4QztJQUVELElBQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0lBQ3ZDLG9FQUFvRTtJQUNwRSxJQUFNLElBQUksR0FBRyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxHQUFJLENBQUMsQ0FBQztJQUN4RCxHQUFHLGFBQUgsR0FBRyx1QkFBSCxHQUFHLENBQUUsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDO0FBRUYsSUFBTSxHQUFHLEdBQUcsVUFBTyxPQUFnQjs7Ozs7Z0JBQ2pDLElBQUksV0FBVyxFQUFFO29CQUNmLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDckI7Z0JBRUQsYUFBYSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBRXpCLFVBQVUsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUVwQixLQUFLLEdBQUcsVUFBTyxFQUFVOzs7b0NBQzdCLHFCQUFNLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxJQUFLLE9BQUEsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBdkIsQ0FBdUIsQ0FBQyxFQUFBOztnQ0FBdkQsU0FBdUQsQ0FBQzs7OztxQkFDekQsQ0FBQztnQkFFRixxQkFBTSxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUE7O2dCQUFmLFNBQWUsQ0FBQzs7OztnQkFLUixhQUFhLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlDLHFCQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUU7d0JBQzlDLEtBQUssRUFBRSxVQUFVO3dCQUNqQixhQUFhLGVBQUE7cUJBQ2QsQ0FBQyxFQUFBOztnQkFIRixZQUFZLEdBQUcsU0FHYixDQUFDO2dCQUVILFlBQVksRUFBRSxDQUFDO2dCQUNULGFBQWEsR0FBRyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNELFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFFNUIsZUFBZSxhQUFmLGVBQWUsdUJBQWYsZUFBZSxDQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLGFBQWEsYUFBYixhQUFhLHVCQUFiLGFBQWEsQ0FBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7O2dCQUUxQyxVQUFVLENBQUUsR0FBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkMsU0FBUyxDQUFFLEdBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7OztnQkFFcEMsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7Ozs7O0tBRTVCLENBQUM7QUFFRixlQUFlLGFBQWYsZUFBZSx1QkFBZixlQUFlLENBQUUsZ0JBQWdCLENBQUMsT0FBTyxFQUFFOzs7O2dCQUN6QyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDeEMsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzFDLHFCQUFNLEdBQUcsQ0FBQyxxQkFBa0IsQ0FBQyxFQUFBOztnQkFBN0IsU0FBNkIsQ0FBQzs7OztLQUMvQixDQUFDLENBQUM7QUFFSCxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsZ0JBQWdCLENBQUMsT0FBTyxFQUFFOzs7O2dCQUN2QyxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEMsZUFBZSxhQUFmLGVBQWUsdUJBQWYsZUFBZSxDQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLHFCQUFNLEdBQUcsQ0FBQyxrQkFBZSxDQUFDLEVBQUE7O2dCQUExQixTQUEwQixDQUFDOzs7O0tBQzVCLENBQUMsQ0FBQztBQUVILENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFO0lBQ25DLElBQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDL0IsSUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLElBQU0saUJBQWlCLEdBQUcsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDekQsYUFBYSxDQUFDLEtBQUssR0FBRyxVQUFHLE9BQU8sY0FBSSxpQkFBaUIsQ0FBRSxDQUFDO0lBRXhELGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQztBQUVILGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsY0FBTSxPQUFBLElBQUEsMkJBQUksRUFBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQXpCLENBQXlCLENBQUMsQ0FBQztBQUV6RSxJQUFNLGVBQWUsR0FBRyx5NEJBdUJ2QixDQUFDO0FBRUYsV0FBVyxDQUFDLFNBQVMsR0FBRyxlQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDOzs7Ozs7QUNoTnREO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Y0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3ZRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqcUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMW1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHJFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ24yRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdkNBLHFDQUFvQztBQUNwQyx5Q0FBdUM7QUFDdkMsbUNBQWlDO0FBRTFCLElBQU0sT0FBTyxHQUFhLFVBQUMsR0FBRztJQUNuQyxJQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFRLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsSUFBTSxHQUFHLEdBQUcsSUFBQSxjQUFLLEVBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsSUFBTSxJQUFJLEdBQUcsSUFBQSxpQkFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyxDQUFDO0FBTFcsUUFBQSxPQUFPLFdBS2xCO0FBRUssSUFBTSxPQUFPLEdBQVksVUFBTyxHQUFHLEVBQUUsRUFBd0I7UUFBdEIsS0FBSyxXQUFBLEVBQUUsYUFBYSxtQkFBQTs7Ozs7O29CQUMxRCxJQUFJLEdBQUcsSUFBQSxlQUFPLEVBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BCLFlBQVksR0FBRzt3QkFDbkIsR0FBRyxFQUFFLEVBQUUsS0FBSyxPQUFBLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTtxQkFDdEMsQ0FBQztvQkFDa0IscUJBQU0sV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLEVBQUE7O29CQUEvRCxNQUFNLEdBQVEsU0FBaUQ7b0JBQ3JFLHNCQUFPOzRCQUNMLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNoQyxDQUFDLEVBQUM7Ozs7Q0FDSCxDQUFDO0FBVFcsUUFBQSxPQUFPLFdBU2xCOzs7Ozs7QUNwQkY7SUFBQTtJQUVBLENBQUM7SUFEaUIsb0JBQVUsR0FBVyxHQUFHLENBQUM7SUFDM0MsZ0JBQUM7Q0FGRCxBQUVDLElBQUE7QUFGcUIsOEJBQVM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQS9CLHVDQUFnRTtBQUNoRSx3REFBa0M7QUFDbEMseUNBQXdDO0FBQ3hDLGtEQUFzQztBQUV0QyxJQUFNLE9BQU8sR0FBRyxVQUFDLEdBQVUsSUFBSyxPQUFBLEVBQUUsQ0FBQyxNQUFNLE9BQVQsRUFBRSwyQkFBVyxHQUFHLFlBQWhCLENBQWlCLENBQUM7QUFFbEQsa0ZBQWtGO0FBQ2xGLElBQUssT0FhSjtBQWJELFdBQUssT0FBTztJQUNWLHlDQUFVLENBQUE7SUFDVixxQ0FBUSxDQUFBO0lBQ1IseUNBQVUsQ0FBQTtJQUNWLHFDQUFRLENBQUE7SUFDUix1Q0FBUyxDQUFBO0lBQ1QseUNBQVUsQ0FBQTtJQUNWLHlDQUFVLENBQUE7SUFDVix5Q0FBVSxDQUFBO0lBQ1YsdUNBQVMsQ0FBQTtJQUNULDJDQUFXLENBQUE7SUFDWCxzQ0FBUyxDQUFBO0lBQ1Qsc0NBQVMsQ0FBQTtBQUNYLENBQUMsRUFiSSxPQUFPLEtBQVAsT0FBTyxRQWFYO0FBRUQsdUVBQXVFO0FBQ3ZFLElBQUssT0FHSjtBQUhELFdBQUssT0FBTztJQUNWLHFDQUFVLENBQUE7SUFDVixxQ0FBVSxDQUFBO0FBQ1osQ0FBQyxFQUhJLE9BQU8sS0FBUCxPQUFPLFFBR1g7QUFFRCwrRkFBK0Y7QUFDL0YsSUFBSyxTQUVKO0FBRkQsV0FBSyxTQUFTO0lBQ1osMENBQVcsQ0FBQTtBQUNiLENBQUMsRUFGSSxTQUFTLEtBQVQsU0FBUyxRQUViO0FBRUQsOEVBQThFO0FBQzlFLElBQUssTUFzQko7QUF0QkQsV0FBSyxNQUFNO0lBQ1QscUNBQVksQ0FBQTtJQUNaLG1DQUFXLENBQUE7SUFDWCxnQ0FBUyxDQUFBO0lBQ1Qsc0NBQVksQ0FBQTtJQUNaLGtDQUFVLENBQUE7SUFDVixvQ0FBVyxDQUFBO0lBQ1gsOENBQWdCLENBQUE7SUFDaEIsOENBQWdCLENBQUE7SUFDaEIsa0RBQWtCLENBQUE7SUFDbEIsOENBQWdCLENBQUE7SUFDaEIsMENBQWMsQ0FBQTtJQUNkLHdDQUFhLENBQUE7SUFDYix3Q0FBYSxDQUFBO0lBQ2Isd0NBQWEsQ0FBQTtJQUNiLDJDQUFjLENBQUE7SUFDZCx5Q0FBYSxDQUFBO0lBQ2IsMkNBQWMsQ0FBQTtJQUNkLDJDQUFjLENBQUE7SUFDZCwyQ0FBYyxDQUFBO0lBQ2QsMkNBQWMsQ0FBQTtJQUNkLDJEQUFzQixDQUFBO0FBQ3hCLENBQUMsRUF0QkksTUFBTSxLQUFOLE1BQU0sUUFzQlY7QUFFRCxJQUFNLFlBQVksR0FBRztJQUNuQixHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU87SUFDbkIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPO0lBQ25CLEdBQUcsRUFBRSxNQUFNLENBQUMsT0FBTztJQUNuQixHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU87SUFDbkIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNO0lBQ25CLEdBQUcsRUFBRSxNQUFNLENBQUMsTUFBTTtJQUNsQixHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU07SUFDbEIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPO0lBQ3BCLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTTtDQUNwQixDQUFDO0FBRUYsdUZBQXVGO0FBQ3ZGLElBQUssVUFLSjtBQUxELFdBQUssVUFBVTtJQUNiLDJDQUFXLENBQUE7SUFDWCw2Q0FBWSxDQUFBO0lBQ1oseUNBQVUsQ0FBQTtJQUNWLCtDQUFhLENBQUE7QUFDZixDQUFDLEVBTEksVUFBVSxLQUFWLFVBQVUsUUFLZDtBQUVELHFGQUFxRjtBQUNyRixJQUFNLFlBQVksR0FBRyxJQUFJLENBQUM7QUFFMUIsSUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBRXZCLHVGQUF1RjtBQUN2RixJQUFNLGlCQUFpQixHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkQsSUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUUvQyxxRkFBcUY7QUFDckYsSUFBTSxZQUFZLEdBQUcsVUFBQyxJQUFXLElBQUssOENBQ2pDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUZvQixDQUdyQyxDQUFDO0FBRUYsc0ZBQXNGO0FBQ3RGLElBQU0sV0FBVyxHQUFHLFVBQUMsS0FBYSxFQUFFLElBQWEsSUFBSyw4Q0FDakQsR0FBRyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7SUFDM0IsSUFBSTtXQUZnRCxDQUdyRCxDQUFDO0FBRUYsa0ZBQWtGO0FBQ2xGLElBQU0sYUFBYSxHQUFHLFVBQUMsV0FBb0IsRUFBRSxJQUFXLElBQUs7SUFDM0QsV0FBVztVQUNSLFlBQVksQ0FBQyxJQUFJLENBQUMsV0FGc0MsQ0FHNUQsQ0FBQztBQUVGLElBQU0sV0FBVyxHQUFHLFVBQUMsR0FBWTtJQUMvQixJQUFNLElBQUksR0FBYSxFQUFFLENBQUM7SUFFMUIsSUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFFMUMsSUFBTSxtQkFBbUIsR0FBRyxVQUFDLElBQVk7UUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pDO1FBQ0Qsb0VBQW9FO1FBQ3BFLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUUsQ0FBQztJQUM1QixDQUFDLENBQUM7SUFFRixJQUFNLGNBQWMsR0FBRyxVQUFDLElBQW9CO1FBQzFDLE9BQUEsSUFBQSxrQkFBUSxFQUFDLElBQUksRUFBRSxVQUFDLElBQUk7WUFDbEIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUNqQixLQUFLLGVBQWU7b0JBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsSUFBQSw0QkFBaUIsRUFBRSxJQUEwQixDQUFDLEtBQUssQ0FBQyxXQUFFO29CQUNuRSxNQUFNO2dCQUNSLEtBQUssWUFBWTtvQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUNDLEdBQUcsQ0FBQyxhQUFhLENBQ2xCLG1CQUFtQixDQUFFLElBQXVCLENBQUMsS0FBSyxDQUFDLENBQ3BELFdBQ0Q7b0JBQ0YsTUFBTTtnQkFDUixLQUFLLGtCQUFrQjtvQkFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUUsSUFBNEIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUNoRSxNQUFNO2FBQ1Q7UUFDSCxDQUFDLENBQUM7SUFsQkYsQ0FrQkUsQ0FBQztJQUVMLElBQU0sY0FBYyxHQUFHLFVBQUMsVUFBMkI7UUFDakQsT0FBQSxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUMsU0FBUztZQUMzQixRQUFRLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0JBQ3RCLEtBQUssZ0JBQWdCO29CQUNuQixjQUFjLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFdBQUU7b0JBQ25DLE1BQU07Z0JBQ1IsS0FBSyxxQkFBcUI7b0JBQ3hCLGNBQWMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBRTtvQkFDckUsTUFBTTtnQkFDUixLQUFLLG9CQUFvQjtvQkFDdkIsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFFO29CQUNyRSxNQUFNO2dCQUNSLEtBQUssZ0JBQWdCO29CQUNuQixjQUFjO29CQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFMUIsYUFBYTtvQkFDYixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTFCLCtCQUErQjtvQkFDL0IsY0FBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBRTFCLGdCQUFnQjtvQkFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3hCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxXQUFFO29CQUVuQyxlQUFlO29CQUNmLGNBQWMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBRXJDLGFBQWE7b0JBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxXQUFFO29CQUVuQyxXQUFXO29CQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUV0QixZQUFZO29CQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUN0QixNQUFNO2dCQUNSLEtBQUssbUJBQW1CO29CQUN0QixtQ0FBbUM7b0JBQ25DLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFFO29CQUUxRCxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBRTtvQkFFMUQsY0FBYyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQUU7b0JBRTlELG1DQUFtQztvQkFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQUU7b0JBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsSUFBQSw0QkFBaUIsRUFBQyxxQkFBUyxDQUFDLFVBQVUsQ0FBQyxXQUFFO29CQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFFMUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQUU7b0JBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUUxQix3QkFBd0I7b0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUVsQyxrQkFBa0I7b0JBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFFO29CQUM5RCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFFbEMsa0JBQWtCO29CQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLEVBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxxQ0FBcUM7b0JBQ2pFLE1BQU07YUFDVDtRQUNILENBQUMsQ0FBQztJQXJGRixDQXFGRSxDQUFDO0lBRUwsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRXBCLE9BQU8sRUFBRSxJQUFJLE1BQUEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzVDLENBQUMsQ0FBQztBQUVGLHlFQUF5RTtBQUNsRSxJQUFNLE9BQU8sR0FBWSxVQUFDLEdBQVk7SUFDM0MsaUVBQWlFO0lBQ2pFLElBQU0sWUFBWSxHQUFHLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUU1RCxJQUFNLGFBQWE7UUFDakIsWUFBWTtjQUNULFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtRQUNwRCxVQUFVLENBQUMsa0JBQWtCO2FBQzlCLENBQUM7SUFFRiwyQkFBMkI7SUFDM0IsSUFBTSxXQUFXLEdBQUcsYUFBYSxDQUMvQixPQUFPLENBQUMsSUFBSSxFQUNaLFlBQVksQ0FBQyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUM1QyxDQUFDO0lBRUYsa0ZBQWtGO0lBQ2xGLElBQU0sV0FBVyxHQUFHLGFBQWEsQ0FDL0IsT0FBTyxDQUFDLElBQUksRUFDWixZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUM3QyxDQUFDO0lBRUYsK0JBQStCO0lBQy9CLElBQU0sbUJBQW1CLHdEQUNwQixJQUFBLDBCQUFlLEVBQUMsS0FBSyxDQUFDLGtCQUN0QixJQUFBLDBCQUFlLEVBQUMsT0FBTyxDQUFDO1FBQzNCLFVBQVUsQ0FBQyxJQUFJO1FBQ2YsSUFBSSxDQUFDLHVCQUF1QjthQUM3QixDQUFDO0lBRUYsSUFBTSxZQUFZLHdEQUNiLElBQUEsMEJBQWUsRUFBQyxLQUFLLENBQUMsa0JBQ3RCLElBQUEsMEJBQWUsRUFBQyxRQUFRLENBQUM7UUFDNUIsVUFBVSxDQUFDLEdBQUc7UUFDZCwyRUFBMkU7UUFDM0UsSUFBSTtRQUNKLElBQUk7YUFDTCxDQUFDO0lBRUYsSUFBTSxhQUFhLEdBQUcsYUFBYSxDQUNqQyxPQUFPLENBQUMsTUFBTSxFQUNkLFlBQVksQ0FBQyxDQUFDLG1CQUFtQixFQUFFLFlBQVksQ0FBQyxDQUFDLENBQ2xELENBQUM7SUFFRiwrQkFBK0I7SUFDL0IsSUFBTSxhQUFhLEdBQUcsYUFBYSxDQUNqQyxPQUFPLENBQUMsTUFBTSxFQUNkLFlBQVksQ0FBQzsrQ0FFTixJQUFBLDBCQUFlLEVBQUMsS0FBSyxDQUFDO1lBQ3pCLFVBQVUsQ0FBQyxJQUFJO1lBQ2YsSUFBSSxDQUFDLDJCQUEyQjs7S0FFbkMsQ0FBQyxDQUNILENBQUM7SUFFRix1QkFBdUI7SUFDakIsSUFBQSxLQUF1QixXQUFXLENBQUMsR0FBRyxDQUFDLEVBQXJDLElBQUksVUFBQSxFQUFFLFVBQVUsZ0JBQXFCLENBQUM7SUFDOUMsSUFBTSxNQUFNLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFNUUsSUFBTSxZQUFZLEdBQUcsWUFBWSxzREFDNUIsWUFBWSxDQUFDLE1BQU0sQ0FBQyxrQkFDcEIsSUFBSTtRQUNQLE1BQU0sQ0FBQyxHQUFHO2NBQ1YsQ0FBQztJQUVILElBQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU5RSxPQUFPLFVBQVUsQ0FBQyxJQUFJLDhHQUNqQixpQkFBaUIsa0JBQ2pCLGFBQWEsa0JBQ2IsV0FBVyxrQkFDWCxhQUFhLGtCQUNiLFdBQVcsa0JBQ1gsYUFBYSxrQkFDYixXQUFXLFVBQ2QsQ0FBQztBQUNMLENBQUMsQ0FBQztBQTdFVyxRQUFBLE9BQU8sV0E2RWxCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3ZUSyxJQUFNLGlCQUFpQixHQUFHLFVBQUMsQ0FBUztJQUN6QyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3ZCLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUM7QUFKVyxRQUFBLGlCQUFpQixxQkFJNUI7QUFFRixvRkFBb0Y7QUFDN0UsSUFBTSxlQUFlLEdBQUcsVUFBQyxHQUFXLElBQWU7SUFDeEQsR0FBRyxDQUFDLE1BQU07VUFDUCxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQWYsQ0FBZSxDQUFDLFdBRlksQ0FHekQsQ0FBQztBQUhXLFFBQUEsZUFBZSxtQkFHMUI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDVkYseUNBQXVDO0FBQ3ZDLG1DQUFpQztBQUNqQyx5Q0FBd0M7QUFFeEMsSUFBTSxhQUFhLEdBQUcsVUFBQyxRQUFnQixFQUFFLElBQVksRUFBRSxLQUFhO0lBQ2xFLFFBQVEsUUFBUSxFQUFFO1FBQ2hCLEtBQUssR0FBRztZQUNOLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztRQUN0QixLQUFLLEdBQUc7WUFDTixPQUFPLElBQUksR0FBRyxLQUFLLENBQUM7UUFDdEIsS0FBSyxHQUFHO1lBQ04sT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLEtBQUssR0FBRztZQUNOLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztRQUN0QixLQUFLLElBQUk7WUFDUCxPQUFPLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLEtBQUssR0FBRztZQUNOLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsS0FBSyxHQUFHO1lBQ04sT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixLQUFLLElBQUk7WUFDUCxPQUFPLElBQUksSUFBSSxLQUFLLENBQUM7UUFDdkIsS0FBSyxJQUFJO1lBQ1AsT0FBTyxJQUFJLElBQUksS0FBSyxDQUFDO0tBQ3hCO0lBQ0QsTUFBTSxLQUFLLENBQUMsa0NBQTJCLFFBQVEsQ0FBRSxDQUFDLENBQUM7QUFDckQsQ0FBQyxDQUFDO0FBRUssSUFBTSxPQUFPLEdBQ2xCLFVBQU8sR0FBRyxFQUFFLEVBQXdCO1FBQXRCLEtBQUssV0FBQSxFQUFFLGFBQWEsbUJBQUE7OztZQUNsQyxzQkFBQTtvQkFDRSxJQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFRLEVBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzdCLElBQU0sR0FBRyxHQUFHLElBQUEsY0FBSyxFQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUUxQixJQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUUxQixJQUFNLGtCQUFrQixHQUFHLFVBQUMsVUFBMEI7d0JBQ3BELFFBQVEsVUFBVSxDQUFDLElBQUksRUFBRTs0QkFDdkIsS0FBSyxlQUFlO2dDQUNsQixPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUM7NEJBQzFCLEtBQUssa0JBQWtCO2dDQUNyQixPQUFPLGFBQWEsQ0FDbEIsVUFBVSxDQUFDLFFBQVEsRUFDbkIsa0JBQWtCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUNuQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQ3JDLENBQUM7NEJBQ0osS0FBSyxZQUFZO2dDQUNmLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3hDO29CQUNILENBQUMsQ0FBQztvQkFFRixJQUFNLGlCQUFpQixHQUFHLFVBQUMsVUFBMkI7d0JBQ3BELFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQyxTQUFTOzRCQUMzQixRQUFRLFNBQVMsQ0FBQyxJQUFJLEVBQUU7Z0NBQ3RCLEtBQUssZ0JBQWdCO29DQUNuQixLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0NBQ2hELE1BQU07Z0NBQ1IsS0FBSyxxQkFBcUI7b0NBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQ1QsU0FBUyxDQUFDLElBQUksRUFDZCxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQzFDLENBQUM7b0NBQ0YsTUFBTTtnQ0FDUixLQUFLLG9CQUFvQjtvQ0FDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29DQUNqRSxNQUFNO2dDQUNSLEtBQUssZ0JBQWdCO29DQUNuQixPQUFPLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTt3Q0FDL0MsaUJBQWlCLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FDQUN6QztvQ0FDRCxNQUFNO2dDQUNSLEtBQUssbUJBQW1CLENBQUMsQ0FBQztvQ0FDeEIsSUFBTSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29DQUMxQyxJQUFNLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0NBQzFDLElBQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQ0FDbEQsSUFBTSxhQUFhLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29DQUMzRCxhQUFhLENBQUMsQ0FBQyxHQUFHLHFCQUFTLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztvQ0FDcEQsTUFBTTtpQ0FDUDs2QkFDRjt3QkFDSCxDQUFDLENBQUMsQ0FBQztvQkFDTCxDQUFDLENBQUM7b0JBRUYsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3pCLENBQUMsRUFBQTs7O0NBQUEsQ0FBQztBQXhEUyxRQUFBLE9BQU8sV0F3RGhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwRko7SUFBaUMsK0JBQUs7SUFFcEMscUJBQVksT0FBZSxFQUFFLEtBQVk7UUFBekMsWUFDRSxrQkFBTSxPQUFPLENBQUMsU0FFZjtRQURDLEtBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDOztJQUNyQixDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQU5BLEFBTUMsQ0FOZ0MsS0FBSyxHQU1yQztBQU5ZLGtDQUFXO0FBUWpCLElBQU0sS0FBSyxHQUFXLFVBQUMsTUFBTTtJQUNsQyxJQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7SUFDaEQsSUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQztJQUU5QyxJQUFNLHFCQUFxQixHQUFHLFVBQUMsSUFBWTtRQUN6QyxPQUFBLFlBQVksQ0FBQyxLQUFLLEtBQUssSUFBSSxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUztJQUE5RCxDQUE4RCxDQUFDO0lBRWpFLElBQU0sUUFBUSxHQUFHLFVBQUMsS0FBYztRQUM5QixJQUFJLEtBQUssSUFBSSxLQUFLLEtBQUssWUFBWSxDQUFDLEtBQUssRUFBRTtZQUN6QyxNQUFNLElBQUksV0FBVyxDQUNuQiwyQ0FBb0MsS0FBSyx3QkFBYyxZQUFZLENBQUMsS0FBSyxDQUFFLEVBQzNFLFlBQVksQ0FDYixDQUFDO1NBQ0g7UUFDRCxZQUFZLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQztJQUM1QyxDQUFDLENBQUM7SUFFRixJQUFNLGVBQWUsR0FBK0I7UUFDbEQsSUFBSSxJQUFvQixDQUFDO1FBQ3pCLFFBQVEsWUFBWSxDQUFDLElBQUksRUFBRTtZQUN6QixLQUFLLFFBQVE7Z0JBQ1gsSUFBSSxHQUFHO29CQUNMLElBQUksRUFBRSxlQUFlO29CQUNyQixLQUFLLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7aUJBQ2xDLENBQUM7Z0JBQ0YsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7WUFDZCxLQUFLLFlBQVk7Z0JBQ2YsSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN6RCxRQUFRLEVBQUUsQ0FBQztnQkFDWCxPQUFPLElBQUksQ0FBQztZQUNkLEtBQUssYUFBYSxDQUFDLENBQUM7Z0JBQ2xCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZCxJQUFNLElBQUksR0FBRyxlQUFlLEVBQUUsQ0FBQztnQkFDL0IsSUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQztnQkFDcEMsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsSUFBTSxLQUFLLEdBQUcsZUFBZSxFQUFFLENBQUM7Z0JBQ2hDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDZCxPQUFPO29CQUNMLElBQUksRUFBRSxrQkFBa0I7b0JBQ3hCLElBQUksTUFBQTtvQkFDSixLQUFLLE9BQUE7b0JBQ0wsUUFBUSxFQUFFLFFBQW9CO2lCQUMvQixDQUFDO2FBQ0g7WUFDRDtnQkFDRSxNQUFNLElBQUksV0FBVyxDQUNuQixnQ0FBeUIsWUFBWSxDQUFDLElBQUksQ0FBRSxFQUM1QyxZQUFZLENBQ2IsQ0FBQztTQUNMO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsSUFBTSxtQkFBbUIsR0FBbUM7UUFDMUQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2xCLE9BQU87WUFDTCxJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLFVBQVUsRUFBRSxlQUFlLEVBQUU7U0FDOUIsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUVGLElBQU0sbUJBQW1CLEdBQW1DO1FBQzFELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVsQixJQUFNLFVBQVUsR0FBRyxlQUFlLEVBQUUsQ0FBQztRQUVyQyxJQUFNLFVBQVUsR0FBb0IsRUFBRSxDQUFDO1FBQ3ZDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN6QyxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7U0FDbkM7UUFFRCxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFckIsT0FBTyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLFlBQUEsRUFBRSxVQUFVLFlBQUEsRUFBRSxDQUFDO0lBQzVELENBQUMsQ0FBQztJQUVGLElBQU0sdUJBQXVCLEdBQXVDO1FBQ2xFLElBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDaEMsUUFBUSxFQUFFLENBQUM7UUFDWCxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxPQUFPLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLElBQUksTUFBQSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDO0lBQ3hFLENBQUMsQ0FBQztJQUVGLElBQU0saUNBQWlDLEdBRW5DO1FBQ0YsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hCLElBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7UUFDaEMsUUFBUSxFQUFFLENBQUM7UUFDWCxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxPQUFPO1lBQ0wsSUFBSSxFQUFFLHFCQUFxQjtZQUMzQixJQUFJLE1BQUE7WUFDSixXQUFXLEVBQUUsZUFBZSxFQUFFO1NBQy9CLENBQUM7SUFDSixDQUFDLENBQUM7SUFFRixJQUFNLHNCQUFzQixHQUFzQztRQUNoRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckIsT0FBTztZQUNMLElBQUksRUFBRSxtQkFBbUI7WUFDekIsQ0FBQyxFQUFFLGVBQWUsRUFBRTtZQUNwQixDQUFDLEVBQUUsZUFBZSxFQUFFO1lBQ3BCLEtBQUssRUFBRSxlQUFlLEVBQUU7U0FDekIsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUVGLElBQU0sY0FBYyxHQUE4QjtRQUNoRCxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQ25DLFFBQVEsWUFBWSxDQUFDLEtBQUssRUFBRTtnQkFDMUIsS0FBSyxPQUFPO29CQUNWLE9BQU8sbUJBQW1CLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxLQUFLO29CQUNSLE9BQU8saUNBQWlDLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxPQUFPO29CQUNWLE9BQU8sbUJBQW1CLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxVQUFVO29CQUNiLE9BQU8sc0JBQXNCLEVBQUUsQ0FBQztnQkFDbEM7b0JBQ0UsTUFBTSxJQUFJLFdBQVcsQ0FDbkIsMEJBQW1CLFlBQVksQ0FBQyxLQUFLLENBQUUsRUFDdkMsWUFBWSxDQUNiLENBQUM7YUFDTDtTQUNGO2FBQU0sSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtZQUM3QyxPQUFPLHVCQUF1QixFQUFFLENBQUM7U0FDbEM7YUFBTTtZQUNMLE1BQU0sSUFBSSxXQUFXLENBQ25CLGdDQUF5QixZQUFZLENBQUMsS0FBSyxDQUFFLEVBQzdDLFlBQVksQ0FDYixDQUFDO1NBQ0g7SUFDSCxDQUFDLENBQUM7SUFFRixJQUFNLEtBQUssR0FBb0IsRUFBRSxDQUFDO0lBQ2xDLE9BQU8sWUFBWSxFQUFFO1FBQ25CLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztLQUM5QjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBNUlXLFFBQUEsS0FBSyxTQTRJaEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcEpXLFFBQUEsUUFBUSxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzdELFFBQUEsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUUxRSxJQUFNLFdBQVcsR0FBRyxVQUFDLElBQVk7SUFDL0IsT0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQztBQUFoRCxDQUFnRCxDQUFDO0FBRW5EO0lBQW9DLGtDQUFLO0lBRXZDLHdCQUFZLE9BQWUsRUFBRSxLQUFhO1FBQTFDLFlBQ0Usa0JBQU0sT0FBTyxDQUFDLFNBRWY7UUFEQyxLQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7SUFDckIsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FOQSxBQU1DLENBTm1DLEtBQUssR0FNeEM7QUFOWSx3Q0FBYztBQVEzQiw0REFBNEQ7QUFDNUQsSUFBTSxZQUFZLEdBQ2hCLFVBQUMsS0FBYSxFQUFFLElBQWU7SUFDL0IsT0FBQSxVQUFDLEtBQUssRUFBRSxLQUFLO1FBQ1gsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsT0FBTyxLQUFLLElBQUksRUFBRSxJQUFJLE1BQUEsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDNUMsQ0FBQztBQUhELENBR0MsQ0FBQztBQUVKLElBQU0sUUFBUSxHQUFHO0lBQ2YsWUFBWSxDQUFDLDZCQUE2QixFQUFFLFFBQVEsQ0FBQztJQUNyRCxZQUFZLENBQUMsWUFBSyxnQkFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBRyxFQUFFLFNBQVMsQ0FBQztJQUNuRCxZQUFZLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQztJQUNuQyxZQUFZLENBQUMsWUFBSyxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQUcsRUFBRSxVQUFVLENBQUM7SUFDdEUsWUFBWSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUM7SUFDeEMsWUFBWSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUM7SUFDaEMsWUFBWSxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUM7Q0FDeEMsQ0FBQztBQUVGLElBQU0sZ0JBQWdCLEdBQUcsVUFBQyxLQUFhLEVBQUUsS0FBYSxJQUFLLE9BQUEsQ0FBQztJQUMxRCxJQUFJLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDaEQsSUFBSSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQztDQUN2RCxDQUFDLEVBSHlELENBR3pELENBQUM7QUFFSSxJQUFNLFFBQVEsR0FBYyxVQUFDLEtBQUs7SUFDdkMsSUFBTSxNQUFNLEdBQVksRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLE9BQU8sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7UUFDM0IsSUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQWYsQ0FBZSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQyxDQUFDO1FBQ3RFLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3BDLG1EQUFtRDtZQUNuRCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtnQkFDL0IsTUFBTSxDQUFDLElBQUksdUJBQU0sS0FBSyxHQUFLLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBRyxDQUFDO2FBQzlEO1lBQ0QsS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1NBQzdCO2FBQU07WUFDTCxNQUFNLElBQUksY0FBYyxDQUN0QiwyQkFBb0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFFLEVBQ3ZELEtBQUssQ0FDTixDQUFDO1NBQ0g7S0FDRjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQXBCVyxRQUFBLFFBQVEsWUFvQm5COzs7OztBQ3pERix5RUFBeUU7QUFDekUsSUFBTSxRQUFRLEdBQWEsVUFBQyxLQUFLLEVBQUUsT0FBTztJQUN4QyxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1FBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUEyQixDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUk7WUFDeEQsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQU0sWUFBWSxHQUFhLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RSxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQUMsU0FBYztnQkFDbEMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO29CQUN0QyxRQUFRLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUM5QjtZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixrQkFBZSxRQUFRLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJkZWNsYXJlIGNvbnN0IENvZGVNaXJyb3I6IGFueTtcbmRlY2xhcmUgY29uc3QgJDogYW55O1xuXG5pbXBvcnQgY29weSBmcm9tIFwiY29weS10by1jbGlwYm9hcmRcIjtcbmltcG9ydCB7IG1hcmtlZCB9IGZyb20gXCJtYXJrZWRcIjtcblxuaW1wb3J0IHsgcnVudGltZSBhcyBpbnRlcnByZXRlclJ1bnRpbWUgfSBmcm9tIFwiLi4vc3JjL2ludGVycHJldGVyXCI7XG5pbXBvcnQgeyBydW50aW1lIGFzIGNvbXBpbGVyUnVudGltZSB9IGZyb20gXCIuLi9zcmMvY29tcGlsZXJcIjtcbmltcG9ydCB7IGtleXdvcmRzIH0gZnJvbSBcIi4uL3NyYy90b2tlbml6ZXJcIjtcbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuLi9zcmMvY29uc3RhbnRzXCI7XG5pbXBvcnQgeyBQYXJzZXJFcnJvciB9IGZyb20gXCIuLi9zcmMvcGFyc2VyXCI7XG5cbmNvbnN0IGNvbXBpbGVCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbXBpbGVcIik7XG5jb25zdCBpbnRlcnByZXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImludGVycHJldFwiKTtcbmNvbnN0IGNvZGVBcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb2RlXCIpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5jb25zdCBjb25zb2xlT3V0cHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gIFwiY29uc29sZS1vdXRwdXRcIlxuKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XG5jb25zdCBzaGFyZVVybEZpZWxkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gIFwic2hhcmVVcmxGaWVsZFwiXG4pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5jb25zdCBjb3B5VXJsQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXG4gIFwiY29weVVybEJ1dHRvblwiXG4pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5jb25zdCBkZXNjcmlwdGlvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGVzY3JpcHRpb25cIikgYXMgSFRNTERpdkVsZW1lbnQ7XG5jb25zdCBydW5TcGlubmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJydW4tc3Bpbm5lclwiKSBhcyBIVE1MRGl2RWxlbWVudDtcblxuaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gIGNvbnN0IGNvZGVCYXNlNjQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIiNcIilbMV07XG4gIGNvbnN0IGNvZGUgPSBCdWZmZXIuZnJvbShjb2RlQmFzZTY0LCBcImJhc2U2NFwiKS50b1N0cmluZyhcImJpbmFyeVwiKTtcbiAgY29kZUFyZWEudmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQoY29kZSk7XG59XG5cbi8vIFJlZjogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQwNzcyODgxLzEzNzQ5NTYxXG5jb25zdCBzY2FsZUltYWdlRGF0YSA9IChcbiAgaW1hZ2VEYXRhOiBJbWFnZURhdGEsXG4gIHNjYWxlOiBudW1iZXIsXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4pID0+IHtcbiAgY29uc3Qgc2NhbGVkID0gY3R4LmNyZWF0ZUltYWdlRGF0YShcbiAgICBpbWFnZURhdGEud2lkdGggKiBzY2FsZSxcbiAgICBpbWFnZURhdGEuaGVpZ2h0ICogc2NhbGVcbiAgKTtcbiAgY29uc3Qgc3ViTGluZSA9IGN0eC5jcmVhdGVJbWFnZURhdGEoc2NhbGUsIDEpLmRhdGE7XG4gIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGltYWdlRGF0YS5oZWlnaHQ7IHJvdysrKSB7XG4gICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgaW1hZ2VEYXRhLndpZHRoOyBjb2wrKykge1xuICAgICAgY29uc3Qgc291cmNlUGl4ZWwgPSBpbWFnZURhdGEuZGF0YS5zdWJhcnJheShcbiAgICAgICAgKHJvdyAqIGltYWdlRGF0YS53aWR0aCArIGNvbCkgKiA0LFxuICAgICAgICAocm93ICogaW1hZ2VEYXRhLndpZHRoICsgY29sKSAqIDQgKyA0XG4gICAgICApO1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzY2FsZTsgeCsrKSBzdWJMaW5lLnNldChzb3VyY2VQaXhlbCwgeCAqIDQpO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBzY2FsZTsgeSsrKSB7XG4gICAgICAgIGNvbnN0IGRlc3RSb3cgPSByb3cgKiBzY2FsZSArIHk7XG4gICAgICAgIGNvbnN0IGRlc3RDb2wgPSBjb2wgKiBzY2FsZTtcbiAgICAgICAgc2NhbGVkLmRhdGEuc2V0KHN1YkxpbmUsIChkZXN0Um93ICogc2NhbGVkLndpZHRoICsgZGVzdENvbCkgKiA0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gc2NhbGVkO1xufTtcblxuQ29kZU1pcnJvci5kZWZpbmVTaW1wbGVNb2RlKFwic2ltcGxlbW9kZVwiLCB7XG4gIHN0YXJ0OiBbXG4gICAge1xuICAgICAgcmVnZXg6IG5ldyBSZWdFeHAoYCgke2tleXdvcmRzLmpvaW4oXCJ8XCIpfSlgKSxcbiAgICAgIHRva2VuOiBcImtleXdvcmRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIHJlZ2V4OiAvMHhbYS1mXFxkXSt8Wy0rXT8oPzpcXC5cXGQrfFxcZCtcXC4/XFxkKikoPzplWy0rXT9cXGQrKT8vaSxcbiAgICAgIHRva2VuOiBcIm51bWJlclwiLFxuICAgIH0sXG4gICAgeyByZWdleDogL1stKy8qPTw+IV0rLywgdG9rZW46IFwib3BlcmF0b3JcIiB9LFxuICAgIHsgcmVnZXg6IC9bYS16JF1bXFx3JF0qLywgdG9rZW46IFwidmFyaWFibGVcIiB9LFxuICBdLFxufSk7XG5cbmNvbnN0IGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGNvZGVBcmVhLCB7XG4gIG1vZGU6IFwic2ltcGxlbW9kZVwiLFxuICB0aGVtZTogXCJtb25va2FpXCIsXG4gIGxpbmVOdW1iZXJzOiB0cnVlLFxufSk7XG5cbmNvbnN0IGxvZ01lc3NhZ2UgPSAobWVzc2FnZTogc3RyaW5nIHwgbnVtYmVyKSA9PiB7XG4gIGNvbnNvbGVPdXRwdXQudmFsdWUgPSBjb25zb2xlT3V0cHV0LnZhbHVlICsgbWVzc2FnZSArIFwiXFxuXCI7XG59O1xuXG5sZXQgZXJyb3JNYXJrZXI6IGFueTtcblxuY29uc3QgbWFya0Vycm9yID0gKHRva2VuOiBUb2tlbikgPT4ge1xuICBpZiAodG9rZW4uY2hhcikge1xuICAgIGVycm9yTWFya2VyID0gZWRpdG9yLm1hcmtUZXh0KFxuICAgICAgeyBsaW5lOiB0b2tlbi5saW5lLCBjaDogdG9rZW4uY2hhciB9LFxuICAgICAgeyBsaW5lOiB0b2tlbi5saW5lLCBjaDogdG9rZW4uY2hhciArIHRva2VuLnZhbHVlLmxlbmd0aCB9LFxuICAgICAgeyBjbGFzc05hbWU6IFwiZXJyb3JcIiB9XG4gICAgKTtcbiAgfVxufTtcblxuY29uc3QgdXBkYXRlQ2FudmFzID0gKGRpc3BsYXlCdWZmZXI6IFVpbnQ4QXJyYXkpID0+IHtcbiAgY29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICBjb25zdCBpbWdEYXRhID0gY3R4IS5jcmVhdGVJbWFnZURhdGEoXG4gICAgQ29uc3RhbnRzLkNBTlZBU19ESU0sXG4gICAgQ29uc3RhbnRzLkNBTlZBU19ESU1cbiAgKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBDb25zdGFudHMuQ0FOVkFTX0RJTSAqIENvbnN0YW50cy5DQU5WQVNfRElNOyBpKyspIHtcbiAgICBpbWdEYXRhLmRhdGFbaSAqIDRdID0gZGlzcGxheUJ1ZmZlcltpXTsgLy8gUmVkXG4gICAgaW1nRGF0YS5kYXRhW2kgKiA0ICsgMV0gPSBkaXNwbGF5QnVmZmVyW2ldOyAvLyBHcmVlblxuICAgIGltZ0RhdGEuZGF0YVtpICogNCArIDJdID0gZGlzcGxheUJ1ZmZlcltpXTsgLy8gQmx1ZVxuICAgIGltZ0RhdGEuZGF0YVtpICogNCArIDNdID0gMjU1OyAvLyBBbHBoYVxuICB9XG5cbiAgY29uc3Qgc2NhbGVGYWN0b3IgPSBjYW52YXMud2lkdGggLyAxMDA7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gIGNvbnN0IGRhdGEgPSBzY2FsZUltYWdlRGF0YShpbWdEYXRhLCBzY2FsZUZhY3RvciwgY3R4ISk7XG4gIGN0eD8ucHV0SW1hZ2VEYXRhKGRhdGEsIDAsIDApO1xufTtcblxuY29uc3QgcnVuID0gYXN5bmMgKHJ1bnRpbWU6IFJ1bnRpbWUpID0+IHtcbiAgaWYgKGVycm9yTWFya2VyKSB7XG4gICAgZXJyb3JNYXJrZXIuY2xlYXIoKTtcbiAgfVxuXG4gIGNvbnNvbGVPdXRwdXQudmFsdWUgPSBcIlwiO1xuXG4gIHJ1blNwaW5uZXIuaGlkZGVuID0gZmFsc2U7XG5cbiAgY29uc3Qgc2xlZXAgPSBhc3luYyAobXM6IG51bWJlcikgPT4ge1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG4gIH07XG5cbiAgYXdhaXQgc2xlZXAoMTApO1xuXG4gIGxldCB0aWNrRnVuY3Rpb246IFRpY2tGdW5jdGlvbjtcblxuICB0cnkge1xuICAgIGNvbnN0IGRpc3BsYXlNZW1vcnkgPSBuZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHsgaW5pdGlhbDogMSB9KTtcbiAgICB0aWNrRnVuY3Rpb24gPSBhd2FpdCBydW50aW1lKGVkaXRvci5nZXRWYWx1ZSgpLCB7XG4gICAgICBwcmludDogbG9nTWVzc2FnZSxcbiAgICAgIGRpc3BsYXlNZW1vcnksXG4gICAgfSk7XG5cbiAgICB0aWNrRnVuY3Rpb24oKTtcbiAgICBjb25zdCBkaXNwbGF5QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZGlzcGxheU1lbW9yeS5idWZmZXIpO1xuICAgIHVwZGF0ZUNhbnZhcyhkaXNwbGF5QnVmZmVyKTtcblxuICAgIGludGVycHJldEJ1dHRvbj8uY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcbiAgICBjb21waWxlQnV0dG9uPy5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nTWVzc2FnZSgoZSBhcyBQYXJzZXJFcnJvcikubWVzc2FnZSk7XG4gICAgbWFya0Vycm9yKChlIGFzIFBhcnNlckVycm9yKS50b2tlbik7XG4gIH0gZmluYWxseSB7XG4gICAgcnVuU3Bpbm5lci5oaWRkZW4gPSB0cnVlO1xuICB9XG59O1xuXG5pbnRlcnByZXRCdXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gIGludGVycHJldEJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICBjb21waWxlQnV0dG9uPy5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICBhd2FpdCBydW4oaW50ZXJwcmV0ZXJSdW50aW1lKTtcbn0pO1xuXG5jb21waWxlQnV0dG9uPy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xuICBjb21waWxlQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gIGludGVycHJldEJ1dHRvbj8uY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcbiAgYXdhaXQgcnVuKGNvbXBpbGVyUnVudGltZSk7XG59KTtcblxuJChcIiNzaGFyZU1vZGFsXCIpLm9uKFwic2hvdy5icy5tb2RhbFwiLCAoKSA9PiB7XG4gIGNvbnN0IGJhc2VVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIiNcIilbMF07XG4gIGNvbnN0IGNvZGUgPSBlZGl0b3IuZ2V0VmFsdWUoKTtcbiAgY29uc3QgY29kZUJhc2U2NCA9IEJ1ZmZlci5mcm9tKGNvZGUsIFwiYmluYXJ5XCIpLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xuICBjb25zdCBlbmNvZGVkQ29kZUJhc2U2NCA9IGVuY29kZVVSSUNvbXBvbmVudChjb2RlQmFzZTY0KTtcbiAgc2hhcmVVcmxGaWVsZC52YWx1ZSA9IGAke2Jhc2VVcmx9IyR7ZW5jb2RlZENvZGVCYXNlNjR9YDtcblxuICBzaGFyZVVybEZpZWxkLnNlbGVjdCgpO1xufSk7XG5cbmNvcHlVcmxCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IGNvcHkoc2hhcmVVcmxGaWVsZC52YWx1ZSkpO1xuXG5jb25zdCBkZXNjcmlwdGlvblRleHQgPSBgXG5cbiMjIyMgU2NoaXNtXG5cbiMjIyMjIyBDb21waWxlLVRvLVdlYkFzc2VtYmx5IExhbmd1YWdlIGluIFR5cGVTY3JpcHRcblxuV2hlbiB0aGUgY29kZSBpcyBydW4sIGl0J3MgZmlyc3QgdG9rZW5pc2VkIGFuZCBwYXJzZWQgaW50byBhbiBBYnN0cmFjdCBTeW50YXggVHJlZS4gVGhlbiwgaXQncyBlaXRoZXIgZXhlY3V0ZWQgdXNpbmcgdGhlIEphdmFTY3JpcHQgcnVudGltZSwgb3IgY29tcGlsZWQgYW5kIGV4ZWN1dGVkIHVzaW5nIHRoZSBXZWJBc3NlbWJseSBydW50aW1lLlxuXG4jIyMjIyBMYW5ndWFnZVxuXG5QbGVhc2UgcmVmZXIgdG8gdGhlIGV4YW1wbGUgY29kZSB0byBnZXQgc3RhcnRlZC4gQXMgYSBzdW1tYXJ5IG9mIHRoZSBtYWluIGxhbmd1YWdlIGZlYXR1cmVzOlxuXG4tIFByaW50IGEgdmFyaWFibGUncyB2YWx1ZTogXFxgcHJpbnQgPHZhcmlhYmxlPlxcYC5cblxuLSBBc3NpZ24gYSB2YWx1ZSB0byBhIHZhcmlhYmxlOiBcXGB2YXIgPG5hbWU+ID0gPHZhbHVlPlxcYC5cblxuLSBTZXQgYSBwaXhlbCBpbiB0aGUgY2FudmFzOiBcXGBzZXRwaXhlbCAoPHg+LCA8eT4sIDxjb2xvdXI+KVxcYC4gXFxgeFxcYCBhbmQgXFxgeVxcYCBhcmUgaW4gdGhlIHJhbmdlIDEtMTAwIGluY2x1c2l2ZSBhbmQgXFxgY29sb3VyXFxgIGlzIGEgdmFsdWUgaW4gdGhlIHJhbmdlIDAtMjU1IGluY2x1c2l2ZSAod2hlcmUgMCBpcyBibGFjayBhbmQgMjU1IGlzIHdoaXRlKS5cblxuLSBXaGlsZSBsb29wOiBcXGB3aGlsZSAoPGNvbmRpdGlvbj4pIDxjb2RlPiBlbmR3aGlsZVxcYFxuXG4tIE9wZXJhdG9yczogXFxgK1xcYCwgXFxgLVxcYCwgXFxgKlxcYCwgXFxgL1xcYCwgXFxgPT1cXGAsIFxcYDxcXGAsIFxcYD5cXGAsIFxcYCYmXFxgLCBcXGB8fFxcYC5cblxuLSBUaGUgbGFuZ3VhZ2UgY2FuIHBhcnNlIHNjaWVudGlmaWMgbm90YXRpb24sIGZsb2F0aW5nIHBvaW50cywgYW5kIG5lZ2F0aXZlIHZhbHVlcy5cbmA7XG5cbmRlc2NyaXB0aW9uLmlubmVySFRNTCA9IG1hcmtlZC5wYXJzZShkZXNjcmlwdGlvblRleHQpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBpc0RlcmVmID0gKHgpID0+IHggIT0gbnVsbCAmJiB0eXBlb2YgeFtcImRlcmVmXCJdID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBkZXJlZiA9ICh4KSA9PiAoaXNEZXJlZih4KSA/IHguZGVyZWYoKSA6IHgpO1xuXG5leHBvcnRzLkxvZ0xldmVsID0gdm9pZCAwO1xuKGZ1bmN0aW9uIChMb2dMZXZlbCkge1xuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiRklORVwiXSA9IDBdID0gXCJGSU5FXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJERUJVR1wiXSA9IDFdID0gXCJERUJVR1wiO1xuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiSU5GT1wiXSA9IDJdID0gXCJJTkZPXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJXQVJOXCJdID0gM10gPSBcIldBUk5cIjtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIlNFVkVSRVwiXSA9IDRdID0gXCJTRVZFUkVcIjtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIk5PTkVcIl0gPSA1XSA9IFwiTk9ORVwiO1xufSkoZXhwb3J0cy5Mb2dMZXZlbCB8fCAoZXhwb3J0cy5Mb2dMZXZlbCA9IHt9KSk7XG5cbmV4cG9ydHMuR0xUeXBlID0gdm9pZCAwO1xuKGZ1bmN0aW9uIChHTFR5cGUpIHtcbiAgICBHTFR5cGVbR0xUeXBlW1wiSThcIl0gPSA1MTIwXSA9IFwiSThcIjtcbiAgICBHTFR5cGVbR0xUeXBlW1wiVThcIl0gPSA1MTIxXSA9IFwiVThcIjtcbiAgICBHTFR5cGVbR0xUeXBlW1wiSTE2XCJdID0gNTEyMl0gPSBcIkkxNlwiO1xuICAgIEdMVHlwZVtHTFR5cGVbXCJVMTZcIl0gPSA1MTIzXSA9IFwiVTE2XCI7XG4gICAgR0xUeXBlW0dMVHlwZVtcIkkzMlwiXSA9IDUxMjRdID0gXCJJMzJcIjtcbiAgICBHTFR5cGVbR0xUeXBlW1wiVTMyXCJdID0gNTEyNV0gPSBcIlUzMlwiO1xuICAgIEdMVHlwZVtHTFR5cGVbXCJGMzJcIl0gPSA1MTI2XSA9IFwiRjMyXCI7XG59KShleHBvcnRzLkdMVHlwZSB8fCAoZXhwb3J0cy5HTFR5cGUgPSB7fSkpO1xuY29uc3QgR0wyVFlQRSA9IHtcbiAgICBbZXhwb3J0cy5HTFR5cGUuSThdOiBcImk4XCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLlU4XTogXCJ1OFwiLFxuICAgIFtleHBvcnRzLkdMVHlwZS5JMTZdOiBcImkxNlwiLFxuICAgIFtleHBvcnRzLkdMVHlwZS5VMTZdOiBcInUxNlwiLFxuICAgIFtleHBvcnRzLkdMVHlwZS5JMzJdOiBcImkzMlwiLFxuICAgIFtleHBvcnRzLkdMVHlwZS5VMzJdOiBcInUzMlwiLFxuICAgIFtleHBvcnRzLkdMVHlwZS5GMzJdOiBcImYzMlwiLFxufTtcbmNvbnN0IFRZUEUyR0wgPSB7XG4gICAgaTg6IGV4cG9ydHMuR0xUeXBlLkk4LFxuICAgIHU4OiBleHBvcnRzLkdMVHlwZS5VOCxcbiAgICB1OGM6IGV4cG9ydHMuR0xUeXBlLlU4LFxuICAgIGkxNjogZXhwb3J0cy5HTFR5cGUuSTE2LFxuICAgIHUxNjogZXhwb3J0cy5HTFR5cGUuVTE2LFxuICAgIGkzMjogZXhwb3J0cy5HTFR5cGUuSTMyLFxuICAgIHUzMjogZXhwb3J0cy5HTFR5cGUuVTMyLFxuICAgIGYzMjogZXhwb3J0cy5HTFR5cGUuRjMyLFxuICAgIGY2NDogdW5kZWZpbmVkLFxufTtcbmNvbnN0IFNJWkVPRiA9IHtcbiAgICB1ODogMSxcbiAgICB1OGM6IDEsXG4gICAgaTg6IDEsXG4gICAgdTE2OiAyLFxuICAgIGkxNjogMixcbiAgICB1MzI6IDQsXG4gICAgaTMyOiA0LFxuICAgIGYzMjogNCxcbiAgICBmNjQ6IDgsXG59O1xuY29uc3QgRkxPQVRfQVJSQVlfQ1RPUlMgPSB7XG4gICAgZjMyOiBGbG9hdDMyQXJyYXksXG4gICAgZjY0OiBGbG9hdDY0QXJyYXksXG59O1xuY29uc3QgSU5UX0FSUkFZX0NUT1JTID0ge1xuICAgIGk4OiBJbnQ4QXJyYXksXG4gICAgaTE2OiBJbnQxNkFycmF5LFxuICAgIGkzMjogSW50MzJBcnJheSxcbn07XG5jb25zdCBVSU5UX0FSUkFZX0NUT1JTID0ge1xuICAgIHU4OiBVaW50OEFycmF5LFxuICAgIHU4YzogVWludDhDbGFtcGVkQXJyYXksXG4gICAgdTE2OiBVaW50MTZBcnJheSxcbiAgICB1MzI6IFVpbnQzMkFycmF5LFxufTtcbmNvbnN0IFRZUEVEQVJSQVlfQ1RPUlMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgRkxPQVRfQVJSQVlfQ1RPUlMpLCBJTlRfQVJSQVlfQ1RPUlMpLCBVSU5UX0FSUkFZX0NUT1JTKTtcbmNvbnN0IGFzTmF0aXZlVHlwZSA9ICh0eXBlKSA9PiB7XG4gICAgY29uc3QgdCA9IEdMMlRZUEVbdHlwZV07XG4gICAgcmV0dXJuIHQgIT09IHVuZGVmaW5lZCA/IHQgOiB0eXBlO1xufTtcbmNvbnN0IGFzR0xUeXBlID0gKHR5cGUpID0+IHtcbiAgICBjb25zdCB0ID0gVFlQRTJHTFt0eXBlXTtcbiAgICByZXR1cm4gdCAhPT0gdW5kZWZpbmVkID8gdCA6IHR5cGU7XG59O1xuY29uc3Qgc2l6ZU9mID0gKHR5cGUpID0+IFNJWkVPRlthc05hdGl2ZVR5cGUodHlwZSldO1xuZnVuY3Rpb24gdHlwZWRBcnJheSh0eXBlLCAuLi54cykge1xuICAgIHJldHVybiBuZXcgVFlQRURBUlJBWV9DVE9SU1thc05hdGl2ZVR5cGUodHlwZSldKC4uLnhzKTtcbn1cbmNvbnN0IHR5cGVkQXJyYXlUeXBlID0gKHgpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh4KSlcbiAgICAgICAgcmV0dXJuIFwiZjY0XCI7XG4gICAgZm9yIChsZXQgaWQgaW4gVFlQRURBUlJBWV9DVE9SUykge1xuICAgICAgICBpZiAoeCBpbnN0YW5jZW9mIFRZUEVEQVJSQVlfQ1RPUlNbaWRdKVxuICAgICAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbiAgICByZXR1cm4gXCJmNjRcIjtcbn07XG5jb25zdCB1aW50VHlwZUZvclNpemUgPSAoeCkgPT4geCA8PSAweDEwMCA/IFwidThcIiA6IHggPD0gMHgxMDAwMCA/IFwidTE2XCIgOiBcInUzMlwiO1xuY29uc3QgaW50VHlwZUZvclNpemUgPSAoeCkgPT4geCA+PSAtMHg4MCAmJiB4IDwgMHg4MCA/IFwiaThcIiA6IHggPj0gLTB4ODAwMCAmJiB4IDwgMHg4MDAwID8gXCJpMTZcIiA6IFwiaTMyXCI7XG5jb25zdCB1aW50VHlwZUZvckJpdHMgPSAoeCkgPT4geCA+IDE2ID8gXCJ1MzJcIiA6IHggPiA4ID8gXCJ1MTZcIiA6IFwidThcIjtcbmNvbnN0IGludFR5cGVGb3JCaXRzID0gKHgpID0+IHggPiAxNiA/IFwiaTMyXCIgOiB4ID4gOCA/IFwiaTE2XCIgOiBcImk4XCI7XG5cbmNvbnN0IERFRkFVTFRfRVBTID0gMWUtNjtcbmNvbnN0IFNFTUFQSE9SRSA9IFN5bWJvbCgpO1xuY29uc3QgTk9fT1AgPSAoKSA9PiB7IH07XG5jb25zdCBFVkVOVF9BTEwgPSBcIipcIjtcbmNvbnN0IEVWRU5UX0VOQUJMRSA9IFwiZW5hYmxlXCI7XG5jb25zdCBFVkVOVF9ESVNBQkxFID0gXCJkaXNhYmxlXCI7XG5cbmNvbnN0IGFzc2VydCA9ICgoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgfHxcbiAgICAgICAgICAgIHByb2Nlc3MuZW52LlVNQlJFTExBX0FTU0VSVFMgPT09IFwiMVwiKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHsgfVxuICAgIHJldHVybiBmYWxzZTtcbn0pKClcbiAgICA/ICh0ZXN0LCBtc2cgPSBcImFzc2VydGlvbiBmYWlsZWRcIikgPT4ge1xuICAgICAgICBpZiAoKHR5cGVvZiB0ZXN0ID09PSBcImZ1bmN0aW9uXCIgJiYgIXRlc3QoKSkgfHwgIXRlc3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcih0eXBlb2YgbXNnID09PSBcImZ1bmN0aW9uXCIgPyBtc2coKSA6IG1zZyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgOiBOT19PUDtcblxuY29uc3QgZXhwb3NlR2xvYmFsID0gKGlkLCB2YWx1ZSwgYWx3YXlzID0gZmFsc2UpID0+IHtcbiAgICBjb25zdCBnbG9iID0gdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICA/IGdsb2JhbFxuICAgICAgICA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgICAgID8gd2luZG93XG4gICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBpZiAoZ2xvYiAmJlxuICAgICAgICAoYWx3YXlzIHx8XG4gICAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5VTUJSRUxMQV9HTE9CQUxTID09PSBcIjFcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7IH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KSgpKSkge1xuICAgICAgICBnbG9iW2lkXSA9IHZhbHVlO1xuICAgIH1cbn07XG5cbmNvbnN0IE5VTExfTE9HR0VSID0gT2JqZWN0LmZyZWV6ZSh7XG4gICAgbGV2ZWw6IGV4cG9ydHMuTG9nTGV2ZWwuTk9ORSxcbiAgICBmaW5lKCkgeyB9LFxuICAgIGRlYnVnKCkgeyB9LFxuICAgIGluZm8oKSB7IH0sXG4gICAgd2FybigpIHsgfSxcbiAgICBzZXZlcmUoKSB7IH0sXG59KTtcbmNsYXNzIENvbnNvbGVMb2dnZXIge1xuICAgIGNvbnN0cnVjdG9yKGlkLCBsZXZlbCA9IGV4cG9ydHMuTG9nTGV2ZWwuRklORSkge1xuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgICB9XG4gICAgZmluZSguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMubGV2ZWwgPD0gZXhwb3J0cy5Mb2dMZXZlbC5GSU5FICYmIHRoaXMubG9nKFwiRklORVwiLCBhcmdzKTtcbiAgICB9XG4gICAgZGVidWcoLi4uYXJncykge1xuICAgICAgICB0aGlzLmxldmVsIDw9IGV4cG9ydHMuTG9nTGV2ZWwuREVCVUcgJiYgdGhpcy5sb2coXCJERUJVR1wiLCBhcmdzKTtcbiAgICB9XG4gICAgaW5mbyguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMubGV2ZWwgPD0gZXhwb3J0cy5Mb2dMZXZlbC5JTkZPICYmIHRoaXMubG9nKFwiSU5GT1wiLCBhcmdzKTtcbiAgICB9XG4gICAgd2FybiguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMubGV2ZWwgPD0gZXhwb3J0cy5Mb2dMZXZlbC5XQVJOICYmIHRoaXMubG9nKFwiV0FSTlwiLCBhcmdzKTtcbiAgICB9XG4gICAgc2V2ZXJlKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy5sZXZlbCA8PSBleHBvcnRzLkxvZ0xldmVsLlNFVkVSRSAmJiB0aGlzLmxvZyhcIlNFVkVSRVwiLCBhcmdzKTtcbiAgICB9XG4gICAgbG9nKGxldmVsLCBhcmdzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBbJHtsZXZlbH1dICR7dGhpcy5pZH06YCwgLi4uYXJncyk7XG4gICAgfVxufVxuXG5jb25zdCBtaXhpbiA9IChiZWhhdmlvdXIsIHNoYXJlZEJlaGF2aW91ciA9IHt9KSA9PiB7XG4gICAgY29uc3QgaW5zdGFuY2VLZXlzID0gUmVmbGVjdC5vd25LZXlzKGJlaGF2aW91cik7XG4gICAgY29uc3Qgc2hhcmVkS2V5cyA9IFJlZmxlY3Qub3duS2V5cyhzaGFyZWRCZWhhdmlvdXIpO1xuICAgIGNvbnN0IHR5cGVUYWcgPSBTeW1ib2woXCJpc2FcIik7XG4gICAgZnVuY3Rpb24gX21peGluKGNsYXp6KSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiBpbnN0YW5jZUtleXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjbGF6ei5wcm90b3R5cGUsIGtleSk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nIHx8IGV4aXN0aW5nLmNvbmZpZ3VyYWJsZSkge1xuICAgICAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbGF6ei5wcm90b3R5cGUsIGtleSwge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYmVoYXZpb3VyW2tleV0sXG4gICAgICAgICAgICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYG5vdCBwYXRjaGluZzogJHtjbGF6ei5uYW1lfS4ke2tleS50b1N0cmluZygpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjbGF6ei5wcm90b3R5cGUsIHR5cGVUYWcsIHsgdmFsdWU6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiBjbGF6ejtcbiAgICB9XG4gICAgZm9yIChsZXQga2V5IG9mIHNoYXJlZEtleXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF9taXhpbiwga2V5LCB7XG4gICAgICAgICAgICB2YWx1ZTogc2hhcmVkQmVoYXZpb3VyW2tleV0sXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiBzaGFyZWRCZWhhdmlvdXIucHJvcGVydHlJc0VudW1lcmFibGUoa2V5KSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShfbWl4aW4sIFN5bWJvbC5oYXNJbnN0YW5jZSwge1xuICAgICAgICB2YWx1ZTogKHgpID0+ICEheFt0eXBlVGFnXSxcbiAgICB9KTtcbiAgICByZXR1cm4gX21peGluO1xufTtcblxuY29uc3QgY29uZmlndXJhYmxlID0gKHN0YXRlKSA9PiBmdW5jdGlvbiAoXywgX18sIGRlc2NyaXB0b3IpIHtcbiAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHN0YXRlO1xufTtcblxuY29uc3QgZGVwcmVjYXRlZCA9IChtc2csIGxvZyA9IGNvbnNvbGUubG9nKSA9PiBmdW5jdGlvbiAodGFyZ2V0LCBwcm9wLCBkZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgc2lnbmF0dXJlID0gYCR7dGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWV9IyR7cHJvcC50b1N0cmluZygpfWA7XG4gICAgY29uc3QgZm4gPSBkZXNjcmlwdG9yLnZhbHVlO1xuICAgIGFzc2VydCh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIiwgYCR7c2lnbmF0dXJlfSBpcyBub3QgYSBmdW5jdGlvbmApO1xuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvZyhgREVQUkVDQVRFRCAke3NpZ25hdHVyZX06ICR7bXNnIHx8IFwid2lsbCBiZSByZW1vdmVkIHNvb25cIn1gKTtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICByZXR1cm4gZGVzY3JpcHRvcjtcbn07XG5cbmNvbnN0IG5vbWl4aW4gPSAoXywgX18sIGRlc2NyaXB0b3IpID0+IHtcbiAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IGZhbHNlO1xufTtcblxuY29uc3Qgc2VhbGVkID0gKGNvbnN0cnVjdG9yKSA9PiB7XG4gICAgT2JqZWN0LnNlYWwoY29uc3RydWN0b3IpO1xuICAgIE9iamVjdC5zZWFsKGNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG59O1xuXG5jb25zdCBJRW5hYmxlTWl4aW4gPSBtaXhpbih7XG4gICAgX2VuYWJsZWQ6IHRydWUsXG4gICAgaXNFbmFibGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlZDtcbiAgICB9LFxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgJGVuYWJsZSh0aGlzLCB0cnVlLCBFVkVOVF9FTkFCTEUpO1xuICAgIH0sXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgJGVuYWJsZSh0aGlzLCBmYWxzZSwgRVZFTlRfRElTQUJMRSk7XG4gICAgfSxcbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIHRoaXMuX2VuYWJsZWQgPyB0aGlzLmRpc2FibGUoKSA6IHRoaXMuZW5hYmxlKCk7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICAgIH0sXG59KTtcbmNvbnN0ICRlbmFibGUgPSAodGFyZ2V0LCBzdGF0ZSwgaWQpID0+IHtcbiAgICB0YXJnZXQuX2VuYWJsZWQgPSBzdGF0ZTtcbiAgICBpZiAodGFyZ2V0Lm5vdGlmeSkge1xuICAgICAgICB0YXJnZXQubm90aWZ5KHsgaWQsIHRhcmdldCB9KTtcbiAgICB9XG59O1xuXG5jb25zdCBpbm90aWZ5X2Rpc3BhdGNoID0gKGxpc3RlbmVycywgZSkgPT4ge1xuICAgIGlmICghbGlzdGVuZXJzKVxuICAgICAgICByZXR1cm47XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSBsaXN0ZW5lcnMubGVuZ3RoLCBsOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGwgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgIGxbMF0uY2FsbChsWzFdLCBlKTtcbiAgICAgICAgaWYgKGUuY2FuY2VsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn07XG5jb25zdCBJTm90aWZ5TWl4aW4gPSBtaXhpbih7XG4gICAgYWRkTGlzdGVuZXIoaWQsIGZuLCBzY29wZSkge1xuICAgICAgICBsZXQgbCA9ICh0aGlzLl9saXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMgfHwge30pW2lkXTtcbiAgICAgICAgIWwgJiYgKGwgPSB0aGlzLl9saXN0ZW5lcnNbaWRdID0gW10pO1xuICAgICAgICBpZiAodGhpcy5fX2xpc3RlbmVyKGwsIGZuLCBzY29wZSkgPT09IC0xKSB7XG4gICAgICAgICAgICBsLnB1c2goW2ZuLCBzY29wZV0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXIoaWQsIGZuLCBzY29wZSkge1xuICAgICAgICBsZXQgbGlzdGVuZXJzO1xuICAgICAgICBpZiAoIShsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBsID0gbGlzdGVuZXJzW2lkXTtcbiAgICAgICAgaWYgKGwpIHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IHRoaXMuX19saXN0ZW5lcihsLCBmbiwgc2NvcGUpO1xuICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBsLnNwbGljZShpZHgsIDEpO1xuICAgICAgICAgICAgICAgICFsLmxlbmd0aCAmJiBkZWxldGUgbGlzdGVuZXJzW2lkXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBub3RpZnkoZSkge1xuICAgICAgICBsZXQgbGlzdGVuZXJzO1xuICAgICAgICBpZiAoIShsaXN0ZW5lcnMgPSB0aGlzLl9saXN0ZW5lcnMpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBlLnRhcmdldCA9PT0gdW5kZWZpbmVkICYmIChlLnRhcmdldCA9IHRoaXMpO1xuICAgICAgICBpbm90aWZ5X2Rpc3BhdGNoKGxpc3RlbmVyc1tlLmlkXSwgZSk7XG4gICAgICAgIGlub3RpZnlfZGlzcGF0Y2gobGlzdGVuZXJzW0VWRU5UX0FMTF0sIGUpO1xuICAgIH0sXG4gICAgX19saXN0ZW5lcihsaXN0ZW5lcnMsIGYsIHNjb3BlKSB7XG4gICAgICAgIGxldCBpID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKC0taSA+PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBsID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgaWYgKGxbMF0gPT09IGYgJiYgbFsxXSA9PT0gc2NvcGUpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaTtcbiAgICB9LFxufSk7XG5cbmNvbnN0IGl0ZXJhYmxlID0gKHByb3ApID0+IG1peGluKHtcbiAgICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgICAgIHlpZWxkKiB0aGlzW3Byb3BdO1xuICAgIH0sXG59KTtcblxuY29uc3QgSVdhdGNoTWl4aW4gPSBtaXhpbih7XG4gICAgYWRkV2F0Y2goaWQsIGZuKSB7XG4gICAgICAgIHRoaXMuX3dhdGNoZXMgPSB0aGlzLl93YXRjaGVzIHx8IHt9O1xuICAgICAgICBpZiAodGhpcy5fd2F0Y2hlc1tpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl93YXRjaGVzW2lkXSA9IGZuO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIHJlbW92ZVdhdGNoKGlkKSB7XG4gICAgICAgIGlmICghdGhpcy5fd2F0Y2hlcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuX3dhdGNoZXNbaWRdKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fd2F0Y2hlc1tpZF07XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBub3RpZnlXYXRjaGVzKG9sZFN0YXRlLCBuZXdTdGF0ZSkge1xuICAgICAgICBpZiAoIXRoaXMuX3dhdGNoZXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHcgPSB0aGlzLl93YXRjaGVzO1xuICAgICAgICBmb3IgKGxldCBpZCBpbiB3KSB7XG4gICAgICAgICAgICB3W2lkXShpZCwgb2xkU3RhdGUsIG5ld1N0YXRlKTtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcblxuZXhwb3J0cy5Db25zb2xlTG9nZ2VyID0gQ29uc29sZUxvZ2dlcjtcbmV4cG9ydHMuREVGQVVMVF9FUFMgPSBERUZBVUxUX0VQUztcbmV4cG9ydHMuRVZFTlRfQUxMID0gRVZFTlRfQUxMO1xuZXhwb3J0cy5FVkVOVF9ESVNBQkxFID0gRVZFTlRfRElTQUJMRTtcbmV4cG9ydHMuRVZFTlRfRU5BQkxFID0gRVZFTlRfRU5BQkxFO1xuZXhwb3J0cy5GTE9BVF9BUlJBWV9DVE9SUyA9IEZMT0FUX0FSUkFZX0NUT1JTO1xuZXhwb3J0cy5HTDJUWVBFID0gR0wyVFlQRTtcbmV4cG9ydHMuSUVuYWJsZU1peGluID0gSUVuYWJsZU1peGluO1xuZXhwb3J0cy5JTlRfQVJSQVlfQ1RPUlMgPSBJTlRfQVJSQVlfQ1RPUlM7XG5leHBvcnRzLklOb3RpZnlNaXhpbiA9IElOb3RpZnlNaXhpbjtcbmV4cG9ydHMuSVdhdGNoTWl4aW4gPSBJV2F0Y2hNaXhpbjtcbmV4cG9ydHMuTk9fT1AgPSBOT19PUDtcbmV4cG9ydHMuTlVMTF9MT0dHRVIgPSBOVUxMX0xPR0dFUjtcbmV4cG9ydHMuU0VNQVBIT1JFID0gU0VNQVBIT1JFO1xuZXhwb3J0cy5TSVpFT0YgPSBTSVpFT0Y7XG5leHBvcnRzLlRZUEUyR0wgPSBUWVBFMkdMO1xuZXhwb3J0cy5UWVBFREFSUkFZX0NUT1JTID0gVFlQRURBUlJBWV9DVE9SUztcbmV4cG9ydHMuVUlOVF9BUlJBWV9DVE9SUyA9IFVJTlRfQVJSQVlfQ1RPUlM7XG5leHBvcnRzLmFzR0xUeXBlID0gYXNHTFR5cGU7XG5leHBvcnRzLmFzTmF0aXZlVHlwZSA9IGFzTmF0aXZlVHlwZTtcbmV4cG9ydHMuYXNzZXJ0ID0gYXNzZXJ0O1xuZXhwb3J0cy5jb25maWd1cmFibGUgPSBjb25maWd1cmFibGU7XG5leHBvcnRzLmRlcHJlY2F0ZWQgPSBkZXByZWNhdGVkO1xuZXhwb3J0cy5kZXJlZiA9IGRlcmVmO1xuZXhwb3J0cy5leHBvc2VHbG9iYWwgPSBleHBvc2VHbG9iYWw7XG5leHBvcnRzLmlub3RpZnlfZGlzcGF0Y2ggPSBpbm90aWZ5X2Rpc3BhdGNoO1xuZXhwb3J0cy5pbnRUeXBlRm9yQml0cyA9IGludFR5cGVGb3JCaXRzO1xuZXhwb3J0cy5pbnRUeXBlRm9yU2l6ZSA9IGludFR5cGVGb3JTaXplO1xuZXhwb3J0cy5pc0RlcmVmID0gaXNEZXJlZjtcbmV4cG9ydHMuaXRlcmFibGUgPSBpdGVyYWJsZTtcbmV4cG9ydHMubWl4aW4gPSBtaXhpbjtcbmV4cG9ydHMubm9taXhpbiA9IG5vbWl4aW47XG5leHBvcnRzLnNlYWxlZCA9IHNlYWxlZDtcbmV4cG9ydHMuc2l6ZU9mID0gc2l6ZU9mO1xuZXhwb3J0cy50eXBlZEFycmF5ID0gdHlwZWRBcnJheTtcbmV4cG9ydHMudHlwZWRBcnJheVR5cGUgPSB0eXBlZEFycmF5VHlwZTtcbmV4cG9ydHMudWludFR5cGVGb3JCaXRzID0gdWludFR5cGVGb3JCaXRzO1xuZXhwb3J0cy51aW50VHlwZUZvclNpemUgPSB1aW50VHlwZUZvclNpemU7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBjb21wYXJlID0gcmVxdWlyZSgnQHRoaS5uZy9jb21wYXJlJyk7XG52YXIgZXF1aXYgPSByZXF1aXJlKCdAdGhpLm5nL2VxdWl2Jyk7XG52YXIgY2hlY2tzID0gcmVxdWlyZSgnQHRoaS5uZy9jaGVja3MnKTtcbnZhciBlcnJvcnMgPSByZXF1aXJlKCdAdGhpLm5nL2Vycm9ycycpO1xudmFyIGFwaSA9IHJlcXVpcmUoJ0B0aGkubmcvYXBpJyk7XG52YXIgcmFuZG9tID0gcmVxdWlyZSgnQHRoaS5uZy9yYW5kb20nKTtcblxuY29uc3QgYmluYXJ5U2VhcmNoID0gKGJ1ZiwgeCwga2V5ID0gKHgpID0+IHgsIGNtcCA9IGNvbXBhcmUuY29tcGFyZSwgbG93ID0gMCwgaGlnaCA9IGJ1Zi5sZW5ndGggLSAxKSA9PiB7XG4gICAgY29uc3Qga3ggPSBrZXkoeCk7XG4gICAgd2hpbGUgKGxvdyA8PSBoaWdoKSB7XG4gICAgICAgIGNvbnN0IG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgICAgY29uc3QgYyA9IGNtcChrZXkoYnVmW21pZF0pLCBreCk7XG4gICAgICAgIGlmIChjIDwgMCkge1xuICAgICAgICAgICAgbG93ID0gbWlkICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjID4gMCkge1xuICAgICAgICAgICAgaGlnaCA9IG1pZCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbWlkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtbG93IC0gMTtcbn07XG5jb25zdCBiaW5hcnlTZWFyY2hOdW1lcmljID0gKGJ1ZiwgeCwgY21wID0gY29tcGFyZS5jb21wYXJlTnVtQXNjLCBsb3cgPSAwLCBoaWdoID0gYnVmLmxlbmd0aCAtIDEpID0+IHtcbiAgICB3aGlsZSAobG93IDw9IGhpZ2gpIHtcbiAgICAgICAgY29uc3QgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgICBjb25zdCBjID0gY21wKGJ1ZlttaWRdLCB4KTtcbiAgICAgICAgaWYgKGMgPCAwKSB7XG4gICAgICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPiAwKSB7XG4gICAgICAgICAgICBoaWdoID0gbWlkIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC1sb3cgLSAxO1xufTtcbmNvbnN0IGJpbmFyeVNlYXJjaDIgPSAoYnVmLCB4KSA9PiB7XG4gICAgbGV0IGlkeCA9IGJ1ZlsxXSA8PSB4ID8gMSA6IDA7XG4gICAgcmV0dXJuIGJ1ZltpZHhdID09PSB4ID8gaWR4IDogYnVmWzBdIDwgeCA/IC1pZHggLSAyIDogLTE7XG59O1xuY29uc3QgYmluYXJ5U2VhcmNoNCA9IChidWYsIHgpID0+IHtcbiAgICBsZXQgaWR4ID0gYnVmWzJdIDw9IHggPyAyIDogMDtcbiAgICBpZHggfD0gYnVmW2lkeCArIDFdIDw9IHggPyAxIDogMDtcbiAgICByZXR1cm4gYnVmW2lkeF0gPT09IHggPyBpZHggOiBidWZbMF0gPCB4ID8gLWlkeCAtIDIgOiAtMTtcbn07XG5jb25zdCBiaW5hcnlTZWFyY2g4ID0gKGJ1ZiwgeCkgPT4ge1xuICAgIGxldCBpZHggPSBidWZbNF0gPD0geCA/IDQgOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgMl0gPD0geCA/IDIgOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgMV0gPD0geCA/IDEgOiAwO1xuICAgIHJldHVybiBidWZbaWR4XSA9PT0geCA/IGlkeCA6IGJ1ZlswXSA8IHggPyAtaWR4IC0gMiA6IC0xO1xufTtcbmNvbnN0IGJpbmFyeVNlYXJjaDE2ID0gKGJ1ZiwgeCkgPT4ge1xuICAgIGxldCBpZHggPSBidWZbOF0gPD0geCA/IDggOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgNF0gPD0geCA/IDQgOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgMl0gPD0geCA/IDIgOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgMV0gPD0geCA/IDEgOiAwO1xuICAgIHJldHVybiBidWZbaWR4XSA9PT0geCA/IGlkeCA6IGJ1ZlswXSA8IHggPyAtaWR4IC0gMiA6IC0xO1xufTtcbmNvbnN0IGJpbmFyeVNlYXJjaDMyID0gKGJ1ZiwgeCkgPT4ge1xuICAgIGxldCBpZHggPSBidWZbMTZdIDw9IHggPyAxNiA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyA0XSA8PSB4ID8gOCA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyA0XSA8PSB4ID8gNCA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAyXSA8PSB4ID8gMiA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAxXSA8PSB4ID8gMSA6IDA7XG4gICAgcmV0dXJuIGJ1ZltpZHhdID09PSB4ID8gaWR4IDogYnVmWzBdIDwgeCA/IC1pZHggLSAyIDogLTE7XG59O1xuY29uc3QgYnNMVCA9IChpKSA9PiAoaSA8IDAgPyAtaSAtIDIgOiBpIC0gMSk7XG5jb25zdCBic0xFID0gKGkpID0+IChpIDwgMCA/IC1pIC0gMiA6IGkpO1xuY29uc3QgYnNHVCA9IChpLCBuKSA9PiAoKGkgPSBpIDwgMCA/IC1pIC0gMSA6IGkgKyAxKSwgaSA8IG4gPyBpIDogLTEpO1xuY29uc3QgYnNHRSA9IChpLCBuKSA9PiAoKGkgPSBpIDwgMCA/IC1pIC0gMSA6IGkpLCBpIDwgbiA/IGkgOiAtMSk7XG5jb25zdCBic0VRID0gKGkpID0+IChpIDwgMCA/IC0xIDogaSk7XG5cbmNvbnN0IGJpc2VjdCA9IChzcmMsIGkgPSBzcmMubGVuZ3RoID4+PiAxKSA9PiBbXG4gICAgc3JjLnNsaWNlKDAsIGkpLFxuICAgIHNyYy5zbGljZShpKSxcbl07XG5jb25zdCBiaXNlY3RXaXRoID0gKHNyYywgcHJlZCkgPT4ge1xuICAgIGNvbnN0IGkgPSBzcmMuZmluZEluZGV4KHByZWQpO1xuICAgIHJldHVybiBpID49IDAgPyBiaXNlY3Qoc3JjLCBpKSA6IFtzcmMsIFtdXTtcbn07XG5cbmNvbnN0IGVuZHNXaXRoID0gKGJ1ZiwgbmVlZGxlLCBlcXVpdiQxID0gZXF1aXYuZXF1aXYpID0+IHtcbiAgICBsZXQgaSA9IGJ1Zi5sZW5ndGg7XG4gICAgbGV0IGogPSBuZWVkbGUubGVuZ3RoO1xuICAgIGlmIChpIDwgailcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHdoaWxlICgoLS1pLCAtLWogPj0gMCAmJiBlcXVpdiQxKGJ1ZltpXSwgbmVlZGxlW2pdKSkpIHsgfVxuICAgIHJldHVybiBqIDwgMDtcbn07XG5cbmNvbnN0IGVuc3VyZUl0ZXJhYmxlID0gKHgpID0+IHtcbiAgICAoeCA9PSBudWxsIHx8ICF4W1N5bWJvbC5pdGVyYXRvcl0pICYmXG4gICAgICAgIGVycm9ycy5pbGxlZ2FsQXJncyhgdmFsdWUgaXMgbm90IGl0ZXJhYmxlOiAke3h9YCk7XG4gICAgcmV0dXJuIHg7XG59O1xuXG5jb25zdCBlbnN1cmVBcnJheSA9ICh4KSA9PiBjaGVja3MuaXNBcnJheSh4KSA/IHggOiBbLi4uZW5zdXJlSXRlcmFibGUoeCldO1xuY29uc3QgZW5zdXJlQXJyYXlMaWtlID0gKHgpID0+IGNoZWNrcy5pc0FycmF5TGlrZSh4KSA/IHggOiBbLi4uZW5zdXJlSXRlcmFibGUoeCldO1xuXG5jb25zdCBmaW5kID0gKGJ1ZiwgeCwgZXF1aXYkMSA9IGVxdWl2LmVxdWl2KSA9PiB7XG4gICAgY29uc3QgaSA9IGZpbmRJbmRleChidWYsIHgsIGVxdWl2JDEpO1xuICAgIHJldHVybiBpICE9PSAtMSA/IGJ1ZltpXSA6IHVuZGVmaW5lZDtcbn07XG5jb25zdCBmaW5kSW5kZXggPSAoYnVmLCB4LCBlcXVpdiQxID0gZXF1aXYuZXF1aXYpID0+IHtcbiAgICBmb3IgKGxldCBpID0gYnVmLmxlbmd0aDsgLS1pID49IDA7KSB7XG4gICAgICAgIGlmIChlcXVpdiQxKHgsIGJ1ZltpXSkpXG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufTtcblxuY29uc3QgZmlsbFJhbmdlID0gKGJ1ZiwgaW5kZXggPSAwLCBzdGFydCA9IDAsIGVuZCA9IGJ1Zi5sZW5ndGgsIHN0ZXAgPSBlbmQgPiBzdGFydCA/IDEgOiAtMSkgPT4ge1xuICAgIGlmIChzdGVwID4gMCkge1xuICAgICAgICBmb3IgKDsgc3RhcnQgPCBlbmQ7IHN0YXJ0ICs9IHN0ZXApXG4gICAgICAgICAgICBidWZbaW5kZXgrK10gPSBzdGFydDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZvciAoOyBzdGFydCA+IGVuZDsgc3RhcnQgKz0gc3RlcClcbiAgICAgICAgICAgIGJ1ZltpbmRleCsrXSA9IHN0YXJ0O1xuICAgIH1cbiAgICByZXR1cm4gYnVmO1xufTtcblxuY29uc3QgZnV6enlNYXRjaCA9IChkb21haW4sIHF1ZXJ5LCBlcXVpdiQxID0gZXF1aXYuZXF1aXYpID0+IHtcbiAgICBjb25zdCBuZCA9IGRvbWFpbi5sZW5ndGg7XG4gICAgY29uc3QgbnEgPSBxdWVyeS5sZW5ndGg7XG4gICAgaWYgKG5xID4gbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAobnEgPT09IG5kKSB7XG4gICAgICAgIHJldHVybiBlcXVpdiQxKHF1ZXJ5LCBkb21haW4pO1xuICAgIH1cbiAgICBuZXh0OiBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCBucTsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHEgPSBxdWVyeVtpXTtcbiAgICAgICAgd2hpbGUgKGogPCBuZCkge1xuICAgICAgICAgICAgaWYgKGVxdWl2JDEoZG9tYWluW2orK10sIHEpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWUgbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuY29uc3QgaXNTb3J0ZWQgPSAoYXJyLCBjbXAgPSBjb21wYXJlLmNvbXBhcmUsIHN0YXJ0ID0gMCwgZW5kID0gYXJyLmxlbmd0aCkgPT4ge1xuICAgIGxldCBwcmV2ID0gYXJyW3N0YXJ0XTtcbiAgICB3aGlsZSAoKytzdGFydCA8IGVuZCkge1xuICAgICAgICBjb25zdCBjdXJyID0gYXJyW3N0YXJ0XTtcbiAgICAgICAgaWYgKGNtcChwcmV2LCBjdXJyKSA+IDApXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIHByZXYgPSBjdXJyO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmNvbnN0IGluc2VydCA9IChidWYsIHgsIGksIGsgPSBJbmZpbml0eSkgPT4gaSA8IDAgfHwgaSA+PSBrIHx8IGsgPCAxID8gYnVmIDogaW5zZXJ0VW5zYWZlKGJ1ZiwgeCwgaSwgayk7XG5jb25zdCBpbnNlcnRVbnNhZmUgPSAoYnVmLCB4LCBpLCBrID0gSW5maW5pdHkpID0+IHtcbiAgICBsZXQgaiA9IGJ1Zi5sZW5ndGggPCBrID8gYnVmLmxlbmd0aCArIDEgOiBrO1xuICAgIGZvciAoOyAtLWogPiBpOylcbiAgICAgICAgYnVmW2pdID0gYnVmW2ogLSAxXTtcbiAgICBidWZbaV0gPSB4O1xuICAgIHJldHVybiBidWY7XG59O1xuXG5jb25zdCBpbnRvID0gKGRlc3QsIHNyYywgbWF4ID0gSW5maW5pdHkpID0+IHtcbiAgICBmb3IgKGxldCB4IG9mIHNyYykge1xuICAgICAgICBpZiAoLS1tYXggPCAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlc3QucHVzaCh4KTtcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuXG5mdW5jdGlvbiogYXJyYXlJdGVyYXRvcihidWYsIHN0YXJ0ID0gMCwgZW5kKSB7XG4gICAgaWYgKCFidWYpXG4gICAgICAgIHJldHVybjtcbiAgICBzdGFydCA9IHN0YXJ0O1xuICAgIGVuZCA9PT0gdW5kZWZpbmVkICYmIChlbmQgPSBidWYubGVuZ3RoKTtcbiAgICBjb25zdCBzdGVwID0gc3RhcnQgPD0gZW5kID8gMSA6IC0xO1xuICAgIGZvciAoOyBzdGFydCAhPT0gZW5kOyBzdGFydCArPSBzdGVwKSB7XG4gICAgICAgIHlpZWxkIGJ1ZltzdGFydF07XG4gICAgfVxufVxuXG5jb25zdCBlcVN0cmljdCA9IChhLCBiKSA9PiBhID09PSBiO1xuY29uc3QgbGV2ZW5zaHRlaW4gPSAoYSwgYiwgbWF4RGlzdCA9IEluZmluaXR5LCBlcXVpdiA9IGVxU3RyaWN0KSA9PiB7XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCA+IGIubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHRtcCA9IGE7XG4gICAgICAgIGEgPSBiO1xuICAgICAgICBiID0gdG1wO1xuICAgIH1cbiAgICBsZXQgbGEgPSBhLmxlbmd0aDtcbiAgICBsZXQgbGIgPSBiLmxlbmd0aDtcbiAgICB3aGlsZSAobGEgPiAwICYmIGVxdWl2KGFbfi1sYV0sIGJbfi1sYl0pKSB7XG4gICAgICAgIGxhLS07XG4gICAgICAgIGxiLS07XG4gICAgfVxuICAgIGxldCBvZmZzZXQgPSAwO1xuICAgIHdoaWxlIChvZmZzZXQgPCBsYSAmJiBlcXVpdihhW29mZnNldF0sIGJbb2Zmc2V0XSkpIHtcbiAgICAgICAgb2Zmc2V0Kys7XG4gICAgfVxuICAgIGxhIC09IG9mZnNldDtcbiAgICBsYiAtPSBvZmZzZXQ7XG4gICAgaWYgKGxhID09PSAwIHx8IGxiIDwgMykge1xuICAgICAgICByZXR1cm4gbGI7XG4gICAgfVxuICAgIGxldCB4ID0gMDtcbiAgICBsZXQgeTtcbiAgICBsZXQgbWluRGlzdDtcbiAgICBsZXQgZDA7XG4gICAgbGV0IGQxO1xuICAgIGxldCBkMjtcbiAgICBsZXQgZDM7XG4gICAgbGV0IGRkO1xuICAgIGxldCBkeTtcbiAgICBsZXQgYXk7XG4gICAgbGV0IGJ4MDtcbiAgICBsZXQgYngxO1xuICAgIGxldCBieDI7XG4gICAgbGV0IGJ4MztcbiAgICBjb25zdCBfbWluID0gKGQwLCBkMSwgZDIsIGJ4LCBheSkgPT4ge1xuICAgICAgICByZXR1cm4gZDAgPCBkMSB8fCBkMiA8IGQxXG4gICAgICAgICAgICA/IGQwID4gZDJcbiAgICAgICAgICAgICAgICA/IGQyICsgMVxuICAgICAgICAgICAgICAgIDogZDAgKyAxXG4gICAgICAgICAgICA6IGVxdWl2KGF5LCBieClcbiAgICAgICAgICAgICAgICA/IGQxXG4gICAgICAgICAgICAgICAgOiBkMSArIDE7XG4gICAgfTtcbiAgICBjb25zdCB2ZWN0b3IgPSBbXTtcbiAgICBmb3IgKHkgPSAwOyB5IDwgbGE7IHkrKykge1xuICAgICAgICB2ZWN0b3IucHVzaCh5ICsgMSwgYVtvZmZzZXQgKyB5XSk7XG4gICAgfVxuICAgIGNvbnN0IGxlbiA9IHZlY3Rvci5sZW5ndGggLSAxO1xuICAgIGNvbnN0IGxiMyA9IGxiIC0gMztcbiAgICBmb3IgKDsgeCA8IGxiMzspIHtcbiAgICAgICAgYngwID0gYltvZmZzZXQgKyAoZDAgPSB4KV07XG4gICAgICAgIGJ4MSA9IGJbb2Zmc2V0ICsgKGQxID0geCArIDEpXTtcbiAgICAgICAgYngyID0gYltvZmZzZXQgKyAoZDIgPSB4ICsgMildO1xuICAgICAgICBieDMgPSBiW29mZnNldCArIChkMyA9IHggKyAzKV07XG4gICAgICAgIGRkID0geCArPSA0O1xuICAgICAgICBtaW5EaXN0ID0gSW5maW5pdHk7XG4gICAgICAgIGZvciAoeSA9IDA7IHkgPCBsZW47IHkgKz0gMikge1xuICAgICAgICAgICAgZHkgPSB2ZWN0b3JbeV07XG4gICAgICAgICAgICBheSA9IHZlY3Rvclt5ICsgMV07XG4gICAgICAgICAgICBkMCA9IF9taW4oZHksIGQwLCBkMSwgYngwLCBheSk7XG4gICAgICAgICAgICBkMSA9IF9taW4oZDAsIGQxLCBkMiwgYngxLCBheSk7XG4gICAgICAgICAgICBkMiA9IF9taW4oZDEsIGQyLCBkMywgYngyLCBheSk7XG4gICAgICAgICAgICBkZCA9IF9taW4oZDIsIGQzLCBkZCwgYngzLCBheSk7XG4gICAgICAgICAgICBkZCA8IG1pbkRpc3QgJiYgKG1pbkRpc3QgPSBkZCk7XG4gICAgICAgICAgICB2ZWN0b3JbeV0gPSBkZDtcbiAgICAgICAgICAgIGQzID0gZDI7XG4gICAgICAgICAgICBkMiA9IGQxO1xuICAgICAgICAgICAgZDEgPSBkMDtcbiAgICAgICAgICAgIGQwID0gZHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1pbkRpc3QgPiBtYXhEaXN0KVxuICAgICAgICAgICAgcmV0dXJuIEluZmluaXR5O1xuICAgIH1cbiAgICBmb3IgKDsgeCA8IGxiOykge1xuICAgICAgICBieDAgPSBiW29mZnNldCArIChkMCA9IHgpXTtcbiAgICAgICAgZGQgPSArK3g7XG4gICAgICAgIG1pbkRpc3QgPSBJbmZpbml0eTtcbiAgICAgICAgZm9yICh5ID0gMDsgeSA8IGxlbjsgeSArPSAyKSB7XG4gICAgICAgICAgICBkeSA9IHZlY3Rvclt5XTtcbiAgICAgICAgICAgIHZlY3Rvclt5XSA9IGRkID0gX21pbihkeSwgZDAsIGRkLCBieDAsIHZlY3Rvclt5ICsgMV0pO1xuICAgICAgICAgICAgZGQgPCBtaW5EaXN0ICYmIChtaW5EaXN0ID0gZGQpO1xuICAgICAgICAgICAgZDAgPSBkeTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWluRGlzdCA+IG1heERpc3QpXG4gICAgICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgfVxuICAgIHJldHVybiBkZDtcbn07XG5jb25zdCBub3JtYWxpemVkTGV2ZW5zaHRlaW4gPSAoYSwgYiwgbWF4RGlzdCA9IEluZmluaXR5LCBlcXVpdiA9IGVxU3RyaWN0KSA9PiB7XG4gICAgY29uc3QgbiA9IE1hdGgubWF4KGEubGVuZ3RoLCBiLmxlbmd0aCk7XG4gICAgcmV0dXJuIG4gPiAwID8gbGV2ZW5zaHRlaW4oYSwgYiwgbWF4RGlzdCwgZXF1aXYpIC8gbiA6IDA7XG59O1xuXG5jb25zdCBmaXJzdCA9IChidWYpID0+IGJ1ZlswXTtcbmNvbnN0IHBlZWsgPSAoYnVmKSA9PiBidWZbYnVmLmxlbmd0aCAtIDFdO1xuXG5jb25zdCBzd2FwID0gKGFyciwgeCwgeSkgPT4ge1xuICAgIGNvbnN0IHQgPSBhcnJbeF07XG4gICAgYXJyW3hdID0gYXJyW3ldO1xuICAgIGFyclt5XSA9IHQ7XG59O1xuY29uc3QgbXVsdGlTd2FwID0gKC4uLnhzKSA9PiB7XG4gICAgY29uc3QgW2IsIGMsIGRdID0geHM7XG4gICAgY29uc3QgbiA9IHhzLmxlbmd0aDtcbiAgICBzd2l0Y2ggKG4pIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuIHN3YXA7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiAoYSwgeCwgeSkgPT4ge1xuICAgICAgICAgICAgICAgIHN3YXAoYSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgc3dhcChiLCB4LCB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoYSwgeCwgeSkgPT4ge1xuICAgICAgICAgICAgICAgIHN3YXAoYSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgc3dhcChiLCB4LCB5KTtcbiAgICAgICAgICAgICAgICBzd2FwKGMsIHgsIHkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuIChhLCB4LCB5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dhcChhLCB4LCB5KTtcbiAgICAgICAgICAgICAgICBzd2FwKGIsIHgsIHkpO1xuICAgICAgICAgICAgICAgIHN3YXAoYywgeCwgeSk7XG4gICAgICAgICAgICAgICAgc3dhcChkLCB4LCB5KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gKGEsIHgsIHkpID0+IHtcbiAgICAgICAgICAgICAgICBzd2FwKGEsIHgsIHkpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBuOyAtLWkgPj0gMDspXG4gICAgICAgICAgICAgICAgICAgIHN3YXAoeHNbaV0sIHgsIHkpO1xuICAgICAgICAgICAgfTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiBxdWlja1NvcnQoYXJyLCBfY21wID0gY29tcGFyZS5jb21wYXJlLCBfc3dhcCA9IHN3YXAsIHN0YXJ0ID0gMCwgZW5kID0gYXJyLmxlbmd0aCAtIDEpIHtcbiAgICBpZiAoc3RhcnQgPCBlbmQpIHtcbiAgICAgICAgY29uc3QgcGl2b3QgPSBhcnJbc3RhcnQgKyAoKGVuZCAtIHN0YXJ0KSA+PiAxKV07XG4gICAgICAgIGxldCBzID0gc3RhcnQgLSAxO1xuICAgICAgICBsZXQgZSA9IGVuZCArIDE7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgcysrO1xuICAgICAgICAgICAgfSB3aGlsZSAoX2NtcChhcnJbc10sIHBpdm90KSA8IDApO1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGUtLTtcbiAgICAgICAgICAgIH0gd2hpbGUgKF9jbXAoYXJyW2VdLCBwaXZvdCkgPiAwKTtcbiAgICAgICAgICAgIGlmIChzID49IGUpXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBfc3dhcChhcnIsIHMsIGUpO1xuICAgICAgICB9XG4gICAgICAgIHF1aWNrU29ydChhcnIsIF9jbXAsIF9zd2FwLCBzdGFydCwgZSk7XG4gICAgICAgIHF1aWNrU29ydChhcnIsIF9jbXAsIF9zd2FwLCBlICsgMSwgZW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjtcbn1cblxuY29uc3Qgc2h1ZmZsZVJhbmdlID0gKGJ1Ziwgc3RhcnQgPSAwLCBlbmQgPSBidWYubGVuZ3RoLCBybmQgPSByYW5kb20uU1lTVEVNKSA9PiB7XG4gICAgYXBpLmFzc2VydChzdGFydCA+PSAwICYmIGVuZCA+PSBzdGFydCAmJiBlbmQgPD0gYnVmLmxlbmd0aCwgYGlsbGVnYWwgcmFuZ2UgJHtzdGFydH0uLiR7ZW5kfWApO1xuICAgIGxldCBuID0gZW5kIC0gc3RhcnQ7XG4gICAgY29uc3QgbCA9IG47XG4gICAgaWYgKGwgPiAxKSB7XG4gICAgICAgIHdoaWxlICgtLW4gPj0gMCkge1xuICAgICAgICAgICAgY29uc3QgYSA9IChzdGFydCArIHJuZC5mbG9hdChsKSkgfCAwO1xuICAgICAgICAgICAgY29uc3QgYiA9IChzdGFydCArIHJuZC5mbG9hdChsKSkgfCAwO1xuICAgICAgICAgICAgY29uc3QgdCA9IGJ1ZlthXTtcbiAgICAgICAgICAgIGJ1ZlthXSA9IGJ1ZltiXTtcbiAgICAgICAgICAgIGJ1ZltiXSA9IHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1Zjtcbn07XG5jb25zdCBzaHVmZmxlID0gKGJ1ZiwgbiA9IGJ1Zi5sZW5ndGgsIHJuZCA9IHJhbmRvbS5TWVNURU0pID0+IHNodWZmbGVSYW5nZShidWYsIDAsIG4sIHJuZCk7XG5cbmNvbnN0IHNvcnRCeUNhY2hlZEtleSA9IChzcmMsIGtleSwgY21wID0gY29tcGFyZS5jb21wYXJlKSA9PiB7XG4gICAgY29uc3Qga2V5cyA9IGNoZWNrcy5pc0Z1bmN0aW9uKGtleSkgPyBzcmMubWFwKGtleSkgOiBrZXk7XG4gICAgYXBpLmFzc2VydChrZXlzLmxlbmd0aCA9PT0gc3JjLmxlbmd0aCwgYGtleXMubGVuZ3RoICE9IHNyYy5sZW5ndGhgKTtcbiAgICBxdWlja1NvcnQoa2V5cywgY21wLCBtdWx0aVN3YXAoc3JjKSk7XG4gICAgcmV0dXJuIHNyYztcbn07XG5cbmNvbnN0IHN0YXJ0c1dpdGggPSAoYnVmLCBuZWVkbGUsIGVxdWl2JDEgPSBlcXVpdi5lcXVpdikgPT4ge1xuICAgIGxldCBpID0gYnVmLmxlbmd0aDtcbiAgICBsZXQgaiA9IG5lZWRsZS5sZW5ndGg7XG4gICAgaWYgKGkgPCBqKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgd2hpbGUgKC1qID49IDAgJiYgZXF1aXYkMShidWZbal0sIG5lZWRsZVtqXSkpIHsgfVxuICAgIHJldHVybiBqIDwgMDtcbn07XG5cbmNvbnN0IHN3aXp6bGUgPSAob3JkZXIpID0+IHtcbiAgICBjb25zdCBbYSwgYiwgYywgZCwgZSwgZiwgZywgaF0gPSBvcmRlcjtcbiAgICBzd2l0Y2ggKG9yZGVyLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4gW107XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV1dO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFt4W2FdLCB4W2JdXTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbeFthXSwgeFtiXSwgeFtjXV07XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV0sIHhbYl0sIHhbY10sIHhbZF1dO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFt4W2FdLCB4W2JdLCB4W2NdLCB4W2RdLCB4W2VdXTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbeFthXSwgeFtiXSwgeFtjXSwgeFtkXSwgeFtlXSwgeFtmXV07XG4gICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV0sIHhbYl0sIHhbY10sIHhbZF0sIHhbZV0sIHhbZl0sIHhbZ11dO1xuICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFt4W2FdLCB4W2JdLCB4W2NdLCB4W2RdLCB4W2VdLCB4W2ZdLCB4W2ddLCB4W2hdXTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBvcmRlci5sZW5ndGg7IC0taSA+PSAwOykge1xuICAgICAgICAgICAgICAgICAgICByZXNbaV0gPSB4W29yZGVyW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgfVxufTtcblxuZXhwb3J0cy5hcnJheUl0ZXJhdG9yID0gYXJyYXlJdGVyYXRvcjtcbmV4cG9ydHMuYmluYXJ5U2VhcmNoID0gYmluYXJ5U2VhcmNoO1xuZXhwb3J0cy5iaW5hcnlTZWFyY2gxNiA9IGJpbmFyeVNlYXJjaDE2O1xuZXhwb3J0cy5iaW5hcnlTZWFyY2gyID0gYmluYXJ5U2VhcmNoMjtcbmV4cG9ydHMuYmluYXJ5U2VhcmNoMzIgPSBiaW5hcnlTZWFyY2gzMjtcbmV4cG9ydHMuYmluYXJ5U2VhcmNoNCA9IGJpbmFyeVNlYXJjaDQ7XG5leHBvcnRzLmJpbmFyeVNlYXJjaDggPSBiaW5hcnlTZWFyY2g4O1xuZXhwb3J0cy5iaW5hcnlTZWFyY2hOdW1lcmljID0gYmluYXJ5U2VhcmNoTnVtZXJpYztcbmV4cG9ydHMuYmlzZWN0ID0gYmlzZWN0O1xuZXhwb3J0cy5iaXNlY3RXaXRoID0gYmlzZWN0V2l0aDtcbmV4cG9ydHMuYnNFUSA9IGJzRVE7XG5leHBvcnRzLmJzR0UgPSBic0dFO1xuZXhwb3J0cy5ic0dUID0gYnNHVDtcbmV4cG9ydHMuYnNMRSA9IGJzTEU7XG5leHBvcnRzLmJzTFQgPSBic0xUO1xuZXhwb3J0cy5lbmRzV2l0aCA9IGVuZHNXaXRoO1xuZXhwb3J0cy5lbnN1cmVBcnJheSA9IGVuc3VyZUFycmF5O1xuZXhwb3J0cy5lbnN1cmVBcnJheUxpa2UgPSBlbnN1cmVBcnJheUxpa2U7XG5leHBvcnRzLmVuc3VyZUl0ZXJhYmxlID0gZW5zdXJlSXRlcmFibGU7XG5leHBvcnRzLmZpbGxSYW5nZSA9IGZpbGxSYW5nZTtcbmV4cG9ydHMuZmluZCA9IGZpbmQ7XG5leHBvcnRzLmZpbmRJbmRleCA9IGZpbmRJbmRleDtcbmV4cG9ydHMuZmlyc3QgPSBmaXJzdDtcbmV4cG9ydHMuZnV6enlNYXRjaCA9IGZ1enp5TWF0Y2g7XG5leHBvcnRzLmluc2VydCA9IGluc2VydDtcbmV4cG9ydHMuaW5zZXJ0VW5zYWZlID0gaW5zZXJ0VW5zYWZlO1xuZXhwb3J0cy5pbnRvID0gaW50bztcbmV4cG9ydHMuaXNTb3J0ZWQgPSBpc1NvcnRlZDtcbmV4cG9ydHMubGV2ZW5zaHRlaW4gPSBsZXZlbnNodGVpbjtcbmV4cG9ydHMubXVsdGlTd2FwID0gbXVsdGlTd2FwO1xuZXhwb3J0cy5ub3JtYWxpemVkTGV2ZW5zaHRlaW4gPSBub3JtYWxpemVkTGV2ZW5zaHRlaW47XG5leHBvcnRzLnBlZWsgPSBwZWVrO1xuZXhwb3J0cy5xdWlja1NvcnQgPSBxdWlja1NvcnQ7XG5leHBvcnRzLnNodWZmbGUgPSBzaHVmZmxlO1xuZXhwb3J0cy5zaHVmZmxlUmFuZ2UgPSBzaHVmZmxlUmFuZ2U7XG5leHBvcnRzLnNvcnRCeUNhY2hlZEtleSA9IHNvcnRCeUNhY2hlZEtleTtcbmV4cG9ydHMuc3RhcnRzV2l0aCA9IHN0YXJ0c1dpdGg7XG5leHBvcnRzLnN3YXAgPSBzd2FwO1xuZXhwb3J0cy5zd2l6emxlID0gc3dpenpsZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuY29uc3QgYWxpZ24gPSAoYWRkciwgc2l6ZSkgPT4gKHNpemUtLSwgKGFkZHIgKyBzaXplKSAmIH5zaXplKTtcbmNvbnN0IGlzQWxpZ25lZCA9IChhZGRyLCBzaXplKSA9PiAhKGFkZHIgJiAoc2l6ZSAtIDEpKTtcblxuY29uc3QgRjY0ID0gbmV3IEZsb2F0NjRBcnJheSgxKTtcbmNvbnN0IEYzMiA9IG5ldyBGbG9hdDMyQXJyYXkoRjY0LmJ1ZmZlcik7XG5jb25zdCBJMzIgPSBuZXcgSW50MzJBcnJheShGNjQuYnVmZmVyKTtcbmNvbnN0IFUzMiA9IG5ldyBVaW50MzJBcnJheShGNjQuYnVmZmVyKTtcbmNvbnN0IElTX0xFID0gKChGNjRbMF0gPSAyKSwgVTMyWzFdID09PSAweDQwMDAwMDAwKTtcbmNvbnN0IGZsb2F0VG9JbnRCaXRzID0gKHgpID0+ICgoRjMyWzBdID0geCksIEkzMlswXSk7XG5jb25zdCBmbG9hdFRvVWludEJpdHMgPSAoeCkgPT4gKChGMzJbMF0gPSB4KSwgVTMyWzBdKTtcbmNvbnN0IGludEJpdHNUb0Zsb2F0ID0gKHgpID0+ICgoSTMyWzBdID0geCksIEYzMlswXSk7XG5jb25zdCB1aW50Qml0c1RvRmxvYXQgPSAoeCkgPT4gKChVMzJbMF0gPSB4KSwgRjMyWzBdKTtcbmNvbnN0IGZsb2F0VG9JbnRCaXRzNjQgPSAoeCkgPT4gKChGNjRbMF0gPSB4KSwgSVNfTEUgPyBbSTMyWzFdLCBJMzJbMF1dIDogW0kzMlswXSwgSTMyWzFdXSk7XG5jb25zdCBmbG9hdFRvVWludEJpdHM2NCA9ICh4KSA9PiAoKEY2NFswXSA9IHgpLCBJU19MRSA/IFtVMzJbMV0sIFUzMlswXV0gOiBbVTMyWzBdLCBVMzJbMV1dKTtcbmNvbnN0IGludEJpdHNUb0Zsb2F0NjQgPSAoaGksIGxvKSA9PiB7XG4gICAgSVNfTEUgPyAoKEkzMlsxXSA9IGhpKSwgKEkzMlswXSA9IGxvKSkgOiAoKEkzMlswXSA9IGhpKSwgKEkzMlsxXSA9IGxvKSk7XG4gICAgcmV0dXJuIEY2NFswXTtcbn07XG5jb25zdCB1aW50Qml0c1RvRmxvYXQ2NCA9IChoaSwgbG8pID0+IHtcbiAgICBJU19MRSA/ICgoVTMyWzFdID0gaGkpLCAoVTMyWzBdID0gbG8pKSA6ICgoVTMyWzBdID0gaGkpLCAoVTMyWzFdID0gbG8pKTtcbiAgICByZXR1cm4gRjY0WzBdO1xufTtcbmNvbnN0IGZsb2F0VG9Tb3J0YWJsZUludCA9ICh4KSA9PiB7XG4gICAgaWYgKHggPT09IC0wKVxuICAgICAgICB4ID0gMDtcbiAgICBjb25zdCBpID0gZmxvYXRUb0ludEJpdHMoeCk7XG4gICAgcmV0dXJuIHggPCAwID8gfmkgfCAoMSA8PCAzMSkgOiBpO1xufTtcbmNvbnN0IGNsYW1wMTEgPSAoeCkgPT4gKHggPCAtMSA/IC0xIDogeCA+IDEgPyAxIDogeCk7XG5jb25zdCBmMzJ1OCA9ICh4KSA9PiAoY2xhbXAxMSh4KSAqIDB4N2YpICYgMHhmZjtcbmNvbnN0IGYzMnUxNiA9ICh4KSA9PiAoY2xhbXAxMSh4KSAqIDB4N2ZmZikgJiAweGZmZmY7XG5jb25zdCBmMzJ1MjQgPSAoeCkgPT4gKGNsYW1wMTEoeCkgKiAweDdmZmZmZikgJiAweGZmZmZmZjtcbmNvbnN0IGYzMnUzMiA9ICh4KSA9PiAoY2xhbXAxMSh4KSAqIDB4N2ZmZmZmZmYpID4+PiAwO1xuY29uc3QgdThmMzIgPSAoeCkgPT4gKCh4ICY9IDB4ZmYpLCAoeCB8ICgoeCA+PiA3KSAqIDB4ZmZmZmZmMDApKSAvIDB4N2YpO1xuY29uc3QgdTE2ZjMyID0gKHgpID0+ICgoeCAmPSAweGZmZmYpLCAoeCB8ICgoeCA+PiAxNSkgKiAweGZmZmYwMDAwKSkgLyAweDdmZmYpO1xuY29uc3QgdTI0ZjMyID0gKHgpID0+ICgoeCAmPSAweGZmZmZmZiksICh4IHwgKCh4ID4+IDIzKSAqIDB4ZmYwMDAwMDApKSAvIDB4N2ZmZmZmKTtcbmNvbnN0IHUzMmYzMiA9ICh4KSA9PiAoeCB8IDApIC8gMHg3ZmZmZmZmZjtcblxuY29uc3QgYnl0ZXMxNiA9ICh4LCBsZSA9IGZhbHNlKSA9PiB7XG4gICAgY29uc3QgYjAgPSB4ICYgMHhmZjtcbiAgICBjb25zdCBiMSA9ICh4ID4+IDgpICYgMHhmZjtcbiAgICByZXR1cm4gbGUgPyBbYjAsIGIxXSA6IFtiMSwgYjBdO1xufTtcbmNvbnN0IGJ5dGVzMjQgPSAoeCwgbGUgPSBmYWxzZSkgPT4ge1xuICAgIGNvbnN0IGIwID0geCAmIDB4ZmY7XG4gICAgY29uc3QgYjEgPSAoeCA+PiA4KSAmIDB4ZmY7XG4gICAgY29uc3QgYjIgPSAoeCA+PiAxNikgJiAweGZmO1xuICAgIHJldHVybiBsZSA/IFtiMCwgYjEsIGIyXSA6IFtiMiwgYjEsIGIwXTtcbn07XG5jb25zdCBieXRlczMyID0gKHgsIGxlID0gZmFsc2UpID0+IHtcbiAgICBjb25zdCBiMCA9IHggJiAweGZmO1xuICAgIGNvbnN0IGIxID0gKHggPj4gOCkgJiAweGZmO1xuICAgIGNvbnN0IGIyID0gKHggPj4gMTYpICYgMHhmZjtcbiAgICBjb25zdCBiMyA9ICh4ID4+IDI0KSAmIDB4ZmY7XG4gICAgcmV0dXJuIGxlID8gW2IwLCBiMSwgYjIsIGIzXSA6IFtiMywgYjIsIGIxLCBiMF07XG59O1xuY29uc3QgYnl0ZXM2NCA9IChoaSwgbG8sIGxlID0gZmFsc2UpID0+IHtcbiAgICByZXR1cm4gbGVcbiAgICAgICAgPyBieXRlczMyKGxvLCBsZSkuY29uY2F0KGJ5dGVzMzIoaGksIGxlKSlcbiAgICAgICAgOiBieXRlczMyKGhpLCBsZSkuY29uY2F0KGJ5dGVzMzIobG8sIGxlKSk7XG59O1xuY29uc3QgYnl0ZXNGMzIgPSAoeCwgbGUgPSBmYWxzZSkgPT4gYnl0ZXMzMihmbG9hdFRvVWludEJpdHMoeCksIGxlKTtcbmNvbnN0IGJ5dGVzRjY0ID0gKHgsIGxlID0gZmFsc2UpID0+XG5ieXRlczY0KC4uLmZsb2F0VG9VaW50Qml0czY0KHgpLCBsZSk7XG5cbmNvbnN0IGRlZkJpdHMgPSAobikgPT4gbmV3IEFycmF5KG4pLmZpbGwoMCkubWFwKChfLCBpKSA9PiAxIDw8IChuIC0gMSAtIGkpKTtcbmNvbnN0IE1TQl9CSVRTOCA9IGRlZkJpdHMoOCk7XG5jb25zdCBNU0JfQklUUzE2ID0gZGVmQml0cygxNik7XG5jb25zdCBNU0JfQklUUzMyID0gZGVmQml0cygzMik7XG5jb25zdCBNQVNLUyA9IG5ldyBBcnJheSgzMykuZmlsbCgwKS5tYXAoKF8sIGkpID0+IE1hdGgucG93KDIsIGkpIC0gMSk7XG5cbmNvbnN0IHBvcENvdW50ID0gKHgpID0+ICgoeCA9IHggLSAoKHggPj4+IDEpICYgMHg1NTU1NTU1NSkpLFxuICAgICh4ID0gKHggJiAweDMzMzMzMzMzKSArICgoeCA+Pj4gMikgJiAweDMzMzMzMzMzKSksXG4gICAgKCgoeCArICh4ID4+PiA0KSkgJiAweGYwZjBmMGYpICogMHgxMDEwMTAxKSA+Pj4gMjQpO1xuY29uc3QgaGFtbWluZ0Rpc3QgPSAoeCwgeSkgPT4gcG9wQ291bnQoeCBeIHkpO1xuY29uc3QgY2x6MzIgPSAoeCkgPT4geCAhPT0gMCA/IDMxIC0gKChNYXRoLmxvZyh4ID4+PiAwKSAvIE1hdGguTE4yKSB8IDApIDogMzI7XG5jb25zdCBjdHozMiA9ICh4KSA9PiB7XG4gICAgbGV0IGMgPSAzMjtcbiAgICB4ICY9IC14O1xuICAgIHggJiYgYy0tO1xuICAgIHggJiAweDAwMDBmZmZmICYmIChjIC09IDE2KTtcbiAgICB4ICYgMHgwMGZmMDBmZiAmJiAoYyAtPSA4KTtcbiAgICB4ICYgMHgwZjBmMGYwZiAmJiAoYyAtPSA0KTtcbiAgICB4ICYgMHgzMzMzMzMzMyAmJiAoYyAtPSAyKTtcbiAgICB4ICYgMHg1NTU1NTU1NSAmJiAoYyAtPSAxKTtcbiAgICByZXR1cm4gYztcbn07XG5jb25zdCBiaXRTaXplID0gKHgpID0+ICh4ID4gMSA/IE1hdGguY2VpbChNYXRoLmxvZzIoeCkpIDogMCk7XG5cbmNvbnN0IGRlZk1hc2sgPSAoYSwgYikgPT4gKH5NQVNLU1thXSAmIE1BU0tTW2JdKSA+Pj4gMDtcbmNvbnN0IG1hc2tMID0gKG4sIHgpID0+ICh4ICYgTUFTS1Nbbl0pID4+PiAwO1xuY29uc3QgbWFza0ggPSAobiwgeCkgPT4gKHggJiB+TUFTS1Nbbl0pID4+PiAwO1xuXG5jb25zdCBiaXRDbGVhciA9ICh4LCBiaXQpID0+ICh4ICYgfigxIDw8IGJpdCkpID4+PiAwO1xuY29uc3QgYml0RmxpcCA9ICh4LCBiaXQpID0+ICh4IF4gKDEgPDwgYml0KSkgPj4+IDA7XG5jb25zdCBiaXRTZXQgPSAoeCwgYml0KSA9PiAoeCB8ICgxIDw8IGJpdCkpID4+PiAwO1xuY29uc3QgYml0U2V0V2luZG93ID0gKHgsIHksIGZyb20sIHRvKSA9PiB7XG4gICAgY29uc3QgbSA9IGRlZk1hc2soZnJvbSwgdG8pO1xuICAgIHJldHVybiAoeCAmIH5tKSB8ICgoeSA8PCAoMSA8PCBmcm9tKSkgJiBtKTtcbn07XG5jb25zdCBiaXRDbGVhcldpbmRvdyA9ICh4LCBmcm9tLCB0bykgPT4geCAmIH5kZWZNYXNrKGZyb20sIHRvKTtcblxuY29uc3QgZW5jb2RlR3JheTMyID0gKHgpID0+ICh4IF4gKHggPj4+IDEpKSA+Pj4gMDtcbmNvbnN0IGRlY29kZUdyYXkzMiA9ICh4KSA9PiB7XG4gICAgeCA9IHggXiAoeCA+Pj4gMTYpO1xuICAgIHggPSB4IF4gKHggPj4+IDgpO1xuICAgIHggPSB4IF4gKHggPj4+IDQpO1xuICAgIHggPSB4IF4gKHggPj4+IDIpO1xuICAgIHggPSB4IF4gKHggPj4+IDEpO1xuICAgIHJldHVybiB4ID4+PiAwO1xufTtcblxuY29uc3QgYml0Tm90ID0gKHgpID0+IH54O1xuY29uc3QgYml0QW5kID0gKGEsIGIpID0+IGEgJiBiO1xuY29uc3QgYml0TmFuZCA9IChhLCBiKSA9PiB+KGEgJiBiKTtcbmNvbnN0IGJpdE9yID0gKGEsIGIpID0+IGEgfCBiO1xuY29uc3QgYml0Tm9yID0gKGEsIGIpID0+IH4oYSB8IGIpO1xuY29uc3QgYml0WG9yID0gKGEsIGIpID0+IGEgXiBiO1xuY29uc3QgYml0WG5vciA9IChhLCBiKSA9PiB+KGEgXiBiKTtcbmNvbnN0IGJpdEltcGx5ID0gKGEsIGIpID0+IH5hIHwgYjtcbmNvbnN0IGJpdEFvaTIxID0gKGEsIGIsIGMpID0+IH4oYSB8IChiICYgYykpO1xuY29uc3QgYml0T2FpMjEgPSAoYSwgYiwgYykgPT4gfihhICYgKGIgfCBjKSk7XG5jb25zdCBiaXRBb2kyMiA9IChhLCBiLCBjLCBkKSA9PiB+KChhICYgYikgfCAoYyAmIGQpKTtcbmNvbnN0IGJpdE9haTIyID0gKGEsIGIsIGMsIGQpID0+IH4oKGEgfCBiKSAmIChjIHwgZCkpO1xuY29uc3QgYml0TXV4ID0gKGEsIGIsIHMpID0+ICgoYSAmIH5zKSB8IChiICYgcykpID4+PiAwO1xuY29uc3QgYml0RGVtdXggPSAoYSwgYiwgcykgPT4gW1xuICAgIChhICYgfnMpID4+PiAwLFxuICAgIChiICYgcykgPj4+IDAsXG5dO1xuY29uc3QgYml0Tm90TSA9IChuLCB4KSA9PiBtYXNrTChuLCB+eCk7XG5jb25zdCBiaXRBbmRNID0gKG4sIGEsIGIpID0+IG1hc2tMKG4sIGEgJiBiKTtcbmNvbnN0IGJpdE5hbmRNID0gKG4sIGEsIGIpID0+IG1hc2tMKG4sIH4oYSAmIGIpKTtcbmNvbnN0IGJpdE9yTSA9IChuLCBhLCBiKSA9PiBtYXNrTChuLCBhIHwgYik7XG5jb25zdCBiaXROb3JNID0gKG4sIGEsIGIpID0+IG1hc2tMKG4sIH4oYSB8IGIpKTtcbmNvbnN0IGJpdFhvck0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgYSBeIGIpO1xuY29uc3QgYml0WG5vck0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgfihhIF4gYikpO1xuY29uc3QgYml0SW1wbHlNID0gKG4sIGEsIGIpID0+IG1hc2tMKG4sIH5hIHwgYik7XG5jb25zdCBiaXRBb2kyMU0gPSAobiwgYSwgYiwgYykgPT4gbWFza0wobiwgfihhIHwgKGIgJiBjKSkpO1xuY29uc3QgYml0T2FpMjFNID0gKG4sIGEsIGIsIGMpID0+IG1hc2tMKG4sIH4oYSAmIChiIHwgYykpKTtcbmNvbnN0IGJpdEFvaTIyTSA9IChuLCBhLCBiLCBjLCBkKSA9PiBtYXNrTChuLCB+KChhICYgYikgfCAoYyAmIGQpKSk7XG5jb25zdCBiaXRPYWkyMk0gPSAobiwgYSwgYiwgYywgZCkgPT4gbWFza0wobiwgfigoYSB8IGIpICYgKGMgfCBkKSkpO1xuY29uc3QgYml0TXV4TSA9IChuLCBhLCBiLCBzKSA9PiBtYXNrTChuLCAoYSAmIH5zKSB8IChiICYgcykpO1xuY29uc3QgYml0RGVtdXhNID0gKG4sIGEsIGIsIHMpID0+IFtcbiAgICBtYXNrTChuLCBhICYgfnMpLFxuICAgIG1hc2tMKG4sIGIgJiBzKSxcbl07XG5cbmNvbnN0IGJpbmFyeU9uZUhvdCA9ICh4KSA9PiAoMSA8PCB4KSA+Pj4gMDtcbmNvbnN0IG9uZUhvdEJpbmFyeSA9ICh4KSA9PiAzMSAtIGNsejMyKHgpO1xuXG5jb25zdCBpc1BvdzIgPSAoeCkgPT4gISF4ICYmICEoeCAmICh4IC0gMSkpO1xuY29uc3QgY2VpbFBvdzIgPSAoeCkgPT4ge1xuICAgIHggKz0gKHggPT09IDApO1xuICAgIC0teDtcbiAgICB4IHw9IHggPj4+IDE7XG4gICAgeCB8PSB4ID4+PiAyO1xuICAgIHggfD0geCA+Pj4gNDtcbiAgICB4IHw9IHggPj4+IDg7XG4gICAgeCB8PSB4ID4+PiAxNjtcbiAgICByZXR1cm4geCArIDE7XG59O1xuY29uc3QgZmxvb3JQb3cyID0gKHgpID0+IHtcbiAgICB4IHw9IHggPj4+IDE7XG4gICAgeCB8PSB4ID4+PiAyO1xuICAgIHggfD0geCA+Pj4gNDtcbiAgICB4IHw9IHggPj4+IDg7XG4gICAgeCB8PSB4ID4+PiAxNjtcbiAgICByZXR1cm4geCAtICh4ID4+PiAxKTtcbn07XG5cbmNvbnN0IHJvdGF0ZUxlZnQgPSAoeCwgbikgPT4gKCh4IDw8IG4pIHwgKHggPj4+ICgzMiAtIG4pKSkgPj4+IDA7XG5jb25zdCByb3RhdGVSaWdodCA9ICh4LCBuKSA9PiAoKHggPj4+IG4pIHwgKHggPDwgKDMyIC0gbikpKSA+Pj4gMDtcblxuY29uc3Qgc3BsYXQ0XzI0ID0gKHgpID0+ICh4ICYgMHhmKSAqIDB4MTExMTExO1xuY29uc3Qgc3BsYXQ0XzMyID0gKHgpID0+ICgoeCAmIDB4ZikgKiAweDExMTExMTExKSA+Pj4gMDtcbmNvbnN0IHNwbGF0OF8yNCA9ICh4KSA9PiAoeCAmIDB4ZmYpICogMHgwMTAxMDE7XG5jb25zdCBzcGxhdDhfMzIgPSAoeCkgPT4gKCh4ICYgMHhmZikgKiAweDAxMDEwMTAxKSA+Pj4gMDtcbmNvbnN0IHNwbGF0MTZfMzIgPSAoeCkgPT4gKCh4ICY9IDB4ZmZmZiksICgoeCA8PCAxNikgfCB4KSA+Pj4gMCk7XG5jb25zdCBzYW1lNCA9ICh4KSA9PiAoKHggPj4gNCkgJiAweGYpID09PSAoeCAmIDB4Zik7XG5jb25zdCBzYW1lOCA9ICh4KSA9PiAoKHggPj4gOCkgJiAweGZmKSA9PT0gKHggJiAweGZmKTtcbmNvbnN0IGludGVybGVhdmU0XzEyXzI0ID0gKHgpID0+ICgoeCAmIDB4ZjAwKSAqIDB4MTEwMCkgfCAoKHggJiAweGYwKSAqIDB4MTEwKSB8ICgoeCAmIDB4ZikgKiAweDExKTtcbmNvbnN0IGludGVybGVhdmU0XzE2XzMyID0gKHgpID0+ICgoKHggJiAweGYwMDApICogMHgxMTAwMCkgfFxuICAgICgoeCAmIDB4ZjAwKSAqIDB4MTEwMCkgfFxuICAgICgoeCAmIDB4ZjApICogMHgxMTApIHxcbiAgICAoKHggJiAweGYpICogMHgxMSkpID4+PlxuICAgIDA7XG5cbmNvbnN0IGxhbmUxNiA9ICh4LCBsYW5lKSA9PiAoeCA+Pj4gKCgxIC0gbGFuZSkgPDwgNCkpICYgMHhmZmZmO1xuY29uc3QgbGFuZTggPSAoeCwgbGFuZSkgPT4gKHggPj4+ICgoMyAtIGxhbmUpIDw8IDMpKSAmIDB4ZmY7XG5jb25zdCBsYW5lNCA9ICh4LCBsYW5lKSA9PiAoeCA+Pj4gKCg3IC0gbGFuZSkgPDwgMikpICYgMHhmO1xuY29uc3QgbGFuZTIgPSAoeCwgbGFuZSkgPT4gKHggPj4+ICgoMTUgLSBsYW5lKSA8PCAxKSkgJiAweDM7XG5jb25zdCBzZXRMYW5lMTYgPSAoeCwgeSwgbGFuZSkgPT4gbGFuZSA/IG11eCh4LCB5LCAweGZmZmYpIDogbXV4KHgsIHkgPDwgMTYsIDB4ZmZmZjAwMDApO1xuY29uc3Qgc2V0TGFuZTggPSAoeCwgeSwgbGFuZSkgPT4ge1xuICAgIGNvbnN0IGwgPSAoMyAtIGxhbmUpIDw8IDM7XG4gICAgcmV0dXJuICgofigweGZmIDw8IGwpICYgeCkgfCAoKHkgJiAweGZmKSA8PCBsKSkgPj4+IDA7XG59O1xuY29uc3Qgc2V0TGFuZTQgPSAoeCwgeSwgbGFuZSkgPT4ge1xuICAgIGNvbnN0IGwgPSAoNyAtIGxhbmUpIDw8IDI7XG4gICAgcmV0dXJuICgofigweGYgPDwgbCkgJiB4KSB8ICgoeSAmIDB4ZikgPDwgbCkpID4+PiAwO1xufTtcbmNvbnN0IHNldExhbmUyID0gKHgsIHksIGxhbmUpID0+IHtcbiAgICBjb25zdCBsID0gKDE1IC0gbGFuZSkgPDwgMTtcbiAgICByZXR1cm4gKCh+KDB4MyA8PCBsKSAmIHgpIHwgKCh5ICYgMHgzKSA8PCBsKSkgPj4+IDA7XG59O1xuY29uc3Qgc3dpenpsZTggPSAoeCwgYSwgYiwgYywgZCkgPT4gKChsYW5lOCh4LCBhKSA8PCAyNCkgfFxuICAgIChsYW5lOCh4LCBiKSA8PCAxNikgfFxuICAgIChsYW5lOCh4LCBjKSA8PCA4KSB8XG4gICAgbGFuZTgoeCwgZCkpID4+PlxuICAgIDA7XG5jb25zdCBzd2l6emxlNCA9ICh4LCBhLCBiLCBjLCBkLCBlLCBmLCBnLCBoKSA9PiAoKGxhbmU0KHgsIGEpIDw8IDI4KSB8XG4gICAgKGxhbmU0KHgsIGIpIDw8IDI0KSB8XG4gICAgKGxhbmU0KHgsIGMpIDw8IDIwKSB8XG4gICAgKGxhbmU0KHgsIGQpIDw8IDE2KSB8XG4gICAgKGxhbmU0KHgsIGUpIDw8IDEyKSB8XG4gICAgKGxhbmU0KHgsIGYpIDw8IDgpIHxcbiAgICAobGFuZTQoeCwgZykgPDwgNCkgfFxuICAgIGxhbmU0KHgsIGgpKSA+Pj5cbiAgICAwO1xuY29uc3QgbXV4ID0gKGEsIGIsIG1hc2spID0+ICh+bWFzayAmIGEpIHwgKG1hc2sgJiBiKTtcbmNvbnN0IGZsaXA4ID0gKHgpID0+ICgoeCA+Pj4gMjQpIHwgKCh4ID4+IDgpICYgMHhmZjAwKSB8ICgoeCAmIDB4ZmYwMCkgPDwgOCkgfCAoeCA8PCAyNCkpID4+PiAwO1xuY29uc3QgZmxpcDE2ID0gKHgpID0+IG11eCh4IDw8IDE2LCB4ID4+PiAxNiwgMHhmZmZmKTtcbmNvbnN0IGZsaXBCeXRlcyA9IGZsaXA4O1xuY29uc3Qgc3dhcExhbmUwMiA9ICh4KSA9PiAoKHggJiAweGZmMDApIDw8IDE2KSB8ICgoeCA+Pj4gMTYpICYgMHhmZjAwKSB8ICh4ICYgMHgwMGZmMDBmZik7XG5jb25zdCBzd2FwTGFuZTEzID0gKHgpID0+ICgoeCAmIDB4ZmYpIDw8IDE2KSB8ICgoeCA+PiAxNikgJiAweGZmKSB8ICh4ICYgMHhmZjAwZmYwMCk7XG5cbmV4cG9ydHMuSVNfTEUgPSBJU19MRTtcbmV4cG9ydHMuTUFTS1MgPSBNQVNLUztcbmV4cG9ydHMuTVNCX0JJVFMxNiA9IE1TQl9CSVRTMTY7XG5leHBvcnRzLk1TQl9CSVRTMzIgPSBNU0JfQklUUzMyO1xuZXhwb3J0cy5NU0JfQklUUzggPSBNU0JfQklUUzg7XG5leHBvcnRzLmFsaWduID0gYWxpZ247XG5leHBvcnRzLmJpbmFyeU9uZUhvdCA9IGJpbmFyeU9uZUhvdDtcbmV4cG9ydHMuYml0QW5kID0gYml0QW5kO1xuZXhwb3J0cy5iaXRBbmRNID0gYml0QW5kTTtcbmV4cG9ydHMuYml0QW9pMjEgPSBiaXRBb2kyMTtcbmV4cG9ydHMuYml0QW9pMjFNID0gYml0QW9pMjFNO1xuZXhwb3J0cy5iaXRBb2kyMiA9IGJpdEFvaTIyO1xuZXhwb3J0cy5iaXRBb2kyMk0gPSBiaXRBb2kyMk07XG5leHBvcnRzLmJpdENsZWFyID0gYml0Q2xlYXI7XG5leHBvcnRzLmJpdENsZWFyV2luZG93ID0gYml0Q2xlYXJXaW5kb3c7XG5leHBvcnRzLmJpdERlbXV4ID0gYml0RGVtdXg7XG5leHBvcnRzLmJpdERlbXV4TSA9IGJpdERlbXV4TTtcbmV4cG9ydHMuYml0RmxpcCA9IGJpdEZsaXA7XG5leHBvcnRzLmJpdEltcGx5ID0gYml0SW1wbHk7XG5leHBvcnRzLmJpdEltcGx5TSA9IGJpdEltcGx5TTtcbmV4cG9ydHMuYml0TXV4ID0gYml0TXV4O1xuZXhwb3J0cy5iaXRNdXhNID0gYml0TXV4TTtcbmV4cG9ydHMuYml0TmFuZCA9IGJpdE5hbmQ7XG5leHBvcnRzLmJpdE5hbmRNID0gYml0TmFuZE07XG5leHBvcnRzLmJpdE5vciA9IGJpdE5vcjtcbmV4cG9ydHMuYml0Tm9yTSA9IGJpdE5vck07XG5leHBvcnRzLmJpdE5vdCA9IGJpdE5vdDtcbmV4cG9ydHMuYml0Tm90TSA9IGJpdE5vdE07XG5leHBvcnRzLmJpdE9haTIxID0gYml0T2FpMjE7XG5leHBvcnRzLmJpdE9haTIxTSA9IGJpdE9haTIxTTtcbmV4cG9ydHMuYml0T2FpMjIgPSBiaXRPYWkyMjtcbmV4cG9ydHMuYml0T2FpMjJNID0gYml0T2FpMjJNO1xuZXhwb3J0cy5iaXRPciA9IGJpdE9yO1xuZXhwb3J0cy5iaXRPck0gPSBiaXRPck07XG5leHBvcnRzLmJpdFNldCA9IGJpdFNldDtcbmV4cG9ydHMuYml0U2V0V2luZG93ID0gYml0U2V0V2luZG93O1xuZXhwb3J0cy5iaXRTaXplID0gYml0U2l6ZTtcbmV4cG9ydHMuYml0WG5vciA9IGJpdFhub3I7XG5leHBvcnRzLmJpdFhub3JNID0gYml0WG5vck07XG5leHBvcnRzLmJpdFhvciA9IGJpdFhvcjtcbmV4cG9ydHMuYml0WG9yTSA9IGJpdFhvck07XG5leHBvcnRzLmJ5dGVzMTYgPSBieXRlczE2O1xuZXhwb3J0cy5ieXRlczI0ID0gYnl0ZXMyNDtcbmV4cG9ydHMuYnl0ZXMzMiA9IGJ5dGVzMzI7XG5leHBvcnRzLmJ5dGVzNjQgPSBieXRlczY0O1xuZXhwb3J0cy5ieXRlc0YzMiA9IGJ5dGVzRjMyO1xuZXhwb3J0cy5ieXRlc0Y2NCA9IGJ5dGVzRjY0O1xuZXhwb3J0cy5jZWlsUG93MiA9IGNlaWxQb3cyO1xuZXhwb3J0cy5jbHozMiA9IGNsejMyO1xuZXhwb3J0cy5jdHozMiA9IGN0ejMyO1xuZXhwb3J0cy5kZWNvZGVHcmF5MzIgPSBkZWNvZGVHcmF5MzI7XG5leHBvcnRzLmRlZk1hc2sgPSBkZWZNYXNrO1xuZXhwb3J0cy5lbmNvZGVHcmF5MzIgPSBlbmNvZGVHcmF5MzI7XG5leHBvcnRzLmYzMnUxNiA9IGYzMnUxNjtcbmV4cG9ydHMuZjMydTI0ID0gZjMydTI0O1xuZXhwb3J0cy5mMzJ1MzIgPSBmMzJ1MzI7XG5leHBvcnRzLmYzMnU4ID0gZjMydTg7XG5leHBvcnRzLmZsaXAxNiA9IGZsaXAxNjtcbmV4cG9ydHMuZmxpcDggPSBmbGlwODtcbmV4cG9ydHMuZmxpcEJ5dGVzID0gZmxpcEJ5dGVzO1xuZXhwb3J0cy5mbG9hdFRvSW50Qml0cyA9IGZsb2F0VG9JbnRCaXRzO1xuZXhwb3J0cy5mbG9hdFRvSW50Qml0czY0ID0gZmxvYXRUb0ludEJpdHM2NDtcbmV4cG9ydHMuZmxvYXRUb1NvcnRhYmxlSW50ID0gZmxvYXRUb1NvcnRhYmxlSW50O1xuZXhwb3J0cy5mbG9hdFRvVWludEJpdHMgPSBmbG9hdFRvVWludEJpdHM7XG5leHBvcnRzLmZsb2F0VG9VaW50Qml0czY0ID0gZmxvYXRUb1VpbnRCaXRzNjQ7XG5leHBvcnRzLmZsb29yUG93MiA9IGZsb29yUG93MjtcbmV4cG9ydHMuaGFtbWluZ0Rpc3QgPSBoYW1taW5nRGlzdDtcbmV4cG9ydHMuaW50Qml0c1RvRmxvYXQgPSBpbnRCaXRzVG9GbG9hdDtcbmV4cG9ydHMuaW50Qml0c1RvRmxvYXQ2NCA9IGludEJpdHNUb0Zsb2F0NjQ7XG5leHBvcnRzLmludGVybGVhdmU0XzEyXzI0ID0gaW50ZXJsZWF2ZTRfMTJfMjQ7XG5leHBvcnRzLmludGVybGVhdmU0XzE2XzMyID0gaW50ZXJsZWF2ZTRfMTZfMzI7XG5leHBvcnRzLmlzQWxpZ25lZCA9IGlzQWxpZ25lZDtcbmV4cG9ydHMuaXNQb3cyID0gaXNQb3cyO1xuZXhwb3J0cy5sYW5lMTYgPSBsYW5lMTY7XG5leHBvcnRzLmxhbmUyID0gbGFuZTI7XG5leHBvcnRzLmxhbmU0ID0gbGFuZTQ7XG5leHBvcnRzLmxhbmU4ID0gbGFuZTg7XG5leHBvcnRzLm1hc2tIID0gbWFza0g7XG5leHBvcnRzLm1hc2tMID0gbWFza0w7XG5leHBvcnRzLm11eCA9IG11eDtcbmV4cG9ydHMub25lSG90QmluYXJ5ID0gb25lSG90QmluYXJ5O1xuZXhwb3J0cy5wb3BDb3VudCA9IHBvcENvdW50O1xuZXhwb3J0cy5yb3RhdGVMZWZ0ID0gcm90YXRlTGVmdDtcbmV4cG9ydHMucm90YXRlUmlnaHQgPSByb3RhdGVSaWdodDtcbmV4cG9ydHMuc2FtZTQgPSBzYW1lNDtcbmV4cG9ydHMuc2FtZTggPSBzYW1lODtcbmV4cG9ydHMuc2V0TGFuZTE2ID0gc2V0TGFuZTE2O1xuZXhwb3J0cy5zZXRMYW5lMiA9IHNldExhbmUyO1xuZXhwb3J0cy5zZXRMYW5lNCA9IHNldExhbmU0O1xuZXhwb3J0cy5zZXRMYW5lOCA9IHNldExhbmU4O1xuZXhwb3J0cy5zcGxhdDE2XzMyID0gc3BsYXQxNl8zMjtcbmV4cG9ydHMuc3BsYXQ0XzI0ID0gc3BsYXQ0XzI0O1xuZXhwb3J0cy5zcGxhdDRfMzIgPSBzcGxhdDRfMzI7XG5leHBvcnRzLnNwbGF0OF8yNCA9IHNwbGF0OF8yNDtcbmV4cG9ydHMuc3BsYXQ4XzMyID0gc3BsYXQ4XzMyO1xuZXhwb3J0cy5zd2FwTGFuZTAyID0gc3dhcExhbmUwMjtcbmV4cG9ydHMuc3dhcExhbmUxMyA9IHN3YXBMYW5lMTM7XG5leHBvcnRzLnN3aXp6bGU0ID0gc3dpenpsZTQ7XG5leHBvcnRzLnN3aXp6bGU4ID0gc3dpenpsZTg7XG5leHBvcnRzLnUxNmYzMiA9IHUxNmYzMjtcbmV4cG9ydHMudTI0ZjMyID0gdTI0ZjMyO1xuZXhwb3J0cy51MzJmMzIgPSB1MzJmMzI7XG5leHBvcnRzLnU4ZjMyID0gdThmMzI7XG5leHBvcnRzLnVpbnRCaXRzVG9GbG9hdCA9IHVpbnRCaXRzVG9GbG9hdDtcbmV4cG9ydHMudWludEJpdHNUb0Zsb2F0NjQgPSB1aW50Qml0c1RvRmxvYXQ2NDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuY29uc3QgZXhpc3RzQW5kTm90TnVsbCA9ICh4KSA9PiB4ICE9IG51bGw7XG5cbmNvbnN0IGV4aXN0cyA9ICh0KSA9PiB0ICE9PSB1bmRlZmluZWQ7XG5cbmNvbnN0IGhhc0JpZ0ludCA9ICgpID0+IHR5cGVvZiBCaWdJbnQgPT09IFwiZnVuY3Rpb25cIjtcblxuY29uc3QgaGFzQ3J5cHRvID0gKCkgPT4gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3dbXCJjcnlwdG9cIl0gIT09IHVuZGVmaW5lZDtcblxuY29uc3QgaGFzTWF4TGVuZ3RoID0gKGxlbiwgeCkgPT4geCAhPSBudWxsICYmIHgubGVuZ3RoIDw9IGxlbjtcblxuY29uc3QgaGFzTWluTGVuZ3RoID0gKGxlbiwgeCkgPT4geCAhPSBudWxsICYmIHgubGVuZ3RoID49IGxlbjtcblxuY29uc3QgaXNGdW5jdGlvbiA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBoYXNQZXJmb3JtYW5jZSA9ICgpID0+IHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBpc0Z1bmN0aW9uKHBlcmZvcm1hbmNlLm5vdyk7XG5cbmNvbnN0IGhhc1dBU00gPSAoKSA9PiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiB3aW5kb3dbXCJXZWJBc3NlbWJseVwiXSAhPT0gXCJ1bmRlZmluZWRcIikgfHxcbiAgICAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB0eXBlb2YgZ2xvYmFsW1wiV2ViQXNzZW1ibHlcIl0gIT09IFwidW5kZWZpbmVkXCIpO1xuXG5jb25zdCBoYXNXZWJHTCA9ICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpLmdldENvbnRleHQoXCJ3ZWJnbFwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5jb25zdCBoYXNXZWJTb2NrZXQgPSAoKSA9PiB0eXBlb2YgV2ViU29ja2V0ICE9PSBcInVuZGVmaW5lZFwiO1xuXG5jb25zdCBpbXBsZW1lbnRzRnVuY3Rpb24gPSAoeCwgZm4pID0+IHggIT0gbnVsbCAmJiB0eXBlb2YgeFtmbl0gPT09IFwiZnVuY3Rpb25cIjtcblxuY29uc3QgaXNBbHBoYSA9ICh4KSA9PiAvXlthLXpdKyQvaS50ZXN0KHgpO1xuY29uc3QgaXNBbHBoYU51bSA9ICh4KSA9PiAvXlthLXowLTldKyQvaS50ZXN0KHgpO1xuY29uc3QgaXNOdW1lcmljID0gKHgpID0+IC9eWzAtOV0rJC8udGVzdCh4KTtcblxuY29uc3QgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbmNvbnN0IGlzQXJyYXlMaWtlID0gKHgpID0+IHggIT0gbnVsbCAmJiB0eXBlb2YgeCAhPT0gXCJmdW5jdGlvblwiICYmIHgubGVuZ3RoICE9PSB1bmRlZmluZWQ7XG5cbmNvbnN0IGlzQVNDSUkgPSAoeCkgPT4gL15bXFx4MDAtXFx4N2ZdKyQvLnRlc3QoeCk7XG5jb25zdCBpc1ByaW50YWJsZUFTQ0lJID0gKHgpID0+IC9eW1xceDIwLVxceDdlXSskLy50ZXN0KHgpO1xuXG5jb25zdCBpc0FzeW5jSXRlcmFibGUgPSAoeCkgPT4geCAhPSBudWxsICYmIHR5cGVvZiB4W1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBpc0Jsb2IgPSAoeCkgPT4geCBpbnN0YW5jZW9mIEJsb2I7XG5cbmNvbnN0IGlzQm9vbGVhbiA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJib29sZWFuXCI7XG5cbmNvbnN0IGlzQ2hyb21lID0gKCkgPT4gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhIXdpbmRvd1tcImNocm9tZVwiXTtcblxuY29uc3QgaXNEYXRhVVJMID0gKHgpID0+IC9eZGF0YTouK1xcLyguKyk7YmFzZTY0LC8udGVzdCh4KTtcblxuY29uc3QgaXNEYXRlID0gKHgpID0+IHggaW5zdGFuY2VvZiBEYXRlO1xuXG5jb25zdCBpc0V2ZW4gPSAoeCkgPT4geCAlIDIgPT09IDA7XG5cbmNvbnN0IGlzRmFsc2UgPSAoeCkgPT4geCA9PT0gZmFsc2U7XG5cbmNvbnN0IGlzRmlsZSA9ICh4KSA9PiB4IGluc3RhbmNlb2YgRmlsZTtcblxuY29uc3QgaXNGaXJlZm94ID0gKCkgPT4gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhIXdpbmRvd1tcIkluc3RhbGxUcmlnZ2VyXCJdO1xuXG5jb25zdCBSRSQ0ID0gL14oPzpbLStdPyg/OlswLTldKykpPyg/OlxcLlswLTldKik/KD86W2VFXVtcXCtcXC1dPyg/OlswLTldKykpPyQvO1xuY29uc3QgaXNGbG9hdFN0cmluZyA9ICh4KSA9PiB4Lmxlbmd0aCA+IDAgJiYgUkUkNC50ZXN0KHgpO1xuXG5jb25zdCBpc0hleCA9ICh4KSA9PiAvXlthLWYwLTldKyQvaS50ZXN0KHgpO1xuXG5jb25zdCBpc1N0cmluZyA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJzdHJpbmdcIjtcblxuY29uc3QgUkUkMyA9IC9eIyhbYS1mMC05XXszfXxbYS1mMC05XXs0fSg/OlthLWYwLTldezJ9KXswLDJ9KSQvaTtcbmNvbnN0IGlzSGV4Q29sb3IgPSAoeCkgPT4gaXNTdHJpbmcoeCkgJiYgUkUkMy50ZXN0KHgpO1xuXG5jb25zdCBpc0lFID0gKCkgPT4gdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgKHR5cGVvZiBkb2N1bWVudFtcImRvY3VtZW50TW9kZVwiXSAhPT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgICBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJNU0lFXCIpID4gMCk7XG5cbmNvbnN0IGlzSW5SYW5nZSA9IChtaW4sIG1heCwgeCkgPT4geCA+PSBtaW4gJiYgeCA8PSBtYXg7XG5cbmNvbnN0IGlzSW50MzIgPSAoeCkgPT4gdHlwZW9mIHggPT09IFwibnVtYmVyXCIgJiYgKHggfCAwKSA9PT0geDtcblxuY29uc3QgUkUkMiA9IC9eKD86Wy0rXT8oPzowfFsxLTldWzAtOV0qKSkkLztcbmNvbnN0IGlzSW50U3RyaW5nID0gKHgpID0+IFJFJDIudGVzdCh4KTtcblxuY29uc3QgaXNJdGVyYWJsZSA9ICh4KSA9PiB4ICE9IG51bGwgJiYgdHlwZW9mIHhbU3ltYm9sLml0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBpc01hcCA9ICh4KSA9PiB4IGluc3RhbmNlb2YgTWFwO1xuXG5jb25zdCBpc01vYmlsZSA9ICgpID0+IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAvbW9iaWxlfHRhYmxldHxpcChhZHxob25lfG9kKXxhbmRyb2lkfHNpbGt8Y3Jpb3MvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5jb25zdCBpc05hTiA9ICh4KSA9PiB4ICE9PSB4O1xuXG5jb25zdCBpc05lZ2F0aXZlID0gKHgpID0+IHR5cGVvZiB4ID09PSBcIm51bWJlclwiICYmIHggPCAwO1xuXG5jb25zdCBpc05pbCA9ICh4KSA9PiB4ID09IG51bGw7XG5cbmNvbnN0IGlzTm9kZSA9ICgpID0+IHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmXG4gICAgdHlwZW9mIHByb2Nlc3MudmVyc2lvbnMgPT09IFwib2JqZWN0XCIgJiZcbiAgICB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucy5ub2RlICE9PSBcInVuZGVmaW5lZFwiO1xuXG5jb25zdCBpc05vdFN0cmluZ0FuZEl0ZXJhYmxlID0gKHgpID0+IHggIT0gbnVsbCAmJlxuICAgIHR5cGVvZiB4ICE9PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIHhbU3ltYm9sLml0ZXJhdG9yXSA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBpc051bGwgPSAoeCkgPT4geCA9PT0gbnVsbDtcblxuY29uc3QgaXNOdW1iZXIgPSAoeCkgPT4gdHlwZW9mIHggPT09IFwibnVtYmVyXCI7XG5cbmNvbnN0IGlzTnVtZXJpY0ludCA9ICh4KSA9PiAvXlstK10/XFxkKyQvLnRlc3QoeCk7XG5jb25zdCBpc051bWVyaWNGbG9hdCA9ICh4KSA9PiAvXlstK10/XFxkKlxcLj9cXGQrKGVbLStdP1xcZCspPyQvaS50ZXN0KHgpO1xuXG5jb25zdCBpc09iamVjdCA9ICh4KSA9PiB4ICE9PSBudWxsICYmIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiO1xuXG5jb25zdCBpc09kZCA9ICh4KSA9PiB4ICUgMiAhPT0gMDtcblxuY29uc3QgT0JKUCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZjtcbmNvbnN0IGlzUGxhaW5PYmplY3QgPSAoeCkgPT4ge1xuICAgIGxldCBwO1xuICAgIHJldHVybiAoeCAhPSBudWxsICYmXG4gICAgICAgIHR5cGVvZiB4ID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICgocCA9IE9CSlAoeCkpID09PSBudWxsIHx8IE9CSlAocCkgPT09IG51bGwpKTtcbn07XG5cbmNvbnN0IGlzUG9zaXRpdmUgPSAoeCkgPT4gdHlwZW9mIHggPT09IFwibnVtYmVyXCIgJiYgeCA+IDA7XG5cbmNvbnN0IGlzUHJpbWl0aXZlID0gKHgpID0+IHtcbiAgICBjb25zdCB0ID0gdHlwZW9mIHg7XG4gICAgcmV0dXJuIHQgPT09IFwic3RyaW5nXCIgfHwgdCA9PT0gXCJudW1iZXJcIjtcbn07XG5cbmNvbnN0IGlzUHJvbWlzZSA9ICh4KSA9PiB4IGluc3RhbmNlb2YgUHJvbWlzZTtcblxuY29uc3QgaXNQcm9taXNlTGlrZSA9ICh4KSA9PiB4IGluc3RhbmNlb2YgUHJvbWlzZSB8fFxuICAgIChpbXBsZW1lbnRzRnVuY3Rpb24oeCwgXCJ0aGVuXCIpICYmIGltcGxlbWVudHNGdW5jdGlvbih4LCBcImNhdGNoXCIpKTtcblxuY29uc3QgSUxMRUdBTF9LRVlTID0gbmV3IFNldChbXCJfX3Byb3RvX19cIiwgXCJwcm90b3R5cGVcIiwgXCJjb25zdHJ1Y3RvclwiXSk7XG5jb25zdCBpc0lsbGVnYWxLZXkgPSAoeCkgPT4gSUxMRUdBTF9LRVlTLmhhcyh4KTtcbmNvbnN0IGlzUHJvdG9QYXRoID0gKHBhdGgpID0+IGlzQXJyYXkocGF0aClcbiAgICA/IHBhdGguc29tZShpc0lsbGVnYWxLZXkpXG4gICAgOiBpc1N0cmluZyhwYXRoKVxuICAgICAgICA/IHBhdGguaW5kZXhPZihcIi5cIikgIT09IC0xXG4gICAgICAgICAgICA/IHBhdGguc3BsaXQoXCIuXCIpLnNvbWUoaXNJbGxlZ2FsS2V5KVxuICAgICAgICAgICAgOiBpc0lsbGVnYWxLZXkocGF0aClcbiAgICAgICAgOiBmYWxzZTtcblxuY29uc3QgaXNSZWdFeHAgPSAoeCkgPT4geCBpbnN0YW5jZW9mIFJlZ0V4cDtcblxuY29uc3QgaXNTYWZhcmkgPSAoKSA9PiB0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgL1NhZmFyaS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJlxuICAgICFpc0Nocm9tZSgpO1xuXG5jb25zdCBpc1NldCA9ICh4KSA9PiB4IGluc3RhbmNlb2YgU2V0O1xuXG5jb25zdCBpc1N5bWJvbCA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIjtcblxuY29uc3QgaXNUcmFuc2ZlcmFibGUgPSAoeCkgPT4geCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8XG4gICAgKHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB4IGluc3RhbmNlb2YgU2hhcmVkQXJyYXlCdWZmZXIpIHx8XG4gICAgKHR5cGVvZiBNZXNzYWdlUG9ydCAhPT0gXCJ1bmRlZmluZWRcIiAmJiB4IGluc3RhbmNlb2YgTWVzc2FnZVBvcnQpO1xuXG5jb25zdCBpc1RydWUgPSAoeCkgPT4geCA9PT0gdHJ1ZTtcblxuY29uc3QgaXNUeXBlZEFycmF5ID0gKHgpID0+IHggJiZcbiAgICAoeCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBVaW50MzJBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgSW50MzJBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgVWludDhBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgSW50OEFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBVaW50MTZBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgSW50MTZBcnJheSB8fFxuICAgICAgICB4IGluc3RhbmNlb2YgVWludDhDbGFtcGVkQXJyYXkpO1xuXG5jb25zdCBpc1VpbnQzMiA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJudW1iZXJcIiAmJiB4ID4+PiAwID09PSB4O1xuXG5jb25zdCBpc1VuZGVmaW5lZCA9ICh4KSA9PiB4ID09PSB1bmRlZmluZWQ7XG5cbmNvbnN0IFJFJDEgPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezR9LVswLTlhLWZdezEyfSQvaTtcbmNvbnN0IGlzVVVJRCA9ICh4KSA9PiBSRSQxLnRlc3QoeCk7XG5cbmNvbnN0IFJFID0gL15bMC05YS1mXXs4fS1bMC05YS1mXXs0fS00WzAtOWEtZl17M30tWzg5YWJdWzAtOWEtZl17M30tWzAtOWEtZl17MTJ9JC9pO1xuY29uc3QgaXNVVUlEdjQgPSAoeCkgPT4gUkUudGVzdCh4KTtcblxuY29uc3QgaXNaZXJvID0gKHgpID0+IHggPT09IDA7XG5cbmV4cG9ydHMuZXhpc3RzID0gZXhpc3RzO1xuZXhwb3J0cy5leGlzdHNBbmROb3ROdWxsID0gZXhpc3RzQW5kTm90TnVsbDtcbmV4cG9ydHMuaGFzQmlnSW50ID0gaGFzQmlnSW50O1xuZXhwb3J0cy5oYXNDcnlwdG8gPSBoYXNDcnlwdG87XG5leHBvcnRzLmhhc01heExlbmd0aCA9IGhhc01heExlbmd0aDtcbmV4cG9ydHMuaGFzTWluTGVuZ3RoID0gaGFzTWluTGVuZ3RoO1xuZXhwb3J0cy5oYXNQZXJmb3JtYW5jZSA9IGhhc1BlcmZvcm1hbmNlO1xuZXhwb3J0cy5oYXNXQVNNID0gaGFzV0FTTTtcbmV4cG9ydHMuaGFzV2ViR0wgPSBoYXNXZWJHTDtcbmV4cG9ydHMuaGFzV2ViU29ja2V0ID0gaGFzV2ViU29ja2V0O1xuZXhwb3J0cy5pbXBsZW1lbnRzRnVuY3Rpb24gPSBpbXBsZW1lbnRzRnVuY3Rpb247XG5leHBvcnRzLmlzQVNDSUkgPSBpc0FTQ0lJO1xuZXhwb3J0cy5pc0FscGhhID0gaXNBbHBoYTtcbmV4cG9ydHMuaXNBbHBoYU51bSA9IGlzQWxwaGFOdW07XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuZXhwb3J0cy5pc0FycmF5TGlrZSA9IGlzQXJyYXlMaWtlO1xuZXhwb3J0cy5pc0FzeW5jSXRlcmFibGUgPSBpc0FzeW5jSXRlcmFibGU7XG5leHBvcnRzLmlzQmxvYiA9IGlzQmxvYjtcbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuZXhwb3J0cy5pc0Nocm9tZSA9IGlzQ2hyb21lO1xuZXhwb3J0cy5pc0RhdGFVUkwgPSBpc0RhdGFVUkw7XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcbmV4cG9ydHMuaXNFdmVuID0gaXNFdmVuO1xuZXhwb3J0cy5pc0ZhbHNlID0gaXNGYWxzZTtcbmV4cG9ydHMuaXNGaWxlID0gaXNGaWxlO1xuZXhwb3J0cy5pc0ZpcmVmb3ggPSBpc0ZpcmVmb3g7XG5leHBvcnRzLmlzRmxvYXRTdHJpbmcgPSBpc0Zsb2F0U3RyaW5nO1xuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcbmV4cG9ydHMuaXNIZXggPSBpc0hleDtcbmV4cG9ydHMuaXNIZXhDb2xvciA9IGlzSGV4Q29sb3I7XG5leHBvcnRzLmlzSUUgPSBpc0lFO1xuZXhwb3J0cy5pc0lsbGVnYWxLZXkgPSBpc0lsbGVnYWxLZXk7XG5leHBvcnRzLmlzSW5SYW5nZSA9IGlzSW5SYW5nZTtcbmV4cG9ydHMuaXNJbnQzMiA9IGlzSW50MzI7XG5leHBvcnRzLmlzSW50U3RyaW5nID0gaXNJbnRTdHJpbmc7XG5leHBvcnRzLmlzSXRlcmFibGUgPSBpc0l0ZXJhYmxlO1xuZXhwb3J0cy5pc01hcCA9IGlzTWFwO1xuZXhwb3J0cy5pc01vYmlsZSA9IGlzTW9iaWxlO1xuZXhwb3J0cy5pc05hTiA9IGlzTmFOO1xuZXhwb3J0cy5pc05lZ2F0aXZlID0gaXNOZWdhdGl2ZTtcbmV4cG9ydHMuaXNOaWwgPSBpc05pbDtcbmV4cG9ydHMuaXNOb2RlID0gaXNOb2RlO1xuZXhwb3J0cy5pc05vdFN0cmluZ0FuZEl0ZXJhYmxlID0gaXNOb3RTdHJpbmdBbmRJdGVyYWJsZTtcbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuZXhwb3J0cy5pc051bWVyaWMgPSBpc051bWVyaWM7XG5leHBvcnRzLmlzTnVtZXJpY0Zsb2F0ID0gaXNOdW1lcmljRmxvYXQ7XG5leHBvcnRzLmlzTnVtZXJpY0ludCA9IGlzTnVtZXJpY0ludDtcbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcbmV4cG9ydHMuaXNPZGQgPSBpc09kZDtcbmV4cG9ydHMuaXNQbGFpbk9iamVjdCA9IGlzUGxhaW5PYmplY3Q7XG5leHBvcnRzLmlzUG9zaXRpdmUgPSBpc1Bvc2l0aXZlO1xuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuZXhwb3J0cy5pc1ByaW50YWJsZUFTQ0lJID0gaXNQcmludGFibGVBU0NJSTtcbmV4cG9ydHMuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZXhwb3J0cy5pc1Byb21pc2VMaWtlID0gaXNQcm9taXNlTGlrZTtcbmV4cG9ydHMuaXNQcm90b1BhdGggPSBpc1Byb3RvUGF0aDtcbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcbmV4cG9ydHMuaXNTYWZhcmkgPSBpc1NhZmFyaTtcbmV4cG9ydHMuaXNTZXQgPSBpc1NldDtcbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcbmV4cG9ydHMuaXNUcmFuc2ZlcmFibGUgPSBpc1RyYW5zZmVyYWJsZTtcbmV4cG9ydHMuaXNUcnVlID0gaXNUcnVlO1xuZXhwb3J0cy5pc1R5cGVkQXJyYXkgPSBpc1R5cGVkQXJyYXk7XG5leHBvcnRzLmlzVVVJRCA9IGlzVVVJRDtcbmV4cG9ydHMuaXNVVUlEdjQgPSBpc1VVSUR2NDtcbmV4cG9ydHMuaXNVaW50MzIgPSBpc1VpbnQzMjtcbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcbmV4cG9ydHMuaXNaZXJvID0gaXNaZXJvO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBjb21wYXJlID0gKGEsIGIpID0+IHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKGEgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gYiA9PSBudWxsID8gMCA6IC0xO1xuICAgIH1cbiAgICBpZiAoYiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBhID09IG51bGwgPyAwIDogMTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhLmNvbXBhcmUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gYS5jb21wYXJlKGIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGIuY29tcGFyZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiAtYi5jb21wYXJlKGEpO1xuICAgIH1cbiAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XG59O1xuXG5jb25zdCBnZXRLZXkgPSAoaykgPT4gdHlwZW9mIGsgPT09IFwiZnVuY3Rpb25cIiA/IGsgOiAoeCkgPT4geFtrXTtcbmZ1bmN0aW9uIGNvbXBhcmVCeUtleShhLCBjbXAgPSBjb21wYXJlKSB7XG4gICAgY29uc3QgayA9IGdldEtleShhKTtcbiAgICByZXR1cm4gKHgsIHkpID0+IGNtcChrKHgpLCBrKHkpKTtcbn1cbmZ1bmN0aW9uIGNvbXBhcmVCeUtleXMyKGEsIGIsIGNtcEEgPSBjb21wYXJlLCBjbXBCID0gY29tcGFyZSkge1xuICAgIGNvbnN0IGthID0gZ2V0S2V5KGEpO1xuICAgIGNvbnN0IGtiID0gZ2V0S2V5KGIpO1xuICAgIHJldHVybiAoeCwgeSkgPT4ge1xuICAgICAgICBsZXQgcmVzID0gY21wQShrYSh4KSwga2EoeSkpO1xuICAgICAgICByZXR1cm4gcmVzID09PSAwID8gY21wQihrYih4KSwga2IoeSkpIDogcmVzO1xuICAgIH07XG59XG5mdW5jdGlvbiBjb21wYXJlQnlLZXlzMyhhLCBiLCBjLCBjbXBBID0gY29tcGFyZSwgY21wQiA9IGNvbXBhcmUsIGNtcEMgPSBjb21wYXJlKSB7XG4gICAgY29uc3Qga2EgPSBnZXRLZXkoYSk7XG4gICAgY29uc3Qga2IgPSBnZXRLZXkoYik7XG4gICAgY29uc3Qga2MgPSBnZXRLZXkoYyk7XG4gICAgcmV0dXJuICh4LCB5KSA9PiB7XG4gICAgICAgIGxldCByZXMgPSBjbXBBKGthKHgpLCBrYSh5KSk7XG4gICAgICAgIHJldHVybiByZXMgPT09IDBcbiAgICAgICAgICAgID8gKHJlcyA9IGNtcEIoa2IoeCksIGtiKHkpKSkgPT09IDBcbiAgICAgICAgICAgICAgICA/IGNtcEMoa2MoeCksIGtjKHkpKVxuICAgICAgICAgICAgICAgIDogcmVzXG4gICAgICAgICAgICA6IHJlcztcbiAgICB9O1xufVxuZnVuY3Rpb24gY29tcGFyZUJ5S2V5czQoYSwgYiwgYywgZCwgY21wQSA9IGNvbXBhcmUsIGNtcEIgPSBjb21wYXJlLCBjbXBDID0gY29tcGFyZSwgY21wRCA9IGNvbXBhcmUpIHtcbiAgICBjb25zdCBrYSA9IGdldEtleShhKTtcbiAgICBjb25zdCBrYiA9IGdldEtleShiKTtcbiAgICBjb25zdCBrYyA9IGdldEtleShjKTtcbiAgICBjb25zdCBrZCA9IGdldEtleShkKTtcbiAgICByZXR1cm4gKHgsIHkpID0+IHtcbiAgICAgICAgbGV0IHJlcyA9IGNtcEEoa2EoeCksIGthKHkpKTtcbiAgICAgICAgcmV0dXJuIHJlcyA9PT0gMFxuICAgICAgICAgICAgPyAocmVzID0gY21wQihrYih4KSwga2IoeSkpKSA9PT0gMFxuICAgICAgICAgICAgICAgID8gKHJlcyA9IGNtcEMoa2MoeCksIGtjKHkpKSkgPT09IDBcbiAgICAgICAgICAgICAgICAgICAgPyBjbXBEKGtkKHgpLCBrZCh5KSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNcbiAgICAgICAgICAgICAgICA6IHJlc1xuICAgICAgICAgICAgOiByZXM7XG4gICAgfTtcbn1cblxuY29uc3QgY29tcGFyZU51bUFzYyA9IChhLCBiKSA9PiBhIC0gYjtcbmNvbnN0IGNvbXBhcmVOdW1EZXNjID0gKGEsIGIpID0+IGIgLSBhO1xuXG5jb25zdCByZXZlcnNlID0gKGNtcCkgPT4gKGEsIGIpID0+IC1jbXAoYSwgYik7XG5cbmV4cG9ydHMuY29tcGFyZSA9IGNvbXBhcmU7XG5leHBvcnRzLmNvbXBhcmVCeUtleSA9IGNvbXBhcmVCeUtleTtcbmV4cG9ydHMuY29tcGFyZUJ5S2V5czIgPSBjb21wYXJlQnlLZXlzMjtcbmV4cG9ydHMuY29tcGFyZUJ5S2V5czMgPSBjb21wYXJlQnlLZXlzMztcbmV4cG9ydHMuY29tcGFyZUJ5S2V5czQgPSBjb21wYXJlQnlLZXlzNDtcbmV4cG9ydHMuY29tcGFyZU51bUFzYyA9IGNvbXBhcmVOdW1Bc2M7XG5leHBvcnRzLmNvbXBhcmVOdW1EZXNjID0gY29tcGFyZU51bURlc2M7XG5leHBvcnRzLnJldmVyc2UgPSByZXZlcnNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgZXJyb3JzID0gcmVxdWlyZSgnQHRoaS5uZy9lcnJvcnMnKTtcblxuZnVuY3Rpb24gY29tcCguLi5mbnMpIHtcbiAgICBsZXQgW2EsIGIsIGMsIGQsIGUsIGYsIGcsIGgsIGksIGpdID0gZm5zO1xuICAgIHN3aXRjaCAoZm5zLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBlcnJvcnMuaWxsZWdhbEFyaXR5KDApO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKC4uLnhzKSk7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGEoYihjKC4uLnhzKSkpO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBhKGIoYyhkKC4uLnhzKSkpKTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKGMoZChlKC4uLnhzKSkpKSk7XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGEoYihjKGQoZShmKC4uLnhzKSkpKSkpO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBhKGIoYyhkKGUoZihnKC4uLnhzKSkpKSkpKTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKGMoZChlKGYoZyhoKC4uLnhzKSkpKSkpKSk7XG4gICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGEoYihjKGQoZShmKGcoaChpKC4uLnhzKSkpKSkpKSkpO1xuICAgICAgICBjYXNlIDEwOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc3QgZm4gPSAoLi4ueHMpID0+IGEoYihjKGQoZShmKGcoaChpKGooLi4ueHMpKSkpKSkpKSkpO1xuICAgICAgICAgICAgcmV0dXJuIGZucy5sZW5ndGggPT09IDEwID8gZm4gOiBjb21wKGZuLCAuLi5mbnMuc2xpY2UoMTApKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjb21wTCguLi5mbnMpIHtcbiAgICByZXR1cm4gY29tcC5hcHBseShudWxsLCBmbnMucmV2ZXJzZSgpKTtcbn1cbmNvbnN0IGNvbXBJID0gY29tcEw7XG5cbmZ1bmN0aW9uIGNvbXBsZW1lbnQoZikge1xuICAgIHJldHVybiAoLi4ueHMpID0+ICFmKC4uLnhzKTtcbn1cblxuY29uc3QgY29uc3RhbnRseSA9ICh4KSA9PiAoKSA9PiB4O1xuXG5jb25zdCBkZWxheSA9IChib2R5KSA9PiBuZXcgRGVsYXkoYm9keSk7XG5jbGFzcyBEZWxheSB7XG4gICAgY29uc3RydWN0b3IoYm9keSkge1xuICAgICAgICB0aGlzLmJvZHkgPSBib2R5O1xuICAgICAgICB0aGlzLnJlYWxpemVkID0gZmFsc2U7XG4gICAgfVxuICAgIGRlcmVmKCkge1xuICAgICAgICBpZiAoIXRoaXMucmVhbGl6ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmJvZHkoKTtcbiAgICAgICAgICAgIHRoaXMucmVhbGl6ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbiAgICBpc1JlYWxpemVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFsaXplZDtcbiAgICB9XG59XG5cbmNvbnN0IGRlbGF5ZWQgPSAoeCwgdCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSh4KSwgdCkpO1xuXG5jb25zdCBpZGVudGl0eSA9ICh4KSA9PiB4O1xuXG5jb25zdCBpZkRlZiA9IChmLCB4KSA9PiB4ICE9IG51bGwgPyBmKHgpIDogdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBqdXh0KC4uLmZucykge1xuICAgIGNvbnN0IFthLCBiLCBjLCBkLCBlLCBmLCBnLCBoXSA9IGZucztcbiAgICBzd2l0Y2ggKGZucy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KV07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW2EoeCksIGIoeCldO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFthKHgpLCBiKHgpLCBjKHgpXTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KSwgYih4KSwgYyh4KSwgZCh4KV07XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW2EoeCksIGIoeCksIGMoeCksIGQoeCksIGUoeCldO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFthKHgpLCBiKHgpLCBjKHgpLCBkKHgpLCBlKHgpLCBmKHgpXTtcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KSwgYih4KSwgYyh4KSwgZCh4KSwgZSh4KSwgZih4KSwgZyh4KV07XG4gICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW2EoeCksIGIoeCksIGMoeCksIGQoeCksIGUoeCksIGYoeCksIGcoeCksIGgoeCldO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHJlcyA9IG5ldyBBcnJheShmbnMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZm5zLmxlbmd0aDsgLS1pID49IDA7KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1tpXSA9IGZuc1tpXSh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYXJ0aWFsKGZuLCAuLi5hcmdzKSB7XG4gICAgbGV0IFthLCBiLCBjLCBkLCBlLCBmLCBnLCBoXSA9IGFyZ3M7XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBmbihhLCAuLi54cyk7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIGIsIC4uLnhzKTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gZm4oYSwgYiwgYywgLi4ueHMpO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBmbihhLCBiLCBjLCBkLCAuLi54cyk7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIGIsIGMsIGQsIGUsIC4uLnhzKTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gZm4oYSwgYiwgYywgZCwgZSwgZiwgLi4ueHMpO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBmbihhLCBiLCBjLCBkLCBlLCBmLCBnLCAuLi54cyk7XG4gICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgsIC4uLnhzKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGVycm9ycy5pbGxlZ2FsQXJncygpO1xuICAgIH1cbn1cblxuY29uc3QgcHJvbWlzaWZ5ID0gKGZuKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiBmbigoZXJyLCByZXN1bHQpID0+IChlcnIgIT0gbnVsbCA/IHJlamVjdChlcnIpIDogcmVzb2x2ZShyZXN1bHQpKSkpO1xuXG5jb25zdCB0aHJlYWRGaXJzdCA9IChpbml0LCAuLi5mbnMpID0+IGZucy5yZWR1Y2UoKGFjYywgZXhwcikgPT4gdHlwZW9mIGV4cHIgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gZXhwcihhY2MpXG4gICAgOiBleHByWzBdKGFjYywgLi4uZXhwci5zbGljZSgxKSksIGluaXQpO1xuXG5jb25zdCB0aHJlYWRMYXN0ID0gKGluaXQsIC4uLmZucykgPT4gZm5zLnJlZHVjZSgoYWNjLCBleHByKSA9PiB0eXBlb2YgZXhwciA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBleHByKGFjYylcbiAgICA6IGV4cHJbMF0oLi4uZXhwci5zbGljZSgxKSwgYWNjKSwgaW5pdCk7XG5cbmNvbnN0IHRyYW1wb2xpbmUgPSAoZikgPT4ge1xuICAgIHdoaWxlICh0eXBlb2YgZiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGYgPSBmKCk7XG4gICAgfVxuICAgIHJldHVybiBmO1xufTtcblxuZXhwb3J0cy5EZWxheSA9IERlbGF5O1xuZXhwb3J0cy5jb21wID0gY29tcDtcbmV4cG9ydHMuY29tcEkgPSBjb21wSTtcbmV4cG9ydHMuY29tcEwgPSBjb21wTDtcbmV4cG9ydHMuY29tcGxlbWVudCA9IGNvbXBsZW1lbnQ7XG5leHBvcnRzLmNvbnN0YW50bHkgPSBjb25zdGFudGx5O1xuZXhwb3J0cy5kZWxheSA9IGRlbGF5O1xuZXhwb3J0cy5kZWxheWVkID0gZGVsYXllZDtcbmV4cG9ydHMuaWRlbnRpdHkgPSBpZGVudGl0eTtcbmV4cG9ydHMuaWZEZWYgPSBpZkRlZjtcbmV4cG9ydHMuanV4dCA9IGp1eHQ7XG5leHBvcnRzLnBhcnRpYWwgPSBwYXJ0aWFsO1xuZXhwb3J0cy5wcm9taXNpZnkgPSBwcm9taXNpZnk7XG5leHBvcnRzLnRocmVhZEZpcnN0ID0gdGhyZWFkRmlyc3Q7XG5leHBvcnRzLnRocmVhZExhc3QgPSB0aHJlYWRMYXN0O1xuZXhwb3J0cy50cmFtcG9saW5lID0gdHJhbXBvbGluZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuY29uc3QgT0JKUCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih7fSk7XG5jb25zdCBGTiA9IFwiZnVuY3Rpb25cIjtcbmNvbnN0IFNUUiA9IFwic3RyaW5nXCI7XG5jb25zdCBlcXVpdiA9IChhLCBiKSA9PiB7XG4gICAgbGV0IHByb3RvO1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYS5lcXVpdiA9PT0gRk4pIHtcbiAgICAgICAgICAgIHJldHVybiBhLmVxdWl2KGIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYSA9PSBiO1xuICAgIH1cbiAgICBpZiAoYiAhPSBudWxsKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYi5lcXVpdiA9PT0gRk4pIHtcbiAgICAgICAgICAgIHJldHVybiBiLmVxdWl2KGEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYSA9PSBiO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgPT09IFNUUiB8fCB0eXBlb2YgYiA9PT0gU1RSKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCgocHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkpLCBwcm90byA9PSBudWxsIHx8IHByb3RvID09PSBPQkpQKSAmJlxuICAgICAgICAoKHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKSwgcHJvdG8gPT0gbnVsbCB8fCBwcm90byA9PT0gT0JKUCkpIHtcbiAgICAgICAgcmV0dXJuIGVxdWl2T2JqZWN0KGEsIGIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT09IEZOICYmXG4gICAgICAgIGEubGVuZ3RoICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgdHlwZW9mIGIgIT09IEZOICYmXG4gICAgICAgIGIubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGVxdWl2QXJyYXlMaWtlKGEsIGIpO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIFNldCAmJiBiIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgIHJldHVybiBlcXVpdlNldChhLCBiKTtcbiAgICB9XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBNYXAgJiYgYiBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgICByZXR1cm4gZXF1aXZNYXAoYSwgYik7XG4gICAgfVxuICAgIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICByZXR1cm4gYS5nZXRUaW1lKCkgPT09IGIuZ2V0VGltZSgpO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBiIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgIHJldHVybiBhLnRvU3RyaW5nKCkgPT09IGIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIGEgIT09IGEgJiYgYiAhPT0gYjtcbn07XG5jb25zdCBlcXVpdkFycmF5TGlrZSA9IChhLCBiLCBfZXF1aXYgPSBlcXVpdikgPT4ge1xuICAgIGxldCBsID0gYS5sZW5ndGg7XG4gICAgaWYgKGwgPT09IGIubGVuZ3RoKSB7XG4gICAgICAgIHdoaWxlICgtLWwgPj0gMCAmJiBfZXF1aXYoYVtsXSwgYltsXSkpXG4gICAgICAgICAgICA7XG4gICAgfVxuICAgIHJldHVybiBsIDwgMDtcbn07XG5jb25zdCBlcXVpdlNldCA9IChhLCBiLCBfZXF1aXYgPSBlcXVpdikgPT4gYS5zaXplID09PSBiLnNpemUgJiYgX2VxdWl2KFsuLi5hLmtleXMoKV0uc29ydCgpLCBbLi4uYi5rZXlzKCldLnNvcnQoKSk7XG5jb25zdCBlcXVpdk1hcCA9IChhLCBiLCBfZXF1aXYgPSBlcXVpdikgPT4gYS5zaXplID09PSBiLnNpemUgJiYgX2VxdWl2KFsuLi5hXS5zb3J0KCksIFsuLi5iXS5zb3J0KCkpO1xuY29uc3QgZXF1aXZPYmplY3QgPSAoYSwgYiwgX2VxdWl2ID0gZXF1aXYpID0+IHtcbiAgICBpZiAoT2JqZWN0LmtleXMoYSkubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKGxldCBrIGluIGEpIHtcbiAgICAgICAgaWYgKCFiLmhhc093blByb3BlcnR5KGspIHx8ICFfZXF1aXYoYVtrXSwgYltrXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMuZXF1aXYgPSBlcXVpdjtcbmV4cG9ydHMuZXF1aXZBcnJheUxpa2UgPSBlcXVpdkFycmF5TGlrZTtcbmV4cG9ydHMuZXF1aXZNYXAgPSBlcXVpdk1hcDtcbmV4cG9ydHMuZXF1aXZPYmplY3QgPSBlcXVpdk9iamVjdDtcbmV4cG9ydHMuZXF1aXZTZXQgPSBlcXVpdlNldDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuY29uc3QgZGVmRXJyb3IgPSAocHJlZml4LCBzdWZmaXggPSAobXNnKSA9PiAobXNnICE9PSB1bmRlZmluZWQgPyBcIjogXCIgKyBtc2cgOiBcIlwiKSkgPT4gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobXNnKSB7XG4gICAgICAgIHN1cGVyKHByZWZpeChtc2cpICsgc3VmZml4KG1zZykpO1xuICAgIH1cbn07XG5cbmNvbnN0IElsbGVnYWxBcmd1bWVudEVycm9yID0gZGVmRXJyb3IoKCkgPT4gXCJpbGxlZ2FsIGFyZ3VtZW50KHMpXCIpO1xuY29uc3QgaWxsZWdhbEFyZ3MgPSAobXNnKSA9PiB7XG4gICAgdGhyb3cgbmV3IElsbGVnYWxBcmd1bWVudEVycm9yKG1zZyk7XG59O1xuXG5jb25zdCBJbGxlZ2FsQXJpdHlFcnJvciA9IGRlZkVycm9yKCgpID0+IFwiaWxsZWdhbCBhcml0eVwiKTtcbmNvbnN0IGlsbGVnYWxBcml0eSA9IChuKSA9PiB7XG4gICAgdGhyb3cgbmV3IElsbGVnYWxBcml0eUVycm9yKG4pO1xufTtcblxuY29uc3QgSWxsZWdhbFN0YXRlRXJyb3IgPSBkZWZFcnJvcigoKSA9PiBcImlsbGVnYWwgc3RhdGVcIik7XG5jb25zdCBpbGxlZ2FsU3RhdGUgPSAobXNnKSA9PiB7XG4gICAgdGhyb3cgbmV3IElsbGVnYWxTdGF0ZUVycm9yKG1zZyk7XG59O1xuXG5jb25zdCBPdXRPZkJvdW5kc0Vycm9yID0gZGVmRXJyb3IoKCkgPT4gXCJpbmRleCBvdXQgb2YgYm91bmRzXCIpO1xuY29uc3Qgb3V0T2ZCb3VuZHMgPSAoaW5kZXgpID0+IHtcbiAgICB0aHJvdyBuZXcgT3V0T2ZCb3VuZHNFcnJvcihpbmRleCk7XG59O1xuY29uc3QgZW5zdXJlSW5kZXggPSAoaW5kZXgsIG1pbiwgbWF4KSA9PiAoaW5kZXggPCBtaW4gfHwgaW5kZXggPj0gbWF4KSAmJiBvdXRPZkJvdW5kcyhpbmRleCk7XG5jb25zdCBlbnN1cmVJbmRleDIgPSAoeCwgeSwgbWF4WCwgbWF4WSkgPT4gKHggPCAwIHx8IHggPj0gbWF4WCB8fCB5IDwgMCB8fCB5ID49IG1heFkpICYmIG91dE9mQm91bmRzKFt4LCB5XSk7XG5cbmNvbnN0IFVuc3VwcG9ydGVkT3BlcmF0aW9uRXJyb3IgPSBkZWZFcnJvcigoKSA9PiBcInVuc3VwcG9ydGVkIG9wZXJhdGlvblwiKTtcbmNvbnN0IHVuc3VwcG9ydGVkID0gKG1zZykgPT4ge1xuICAgIHRocm93IG5ldyBVbnN1cHBvcnRlZE9wZXJhdGlvbkVycm9yKG1zZyk7XG59O1xuXG5leHBvcnRzLklsbGVnYWxBcmd1bWVudEVycm9yID0gSWxsZWdhbEFyZ3VtZW50RXJyb3I7XG5leHBvcnRzLklsbGVnYWxBcml0eUVycm9yID0gSWxsZWdhbEFyaXR5RXJyb3I7XG5leHBvcnRzLklsbGVnYWxTdGF0ZUVycm9yID0gSWxsZWdhbFN0YXRlRXJyb3I7XG5leHBvcnRzLk91dE9mQm91bmRzRXJyb3IgPSBPdXRPZkJvdW5kc0Vycm9yO1xuZXhwb3J0cy5VbnN1cHBvcnRlZE9wZXJhdGlvbkVycm9yID0gVW5zdXBwb3J0ZWRPcGVyYXRpb25FcnJvcjtcbmV4cG9ydHMuZGVmRXJyb3IgPSBkZWZFcnJvcjtcbmV4cG9ydHMuZW5zdXJlSW5kZXggPSBlbnN1cmVJbmRleDtcbmV4cG9ydHMuZW5zdXJlSW5kZXgyID0gZW5zdXJlSW5kZXgyO1xuZXhwb3J0cy5pbGxlZ2FsQXJncyA9IGlsbGVnYWxBcmdzO1xuZXhwb3J0cy5pbGxlZ2FsQXJpdHkgPSBpbGxlZ2FsQXJpdHk7XG5leHBvcnRzLmlsbGVnYWxTdGF0ZSA9IGlsbGVnYWxTdGF0ZTtcbmV4cG9ydHMub3V0T2ZCb3VuZHMgPSBvdXRPZkJvdW5kcztcbmV4cG9ydHMudW5zdXBwb3J0ZWQgPSB1bnN1cHBvcnRlZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxuY29uc3QgUDMyID0gMHgxMDAwMDAwMDA7XG5jb25zdCBIRVggPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcbmNvbnN0IFU0ID0gKHgpID0+IEhFWFt4ICYgMHhmXTtcbmNvbnN0IFU4ID0gKHgpID0+IEhFWFsoeCA+Pj4gNCkgJiAweGZdICsgSEVYW3ggJiAweGZdO1xuY29uc3QgVThBID0gKHgsIGkpID0+IFU4KHhbaV0pO1xuY29uc3QgVTE2ID0gKHgpID0+IFU4KHggPj4+IDgpICsgVTgoeCAmIDB4ZmYpO1xuY29uc3QgVTE2QkUgPSAoeCwgaSkgPT4gVTgoeFtpXSkgKyBVOCh4W2kgKyAxXSk7XG5jb25zdCBVMTZMRSA9ICh4LCBpKSA9PiBVOCh4W2kgKyAxXSkgKyBVOCh4W2ldKTtcbmNvbnN0IFUyNCA9ICh4KSA9PiBVOCh4ID4+PiAxNikgKyBVMTYoeCk7XG5jb25zdCBVMjRCRSA9ICh4LCBpKSA9PiBVOCh4W2ldKSArIFUxNkJFKHgsIGkgKyAxKTtcbmNvbnN0IFUyNExFID0gKHgsIGkpID0+IFU4KHhbaSArIDJdKSArIFUxNkxFKHgsIGkpO1xuY29uc3QgVTMyID0gKHgpID0+IFUxNih4ID4+PiAxNikgKyBVMTYoeCk7XG5jb25zdCBVMzJCRSA9ICh4LCBpKSA9PiBVMTZCRSh4LCBpKSArIFUxNkJFKHgsIGkgKyAyKTtcbmNvbnN0IFUzMkxFID0gKHgsIGkpID0+IFUxNkxFKHgsIGkgKyAyKSArIFUxNkxFKHgsIGkpO1xuY29uc3QgVTQ4ID0gKHgpID0+IFU0OEhMKHggLyBQMzIsIHggJSBQMzIpO1xuY29uc3QgVTQ4SEwgPSAoaGksIGxvKSA9PiBVMTYoaGkpICsgVTMyKGxvKTtcbmNvbnN0IFU0OEJFID0gKHgsIGkpID0+IFUxNkJFKHgsIGkpICsgVTMyQkUoeCwgaSArIDIpO1xuY29uc3QgVTQ4TEUgPSAoeCwgaSkgPT4gVTE2TEUoeCwgaSArIDQpICsgVTMyTEUoeCwgaSk7XG5jb25zdCBVNjQgPSAoeCkgPT4gVTY0SEwoeCAvIFAzMiwgeCAlIFAzMik7XG5jb25zdCBVNjRITCA9IChoaSwgbG8pID0+IFUzMihoaSkgKyBVMzIobG8pO1xuY29uc3QgVTY0QkUgPSAoeCwgaSkgPT4gVTMyQkUoeCwgaSkgKyBVMzJCRSh4LCBpICsgNCk7XG5jb25zdCBVNjRMRSA9ICh4LCBpKSA9PiBVMzJMRSh4LCBpICsgNCkgKyBVMzJMRSh4LCBpKTtcbmNvbnN0IHV1aWQgPSAoaWQsIGkgPSAwKSA9PlxuYCR7VTMyQkUoaWQsIGkpfS0ke1UxNkJFKGlkLCBpICsgNCl9LSR7VTE2QkUoaWQsIGkgKyA2KX0tJHtVMTZCRShpZCwgaSArIDgpfS0ke1U0OEJFKGlkLCBpICsgMTApfWA7XG5cbmV4cG9ydHMuSEVYID0gSEVYO1xuZXhwb3J0cy5VMTYgPSBVMTY7XG5leHBvcnRzLlUxNkJFID0gVTE2QkU7XG5leHBvcnRzLlUxNkxFID0gVTE2TEU7XG5leHBvcnRzLlUyNCA9IFUyNDtcbmV4cG9ydHMuVTI0QkUgPSBVMjRCRTtcbmV4cG9ydHMuVTI0TEUgPSBVMjRMRTtcbmV4cG9ydHMuVTMyID0gVTMyO1xuZXhwb3J0cy5VMzJCRSA9IFUzMkJFO1xuZXhwb3J0cy5VMzJMRSA9IFUzMkxFO1xuZXhwb3J0cy5VNCA9IFU0O1xuZXhwb3J0cy5VNDggPSBVNDg7XG5leHBvcnRzLlU0OEJFID0gVTQ4QkU7XG5leHBvcnRzLlU0OEhMID0gVTQ4SEw7XG5leHBvcnRzLlU0OExFID0gVTQ4TEU7XG5leHBvcnRzLlU2NCA9IFU2NDtcbmV4cG9ydHMuVTY0QkUgPSBVNjRCRTtcbmV4cG9ydHMuVTY0SEwgPSBVNjRITDtcbmV4cG9ydHMuVTY0TEUgPSBVNjRMRTtcbmV4cG9ydHMuVTggPSBVODtcbmV4cG9ydHMuVThBID0gVThBO1xuZXhwb3J0cy51dWlkID0gdXVpZDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIGNoZWNrcyA9IHJlcXVpcmUoJ0B0aGkubmcvY2hlY2tzJyk7XG52YXIgZXJyb3JzID0gcmVxdWlyZSgnQHRoaS5uZy9lcnJvcnMnKTtcbnZhciB0cmFuc2R1Y2Vyc0JpbmFyeSA9IHJlcXVpcmUoJ0B0aGkubmcvdHJhbnNkdWNlcnMtYmluYXJ5Jyk7XG5cbmNvbnN0IEJJTkFSWSA9IFwiQUdGemJRRUFBQUFCRFFOZ0FYd0JmMkFBQVh4Z0FBQURCZ1VDQUFFQUFRVURBUUFDQmlvSGZ3QkJnQWdMZndCQmdBZ0xmd0JCaWdnTGZ3QkJnQWdMZndCQmtJZ0VDMzhBUVFBTGZ3QkJBUXNIMFFFTkJtMWxiVzl5ZVFJQUVWOWZkMkZ6YlY5allXeHNYMk4wYjNKekFBQVNiR1ZpTVRJNFgyVnVZMjlrWlY5MVgycHpBQUVEWW5WbUF3QVNiR1ZpTVRJNFgyUmxZMjlrWlY5MVgycHpBQUlTYkdWaU1USTRYMlZ1WTI5a1pWOXpYMnB6QUFNU2JHVmlNVEk0WDJSbFkyOWtaVjl6WDJwekFBUU1YMTlrYzI5ZmFHRnVaR3hsQXdFS1gxOWtZWFJoWDJWdVpBTUNEVjlmWjJ4dlltRnNYMkpoYzJVREF3dGZYMmhsWVhCZlltRnpaUU1FRFY5ZmJXVnRiM0o1WDJKaGMyVURCUXhmWDNSaFlteGxYMkpoYzJVREJncVdCQVVEQUFFTGVnSUNmd0YrQWtBQ2ZpQUFSQUFBQUFBQUFQQkRZeUFBUkFBQUFBQUFBQUFBWm5FRVFDQUFzUXdCQzBJQUN5SURRb0FCV2dSQUEwQWdBVUdBQ0dvZ0E2ZEIvd0J4SUFOQ0I0Z2lBMElBVWlJQ1FRZDBjam9BQUNBQlFRRnFJUUVnQWcwQUN3d0JDMEdBQ0NBRFBBQUFRUUVoQVFzZ0FVSC9BWEVMV3dJRGZ3SitRWFloQUFOQUFrQWdBRVVFUUVFS0lRRU1BUXNnQVVFQmFpRUJJQUJCaWdocUxBQUFJZ0pCL3dCeHJTQURoaUFFaENFRUlBQkJBV29oQUNBRFFnZDhJUU1nQWtFQVNBMEJDd3RCZ0FnZ0FUb0FBQ0FFdWd1N0FRSUJmZ1IvQWtBQ2ZpQUFtVVFBQUFBQUFBRGdRMk1FUUNBQXNBd0JDMEtBZ0lDQWdJQ0FnSUIvQ3lJQlFrQjlRb0FCV2dSQVFRRWhBd05BSUFORkRRSWdBYWNpQTBIQUFIRWhCQUovUWdFZ0FVSUhoeUlCSUFRYlVFVUVRQ0FEUVlCL2NpRUZRUUVnQkVVZ0FVSi9VbklOQVJvTElBTkIvd0J4SVFWQkFBc2hBeUFDUVlBSWFpQUZPZ0FBSUFKQkFXb2hBZ3dBQ3dBTFFZQUlJQUZDT1lpblFjQUFjU0FCcDBFL2NYSTZBQUJCQVNFQ0N5QUNRZjhCY1F0OEFnTi9BMzVCZnlFQUEwQUNRQ0FEUWdkOElRVWdBRUdCQ0dvdEFBQWlBa0VZZEVFWWRTRUJJQUpCL3dCeHJTQURoaUFFaENFRUlBQkJBV29pQUVFSVN3MEFJQVVoQXlBQlFRQklEUUVMQzBHQUNDQUFRUUZxT2dBQUlBUkNmeUFGaGtJQUlBRkJ3QUJ4UVFaMkcwSUFJQUJCL3dGeFFRbEpHNFM1Q3dBYUNYQnliMlIxWTJWeWN3RUliR0Z1WjNWaFoyVUJBME01T1FBPVwiO1xuXG5sZXQgd2FzbTtcbmxldCBVODtcbmlmIChjaGVja3MuaGFzV0FTTSgpKSB7XG4gICAgY29uc3QgaW5zdCA9IG5ldyBXZWJBc3NlbWJseS5JbnN0YW5jZShuZXcgV2ViQXNzZW1ibHkuTW9kdWxlKG5ldyBVaW50OEFycmF5KFsuLi50cmFuc2R1Y2Vyc0JpbmFyeS5iYXNlNjREZWNvZGUoQklOQVJZKV0pKSk7XG4gICAgd2FzbSA9IGluc3QuZXhwb3J0cztcbiAgICBVOCA9IG5ldyBVaW50OEFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlciwgd2FzbS5idWYsIDE2KTtcbn1cbmNvbnN0IGVuc3VyZVdBU00gPSAoKSA9PiAhd2FzbSAmJiBlcnJvcnMudW5zdXBwb3J0ZWQoXCJXQVNNIG1vZHVsZSB1bmF2YWlsYWJsZVwiKTtcbmNvbnN0IGVuY29kZSA9IChvcCkgPT4gKHgpID0+IHtcbiAgICBlbnN1cmVXQVNNKCk7XG4gICAgcmV0dXJuIFU4LnNsaWNlKDAsIHdhc21bb3BdKHgpKTtcbn07XG5jb25zdCBkZWNvZGUgPSAob3ApID0+IChzcmMsIGlkeCA9IDApID0+IHtcbiAgICBlbnN1cmVXQVNNKCk7XG4gICAgVTguc2V0KHNyYy5zdWJhcnJheShpZHgsIE1hdGgubWluKGlkeCArIDEwLCBzcmMubGVuZ3RoKSksIDApO1xuICAgIHJldHVybiBbd2FzbVtvcF0oMCwgMCksIFU4WzBdXTtcbn07XG5jb25zdCBlbmNvZGVTTEVCMTI4ID0gZW5jb2RlKFwibGViMTI4X2VuY29kZV9zX2pzXCIpO1xuY29uc3QgZGVjb2RlU0xFQjEyOCA9IGRlY29kZShcImxlYjEyOF9kZWNvZGVfc19qc1wiKTtcbmNvbnN0IGVuY29kZVVMRUIxMjggPSBlbmNvZGUoXCJsZWIxMjhfZW5jb2RlX3VfanNcIik7XG5jb25zdCBkZWNvZGVVTEVCMTI4ID0gZGVjb2RlKFwibGViMTI4X2RlY29kZV91X2pzXCIpO1xuXG5leHBvcnRzLmRlY29kZVNMRUIxMjggPSBkZWNvZGVTTEVCMTI4O1xuZXhwb3J0cy5kZWNvZGVVTEVCMTI4ID0gZGVjb2RlVUxFQjEyODtcbmV4cG9ydHMuZW5jb2RlU0xFQjEyOCA9IGVuY29kZVNMRUIxMjg7XG5leHBvcnRzLmVuY29kZVVMRUIxMjggPSBlbmNvZGVVTEVCMTI4O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBQSSA9IE1hdGguUEk7XG5jb25zdCBUQVUgPSBQSSAqIDI7XG5jb25zdCBIQUxGX1BJID0gUEkgLyAyO1xuY29uc3QgVEhJUkRfUEkgPSBQSSAvIDM7XG5jb25zdCBRVUFSVEVSX1BJID0gUEkgLyA0O1xuY29uc3QgU0lYVEhfUEkgPSBQSSAvIDY7XG5jb25zdCBJTlZfUEkgPSAxIC8gUEk7XG5jb25zdCBJTlZfVEFVID0gMSAvIFRBVTtcbmNvbnN0IElOVl9IQUxGX1BJID0gMSAvIEhBTEZfUEk7XG5jb25zdCBERUcyUkFEID0gUEkgLyAxODA7XG5jb25zdCBSQUQyREVHID0gMTgwIC8gUEk7XG5jb25zdCBQSEkgPSAoMSArIE1hdGguc3FydCg1KSkgLyAyO1xuY29uc3QgU1FSVDIgPSBNYXRoLlNRUlQyO1xuY29uc3QgU1FSVDMgPSBNYXRoLnNxcnQoMyk7XG5jb25zdCBTUVJUMl8yID0gU1FSVDIgLyAyO1xuY29uc3QgU1FSVDJfMyA9IFNRUlQzIC8gMjtcbmNvbnN0IFRISVJEID0gMSAvIDM7XG5jb25zdCBUV09fVEhJUkQgPSAyIC8gMztcbmNvbnN0IFNJWFRIID0gMSAvIDY7XG5sZXQgRVBTID0gMWUtNjtcblxuY29uc3QgYWJzRGlmZiA9ICh4LCB5KSA9PiBNYXRoLmFicyh4IC0geSk7XG5jb25zdCBzaWduID0gKHgsIGVwcyA9IEVQUykgPT4gKHggPiBlcHMgPyAxIDogeCA8IC1lcHMgPyAtMSA6IDApO1xuXG5jb25zdCBzaW5jb3MgPSAodGhldGEsIG4gPSAxKSA9PiBbXG4gICAgTWF0aC5zaW4odGhldGEpICogbixcbiAgICBNYXRoLmNvcyh0aGV0YSkgKiBuLFxuXTtcbmNvbnN0IGNvc3NpbiA9ICh0aGV0YSwgbiA9IDEpID0+IFtcbiAgICBNYXRoLmNvcyh0aGV0YSkgKiBuLFxuICAgIE1hdGguc2luKHRoZXRhKSAqIG4sXG5dO1xuY29uc3QgYWJzVGhldGEgPSAodGhldGEpID0+ICgodGhldGEgJT0gVEFVKSwgdGhldGEgPCAwID8gVEFVICsgdGhldGEgOiB0aGV0YSk7XG5jb25zdCBhYnNJbm5lckFuZ2xlID0gKHRoZXRhKSA9PiAoKHRoZXRhID0gTWF0aC5hYnModGhldGEpKSwgdGhldGEgPiBQSSA/IFRBVSAtIHRoZXRhIDogdGhldGEpO1xuY29uc3QgYW5nbGVEaXN0ID0gKGEsIGIpID0+IGFic0lubmVyQW5nbGUoYWJzVGhldGEoKGIgJSBUQVUpIC0gKGEgJSBUQVUpKSk7XG5jb25zdCBhdGFuMkFicyA9ICh5LCB4KSA9PiBhYnNUaGV0YShNYXRoLmF0YW4yKHksIHgpKTtcbmNvbnN0IHF1YWRyYW50ID0gKHRoZXRhKSA9PiAoYWJzVGhldGEodGhldGEpICogSU5WX0hBTEZfUEkpIHwgMDtcbmNvbnN0IGRlZyA9ICh0aGV0YSkgPT4gdGhldGEgKiBSQUQyREVHO1xuY29uc3QgcmFkID0gKHRoZXRhKSA9PiB0aGV0YSAqIERFRzJSQUQ7XG5jb25zdCBjc2MgPSAodGhldGEpID0+IDEgLyBNYXRoLnNpbih0aGV0YSk7XG5jb25zdCBzZWMgPSAodGhldGEpID0+IDEgLyBNYXRoLmNvcyh0aGV0YSk7XG5jb25zdCBjb3QgPSAodGhldGEpID0+IDEgLyBNYXRoLnRhbih0aGV0YSk7XG5jb25zdCBsb2MgPSAoYSwgYiwgZ2FtbWEpID0+IE1hdGguc3FydChhICogYSArIGIgKiBiIC0gMiAqIGEgKiBiICogTWF0aC5jb3MoZ2FtbWEpKTtcbmNvbnN0IG5vcm1Db3MgPSAoeCkgPT4ge1xuICAgIGNvbnN0IHgyID0geCAqIHg7XG4gICAgcmV0dXJuIDEuMCArIHgyICogKC00ICsgMiAqIHgyKTtcbn07XG5jb25zdCBfX2Zhc3RDb3MgPSAoeCkgPT4ge1xuICAgIGNvbnN0IHgyID0geCAqIHg7XG4gICAgcmV0dXJuIDAuOTk5NDAzMDcgKyB4MiAqICgtMC40OTU1ODA3MiArIDAuMDM2NzkxNjggKiB4Mik7XG59O1xuY29uc3QgZmFzdENvcyA9ICh0aGV0YSkgPT4ge1xuICAgIHRoZXRhICU9IFRBVTtcbiAgICB0aGV0YSA8IDAgJiYgKHRoZXRhID0gLXRoZXRhKTtcbiAgICBzd2l0Y2ggKCh0aGV0YSAqIElOVl9IQUxGX1BJKSB8IDApIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgcmV0dXJuIF9fZmFzdENvcyh0aGV0YSk7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiAtX19mYXN0Q29zKFBJIC0gdGhldGEpO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gLV9fZmFzdENvcyh0aGV0YSAtIFBJKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBfX2Zhc3RDb3MoVEFVIC0gdGhldGEpO1xuICAgIH1cbn07XG5jb25zdCBmYXN0U2luID0gKHRoZXRhKSA9PiBmYXN0Q29zKEhBTEZfUEkgLSB0aGV0YSk7XG5cbmNvbnN0IGFicyA9IE1hdGguYWJzO1xuY29uc3QgbWF4ID0gTWF0aC5tYXg7XG5jb25zdCBlcURlbHRhID0gKGEsIGIsIGVwcyA9IEVQUykgPT4gYWJzKGEgLSBiKSA8PSBlcHM7XG5jb25zdCBlcURlbHRhU2NhbGVkID0gKGEsIGIsIGVwcyA9IEVQUykgPT4gYWJzKGEgLSBiKSA8PSBlcHMgKiBtYXgoMSwgYWJzKGEpLCBhYnMoYikpO1xuXG5jb25zdCBpc0Nyb3NzT3ZlciA9IChhMSwgYTIsIGIxLCBiMikgPT4gYTEgPCBiMSAmJiBhMiA+IGIyO1xuY29uc3QgaXNDcm9zc1VuZGVyID0gKGExLCBhMiwgYjEsIGIyKSA9PiBhMSA+IGIxICYmIGEyIDwgYjI7XG5jb25zdCBjbGFzc2lmeUNyb3NzaW5nID0gKGExLCBhMiwgYjEsIGIyLCBlcHMgPSBFUFMpID0+IGVxRGVsdGEoYTEsIGIxLCBlcHMpICYmIGVxRGVsdGEoYTIsIGIyLCBlcHMpXG4gICAgPyBlcURlbHRhKGExLCBiMiwgZXBzKVxuICAgICAgICA/IFwiZmxhdFwiXG4gICAgICAgIDogXCJlcXVhbFwiXG4gICAgOiBpc0Nyb3NzT3ZlcihhMSwgYTIsIGIxLCBiMilcbiAgICAgICAgPyBcIm92ZXJcIlxuICAgICAgICA6IGlzQ3Jvc3NVbmRlcihhMSwgYTIsIGIxLCBiMilcbiAgICAgICAgICAgID8gXCJ1bmRlclwiXG4gICAgICAgICAgICA6IFwib3RoZXJcIjtcblxuY29uc3QgaXNNaW5pbWEgPSAoYSwgYiwgYykgPT4gYSA+IGIgJiYgYiA8IGM7XG5jb25zdCBpc01heGltYSA9IChhLCBiLCBjKSA9PiBhIDwgYiAmJiBiID4gYztcbmNvbnN0IGluZGV4ID0gKHByZWQsIHZhbHVlcywgZnJvbSA9IDAsIHRvID0gdmFsdWVzLmxlbmd0aCkgPT4ge1xuICAgIHRvLS07XG4gICAgZm9yIChsZXQgaSA9IGZyb20gKyAxOyBpIDwgdG87IGkrKykge1xuICAgICAgICBpZiAocHJlZCh2YWx1ZXNbaSAtIDFdLCB2YWx1ZXNbaV0sIHZhbHVlc1tpICsgMV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59O1xuY29uc3QgbWluaW1hSW5kZXggPSAodmFsdWVzLCBmcm9tID0gMCwgdG8gPSB2YWx1ZXMubGVuZ3RoKSA9PiBpbmRleChpc01pbmltYSwgdmFsdWVzLCBmcm9tLCB0byk7XG5jb25zdCBtYXhpbWFJbmRleCA9ICh2YWx1ZXMsIGZyb20gPSAwLCB0byA9IHZhbHVlcy5sZW5ndGgpID0+IGluZGV4KGlzTWF4aW1hLCB2YWx1ZXMsIGZyb20sIHRvKTtcbmZ1bmN0aW9uKiBpbmRpY2VzKGZuLCB2YWxzLCBmcm9tID0gMCwgdG8gPSB2YWxzLmxlbmd0aCkge1xuICAgIHdoaWxlIChmcm9tIDwgdG8pIHtcbiAgICAgICAgY29uc3QgaSA9IGZuKHZhbHMsIGZyb20sIHRvKTtcbiAgICAgICAgaWYgKGkgPCAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB5aWVsZCBpO1xuICAgICAgICBmcm9tID0gaSArIDE7XG4gICAgfVxufVxuY29uc3QgbWluaW1hSW5kaWNlcyA9ICh2YWx1ZXMsIGZyb20gPSAwLCB0byA9IHZhbHVlcy5sZW5ndGgpID0+IGluZGljZXMobWluaW1hSW5kZXgsIHZhbHVlcywgZnJvbSwgdG8pO1xuY29uc3QgbWF4aW1hSW5kaWNlcyA9ICh2YWx1ZXMsIGZyb20gPSAwLCB0byA9IHZhbHVlcy5sZW5ndGgpID0+IGluZGljZXMobWluaW1hSW5kZXgsIHZhbHVlcywgZnJvbSwgdG8pO1xuXG5jb25zdCBjbGFtcCA9ICh4LCBtaW4sIG1heCkgPT4gKHggPCBtaW4gPyBtaW4gOiB4ID4gbWF4ID8gbWF4IDogeCk7XG5jb25zdCBjbGFtcDAgPSAoeCkgPT4gKHggPiAwID8geCA6IDApO1xuY29uc3QgY2xhbXAwMSA9ICh4KSA9PiAoeCA8IDAgPyAwIDogeCA+IDEgPyAxIDogeCk7XG5jb25zdCBjbGFtcDExID0gKHgpID0+ICh4IDwgLTEgPyAtMSA6IHggPiAxID8gMSA6IHgpO1xuY29uc3QgY2xhbXAwNSA9ICh4KSA9PiAoeCA8IDAgPyAwIDogeCA+IDAuNSA/IDAuNSA6IHgpO1xuY29uc3Qgd3JhcCA9ICh4LCBtaW4sIG1heCkgPT4ge1xuICAgIGlmIChtaW4gPT09IG1heClcbiAgICAgICAgcmV0dXJuIG1pbjtcbiAgICBpZiAoeCA+IG1heCkge1xuICAgICAgICBjb25zdCBkID0gbWF4IC0gbWluO1xuICAgICAgICB4IC09IGQ7XG4gICAgICAgIGlmICh4ID4gbWF4KVxuICAgICAgICAgICAgeCAtPSBkICogKCgoeCAtIG1pbikgLyBkKSB8IDApO1xuICAgIH1cbiAgICBlbHNlIGlmICh4IDwgbWluKSB7XG4gICAgICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgICAgIHggKz0gZDtcbiAgICAgICAgaWYgKHggPCBtaW4pXG4gICAgICAgICAgICB4ICs9IGQgKiAoKChtaW4gLSB4KSAvIGQgKyAxKSB8IDApO1xuICAgIH1cbiAgICByZXR1cm4geDtcbn07XG5jb25zdCB3cmFwT25jZSA9ICh4LCBtaW4sIG1heCkgPT4geCA8IG1pbiA/IHggLSBtaW4gKyBtYXggOiB4ID4gbWF4ID8geCAtIG1heCArIG1pbiA6IHg7XG5jb25zdCB3cmFwMDEgPSAoeCkgPT4gKHggPCAwID8geCArIDEgOiB4ID4gMSA/IHggLSAxIDogeCk7XG5jb25zdCB3cmFwMTEgPSAoeCkgPT4gKHggPCAtMSA/IHggKyAyIDogeCA+IDEgPyB4IC0gMiA6IHgpO1xuY29uc3QgbWluMmlkID0gKGEsIGIpID0+IChhIDw9IGIgPyAwIDogMSk7XG5jb25zdCBtaW4zaWQgPSAoYSwgYiwgYykgPT4gYSA8PSBiID8gKGEgPD0gYyA/IDAgOiAyKSA6IGIgPD0gYyA/IDEgOiAyO1xuY29uc3QgbWluNGlkID0gKGEsIGIsIGMsIGQpID0+IGEgPD0gYlxuICAgID8gYSA8PSBjXG4gICAgICAgID8gYSA8PSBkXG4gICAgICAgICAgICA/IDBcbiAgICAgICAgICAgIDogM1xuICAgICAgICA6IGMgPD0gZFxuICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICA6IDNcbiAgICA6IGIgPD0gY1xuICAgICAgICA/IGIgPD0gZFxuICAgICAgICAgICAgPyAxXG4gICAgICAgICAgICA6IDNcbiAgICAgICAgOiBjIDw9IGRcbiAgICAgICAgICAgID8gMlxuICAgICAgICAgICAgOiAzO1xuY29uc3QgbWF4MmlkID0gKGEsIGIpID0+IChhID49IGIgPyAwIDogMSk7XG5jb25zdCBtYXgzaWQgPSAoYSwgYiwgYykgPT4gYSA+PSBiID8gKGEgPj0gYyA/IDAgOiAyKSA6IGIgPj0gYyA/IDEgOiAyO1xuY29uc3QgbWF4NGlkID0gKGEsIGIsIGMsIGQpID0+IGEgPj0gYlxuICAgID8gYSA+PSBjXG4gICAgICAgID8gYSA+PSBkXG4gICAgICAgICAgICA/IDBcbiAgICAgICAgICAgIDogM1xuICAgICAgICA6IGMgPj0gZFxuICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICA6IDNcbiAgICA6IGIgPj0gY1xuICAgICAgICA/IGIgPj0gZFxuICAgICAgICAgICAgPyAxXG4gICAgICAgICAgICA6IDNcbiAgICAgICAgOiBjID49IGRcbiAgICAgICAgICAgID8gMlxuICAgICAgICAgICAgOiAzO1xuY29uc3QgbWluTm9uWmVybzIgPSAoYSwgYikgPT4gYSAhPT0gMCA/IChiICE9PSAwID8gTWF0aC5taW4oYSwgYikgOiBhKSA6IGI7XG5jb25zdCBtaW5Ob25aZXJvMyA9IChhLCBiLCBjKSA9PiBtaW5Ob25aZXJvMihtaW5Ob25aZXJvMihhLCBiKSwgYyk7XG5jb25zdCBzbWluID0gKGEsIGIsIGspID0+IHNtYXgoYSwgYiwgLWspO1xuY29uc3Qgc21heCA9IChhLCBiLCBrKSA9PiB7XG4gICAgY29uc3QgZWEgPSBNYXRoLmV4cChhICogayk7XG4gICAgY29uc3QgZWIgPSBNYXRoLmV4cChiICogayk7XG4gICAgcmV0dXJuIChhICogZWEgKyBiICogZWIpIC8gKGVhICsgZWIpO1xufTtcbmNvbnN0IHNjbGFtcCA9ICh4LCBtaW4sIG1heCwgaykgPT4gc21pbihzbWF4KHgsIG1pbiwgayksIG1heCwgayk7XG5jb25zdCBhYnNNaW4gPSAoYSwgYikgPT4gKE1hdGguYWJzKGEpIDwgTWF0aC5hYnMoYikgPyBhIDogYik7XG5jb25zdCBhYnNNYXggPSAoYSwgYikgPT4gKE1hdGguYWJzKGEpID4gTWF0aC5hYnMoYikgPyBhIDogYik7XG5jb25zdCBmb2xkYmFjayA9IChlLCB4KSA9PiB4IDwgLWUgfHwgeCA+IGUgPyBNYXRoLmFicyhNYXRoLmFicygoeCAtIGUpICUgKDQgKiBlKSkgLSAyICogZSkgLSBlIDogeDtcbmNvbnN0IGluUmFuZ2UgPSAoeCwgbWluLCBtYXgpID0+IHggPj0gbWluICYmIHggPD0gbWF4O1xuY29uc3QgaW5PcGVuUmFuZ2UgPSAoeCwgbWluLCBtYXgpID0+IHggPiBtaW4gJiYgeCA8IG1heDtcblxuY29uc3Qgbm9ybSA9ICh4LCBhLCBiKSA9PiAoYiAhPT0gYSA/ICh4IC0gYSkgLyAoYiAtIGEpIDogMCk7XG5jb25zdCBmaXQgPSAoeCwgYSwgYiwgYywgZCkgPT4gYyArIChkIC0gYykgKiBub3JtKHgsIGEsIGIpO1xuY29uc3QgZml0Q2xhbXBlZCA9ICh4LCBhLCBiLCBjLCBkKSA9PiBjICsgKGQgLSBjKSAqIGNsYW1wMDEobm9ybSh4LCBhLCBiKSk7XG5jb25zdCBmaXQwMSA9ICh4LCBhLCBiKSA9PiBhICsgKGIgLSBhKSAqIGNsYW1wMDEoeCk7XG5jb25zdCBmaXQxMCA9ICh4LCBhLCBiKSA9PiBiICsgKGEgLSBiKSAqIGNsYW1wMDEoeCk7XG5jb25zdCBmaXQxMSA9ICh4LCBhLCBiKSA9PiBhICsgKGIgLSBhKSAqICgwLjUgKyAwLjUgKiBjbGFtcDExKHgpKTtcblxuY29uc3QgTTggPSAweGZmO1xuY29uc3QgTTE2ID0gMHhmZmZmO1xuY29uc3Qgc2lnbkV4dGVuZDggPSAoYSkgPT4gKChhICY9IE04KSwgYSAmIDB4ODAgPyBhIHwgfk04IDogYSk7XG5jb25zdCBzaWduRXh0ZW5kMTYgPSAoYSkgPT4gKChhICY9IE0xNiksIGEgJiAweDgwMDAgPyBhIHwgfk0xNiA6IGEpO1xuY29uc3QgYWRkaTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSArIChiIHwgMCkpO1xuY29uc3QgZGl2aTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSAvIChiIHwgMCkpO1xuY29uc3QgbXVsaTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSAqIChiIHwgMCkpO1xuY29uc3Qgc3ViaTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSAtIChiIHwgMCkpO1xuY29uc3QgYW5kaTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSAmIChiIHwgMCkpO1xuY29uc3Qgb3JpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOChhIHwgMCB8IChiIHwgMCkpO1xuY29uc3QgeG9yaTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSBeIChiIHwgMCkpO1xuY29uc3Qgbm90aTggPSAoYSkgPT4gc2lnbkV4dGVuZDgofmEpO1xuY29uc3QgbHNoaWZ0aTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSA8PCAoYiB8IDApKTtcbmNvbnN0IHJzaGlmdGk4ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQ4KChhIHwgMCkgPj4gKGIgfCAwKSk7XG5jb25zdCBhZGRpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgKyAoYiB8IDApKTtcbmNvbnN0IGRpdmkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoKGEgfCAwKSAvIChiIHwgMCkpO1xuY29uc3QgbXVsaTE2ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQxNigoYSB8IDApICogKGIgfCAwKSk7XG5jb25zdCBzdWJpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgLSAoYiB8IDApKTtcbmNvbnN0IGFuZGkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoKGEgfCAwKSAmIChiIHwgMCkpO1xuY29uc3Qgb3JpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KGEgfCAwIHwgKGIgfCAwKSk7XG5jb25zdCB4b3JpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgXiAoYiB8IDApKTtcbmNvbnN0IG5vdGkxNiA9IChhKSA9PiBzaWduRXh0ZW5kMTYofmEpO1xuY29uc3QgbHNoaWZ0aTE2ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQxNigoYSB8IDApIDw8IChiIHwgMCkpO1xuY29uc3QgcnNoaWZ0aTE2ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQxNigoYSB8IDApID4+IChiIHwgMCkpO1xuY29uc3QgYWRkaTMyID0gKGEsIGIpID0+ICgoYSB8IDApICsgKGIgfCAwKSkgfCAwO1xuY29uc3QgZGl2aTMyID0gKGEsIGIpID0+ICgoYSB8IDApIC8gKGIgfCAwKSkgfCAwO1xuY29uc3QgbXVsaTMyID0gKGEsIGIpID0+ICgoYSB8IDApICogKGIgfCAwKSkgfCAwO1xuY29uc3Qgc3ViaTMyID0gKGEsIGIpID0+ICgoYSB8IDApIC0gKGIgfCAwKSkgfCAwO1xuY29uc3QgYW5kaTMyID0gKGEsIGIpID0+IChhIHwgMCkgJiAoYiB8IDApO1xuY29uc3Qgb3JpMzIgPSAoYSwgYikgPT4gYSB8IDAgfCAoYiB8IDApO1xuY29uc3QgeG9yaTMyID0gKGEsIGIpID0+IChhIHwgMCkgXiAoYiB8IDApO1xuY29uc3QgbHNoaWZ0aTMyID0gKGEsIGIpID0+IChhIHwgMCkgPDwgKGIgfCAwKTtcbmNvbnN0IHJzaGlmdGkzMiA9IChhLCBiKSA9PiAoYSB8IDApID4+IChiIHwgMCk7XG5jb25zdCBub3RpMzIgPSAoYSkgPT4gfmE7XG5jb25zdCBhZGR1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgKyAoYiAmIE04KSkgJiBNODtcbmNvbnN0IGRpdnU4ID0gKGEsIGIpID0+ICgoYSAmIE04KSAvIChiICYgTTgpKSAmIE04O1xuY29uc3QgbXVsdTggPSAoYSwgYikgPT4gKChhICYgTTgpICogKGIgJiBNOCkpICYgTTg7XG5jb25zdCBzdWJ1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgLSAoYiAmIE04KSkgJiBNODtcbmNvbnN0IGFuZHU4ID0gKGEsIGIpID0+IGEgJiBNOCAmIChiICYgTTgpICYgTTg7XG5jb25zdCBvcnU4ID0gKGEsIGIpID0+ICgoYSAmIE04KSB8IChiICYgTTgpKSAmIE04O1xuY29uc3QgeG9ydTggPSAoYSwgYikgPT4gKChhICYgTTgpIF4gKGIgJiBNOCkpICYgTTg7XG5jb25zdCBub3R1OCA9IChhKSA9PiB+YSAmIE04O1xuY29uc3QgbHNoaWZ0dTggPSAoYSwgYikgPT4gKChhICYgTTgpIDw8IChiICYgTTgpKSAmIE04O1xuY29uc3QgcnNoaWZ0dTggPSAoYSwgYikgPT4gKChhICYgTTgpID4+PiAoYiAmIE04KSkgJiBNODtcbmNvbnN0IGFkZHUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpICsgKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IGRpdnUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpIC8gKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IG11bHUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpICogKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IHN1YnUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpIC0gKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IGFuZHUxNiA9IChhLCBiKSA9PiBhICYgTTE2ICYgKGIgJiBNMTYpICYgTTE2O1xuY29uc3Qgb3J1MTYgPSAoYSwgYikgPT4gKChhICYgTTE2KSB8IChiICYgTTE2KSkgJiBNMTY7XG5jb25zdCB4b3J1MTYgPSAoYSwgYikgPT4gKChhICYgTTE2KSBeIChiICYgTTE2KSkgJiBNMTY7XG5jb25zdCBub3R1MTYgPSAoYSkgPT4gfmEgJiBNMTY7XG5jb25zdCBsc2hpZnR1MTYgPSAoYSwgYikgPT4gKChhICYgTTE2KSA8PCAoYiAmIE0xNikpICYgTTE2O1xuY29uc3QgcnNoaWZ0dTE2ID0gKGEsIGIpID0+ICgoYSAmIE0xNikgPj4+IChiICYgTTE2KSkgJiBNMTY7XG5jb25zdCBhZGR1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSArIChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCBkaXZ1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSAvIChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCBtdWx1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSAqIChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCBzdWJ1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSAtIChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCBhbmR1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSAmIChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCBvcnUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApIHwgKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IHhvcnUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApIF4gKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IG5vdHUzMiA9IChhKSA9PiB+YSA+Pj4gMDtcbmNvbnN0IGxzaGlmdHUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApIDw8IChiID4+PiAwKSkgPj4+IDA7XG5jb25zdCByc2hpZnR1MzIgPSAoYSwgYikgPT4gKChhID4+PiAwKSA+Pj4gKGIgPj4+IDApKSA+Pj4gMDtcblxuY29uc3QgY29weXNpZ24gPSAoeCwgeSkgPT4gTWF0aC5zaWduKHkpICogTWF0aC5hYnMoeCk7XG5jb25zdCBleHAyID0gKHgpID0+IDIgKiogeDtcbmNvbnN0IGZkaW0gPSAoeCwgeSkgPT4gTWF0aC5tYXgoeCAtIHksIDApO1xuY29uc3QgZm1hID0gKHgsIHksIHopID0+IHggKiB5ICsgejtcbmNvbnN0IGZtb2QgPSAoeCwgeSkgPT4geCAlIHk7XG5jb25zdCBmcmV4cCA9ICh4KSA9PiB7XG4gICAgaWYgKHggPT09IDAgfHwgIWlzRmluaXRlKHgpKVxuICAgICAgICByZXR1cm4gW3gsIDBdO1xuICAgIGNvbnN0IGFicyA9IE1hdGguYWJzKHgpO1xuICAgIGxldCBleHAgPSBNYXRoLm1heCgtMTAyMywgTWF0aC5mbG9vcihNYXRoLmxvZzIoYWJzKSkgKyAxKTtcbiAgICBsZXQgeSA9IGFicyAqIDIgKiogLWV4cDtcbiAgICB3aGlsZSAoeSA8IDAuNSkge1xuICAgICAgICB5ICo9IDI7XG4gICAgICAgIGV4cC0tO1xuICAgIH1cbiAgICB3aGlsZSAoeSA+PSAxKSB7XG4gICAgICAgIHkgKj0gMC41O1xuICAgICAgICBleHArKztcbiAgICB9XG4gICAgcmV0dXJuIFt4IDwgMCA/IC15IDogeSwgZXhwXTtcbn07XG5jb25zdCBsZGV4cCA9ICh4LCBleHApID0+IHggKiAyICoqIGV4cDtcbmNvbnN0IHJlbWFpbmRlciA9ICh4LCB5KSA9PiB4IC0geSAqIE1hdGgucm91bmQoeCAvIHkpO1xuXG5jb25zdCBtaW5FcnJvciA9IChmbiwgZXJyb3IsIHEsIHJlcyA9IDE2LCBpdGVyID0gOCwgc3RhcnQgPSAwLCBlbmQgPSAxLCBlcHMgPSBFUFMpID0+IHtcbiAgICBpZiAoaXRlciA8PSAwKVxuICAgICAgICByZXR1cm4gKHN0YXJ0ICsgZW5kKSAvIDI7XG4gICAgY29uc3QgZGVsdGEgPSAoZW5kIC0gc3RhcnQpIC8gcmVzO1xuICAgIGxldCBtaW5UID0gc3RhcnQ7XG4gICAgbGV0IG1pbkUgPSBJbmZpbml0eTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSByZXM7IGkrKykge1xuICAgICAgICBjb25zdCB0ID0gc3RhcnQgKyBpICogZGVsdGE7XG4gICAgICAgIGNvbnN0IGUgPSBlcnJvcihxLCBmbih0KSk7XG4gICAgICAgIGlmIChlIDwgbWluRSkge1xuICAgICAgICAgICAgaWYgKGUgPD0gZXBzKVxuICAgICAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICAgICAgbWluRSA9IGU7XG4gICAgICAgICAgICBtaW5UID0gdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWluRXJyb3IoZm4sIGVycm9yLCBxLCByZXMsIGl0ZXIgLSAxLCBNYXRoLm1heChtaW5UIC0gZGVsdGEsIDApLCBNYXRoLm1pbihtaW5UICsgZGVsdGEsIDEpKTtcbn07XG5cbmNvbnN0IG1peCA9IChhLCBiLCB0KSA9PiBhICsgKGIgLSBhKSAqIHQ7XG5jb25zdCBtaXhCaWxpbmVhciA9IChhLCBiLCBjLCBkLCB1LCB2KSA9PiB7XG4gICAgY29uc3QgaXUgPSAxIC0gdTtcbiAgICBjb25zdCBpdiA9IDEgLSB2O1xuICAgIHJldHVybiBhICogaXUgKiBpdiArIGIgKiB1ICogaXYgKyBjICogaXUgKiB2ICsgZCAqIHUgKiB2O1xufTtcbmNvbnN0IG1peFF1YWRyYXRpYyA9IChhLCBiLCBjLCB0KSA9PiB7XG4gICAgY29uc3QgcyA9IDEgLSB0O1xuICAgIHJldHVybiBhICogcyAqIHMgKyBiICogMiAqIHMgKiB0ICsgYyAqIHQgKiB0O1xufTtcbmNvbnN0IG1peEN1YmljID0gKGEsIGIsIGMsIGQsIHQpID0+IHtcbiAgICBjb25zdCB0MiA9IHQgKiB0O1xuICAgIGNvbnN0IHMgPSAxIC0gdDtcbiAgICBjb25zdCBzMiA9IHMgKiBzO1xuICAgIHJldHVybiBhICogczIgKiBzICsgYiAqIDMgKiBzMiAqIHQgKyBjICogMyAqIHQyICogcyArIGQgKiB0MiAqIHQ7XG59O1xuY29uc3QgbWl4SGVybWl0ZSA9IChhLCBiLCBjLCBkLCB0KSA9PiB7XG4gICAgY29uc3QgeTEgPSAwLjUgKiAoYyAtIGEpO1xuICAgIGNvbnN0IHkyID0gMS41ICogKGIgLSBjKSArIDAuNSAqIChkIC0gYSk7XG4gICAgcmV0dXJuICgoeTIgKiB0ICsgYSAtIGIgKyB5MSAtIHkyKSAqIHQgKyB5MSkgKiB0ICsgYjtcbn07XG5jb25zdCBtaXhDdWJpY0hlcm1pdGUgPSAoYSwgdGEsIGIsIHRiLCB0KSA9PiB7XG4gICAgY29uc3QgcyA9IHQgLSAxO1xuICAgIGNvbnN0IHQyID0gdCAqIHQ7XG4gICAgY29uc3QgczIgPSBzICogcztcbiAgICBjb25zdCBoMDAgPSAoMSArIDIgKiB0KSAqIHMyO1xuICAgIGNvbnN0IGgxMCA9IHQgKiBzMjtcbiAgICBjb25zdCBoMDEgPSB0MiAqICgzIC0gMiAqIHQpO1xuICAgIGNvbnN0IGgxMSA9IHQyICogcztcbiAgICByZXR1cm4gaDAwICogYSArIGgxMCAqIHRhICsgaDAxICogYiArIGgxMSAqIHRiO1xufTtcbmNvbnN0IG1peEN1YmljSGVybWl0ZUZyb21Qb2ludHMgPSAoYSwgYiwgYywgZCwgdCkgPT4ge1xuICAgIGQgKj0gMC41O1xuICAgIGNvbnN0IGFhID0gLTAuNSAqIGEgKyAxLjUgKiBiIC0gMS41ICogYyArIGQ7XG4gICAgY29uc3QgYmIgPSBhIC0gMi41ICogYiArIDIgKiBjIC0gZDtcbiAgICBjb25zdCBjYyA9IC0wLjUgKiBhICsgMC41ICogYztcbiAgICBjb25zdCBkZCA9IGI7XG4gICAgY29uc3QgdDIgPSB0ICogdDtcbiAgICByZXR1cm4gdCAqIHQyICogYWEgKyB0MiAqIGJiICsgdCAqIGNjICsgZGQ7XG59O1xuY29uc3QgbWl4QmljdWJpYyA9IChzMDAsIHMwMSwgczAyLCBzMDMsIHMxMCwgczExLCBzMTIsIHMxMywgczIwLCBzMjEsIHMyMiwgczIzLCBzMzAsIHMzMSwgczMyLCBzMzMsIHUsIHYpID0+IG1peEN1YmljSGVybWl0ZUZyb21Qb2ludHMobWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyhzMDAsIHMwMSwgczAyLCBzMDMsIHUpLCBtaXhDdWJpY0hlcm1pdGVGcm9tUG9pbnRzKHMxMCwgczExLCBzMTIsIHMxMywgdSksIG1peEN1YmljSGVybWl0ZUZyb21Qb2ludHMoczIwLCBzMjEsIHMyMiwgczIzLCB1KSwgbWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyhzMzAsIHMzMSwgczMyLCBzMzMsIHUpLCB2KTtcbmNvbnN0IHRhbmdlbnRDYXJkaW5hbCA9IChwcmV2LCBuZXh0LCBzY2FsZSA9IDAuNSwgdGEgPSAwLCB0YyA9IDIpID0+IHNjYWxlICogKChuZXh0IC0gcHJldikgLyAodGMgLSB0YSkpO1xuY29uc3QgdGFuZ2VudERpZmYzID0gKHByZXYsIGN1cnIsIG5leHQsIHRhID0gMCwgdGIgPSAxLCB0YyA9IDIpID0+IDAuNSAqICgobmV4dCAtIGN1cnIpIC8gKHRjIC0gdGIpICsgKGN1cnIgLSBwcmV2KSAvICh0YiAtIHRhKSk7XG5jb25zdCB0d2VlbiA9IChmLCBmcm9tLCB0bykgPT4gKHQpID0+IG1peChmcm9tLCB0bywgZih0KSk7XG5jb25zdCBjaXJjdWxhciA9ICh0KSA9PiB7XG4gICAgdCA9IDEgLSB0O1xuICAgIHJldHVybiBNYXRoLnNxcnQoMSAtIHQgKiB0KTtcbn07XG5jb25zdCBpbnZDaXJjdWxhciA9ICh0KSA9PiAxIC0gY2lyY3VsYXIoMSAtIHQpO1xuY29uc3QgbGVucyA9IChwb3MsIHN0cmVuZ3RoLCB0KSA9PiB7XG4gICAgY29uc3QgaW1wbCA9IHN0cmVuZ3RoID4gMCA/IGludkNpcmN1bGFyIDogY2lyY3VsYXI7XG4gICAgY29uc3QgdHAgPSAxIC0gcG9zO1xuICAgIGNvbnN0IHRsID0gdCA8PSBwb3MgPyBpbXBsKHQgLyBwb3MpICogcG9zIDogMSAtIGltcGwoKDEgLSB0KSAvIHRwKSAqIHRwO1xuICAgIHJldHVybiBtaXgodCwgdGwsIE1hdGguYWJzKHN0cmVuZ3RoKSk7XG59O1xuY29uc3QgY29zaW5lID0gKHQpID0+IDEgLSAoTWF0aC5jb3ModCAqIFBJKSAqIDAuNSArIDAuNSk7XG5jb25zdCBkZWNpbWF0ZWQgPSAobiwgdCkgPT4gTWF0aC5mbG9vcih0ICogbikgLyBuO1xuY29uc3QgYm91bmNlID0gKGssIGFtcCwgdCkgPT4ge1xuICAgIGNvbnN0IHRrID0gdCAqIGs7XG4gICAgcmV0dXJuIDEgLSAoKGFtcCAqIE1hdGguc2luKHRrKSkgLyB0aykgKiBNYXRoLmNvcyh0ICogSEFMRl9QSSk7XG59O1xuY29uc3QgZWFzZSA9IChlYXNlLCB0KSA9PiBNYXRoLnBvdyh0LCBlYXNlKTtcbmNvbnN0IGltcHVsc2UgPSAoaywgdCkgPT4ge1xuICAgIGNvbnN0IGggPSBrICogdDtcbiAgICByZXR1cm4gaCAqIE1hdGguZXhwKDEgLSBoKTtcbn07XG5jb25zdCBnYWluID0gKGssIHQpID0+IHQgPCAwLjUgPyAwLjUgKiBNYXRoLnBvdygyICogdCwgaykgOiAxIC0gMC41ICogTWF0aC5wb3coMiAtIDIgKiB0LCBrKTtcbmNvbnN0IHBhcmFib2xhID0gKGssIHQpID0+IE1hdGgucG93KDQuMCAqIHQgKiAoMS4wIC0gdCksIGspO1xuY29uc3QgY3ViaWNQdWxzZSA9ICh3LCBjLCB0KSA9PiB7XG4gICAgdCA9IE1hdGguYWJzKHQgLSBjKTtcbiAgICByZXR1cm4gdCA+IHcgPyAwIDogKCh0IC89IHcpLCAxIC0gdCAqIHQgKiAoMyAtIDIgKiB0KSk7XG59O1xuY29uc3Qgc2luYyA9ICh0KSA9PiAodCAhPT0gMCA/IE1hdGguc2luKHQpIC8gdCA6IDEpO1xuY29uc3Qgc2luY05vcm1hbGl6ZWQgPSAoaywgdCkgPT4gc2luYyhQSSAqIGsgKiB0KTtcbmNvbnN0IGxhbmN6b3MgPSAoYSwgdCkgPT4gdCAhPT0gMCA/ICgtYSA8IHQgJiYgdCA8IGEgPyBzaW5jKFBJICogdCkgKiBzaW5jKChQSSAqIHQpIC8gYSkgOiAwKSA6IDE7XG5jb25zdCBzaWdtb2lkID0gKGJpYXMsIGssIHQpID0+IHQgIT0gYmlhcyA/IDEgLyAoMSArIE1hdGguZXhwKC1rICogKHQgLSBiaWFzKSkpIDogMC41O1xuY29uc3Qgc2lnbW9pZDAxID0gKGssIHQpID0+IHNpZ21vaWQoMC41LCBrLCB0KTtcbmNvbnN0IHNpZ21vaWQxMSA9IChrLCB0KSA9PiBzaWdtb2lkKDAsIGssIHQpO1xuY29uc3Qgc2NobGljayA9IChhLCBiLCB0KSA9PiB0IDw9IGJcbiAgICA/IChiICogdCkgLyAodCArIGEgKiAoYiAtIHQpICsgRVBTKVxuICAgIDogKCgxIC0gYikgKiAodCAtIDEpKSAvICgxIC0gdCAtIGEgKiAoYiAtIHQpICsgRVBTKSArIDE7XG5jb25zdCBleHBGYWN0b3IgPSAoYSwgYiwgbnVtKSA9PiAoYiAvIGEpICoqICgxIC8gbnVtKTtcbmNvbnN0IGdhdXNzaWFuID0gKGJpYXMsIHNpZ21hLCB0KSA9PiBNYXRoLmV4cCgtKCh0IC0gYmlhcykgKiogMikgLyAoMiAqIHNpZ21hICogc2lnbWEpKTtcblxuY29uc3QgbW9kID0gKGEsIGIpID0+IGEgLSBiICogTWF0aC5mbG9vcihhIC8gYik7XG5jb25zdCBmcmFjdCA9ICh4KSA9PiB4IC0gTWF0aC5mbG9vcih4KTtcbmNvbnN0IHRydW5jID0gKHgpID0+ICh4IDwgMCA/IE1hdGguY2VpbCh4KSA6IE1hdGguZmxvb3IoeCkpO1xuY29uc3Qgcm91bmRUbyA9ICh4LCBwcmVjID0gMSkgPT4gTWF0aC5yb3VuZCh4IC8gcHJlYykgKiBwcmVjO1xuY29uc3QgZmxvb3JUbyA9ICh4LCBwcmVjID0gMSkgPT4gTWF0aC5mbG9vcih4IC8gcHJlYykgKiBwcmVjO1xuY29uc3QgY2VpbFRvID0gKHgsIHByZWMgPSAxKSA9PiBNYXRoLmNlaWwoeCAvIHByZWMpICogcHJlYztcbmNvbnN0IHJvdW5kRXBzID0gKHgsIGVwcyA9IEVQUykgPT4ge1xuICAgIGNvbnN0IGYgPSBmcmFjdCh4KTtcbiAgICByZXR1cm4gZiA8PSBlcHMgfHwgZiA+PSAxIC0gZXBzID8gTWF0aC5yb3VuZCh4KSA6IHg7XG59O1xuXG5jb25zdCBzaW1wbGlmeVJhdGlvID0gKG51bSwgZGVub20pID0+IHtcbiAgICBsZXQgZTEgPSBNYXRoLmFicyhudW0pO1xuICAgIGxldCBlMiA9IE1hdGguYWJzKGRlbm9tKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAoZTEgPCBlMikge1xuICAgICAgICAgICAgY29uc3QgdCA9IGUxO1xuICAgICAgICAgICAgZTEgPSBlMjtcbiAgICAgICAgICAgIGUyID0gdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByID0gZTEgJSBlMjtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIGUxID0gcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbbnVtIC8gZTIsIGRlbm9tIC8gZTJdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuY29uc3Qgc2FmZURpdiA9IChhLCBiKSA9PiAoYiAhPT0gMCA/IGEgLyBiIDogMCk7XG5cbmNvbnN0IGRlcml2YXRpdmUgPSAoZiwgZXBzID0gRVBTKSA9PiAoeCkgPT4gKGYoeCArIGVwcykgLSBmKHgpKSAvIGVwcztcbmNvbnN0IHNvbHZlTGluZWFyID0gKGEsIGIpID0+IHNhZmVEaXYoLWIsIGEpO1xuY29uc3Qgc29sdmVRdWFkcmF0aWMgPSAoYSwgYiwgYywgZXBzID0gMWUtOSkgPT4ge1xuICAgIGNvbnN0IGQgPSAyICogYTtcbiAgICBsZXQgciA9IGIgKiBiIC0gNCAqIGEgKiBjO1xuICAgIHJldHVybiByIDwgMFxuICAgICAgICA/IFtdXG4gICAgICAgIDogciA8IGVwc1xuICAgICAgICAgICAgPyBbLWIgLyBkXVxuICAgICAgICAgICAgOiAoKHIgPSBNYXRoLnNxcnQocikpLCBbKC1iIC0gcikgLyBkLCAoLWIgKyByKSAvIGRdKTtcbn07XG5jb25zdCBzb2x2ZUN1YmljID0gKGEsIGIsIGMsIGQsIGVwcyA9IDFlLTkpID0+IHtcbiAgICBjb25zdCBhYSA9IGEgKiBhO1xuICAgIGNvbnN0IGJiID0gYiAqIGI7XG4gICAgY29uc3QgYmEzID0gYiAvICgzICogYSk7XG4gICAgY29uc3QgcCA9ICgzICogYSAqIGMgLSBiYikgLyAoMyAqIGFhKTtcbiAgICBjb25zdCBxID0gKDIgKiBiYiAqIGIgLSA5ICogYSAqIGIgKiBjICsgMjcgKiBhYSAqIGQpIC8gKDI3ICogYWEgKiBhKTtcbiAgICBpZiAoTWF0aC5hYnMocCkgPCBlcHMpIHtcbiAgICAgICAgcmV0dXJuIFtNYXRoLmNicnQoLXEpIC0gYmEzXTtcbiAgICB9XG4gICAgZWxzZSBpZiAoTWF0aC5hYnMocSkgPCBlcHMpIHtcbiAgICAgICAgcmV0dXJuIHAgPCAwXG4gICAgICAgICAgICA/IFstTWF0aC5zcXJ0KC1wKSAtIGJhMywgLWJhMywgTWF0aC5zcXJ0KC1wKSAtIGJhM11cbiAgICAgICAgICAgIDogWy1iYTNdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgZGVub20gPSAocSAqIHEpIC8gNCArIChwICogcCAqIHApIC8gMjc7XG4gICAgICAgIGlmIChNYXRoLmFicyhkZW5vbSkgPCBlcHMpIHtcbiAgICAgICAgICAgIHJldHVybiBbKC0xLjUgKiBxKSAvIHAgLSBiYTMsICgzICogcSkgLyBwIC0gYmEzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkZW5vbSA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHUgPSBNYXRoLmNicnQoLXEgLyAyIC0gTWF0aC5zcXJ0KGRlbm9tKSk7XG4gICAgICAgICAgICByZXR1cm4gW3UgLSBwIC8gKDMgKiB1KSAtIGJhM107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB1ID0gMiAqIE1hdGguc3FydCgtcCAvIDMpLCB0ID0gTWF0aC5hY29zKCgzICogcSkgLyBwIC8gdSkgLyAzLCBrID0gKDIgKiBNYXRoLlBJKSAvIDM7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHUgKiBNYXRoLmNvcyh0KSAtIGJhMyxcbiAgICAgICAgICAgICAgICB1ICogTWF0aC5jb3ModCAtIGspIC0gYmEzLFxuICAgICAgICAgICAgICAgIHUgKiBNYXRoLmNvcyh0IC0gMiAqIGspIC0gYmEzLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmNvbnN0IHN0ZXAgPSAoZWRnZSwgeCkgPT4gKHggPCBlZGdlID8gMCA6IDEpO1xuY29uc3Qgc21vb3RoU3RlcCA9IChlZGdlLCBlZGdlMiwgeCkgPT4ge1xuICAgIHggPSBjbGFtcDAxKCh4IC0gZWRnZSkgLyAoZWRnZTIgLSBlZGdlKSk7XG4gICAgcmV0dXJuICgzIC0gMiAqIHgpICogeCAqIHg7XG59O1xuY29uc3Qgc21vb3RoZXJTdGVwID0gKGVkZ2UsIGVkZ2UyLCB4KSA9PiB7XG4gICAgeCA9IGNsYW1wMDEoKHggLSBlZGdlKSAvIChlZGdlMiAtIGVkZ2UpKTtcbiAgICByZXR1cm4geCAqIHggKiB4ICogKHggKiAoeCAqIDYgLSAxNSkgKyAxMCk7XG59O1xuY29uc3QgZXhwU3RlcCA9IChrLCBuLCB4KSA9PiAxIC0gTWF0aC5leHAoLWsgKiBNYXRoLnBvdyh4LCBuKSk7XG5cbmV4cG9ydHMuREVHMlJBRCA9IERFRzJSQUQ7XG5leHBvcnRzLkVQUyA9IEVQUztcbmV4cG9ydHMuSEFMRl9QSSA9IEhBTEZfUEk7XG5leHBvcnRzLklOVl9IQUxGX1BJID0gSU5WX0hBTEZfUEk7XG5leHBvcnRzLklOVl9QSSA9IElOVl9QSTtcbmV4cG9ydHMuSU5WX1RBVSA9IElOVl9UQVU7XG5leHBvcnRzLlBISSA9IFBISTtcbmV4cG9ydHMuUEkgPSBQSTtcbmV4cG9ydHMuUVVBUlRFUl9QSSA9IFFVQVJURVJfUEk7XG5leHBvcnRzLlJBRDJERUcgPSBSQUQyREVHO1xuZXhwb3J0cy5TSVhUSCA9IFNJWFRIO1xuZXhwb3J0cy5TSVhUSF9QSSA9IFNJWFRIX1BJO1xuZXhwb3J0cy5TUVJUMiA9IFNRUlQyO1xuZXhwb3J0cy5TUVJUMl8yID0gU1FSVDJfMjtcbmV4cG9ydHMuU1FSVDJfMyA9IFNRUlQyXzM7XG5leHBvcnRzLlNRUlQzID0gU1FSVDM7XG5leHBvcnRzLlRBVSA9IFRBVTtcbmV4cG9ydHMuVEhJUkQgPSBUSElSRDtcbmV4cG9ydHMuVEhJUkRfUEkgPSBUSElSRF9QSTtcbmV4cG9ydHMuVFdPX1RISVJEID0gVFdPX1RISVJEO1xuZXhwb3J0cy5hYnNEaWZmID0gYWJzRGlmZjtcbmV4cG9ydHMuYWJzSW5uZXJBbmdsZSA9IGFic0lubmVyQW5nbGU7XG5leHBvcnRzLmFic01heCA9IGFic01heDtcbmV4cG9ydHMuYWJzTWluID0gYWJzTWluO1xuZXhwb3J0cy5hYnNUaGV0YSA9IGFic1RoZXRhO1xuZXhwb3J0cy5hZGRpMTYgPSBhZGRpMTY7XG5leHBvcnRzLmFkZGkzMiA9IGFkZGkzMjtcbmV4cG9ydHMuYWRkaTggPSBhZGRpODtcbmV4cG9ydHMuYWRkdTE2ID0gYWRkdTE2O1xuZXhwb3J0cy5hZGR1MzIgPSBhZGR1MzI7XG5leHBvcnRzLmFkZHU4ID0gYWRkdTg7XG5leHBvcnRzLmFuZGkxNiA9IGFuZGkxNjtcbmV4cG9ydHMuYW5kaTMyID0gYW5kaTMyO1xuZXhwb3J0cy5hbmRpOCA9IGFuZGk4O1xuZXhwb3J0cy5hbmR1MTYgPSBhbmR1MTY7XG5leHBvcnRzLmFuZHUzMiA9IGFuZHUzMjtcbmV4cG9ydHMuYW5kdTggPSBhbmR1ODtcbmV4cG9ydHMuYW5nbGVEaXN0ID0gYW5nbGVEaXN0O1xuZXhwb3J0cy5hdGFuMkFicyA9IGF0YW4yQWJzO1xuZXhwb3J0cy5ib3VuY2UgPSBib3VuY2U7XG5leHBvcnRzLmNlaWxUbyA9IGNlaWxUbztcbmV4cG9ydHMuY2lyY3VsYXIgPSBjaXJjdWxhcjtcbmV4cG9ydHMuY2xhbXAgPSBjbGFtcDtcbmV4cG9ydHMuY2xhbXAwID0gY2xhbXAwO1xuZXhwb3J0cy5jbGFtcDAxID0gY2xhbXAwMTtcbmV4cG9ydHMuY2xhbXAwNSA9IGNsYW1wMDU7XG5leHBvcnRzLmNsYW1wMTEgPSBjbGFtcDExO1xuZXhwb3J0cy5jbGFzc2lmeUNyb3NzaW5nID0gY2xhc3NpZnlDcm9zc2luZztcbmV4cG9ydHMuY29weXNpZ24gPSBjb3B5c2lnbjtcbmV4cG9ydHMuY29zaW5lID0gY29zaW5lO1xuZXhwb3J0cy5jb3NzaW4gPSBjb3NzaW47XG5leHBvcnRzLmNvdCA9IGNvdDtcbmV4cG9ydHMuY3NjID0gY3NjO1xuZXhwb3J0cy5jdWJpY1B1bHNlID0gY3ViaWNQdWxzZTtcbmV4cG9ydHMuZGVjaW1hdGVkID0gZGVjaW1hdGVkO1xuZXhwb3J0cy5kZWcgPSBkZWc7XG5leHBvcnRzLmRlcml2YXRpdmUgPSBkZXJpdmF0aXZlO1xuZXhwb3J0cy5kaXZpMTYgPSBkaXZpMTY7XG5leHBvcnRzLmRpdmkzMiA9IGRpdmkzMjtcbmV4cG9ydHMuZGl2aTggPSBkaXZpODtcbmV4cG9ydHMuZGl2dTE2ID0gZGl2dTE2O1xuZXhwb3J0cy5kaXZ1MzIgPSBkaXZ1MzI7XG5leHBvcnRzLmRpdnU4ID0gZGl2dTg7XG5leHBvcnRzLmVhc2UgPSBlYXNlO1xuZXhwb3J0cy5lcURlbHRhID0gZXFEZWx0YTtcbmV4cG9ydHMuZXFEZWx0YVNjYWxlZCA9IGVxRGVsdGFTY2FsZWQ7XG5leHBvcnRzLmV4cDIgPSBleHAyO1xuZXhwb3J0cy5leHBGYWN0b3IgPSBleHBGYWN0b3I7XG5leHBvcnRzLmV4cFN0ZXAgPSBleHBTdGVwO1xuZXhwb3J0cy5mYXN0Q29zID0gZmFzdENvcztcbmV4cG9ydHMuZmFzdFNpbiA9IGZhc3RTaW47XG5leHBvcnRzLmZkaW0gPSBmZGltO1xuZXhwb3J0cy5maXQgPSBmaXQ7XG5leHBvcnRzLmZpdDAxID0gZml0MDE7XG5leHBvcnRzLmZpdDEwID0gZml0MTA7XG5leHBvcnRzLmZpdDExID0gZml0MTE7XG5leHBvcnRzLmZpdENsYW1wZWQgPSBmaXRDbGFtcGVkO1xuZXhwb3J0cy5mbG9vclRvID0gZmxvb3JUbztcbmV4cG9ydHMuZm1hID0gZm1hO1xuZXhwb3J0cy5mbW9kID0gZm1vZDtcbmV4cG9ydHMuZm9sZGJhY2sgPSBmb2xkYmFjaztcbmV4cG9ydHMuZnJhY3QgPSBmcmFjdDtcbmV4cG9ydHMuZnJleHAgPSBmcmV4cDtcbmV4cG9ydHMuZ2FpbiA9IGdhaW47XG5leHBvcnRzLmdhdXNzaWFuID0gZ2F1c3NpYW47XG5leHBvcnRzLmltcHVsc2UgPSBpbXB1bHNlO1xuZXhwb3J0cy5pbk9wZW5SYW5nZSA9IGluT3BlblJhbmdlO1xuZXhwb3J0cy5pblJhbmdlID0gaW5SYW5nZTtcbmV4cG9ydHMuaW52Q2lyY3VsYXIgPSBpbnZDaXJjdWxhcjtcbmV4cG9ydHMuaXNDcm9zc092ZXIgPSBpc0Nyb3NzT3ZlcjtcbmV4cG9ydHMuaXNDcm9zc1VuZGVyID0gaXNDcm9zc1VuZGVyO1xuZXhwb3J0cy5pc01heGltYSA9IGlzTWF4aW1hO1xuZXhwb3J0cy5pc01pbmltYSA9IGlzTWluaW1hO1xuZXhwb3J0cy5sYW5jem9zID0gbGFuY3pvcztcbmV4cG9ydHMubGRleHAgPSBsZGV4cDtcbmV4cG9ydHMubGVucyA9IGxlbnM7XG5leHBvcnRzLmxvYyA9IGxvYztcbmV4cG9ydHMubHNoaWZ0aTE2ID0gbHNoaWZ0aTE2O1xuZXhwb3J0cy5sc2hpZnRpMzIgPSBsc2hpZnRpMzI7XG5leHBvcnRzLmxzaGlmdGk4ID0gbHNoaWZ0aTg7XG5leHBvcnRzLmxzaGlmdHUxNiA9IGxzaGlmdHUxNjtcbmV4cG9ydHMubHNoaWZ0dTMyID0gbHNoaWZ0dTMyO1xuZXhwb3J0cy5sc2hpZnR1OCA9IGxzaGlmdHU4O1xuZXhwb3J0cy5tYXgyaWQgPSBtYXgyaWQ7XG5leHBvcnRzLm1heDNpZCA9IG1heDNpZDtcbmV4cG9ydHMubWF4NGlkID0gbWF4NGlkO1xuZXhwb3J0cy5tYXhpbWFJbmRleCA9IG1heGltYUluZGV4O1xuZXhwb3J0cy5tYXhpbWFJbmRpY2VzID0gbWF4aW1hSW5kaWNlcztcbmV4cG9ydHMubWluMmlkID0gbWluMmlkO1xuZXhwb3J0cy5taW4zaWQgPSBtaW4zaWQ7XG5leHBvcnRzLm1pbjRpZCA9IG1pbjRpZDtcbmV4cG9ydHMubWluRXJyb3IgPSBtaW5FcnJvcjtcbmV4cG9ydHMubWluTm9uWmVybzIgPSBtaW5Ob25aZXJvMjtcbmV4cG9ydHMubWluTm9uWmVybzMgPSBtaW5Ob25aZXJvMztcbmV4cG9ydHMubWluaW1hSW5kZXggPSBtaW5pbWFJbmRleDtcbmV4cG9ydHMubWluaW1hSW5kaWNlcyA9IG1pbmltYUluZGljZXM7XG5leHBvcnRzLm1peCA9IG1peDtcbmV4cG9ydHMubWl4QmljdWJpYyA9IG1peEJpY3ViaWM7XG5leHBvcnRzLm1peEJpbGluZWFyID0gbWl4QmlsaW5lYXI7XG5leHBvcnRzLm1peEN1YmljID0gbWl4Q3ViaWM7XG5leHBvcnRzLm1peEN1YmljSGVybWl0ZSA9IG1peEN1YmljSGVybWl0ZTtcbmV4cG9ydHMubWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyA9IG1peEN1YmljSGVybWl0ZUZyb21Qb2ludHM7XG5leHBvcnRzLm1peEhlcm1pdGUgPSBtaXhIZXJtaXRlO1xuZXhwb3J0cy5taXhRdWFkcmF0aWMgPSBtaXhRdWFkcmF0aWM7XG5leHBvcnRzLm1vZCA9IG1vZDtcbmV4cG9ydHMubXVsaTE2ID0gbXVsaTE2O1xuZXhwb3J0cy5tdWxpMzIgPSBtdWxpMzI7XG5leHBvcnRzLm11bGk4ID0gbXVsaTg7XG5leHBvcnRzLm11bHUxNiA9IG11bHUxNjtcbmV4cG9ydHMubXVsdTMyID0gbXVsdTMyO1xuZXhwb3J0cy5tdWx1OCA9IG11bHU4O1xuZXhwb3J0cy5ub3JtID0gbm9ybTtcbmV4cG9ydHMubm9ybUNvcyA9IG5vcm1Db3M7XG5leHBvcnRzLm5vdGkxNiA9IG5vdGkxNjtcbmV4cG9ydHMubm90aTMyID0gbm90aTMyO1xuZXhwb3J0cy5ub3RpOCA9IG5vdGk4O1xuZXhwb3J0cy5ub3R1MTYgPSBub3R1MTY7XG5leHBvcnRzLm5vdHUzMiA9IG5vdHUzMjtcbmV4cG9ydHMubm90dTggPSBub3R1ODtcbmV4cG9ydHMub3JpMTYgPSBvcmkxNjtcbmV4cG9ydHMub3JpMzIgPSBvcmkzMjtcbmV4cG9ydHMub3JpOCA9IG9yaTg7XG5leHBvcnRzLm9ydTE2ID0gb3J1MTY7XG5leHBvcnRzLm9ydTMyID0gb3J1MzI7XG5leHBvcnRzLm9ydTggPSBvcnU4O1xuZXhwb3J0cy5wYXJhYm9sYSA9IHBhcmFib2xhO1xuZXhwb3J0cy5xdWFkcmFudCA9IHF1YWRyYW50O1xuZXhwb3J0cy5yYWQgPSByYWQ7XG5leHBvcnRzLnJlbWFpbmRlciA9IHJlbWFpbmRlcjtcbmV4cG9ydHMucm91bmRFcHMgPSByb3VuZEVwcztcbmV4cG9ydHMucm91bmRUbyA9IHJvdW5kVG87XG5leHBvcnRzLnJzaGlmdGkxNiA9IHJzaGlmdGkxNjtcbmV4cG9ydHMucnNoaWZ0aTMyID0gcnNoaWZ0aTMyO1xuZXhwb3J0cy5yc2hpZnRpOCA9IHJzaGlmdGk4O1xuZXhwb3J0cy5yc2hpZnR1MTYgPSByc2hpZnR1MTY7XG5leHBvcnRzLnJzaGlmdHUzMiA9IHJzaGlmdHUzMjtcbmV4cG9ydHMucnNoaWZ0dTggPSByc2hpZnR1ODtcbmV4cG9ydHMuc2FmZURpdiA9IHNhZmVEaXY7XG5leHBvcnRzLnNjaGxpY2sgPSBzY2hsaWNrO1xuZXhwb3J0cy5zY2xhbXAgPSBzY2xhbXA7XG5leHBvcnRzLnNlYyA9IHNlYztcbmV4cG9ydHMuc2lnbW9pZCA9IHNpZ21vaWQ7XG5leHBvcnRzLnNpZ21vaWQwMSA9IHNpZ21vaWQwMTtcbmV4cG9ydHMuc2lnbW9pZDExID0gc2lnbW9pZDExO1xuZXhwb3J0cy5zaWduID0gc2lnbjtcbmV4cG9ydHMuc2lnbkV4dGVuZDE2ID0gc2lnbkV4dGVuZDE2O1xuZXhwb3J0cy5zaWduRXh0ZW5kOCA9IHNpZ25FeHRlbmQ4O1xuZXhwb3J0cy5zaW1wbGlmeVJhdGlvID0gc2ltcGxpZnlSYXRpbztcbmV4cG9ydHMuc2luYyA9IHNpbmM7XG5leHBvcnRzLnNpbmNOb3JtYWxpemVkID0gc2luY05vcm1hbGl6ZWQ7XG5leHBvcnRzLnNpbmNvcyA9IHNpbmNvcztcbmV4cG9ydHMuc21heCA9IHNtYXg7XG5leHBvcnRzLnNtaW4gPSBzbWluO1xuZXhwb3J0cy5zbW9vdGhTdGVwID0gc21vb3RoU3RlcDtcbmV4cG9ydHMuc21vb3RoZXJTdGVwID0gc21vb3RoZXJTdGVwO1xuZXhwb3J0cy5zb2x2ZUN1YmljID0gc29sdmVDdWJpYztcbmV4cG9ydHMuc29sdmVMaW5lYXIgPSBzb2x2ZUxpbmVhcjtcbmV4cG9ydHMuc29sdmVRdWFkcmF0aWMgPSBzb2x2ZVF1YWRyYXRpYztcbmV4cG9ydHMuc3RlcCA9IHN0ZXA7XG5leHBvcnRzLnN1YmkxNiA9IHN1YmkxNjtcbmV4cG9ydHMuc3ViaTMyID0gc3ViaTMyO1xuZXhwb3J0cy5zdWJpOCA9IHN1Ymk4O1xuZXhwb3J0cy5zdWJ1MTYgPSBzdWJ1MTY7XG5leHBvcnRzLnN1YnUzMiA9IHN1YnUzMjtcbmV4cG9ydHMuc3VidTggPSBzdWJ1ODtcbmV4cG9ydHMudGFuZ2VudENhcmRpbmFsID0gdGFuZ2VudENhcmRpbmFsO1xuZXhwb3J0cy50YW5nZW50RGlmZjMgPSB0YW5nZW50RGlmZjM7XG5leHBvcnRzLnRydW5jID0gdHJ1bmM7XG5leHBvcnRzLnR3ZWVuID0gdHdlZW47XG5leHBvcnRzLndyYXAgPSB3cmFwO1xuZXhwb3J0cy53cmFwMDEgPSB3cmFwMDE7XG5leHBvcnRzLndyYXAxMSA9IHdyYXAxMTtcbmV4cG9ydHMud3JhcE9uY2UgPSB3cmFwT25jZTtcbmV4cG9ydHMueG9yaTE2ID0geG9yaTE2O1xuZXhwb3J0cy54b3JpMzIgPSB4b3JpMzI7XG5leHBvcnRzLnhvcmk4ID0geG9yaTg7XG5leHBvcnRzLnhvcnUxNiA9IHhvcnUxNjtcbmV4cG9ydHMueG9ydTMyID0geG9ydTMyO1xuZXhwb3J0cy54b3J1OCA9IHhvcnU4O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgY2hlY2tzID0gcmVxdWlyZSgnQHRoaS5uZy9jaGVja3MnKTtcbnZhciBhcGkgPSByZXF1aXJlKCdAdGhpLm5nL2FwaScpO1xudmFyIGhleCA9IHJlcXVpcmUoJ0B0aGkubmcvaGV4Jyk7XG5cbmNvbnN0IElOVl9NQVggPSAxIC8gMHhmZmZmZmZmZjtcbmNsYXNzIEFSYW5kb20ge1xuICAgIGZsb2F0KG5vcm0gPSAxKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludCgpICogSU5WX01BWCAqIG5vcm07XG4gICAgfVxuICAgIG5vcm0obm9ybSA9IDEpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmludCgpICogSU5WX01BWCAtIDAuNSkgKiAyICogbm9ybTtcbiAgICB9XG4gICAgbWlubWF4KG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZsb2F0KCkgKiAobWF4IC0gbWluKSArIG1pbjtcbiAgICB9XG59XG5cbmNvbnN0IHJhbmRvbSA9IE1hdGgucmFuZG9tO1xuY2xhc3MgU3lzdGVtUmFuZG9tIGV4dGVuZHMgQVJhbmRvbSB7XG4gICAgaW50KCkge1xuICAgICAgICByZXR1cm4gKHJhbmRvbSgpICogNDI5NDk2NzI5NikgID4+PiAwO1xuICAgIH1cbiAgICBmbG9hdChub3JtID0gMSkge1xuICAgICAgICByZXR1cm4gcmFuZG9tKCkgKiBub3JtO1xuICAgIH1cbiAgICBub3JtKG5vcm0gPSAxKSB7XG4gICAgICAgIHJldHVybiAocmFuZG9tKCkgLSAwLjUpICogMiAqIG5vcm07XG4gICAgfVxufVxuY29uc3QgU1lTVEVNID0gbmV3IFN5c3RlbVJhbmRvbSgpO1xuXG5jb25zdCByYW5kb21CeXRlc0Zyb20gPSAocm5kLCBidWYsIHN0YXJ0ID0gMCwgZW5kID0gYnVmLmxlbmd0aCkgPT4ge1xuICAgIGZvciAobGV0IGkgPSBlbmQ7IC0taSA+PSBzdGFydDspIHtcbiAgICAgICAgYnVmW2ldID0gcm5kLmludCgpICYgMHhmZjtcbiAgICB9XG4gICAgcmV0dXJuIGJ1Zjtcbn07XG5jb25zdCByYW5kb21CeXRlcyA9IGNoZWNrcy5oYXNDcnlwdG8oKVxuICAgID8gKGJ1Ziwgc3RhcnQgPSAwLCBlbmQgPSBidWYubGVuZ3RoKSA9PiAod2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMoYnVmLnN1YmFycmF5KHN0YXJ0LCBlbmQpKSwgYnVmKVxuICAgIDogKGJ1Ziwgc3RhcnQsIGVuZCkgPT4gcmFuZG9tQnl0ZXNGcm9tKFNZU1RFTSwgYnVmLCBzdGFydCwgZW5kKTtcblxuY2xhc3MgQ3J5cHRvIGV4dGVuZHMgQVJhbmRvbSB7XG4gICAgY29uc3RydWN0b3Ioc2l6ZSA9IDY0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoKHNpemUgKyAzKSAmIH4zKTtcbiAgICAgICAgdGhpcy51MzIgPSBuZXcgVWludDMyQXJyYXkodGhpcy5idWZmZXIuYnVmZmVyKTtcbiAgICAgICAgdGhpcy5pID0gc2l6ZSA+Pj4gMjtcbiAgICB9XG4gICAgY29weSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDcnlwdG8odGhpcy5idWZmZXIubGVuZ3RoKTtcbiAgICB9XG4gICAgYnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5idWZmZXIpO1xuICAgIH1cbiAgICBpbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmkgPj0gdGhpcy51MzIubGVuZ3RoKSB7XG4gICAgICAgICAgICByYW5kb21CeXRlcyh0aGlzLmJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLmkgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnUzMlt0aGlzLmkrK107XG4gICAgfVxufVxuY29uc3QgQ1JZUFRPID0gbmV3IENyeXB0bygpO1xuXG5jb25zdCBERUZBVUxUX1NFRURfMzIgPSAweGRlY2FmYmFkO1xuY29uc3QgREVGQVVMVF9TRUVEXzEyOCA9IFtcbiAgICAweGRlY2FmYmFkLFxuICAgIDB4MmZhOWQ3NWIsXG4gICAgMHhlNDFmNjdlMyxcbiAgICAweDVjODNlYzFhLFxuXTtcbmNvbnN0IERFRkFVTFRfU0VFRF8xNjAgPSBbLi4uREVGQVVMVF9TRUVEXzEyOCwgMHhmNjlhNWM3MV07XG5cbmNsYXNzIFNtdXNoMzIgZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBjb25zdHJ1Y3RvcihzZWVkID0gREVGQVVMVF9TRUVEXzMyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KFtzZWVkLCAwXSk7XG4gICAgfVxuICAgIGNvcHkoKSB7XG4gICAgICAgIGNvbnN0IGdlbiA9IG5ldyBTbXVzaDMyKCk7XG4gICAgICAgIGdlbi5idWZmZXIuc2V0KHRoaXMuYnVmZmVyKTtcbiAgICAgICAgcmV0dXJuIGdlbjtcbiAgICB9XG4gICAgc2VlZChzKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLnNldChbcywgMF0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaW50KCkge1xuICAgICAgICBjb25zdCBiID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGNvbnN0IG0gPSAweDViZDFlOTk1O1xuICAgICAgICBjb25zdCBrID0gKGJbMV0rKyAqIG0pID4+PiAwO1xuICAgICAgICBjb25zdCBzID0gKGJbMF0gPSAoKGsgXiAoayA+PiAyNCkgXiAoKGJbMF0gKiBtKSA+Pj4gMCkpICogbSkgPj4+IDApO1xuICAgICAgICByZXR1cm4gKHMgXiAocyA+Pj4gMTMpKSA+Pj4gMDtcbiAgICB9XG59XG5cbmNsYXNzIFhvc2hpcm8xMjggZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBjb25zdHJ1Y3RvcihzZWVkID0gREVGQVVMVF9TRUVEXzEyOCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSg0KTtcbiAgICAgICAgdGhpcy5zZWVkKHNlZWQpO1xuICAgIH1cbiAgICBjb3B5KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhvc2hpcm8xMjgodGhpcy5idWZmZXIpO1xuICAgIH1cbiAgICBieXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHRoaXMuYnVmZmVyLmJ1ZmZlcik7XG4gICAgfVxuICAgIHNlZWQoc2VlZCkge1xuICAgICAgICB0aGlzLmJ1ZmZlci5zZXQoc2VlZCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpbnQoKSB7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgbGV0IHQgPSBzWzBdICsgc1szXTtcbiAgICAgICAgY29uc3QgcmVzID0gKCh0IDw8IDcpIHwgKHQgPj4+IDI1KSkgPj4+IDA7XG4gICAgICAgIHQgPSBzWzFdIDw8IDk7XG4gICAgICAgIHNbMl0gXj0gc1swXTtcbiAgICAgICAgc1szXSBePSBzWzFdO1xuICAgICAgICBzWzFdIF49IHNbMl07XG4gICAgICAgIHNbMF0gXj0gc1szXTtcbiAgICAgICAgc1syXSBePSB0O1xuICAgICAgICB0ID0gc1szXTtcbiAgICAgICAgc1szXSA9ICgodCA8PCAxMSkgfCAodCA+Pj4gMjEpKSA+Pj4gMDtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG59XG5cbmNsYXNzIFhvclNoaWZ0MTI4IGV4dGVuZHMgQVJhbmRvbSB7XG4gICAgY29uc3RydWN0b3Ioc2VlZCA9IERFRkFVTFRfU0VFRF8xMjgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuc2VlZChzZWVkKTtcbiAgICB9XG4gICAgY29weSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBYb3JTaGlmdDEyOCh0aGlzLmJ1ZmZlcik7XG4gICAgfVxuICAgIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIuYnVmZmVyKTtcbiAgICB9XG4gICAgc2VlZChzZWVkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLnNldChzZWVkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGludCgpIHtcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBsZXQgdCA9IHNbM107XG4gICAgICAgIGxldCB3O1xuICAgICAgICB0IF49IHQgPDwgMTE7XG4gICAgICAgIHQgXj0gdCA+Pj4gODtcbiAgICAgICAgc1szXSA9IHNbMl07XG4gICAgICAgIHNbMl0gPSBzWzFdO1xuICAgICAgICB3ID0gc1sxXSA9IHNbMF07XG4gICAgICAgIHJldHVybiAoc1swXSA9ICh0IF4gdyBeICh3ID4+PiAxOSkpID4+PiAwKTtcbiAgICB9XG59XG5cbmNsYXNzIFhvcldvdyBleHRlbmRzIEFSYW5kb20ge1xuICAgIGNvbnN0cnVjdG9yKHNlZWQgPSBERUZBVUxUX1NFRURfMTYwKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KDUpO1xuICAgICAgICB0aGlzLnNlZWQoc2VlZCk7XG4gICAgfVxuICAgIGNvcHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWG9yV293KHRoaXMuYnVmZmVyKTtcbiAgICB9XG4gICAgc2VlZChzZWVkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLnNldChzZWVkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIuYnVmZmVyKTtcbiAgICB9XG4gICAgaW50KCkge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGxldCB0ID0gc1szXTtcbiAgICAgICAgbGV0IHc7XG4gICAgICAgIHQgXj0gdCA+Pj4gMjtcbiAgICAgICAgdCBePSB0IDw8IDE7XG4gICAgICAgIHNbM10gPSBzWzJdO1xuICAgICAgICBzWzJdID0gc1sxXTtcbiAgICAgICAgdyA9IHNbMV0gPSBzWzBdO1xuICAgICAgICB0IF49IHc7XG4gICAgICAgIHQgXj0gdyA8PCA0O1xuICAgICAgICBzWzBdID0gdDtcbiAgICAgICAgcmV0dXJuICh0ICsgKHNbNF0gKz0gMHg1ODdjNSkpID4+PiAwO1xuICAgIH1cbn1cblxuY2xhc3MgWHNBZGQgZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBjb25zdHJ1Y3RvcihzZWVkID0gREVGQVVMVF9TRUVEXzMyKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KDQpO1xuICAgICAgICB0aGlzLnNlZWQoc2VlZCk7XG4gICAgfVxuICAgIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIuYnVmZmVyKTtcbiAgICB9XG4gICAgY29weSgpIHtcbiAgICAgICAgY29uc3QgZ2VuID0gbmV3IFhzQWRkKCk7XG4gICAgICAgIGdlbi5idWZmZXIuc2V0KHRoaXMuYnVmZmVyKTtcbiAgICAgICAgcmV0dXJuIGdlbjtcbiAgICB9XG4gICAgc2VlZChzZWVkKSB7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgcy5zZXQoW3NlZWQsIDAsIDAsIDBdKTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGkgPSAxOyBpIDwgODsgaiA9IGkrKykge1xuICAgICAgICAgICAgbGV0IHggPSAoc1tqICYgM10gXiAoc1tqICYgM10gPj4+IDMwKSkgPj4+IDA7XG4gICAgICAgICAgICB4ID0gKDB4ODk2NSAqIHggKyAoKCgweDZjMDcgKiB4KSAmIDB4ZmZmZikgPDwgMTYpKSA+Pj4gMDtcbiAgICAgICAgICAgIHNbaSAmIDNdIF49IChpICsgeCkgPj4+IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGludCgpIHtcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBsZXQgdCA9IHNbMF07XG4gICAgICAgIHQgXj0gdCA8PCAxNTtcbiAgICAgICAgdCBePSB0ID4+PiAxODtcbiAgICAgICAgdCBePSBzWzNdIDw8IDExO1xuICAgICAgICBzWzBdID0gc1sxXTtcbiAgICAgICAgc1sxXSA9IHNbMl07XG4gICAgICAgIHNbMl0gPSBzWzNdO1xuICAgICAgICBzWzNdID0gdDtcbiAgICAgICAgcmV0dXJuICh0ICsgc1syXSkgPj4+IDA7XG4gICAgfVxufVxuXG5jb25zdCBjb2luID0gKHJuZCA9IFNZU1RFTSkgPT4gcm5kLmZsb2F0KCkgPCAwLjU7XG5jb25zdCBmYWlyQ29pbiA9IChybmQgPSBTWVNURU0pID0+IHtcbiAgICBsZXQgYSwgYjtcbiAgICBkbyB7XG4gICAgICAgIGEgPSBjb2luKHJuZCk7XG4gICAgICAgIGIgPSBjb2luKHJuZCk7XG4gICAgfSB3aGlsZSAoYSA9PT0gYik7XG4gICAgcmV0dXJuIGE7XG59O1xuXG5jb25zdCByYW5kb21JRCA9IChsZW4gPSA0LCBwcmVmaXggPSBcIlwiLCBzeW1zID0gXCJhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiLCBybmQgPSBTWVNURU0pID0+IHtcbiAgICBjb25zdCBuID0gc3ltcy5sZW5ndGg7XG4gICAgZm9yICg7IC0tbGVuID49IDA7KSB7XG4gICAgICAgIHByZWZpeCArPSBzeW1zW3JuZC5pbnQoKSAlIG5dO1xuICAgIH1cbiAgICByZXR1cm4gcHJlZml4O1xufTtcblxuY29uc3QgdW5pcXVlVmFsdWVzRnJvbSA9IChrLCBmbiwgZXhpc3RpbmcgPSBbXSwgbWF4VHJpYWxzID0gMTAwKSA9PiB7XG4gICAgbGV0IG4gPSAwO1xuICAgIHdoaWxlIChuIDwgaykge1xuICAgICAgICBsZXQgaTtcbiAgICAgICAgbGV0IHRyaWFscyA9IG1heFRyaWFscztcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaSA9IGZuKCk7XG4gICAgICAgIH0gd2hpbGUgKGV4aXN0aW5nLmluY2x1ZGVzKGkpICYmIC0tdHJpYWxzID4gMCk7XG4gICAgICAgIGlmICh0cmlhbHMgPD0gMClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBleGlzdGluZy5wdXNoKGkpO1xuICAgICAgICBuKys7XG4gICAgfVxuICAgIHJldHVybiBleGlzdGluZztcbn07XG5jb25zdCB1bmlxdWVJbmRpY2VzID0gKGssIG1heCwgZXhpc3RpbmcsIG1heFRyaWFscyA9IG1heCwgcm5kID0gU1lTVEVNKSA9PiB7XG4gICAgYXBpLmFzc2VydChrID49IDAgJiYgayA8PSBtYXgsIGBrIG11c3QgYmUgaW4gWzAsICR7bWF4fV0gaW50ZXJ2YWxgKTtcbiAgICByZXR1cm4gdW5pcXVlVmFsdWVzRnJvbShrLCAoKSA9PiBybmQuaW50KCkgJSBtYXgsIGV4aXN0aW5nLCBtYXhUcmlhbHMpO1xufTtcblxuY29uc3QgdXVpZHY0Qnl0ZXMgPSAoYnVmLCBybmQpID0+IHtcbiAgICBidWYgPSBidWYgfHwgbmV3IFVpbnQ4QXJyYXkoMTYpO1xuICAgIGJ1ZiA9IHJuZCA/IHJhbmRvbUJ5dGVzRnJvbShybmQsIGJ1ZikgOiByYW5kb21CeXRlcyhidWYpO1xuICAgIGJ1Zls2XSA9IDB4NDAgfCAoYnVmWzZdICYgMHgwZik7XG4gICAgYnVmWzhdID0gMHg4MCB8IChidWZbOF0gJiAweDNmKTtcbiAgICByZXR1cm4gYnVmO1xufTtcbmNvbnN0IHV1aWQgPSAoaWQsIGkgPSAwKSA9PiBoZXgudXVpZChpZCB8fCB1dWlkdjRCeXRlcygpLCBpKTtcblxuY29uc3Qgd2VpZ2h0ZWRSYW5kb20gPSAoY2hvaWNlcywgd2VpZ2h0cywgcm5kID0gU1lTVEVNKSA9PiB7XG4gICAgY29uc3QgbiA9IGNob2ljZXMubGVuZ3RoO1xuICAgIGFwaS5hc3NlcnQobiA+IDAsIFwibm8gY2hvaWNlcyBnaXZlblwiKTtcbiAgICBjb25zdCBvcHRzID0gd2VpZ2h0c1xuICAgICAgICA/IGNob2ljZXNcbiAgICAgICAgICAgIC5tYXAoKHgsIGkpID0+IFt3ZWlnaHRzW2ldIHx8IDAsIHhdKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGJbMF0gLSBhWzBdKVxuICAgICAgICA6IGNob2ljZXMubWFwKCh4KSA9PiBbMSwgeF0pO1xuICAgIGNvbnN0IHRvdGFsID0gb3B0cy5yZWR1Y2UoKGFjYywgbykgPT4gYWNjICsgb1swXSwgMCk7XG4gICAgdG90YWwgPD0gMCAmJiBjb25zb2xlLndhcm4oXCJ0b3RhbCB3ZWlnaHRzIDw9IDBcIik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJuZC5mbG9hdCh0b3RhbCk7XG4gICAgICAgIGxldCBzdW0gPSB0b3RhbDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHN1bSAtPSBvcHRzW2ldWzBdO1xuICAgICAgICAgICAgaWYgKHN1bSA8PSByKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHNbaV1bMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9O1xufTtcblxuY29uc3QgZXhwb25lbnRpYWwgPSAocm5kID0gU1lTVEVNLCBsYW1iZGEgPSAxMCkgPT4gbGFtYmRhID09PSAwID8gKCkgPT4gSW5maW5pdHkgOiAoKSA9PiAtTWF0aC5sb2coMSAtIHJuZC5mbG9hdCgxKSkgLyBsYW1iZGE7XG5cbmNvbnN0IGdhdXNzaWFuID0gKHJuZCA9IFNZU1RFTSwgbiA9IDI0LCBvZmZzZXQgPSAwLCBzY2FsZSA9IDEpID0+ICgpID0+IHtcbiAgICBsZXQgc3VtID0gMDtcbiAgICBsZXQgbSA9IG47XG4gICAgd2hpbGUgKG0tLSA+IDApXG4gICAgICAgIHN1bSArPSBybmQubm9ybShzY2FsZSk7XG4gICAgcmV0dXJuIHN1bSAvIG4gKyBvZmZzZXQ7XG59O1xuXG5jb25zdCBnZW9tZXRyaWMgPSAocm5kID0gU1lTVEVNLCBwID0gMC41KSA9PiBwIDw9IDBcbiAgICA/ICgpID0+IEluZmluaXR5XG4gICAgOiBwID49IDFcbiAgICAgICAgPyAoKSA9PiAxXG4gICAgICAgIDogKChwID0gTWF0aC5sb2coMSAtIHApKSxcbiAgICAgICAgICAgICgpID0+IE1hdGguZmxvb3IoTWF0aC5sb2coMSAtIHJuZC5mbG9hdCgxKSkgLyBwKSArIDEpO1xuXG5jb25zdCBub3JtYWwgPSAocm5kID0gU1lTVEVNLCBiaWFzID0gMCwgc2lnbWEgPSAxKSA9PiB7XG4gICAgbGV0IGE7XG4gICAgbGV0IGI7XG4gICAgbGV0IHI7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgYiA9IGE7XG4gICAgICAgICAgICBhID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBhID0gcm5kLm5vcm0oKTtcbiAgICAgICAgICAgICAgICBiID0gcm5kLm5vcm0oKTtcbiAgICAgICAgICAgICAgICByID0gYSAqIGEgKyBiICogYjtcbiAgICAgICAgICAgIH0gd2hpbGUgKHIgPiAxIHx8IHIgPT09IDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiaWFzICsgc2lnbWEgKiBiICogTWF0aC5zcXJ0KCgtMiAqIE1hdGgubG9nKHIpKSAvIHIpO1xuICAgIH07XG59O1xuXG5jb25zdCB1bmlmb3JtID0gKHJuZCA9IFNZU1RFTSwgbWluID0gMCwgbWF4ID0gMSkgPT4gKCkgPT4gcm5kLm1pbm1heChtaW4sIG1heCk7XG5cbmV4cG9ydHMuQVJhbmRvbSA9IEFSYW5kb207XG5leHBvcnRzLkNSWVBUTyA9IENSWVBUTztcbmV4cG9ydHMuQ3J5cHRvID0gQ3J5cHRvO1xuZXhwb3J0cy5TWVNURU0gPSBTWVNURU07XG5leHBvcnRzLlNtdXNoMzIgPSBTbXVzaDMyO1xuZXhwb3J0cy5TeXN0ZW1SYW5kb20gPSBTeXN0ZW1SYW5kb207XG5leHBvcnRzLlhvclNoaWZ0MTI4ID0gWG9yU2hpZnQxMjg7XG5leHBvcnRzLlhvcldvdyA9IFhvcldvdztcbmV4cG9ydHMuWG9zaGlybzEyOCA9IFhvc2hpcm8xMjg7XG5leHBvcnRzLlhzQWRkID0gWHNBZGQ7XG5leHBvcnRzLmNvaW4gPSBjb2luO1xuZXhwb3J0cy5leHBvbmVudGlhbCA9IGV4cG9uZW50aWFsO1xuZXhwb3J0cy5mYWlyQ29pbiA9IGZhaXJDb2luO1xuZXhwb3J0cy5nYXVzc2lhbiA9IGdhdXNzaWFuO1xuZXhwb3J0cy5nZW9tZXRyaWMgPSBnZW9tZXRyaWM7XG5leHBvcnRzLm5vcm1hbCA9IG5vcm1hbDtcbmV4cG9ydHMucmFuZG9tQnl0ZXMgPSByYW5kb21CeXRlcztcbmV4cG9ydHMucmFuZG9tQnl0ZXNGcm9tID0gcmFuZG9tQnl0ZXNGcm9tO1xuZXhwb3J0cy5yYW5kb21JRCA9IHJhbmRvbUlEO1xuZXhwb3J0cy51bmlmb3JtID0gdW5pZm9ybTtcbmV4cG9ydHMudW5pcXVlSW5kaWNlcyA9IHVuaXF1ZUluZGljZXM7XG5leHBvcnRzLnVuaXF1ZVZhbHVlc0Zyb20gPSB1bmlxdWVWYWx1ZXNGcm9tO1xuZXhwb3J0cy51dWlkID0gdXVpZDtcbmV4cG9ydHMudXVpZHY0Qnl0ZXMgPSB1dWlkdjRCeXRlcztcbmV4cG9ydHMud2VpZ2h0ZWRSYW5kb20gPSB3ZWlnaHRlZFJhbmRvbTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIHRyYW5zZHVjZXJzID0gcmVxdWlyZSgnQHRoaS5uZy90cmFuc2R1Y2VycycpO1xudmFyIGJpbmFyeSA9IHJlcXVpcmUoJ0B0aGkubmcvYmluYXJ5Jyk7XG52YXIgZXJyb3JzID0gcmVxdWlyZSgnQHRoaS5uZy9lcnJvcnMnKTtcbnZhciBjb21wb3NlID0gcmVxdWlyZSgnQHRoaS5uZy9jb21wb3NlJyk7XG52YXIgaGV4ID0gcmVxdWlyZSgnQHRoaS5uZy9oZXgnKTtcbnZhciByYW5kb20gPSByZXF1aXJlKCdAdGhpLm5nL3JhbmRvbScpO1xuXG5jb25zdCBCNjRfQ0hBUlMgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIjtcbmNvbnN0IEI2NF9TQUZFID0gQjY0X0NIQVJTLnN1YnN0cigwLCA2MikgKyBcIi1fXCI7XG5mdW5jdGlvbiBiYXNlNjREZWNvZGUoc3JjKSB7XG4gICAgcmV0dXJuIHNyY1xuICAgICAgICA/IHRyYW5zZHVjZXJzLml0ZXJhdG9yMShiYXNlNjREZWNvZGUoKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBsZXQgYmMgPSAwLCBicyA9IDA7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMuY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh4KSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gXCIrXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIl9cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBcIi9cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLnJlZHVjZWQoYWNjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IHkgPSBCNjRfQ0hBUlMuaW5kZXhPZih4KTtcbiAgICAgICAgICAgICAgICBicyA9IGJjICYgMyA/IChicyA8PCA2KSArIHkgOiB5O1xuICAgICAgICAgICAgICAgIGlmIChiYysrICYgMykge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByKGFjYywgMjU1ICYgKGJzID4+ICgoLTIgKiBiYykgJiA2KSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5mdW5jdGlvbiBiYXNlNjRFbmNvZGUoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSB0cmFuc2R1Y2Vycy4kaXRlcihiYXNlNjRFbmNvZGUsIGFyZ3MsIHRyYW5zZHVjZXJzLml0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gWy4uLml0ZXJdLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHJldHVybiAoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgIGxldCBzdGF0ZSA9IDA7XG4gICAgICAgIGxldCBiO1xuICAgICAgICBjb25zdCBvcHRzID0gT2JqZWN0LmFzc2lnbih7IHNhZmU6IGZhbHNlLCBidWZmZXI6IDEwMjQgfSwgYXJnc1swXSk7XG4gICAgICAgIGNvbnN0IGNoYXJzID0gb3B0cy5zYWZlID8gQjY0X1NBRkUgOiBCNjRfQ0hBUlM7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IFtdO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zi5wdXNoKGNoYXJzWyhiID4+IDE4KSAmIDB4M2ZdLCBjaGFyc1soYiA+PiAxMikgJiAweDNmXSwgXCI9XCIsIFwiPVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgICAgICBidWYucHVzaChjaGFyc1soYiA+PiAxOCkgJiAweDNmXSwgY2hhcnNbKGIgPj4gMTIpICYgMHgzZl0sIGNoYXJzWyhiID4+IDYpICYgMHgzZl0sIFwiPVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3aGlsZSAoYnVmLmxlbmd0aCAmJiAhdHJhbnNkdWNlcnMuaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBiID0geCA8PCAxNjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBiICs9IHggPDwgODtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYiArPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmLnB1c2goY2hhcnNbKGIgPj4gMTgpICYgMHgzZl0sIGNoYXJzWyhiID4+IDEyKSAmIDB4M2ZdLCBjaGFyc1soYiA+PiA2KSAmIDB4M2ZdLCBjaGFyc1tiICYgMHgzZl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1Zi5sZW5ndGggPj0gb3B0cy5idWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbiA9IGJ1Zi5sZW5ndGg7IGkgPCBuICYmICF0cmFuc2R1Y2Vycy5pc1JlZHVjZWQoYWNjKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1ZltpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zi5sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB1dGY4RGVjb2RlKHNyYykge1xuICAgIHJldHVybiBzcmNcbiAgICAgICAgPyBbLi4udHJhbnNkdWNlcnMuaXRlcmF0b3IxKHV0ZjhEZWNvZGUoKSwgc3JjKV0uam9pbihcIlwiKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBsZXQgc3RhdGUgPSAwO1xuICAgICAgICAgICAgbGV0IHUwO1xuICAgICAgICAgICAgbGV0IHUxO1xuICAgICAgICAgICAgbGV0IHUyO1xuICAgICAgICAgICAgbGV0IHUzO1xuICAgICAgICAgICAgbGV0IHU0O1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLmNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHggPCAweDgwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBTdHJpbmcuZnJvbUNoYXJDb2RlKHgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHUwID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICB1MSA9IHggJiAweDNmO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh1MCAmIDB4ZTApID09PSAweGMwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByKGFjYywgU3RyaW5nLmZyb21DaGFyQ29kZSgoKHUwICYgMHgxZikgPDwgNikgfCB1MSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHUyID0geCAmIDB4M2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHUwICYgMHhmMCkgPT09IDB4ZTApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBTdHJpbmcuZnJvbUNoYXJDb2RlKCgodTAgJiAweDBmKSA8PCAxMikgfCAodTEgPDwgNikgfCB1MikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHUzID0geCAmIDB4M2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHUwICYgMHhmOCkgPT09IDB4ZjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBjb2RlUG9pbnQoKCh1MCAmIDcpIDw8IDE4KSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MSA8PCAxMikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTIgPDwgNikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1MykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHU0ID0geCAmIDB4M2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHUwICYgMHhmYykgPT09IDB4ZjgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBjb2RlUG9pbnQoKCh1MCAmIDMpIDw8IDI0KSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MSA8PCAxOCkgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTIgPDwgMTIpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHUzIDw8IDYpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdTQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gNTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIGNvZGVQb2ludCgoKHUwICYgMSkgPDwgMzApIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTEgPDwgMjQpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTIgPDwgMTgpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTMgPDwgMTIpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTQgPDwgNikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh4ICYgMHgzZikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xufVxuZnVuY3Rpb24gdXRmOEVuY29kZShzcmMpIHtcbiAgICByZXR1cm4gc3JjICE9IG51bGxcbiAgICAgICAgPyB0cmFuc2R1Y2Vycy5pdGVyYXRvcih1dGY4RW5jb2RlKCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLmNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB1ID0geC5jaGFyQ29kZUF0KDApLCBidWY7XG4gICAgICAgICAgICAgICAgaWYgKHUgPj0gMHhkODAwICYmIHUgPD0gMHhkZmZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgKDB4MTAwMDAgKyAoKHUgJiAweDNmZikgPDwgMTApKSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHguY2hhckNvZGVBdCgxKSAmIDB4M2ZmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHUgPCAweDgwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByKGFjYywgdSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHUgPCAweDgwMCkge1xuICAgICAgICAgICAgICAgICAgICBidWYgPSBbMHhjMCB8ICh1ID4+IDYpLCAweDgwIHwgKHUgJiAweDNmKV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHUgPCAweDEwMDAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZiA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ZTAgfCAodSA+PiAxMiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDYpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKHUgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodSA8IDB4MjAwMDAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZiA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ZjAgfCAodSA+PiAxOCksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDEyKSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiA2KSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICh1ICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHUgPCAweDQwMDAwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgMHhmOCB8ICh1ID4+IDI0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gMTgpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDEyKSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiA2KSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICh1ICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBidWYgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAweGZjIHwgKHUgPj4gMzApLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiAyNCkgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gMTgpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDEyKSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiA2KSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICh1ICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBuID0gYnVmLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByKGFjYywgYnVmW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZHVjZXJzLmlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5jb25zdCBjb2RlUG9pbnQgPSAoeCkgPT4geCA8IDB4MTAwMDBcbiAgICA/IFN0cmluZy5mcm9tQ2hhckNvZGUoeClcbiAgICA6ICgoeCAtPSAweDEwMDAwKSxcbiAgICAgICAgU3RyaW5nLmZyb21DaGFyQ29kZSgweGQ4MDAgfCAoeCA+PiAxMCksIDB4ZGMwMCB8ICh4ICYgMHgzZmYpKSk7XG5jb25zdCB1dGY4TGVuZ3RoID0gKHN0cikgPT4ge1xuICAgIGNvbnN0IG4gPSBzdHIubGVuZ3RoO1xuICAgIGxldCBsZW4gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGxldCB1ID0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIGlmICh1ID49IDB4ZDgwMCAmJiB1IDw9IDB4ZGZmZikge1xuICAgICAgICAgICAgdSA9ICgweDEwMDAwICsgKCh1ICYgMHgzZmYpIDw8IDEwKSkgfCAoc3RyLmNoYXJDb2RlQXQoKytpKSAmIDB4M2ZmKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gKz1cbiAgICAgICAgICAgIHUgPD0gMHg3ZlxuICAgICAgICAgICAgICAgID8gMVxuICAgICAgICAgICAgICAgIDogdSA8PSAweDdmZlxuICAgICAgICAgICAgICAgICAgICA/IDJcbiAgICAgICAgICAgICAgICAgICAgOiB1IDw9IDB4ZmZmZlxuICAgICAgICAgICAgICAgICAgICAgICAgPyAzXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHUgPD0gMHgxZmZmZmZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHUgPD0gMHgzZmZmZmZmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gNVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDY7XG4gICAgfVxuICAgIHJldHVybiBsZW47XG59O1xuXG5jb25zdCBpOCA9ICh4KSA9PiBbXCJpOFwiLCB4XTtcbmNvbnN0IGk4YXJyYXkgPSAoeCkgPT4gW1wiaThhXCIsIHhdO1xuY29uc3QgdTggPSAoeCkgPT4gW1widThcIiwgeF07XG5jb25zdCB1OGFycmF5ID0gKHgpID0+IFtcInU4YVwiLCB4XTtcbmNvbnN0IGkxNiA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXCJpMTZcIiwgeCwgbGVdO1xuY29uc3QgaTE2YXJyYXkgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1xuICAgIFwiaTE2YVwiLFxuICAgIHgsXG4gICAgbGUsXG5dO1xuY29uc3QgdTE2ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcInUxNlwiLCB4LCBsZV07XG5jb25zdCB1MTZhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJ1MTZhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCBpMjQgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1wiaTI0XCIsIHgsIGxlXTtcbmNvbnN0IGkyNGFycmF5ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcbiAgICBcImkyNGFcIixcbiAgICB4LFxuICAgIGxlLFxuXTtcbmNvbnN0IHUyNCA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXCJ1MjRcIiwgeCwgbGVdO1xuY29uc3QgdTI0YXJyYXkgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1xuICAgIFwidTI0YVwiLFxuICAgIHgsXG4gICAgbGUsXG5dO1xuY29uc3QgaTMyID0gKHgsIGxlID0gZmFsc2UpID0+IFtcImkzMlwiLCB4LCBsZV07XG5jb25zdCBpMzJhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJpMzJhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCB1MzIgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1widTMyXCIsIHgsIGxlXTtcbmNvbnN0IHUzMmFycmF5ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcbiAgICBcInUzMmFcIixcbiAgICB4LFxuICAgIGxlLFxuXTtcbmNvbnN0IGYzMiA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXCJmMzJcIiwgeCwgbGVdO1xuY29uc3QgZjMyYXJyYXkgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1xuICAgIFwiZjMyYVwiLFxuICAgIHgsXG4gICAgbGUsXG5dO1xuY29uc3QgZjY0ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcImY2NFwiLCB4LCBsZV07XG5jb25zdCBmNjRhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJmNjRhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCBzdHIgPSAoeCkgPT4gW1wic3RyXCIsIHhdO1xuZnVuY3Rpb24gYXNCeXRlcyhzcmMpIHtcbiAgICByZXR1cm4gc3JjXG4gICAgICAgID8gdHJhbnNkdWNlcnMuaXRlcmF0b3IoYXNCeXRlcygpLCBzcmMpXG4gICAgICAgIDogdHJhbnNkdWNlcnMubWFwY2F0KCh4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB4WzFdO1xuICAgICAgICAgICAgY29uc3QgbGUgPSB4WzJdO1xuICAgICAgICAgICAgc3dpdGNoICh4WzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImk4XCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInU4XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbdmFsXTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaThhXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInU4YVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geFsxXTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaTE2XCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInUxNlwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5LmJ5dGVzMTYodmFsLCBsZSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImkxNmFcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidTE2YVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMubWFwY2F0KCh4KSA9PiBiaW5hcnkuYnl0ZXMxNih4LCBsZSksIHhbMV0pO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJpMjRcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidTI0XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnkuYnl0ZXMyNCh2YWwsIGxlKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaTI0YVwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1MjRhXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2R1Y2Vycy5tYXBjYXQoKHgpID0+IGJpbmFyeS5ieXRlczI0KHgsIGxlKSwgeFsxXSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImkzMlwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1MzJcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeS5ieXRlczMyKHZhbCwgbGUpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJpMzJhXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInUzMmFcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLm1hcGNhdCgoeCkgPT4gYmluYXJ5LmJ5dGVzMzIoeCwgbGUpLCB4WzFdKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZjMyXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnkuYnl0ZXNGMzIodmFsLCBsZSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImYzMmFcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLm1hcGNhdCgoeCkgPT4gYmluYXJ5LmJ5dGVzRjMyKHgsIGxlKSwgeFsxXSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImY2NFwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5LmJ5dGVzRjY0KHZhbCwgbGUpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJmNjRhXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2R1Y2Vycy5tYXBjYXQoKHgpID0+IGJpbmFyeS5ieXRlc0Y2NCh4LCBsZSksIHhbMV0pO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHV0ZjhFbmNvZGUoeFsxXSk7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLnVuc3VwcG9ydGVkKGBpbnZhbGlkIHN0cnVjdCBpdGVtOiAke3hbMF19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuZnVuY3Rpb24gYnl0ZXMoY2FwID0gMTAyNCwgc3JjKSB7XG4gICAgbGV0IHZpZXc7XG4gICAgbGV0IHBvcyA9IDA7XG4gICAgY29uc3QgZW5zdXJlID0gKGFjYywgc2l6ZSkgPT4ge1xuICAgICAgICBpZiAocG9zICsgc2l6ZSA8PSBjYXApXG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICBjYXAgKj0gMjtcbiAgICAgICAgY29uc3QgYnVmID0gbmV3IFVpbnQ4QXJyYXkoY2FwKTtcbiAgICAgICAgYnVmLnNldChhY2MpO1xuICAgICAgICB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1Zi5idWZmZXIpO1xuICAgICAgICByZXR1cm4gYnVmO1xuICAgIH07XG4gICAgY29uc3Qgc2V0QXJyYXkgPSAoZm4sIHN0cmlkZSwgYWNjLCB4LCBsZSkgPT4ge1xuICAgICAgICBjb25zdCBuID0geC5sZW5ndGg7XG4gICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIHN0cmlkZSAqIG4pO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKywgcG9zICs9IHN0cmlkZSkge1xuICAgICAgICAgICAgdmlld1tmbl0ocG9zLCB4W2ldLCBsZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9O1xuICAgIHJldHVybiBzcmNcbiAgICAgICAgPyB0cmFuc2R1Y2Vycy5yZWR1Y2UoYnl0ZXMoY2FwKSwgc3JjKVxuICAgICAgICA6IFtcbiAgICAgICAgICAgICgpID0+IG5ldyBVaW50OEFycmF5KGNhcCksXG4gICAgICAgICAgICAoYWNjKSA9PiBhY2Muc3ViYXJyYXkoMCwgcG9zKSxcbiAgICAgICAgICAgIChhY2MsIFt0eXBlLCB4LCBsZSA9IGZhbHNlXSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdmlldyB8fCB2aWV3LmJ1ZmZlciAhPT0gYWNjLmJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBjYXAgPSBhY2MuYnl0ZUxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgdmlldyA9IG5ldyBEYXRhVmlldyhhY2MuYnVmZmVyLCBhY2MuYnl0ZU9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaThcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRJbnQ4KHBvcywgeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaThhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB4Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIG4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEludDhBcnJheShhY2MuYnVmZmVyLCBhY2MuYnl0ZU9mZnNldCkuc2V0KHgsIHBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1OFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQ4KHBvcywgeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidThhXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB4Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIG4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjLnNldCh4LCBwb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IG47XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaTE2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0SW50MTYocG9zLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaTE2YVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gc2V0QXJyYXkoXCJzZXRJbnQxNlwiLCAyLCBhY2MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidTE2XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KHBvcywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInUxNmFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHNldEFycmF5KFwic2V0VWludDE2XCIsIDIsIGFjYywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpMjRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRJbnQzMihwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSAzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpMjRhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldEludDMyXCIsIDMsIGFjYywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1MjRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIocG9zLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gMztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidTI0YVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gc2V0QXJyYXkoXCJzZXRVaW50MzJcIiwgMywgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImkzMlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEludDMyKHBvcywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImkzMmFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHNldEFycmF5KFwic2V0SW50MzJcIiwgNCwgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInUzMlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMihwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1MzJhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldFVpbnQzMlwiLCA0LCBhY2MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZjMyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCA0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0RmxvYXQzMihwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmMzJhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldEZsb2F0MzJcIiwgNCwgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImY2NFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgOCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEZsb2F0NjQocG9zLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gODtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZjY0YVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gc2V0QXJyYXkoXCJzZXRGbG9hdDY0XCIsIDgsIGFjYywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzdHJcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHV0ZiA9IFsuLi51dGY4RW5jb2RlKHgpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIHV0Zi5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjLnNldCh1dGYsIHBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gdXRmLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xufVxuXG5mdW5jdGlvbiBiaXRzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKHRyYW5zZHVjZXJzLiRpdGVyKGJpdHMsIGFyZ3MsIHRyYW5zZHVjZXJzLml0ZXJhdG9yKSB8fFxuICAgICAgICAoKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVkdWNlID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3Qgc2l6ZSA9IGFyZ3NbMF0gfHwgODtcbiAgICAgICAgICAgIGNvbnN0IG1zYiA9IGFyZ3NbMV0gIT09IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLmNvbXBSKHJmbiwgbXNiXG4gICAgICAgICAgICAgICAgPyAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBzaXplOyAtLWkgPj0gMCAmJiAhdHJhbnNkdWNlcnMuaXNSZWR1Y2VkKGFjYyk7KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCAoeCA+Pj4gaSkgJiAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplICYmICF0cmFuc2R1Y2Vycy5pc1JlZHVjZWQoYWNjKTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCAoeCA+Pj4gaSkgJiAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGhleER1bXAoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSB0cmFuc2R1Y2Vycy4kaXRlcihoZXhEdW1wLCBhcmdzLCB0cmFuc2R1Y2Vycy5pdGVyYXRvcik7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IHsgY29scywgYWRkcmVzcyB9ID0gT2JqZWN0LmFzc2lnbih7IGNvbHM6IDE2LCBhZGRyZXNzOiAwIH0sIGFyZ3NbMF0pO1xuICAgIHJldHVybiB0cmFuc2R1Y2Vycy5jb21wKHRyYW5zZHVjZXJzLnBhZExhc3QoY29scywgMCksIHRyYW5zZHVjZXJzLm1hcChjb21wb3NlLmp1eHQoaGV4LlU4LCAoeCkgPT4gKHggPiAzMSAmJiB4IDwgMTI3ID8gU3RyaW5nLmZyb21DaGFyQ29kZSh4KSA6IFwiLlwiKSkpLCB0cmFuc2R1Y2Vycy5wYXJ0aXRpb24oY29scywgdHJ1ZSksIHRyYW5zZHVjZXJzLm1hcChjb21wb3NlLmp1eHQoKHgpID0+IHgubWFwKCh5KSA9PiB5WzBdKS5qb2luKFwiIFwiKSwgKHgpID0+IHgubWFwKCh5KSA9PiB5WzFdKS5qb2luKFwiXCIpKSksIHRyYW5zZHVjZXJzLm1hcEluZGV4ZWQoKGksIFtoLCBhXSkgPT4gYCR7aGV4LlUzMihhZGRyZXNzICsgaSAqIGNvbHMpfSB8ICR7aH0gfCAke2F9YCkpO1xufVxuY29uc3QgaGV4RHVtcFN0cmluZyA9IChvcHRzLCBzcmMpID0+IFsuLi5oZXhEdW1wKG9wdHMsIHNyYyldLmpvaW4oXCJcXG5cIik7XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbkJpdHMoLi4uYXJncykge1xuICAgIHJldHVybiAodHJhbnNkdWNlcnMuJGl0ZXIocGFydGl0aW9uQml0cywgYXJncywgdHJhbnNkdWNlcnMuaXRlcmF0b3IpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZXN0U2l6ZSA9IGFyZ3NbMF07XG4gICAgICAgICAgICBjb25zdCBzcmNTaXplID0gYXJnc1sxXSB8fCA4O1xuICAgICAgICAgICAgcmV0dXJuIGRlc3RTaXplIDwgc3JjU2l6ZVxuICAgICAgICAgICAgICAgID8gc21hbGwocmZuLCBkZXN0U2l6ZSwgc3JjU2l6ZSlcbiAgICAgICAgICAgICAgICA6IGRlc3RTaXplID4gc3JjU2l6ZVxuICAgICAgICAgICAgICAgICAgICA/IGxhcmdlKHJmbiwgZGVzdFNpemUsIHNyY1NpemUpXG4gICAgICAgICAgICAgICAgICAgIDogcmZuO1xuICAgICAgICB9KSk7XG59XG5jb25zdCBzbWFsbCA9IChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0sIG4sIHdvcmRTaXplKSA9PiB7XG4gICAgY29uc3QgbWF4YiA9IHdvcmRTaXplIC0gbjtcbiAgICBjb25zdCBtMSA9ICgxIDw8IHdvcmRTaXplKSAtIDE7XG4gICAgY29uc3QgbTIgPSAoMSA8PCBuKSAtIDE7XG4gICAgbGV0IHIgPSAwO1xuICAgIGxldCB5ID0gMDtcbiAgICByZXR1cm4gW1xuICAgICAgICBpbml0LFxuICAgICAgICAoYWNjKSA9PiBjb21wbGV0ZShyID4gMCA/IHJlZHVjZShhY2MsIHkpIDogYWNjKSxcbiAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgbGV0IGIgPSAwO1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIHkgKyAoKHggPj4+IChtYXhiICsgcikpICYgbTIpKTtcbiAgICAgICAgICAgICAgICBiICs9IG4gLSByO1xuICAgICAgICAgICAgICAgIHggPSAoeCA8PCAobiAtIHIpKSAmIG0xO1xuICAgICAgICAgICAgICAgIHkgPSAwO1xuICAgICAgICAgICAgICAgIHIgPSAwO1xuICAgICAgICAgICAgfSB3aGlsZSAoYiA8PSBtYXhiICYmICF0cmFuc2R1Y2Vycy5pc1JlZHVjZWQoYWNjKSk7XG4gICAgICAgICAgICByID0gd29yZFNpemUgLSBiO1xuICAgICAgICAgICAgeSA9IHIgPiAwID8gKHggPj4+IG1heGIpICYgbTIgOiAwO1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICBdO1xufTtcbmNvbnN0IGxhcmdlID0gKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSwgbiwgd29yZFNpemUpID0+IHtcbiAgICBjb25zdCBtMSA9ICgxIDw8IHdvcmRTaXplKSAtIDE7XG4gICAgbGV0IHIgPSAwO1xuICAgIGxldCB5ID0gMDtcbiAgICByZXR1cm4gW1xuICAgICAgICBpbml0LFxuICAgICAgICAoYWNjKSA9PiBjb21wbGV0ZShyID4gMCA/IHJlZHVjZShhY2MsIHkpIDogYWNjKSxcbiAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgaWYgKHIgKyB3b3JkU2l6ZSA8PSBuKSB7XG4gICAgICAgICAgICAgICAgeSB8PSAoeCAmIG0xKSA8PCAobiAtIHdvcmRTaXplIC0gcik7XG4gICAgICAgICAgICAgICAgciArPSB3b3JkU2l6ZTtcbiAgICAgICAgICAgICAgICBpZiAociA9PT0gbikge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCB5KTtcbiAgICAgICAgICAgICAgICAgICAgeSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHIgPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBuIC0gcjtcbiAgICAgICAgICAgICAgICByID0gd29yZFNpemUgLSBrO1xuICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIHkgfCAoKHggPj4+IHIpICYgKCgxIDw8IGspIC0gMSkpKTtcbiAgICAgICAgICAgICAgICB5ID0gKHggJiAoKDEgPDwgcikgLSAxKSkgPDwgKG4gLSByKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sXG4gICAgXTtcbn07XG5cbmNvbnN0IHJhbmRvbUJpdHMgPSAocHJvYiwgbnVtLCBybmQgPSByYW5kb20uU1lTVEVNKSA9PiB0cmFuc2R1Y2Vycy5yZXBlYXRlZGx5KCgpID0+IChybmQuZmxvYXQoKSA8IHByb2IgPyAxIDogMCksIG51bSk7XG5cbmV4cG9ydHMuYXNCeXRlcyA9IGFzQnl0ZXM7XG5leHBvcnRzLmJhc2U2NERlY29kZSA9IGJhc2U2NERlY29kZTtcbmV4cG9ydHMuYmFzZTY0RW5jb2RlID0gYmFzZTY0RW5jb2RlO1xuZXhwb3J0cy5iaXRzID0gYml0cztcbmV4cG9ydHMuYnl0ZXMgPSBieXRlcztcbmV4cG9ydHMuZjMyID0gZjMyO1xuZXhwb3J0cy5mMzJhcnJheSA9IGYzMmFycmF5O1xuZXhwb3J0cy5mNjQgPSBmNjQ7XG5leHBvcnRzLmY2NGFycmF5ID0gZjY0YXJyYXk7XG5leHBvcnRzLmhleER1bXAgPSBoZXhEdW1wO1xuZXhwb3J0cy5oZXhEdW1wU3RyaW5nID0gaGV4RHVtcFN0cmluZztcbmV4cG9ydHMuaTE2ID0gaTE2O1xuZXhwb3J0cy5pMTZhcnJheSA9IGkxNmFycmF5O1xuZXhwb3J0cy5pMjQgPSBpMjQ7XG5leHBvcnRzLmkyNGFycmF5ID0gaTI0YXJyYXk7XG5leHBvcnRzLmkzMiA9IGkzMjtcbmV4cG9ydHMuaTMyYXJyYXkgPSBpMzJhcnJheTtcbmV4cG9ydHMuaTggPSBpODtcbmV4cG9ydHMuaThhcnJheSA9IGk4YXJyYXk7XG5leHBvcnRzLnBhcnRpdGlvbkJpdHMgPSBwYXJ0aXRpb25CaXRzO1xuZXhwb3J0cy5yYW5kb21CaXRzID0gcmFuZG9tQml0cztcbmV4cG9ydHMuc3RyID0gc3RyO1xuZXhwb3J0cy51MTYgPSB1MTY7XG5leHBvcnRzLnUxNmFycmF5ID0gdTE2YXJyYXk7XG5leHBvcnRzLnUyNCA9IHUyNDtcbmV4cG9ydHMudTI0YXJyYXkgPSB1MjRhcnJheTtcbmV4cG9ydHMudTMyID0gdTMyO1xuZXhwb3J0cy51MzJhcnJheSA9IHUzMmFycmF5O1xuZXhwb3J0cy51OCA9IHU4O1xuZXhwb3J0cy51OGFycmF5ID0gdThhcnJheTtcbmV4cG9ydHMudXRmOERlY29kZSA9IHV0ZjhEZWNvZGU7XG5leHBvcnRzLnV0ZjhFbmNvZGUgPSB1dGY4RW5jb2RlO1xuZXhwb3J0cy51dGY4TGVuZ3RoID0gdXRmOExlbmd0aDtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIGFwaSA9IHJlcXVpcmUoJ0B0aGkubmcvYXBpJyk7XG52YXIgY2hlY2tzID0gcmVxdWlyZSgnQHRoaS5uZy9jaGVja3MnKTtcbnZhciBlcnJvcnMgPSByZXF1aXJlKCdAdGhpLm5nL2Vycm9ycycpO1xudmFyIGNvbXBvc2UgPSByZXF1aXJlKCdAdGhpLm5nL2NvbXBvc2UnKTtcbnZhciBjb21wYXJlID0gcmVxdWlyZSgnQHRoaS5uZy9jb21wYXJlJyk7XG52YXIgbWF0aCA9IHJlcXVpcmUoJ0B0aGkubmcvbWF0aCcpO1xudmFyIGFycmF5cyA9IHJlcXVpcmUoJ0B0aGkubmcvYXJyYXlzJyk7XG52YXIgcmFuZG9tID0gcmVxdWlyZSgnQHRoaS5uZy9yYW5kb20nKTtcblxuY29uc3QgZW5zdXJlVHJhbnNkdWNlciA9ICh4KSA9PiBjaGVja3MuaW1wbGVtZW50c0Z1bmN0aW9uKHgsIFwieGZvcm1cIikgPyB4Lnhmb3JtKCkgOiB4O1xuXG5jbGFzcyBSZWR1Y2VkIHtcbiAgICBjb25zdHJ1Y3Rvcih2YWwpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbDtcbiAgICB9XG4gICAgZGVyZWYoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICAgIH1cbn1cbmNvbnN0IHJlZHVjZWQgPSAoeCkgPT4gbmV3IFJlZHVjZWQoeCk7XG5jb25zdCBpc1JlZHVjZWQgPSAoeCkgPT4geCBpbnN0YW5jZW9mIFJlZHVjZWQ7XG5jb25zdCBlbnN1cmVSZWR1Y2VkID0gKHgpID0+IHggaW5zdGFuY2VvZiBSZWR1Y2VkID8geCA6IG5ldyBSZWR1Y2VkKHgpO1xuY29uc3QgdW5yZWR1Y2VkID0gKHgpID0+ICh4IGluc3RhbmNlb2YgUmVkdWNlZCA/IHguZGVyZWYoKSA6IHgpO1xuXG5jb25zdCBwYXJzZUFyZ3MgPSAoYXJncykgPT4gYXJncy5sZW5ndGggPT09IDJcbiAgICA/IFt1bmRlZmluZWQsIGFyZ3NbMV1dXG4gICAgOiBhcmdzLmxlbmd0aCA9PT0gM1xuICAgICAgICA/IFthcmdzWzFdLCBhcmdzWzJdXVxuICAgICAgICA6IGVycm9ycy5pbGxlZ2FsQXJpdHkoYXJncy5sZW5ndGgpO1xuZnVuY3Rpb24gcmVkdWNlKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZm4gPSBhcmdzWzBdO1xuICAgIGNvbnN0IGluaXQgPSByZm5bMF07XG4gICAgY29uc3QgY29tcGxldGUgPSByZm5bMV07XG4gICAgY29uc3QgcmVkdWNlID0gcmZuWzJdO1xuICAgIGFyZ3MgPSBwYXJzZUFyZ3MoYXJncyk7XG4gICAgY29uc3QgYWNjID0gYXJnc1swXSA9PSBudWxsID8gaW5pdCgpIDogYXJnc1swXTtcbiAgICBjb25zdCB4cyA9IGFyZ3NbMV07XG4gICAgcmV0dXJuIHVucmVkdWNlZChjb21wbGV0ZShjaGVja3MuaW1wbGVtZW50c0Z1bmN0aW9uKHhzLCBcIiRyZWR1Y2VcIilcbiAgICAgICAgPyB4cy4kcmVkdWNlKHJlZHVjZSwgYWNjKVxuICAgICAgICA6IGNoZWNrcy5pc0FycmF5TGlrZSh4cylcbiAgICAgICAgICAgID8gcmVkdWNlQXJyYXkocmVkdWNlLCBhY2MsIHhzKVxuICAgICAgICAgICAgOiByZWR1Y2VJdGVyYWJsZShyZWR1Y2UsIGFjYywgeHMpKSk7XG59XG5mdW5jdGlvbiByZWR1Y2VSaWdodCguLi5hcmdzKSB7XG4gICAgY29uc3QgcmZuID0gYXJnc1swXTtcbiAgICBjb25zdCBpbml0ID0gcmZuWzBdO1xuICAgIGNvbnN0IGNvbXBsZXRlID0gcmZuWzFdO1xuICAgIGNvbnN0IHJlZHVjZSA9IHJmblsyXTtcbiAgICBhcmdzID0gcGFyc2VBcmdzKGFyZ3MpO1xuICAgIGxldCBhY2MgPSBhcmdzWzBdID09IG51bGwgPyBpbml0KCkgOiBhcmdzWzBdO1xuICAgIGNvbnN0IHhzID0gYXJnc1sxXTtcbiAgICBmb3IgKGxldCBpID0geHMubGVuZ3RoOyAtLWkgPj0gMDspIHtcbiAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgeHNbaV0pO1xuICAgICAgICBpZiAoaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgIGFjYyA9IGFjYy5kZXJlZigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVucmVkdWNlZChjb21wbGV0ZShhY2MpKTtcbn1cbmNvbnN0IHJlZHVjZUFycmF5ID0gKHJmbiwgYWNjLCB4cykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwLCBuID0geHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGFjYyA9IHJmbihhY2MsIHhzW2ldKTtcbiAgICAgICAgaWYgKGlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICBhY2MgPSBhY2MuZGVyZWYoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59O1xuY29uc3QgcmVkdWNlSXRlcmFibGUgPSAocmZuLCBhY2MsIHhzKSA9PiB7XG4gICAgZm9yIChsZXQgeCBvZiB4cykge1xuICAgICAgICBhY2MgPSByZm4oYWNjLCB4KTtcbiAgICAgICAgaWYgKGlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICBhY2MgPSBhY2MuZGVyZWYoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY2M7XG59O1xuY29uc3QgcmVkdWNlciA9IChpbml0LCByZm4pID0+IFtpbml0LCAoYWNjKSA9PiBhY2MsIHJmbl07XG5jb25zdCAkJHJlZHVjZSA9IChyZm4sIGFyZ3MpID0+IHtcbiAgICBjb25zdCBuID0gYXJncy5sZW5ndGggLSAxO1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShhcmdzW25dKVxuICAgICAgICA/IGFyZ3MubGVuZ3RoID4gMVxuICAgICAgICAgICAgPyByZWR1Y2UocmZuLmFwcGx5KG51bGwsIGFyZ3Muc2xpY2UoMCwgbikpLCBhcmdzW25dKVxuICAgICAgICAgICAgOiByZWR1Y2UocmZuKCksIGFyZ3NbMF0pXG4gICAgICAgIDogdW5kZWZpbmVkO1xufTtcblxuZnVuY3Rpb24gcHVzaCh4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IFsuLi54c11cbiAgICAgICAgOiByZWR1Y2VyKCgpID0+IFtdLCAoYWNjLCB4KSA9PiAoYWNjLnB1c2goeCksIGFjYykpO1xufVxuXG5mdW5jdGlvbiogaXRlcmF0b3IoeGZvcm0sIHhzKSB7XG4gICAgY29uc3QgcmZuID0gZW5zdXJlVHJhbnNkdWNlcih4Zm9ybSkocHVzaCgpKTtcbiAgICBjb25zdCBjb21wbGV0ZSA9IHJmblsxXTtcbiAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgZm9yIChsZXQgeCBvZiB4cykge1xuICAgICAgICBjb25zdCB5ID0gcmVkdWNlKFtdLCB4KTtcbiAgICAgICAgaWYgKGlzUmVkdWNlZCh5KSkge1xuICAgICAgICAgICAgeWllbGQqIHVucmVkdWNlZChjb21wbGV0ZSh5LmRlcmVmKCkpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHlpZWxkKiB5O1xuICAgICAgICB9XG4gICAgfVxuICAgIHlpZWxkKiB1bnJlZHVjZWQoY29tcGxldGUoW10pKTtcbn1cbmZ1bmN0aW9uKiBpdGVyYXRvcjEoeGZvcm0sIHhzKSB7XG4gICAgY29uc3QgcmVkdWNlID0gKGVuc3VyZVRyYW5zZHVjZXIoeGZvcm0pKFthcGkuTk9fT1AsIGFwaS5OT19PUCwgKF8sIHgpID0+IHhdKSlbMl07XG4gICAgZm9yIChsZXQgeCBvZiB4cykge1xuICAgICAgICBsZXQgeSA9IHJlZHVjZShhcGkuU0VNQVBIT1JFLCB4KTtcbiAgICAgICAgaWYgKGlzUmVkdWNlZCh5KSkge1xuICAgICAgICAgICAgeSA9IHVucmVkdWNlZCh5LmRlcmVmKCkpO1xuICAgICAgICAgICAgaWYgKHkgIT09IGFwaS5TRU1BUEhPUkUpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCB5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5ICE9PSBhcGkuU0VNQVBIT1JFKSB7XG4gICAgICAgICAgICB5aWVsZCB5O1xuICAgICAgICB9XG4gICAgfVxufVxuY29uc3QgJGl0ZXIgPSAoeGZvcm0sIGFyZ3MsIGltcGwgPSBpdGVyYXRvcjEpID0+IHtcbiAgICBjb25zdCBuID0gYXJncy5sZW5ndGggLSAxO1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShhcmdzW25dKVxuICAgICAgICA/IGFyZ3MubGVuZ3RoID4gMVxuICAgICAgICAgICAgPyBpbXBsKHhmb3JtLmFwcGx5KG51bGwsIGFyZ3Muc2xpY2UoMCwgbikpLCBhcmdzW25dKVxuICAgICAgICAgICAgOiBpbXBsKHhmb3JtKCksIGFyZ3NbMF0pXG4gICAgICAgIDogdW5kZWZpbmVkO1xufTtcblxuY29uc3QgY29tcFIgPSAocmZuLCBmbikgPT4gW3JmblswXSwgcmZuWzFdLCBmbl07XG5cbmZ1bmN0aW9uIG1hcChmbiwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEobWFwKGZuKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiByKGFjYywgZm4oeCkpKTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gdHJhbnNkdWNlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gJHRyYW5zZHVjZSh0cmFuc2R1Y2UsIHJlZHVjZSwgYXJncyk7XG59XG5mdW5jdGlvbiB0cmFuc2R1Y2VSaWdodCguLi5hcmdzKSB7XG4gICAgcmV0dXJuICR0cmFuc2R1Y2UodHJhbnNkdWNlUmlnaHQsIHJlZHVjZVJpZ2h0LCBhcmdzKTtcbn1cbmNvbnN0ICR0cmFuc2R1Y2UgPSAodGZuLCByZm4sIGFyZ3MpID0+IHtcbiAgICBsZXQgYWNjLCB4cztcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHhzID0gYXJnc1szXTtcbiAgICAgICAgICAgIGFjYyA9IGFyZ3NbMl07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgeHMgPSBhcmdzWzJdO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiBtYXAoKHgpID0+IHRmbihhcmdzWzBdLCBhcmdzWzFdLCB4KSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBlcnJvcnMuaWxsZWdhbEFyaXR5KGFyZ3MubGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIHJmbihlbnN1cmVUcmFuc2R1Y2VyKGFyZ3NbMF0pKGFyZ3NbMV0pLCBhY2MsIHhzKTtcbn07XG5cbmNvbnN0IE5PX09QX1JFRFVDRVIgPSBbYXBpLk5PX09QLCBhcGkuTk9fT1AsIGFwaS5OT19PUF07XG5mdW5jdGlvbiBydW4odHgsIC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdHJhbnNkdWNlKHR4LCBOT19PUF9SRURVQ0VSLCBhcmdzWzBdKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGZ4ID0gYXJnc1swXTtcbiAgICAgICAgdHJhbnNkdWNlKHR4LCBbYXBpLk5PX09QLCBhcGkuTk9fT1AsIChfLCB4KSA9PiBmeCh4KV0sIGFyZ3NbMV0pO1xuICAgIH1cbn1cblxuY29uc3Qgc3RlcCA9ICh0eCkgPT4ge1xuICAgIGNvbnN0IHsgMTogY29tcGxldGUsIDI6IHJlZHVjZSB9ID0gZW5zdXJlVHJhbnNkdWNlcih0eCkocHVzaCgpKTtcbiAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICBpZiAoIWRvbmUpIHtcbiAgICAgICAgICAgIGxldCBhY2MgPSByZWR1Y2UoW10sIHgpO1xuICAgICAgICAgICAgZG9uZSA9IGlzUmVkdWNlZChhY2MpO1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICBhY2MgPSBjb21wbGV0ZShhY2MuZGVyZWYoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjLmxlbmd0aCA9PT0gMSA/IGFjY1swXSA6IGFjYy5sZW5ndGggPiAwID8gYWNjIDogdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbmNvbnN0IF9fbWF0aG9wID0gKHJmbiwgZm4sIGluaXREZWZhdWx0LCBhcmdzKSA9PiB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2UocmZuLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3QgaW5pdCA9IGFyZ3NbMF0gfHwgaW5pdERlZmF1bHQ7XG4gICAgcmV0dXJuIHJlZHVjZXIoKCkgPT4gaW5pdCwgZm4pO1xufTtcblxuZnVuY3Rpb24gYWRkKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gX19tYXRob3AoYWRkLCAoYWNjLCB4KSA9PiBhY2MgKyB4LCAwLCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gYXNzb2NNYXAoeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UoYXNzb2NNYXAoKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiBuZXcgTWFwKCksIChhY2MsIFtrLCB2XSkgPT4gYWNjLnNldChrLCB2KSk7XG59XG5cbmZ1bmN0aW9uIGFzc29jT2JqKHhzKSB7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gcmVkdWNlKGFzc29jT2JqKCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gKHt9KSwgKGFjYywgW2ssIHZdKSA9PiAoKGFjY1trXSA9IHYpLCBhY2MpKTtcbn1cblxuZnVuY3Rpb24gYXV0b09iaihwcmVmaXgsIHhzKSB7XG4gICAgbGV0IGlkID0gMDtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UoYXV0b09iaihwcmVmaXgpLCB4cylcbiAgICAgICAgOiByZWR1Y2VyKCgpID0+ICh7fSksIChhY2MsIHYpID0+ICgoYWNjW3ByZWZpeCArIGlkKytdID0gdiksIGFjYykpO1xufVxuXG5mdW5jdGlvbiBjb25qKHhzKSB7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gcmVkdWNlKGNvbmooKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiBuZXcgU2V0KCksIChhY2MsIHgpID0+IGFjYy5hZGQoeCkpO1xufVxuXG5mdW5jdGlvbiBjb3VudCguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2UoY291bnQsIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBsZXQgb2Zmc2V0ID0gYXJnc1swXSB8fCAwO1xuICAgIGxldCBzdGVwID0gYXJnc1sxXSB8fCAxO1xuICAgIHJldHVybiByZWR1Y2VyKCgpID0+IG9mZnNldCwgKGFjYywgXykgPT4gYWNjICsgc3RlcCk7XG59XG5cbmZ1bmN0aW9uIGRpdihpbml0LCB4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShkaXYoaW5pdCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gaW5pdCwgKGFjYywgeCkgPT4gYWNjIC8geCk7XG59XG5cbmZ1bmN0aW9uIGV2ZXJ5KC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShldmVyeSwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IHByZWQgPSBhcmdzWzBdO1xuICAgIHJldHVybiByZWR1Y2VyKCgpID0+IHRydWUsIHByZWRcbiAgICAgICAgPyAoYWNjLCB4KSA9PiAocHJlZCh4KSA/IGFjYyA6IHJlZHVjZWQoZmFsc2UpKVxuICAgICAgICA6IChhY2MsIHgpID0+ICh4ID8gYWNjIDogcmVkdWNlZChmYWxzZSkpKTtcbn1cblxuZnVuY3Rpb24gZmlsbCguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2UoZmlsbCwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGxldCBzdGFydCA9IGFyZ3NbMF0gfHwgMDtcbiAgICByZXR1cm4gcmVkdWNlcigoKSA9PiBbXSwgKGFjYywgeCkgPT4gKChhY2Nbc3RhcnQrK10gPSB4KSwgYWNjKSk7XG59XG5mdW5jdGlvbiBmaWxsTiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIGZpbGwoLi4uYXJncyk7XG59XG5cbmNvbnN0IF9fZ3JvdXBCeU9wdHMgPSAob3B0cykgPT4gKE9iamVjdC5hc3NpZ24oeyBrZXk6IGNvbXBvc2UuaWRlbnRpdHksIGdyb3VwOiBwdXNoKCkgfSwgb3B0cykpO1xuXG5mdW5jdGlvbiBncm91cEJ5TWFwKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShncm91cEJ5TWFwLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3Qgb3B0cyA9IF9fZ3JvdXBCeU9wdHMoYXJnc1swXSk7XG4gICAgY29uc3QgW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdID0gb3B0cy5ncm91cDtcbiAgICByZXR1cm4gW1xuICAgICAgICAoKSA9PiBuZXcgTWFwKCksXG4gICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGsgb2YgYWNjLmtleXMoKSkge1xuICAgICAgICAgICAgICAgIGFjYy5zZXQoaywgY29tcGxldGUoYWNjLmdldChrKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgayA9IG9wdHMua2V5KHgpO1xuICAgICAgICAgICAgcmV0dXJuIGFjYy5zZXQoaywgYWNjLmhhcyhrKVxuICAgICAgICAgICAgICAgID8gcmVkdWNlKGFjYy5nZXQoayksIHgpXG4gICAgICAgICAgICAgICAgOiByZWR1Y2UoaW5pdCgpLCB4KSk7XG4gICAgICAgIH0sXG4gICAgXTtcbn1cblxuZnVuY3Rpb24gZnJlcXVlbmNpZXMoLi4uYXJncykge1xuICAgIHJldHVybiAoJCRyZWR1Y2UoZnJlcXVlbmNpZXMsIGFyZ3MpIHx8XG4gICAgICAgIGdyb3VwQnlNYXAoeyBrZXk6IGFyZ3NbMF0gfHwgY29tcG9zZS5pZGVudGl0eSwgZ3JvdXA6IGNvdW50KCkgfSkpO1xufVxuXG5mdW5jdGlvbiBncm91cEJ5T2JqKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShncm91cEJ5T2JqLCBhcmdzKTtcbiAgICBpZiAocmVzKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IG9wdHMgPSBfX2dyb3VwQnlPcHRzKGFyZ3NbMF0pO1xuICAgIGNvbnN0IFtfaW5pdCwgY29tcGxldGUsIF9yZWR1Y2VdID0gb3B0cy5ncm91cDtcbiAgICByZXR1cm4gW1xuICAgICAgICAoKSA9PiAoe30pLFxuICAgICAgICAoYWNjKSA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBrIGluIGFjYykge1xuICAgICAgICAgICAgICAgIGFjY1trXSA9IGNvbXBsZXRlKGFjY1trXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LFxuICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrID0gb3B0cy5rZXkoeCk7XG4gICAgICAgICAgICBhY2Nba10gPSBhY2Nba11cbiAgICAgICAgICAgICAgICA/IF9yZWR1Y2UoYWNjW2tdLCB4KVxuICAgICAgICAgICAgICAgIDogX3JlZHVjZShfaW5pdCgpLCB4KTtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sXG4gICAgXTtcbn1cblxuY29uc3QgYnJhbmNoUHJlZCA9IChrZXksIGIsIGwsIHIpID0+ICh4KSA9PiAoa2V5KHgpICYgYiA/IHIgOiBsKTtcbmNvbnN0IGdyb3VwQmluYXJ5ID0gKGJpdHMsIGtleSwgYnJhbmNoLCBsZWFmLCBsZWZ0ID0gXCJsXCIsIHJpZ2h0ID0gXCJyXCIpID0+IHtcbiAgICBjb25zdCBpbml0ID0gYnJhbmNoIHx8ICgoKSA9PiAoe30pKTtcbiAgICBsZXQgcmZuID0gZ3JvdXBCeU9iaih7XG4gICAgICAgIGtleTogYnJhbmNoUHJlZChrZXksIDEsIGxlZnQsIHJpZ2h0KSxcbiAgICAgICAgZ3JvdXA6IGxlYWYgfHwgcHVzaCgpLFxuICAgIH0pO1xuICAgIGZvciAobGV0IGkgPSAyLCBtYXhJbmRleCA9IDEgPDwgYml0czsgaSA8IG1heEluZGV4OyBpIDw8PSAxKSB7XG4gICAgICAgIHJmbiA9IGdyb3VwQnlPYmooe1xuICAgICAgICAgICAga2V5OiBicmFuY2hQcmVkKGtleSwgaSwgbGVmdCwgcmlnaHQpLFxuICAgICAgICAgICAgZ3JvdXA6IFtpbml0LCByZm5bMV0sIHJmblsyXV0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gW2luaXQsIHJmblsxXSwgcmZuWzJdXTtcbn07XG5cbmZ1bmN0aW9uIGxhc3QoeHMpIHtcbiAgICByZXR1cm4geHMgPyByZWR1Y2UobGFzdCgpLCB4cykgOiByZWR1Y2VyKGFwaS5OT19PUCwgKF8sIHgpID0+IHgpO1xufVxuXG5mdW5jdGlvbiBtYXgoeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UobWF4KCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gLUluZmluaXR5LCAoYWNjLCB4KSA9PiBNYXRoLm1heChhY2MsIHgpKTtcbn1cblxuZnVuY3Rpb24gbWF4Q29tcGFyZSguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2UobWF4Q29tcGFyZSwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IGluaXQgPSBhcmdzWzBdO1xuICAgIGNvbnN0IGNtcCA9IGFyZ3NbMV0gfHwgY29tcGFyZS5jb21wYXJlO1xuICAgIHJldHVybiByZWR1Y2VyKGluaXQsIChhY2MsIHgpID0+IChjbXAoYWNjLCB4KSA+PSAwID8gYWNjIDogeCkpO1xufVxuXG5mdW5jdGlvbiBtYXhNYWcoeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UobWF4TWFnKCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gMCwgKGFjYywgeCkgPT4gKE1hdGguYWJzKHgpID4gTWF0aC5hYnMoYWNjKSA/IHggOiBhY2MpKTtcbn1cblxuZnVuY3Rpb24gbWVhbih4cykge1xuICAgIGxldCBuID0gMTtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UobWVhbigpLCB4cylcbiAgICAgICAgOiBbXG4gICAgICAgICAgICAoKSA9PiAobiA9IDApLFxuICAgICAgICAgICAgKGFjYykgPT4gKG4gPiAxID8gYWNjIC8gbiA6IGFjYyksXG4gICAgICAgICAgICAoYWNjLCB4KSA9PiAobisrLCBhY2MgKyB4KSxcbiAgICAgICAgXTtcbn1cblxuZnVuY3Rpb24gbWluKHhzKSB7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gcmVkdWNlKG1pbigpLCB4cylcbiAgICAgICAgOiByZWR1Y2VyKCgpID0+IEluZmluaXR5LCAoYWNjLCB4KSA9PiBNYXRoLm1pbihhY2MsIHgpKTtcbn1cblxuZnVuY3Rpb24gbWluQ29tcGFyZSguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2UobWluQ29tcGFyZSwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IGluaXQgPSBhcmdzWzBdO1xuICAgIGNvbnN0IGNtcCA9IGFyZ3NbMV0gfHwgY29tcGFyZS5jb21wYXJlO1xuICAgIHJldHVybiByZWR1Y2VyKGluaXQsIChhY2MsIHgpID0+IChjbXAoYWNjLCB4KSA8PSAwID8gYWNjIDogeCkpO1xufVxuXG5mdW5jdGlvbiBtaW5NYWcoeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UobWluTWFnKCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gSW5maW5pdHksIChhY2MsIHgpID0+IChNYXRoLmFicyh4KSA8IE1hdGguYWJzKGFjYykgPyB4IDogYWNjKSk7XG59XG5cbmZ1bmN0aW9uIGp1eHRSKC4uLnJzKSB7XG4gICAgbGV0IFthLCBiLCBjXSA9IHJzO1xuICAgIGNvbnN0IG4gPSBycy5sZW5ndGg7XG4gICAgc3dpdGNoIChuKSB7XG4gICAgICAgIGNhc2UgMToge1xuICAgICAgICAgICAgY29uc3QgciA9IGFbMl07XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICgpID0+IFthWzBdKCldLFxuICAgICAgICAgICAgICAgIChhY2MpID0+IFthWzFdKGFjY1swXSldLFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWExID0gcihhY2NbMF0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZWR1Y2VkKGFhMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2VkKFt1bnJlZHVjZWQoYWExKV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYWExXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDI6IHtcbiAgICAgICAgICAgIGNvbnN0IHJhID0gYVsyXTtcbiAgICAgICAgICAgIGNvbnN0IHJiID0gYlsyXTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgKCkgPT4gW2FbMF0oKSwgYlswXSgpXSxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiBbYVsxXShhY2NbMF0pLCBiWzFdKGFjY1sxXSldLFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWExID0gcmEoYWNjWzBdLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWEyID0gcmIoYWNjWzFdLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChhYTEpIHx8IGlzUmVkdWNlZChhYTIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVkdWNlZChbdW5yZWR1Y2VkKGFhMSksIHVucmVkdWNlZChhYTIpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthYTEsIGFhMl07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAzOiB7XG4gICAgICAgICAgICBjb25zdCByYSA9IGFbMl07XG4gICAgICAgICAgICBjb25zdCByYiA9IGJbMl07XG4gICAgICAgICAgICBjb25zdCByYyA9IGNbMl07XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgICgpID0+IFthWzBdKCksIGJbMF0oKSwgY1swXSgpXSxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiBbYVsxXShhY2NbMF0pLCBiWzFdKGFjY1sxXSksIGNbMV0oYWNjWzJdKV0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTEgPSByYShhY2NbMF0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTIgPSByYihhY2NbMV0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTMgPSByYyhhY2NbMl0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZWR1Y2VkKGFhMSkgfHwgaXNSZWR1Y2VkKGFhMikgfHwgaXNSZWR1Y2VkKGFhMykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2VkKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlZHVjZWQoYWExKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlZHVjZWQoYWEyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bnJlZHVjZWQoYWEzKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYWExLCBhYTIsIGFhM107XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgKCkgPT4gcnMubWFwKChyKSA9PiByWzBdKCkpLFxuICAgICAgICAgICAgICAgIChhY2MpID0+IHJzLm1hcCgociwgaSkgPT4gclsxXShhY2NbaV0pKSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGEgPSByc1tpXVsyXShhY2NbaV0sIHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgPSB1bnJlZHVjZWQoYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNbaV0gPSBhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb25lID8gcmVkdWNlZChyZXMpIDogcmVzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgIH1cbn1cblxuY29uc3QgbWluTWF4ID0gKCkgPT4ganV4dFIobWluKCksIG1heCgpKTtcblxuZnVuY3Rpb24gbXVsKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gX19tYXRob3AobXVsLCAoYWNjLCB4KSA9PiBhY2MgKiB4LCAxLCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gbm9ybUNvdW50KC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShub3JtQ291bnQsIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBjb25zdCBub3JtID0gYXJnc1swXTtcbiAgICByZXR1cm4gWygpID0+IDAsIChhY2MpID0+IGFjYyAvIG5vcm0sIChhY2MpID0+IGFjYyArIDFdO1xufVxuXG5mdW5jdGlvbiBub3JtRnJlcXVlbmNpZXMoLi4uYXJncykge1xuICAgIHJldHVybiAoJCRyZWR1Y2Uobm9ybUZyZXF1ZW5jaWVzLCBhcmdzKSB8fFxuICAgICAgICBncm91cEJ5TWFwKHtcbiAgICAgICAgICAgIGtleTogYXJnc1sxXSB8fCBjb21wb3NlLmlkZW50aXR5LFxuICAgICAgICAgICAgZ3JvdXA6IG5vcm1Db3VudChhcmdzWzBdKSxcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiBub3JtRnJlcXVlbmNpZXNBdXRvKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShub3JtRnJlcXVlbmNpZXNBdXRvLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3QgW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdID0gZnJlcXVlbmNpZXMoLi4uYXJncyk7XG4gICAgbGV0IG5vcm0gPSAwO1xuICAgIHJldHVybiBbXG4gICAgICAgIGluaXQsXG4gICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgIGFjYyA9IGNvbXBsZXRlKGFjYyk7XG4gICAgICAgICAgICBmb3IgKGxldCBwIG9mIGFjYykge1xuICAgICAgICAgICAgICAgIGFjYy5zZXQocFswXSwgcFsxXSAvIG5vcm0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICAgICAgKGFjYywgeCkgPT4gKG5vcm0rKywgcmVkdWNlKGFjYywgeCkpLFxuICAgIF07XG59XG5cbmNvbnN0IHB1c2hDb3B5ID0gKCkgPT4gcmVkdWNlcigoKSA9PiBbXSwgKGFjYywgeCkgPT4gKChhY2MgPSBhY2Muc2xpY2UoKSkucHVzaCh4KSwgYWNjKSk7XG5cbmZ1bmN0aW9uIHB1c2hTb3J0KGNtcCA9IGNvbXBhcmUuY29tcGFyZSwgeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyBbLi4ueHNdLnNvcnQoY21wKVxuICAgICAgICA6IFtcbiAgICAgICAgICAgICgpID0+IFtdLFxuICAgICAgICAgICAgKGFjYykgPT4gYWNjLnNvcnQoY21wKSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IChhY2MucHVzaCh4KSwgYWNjKSxcbiAgICAgICAgXTtcbn1cblxuZnVuY3Rpb24gcmVkdWN0aW9ucyhyZm4sIHhzKSB7XG4gICAgY29uc3QgW2luaXQsIGNvbXBsZXRlLCBfcmVkdWNlXSA9IHJmbjtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UocmVkdWN0aW9ucyhyZm4pLCB4cylcbiAgICAgICAgOiBbXG4gICAgICAgICAgICAoKSA9PiBbaW5pdCgpXSxcbiAgICAgICAgICAgIChhY2MpID0+ICgoYWNjW2FjYy5sZW5ndGggLSAxXSA9IGNvbXBsZXRlKGFjY1thY2MubGVuZ3RoIC0gMV0pKSwgYWNjKSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSBfcmVkdWNlKGFjY1thY2MubGVuZ3RoIC0gMV0sIHgpO1xuICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQocmVzKSkge1xuICAgICAgICAgICAgICAgICAgICBhY2MucHVzaChyZXMuZGVyZWYoKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2VkKGFjYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFjYy5wdXNoKHJlcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF07XG59XG5cbmZ1bmN0aW9uIHNvbWUoLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKHNvbWUsIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBjb25zdCBwcmVkID0gYXJnc1swXTtcbiAgICByZXR1cm4gcmVkdWNlcigoKSA9PiBmYWxzZSwgcHJlZFxuICAgICAgICA/IChhY2MsIHgpID0+IChwcmVkKHgpID8gcmVkdWNlZCh0cnVlKSA6IGFjYylcbiAgICAgICAgOiAoYWNjLCB4KSA9PiAoeCA/IHJlZHVjZWQodHJ1ZSkgOiBhY2MpKTtcbn1cblxuZnVuY3Rpb24gc3RyKHNlcCwgeHMpIHtcbiAgICBzZXAgPSBzZXAgfHwgXCJcIjtcbiAgICBsZXQgZmlyc3QgPSB0cnVlO1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IFsuLi54c10uam9pbihzZXApXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiBcIlwiLCAoYWNjLCB4KSA9PiAoKGFjYyA9IGZpcnN0ID8gYWNjICsgeCA6IGFjYyArIHNlcCArIHgpLCAoZmlyc3QgPSBmYWxzZSksIGFjYykpO1xufVxuXG5mdW5jdGlvbiBzdWIoLi4uYXJncykge1xuICAgIHJldHVybiBfX21hdGhvcChzdWIsIChhY2MsIHgpID0+IGFjYyAtIHgsIDAsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBiZW5jaG1hcmsoc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEoYmVuY2htYXJrKCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgbGV0IHByZXYgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgXykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0IC0gcHJldjtcbiAgICAgICAgICAgICAgICBwcmV2ID0gdDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5cbmNvbnN0IGNhdCA9ICgpID0+IChyZm4pID0+IHtcbiAgICBjb25zdCByID0gcmZuWzJdO1xuICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgaWYgKHgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgb2YgdW5yZWR1Y2VkKHgpKSB7XG4gICAgICAgICAgICAgICAgYWNjID0gcihhY2MsIHkpO1xuICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzUmVkdWNlZCh4KSA/IGVuc3VyZVJlZHVjZWQoYWNjKSA6IGFjYztcbiAgICB9KTtcbn07XG5cbmZ1bmN0aW9uIGNvbnZlcmdlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKGNvbnZlcmdlLCBhcmdzKSB8fFxuICAgICAgICAoKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IHByZWQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgbGV0IHByZXYgPSBhcGkuU0VNQVBIT1JFO1xuICAgICAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9uZSB8fCAocHJldiAhPT0gYXBpLlNFTUFQSE9SRSAmJiBwcmVkKHByZXYsIHgpKSkge1xuICAgICAgICAgICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuc3VyZVJlZHVjZWQocihhY2MsIHgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldiA9IHg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCB4KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHJhbmdlKGZyb20sIHRvLCBzdGVwKSB7XG4gICAgcmV0dXJuIG5ldyBSYW5nZShmcm9tLCB0bywgc3RlcCk7XG59XG5jbGFzcyBSYW5nZSB7XG4gICAgY29uc3RydWN0b3IoZnJvbSwgdG8sIHN0ZXApIHtcbiAgICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgICAgICB0byA9IEluZmluaXR5O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRvID0gZnJvbTtcbiAgICAgICAgICAgIGZyb20gPSAwO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXAgPSBzdGVwID09PSB1bmRlZmluZWQgPyAoZnJvbSA8IHRvID8gMSA6IC0xKSA6IHN0ZXA7XG4gICAgICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgICAgIHRoaXMudG8gPSB0bztcbiAgICAgICAgdGhpcy5zdGVwID0gc3RlcDtcbiAgICB9XG4gICAgKltTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgICAgICBsZXQgeyBmcm9tLCB0bywgc3RlcCB9ID0gdGhpcztcbiAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XG4gICAgICAgICAgICB3aGlsZSAoZnJvbSA8IHRvKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgZnJvbTtcbiAgICAgICAgICAgICAgICBmcm9tICs9IHN0ZXA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RlcCA8IDApIHtcbiAgICAgICAgICAgIHdoaWxlIChmcm9tID4gdG8pIHtcbiAgICAgICAgICAgICAgICB5aWVsZCBmcm9tO1xuICAgICAgICAgICAgICAgIGZyb20gKz0gc3RlcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAkcmVkdWNlKHJmbiwgYWNjKSB7XG4gICAgICAgIGNvbnN0IHN0ZXAgPSB0aGlzLnN0ZXA7XG4gICAgICAgIGlmIChzdGVwID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuZnJvbSwgbiA9IHRoaXMudG87IGkgPCBuICYmICFpc1JlZHVjZWQoYWNjKTsgaSArPSBzdGVwKSB7XG4gICAgICAgICAgICAgICAgYWNjID0gcmZuKGFjYywgaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5mcm9tLCBuID0gdGhpcy50bzsgaSA+IG4gJiYgIWlzUmVkdWNlZChhY2MpOyBpICs9IHN0ZXApIHtcbiAgICAgICAgICAgICAgICBhY2MgPSByZm4oYWNjLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH1cbn1cblxuZnVuY3Rpb24qIHJhbmdlMmQoLi4uYXJncykge1xuICAgIGxldCBmcm9tWCwgdG9YLCBzdGVwWDtcbiAgICBsZXQgZnJvbVksIHRvWSwgc3RlcFk7XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICBzdGVwWCA9IGFyZ3NbNF07XG4gICAgICAgICAgICBzdGVwWSA9IGFyZ3NbNV07XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIFtmcm9tWCwgdG9YLCBmcm9tWSwgdG9ZXSA9IGFyZ3M7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgW3RvWCwgdG9ZXSA9IGFyZ3M7XG4gICAgICAgICAgICBmcm9tWCA9IGZyb21ZID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZXJyb3JzLmlsbGVnYWxBcml0eShhcmdzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IHJ4ID0gcmFuZ2UoZnJvbVgsIHRvWCwgc3RlcFgpO1xuICAgIGZvciAobGV0IHkgb2YgcmFuZ2UoZnJvbVksIHRvWSwgc3RlcFkpKSB7XG4gICAgICAgIGZvciAobGV0IHggb2YgcngpIHtcbiAgICAgICAgICAgIHlpZWxkIFt4LCB5XTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24qIHppcCguLi5zcmMpIHtcbiAgICBjb25zdCBpdGVycyA9IHNyYy5tYXAoKHMpID0+IHNbU3ltYm9sLml0ZXJhdG9yXSgpKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBjb25zdCB0dXBsZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpIG9mIGl0ZXJzKSB7XG4gICAgICAgICAgICBsZXQgdiA9IGkubmV4dCgpO1xuICAgICAgICAgICAgaWYgKHYuZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR1cGxlLnB1c2godi52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgdHVwbGU7XG4gICAgfVxufVxuXG5jb25zdCBidWlsZEtlcm5lbDFkID0gKHdlaWdodHMsIHcpID0+IHtcbiAgICBjb25zdCB3MiA9IHcgPj4gMTtcbiAgICByZXR1cm4gWy4uLnppcCh3ZWlnaHRzLCByYW5nZSgtdzIsIHcyICsgMSkpXTtcbn07XG5jb25zdCBidWlsZEtlcm5lbDJkID0gKHdlaWdodHMsIHcsIGggPSB3KSA9PiB7XG4gICAgY29uc3QgdzIgPSB3ID4+IDE7XG4gICAgY29uc3QgaDIgPSBoID4+IDE7XG4gICAgcmV0dXJuIFsuLi56aXAod2VpZ2h0cywgcmFuZ2UyZCgtdzIsIHcyICsgMSwgLWgyLCBoMiArIDEpKV07XG59O1xuY29uc3Qga2VybmVsTG9va3VwMWQgPSAoc3JjLCB4LCB3aWR0aCwgd3JhcCwgYm9yZGVyKSA9PiB3cmFwXG4gICAgPyAoeyAwOiB3LCAxOiBveCB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHh4ID0geCA8IC1veCA/IHdpZHRoICsgb3ggOiB4ID49IHdpZHRoIC0gb3ggPyBveCAtIDEgOiB4ICsgb3g7XG4gICAgICAgIHJldHVybiB3ICogc3JjW3h4XTtcbiAgICB9XG4gICAgOiAoeyAwOiB3LCAxOiBveCB9KSA9PiB7XG4gICAgICAgIHJldHVybiB4IDwgLW94IHx8IHggPj0gd2lkdGggLSBveCA/IGJvcmRlciA6IHcgKiBzcmNbeCArIG94XTtcbiAgICB9O1xuY29uc3Qga2VybmVsTG9va3VwMmQgPSAoc3JjLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB3cmFwLCBib3JkZXIpID0+IHdyYXBcbiAgICA/ICh7IDA6IHcsIDE6IHsgMDogb3gsIDE6IG95IH0gfSkgPT4ge1xuICAgICAgICBjb25zdCB4eCA9IHggPCAtb3ggPyB3aWR0aCArIG94IDogeCA+PSB3aWR0aCAtIG94ID8gb3ggLSAxIDogeCArIG94O1xuICAgICAgICBjb25zdCB5eSA9IHkgPCAtb3kgPyBoZWlnaHQgKyBveSA6IHkgPj0gaGVpZ2h0IC0gb3kgPyBveSAtIDEgOiB5ICsgb3k7XG4gICAgICAgIHJldHVybiB3ICogc3JjW3l5ICogd2lkdGggKyB4eF07XG4gICAgfVxuICAgIDogKHsgMDogdywgMTogeyAwOiBveCwgMTogb3kgfSB9KSA9PiB7XG4gICAgICAgIHJldHVybiB4IDwgLW94IHx8IHkgPCAtb3kgfHwgeCA+PSB3aWR0aCAtIG94IHx8IHkgPj0gaGVpZ2h0IC0gb3lcbiAgICAgICAgICAgID8gYm9yZGVyXG4gICAgICAgICAgICA6IHcgKiBzcmNbKHkgKyBveSkgKiB3aWR0aCArIHggKyBveF07XG4gICAgfTtcbmNvbnN0IGtlcm5lbEVycm9yID0gKCkgPT4gZXJyb3JzLmlsbGVnYWxBcmdzKGBubyBrZXJuZWwgb3Iga2VybmVsIGNvbmZpZ2ApO1xuZnVuY3Rpb24gY29udm9sdmUxZChvcHRzLCBpbmRpY2VzKSB7XG4gICAgaWYgKGluZGljZXMpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yMShjb252b2x2ZTFkKG9wdHMpLCBpbmRpY2VzKTtcbiAgICB9XG4gICAgY29uc3QgeyBzcmMsIHdpZHRoIH0gPSBvcHRzO1xuICAgIGNvbnN0IHdyYXAgPSBvcHRzLndyYXAgIT09IGZhbHNlO1xuICAgIGNvbnN0IGJvcmRlciA9IG9wdHMuYm9yZGVyIHx8IDA7XG4gICAgY29uc3QgcmZuID0gb3B0cy5yZWR1Y2UgfHwgYWRkO1xuICAgIGxldCBrZXJuZWwgPSBvcHRzLmtlcm5lbDtcbiAgICBpZiAoIWtlcm5lbCkge1xuICAgICAgICAhKG9wdHMud2VpZ2h0cyAmJiBvcHRzLmt3aWR0aCkgJiYga2VybmVsRXJyb3IoKTtcbiAgICAgICAga2VybmVsID0gYnVpbGRLZXJuZWwxZChvcHRzLndlaWdodHMsIG9wdHMua3dpZHRoKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hcCgocCkgPT4gdHJhbnNkdWNlKG1hcChrZXJuZWxMb29rdXAxZChzcmMsIHAsIHdpZHRoLCB3cmFwLCBib3JkZXIpKSwgcmZuKCksIGtlcm5lbCkpO1xufVxuZnVuY3Rpb24gY29udm9sdmUyZChvcHRzLCBpbmRpY2VzKSB7XG4gICAgaWYgKGluZGljZXMpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yMShjb252b2x2ZTJkKG9wdHMpLCBpbmRpY2VzKTtcbiAgICB9XG4gICAgY29uc3QgeyBzcmMsIHdpZHRoLCBoZWlnaHQgfSA9IG9wdHM7XG4gICAgY29uc3Qgd3JhcCA9IG9wdHMud3JhcCAhPT0gZmFsc2U7XG4gICAgY29uc3QgYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICBjb25zdCByZm4gPSBvcHRzLnJlZHVjZSB8fCBhZGQ7XG4gICAgbGV0IGtlcm5lbCA9IG9wdHMua2VybmVsO1xuICAgIGlmICgha2VybmVsKSB7XG4gICAgICAgICEob3B0cy53ZWlnaHRzICYmIG9wdHMua3dpZHRoICYmIG9wdHMua2hlaWdodCkgJiYga2VybmVsRXJyb3IoKTtcbiAgICAgICAga2VybmVsID0gYnVpbGRLZXJuZWwyZChvcHRzLndlaWdodHMsIG9wdHMua3dpZHRoLCBvcHRzLmtoZWlnaHQpO1xuICAgIH1cbiAgICByZXR1cm4gbWFwKChwKSA9PiB0cmFuc2R1Y2UobWFwKGtlcm5lbExvb2t1cDJkKHNyYywgcFswXSwgcFsxXSwgd2lkdGgsIGhlaWdodCwgd3JhcCwgYm9yZGVyKSksIHJmbigpLCBrZXJuZWwpKTtcbn1cblxuZnVuY3Rpb24gZGVkdXBlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKGRlZHVwZSwgYXJncykgfHxcbiAgICAgICAgKChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBlcXVpdiA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgcHJldiA9IGFwaS5TRU1BUEhPUkU7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCBlcXVpdlxuICAgICAgICAgICAgICAgID8gKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiAhPT0gYXBpLlNFTUFQSE9SRSAmJiBlcXVpdihwcmV2LCB4KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWNjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiByKGFjYywgeCk7XG4gICAgICAgICAgICAgICAgICAgIHByZXYgPSB4O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcHJldiA9PT0geCA/IGFjYyA6IHIoYWNjLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgcHJldiA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbn1cblxuY29uc3QgZGVsYXllZCA9ICh0KSA9PiBtYXAoKHgpID0+IGNvbXBvc2UuZGVsYXllZCh4LCB0KSk7XG5cbmZ1bmN0aW9uIGRpc3RpbmN0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKGRpc3RpbmN0LCBhcmdzKSB8fFxuICAgICAgICAoKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IG9wdHMgPSAoYXJnc1swXSB8fCB7fSk7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBvcHRzLmtleTtcbiAgICAgICAgICAgIGNvbnN0IHNlZW4gPSAob3B0cy5jYWNoZSB8fCAoKCkgPT4gbmV3IFNldCgpKSkoKTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIGtleVxuICAgICAgICAgICAgICAgID8gKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrID0ga2V5KHgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXNlZW4uaGFzKGspID8gKHNlZW4uYWRkKGspLCByKGFjYywgeCkpIDogYWNjO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IChhY2MsIHgpID0+ICFzZWVuLmhhcyh4KSA/IChzZWVuLmFkZCh4KSwgcihhY2MsIHgpKSA6IGFjYyk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gdGhyb3R0bGUocHJlZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEodGhyb3R0bGUocHJlZCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgX3ByZWQgPSBwcmVkKCk7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiAoX3ByZWQoeCkgPyByKGFjYywgeCkgOiBhY2MpKTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gZHJvcE50aChuLCBzcmMpIHtcbiAgICBpZiAoY2hlY2tzLmlzSXRlcmFibGUoc3JjKSkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3IxKGRyb3BOdGgobiksIHNyYyk7XG4gICAgfVxuICAgIG4gPSBtYXRoLmNsYW1wMChuIC0gMSk7XG4gICAgcmV0dXJuIHRocm90dGxlKCgpID0+IHtcbiAgICAgICAgbGV0IHNraXAgPSBuO1xuICAgICAgICByZXR1cm4gKCkgPT4gKHNraXAtLSA+IDAgPyB0cnVlIDogKChza2lwID0gbiksIGZhbHNlKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGRyb3BXaGlsZSguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkaXRlcihkcm9wV2hpbGUsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgcHJlZCA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgb2sgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4gKG9rID0gb2sgJiYgcHJlZCh4KSkgPyBhY2MgOiByKGFjYywgeCkpO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGRyb3Aobiwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEoZHJvcChuKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBsZXQgbSA9IG47XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiBtID4gMCA/IChtLS0sIGFjYykgOiByKGFjYywgeCkpO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBkdXBsaWNhdGUobiA9IDEsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IoZHVwbGljYXRlKG4pLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gbjsgaSA+PSAwICYmICFpc1JlZHVjZWQoYWNjKTsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IHIoYWNjLCB4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBmaWx0ZXIocHJlZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEoZmlsdGVyKHByZWQpLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IChwcmVkKHgpID8gcihhY2MsIHgpIDogYWNjKSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGZpbHRlckZ1enp5KC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gYXJncy5sZW5ndGggPiAxICYmICRpdGVyKGZpbHRlckZ1enp5LCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgcXVlcnkgPSBhcmdzWzBdO1xuICAgIGNvbnN0IHsga2V5LCBlcXVpdiB9ID0gKGFyZ3NbMV0gfHwge30pO1xuICAgIHJldHVybiBmaWx0ZXIoKHgpID0+IGFycmF5cy5mdXp6eU1hdGNoKGtleSAhPSBudWxsID8ga2V5KHgpIDogeCwgcXVlcnksIGVxdWl2KSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5XaXRoKGZuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKGZsYXR0ZW5XaXRoKGZuKSwgY2hlY2tzLmlzU3RyaW5nKHNyYykgPyBbc3JjXSA6IHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBmbGF0dGVuID0gKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHh4ID0gZm4oeCk7XG4gICAgICAgICAgICAgICAgaWYgKHh4KSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHkgb2YgeHgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGZsYXR0ZW4oYWNjLCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2UoYWNjLCB4KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCBmbGF0dGVuKTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbihzcmMpIHtcbiAgICByZXR1cm4gZmxhdHRlbldpdGgoKHgpID0+IChjaGVja3MuaXNOb3RTdHJpbmdBbmRJdGVyYWJsZSh4KSA/IHggOiB1bmRlZmluZWQpLCBzcmMpO1xufVxuXG5mdW5jdGlvbiBtYXBJbmRleGVkKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKG1hcEluZGV4ZWQsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgZm4gPSBhcmdzWzBdO1xuICAgICAgICAgICAgbGV0IGkgPSBhcmdzWzFdIHx8IDA7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiByKGFjYywgZm4oaSsrLCB4KSkpO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIGluZGV4ZWQoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihpbmRleGVkLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgZnJvbSA9IGFyZ3NbMF0gfHwgMDtcbiAgICByZXR1cm4gbWFwSW5kZXhlZCgoaSwgeCkgPT4gW2Zyb20gKyBpLCB4XSk7XG59XG5cbmZ1bmN0aW9uIGludGVybGVhdmUoc2VwLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKGludGVybGVhdmUoc2VwKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBfc2VwID0gdHlwZW9mIHNlcCA9PT0gXCJmdW5jdGlvblwiID8gc2VwIDogKCkgPT4gc2VwO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGFjYyA9IHIoYWNjLCBfc2VwKCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1JlZHVjZWQoYWNjKSA/IGFjYyA6IHIoYWNjLCB4KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBjb21wKC4uLmZucykge1xuICAgIGZucyA9IGZucy5tYXAoZW5zdXJlVHJhbnNkdWNlcik7XG4gICAgcmV0dXJuIGNvbXBvc2UuY29tcC5hcHBseShudWxsLCBmbnMpO1xufVxuXG5mdW5jdGlvbiogbm9ybVJhbmdlKG4sIGluY2x1ZGVMYXN0ID0gdHJ1ZSkge1xuICAgIGlmIChuID4gMCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbSA9IGluY2x1ZGVMYXN0ID8gbiArIDEgOiBuOyBpIDwgbTsgaSsrKSB7XG4gICAgICAgICAgICB5aWVsZCBpIC8gbjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uKiBub3JtUmFuZ2UyZChueCwgbnksIGluY2x1ZGVMYXN0WCA9IHRydWUsIGluY2x1ZGVMYXN0WSA9IHRydWUpIHtcbiAgICBjb25zdCByeCA9IFsuLi5ub3JtUmFuZ2UobngsIGluY2x1ZGVMYXN0WCldO1xuICAgIGZvciAobGV0IHkgb2Ygbm9ybVJhbmdlKG55LCBpbmNsdWRlTGFzdFkpKSB7XG4gICAgICAgIHlpZWxkKiBtYXAoKHgpID0+IFt4LCB5XSwgcngpO1xuICAgIH1cbn1cbmZ1bmN0aW9uKiBub3JtUmFuZ2UzZChueCwgbnksIG56LCBpbmNsdWRlTGFzdFggPSB0cnVlLCBpbmNsdWRlTGFzdFkgPSB0cnVlLCBpbmNsdWRlTGFzdFogPSB0cnVlKSB7XG4gICAgY29uc3Qgc2xpY2VYWSA9IFsuLi5ub3JtUmFuZ2UyZChueCwgbnksIGluY2x1ZGVMYXN0WCwgaW5jbHVkZUxhc3RZKV07XG4gICAgZm9yIChsZXQgeiBvZiBub3JtUmFuZ2UobnosIGluY2x1ZGVMYXN0WikpIHtcbiAgICAgICAgeWllbGQqIG1hcCgoeHkpID0+IFsuLi54eSwgel0sIHNsaWNlWFkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbWFwY2F0KGZuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKSA/IGl0ZXJhdG9yKG1hcGNhdChmbiksIHNyYykgOiBjb21wKG1hcChmbiksIGNhdCgpKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIocGFydGl0aW9uLCBhcmdzLCBpdGVyYXRvcik7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGxldCBzaXplID0gYXJnc1swXSwgYWxsLCBzdGVwO1xuICAgIGlmICh0eXBlb2YgYXJnc1sxXSA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHN0ZXAgPSBhcmdzWzFdO1xuICAgICAgICBhbGwgPSBhcmdzWzJdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgc3RlcCA9IHNpemU7XG4gICAgICAgIGFsbCA9IGFyZ3NbMV07XG4gICAgfVxuICAgIHJldHVybiAoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgIGxldCBidWYgPSBbXTtcbiAgICAgICAgbGV0IHNraXAgPSAwO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoYWxsICYmIGJ1Zi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1Zik7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZiA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHNraXAgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYnVmLmxlbmd0aCA8IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zi5wdXNoKHgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWYubGVuZ3RoID09PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmID0gc3RlcCA8IHNpemUgPyBidWYuc2xpY2Uoc3RlcCkgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNraXAgPSBzdGVwIC0gc2l6ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2tpcC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBpbnRlcnBvbGF0ZShmbiwgd2luZG93LCBuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKGludGVycG9sYXRlKGZuLCB3aW5kb3csIG4pLCBzcmMpXG4gICAgICAgIDogY29tcChwYXJ0aXRpb24od2luZG93LCAxKSwgbWFwY2F0KChjaHVuaykgPT4gbWFwKCh0KSA9PiBmbihjaHVuaywgdCksIG5vcm1SYW5nZShuLCBmYWxzZSkpKSk7XG59XG5cbmZ1bmN0aW9uIGludGVycG9sYXRlSGVybWl0ZShuLCBzcmMpIHtcbiAgICByZXR1cm4gaW50ZXJwb2xhdGUoKGNodW5rLCB0KSA9PiBtYXRoLm1peEhlcm1pdGUoLi4uY2h1bmssIHQpLCA0LCBuLCBzcmMpO1xufVxuXG5mdW5jdGlvbiBpbnRlcnBvbGF0ZUxpbmVhcihuLCBzcmMpIHtcbiAgICByZXR1cm4gaW50ZXJwb2xhdGUoKGNodW5rLCB0KSA9PiBtYXRoLm1peCguLi5jaHVuaywgdCksIDIsIG4sIHNyYyk7XG59XG5cbmZ1bmN0aW9uIGludGVycG9zZShzZXAsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IoaW50ZXJwb3NlKHNlcCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgX3NlcCA9IHR5cGVvZiBzZXAgPT09IFwiZnVuY3Rpb25cIiA/IHNlcCA6ICgpID0+IHNlcDtcbiAgICAgICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByKGFjYywgeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFjYyA9IHIoYWNjLCBfc2VwKCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpc1JlZHVjZWQoYWNjKSA/IGFjYyA6IHIoYWNjLCB4KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBrZWVwKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKGtlZXAsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgcHJlZCA9IGFyZ3NbMF0gfHwgY29tcG9zZS5pZGVudGl0eTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHByZWQoeCkgIT0gbnVsbCA/IHIoYWNjLCB4KSA6IGFjYyk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gbGFiZWxlZChpZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEobGFiZWxlZChpZCksIHNyYylcbiAgICAgICAgOiBtYXAoY2hlY2tzLmlzRnVuY3Rpb24oaWQpID8gKHgpID0+IFtpZCh4KSwgeF0gOiAoeCkgPT4gW2lkLCB4XSk7XG59XG5cbmNvbnN0IGRlZXBUcmFuc2Zvcm0gPSAoc3BlYykgPT4ge1xuICAgIGlmIChjaGVja3MuaXNGdW5jdGlvbihzcGVjKSkge1xuICAgICAgICByZXR1cm4gc3BlYztcbiAgICB9XG4gICAgY29uc3QgbWFwZm5zID0gT2JqZWN0LmtleXMoc3BlY1sxXSB8fCB7fSkucmVkdWNlKChhY2MsIGspID0+ICgoYWNjW2tdID0gZGVlcFRyYW5zZm9ybShzcGVjWzFdW2tdKSksIGFjYyksIHt9KTtcbiAgICByZXR1cm4gKHgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gT2JqZWN0LmFzc2lnbih7fSwgeCk7XG4gICAgICAgIGZvciAobGV0IGsgaW4gbWFwZm5zKSB7XG4gICAgICAgICAgICByZXNba10gPSBtYXBmbnNba10ocmVzW2tdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3BlY1swXShyZXMpO1xuICAgIH07XG59O1xuXG5mdW5jdGlvbiBtYXBEZWVwKHNwZWMsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IxKG1hcERlZXAoc3BlYyksIHNyYylcbiAgICAgICAgOiBtYXAoZGVlcFRyYW5zZm9ybShzcGVjKSk7XG59XG5cbmZ1bmN0aW9uIG1hcEtleXMoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihtYXBLZXlzLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3Qga2V5cyA9IGFyZ3NbMF07XG4gICAgY29uc3QgY29weSA9IGFyZ3NbMV0gIT09IGZhbHNlO1xuICAgIHJldHVybiBtYXAoKHgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gY29weSA/IE9iamVjdC5hc3NpZ24oe30sIHgpIDogeDtcbiAgICAgICAgZm9yIChsZXQgayBpbiBrZXlzKSB7XG4gICAgICAgICAgICByZXNba10gPSBrZXlzW2tdKHhba10sIHgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG1hcE50aCguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKG1hcE50aCwgYXJncyk7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGxldCBuID0gYXJnc1swXSAtIDE7XG4gICAgbGV0IG9mZnNldDtcbiAgICBsZXQgZm47XG4gICAgaWYgKHR5cGVvZiBhcmdzWzFdID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIG9mZnNldCA9IGFyZ3NbMV07XG4gICAgICAgIGZuID0gYXJnc1syXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZuID0gYXJnc1sxXTtcbiAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIChyZm4pID0+IHtcbiAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgbGV0IHNraXAgPSAwLCBvZmYgPSBvZmZzZXQ7XG4gICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgIGlmIChvZmYgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBza2lwID0gbjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBmbih4KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNraXAtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG9mZi0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCB4KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gbWFwVmFscyguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKG1hcFZhbHMsIGFyZ3MpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCBmbiA9IGFyZ3NbMF07XG4gICAgY29uc3QgY29weSA9IGFyZ3NbMV0gIT09IGZhbHNlO1xuICAgIHJldHVybiBtYXAoKHgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzID0gY29weSA/IHt9IDogeDtcbiAgICAgICAgZm9yIChsZXQgayBpbiB4KSB7XG4gICAgICAgICAgICByZXNba10gPSBmbih4W2tdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBtYXBjYXRJbmRleGVkKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKG1hcGNhdEluZGV4ZWQsIGFyZ3MsIGl0ZXJhdG9yKSB8fFxuICAgICAgICBjb21wKG1hcEluZGV4ZWQoYXJnc1swXSwgYXJnc1sxXSksIGNhdCgpKSk7XG59XG5cbmZ1bmN0aW9uIHRha2Uobiwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcih0YWtlKG4pLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGxldCBtID0gbjtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IC0tbSA+IDBcbiAgICAgICAgICAgICAgICA/IHIoYWNjLCB4KVxuICAgICAgICAgICAgICAgIDogbSA9PT0gMFxuICAgICAgICAgICAgICAgICAgICA/IGVuc3VyZVJlZHVjZWQocihhY2MsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IHJlZHVjZWQoYWNjKSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIG1hdGNoRmlyc3QocHJlZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBbLi4uaXRlcmF0b3IxKG1hdGNoRmlyc3QocHJlZCksIHNyYyldWzBdXG4gICAgICAgIDogY29tcChmaWx0ZXIocHJlZCksIHRha2UoMSkpO1xufVxuXG5jb25zdCBfX2RyYWluID0gKGJ1ZiwgY29tcGxldGUsIHJlZHVjZSkgPT4gKGFjYykgPT4ge1xuICAgIHdoaWxlIChidWYubGVuZ3RoICYmICFpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYuc2hpZnQoKSk7XG4gICAgfVxuICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xufTtcblxuZnVuY3Rpb24gdGFrZUxhc3Qobiwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcih0YWtlTGFzdChuKSwgc3JjKVxuICAgICAgICA6IChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgICAgIF9fZHJhaW4oYnVmLCBjb21wbGV0ZSwgcmVkdWNlKSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWYubGVuZ3RoID09PSBuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWYuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBidWYucHVzaCh4KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hMYXN0KHByZWQsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gWy4uLml0ZXJhdG9yKG1hdGNoTGFzdChwcmVkKSwgc3JjKV1bMF1cbiAgICAgICAgOiBjb21wKGZpbHRlcihwcmVkKSwgdGFrZUxhc3QoMSkpO1xufVxuXG5mdW5jdGlvbiBtb3ZpbmdBdmVyYWdlKHBlcmlvZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEobW92aW5nQXZlcmFnZShwZXJpb2QpLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgcGVyaW9kIHw9IDA7XG4gICAgICAgICAgICBwZXJpb2QgPCAyICYmIGVycm9ycy5pbGxlZ2FsQXJncyhcInBlcmlvZCBtdXN0IGJlID49IDJcIik7XG4gICAgICAgICAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCB3aW5kb3cgPSBbXTtcbiAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB3aW5kb3cucHVzaCh4KTtcbiAgICAgICAgICAgICAgICBzdW0gKz0geDtcbiAgICAgICAgICAgICAgICBuID4gcGVyaW9kICYmIChzdW0gLT0gd2luZG93LnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuID49IHBlcmlvZCA/IHJlZHVjZShhY2MsIHN1bSAvIHBlcmlvZCkgOiBhY2M7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbn1cblxuY29uc3QgX19zb3J0T3B0cyA9IChvcHRzKSA9PiAoT2JqZWN0LmFzc2lnbih7IGtleTogY29tcG9zZS5pZGVudGl0eSwgY29tcGFyZTogY29tcGFyZS5jb21wYXJlIH0sIG9wdHMpKTtcblxuZnVuY3Rpb24gbW92aW5nTWVkaWFuKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIobW92aW5nTWVkaWFuLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgeyBrZXksIGNvbXBhcmUgfSA9IF9fc29ydE9wdHMoYXJnc1sxXSk7XG4gICAgY29uc3QgbiA9IGFyZ3NbMF07XG4gICAgY29uc3QgbSA9IG4gPj4gMTtcbiAgICByZXR1cm4gY29tcChwYXJ0aXRpb24obiwgMSwgdHJ1ZSksIG1hcCgod2luZG93KSA9PiB3aW5kb3cuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBjb21wYXJlKGtleShhKSwga2V5KGIpKSlbbV0pKTtcbn1cblxuZnVuY3Rpb24gbXVsdGlwbGV4KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gbWFwKGNvbXBvc2UuanV4dC5hcHBseShudWxsLCBhcmdzLm1hcChzdGVwKSkpO1xufVxuXG5jb25zdCByZW5hbWVyID0gKGttYXApID0+IHtcbiAgICBjb25zdCBrcyA9IE9iamVjdC5rZXlzKGttYXApO1xuICAgIGNvbnN0IFthMiwgYjIsIGMyXSA9IGtzO1xuICAgIGNvbnN0IFthMSwgYjEsIGMxXSA9IGtzLm1hcCgoaykgPT4ga21hcFtrXSk7XG4gICAgc3dpdGNoIChrcy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHY7XG4gICAgICAgICAgICAgICAgKHYgPSB4W2MxXSksIHYgIT09IHVuZGVmaW5lZCAmJiAocmVzW2MyXSA9IHYpO1xuICAgICAgICAgICAgICAgICh2ID0geFtiMV0pLCB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1tiMl0gPSB2KTtcbiAgICAgICAgICAgICAgICAodiA9IHhbYTFdKSwgdiAhPT0gdW5kZWZpbmVkICYmIChyZXNbYTJdID0gdik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgICAgICAgICAgICAgIGxldCB2O1xuICAgICAgICAgICAgICAgICh2ID0geFtiMV0pLCB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1tiMl0gPSB2KTtcbiAgICAgICAgICAgICAgICAodiA9IHhbYTFdKSwgdiAhPT0gdW5kZWZpbmVkICYmIChyZXNbYTJdID0gdik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgICAgICAgICAgICAgIGxldCB2ID0geFthMV07XG4gICAgICAgICAgICAgICAgdiAhPT0gdW5kZWZpbmVkICYmIChyZXNbYTJdID0gdik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgaywgdjtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0ga3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgKGsgPSBrc1tpXSksXG4gICAgICAgICAgICAgICAgICAgICAgICAodiA9IHhba21hcFtrXV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgdiAhPT0gdW5kZWZpbmVkICYmIChyZXNba10gPSB2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG4gICAgfVxufTtcblxuZnVuY3Rpb24gcmVuYW1lKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gYXJncy5sZW5ndGggPiAyICYmICRpdGVyKHJlbmFtZSwgYXJncyk7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGxldCBrbWFwID0gYXJnc1swXTtcbiAgICBpZiAoY2hlY2tzLmlzQXJyYXkoa21hcCkpIHtcbiAgICAgICAga21hcCA9IGttYXAucmVkdWNlKChhY2MsIGssIGkpID0+ICgoYWNjW2tdID0gaSksIGFjYyksIHt9KTtcbiAgICB9XG4gICAgaWYgKGFyZ3NbMV0pIHtcbiAgICAgICAgY29uc3Qga3MgPSBPYmplY3Qua2V5cyhrbWFwKTtcbiAgICAgICAgcmV0dXJuIG1hcCgoeSkgPT4gdHJhbnNkdWNlKGNvbXAobWFwKChrKSA9PiBbaywgeVtrbWFwW2tdXV0pLCBmaWx0ZXIoKHgpID0+IHhbMV0gIT09IHVuZGVmaW5lZCkpLCBhcmdzWzFdLCBrcykpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG1hcChyZW5hbWVyKGttYXApKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG11bHRpcGxleE9iaiguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKG11bHRpcGxleE9iaiwgYXJncyk7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IFt4Zm9ybXMsIHJmbl0gPSBhcmdzO1xuICAgIGNvbnN0IGtzID0gT2JqZWN0LmtleXMoeGZvcm1zKTtcbiAgICByZXR1cm4gY29tcChtdWx0aXBsZXguYXBwbHkobnVsbCwga3MubWFwKChrKSA9PiB4Zm9ybXNba10pKSwgcmVuYW1lKGtzLCByZm4pKTtcbn1cblxuY29uc3Qgbm9vcCA9ICgpID0+IChyZm4pID0+IHJmbjtcblxuZnVuY3Rpb24gcGFkTGFzdChuLCBmaWxsLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHBhZExhc3QobiwgZmlsbCksIHNyYylcbiAgICAgICAgOiAoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgICAgICBsZXQgbSA9IDA7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVtID0gbSAlIG47XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKytyZW0gPD0gbiAmJiAhaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBmaWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IChtKyssIHJlZHVjZShhY2MsIHgpKSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIHBhZ2UoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIocGFnZSwgYXJncykgfHxcbiAgICAgICAgY29tcChkcm9wKGFyZ3NbMF0gKiAoYXJnc1sxXSB8fCAxMCkpLCB0YWtlKGFyZ3NbMV0gfHwgMTApKSk7XG59XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbkJ5KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKHBhcnRpdGlvbkJ5LCBhcmdzLCBpdGVyYXRvcikgfHxcbiAgICAgICAgKChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZuID0gYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGYgPSBhcmdzWzFdID09PSB0cnVlID8gZm4oKSA6IGZuO1xuICAgICAgICAgICAgbGV0IHByZXYgPSBhcGkuU0VNQVBIT1JFO1xuICAgICAgICAgICAgbGV0IGNodW5rO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgY2h1bmspO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gZih4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXYgPT09IGFwaS5TRU1BUEhPUkUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYgPSBjdXJyO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgPSBbeF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY3VyciA9PT0gcHJldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsucHVzaCh4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rICYmIChhY2MgPSByZWR1Y2UoYWNjLCBjaHVuaykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgPSBpc1JlZHVjZWQoYWNjKSA/IG51bGwgOiBbeF07XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2ID0gY3VycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbk9mKHNpemVzLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHBhcnRpdGlvbk9mKHNpemVzKSwgc3JjKVxuICAgICAgICA6IHBhcnRpdGlvbkJ5KCgpID0+IHtcbiAgICAgICAgICAgIGxldCBpID0gMCwgaiA9IDA7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpKysgPT09IHNpemVzW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSAxO1xuICAgICAgICAgICAgICAgICAgICBqID0gKGogKyAxKSAlIHNpemVzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGo7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uU29ydCguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKHBhcnRpdGlvblNvcnQsIGFyZ3MsIGl0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgeyBrZXksIGNvbXBhcmUgfSA9IF9fc29ydE9wdHMoYXJnc1sxXSk7XG4gICAgcmV0dXJuIGNvbXAocGFydGl0aW9uKGFyZ3NbMF0sIHRydWUpLCBtYXBjYXQoKHdpbmRvdykgPT4gd2luZG93LnNsaWNlKCkuc29ydCgoYSwgYikgPT4gY29tcGFyZShrZXkoYSksIGtleShiKSkpKSk7XG59XG5cbmZ1bmN0aW9uIHBhcnRpdGlvblN5bmMoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihwYXJ0aXRpb25TeW5jLCBhcmdzLCBpdGVyYXRvcik7XG4gICAgaWYgKGl0ZXIpXG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIGNvbnN0IHsga2V5LCBtZXJnZU9ubHksIHJlc2V0LCBhbGwsIGJhY2tQcmVzc3VyZSB9ID0gT2JqZWN0LmFzc2lnbih7IGtleTogY29tcG9zZS5pZGVudGl0eSwgbWVyZ2VPbmx5OiBmYWxzZSwgcmVzZXQ6IHRydWUsIGFsbDogdHJ1ZSwgYmFja1ByZXNzdXJlOiAwIH0sIGFyZ3NbMV0pO1xuICAgIGNvbnN0IHJlcXVpcmVkS2V5cyA9IGNoZWNrcy5pc0FycmF5KGFyZ3NbMF0pXG4gICAgICAgID8gbmV3IFNldChhcmdzWzBdKVxuICAgICAgICA6IGFyZ3NbMF07XG4gICAgY29uc3QgY3VycktleXMgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgY2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgbGV0IGN1cnIgPSB7fTtcbiAgICBjb25zdCB4Zm9ybSA9IChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKG1lcmdlT25seSB8fCBiYWNrUHJlc3N1cmUgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKHJlc2V0ICYmIGFsbCAmJiBjdXJyS2V5cy5zaXplID4gMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICghcmVzZXQgJiYgZmlyc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBjdXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJLZXlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBrID0ga2V5KHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWlyZWRLZXlzLmhhcyhrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycltrXSA9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyS2V5cy5hZGQoayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVyZ2VPbmx5IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWRJbnB1dHMocmVxdWlyZWRLZXlzLCBjdXJyS2V5cykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBjdXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJLZXlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyID0gT2JqZWN0LmFzc2lnbih7fSwgY3Vycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsICYmIGN1cnJLZXlzLnNpemUgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBjb2xsZWN0KGNhY2hlLCBjdXJyS2V5cykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGUuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJLZXlzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlKGFjYyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBrZXkoeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1aXJlZEtleXMuaGFzKGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2xvdCA9IGNhY2hlLmdldChrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICFzbG90ICYmIGNhY2hlLnNldChrLCAoc2xvdCA9IFtdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90Lmxlbmd0aCA+PSBiYWNrUHJlc3N1cmUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcnMuaWxsZWdhbFN0YXRlKGBtYXggYmFjayBwcmVzc3VyZSAoJHtiYWNrUHJlc3N1cmV9KSBleGNlZWRlZCBmb3IgaW5wdXQ6ICR7U3RyaW5nKGspfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2xvdC5wdXNoKHgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycktleXMuYWRkKGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHJlcXVpcmVkSW5wdXRzKHJlcXVpcmVkS2V5cywgY3VycktleXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgY29sbGVjdChjYWNoZSwgY3VycktleXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWNjKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgeGZvcm0ua2V5cyA9ICgpID0+IHJlcXVpcmVkS2V5cztcbiAgICB4Zm9ybS5jbGVhciA9ICgpID0+IHtcbiAgICAgICAgY2FjaGUuY2xlYXIoKTtcbiAgICAgICAgcmVxdWlyZWRLZXlzLmNsZWFyKCk7XG4gICAgICAgIGN1cnJLZXlzLmNsZWFyKCk7XG4gICAgICAgIGN1cnIgPSB7fTtcbiAgICB9O1xuICAgIHhmb3JtLmFkZCA9IChpZCkgPT4ge1xuICAgICAgICByZXF1aXJlZEtleXMuYWRkKGlkKTtcbiAgICB9O1xuICAgIHhmb3JtLmRlbGV0ZSA9IChpZCwgY2xlYW4gPSB0cnVlKSA9PiB7XG4gICAgICAgIGNhY2hlLmRlbGV0ZShpZCk7XG4gICAgICAgIHJlcXVpcmVkS2V5cy5kZWxldGUoaWQpO1xuICAgICAgICBpZiAoY2xlYW4pIHtcbiAgICAgICAgICAgIGN1cnJLZXlzLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICBkZWxldGUgY3VycltpZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiB4Zm9ybTtcbn1cbmNvbnN0IHJlcXVpcmVkSW5wdXRzID0gKHJlcXVpcmVkLCBjdXJyKSA9PiB7XG4gICAgaWYgKGN1cnIuc2l6ZSA8IHJlcXVpcmVkLnNpemUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGxldCBpZCBvZiByZXF1aXJlZCkge1xuICAgICAgICBpZiAoIWN1cnIuaGFzKGlkKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuY29uc3QgY29sbGVjdCA9IChjYWNoZSwgY3VycktleXMpID0+IHtcbiAgICBjb25zdCBjdXJyID0ge307XG4gICAgZm9yIChsZXQgaWQgb2YgY3VycktleXMpIHtcbiAgICAgICAgY29uc3Qgc2xvdCA9IGNhY2hlLmdldChpZCk7XG4gICAgICAgIGN1cnJbaWRdID0gc2xvdC5zaGlmdCgpO1xuICAgICAgICAhc2xvdC5sZW5ndGggJiYgY3VycktleXMuZGVsZXRlKGlkKTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnI7XG59O1xuXG5mdW5jdGlvbiBwYXJ0aXRpb25UaW1lKHBlcmlvZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcihwYXJ0aXRpb25UaW1lKHBlcmlvZCksIHNyYylcbiAgICAgICAgOiBwYXJ0aXRpb25CeSgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGFzdCA9IDA7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHQgLSBsYXN0ID49IHBlcmlvZCAmJiAobGFzdCA9IHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBsYXN0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHBhcnRpdGlvbldoZW4oLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIocGFydGl0aW9uV2hlbiwgYXJncywgaXRlcmF0b3IpIHx8XG4gICAgICAgICgoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcmVkID0gYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IGYgPSBhcmdzWzFdID09PSB0cnVlID8gcHJlZCgpIDogcHJlZDtcbiAgICAgICAgICAgIGxldCBjaHVuaztcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaHVuayAmJiBjaHVuay5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGNodW5rKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGYoeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rICYmIChhY2MgPSByZWR1Y2UoYWNjLCBjaHVuaykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgPSBpc1JlZHVjZWQoYWNjKSA/IG51bGwgOiBbeF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA/IGNodW5rLnB1c2goeCkgOiAoY2h1bmsgPSBbeF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcGVlayhzcmMpIHtcbiAgICByZXR1cm4gbWFwKGFycmF5cy5wZWVrLCBzcmMpO1xufVxuXG5mdW5jdGlvbiBwbHVjayhrZXksIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IxKHBsdWNrKGtleSksIHNyYylcbiAgICAgICAgOiBtYXAoKHgpID0+IHhba2V5XSk7XG59XG5cbmZ1bmN0aW9uIHNhbXBsZSguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKHNhbXBsZSwgYXJncyk7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IHByb2IgPSBhcmdzWzBdO1xuICAgIGNvbnN0IHJuZCA9IGFyZ3NbMV0gfHwgcmFuZG9tLlNZU1RFTTtcbiAgICByZXR1cm4gKHJmbikgPT4ge1xuICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiBybmQuZmxvYXQoKSA8IHByb2IgPyByKGFjYywgeCkgOiBhY2MpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNjYW4oLi4uYXJncykge1xuICAgIHJldHVybiAoKGFyZ3MubGVuZ3RoID4gMiAmJiAkaXRlcihzY2FuLCBhcmdzLCBpdGVyYXRvcikpIHx8XG4gICAgICAgICgoW2luaXRvLCBjb21wbGV0ZW8sIHJlZHVjZW9dKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbaW5pdGksIGNvbXBsZXRlaSwgcmVkdWNlaV0gPSBhcmdzWzBdO1xuICAgICAgICAgICAgbGV0IGFjYyA9IGFyZ3MubGVuZ3RoID4gMSAmJiBhcmdzWzFdICE9IG51bGwgPyBhcmdzWzFdIDogaW5pdGkoKTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdG8sXG4gICAgICAgICAgICAgICAgKF9hY2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGEgPSBjb21wbGV0ZWkoYWNjKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGEgIT09IGFjYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgX2FjYyA9IHVucmVkdWNlZChyZWR1Y2VvKF9hY2MsIGEpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhY2MgPSBhO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGVvKF9hY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKF9hY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlaShhY2MsIHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbnN1cmVSZWR1Y2VkKHJlZHVjZW8oX2FjYywgYWNjLmRlcmVmKCkpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVkdWNlbyhfYWNjLCBhY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9KSk7XG59XG5cbmNvbnN0IGtleVNlbGVjdG9yID0gKGtleXMpID0+IHJlbmFtZXIoa2V5cy5yZWR1Y2UoKGFjYywgeCkgPT4gKChhY2NbeF0gPSB4KSwgYWNjKSwge30pKTtcblxuZnVuY3Rpb24gc2VsZWN0S2V5cyhrZXlzLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShzZWxlY3RLZXlzKGtleXMpLCBzcmMpXG4gICAgICAgIDogbWFwKGtleVNlbGVjdG9yKGtleXMpKTtcbn1cblxuY29uc3Qgc2lkZUVmZmVjdCA9IChmbikgPT4gbWFwKCh4KSA9PiAoZm4oeCksIHgpKTtcblxuZnVuY3Rpb24gc2xpZGluZ1dpbmRvdyguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKHNsaWRpbmdXaW5kb3csIGFyZ3MpO1xuICAgIGlmIChpdGVyKVxuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICBjb25zdCBzaXplID0gYXJnc1swXTtcbiAgICBjb25zdCBwYXJ0aWFsID0gYXJnc1sxXSAhPT0gZmFsc2U7XG4gICAgcmV0dXJuIChyZm4pID0+IHtcbiAgICAgICAgY29uc3QgcmVkdWNlID0gcmZuWzJdO1xuICAgICAgICBsZXQgYnVmID0gW107XG4gICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgIGJ1Zi5wdXNoKHgpO1xuICAgICAgICAgICAgY29uc3QgX3NpemUgPSBhcGkuZGVyZWYoc2l6ZSk7XG4gICAgICAgICAgICBpZiAocGFydGlhbCB8fCBidWYubGVuZ3RoID49IF9zaXplKSB7XG4gICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmKTtcbiAgICAgICAgICAgICAgICBidWYgPSBidWYuc2xpY2UoYnVmLmxlbmd0aCA+PSBfc2l6ZSA/IDEgOiAwLCBfc2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzdHJlYW1TaHVmZmxlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKHN0cmVhbVNodWZmbGUsIGFyZ3MsIGl0ZXJhdG9yKSB8fFxuICAgICAgICAoKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbiA9IGFyZ3NbMF07XG4gICAgICAgICAgICBjb25zdCBtYXhTd2FwcyA9IGFyZ3NbMV0gfHwgbjtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGJ1Zi5sZW5ndGggJiYgIWlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJheXMuc2h1ZmZsZShidWYsIG1heFN3YXBzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1Zi5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBhY2MgPSBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBidWYucHVzaCh4KTtcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlzLnNodWZmbGUoYnVmLCBtYXhTd2Fwcyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWYubGVuZ3RoID09PSBuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiBzdHJlYW1Tb3J0KC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIoc3RyZWFtU29ydCwgYXJncywgaXRlcmF0b3IpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCB7IGtleSwgY29tcGFyZSB9ID0gX19zb3J0T3B0cyhhcmdzWzFdKTtcbiAgICBjb25zdCBuID0gYXJnc1swXTtcbiAgICByZXR1cm4gKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICBjb25zdCBidWYgPSBbXTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICBfX2RyYWluKGJ1ZiwgY29tcGxldGUsIHJlZHVjZSksXG4gICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWR4ID0gYXJyYXlzLmJpbmFyeVNlYXJjaChidWYsIHgsIGtleSwgY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgYnVmLnNwbGljZShpZHggPCAwID8gLShpZHggKyAxKSA6IGlkeCwgMCwgeCk7XG4gICAgICAgICAgICAgICAgaWYgKGJ1Zi5sZW5ndGggPT09IG4pIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHN0cnVjdChmaWVsZHMpLCBzcmMpXG4gICAgICAgIDogY29tcChwYXJ0aXRpb25PZihmaWVsZHMubWFwKChmKSA9PiBmWzFdKSksIHBhcnRpdGlvbihmaWVsZHMubGVuZ3RoKSwgcmVuYW1lKGZpZWxkcy5tYXAoKGYpID0+IGZbMF0pKSwgbWFwS2V5cyhmaWVsZHMucmVkdWNlKChhY2MsIGYpID0+IChmWzJdID8gKChhY2NbZlswXV0gPSBmWzJdKSwgYWNjKSA6IGFjYyksIHt9KSwgZmFsc2UpKTtcbn1cblxuZnVuY3Rpb24gc3dpenpsZShvcmRlciwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEoc3dpenpsZShvcmRlciksIHNyYylcbiAgICAgICAgOiBtYXAoYXJyYXlzLnN3aXp6bGUob3JkZXIpKTtcbn1cblxuZnVuY3Rpb24gdGFrZU50aChuLCBzcmMpIHtcbiAgICBpZiAoY2hlY2tzLmlzSXRlcmFibGUoc3JjKSkge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3IxKHRha2VOdGgobiksIHNyYyk7XG4gICAgfVxuICAgIG4gPSBtYXRoLmNsYW1wMChuIC0gMSk7XG4gICAgcmV0dXJuIHRocm90dGxlKCgpID0+IHtcbiAgICAgICAgbGV0IHNraXAgPSAwO1xuICAgICAgICByZXR1cm4gKCkgPT4gKHNraXAgPT09IDAgPyAoKHNraXAgPSBuKSwgdHJ1ZSkgOiAoc2tpcC0tLCBmYWxzZSkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0YWtlV2hpbGUoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIodGFrZVdoaWxlLCBhcmdzKSB8fFxuICAgICAgICAoKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IHByZWQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgbGV0IG9rID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IChvayA9IG9rICYmIHByZWQoeCkpID8gcihhY2MsIHgpIDogcmVkdWNlZChhY2MpKTtcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiB0aHJvdHRsZVRpbWUoZGVsYXksIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IxKHRocm90dGxlVGltZShkZWxheSksIHNyYylcbiAgICAgICAgOiB0aHJvdHRsZSgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGFzdCA9IDA7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0IC0gbGFzdCA+PSBkZWxheSA/ICgobGFzdCA9IHQpLCB0cnVlKSA6IGZhbHNlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvZ2dsZShvbiwgb2ZmLCBpbml0aWFsID0gZmFsc2UsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IxKHRvZ2dsZShvbiwgb2ZmLCBpbml0aWFsKSwgc3JjKVxuICAgICAgICA6IChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgICAgIGxldCBzdGF0ZSA9IGluaXRpYWw7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgY29tcGxldGUsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4gcmVkdWNlKGFjYywgKHN0YXRlID0gIXN0YXRlKSA/IG9uIDogb2ZmKSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH07XG59XG5cbmNvbnN0IHRyYWNlID0gKHByZWZpeCA9IFwiXCIpID0+IHNpZGVFZmZlY3QoKHgpID0+IGNvbnNvbGUubG9nKHByZWZpeCwgeCkpO1xuXG5mdW5jdGlvbiB3b3JkV3JhcCguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKHdvcmRXcmFwLCBhcmdzLCBpdGVyYXRvcik7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IGxpbmVMZW5ndGggPSBhcmdzWzBdO1xuICAgIGNvbnN0IHsgZGVsaW0sIGFsd2F5cyB9ID0gT2JqZWN0LmFzc2lnbih7IGRlbGltOiAxLCBhbHdheXM6IHRydWUgfSwgYXJnc1sxXSk7XG4gICAgcmV0dXJuIHBhcnRpdGlvbkJ5KCgpID0+IHtcbiAgICAgICAgbGV0IG4gPSAwO1xuICAgICAgICBsZXQgZmxhZyA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gKHcpID0+IHtcbiAgICAgICAgICAgIG4gKz0gdy5sZW5ndGggKyBkZWxpbTtcbiAgICAgICAgICAgIGlmIChuID4gbGluZUxlbmd0aCArIChhbHdheXMgPyAwIDogZGVsaW0pKSB7XG4gICAgICAgICAgICAgICAgZmxhZyA9ICFmbGFnO1xuICAgICAgICAgICAgICAgIG4gPSB3Lmxlbmd0aCArIGRlbGltO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZsYWc7XG4gICAgICAgIH07XG4gICAgfSwgdHJ1ZSk7XG59XG5cbmNvbnN0IGxvb2t1cDFkID0gKHNyYykgPT4gKGkpID0+IHNyY1tpXTtcbmNvbnN0IGxvb2t1cDJkID0gKHNyYywgd2lkdGgpID0+IChpKSA9PiBzcmNbaVswXSArIGlbMV0gKiB3aWR0aF07XG5jb25zdCBsb29rdXAzZCA9IChzcmMsIHdpZHRoLCBoZWlnaHQpID0+IHtcbiAgICBjb25zdCBzdHJpZGV6ID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgcmV0dXJuIChpKSA9PiBzcmNbaVswXSArIGlbMV0gKiB3aWR0aCArIGlbMl0gKiBzdHJpZGV6XTtcbn07XG5cbmZ1bmN0aW9uKiBhc0l0ZXJhYmxlKHNyYykge1xuICAgIHlpZWxkKiBzcmM7XG59XG5cbmZ1bmN0aW9uKiByZXBlYXRlZGx5KGZuLCBuID0gSW5maW5pdHkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB5aWVsZCBmbihpKTtcbiAgICB9XG59XG5cbmNvbnN0IGNob2ljZXMgPSAoY2hvaWNlcywgd2VpZ2h0cywgcm5kID0gcmFuZG9tLlNZU1RFTSkgPT4gcmVwZWF0ZWRseSh3ZWlnaHRzXG4gICAgPyByYW5kb20ud2VpZ2h0ZWRSYW5kb20oYXJyYXlzLmVuc3VyZUFycmF5KGNob2ljZXMpLCB3ZWlnaHRzLCBybmQpXG4gICAgOiAoKSA9PiBjaG9pY2VzW3JuZC5mbG9hdChjaG9pY2VzLmxlbmd0aCkgfCAwXSk7XG5cbmZ1bmN0aW9uKiBjb25jYXQoLi4ueHMpIHtcbiAgICBmb3IgKGxldCB4IG9mIHhzKSB7XG4gICAgICAgIHggIT0gbnVsbCAmJiAoeWllbGQqIGFycmF5cy5lbnN1cmVJdGVyYWJsZSh4KSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogY3VydmUoc3RhcnQsIGVuZCwgc3RlcHMgPSAxMCwgcmF0ZSA9IDAuMSkge1xuICAgIGNvbnN0IGMgPSBNYXRoLmV4cCgtTWF0aC5sb2coKE1hdGguYWJzKGVuZCAtIHN0YXJ0KSArIHJhdGUpIC8gcmF0ZSkgLyBzdGVwcyk7XG4gICAgY29uc3Qgb2Zmc2V0ID0gKHN0YXJ0IDwgZW5kID8gZW5kICsgcmF0ZSA6IGVuZCAtIHJhdGUpICogKDEgLSBjKTtcbiAgICBzdGVwcyA+IDAgJiYgKHlpZWxkIHN0YXJ0KTtcbiAgICBmb3IgKGxldCB4ID0gc3RhcnQ7IC0tc3RlcHMgPj0gMDspIHtcbiAgICAgICAgeWllbGQgKHggPSBvZmZzZXQgKyB4ICogYyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogY3ljbGUoaW5wdXQsIG51bSA9IEluZmluaXR5KSB7XG4gICAgaWYgKG51bSA8IDEpXG4gICAgICAgIHJldHVybjtcbiAgICBsZXQgY2FjaGUgPSBbXTtcbiAgICBmb3IgKGxldCBpIG9mIGlucHV0KSB7XG4gICAgICAgIGNhY2hlLnB1c2goaSk7XG4gICAgICAgIHlpZWxkIGk7XG4gICAgfVxuICAgIGlmIChjYWNoZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHdoaWxlICgtLW51bSA+IDApIHtcbiAgICAgICAgICAgIHlpZWxkKiBjYWNoZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZHVwKHgpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzU3RyaW5nKHgpXG4gICAgICAgID8geCArIHhcbiAgICAgICAgOiBjaGVja3MuaXNBcnJheSh4KVxuICAgICAgICAgICAgPyB4LmNvbmNhdCh4KVxuICAgICAgICAgICAgOiAoKHggPSBhcnJheXMuZW5zdXJlQXJyYXkoeCkpLCBjb25jYXQoeCwgeCkpO1xufVxuXG5mdW5jdGlvbiogcmVwZWF0KHgsIG4gPSBJbmZpbml0eSkge1xuICAgIHdoaWxlIChuLS0gPiAwKSB7XG4gICAgICAgIHlpZWxkIHg7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogZXh0ZW5kU2lkZXMoc3JjLCBudW1MZWZ0ID0gMSwgbnVtUmlnaHQgPSBudW1MZWZ0KSB7XG4gICAgbGV0IHByZXYgPSBhcGkuU0VNQVBIT1JFO1xuICAgIGZvciAobGV0IHggb2Ygc3JjKSB7XG4gICAgICAgIGlmIChudW1MZWZ0ID4gMCAmJiBwcmV2ID09PSBhcGkuU0VNQVBIT1JFKSB7XG4gICAgICAgICAgICB5aWVsZCogcmVwZWF0KHgsIG51bUxlZnQpO1xuICAgICAgICAgICAgbnVtTGVmdCA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgeDtcbiAgICAgICAgcHJldiA9IHg7XG4gICAgfVxuICAgIGlmIChudW1SaWdodCA+IDAgJiYgcHJldiAhPT0gYXBpLlNFTUFQSE9SRSkge1xuICAgICAgICB5aWVsZCogcmVwZWF0KHByZXYsIG51bVJpZ2h0KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBpdGVyYXRlKGZuLCBzZWVkLCBudW0gPSBJbmZpbml0eSkge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IG51bTsgaSsrKSB7XG4gICAgICAgIHlpZWxkIHNlZWQ7XG4gICAgICAgIHNlZWQgPSBmbihzZWVkLCBpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBwYWlycyh4KSB7XG4gICAgZm9yIChsZXQgayBpbiB4KSB7XG4gICAgICAgIGlmICh4Lmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICB5aWVsZCBbaywgeFtrXV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBwZXJtdXRhdGlvbnMoLi4uc3JjKSB7XG4gICAgY29uc3QgbiA9IHNyYy5sZW5ndGggLSAxO1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHN0ZXAgPSBuZXcgQXJyYXkobiArIDEpLmZpbGwoMCk7XG4gICAgY29uc3QgcmVhbGl6ZWQgPSBzcmMubWFwKGFycmF5cy5lbnN1cmVBcnJheUxpa2UpO1xuICAgIGNvbnN0IHRvdGFsID0gcmVhbGl6ZWQucmVkdWNlKChhY2MsIHgpID0+IGFjYyAqIHgubGVuZ3RoLCAxKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsOyBpKyspIHtcbiAgICAgICAgY29uc3QgdHVwbGUgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IG47IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICBjb25zdCByID0gcmVhbGl6ZWRbal07XG4gICAgICAgICAgICBsZXQgcyA9IHN0ZXBbal07XG4gICAgICAgICAgICBpZiAocyA9PT0gci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzdGVwW2pdID0gcyA9IDA7XG4gICAgICAgICAgICAgICAgaiA+IDAgJiYgc3RlcFtqIC0gMV0rKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR1cGxlW2pdID0gcltzXTtcbiAgICAgICAgfVxuICAgICAgICBzdGVwW25dKys7XG4gICAgICAgIHlpZWxkIHR1cGxlO1xuICAgIH1cbn1cbmNvbnN0IHBlcm11dGF0aW9uc04gPSAobiwgbSA9IG4sIG9mZnNldHMpID0+IHtcbiAgICBpZiAob2Zmc2V0cyAmJiBvZmZzZXRzLmxlbmd0aCA8IG4pIHtcbiAgICAgICAgZXJyb3JzLmlsbGVnYWxBcmdzKGBpbnN1ZmZpY2llbnQgb2Zmc2V0cywgZ290ICR7b2Zmc2V0cy5sZW5ndGh9LCBuZWVkZWQgJHtufWApO1xuICAgIH1cbiAgICBjb25zdCBzZXFzID0gW107XG4gICAgd2hpbGUgKC0tbiA+PSAwKSB7XG4gICAgICAgIGNvbnN0IG8gPSBvZmZzZXRzID8gb2Zmc2V0c1tuXSA6IDA7XG4gICAgICAgIHNlcXNbbl0gPSByYW5nZShvLCBvICsgbSk7XG4gICAgfVxuICAgIHJldHVybiBwZXJtdXRhdGlvbnMuYXBwbHkobnVsbCwgc2Vxcyk7XG59O1xuXG5jb25zdCBrZXlQZXJtdXRhdGlvbnMgPSAoc3BlYykgPT4gKG1hcCgoeCkgPT4gYXNzb2NPYmoocGFydGl0aW9uKDIsIHgpKSwgcGVybXV0YXRpb25zKC4uLm1hcGNhdCgoW2ssIHZdKSA9PiBbW2tdLCB2XSwgcGFpcnMoc3BlYykpKSkpO1xuXG5mdW5jdGlvbioga2V5cyh4KSB7XG4gICAgZm9yIChsZXQgayBpbiB4KSB7XG4gICAgICAgIGlmICh4Lmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICB5aWVsZCBrO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBsaW5lID0gKHN0YXJ0LCBlbmQsIHN0ZXBzID0gMTApID0+IHtcbiAgICBjb25zdCBkZWx0YSA9IGVuZCAtIHN0YXJ0O1xuICAgIHJldHVybiBtYXAoKHQpID0+IHN0YXJ0ICsgZGVsdGEgKiB0LCBub3JtUmFuZ2Uoc3RlcHMpKTtcbn07XG5cbmNvbnN0IHBhZFNpZGVzID0gKHNyYywgeCwgbnVtTGVmdCA9IDEsIG51bVJpZ2h0ID0gbnVtTGVmdCkgPT4gbnVtTGVmdCA+IDBcbiAgICA/IG51bVJpZ2h0ID4gMFxuICAgICAgICA/IGNvbmNhdChyZXBlYXQoeCwgbnVtTGVmdCksIHNyYywgcmVwZWF0KHgsIG51bVJpZ2h0KSlcbiAgICAgICAgOiBjb25jYXQocmVwZWF0KHgsIG51bUxlZnQpLCBzcmMpXG4gICAgOiBudW1SaWdodCA+IDBcbiAgICAgICAgPyBjb25jYXQoc3JjLCByZXBlYXQoeCwgbnVtUmlnaHQpKVxuICAgICAgICA6IGNvbmNhdChzcmMpO1xuXG5mdW5jdGlvbiogcmV2ZXJzZShpbnB1dCkge1xuICAgIGNvbnN0IF9pbnB1dCA9IGFycmF5cy5lbnN1cmVBcnJheShpbnB1dCk7XG4gICAgbGV0IG4gPSBfaW5wdXQubGVuZ3RoO1xuICAgIHdoaWxlICgtLW4gPj0gMCkge1xuICAgICAgICB5aWVsZCBfaW5wdXRbbl07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwYWxpbmRyb21lKHgpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzU3RyaW5nKHgpXG4gICAgICAgID8gc3RyKFwiXCIsIGNvbmNhdChbeF0sIHJldmVyc2UoeCkpKVxuICAgICAgICA6IGNoZWNrcy5pc0FycmF5KHgpXG4gICAgICAgICAgICA/IHguY29uY2F0KHguc2xpY2UoKS5yZXZlcnNlKCkpXG4gICAgICAgICAgICA6ICgoeCA9IGFycmF5cy5lbnN1cmVBcnJheSh4KSksIGNvbmNhdCh4LCByZXZlcnNlKHgpKSk7XG59XG5cbmZ1bmN0aW9uKiByYW5nZTNkKC4uLmFyZ3MpIHtcbiAgICBsZXQgZnJvbVgsIHRvWCwgc3RlcFg7XG4gICAgbGV0IGZyb21ZLCB0b1ksIHN0ZXBZO1xuICAgIGxldCBmcm9tWiwgdG9aLCBzdGVwWjtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIHN0ZXBYID0gYXJnc1s2XTtcbiAgICAgICAgICAgIHN0ZXBZID0gYXJnc1s3XTtcbiAgICAgICAgICAgIHN0ZXBaID0gYXJnc1s4XTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgW2Zyb21YLCB0b1gsIGZyb21ZLCB0b1ksIGZyb21aLCB0b1pdID0gYXJncztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICBbdG9YLCB0b1ksIHRvWl0gPSBhcmdzO1xuICAgICAgICAgICAgZnJvbVggPSBmcm9tWSA9IGZyb21aID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZXJyb3JzLmlsbGVnYWxBcml0eShhcmdzLmxlbmd0aCk7XG4gICAgfVxuICAgIGNvbnN0IHJ4ID0gcmFuZ2UoZnJvbVgsIHRvWCwgc3RlcFgpO1xuICAgIGNvbnN0IHJ5ID0gcmFuZ2UoZnJvbVksIHRvWSwgc3RlcFkpO1xuICAgIGZvciAobGV0IHogb2YgcmFuZ2UoZnJvbVosIHRvWiwgc3RlcFopKSB7XG4gICAgICAgIGZvciAobGV0IHkgb2YgcnkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggb2YgcngpIHtcbiAgICAgICAgICAgICAgICB5aWVsZCBbeCwgeSwgel07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHJhbmdlTmQgPSAobWluLCBtYXgpID0+IHBlcm11dGF0aW9ucy5hcHBseShudWxsLCAoKG1heFxuICAgID8gWy4uLm1hcCgoW2EsIGJdKSA9PiByYW5nZShhLCBiKSwgemlwKG1pbiwgbWF4KSldXG4gICAgOiBbLi4ubWFwKHJhbmdlLCBtaW4pXSkpKTtcblxuZnVuY3Rpb24qIHNvcnRlZEtleXMoeCwgY21wID0gY29tcGFyZS5jb21wYXJlKSB7XG4gICAgeWllbGQqIE9iamVjdC5rZXlzKHgpLnNvcnQoY21wKTtcbn1cblxuZnVuY3Rpb24qIHN5bW1ldHJpYyhzcmMpIHtcbiAgICBsZXQgaGVhZCA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKGxldCB4IG9mIHNyYykge1xuICAgICAgICBoZWFkID0geyB4LCBuOiBoZWFkIH07XG4gICAgICAgIHlpZWxkIHg7XG4gICAgfVxuICAgIHdoaWxlIChoZWFkKSB7XG4gICAgICAgIHlpZWxkIGhlYWQueDtcbiAgICAgICAgaGVhZCA9IGhlYWQubjtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiB0d2VlbihvcHRzKSB7XG4gICAgY29uc3QgeyBtaW4sIG1heCwgbnVtLCBpbml0LCBtaXgsIHN0b3BzIH0gPSBvcHRzO1xuICAgIGNvbnN0IGVhc2luZyA9IG9wdHMuZWFzaW5nIHx8ICgoeCkgPT4geCk7XG4gICAgbGV0IGwgPSBzdG9wcy5sZW5ndGg7XG4gICAgaWYgKGwgPCAxKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKGwgPT09IDEpIHtcbiAgICAgICAgeWllbGQqIHJlcGVhdChtaXgoaW5pdChzdG9wc1swXVsxXSwgc3RvcHNbMF1bMV0pLCAwKSwgbnVtKTtcbiAgICB9XG4gICAgc3RvcHMuc29ydCgoYSwgYikgPT4gYVswXSAtIGJbMF0pO1xuICAgIHN0b3BzW2wgLSAxXVswXSA8IG1heCAmJiBzdG9wcy5wdXNoKFttYXgsIHN0b3BzW2wgLSAxXVsxXV0pO1xuICAgIHN0b3BzWzBdWzBdID4gbWluICYmIHN0b3BzLnVuc2hpZnQoW21pbiwgc3RvcHNbMF1bMV1dKTtcbiAgICBjb25zdCByYW5nZSA9IG1heCAtIG1pbjtcbiAgICBsZXQgc3RhcnQgPSBzdG9wc1swXVswXTtcbiAgICBsZXQgZW5kID0gc3RvcHNbMV1bMF07XG4gICAgbGV0IGRlbHRhID0gZW5kIC0gc3RhcnQ7XG4gICAgbGV0IGludGVydmFsID0gaW5pdChzdG9wc1swXVsxXSwgc3RvcHNbMV1bMV0pO1xuICAgIGxldCBpID0gMTtcbiAgICBsID0gc3RvcHMubGVuZ3RoO1xuICAgIGZvciAobGV0IHQgb2Ygbm9ybVJhbmdlKG51bSkpIHtcbiAgICAgICAgdCA9IG1pbiArIHJhbmdlICogdDtcbiAgICAgICAgaWYgKHQgPiBlbmQpIHtcbiAgICAgICAgICAgIHdoaWxlIChpIDwgbCAmJiB0ID4gc3RvcHNbaV1bMF0pXG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgc3RhcnQgPSBzdG9wc1tpIC0gMV1bMF07XG4gICAgICAgICAgICBlbmQgPSBzdG9wc1tpXVswXTtcbiAgICAgICAgICAgIGRlbHRhID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgICAgICBpbnRlcnZhbCA9IGluaXQoc3RvcHNbaSAtIDFdWzFdLCBzdG9wc1tpXVsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQgbWl4KGludGVydmFsLCBlYXNpbmcoZGVsdGEgIT09IDAgPyAodCAtIHN0YXJ0KSAvIGRlbHRhIDogMCkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24qIHZhbHMoeCkge1xuICAgIGZvciAobGV0IGsgaW4geCkge1xuICAgICAgICBpZiAoeC5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgeWllbGQgeFtrXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24qIHdyYXBTaWRlcyhzcmMsIG51bUxlZnQgPSAxLCBudW1SaWdodCA9IG51bUxlZnQpIHtcbiAgICBjb25zdCBfc3JjID0gYXJyYXlzLmVuc3VyZUFycmF5KHNyYyk7XG4gICAgIShtYXRoLmluUmFuZ2UobnVtTGVmdCwgMCwgX3NyYy5sZW5ndGgpICYmIG1hdGguaW5SYW5nZShudW1SaWdodCwgMCwgX3NyYy5sZW5ndGgpKSAmJlxuICAgICAgICBlcnJvcnMuaWxsZWdhbEFyZ3MoYGFsbG93ZWQgd3JhcCByYW5nZTogWzAuLiR7X3NyYy5sZW5ndGh9XWApO1xuICAgIGlmIChudW1MZWZ0ID4gMCkge1xuICAgICAgICBmb3IgKGxldCBtID0gX3NyYy5sZW5ndGgsIGkgPSBtIC0gbnVtTGVmdDsgaSA8IG07IGkrKykge1xuICAgICAgICAgICAgeWllbGQgX3NyY1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB5aWVsZCogX3NyYztcbiAgICBpZiAobnVtUmlnaHQgPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtUmlnaHQ7IGkrKykge1xuICAgICAgICAgICAgeWllbGQgX3NyY1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0cy4kJHJlZHVjZSA9ICQkcmVkdWNlO1xuZXhwb3J0cy4kaXRlciA9ICRpdGVyO1xuZXhwb3J0cy5SYW5nZSA9IFJhbmdlO1xuZXhwb3J0cy5SZWR1Y2VkID0gUmVkdWNlZDtcbmV4cG9ydHMuYWRkID0gYWRkO1xuZXhwb3J0cy5hc0l0ZXJhYmxlID0gYXNJdGVyYWJsZTtcbmV4cG9ydHMuYXNzb2NNYXAgPSBhc3NvY01hcDtcbmV4cG9ydHMuYXNzb2NPYmogPSBhc3NvY09iajtcbmV4cG9ydHMuYXV0b09iaiA9IGF1dG9PYmo7XG5leHBvcnRzLmJlbmNobWFyayA9IGJlbmNobWFyaztcbmV4cG9ydHMuYnVpbGRLZXJuZWwxZCA9IGJ1aWxkS2VybmVsMWQ7XG5leHBvcnRzLmJ1aWxkS2VybmVsMmQgPSBidWlsZEtlcm5lbDJkO1xuZXhwb3J0cy5jYXQgPSBjYXQ7XG5leHBvcnRzLmNob2ljZXMgPSBjaG9pY2VzO1xuZXhwb3J0cy5jb21wID0gY29tcDtcbmV4cG9ydHMuY29tcFIgPSBjb21wUjtcbmV4cG9ydHMuY29uY2F0ID0gY29uY2F0O1xuZXhwb3J0cy5jb25qID0gY29uajtcbmV4cG9ydHMuY29udmVyZ2UgPSBjb252ZXJnZTtcbmV4cG9ydHMuY29udm9sdmUxZCA9IGNvbnZvbHZlMWQ7XG5leHBvcnRzLmNvbnZvbHZlMmQgPSBjb252b2x2ZTJkO1xuZXhwb3J0cy5jb3VudCA9IGNvdW50O1xuZXhwb3J0cy5jdXJ2ZSA9IGN1cnZlO1xuZXhwb3J0cy5jeWNsZSA9IGN5Y2xlO1xuZXhwb3J0cy5kZWR1cGUgPSBkZWR1cGU7XG5leHBvcnRzLmRlZXBUcmFuc2Zvcm0gPSBkZWVwVHJhbnNmb3JtO1xuZXhwb3J0cy5kZWxheWVkID0gZGVsYXllZDtcbmV4cG9ydHMuZGlzdGluY3QgPSBkaXN0aW5jdDtcbmV4cG9ydHMuZGl2ID0gZGl2O1xuZXhwb3J0cy5kcm9wID0gZHJvcDtcbmV4cG9ydHMuZHJvcE50aCA9IGRyb3BOdGg7XG5leHBvcnRzLmRyb3BXaGlsZSA9IGRyb3BXaGlsZTtcbmV4cG9ydHMuZHVwID0gZHVwO1xuZXhwb3J0cy5kdXBsaWNhdGUgPSBkdXBsaWNhdGU7XG5leHBvcnRzLmVuc3VyZVJlZHVjZWQgPSBlbnN1cmVSZWR1Y2VkO1xuZXhwb3J0cy5ldmVyeSA9IGV2ZXJ5O1xuZXhwb3J0cy5leHRlbmRTaWRlcyA9IGV4dGVuZFNpZGVzO1xuZXhwb3J0cy5maWxsID0gZmlsbDtcbmV4cG9ydHMuZmlsbE4gPSBmaWxsTjtcbmV4cG9ydHMuZmlsdGVyID0gZmlsdGVyO1xuZXhwb3J0cy5maWx0ZXJGdXp6eSA9IGZpbHRlckZ1enp5O1xuZXhwb3J0cy5mbGF0dGVuID0gZmxhdHRlbjtcbmV4cG9ydHMuZmxhdHRlbldpdGggPSBmbGF0dGVuV2l0aDtcbmV4cG9ydHMuZnJlcXVlbmNpZXMgPSBmcmVxdWVuY2llcztcbmV4cG9ydHMuZ3JvdXBCaW5hcnkgPSBncm91cEJpbmFyeTtcbmV4cG9ydHMuZ3JvdXBCeU1hcCA9IGdyb3VwQnlNYXA7XG5leHBvcnRzLmdyb3VwQnlPYmogPSBncm91cEJ5T2JqO1xuZXhwb3J0cy5pbmRleGVkID0gaW5kZXhlZDtcbmV4cG9ydHMuaW50ZXJsZWF2ZSA9IGludGVybGVhdmU7XG5leHBvcnRzLmludGVycG9sYXRlID0gaW50ZXJwb2xhdGU7XG5leHBvcnRzLmludGVycG9sYXRlSGVybWl0ZSA9IGludGVycG9sYXRlSGVybWl0ZTtcbmV4cG9ydHMuaW50ZXJwb2xhdGVMaW5lYXIgPSBpbnRlcnBvbGF0ZUxpbmVhcjtcbmV4cG9ydHMuaW50ZXJwb3NlID0gaW50ZXJwb3NlO1xuZXhwb3J0cy5pc1JlZHVjZWQgPSBpc1JlZHVjZWQ7XG5leHBvcnRzLml0ZXJhdGUgPSBpdGVyYXRlO1xuZXhwb3J0cy5pdGVyYXRvciA9IGl0ZXJhdG9yO1xuZXhwb3J0cy5pdGVyYXRvcjEgPSBpdGVyYXRvcjE7XG5leHBvcnRzLmp1eHRSID0ganV4dFI7XG5leHBvcnRzLmtlZXAgPSBrZWVwO1xuZXhwb3J0cy5rZXlQZXJtdXRhdGlvbnMgPSBrZXlQZXJtdXRhdGlvbnM7XG5leHBvcnRzLmtleVNlbGVjdG9yID0ga2V5U2VsZWN0b3I7XG5leHBvcnRzLmtleXMgPSBrZXlzO1xuZXhwb3J0cy5sYWJlbGVkID0gbGFiZWxlZDtcbmV4cG9ydHMubGFzdCA9IGxhc3Q7XG5leHBvcnRzLmxpbmUgPSBsaW5lO1xuZXhwb3J0cy5sb29rdXAxZCA9IGxvb2t1cDFkO1xuZXhwb3J0cy5sb29rdXAyZCA9IGxvb2t1cDJkO1xuZXhwb3J0cy5sb29rdXAzZCA9IGxvb2t1cDNkO1xuZXhwb3J0cy5tYXAgPSBtYXA7XG5leHBvcnRzLm1hcERlZXAgPSBtYXBEZWVwO1xuZXhwb3J0cy5tYXBJbmRleGVkID0gbWFwSW5kZXhlZDtcbmV4cG9ydHMubWFwS2V5cyA9IG1hcEtleXM7XG5leHBvcnRzLm1hcE50aCA9IG1hcE50aDtcbmV4cG9ydHMubWFwVmFscyA9IG1hcFZhbHM7XG5leHBvcnRzLm1hcGNhdCA9IG1hcGNhdDtcbmV4cG9ydHMubWFwY2F0SW5kZXhlZCA9IG1hcGNhdEluZGV4ZWQ7XG5leHBvcnRzLm1hdGNoRmlyc3QgPSBtYXRjaEZpcnN0O1xuZXhwb3J0cy5tYXRjaExhc3QgPSBtYXRjaExhc3Q7XG5leHBvcnRzLm1heCA9IG1heDtcbmV4cG9ydHMubWF4Q29tcGFyZSA9IG1heENvbXBhcmU7XG5leHBvcnRzLm1heE1hZyA9IG1heE1hZztcbmV4cG9ydHMubWVhbiA9IG1lYW47XG5leHBvcnRzLm1pbiA9IG1pbjtcbmV4cG9ydHMubWluQ29tcGFyZSA9IG1pbkNvbXBhcmU7XG5leHBvcnRzLm1pbk1hZyA9IG1pbk1hZztcbmV4cG9ydHMubWluTWF4ID0gbWluTWF4O1xuZXhwb3J0cy5tb3ZpbmdBdmVyYWdlID0gbW92aW5nQXZlcmFnZTtcbmV4cG9ydHMubW92aW5nTWVkaWFuID0gbW92aW5nTWVkaWFuO1xuZXhwb3J0cy5tdWwgPSBtdWw7XG5leHBvcnRzLm11bHRpcGxleCA9IG11bHRpcGxleDtcbmV4cG9ydHMubXVsdGlwbGV4T2JqID0gbXVsdGlwbGV4T2JqO1xuZXhwb3J0cy5ub29wID0gbm9vcDtcbmV4cG9ydHMubm9ybUNvdW50ID0gbm9ybUNvdW50O1xuZXhwb3J0cy5ub3JtRnJlcXVlbmNpZXMgPSBub3JtRnJlcXVlbmNpZXM7XG5leHBvcnRzLm5vcm1GcmVxdWVuY2llc0F1dG8gPSBub3JtRnJlcXVlbmNpZXNBdXRvO1xuZXhwb3J0cy5ub3JtUmFuZ2UgPSBub3JtUmFuZ2U7XG5leHBvcnRzLm5vcm1SYW5nZTJkID0gbm9ybVJhbmdlMmQ7XG5leHBvcnRzLm5vcm1SYW5nZTNkID0gbm9ybVJhbmdlM2Q7XG5leHBvcnRzLnBhZExhc3QgPSBwYWRMYXN0O1xuZXhwb3J0cy5wYWRTaWRlcyA9IHBhZFNpZGVzO1xuZXhwb3J0cy5wYWdlID0gcGFnZTtcbmV4cG9ydHMucGFpcnMgPSBwYWlycztcbmV4cG9ydHMucGFsaW5kcm9tZSA9IHBhbGluZHJvbWU7XG5leHBvcnRzLnBhcnRpdGlvbiA9IHBhcnRpdGlvbjtcbmV4cG9ydHMucGFydGl0aW9uQnkgPSBwYXJ0aXRpb25CeTtcbmV4cG9ydHMucGFydGl0aW9uT2YgPSBwYXJ0aXRpb25PZjtcbmV4cG9ydHMucGFydGl0aW9uU29ydCA9IHBhcnRpdGlvblNvcnQ7XG5leHBvcnRzLnBhcnRpdGlvblN5bmMgPSBwYXJ0aXRpb25TeW5jO1xuZXhwb3J0cy5wYXJ0aXRpb25UaW1lID0gcGFydGl0aW9uVGltZTtcbmV4cG9ydHMucGFydGl0aW9uV2hlbiA9IHBhcnRpdGlvbldoZW47XG5leHBvcnRzLnBlZWsgPSBwZWVrO1xuZXhwb3J0cy5wZXJtdXRhdGlvbnMgPSBwZXJtdXRhdGlvbnM7XG5leHBvcnRzLnBlcm11dGF0aW9uc04gPSBwZXJtdXRhdGlvbnNOO1xuZXhwb3J0cy5wbHVjayA9IHBsdWNrO1xuZXhwb3J0cy5wdXNoID0gcHVzaDtcbmV4cG9ydHMucHVzaENvcHkgPSBwdXNoQ29weTtcbmV4cG9ydHMucHVzaFNvcnQgPSBwdXNoU29ydDtcbmV4cG9ydHMucmFuZ2UgPSByYW5nZTtcbmV4cG9ydHMucmFuZ2UyZCA9IHJhbmdlMmQ7XG5leHBvcnRzLnJhbmdlM2QgPSByYW5nZTNkO1xuZXhwb3J0cy5yYW5nZU5kID0gcmFuZ2VOZDtcbmV4cG9ydHMucmVkdWNlID0gcmVkdWNlO1xuZXhwb3J0cy5yZWR1Y2VSaWdodCA9IHJlZHVjZVJpZ2h0O1xuZXhwb3J0cy5yZWR1Y2VkID0gcmVkdWNlZDtcbmV4cG9ydHMucmVkdWNlciA9IHJlZHVjZXI7XG5leHBvcnRzLnJlZHVjdGlvbnMgPSByZWR1Y3Rpb25zO1xuZXhwb3J0cy5yZW5hbWUgPSByZW5hbWU7XG5leHBvcnRzLnJlbmFtZXIgPSByZW5hbWVyO1xuZXhwb3J0cy5yZXBlYXQgPSByZXBlYXQ7XG5leHBvcnRzLnJlcGVhdGVkbHkgPSByZXBlYXRlZGx5O1xuZXhwb3J0cy5yZXZlcnNlID0gcmV2ZXJzZTtcbmV4cG9ydHMucnVuID0gcnVuO1xuZXhwb3J0cy5zYW1wbGUgPSBzYW1wbGU7XG5leHBvcnRzLnNjYW4gPSBzY2FuO1xuZXhwb3J0cy5zZWxlY3RLZXlzID0gc2VsZWN0S2V5cztcbmV4cG9ydHMuc2lkZUVmZmVjdCA9IHNpZGVFZmZlY3Q7XG5leHBvcnRzLnNsaWRpbmdXaW5kb3cgPSBzbGlkaW5nV2luZG93O1xuZXhwb3J0cy5zb21lID0gc29tZTtcbmV4cG9ydHMuc29ydGVkS2V5cyA9IHNvcnRlZEtleXM7XG5leHBvcnRzLnN0ZXAgPSBzdGVwO1xuZXhwb3J0cy5zdHIgPSBzdHI7XG5leHBvcnRzLnN0cmVhbVNodWZmbGUgPSBzdHJlYW1TaHVmZmxlO1xuZXhwb3J0cy5zdHJlYW1Tb3J0ID0gc3RyZWFtU29ydDtcbmV4cG9ydHMuc3RydWN0ID0gc3RydWN0O1xuZXhwb3J0cy5zdWIgPSBzdWI7XG5leHBvcnRzLnN3aXp6bGUgPSBzd2l6emxlO1xuZXhwb3J0cy5zeW1tZXRyaWMgPSBzeW1tZXRyaWM7XG5leHBvcnRzLnRha2UgPSB0YWtlO1xuZXhwb3J0cy50YWtlTGFzdCA9IHRha2VMYXN0O1xuZXhwb3J0cy50YWtlTnRoID0gdGFrZU50aDtcbmV4cG9ydHMudGFrZVdoaWxlID0gdGFrZVdoaWxlO1xuZXhwb3J0cy50aHJvdHRsZSA9IHRocm90dGxlO1xuZXhwb3J0cy50aHJvdHRsZVRpbWUgPSB0aHJvdHRsZVRpbWU7XG5leHBvcnRzLnRvZ2dsZSA9IHRvZ2dsZTtcbmV4cG9ydHMudHJhY2UgPSB0cmFjZTtcbmV4cG9ydHMudHJhbnNkdWNlID0gdHJhbnNkdWNlO1xuZXhwb3J0cy50cmFuc2R1Y2VSaWdodCA9IHRyYW5zZHVjZVJpZ2h0O1xuZXhwb3J0cy50d2VlbiA9IHR3ZWVuO1xuZXhwb3J0cy51bnJlZHVjZWQgPSB1bnJlZHVjZWQ7XG5leHBvcnRzLnZhbHMgPSB2YWxzO1xuZXhwb3J0cy53b3JkV3JhcCA9IHdvcmRXcmFwO1xuZXhwb3J0cy53cmFwU2lkZXMgPSB3cmFwU2lkZXM7XG5leHBvcnRzLnppcCA9IHppcDtcbiIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0geyBfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5idWZmZXJcbiAgfVxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdvZmZzZXQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBsZW5ndGggKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICE9IG51bGwgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbkJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbkJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgfVxuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgfVxuXG4gIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWUgJiZcbiAgICBiICE9PSBCdWZmZXIucHJvdG90eXBlIC8vIHNvIEJ1ZmZlci5pc0J1ZmZlcihCdWZmZXIucHJvdG90eXBlKSB3aWxsIGJlIGZhbHNlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoaXNJbnN0YW5jZShhLCBVaW50OEFycmF5KSkgYSA9IEJ1ZmZlci5mcm9tKGEsIGEub2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gIGlmIChpc0luc3RhbmNlKGIsIFVpbnQ4QXJyYXkpKSBiID0gQnVmZmVyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwiYnVmMVwiLCBcImJ1ZjJcIiBhcmd1bWVudHMgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheSdcbiAgICApXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoaXNJbnN0YW5jZShidWYsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICBidWYgPSBCdWZmZXIuZnJvbShidWYpXG4gICAgfVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IGlzSW5zdGFuY2Uoc3RyaW5nLCBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2Ygc3RyaW5nXG4gICAgKVxuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIG11c3RNYXRjaCA9IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gPT09IHRydWUpXG4gIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkge1xuICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIH1cbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBGaW5hbGx5LCBzZWFyY2ggZWl0aGVyIGluZGV4T2YgKGlmIGRpciBpcyB0cnVlKSBvciBsYXN0SW5kZXhPZlxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMHhGRiAvLyBTZWFyY2ggZm9yIGEgYnl0ZSB2YWx1ZSBbMC0yNTVdXG4gICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXIgb3IgVWludDhBcnJheSBvYmplY3RzIGZyb20gb3RoZXIgY29udGV4dHMgKGkuZS4gaWZyYW1lcykgZG8gbm90IHBhc3Ncbi8vIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2sgYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgb2YgdGhhdCB0eXBlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTY2XG5mdW5jdGlvbiBpc0luc3RhbmNlIChvYmosIHR5cGUpIHtcbiAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHR5cGUgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT0gbnVsbCAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZSlcbn1cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgLy8gRm9yIElFMTEgc3VwcG9ydFxuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZGVzZWxlY3RDdXJyZW50ID0gcmVxdWlyZShcInRvZ2dsZS1zZWxlY3Rpb25cIik7XG5cbnZhciBjbGlwYm9hcmRUb0lFMTFGb3JtYXR0aW5nID0ge1xuICBcInRleHQvcGxhaW5cIjogXCJUZXh0XCIsXG4gIFwidGV4dC9odG1sXCI6IFwiVXJsXCIsXG4gIFwiZGVmYXVsdFwiOiBcIlRleHRcIlxufVxuXG52YXIgZGVmYXVsdE1lc3NhZ2UgPSBcIkNvcHkgdG8gY2xpcGJvYXJkOiAje2tleX0sIEVudGVyXCI7XG5cbmZ1bmN0aW9uIGZvcm1hdChtZXNzYWdlKSB7XG4gIHZhciBjb3B5S2V5ID0gKC9tYWMgb3MgeC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgPyBcIuKMmFwiIDogXCJDdHJsXCIpICsgXCIrQ1wiO1xuICByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKC8je1xccyprZXlcXHMqfS9nLCBjb3B5S2V5KTtcbn1cblxuZnVuY3Rpb24gY29weSh0ZXh0LCBvcHRpb25zKSB7XG4gIHZhciBkZWJ1ZyxcbiAgICBtZXNzYWdlLFxuICAgIHJlc2VsZWN0UHJldmlvdXMsXG4gICAgcmFuZ2UsXG4gICAgc2VsZWN0aW9uLFxuICAgIG1hcmssXG4gICAgc3VjY2VzcyA9IGZhbHNlO1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgZGVidWcgPSBvcHRpb25zLmRlYnVnIHx8IGZhbHNlO1xuICB0cnkge1xuICAgIHJlc2VsZWN0UHJldmlvdXMgPSBkZXNlbGVjdEN1cnJlbnQoKTtcblxuICAgIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgICBzZWxlY3Rpb24gPSBkb2N1bWVudC5nZXRTZWxlY3Rpb24oKTtcblxuICAgIG1hcmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBtYXJrLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAvLyByZXNldCB1c2VyIHN0eWxlcyBmb3Igc3BhbiBlbGVtZW50XG4gICAgbWFyay5zdHlsZS5hbGwgPSBcInVuc2V0XCI7XG4gICAgLy8gcHJldmVudHMgc2Nyb2xsaW5nIHRvIHRoZSBlbmQgb2YgdGhlIHBhZ2VcbiAgICBtYXJrLnN0eWxlLnBvc2l0aW9uID0gXCJmaXhlZFwiO1xuICAgIG1hcmsuc3R5bGUudG9wID0gMDtcbiAgICBtYXJrLnN0eWxlLmNsaXAgPSBcInJlY3QoMCwgMCwgMCwgMClcIjtcbiAgICAvLyB1c2VkIHRvIHByZXNlcnZlIHNwYWNlcyBhbmQgbGluZSBicmVha3NcbiAgICBtYXJrLnN0eWxlLndoaXRlU3BhY2UgPSBcInByZVwiO1xuICAgIC8vIGRvIG5vdCBpbmhlcml0IHVzZXItc2VsZWN0IChpdCBtYXkgYmUgYG5vbmVgKVxuICAgIG1hcmsuc3R5bGUud2Via2l0VXNlclNlbGVjdCA9IFwidGV4dFwiO1xuICAgIG1hcmsuc3R5bGUuTW96VXNlclNlbGVjdCA9IFwidGV4dFwiO1xuICAgIG1hcmsuc3R5bGUubXNVc2VyU2VsZWN0ID0gXCJ0ZXh0XCI7XG4gICAgbWFyay5zdHlsZS51c2VyU2VsZWN0ID0gXCJ0ZXh0XCI7XG4gICAgbWFyay5hZGRFdmVudExpc3RlbmVyKFwiY29weVwiLCBmdW5jdGlvbihlKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgaWYgKG9wdGlvbnMuZm9ybWF0KSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKHR5cGVvZiBlLmNsaXBib2FyZERhdGEgPT09IFwidW5kZWZpbmVkXCIpIHsgLy8gSUUgMTFcbiAgICAgICAgICBkZWJ1ZyAmJiBjb25zb2xlLndhcm4oXCJ1bmFibGUgdG8gdXNlIGUuY2xpcGJvYXJkRGF0YVwiKTtcbiAgICAgICAgICBkZWJ1ZyAmJiBjb25zb2xlLndhcm4oXCJ0cnlpbmcgSUUgc3BlY2lmaWMgc3R1ZmZcIik7XG4gICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuY2xlYXJEYXRhKCk7XG4gICAgICAgICAgdmFyIGZvcm1hdCA9IGNsaXBib2FyZFRvSUUxMUZvcm1hdHRpbmdbb3B0aW9ucy5mb3JtYXRdIHx8IGNsaXBib2FyZFRvSUUxMUZvcm1hdHRpbmdbXCJkZWZhdWx0XCJdXG4gICAgICAgICAgd2luZG93LmNsaXBib2FyZERhdGEuc2V0RGF0YShmb3JtYXQsIHRleHQpO1xuICAgICAgICB9IGVsc2UgeyAvLyBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgICBlLmNsaXBib2FyZERhdGEuY2xlYXJEYXRhKCk7XG4gICAgICAgICAgZS5jbGlwYm9hcmREYXRhLnNldERhdGEob3B0aW9ucy5mb3JtYXQsIHRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy5vbkNvcHkpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBvcHRpb25zLm9uQ29weShlLmNsaXBib2FyZERhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtYXJrKTtcblxuICAgIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhtYXJrKTtcbiAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xuXG4gICAgdmFyIHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZChcImNvcHlcIik7XG4gICAgaWYgKCFzdWNjZXNzZnVsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb3B5IGNvbW1hbmQgd2FzIHVuc3VjY2Vzc2Z1bFwiKTtcbiAgICB9XG4gICAgc3VjY2VzcyA9IHRydWU7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGRlYnVnICYmIGNvbnNvbGUuZXJyb3IoXCJ1bmFibGUgdG8gY29weSB1c2luZyBleGVjQ29tbWFuZDogXCIsIGVycik7XG4gICAgZGVidWcgJiYgY29uc29sZS53YXJuKFwidHJ5aW5nIElFIHNwZWNpZmljIHN0dWZmXCIpO1xuICAgIHRyeSB7XG4gICAgICB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhKG9wdGlvbnMuZm9ybWF0IHx8IFwidGV4dFwiLCB0ZXh0KTtcbiAgICAgIG9wdGlvbnMub25Db3B5ICYmIG9wdGlvbnMub25Db3B5KHdpbmRvdy5jbGlwYm9hcmREYXRhKTtcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgZGVidWcgJiYgY29uc29sZS5lcnJvcihcInVuYWJsZSB0byBjb3B5IHVzaW5nIGNsaXBib2FyZERhdGE6IFwiLCBlcnIpO1xuICAgICAgZGVidWcgJiYgY29uc29sZS5lcnJvcihcImZhbGxpbmcgYmFjayB0byBwcm9tcHRcIik7XG4gICAgICBtZXNzYWdlID0gZm9ybWF0KFwibWVzc2FnZVwiIGluIG9wdGlvbnMgPyBvcHRpb25zLm1lc3NhZ2UgOiBkZWZhdWx0TWVzc2FnZSk7XG4gICAgICB3aW5kb3cucHJvbXB0KG1lc3NhZ2UsIHRleHQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoc2VsZWN0aW9uKSB7XG4gICAgICBpZiAodHlwZW9mIHNlbGVjdGlvbi5yZW1vdmVSYW5nZSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgc2VsZWN0aW9uLnJlbW92ZVJhbmdlKHJhbmdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobWFyaykge1xuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChtYXJrKTtcbiAgICB9XG4gICAgcmVzZWxlY3RQcmV2aW91cygpO1xuICB9XG5cbiAgcmV0dXJuIHN1Y2Nlc3M7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29weTtcbiIsIi8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIvKipcbiAqIG1hcmtlZCAtIGEgbWFya2Rvd24gcGFyc2VyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTEtMjAyMSwgQ2hyaXN0b3BoZXIgSmVmZnJleS4gKE1JVCBMaWNlbnNlZClcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWRcbiAqL1xuXG4vKipcbiAqIERPIE5PVCBFRElUIFRISVMgRklMRVxuICogVGhlIGNvZGUgaW4gdGhpcyBmaWxlIGlzIGdlbmVyYXRlZCBmcm9tIGZpbGVzIGluIC4vc3JjL1xuICovXG5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGdsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwubWFya2VkID0ge30pKTtcbn0pKHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbiAgZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07XG4gICAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7XG4gICAgICBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7XG4gICAgICBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIF9jcmVhdGVDbGFzcyhDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICBpZiAocHJvdG9Qcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtcbiAgICBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7XG4gICAgcmV0dXJuIENvbnN0cnVjdG9yO1xuICB9XG5cbiAgZnVuY3Rpb24gX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KG8sIG1pbkxlbikge1xuICAgIGlmICghbykgcmV0dXJuO1xuICAgIGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG4gICAgdmFyIG4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpO1xuICAgIGlmIChuID09PSBcIk9iamVjdFwiICYmIG8uY29uc3RydWN0b3IpIG4gPSBvLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7XG4gICAgaWYgKG4gPT09IFwiQXJndW1lbnRzXCIgfHwgL14oPzpVaXxJKW50KD86OHwxNnwzMikoPzpDbGFtcGVkKT9BcnJheSQvLnRlc3QobikpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pO1xuICB9XG5cbiAgZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHtcbiAgICBpZiAobGVuID09IG51bGwgfHwgbGVuID4gYXJyLmxlbmd0aCkgbGVuID0gYXJyLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTtcblxuICAgIHJldHVybiBhcnIyO1xuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXJMb29zZShvLCBhbGxvd0FycmF5TGlrZSkge1xuICAgIHZhciBpdCA9IHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdIHx8IG9bXCJAQGl0ZXJhdG9yXCJdO1xuICAgIGlmIChpdCkgcmV0dXJuIChpdCA9IGl0LmNhbGwobykpLm5leHQuYmluZChpdCk7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShvKSB8fCAoaXQgPSBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobykpIHx8IGFsbG93QXJyYXlMaWtlICYmIG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSB7XG4gICAgICBpZiAoaXQpIG8gPSBpdDtcbiAgICAgIHZhciBpID0gMDtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChpID49IG8ubGVuZ3RoKSByZXR1cm4ge1xuICAgICAgICAgIGRvbmU6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogb1tpKytdXG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gaXRlcmF0ZSBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERlZmF1bHRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBiYXNlVXJsOiBudWxsLFxuICAgICAgYnJlYWtzOiBmYWxzZSxcbiAgICAgIGV4dGVuc2lvbnM6IG51bGwsXG4gICAgICBnZm06IHRydWUsXG4gICAgICBoZWFkZXJJZHM6IHRydWUsXG4gICAgICBoZWFkZXJQcmVmaXg6ICcnLFxuICAgICAgaGlnaGxpZ2h0OiBudWxsLFxuICAgICAgbGFuZ1ByZWZpeDogJ2xhbmd1YWdlLScsXG4gICAgICBtYW5nbGU6IHRydWUsXG4gICAgICBwZWRhbnRpYzogZmFsc2UsXG4gICAgICByZW5kZXJlcjogbnVsbCxcbiAgICAgIHNhbml0aXplOiBmYWxzZSxcbiAgICAgIHNhbml0aXplcjogbnVsbCxcbiAgICAgIHNpbGVudDogZmFsc2UsXG4gICAgICBzbWFydExpc3RzOiBmYWxzZSxcbiAgICAgIHNtYXJ0eXBhbnRzOiBmYWxzZSxcbiAgICAgIHRva2VuaXplcjogbnVsbCxcbiAgICAgIHdhbGtUb2tlbnM6IG51bGwsXG4gICAgICB4aHRtbDogZmFsc2VcbiAgICB9O1xuICB9XG4gIGV4cG9ydHMuZGVmYXVsdHMgPSBnZXREZWZhdWx0cygpO1xuICBmdW5jdGlvbiBjaGFuZ2VEZWZhdWx0cyhuZXdEZWZhdWx0cykge1xuICAgIGV4cG9ydHMuZGVmYXVsdHMgPSBuZXdEZWZhdWx0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXJzXG4gICAqL1xuICB2YXIgZXNjYXBlVGVzdCA9IC9bJjw+XCInXS87XG4gIHZhciBlc2NhcGVSZXBsYWNlID0gL1smPD5cIiddL2c7XG4gIHZhciBlc2NhcGVUZXN0Tm9FbmNvZGUgPSAvWzw+XCInXXwmKD8hIz9cXHcrOykvO1xuICB2YXIgZXNjYXBlUmVwbGFjZU5vRW5jb2RlID0gL1s8PlwiJ118Jig/ISM/XFx3KzspL2c7XG4gIHZhciBlc2NhcGVSZXBsYWNlbWVudHMgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnXG4gIH07XG5cbiAgdmFyIGdldEVzY2FwZVJlcGxhY2VtZW50ID0gZnVuY3Rpb24gZ2V0RXNjYXBlUmVwbGFjZW1lbnQoY2gpIHtcbiAgICByZXR1cm4gZXNjYXBlUmVwbGFjZW1lbnRzW2NoXTtcbiAgfTtcblxuICBmdW5jdGlvbiBlc2NhcGUoaHRtbCwgZW5jb2RlKSB7XG4gICAgaWYgKGVuY29kZSkge1xuICAgICAgaWYgKGVzY2FwZVRlc3QudGVzdChodG1sKSkge1xuICAgICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKGVzY2FwZVJlcGxhY2UsIGdldEVzY2FwZVJlcGxhY2VtZW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVzY2FwZVRlc3ROb0VuY29kZS50ZXN0KGh0bWwpKSB7XG4gICAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoZXNjYXBlUmVwbGFjZU5vRW5jb2RlLCBnZXRFc2NhcGVSZXBsYWNlbWVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbiAgdmFyIHVuZXNjYXBlVGVzdCA9IC8mKCMoPzpcXGQrKXwoPzojeFswLTlBLUZhLWZdKyl8KD86XFx3KykpOz8vaWc7XG4gIGZ1bmN0aW9uIHVuZXNjYXBlKGh0bWwpIHtcbiAgICAvLyBleHBsaWNpdGx5IG1hdGNoIGRlY2ltYWwsIGhleCwgYW5kIG5hbWVkIEhUTUwgZW50aXRpZXNcbiAgICByZXR1cm4gaHRtbC5yZXBsYWNlKHVuZXNjYXBlVGVzdCwgZnVuY3Rpb24gKF8sIG4pIHtcbiAgICAgIG4gPSBuLnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAobiA9PT0gJ2NvbG9uJykgcmV0dXJuICc6JztcblxuICAgICAgaWYgKG4uY2hhckF0KDApID09PSAnIycpIHtcbiAgICAgICAgcmV0dXJuIG4uY2hhckF0KDEpID09PSAneCcgPyBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KG4uc3Vic3RyaW5nKDIpLCAxNikpIDogU3RyaW5nLmZyb21DaGFyQ29kZSgrbi5zdWJzdHJpbmcoMSkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG4gIH1cbiAgdmFyIGNhcmV0ID0gLyhefFteXFxbXSlcXF4vZztcbiAgZnVuY3Rpb24gZWRpdChyZWdleCwgb3B0KSB7XG4gICAgcmVnZXggPSByZWdleC5zb3VyY2UgfHwgcmVnZXg7XG4gICAgb3B0ID0gb3B0IHx8ICcnO1xuICAgIHZhciBvYmogPSB7XG4gICAgICByZXBsYWNlOiBmdW5jdGlvbiByZXBsYWNlKG5hbWUsIHZhbCkge1xuICAgICAgICB2YWwgPSB2YWwuc291cmNlIHx8IHZhbDtcbiAgICAgICAgdmFsID0gdmFsLnJlcGxhY2UoY2FyZXQsICckMScpO1xuICAgICAgICByZWdleCA9IHJlZ2V4LnJlcGxhY2UobmFtZSwgdmFsKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgIH0sXG4gICAgICBnZXRSZWdleDogZnVuY3Rpb24gZ2V0UmVnZXgoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHJlZ2V4LCBvcHQpO1xuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuICB2YXIgbm9uV29yZEFuZENvbG9uVGVzdCA9IC9bXlxcdzpdL2c7XG4gIHZhciBvcmlnaW5JbmRlcGVuZGVudFVybCA9IC9eJHxeW2Etel1bYS16MC05Ky4tXSo6fF5bPyNdL2k7XG4gIGZ1bmN0aW9uIGNsZWFuVXJsKHNhbml0aXplLCBiYXNlLCBocmVmKSB7XG4gICAgaWYgKHNhbml0aXplKSB7XG4gICAgICB2YXIgcHJvdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcHJvdCA9IGRlY29kZVVSSUNvbXBvbmVudCh1bmVzY2FwZShocmVmKSkucmVwbGFjZShub25Xb3JkQW5kQ29sb25UZXN0LCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm90LmluZGV4T2YoJ2phdmFzY3JpcHQ6JykgPT09IDAgfHwgcHJvdC5pbmRleE9mKCd2YnNjcmlwdDonKSA9PT0gMCB8fCBwcm90LmluZGV4T2YoJ2RhdGE6JykgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJhc2UgJiYgIW9yaWdpbkluZGVwZW5kZW50VXJsLnRlc3QoaHJlZikpIHtcbiAgICAgIGhyZWYgPSByZXNvbHZlVXJsKGJhc2UsIGhyZWYpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBocmVmID0gZW5jb2RlVVJJKGhyZWYpLnJlcGxhY2UoLyUyNS9nLCAnJScpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBocmVmO1xuICB9XG4gIHZhciBiYXNlVXJscyA9IHt9O1xuICB2YXIganVzdERvbWFpbiA9IC9eW146XSs6XFwvKlteL10qJC87XG4gIHZhciBwcm90b2NvbCA9IC9eKFteOl0rOilbXFxzXFxTXSokLztcbiAgdmFyIGRvbWFpbiA9IC9eKFteOl0rOlxcLypbXi9dKilbXFxzXFxTXSokLztcbiAgZnVuY3Rpb24gcmVzb2x2ZVVybChiYXNlLCBocmVmKSB7XG4gICAgaWYgKCFiYXNlVXJsc1snICcgKyBiYXNlXSkge1xuICAgICAgLy8gd2UgY2FuIGlnbm9yZSBldmVyeXRoaW5nIGluIGJhc2UgYWZ0ZXIgdGhlIGxhc3Qgc2xhc2ggb2YgaXRzIHBhdGggY29tcG9uZW50LFxuICAgICAgLy8gYnV0IHdlIG1pZ2h0IG5lZWQgdG8gYWRkIF90aGF0X1xuICAgICAgLy8gaHR0cHM6Ly90b29scy5pZXRmLm9yZy9odG1sL3JmYzM5ODYjc2VjdGlvbi0zXG4gICAgICBpZiAoanVzdERvbWFpbi50ZXN0KGJhc2UpKSB7XG4gICAgICAgIGJhc2VVcmxzWycgJyArIGJhc2VdID0gYmFzZSArICcvJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhc2VVcmxzWycgJyArIGJhc2VdID0gcnRyaW0oYmFzZSwgJy8nLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBiYXNlID0gYmFzZVVybHNbJyAnICsgYmFzZV07XG4gICAgdmFyIHJlbGF0aXZlQmFzZSA9IGJhc2UuaW5kZXhPZignOicpID09PSAtMTtcblxuICAgIGlmIChocmVmLnN1YnN0cmluZygwLCAyKSA9PT0gJy8vJykge1xuICAgICAgaWYgKHJlbGF0aXZlQmFzZSkge1xuICAgICAgICByZXR1cm4gaHJlZjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2UucmVwbGFjZShwcm90b2NvbCwgJyQxJykgKyBocmVmO1xuICAgIH0gZWxzZSBpZiAoaHJlZi5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgaWYgKHJlbGF0aXZlQmFzZSkge1xuICAgICAgICByZXR1cm4gaHJlZjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2UucmVwbGFjZShkb21haW4sICckMScpICsgaHJlZjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJhc2UgKyBocmVmO1xuICAgIH1cbiAgfVxuICB2YXIgbm9vcFRlc3QgPSB7XG4gICAgZXhlYzogZnVuY3Rpb24gbm9vcFRlc3QoKSB7fVxuICB9O1xuICBmdW5jdGlvbiBtZXJnZShvYmopIHtcbiAgICB2YXIgaSA9IDEsXG4gICAgICAgIHRhcmdldCxcbiAgICAgICAga2V5O1xuXG4gICAgZm9yICg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1tpXTtcblxuICAgICAgZm9yIChrZXkgaW4gdGFyZ2V0KSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGFyZ2V0LCBrZXkpKSB7XG4gICAgICAgICAgb2JqW2tleV0gPSB0YXJnZXRba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH1cbiAgZnVuY3Rpb24gc3BsaXRDZWxscyh0YWJsZVJvdywgY291bnQpIHtcbiAgICAvLyBlbnN1cmUgdGhhdCBldmVyeSBjZWxsLWRlbGltaXRpbmcgcGlwZSBoYXMgYSBzcGFjZVxuICAgIC8vIGJlZm9yZSBpdCB0byBkaXN0aW5ndWlzaCBpdCBmcm9tIGFuIGVzY2FwZWQgcGlwZVxuICAgIHZhciByb3cgPSB0YWJsZVJvdy5yZXBsYWNlKC9cXHwvZywgZnVuY3Rpb24gKG1hdGNoLCBvZmZzZXQsIHN0cikge1xuICAgICAgdmFyIGVzY2FwZWQgPSBmYWxzZSxcbiAgICAgICAgICBjdXJyID0gb2Zmc2V0O1xuXG4gICAgICB3aGlsZSAoLS1jdXJyID49IDAgJiYgc3RyW2N1cnJdID09PSAnXFxcXCcpIHtcbiAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgICAvLyBvZGQgbnVtYmVyIG9mIHNsYXNoZXMgbWVhbnMgfCBpcyBlc2NhcGVkXG4gICAgICAgIC8vIHNvIHdlIGxlYXZlIGl0IGFsb25lXG4gICAgICAgIHJldHVybiAnfCc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhZGQgc3BhY2UgYmVmb3JlIHVuZXNjYXBlZCB8XG4gICAgICAgIHJldHVybiAnIHwnO1xuICAgICAgfVxuICAgIH0pLFxuICAgICAgICBjZWxscyA9IHJvdy5zcGxpdCgvIFxcfC8pO1xuICAgIHZhciBpID0gMDsgLy8gRmlyc3QvbGFzdCBjZWxsIGluIGEgcm93IGNhbm5vdCBiZSBlbXB0eSBpZiBpdCBoYXMgbm8gbGVhZGluZy90cmFpbGluZyBwaXBlXG5cbiAgICBpZiAoIWNlbGxzWzBdLnRyaW0oKSkge1xuICAgICAgY2VsbHMuc2hpZnQoKTtcbiAgICB9XG5cbiAgICBpZiAoIWNlbGxzW2NlbGxzLmxlbmd0aCAtIDFdLnRyaW0oKSkge1xuICAgICAgY2VsbHMucG9wKCk7XG4gICAgfVxuXG4gICAgaWYgKGNlbGxzLmxlbmd0aCA+IGNvdW50KSB7XG4gICAgICBjZWxscy5zcGxpY2UoY291bnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoY2VsbHMubGVuZ3RoIDwgY291bnQpIHtcbiAgICAgICAgY2VsbHMucHVzaCgnJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yICg7IGkgPCBjZWxscy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gbGVhZGluZyBvciB0cmFpbGluZyB3aGl0ZXNwYWNlIGlzIGlnbm9yZWQgcGVyIHRoZSBnZm0gc3BlY1xuICAgICAgY2VsbHNbaV0gPSBjZWxsc1tpXS50cmltKCkucmVwbGFjZSgvXFxcXFxcfC9nLCAnfCcpO1xuICAgIH1cblxuICAgIHJldHVybiBjZWxscztcbiAgfSAvLyBSZW1vdmUgdHJhaWxpbmcgJ2Mncy4gRXF1aXZhbGVudCB0byBzdHIucmVwbGFjZSgvYyokLywgJycpLlxuICAvLyAvYyokLyBpcyB2dWxuZXJhYmxlIHRvIFJFRE9TLlxuICAvLyBpbnZlcnQ6IFJlbW92ZSBzdWZmaXggb2Ygbm9uLWMgY2hhcnMgaW5zdGVhZC4gRGVmYXVsdCBmYWxzZXkuXG5cbiAgZnVuY3Rpb24gcnRyaW0oc3RyLCBjLCBpbnZlcnQpIHtcbiAgICB2YXIgbCA9IHN0ci5sZW5ndGg7XG5cbiAgICBpZiAobCA9PT0gMCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0gLy8gTGVuZ3RoIG9mIHN1ZmZpeCBtYXRjaGluZyB0aGUgaW52ZXJ0IGNvbmRpdGlvbi5cblxuXG4gICAgdmFyIHN1ZmZMZW4gPSAwOyAvLyBTdGVwIGxlZnQgdW50aWwgd2UgZmFpbCB0byBtYXRjaCB0aGUgaW52ZXJ0IGNvbmRpdGlvbi5cblxuICAgIHdoaWxlIChzdWZmTGVuIDwgbCkge1xuICAgICAgdmFyIGN1cnJDaGFyID0gc3RyLmNoYXJBdChsIC0gc3VmZkxlbiAtIDEpO1xuXG4gICAgICBpZiAoY3VyckNoYXIgPT09IGMgJiYgIWludmVydCkge1xuICAgICAgICBzdWZmTGVuKys7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJDaGFyICE9PSBjICYmIGludmVydCkge1xuICAgICAgICBzdWZmTGVuKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyLnN1YnN0cigwLCBsIC0gc3VmZkxlbik7XG4gIH1cbiAgZnVuY3Rpb24gZmluZENsb3NpbmdCcmFja2V0KHN0ciwgYikge1xuICAgIGlmIChzdHIuaW5kZXhPZihiWzFdKSA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICB2YXIgbCA9IHN0ci5sZW5ndGg7XG4gICAgdmFyIGxldmVsID0gMCxcbiAgICAgICAgaSA9IDA7XG5cbiAgICBmb3IgKDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHN0cltpXSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSBpZiAoc3RyW2ldID09PSBiWzBdKSB7XG4gICAgICAgIGxldmVsKys7XG4gICAgICB9IGVsc2UgaWYgKHN0cltpXSA9PT0gYlsxXSkge1xuICAgICAgICBsZXZlbC0tO1xuXG4gICAgICAgIGlmIChsZXZlbCA8IDApIHtcbiAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiAtMTtcbiAgfVxuICBmdW5jdGlvbiBjaGVja1Nhbml0aXplRGVwcmVjYXRpb24ob3B0KSB7XG4gICAgaWYgKG9wdCAmJiBvcHQuc2FuaXRpemUgJiYgIW9wdC5zaWxlbnQpIHtcbiAgICAgIGNvbnNvbGUud2FybignbWFya2VkKCk6IHNhbml0aXplIGFuZCBzYW5pdGl6ZXIgcGFyYW1ldGVycyBhcmUgZGVwcmVjYXRlZCBzaW5jZSB2ZXJzaW9uIDAuNy4wLCBzaG91bGQgbm90IGJlIHVzZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgZnV0dXJlLiBSZWFkIG1vcmUgaGVyZTogaHR0cHM6Ly9tYXJrZWQuanMub3JnLyMvVVNJTkdfQURWQU5DRUQubWQjb3B0aW9ucycpO1xuICAgIH1cbiAgfSAvLyBjb3BpZWQgZnJvbSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTQ1MDExMy84MDY3NzdcblxuICBmdW5jdGlvbiByZXBlYXRTdHJpbmcocGF0dGVybiwgY291bnQpIHtcbiAgICBpZiAoY291bnQgPCAxKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gICAgd2hpbGUgKGNvdW50ID4gMSkge1xuICAgICAgaWYgKGNvdW50ICYgMSkge1xuICAgICAgICByZXN1bHQgKz0gcGF0dGVybjtcbiAgICAgIH1cblxuICAgICAgY291bnQgPj49IDE7XG4gICAgICBwYXR0ZXJuICs9IHBhdHRlcm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdCArIHBhdHRlcm47XG4gIH1cblxuICBmdW5jdGlvbiBvdXRwdXRMaW5rKGNhcCwgbGluaywgcmF3LCBsZXhlcikge1xuICAgIHZhciBocmVmID0gbGluay5ocmVmO1xuICAgIHZhciB0aXRsZSA9IGxpbmsudGl0bGUgPyBlc2NhcGUobGluay50aXRsZSkgOiBudWxsO1xuICAgIHZhciB0ZXh0ID0gY2FwWzFdLnJlcGxhY2UoL1xcXFwoW1xcW1xcXV0pL2csICckMScpO1xuXG4gICAgaWYgKGNhcFswXS5jaGFyQXQoMCkgIT09ICchJykge1xuICAgICAgbGV4ZXIuc3RhdGUuaW5MaW5rID0gdHJ1ZTtcbiAgICAgIHZhciB0b2tlbiA9IHtcbiAgICAgICAgdHlwZTogJ2xpbmsnLFxuICAgICAgICByYXc6IHJhdyxcbiAgICAgICAgaHJlZjogaHJlZixcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICB0b2tlbnM6IGxleGVyLmlubGluZVRva2Vucyh0ZXh0LCBbXSlcbiAgICAgIH07XG4gICAgICBsZXhlci5zdGF0ZS5pbkxpbmsgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgcmF3OiByYXcsXG4gICAgICAgIGhyZWY6IGhyZWYsXG4gICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgdGV4dDogZXNjYXBlKHRleHQpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGVudENvZGVDb21wZW5zYXRpb24ocmF3LCB0ZXh0KSB7XG4gICAgdmFyIG1hdGNoSW5kZW50VG9Db2RlID0gcmF3Lm1hdGNoKC9eKFxccyspKD86YGBgKS8pO1xuXG4gICAgaWYgKG1hdGNoSW5kZW50VG9Db2RlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG5cbiAgICB2YXIgaW5kZW50VG9Db2RlID0gbWF0Y2hJbmRlbnRUb0NvZGVbMV07XG4gICAgcmV0dXJuIHRleHQuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgdmFyIG1hdGNoSW5kZW50SW5Ob2RlID0gbm9kZS5tYXRjaCgvXlxccysvKTtcblxuICAgICAgaWYgKG1hdGNoSW5kZW50SW5Ob2RlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfVxuXG4gICAgICB2YXIgaW5kZW50SW5Ob2RlID0gbWF0Y2hJbmRlbnRJbk5vZGVbMF07XG5cbiAgICAgIGlmIChpbmRlbnRJbk5vZGUubGVuZ3RoID49IGluZGVudFRvQ29kZS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuc2xpY2UoaW5kZW50VG9Db2RlLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH0pLmpvaW4oJ1xcbicpO1xuICB9XG4gIC8qKlxuICAgKiBUb2tlbml6ZXJcbiAgICovXG5cblxuICB2YXIgVG9rZW5pemVyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUb2tlbml6ZXIob3B0aW9ucykge1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBleHBvcnRzLmRlZmF1bHRzO1xuICAgIH1cblxuICAgIHZhciBfcHJvdG8gPSBUb2tlbml6ZXIucHJvdG90eXBlO1xuXG4gICAgX3Byb3RvLnNwYWNlID0gZnVuY3Rpb24gc3BhY2Uoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5uZXdsaW5lLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICBpZiAoY2FwWzBdLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ3NwYWNlJyxcbiAgICAgICAgICAgIHJhdzogY2FwWzBdXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmF3OiAnXFxuJ1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uY29kZSA9IGZ1bmN0aW9uIGNvZGUoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5jb2RlLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dCA9IGNhcFswXS5yZXBsYWNlKC9eIHsxLDR9L2dtLCAnJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIGNvZGVCbG9ja1N0eWxlOiAnaW5kZW50ZWQnLFxuICAgICAgICAgIHRleHQ6ICF0aGlzLm9wdGlvbnMucGVkYW50aWMgPyBydHJpbSh0ZXh0LCAnXFxuJykgOiB0ZXh0XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5mZW5jZXMgPSBmdW5jdGlvbiBmZW5jZXMoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5mZW5jZXMuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciByYXcgPSBjYXBbMF07XG4gICAgICAgIHZhciB0ZXh0ID0gaW5kZW50Q29kZUNvbXBlbnNhdGlvbihyYXcsIGNhcFszXSB8fCAnJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvZGUnLFxuICAgICAgICAgIHJhdzogcmF3LFxuICAgICAgICAgIGxhbmc6IGNhcFsyXSA/IGNhcFsyXS50cmltKCkgOiBjYXBbMl0sXG4gICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uaGVhZGluZyA9IGZ1bmN0aW9uIGhlYWRpbmcoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5oZWFkaW5nLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dCA9IGNhcFsyXS50cmltKCk7IC8vIHJlbW92ZSB0cmFpbGluZyAjc1xuXG4gICAgICAgIGlmICgvIyQvLnRlc3QodGV4dCkpIHtcbiAgICAgICAgICB2YXIgdHJpbW1lZCA9IHJ0cmltKHRleHQsICcjJyk7XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBlZGFudGljKSB7XG4gICAgICAgICAgICB0ZXh0ID0gdHJpbW1lZC50cmltKCk7XG4gICAgICAgICAgfSBlbHNlIGlmICghdHJpbW1lZCB8fCAvICQvLnRlc3QodHJpbW1lZCkpIHtcbiAgICAgICAgICAgIC8vIENvbW1vbk1hcmsgcmVxdWlyZXMgc3BhY2UgYmVmb3JlIHRyYWlsaW5nICNzXG4gICAgICAgICAgICB0ZXh0ID0gdHJpbW1lZC50cmltKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICAgIHR5cGU6ICdoZWFkaW5nJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICBkZXB0aDogY2FwWzFdLmxlbmd0aCxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgIHRva2VuczogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sZXhlci5pbmxpbmUodG9rZW4udGV4dCwgdG9rZW4udG9rZW5zKTtcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uaHIgPSBmdW5jdGlvbiBocihzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmhyLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdocicsXG4gICAgICAgICAgcmF3OiBjYXBbMF1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmJsb2NrcXVvdGUgPSBmdW5jdGlvbiBibG9ja3F1b3RlKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2suYmxvY2txdW90ZS5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHRleHQgPSBjYXBbMF0ucmVwbGFjZSgvXiAqPiA/L2dtLCAnJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2Jsb2NrcXVvdGUnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIHRva2VuczogdGhpcy5sZXhlci5ibG9ja1Rva2Vucyh0ZXh0LCBbXSksXG4gICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8ubGlzdCA9IGZ1bmN0aW9uIGxpc3Qoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5saXN0LmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgcmF3LCBpc3Rhc2ssIGlzY2hlY2tlZCwgaW5kZW50LCBpLCBibGFua0xpbmUsIGVuZHNXaXRoQmxhbmtMaW5lLCBsaW5lLCBuZXh0TGluZSwgcmF3TGluZSwgaXRlbUNvbnRlbnRzLCBlbmRFYXJseTtcbiAgICAgICAgdmFyIGJ1bGwgPSBjYXBbMV0udHJpbSgpO1xuICAgICAgICB2YXIgaXNvcmRlcmVkID0gYnVsbC5sZW5ndGggPiAxO1xuICAgICAgICB2YXIgbGlzdCA9IHtcbiAgICAgICAgICB0eXBlOiAnbGlzdCcsXG4gICAgICAgICAgcmF3OiAnJyxcbiAgICAgICAgICBvcmRlcmVkOiBpc29yZGVyZWQsXG4gICAgICAgICAgc3RhcnQ6IGlzb3JkZXJlZCA/ICtidWxsLnNsaWNlKDAsIC0xKSA6ICcnLFxuICAgICAgICAgIGxvb3NlOiBmYWxzZSxcbiAgICAgICAgICBpdGVtczogW11cbiAgICAgICAgfTtcbiAgICAgICAgYnVsbCA9IGlzb3JkZXJlZCA/IFwiXFxcXGR7MSw5fVxcXFxcIiArIGJ1bGwuc2xpY2UoLTEpIDogXCJcXFxcXCIgKyBidWxsO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgICBidWxsID0gaXNvcmRlcmVkID8gYnVsbCA6ICdbKistXSc7XG4gICAgICAgIH0gLy8gR2V0IG5leHQgbGlzdCBpdGVtXG5cblxuICAgICAgICB2YXIgaXRlbVJlZ2V4ID0gbmV3IFJlZ0V4cChcIl4oIHswLDN9XCIgKyBidWxsICsgXCIpKCg/OiBbXlxcXFxuXSopPyg/OlxcXFxufCQpKVwiKTsgLy8gQ2hlY2sgaWYgY3VycmVudCBidWxsZXQgcG9pbnQgY2FuIHN0YXJ0IGEgbmV3IExpc3QgSXRlbVxuXG4gICAgICAgIHdoaWxlIChzcmMpIHtcbiAgICAgICAgICBlbmRFYXJseSA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCEoY2FwID0gaXRlbVJlZ2V4LmV4ZWMoc3JjKSkpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLnJ1bGVzLmJsb2NrLmhyLnRlc3Qoc3JjKSkge1xuICAgICAgICAgICAgLy8gRW5kIGxpc3QgaWYgYnVsbGV0IHdhcyBhY3R1YWxseSBIUiAocG9zc2libHkgbW92ZSBpbnRvIGl0ZW1SZWdleD8pXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByYXcgPSBjYXBbMF07XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhyYXcubGVuZ3RoKTtcbiAgICAgICAgICBsaW5lID0gY2FwWzJdLnNwbGl0KCdcXG4nLCAxKVswXTtcbiAgICAgICAgICBuZXh0TGluZSA9IHNyYy5zcGxpdCgnXFxuJywgMSlbMF07XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBlZGFudGljKSB7XG4gICAgICAgICAgICBpbmRlbnQgPSAyO1xuICAgICAgICAgICAgaXRlbUNvbnRlbnRzID0gbGluZS50cmltTGVmdCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbmRlbnQgPSBjYXBbMl0uc2VhcmNoKC9bXiBdLyk7IC8vIEZpbmQgZmlyc3Qgbm9uLXNwYWNlIGNoYXJcblxuICAgICAgICAgICAgaW5kZW50ID0gaW5kZW50ID4gNCA/IDEgOiBpbmRlbnQ7IC8vIFRyZWF0IGluZGVudGVkIGNvZGUgYmxvY2tzICg+IDQgc3BhY2VzKSBhcyBoYXZpbmcgb25seSAxIGluZGVudFxuXG4gICAgICAgICAgICBpdGVtQ29udGVudHMgPSBsaW5lLnNsaWNlKGluZGVudCk7XG4gICAgICAgICAgICBpbmRlbnQgKz0gY2FwWzFdLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBibGFua0xpbmUgPSBmYWxzZTtcblxuICAgICAgICAgIGlmICghbGluZSAmJiAvXiAqJC8udGVzdChuZXh0TGluZSkpIHtcbiAgICAgICAgICAgIC8vIEl0ZW1zIGJlZ2luIHdpdGggYXQgbW9zdCBvbmUgYmxhbmsgbGluZVxuICAgICAgICAgICAgcmF3ICs9IG5leHRMaW5lICsgJ1xcbic7XG4gICAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKG5leHRMaW5lLmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgZW5kRWFybHkgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZW5kRWFybHkpIHtcbiAgICAgICAgICAgIHZhciBuZXh0QnVsbGV0UmVnZXggPSBuZXcgUmVnRXhwKFwiXiB7MCxcIiArIE1hdGgubWluKDMsIGluZGVudCAtIDEpICsgXCJ9KD86WyorLV18XFxcXGR7MSw5fVsuKV0pXCIpOyAvLyBDaGVjayBpZiBmb2xsb3dpbmcgbGluZXMgc2hvdWxkIGJlIGluY2x1ZGVkIGluIExpc3QgSXRlbVxuXG4gICAgICAgICAgICB3aGlsZSAoc3JjKSB7XG4gICAgICAgICAgICAgIHJhd0xpbmUgPSBzcmMuc3BsaXQoJ1xcbicsIDEpWzBdO1xuICAgICAgICAgICAgICBsaW5lID0gcmF3TGluZTsgLy8gUmUtYWxpZ24gdG8gZm9sbG93IGNvbW1vbm1hcmsgbmVzdGluZyBydWxlc1xuXG4gICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgICAgICAgICBsaW5lID0gbGluZS5yZXBsYWNlKC9eIHsxLDR9KD89KCB7NH0pKlteIF0pL2csICcgICcpO1xuICAgICAgICAgICAgICB9IC8vIEVuZCBsaXN0IGl0ZW0gaWYgZm91bmQgc3RhcnQgb2YgbmV3IGJ1bGxldFxuXG5cbiAgICAgICAgICAgICAgaWYgKG5leHRCdWxsZXRSZWdleC50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAobGluZS5zZWFyY2goL1teIF0vKSA+PSBpbmRlbnQgfHwgIWxpbmUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gRGVkZW50IGlmIHBvc3NpYmxlXG4gICAgICAgICAgICAgICAgaXRlbUNvbnRlbnRzICs9ICdcXG4nICsgbGluZS5zbGljZShpbmRlbnQpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFibGFua0xpbmUpIHtcbiAgICAgICAgICAgICAgICAvLyBVbnRpbCBibGFuayBsaW5lLCBpdGVtIGRvZXNuJ3QgbmVlZCBpbmRlbnRhdGlvblxuICAgICAgICAgICAgICAgIGl0ZW1Db250ZW50cyArPSAnXFxuJyArIGxpbmU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpbXByb3BlciBpbmRlbnRhdGlvbiBlbmRzIHRoaXMgaXRlbVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCFibGFua0xpbmUgJiYgIWxpbmUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgY3VycmVudCBsaW5lIGlzIGJsYW5rXG4gICAgICAgICAgICAgICAgYmxhbmtMaW5lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJhdyArPSByYXdMaW5lICsgJ1xcbic7XG4gICAgICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcocmF3TGluZS5sZW5ndGggKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIWxpc3QubG9vc2UpIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBwcmV2aW91cyBpdGVtIGVuZGVkIHdpdGggYSBibGFuayBsaW5lLCB0aGUgbGlzdCBpcyBsb29zZVxuICAgICAgICAgICAgaWYgKGVuZHNXaXRoQmxhbmtMaW5lKSB7XG4gICAgICAgICAgICAgIGxpc3QubG9vc2UgPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvXFxuICpcXG4gKiQvLnRlc3QocmF3KSkge1xuICAgICAgICAgICAgICBlbmRzV2l0aEJsYW5rTGluZSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSAvLyBDaGVjayBmb3IgdGFzayBsaXN0IGl0ZW1zXG5cblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ2ZtKSB7XG4gICAgICAgICAgICBpc3Rhc2sgPSAvXlxcW1sgeFhdXFxdIC8uZXhlYyhpdGVtQ29udGVudHMpO1xuXG4gICAgICAgICAgICBpZiAoaXN0YXNrKSB7XG4gICAgICAgICAgICAgIGlzY2hlY2tlZCA9IGlzdGFza1swXSAhPT0gJ1sgXSAnO1xuICAgICAgICAgICAgICBpdGVtQ29udGVudHMgPSBpdGVtQ29udGVudHMucmVwbGFjZSgvXlxcW1sgeFhdXFxdICsvLCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdC5pdGVtcy5wdXNoKHtcbiAgICAgICAgICAgIHR5cGU6ICdsaXN0X2l0ZW0nLFxuICAgICAgICAgICAgcmF3OiByYXcsXG4gICAgICAgICAgICB0YXNrOiAhIWlzdGFzayxcbiAgICAgICAgICAgIGNoZWNrZWQ6IGlzY2hlY2tlZCxcbiAgICAgICAgICAgIGxvb3NlOiBmYWxzZSxcbiAgICAgICAgICAgIHRleHQ6IGl0ZW1Db250ZW50c1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGxpc3QucmF3ICs9IHJhdztcbiAgICAgICAgfSAvLyBEbyBub3QgY29uc3VtZSBuZXdsaW5lcyBhdCBlbmQgb2YgZmluYWwgaXRlbS4gQWx0ZXJuYXRpdmVseSwgbWFrZSBpdGVtUmVnZXggKnN0YXJ0KiB3aXRoIGFueSBuZXdsaW5lcyB0byBzaW1wbGlmeS9zcGVlZCB1cCBlbmRzV2l0aEJsYW5rTGluZSBsb2dpY1xuXG5cbiAgICAgICAgbGlzdC5pdGVtc1tsaXN0Lml0ZW1zLmxlbmd0aCAtIDFdLnJhdyA9IHJhdy50cmltUmlnaHQoKTtcbiAgICAgICAgbGlzdC5pdGVtc1tsaXN0Lml0ZW1zLmxlbmd0aCAtIDFdLnRleHQgPSBpdGVtQ29udGVudHMudHJpbVJpZ2h0KCk7XG4gICAgICAgIGxpc3QucmF3ID0gbGlzdC5yYXcudHJpbVJpZ2h0KCk7XG4gICAgICAgIHZhciBsID0gbGlzdC5pdGVtcy5sZW5ndGg7IC8vIEl0ZW0gY2hpbGQgdG9rZW5zIGhhbmRsZWQgaGVyZSBhdCBlbmQgYmVjYXVzZSB3ZSBuZWVkZWQgdG8gaGF2ZSB0aGUgZmluYWwgaXRlbSB0byB0cmltIGl0IGZpcnN0XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRoaXMubGV4ZXIuc3RhdGUudG9wID0gZmFsc2U7XG4gICAgICAgICAgbGlzdC5pdGVtc1tpXS50b2tlbnMgPSB0aGlzLmxleGVyLmJsb2NrVG9rZW5zKGxpc3QuaXRlbXNbaV0udGV4dCwgW10pO1xuXG4gICAgICAgICAgaWYgKCFsaXN0Lmxvb3NlICYmIGxpc3QuaXRlbXNbaV0udG9rZW5zLnNvbWUoZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgICAgIHJldHVybiB0LnR5cGUgPT09ICdzcGFjZSc7XG4gICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgIGxpc3QubG9vc2UgPSB0cnVlO1xuICAgICAgICAgICAgbGlzdC5pdGVtc1tpXS5sb29zZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5odG1sID0gZnVuY3Rpb24gaHRtbChzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmh0bWwuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IHtcbiAgICAgICAgICB0eXBlOiAnaHRtbCcsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgcHJlOiAhdGhpcy5vcHRpb25zLnNhbml0aXplciAmJiAoY2FwWzFdID09PSAncHJlJyB8fCBjYXBbMV0gPT09ICdzY3JpcHQnIHx8IGNhcFsxXSA9PT0gJ3N0eWxlJyksXG4gICAgICAgICAgdGV4dDogY2FwWzBdXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zYW5pdGl6ZSkge1xuICAgICAgICAgIHRva2VuLnR5cGUgPSAncGFyYWdyYXBoJztcbiAgICAgICAgICB0b2tlbi50ZXh0ID0gdGhpcy5vcHRpb25zLnNhbml0aXplciA/IHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIoY2FwWzBdKSA6IGVzY2FwZShjYXBbMF0pO1xuICAgICAgICAgIHRva2VuLnRva2VucyA9IFtdO1xuICAgICAgICAgIHRoaXMubGV4ZXIuaW5saW5lKHRva2VuLnRleHQsIHRva2VuLnRva2Vucyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5kZWYgPSBmdW5jdGlvbiBkZWYoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5kZWYuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIGlmIChjYXBbM10pIGNhcFszXSA9IGNhcFszXS5zdWJzdHJpbmcoMSwgY2FwWzNdLmxlbmd0aCAtIDEpO1xuICAgICAgICB2YXIgdGFnID0gY2FwWzFdLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdkZWYnLFxuICAgICAgICAgIHRhZzogdGFnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIGhyZWY6IGNhcFsyXSxcbiAgICAgICAgICB0aXRsZTogY2FwWzNdXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by50YWJsZSA9IGZ1bmN0aW9uIHRhYmxlKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2sudGFibGUuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgIHR5cGU6ICd0YWJsZScsXG4gICAgICAgICAgaGVhZGVyOiBzcGxpdENlbGxzKGNhcFsxXSkubWFwKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0ZXh0OiBjXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIGFsaWduOiBjYXBbMl0ucmVwbGFjZSgvXiAqfFxcfCAqJC9nLCAnJykuc3BsaXQoLyAqXFx8ICovKSxcbiAgICAgICAgICByb3dzOiBjYXBbM10gPyBjYXBbM10ucmVwbGFjZSgvXFxuWyBcXHRdKiQvLCAnJykuc3BsaXQoJ1xcbicpIDogW11cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXRlbS5oZWFkZXIubGVuZ3RoID09PSBpdGVtLmFsaWduLmxlbmd0aCkge1xuICAgICAgICAgIGl0ZW0ucmF3ID0gY2FwWzBdO1xuICAgICAgICAgIHZhciBsID0gaXRlbS5hbGlnbi5sZW5ndGg7XG4gICAgICAgICAgdmFyIGksIGosIGssIHJvdztcblxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmICgvXiAqLSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAncmlnaHQnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgvXiAqOi0rOiAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2NlbnRlcic7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSsgKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdsZWZ0JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGwgPSBpdGVtLnJvd3MubGVuZ3RoO1xuXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaXRlbS5yb3dzW2ldID0gc3BsaXRDZWxscyhpdGVtLnJvd3NbaV0sIGl0ZW0uaGVhZGVyLmxlbmd0aCkubWFwKGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGV4dDogY1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSAvLyBwYXJzZSBjaGlsZCB0b2tlbnMgaW5zaWRlIGhlYWRlcnMgYW5kIGNlbGxzXG4gICAgICAgICAgLy8gaGVhZGVyIGNoaWxkIHRva2Vuc1xuXG5cbiAgICAgICAgICBsID0gaXRlbS5oZWFkZXIubGVuZ3RoO1xuXG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IGw7IGorKykge1xuICAgICAgICAgICAgaXRlbS5oZWFkZXJbal0udG9rZW5zID0gW107XG4gICAgICAgICAgICB0aGlzLmxleGVyLmlubGluZVRva2VucyhpdGVtLmhlYWRlcltqXS50ZXh0LCBpdGVtLmhlYWRlcltqXS50b2tlbnMpO1xuICAgICAgICAgIH0gLy8gY2VsbCBjaGlsZCB0b2tlbnNcblxuXG4gICAgICAgICAgbCA9IGl0ZW0ucm93cy5sZW5ndGg7XG5cbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbDsgaisrKSB7XG4gICAgICAgICAgICByb3cgPSBpdGVtLnJvd3Nbal07XG5cbiAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCByb3cubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgcm93W2tdLnRva2VucyA9IFtdO1xuICAgICAgICAgICAgICB0aGlzLmxleGVyLmlubGluZVRva2Vucyhyb3dba10udGV4dCwgcm93W2tdLnRva2Vucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmxoZWFkaW5nID0gZnVuY3Rpb24gbGhlYWRpbmcoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5saGVhZGluZy5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICAgIHR5cGU6ICdoZWFkaW5nJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICBkZXB0aDogY2FwWzJdLmNoYXJBdCgwKSA9PT0gJz0nID8gMSA6IDIsXG4gICAgICAgICAgdGV4dDogY2FwWzFdLFxuICAgICAgICAgIHRva2VuczogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sZXhlci5pbmxpbmUodG9rZW4udGV4dCwgdG9rZW4udG9rZW5zKTtcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8ucGFyYWdyYXBoID0gZnVuY3Rpb24gcGFyYWdyYXBoKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2sucGFyYWdyYXBoLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB7XG4gICAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogY2FwWzFdLmNoYXJBdChjYXBbMV0ubGVuZ3RoIC0gMSkgPT09ICdcXG4nID8gY2FwWzFdLnNsaWNlKDAsIC0xKSA6IGNhcFsxXSxcbiAgICAgICAgICB0b2tlbnM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubGV4ZXIuaW5saW5lKHRva2VuLnRleHQsIHRva2VuLnRva2Vucyk7XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLnRleHQgPSBmdW5jdGlvbiB0ZXh0KHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2sudGV4dC5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiBjYXBbMF0sXG4gICAgICAgICAgdG9rZW5zOiBbXVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxleGVyLmlubGluZSh0b2tlbi50ZXh0LCB0b2tlbi50b2tlbnMpO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5lc2NhcGUgPSBmdW5jdGlvbiBlc2NhcGUkMShzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5lc2NhcGUuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2VzY2FwZScsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogZXNjYXBlKGNhcFsxXSlcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLnRhZyA9IGZ1bmN0aW9uIHRhZyhzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS50YWcuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIGlmICghdGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsgJiYgL148YSAvaS50ZXN0KGNhcFswXSkpIHtcbiAgICAgICAgICB0aGlzLmxleGVyLnN0YXRlLmluTGluayA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5sZXhlci5zdGF0ZS5pbkxpbmsgJiYgL148XFwvYT4vaS50ZXN0KGNhcFswXSkpIHtcbiAgICAgICAgICB0aGlzLmxleGVyLnN0YXRlLmluTGluayA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2sgJiYgL148KHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLnRlc3QoY2FwWzBdKSkge1xuICAgICAgICAgIHRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrICYmIC9ePFxcLyhwcmV8Y29kZXxrYmR8c2NyaXB0KShcXHN8PikvaS50ZXN0KGNhcFswXSkpIHtcbiAgICAgICAgICB0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2sgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogdGhpcy5vcHRpb25zLnNhbml0aXplID8gJ3RleHQnIDogJ2h0bWwnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIGluTGluazogdGhpcy5sZXhlci5zdGF0ZS5pbkxpbmssXG4gICAgICAgICAgaW5SYXdCbG9jazogdGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrLFxuICAgICAgICAgIHRleHQ6IHRoaXMub3B0aW9ucy5zYW5pdGl6ZSA/IHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIgPyB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKGNhcFswXSkgOiBlc2NhcGUoY2FwWzBdKSA6IGNhcFswXVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8ubGluayA9IGZ1bmN0aW9uIGxpbmsoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUubGluay5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHRyaW1tZWRVcmwgPSBjYXBbMl0udHJpbSgpO1xuXG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLnBlZGFudGljICYmIC9ePC8udGVzdCh0cmltbWVkVXJsKSkge1xuICAgICAgICAgIC8vIGNvbW1vbm1hcmsgcmVxdWlyZXMgbWF0Y2hpbmcgYW5nbGUgYnJhY2tldHNcbiAgICAgICAgICBpZiAoIS8+JC8udGVzdCh0cmltbWVkVXJsKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gLy8gZW5kaW5nIGFuZ2xlIGJyYWNrZXQgY2Fubm90IGJlIGVzY2FwZWRcblxuXG4gICAgICAgICAgdmFyIHJ0cmltU2xhc2ggPSBydHJpbSh0cmltbWVkVXJsLnNsaWNlKDAsIC0xKSwgJ1xcXFwnKTtcblxuICAgICAgICAgIGlmICgodHJpbW1lZFVybC5sZW5ndGggLSBydHJpbVNsYXNoLmxlbmd0aCkgJSAyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbmQgY2xvc2luZyBwYXJlbnRoZXNpc1xuICAgICAgICAgIHZhciBsYXN0UGFyZW5JbmRleCA9IGZpbmRDbG9zaW5nQnJhY2tldChjYXBbMl0sICcoKScpO1xuXG4gICAgICAgICAgaWYgKGxhc3RQYXJlbkluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IGNhcFswXS5pbmRleE9mKCchJykgPT09IDAgPyA1IDogNDtcbiAgICAgICAgICAgIHZhciBsaW5rTGVuID0gc3RhcnQgKyBjYXBbMV0ubGVuZ3RoICsgbGFzdFBhcmVuSW5kZXg7XG4gICAgICAgICAgICBjYXBbMl0gPSBjYXBbMl0uc3Vic3RyaW5nKDAsIGxhc3RQYXJlbkluZGV4KTtcbiAgICAgICAgICAgIGNhcFswXSA9IGNhcFswXS5zdWJzdHJpbmcoMCwgbGlua0xlbikudHJpbSgpO1xuICAgICAgICAgICAgY2FwWzNdID0gJyc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhyZWYgPSBjYXBbMl07XG4gICAgICAgIHZhciB0aXRsZSA9ICcnO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgICAvLyBzcGxpdCBwZWRhbnRpYyBocmVmIGFuZCB0aXRsZVxuICAgICAgICAgIHZhciBsaW5rID0gL14oW14nXCJdKlteXFxzXSlcXHMrKFsnXCJdKSguKilcXDIvLmV4ZWMoaHJlZik7XG5cbiAgICAgICAgICBpZiAobGluaykge1xuICAgICAgICAgICAgaHJlZiA9IGxpbmtbMV07XG4gICAgICAgICAgICB0aXRsZSA9IGxpbmtbM107XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpdGxlID0gY2FwWzNdID8gY2FwWzNdLnNsaWNlKDEsIC0xKSA6ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgaHJlZiA9IGhyZWYudHJpbSgpO1xuXG4gICAgICAgIGlmICgvXjwvLnRlc3QoaHJlZikpIHtcbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnBlZGFudGljICYmICEvPiQvLnRlc3QodHJpbW1lZFVybCkpIHtcbiAgICAgICAgICAgIC8vIHBlZGFudGljIGFsbG93cyBzdGFydGluZyBhbmdsZSBicmFja2V0IHdpdGhvdXQgZW5kaW5nIGFuZ2xlIGJyYWNrZXRcbiAgICAgICAgICAgIGhyZWYgPSBocmVmLnNsaWNlKDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBocmVmID0gaHJlZi5zbGljZSgxLCAtMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dExpbmsoY2FwLCB7XG4gICAgICAgICAgaHJlZjogaHJlZiA/IGhyZWYucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5fZXNjYXBlcywgJyQxJykgOiBocmVmLFxuICAgICAgICAgIHRpdGxlOiB0aXRsZSA/IHRpdGxlLnJlcGxhY2UodGhpcy5ydWxlcy5pbmxpbmUuX2VzY2FwZXMsICckMScpIDogdGl0bGVcbiAgICAgICAgfSwgY2FwWzBdLCB0aGlzLmxleGVyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLnJlZmxpbmsgPSBmdW5jdGlvbiByZWZsaW5rKHNyYywgbGlua3MpIHtcbiAgICAgIHZhciBjYXA7XG5cbiAgICAgIGlmICgoY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUucmVmbGluay5leGVjKHNyYykpIHx8IChjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5ub2xpbmsuZXhlYyhzcmMpKSkge1xuICAgICAgICB2YXIgbGluayA9IChjYXBbMl0gfHwgY2FwWzFdKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICAgIGxpbmsgPSBsaW5rc1tsaW5rLnRvTG93ZXJDYXNlKCldO1xuXG4gICAgICAgIGlmICghbGluayB8fCAhbGluay5ocmVmKSB7XG4gICAgICAgICAgdmFyIHRleHQgPSBjYXBbMF0uY2hhckF0KDApO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICByYXc6IHRleHQsXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXRMaW5rKGNhcCwgbGluaywgY2FwWzBdLCB0aGlzLmxleGVyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmVtU3Ryb25nID0gZnVuY3Rpb24gZW1TdHJvbmcoc3JjLCBtYXNrZWRTcmMsIHByZXZDaGFyKSB7XG4gICAgICBpZiAocHJldkNoYXIgPT09IHZvaWQgMCkge1xuICAgICAgICBwcmV2Q2hhciA9ICcnO1xuICAgICAgfVxuXG4gICAgICB2YXIgbWF0Y2ggPSB0aGlzLnJ1bGVzLmlubGluZS5lbVN0cm9uZy5sRGVsaW0uZXhlYyhzcmMpO1xuICAgICAgaWYgKCFtYXRjaCkgcmV0dXJuOyAvLyBfIGNhbid0IGJlIGJldHdlZW4gdHdvIGFscGhhbnVtZXJpY3MuIFxccHtMfVxccHtOfSBpbmNsdWRlcyBub24tZW5nbGlzaCBhbHBoYWJldC9udW1iZXJzIGFzIHdlbGxcblxuICAgICAgaWYgKG1hdGNoWzNdICYmIHByZXZDaGFyLm1hdGNoKC8oPzpbMC05QS1aYS16XFx4QUFcXHhCMlxceEIzXFx4QjVcXHhCOVxceEJBXFx4QkMtXFx4QkVcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzdGXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDhBLVxcdTA1MkZcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MC1cXHUwNTg4XFx1MDVEMC1cXHUwNUVBXFx1MDVFRi1cXHUwNUYyXFx1MDYyMC1cXHUwNjRBXFx1MDY2MC1cXHUwNjY5XFx1MDY2RVxcdTA2NkZcXHUwNjcxLVxcdTA2RDNcXHUwNkQ1XFx1MDZFNVxcdTA2RTZcXHUwNkVFLVxcdTA2RkNcXHUwNkZGXFx1MDcxMFxcdTA3MTItXFx1MDcyRlxcdTA3NEQtXFx1MDdBNVxcdTA3QjFcXHUwN0MwLVxcdTA3RUFcXHUwN0Y0XFx1MDdGNVxcdTA3RkFcXHUwODAwLVxcdTA4MTVcXHUwODFBXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwODYwLVxcdTA4NkFcXHUwODcwLVxcdTA4ODdcXHUwODg5LVxcdTA4OEVcXHUwOEEwLVxcdTA4QzlcXHUwOTA0LVxcdTA5MzlcXHUwOTNEXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NjYtXFx1MDk2RlxcdTA5NzEtXFx1MDk4MFxcdTA5ODUtXFx1MDk4Q1xcdTA5OEZcXHUwOTkwXFx1MDk5My1cXHUwOUE4XFx1MDlBQS1cXHUwOUIwXFx1MDlCMlxcdTA5QjYtXFx1MDlCOVxcdTA5QkRcXHUwOUNFXFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTFcXHUwOUU2LVxcdTA5RjFcXHUwOUY0LVxcdTA5RjlcXHUwOUZDXFx1MEEwNS1cXHUwQTBBXFx1MEEwRlxcdTBBMTBcXHUwQTEzLVxcdTBBMjhcXHUwQTJBLVxcdTBBMzBcXHUwQTMyXFx1MEEzM1xcdTBBMzVcXHUwQTM2XFx1MEEzOFxcdTBBMzlcXHUwQTU5LVxcdTBBNUNcXHUwQTVFXFx1MEE2Ni1cXHUwQTZGXFx1MEE3Mi1cXHUwQTc0XFx1MEE4NS1cXHUwQThEXFx1MEE4Ri1cXHUwQTkxXFx1MEE5My1cXHUwQUE4XFx1MEFBQS1cXHUwQUIwXFx1MEFCMlxcdTBBQjNcXHUwQUI1LVxcdTBBQjlcXHUwQUJEXFx1MEFEMFxcdTBBRTBcXHUwQUUxXFx1MEFFNi1cXHUwQUVGXFx1MEFGOVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjY2LVxcdTBCNkZcXHUwQjcxLVxcdTBCNzdcXHUwQjgzXFx1MEI4NS1cXHUwQjhBXFx1MEI4RS1cXHUwQjkwXFx1MEI5Mi1cXHUwQjk1XFx1MEI5OVxcdTBCOUFcXHUwQjlDXFx1MEI5RVxcdTBCOUZcXHUwQkEzXFx1MEJBNFxcdTBCQTgtXFx1MEJBQVxcdTBCQUUtXFx1MEJCOVxcdTBCRDBcXHUwQkU2LVxcdTBCRjJcXHUwQzA1LVxcdTBDMENcXHUwQzBFLVxcdTBDMTBcXHUwQzEyLVxcdTBDMjhcXHUwQzJBLVxcdTBDMzlcXHUwQzNEXFx1MEM1OC1cXHUwQzVBXFx1MEM1RFxcdTBDNjBcXHUwQzYxXFx1MEM2Ni1cXHUwQzZGXFx1MEM3OC1cXHUwQzdFXFx1MEM4MFxcdTBDODUtXFx1MEM4Q1xcdTBDOEUtXFx1MEM5MFxcdTBDOTItXFx1MENBOFxcdTBDQUEtXFx1MENCM1xcdTBDQjUtXFx1MENCOVxcdTBDQkRcXHUwQ0REXFx1MENERVxcdTBDRTBcXHUwQ0UxXFx1MENFNi1cXHUwQ0VGXFx1MENGMVxcdTBDRjJcXHUwRDA0LVxcdTBEMENcXHUwRDBFLVxcdTBEMTBcXHUwRDEyLVxcdTBEM0FcXHUwRDNEXFx1MEQ0RVxcdTBENTQtXFx1MEQ1NlxcdTBENTgtXFx1MEQ2MVxcdTBENjYtXFx1MEQ3OFxcdTBEN0EtXFx1MEQ3RlxcdTBEODUtXFx1MEQ5NlxcdTBEOUEtXFx1MERCMVxcdTBEQjMtXFx1MERCQlxcdTBEQkRcXHUwREMwLVxcdTBEQzZcXHUwREU2LVxcdTBERUZcXHUwRTAxLVxcdTBFMzBcXHUwRTMyXFx1MEUzM1xcdTBFNDAtXFx1MEU0NlxcdTBFNTAtXFx1MEU1OVxcdTBFODFcXHUwRTgyXFx1MEU4NFxcdTBFODYtXFx1MEU4QVxcdTBFOEMtXFx1MEVBM1xcdTBFQTVcXHUwRUE3LVxcdTBFQjBcXHUwRUIyXFx1MEVCM1xcdTBFQkRcXHUwRUMwLVxcdTBFQzRcXHUwRUM2XFx1MEVEMC1cXHUwRUQ5XFx1MEVEQy1cXHUwRURGXFx1MEYwMFxcdTBGMjAtXFx1MEYzM1xcdTBGNDAtXFx1MEY0N1xcdTBGNDktXFx1MEY2Q1xcdTBGODgtXFx1MEY4Q1xcdTEwMDAtXFx1MTAyQVxcdTEwM0YtXFx1MTA0OVxcdTEwNTAtXFx1MTA1NVxcdTEwNUEtXFx1MTA1RFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNkUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOEVcXHUxMDkwLVxcdTEwOTlcXHUxMEEwLVxcdTEwQzVcXHUxMEM3XFx1MTBDRFxcdTEwRDAtXFx1MTBGQVxcdTEwRkMtXFx1MTI0OFxcdTEyNEEtXFx1MTI0RFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVBLVxcdTEyNURcXHUxMjYwLVxcdTEyODhcXHUxMjhBLVxcdTEyOERcXHUxMjkwLVxcdTEyQjBcXHUxMkIyLVxcdTEyQjVcXHUxMkI4LVxcdTEyQkVcXHUxMkMwXFx1MTJDMi1cXHUxMkM1XFx1MTJDOC1cXHUxMkQ2XFx1MTJEOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVBXFx1MTM2OS1cXHUxMzdDXFx1MTM4MC1cXHUxMzhGXFx1MTNBMC1cXHUxM0Y1XFx1MTNGOC1cXHUxM0ZEXFx1MTQwMS1cXHUxNjZDXFx1MTY2Ri1cXHUxNjdGXFx1MTY4MS1cXHUxNjlBXFx1MTZBMC1cXHUxNkVBXFx1MTZFRS1cXHUxNkY4XFx1MTcwMC1cXHUxNzExXFx1MTcxRi1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZDXFx1MTc2RS1cXHUxNzcwXFx1MTc4MC1cXHUxN0IzXFx1MTdEN1xcdTE3RENcXHUxN0UwLVxcdTE3RTlcXHUxN0YwLVxcdTE3RjlcXHUxODEwLVxcdTE4MTlcXHUxODIwLVxcdTE4NzhcXHUxODgwLVxcdTE4ODRcXHUxODg3LVxcdTE4QThcXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFFXFx1MTk0Ni1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlCMC1cXHUxOUM5XFx1MTlEMC1cXHUxOURBXFx1MUEwMC1cXHUxQTE2XFx1MUEyMC1cXHUxQTU0XFx1MUE4MC1cXHUxQTg5XFx1MUE5MC1cXHUxQTk5XFx1MUFBN1xcdTFCMDUtXFx1MUIzM1xcdTFCNDUtXFx1MUI0Q1xcdTFCNTAtXFx1MUI1OVxcdTFCODMtXFx1MUJBMFxcdTFCQUUtXFx1MUJFNVxcdTFDMDAtXFx1MUMyM1xcdTFDNDAtXFx1MUM0OVxcdTFDNEQtXFx1MUM3RFxcdTFDODAtXFx1MUM4OFxcdTFDOTAtXFx1MUNCQVxcdTFDQkQtXFx1MUNCRlxcdTFDRTktXFx1MUNFQ1xcdTFDRUUtXFx1MUNGM1xcdTFDRjVcXHUxQ0Y2XFx1MUNGQVxcdTFEMDAtXFx1MURCRlxcdTFFMDAtXFx1MUYxNVxcdTFGMTgtXFx1MUYxRFxcdTFGMjAtXFx1MUY0NVxcdTFGNDgtXFx1MUY0RFxcdTFGNTAtXFx1MUY1N1xcdTFGNTlcXHUxRjVCXFx1MUY1RFxcdTFGNUYtXFx1MUY3RFxcdTFGODAtXFx1MUZCNFxcdTFGQjYtXFx1MUZCQ1xcdTFGQkVcXHUxRkMyLVxcdTFGQzRcXHUxRkM2LVxcdTFGQ0NcXHUxRkQwLVxcdTFGRDNcXHUxRkQ2LVxcdTFGREJcXHUxRkUwLVxcdTFGRUNcXHUxRkYyLVxcdTFGRjRcXHUxRkY2LVxcdTFGRkNcXHUyMDcwXFx1MjA3MVxcdTIwNzQtXFx1MjA3OVxcdTIwN0YtXFx1MjA4OVxcdTIwOTAtXFx1MjA5Q1xcdTIxMDJcXHUyMTA3XFx1MjEwQS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExRFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMkEtXFx1MjEyRFxcdTIxMkYtXFx1MjEzOVxcdTIxM0MtXFx1MjEzRlxcdTIxNDUtXFx1MjE0OVxcdTIxNEVcXHUyMTUwLVxcdTIxODlcXHUyNDYwLVxcdTI0OUJcXHUyNEVBLVxcdTI0RkZcXHUyNzc2LVxcdTI3OTNcXHUyQzAwLVxcdTJDRTRcXHUyQ0VCLVxcdTJDRUVcXHUyQ0YyXFx1MkNGM1xcdTJDRkRcXHUyRDAwLVxcdTJEMjVcXHUyRDI3XFx1MkQyRFxcdTJEMzAtXFx1MkQ2N1xcdTJENkZcXHUyRDgwLVxcdTJEOTZcXHUyREEwLVxcdTJEQTZcXHUyREE4LVxcdTJEQUVcXHUyREIwLVxcdTJEQjZcXHUyREI4LVxcdTJEQkVcXHUyREMwLVxcdTJEQzZcXHUyREM4LVxcdTJEQ0VcXHUyREQwLVxcdTJERDZcXHUyREQ4LVxcdTJEREVcXHUyRTJGXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNDXFx1MzA0MS1cXHUzMDk2XFx1MzA5RC1cXHUzMDlGXFx1MzBBMS1cXHUzMEZBXFx1MzBGQy1cXHUzMEZGXFx1MzEwNS1cXHUzMTJGXFx1MzEzMS1cXHUzMThFXFx1MzE5Mi1cXHUzMTk1XFx1MzFBMC1cXHUzMUJGXFx1MzFGMC1cXHUzMUZGXFx1MzIyMC1cXHUzMjI5XFx1MzI0OC1cXHUzMjRGXFx1MzI1MS1cXHUzMjVGXFx1MzI4MC1cXHUzMjg5XFx1MzJCMS1cXHUzMkJGXFx1MzQwMC1cXHU0REJGXFx1NEUwMC1cXHVBNDhDXFx1QTREMC1cXHVBNEZEXFx1QTUwMC1cXHVBNjBDXFx1QTYxMC1cXHVBNjJCXFx1QTY0MC1cXHVBNjZFXFx1QTY3Ri1cXHVBNjlEXFx1QTZBMC1cXHVBNkVGXFx1QTcxNy1cXHVBNzFGXFx1QTcyMi1cXHVBNzg4XFx1QTc4Qi1cXHVBN0NBXFx1QTdEMFxcdUE3RDFcXHVBN0QzXFx1QTdENS1cXHVBN0Q5XFx1QTdGMi1cXHVBODAxXFx1QTgwMy1cXHVBODA1XFx1QTgwNy1cXHVBODBBXFx1QTgwQy1cXHVBODIyXFx1QTgzMC1cXHVBODM1XFx1QTg0MC1cXHVBODczXFx1QTg4Mi1cXHVBOEIzXFx1QThEMC1cXHVBOEQ5XFx1QThGMi1cXHVBOEY3XFx1QThGQlxcdUE4RkRcXHVBOEZFXFx1QTkwMC1cXHVBOTI1XFx1QTkzMC1cXHVBOTQ2XFx1QTk2MC1cXHVBOTdDXFx1QTk4NC1cXHVBOUIyXFx1QTlDRi1cXHVBOUQ5XFx1QTlFMC1cXHVBOUU0XFx1QTlFNi1cXHVBOUZFXFx1QUEwMC1cXHVBQTI4XFx1QUE0MC1cXHVBQTQyXFx1QUE0NC1cXHVBQTRCXFx1QUE1MC1cXHVBQTU5XFx1QUE2MC1cXHVBQTc2XFx1QUE3QVxcdUFBN0UtXFx1QUFBRlxcdUFBQjFcXHVBQUI1XFx1QUFCNlxcdUFBQjktXFx1QUFCRFxcdUFBQzBcXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVBXFx1QUFGMi1cXHVBQUY0XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUIzMC1cXHVBQjVBXFx1QUI1Qy1cXHVBQjY5XFx1QUI3MC1cXHVBQkUyXFx1QUJGMC1cXHVBQkY5XFx1QUMwMC1cXHVEN0EzXFx1RDdCMC1cXHVEN0M2XFx1RDdDQi1cXHVEN0ZCXFx1RjkwMC1cXHVGQTZEXFx1RkE3MC1cXHVGQUQ5XFx1RkIwMC1cXHVGQjA2XFx1RkIxMy1cXHVGQjE3XFx1RkIxRFxcdUZCMUYtXFx1RkIyOFxcdUZCMkEtXFx1RkIzNlxcdUZCMzgtXFx1RkIzQ1xcdUZCM0VcXHVGQjQwXFx1RkI0MVxcdUZCNDNcXHVGQjQ0XFx1RkI0Ni1cXHVGQkIxXFx1RkJEMy1cXHVGRDNEXFx1RkQ1MC1cXHVGRDhGXFx1RkQ5Mi1cXHVGREM3XFx1RkRGMC1cXHVGREZCXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkY0MS1cXHVGRjVBXFx1RkY2Ni1cXHVGRkJFXFx1RkZDMi1cXHVGRkM3XFx1RkZDQS1cXHVGRkNGXFx1RkZEMi1cXHVGRkQ3XFx1RkZEQS1cXHVGRkRDXXxcXHVEODAwW1xcdURDMDAtXFx1REMwQlxcdURDMEQtXFx1REMyNlxcdURDMjgtXFx1REMzQVxcdURDM0NcXHVEQzNEXFx1REMzRi1cXHVEQzREXFx1REM1MC1cXHVEQzVEXFx1REM4MC1cXHVEQ0ZBXFx1REQwNy1cXHVERDMzXFx1REQ0MC1cXHVERDc4XFx1REQ4QVxcdUREOEJcXHVERTgwLVxcdURFOUNcXHVERUEwLVxcdURFRDBcXHVERUUxLVxcdURFRkJcXHVERjAwLVxcdURGMjNcXHVERjJELVxcdURGNEFcXHVERjUwLVxcdURGNzVcXHVERjgwLVxcdURGOURcXHVERkEwLVxcdURGQzNcXHVERkM4LVxcdURGQ0ZcXHVERkQxLVxcdURGRDVdfFxcdUQ4MDFbXFx1REMwMC1cXHVEQzlEXFx1RENBMC1cXHVEQ0E5XFx1RENCMC1cXHVEQ0QzXFx1RENEOC1cXHVEQ0ZCXFx1REQwMC1cXHVERDI3XFx1REQzMC1cXHVERDYzXFx1REQ3MC1cXHVERDdBXFx1REQ3Qy1cXHVERDhBXFx1REQ4Qy1cXHVERDkyXFx1REQ5NFxcdUREOTVcXHVERDk3LVxcdUREQTFcXHVEREEzLVxcdUREQjFcXHVEREIzLVxcdUREQjlcXHVEREJCXFx1RERCQ1xcdURFMDAtXFx1REYzNlxcdURGNDAtXFx1REY1NVxcdURGNjAtXFx1REY2N1xcdURGODAtXFx1REY4NVxcdURGODctXFx1REZCMFxcdURGQjItXFx1REZCQV18XFx1RDgwMltcXHVEQzAwLVxcdURDMDVcXHVEQzA4XFx1REMwQS1cXHVEQzM1XFx1REMzN1xcdURDMzhcXHVEQzNDXFx1REMzRi1cXHVEQzU1XFx1REM1OC1cXHVEQzc2XFx1REM3OS1cXHVEQzlFXFx1RENBNy1cXHVEQ0FGXFx1RENFMC1cXHVEQ0YyXFx1RENGNFxcdURDRjVcXHVEQ0ZCLVxcdUREMUJcXHVERDIwLVxcdUREMzlcXHVERDgwLVxcdUREQjdcXHVEREJDLVxcdUREQ0ZcXHVEREQyLVxcdURFMDBcXHVERTEwLVxcdURFMTNcXHVERTE1LVxcdURFMTdcXHVERTE5LVxcdURFMzVcXHVERTQwLVxcdURFNDhcXHVERTYwLVxcdURFN0VcXHVERTgwLVxcdURFOUZcXHVERUMwLVxcdURFQzdcXHVERUM5LVxcdURFRTRcXHVERUVCLVxcdURFRUZcXHVERjAwLVxcdURGMzVcXHVERjQwLVxcdURGNTVcXHVERjU4LVxcdURGNzJcXHVERjc4LVxcdURGOTFcXHVERkE5LVxcdURGQUZdfFxcdUQ4MDNbXFx1REMwMC1cXHVEQzQ4XFx1REM4MC1cXHVEQ0IyXFx1RENDMC1cXHVEQ0YyXFx1RENGQS1cXHVERDIzXFx1REQzMC1cXHVERDM5XFx1REU2MC1cXHVERTdFXFx1REU4MC1cXHVERUE5XFx1REVCMFxcdURFQjFcXHVERjAwLVxcdURGMjdcXHVERjMwLVxcdURGNDVcXHVERjUxLVxcdURGNTRcXHVERjcwLVxcdURGODFcXHVERkIwLVxcdURGQ0JcXHVERkUwLVxcdURGRjZdfFxcdUQ4MDRbXFx1REMwMy1cXHVEQzM3XFx1REM1Mi1cXHVEQzZGXFx1REM3MVxcdURDNzJcXHVEQzc1XFx1REM4My1cXHVEQ0FGXFx1RENEMC1cXHVEQ0U4XFx1RENGMC1cXHVEQ0Y5XFx1REQwMy1cXHVERDI2XFx1REQzNi1cXHVERDNGXFx1REQ0NFxcdURENDdcXHVERDUwLVxcdURENzJcXHVERDc2XFx1REQ4My1cXHVEREIyXFx1RERDMS1cXHVEREM0XFx1REREMC1cXHVERERBXFx1REREQ1xcdURERTEtXFx1RERGNFxcdURFMDAtXFx1REUxMVxcdURFMTMtXFx1REUyQlxcdURFODAtXFx1REU4NlxcdURFODhcXHVERThBLVxcdURFOERcXHVERThGLVxcdURFOURcXHVERTlGLVxcdURFQThcXHVERUIwLVxcdURFREVcXHVERUYwLVxcdURFRjlcXHVERjA1LVxcdURGMENcXHVERjBGXFx1REYxMFxcdURGMTMtXFx1REYyOFxcdURGMkEtXFx1REYzMFxcdURGMzJcXHVERjMzXFx1REYzNS1cXHVERjM5XFx1REYzRFxcdURGNTBcXHVERjVELVxcdURGNjFdfFxcdUQ4MDVbXFx1REMwMC1cXHVEQzM0XFx1REM0Ny1cXHVEQzRBXFx1REM1MC1cXHVEQzU5XFx1REM1Ri1cXHVEQzYxXFx1REM4MC1cXHVEQ0FGXFx1RENDNFxcdURDQzVcXHVEQ0M3XFx1RENEMC1cXHVEQ0Q5XFx1REQ4MC1cXHVEREFFXFx1REREOC1cXHVERERCXFx1REUwMC1cXHVERTJGXFx1REU0NFxcdURFNTAtXFx1REU1OVxcdURFODAtXFx1REVBQVxcdURFQjhcXHVERUMwLVxcdURFQzlcXHVERjAwLVxcdURGMUFcXHVERjMwLVxcdURGM0JcXHVERjQwLVxcdURGNDZdfFxcdUQ4MDZbXFx1REMwMC1cXHVEQzJCXFx1RENBMC1cXHVEQ0YyXFx1RENGRi1cXHVERDA2XFx1REQwOVxcdUREMEMtXFx1REQxM1xcdUREMTVcXHVERDE2XFx1REQxOC1cXHVERDJGXFx1REQzRlxcdURENDFcXHVERDUwLVxcdURENTlcXHVEREEwLVxcdUREQTdcXHVEREFBLVxcdURERDBcXHVEREUxXFx1RERFM1xcdURFMDBcXHVERTBCLVxcdURFMzJcXHVERTNBXFx1REU1MFxcdURFNUMtXFx1REU4OVxcdURFOURcXHVERUIwLVxcdURFRjhdfFxcdUQ4MDdbXFx1REMwMC1cXHVEQzA4XFx1REMwQS1cXHVEQzJFXFx1REM0MFxcdURDNTAtXFx1REM2Q1xcdURDNzItXFx1REM4RlxcdUREMDAtXFx1REQwNlxcdUREMDhcXHVERDA5XFx1REQwQi1cXHVERDMwXFx1REQ0NlxcdURENTAtXFx1REQ1OVxcdURENjAtXFx1REQ2NVxcdURENjdcXHVERDY4XFx1REQ2QS1cXHVERDg5XFx1REQ5OFxcdUREQTAtXFx1RERBOVxcdURFRTAtXFx1REVGMlxcdURGQjBcXHVERkMwLVxcdURGRDRdfFxcdUQ4MDhbXFx1REMwMC1cXHVERjk5XXxcXHVEODA5W1xcdURDMDAtXFx1REM2RVxcdURDODAtXFx1REQ0M118XFx1RDgwQltcXHVERjkwLVxcdURGRjBdfFtcXHVEODBDXFx1RDgxQy1cXHVEODIwXFx1RDgyMlxcdUQ4NDAtXFx1RDg2OFxcdUQ4NkEtXFx1RDg2Q1xcdUQ4NkYtXFx1RDg3MlxcdUQ4NzQtXFx1RDg3OVxcdUQ4ODAtXFx1RDg4M11bXFx1REMwMC1cXHVERkZGXXxcXHVEODBEW1xcdURDMDAtXFx1REMyRV18XFx1RDgxMVtcXHVEQzAwLVxcdURFNDZdfFxcdUQ4MUFbXFx1REMwMC1cXHVERTM4XFx1REU0MC1cXHVERTVFXFx1REU2MC1cXHVERTY5XFx1REU3MC1cXHVERUJFXFx1REVDMC1cXHVERUM5XFx1REVEMC1cXHVERUVEXFx1REYwMC1cXHVERjJGXFx1REY0MC1cXHVERjQzXFx1REY1MC1cXHVERjU5XFx1REY1Qi1cXHVERjYxXFx1REY2My1cXHVERjc3XFx1REY3RC1cXHVERjhGXXxcXHVEODFCW1xcdURFNDAtXFx1REU5NlxcdURGMDAtXFx1REY0QVxcdURGNTBcXHVERjkzLVxcdURGOUZcXHVERkUwXFx1REZFMVxcdURGRTNdfFxcdUQ4MjFbXFx1REMwMC1cXHVERkY3XXxcXHVEODIzW1xcdURDMDAtXFx1RENENVxcdUREMDAtXFx1REQwOF18XFx1RDgyQltcXHVERkYwLVxcdURGRjNcXHVERkY1LVxcdURGRkJcXHVERkZEXFx1REZGRV18XFx1RDgyQ1tcXHVEQzAwLVxcdUREMjJcXHVERDUwLVxcdURENTJcXHVERDY0LVxcdURENjdcXHVERDcwLVxcdURFRkJdfFxcdUQ4MkZbXFx1REMwMC1cXHVEQzZBXFx1REM3MC1cXHVEQzdDXFx1REM4MC1cXHVEQzg4XFx1REM5MC1cXHVEQzk5XXxcXHVEODM0W1xcdURFRTAtXFx1REVGM1xcdURGNjAtXFx1REY3OF18XFx1RDgzNVtcXHVEQzAwLVxcdURDNTRcXHVEQzU2LVxcdURDOUNcXHVEQzlFXFx1REM5RlxcdURDQTJcXHVEQ0E1XFx1RENBNlxcdURDQTktXFx1RENBQ1xcdURDQUUtXFx1RENCOVxcdURDQkJcXHVEQ0JELVxcdURDQzNcXHVEQ0M1LVxcdUREMDVcXHVERDA3LVxcdUREMEFcXHVERDBELVxcdUREMTRcXHVERDE2LVxcdUREMUNcXHVERDFFLVxcdUREMzlcXHVERDNCLVxcdUREM0VcXHVERDQwLVxcdURENDRcXHVERDQ2XFx1REQ0QS1cXHVERDUwXFx1REQ1Mi1cXHVERUE1XFx1REVBOC1cXHVERUMwXFx1REVDMi1cXHVERURBXFx1REVEQy1cXHVERUZBXFx1REVGQy1cXHVERjE0XFx1REYxNi1cXHVERjM0XFx1REYzNi1cXHVERjRFXFx1REY1MC1cXHVERjZFXFx1REY3MC1cXHVERjg4XFx1REY4QS1cXHVERkE4XFx1REZBQS1cXHVERkMyXFx1REZDNC1cXHVERkNCXFx1REZDRS1cXHVERkZGXXxcXHVEODM3W1xcdURGMDAtXFx1REYxRV18XFx1RDgzOFtcXHVERDAwLVxcdUREMkNcXHVERDM3LVxcdUREM0RcXHVERDQwLVxcdURENDlcXHVERDRFXFx1REU5MC1cXHVERUFEXFx1REVDMC1cXHVERUVCXFx1REVGMC1cXHVERUY5XXxcXHVEODM5W1xcdURGRTAtXFx1REZFNlxcdURGRTgtXFx1REZFQlxcdURGRURcXHVERkVFXFx1REZGMC1cXHVERkZFXXxcXHVEODNBW1xcdURDMDAtXFx1RENDNFxcdURDQzctXFx1RENDRlxcdUREMDAtXFx1REQ0M1xcdURENEJcXHVERDUwLVxcdURENTldfFxcdUQ4M0JbXFx1REM3MS1cXHVEQ0FCXFx1RENBRC1cXHVEQ0FGXFx1RENCMS1cXHVEQ0I0XFx1REQwMS1cXHVERDJEXFx1REQyRi1cXHVERDNEXFx1REUwMC1cXHVERTAzXFx1REUwNS1cXHVERTFGXFx1REUyMVxcdURFMjJcXHVERTI0XFx1REUyN1xcdURFMjktXFx1REUzMlxcdURFMzQtXFx1REUzN1xcdURFMzlcXHVERTNCXFx1REU0MlxcdURFNDdcXHVERTQ5XFx1REU0QlxcdURFNEQtXFx1REU0RlxcdURFNTFcXHVERTUyXFx1REU1NFxcdURFNTdcXHVERTU5XFx1REU1QlxcdURFNURcXHVERTVGXFx1REU2MVxcdURFNjJcXHVERTY0XFx1REU2Ny1cXHVERTZBXFx1REU2Qy1cXHVERTcyXFx1REU3NC1cXHVERTc3XFx1REU3OS1cXHVERTdDXFx1REU3RVxcdURFODAtXFx1REU4OVxcdURFOEItXFx1REU5QlxcdURFQTEtXFx1REVBM1xcdURFQTUtXFx1REVBOVxcdURFQUItXFx1REVCQl18XFx1RDgzQ1tcXHVERDAwLVxcdUREMENdfFxcdUQ4M0VbXFx1REZGMC1cXHVERkY5XXxcXHVEODY5W1xcdURDMDAtXFx1REVERlxcdURGMDAtXFx1REZGRl18XFx1RDg2RFtcXHVEQzAwLVxcdURGMzhcXHVERjQwLVxcdURGRkZdfFxcdUQ4NkVbXFx1REMwMC1cXHVEQzFEXFx1REMyMC1cXHVERkZGXXxcXHVEODczW1xcdURDMDAtXFx1REVBMVxcdURFQjAtXFx1REZGRl18XFx1RDg3QVtcXHVEQzAwLVxcdURGRTBdfFxcdUQ4N0VbXFx1REMwMC1cXHVERTFEXXxcXHVEODg0W1xcdURDMDAtXFx1REY0QV0pLykpIHJldHVybjtcbiAgICAgIHZhciBuZXh0Q2hhciA9IG1hdGNoWzFdIHx8IG1hdGNoWzJdIHx8ICcnO1xuXG4gICAgICBpZiAoIW5leHRDaGFyIHx8IG5leHRDaGFyICYmIChwcmV2Q2hhciA9PT0gJycgfHwgdGhpcy5ydWxlcy5pbmxpbmUucHVuY3R1YXRpb24uZXhlYyhwcmV2Q2hhcikpKSB7XG4gICAgICAgIHZhciBsTGVuZ3RoID0gbWF0Y2hbMF0ubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIHJEZWxpbSxcbiAgICAgICAgICAgIHJMZW5ndGgsXG4gICAgICAgICAgICBkZWxpbVRvdGFsID0gbExlbmd0aCxcbiAgICAgICAgICAgIG1pZERlbGltVG90YWwgPSAwO1xuICAgICAgICB2YXIgZW5kUmVnID0gbWF0Y2hbMF1bMF0gPT09ICcqJyA/IHRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nLnJEZWxpbUFzdCA6IHRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nLnJEZWxpbVVuZDtcbiAgICAgICAgZW5kUmVnLmxhc3RJbmRleCA9IDA7IC8vIENsaXAgbWFza2VkU3JjIHRvIHNhbWUgc2VjdGlvbiBvZiBzdHJpbmcgYXMgc3JjIChtb3ZlIHRvIGxleGVyPylcblxuICAgICAgICBtYXNrZWRTcmMgPSBtYXNrZWRTcmMuc2xpY2UoLTEgKiBzcmMubGVuZ3RoICsgbExlbmd0aCk7XG5cbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IGVuZFJlZy5leGVjKG1hc2tlZFNyYykpICE9IG51bGwpIHtcbiAgICAgICAgICByRGVsaW0gPSBtYXRjaFsxXSB8fCBtYXRjaFsyXSB8fCBtYXRjaFszXSB8fCBtYXRjaFs0XSB8fCBtYXRjaFs1XSB8fCBtYXRjaFs2XTtcbiAgICAgICAgICBpZiAoIXJEZWxpbSkgY29udGludWU7IC8vIHNraXAgc2luZ2xlICogaW4gX19hYmMqYWJjX19cblxuICAgICAgICAgIHJMZW5ndGggPSByRGVsaW0ubGVuZ3RoO1xuXG4gICAgICAgICAgaWYgKG1hdGNoWzNdIHx8IG1hdGNoWzRdKSB7XG4gICAgICAgICAgICAvLyBmb3VuZCBhbm90aGVyIExlZnQgRGVsaW1cbiAgICAgICAgICAgIGRlbGltVG90YWwgKz0gckxlbmd0aDtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hbNV0gfHwgbWF0Y2hbNl0pIHtcbiAgICAgICAgICAgIC8vIGVpdGhlciBMZWZ0IG9yIFJpZ2h0IERlbGltXG4gICAgICAgICAgICBpZiAobExlbmd0aCAlIDMgJiYgISgobExlbmd0aCArIHJMZW5ndGgpICUgMykpIHtcbiAgICAgICAgICAgICAgbWlkRGVsaW1Ub3RhbCArPSByTGVuZ3RoO1xuICAgICAgICAgICAgICBjb250aW51ZTsgLy8gQ29tbW9uTWFyayBFbXBoYXNpcyBSdWxlcyA5LTEwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGVsaW1Ub3RhbCAtPSByTGVuZ3RoO1xuICAgICAgICAgIGlmIChkZWxpbVRvdGFsID4gMCkgY29udGludWU7IC8vIEhhdmVuJ3QgZm91bmQgZW5vdWdoIGNsb3NpbmcgZGVsaW1pdGVyc1xuICAgICAgICAgIC8vIFJlbW92ZSBleHRyYSBjaGFyYWN0ZXJzLiAqYSoqKiAtPiAqYSpcblxuICAgICAgICAgIHJMZW5ndGggPSBNYXRoLm1pbihyTGVuZ3RoLCByTGVuZ3RoICsgZGVsaW1Ub3RhbCArIG1pZERlbGltVG90YWwpOyAvLyBDcmVhdGUgYGVtYCBpZiBzbWFsbGVzdCBkZWxpbWl0ZXIgaGFzIG9kZCBjaGFyIGNvdW50LiAqYSoqKlxuXG4gICAgICAgICAgaWYgKE1hdGgubWluKGxMZW5ndGgsIHJMZW5ndGgpICUgMikge1xuICAgICAgICAgICAgdmFyIF90ZXh0ID0gc3JjLnNsaWNlKDEsIGxMZW5ndGggKyBtYXRjaC5pbmRleCArIHJMZW5ndGgpO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiAnZW0nLFxuICAgICAgICAgICAgICByYXc6IHNyYy5zbGljZSgwLCBsTGVuZ3RoICsgbWF0Y2guaW5kZXggKyByTGVuZ3RoICsgMSksXG4gICAgICAgICAgICAgIHRleHQ6IF90ZXh0LFxuICAgICAgICAgICAgICB0b2tlbnM6IHRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKF90ZXh0LCBbXSlcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSAvLyBDcmVhdGUgJ3N0cm9uZycgaWYgc21hbGxlc3QgZGVsaW1pdGVyIGhhcyBldmVuIGNoYXIgY291bnQuICoqYSoqKlxuXG5cbiAgICAgICAgICB2YXIgdGV4dCA9IHNyYy5zbGljZSgyLCBsTGVuZ3RoICsgbWF0Y2guaW5kZXggKyByTGVuZ3RoIC0gMSk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJvbmcnLFxuICAgICAgICAgICAgcmF3OiBzcmMuc2xpY2UoMCwgbExlbmd0aCArIG1hdGNoLmluZGV4ICsgckxlbmd0aCArIDEpLFxuICAgICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICAgIHRva2VuczogdGhpcy5sZXhlci5pbmxpbmVUb2tlbnModGV4dCwgW10pXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uY29kZXNwYW4gPSBmdW5jdGlvbiBjb2Rlc3BhbihzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5jb2RlLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dCA9IGNhcFsyXS5yZXBsYWNlKC9cXG4vZywgJyAnKTtcbiAgICAgICAgdmFyIGhhc05vblNwYWNlQ2hhcnMgPSAvW14gXS8udGVzdCh0ZXh0KTtcbiAgICAgICAgdmFyIGhhc1NwYWNlQ2hhcnNPbkJvdGhFbmRzID0gL14gLy50ZXN0KHRleHQpICYmIC8gJC8udGVzdCh0ZXh0KTtcblxuICAgICAgICBpZiAoaGFzTm9uU3BhY2VDaGFycyAmJiBoYXNTcGFjZUNoYXJzT25Cb3RoRW5kcykge1xuICAgICAgICAgIHRleHQgPSB0ZXh0LnN1YnN0cmluZygxLCB0ZXh0Lmxlbmd0aCAtIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGV4dCA9IGVzY2FwZSh0ZXh0LCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnY29kZXNwYW4nLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmJyID0gZnVuY3Rpb24gYnIoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUuYnIuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2JyJyxcbiAgICAgICAgICByYXc6IGNhcFswXVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uZGVsID0gZnVuY3Rpb24gZGVsKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLmRlbC5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnZGVsJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiBjYXBbMl0sXG4gICAgICAgICAgdG9rZW5zOiB0aGlzLmxleGVyLmlubGluZVRva2VucyhjYXBbMl0sIFtdKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uYXV0b2xpbmsgPSBmdW5jdGlvbiBhdXRvbGluayhzcmMsIG1hbmdsZSkge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLmF1dG9saW5rLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dCwgaHJlZjtcblxuICAgICAgICBpZiAoY2FwWzJdID09PSAnQCcpIHtcbiAgICAgICAgICB0ZXh0ID0gZXNjYXBlKHRoaXMub3B0aW9ucy5tYW5nbGUgPyBtYW5nbGUoY2FwWzFdKSA6IGNhcFsxXSk7XG4gICAgICAgICAgaHJlZiA9ICdtYWlsdG86JyArIHRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGV4dCA9IGVzY2FwZShjYXBbMV0pO1xuICAgICAgICAgIGhyZWYgPSB0ZXh0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnbGluaycsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICBocmVmOiBocmVmLFxuICAgICAgICAgIHRva2VuczogW3tcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIHJhdzogdGV4dCxcbiAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8udXJsID0gZnVuY3Rpb24gdXJsKHNyYywgbWFuZ2xlKSB7XG4gICAgICB2YXIgY2FwO1xuXG4gICAgICBpZiAoY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUudXJsLmV4ZWMoc3JjKSkge1xuICAgICAgICB2YXIgdGV4dCwgaHJlZjtcblxuICAgICAgICBpZiAoY2FwWzJdID09PSAnQCcpIHtcbiAgICAgICAgICB0ZXh0ID0gZXNjYXBlKHRoaXMub3B0aW9ucy5tYW5nbGUgPyBtYW5nbGUoY2FwWzBdKSA6IGNhcFswXSk7XG4gICAgICAgICAgaHJlZiA9ICdtYWlsdG86JyArIHRleHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZG8gZXh0ZW5kZWQgYXV0b2xpbmsgcGF0aCB2YWxpZGF0aW9uXG4gICAgICAgICAgdmFyIHByZXZDYXBaZXJvO1xuXG4gICAgICAgICAgZG8ge1xuICAgICAgICAgICAgcHJldkNhcFplcm8gPSBjYXBbMF07XG4gICAgICAgICAgICBjYXBbMF0gPSB0aGlzLnJ1bGVzLmlubGluZS5fYmFja3BlZGFsLmV4ZWMoY2FwWzBdKVswXTtcbiAgICAgICAgICB9IHdoaWxlIChwcmV2Q2FwWmVybyAhPT0gY2FwWzBdKTtcblxuICAgICAgICAgIHRleHQgPSBlc2NhcGUoY2FwWzBdKTtcblxuICAgICAgICAgIGlmIChjYXBbMV0gPT09ICd3d3cuJykge1xuICAgICAgICAgICAgaHJlZiA9ICdodHRwOi8vJyArIHRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhyZWYgPSB0ZXh0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2xpbmsnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgaHJlZjogaHJlZixcbiAgICAgICAgICB0b2tlbnM6IFt7XG4gICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICByYXc6IHRleHQsXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmlubGluZVRleHQgPSBmdW5jdGlvbiBpbmxpbmVUZXh0KHNyYywgc21hcnR5cGFudHMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS50ZXh0LmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dDtcblxuICAgICAgICBpZiAodGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrKSB7XG4gICAgICAgICAgdGV4dCA9IHRoaXMub3B0aW9ucy5zYW5pdGl6ZSA/IHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIgPyB0aGlzLm9wdGlvbnMuc2FuaXRpemVyKGNhcFswXSkgOiBlc2NhcGUoY2FwWzBdKSA6IGNhcFswXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXh0ID0gZXNjYXBlKHRoaXMub3B0aW9ucy5zbWFydHlwYW50cyA/IHNtYXJ0eXBhbnRzKGNhcFswXSkgOiBjYXBbMF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gVG9rZW5pemVyO1xuICB9KCk7XG5cbiAgLyoqXG4gICAqIEJsb2NrLUxldmVsIEdyYW1tYXJcbiAgICovXG5cbiAgdmFyIGJsb2NrID0ge1xuICAgIG5ld2xpbmU6IC9eKD86ICooPzpcXG58JCkpKy8sXG4gICAgY29kZTogL14oIHs0fVteXFxuXSsoPzpcXG4oPzogKig/OlxcbnwkKSkqKT8pKy8sXG4gICAgZmVuY2VzOiAvXiB7MCwzfShgezMsfSg/PVteYFxcbl0qXFxuKXx+ezMsfSkoW15cXG5dKilcXG4oPzp8KFtcXHNcXFNdKj8pXFxuKSg/OiB7MCwzfVxcMVt+YF0qICooPz1cXG58JCl8JCkvLFxuICAgIGhyOiAvXiB7MCwzfSgoPzotICopezMsfXwoPzpfICopezMsfXwoPzpcXCogKil7Myx9KSg/Olxcbit8JCkvLFxuICAgIGhlYWRpbmc6IC9eIHswLDN9KCN7MSw2fSkoPz1cXHN8JCkoLiopKD86XFxuK3wkKS8sXG4gICAgYmxvY2txdW90ZTogL14oIHswLDN9PiA/KHBhcmFncmFwaHxbXlxcbl0qKSg/OlxcbnwkKSkrLyxcbiAgICBsaXN0OiAvXiggezAsM31idWxsKSggW15cXG5dKz8pPyg/OlxcbnwkKS8sXG4gICAgaHRtbDogJ14gezAsM30oPzonIC8vIG9wdGlvbmFsIGluZGVudGF0aW9uXG4gICAgKyAnPChzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKVtcXFxccz5dW1xcXFxzXFxcXFNdKj8oPzo8L1xcXFwxPlteXFxcXG5dKlxcXFxuK3wkKScgLy8gKDEpXG4gICAgKyAnfGNvbW1lbnRbXlxcXFxuXSooXFxcXG4rfCQpJyAvLyAoMilcbiAgICArICd8PFxcXFw/W1xcXFxzXFxcXFNdKj8oPzpcXFxcPz5cXFxcbip8JCknIC8vICgzKVxuICAgICsgJ3w8IVtBLVpdW1xcXFxzXFxcXFNdKj8oPzo+XFxcXG4qfCQpJyAvLyAoNClcbiAgICArICd8PCFcXFxcW0NEQVRBXFxcXFtbXFxcXHNcXFxcU10qPyg/OlxcXFxdXFxcXF0+XFxcXG4qfCQpJyAvLyAoNSlcbiAgICArICd8PC8/KHRhZykoPzogK3xcXFxcbnwvPz4pW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcbiAqKStcXFxcbnwkKScgLy8gKDYpXG4gICAgKyAnfDwoPyFzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhKShbYS16XVtcXFxcdy1dKikoPzphdHRyaWJ1dGUpKj8gKi8/Pig/PVsgXFxcXHRdKig/OlxcXFxufCQpKVtcXFxcc1xcXFxTXSo/KD86KD86XFxcXG4gKikrXFxcXG58JCknIC8vICg3KSBvcGVuIHRhZ1xuICAgICsgJ3w8Lyg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW2Etel1bXFxcXHctXSpcXFxccyo+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcbiAqKStcXFxcbnwkKScgLy8gKDcpIGNsb3NpbmcgdGFnXG4gICAgKyAnKScsXG4gICAgZGVmOiAvXiB7MCwzfVxcWyhsYWJlbClcXF06ICpcXG4/ICo8PyhbXlxccz5dKyk+Pyg/Oig/OiArXFxuPyAqfCAqXFxuICopKHRpdGxlKSk/ICooPzpcXG4rfCQpLyxcbiAgICB0YWJsZTogbm9vcFRlc3QsXG4gICAgbGhlYWRpbmc6IC9eKFteXFxuXSspXFxuIHswLDN9KD0rfC0rKSAqKD86XFxuK3wkKS8sXG4gICAgLy8gcmVnZXggdGVtcGxhdGUsIHBsYWNlaG9sZGVycyB3aWxsIGJlIHJlcGxhY2VkIGFjY29yZGluZyB0byBkaWZmZXJlbnQgcGFyYWdyYXBoXG4gICAgLy8gaW50ZXJydXB0aW9uIHJ1bGVzIG9mIGNvbW1vbm1hcmsgYW5kIHRoZSBvcmlnaW5hbCBtYXJrZG93biBzcGVjOlxuICAgIF9wYXJhZ3JhcGg6IC9eKFteXFxuXSsoPzpcXG4oPyFocnxoZWFkaW5nfGxoZWFkaW5nfGJsb2NrcXVvdGV8ZmVuY2VzfGxpc3R8aHRtbHx0YWJsZXwgK1xcbilbXlxcbl0rKSopLyxcbiAgICB0ZXh0OiAvXlteXFxuXSsvXG4gIH07XG4gIGJsb2NrLl9sYWJlbCA9IC8oPyFcXHMqXFxdKSg/OlxcXFxbXFxbXFxdXXxbXlxcW1xcXV0pKy87XG4gIGJsb2NrLl90aXRsZSA9IC8oPzpcIig/OlxcXFxcIj98W15cIlxcXFxdKSpcInwnW14nXFxuXSooPzpcXG5bXidcXG5dKykqXFxuPyd8XFwoW14oKV0qXFwpKS87XG4gIGJsb2NrLmRlZiA9IGVkaXQoYmxvY2suZGVmKS5yZXBsYWNlKCdsYWJlbCcsIGJsb2NrLl9sYWJlbCkucmVwbGFjZSgndGl0bGUnLCBibG9jay5fdGl0bGUpLmdldFJlZ2V4KCk7XG4gIGJsb2NrLmJ1bGxldCA9IC8oPzpbKistXXxcXGR7MSw5fVsuKV0pLztcbiAgYmxvY2subGlzdEl0ZW1TdGFydCA9IGVkaXQoL14oICopKGJ1bGwpICovKS5yZXBsYWNlKCdidWxsJywgYmxvY2suYnVsbGV0KS5nZXRSZWdleCgpO1xuICBibG9jay5saXN0ID0gZWRpdChibG9jay5saXN0KS5yZXBsYWNlKC9idWxsL2csIGJsb2NrLmJ1bGxldCkucmVwbGFjZSgnaHInLCAnXFxcXG4rKD89XFxcXDE/KD86KD86LSAqKXszLH18KD86XyAqKXszLH18KD86XFxcXCogKil7Myx9KSg/OlxcXFxuK3wkKSknKS5yZXBsYWNlKCdkZWYnLCAnXFxcXG4rKD89JyArIGJsb2NrLmRlZi5zb3VyY2UgKyAnKScpLmdldFJlZ2V4KCk7XG4gIGJsb2NrLl90YWcgPSAnYWRkcmVzc3xhcnRpY2xlfGFzaWRlfGJhc2V8YmFzZWZvbnR8YmxvY2txdW90ZXxib2R5fGNhcHRpb24nICsgJ3xjZW50ZXJ8Y29sfGNvbGdyb3VwfGRkfGRldGFpbHN8ZGlhbG9nfGRpcnxkaXZ8ZGx8ZHR8ZmllbGRzZXR8ZmlnY2FwdGlvbicgKyAnfGZpZ3VyZXxmb290ZXJ8Zm9ybXxmcmFtZXxmcmFtZXNldHxoWzEtNl18aGVhZHxoZWFkZXJ8aHJ8aHRtbHxpZnJhbWUnICsgJ3xsZWdlbmR8bGl8bGlua3xtYWlufG1lbnV8bWVudWl0ZW18bWV0YXxuYXZ8bm9mcmFtZXN8b2x8b3B0Z3JvdXB8b3B0aW9uJyArICd8cHxwYXJhbXxzZWN0aW9ufHNvdXJjZXxzdW1tYXJ5fHRhYmxlfHRib2R5fHRkfHRmb290fHRofHRoZWFkfHRpdGxlfHRyJyArICd8dHJhY2t8dWwnO1xuICBibG9jay5fY29tbWVudCA9IC88IS0tKD8hLT8+KVtcXHNcXFNdKj8oPzotLT58JCkvO1xuICBibG9jay5odG1sID0gZWRpdChibG9jay5odG1sLCAnaScpLnJlcGxhY2UoJ2NvbW1lbnQnLCBibG9jay5fY29tbWVudCkucmVwbGFjZSgndGFnJywgYmxvY2suX3RhZykucmVwbGFjZSgnYXR0cmlidXRlJywgLyArW2EtekEtWjpfXVtcXHcuOi1dKig/OiAqPSAqXCJbXlwiXFxuXSpcInwgKj0gKidbXidcXG5dKid8ICo9ICpbXlxcc1wiJz08PmBdKyk/LykuZ2V0UmVnZXgoKTtcbiAgYmxvY2sucGFyYWdyYXBoID0gZWRpdChibG9jay5fcGFyYWdyYXBoKS5yZXBsYWNlKCdocicsIGJsb2NrLmhyKS5yZXBsYWNlKCdoZWFkaW5nJywgJyB7MCwzfSN7MSw2fSAnKS5yZXBsYWNlKCd8bGhlYWRpbmcnLCAnJykgLy8gc2V0ZXggaGVhZGluZ3MgZG9uJ3QgaW50ZXJydXB0IGNvbW1vbm1hcmsgcGFyYWdyYXBoc1xuICAucmVwbGFjZSgnfHRhYmxlJywgJycpLnJlcGxhY2UoJ2Jsb2NrcXVvdGUnLCAnIHswLDN9PicpLnJlcGxhY2UoJ2ZlbmNlcycsICcgezAsM30oPzpgezMsfSg/PVteYFxcXFxuXSpcXFxcbil8fnszLH0pW15cXFxcbl0qXFxcXG4nKS5yZXBsYWNlKCdsaXN0JywgJyB7MCwzfSg/OlsqKy1dfDFbLildKSAnKSAvLyBvbmx5IGxpc3RzIHN0YXJ0aW5nIGZyb20gMSBjYW4gaW50ZXJydXB0XG4gIC5yZXBsYWNlKCdodG1sJywgJzwvPyg/OnRhZykoPzogK3xcXFxcbnwvPz4pfDwoPzpzY3JpcHR8cHJlfHN0eWxlfHRleHRhcmVhfCEtLSknKS5yZXBsYWNlKCd0YWcnLCBibG9jay5fdGFnKSAvLyBwYXJzIGNhbiBiZSBpbnRlcnJ1cHRlZCBieSB0eXBlICg2KSBodG1sIGJsb2Nrc1xuICAuZ2V0UmVnZXgoKTtcbiAgYmxvY2suYmxvY2txdW90ZSA9IGVkaXQoYmxvY2suYmxvY2txdW90ZSkucmVwbGFjZSgncGFyYWdyYXBoJywgYmxvY2sucGFyYWdyYXBoKS5nZXRSZWdleCgpO1xuICAvKipcbiAgICogTm9ybWFsIEJsb2NrIEdyYW1tYXJcbiAgICovXG5cbiAgYmxvY2subm9ybWFsID0gbWVyZ2Uoe30sIGJsb2NrKTtcbiAgLyoqXG4gICAqIEdGTSBCbG9jayBHcmFtbWFyXG4gICAqL1xuXG4gIGJsb2NrLmdmbSA9IG1lcmdlKHt9LCBibG9jay5ub3JtYWwsIHtcbiAgICB0YWJsZTogJ14gKihbXlxcXFxuIF0uKlxcXFx8LiopXFxcXG4nIC8vIEhlYWRlclxuICAgICsgJyB7MCwzfSg/OlxcXFx8ICopPyg6Py0rOj8gKig/OlxcXFx8ICo6Py0rOj8gKikqKSg/OlxcXFx8ICopPycgLy8gQWxpZ25cbiAgICArICcoPzpcXFxcbigoPzooPyEgKlxcXFxufGhyfGhlYWRpbmd8YmxvY2txdW90ZXxjb2RlfGZlbmNlc3xsaXN0fGh0bWwpLiooPzpcXFxcbnwkKSkqKVxcXFxuKnwkKScgLy8gQ2VsbHNcblxuICB9KTtcbiAgYmxvY2suZ2ZtLnRhYmxlID0gZWRpdChibG9jay5nZm0udGFibGUpLnJlcGxhY2UoJ2hyJywgYmxvY2suaHIpLnJlcGxhY2UoJ2hlYWRpbmcnLCAnIHswLDN9I3sxLDZ9ICcpLnJlcGxhY2UoJ2Jsb2NrcXVvdGUnLCAnIHswLDN9PicpLnJlcGxhY2UoJ2NvZGUnLCAnIHs0fVteXFxcXG5dJykucmVwbGFjZSgnZmVuY2VzJywgJyB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcbicpLnJlcGxhY2UoJ2xpc3QnLCAnIHswLDN9KD86WyorLV18MVsuKV0pICcpIC8vIG9ubHkgbGlzdHMgc3RhcnRpbmcgZnJvbSAxIGNhbiBpbnRlcnJ1cHRcbiAgLnJlcGxhY2UoJ2h0bWwnLCAnPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKScpLnJlcGxhY2UoJ3RhZycsIGJsb2NrLl90YWcpIC8vIHRhYmxlcyBjYW4gYmUgaW50ZXJydXB0ZWQgYnkgdHlwZSAoNikgaHRtbCBibG9ja3NcbiAgLmdldFJlZ2V4KCk7XG4gIGJsb2NrLmdmbS5wYXJhZ3JhcGggPSBlZGl0KGJsb2NrLl9wYXJhZ3JhcGgpLnJlcGxhY2UoJ2hyJywgYmxvY2suaHIpLnJlcGxhY2UoJ2hlYWRpbmcnLCAnIHswLDN9I3sxLDZ9ICcpLnJlcGxhY2UoJ3xsaGVhZGluZycsICcnKSAvLyBzZXRleCBoZWFkaW5ncyBkb24ndCBpbnRlcnJ1cHQgY29tbW9ubWFyayBwYXJhZ3JhcGhzXG4gIC5yZXBsYWNlKCd0YWJsZScsIGJsb2NrLmdmbS50YWJsZSkgLy8gaW50ZXJydXB0IHBhcmFncmFwaHMgd2l0aCB0YWJsZVxuICAucmVwbGFjZSgnYmxvY2txdW90ZScsICcgezAsM30+JykucmVwbGFjZSgnZmVuY2VzJywgJyB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcbicpLnJlcGxhY2UoJ2xpc3QnLCAnIHswLDN9KD86WyorLV18MVsuKV0pICcpIC8vIG9ubHkgbGlzdHMgc3RhcnRpbmcgZnJvbSAxIGNhbiBpbnRlcnJ1cHRcbiAgLnJlcGxhY2UoJ2h0bWwnLCAnPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKScpLnJlcGxhY2UoJ3RhZycsIGJsb2NrLl90YWcpIC8vIHBhcnMgY2FuIGJlIGludGVycnVwdGVkIGJ5IHR5cGUgKDYpIGh0bWwgYmxvY2tzXG4gIC5nZXRSZWdleCgpO1xuICAvKipcbiAgICogUGVkYW50aWMgZ3JhbW1hciAob3JpZ2luYWwgSm9obiBHcnViZXIncyBsb29zZSBtYXJrZG93biBzcGVjaWZpY2F0aW9uKVxuICAgKi9cblxuICBibG9jay5wZWRhbnRpYyA9IG1lcmdlKHt9LCBibG9jay5ub3JtYWwsIHtcbiAgICBodG1sOiBlZGl0KCdeICooPzpjb21tZW50ICooPzpcXFxcbnxcXFxccyokKScgKyAnfDwodGFnKVtcXFxcc1xcXFxTXSs/PC9cXFxcMT4gKig/OlxcXFxuezIsfXxcXFxccyokKScgLy8gY2xvc2VkIHRhZ1xuICAgICsgJ3w8dGFnKD86XCJbXlwiXSpcInxcXCdbXlxcJ10qXFwnfFxcXFxzW15cXCdcIi8+XFxcXHNdKikqPy8/PiAqKD86XFxcXG57Mix9fFxcXFxzKiQpKScpLnJlcGxhY2UoJ2NvbW1lbnQnLCBibG9jay5fY29tbWVudCkucmVwbGFjZSgvdGFnL2csICcoPyEoPzonICsgJ2F8ZW18c3Ryb25nfHNtYWxsfHN8Y2l0ZXxxfGRmbnxhYmJyfGRhdGF8dGltZXxjb2RlfHZhcnxzYW1wfGtiZHxzdWInICsgJ3xzdXB8aXxifHV8bWFya3xydWJ5fHJ0fHJwfGJkaXxiZG98c3Bhbnxicnx3YnJ8aW5zfGRlbHxpbWcpJyArICdcXFxcYilcXFxcdysoPyE6fFteXFxcXHdcXFxcc0BdKkApXFxcXGInKS5nZXRSZWdleCgpLFxuICAgIGRlZjogL14gKlxcWyhbXlxcXV0rKVxcXTogKjw/KFteXFxzPl0rKT4/KD86ICsoW1wiKF1bXlxcbl0rW1wiKV0pKT8gKig/Olxcbit8JCkvLFxuICAgIGhlYWRpbmc6IC9eKCN7MSw2fSkoLiopKD86XFxuK3wkKS8sXG4gICAgZmVuY2VzOiBub29wVGVzdCxcbiAgICAvLyBmZW5jZXMgbm90IHN1cHBvcnRlZFxuICAgIHBhcmFncmFwaDogZWRpdChibG9jay5ub3JtYWwuX3BhcmFncmFwaCkucmVwbGFjZSgnaHInLCBibG9jay5ocikucmVwbGFjZSgnaGVhZGluZycsICcgKiN7MSw2fSAqW15cXG5dJykucmVwbGFjZSgnbGhlYWRpbmcnLCBibG9jay5saGVhZGluZykucmVwbGFjZSgnYmxvY2txdW90ZScsICcgezAsM30+JykucmVwbGFjZSgnfGZlbmNlcycsICcnKS5yZXBsYWNlKCd8bGlzdCcsICcnKS5yZXBsYWNlKCd8aHRtbCcsICcnKS5nZXRSZWdleCgpXG4gIH0pO1xuICAvKipcbiAgICogSW5saW5lLUxldmVsIEdyYW1tYXJcbiAgICovXG5cbiAgdmFyIGlubGluZSA9IHtcbiAgICBlc2NhcGU6IC9eXFxcXChbIVwiIyQlJicoKSorLFxcLS4vOjs8PT4/QFxcW1xcXVxcXFxeX2B7fH1+XSkvLFxuICAgIGF1dG9saW5rOiAvXjwoc2NoZW1lOlteXFxzXFx4MDAtXFx4MWY8Pl0qfGVtYWlsKT4vLFxuICAgIHVybDogbm9vcFRlc3QsXG4gICAgdGFnOiAnXmNvbW1lbnQnICsgJ3xePC9bYS16QS1aXVtcXFxcdzotXSpcXFxccyo+JyAvLyBzZWxmLWNsb3NpbmcgdGFnXG4gICAgKyAnfF48W2EtekEtWl1bXFxcXHctXSooPzphdHRyaWJ1dGUpKj9cXFxccyovPz4nIC8vIG9wZW4gdGFnXG4gICAgKyAnfF48XFxcXD9bXFxcXHNcXFxcU10qP1xcXFw/PicgLy8gcHJvY2Vzc2luZyBpbnN0cnVjdGlvbiwgZS5nLiA8P3BocCA/PlxuICAgICsgJ3xePCFbYS16QS1aXStcXFxcc1tcXFxcc1xcXFxTXSo/PicgLy8gZGVjbGFyYXRpb24sIGUuZy4gPCFET0NUWVBFIGh0bWw+XG4gICAgKyAnfF48IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/XFxcXF1cXFxcXT4nLFxuICAgIC8vIENEQVRBIHNlY3Rpb25cbiAgICBsaW5rOiAvXiE/XFxbKGxhYmVsKVxcXVxcKFxccyooaHJlZikoPzpcXHMrKHRpdGxlKSk/XFxzKlxcKS8sXG4gICAgcmVmbGluazogL14hP1xcWyhsYWJlbClcXF1cXFsoPyFcXHMqXFxdKSgoPzpcXFxcW1xcW1xcXV0/fFteXFxbXFxdXFxcXF0pKylcXF0vLFxuICAgIG5vbGluazogL14hP1xcWyg/IVxccypcXF0pKCg/OlxcW1teXFxbXFxdXSpcXF18XFxcXFtcXFtcXF1dfFteXFxbXFxdXSkqKVxcXSg/OlxcW1xcXSk/LyxcbiAgICByZWZsaW5rU2VhcmNoOiAncmVmbGlua3xub2xpbmsoPyFcXFxcKCknLFxuICAgIGVtU3Ryb25nOiB7XG4gICAgICBsRGVsaW06IC9eKD86XFwqKyg/OihbcHVuY3RfXSl8W15cXHMqXSkpfF5fKyg/OihbcHVuY3QqXSl8KFteXFxzX10pKS8sXG4gICAgICAvLyAgICAgICAgKDEpIGFuZCAoMikgY2FuIG9ubHkgYmUgYSBSaWdodCBEZWxpbWl0ZXIuICgzKSBhbmQgKDQpIGNhbiBvbmx5IGJlIExlZnQuICAoNSkgYW5kICg2KSBjYW4gYmUgZWl0aGVyIExlZnQgb3IgUmlnaHQuXG4gICAgICAvLyAgICAgICAgKCkgU2tpcCBvcnBoYW4gZGVsaW0gaW5zaWRlIHN0cm9uZyAgICAoMSkgIyoqKiAgICAgICAgICAgICAgICAoMikgYSoqKiMsIGEqKiogICAgICAgICAgICAgICAgICAgKDMpICMqKiphLCAqKiphICAgICAgICAgICAgICAgICAoNCkgKioqIyAgICAgICAgICAgICAgKDUpICMqKiojICAgICAgICAgICAgICAgICAoNikgYSoqKmFcbiAgICAgIHJEZWxpbUFzdDogL15bXl8qXSo/XFxfXFxfW15fKl0qP1xcKlteXypdKj8oPz1cXF9cXF8pfFtwdW5jdF9dKFxcKispKD89W1xcc118JCl8W15wdW5jdCpfXFxzXShcXCorKSg/PVtwdW5jdF9cXHNdfCQpfFtwdW5jdF9cXHNdKFxcKispKD89W15wdW5jdCpfXFxzXSl8W1xcc10oXFwqKykoPz1bcHVuY3RfXSl8W3B1bmN0X10oXFwqKykoPz1bcHVuY3RfXSl8W15wdW5jdCpfXFxzXShcXCorKSg/PVtecHVuY3QqX1xcc10pLyxcbiAgICAgIHJEZWxpbVVuZDogL15bXl8qXSo/XFwqXFwqW15fKl0qP1xcX1teXypdKj8oPz1cXCpcXCopfFtwdW5jdCpdKFxcXyspKD89W1xcc118JCl8W15wdW5jdCpfXFxzXShcXF8rKSg/PVtwdW5jdCpcXHNdfCQpfFtwdW5jdCpcXHNdKFxcXyspKD89W15wdW5jdCpfXFxzXSl8W1xcc10oXFxfKykoPz1bcHVuY3QqXSl8W3B1bmN0Kl0oXFxfKykoPz1bcHVuY3QqXSkvIC8vIF4tIE5vdCBhbGxvd2VkIGZvciBfXG5cbiAgICB9LFxuICAgIGNvZGU6IC9eKGArKShbXmBdfFteYF1bXFxzXFxTXSo/W15gXSlcXDEoPyFgKS8sXG4gICAgYnI6IC9eKCB7Mix9fFxcXFwpXFxuKD8hXFxzKiQpLyxcbiAgICBkZWw6IG5vb3BUZXN0LFxuICAgIHRleHQ6IC9eKGArfFteYF0pKD86KD89IHsyLH1cXG4pfFtcXHNcXFNdKj8oPzooPz1bXFxcXDwhXFxbYCpfXXxcXGJffCQpfFteIF0oPz0gezIsfVxcbikpKS8sXG4gICAgcHVuY3R1YXRpb246IC9eKFtcXHNwdW5jdHVhdGlvbl0pL1xuICB9OyAvLyBsaXN0IG9mIHB1bmN0dWF0aW9uIG1hcmtzIGZyb20gQ29tbW9uTWFyayBzcGVjXG4gIC8vIHdpdGhvdXQgKiBhbmQgXyB0byBoYW5kbGUgdGhlIGRpZmZlcmVudCBlbXBoYXNpcyBtYXJrZXJzICogYW5kIF9cblxuICBpbmxpbmUuX3B1bmN0dWF0aW9uID0gJyFcIiMkJSZcXCcoKStcXFxcLS4sLzo7PD0+P0BcXFxcW1xcXFxdYF57fH1+JztcbiAgaW5saW5lLnB1bmN0dWF0aW9uID0gZWRpdChpbmxpbmUucHVuY3R1YXRpb24pLnJlcGxhY2UoL3B1bmN0dWF0aW9uL2csIGlubGluZS5fcHVuY3R1YXRpb24pLmdldFJlZ2V4KCk7IC8vIHNlcXVlbmNlcyBlbSBzaG91bGQgc2tpcCBvdmVyIFt0aXRsZV0obGluayksIGBjb2RlYCwgPGh0bWw+XG5cbiAgaW5saW5lLmJsb2NrU2tpcCA9IC9cXFtbXlxcXV0qP1xcXVxcKFteXFwpXSo/XFwpfGBbXmBdKj9gfDxbXj5dKj8+L2c7XG4gIGlubGluZS5lc2NhcGVkRW1TdCA9IC9cXFxcXFwqfFxcXFxfL2c7XG4gIGlubGluZS5fY29tbWVudCA9IGVkaXQoYmxvY2suX2NvbW1lbnQpLnJlcGxhY2UoJyg/Oi0tPnwkKScsICctLT4nKS5nZXRSZWdleCgpO1xuICBpbmxpbmUuZW1TdHJvbmcubERlbGltID0gZWRpdChpbmxpbmUuZW1TdHJvbmcubERlbGltKS5yZXBsYWNlKC9wdW5jdC9nLCBpbmxpbmUuX3B1bmN0dWF0aW9uKS5nZXRSZWdleCgpO1xuICBpbmxpbmUuZW1TdHJvbmcuckRlbGltQXN0ID0gZWRpdChpbmxpbmUuZW1TdHJvbmcuckRlbGltQXN0LCAnZycpLnJlcGxhY2UoL3B1bmN0L2csIGlubGluZS5fcHVuY3R1YXRpb24pLmdldFJlZ2V4KCk7XG4gIGlubGluZS5lbVN0cm9uZy5yRGVsaW1VbmQgPSBlZGl0KGlubGluZS5lbVN0cm9uZy5yRGVsaW1VbmQsICdnJykucmVwbGFjZSgvcHVuY3QvZywgaW5saW5lLl9wdW5jdHVhdGlvbikuZ2V0UmVnZXgoKTtcbiAgaW5saW5lLl9lc2NhcGVzID0gL1xcXFwoWyFcIiMkJSYnKCkqKyxcXC0uLzo7PD0+P0BcXFtcXF1cXFxcXl9ge3x9fl0pL2c7XG4gIGlubGluZS5fc2NoZW1lID0gL1thLXpBLVpdW2EtekEtWjAtOSsuLV17MSwzMX0vO1xuICBpbmxpbmUuX2VtYWlsID0gL1thLXpBLVowLTkuISMkJSYnKisvPT9eX2B7fH1+LV0rKEApW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSsoPyFbLV9dKS87XG4gIGlubGluZS5hdXRvbGluayA9IGVkaXQoaW5saW5lLmF1dG9saW5rKS5yZXBsYWNlKCdzY2hlbWUnLCBpbmxpbmUuX3NjaGVtZSkucmVwbGFjZSgnZW1haWwnLCBpbmxpbmUuX2VtYWlsKS5nZXRSZWdleCgpO1xuICBpbmxpbmUuX2F0dHJpYnV0ZSA9IC9cXHMrW2EtekEtWjpfXVtcXHcuOi1dKig/Olxccyo9XFxzKlwiW15cIl0qXCJ8XFxzKj1cXHMqJ1teJ10qJ3xcXHMqPVxccypbXlxcc1wiJz08PmBdKyk/LztcbiAgaW5saW5lLnRhZyA9IGVkaXQoaW5saW5lLnRhZykucmVwbGFjZSgnY29tbWVudCcsIGlubGluZS5fY29tbWVudCkucmVwbGFjZSgnYXR0cmlidXRlJywgaW5saW5lLl9hdHRyaWJ1dGUpLmdldFJlZ2V4KCk7XG4gIGlubGluZS5fbGFiZWwgPSAvKD86XFxbKD86XFxcXC58W15cXFtcXF1cXFxcXSkqXFxdfFxcXFwufGBbXmBdKmB8W15cXFtcXF1cXFxcYF0pKj8vO1xuICBpbmxpbmUuX2hyZWYgPSAvPCg/OlxcXFwufFteXFxuPD5cXFxcXSkrPnxbXlxcc1xceDAwLVxceDFmXSovO1xuICBpbmxpbmUuX3RpdGxlID0gL1wiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCcoPzpcXFxcJz98W14nXFxcXF0pKid8XFwoKD86XFxcXFxcKT98W14pXFxcXF0pKlxcKS87XG4gIGlubGluZS5saW5rID0gZWRpdChpbmxpbmUubGluaykucmVwbGFjZSgnbGFiZWwnLCBpbmxpbmUuX2xhYmVsKS5yZXBsYWNlKCdocmVmJywgaW5saW5lLl9ocmVmKS5yZXBsYWNlKCd0aXRsZScsIGlubGluZS5fdGl0bGUpLmdldFJlZ2V4KCk7XG4gIGlubGluZS5yZWZsaW5rID0gZWRpdChpbmxpbmUucmVmbGluaykucmVwbGFjZSgnbGFiZWwnLCBpbmxpbmUuX2xhYmVsKS5nZXRSZWdleCgpO1xuICBpbmxpbmUucmVmbGlua1NlYXJjaCA9IGVkaXQoaW5saW5lLnJlZmxpbmtTZWFyY2gsICdnJykucmVwbGFjZSgncmVmbGluaycsIGlubGluZS5yZWZsaW5rKS5yZXBsYWNlKCdub2xpbmsnLCBpbmxpbmUubm9saW5rKS5nZXRSZWdleCgpO1xuICAvKipcbiAgICogTm9ybWFsIElubGluZSBHcmFtbWFyXG4gICAqL1xuXG4gIGlubGluZS5ub3JtYWwgPSBtZXJnZSh7fSwgaW5saW5lKTtcbiAgLyoqXG4gICAqIFBlZGFudGljIElubGluZSBHcmFtbWFyXG4gICAqL1xuXG4gIGlubGluZS5wZWRhbnRpYyA9IG1lcmdlKHt9LCBpbmxpbmUubm9ybWFsLCB7XG4gICAgc3Ryb25nOiB7XG4gICAgICBzdGFydDogL15fX3xcXCpcXCovLFxuICAgICAgbWlkZGxlOiAvXl9fKD89XFxTKShbXFxzXFxTXSo/XFxTKV9fKD8hXyl8XlxcKlxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCpcXCooPyFcXCopLyxcbiAgICAgIGVuZEFzdDogL1xcKlxcKig/IVxcKikvZyxcbiAgICAgIGVuZFVuZDogL19fKD8hXykvZ1xuICAgIH0sXG4gICAgZW06IHtcbiAgICAgIHN0YXJ0OiAvXl98XFwqLyxcbiAgICAgIG1pZGRsZTogL14oKVxcKig/PVxcUykoW1xcc1xcU10qP1xcUylcXCooPyFcXCopfF5fKD89XFxTKShbXFxzXFxTXSo/XFxTKV8oPyFfKS8sXG4gICAgICBlbmRBc3Q6IC9cXCooPyFcXCopL2csXG4gICAgICBlbmRVbmQ6IC9fKD8hXykvZ1xuICAgIH0sXG4gICAgbGluazogZWRpdCgvXiE/XFxbKGxhYmVsKVxcXVxcKCguKj8pXFwpLykucmVwbGFjZSgnbGFiZWwnLCBpbmxpbmUuX2xhYmVsKS5nZXRSZWdleCgpLFxuICAgIHJlZmxpbms6IGVkaXQoL14hP1xcWyhsYWJlbClcXF1cXHMqXFxbKFteXFxdXSopXFxdLykucmVwbGFjZSgnbGFiZWwnLCBpbmxpbmUuX2xhYmVsKS5nZXRSZWdleCgpXG4gIH0pO1xuICAvKipcbiAgICogR0ZNIElubGluZSBHcmFtbWFyXG4gICAqL1xuXG4gIGlubGluZS5nZm0gPSBtZXJnZSh7fSwgaW5saW5lLm5vcm1hbCwge1xuICAgIGVzY2FwZTogZWRpdChpbmxpbmUuZXNjYXBlKS5yZXBsYWNlKCddKScsICd+fF0pJykuZ2V0UmVnZXgoKSxcbiAgICBfZXh0ZW5kZWRfZW1haWw6IC9bQS1aYS16MC05Ll8rLV0rKEApW2EtekEtWjAtOS1fXSsoPzpcXC5bYS16QS1aMC05LV9dKlthLXpBLVowLTldKSsoPyFbLV9dKS8sXG4gICAgdXJsOiAvXigoPzpmdHB8aHR0cHM/KTpcXC9cXC98d3d3XFwuKSg/OlthLXpBLVowLTlcXC1dK1xcLj8pK1teXFxzPF0qfF5lbWFpbC8sXG4gICAgX2JhY2twZWRhbDogLyg/OltePyEuLDo7Kl9+KCkmXSt8XFwoW14pXSpcXCl8Jig/IVthLXpBLVowLTldKzskKXxbPyEuLDo7Kl9+KV0rKD8hJCkpKy8sXG4gICAgZGVsOiAvXih+fj8pKD89W15cXHN+XSkoW1xcc1xcU10qP1teXFxzfl0pXFwxKD89W15+XXwkKS8sXG4gICAgdGV4dDogL14oW2B+XSt8W15gfl0pKD86KD89IHsyLH1cXG4pfCg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCl8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKn5fXXxcXGJffGh0dHBzPzpcXC9cXC98ZnRwOlxcL1xcL3x3d3dcXC58JCl8W14gXSg/PSB7Mix9XFxuKXxbXmEtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXSg/PVthLXpBLVowLTkuISMkJSYnKitcXC89P19ge1xcfH1+LV0rQCkpKS9cbiAgfSk7XG4gIGlubGluZS5nZm0udXJsID0gZWRpdChpbmxpbmUuZ2ZtLnVybCwgJ2knKS5yZXBsYWNlKCdlbWFpbCcsIGlubGluZS5nZm0uX2V4dGVuZGVkX2VtYWlsKS5nZXRSZWdleCgpO1xuICAvKipcbiAgICogR0ZNICsgTGluZSBCcmVha3MgSW5saW5lIEdyYW1tYXJcbiAgICovXG5cbiAgaW5saW5lLmJyZWFrcyA9IG1lcmdlKHt9LCBpbmxpbmUuZ2ZtLCB7XG4gICAgYnI6IGVkaXQoaW5saW5lLmJyKS5yZXBsYWNlKCd7Mix9JywgJyonKS5nZXRSZWdleCgpLFxuICAgIHRleHQ6IGVkaXQoaW5saW5lLmdmbS50ZXh0KS5yZXBsYWNlKCdcXFxcYl8nLCAnXFxcXGJffCB7Mix9XFxcXG4nKS5yZXBsYWNlKC9cXHsyLFxcfS9nLCAnKicpLmdldFJlZ2V4KClcbiAgfSk7XG5cbiAgLyoqXG4gICAqIHNtYXJ0eXBhbnRzIHRleHQgcmVwbGFjZW1lbnRcbiAgICovXG5cbiAgZnVuY3Rpb24gc21hcnR5cGFudHModGV4dCkge1xuICAgIHJldHVybiB0ZXh0IC8vIGVtLWRhc2hlc1xuICAgIC5yZXBsYWNlKC8tLS0vZywgXCJcXHUyMDE0XCIpIC8vIGVuLWRhc2hlc1xuICAgIC5yZXBsYWNlKC8tLS9nLCBcIlxcdTIwMTNcIikgLy8gb3BlbmluZyBzaW5nbGVzXG4gICAgLnJlcGxhY2UoLyhefFstXFx1MjAxNC8oXFxbe1wiXFxzXSknL2csIFwiJDFcXHUyMDE4XCIpIC8vIGNsb3Npbmcgc2luZ2xlcyAmIGFwb3N0cm9waGVzXG4gICAgLnJlcGxhY2UoLycvZywgXCJcXHUyMDE5XCIpIC8vIG9wZW5pbmcgZG91Ymxlc1xuICAgIC5yZXBsYWNlKC8oXnxbLVxcdTIwMTQvKFxcW3tcXHUyMDE4XFxzXSlcIi9nLCBcIiQxXFx1MjAxQ1wiKSAvLyBjbG9zaW5nIGRvdWJsZXNcbiAgICAucmVwbGFjZSgvXCIvZywgXCJcXHUyMDFEXCIpIC8vIGVsbGlwc2VzXG4gICAgLnJlcGxhY2UoL1xcLnszfS9nLCBcIlxcdTIwMjZcIik7XG4gIH1cbiAgLyoqXG4gICAqIG1hbmdsZSBlbWFpbCBhZGRyZXNzZXNcbiAgICovXG5cblxuICBmdW5jdGlvbiBtYW5nbGUodGV4dCkge1xuICAgIHZhciBvdXQgPSAnJyxcbiAgICAgICAgaSxcbiAgICAgICAgY2g7XG4gICAgdmFyIGwgPSB0ZXh0Lmxlbmd0aDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGNoID0gdGV4dC5jaGFyQ29kZUF0KGkpO1xuXG4gICAgICBpZiAoTWF0aC5yYW5kb20oKSA+IDAuNSkge1xuICAgICAgICBjaCA9ICd4JyArIGNoLnRvU3RyaW5nKDE2KTtcbiAgICAgIH1cblxuICAgICAgb3V0ICs9ICcmIycgKyBjaCArICc7JztcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xuICB9XG4gIC8qKlxuICAgKiBCbG9jayBMZXhlclxuICAgKi9cblxuXG4gIHZhciBMZXhlciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGV4ZXIob3B0aW9ucykge1xuICAgICAgdGhpcy50b2tlbnMgPSBbXTtcbiAgICAgIHRoaXMudG9rZW5zLmxpbmtzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgZXhwb3J0cy5kZWZhdWx0cztcbiAgICAgIHRoaXMub3B0aW9ucy50b2tlbml6ZXIgPSB0aGlzLm9wdGlvbnMudG9rZW5pemVyIHx8IG5ldyBUb2tlbml6ZXIoKTtcbiAgICAgIHRoaXMudG9rZW5pemVyID0gdGhpcy5vcHRpb25zLnRva2VuaXplcjtcbiAgICAgIHRoaXMudG9rZW5pemVyLm9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICB0aGlzLnRva2VuaXplci5sZXhlciA9IHRoaXM7XG4gICAgICB0aGlzLmlubGluZVF1ZXVlID0gW107XG4gICAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgICBpbkxpbms6IGZhbHNlLFxuICAgICAgICBpblJhd0Jsb2NrOiBmYWxzZSxcbiAgICAgICAgdG9wOiB0cnVlXG4gICAgICB9O1xuICAgICAgdmFyIHJ1bGVzID0ge1xuICAgICAgICBibG9jazogYmxvY2subm9ybWFsLFxuICAgICAgICBpbmxpbmU6IGlubGluZS5ub3JtYWxcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgcnVsZXMuYmxvY2sgPSBibG9jay5wZWRhbnRpYztcbiAgICAgICAgcnVsZXMuaW5saW5lID0gaW5saW5lLnBlZGFudGljO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZ2ZtKSB7XG4gICAgICAgIHJ1bGVzLmJsb2NrID0gYmxvY2suZ2ZtO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnJlYWtzKSB7XG4gICAgICAgICAgcnVsZXMuaW5saW5lID0gaW5saW5lLmJyZWFrcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBydWxlcy5pbmxpbmUgPSBpbmxpbmUuZ2ZtO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMudG9rZW5pemVyLnJ1bGVzID0gcnVsZXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEV4cG9zZSBSdWxlc1xuICAgICAqL1xuXG5cbiAgICAvKipcbiAgICAgKiBTdGF0aWMgTGV4IE1ldGhvZFxuICAgICAqL1xuICAgIExleGVyLmxleCA9IGZ1bmN0aW9uIGxleChzcmMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBsZXhlciA9IG5ldyBMZXhlcihvcHRpb25zKTtcbiAgICAgIHJldHVybiBsZXhlci5sZXgoc3JjKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhdGljIExleCBJbmxpbmUgTWV0aG9kXG4gICAgICovXG4gICAgO1xuXG4gICAgTGV4ZXIubGV4SW5saW5lID0gZnVuY3Rpb24gbGV4SW5saW5lKHNyYywgb3B0aW9ucykge1xuICAgICAgdmFyIGxleGVyID0gbmV3IExleGVyKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIGxleGVyLmlubGluZVRva2VucyhzcmMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcmVwcm9jZXNzaW5nXG4gICAgICovXG4gICAgO1xuXG4gICAgdmFyIF9wcm90byA9IExleGVyLnByb3RvdHlwZTtcblxuICAgIF9wcm90by5sZXggPSBmdW5jdGlvbiBsZXgoc3JjKSB7XG4gICAgICBzcmMgPSBzcmMucmVwbGFjZSgvXFxyXFxufFxcci9nLCAnXFxuJykucmVwbGFjZSgvXFx0L2csICcgICAgJyk7XG4gICAgICB0aGlzLmJsb2NrVG9rZW5zKHNyYywgdGhpcy50b2tlbnMpO1xuICAgICAgdmFyIG5leHQ7XG5cbiAgICAgIHdoaWxlIChuZXh0ID0gdGhpcy5pbmxpbmVRdWV1ZS5zaGlmdCgpKSB7XG4gICAgICAgIHRoaXMuaW5saW5lVG9rZW5zKG5leHQuc3JjLCBuZXh0LnRva2Vucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnRva2VucztcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGV4aW5nXG4gICAgICovXG4gICAgO1xuXG4gICAgX3Byb3RvLmJsb2NrVG9rZW5zID0gZnVuY3Rpb24gYmxvY2tUb2tlbnMoc3JjLCB0b2tlbnMpIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgIGlmICh0b2tlbnMgPT09IHZvaWQgMCkge1xuICAgICAgICB0b2tlbnMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgICAgICBzcmMgPSBzcmMucmVwbGFjZSgvXiArJC9nbSwgJycpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdG9rZW4sIGxhc3RUb2tlbiwgY3V0U3JjLCBsYXN0UGFyYWdyYXBoQ2xpcHBlZDtcblxuICAgICAgd2hpbGUgKHNyYykge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmV4dGVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuYmxvY2sgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuYmxvY2suc29tZShmdW5jdGlvbiAoZXh0VG9rZW5pemVyKSB7XG4gICAgICAgICAgaWYgKHRva2VuID0gZXh0VG9rZW5pemVyLmNhbGwoe1xuICAgICAgICAgICAgbGV4ZXI6IF90aGlzXG4gICAgICAgICAgfSwgc3JjLCB0b2tlbnMpKSB7XG4gICAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIG5ld2xpbmVcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnNwYWNlKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuXG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUpIHtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBjb2RlXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5jb2RlKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07IC8vIEFuIGluZGVudGVkIGNvZGUgYmxvY2sgY2Fubm90IGludGVycnVwdCBhIHBhcmFncmFwaC5cblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgKGxhc3RUb2tlbi50eXBlID09PSAncGFyYWdyYXBoJyB8fCBsYXN0VG9rZW4udHlwZSA9PT0gJ3RleHQnKSkge1xuICAgICAgICAgICAgbGFzdFRva2VuLnJhdyArPSAnXFxuJyArIHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9ICdcXG4nICsgdG9rZW4udGV4dDtcbiAgICAgICAgICAgIHRoaXMuaW5saW5lUXVldWVbdGhpcy5pbmxpbmVRdWV1ZS5sZW5ndGggLSAxXS5zcmMgPSBsYXN0VG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGZlbmNlc1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuZmVuY2VzKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBoZWFkaW5nXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5oZWFkaW5nKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBoclxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuaHIoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGJsb2NrcXVvdGVcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmJsb2NrcXVvdGUoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGxpc3RcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmxpc3Qoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGh0bWxcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmh0bWwoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGRlZlxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuZGVmKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFRva2VuICYmIChsYXN0VG9rZW4udHlwZSA9PT0gJ3BhcmFncmFwaCcgfHwgbGFzdFRva2VuLnR5cGUgPT09ICd0ZXh0JykpIHtcbiAgICAgICAgICAgIGxhc3RUb2tlbi5yYXcgKz0gJ1xcbicgKyB0b2tlbi5yYXc7XG4gICAgICAgICAgICBsYXN0VG9rZW4udGV4dCArPSAnXFxuJyArIHRva2VuLnJhdztcbiAgICAgICAgICAgIHRoaXMuaW5saW5lUXVldWVbdGhpcy5pbmxpbmVRdWV1ZS5sZW5ndGggLSAxXS5zcmMgPSBsYXN0VG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLnRva2Vucy5saW5rc1t0b2tlbi50YWddKSB7XG4gICAgICAgICAgICB0aGlzLnRva2Vucy5saW5rc1t0b2tlbi50YWddID0ge1xuICAgICAgICAgICAgICBocmVmOiB0b2tlbi5ocmVmLFxuICAgICAgICAgICAgICB0aXRsZTogdG9rZW4udGl0bGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gdGFibGUgKGdmbSlcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnRhYmxlKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBsaGVhZGluZ1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIubGhlYWRpbmcoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIHRvcC1sZXZlbCBwYXJhZ3JhcGhcbiAgICAgICAgLy8gcHJldmVudCBwYXJhZ3JhcGggY29uc3VtaW5nIGV4dGVuc2lvbnMgYnkgY2xpcHBpbmcgJ3NyYycgdG8gZXh0ZW5zaW9uIHN0YXJ0XG5cblxuICAgICAgICBjdXRTcmMgPSBzcmM7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5leHRlbnNpb25zICYmIHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0QmxvY2spIHtcbiAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN0YXJ0SW5kZXggPSBJbmZpbml0eTtcbiAgICAgICAgICAgIHZhciB0ZW1wU3JjID0gc3JjLnNsaWNlKDEpO1xuICAgICAgICAgICAgdmFyIHRlbXBTdGFydCA9IHZvaWQgMDtcblxuICAgICAgICAgICAgX3RoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0QmxvY2suZm9yRWFjaChmdW5jdGlvbiAoZ2V0U3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICB0ZW1wU3RhcnQgPSBnZXRTdGFydEluZGV4LmNhbGwoe1xuICAgICAgICAgICAgICAgIGxleGVyOiB0aGlzXG4gICAgICAgICAgICAgIH0sIHRlbXBTcmMpO1xuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdGVtcFN0YXJ0ID09PSAnbnVtYmVyJyAmJiB0ZW1wU3RhcnQgPj0gMCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXggPSBNYXRoLm1pbihzdGFydEluZGV4LCB0ZW1wU3RhcnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHN0YXJ0SW5kZXggPCBJbmZpbml0eSAmJiBzdGFydEluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgY3V0U3JjID0gc3JjLnN1YnN0cmluZygwLCBzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnRvcCAmJiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5wYXJhZ3JhcGgoY3V0U3JjKSkpIHtcbiAgICAgICAgICBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgICAgaWYgKGxhc3RQYXJhZ3JhcGhDbGlwcGVkICYmIGxhc3RUb2tlbi50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgbGFzdFRva2VuLnJhdyArPSAnXFxuJyArIHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9ICdcXG4nICsgdG9rZW4udGV4dDtcbiAgICAgICAgICAgIHRoaXMuaW5saW5lUXVldWUucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmlubGluZVF1ZXVlW3RoaXMuaW5saW5lUXVldWUubGVuZ3RoIC0gMV0uc3JjID0gbGFzdFRva2VuLnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsYXN0UGFyYWdyYXBoQ2xpcHBlZCA9IGN1dFNyYy5sZW5ndGggIT09IHNyYy5sZW5ndGg7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyB0ZXh0XG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci50ZXh0KHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFRva2VuICYmIGxhc3RUb2tlbi50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIGxhc3RUb2tlbi5yYXcgKz0gJ1xcbicgKyB0b2tlbi5yYXc7XG4gICAgICAgICAgICBsYXN0VG9rZW4udGV4dCArPSAnXFxuJyArIHRva2VuLnRleHQ7XG4gICAgICAgICAgICB0aGlzLmlubGluZVF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5pbmxpbmVRdWV1ZVt0aGlzLmlubGluZVF1ZXVlLmxlbmd0aCAtIDFdLnNyYyA9IGxhc3RUb2tlbi50ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3JjKSB7XG4gICAgICAgICAgdmFyIGVyck1zZyA9ICdJbmZpbml0ZSBsb29wIG9uIGJ5dGU6ICcgKyBzcmMuY2hhckNvZGVBdCgwKTtcblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyck1zZyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhdGUudG9wID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgfTtcblxuICAgIF9wcm90by5pbmxpbmUgPSBmdW5jdGlvbiBpbmxpbmUoc3JjLCB0b2tlbnMpIHtcbiAgICAgIHRoaXMuaW5saW5lUXVldWUucHVzaCh7XG4gICAgICAgIHNyYzogc3JjLFxuICAgICAgICB0b2tlbnM6IHRva2Vuc1xuICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExleGluZy9Db21waWxpbmdcbiAgICAgKi9cbiAgICA7XG5cbiAgICBfcHJvdG8uaW5saW5lVG9rZW5zID0gZnVuY3Rpb24gaW5saW5lVG9rZW5zKHNyYywgdG9rZW5zKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgaWYgKHRva2VucyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRva2VucyA9IFtdO1xuICAgICAgfVxuXG4gICAgICB2YXIgdG9rZW4sIGxhc3RUb2tlbiwgY3V0U3JjOyAvLyBTdHJpbmcgd2l0aCBsaW5rcyBtYXNrZWQgdG8gYXZvaWQgaW50ZXJmZXJlbmNlIHdpdGggZW0gYW5kIHN0cm9uZ1xuXG4gICAgICB2YXIgbWFza2VkU3JjID0gc3JjO1xuICAgICAgdmFyIG1hdGNoO1xuICAgICAgdmFyIGtlZXBQcmV2Q2hhciwgcHJldkNoYXI7IC8vIE1hc2sgb3V0IHJlZmxpbmtzXG5cbiAgICAgIGlmICh0aGlzLnRva2Vucy5saW5rcykge1xuICAgICAgICB2YXIgbGlua3MgPSBPYmplY3Qua2V5cyh0aGlzLnRva2Vucy5saW5rcyk7XG5cbiAgICAgICAgaWYgKGxpbmtzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB3aGlsZSAoKG1hdGNoID0gdGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2guZXhlYyhtYXNrZWRTcmMpKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobGlua3MuaW5jbHVkZXMobWF0Y2hbMF0uc2xpY2UobWF0Y2hbMF0ubGFzdEluZGV4T2YoJ1snKSArIDEsIC0xKSkpIHtcbiAgICAgICAgICAgICAgbWFza2VkU3JjID0gbWFza2VkU3JjLnNsaWNlKDAsIG1hdGNoLmluZGV4KSArICdbJyArIHJlcGVhdFN0cmluZygnYScsIG1hdGNoWzBdLmxlbmd0aCAtIDIpICsgJ10nICsgbWFza2VkU3JjLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5yZWZsaW5rU2VhcmNoLmxhc3RJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IC8vIE1hc2sgb3V0IG90aGVyIGJsb2Nrc1xuXG5cbiAgICAgIHdoaWxlICgobWF0Y2ggPSB0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmV4ZWMobWFza2VkU3JjKSkgIT0gbnVsbCkge1xuICAgICAgICBtYXNrZWRTcmMgPSBtYXNrZWRTcmMuc2xpY2UoMCwgbWF0Y2guaW5kZXgpICsgJ1snICsgcmVwZWF0U3RyaW5nKCdhJywgbWF0Y2hbMF0ubGVuZ3RoIC0gMikgKyAnXScgKyBtYXNrZWRTcmMuc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmJsb2NrU2tpcC5sYXN0SW5kZXgpO1xuICAgICAgfSAvLyBNYXNrIG91dCBlc2NhcGVkIGVtICYgc3Ryb25nIGRlbGltaXRlcnNcblxuXG4gICAgICB3aGlsZSAoKG1hdGNoID0gdGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLmVzY2FwZWRFbVN0LmV4ZWMobWFza2VkU3JjKSkgIT0gbnVsbCkge1xuICAgICAgICBtYXNrZWRTcmMgPSBtYXNrZWRTcmMuc2xpY2UoMCwgbWF0Y2guaW5kZXgpICsgJysrJyArIG1hc2tlZFNyYy5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuZXNjYXBlZEVtU3QubGFzdEluZGV4KTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHNyYykge1xuICAgICAgICBpZiAoIWtlZXBQcmV2Q2hhcikge1xuICAgICAgICAgIHByZXZDaGFyID0gJyc7XG4gICAgICAgIH1cblxuICAgICAgICBrZWVwUHJldkNoYXIgPSBmYWxzZTsgLy8gZXh0ZW5zaW9uc1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucyAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5pbmxpbmUgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuaW5saW5lLnNvbWUoZnVuY3Rpb24gKGV4dFRva2VuaXplcikge1xuICAgICAgICAgIGlmICh0b2tlbiA9IGV4dFRva2VuaXplci5jYWxsKHtcbiAgICAgICAgICAgIGxleGVyOiBfdGhpczJcbiAgICAgICAgICB9LCBzcmMsIHRva2VucykpIHtcbiAgICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gZXNjYXBlXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5lc2NhcGUoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIHRhZ1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIudGFnKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFRva2VuICYmIHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiBsYXN0VG9rZW4udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICBsYXN0VG9rZW4ucmF3ICs9IHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9IHRva2VuLnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBsaW5rXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5saW5rKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyByZWZsaW5rLCBub2xpbmtcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnJlZmxpbmsoc3JjLCB0aGlzLnRva2Vucy5saW5rcykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFRva2VuICYmIHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiBsYXN0VG9rZW4udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICBsYXN0VG9rZW4ucmF3ICs9IHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9IHRva2VuLnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBlbSAmIHN0cm9uZ1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuZW1TdHJvbmcoc3JjLCBtYXNrZWRTcmMsIHByZXZDaGFyKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGNvZGVcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmNvZGVzcGFuKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBiclxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuYnIoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGRlbCAoZ2ZtKVxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuZGVsKHNyYykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBhdXRvbGlua1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuYXV0b2xpbmsoc3JjLCBtYW5nbGUpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gdXJsIChnZm0pXG5cblxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuaW5MaW5rICYmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnVybChzcmMsIG1hbmdsZSkpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gdGV4dFxuICAgICAgICAvLyBwcmV2ZW50IGlubGluZVRleHQgY29uc3VtaW5nIGV4dGVuc2lvbnMgYnkgY2xpcHBpbmcgJ3NyYycgdG8gZXh0ZW5zaW9uIHN0YXJ0XG5cblxuICAgICAgICBjdXRTcmMgPSBzcmM7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5leHRlbnNpb25zICYmIHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnN0YXJ0SW5saW5lKSB7XG4gICAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzdGFydEluZGV4ID0gSW5maW5pdHk7XG4gICAgICAgICAgICB2YXIgdGVtcFNyYyA9IHNyYy5zbGljZSgxKTtcbiAgICAgICAgICAgIHZhciB0ZW1wU3RhcnQgPSB2b2lkIDA7XG5cbiAgICAgICAgICAgIF90aGlzMi5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRJbmxpbmUuZm9yRWFjaChmdW5jdGlvbiAoZ2V0U3RhcnRJbmRleCkge1xuICAgICAgICAgICAgICB0ZW1wU3RhcnQgPSBnZXRTdGFydEluZGV4LmNhbGwoe1xuICAgICAgICAgICAgICAgIGxleGVyOiB0aGlzXG4gICAgICAgICAgICAgIH0sIHRlbXBTcmMpO1xuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgdGVtcFN0YXJ0ID09PSAnbnVtYmVyJyAmJiB0ZW1wU3RhcnQgPj0gMCkge1xuICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXggPSBNYXRoLm1pbihzdGFydEluZGV4LCB0ZW1wU3RhcnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHN0YXJ0SW5kZXggPCBJbmZpbml0eSAmJiBzdGFydEluZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgY3V0U3JjID0gc3JjLnN1YnN0cmluZygwLCBzdGFydEluZGV4ICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmlubGluZVRleHQoY3V0U3JjLCBzbWFydHlwYW50cykpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuXG4gICAgICAgICAgaWYgKHRva2VuLnJhdy5zbGljZSgtMSkgIT09ICdfJykge1xuICAgICAgICAgICAgLy8gVHJhY2sgcHJldkNoYXIgYmVmb3JlIHN0cmluZyBvZiBfX19fIHN0YXJ0ZWRcbiAgICAgICAgICAgIHByZXZDaGFyID0gdG9rZW4ucmF3LnNsaWNlKC0xKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBrZWVwUHJldkNoYXIgPSB0cnVlO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFRva2VuICYmIGxhc3RUb2tlbi50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIGxhc3RUb2tlbi5yYXcgKz0gdG9rZW4ucmF3O1xuICAgICAgICAgICAgbGFzdFRva2VuLnRleHQgKz0gdG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNyYykge1xuICAgICAgICAgIHZhciBlcnJNc2cgPSAnSW5maW5pdGUgbG9vcCBvbiBieXRlOiAnICsgc3JjLmNoYXJDb2RlQXQoMCk7XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpbGVudCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJNc2cpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdG9rZW5zO1xuICAgIH07XG5cbiAgICBfY3JlYXRlQ2xhc3MoTGV4ZXIsIG51bGwsIFt7XG4gICAgICBrZXk6IFwicnVsZXNcIixcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGJsb2NrOiBibG9jayxcbiAgICAgICAgICBpbmxpbmU6IGlubGluZVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBMZXhlcjtcbiAgfSgpO1xuXG4gIC8qKlxuICAgKiBSZW5kZXJlclxuICAgKi9cblxuICB2YXIgUmVuZGVyZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlbmRlcmVyKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgZXhwb3J0cy5kZWZhdWx0cztcbiAgICB9XG5cbiAgICB2YXIgX3Byb3RvID0gUmVuZGVyZXIucHJvdG90eXBlO1xuXG4gICAgX3Byb3RvLmNvZGUgPSBmdW5jdGlvbiBjb2RlKF9jb2RlLCBpbmZvc3RyaW5nLCBlc2NhcGVkKSB7XG4gICAgICB2YXIgbGFuZyA9IChpbmZvc3RyaW5nIHx8ICcnKS5tYXRjaCgvXFxTKi8pWzBdO1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhpZ2hsaWdodCkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vcHRpb25zLmhpZ2hsaWdodChfY29kZSwgbGFuZyk7XG5cbiAgICAgICAgaWYgKG91dCAhPSBudWxsICYmIG91dCAhPT0gX2NvZGUpIHtcbiAgICAgICAgICBlc2NhcGVkID0gdHJ1ZTtcbiAgICAgICAgICBfY29kZSA9IG91dDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBfY29kZSA9IF9jb2RlLnJlcGxhY2UoL1xcbiQvLCAnJykgKyAnXFxuJztcblxuICAgICAgaWYgKCFsYW5nKSB7XG4gICAgICAgIHJldHVybiAnPHByZT48Y29kZT4nICsgKGVzY2FwZWQgPyBfY29kZSA6IGVzY2FwZShfY29kZSwgdHJ1ZSkpICsgJzwvY29kZT48L3ByZT5cXG4nO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJzxwcmU+PGNvZGUgY2xhc3M9XCInICsgdGhpcy5vcHRpb25zLmxhbmdQcmVmaXggKyBlc2NhcGUobGFuZywgdHJ1ZSkgKyAnXCI+JyArIChlc2NhcGVkID8gX2NvZGUgOiBlc2NhcGUoX2NvZGUsIHRydWUpKSArICc8L2NvZGU+PC9wcmU+XFxuJztcbiAgICB9O1xuXG4gICAgX3Byb3RvLmJsb2NrcXVvdGUgPSBmdW5jdGlvbiBibG9ja3F1b3RlKHF1b3RlKSB7XG4gICAgICByZXR1cm4gJzxibG9ja3F1b3RlPlxcbicgKyBxdW90ZSArICc8L2Jsb2NrcXVvdGU+XFxuJztcbiAgICB9O1xuXG4gICAgX3Byb3RvLmh0bWwgPSBmdW5jdGlvbiBodG1sKF9odG1sKSB7XG4gICAgICByZXR1cm4gX2h0bWw7XG4gICAgfTtcblxuICAgIF9wcm90by5oZWFkaW5nID0gZnVuY3Rpb24gaGVhZGluZyh0ZXh0LCBsZXZlbCwgcmF3LCBzbHVnZ2VyKSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLmhlYWRlcklkcykge1xuICAgICAgICByZXR1cm4gJzxoJyArIGxldmVsICsgJyBpZD1cIicgKyB0aGlzLm9wdGlvbnMuaGVhZGVyUHJlZml4ICsgc2x1Z2dlci5zbHVnKHJhdykgKyAnXCI+JyArIHRleHQgKyAnPC9oJyArIGxldmVsICsgJz5cXG4nO1xuICAgICAgfSAvLyBpZ25vcmUgSURzXG5cblxuICAgICAgcmV0dXJuICc8aCcgKyBsZXZlbCArICc+JyArIHRleHQgKyAnPC9oJyArIGxldmVsICsgJz5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uaHIgPSBmdW5jdGlvbiBocigpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMueGh0bWwgPyAnPGhyLz5cXG4nIDogJzxocj5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8ubGlzdCA9IGZ1bmN0aW9uIGxpc3QoYm9keSwgb3JkZXJlZCwgc3RhcnQpIHtcbiAgICAgIHZhciB0eXBlID0gb3JkZXJlZCA/ICdvbCcgOiAndWwnLFxuICAgICAgICAgIHN0YXJ0YXR0ID0gb3JkZXJlZCAmJiBzdGFydCAhPT0gMSA/ICcgc3RhcnQ9XCInICsgc3RhcnQgKyAnXCInIDogJyc7XG4gICAgICByZXR1cm4gJzwnICsgdHlwZSArIHN0YXJ0YXR0ICsgJz5cXG4nICsgYm9keSArICc8LycgKyB0eXBlICsgJz5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8ubGlzdGl0ZW0gPSBmdW5jdGlvbiBsaXN0aXRlbSh0ZXh0KSB7XG4gICAgICByZXR1cm4gJzxsaT4nICsgdGV4dCArICc8L2xpPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by5jaGVja2JveCA9IGZ1bmN0aW9uIGNoZWNrYm94KGNoZWNrZWQpIHtcbiAgICAgIHJldHVybiAnPGlucHV0ICcgKyAoY2hlY2tlZCA/ICdjaGVja2VkPVwiXCIgJyA6ICcnKSArICdkaXNhYmxlZD1cIlwiIHR5cGU9XCJjaGVja2JveFwiJyArICh0aGlzLm9wdGlvbnMueGh0bWwgPyAnIC8nIDogJycpICsgJz4gJztcbiAgICB9O1xuXG4gICAgX3Byb3RvLnBhcmFncmFwaCA9IGZ1bmN0aW9uIHBhcmFncmFwaCh0ZXh0KSB7XG4gICAgICByZXR1cm4gJzxwPicgKyB0ZXh0ICsgJzwvcD5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8udGFibGUgPSBmdW5jdGlvbiB0YWJsZShoZWFkZXIsIGJvZHkpIHtcbiAgICAgIGlmIChib2R5KSBib2R5ID0gJzx0Ym9keT4nICsgYm9keSArICc8L3Rib2R5Pic7XG4gICAgICByZXR1cm4gJzx0YWJsZT5cXG4nICsgJzx0aGVhZD5cXG4nICsgaGVhZGVyICsgJzwvdGhlYWQ+XFxuJyArIGJvZHkgKyAnPC90YWJsZT5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8udGFibGVyb3cgPSBmdW5jdGlvbiB0YWJsZXJvdyhjb250ZW50KSB7XG4gICAgICByZXR1cm4gJzx0cj5cXG4nICsgY29udGVudCArICc8L3RyPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by50YWJsZWNlbGwgPSBmdW5jdGlvbiB0YWJsZWNlbGwoY29udGVudCwgZmxhZ3MpIHtcbiAgICAgIHZhciB0eXBlID0gZmxhZ3MuaGVhZGVyID8gJ3RoJyA6ICd0ZCc7XG4gICAgICB2YXIgdGFnID0gZmxhZ3MuYWxpZ24gPyAnPCcgKyB0eXBlICsgJyBhbGlnbj1cIicgKyBmbGFncy5hbGlnbiArICdcIj4nIDogJzwnICsgdHlwZSArICc+JztcbiAgICAgIHJldHVybiB0YWcgKyBjb250ZW50ICsgJzwvJyArIHR5cGUgKyAnPlxcbic7XG4gICAgfSAvLyBzcGFuIGxldmVsIHJlbmRlcmVyXG4gICAgO1xuXG4gICAgX3Byb3RvLnN0cm9uZyA9IGZ1bmN0aW9uIHN0cm9uZyh0ZXh0KSB7XG4gICAgICByZXR1cm4gJzxzdHJvbmc+JyArIHRleHQgKyAnPC9zdHJvbmc+JztcbiAgICB9O1xuXG4gICAgX3Byb3RvLmVtID0gZnVuY3Rpb24gZW0odGV4dCkge1xuICAgICAgcmV0dXJuICc8ZW0+JyArIHRleHQgKyAnPC9lbT4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uY29kZXNwYW4gPSBmdW5jdGlvbiBjb2Rlc3Bhbih0ZXh0KSB7XG4gICAgICByZXR1cm4gJzxjb2RlPicgKyB0ZXh0ICsgJzwvY29kZT4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uYnIgPSBmdW5jdGlvbiBicigpIHtcbiAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMueGh0bWwgPyAnPGJyLz4nIDogJzxicj4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uZGVsID0gZnVuY3Rpb24gZGVsKHRleHQpIHtcbiAgICAgIHJldHVybiAnPGRlbD4nICsgdGV4dCArICc8L2RlbD4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8ubGluayA9IGZ1bmN0aW9uIGxpbmsoaHJlZiwgdGl0bGUsIHRleHQpIHtcbiAgICAgIGhyZWYgPSBjbGVhblVybCh0aGlzLm9wdGlvbnMuc2FuaXRpemUsIHRoaXMub3B0aW9ucy5iYXNlVXJsLCBocmVmKTtcblxuICAgICAgaWYgKGhyZWYgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvdXQgPSAnPGEgaHJlZj1cIicgKyBlc2NhcGUoaHJlZikgKyAnXCInO1xuXG4gICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgb3V0ICs9ICcgdGl0bGU9XCInICsgdGl0bGUgKyAnXCInO1xuICAgICAgfVxuXG4gICAgICBvdXQgKz0gJz4nICsgdGV4dCArICc8L2E+JztcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcblxuICAgIF9wcm90by5pbWFnZSA9IGZ1bmN0aW9uIGltYWdlKGhyZWYsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICBocmVmID0gY2xlYW5VcmwodGhpcy5vcHRpb25zLnNhbml0aXplLCB0aGlzLm9wdGlvbnMuYmFzZVVybCwgaHJlZik7XG5cbiAgICAgIGlmIChocmVmID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgfVxuXG4gICAgICB2YXIgb3V0ID0gJzxpbWcgc3JjPVwiJyArIGhyZWYgKyAnXCIgYWx0PVwiJyArIHRleHQgKyAnXCInO1xuXG4gICAgICBpZiAodGl0bGUpIHtcbiAgICAgICAgb3V0ICs9ICcgdGl0bGU9XCInICsgdGl0bGUgKyAnXCInO1xuICAgICAgfVxuXG4gICAgICBvdXQgKz0gdGhpcy5vcHRpb25zLnhodG1sID8gJy8+JyA6ICc+JztcbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcblxuICAgIF9wcm90by50ZXh0ID0gZnVuY3Rpb24gdGV4dChfdGV4dCkge1xuICAgICAgcmV0dXJuIF90ZXh0O1xuICAgIH07XG5cbiAgICByZXR1cm4gUmVuZGVyZXI7XG4gIH0oKTtcblxuICAvKipcbiAgICogVGV4dFJlbmRlcmVyXG4gICAqIHJldHVybnMgb25seSB0aGUgdGV4dHVhbCBwYXJ0IG9mIHRoZSB0b2tlblxuICAgKi9cbiAgdmFyIFRleHRSZW5kZXJlciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGV4dFJlbmRlcmVyKCkge31cblxuICAgIHZhciBfcHJvdG8gPSBUZXh0UmVuZGVyZXIucHJvdG90eXBlO1xuXG4gICAgLy8gbm8gbmVlZCBmb3IgYmxvY2sgbGV2ZWwgcmVuZGVyZXJzXG4gICAgX3Byb3RvLnN0cm9uZyA9IGZ1bmN0aW9uIHN0cm9uZyh0ZXh0KSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLmVtID0gZnVuY3Rpb24gZW0odGV4dCkge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5jb2Rlc3BhbiA9IGZ1bmN0aW9uIGNvZGVzcGFuKHRleHQpIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH07XG5cbiAgICBfcHJvdG8uZGVsID0gZnVuY3Rpb24gZGVsKHRleHQpIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH07XG5cbiAgICBfcHJvdG8uaHRtbCA9IGZ1bmN0aW9uIGh0bWwodGV4dCkge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by50ZXh0ID0gZnVuY3Rpb24gdGV4dChfdGV4dCkge1xuICAgICAgcmV0dXJuIF90ZXh0O1xuICAgIH07XG5cbiAgICBfcHJvdG8ubGluayA9IGZ1bmN0aW9uIGxpbmsoaHJlZiwgdGl0bGUsIHRleHQpIHtcbiAgICAgIHJldHVybiAnJyArIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5pbWFnZSA9IGZ1bmN0aW9uIGltYWdlKGhyZWYsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICByZXR1cm4gJycgKyB0ZXh0O1xuICAgIH07XG5cbiAgICBfcHJvdG8uYnIgPSBmdW5jdGlvbiBicigpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgcmV0dXJuIFRleHRSZW5kZXJlcjtcbiAgfSgpO1xuXG4gIC8qKlxuICAgKiBTbHVnZ2VyIGdlbmVyYXRlcyBoZWFkZXIgaWRcbiAgICovXG4gIHZhciBTbHVnZ2VyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTbHVnZ2VyKCkge1xuICAgICAgdGhpcy5zZWVuID0ge307XG4gICAgfVxuXG4gICAgdmFyIF9wcm90byA9IFNsdWdnZXIucHJvdG90eXBlO1xuXG4gICAgX3Byb3RvLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uIHNlcmlhbGl6ZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvTG93ZXJDYXNlKCkudHJpbSgpIC8vIHJlbW92ZSBodG1sIHRhZ3NcbiAgICAgIC5yZXBsYWNlKC88WyFcXC9hLXpdLio/Pi9pZywgJycpIC8vIHJlbW92ZSB1bndhbnRlZCBjaGFyc1xuICAgICAgLnJlcGxhY2UoL1tcXHUyMDAwLVxcdTIwNkZcXHUyRTAwLVxcdTJFN0ZcXFxcJyFcIiMkJSYoKSorLC4vOjs8PT4/QFtcXF1eYHt8fX5dL2csICcnKS5yZXBsYWNlKC9cXHMvZywgJy0nKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIG5leHQgc2FmZSAodW5pcXVlKSBzbHVnIHRvIHVzZVxuICAgICAqL1xuICAgIDtcblxuICAgIF9wcm90by5nZXROZXh0U2FmZVNsdWcgPSBmdW5jdGlvbiBnZXROZXh0U2FmZVNsdWcob3JpZ2luYWxTbHVnLCBpc0RyeVJ1bikge1xuICAgICAgdmFyIHNsdWcgPSBvcmlnaW5hbFNsdWc7XG4gICAgICB2YXIgb2NjdXJlbmNlQWNjdW11bGF0b3IgPSAwO1xuXG4gICAgICBpZiAodGhpcy5zZWVuLmhhc093blByb3BlcnR5KHNsdWcpKSB7XG4gICAgICAgIG9jY3VyZW5jZUFjY3VtdWxhdG9yID0gdGhpcy5zZWVuW29yaWdpbmFsU2x1Z107XG5cbiAgICAgICAgZG8ge1xuICAgICAgICAgIG9jY3VyZW5jZUFjY3VtdWxhdG9yKys7XG4gICAgICAgICAgc2x1ZyA9IG9yaWdpbmFsU2x1ZyArICctJyArIG9jY3VyZW5jZUFjY3VtdWxhdG9yO1xuICAgICAgICB9IHdoaWxlICh0aGlzLnNlZW4uaGFzT3duUHJvcGVydHkoc2x1ZykpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzRHJ5UnVuKSB7XG4gICAgICAgIHRoaXMuc2VlbltvcmlnaW5hbFNsdWddID0gb2NjdXJlbmNlQWNjdW11bGF0b3I7XG4gICAgICAgIHRoaXMuc2VlbltzbHVnXSA9IDA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzbHVnO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IHN0cmluZyB0byB1bmlxdWUgaWRcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0aW9ucy5kcnlydW4gR2VuZXJhdGVzIHRoZSBuZXh0IHVuaXF1ZSBzbHVnIHdpdGhvdXQgdXBkYXRpbmcgdGhlIGludGVybmFsIGFjY3VtdWxhdG9yLlxuICAgICAqL1xuICAgIDtcblxuICAgIF9wcm90by5zbHVnID0gZnVuY3Rpb24gc2x1Zyh2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBzbHVnID0gdGhpcy5zZXJpYWxpemUodmFsdWUpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0TmV4dFNhZmVTbHVnKHNsdWcsIG9wdGlvbnMuZHJ5cnVuKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFNsdWdnZXI7XG4gIH0oKTtcblxuICAvKipcbiAgICogUGFyc2luZyAmIENvbXBpbGluZ1xuICAgKi9cblxuICB2YXIgUGFyc2VyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYXJzZXIob3B0aW9ucykge1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBleHBvcnRzLmRlZmF1bHRzO1xuICAgICAgdGhpcy5vcHRpb25zLnJlbmRlcmVyID0gdGhpcy5vcHRpb25zLnJlbmRlcmVyIHx8IG5ldyBSZW5kZXJlcigpO1xuICAgICAgdGhpcy5yZW5kZXJlciA9IHRoaXMub3B0aW9ucy5yZW5kZXJlcjtcbiAgICAgIHRoaXMucmVuZGVyZXIub3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIHRoaXMudGV4dFJlbmRlcmVyID0gbmV3IFRleHRSZW5kZXJlcigpO1xuICAgICAgdGhpcy5zbHVnZ2VyID0gbmV3IFNsdWdnZXIoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RhdGljIFBhcnNlIE1ldGhvZFxuICAgICAqL1xuXG5cbiAgICBQYXJzZXIucGFyc2UgPSBmdW5jdGlvbiBwYXJzZSh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBwYXJzZXIgPSBuZXcgUGFyc2VyKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHBhcnNlci5wYXJzZSh0b2tlbnMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdGF0aWMgUGFyc2UgSW5saW5lIE1ldGhvZFxuICAgICAqL1xuICAgIDtcblxuICAgIFBhcnNlci5wYXJzZUlubGluZSA9IGZ1bmN0aW9uIHBhcnNlSW5saW5lKHRva2Vucywgb3B0aW9ucykge1xuICAgICAgdmFyIHBhcnNlciA9IG5ldyBQYXJzZXIob3B0aW9ucyk7XG4gICAgICByZXR1cm4gcGFyc2VyLnBhcnNlSW5saW5lKHRva2Vucyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhcnNlIExvb3BcbiAgICAgKi9cbiAgICA7XG5cbiAgICB2YXIgX3Byb3RvID0gUGFyc2VyLnByb3RvdHlwZTtcblxuICAgIF9wcm90by5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKHRva2VucywgdG9wKSB7XG4gICAgICBpZiAodG9wID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9wID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIG91dCA9ICcnLFxuICAgICAgICAgIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGwyLFxuICAgICAgICAgIGwzLFxuICAgICAgICAgIHJvdyxcbiAgICAgICAgICBjZWxsLFxuICAgICAgICAgIGhlYWRlcixcbiAgICAgICAgICBib2R5LFxuICAgICAgICAgIHRva2VuLFxuICAgICAgICAgIG9yZGVyZWQsXG4gICAgICAgICAgc3RhcnQsXG4gICAgICAgICAgbG9vc2UsXG4gICAgICAgICAgaXRlbUJvZHksXG4gICAgICAgICAgaXRlbSxcbiAgICAgICAgICBjaGVja2VkLFxuICAgICAgICAgIHRhc2ssXG4gICAgICAgICAgY2hlY2tib3gsXG4gICAgICAgICAgcmV0O1xuICAgICAgdmFyIGwgPSB0b2tlbnMubGVuZ3RoO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldOyAvLyBSdW4gYW55IHJlbmRlcmVyIGV4dGVuc2lvbnNcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmV4dGVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzICYmIHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1t0b2tlbi50eXBlXSkge1xuICAgICAgICAgIHJldCA9IHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1t0b2tlbi50eXBlXS5jYWxsKHtcbiAgICAgICAgICAgIHBhcnNlcjogdGhpc1xuICAgICAgICAgIH0sIHRva2VuKTtcblxuICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlIHx8ICFbJ3NwYWNlJywgJ2hyJywgJ2hlYWRpbmcnLCAnY29kZScsICd0YWJsZScsICdibG9ja3F1b3RlJywgJ2xpc3QnLCAnaHRtbCcsICdwYXJhZ3JhcGgnLCAndGV4dCddLmluY2x1ZGVzKHRva2VuLnR5cGUpKSB7XG4gICAgICAgICAgICBvdXQgKz0gcmV0IHx8ICcnO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICAgICAgY2FzZSAnc3BhY2UnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2hyJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIuaHIoKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdoZWFkaW5nJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIuaGVhZGluZyh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucyksIHRva2VuLmRlcHRoLCB1bmVzY2FwZSh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucywgdGhpcy50ZXh0UmVuZGVyZXIpKSwgdGhpcy5zbHVnZ2VyKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdjb2RlJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIuY29kZSh0b2tlbi50ZXh0LCB0b2tlbi5sYW5nLCB0b2tlbi5lc2NhcGVkKTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICd0YWJsZSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGhlYWRlciA9ICcnOyAvLyBoZWFkZXJcblxuICAgICAgICAgICAgICBjZWxsID0gJyc7XG4gICAgICAgICAgICAgIGwyID0gdG9rZW4uaGVhZGVyLmxlbmd0aDtcblxuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbDI7IGorKykge1xuICAgICAgICAgICAgICAgIGNlbGwgKz0gdGhpcy5yZW5kZXJlci50YWJsZWNlbGwodGhpcy5wYXJzZUlubGluZSh0b2tlbi5oZWFkZXJbal0udG9rZW5zKSwge1xuICAgICAgICAgICAgICAgICAgaGVhZGVyOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgYWxpZ246IHRva2VuLmFsaWduW2pdXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBoZWFkZXIgKz0gdGhpcy5yZW5kZXJlci50YWJsZXJvdyhjZWxsKTtcbiAgICAgICAgICAgICAgYm9keSA9ICcnO1xuICAgICAgICAgICAgICBsMiA9IHRva2VuLnJvd3MubGVuZ3RoO1xuXG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgcm93ID0gdG9rZW4ucm93c1tqXTtcbiAgICAgICAgICAgICAgICBjZWxsID0gJyc7XG4gICAgICAgICAgICAgICAgbDMgPSByb3cubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IGwzOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgIGNlbGwgKz0gdGhpcy5yZW5kZXJlci50YWJsZWNlbGwodGhpcy5wYXJzZUlubGluZShyb3dba10udG9rZW5zKSwge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBhbGlnbjogdG9rZW4uYWxpZ25ba11cbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJvZHkgKz0gdGhpcy5yZW5kZXJlci50YWJsZXJvdyhjZWxsKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG91dCArPSB0aGlzLnJlbmRlcmVyLnRhYmxlKGhlYWRlciwgYm9keSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnYmxvY2txdW90ZSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJvZHkgPSB0aGlzLnBhcnNlKHRva2VuLnRva2Vucyk7XG4gICAgICAgICAgICAgIG91dCArPSB0aGlzLnJlbmRlcmVyLmJsb2NrcXVvdGUoYm9keSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnbGlzdCc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG9yZGVyZWQgPSB0b2tlbi5vcmRlcmVkO1xuICAgICAgICAgICAgICBzdGFydCA9IHRva2VuLnN0YXJ0O1xuICAgICAgICAgICAgICBsb29zZSA9IHRva2VuLmxvb3NlO1xuICAgICAgICAgICAgICBsMiA9IHRva2VuLml0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgICAgYm9keSA9ICcnO1xuXG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IHRva2VuLml0ZW1zW2pdO1xuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSBpdGVtLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgdGFzayA9IGl0ZW0udGFzaztcbiAgICAgICAgICAgICAgICBpdGVtQm9keSA9ICcnO1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0udGFzaykge1xuICAgICAgICAgICAgICAgICAgY2hlY2tib3ggPSB0aGlzLnJlbmRlcmVyLmNoZWNrYm94KGNoZWNrZWQpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAobG9vc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0udG9rZW5zLmxlbmd0aCA+IDAgJiYgaXRlbS50b2tlbnNbMF0udHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpdGVtLnRva2Vuc1swXS50ZXh0ID0gY2hlY2tib3ggKyAnICcgKyBpdGVtLnRva2Vuc1swXS50ZXh0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0udG9rZW5zWzBdLnRva2VucyAmJiBpdGVtLnRva2Vuc1swXS50b2tlbnMubGVuZ3RoID4gMCAmJiBpdGVtLnRva2Vuc1swXS50b2tlbnNbMF0udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnRva2Vuc1swXS50b2tlbnNbMF0udGV4dCA9IGNoZWNrYm94ICsgJyAnICsgaXRlbS50b2tlbnNbMF0udG9rZW5zWzBdLnRleHQ7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udG9rZW5zLnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogY2hlY2tib3hcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUJvZHkgKz0gY2hlY2tib3g7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaXRlbUJvZHkgKz0gdGhpcy5wYXJzZShpdGVtLnRva2VucywgbG9vc2UpO1xuICAgICAgICAgICAgICAgIGJvZHkgKz0gdGhpcy5yZW5kZXJlci5saXN0aXRlbShpdGVtQm9keSwgdGFzaywgY2hlY2tlZCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBvdXQgKz0gdGhpcy5yZW5kZXJlci5saXN0KGJvZHksIG9yZGVyZWQsIHN0YXJ0KTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgLy8gVE9ETyBwYXJzZSBpbmxpbmUgY29udGVudCBpZiBwYXJhbWV0ZXIgbWFya2Rvd249MVxuICAgICAgICAgICAgICBvdXQgKz0gdGhpcy5yZW5kZXJlci5odG1sKHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ3BhcmFncmFwaCc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSB0aGlzLnJlbmRlcmVyLnBhcmFncmFwaCh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucykpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBib2R5ID0gdG9rZW4udG9rZW5zID8gdGhpcy5wYXJzZUlubGluZSh0b2tlbi50b2tlbnMpIDogdG9rZW4udGV4dDtcblxuICAgICAgICAgICAgICB3aGlsZSAoaSArIDEgPCBsICYmIHRva2Vuc1tpICsgMV0udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgICAgICAgdG9rZW4gPSB0b2tlbnNbKytpXTtcbiAgICAgICAgICAgICAgICBib2R5ICs9ICdcXG4nICsgKHRva2VuLnRva2VucyA/IHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zKSA6IHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgb3V0ICs9IHRvcCA/IHRoaXMucmVuZGVyZXIucGFyYWdyYXBoKGJvZHkpIDogYm9keTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB2YXIgZXJyTXNnID0gJ1Rva2VuIHdpdGggXCInICsgdG9rZW4udHlwZSArICdcIiB0eXBlIHdhcyBub3QgZm91bmQuJztcblxuICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpbGVudCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXJzZSBJbmxpbmUgVG9rZW5zXG4gICAgICovXG4gICAgO1xuXG4gICAgX3Byb3RvLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gcGFyc2VJbmxpbmUodG9rZW5zLCByZW5kZXJlcikge1xuICAgICAgcmVuZGVyZXIgPSByZW5kZXJlciB8fCB0aGlzLnJlbmRlcmVyO1xuICAgICAgdmFyIG91dCA9ICcnLFxuICAgICAgICAgIGksXG4gICAgICAgICAgdG9rZW4sXG4gICAgICAgICAgcmV0O1xuICAgICAgdmFyIGwgPSB0b2tlbnMubGVuZ3RoO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRva2VuID0gdG9rZW5zW2ldOyAvLyBSdW4gYW55IHJlbmRlcmVyIGV4dGVuc2lvbnNcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmV4dGVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzICYmIHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1t0b2tlbi50eXBlXSkge1xuICAgICAgICAgIHJldCA9IHRoaXMub3B0aW9ucy5leHRlbnNpb25zLnJlbmRlcmVyc1t0b2tlbi50eXBlXS5jYWxsKHtcbiAgICAgICAgICAgIHBhcnNlcjogdGhpc1xuICAgICAgICAgIH0sIHRva2VuKTtcblxuICAgICAgICAgIGlmIChyZXQgIT09IGZhbHNlIHx8ICFbJ2VzY2FwZScsICdodG1sJywgJ2xpbmsnLCAnaW1hZ2UnLCAnc3Ryb25nJywgJ2VtJywgJ2NvZGVzcGFuJywgJ2JyJywgJ2RlbCcsICd0ZXh0J10uaW5jbHVkZXModG9rZW4udHlwZSkpIHtcbiAgICAgICAgICAgIG91dCArPSByZXQgfHwgJyc7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdlc2NhcGUnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gcmVuZGVyZXIudGV4dCh0b2tlbi50ZXh0KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmh0bWwodG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnbGluayc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5saW5rKHRva2VuLmhyZWYsIHRva2VuLnRpdGxlLCB0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucywgcmVuZGVyZXIpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5pbWFnZSh0b2tlbi5ocmVmLCB0b2tlbi50aXRsZSwgdG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnc3Ryb25nJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLnN0cm9uZyh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucywgcmVuZGVyZXIpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdlbSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5lbSh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucywgcmVuZGVyZXIpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdjb2Rlc3Bhbic6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5jb2Rlc3Bhbih0b2tlbi50ZXh0KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdicic6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5icigpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2RlbCc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci5kZWwodGhpcy5wYXJzZUlubGluZSh0b2tlbi50b2tlbnMsIHJlbmRlcmVyKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci50ZXh0KHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBlcnJNc2cgPSAnVG9rZW4gd2l0aCBcIicgKyB0b2tlbi50eXBlICsgJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO1xuXG4gICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJNc2cpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcblxuICAgIHJldHVybiBQYXJzZXI7XG4gIH0oKTtcblxuICAvKipcbiAgICogTWFya2VkXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG1hcmtlZChzcmMsIG9wdCwgY2FsbGJhY2spIHtcbiAgICAvLyB0aHJvdyBlcnJvciBpbiBjYXNlIG9mIG5vbiBzdHJpbmcgaW5wdXRcbiAgICBpZiAodHlwZW9mIHNyYyA9PT0gJ3VuZGVmaW5lZCcgfHwgc3JjID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcmtlZCgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgdW5kZWZpbmVkIG9yIG51bGwnKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNyYyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyBvZiB0eXBlICcgKyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3JjKSArICcsIHN0cmluZyBleHBlY3RlZCcpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3B0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjYWxsYmFjayA9IG9wdDtcbiAgICAgIG9wdCA9IG51bGw7XG4gICAgfVxuXG4gICAgb3B0ID0gbWVyZ2Uoe30sIG1hcmtlZC5kZWZhdWx0cywgb3B0IHx8IHt9KTtcbiAgICBjaGVja1Nhbml0aXplRGVwcmVjYXRpb24ob3B0KTtcblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgdmFyIGhpZ2hsaWdodCA9IG9wdC5oaWdobGlnaHQ7XG4gICAgICB2YXIgdG9rZW5zO1xuXG4gICAgICB0cnkge1xuICAgICAgICB0b2tlbnMgPSBMZXhlci5sZXgoc3JjLCBvcHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gZG9uZShlcnIpIHtcbiAgICAgICAgdmFyIG91dDtcblxuICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAob3B0LndhbGtUb2tlbnMpIHtcbiAgICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW5zLCBvcHQud2Fsa1Rva2Vucyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dCA9IFBhcnNlci5wYXJzZSh0b2tlbnMsIG9wdCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgZXJyID0gZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBvcHQuaGlnaGxpZ2h0ID0gaGlnaGxpZ2h0O1xuICAgICAgICByZXR1cm4gZXJyID8gY2FsbGJhY2soZXJyKSA6IGNhbGxiYWNrKG51bGwsIG91dCk7XG4gICAgICB9O1xuXG4gICAgICBpZiAoIWhpZ2hsaWdodCB8fCBoaWdobGlnaHQubGVuZ3RoIDwgMykge1xuICAgICAgICByZXR1cm4gZG9uZSgpO1xuICAgICAgfVxuXG4gICAgICBkZWxldGUgb3B0LmhpZ2hsaWdodDtcbiAgICAgIGlmICghdG9rZW5zLmxlbmd0aCkgcmV0dXJuIGRvbmUoKTtcbiAgICAgIHZhciBwZW5kaW5nID0gMDtcbiAgICAgIG1hcmtlZC53YWxrVG9rZW5zKHRva2VucywgZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgIGlmICh0b2tlbi50eXBlID09PSAnY29kZScpIHtcbiAgICAgICAgICBwZW5kaW5nKys7XG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBoaWdobGlnaHQodG9rZW4udGV4dCwgdG9rZW4ubGFuZywgZnVuY3Rpb24gKGVyciwgY29kZSkge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUoZXJyKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChjb2RlICE9IG51bGwgJiYgY29kZSAhPT0gdG9rZW4udGV4dCkge1xuICAgICAgICAgICAgICAgIHRva2VuLnRleHQgPSBjb2RlO1xuICAgICAgICAgICAgICAgIHRva2VuLmVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcGVuZGluZy0tO1xuXG4gICAgICAgICAgICAgIGlmIChwZW5kaW5nID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChwZW5kaW5nID09PSAwKSB7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB2YXIgX3Rva2VucyA9IExleGVyLmxleChzcmMsIG9wdCk7XG5cbiAgICAgIGlmIChvcHQud2Fsa1Rva2Vucykge1xuICAgICAgICBtYXJrZWQud2Fsa1Rva2VucyhfdG9rZW5zLCBvcHQud2Fsa1Rva2Vucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQYXJzZXIucGFyc2UoX3Rva2Vucywgb3B0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLm1lc3NhZ2UgKz0gJ1xcblBsZWFzZSByZXBvcnQgdGhpcyB0byBodHRwczovL2dpdGh1Yi5jb20vbWFya2VkanMvbWFya2VkLic7XG5cbiAgICAgIGlmIChvcHQuc2lsZW50KSB7XG4gICAgICAgIHJldHVybiAnPHA+QW4gZXJyb3Igb2NjdXJyZWQ6PC9wPjxwcmU+JyArIGVzY2FwZShlLm1lc3NhZ2UgKyAnJywgdHJ1ZSkgKyAnPC9wcmU+JztcbiAgICAgIH1cblxuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIE9wdGlvbnNcbiAgICovXG5cbiAgbWFya2VkLm9wdGlvbnMgPSBtYXJrZWQuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHQpIHtcbiAgICBtZXJnZShtYXJrZWQuZGVmYXVsdHMsIG9wdCk7XG4gICAgY2hhbmdlRGVmYXVsdHMobWFya2VkLmRlZmF1bHRzKTtcbiAgICByZXR1cm4gbWFya2VkO1xuICB9O1xuXG4gIG1hcmtlZC5nZXREZWZhdWx0cyA9IGdldERlZmF1bHRzO1xuICBtYXJrZWQuZGVmYXVsdHMgPSBleHBvcnRzLmRlZmF1bHRzO1xuICAvKipcbiAgICogVXNlIEV4dGVuc2lvblxuICAgKi9cblxuICBtYXJrZWQudXNlID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG5cbiAgICB2YXIgb3B0cyA9IG1lcmdlLmFwcGx5KHZvaWQgMCwgW3t9XS5jb25jYXQoYXJncykpO1xuICAgIHZhciBleHRlbnNpb25zID0gbWFya2VkLmRlZmF1bHRzLmV4dGVuc2lvbnMgfHwge1xuICAgICAgcmVuZGVyZXJzOiB7fSxcbiAgICAgIGNoaWxkVG9rZW5zOiB7fVxuICAgIH07XG4gICAgdmFyIGhhc0V4dGVuc2lvbnM7XG4gICAgYXJncy5mb3JFYWNoKGZ1bmN0aW9uIChwYWNrKSB7XG4gICAgICAvLyA9PS0tIFBhcnNlIFwiYWRkb25cIiBleHRlbnNpb25zIC0tPT0gLy9cbiAgICAgIGlmIChwYWNrLmV4dGVuc2lvbnMpIHtcbiAgICAgICAgaGFzRXh0ZW5zaW9ucyA9IHRydWU7XG4gICAgICAgIHBhY2suZXh0ZW5zaW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChleHQpIHtcbiAgICAgICAgICBpZiAoIWV4dC5uYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4dGVuc2lvbiBuYW1lIHJlcXVpcmVkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV4dC5yZW5kZXJlcikge1xuICAgICAgICAgICAgLy8gUmVuZGVyZXIgZXh0ZW5zaW9uc1xuICAgICAgICAgICAgdmFyIHByZXZSZW5kZXJlciA9IGV4dGVuc2lvbnMucmVuZGVyZXJzID8gZXh0ZW5zaW9ucy5yZW5kZXJlcnNbZXh0Lm5hbWVdIDogbnVsbDtcblxuICAgICAgICAgICAgaWYgKHByZXZSZW5kZXJlcikge1xuICAgICAgICAgICAgICAvLyBSZXBsYWNlIGV4dGVuc2lvbiB3aXRoIGZ1bmMgdG8gcnVuIG5ldyBleHRlbnNpb24gYnV0IGZhbGwgYmFjayBpZiBmYWxzZVxuICAgICAgICAgICAgICBleHRlbnNpb25zLnJlbmRlcmVyc1tleHQubmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgX2xlbjIgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4yKSwgX2tleTIgPSAwOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgICAgICAgICAgICBhcmdzW19rZXkyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHJldCA9IGV4dC5yZW5kZXJlci5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICByZXQgPSBwcmV2UmVuZGVyZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4dGVuc2lvbnMucmVuZGVyZXJzW2V4dC5uYW1lXSA9IGV4dC5yZW5kZXJlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXh0LnRva2VuaXplcikge1xuICAgICAgICAgICAgLy8gVG9rZW5pemVyIEV4dGVuc2lvbnNcbiAgICAgICAgICAgIGlmICghZXh0LmxldmVsIHx8IGV4dC5sZXZlbCAhPT0gJ2Jsb2NrJyAmJiBleHQubGV2ZWwgIT09ICdpbmxpbmUnKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV4dGVuc2lvbiBsZXZlbCBtdXN0IGJlICdibG9jaycgb3IgJ2lubGluZSdcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleHRlbnNpb25zW2V4dC5sZXZlbF0pIHtcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uc1tleHQubGV2ZWxdLnVuc2hpZnQoZXh0LnRva2VuaXplcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBleHRlbnNpb25zW2V4dC5sZXZlbF0gPSBbZXh0LnRva2VuaXplcl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleHQuc3RhcnQpIHtcbiAgICAgICAgICAgICAgLy8gRnVuY3Rpb24gdG8gY2hlY2sgZm9yIHN0YXJ0IG9mIHRva2VuXG4gICAgICAgICAgICAgIGlmIChleHQubGV2ZWwgPT09ICdibG9jaycpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXh0ZW5zaW9ucy5zdGFydEJsb2NrKSB7XG4gICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnN0YXJ0QmxvY2sucHVzaChleHQuc3RhcnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnN0YXJ0QmxvY2sgPSBbZXh0LnN0YXJ0XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXh0LmxldmVsID09PSAnaW5saW5lJykge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb25zLnN0YXJ0SW5saW5lKSB7XG4gICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnN0YXJ0SW5saW5lLnB1c2goZXh0LnN0YXJ0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5zdGFydElubGluZSA9IFtleHQuc3RhcnRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChleHQuY2hpbGRUb2tlbnMpIHtcbiAgICAgICAgICAgIC8vIENoaWxkIHRva2VucyB0byBiZSB2aXNpdGVkIGJ5IHdhbGtUb2tlbnNcbiAgICAgICAgICAgIGV4dGVuc2lvbnMuY2hpbGRUb2tlbnNbZXh0Lm5hbWVdID0gZXh0LmNoaWxkVG9rZW5zO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IC8vID09LS0gUGFyc2UgXCJvdmVyd3JpdGVcIiBleHRlbnNpb25zIC0tPT0gLy9cblxuXG4gICAgICBpZiAocGFjay5yZW5kZXJlcikge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciByZW5kZXJlciA9IG1hcmtlZC5kZWZhdWx0cy5yZW5kZXJlciB8fCBuZXcgUmVuZGVyZXIoKTtcblxuICAgICAgICAgIHZhciBfbG9vcCA9IGZ1bmN0aW9uIF9sb29wKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBwcmV2UmVuZGVyZXIgPSByZW5kZXJlcltwcm9wXTsgLy8gUmVwbGFjZSByZW5kZXJlciB3aXRoIGZ1bmMgdG8gcnVuIGV4dGVuc2lvbiwgYnV0IGZhbGwgYmFjayBpZiBmYWxzZVxuXG4gICAgICAgICAgICByZW5kZXJlcltwcm9wXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgZm9yICh2YXIgX2xlbjMgPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4zKSwgX2tleTMgPSAwOyBfa2V5MyA8IF9sZW4zOyBfa2V5MysrKSB7XG4gICAgICAgICAgICAgICAgYXJnc1tfa2V5M10gPSBhcmd1bWVudHNbX2tleTNdO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdmFyIHJldCA9IHBhY2sucmVuZGVyZXJbcHJvcF0uYXBwbHkocmVuZGVyZXIsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0ID0gcHJldlJlbmRlcmVyLmFwcGx5KHJlbmRlcmVyLCBhcmdzKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHBhY2sucmVuZGVyZXIpIHtcbiAgICAgICAgICAgIF9sb29wKHByb3ApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9wdHMucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBhY2sudG9rZW5pemVyKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHRva2VuaXplciA9IG1hcmtlZC5kZWZhdWx0cy50b2tlbml6ZXIgfHwgbmV3IFRva2VuaXplcigpO1xuXG4gICAgICAgICAgdmFyIF9sb29wMiA9IGZ1bmN0aW9uIF9sb29wMihwcm9wKSB7XG4gICAgICAgICAgICB2YXIgcHJldlRva2VuaXplciA9IHRva2VuaXplcltwcm9wXTsgLy8gUmVwbGFjZSB0b2tlbml6ZXIgd2l0aCBmdW5jIHRvIHJ1biBleHRlbnNpb24sIGJ1dCBmYWxsIGJhY2sgaWYgZmFsc2VcblxuICAgICAgICAgICAgdG9rZW5pemVyW3Byb3BdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBfbGVuNCA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjQpLCBfa2V5NCA9IDA7IF9rZXk0IDwgX2xlbjQ7IF9rZXk0KyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19rZXk0XSA9IGFyZ3VtZW50c1tfa2V5NF07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB2YXIgcmV0ID0gcGFjay50b2tlbml6ZXJbcHJvcF0uYXBwbHkodG9rZW5pemVyLCBhcmdzKTtcblxuICAgICAgICAgICAgICBpZiAocmV0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHJldCA9IHByZXZUb2tlbml6ZXIuYXBwbHkodG9rZW5pemVyLCBhcmdzKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHBhY2sudG9rZW5pemVyKSB7XG4gICAgICAgICAgICBfbG9vcDIocHJvcCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb3B0cy50b2tlbml6ZXIgPSB0b2tlbml6ZXI7XG4gICAgICAgIH0pKCk7XG4gICAgICB9IC8vID09LS0gUGFyc2UgV2Fsa1Rva2VucyBleHRlbnNpb25zIC0tPT0gLy9cblxuXG4gICAgICBpZiAocGFjay53YWxrVG9rZW5zKSB7XG4gICAgICAgIHZhciBfd2Fsa1Rva2VucyA9IG1hcmtlZC5kZWZhdWx0cy53YWxrVG9rZW5zO1xuXG4gICAgICAgIG9wdHMud2Fsa1Rva2VucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgIHBhY2sud2Fsa1Rva2Vucy5jYWxsKHRoaXMsIHRva2VuKTtcblxuICAgICAgICAgIGlmIChfd2Fsa1Rva2Vucykge1xuICAgICAgICAgICAgX3dhbGtUb2tlbnMuY2FsbCh0aGlzLCB0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFzRXh0ZW5zaW9ucykge1xuICAgICAgICBvcHRzLmV4dGVuc2lvbnMgPSBleHRlbnNpb25zO1xuICAgICAgfVxuXG4gICAgICBtYXJrZWQuc2V0T3B0aW9ucyhvcHRzKTtcbiAgICB9KTtcbiAgfTtcbiAgLyoqXG4gICAqIFJ1biBjYWxsYmFjayBmb3IgZXZlcnkgdG9rZW5cbiAgICovXG5cblxuICBtYXJrZWQud2Fsa1Rva2VucyA9IGZ1bmN0aW9uICh0b2tlbnMsIGNhbGxiYWNrKSB7XG4gICAgdmFyIF9sb29wMyA9IGZ1bmN0aW9uIF9sb29wMygpIHtcbiAgICAgIHZhciB0b2tlbiA9IF9zdGVwLnZhbHVlO1xuICAgICAgY2FsbGJhY2suY2FsbChtYXJrZWQsIHRva2VuKTtcblxuICAgICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3RhYmxlJzpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3IyID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXJMb29zZSh0b2tlbi5oZWFkZXIpLCBfc3RlcDI7ICEoX3N0ZXAyID0gX2l0ZXJhdG9yMigpKS5kb25lOykge1xuICAgICAgICAgICAgICB2YXIgY2VsbCA9IF9zdGVwMi52YWx1ZTtcbiAgICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnMoY2VsbC50b2tlbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgX2l0ZXJhdG9yMyA9IF9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyTG9vc2UodG9rZW4ucm93cyksIF9zdGVwMzsgIShfc3RlcDMgPSBfaXRlcmF0b3IzKCkpLmRvbmU7KSB7XG4gICAgICAgICAgICAgIHZhciByb3cgPSBfc3RlcDMudmFsdWU7XG5cbiAgICAgICAgICAgICAgZm9yICh2YXIgX2l0ZXJhdG9yNCA9IF9jcmVhdGVGb3JPZkl0ZXJhdG9ySGVscGVyTG9vc2Uocm93KSwgX3N0ZXA0OyAhKF9zdGVwNCA9IF9pdGVyYXRvcjQoKSkuZG9uZTspIHtcbiAgICAgICAgICAgICAgICB2YXIgX2NlbGwgPSBfc3RlcDQudmFsdWU7XG4gICAgICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnMoX2NlbGwudG9rZW5zLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgIGNhc2UgJ2xpc3QnOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1hcmtlZC53YWxrVG9rZW5zKHRva2VuLml0ZW1zLCBjYWxsYmFjayk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZiAobWFya2VkLmRlZmF1bHRzLmV4dGVuc2lvbnMgJiYgbWFya2VkLmRlZmF1bHRzLmV4dGVuc2lvbnMuY2hpbGRUb2tlbnMgJiYgbWFya2VkLmRlZmF1bHRzLmV4dGVuc2lvbnMuY2hpbGRUb2tlbnNbdG9rZW4udHlwZV0pIHtcbiAgICAgICAgICAgICAgLy8gV2FsayBhbnkgZXh0ZW5zaW9uc1xuICAgICAgICAgICAgICBtYXJrZWQuZGVmYXVsdHMuZXh0ZW5zaW9ucy5jaGlsZFRva2Vuc1t0b2tlbi50eXBlXS5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZFRva2Vucykge1xuICAgICAgICAgICAgICAgIG1hcmtlZC53YWxrVG9rZW5zKHRva2VuW2NoaWxkVG9rZW5zXSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodG9rZW4udG9rZW5zKSB7XG4gICAgICAgICAgICAgIG1hcmtlZC53YWxrVG9rZW5zKHRva2VuLnRva2VucywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZm9yICh2YXIgX2l0ZXJhdG9yID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXJMb29zZSh0b2tlbnMpLCBfc3RlcDsgIShfc3RlcCA9IF9pdGVyYXRvcigpKS5kb25lOykge1xuICAgICAgX2xvb3AzKCk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogUGFyc2UgSW5saW5lXG4gICAqL1xuXG5cbiAgbWFya2VkLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHNyYywgb3B0KSB7XG4gICAgLy8gdGhyb3cgZXJyb3IgaW4gY2FzZSBvZiBub24gc3RyaW5nIGlucHV0XG4gICAgaWYgKHR5cGVvZiBzcmMgPT09ICd1bmRlZmluZWQnIHx8IHNyYyA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXJrZWQucGFyc2VJbmxpbmUoKTogaW5wdXQgcGFyYW1ldGVyIGlzIHVuZGVmaW5lZCBvciBudWxsJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzcmMgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcmtlZC5wYXJzZUlubGluZSgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgb2YgdHlwZSAnICsgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHNyYykgKyAnLCBzdHJpbmcgZXhwZWN0ZWQnKTtcbiAgICB9XG5cbiAgICBvcHQgPSBtZXJnZSh7fSwgbWFya2VkLmRlZmF1bHRzLCBvcHQgfHwge30pO1xuICAgIGNoZWNrU2FuaXRpemVEZXByZWNhdGlvbihvcHQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciB0b2tlbnMgPSBMZXhlci5sZXhJbmxpbmUoc3JjLCBvcHQpO1xuXG4gICAgICBpZiAob3B0LndhbGtUb2tlbnMpIHtcbiAgICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW5zLCBvcHQud2Fsa1Rva2Vucyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQYXJzZXIucGFyc2VJbmxpbmUodG9rZW5zLCBvcHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUubWVzc2FnZSArPSAnXFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWQuJztcblxuICAgICAgaWYgKG9wdC5zaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuICc8cD5BbiBlcnJvciBvY2N1cnJlZDo8L3A+PHByZT4nICsgZXNjYXBlKGUubWVzc2FnZSArICcnLCB0cnVlKSArICc8L3ByZT4nO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEV4cG9zZVxuICAgKi9cblxuXG4gIG1hcmtlZC5QYXJzZXIgPSBQYXJzZXI7XG4gIG1hcmtlZC5wYXJzZXIgPSBQYXJzZXIucGFyc2U7XG4gIG1hcmtlZC5SZW5kZXJlciA9IFJlbmRlcmVyO1xuICBtYXJrZWQuVGV4dFJlbmRlcmVyID0gVGV4dFJlbmRlcmVyO1xuICBtYXJrZWQuTGV4ZXIgPSBMZXhlcjtcbiAgbWFya2VkLmxleGVyID0gTGV4ZXIubGV4O1xuICBtYXJrZWQuVG9rZW5pemVyID0gVG9rZW5pemVyO1xuICBtYXJrZWQuU2x1Z2dlciA9IFNsdWdnZXI7XG4gIG1hcmtlZC5wYXJzZSA9IG1hcmtlZDtcbiAgdmFyIG9wdGlvbnMgPSBtYXJrZWQub3B0aW9ucztcbiAgdmFyIHNldE9wdGlvbnMgPSBtYXJrZWQuc2V0T3B0aW9ucztcbiAgdmFyIHVzZSA9IG1hcmtlZC51c2U7XG4gIHZhciB3YWxrVG9rZW5zID0gbWFya2VkLndhbGtUb2tlbnM7XG4gIHZhciBwYXJzZUlubGluZSA9IG1hcmtlZC5wYXJzZUlubGluZTtcbiAgdmFyIHBhcnNlID0gbWFya2VkO1xuICB2YXIgcGFyc2VyID0gUGFyc2VyLnBhcnNlO1xuICB2YXIgbGV4ZXIgPSBMZXhlci5sZXg7XG5cbiAgZXhwb3J0cy5MZXhlciA9IExleGVyO1xuICBleHBvcnRzLlBhcnNlciA9IFBhcnNlcjtcbiAgZXhwb3J0cy5SZW5kZXJlciA9IFJlbmRlcmVyO1xuICBleHBvcnRzLlNsdWdnZXIgPSBTbHVnZ2VyO1xuICBleHBvcnRzLlRleHRSZW5kZXJlciA9IFRleHRSZW5kZXJlcjtcbiAgZXhwb3J0cy5Ub2tlbml6ZXIgPSBUb2tlbml6ZXI7XG4gIGV4cG9ydHMuZ2V0RGVmYXVsdHMgPSBnZXREZWZhdWx0cztcbiAgZXhwb3J0cy5sZXhlciA9IGxleGVyO1xuICBleHBvcnRzLm1hcmtlZCA9IG1hcmtlZDtcbiAgZXhwb3J0cy5vcHRpb25zID0gb3B0aW9ucztcbiAgZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xuICBleHBvcnRzLnBhcnNlSW5saW5lID0gcGFyc2VJbmxpbmU7XG4gIGV4cG9ydHMucGFyc2VyID0gcGFyc2VyO1xuICBleHBvcnRzLnNldE9wdGlvbnMgPSBzZXRPcHRpb25zO1xuICBleHBvcnRzLnVzZSA9IHVzZTtcbiAgZXhwb3J0cy53YWxrVG9rZW5zID0gd2Fsa1Rva2VucztcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSk7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICBpZiAoIXNlbGVjdGlvbi5yYW5nZUNvdW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuICB9XG4gIHZhciBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gIHZhciByYW5nZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3Rpb24ucmFuZ2VDb3VudDsgaSsrKSB7XG4gICAgcmFuZ2VzLnB1c2goc2VsZWN0aW9uLmdldFJhbmdlQXQoaSkpO1xuICB9XG5cbiAgc3dpdGNoIChhY3RpdmUudGFnTmFtZS50b1VwcGVyQ2FzZSgpKSB7IC8vIC50b1VwcGVyQ2FzZSBoYW5kbGVzIFhIVE1MXG4gICAgY2FzZSAnSU5QVVQnOlxuICAgIGNhc2UgJ1RFWFRBUkVBJzpcbiAgICAgIGFjdGl2ZS5ibHVyKCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICBhY3RpdmUgPSBudWxsO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgc2VsZWN0aW9uLnR5cGUgPT09ICdDYXJldCcgJiZcbiAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cbiAgICBpZiAoIXNlbGVjdGlvbi5yYW5nZUNvdW50KSB7XG4gICAgICByYW5nZXMuZm9yRWFjaChmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWN0aXZlICYmXG4gICAgYWN0aXZlLmZvY3VzKCk7XG4gIH07XG59O1xuIiwiaW1wb3J0IHsgZW1pdHRlciB9IGZyb20gXCIuL2VtaXR0ZXJcIjtcbmltcG9ydCB7IHRva2VuaXplIH0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL3BhcnNlclwiO1xuXG5leHBvcnQgY29uc3QgY29tcGlsZTogQ29tcGlsZXIgPSAoc3JjKSA9PiB7XG4gIGNvbnN0IHRva2VucyA9IHRva2VuaXplKHNyYyk7XG4gIGNvbnN0IGFzdCA9IHBhcnNlKHRva2Vucyk7XG4gIGNvbnN0IHdhc20gPSBlbWl0dGVyKGFzdCk7XG4gIHJldHVybiB3YXNtO1xufTtcblxuZXhwb3J0IGNvbnN0IHJ1bnRpbWU6IFJ1bnRpbWUgPSBhc3luYyAoc3JjLCB7IHByaW50LCBkaXNwbGF5TWVtb3J5IH0pID0+IHtcbiAgY29uc3Qgd2FzbSA9IGNvbXBpbGUoc3JjKTtcbiAgY29uc3QgaW1wb3J0T2JqZWN0ID0ge1xuICAgIGVudjogeyBwcmludCwgbWVtb3J5OiBkaXNwbGF5TWVtb3J5IH0sXG4gIH07XG4gIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGUod2FzbSwgaW1wb3J0T2JqZWN0KTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICByZXN1bHQuaW5zdGFuY2UuZXhwb3J0cy5ydW4oKTtcbiAgfTtcbn07XG4iLCJleHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29uc3RhbnRzIHtcbiAgc3RhdGljIHJlYWRvbmx5IENBTlZBU19ESU06IG51bWJlciA9IDEwMDtcbn1cbiIsImltcG9ydCB7IHN0clRvQmluYXJ5TmFtZSwgbnVtVG9JZWVlNzU0QXJyYXkgfSBmcm9tIFwiLi9lbmNvZGluZ1wiO1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gXCIuL3RyYXZlcnNlXCI7XG5pbXBvcnQgeyBDb25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCAqIGFzIGxlYiBmcm9tIFwiQHRoaS5uZy9sZWIxMjhcIjtcblxuY29uc3QgZmxhdHRlbiA9IChhcnI6IGFueVtdKSA9PiBbXS5jb25jYXQoLi4uYXJyKTtcblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L21vZHVsZXMuaHRtbCNzZWN0aW9uc1xuZW51bSBTZWN0aW9uIHtcbiAgY3VzdG9tID0gMCxcbiAgdHlwZSA9IDEsXG4gIGltcG9ydCA9IDIsXG4gIGZ1bmMgPSAzLFxuICB0YWJsZSA9IDQsXG4gIG1lbW9yeSA9IDUsXG4gIGdsb2JhbCA9IDYsXG4gIGV4cG9ydCA9IDcsXG4gIHN0YXJ0ID0gOCxcbiAgZWxlbWVudCA9IDksXG4gIGNvZGUgPSAxMCxcbiAgZGF0YSA9IDExLFxufVxuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvdHlwZXMuaHRtbFxuZW51bSBWYWxUeXBlIHtcbiAgaTMyID0gMHg3ZixcbiAgZjMyID0gMHg3ZCxcbn1cblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvc3ludGF4L2luc3RydWN0aW9ucy5odG1sI3N5bnRheC1CbG9ja1R5cGVcbmVudW0gQmxvY2tUeXBlIHtcbiAgdm9pZCA9IDB4NDAsXG59XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS9pbnN0cnVjdGlvbnMuaHRtbFxuZW51bSBPcGNvZGUge1xuICBibG9jayA9IDB4MDIsXG4gIGxvb3AgPSAweDAzLFxuICBiciA9IDB4MGMsXG4gIGJyX2lmID0gMHgwZCxcbiAgZW5kID0gMHgwYixcbiAgY2FsbCA9IDB4MTAsXG4gIGdldF9sb2NhbCA9IDB4MjAsXG4gIHNldF9sb2NhbCA9IDB4MjEsXG4gIGkzMl9zdG9yZV84ID0gMHgzYSxcbiAgZjMyX2NvbnN0ID0gMHg0MyxcbiAgaTMyX2VxeiA9IDB4NDUsXG4gIGYzMl9lcSA9IDB4NWIsXG4gIGYzMl9sdCA9IDB4NWQsXG4gIGYzMl9ndCA9IDB4NWUsXG4gIGkzMl9hbmQgPSAweDcxLFxuICBpMzJfb3IgPSAweDcyLFxuICBmMzJfYWRkID0gMHg5MixcbiAgZjMyX3N1YiA9IDB4OTMsXG4gIGYzMl9tdWwgPSAweDk0LFxuICBmMzJfZGl2ID0gMHg5NSxcbiAgaTMyX3RydW5jX2YzMl9zID0gMHhhOCxcbn1cblxuY29uc3QgYmluYXJ5T3Bjb2RlID0ge1xuICBcIitcIjogT3Bjb2RlLmYzMl9hZGQsXG4gIFwiLVwiOiBPcGNvZGUuZjMyX3N1YixcbiAgXCIqXCI6IE9wY29kZS5mMzJfbXVsLFxuICBcIi9cIjogT3Bjb2RlLmYzMl9kaXYsXG4gIFwiPT1cIjogT3Bjb2RlLmYzMl9lcSxcbiAgXCI+XCI6IE9wY29kZS5mMzJfZ3QsXG4gIFwiPFwiOiBPcGNvZGUuZjMyX2x0LFxuICBcIiYmXCI6IE9wY29kZS5pMzJfYW5kLFxuICBcInx8XCI6IE9wY29kZS5pMzJfb3IsXG59O1xuXG4vLyBSZWZlcmVuY2U6IGh0dHA6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS9tb2R1bGVzLmh0bWwjZXhwb3J0LXNlY3Rpb25cbmVudW0gRXhwb3J0VHlwZSB7XG4gIGZ1bmMgPSAweDAwLFxuICB0YWJsZSA9IDB4MDEsXG4gIG1lbSA9IDB4MDIsXG4gIGdsb2JhbCA9IDB4MDMsXG59XG5cbi8vIFJlZmVyZW5jZTogaHR0cDovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L3R5cGVzLmh0bWwjZnVuY3Rpb24tdHlwZXNcbmNvbnN0IGZ1bmN0aW9uVHlwZSA9IDB4NjA7XG5cbmNvbnN0IGVtcHR5QXJyYXkgPSAweDA7XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS9tb2R1bGVzLmh0bWwjYmluYXJ5LW1vZHVsZVxuY29uc3QgbWFnaWNNb2R1bGVIZWFkZXIgPSBbMHgwMCwgMHg2MSwgMHg3MywgMHg2ZF07XG5jb25zdCBtb2R1bGVWZXJzaW9uID0gWzB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdO1xuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvY29udmVudGlvbnMuaHRtbCN2ZWN0b3JzXG5jb25zdCBlbmNvZGVWZWN0b3IgPSAoZGF0YTogYW55W10pID0+IFtcbiAgLi4ubGViLmVuY29kZVVMRUIxMjgoZGF0YS5sZW5ndGgpLFxuICAuLi5mbGF0dGVuKGRhdGEpLFxuXTtcblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L21vZHVsZXMuaHRtbCNjb2RlLXNlY3Rpb25cbmNvbnN0IGVuY29kZUxvY2FsID0gKGNvdW50OiBudW1iZXIsIHR5cGU6IFZhbFR5cGUpID0+IFtcbiAgLi4ubGViLmVuY29kZVVMRUIxMjgoY291bnQpLFxuICB0eXBlLFxuXTtcblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L21vZHVsZXMuaHRtbCNzZWN0aW9uc1xuY29uc3QgY3JlYXRlU2VjdGlvbiA9IChzZWN0aW9uVHlwZTogU2VjdGlvbiwgZGF0YTogYW55W10pID0+IFtcbiAgc2VjdGlvblR5cGUsXG4gIC4uLmVuY29kZVZlY3RvcihkYXRhKSxcbl07XG5cbmNvbnN0IGNvZGVGcm9tQXN0ID0gKGFzdDogUHJvZ3JhbSkgPT4ge1xuICBjb25zdCBjb2RlOiBudW1iZXJbXSA9IFtdO1xuXG4gIGNvbnN0IHN5bWJvbHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGNvbnN0IGxvY2FsSW5kZXhGb3JTeW1ib2wgPSAobmFtZTogc3RyaW5nKTogbnVtYmVyID0+IHtcbiAgICBpZiAoIXN5bWJvbHMuaGFzKG5hbWUpKSB7XG4gICAgICBzeW1ib2xzLnNldChuYW1lLCBzeW1ib2xzLnNpemUpO1xuICAgIH1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLW5vbi1udWxsLWFzc2VydGlvblxuICAgIHJldHVybiBzeW1ib2xzLmdldChuYW1lKSE7XG4gIH07XG5cbiAgY29uc3QgZW1pdEV4cHJlc3Npb24gPSAobm9kZTogRXhwcmVzc2lvbk5vZGUpID0+XG4gICAgdHJhdmVyc2Uobm9kZSwgKG5vZGUpID0+IHtcbiAgICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJudW1iZXJMaXRlcmFsXCI6XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5mMzJfY29uc3QpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5udW1Ub0llZWU3NTRBcnJheSgobm9kZSBhcyBOdW1iZXJMaXRlcmFsTm9kZSkudmFsdWUpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmdldF9sb2NhbCk7XG4gICAgICAgICAgY29kZS5wdXNoKFxuICAgICAgICAgICAgLi4ubGViLmVuY29kZVVMRUIxMjgoXG4gICAgICAgICAgICAgIGxvY2FsSW5kZXhGb3JTeW1ib2woKG5vZGUgYXMgSWRlbnRpZmllck5vZGUpLnZhbHVlKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJiaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICAgICAgY29kZS5wdXNoKGJpbmFyeU9wY29kZVsobm9kZSBhcyBCaW5hcnlFeHByZXNpb25Ob2RlKS5vcGVyYXRvcl0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIGNvbnN0IGVtaXRTdGF0ZW1lbnRzID0gKHN0YXRlbWVudHM6IFN0YXRlbWVudE5vZGVbXSkgPT5cbiAgICBzdGF0ZW1lbnRzLmZvckVhY2goKHN0YXRlbWVudCkgPT4ge1xuICAgICAgc3dpdGNoIChzdGF0ZW1lbnQudHlwZSkge1xuICAgICAgICBjYXNlIFwicHJpbnRTdGF0ZW1lbnRcIjpcbiAgICAgICAgICBlbWl0RXhwcmVzc2lvbihzdGF0ZW1lbnQuZXhwcmVzc2lvbik7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5jYWxsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgoMCkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidmFyaWFibGVEZWNsYXJhdGlvblwiOlxuICAgICAgICAgIGVtaXRFeHByZXNzaW9uKHN0YXRlbWVudC5pbml0aWFsaXplcik7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5zZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKHN0YXRlbWVudC5uYW1lKSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidmFyaWFibGVBc3NpZ25tZW50XCI6XG4gICAgICAgICAgZW1pdEV4cHJlc3Npb24oc3RhdGVtZW50LnZhbHVlKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLnNldF9sb2NhbCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLmxlYi5lbmNvZGVTTEVCMTI4KGxvY2FsSW5kZXhGb3JTeW1ib2woc3RhdGVtZW50Lm5hbWUpKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ3aGlsZVN0YXRlbWVudFwiOlxuICAgICAgICAgIC8vIE91dGVyIGJsb2NrXG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5ibG9jayk7XG4gICAgICAgICAgY29kZS5wdXNoKEJsb2NrVHlwZS52b2lkKTtcblxuICAgICAgICAgIC8vIElubmVyIGxvb3BcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmxvb3ApO1xuICAgICAgICAgIGNvZGUucHVzaChCbG9ja1R5cGUudm9pZCk7XG5cbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSB3aGlsZSBleHByZXNzaW9uXG4gICAgICAgICAgZW1pdEV4cHJlc3Npb24oc3RhdGVtZW50LmV4cHJlc3Npb24pO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuaTMyX2Vxeik7XG5cbiAgICAgICAgICAvLyBicl9pZiAkbGFiZWwwXG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5icl9pZik7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLmxlYi5lbmNvZGVTTEVCMTI4KDEpKTtcblxuICAgICAgICAgIC8vIE5lc3RlZCBsb2dpY1xuICAgICAgICAgIGVtaXRTdGF0ZW1lbnRzKHN0YXRlbWVudC5zdGF0ZW1lbnRzKTtcblxuICAgICAgICAgIC8vIGJyICRsYWJlbDFcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmJyKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVNMRUIxMjgoMCkpO1xuXG4gICAgICAgICAgLy8gRW5kIGxvb3BcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmVuZCk7XG5cbiAgICAgICAgICAvLyBFbmQgYmxvY2tcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmVuZCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzZXRwaXhlbFN0YXRlbWVudFwiOlxuICAgICAgICAgIC8vIENvbXB1dGUgYW5kIGNhY2hlIHRoZSBwYXJhbWV0ZXJzXG4gICAgICAgICAgZW1pdEV4cHJlc3Npb24oc3RhdGVtZW50LngpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuc2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChcInhcIikpKTtcblxuICAgICAgICAgIGVtaXRFeHByZXNzaW9uKHN0YXRlbWVudC55KTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLnNldF9sb2NhbCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLmxlYi5lbmNvZGVVTEVCMTI4KGxvY2FsSW5kZXhGb3JTeW1ib2woXCJ5XCIpKSk7XG5cbiAgICAgICAgICBlbWl0RXhwcmVzc2lvbihzdGF0ZW1lbnQuY29sb3IpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuc2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChcImNvbG9yXCIpKSk7XG5cbiAgICAgICAgICAvLyBDb21wdXRlIHRoZSBvZmZzZXQgKHkgKiAxMDApICsgeFxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZ2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChcInlcIikpKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmYzMl9jb25zdCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLm51bVRvSWVlZTc1NEFycmF5KENvbnN0YW50cy5DQU5WQVNfRElNKSk7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5mMzJfbXVsKTtcblxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZ2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChcInhcIikpKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmYzMl9hZGQpO1xuXG4gICAgICAgICAgLy8gQ29udmVydCB0byBhbiBpbnRlZ2VyXG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5pMzJfdHJ1bmNfZjMyX3MpO1xuXG4gICAgICAgICAgLy8gRmV0Y2ggdGhlIGNvbG9yXG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5nZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKFwiY29sb3JcIikpKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmkzMl90cnVuY19mMzJfcyk7XG5cbiAgICAgICAgICAvLyBXcml0ZSB0byBtZW1vcnlcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmkzMl9zdG9yZV84KTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4uWzB4MDAsIDB4MDBdKTsgLy8gTWVtb3J5IGFsaWduIGFuZCBvZmZzZXQgYXR0cmlidXRlc1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIGVtaXRTdGF0ZW1lbnRzKGFzdCk7XG5cbiAgcmV0dXJuIHsgY29kZSwgbG9jYWxDb3VudDogc3ltYm9scy5zaXplIH07XG59O1xuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvbW9kdWxlcy5odG1sXG5leHBvcnQgY29uc3QgZW1pdHRlcjogRW1pdHRlciA9IChhc3Q6IFByb2dyYW0pID0+IHtcbiAgLy8gRnVuY3Rpb24gdHlwZXMgY29udGFpbiB2ZWN0b3JzIG9mIHBhcmFtZXRlcnMgYW5kIGEgcmV0dXJuIHR5cGVcbiAgY29uc3Qgdm9pZFZvaWRUeXBlID0gW2Z1bmN0aW9uVHlwZSwgZW1wdHlBcnJheSwgZW1wdHlBcnJheV07XG5cbiAgY29uc3QgZmxvYXRWb2lkVHlwZSA9IFtcbiAgICBmdW5jdGlvblR5cGUsXG4gICAgLi4uZW5jb2RlVmVjdG9yKFtWYWxUeXBlLmYzMl0pIC8qIFBhcmFtZXRlciB0eXBlcyAqLyxcbiAgICBlbXB0eUFycmF5IC8qIFJldHVybiB0eXBlcyAqLyxcbiAgXTtcblxuICAvLyBWZWN0b3Igb2YgZnVuY3Rpb24gdHlwZXNcbiAgY29uc3QgdHlwZVNlY3Rpb24gPSBjcmVhdGVTZWN0aW9uKFxuICAgIFNlY3Rpb24udHlwZSxcbiAgICBlbmNvZGVWZWN0b3IoW3ZvaWRWb2lkVHlwZSwgZmxvYXRWb2lkVHlwZV0pXG4gICk7XG5cbiAgLy8gVmVjdG9yIG9mIHR5cGUgaW5kaWNlcyBpbmRpY2F0aW5nIHRoZSB0eXBlIG9mIGVhY2ggZnVuY3Rpb24gaW4gdGhlIGNvZGUgc2VjdGlvblxuICBjb25zdCBmdW5jU2VjdGlvbiA9IGNyZWF0ZVNlY3Rpb24oXG4gICAgU2VjdGlvbi5mdW5jLFxuICAgIGVuY29kZVZlY3RvcihbMHgwMCAvKiBJbmRleCBvZiB0aGUgdHlwZSAqL10pXG4gICk7XG5cbiAgLy8gVmVjdG9yIG9mIGltcG9ydGVkIGZ1bmN0aW9uc1xuICBjb25zdCBwcmludEZ1bmN0aW9uSW1wb3J0ID0gW1xuICAgIC4uLnN0clRvQmluYXJ5TmFtZShcImVudlwiKSxcbiAgICAuLi5zdHJUb0JpbmFyeU5hbWUoXCJwcmludFwiKSxcbiAgICBFeHBvcnRUeXBlLmZ1bmMsXG4gICAgMHgwMSAvKiBJbmRleCBvZiB0aGUgdHlwZSAqLyxcbiAgXTtcblxuICBjb25zdCBtZW1vcnlJbXBvcnQgPSBbXG4gICAgLi4uc3RyVG9CaW5hcnlOYW1lKFwiZW52XCIpLFxuICAgIC4uLnN0clRvQmluYXJ5TmFtZShcIm1lbW9yeVwiKSxcbiAgICBFeHBvcnRUeXBlLm1lbSxcbiAgICAvLyBMaW1pdHM6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvdHlwZXMuaHRtbCNsaW1pdHNcbiAgICAweDAwLFxuICAgIDB4MDEsXG4gIF07XG5cbiAgY29uc3QgaW1wb3J0U2VjdGlvbiA9IGNyZWF0ZVNlY3Rpb24oXG4gICAgU2VjdGlvbi5pbXBvcnQsXG4gICAgZW5jb2RlVmVjdG9yKFtwcmludEZ1bmN0aW9uSW1wb3J0LCBtZW1vcnlJbXBvcnRdKVxuICApO1xuXG4gIC8vIFZlY3RvciBvZiBleHBvcnRlZCBmdW5jdGlvbnNcbiAgY29uc3QgZXhwb3J0U2VjdGlvbiA9IGNyZWF0ZVNlY3Rpb24oXG4gICAgU2VjdGlvbi5leHBvcnQsXG4gICAgZW5jb2RlVmVjdG9yKFtcbiAgICAgIFtcbiAgICAgICAgLi4uc3RyVG9CaW5hcnlOYW1lKFwicnVuXCIpLFxuICAgICAgICBFeHBvcnRUeXBlLmZ1bmMsXG4gICAgICAgIDB4MDEgLyogSW5kZXggb2YgdGhlIGZ1bmN0aW9uICovLFxuICAgICAgXSxcbiAgICBdKVxuICApO1xuXG4gIC8vIFZlY3RvcnMgb2YgZnVuY3Rpb25zXG4gIGNvbnN0IHsgY29kZSwgbG9jYWxDb3VudCB9ID0gY29kZUZyb21Bc3QoYXN0KTtcbiAgY29uc3QgbG9jYWxzID0gbG9jYWxDb3VudCA+IDAgPyBbZW5jb2RlTG9jYWwobG9jYWxDb3VudCwgVmFsVHlwZS5mMzIpXSA6IFtdO1xuXG4gIGNvbnN0IGZ1bmN0aW9uQm9keSA9IGVuY29kZVZlY3RvcihbXG4gICAgLi4uZW5jb2RlVmVjdG9yKGxvY2FscyksXG4gICAgLi4uY29kZSxcbiAgICBPcGNvZGUuZW5kLFxuICBdKTtcblxuICBjb25zdCBjb2RlU2VjdGlvbiA9IGNyZWF0ZVNlY3Rpb24oU2VjdGlvbi5jb2RlLCBlbmNvZGVWZWN0b3IoW2Z1bmN0aW9uQm9keV0pKTtcblxuICByZXR1cm4gVWludDhBcnJheS5mcm9tKFtcbiAgICAuLi5tYWdpY01vZHVsZUhlYWRlcixcbiAgICAuLi5tb2R1bGVWZXJzaW9uLFxuICAgIC4uLnR5cGVTZWN0aW9uLFxuICAgIC4uLmltcG9ydFNlY3Rpb24sXG4gICAgLi4uZnVuY1NlY3Rpb24sXG4gICAgLi4uZXhwb3J0U2VjdGlvbixcbiAgICAuLi5jb2RlU2VjdGlvbixcbiAgXSk7XG59O1xuIiwiZXhwb3J0IGNvbnN0IG51bVRvSWVlZTc1NEFycmF5ID0gKG46IG51bWJlcik6IFVpbnQ4QXJyYXkgPT4ge1xuICBjb25zdCBidWYgPSBCdWZmZXIuYWxsb2NVbnNhZmUoNCk7XG4gIGJ1Zi53cml0ZUZsb2F0TEUobiwgMCk7XG4gIHJldHVybiBVaW50OEFycmF5LmZyb20oYnVmKTtcbn07XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS92YWx1ZXMuaHRtbCNiaW5hcnktbmFtZVxuZXhwb3J0IGNvbnN0IHN0clRvQmluYXJ5TmFtZSA9IChzdHI6IHN0cmluZyk6IG51bWJlcltdID0+IFtcbiAgc3RyLmxlbmd0aCxcbiAgLi4uc3RyLnNwbGl0KFwiXCIpLm1hcCgocykgPT4gcy5jaGFyQ29kZUF0KDApKSxcbl07XG4iLCJpbXBvcnQgeyB0b2tlbml6ZSB9IGZyb20gXCIuL3Rva2VuaXplclwiO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9wYXJzZXJcIjtcbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuXG5jb25zdCBhcHBseU9wZXJhdG9yID0gKG9wZXJhdG9yOiBzdHJpbmcsIGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlcikgPT4ge1xuICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG4gICAgY2FzZSBcIitcIjpcbiAgICAgIHJldHVybiBsZWZ0ICsgcmlnaHQ7XG4gICAgY2FzZSBcIi1cIjpcbiAgICAgIHJldHVybiBsZWZ0IC0gcmlnaHQ7XG4gICAgY2FzZSBcIipcIjpcbiAgICAgIHJldHVybiBsZWZ0ICogcmlnaHQ7XG4gICAgY2FzZSBcIi9cIjpcbiAgICAgIHJldHVybiBsZWZ0IC8gcmlnaHQ7XG4gICAgY2FzZSBcIj09XCI6XG4gICAgICByZXR1cm4gbGVmdCA9PSByaWdodCA/IDEgOiAwO1xuICAgIGNhc2UgXCI+XCI6XG4gICAgICByZXR1cm4gbGVmdCA+IHJpZ2h0ID8gMSA6IDA7XG4gICAgY2FzZSBcIjxcIjpcbiAgICAgIHJldHVybiBsZWZ0IDwgcmlnaHQgPyAxIDogMDtcbiAgICBjYXNlIFwiJiZcIjpcbiAgICAgIHJldHVybiBsZWZ0ICYmIHJpZ2h0O1xuICAgIGNhc2UgXCJ8fFwiOlxuICAgICAgcmV0dXJuIGxlZnQgfHwgcmlnaHQ7XG4gIH1cbiAgdGhyb3cgRXJyb3IoYFVua25vd24gYmluYXJ5IG9wZXJhdG9yICR7b3BlcmF0b3J9YCk7XG59O1xuXG5leHBvcnQgY29uc3QgcnVudGltZTogUnVudGltZSA9XG4gIGFzeW5jIChzcmMsIHsgcHJpbnQsIGRpc3BsYXlNZW1vcnkgfSkgPT5cbiAgKCkgPT4ge1xuICAgIGNvbnN0IHRva2VucyA9IHRva2VuaXplKHNyYyk7XG4gICAgY29uc3QgYXN0ID0gcGFyc2UodG9rZW5zKTtcblxuICAgIGNvbnN0IHN5bWJvbHMgPSBuZXcgTWFwKCk7XG5cbiAgICBjb25zdCBldmFsdWF0ZUV4cHJlc3Npb24gPSAoZXhwcmVzc2lvbjogRXhwcmVzc2lvbk5vZGUpOiBudW1iZXIgPT4ge1xuICAgICAgc3dpdGNoIChleHByZXNzaW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlckxpdGVyYWxcIjpcbiAgICAgICAgICByZXR1cm4gZXhwcmVzc2lvbi52YWx1ZTtcbiAgICAgICAgY2FzZSBcImJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgICByZXR1cm4gYXBwbHlPcGVyYXRvcihcbiAgICAgICAgICAgIGV4cHJlc3Npb24ub3BlcmF0b3IsXG4gICAgICAgICAgICBldmFsdWF0ZUV4cHJlc3Npb24oZXhwcmVzc2lvbi5sZWZ0KSxcbiAgICAgICAgICAgIGV2YWx1YXRlRXhwcmVzc2lvbihleHByZXNzaW9uLnJpZ2h0KVxuICAgICAgICAgICk7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgcmV0dXJuIHN5bWJvbHMuZ2V0KGV4cHJlc3Npb24udmFsdWUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBleGVjdXRlU3RhdGVtZW50cyA9IChzdGF0ZW1lbnRzOiBTdGF0ZW1lbnROb2RlW10pID0+IHtcbiAgICAgIHN0YXRlbWVudHMuZm9yRWFjaCgoc3RhdGVtZW50KSA9PiB7XG4gICAgICAgIHN3aXRjaCAoc3RhdGVtZW50LnR5cGUpIHtcbiAgICAgICAgICBjYXNlIFwicHJpbnRTdGF0ZW1lbnRcIjpcbiAgICAgICAgICAgIHByaW50KGV2YWx1YXRlRXhwcmVzc2lvbihzdGF0ZW1lbnQuZXhwcmVzc2lvbikpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInZhcmlhYmxlRGVjbGFyYXRpb25cIjpcbiAgICAgICAgICAgIHN5bWJvbHMuc2V0KFxuICAgICAgICAgICAgICBzdGF0ZW1lbnQubmFtZSxcbiAgICAgICAgICAgICAgZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC5pbml0aWFsaXplcilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidmFyaWFibGVBc3NpZ25tZW50XCI6XG4gICAgICAgICAgICBzeW1ib2xzLnNldChzdGF0ZW1lbnQubmFtZSwgZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC52YWx1ZSkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIndoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgICAgICB3aGlsZSAoZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC5leHByZXNzaW9uKSkge1xuICAgICAgICAgICAgICBleGVjdXRlU3RhdGVtZW50cyhzdGF0ZW1lbnQuc3RhdGVtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwic2V0cGl4ZWxTdGF0ZW1lbnRcIjoge1xuICAgICAgICAgICAgY29uc3QgeCA9IGV2YWx1YXRlRXhwcmVzc2lvbihzdGF0ZW1lbnQueCk7XG4gICAgICAgICAgICBjb25zdCB5ID0gZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC55KTtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC5jb2xvcik7XG4gICAgICAgICAgICBjb25zdCBkaXNwbGF5QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZGlzcGxheU1lbW9yeS5idWZmZXIpO1xuICAgICAgICAgICAgZGlzcGxheUJ1ZmZlclt5ICogQ29uc3RhbnRzLkNBTlZBU19ESU0gKyB4XSA9IGNvbG9yO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgZXhlY3V0ZVN0YXRlbWVudHMoYXN0KTtcbiAgfTtcbiIsImV4cG9ydCBjbGFzcyBQYXJzZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgdG9rZW46IFRva2VuO1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIHRva2VuOiBUb2tlbikge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgcGFyc2U6IFBhcnNlciA9ICh0b2tlbnMpID0+IHtcbiAgY29uc3QgdG9rZW5JdGVyYXRvciA9IHRva2Vuc1tTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIGxldCBjdXJyZW50VG9rZW4gPSB0b2tlbkl0ZXJhdG9yLm5leHQoKS52YWx1ZTtcblxuICBjb25zdCBjdXJyZW50VG9rZW5Jc0tleXdvcmQgPSAobmFtZTogc3RyaW5nKSA9PlxuICAgIGN1cnJlbnRUb2tlbi52YWx1ZSA9PT0gbmFtZSAmJiBjdXJyZW50VG9rZW4udHlwZSA9PT0gXCJrZXl3b3JkXCI7XG5cbiAgY29uc3QgZWF0VG9rZW4gPSAodmFsdWU/OiBzdHJpbmcpID0+IHtcbiAgICBpZiAodmFsdWUgJiYgdmFsdWUgIT09IGN1cnJlbnRUb2tlbi52YWx1ZSkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlckVycm9yKFxuICAgICAgICBgVW5leHBlY3RlZCB0b2tlbiB2YWx1ZSwgZXhwZWN0ZWQgJHt2YWx1ZX0sIHJlY2VpdmVkICR7Y3VycmVudFRva2VuLnZhbHVlfWAsXG4gICAgICAgIGN1cnJlbnRUb2tlblxuICAgICAgKTtcbiAgICB9XG4gICAgY3VycmVudFRva2VuID0gdG9rZW5JdGVyYXRvci5uZXh0KCkudmFsdWU7XG4gIH07XG5cbiAgY29uc3QgcGFyc2VFeHByZXNzaW9uOiBQYXJzZXJTdGVwPEV4cHJlc3Npb25Ob2RlPiA9ICgpID0+IHtcbiAgICBsZXQgbm9kZTogRXhwcmVzc2lvbk5vZGU7XG4gICAgc3dpdGNoIChjdXJyZW50VG9rZW4udHlwZSkge1xuICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICBub2RlID0ge1xuICAgICAgICAgIHR5cGU6IFwibnVtYmVyTGl0ZXJhbFwiLFxuICAgICAgICAgIHZhbHVlOiBOdW1iZXIoY3VycmVudFRva2VuLnZhbHVlKSxcbiAgICAgICAgfTtcbiAgICAgICAgZWF0VG9rZW4oKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICBjYXNlIFwiaWRlbnRpZmllclwiOlxuICAgICAgICBub2RlID0geyB0eXBlOiBcImlkZW50aWZpZXJcIiwgdmFsdWU6IGN1cnJlbnRUb2tlbi52YWx1ZSB9O1xuICAgICAgICBlYXRUb2tlbigpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIGNhc2UgXCJwYXJlbnRoZXNlc1wiOiB7XG4gICAgICAgIGVhdFRva2VuKFwiKFwiKTtcbiAgICAgICAgY29uc3QgbGVmdCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICBjb25zdCBvcGVyYXRvciA9IGN1cnJlbnRUb2tlbi52YWx1ZTtcbiAgICAgICAgZWF0VG9rZW4oKTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSBwYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgZWF0VG9rZW4oXCIpXCIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiYmluYXJ5RXhwcmVzc2lvblwiLFxuICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgb3BlcmF0b3I6IG9wZXJhdG9yIGFzIE9wZXJhdG9yLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlckVycm9yKFxuICAgICAgICAgIGBVbmV4cGVjdGVkIHRva2VuIHR5cGUgJHtjdXJyZW50VG9rZW4udHlwZX1gLFxuICAgICAgICAgIGN1cnJlbnRUb2tlblxuICAgICAgICApO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBwYXJzZVByaW50U3RhdGVtZW50OiBQYXJzZXJTdGVwPFByaW50U3RhdGVtZW50Tm9kZT4gPSAoKSA9PiB7XG4gICAgZWF0VG9rZW4oXCJwcmludFwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJwcmludFN0YXRlbWVudFwiLFxuICAgICAgZXhwcmVzc2lvbjogcGFyc2VFeHByZXNzaW9uKCksXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBwYXJzZVdoaWxlU3RhdGVtZW50OiBQYXJzZXJTdGVwPFdoaWxlU3RhdGVtZW50Tm9kZT4gPSAoKSA9PiB7XG4gICAgZWF0VG9rZW4oXCJ3aGlsZVwiKTtcblxuICAgIGNvbnN0IGV4cHJlc3Npb24gPSBwYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIGNvbnN0IHN0YXRlbWVudHM6IFN0YXRlbWVudE5vZGVbXSA9IFtdO1xuICAgIHdoaWxlICghY3VycmVudFRva2VuSXNLZXl3b3JkKFwiZW5kd2hpbGVcIikpIHtcbiAgICAgIHN0YXRlbWVudHMucHVzaChwYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG5cbiAgICBlYXRUb2tlbihcImVuZHdoaWxlXCIpO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJ3aGlsZVN0YXRlbWVudFwiLCBleHByZXNzaW9uLCBzdGF0ZW1lbnRzIH07XG4gIH07XG5cbiAgY29uc3QgcGFyc2VWYXJpYWJsZUFzc2lnbm1lbnQ6IFBhcnNlclN0ZXA8VmFyaWFibGVBc3NpZ25tZW50Tm9kZT4gPSAoKSA9PiB7XG4gICAgY29uc3QgbmFtZSA9IGN1cnJlbnRUb2tlbi52YWx1ZTtcbiAgICBlYXRUb2tlbigpO1xuICAgIGVhdFRva2VuKFwiPVwiKTtcbiAgICByZXR1cm4geyB0eXBlOiBcInZhcmlhYmxlQXNzaWdubWVudFwiLCBuYW1lLCB2YWx1ZTogcGFyc2VFeHByZXNzaW9uKCkgfTtcbiAgfTtcblxuICBjb25zdCBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQ6IFBhcnNlclN0ZXA8XG4gICAgVmFyaWFibGVEZWNsYXJhdGlvbk5vZGVcbiAgPiA9ICgpID0+IHtcbiAgICBlYXRUb2tlbihcInZhclwiKTtcbiAgICBjb25zdCBuYW1lID0gY3VycmVudFRva2VuLnZhbHVlO1xuICAgIGVhdFRva2VuKCk7XG4gICAgZWF0VG9rZW4oXCI9XCIpO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcInZhcmlhYmxlRGVjbGFyYXRpb25cIixcbiAgICAgIG5hbWUsXG4gICAgICBpbml0aWFsaXplcjogcGFyc2VFeHByZXNzaW9uKCksXG4gICAgfTtcbiAgfTtcblxuICBjb25zdCBwYXJzZVNldFBpeGVsU3RhdGVtZW50OiBQYXJzZXJTdGVwPFNldFBpeGVsU3RhdGVtZW50Tm9kZT4gPSAoKSA9PiB7XG4gICAgZWF0VG9rZW4oXCJzZXRwaXhlbFwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJzZXRwaXhlbFN0YXRlbWVudFwiLFxuICAgICAgeDogcGFyc2VFeHByZXNzaW9uKCksXG4gICAgICB5OiBwYXJzZUV4cHJlc3Npb24oKSxcbiAgICAgIGNvbG9yOiBwYXJzZUV4cHJlc3Npb24oKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IHBhcnNlU3RhdGVtZW50OiBQYXJzZXJTdGVwPFN0YXRlbWVudE5vZGU+ID0gKCkgPT4ge1xuICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gXCJrZXl3b3JkXCIpIHtcbiAgICAgIHN3aXRjaCAoY3VycmVudFRva2VuLnZhbHVlKSB7XG4gICAgICAgIGNhc2UgXCJwcmludFwiOlxuICAgICAgICAgIHJldHVybiBwYXJzZVByaW50U3RhdGVtZW50KCk7XG4gICAgICAgIGNhc2UgXCJ2YXJcIjpcbiAgICAgICAgICByZXR1cm4gcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCk7XG4gICAgICAgIGNhc2UgXCJ3aGlsZVwiOlxuICAgICAgICAgIHJldHVybiBwYXJzZVdoaWxlU3RhdGVtZW50KCk7XG4gICAgICAgIGNhc2UgXCJzZXRwaXhlbFwiOlxuICAgICAgICAgIHJldHVybiBwYXJzZVNldFBpeGVsU3RhdGVtZW50KCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IFBhcnNlckVycm9yKFxuICAgICAgICAgICAgYFVua25vd24ga2V5d29yZCAke2N1cnJlbnRUb2tlbi52YWx1ZX1gLFxuICAgICAgICAgICAgY3VycmVudFRva2VuXG4gICAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSBcImlkZW50aWZpZXJcIikge1xuICAgICAgcmV0dXJuIHBhcnNlVmFyaWFibGVBc3NpZ25tZW50KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZXJFcnJvcihcbiAgICAgICAgYFVuZXhwZWN0ZWQgdG9rZW4gdHlwZSAke2N1cnJlbnRUb2tlbi52YWx1ZX1gLFxuICAgICAgICBjdXJyZW50VG9rZW5cbiAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG5vZGVzOiBTdGF0ZW1lbnROb2RlW10gPSBbXTtcbiAgd2hpbGUgKGN1cnJlbnRUb2tlbikge1xuICAgIG5vZGVzLnB1c2gocGFyc2VTdGF0ZW1lbnQoKSk7XG4gIH1cblxuICByZXR1cm4gbm9kZXM7XG59O1xuIiwiZXhwb3J0IGNvbnN0IGtleXdvcmRzID0gW1wicHJpbnRcIiwgXCJ2YXJcIiwgXCJ3aGlsZVwiLCBcImVuZHdoaWxlXCIsIFwic2V0cGl4ZWxcIl07XG5leHBvcnQgY29uc3Qgb3BlcmF0b3JzID0gW1wiK1wiLCBcIi1cIiwgXCIqXCIsIFwiL1wiLCBcIj09XCIsIFwiPFwiLCBcIj5cIiwgXCImJlwiLCBcInx8XCJdO1xuXG5jb25zdCBlc2NhcGVSZWdleCA9ICh0ZXh0OiBzdHJpbmcpID0+XG4gIHRleHQucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csIFwiXFxcXCQmXCIpO1xuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVyRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGluZGV4OiBudW1iZXI7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgaW5kZXg6IG51bWJlcikge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMuaW5kZXggPSBpbmRleDtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIGEgdG9rZW4gaWYgdGhlIHJlZ2V4IG1hdGNoZXMgYXQgdGhlIGN1cnJlbnQgaW5kZXhcbmNvbnN0IHJlZ2V4TWF0Y2hlciA9XG4gIChyZWdleDogc3RyaW5nLCB0eXBlOiBUb2tlblR5cGUpOiBNYXRjaGVyID0+XG4gIChpbnB1dCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBtYXRjaCA9IGlucHV0LnN1YnN0cmluZyhpbmRleCkubWF0Y2gocmVnZXgpO1xuICAgIHJldHVybiBtYXRjaCAmJiB7IHR5cGUsIHZhbHVlOiBtYXRjaFswXSB9O1xuICB9O1xuXG5jb25zdCBtYXRjaGVycyA9IFtcbiAgcmVnZXhNYXRjaGVyKFwiXi0/Wy4wLTldKyhbZUVdLT9bMC05XXsyfSk/XCIsIFwibnVtYmVyXCIpLFxuICByZWdleE1hdGNoZXIoYF4oJHtrZXl3b3Jkcy5qb2luKFwifFwiKX0pYCwgXCJrZXl3b3JkXCIpLFxuICByZWdleE1hdGNoZXIoXCJeXFxcXHMrXCIsIFwid2hpdGVzcGFjZVwiKSxcbiAgcmVnZXhNYXRjaGVyKGBeKCR7b3BlcmF0b3JzLm1hcChlc2NhcGVSZWdleCkuam9pbihcInxcIil9KWAsIFwib3BlcmF0b3JcIiksXG4gIHJlZ2V4TWF0Y2hlcihgXlthLXpBLVpdK2AsIFwiaWRlbnRpZmllclwiKSxcbiAgcmVnZXhNYXRjaGVyKGBePWAsIFwiYXNzaWdubWVudFwiKSxcbiAgcmVnZXhNYXRjaGVyKFwiXlsoKV17MX1cIiwgXCJwYXJlbnRoZXNlc1wiKSxcbl07XG5cbmNvbnN0IGxvY2F0aW9uRm9ySW5kZXggPSAoaW5wdXQ6IHN0cmluZywgaW5kZXg6IG51bWJlcikgPT4gKHtcbiAgY2hhcjogaW5kZXggLSBpbnB1dC5sYXN0SW5kZXhPZihcIlxcblwiLCBpbmRleCkgLSAxLFxuICBsaW5lOiBpbnB1dC5zdWJzdHJpbmcoMCwgaW5kZXgpLnNwbGl0KFwiXFxuXCIpLmxlbmd0aCAtIDEsXG59KTtcblxuZXhwb3J0IGNvbnN0IHRva2VuaXplOiBUb2tlbml6ZXIgPSAoaW5wdXQpID0+IHtcbiAgY29uc3QgdG9rZW5zOiBUb2tlbltdID0gW107XG4gIGxldCBpbmRleCA9IDA7XG4gIHdoaWxlIChpbmRleCA8IGlucHV0Lmxlbmd0aCkge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBtYXRjaGVycy5tYXAoKG0pID0+IG0oaW5wdXQsIGluZGV4KSkuZmlsdGVyKChmKSA9PiBmKTtcbiAgICBpZiAobWF0Y2hlcy5sZW5ndGggPiAwICYmIG1hdGNoZXNbMF0pIHtcbiAgICAgIC8vIFRha2UgdGhlIGhpZ2hlc3QgcHJpb3JpdHkgbWF0Y2ggKGF0IGZpcnN0IGluZGV4KVxuICAgICAgY29uc3QgbWF0Y2ggPSBtYXRjaGVzWzBdO1xuICAgICAgaWYgKG1hdGNoLnR5cGUgIT09IFwid2hpdGVzcGFjZVwiKSB7XG4gICAgICAgIHRva2Vucy5wdXNoKHsgLi4ubWF0Y2gsIC4uLmxvY2F0aW9uRm9ySW5kZXgoaW5wdXQsIGluZGV4KSB9KTtcbiAgICAgIH1cbiAgICAgIGluZGV4ICs9IG1hdGNoLnZhbHVlLmxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFRva2VuaXplckVycm9yKFxuICAgICAgICBgVW5leHBlY3RlZCB0b2tlbiAke2lucHV0LnN1YnN0cmluZyhpbmRleCwgaW5kZXggKyAxKX1gLFxuICAgICAgICBpbmRleFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRva2Vucztcbn07XG4iLCIvLyBQb3N0b3JkZXIgQVNUIHRyYXZlcnNhbCBmb3IgdGhlIHN0YWNrIG1hY2hpbmUgKG9wZXJhbmRzIHRoZW4gb3BlcmF0b3IpXG5jb25zdCB0cmF2ZXJzZTogVHJhdmVyc2UgPSAobm9kZXMsIHZpc2l0b3IpID0+IHtcbiAgbm9kZXMgPSBBcnJheS5pc0FycmF5KG5vZGVzKSA/IG5vZGVzIDogW25vZGVzXTtcbiAgbm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgIChPYmplY3Qua2V5cyhub2RlKSBhcyAoa2V5b2YgUHJvZ3JhbU5vZGUpW10pLmZvckVhY2goKHByb3ApID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9kZVtwcm9wXTtcbiAgICAgIGNvbnN0IHZhbHVlQXNBcnJheTogc3RyaW5nW10gPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlIDogW3ZhbHVlXTtcbiAgICAgIHZhbHVlQXNBcnJheS5mb3JFYWNoKChjaGlsZE5vZGU6IGFueSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGNoaWxkTm9kZS50eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgdHJhdmVyc2UoY2hpbGROb2RlLCB2aXNpdG9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmlzaXRvcihub2RlKTtcbiAgfSk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCB0cmF2ZXJzZTtcbiJdfQ==
