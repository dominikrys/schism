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
var outputArea = document.getElementById("output");
var canvas = document.getElementById("canvas");
var shareUrlField = document.getElementById("shareUrlField");
var copyUrlButton = document.getElementById("copyUrlButton");
var description = document.getElementById("description");
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
    outputArea.value = outputArea.value + message + "\n";
};
var errorMarker;
var markError = function (token) {
    if (token.char) {
        errorMarker = editor.markText({ line: token.line, ch: token.char }, { line: token.line, ch: token.char + token.value.length }, { className: "error" });
    }
};
var updateCanvas = function (displayBuffer) {
    var context = canvas.getContext("2d");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    var imgData = context.createImageData(constants_1.Constants.CANVAS_DIM, constants_1.Constants.CANVAS_DIM);
    for (var i = 0; i < constants_1.Constants.CANVAS_DIM * constants_1.Constants.CANVAS_DIM; i++) {
        imgData.data[i * 4] = displayBuffer[i]; // Red
        imgData.data[i * 4 + 1] = displayBuffer[i]; // Green
        imgData.data[i * 4 + 2] = displayBuffer[i]; // Blue
        imgData.data[i * 4 + 3] = 255; // Alpha
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    var data = scaleImageData(imgData, 3, context);
    context === null || context === void 0 ? void 0 : context.putImageData(data, 0, 0);
};
var run = function (runtime) { return __awaiter(void 0, void 0, void 0, function () {
    var sleep, tickFunction, displayMemory, displayBuffer, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (errorMarker) {
                    errorMarker.clear();
                }
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
                _a.trys.push([2, 4, , 5]);
                displayMemory = new WebAssembly.Memory({ initial: 1 });
                return [4 /*yield*/, runtime(editor.getValue(), {
                        print: logMessage,
                        displayMemory: displayMemory,
                    })];
            case 3:
                tickFunction = _a.sent();
                outputArea.value = "";
                logMessage("Executing ... ");
                tickFunction();
                displayBuffer = new Uint8Array(displayMemory.buffer);
                updateCanvas(displayBuffer);
                interpretButton === null || interpretButton === void 0 ? void 0 : interpretButton.classList.remove("active");
                compileButton === null || compileButton === void 0 ? void 0 : compileButton.classList.remove("active");
                return [3 /*break*/, 5];
            case 4:
                e_1 = _a.sent();
                logMessage(e_1.message);
                markError(e_1.token);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
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
var descriptionText = "\nWhen the code is run, the code is tokenised and parsed into an Abstract Syntax Tree (AST). When using the interpreter, the AST is executed using JavaScript. When using the compiler, the AST is compiled into a WebAssembly module and executed by the WebAssembly runtime.\n\n## Language\n\nThe syntax is fairly straightforward. As a summary of the main language features:\n\n- Print variable value: `print <variable>`.\n\n- Assign value to a variable: `var <name> = <value>`.\n\n- Set pixel in the canvas: `setpixel (<x>, <y>, <colour>)`. `x` and `y` are in the range 0-99 inclusive and `colour` is a value in the range 0-255 inclusive (where 0 is black and 255 is white).\n\n- While loop: `while (<condition>) <code> endwhile`\n\n- Operators: `+`, `-`, `*`, `/`, `==`, `<`, `>`, `&&`, `||`.\n\n- The language can parse scientific notation, floating points, and negative values.\n";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkb2NzL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvYXBpL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2FycmF5cy9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9iaW5hcnkvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvY2hlY2tzL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2NvbXBhcmUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvY29tcG9zZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9lcXVpdi9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9lcnJvcnMvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvaGV4L2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL2xlYjEyOC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy9tYXRoL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AdGhpLm5nL3JhbmRvbS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQHRoaS5uZy90cmFuc2R1Y2Vycy1iaW5hcnkvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0B0aGkubmcvdHJhbnNkdWNlcnMvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY29weS10by1jbGlwYm9hcmQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZWQvbGliL21hcmtlZC51bWQuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3RvZ2dsZS1zZWxlY3Rpb24vaW5kZXguanMiLCJzcmMvY29tcGlsZXIudHMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL2VtaXR0ZXIudHMiLCJzcmMvZW5jb2RpbmcudHMiLCJzcmMvaW50ZXJwcmV0ZXIudHMiLCJzcmMvcGFyc2VyLnRzIiwic3JjL3Rva2VuaXplci50cyIsInNyYy90cmF2ZXJzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0dBLHdFQUFxQztBQUNyQyxpQ0FBZ0M7QUFFaEMsa0RBQW1FO0FBQ25FLDRDQUE2RDtBQUM3RCw4Q0FBNEM7QUFDNUMsOENBQTZDO0FBRzdDLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDekQsSUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM3RCxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBd0IsQ0FBQztBQUN4RSxJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBd0IsQ0FBQztBQUM1RSxJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBc0IsQ0FBQztBQUN0RSxJQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUMzQyxlQUFlLENBQ0ksQ0FBQztBQUN0QixJQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUMzQyxlQUFlLENBQ0ksQ0FBQztBQUN0QixJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBbUIsQ0FBQztBQUU3RSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0lBQ3hCLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RCxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbEUsUUFBUSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUMzQztBQUVELHFEQUFxRDtBQUNyRCxJQUFNLGNBQWMsR0FBRyxVQUNyQixTQUFvQixFQUNwQixLQUFhLEVBQ2IsR0FBNkI7SUFFN0IsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FDaEMsU0FBUyxDQUFDLEtBQUssR0FBRyxLQUFLLEVBQ3ZCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUN6QixDQUFDO0lBQ0YsSUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ25ELEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBQy9DLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzlDLElBQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUN6QyxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFDakMsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUN0QyxDQUFDO1lBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEVBQUU7Z0JBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlCLElBQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxJQUFNLE9BQU8sR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDO2dCQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNsRTtTQUNGO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFFRixVQUFVLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFO0lBQ3hDLEtBQUssRUFBRTtRQUNMO1lBQ0UsS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLFdBQUksb0JBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQUcsQ0FBQztZQUM1QyxLQUFLLEVBQUUsU0FBUztTQUNqQjtRQUNEO1lBQ0UsS0FBSyxFQUFFLG9EQUFvRDtZQUMzRCxLQUFLLEVBQUUsUUFBUTtTQUNoQjtRQUNELEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO1FBQzNDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFO0tBQzdDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUU7SUFDL0MsSUFBSSxFQUFFLFlBQVk7SUFDbEIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsV0FBVyxFQUFFLElBQUk7Q0FDbEIsQ0FBQyxDQUFDO0FBRUgsSUFBTSxVQUFVLEdBQUcsVUFBQyxPQUF3QjtJQUMxQyxVQUFVLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQztBQUN2RCxDQUFDLENBQUM7QUFFRixJQUFJLFdBQWdCLENBQUM7QUFFckIsSUFBTSxTQUFTLEdBQUcsVUFBQyxLQUFZO0lBQzdCLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtRQUNkLFdBQVcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUMzQixFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEVBQ3BDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFDekQsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQ3ZCLENBQUM7S0FDSDtBQUNILENBQUMsQ0FBQztBQUVGLElBQU0sWUFBWSxHQUFHLFVBQUMsYUFBeUI7SUFDN0MsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxvRUFBb0U7SUFDcEUsSUFBTSxPQUFPLEdBQUcsT0FBUSxDQUFDLGVBQWUsQ0FDdEMscUJBQVMsQ0FBQyxVQUFVLEVBQ3BCLHFCQUFTLENBQUMsVUFBVSxDQUNyQixDQUFDO0lBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHFCQUFTLENBQUMsVUFBVSxHQUFHLHFCQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU07UUFDOUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFDcEQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU87UUFDbkQsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVE7S0FDeEM7SUFDRCxvRUFBb0U7SUFDcEUsSUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBUSxDQUFDLENBQUM7SUFDbEQsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUMsQ0FBQztBQUVGLElBQU0sR0FBRyxHQUFHLFVBQU8sT0FBZ0I7Ozs7O2dCQUNqQyxJQUFJLFdBQVcsRUFBRTtvQkFDZixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7aUJBQ3JCO2dCQUVLLEtBQUssR0FBRyxVQUFPLEVBQVU7OztvQ0FDN0IscUJBQU0sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLElBQUssT0FBQSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxFQUF2QixDQUF1QixDQUFDLEVBQUE7O2dDQUF2RCxTQUF1RCxDQUFDOzs7O3FCQUN6RCxDQUFDO2dCQUVGLHFCQUFNLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBQTs7Z0JBQWYsU0FBZSxDQUFDOzs7O2dCQUtSLGFBQWEsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUMscUJBQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRTt3QkFDOUMsS0FBSyxFQUFFLFVBQVU7d0JBQ2pCLGFBQWEsZUFBQTtxQkFDZCxDQUFDLEVBQUE7O2dCQUhGLFlBQVksR0FBRyxTQUdiLENBQUM7Z0JBRUgsVUFBVSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ3RCLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUU3QixZQUFZLEVBQUUsQ0FBQztnQkFDVCxhQUFhLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzRCxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRTVCLGVBQWUsYUFBZixlQUFlLHVCQUFmLGVBQWUsQ0FBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7OztnQkFFMUMsVUFBVSxDQUFFLEdBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZDLFNBQVMsQ0FBRSxHQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDOzs7OztLQUV2QyxDQUFDO0FBRUYsZUFBZSxhQUFmLGVBQWUsdUJBQWYsZUFBZSxDQUFFLGdCQUFnQixDQUFDLE9BQU8sRUFBRTs7OztnQkFDekMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3hDLGFBQWEsYUFBYixhQUFhLHVCQUFiLGFBQWEsQ0FBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQyxxQkFBTSxHQUFHLENBQUMscUJBQWtCLENBQUMsRUFBQTs7Z0JBQTdCLFNBQTZCLENBQUM7Ozs7S0FDL0IsQ0FBQyxDQUFDO0FBRUgsYUFBYSxhQUFiLGFBQWEsdUJBQWIsYUFBYSxDQUFFLGdCQUFnQixDQUFDLE9BQU8sRUFBRTs7OztnQkFDdkMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3RDLGVBQWUsYUFBZixlQUFlLHVCQUFmLGVBQWUsQ0FBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QyxxQkFBTSxHQUFHLENBQUMsa0JBQWUsQ0FBQyxFQUFBOztnQkFBMUIsU0FBMEIsQ0FBQzs7OztLQUM1QixDQUFDLENBQUM7QUFFSCxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRTtJQUNuQyxJQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsSUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQy9CLElBQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNsRSxJQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3pELGFBQWEsQ0FBQyxLQUFLLEdBQUcsVUFBRyxPQUFPLGNBQUksaUJBQWlCLENBQUUsQ0FBQztJQUV4RCxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUM7QUFFSCxhQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGNBQU0sT0FBQSxJQUFBLDJCQUFJLEVBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUF6QixDQUF5QixDQUFDLENBQUM7QUFFekUsSUFBTSxlQUFlLEdBQUcsaTNCQWtCdkIsQ0FBQztBQUVGLFdBQVcsQ0FBQyxTQUFTLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQzs7Ozs7O0FDbE10RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFtQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ByRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuMkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3ZDQSxxQ0FBb0M7QUFDcEMseUNBQXVDO0FBQ3ZDLG1DQUFpQztBQUUxQixJQUFNLE9BQU8sR0FBYSxVQUFDLEdBQUc7SUFDbkMsSUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBUSxFQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzdCLElBQU0sR0FBRyxHQUFHLElBQUEsY0FBSyxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLElBQU0sSUFBSSxHQUFHLElBQUEsaUJBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztJQUMxQixPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsQ0FBQztBQUxXLFFBQUEsT0FBTyxXQUtsQjtBQUVLLElBQU0sT0FBTyxHQUFZLFVBQU8sR0FBRyxFQUFFLEVBQXdCO1FBQXRCLEtBQUssV0FBQSxFQUFFLGFBQWEsbUJBQUE7Ozs7OztvQkFDMUQsSUFBSSxHQUFHLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNwQixZQUFZLEdBQUc7d0JBQ25CLEdBQUcsRUFBRSxFQUFFLEtBQUssT0FBQSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7cUJBQ3RDLENBQUM7b0JBQ2tCLHFCQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFBOztvQkFBL0QsTUFBTSxHQUFRLFNBQWlEO29CQUNyRSxzQkFBTzs0QkFDTCxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDaEMsQ0FBQyxFQUFDOzs7O0NBQ0gsQ0FBQztBQVRXLFFBQUEsT0FBTyxXQVNsQjs7Ozs7O0FDcEJGO0lBQUE7SUFFQSxDQUFDO0lBRGlCLG9CQUFVLEdBQVcsR0FBRyxDQUFDO0lBQzNDLGdCQUFDO0NBRkQsQUFFQyxJQUFBO0FBRnFCLDhCQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0EvQix1Q0FBZ0U7QUFDaEUsd0RBQWtDO0FBQ2xDLHlDQUF3QztBQUN4QyxrREFBc0M7QUFFdEMsSUFBTSxPQUFPLEdBQUcsVUFBQyxHQUFVLElBQUssT0FBQSxFQUFFLENBQUMsTUFBTSxPQUFULEVBQUUsMkJBQVcsR0FBRyxZQUFoQixDQUFpQixDQUFDO0FBRWxELGtGQUFrRjtBQUNsRixJQUFLLE9BYUo7QUFiRCxXQUFLLE9BQU87SUFDVix5Q0FBVSxDQUFBO0lBQ1YscUNBQVEsQ0FBQTtJQUNSLHlDQUFVLENBQUE7SUFDVixxQ0FBUSxDQUFBO0lBQ1IsdUNBQVMsQ0FBQTtJQUNULHlDQUFVLENBQUE7SUFDVix5Q0FBVSxDQUFBO0lBQ1YseUNBQVUsQ0FBQTtJQUNWLHVDQUFTLENBQUE7SUFDVCwyQ0FBVyxDQUFBO0lBQ1gsc0NBQVMsQ0FBQTtJQUNULHNDQUFTLENBQUE7QUFDWCxDQUFDLEVBYkksT0FBTyxLQUFQLE9BQU8sUUFhWDtBQUVELHVFQUF1RTtBQUN2RSxJQUFLLE9BR0o7QUFIRCxXQUFLLE9BQU87SUFDVixxQ0FBVSxDQUFBO0lBQ1YscUNBQVUsQ0FBQTtBQUNaLENBQUMsRUFISSxPQUFPLEtBQVAsT0FBTyxRQUdYO0FBRUQsK0ZBQStGO0FBQy9GLElBQUssU0FFSjtBQUZELFdBQUssU0FBUztJQUNaLDBDQUFXLENBQUE7QUFDYixDQUFDLEVBRkksU0FBUyxLQUFULFNBQVMsUUFFYjtBQUVELDhFQUE4RTtBQUM5RSxJQUFLLE1Bc0JKO0FBdEJELFdBQUssTUFBTTtJQUNULHFDQUFZLENBQUE7SUFDWixtQ0FBVyxDQUFBO0lBQ1gsZ0NBQVMsQ0FBQTtJQUNULHNDQUFZLENBQUE7SUFDWixrQ0FBVSxDQUFBO0lBQ1Ysb0NBQVcsQ0FBQTtJQUNYLDhDQUFnQixDQUFBO0lBQ2hCLDhDQUFnQixDQUFBO0lBQ2hCLGtEQUFrQixDQUFBO0lBQ2xCLDhDQUFnQixDQUFBO0lBQ2hCLDBDQUFjLENBQUE7SUFDZCx3Q0FBYSxDQUFBO0lBQ2Isd0NBQWEsQ0FBQTtJQUNiLHdDQUFhLENBQUE7SUFDYiwyQ0FBYyxDQUFBO0lBQ2QseUNBQWEsQ0FBQTtJQUNiLDJDQUFjLENBQUE7SUFDZCwyQ0FBYyxDQUFBO0lBQ2QsMkNBQWMsQ0FBQTtJQUNkLDJDQUFjLENBQUE7SUFDZCwyREFBc0IsQ0FBQTtBQUN4QixDQUFDLEVBdEJJLE1BQU0sS0FBTixNQUFNLFFBc0JWO0FBRUQsSUFBTSxZQUFZLEdBQUc7SUFDbkIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPO0lBQ25CLEdBQUcsRUFBRSxNQUFNLENBQUMsT0FBTztJQUNuQixHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU87SUFDbkIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxPQUFPO0lBQ25CLElBQUksRUFBRSxNQUFNLENBQUMsTUFBTTtJQUNuQixHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU07SUFDbEIsR0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNO0lBQ2xCLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTztJQUNwQixJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU07Q0FDcEIsQ0FBQztBQUVGLHVGQUF1RjtBQUN2RixJQUFLLFVBS0o7QUFMRCxXQUFLLFVBQVU7SUFDYiwyQ0FBVyxDQUFBO0lBQ1gsNkNBQVksQ0FBQTtJQUNaLHlDQUFVLENBQUE7SUFDViwrQ0FBYSxDQUFBO0FBQ2YsQ0FBQyxFQUxJLFVBQVUsS0FBVixVQUFVLFFBS2Q7QUFFRCxxRkFBcUY7QUFDckYsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBRTFCLElBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2Qix1RkFBdUY7QUFDdkYsSUFBTSxpQkFBaUIsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25ELElBQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFL0MscUZBQXFGO0FBQ3JGLElBQU0sWUFBWSxHQUFHLFVBQUMsSUFBVyxJQUFLLDhDQUNqQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQzlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FGb0IsQ0FHckMsQ0FBQztBQUVGLHNGQUFzRjtBQUN0RixJQUFNLFdBQVcsR0FBRyxVQUFDLEtBQWEsRUFBRSxJQUFhLElBQUssOENBQ2pELEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO0lBQzNCLElBQUk7V0FGZ0QsQ0FHckQsQ0FBQztBQUVGLGtGQUFrRjtBQUNsRixJQUFNLGFBQWEsR0FBRyxVQUFDLFdBQW9CLEVBQUUsSUFBVyxJQUFLO0lBQzNELFdBQVc7VUFDUixZQUFZLENBQUMsSUFBSSxDQUFDLFdBRnNDLENBRzVELENBQUM7QUFFRixJQUFNLFdBQVcsR0FBRyxVQUFDLEdBQVk7SUFDL0IsSUFBTSxJQUFJLEdBQWEsRUFBRSxDQUFDO0lBRTFCLElBQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBRTFDLElBQU0sbUJBQW1CLEdBQUcsVUFBQyxJQUFZO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNqQztRQUNELG9FQUFvRTtRQUNwRSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDO0lBRUYsSUFBTSxjQUFjLEdBQUcsVUFBQyxJQUFvQjtRQUMxQyxPQUFBLElBQUEsa0JBQVEsRUFBQyxJQUFJLEVBQUUsVUFBQyxJQUFJO1lBQ2xCLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDakIsS0FBSyxlQUFlO29CQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLElBQUEsNEJBQWlCLEVBQUUsSUFBMEIsQ0FBQyxLQUFLLENBQUMsV0FBRTtvQkFDbkUsTUFBTTtnQkFDUixLQUFLLFlBQVk7b0JBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFDQyxHQUFHLENBQUMsYUFBYSxDQUNsQixtQkFBbUIsQ0FBRSxJQUF1QixDQUFDLEtBQUssQ0FBQyxDQUNwRCxXQUNEO29CQUNGLE1BQU07Z0JBQ1IsS0FBSyxrQkFBa0I7b0JBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFFLElBQTRCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDaEUsTUFBTTthQUNUO1FBQ0gsQ0FBQyxDQUFDO0lBbEJGLENBa0JFLENBQUM7SUFFTCxJQUFNLGNBQWMsR0FBRyxVQUFDLFVBQTJCO1FBQ2pELE9BQUEsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFDLFNBQVM7WUFDM0IsUUFBUSxTQUFTLENBQUMsSUFBSSxFQUFFO2dCQUN0QixLQUFLLGdCQUFnQjtvQkFDbkIsY0FBYyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxXQUFFO29CQUNuQyxNQUFNO2dCQUNSLEtBQUsscUJBQXFCO29CQUN4QixjQUFjLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQUU7b0JBQ3JFLE1BQU07Z0JBQ1IsS0FBSyxvQkFBb0I7b0JBQ3ZCLGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBRTtvQkFDckUsTUFBTTtnQkFDUixLQUFLLGdCQUFnQjtvQkFDbkIsY0FBYztvQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBRTFCLGFBQWE7b0JBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUUxQiwrQkFBK0I7b0JBQy9CLGNBQWMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUUxQixnQkFBZ0I7b0JBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN4QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsV0FBRTtvQkFFbkMsZUFBZTtvQkFDZixjQUFjLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUVyQyxhQUFhO29CQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNyQixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsV0FBRTtvQkFFbkMsV0FBVztvQkFDWCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFFdEIsWUFBWTtvQkFDWixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDdEIsTUFBTTtnQkFDUixLQUFLLG1CQUFtQjtvQkFDdEIsbUNBQW1DO29CQUNuQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBRTtvQkFFMUQsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSwyQkFBUyxHQUFHLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQUU7b0JBRTFELGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFFO29CQUU5RCxtQ0FBbUM7b0JBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFFO29CQUMxRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLElBQUEsNEJBQWlCLEVBQUMscUJBQVMsQ0FBQyxVQUFVLENBQUMsV0FBRTtvQkFDdEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBRTFCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsSUFBSSxPQUFULElBQUksMkJBQVMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFFO29CQUMxRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFFMUIsd0JBQXdCO29CQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFFbEMsa0JBQWtCO29CQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLElBQUksT0FBVCxJQUFJLDJCQUFTLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBRTtvQkFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBRWxDLGtCQUFrQjtvQkFDbEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQzlCLElBQUksQ0FBQyxJQUFJLE9BQVQsSUFBSSxFQUFTLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMscUNBQXFDO29CQUNqRSxNQUFNO2FBQ1Q7UUFDSCxDQUFDLENBQUM7SUFyRkYsQ0FxRkUsQ0FBQztJQUVMLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVwQixPQUFPLEVBQUUsSUFBSSxNQUFBLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM1QyxDQUFDLENBQUM7QUFFRix5RUFBeUU7QUFDbEUsSUFBTSxPQUFPLEdBQVksVUFBQyxHQUFZO0lBQzNDLGlFQUFpRTtJQUNqRSxJQUFNLFlBQVksR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFNUQsSUFBTSxhQUFhO1FBQ2pCLFlBQVk7Y0FDVCxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxxQkFBcUI7UUFDcEQsVUFBVSxDQUFDLGtCQUFrQjthQUM5QixDQUFDO0lBRUYsMkJBQTJCO0lBQzNCLElBQU0sV0FBVyxHQUFHLGFBQWEsQ0FDL0IsT0FBTyxDQUFDLElBQUksRUFDWixZQUFZLENBQUMsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FDNUMsQ0FBQztJQUVGLGtGQUFrRjtJQUNsRixJQUFNLFdBQVcsR0FBRyxhQUFhLENBQy9CLE9BQU8sQ0FBQyxJQUFJLEVBQ1osWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FDN0MsQ0FBQztJQUVGLCtCQUErQjtJQUMvQixJQUFNLG1CQUFtQix3REFDcEIsSUFBQSwwQkFBZSxFQUFDLEtBQUssQ0FBQyxrQkFDdEIsSUFBQSwwQkFBZSxFQUFDLE9BQU8sQ0FBQztRQUMzQixVQUFVLENBQUMsSUFBSTtRQUNmLElBQUksQ0FBQyx1QkFBdUI7YUFDN0IsQ0FBQztJQUVGLElBQU0sWUFBWSx3REFDYixJQUFBLDBCQUFlLEVBQUMsS0FBSyxDQUFDLGtCQUN0QixJQUFBLDBCQUFlLEVBQUMsUUFBUSxDQUFDO1FBQzVCLFVBQVUsQ0FBQyxHQUFHO1FBQ2QsMkVBQTJFO1FBQzNFLElBQUk7UUFDSixJQUFJO2FBQ0wsQ0FBQztJQUVGLElBQU0sYUFBYSxHQUFHLGFBQWEsQ0FDakMsT0FBTyxDQUFDLE1BQU0sRUFDZCxZQUFZLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUNsRCxDQUFDO0lBRUYsK0JBQStCO0lBQy9CLElBQU0sYUFBYSxHQUFHLGFBQWEsQ0FDakMsT0FBTyxDQUFDLE1BQU0sRUFDZCxZQUFZLENBQUM7K0NBRU4sSUFBQSwwQkFBZSxFQUFDLEtBQUssQ0FBQztZQUN6QixVQUFVLENBQUMsSUFBSTtZQUNmLElBQUksQ0FBQywyQkFBMkI7O0tBRW5DLENBQUMsQ0FDSCxDQUFDO0lBRUYsdUJBQXVCO0lBQ2pCLElBQUEsS0FBdUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFyQyxJQUFJLFVBQUEsRUFBRSxVQUFVLGdCQUFxQixDQUFDO0lBQzlDLElBQU0sTUFBTSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBRTVFLElBQU0sWUFBWSxHQUFHLFlBQVksc0RBQzVCLFlBQVksQ0FBQyxNQUFNLENBQUMsa0JBQ3BCLElBQUk7UUFDUCxNQUFNLENBQUMsR0FBRztjQUNWLENBQUM7SUFFSCxJQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFOUUsT0FBTyxVQUFVLENBQUMsSUFBSSw4R0FDakIsaUJBQWlCLGtCQUNqQixhQUFhLGtCQUNiLFdBQVcsa0JBQ1gsYUFBYSxrQkFDYixXQUFXLGtCQUNYLGFBQWEsa0JBQ2IsV0FBVyxVQUNkLENBQUM7QUFDTCxDQUFDLENBQUM7QUE3RVcsUUFBQSxPQUFPLFdBNkVsQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2VEssSUFBTSxpQkFBaUIsR0FBRyxVQUFDLENBQVM7SUFDekMsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2QixPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDO0FBSlcsUUFBQSxpQkFBaUIscUJBSTVCO0FBRUYsb0ZBQW9GO0FBQzdFLElBQU0sZUFBZSxHQUFHLFVBQUMsR0FBVyxJQUFlO0lBQ3hELEdBQUcsQ0FBQyxNQUFNO1VBQ1AsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFmLENBQWUsQ0FBQyxXQUZZLENBR3pELENBQUM7QUFIVyxRQUFBLGVBQWUsbUJBRzFCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ1ZGLHlDQUF1QztBQUN2QyxtQ0FBaUM7QUFDakMseUNBQXdDO0FBRXhDLElBQU0sYUFBYSxHQUFHLFVBQUMsUUFBZ0IsRUFBRSxJQUFZLEVBQUUsS0FBYTtJQUNsRSxRQUFRLFFBQVEsRUFBRTtRQUNoQixLQUFLLEdBQUc7WUFDTixPQUFPLElBQUksR0FBRyxLQUFLLENBQUM7UUFDdEIsS0FBSyxHQUFHO1lBQ04sT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ3RCLEtBQUssR0FBRztZQUNOLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQztRQUN0QixLQUFLLEdBQUc7WUFDTixPQUFPLElBQUksR0FBRyxLQUFLLENBQUM7UUFDdEIsS0FBSyxJQUFJO1lBQ1AsT0FBTyxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixLQUFLLEdBQUc7WUFDTixPQUFPLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLEtBQUssR0FBRztZQUNOLE9BQU8sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsS0FBSyxJQUFJO1lBQ1AsT0FBTyxJQUFJLElBQUksS0FBSyxDQUFDO1FBQ3ZCLEtBQUssSUFBSTtZQUNQLE9BQU8sSUFBSSxJQUFJLEtBQUssQ0FBQztLQUN4QjtJQUNELE1BQU0sS0FBSyxDQUFDLGtDQUEyQixRQUFRLENBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUMsQ0FBQztBQUVLLElBQU0sT0FBTyxHQUNsQixVQUFPLEdBQUcsRUFBRSxFQUF3QjtRQUF0QixLQUFLLFdBQUEsRUFBRSxhQUFhLG1CQUFBOzs7WUFDbEMsc0JBQUE7b0JBQ0UsSUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBUSxFQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM3QixJQUFNLEdBQUcsR0FBRyxJQUFBLGNBQUssRUFBQyxNQUFNLENBQUMsQ0FBQztvQkFFMUIsSUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFFMUIsSUFBTSxrQkFBa0IsR0FBRyxVQUFDLFVBQTBCO3dCQUNwRCxRQUFRLFVBQVUsQ0FBQyxJQUFJLEVBQUU7NEJBQ3ZCLEtBQUssZUFBZTtnQ0FDbEIsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDOzRCQUMxQixLQUFLLGtCQUFrQjtnQ0FDckIsT0FBTyxhQUFhLENBQ2xCLFVBQVUsQ0FBQyxRQUFRLEVBQ25CLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFDbkMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUNyQyxDQUFDOzRCQUNKLEtBQUssWUFBWTtnQ0FDZixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO3lCQUN4QztvQkFDSCxDQUFDLENBQUM7b0JBRUYsSUFBTSxpQkFBaUIsR0FBRyxVQUFDLFVBQTJCO3dCQUNwRCxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUMsU0FBUzs0QkFDM0IsUUFBUSxTQUFTLENBQUMsSUFBSSxFQUFFO2dDQUN0QixLQUFLLGdCQUFnQjtvQ0FDbkIsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO29DQUNoRCxNQUFNO2dDQUNSLEtBQUsscUJBQXFCO29DQUN4QixPQUFPLENBQUMsR0FBRyxDQUNULFNBQVMsQ0FBQyxJQUFJLEVBQ2Qsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUMxQyxDQUFDO29DQUNGLE1BQU07Z0NBQ1IsS0FBSyxvQkFBb0I7b0NBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQ0FDakUsTUFBTTtnQ0FDUixLQUFLLGdCQUFnQjtvQ0FDbkIsT0FBTyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7d0NBQy9DLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztxQ0FDekM7b0NBQ0QsTUFBTTtnQ0FDUixLQUFLLG1CQUFtQixDQUFDLENBQUM7b0NBQ3hCLElBQU0sQ0FBQyxHQUFHLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQ0FDMUMsSUFBTSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29DQUMxQyxJQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7b0NBQ2xELElBQU0sYUFBYSxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQ0FDM0QsYUFBYSxDQUFDLENBQUMsR0FBRyxxQkFBUyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7b0NBQ3BELE1BQU07aUNBQ1A7NkJBQ0Y7d0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDO29CQUVGLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN6QixDQUFDLEVBQUE7OztDQUFBLENBQUM7QUF4RFMsUUFBQSxPQUFPLFdBd0RoQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcEZKO0lBQWlDLCtCQUFLO0lBRXBDLHFCQUFZLE9BQWUsRUFBRSxLQUFZO1FBQXpDLFlBQ0Usa0JBQU0sT0FBTyxDQUFDLFNBRWY7UUFEQyxLQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzs7SUFDckIsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FOQSxBQU1DLENBTmdDLEtBQUssR0FNckM7QUFOWSxrQ0FBVztBQVFqQixJQUFNLEtBQUssR0FBVyxVQUFDLE1BQU07SUFDbEMsSUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO0lBQ2hELElBQUksWUFBWSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFFOUMsSUFBTSxxQkFBcUIsR0FBRyxVQUFDLElBQVk7UUFDekMsT0FBQSxZQUFZLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLFNBQVM7SUFBOUQsQ0FBOEQsQ0FBQztJQUVqRSxJQUFNLFFBQVEsR0FBRyxVQUFDLEtBQWM7UUFDOUIsSUFBSSxLQUFLLElBQUksS0FBSyxLQUFLLFlBQVksQ0FBQyxLQUFLLEVBQUU7WUFDekMsTUFBTSxJQUFJLFdBQVcsQ0FDbkIsMkNBQW9DLEtBQUssd0JBQWMsWUFBWSxDQUFDLEtBQUssQ0FBRSxFQUMzRSxZQUFZLENBQ2IsQ0FBQztTQUNIO1FBQ0QsWUFBWSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUM7SUFDNUMsQ0FBQyxDQUFDO0lBRUYsSUFBTSxlQUFlLEdBQStCO1FBQ2xELElBQUksSUFBb0IsQ0FBQztRQUN6QixRQUFRLFlBQVksQ0FBQyxJQUFJLEVBQUU7WUFDekIsS0FBSyxRQUFRO2dCQUNYLElBQUksR0FBRztvQkFDTCxJQUFJLEVBQUUsZUFBZTtvQkFDckIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO2lCQUNsQyxDQUFDO2dCQUNGLFFBQVEsRUFBRSxDQUFDO2dCQUNYLE9BQU8sSUFBSSxDQUFDO1lBQ2QsS0FBSyxZQUFZO2dCQUNmLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekQsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7WUFDZCxLQUFLLGFBQWEsQ0FBQyxDQUFDO2dCQUNsQixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2QsSUFBTSxJQUFJLEdBQUcsZUFBZSxFQUFFLENBQUM7Z0JBQy9CLElBQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUM7Z0JBQ3BDLFFBQVEsRUFBRSxDQUFDO2dCQUNYLElBQU0sS0FBSyxHQUFHLGVBQWUsRUFBRSxDQUFDO2dCQUNoQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2QsT0FBTztvQkFDTCxJQUFJLEVBQUUsa0JBQWtCO29CQUN4QixJQUFJLE1BQUE7b0JBQ0osS0FBSyxPQUFBO29CQUNMLFFBQVEsRUFBRSxRQUFvQjtpQkFDL0IsQ0FBQzthQUNIO1lBQ0Q7Z0JBQ0UsTUFBTSxJQUFJLFdBQVcsQ0FDbkIsZ0NBQXlCLFlBQVksQ0FBQyxJQUFJLENBQUUsRUFDNUMsWUFBWSxDQUNiLENBQUM7U0FDTDtJQUNILENBQUMsQ0FBQztJQUVGLElBQU0sbUJBQW1CLEdBQW1DO1FBQzFELFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQixPQUFPO1lBQ0wsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixVQUFVLEVBQUUsZUFBZSxFQUFFO1NBQzlCLENBQUM7SUFDSixDQUFDLENBQUM7SUFFRixJQUFNLG1CQUFtQixHQUFtQztRQUMxRCxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbEIsSUFBTSxVQUFVLEdBQUcsZUFBZSxFQUFFLENBQUM7UUFFckMsSUFBTSxVQUFVLEdBQW9CLEVBQUUsQ0FBQztRQUN2QyxPQUFPLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDekMsVUFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXJCLE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxZQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUUsQ0FBQztJQUM1RCxDQUFDLENBQUM7SUFFRixJQUFNLHVCQUF1QixHQUF1QztRQUNsRSxJQUFNLElBQUksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQ2hDLFFBQVEsRUFBRSxDQUFDO1FBQ1gsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsT0FBTyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLE1BQUEsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQztJQUN4RSxDQUFDLENBQUM7SUFFRixJQUFNLGlDQUFpQyxHQUVuQztRQUNGLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQixJQUFNLElBQUksR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQ2hDLFFBQVEsRUFBRSxDQUFDO1FBQ1gsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsT0FBTztZQUNMLElBQUksRUFBRSxxQkFBcUI7WUFDM0IsSUFBSSxNQUFBO1lBQ0osV0FBVyxFQUFFLGVBQWUsRUFBRTtTQUMvQixDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBRUYsSUFBTSxzQkFBc0IsR0FBc0M7UUFDaEUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JCLE9BQU87WUFDTCxJQUFJLEVBQUUsbUJBQW1CO1lBQ3pCLENBQUMsRUFBRSxlQUFlLEVBQUU7WUFDcEIsQ0FBQyxFQUFFLGVBQWUsRUFBRTtZQUNwQixLQUFLLEVBQUUsZUFBZSxFQUFFO1NBQ3pCLENBQUM7SUFDSixDQUFDLENBQUM7SUFFRixJQUFNLGNBQWMsR0FBOEI7UUFDaEQsSUFBSSxZQUFZLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUNuQyxRQUFRLFlBQVksQ0FBQyxLQUFLLEVBQUU7Z0JBQzFCLEtBQUssT0FBTztvQkFDVixPQUFPLG1CQUFtQixFQUFFLENBQUM7Z0JBQy9CLEtBQUssS0FBSztvQkFDUixPQUFPLGlDQUFpQyxFQUFFLENBQUM7Z0JBQzdDLEtBQUssT0FBTztvQkFDVixPQUFPLG1CQUFtQixFQUFFLENBQUM7Z0JBQy9CLEtBQUssVUFBVTtvQkFDYixPQUFPLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2xDO29CQUNFLE1BQU0sSUFBSSxXQUFXLENBQ25CLDBCQUFtQixZQUFZLENBQUMsS0FBSyxDQUFFLEVBQ3ZDLFlBQVksQ0FDYixDQUFDO2FBQ0w7U0FDRjthQUFNLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7WUFDN0MsT0FBTyx1QkFBdUIsRUFBRSxDQUFDO1NBQ2xDO2FBQU07WUFDTCxNQUFNLElBQUksV0FBVyxDQUNuQixnQ0FBeUIsWUFBWSxDQUFDLEtBQUssQ0FBRSxFQUM3QyxZQUFZLENBQ2IsQ0FBQztTQUNIO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsSUFBTSxLQUFLLEdBQW9CLEVBQUUsQ0FBQztJQUNsQyxPQUFPLFlBQVksRUFBRTtRQUNuQixLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7S0FDOUI7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMsQ0FBQztBQTVJVyxRQUFBLEtBQUssU0E0SWhCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3BKVyxRQUFBLFFBQVEsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM3RCxRQUFBLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFMUUsSUFBTSxXQUFXLEdBQUcsVUFBQyxJQUFZO0lBQy9CLE9BQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsRUFBRSxNQUFNLENBQUM7QUFBaEQsQ0FBZ0QsQ0FBQztBQUVuRDtJQUFvQyxrQ0FBSztJQUV2Qyx3QkFBWSxPQUFlLEVBQUUsS0FBYTtRQUExQyxZQUNFLGtCQUFNLE9BQU8sQ0FBQyxTQUVmO1FBREMsS0FBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7O0lBQ3JCLENBQUM7SUFDSCxxQkFBQztBQUFELENBTkEsQUFNQyxDQU5tQyxLQUFLLEdBTXhDO0FBTlksd0NBQWM7QUFRM0IsNERBQTREO0FBQzVELElBQU0sWUFBWSxHQUNoQixVQUFDLEtBQWEsRUFBRSxJQUFlO0lBQy9CLE9BQUEsVUFBQyxLQUFLLEVBQUUsS0FBSztRQUNYLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELE9BQU8sS0FBSyxJQUFJLEVBQUUsSUFBSSxNQUFBLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVDLENBQUM7QUFIRCxDQUdDLENBQUM7QUFFSixJQUFNLFFBQVEsR0FBRztJQUNmLFlBQVksQ0FBQyw2QkFBNkIsRUFBRSxRQUFRLENBQUM7SUFDckQsWUFBWSxDQUFDLFlBQUssZ0JBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQUcsRUFBRSxTQUFTLENBQUM7SUFDbkQsWUFBWSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUM7SUFDbkMsWUFBWSxDQUFDLFlBQUssaUJBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFHLEVBQUUsVUFBVSxDQUFDO0lBQ3RFLFlBQVksQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDO0lBQ3hDLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDO0lBQ2hDLFlBQVksQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDO0NBQ3hDLENBQUM7QUFFRixJQUFNLGdCQUFnQixHQUFHLFVBQUMsS0FBYSxFQUFFLEtBQWEsSUFBSyxPQUFBLENBQUM7SUFDMUQsSUFBSSxFQUFFLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ2hELElBQUksRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUM7Q0FDdkQsQ0FBQyxFQUh5RCxDQUd6RCxDQUFDO0FBRUksSUFBTSxRQUFRLEdBQWMsVUFBQyxLQUFLO0lBQ3ZDLElBQU0sTUFBTSxHQUFZLEVBQUUsQ0FBQztJQUMzQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxPQUFPLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQzNCLElBQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFmLENBQWUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUMsQ0FBQztRQUN0RSxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNwQyxtREFBbUQ7WUFDbkQsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxJQUFJLHVCQUFNLEtBQUssR0FBSyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUcsQ0FBQzthQUM5RDtZQUNELEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztTQUM3QjthQUFNO1lBQ0wsTUFBTSxJQUFJLGNBQWMsQ0FDdEIsMkJBQW9CLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBRSxFQUN2RCxLQUFLLENBQ04sQ0FBQztTQUNIO0tBQ0Y7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFwQlcsUUFBQSxRQUFRLFlBb0JuQjs7Ozs7QUN6REYseUVBQXlFO0FBQ3pFLElBQU0sUUFBUSxHQUFhLFVBQUMsS0FBSyxFQUFFLE9BQU87SUFDeEMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUMsSUFBSTtRQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBMkIsQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJO1lBQ3hELElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixJQUFNLFlBQVksR0FBYSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFDLFNBQWM7Z0JBQ2xDLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDdEMsUUFBUSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDOUI7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBRUYsa0JBQWUsUUFBUSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZGVjbGFyZSBjb25zdCBDb2RlTWlycm9yOiBhbnk7XG5kZWNsYXJlIGNvbnN0ICQ6IGFueTtcblxuaW1wb3J0IGNvcHkgZnJvbSBcImNvcHktdG8tY2xpcGJvYXJkXCI7XG5pbXBvcnQgeyBtYXJrZWQgfSBmcm9tIFwibWFya2VkXCI7XG5cbmltcG9ydCB7IHJ1bnRpbWUgYXMgaW50ZXJwcmV0ZXJSdW50aW1lIH0gZnJvbSBcIi4uL3NyYy9pbnRlcnByZXRlclwiO1xuaW1wb3J0IHsgcnVudGltZSBhcyBjb21waWxlclJ1bnRpbWUgfSBmcm9tIFwiLi4vc3JjL2NvbXBpbGVyXCI7XG5pbXBvcnQgeyBrZXl3b3JkcyB9IGZyb20gXCIuLi9zcmMvdG9rZW5pemVyXCI7XG5pbXBvcnQgeyBDb25zdGFudHMgfSBmcm9tIFwiLi4vc3JjL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgUGFyc2VyRXJyb3IgfSBmcm9tIFwiLi4vc3JjL3BhcnNlclwiO1xuXG5jb25zdCBjb21waWxlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb21waWxlXCIpO1xuY29uc3QgaW50ZXJwcmV0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpbnRlcnByZXRcIik7XG5jb25zdCBjb2RlQXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29kZVwiKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuY29uc3Qgb3V0cHV0QXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0cHV0XCIpIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG5jb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbmNvbnN0IHNoYXJlVXJsRmllbGQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgXCJzaGFyZVVybEZpZWxkXCJcbikgYXMgSFRNTElucHV0RWxlbWVudDtcbmNvbnN0IGNvcHlVcmxCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcbiAgXCJjb3B5VXJsQnV0dG9uXCJcbikgYXMgSFRNTElucHV0RWxlbWVudDtcbmNvbnN0IGRlc2NyaXB0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkZXNjcmlwdGlvblwiKSBhcyBIVE1MRGl2RWxlbWVudDtcblxuaWYgKHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gIGNvbnN0IGNvZGVCYXNlNjQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIiNcIilbMV07XG4gIGNvbnN0IGNvZGUgPSBCdWZmZXIuZnJvbShjb2RlQmFzZTY0LCBcImJhc2U2NFwiKS50b1N0cmluZyhcImJpbmFyeVwiKTtcbiAgY29kZUFyZWEudmFsdWUgPSBkZWNvZGVVUklDb21wb25lbnQoY29kZSk7XG59XG5cbi8vIFJlZjogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQwNzcyODgxLzEzNzQ5NTYxXG5jb25zdCBzY2FsZUltYWdlRGF0YSA9IChcbiAgaW1hZ2VEYXRhOiBJbWFnZURhdGEsXG4gIHNjYWxlOiBudW1iZXIsXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEXG4pID0+IHtcbiAgY29uc3Qgc2NhbGVkID0gY3R4LmNyZWF0ZUltYWdlRGF0YShcbiAgICBpbWFnZURhdGEud2lkdGggKiBzY2FsZSxcbiAgICBpbWFnZURhdGEuaGVpZ2h0ICogc2NhbGVcbiAgKTtcbiAgY29uc3Qgc3ViTGluZSA9IGN0eC5jcmVhdGVJbWFnZURhdGEoc2NhbGUsIDEpLmRhdGE7XG4gIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGltYWdlRGF0YS5oZWlnaHQ7IHJvdysrKSB7XG4gICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgaW1hZ2VEYXRhLndpZHRoOyBjb2wrKykge1xuICAgICAgY29uc3Qgc291cmNlUGl4ZWwgPSBpbWFnZURhdGEuZGF0YS5zdWJhcnJheShcbiAgICAgICAgKHJvdyAqIGltYWdlRGF0YS53aWR0aCArIGNvbCkgKiA0LFxuICAgICAgICAocm93ICogaW1hZ2VEYXRhLndpZHRoICsgY29sKSAqIDQgKyA0XG4gICAgICApO1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzY2FsZTsgeCsrKSBzdWJMaW5lLnNldChzb3VyY2VQaXhlbCwgeCAqIDQpO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBzY2FsZTsgeSsrKSB7XG4gICAgICAgIGNvbnN0IGRlc3RSb3cgPSByb3cgKiBzY2FsZSArIHk7XG4gICAgICAgIGNvbnN0IGRlc3RDb2wgPSBjb2wgKiBzY2FsZTtcbiAgICAgICAgc2NhbGVkLmRhdGEuc2V0KHN1YkxpbmUsIChkZXN0Um93ICogc2NhbGVkLndpZHRoICsgZGVzdENvbCkgKiA0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gc2NhbGVkO1xufTtcblxuQ29kZU1pcnJvci5kZWZpbmVTaW1wbGVNb2RlKFwic2ltcGxlbW9kZVwiLCB7XG4gIHN0YXJ0OiBbXG4gICAge1xuICAgICAgcmVnZXg6IG5ldyBSZWdFeHAoYCgke2tleXdvcmRzLmpvaW4oXCJ8XCIpfSlgKSxcbiAgICAgIHRva2VuOiBcImtleXdvcmRcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIHJlZ2V4OiAvMHhbYS1mXFxkXSt8Wy0rXT8oPzpcXC5cXGQrfFxcZCtcXC4/XFxkKikoPzplWy0rXT9cXGQrKT8vaSxcbiAgICAgIHRva2VuOiBcIm51bWJlclwiLFxuICAgIH0sXG4gICAgeyByZWdleDogL1stKy8qPTw+IV0rLywgdG9rZW46IFwib3BlcmF0b3JcIiB9LFxuICAgIHsgcmVnZXg6IC9bYS16JF1bXFx3JF0qLywgdG9rZW46IFwidmFyaWFibGVcIiB9LFxuICBdLFxufSk7XG5cbmNvbnN0IGVkaXRvciA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKGNvZGVBcmVhLCB7XG4gIG1vZGU6IFwic2ltcGxlbW9kZVwiLFxuICB0aGVtZTogXCJtb25va2FpXCIsXG4gIGxpbmVOdW1iZXJzOiB0cnVlLFxufSk7XG5cbmNvbnN0IGxvZ01lc3NhZ2UgPSAobWVzc2FnZTogc3RyaW5nIHwgbnVtYmVyKSA9PiB7XG4gIG91dHB1dEFyZWEudmFsdWUgPSBvdXRwdXRBcmVhLnZhbHVlICsgbWVzc2FnZSArIFwiXFxuXCI7XG59O1xuXG5sZXQgZXJyb3JNYXJrZXI6IGFueTtcblxuY29uc3QgbWFya0Vycm9yID0gKHRva2VuOiBUb2tlbikgPT4ge1xuICBpZiAodG9rZW4uY2hhcikge1xuICAgIGVycm9yTWFya2VyID0gZWRpdG9yLm1hcmtUZXh0KFxuICAgICAgeyBsaW5lOiB0b2tlbi5saW5lLCBjaDogdG9rZW4uY2hhciB9LFxuICAgICAgeyBsaW5lOiB0b2tlbi5saW5lLCBjaDogdG9rZW4uY2hhciArIHRva2VuLnZhbHVlLmxlbmd0aCB9LFxuICAgICAgeyBjbGFzc05hbWU6IFwiZXJyb3JcIiB9XG4gICAgKTtcbiAgfVxufTtcblxuY29uc3QgdXBkYXRlQ2FudmFzID0gKGRpc3BsYXlCdWZmZXI6IFVpbnQ4QXJyYXkpID0+IHtcbiAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gIGNvbnN0IGltZ0RhdGEgPSBjb250ZXh0IS5jcmVhdGVJbWFnZURhdGEoXG4gICAgQ29uc3RhbnRzLkNBTlZBU19ESU0sXG4gICAgQ29uc3RhbnRzLkNBTlZBU19ESU1cbiAgKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBDb25zdGFudHMuQ0FOVkFTX0RJTSAqIENvbnN0YW50cy5DQU5WQVNfRElNOyBpKyspIHtcbiAgICBpbWdEYXRhLmRhdGFbaSAqIDRdID0gZGlzcGxheUJ1ZmZlcltpXTsgLy8gUmVkXG4gICAgaW1nRGF0YS5kYXRhW2kgKiA0ICsgMV0gPSBkaXNwbGF5QnVmZmVyW2ldOyAvLyBHcmVlblxuICAgIGltZ0RhdGEuZGF0YVtpICogNCArIDJdID0gZGlzcGxheUJ1ZmZlcltpXTsgLy8gQmx1ZVxuICAgIGltZ0RhdGEuZGF0YVtpICogNCArIDNdID0gMjU1OyAvLyBBbHBoYVxuICB9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gIGNvbnN0IGRhdGEgPSBzY2FsZUltYWdlRGF0YShpbWdEYXRhLCAzLCBjb250ZXh0ISk7XG4gIGNvbnRleHQ/LnB1dEltYWdlRGF0YShkYXRhLCAwLCAwKTtcbn07XG5cbmNvbnN0IHJ1biA9IGFzeW5jIChydW50aW1lOiBSdW50aW1lKSA9PiB7XG4gIGlmIChlcnJvck1hcmtlcikge1xuICAgIGVycm9yTWFya2VyLmNsZWFyKCk7XG4gIH1cblxuICBjb25zdCBzbGVlcCA9IGFzeW5jIChtczogbnVtYmVyKSA9PiB7XG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbiAgfTtcblxuICBhd2FpdCBzbGVlcCgxMCk7XG5cbiAgbGV0IHRpY2tGdW5jdGlvbjogVGlja0Z1bmN0aW9uO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgZGlzcGxheU1lbW9yeSA9IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoeyBpbml0aWFsOiAxIH0pO1xuICAgIHRpY2tGdW5jdGlvbiA9IGF3YWl0IHJ1bnRpbWUoZWRpdG9yLmdldFZhbHVlKCksIHtcbiAgICAgIHByaW50OiBsb2dNZXNzYWdlLFxuICAgICAgZGlzcGxheU1lbW9yeSxcbiAgICB9KTtcblxuICAgIG91dHB1dEFyZWEudmFsdWUgPSBcIlwiO1xuICAgIGxvZ01lc3NhZ2UoYEV4ZWN1dGluZyAuLi4gYCk7XG5cbiAgICB0aWNrRnVuY3Rpb24oKTtcbiAgICBjb25zdCBkaXNwbGF5QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoZGlzcGxheU1lbW9yeS5idWZmZXIpO1xuICAgIHVwZGF0ZUNhbnZhcyhkaXNwbGF5QnVmZmVyKTtcblxuICAgIGludGVycHJldEJ1dHRvbj8uY2xhc3NMaXN0LnJlbW92ZShcImFjdGl2ZVwiKTtcbiAgICBjb21waWxlQnV0dG9uPy5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nTWVzc2FnZSgoZSBhcyBQYXJzZXJFcnJvcikubWVzc2FnZSk7XG4gICAgbWFya0Vycm9yKChlIGFzIFBhcnNlckVycm9yKS50b2tlbik7XG4gIH1cbn07XG5cbmludGVycHJldEJ1dHRvbj8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcbiAgaW50ZXJwcmV0QnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gIGNvbXBpbGVCdXR0b24/LmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XG4gIGF3YWl0IHJ1bihpbnRlcnByZXRlclJ1bnRpbWUpO1xufSk7XG5cbmNvbXBpbGVCdXR0b24/LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XG4gIGNvbXBpbGVCdXR0b24uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgaW50ZXJwcmV0QnV0dG9uPy5jbGFzc0xpc3QucmVtb3ZlKFwiYWN0aXZlXCIpO1xuICBhd2FpdCBydW4oY29tcGlsZXJSdW50aW1lKTtcbn0pO1xuXG4kKFwiI3NoYXJlTW9kYWxcIikub24oXCJzaG93LmJzLm1vZGFsXCIsICgpID0+IHtcbiAgY29uc3QgYmFzZVVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiI1wiKVswXTtcbiAgY29uc3QgY29kZSA9IGVkaXRvci5nZXRWYWx1ZSgpO1xuICBjb25zdCBjb2RlQmFzZTY0ID0gQnVmZmVyLmZyb20oY29kZSwgXCJiaW5hcnlcIikudG9TdHJpbmcoXCJiYXNlNjRcIik7XG4gIGNvbnN0IGVuY29kZWRDb2RlQmFzZTY0ID0gZW5jb2RlVVJJQ29tcG9uZW50KGNvZGVCYXNlNjQpO1xuICBzaGFyZVVybEZpZWxkLnZhbHVlID0gYCR7YmFzZVVybH0jJHtlbmNvZGVkQ29kZUJhc2U2NH1gO1xuXG4gIHNoYXJlVXJsRmllbGQuc2VsZWN0KCk7XG59KTtcblxuY29weVVybEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4gY29weShzaGFyZVVybEZpZWxkLnZhbHVlKSk7XG5cbmNvbnN0IGRlc2NyaXB0aW9uVGV4dCA9IGBcbldoZW4gdGhlIGNvZGUgaXMgcnVuLCB0aGUgY29kZSBpcyB0b2tlbmlzZWQgYW5kIHBhcnNlZCBpbnRvIGFuIEFic3RyYWN0IFN5bnRheCBUcmVlIChBU1QpLiBXaGVuIHVzaW5nIHRoZSBpbnRlcnByZXRlciwgdGhlIEFTVCBpcyBleGVjdXRlZCB1c2luZyBKYXZhU2NyaXB0LiBXaGVuIHVzaW5nIHRoZSBjb21waWxlciwgdGhlIEFTVCBpcyBjb21waWxlZCBpbnRvIGEgV2ViQXNzZW1ibHkgbW9kdWxlIGFuZCBleGVjdXRlZCBieSB0aGUgV2ViQXNzZW1ibHkgcnVudGltZS5cblxuIyMgTGFuZ3VhZ2VcblxuVGhlIHN5bnRheCBpcyBmYWlybHkgc3RyYWlnaHRmb3J3YXJkLiBBcyBhIHN1bW1hcnkgb2YgdGhlIG1haW4gbGFuZ3VhZ2UgZmVhdHVyZXM6XG5cbi0gUHJpbnQgdmFyaWFibGUgdmFsdWU6IFxcYHByaW50IDx2YXJpYWJsZT5cXGAuXG5cbi0gQXNzaWduIHZhbHVlIHRvIGEgdmFyaWFibGU6IFxcYHZhciA8bmFtZT4gPSA8dmFsdWU+XFxgLlxuXG4tIFNldCBwaXhlbCBpbiB0aGUgY2FudmFzOiBcXGBzZXRwaXhlbCAoPHg+LCA8eT4sIDxjb2xvdXI+KVxcYC4gXFxgeFxcYCBhbmQgXFxgeVxcYCBhcmUgaW4gdGhlIHJhbmdlIDAtOTkgaW5jbHVzaXZlIGFuZCBcXGBjb2xvdXJcXGAgaXMgYSB2YWx1ZSBpbiB0aGUgcmFuZ2UgMC0yNTUgaW5jbHVzaXZlICh3aGVyZSAwIGlzIGJsYWNrIGFuZCAyNTUgaXMgd2hpdGUpLlxuXG4tIFdoaWxlIGxvb3A6IFxcYHdoaWxlICg8Y29uZGl0aW9uPikgPGNvZGU+IGVuZHdoaWxlXFxgXG5cbi0gT3BlcmF0b3JzOiBcXGArXFxgLCBcXGAtXFxgLCBcXGAqXFxgLCBcXGAvXFxgLCBcXGA9PVxcYCwgXFxgPFxcYCwgXFxgPlxcYCwgXFxgJiZcXGAsIFxcYHx8XFxgLlxuXG4tIFRoZSBsYW5ndWFnZSBjYW4gcGFyc2Ugc2NpZW50aWZpYyBub3RhdGlvbiwgZmxvYXRpbmcgcG9pbnRzLCBhbmQgbmVnYXRpdmUgdmFsdWVzLlxuYDtcblxuZGVzY3JpcHRpb24uaW5uZXJIVE1MID0gbWFya2VkLnBhcnNlKGRlc2NyaXB0aW9uVGV4dCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbmNvbnN0IGlzRGVyZWYgPSAoeCkgPT4geCAhPSBudWxsICYmIHR5cGVvZiB4W1wiZGVyZWZcIl0gPT09IFwiZnVuY3Rpb25cIjtcbmNvbnN0IGRlcmVmID0gKHgpID0+IChpc0RlcmVmKHgpID8geC5kZXJlZigpIDogeCk7XG5cbmV4cG9ydHMuTG9nTGV2ZWwgPSB2b2lkIDA7XG4oZnVuY3Rpb24gKExvZ0xldmVsKSB7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJGSU5FXCJdID0gMF0gPSBcIkZJTkVcIjtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIkRFQlVHXCJdID0gMV0gPSBcIkRFQlVHXCI7XG4gICAgTG9nTGV2ZWxbTG9nTGV2ZWxbXCJJTkZPXCJdID0gMl0gPSBcIklORk9cIjtcbiAgICBMb2dMZXZlbFtMb2dMZXZlbFtcIldBUk5cIl0gPSAzXSA9IFwiV0FSTlwiO1xuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiU0VWRVJFXCJdID0gNF0gPSBcIlNFVkVSRVwiO1xuICAgIExvZ0xldmVsW0xvZ0xldmVsW1wiTk9ORVwiXSA9IDVdID0gXCJOT05FXCI7XG59KShleHBvcnRzLkxvZ0xldmVsIHx8IChleHBvcnRzLkxvZ0xldmVsID0ge30pKTtcblxuZXhwb3J0cy5HTFR5cGUgPSB2b2lkIDA7XG4oZnVuY3Rpb24gKEdMVHlwZSkge1xuICAgIEdMVHlwZVtHTFR5cGVbXCJJOFwiXSA9IDUxMjBdID0gXCJJOFwiO1xuICAgIEdMVHlwZVtHTFR5cGVbXCJVOFwiXSA9IDUxMjFdID0gXCJVOFwiO1xuICAgIEdMVHlwZVtHTFR5cGVbXCJJMTZcIl0gPSA1MTIyXSA9IFwiSTE2XCI7XG4gICAgR0xUeXBlW0dMVHlwZVtcIlUxNlwiXSA9IDUxMjNdID0gXCJVMTZcIjtcbiAgICBHTFR5cGVbR0xUeXBlW1wiSTMyXCJdID0gNTEyNF0gPSBcIkkzMlwiO1xuICAgIEdMVHlwZVtHTFR5cGVbXCJVMzJcIl0gPSA1MTI1XSA9IFwiVTMyXCI7XG4gICAgR0xUeXBlW0dMVHlwZVtcIkYzMlwiXSA9IDUxMjZdID0gXCJGMzJcIjtcbn0pKGV4cG9ydHMuR0xUeXBlIHx8IChleHBvcnRzLkdMVHlwZSA9IHt9KSk7XG5jb25zdCBHTDJUWVBFID0ge1xuICAgIFtleHBvcnRzLkdMVHlwZS5JOF06IFwiaThcIixcbiAgICBbZXhwb3J0cy5HTFR5cGUuVThdOiBcInU4XCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLkkxNl06IFwiaTE2XCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLlUxNl06IFwidTE2XCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLkkzMl06IFwiaTMyXCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLlUzMl06IFwidTMyXCIsXG4gICAgW2V4cG9ydHMuR0xUeXBlLkYzMl06IFwiZjMyXCIsXG59O1xuY29uc3QgVFlQRTJHTCA9IHtcbiAgICBpODogZXhwb3J0cy5HTFR5cGUuSTgsXG4gICAgdTg6IGV4cG9ydHMuR0xUeXBlLlU4LFxuICAgIHU4YzogZXhwb3J0cy5HTFR5cGUuVTgsXG4gICAgaTE2OiBleHBvcnRzLkdMVHlwZS5JMTYsXG4gICAgdTE2OiBleHBvcnRzLkdMVHlwZS5VMTYsXG4gICAgaTMyOiBleHBvcnRzLkdMVHlwZS5JMzIsXG4gICAgdTMyOiBleHBvcnRzLkdMVHlwZS5VMzIsXG4gICAgZjMyOiBleHBvcnRzLkdMVHlwZS5GMzIsXG4gICAgZjY0OiB1bmRlZmluZWQsXG59O1xuY29uc3QgU0laRU9GID0ge1xuICAgIHU4OiAxLFxuICAgIHU4YzogMSxcbiAgICBpODogMSxcbiAgICB1MTY6IDIsXG4gICAgaTE2OiAyLFxuICAgIHUzMjogNCxcbiAgICBpMzI6IDQsXG4gICAgZjMyOiA0LFxuICAgIGY2NDogOCxcbn07XG5jb25zdCBGTE9BVF9BUlJBWV9DVE9SUyA9IHtcbiAgICBmMzI6IEZsb2F0MzJBcnJheSxcbiAgICBmNjQ6IEZsb2F0NjRBcnJheSxcbn07XG5jb25zdCBJTlRfQVJSQVlfQ1RPUlMgPSB7XG4gICAgaTg6IEludDhBcnJheSxcbiAgICBpMTY6IEludDE2QXJyYXksXG4gICAgaTMyOiBJbnQzMkFycmF5LFxufTtcbmNvbnN0IFVJTlRfQVJSQVlfQ1RPUlMgPSB7XG4gICAgdTg6IFVpbnQ4QXJyYXksXG4gICAgdThjOiBVaW50OENsYW1wZWRBcnJheSxcbiAgICB1MTY6IFVpbnQxNkFycmF5LFxuICAgIHUzMjogVWludDMyQXJyYXksXG59O1xuY29uc3QgVFlQRURBUlJBWV9DVE9SUyA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBGTE9BVF9BUlJBWV9DVE9SUyksIElOVF9BUlJBWV9DVE9SUyksIFVJTlRfQVJSQVlfQ1RPUlMpO1xuY29uc3QgYXNOYXRpdmVUeXBlID0gKHR5cGUpID0+IHtcbiAgICBjb25zdCB0ID0gR0wyVFlQRVt0eXBlXTtcbiAgICByZXR1cm4gdCAhPT0gdW5kZWZpbmVkID8gdCA6IHR5cGU7XG59O1xuY29uc3QgYXNHTFR5cGUgPSAodHlwZSkgPT4ge1xuICAgIGNvbnN0IHQgPSBUWVBFMkdMW3R5cGVdO1xuICAgIHJldHVybiB0ICE9PSB1bmRlZmluZWQgPyB0IDogdHlwZTtcbn07XG5jb25zdCBzaXplT2YgPSAodHlwZSkgPT4gU0laRU9GW2FzTmF0aXZlVHlwZSh0eXBlKV07XG5mdW5jdGlvbiB0eXBlZEFycmF5KHR5cGUsIC4uLnhzKSB7XG4gICAgcmV0dXJuIG5ldyBUWVBFREFSUkFZX0NUT1JTW2FzTmF0aXZlVHlwZSh0eXBlKV0oLi4ueHMpO1xufVxuY29uc3QgdHlwZWRBcnJheVR5cGUgPSAoeCkgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHgpKVxuICAgICAgICByZXR1cm4gXCJmNjRcIjtcbiAgICBmb3IgKGxldCBpZCBpbiBUWVBFREFSUkFZX0NUT1JTKSB7XG4gICAgICAgIGlmICh4IGluc3RhbmNlb2YgVFlQRURBUlJBWV9DVE9SU1tpZF0pXG4gICAgICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuICAgIHJldHVybiBcImY2NFwiO1xufTtcbmNvbnN0IHVpbnRUeXBlRm9yU2l6ZSA9ICh4KSA9PiB4IDw9IDB4MTAwID8gXCJ1OFwiIDogeCA8PSAweDEwMDAwID8gXCJ1MTZcIiA6IFwidTMyXCI7XG5jb25zdCBpbnRUeXBlRm9yU2l6ZSA9ICh4KSA9PiB4ID49IC0weDgwICYmIHggPCAweDgwID8gXCJpOFwiIDogeCA+PSAtMHg4MDAwICYmIHggPCAweDgwMDAgPyBcImkxNlwiIDogXCJpMzJcIjtcbmNvbnN0IHVpbnRUeXBlRm9yQml0cyA9ICh4KSA9PiB4ID4gMTYgPyBcInUzMlwiIDogeCA+IDggPyBcInUxNlwiIDogXCJ1OFwiO1xuY29uc3QgaW50VHlwZUZvckJpdHMgPSAoeCkgPT4geCA+IDE2ID8gXCJpMzJcIiA6IHggPiA4ID8gXCJpMTZcIiA6IFwiaThcIjtcblxuY29uc3QgREVGQVVMVF9FUFMgPSAxZS02O1xuY29uc3QgU0VNQVBIT1JFID0gU3ltYm9sKCk7XG5jb25zdCBOT19PUCA9ICgpID0+IHsgfTtcbmNvbnN0IEVWRU5UX0FMTCA9IFwiKlwiO1xuY29uc3QgRVZFTlRfRU5BQkxFID0gXCJlbmFibGVcIjtcbmNvbnN0IEVWRU5UX0RJU0FCTEUgPSBcImRpc2FibGVcIjtcblxuY29uc3QgYXNzZXJ0ID0gKCgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSBcInByb2R1Y3Rpb25cIiB8fFxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuVU1CUkVMTEFfQVNTRVJUUyA9PT0gXCIxXCIpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkgeyB9XG4gICAgcmV0dXJuIGZhbHNlO1xufSkoKVxuICAgID8gKHRlc3QsIG1zZyA9IFwiYXNzZXJ0aW9uIGZhaWxlZFwiKSA9PiB7XG4gICAgICAgIGlmICgodHlwZW9mIHRlc3QgPT09IFwiZnVuY3Rpb25cIiAmJiAhdGVzdCgpKSB8fCAhdGVzdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHR5cGVvZiBtc2cgPT09IFwiZnVuY3Rpb25cIiA/IG1zZygpIDogbXNnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICA6IE5PX09QO1xuXG5jb25zdCBleHBvc2VHbG9iYWwgPSAoaWQsIHZhbHVlLCBhbHdheXMgPSBmYWxzZSkgPT4ge1xuICAgIGNvbnN0IGdsb2IgPSB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICAgID8gZ2xvYmFsXG4gICAgICAgIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICAgPyB3aW5kb3dcbiAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGlmIChnbG9iICYmXG4gICAgICAgIChhbHdheXMgfHxcbiAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LlVNQlJFTExBX0dMT0JBTFMgPT09IFwiMVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pKCkpKSB7XG4gICAgICAgIGdsb2JbaWRdID0gdmFsdWU7XG4gICAgfVxufTtcblxuY29uc3QgTlVMTF9MT0dHRVIgPSBPYmplY3QuZnJlZXplKHtcbiAgICBsZXZlbDogZXhwb3J0cy5Mb2dMZXZlbC5OT05FLFxuICAgIGZpbmUoKSB7IH0sXG4gICAgZGVidWcoKSB7IH0sXG4gICAgaW5mbygpIHsgfSxcbiAgICB3YXJuKCkgeyB9LFxuICAgIHNldmVyZSgpIHsgfSxcbn0pO1xuY2xhc3MgQ29uc29sZUxvZ2dlciB7XG4gICAgY29uc3RydWN0b3IoaWQsIGxldmVsID0gZXhwb3J0cy5Mb2dMZXZlbC5GSU5FKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICAgIH1cbiAgICBmaW5lKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy5sZXZlbCA8PSBleHBvcnRzLkxvZ0xldmVsLkZJTkUgJiYgdGhpcy5sb2coXCJGSU5FXCIsIGFyZ3MpO1xuICAgIH1cbiAgICBkZWJ1ZyguLi5hcmdzKSB7XG4gICAgICAgIHRoaXMubGV2ZWwgPD0gZXhwb3J0cy5Mb2dMZXZlbC5ERUJVRyAmJiB0aGlzLmxvZyhcIkRFQlVHXCIsIGFyZ3MpO1xuICAgIH1cbiAgICBpbmZvKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy5sZXZlbCA8PSBleHBvcnRzLkxvZ0xldmVsLklORk8gJiYgdGhpcy5sb2coXCJJTkZPXCIsIGFyZ3MpO1xuICAgIH1cbiAgICB3YXJuKC4uLmFyZ3MpIHtcbiAgICAgICAgdGhpcy5sZXZlbCA8PSBleHBvcnRzLkxvZ0xldmVsLldBUk4gJiYgdGhpcy5sb2coXCJXQVJOXCIsIGFyZ3MpO1xuICAgIH1cbiAgICBzZXZlcmUoLi4uYXJncykge1xuICAgICAgICB0aGlzLmxldmVsIDw9IGV4cG9ydHMuTG9nTGV2ZWwuU0VWRVJFICYmIHRoaXMubG9nKFwiU0VWRVJFXCIsIGFyZ3MpO1xuICAgIH1cbiAgICBsb2cobGV2ZWwsIGFyZ3MpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFske2xldmVsfV0gJHt0aGlzLmlkfTpgLCAuLi5hcmdzKTtcbiAgICB9XG59XG5cbmNvbnN0IG1peGluID0gKGJlaGF2aW91ciwgc2hhcmVkQmVoYXZpb3VyID0ge30pID0+IHtcbiAgICBjb25zdCBpbnN0YW5jZUtleXMgPSBSZWZsZWN0Lm93bktleXMoYmVoYXZpb3VyKTtcbiAgICBjb25zdCBzaGFyZWRLZXlzID0gUmVmbGVjdC5vd25LZXlzKHNoYXJlZEJlaGF2aW91cik7XG4gICAgY29uc3QgdHlwZVRhZyA9IFN5bWJvbChcImlzYVwiKTtcbiAgICBmdW5jdGlvbiBfbWl4aW4oY2xhenopIHtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGluc3RhbmNlS2V5cykge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGNsYXp6LnByb3RvdHlwZSwga2V5KTtcbiAgICAgICAgICAgIGlmICghZXhpc3RpbmcgfHwgZXhpc3RpbmcuY29uZmlndXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNsYXp6LnByb3RvdHlwZSwga2V5LCB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBiZWhhdmlvdXJba2V5XSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgbm90IHBhdGNoaW5nOiAke2NsYXp6Lm5hbWV9LiR7a2V5LnRvU3RyaW5nKCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNsYXp6LnByb3RvdHlwZSwgdHlwZVRhZywgeyB2YWx1ZTogdHJ1ZSB9KTtcbiAgICAgICAgcmV0dXJuIGNsYXp6O1xuICAgIH1cbiAgICBmb3IgKGxldCBrZXkgb2Ygc2hhcmVkS2V5cykge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoX21peGluLCBrZXksIHtcbiAgICAgICAgICAgIHZhbHVlOiBzaGFyZWRCZWhhdmlvdXJba2V5XSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHNoYXJlZEJlaGF2aW91ci5wcm9wZXJ0eUlzRW51bWVyYWJsZShrZXkpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF9taXhpbiwgU3ltYm9sLmhhc0luc3RhbmNlLCB7XG4gICAgICAgIHZhbHVlOiAoeCkgPT4gISF4W3R5cGVUYWddLFxuICAgIH0pO1xuICAgIHJldHVybiBfbWl4aW47XG59O1xuXG5jb25zdCBjb25maWd1cmFibGUgPSAoc3RhdGUpID0+IGZ1bmN0aW9uIChfLCBfXywgZGVzY3JpcHRvcikge1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gc3RhdGU7XG59O1xuXG5jb25zdCBkZXByZWNhdGVkID0gKG1zZywgbG9nID0gY29uc29sZS5sb2cpID0+IGZ1bmN0aW9uICh0YXJnZXQsIHByb3AsIGRlc2NyaXB0b3IpIHtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBgJHt0YXJnZXQuY29uc3RydWN0b3IubmFtZX0jJHtwcm9wLnRvU3RyaW5nKCl9YDtcbiAgICBjb25zdCBmbiA9IGRlc2NyaXB0b3IudmFsdWU7XG4gICAgYXNzZXJ0KHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiLCBgJHtzaWduYXR1cmV9IGlzIG5vdCBhIGZ1bmN0aW9uYCk7XG4gICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbG9nKGBERVBSRUNBVEVEICR7c2lnbmF0dXJlfTogJHttc2cgfHwgXCJ3aWxsIGJlIHJlbW92ZWQgc29vblwifWApO1xuICAgICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIHJldHVybiBkZXNjcmlwdG9yO1xufTtcblxuY29uc3Qgbm9taXhpbiA9IChfLCBfXywgZGVzY3JpcHRvcikgPT4ge1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gZmFsc2U7XG59O1xuXG5jb25zdCBzZWFsZWQgPSAoY29uc3RydWN0b3IpID0+IHtcbiAgICBPYmplY3Quc2VhbChjb25zdHJ1Y3Rvcik7XG4gICAgT2JqZWN0LnNlYWwoY29uc3RydWN0b3IucHJvdG90eXBlKTtcbn07XG5cbmNvbnN0IElFbmFibGVNaXhpbiA9IG1peGluKHtcbiAgICBfZW5hYmxlZDogdHJ1ZSxcbiAgICBpc0VuYWJsZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbmFibGVkO1xuICAgIH0sXG4gICAgZW5hYmxlKCkge1xuICAgICAgICAkZW5hYmxlKHRoaXMsIHRydWUsIEVWRU5UX0VOQUJMRSk7XG4gICAgfSxcbiAgICBkaXNhYmxlKCkge1xuICAgICAgICAkZW5hYmxlKHRoaXMsIGZhbHNlLCBFVkVOVF9ESVNBQkxFKTtcbiAgICB9LFxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgdGhpcy5fZW5hYmxlZCA/IHRoaXMuZGlzYWJsZSgpIDogdGhpcy5lbmFibGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfSxcbn0pO1xuY29uc3QgJGVuYWJsZSA9ICh0YXJnZXQsIHN0YXRlLCBpZCkgPT4ge1xuICAgIHRhcmdldC5fZW5hYmxlZCA9IHN0YXRlO1xuICAgIGlmICh0YXJnZXQubm90aWZ5KSB7XG4gICAgICAgIHRhcmdldC5ub3RpZnkoeyBpZCwgdGFyZ2V0IH0pO1xuICAgIH1cbn07XG5cbmNvbnN0IGlub3RpZnlfZGlzcGF0Y2ggPSAobGlzdGVuZXJzLCBlKSA9PiB7XG4gICAgaWYgKCFsaXN0ZW5lcnMpXG4gICAgICAgIHJldHVybjtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGxpc3RlbmVycy5sZW5ndGgsIGw7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgbCA9IGxpc3RlbmVyc1tpXTtcbiAgICAgICAgbFswXS5jYWxsKGxbMV0sIGUpO1xuICAgICAgICBpZiAoZS5jYW5jZWxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufTtcbmNvbnN0IElOb3RpZnlNaXhpbiA9IG1peGluKHtcbiAgICBhZGRMaXN0ZW5lcihpZCwgZm4sIHNjb3BlKSB7XG4gICAgICAgIGxldCBsID0gKHRoaXMuX2xpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycyB8fCB7fSlbaWRdO1xuICAgICAgICAhbCAmJiAobCA9IHRoaXMuX2xpc3RlbmVyc1tpZF0gPSBbXSk7XG4gICAgICAgIGlmICh0aGlzLl9fbGlzdGVuZXIobCwgZm4sIHNjb3BlKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGwucHVzaChbZm4sIHNjb3BlXSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcihpZCwgZm4sIHNjb3BlKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcnM7XG4gICAgICAgIGlmICghKGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGNvbnN0IGwgPSBsaXN0ZW5lcnNbaWRdO1xuICAgICAgICBpZiAobCkge1xuICAgICAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5fX2xpc3RlbmVyKGwsIGZuLCBzY29wZSk7XG4gICAgICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGwuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgICAgICAgICAgIWwubGVuZ3RoICYmIGRlbGV0ZSBsaXN0ZW5lcnNbaWRdO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIG5vdGlmeShlKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcnM7XG4gICAgICAgIGlmICghKGxpc3RlbmVycyA9IHRoaXMuX2xpc3RlbmVycykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGUudGFyZ2V0ID09PSB1bmRlZmluZWQgJiYgKGUudGFyZ2V0ID0gdGhpcyk7XG4gICAgICAgIGlub3RpZnlfZGlzcGF0Y2gobGlzdGVuZXJzW2UuaWRdLCBlKTtcbiAgICAgICAgaW5vdGlmeV9kaXNwYXRjaChsaXN0ZW5lcnNbRVZFTlRfQUxMXSwgZSk7XG4gICAgfSxcbiAgICBfX2xpc3RlbmVyKGxpc3RlbmVycywgZiwgc2NvcGUpIHtcbiAgICAgICAgbGV0IGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoLS1pID49IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGwgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICBpZiAobFswXSA9PT0gZiAmJiBsWzFdID09PSBzY29wZSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpO1xuICAgIH0sXG59KTtcblxuY29uc3QgaXRlcmFibGUgPSAocHJvcCkgPT4gbWl4aW4oe1xuICAgICpbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICAgICAgeWllbGQqIHRoaXNbcHJvcF07XG4gICAgfSxcbn0pO1xuXG5jb25zdCBJV2F0Y2hNaXhpbiA9IG1peGluKHtcbiAgICBhZGRXYXRjaChpZCwgZm4pIHtcbiAgICAgICAgdGhpcy5fd2F0Y2hlcyA9IHRoaXMuX3dhdGNoZXMgfHwge307XG4gICAgICAgIGlmICh0aGlzLl93YXRjaGVzW2lkXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3dhdGNoZXNbaWRdID0gZm47XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgcmVtb3ZlV2F0Y2goaWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLl93YXRjaGVzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodGhpcy5fd2F0Y2hlc1tpZF0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl93YXRjaGVzW2lkXTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIG5vdGlmeVdhdGNoZXMob2xkU3RhdGUsIG5ld1N0YXRlKSB7XG4gICAgICAgIGlmICghdGhpcy5fd2F0Y2hlcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgdyA9IHRoaXMuX3dhdGNoZXM7XG4gICAgICAgIGZvciAobGV0IGlkIGluIHcpIHtcbiAgICAgICAgICAgIHdbaWRdKGlkLCBvbGRTdGF0ZSwgbmV3U3RhdGUpO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuXG5leHBvcnRzLkNvbnNvbGVMb2dnZXIgPSBDb25zb2xlTG9nZ2VyO1xuZXhwb3J0cy5ERUZBVUxUX0VQUyA9IERFRkFVTFRfRVBTO1xuZXhwb3J0cy5FVkVOVF9BTEwgPSBFVkVOVF9BTEw7XG5leHBvcnRzLkVWRU5UX0RJU0FCTEUgPSBFVkVOVF9ESVNBQkxFO1xuZXhwb3J0cy5FVkVOVF9FTkFCTEUgPSBFVkVOVF9FTkFCTEU7XG5leHBvcnRzLkZMT0FUX0FSUkFZX0NUT1JTID0gRkxPQVRfQVJSQVlfQ1RPUlM7XG5leHBvcnRzLkdMMlRZUEUgPSBHTDJUWVBFO1xuZXhwb3J0cy5JRW5hYmxlTWl4aW4gPSBJRW5hYmxlTWl4aW47XG5leHBvcnRzLklOVF9BUlJBWV9DVE9SUyA9IElOVF9BUlJBWV9DVE9SUztcbmV4cG9ydHMuSU5vdGlmeU1peGluID0gSU5vdGlmeU1peGluO1xuZXhwb3J0cy5JV2F0Y2hNaXhpbiA9IElXYXRjaE1peGluO1xuZXhwb3J0cy5OT19PUCA9IE5PX09QO1xuZXhwb3J0cy5OVUxMX0xPR0dFUiA9IE5VTExfTE9HR0VSO1xuZXhwb3J0cy5TRU1BUEhPUkUgPSBTRU1BUEhPUkU7XG5leHBvcnRzLlNJWkVPRiA9IFNJWkVPRjtcbmV4cG9ydHMuVFlQRTJHTCA9IFRZUEUyR0w7XG5leHBvcnRzLlRZUEVEQVJSQVlfQ1RPUlMgPSBUWVBFREFSUkFZX0NUT1JTO1xuZXhwb3J0cy5VSU5UX0FSUkFZX0NUT1JTID0gVUlOVF9BUlJBWV9DVE9SUztcbmV4cG9ydHMuYXNHTFR5cGUgPSBhc0dMVHlwZTtcbmV4cG9ydHMuYXNOYXRpdmVUeXBlID0gYXNOYXRpdmVUeXBlO1xuZXhwb3J0cy5hc3NlcnQgPSBhc3NlcnQ7XG5leHBvcnRzLmNvbmZpZ3VyYWJsZSA9IGNvbmZpZ3VyYWJsZTtcbmV4cG9ydHMuZGVwcmVjYXRlZCA9IGRlcHJlY2F0ZWQ7XG5leHBvcnRzLmRlcmVmID0gZGVyZWY7XG5leHBvcnRzLmV4cG9zZUdsb2JhbCA9IGV4cG9zZUdsb2JhbDtcbmV4cG9ydHMuaW5vdGlmeV9kaXNwYXRjaCA9IGlub3RpZnlfZGlzcGF0Y2g7XG5leHBvcnRzLmludFR5cGVGb3JCaXRzID0gaW50VHlwZUZvckJpdHM7XG5leHBvcnRzLmludFR5cGVGb3JTaXplID0gaW50VHlwZUZvclNpemU7XG5leHBvcnRzLmlzRGVyZWYgPSBpc0RlcmVmO1xuZXhwb3J0cy5pdGVyYWJsZSA9IGl0ZXJhYmxlO1xuZXhwb3J0cy5taXhpbiA9IG1peGluO1xuZXhwb3J0cy5ub21peGluID0gbm9taXhpbjtcbmV4cG9ydHMuc2VhbGVkID0gc2VhbGVkO1xuZXhwb3J0cy5zaXplT2YgPSBzaXplT2Y7XG5leHBvcnRzLnR5cGVkQXJyYXkgPSB0eXBlZEFycmF5O1xuZXhwb3J0cy50eXBlZEFycmF5VHlwZSA9IHR5cGVkQXJyYXlUeXBlO1xuZXhwb3J0cy51aW50VHlwZUZvckJpdHMgPSB1aW50VHlwZUZvckJpdHM7XG5leHBvcnRzLnVpbnRUeXBlRm9yU2l6ZSA9IHVpbnRUeXBlRm9yU2l6ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIGNvbXBhcmUgPSByZXF1aXJlKCdAdGhpLm5nL2NvbXBhcmUnKTtcbnZhciBlcXVpdiA9IHJlcXVpcmUoJ0B0aGkubmcvZXF1aXYnKTtcbnZhciBjaGVja3MgPSByZXF1aXJlKCdAdGhpLm5nL2NoZWNrcycpO1xudmFyIGVycm9ycyA9IHJlcXVpcmUoJ0B0aGkubmcvZXJyb3JzJyk7XG52YXIgYXBpID0gcmVxdWlyZSgnQHRoaS5uZy9hcGknKTtcbnZhciByYW5kb20gPSByZXF1aXJlKCdAdGhpLm5nL3JhbmRvbScpO1xuXG5jb25zdCBiaW5hcnlTZWFyY2ggPSAoYnVmLCB4LCBrZXkgPSAoeCkgPT4geCwgY21wID0gY29tcGFyZS5jb21wYXJlLCBsb3cgPSAwLCBoaWdoID0gYnVmLmxlbmd0aCAtIDEpID0+IHtcbiAgICBjb25zdCBreCA9IGtleSh4KTtcbiAgICB3aGlsZSAobG93IDw9IGhpZ2gpIHtcbiAgICAgICAgY29uc3QgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgICBjb25zdCBjID0gY21wKGtleShidWZbbWlkXSksIGt4KTtcbiAgICAgICAgaWYgKGMgPCAwKSB7XG4gICAgICAgICAgICBsb3cgPSBtaWQgKyAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPiAwKSB7XG4gICAgICAgICAgICBoaWdoID0gbWlkIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC1sb3cgLSAxO1xufTtcbmNvbnN0IGJpbmFyeVNlYXJjaE51bWVyaWMgPSAoYnVmLCB4LCBjbXAgPSBjb21wYXJlLmNvbXBhcmVOdW1Bc2MsIGxvdyA9IDAsIGhpZ2ggPSBidWYubGVuZ3RoIC0gMSkgPT4ge1xuICAgIHdoaWxlIChsb3cgPD0gaGlnaCkge1xuICAgICAgICBjb25zdCBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICAgIGNvbnN0IGMgPSBjbXAoYnVmW21pZF0sIHgpO1xuICAgICAgICBpZiAoYyA8IDApIHtcbiAgICAgICAgICAgIGxvdyA9IG1pZCArIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA+IDApIHtcbiAgICAgICAgICAgIGhpZ2ggPSBtaWQgLSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1pZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLWxvdyAtIDE7XG59O1xuY29uc3QgYmluYXJ5U2VhcmNoMiA9IChidWYsIHgpID0+IHtcbiAgICBsZXQgaWR4ID0gYnVmWzFdIDw9IHggPyAxIDogMDtcbiAgICByZXR1cm4gYnVmW2lkeF0gPT09IHggPyBpZHggOiBidWZbMF0gPCB4ID8gLWlkeCAtIDIgOiAtMTtcbn07XG5jb25zdCBiaW5hcnlTZWFyY2g0ID0gKGJ1ZiwgeCkgPT4ge1xuICAgIGxldCBpZHggPSBidWZbMl0gPD0geCA/IDIgOiAwO1xuICAgIGlkeCB8PSBidWZbaWR4ICsgMV0gPD0geCA/IDEgOiAwO1xuICAgIHJldHVybiBidWZbaWR4XSA9PT0geCA/IGlkeCA6IGJ1ZlswXSA8IHggPyAtaWR4IC0gMiA6IC0xO1xufTtcbmNvbnN0IGJpbmFyeVNlYXJjaDggPSAoYnVmLCB4KSA9PiB7XG4gICAgbGV0IGlkeCA9IGJ1Zls0XSA8PSB4ID8gNCA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAyXSA8PSB4ID8gMiA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAxXSA8PSB4ID8gMSA6IDA7XG4gICAgcmV0dXJuIGJ1ZltpZHhdID09PSB4ID8gaWR4IDogYnVmWzBdIDwgeCA/IC1pZHggLSAyIDogLTE7XG59O1xuY29uc3QgYmluYXJ5U2VhcmNoMTYgPSAoYnVmLCB4KSA9PiB7XG4gICAgbGV0IGlkeCA9IGJ1Zls4XSA8PSB4ID8gOCA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyA0XSA8PSB4ID8gNCA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAyXSA8PSB4ID8gMiA6IDA7XG4gICAgaWR4IHw9IGJ1ZltpZHggKyAxXSA8PSB4ID8gMSA6IDA7XG4gICAgcmV0dXJuIGJ1ZltpZHhdID09PSB4ID8gaWR4IDogYnVmWzBdIDwgeCA/IC1pZHggLSAyIDogLTE7XG59O1xuY29uc3QgYmluYXJ5U2VhcmNoMzIgPSAoYnVmLCB4KSA9PiB7XG4gICAgbGV0IGlkeCA9IGJ1ZlsxNl0gPD0geCA/IDE2IDogMDtcbiAgICBpZHggfD0gYnVmW2lkeCArIDRdIDw9IHggPyA4IDogMDtcbiAgICBpZHggfD0gYnVmW2lkeCArIDRdIDw9IHggPyA0IDogMDtcbiAgICBpZHggfD0gYnVmW2lkeCArIDJdIDw9IHggPyAyIDogMDtcbiAgICBpZHggfD0gYnVmW2lkeCArIDFdIDw9IHggPyAxIDogMDtcbiAgICByZXR1cm4gYnVmW2lkeF0gPT09IHggPyBpZHggOiBidWZbMF0gPCB4ID8gLWlkeCAtIDIgOiAtMTtcbn07XG5jb25zdCBic0xUID0gKGkpID0+IChpIDwgMCA/IC1pIC0gMiA6IGkgLSAxKTtcbmNvbnN0IGJzTEUgPSAoaSkgPT4gKGkgPCAwID8gLWkgLSAyIDogaSk7XG5jb25zdCBic0dUID0gKGksIG4pID0+ICgoaSA9IGkgPCAwID8gLWkgLSAxIDogaSArIDEpLCBpIDwgbiA/IGkgOiAtMSk7XG5jb25zdCBic0dFID0gKGksIG4pID0+ICgoaSA9IGkgPCAwID8gLWkgLSAxIDogaSksIGkgPCBuID8gaSA6IC0xKTtcbmNvbnN0IGJzRVEgPSAoaSkgPT4gKGkgPCAwID8gLTEgOiBpKTtcblxuY29uc3QgYmlzZWN0ID0gKHNyYywgaSA9IHNyYy5sZW5ndGggPj4+IDEpID0+IFtcbiAgICBzcmMuc2xpY2UoMCwgaSksXG4gICAgc3JjLnNsaWNlKGkpLFxuXTtcbmNvbnN0IGJpc2VjdFdpdGggPSAoc3JjLCBwcmVkKSA9PiB7XG4gICAgY29uc3QgaSA9IHNyYy5maW5kSW5kZXgocHJlZCk7XG4gICAgcmV0dXJuIGkgPj0gMCA/IGJpc2VjdChzcmMsIGkpIDogW3NyYywgW11dO1xufTtcblxuY29uc3QgZW5kc1dpdGggPSAoYnVmLCBuZWVkbGUsIGVxdWl2JDEgPSBlcXVpdi5lcXVpdikgPT4ge1xuICAgIGxldCBpID0gYnVmLmxlbmd0aDtcbiAgICBsZXQgaiA9IG5lZWRsZS5sZW5ndGg7XG4gICAgaWYgKGkgPCBqKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgd2hpbGUgKCgtLWksIC0taiA+PSAwICYmIGVxdWl2JDEoYnVmW2ldLCBuZWVkbGVbal0pKSkgeyB9XG4gICAgcmV0dXJuIGogPCAwO1xufTtcblxuY29uc3QgZW5zdXJlSXRlcmFibGUgPSAoeCkgPT4ge1xuICAgICh4ID09IG51bGwgfHwgIXhbU3ltYm9sLml0ZXJhdG9yXSkgJiZcbiAgICAgICAgZXJyb3JzLmlsbGVnYWxBcmdzKGB2YWx1ZSBpcyBub3QgaXRlcmFibGU6ICR7eH1gKTtcbiAgICByZXR1cm4geDtcbn07XG5cbmNvbnN0IGVuc3VyZUFycmF5ID0gKHgpID0+IGNoZWNrcy5pc0FycmF5KHgpID8geCA6IFsuLi5lbnN1cmVJdGVyYWJsZSh4KV07XG5jb25zdCBlbnN1cmVBcnJheUxpa2UgPSAoeCkgPT4gY2hlY2tzLmlzQXJyYXlMaWtlKHgpID8geCA6IFsuLi5lbnN1cmVJdGVyYWJsZSh4KV07XG5cbmNvbnN0IGZpbmQgPSAoYnVmLCB4LCBlcXVpdiQxID0gZXF1aXYuZXF1aXYpID0+IHtcbiAgICBjb25zdCBpID0gZmluZEluZGV4KGJ1ZiwgeCwgZXF1aXYkMSk7XG4gICAgcmV0dXJuIGkgIT09IC0xID8gYnVmW2ldIDogdW5kZWZpbmVkO1xufTtcbmNvbnN0IGZpbmRJbmRleCA9IChidWYsIHgsIGVxdWl2JDEgPSBlcXVpdi5lcXVpdikgPT4ge1xuICAgIGZvciAobGV0IGkgPSBidWYubGVuZ3RoOyAtLWkgPj0gMDspIHtcbiAgICAgICAgaWYgKGVxdWl2JDEoeCwgYnVmW2ldKSlcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG59O1xuXG5jb25zdCBmaWxsUmFuZ2UgPSAoYnVmLCBpbmRleCA9IDAsIHN0YXJ0ID0gMCwgZW5kID0gYnVmLmxlbmd0aCwgc3RlcCA9IGVuZCA+IHN0YXJ0ID8gMSA6IC0xKSA9PiB7XG4gICAgaWYgKHN0ZXAgPiAwKSB7XG4gICAgICAgIGZvciAoOyBzdGFydCA8IGVuZDsgc3RhcnQgKz0gc3RlcClcbiAgICAgICAgICAgIGJ1ZltpbmRleCsrXSA9IHN0YXJ0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm9yICg7IHN0YXJ0ID4gZW5kOyBzdGFydCArPSBzdGVwKVxuICAgICAgICAgICAgYnVmW2luZGV4KytdID0gc3RhcnQ7XG4gICAgfVxuICAgIHJldHVybiBidWY7XG59O1xuXG5jb25zdCBmdXp6eU1hdGNoID0gKGRvbWFpbiwgcXVlcnksIGVxdWl2JDEgPSBlcXVpdi5lcXVpdikgPT4ge1xuICAgIGNvbnN0IG5kID0gZG9tYWluLmxlbmd0aDtcbiAgICBjb25zdCBucSA9IHF1ZXJ5Lmxlbmd0aDtcbiAgICBpZiAobnEgPiBuZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChucSA9PT0gbmQpIHtcbiAgICAgICAgcmV0dXJuIGVxdWl2JDEocXVlcnksIGRvbWFpbik7XG4gICAgfVxuICAgIG5leHQ6IGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IG5xOyBpKyspIHtcbiAgICAgICAgY29uc3QgcSA9IHF1ZXJ5W2ldO1xuICAgICAgICB3aGlsZSAoaiA8IG5kKSB7XG4gICAgICAgICAgICBpZiAoZXF1aXYkMShkb21haW5baisrXSwgcSkpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZSBuZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5jb25zdCBpc1NvcnRlZCA9IChhcnIsIGNtcCA9IGNvbXBhcmUuY29tcGFyZSwgc3RhcnQgPSAwLCBlbmQgPSBhcnIubGVuZ3RoKSA9PiB7XG4gICAgbGV0IHByZXYgPSBhcnJbc3RhcnRdO1xuICAgIHdoaWxlICgrK3N0YXJ0IDwgZW5kKSB7XG4gICAgICAgIGNvbnN0IGN1cnIgPSBhcnJbc3RhcnRdO1xuICAgICAgICBpZiAoY21wKHByZXYsIGN1cnIpID4gMClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcHJldiA9IGN1cnI7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuY29uc3QgaW5zZXJ0ID0gKGJ1ZiwgeCwgaSwgayA9IEluZmluaXR5KSA9PiBpIDwgMCB8fCBpID49IGsgfHwgayA8IDEgPyBidWYgOiBpbnNlcnRVbnNhZmUoYnVmLCB4LCBpLCBrKTtcbmNvbnN0IGluc2VydFVuc2FmZSA9IChidWYsIHgsIGksIGsgPSBJbmZpbml0eSkgPT4ge1xuICAgIGxldCBqID0gYnVmLmxlbmd0aCA8IGsgPyBidWYubGVuZ3RoICsgMSA6IGs7XG4gICAgZm9yICg7IC0taiA+IGk7KVxuICAgICAgICBidWZbal0gPSBidWZbaiAtIDFdO1xuICAgIGJ1ZltpXSA9IHg7XG4gICAgcmV0dXJuIGJ1Zjtcbn07XG5cbmNvbnN0IGludG8gPSAoZGVzdCwgc3JjLCBtYXggPSBJbmZpbml0eSkgPT4ge1xuICAgIGZvciAobGV0IHggb2Ygc3JjKSB7XG4gICAgICAgIGlmICgtLW1heCA8IDApXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVzdC5wdXNoKHgpO1xuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbmZ1bmN0aW9uKiBhcnJheUl0ZXJhdG9yKGJ1Ziwgc3RhcnQgPSAwLCBlbmQpIHtcbiAgICBpZiAoIWJ1ZilcbiAgICAgICAgcmV0dXJuO1xuICAgIHN0YXJ0ID0gc3RhcnQ7XG4gICAgZW5kID09PSB1bmRlZmluZWQgJiYgKGVuZCA9IGJ1Zi5sZW5ndGgpO1xuICAgIGNvbnN0IHN0ZXAgPSBzdGFydCA8PSBlbmQgPyAxIDogLTE7XG4gICAgZm9yICg7IHN0YXJ0ICE9PSBlbmQ7IHN0YXJ0ICs9IHN0ZXApIHtcbiAgICAgICAgeWllbGQgYnVmW3N0YXJ0XTtcbiAgICB9XG59XG5cbmNvbnN0IGVxU3RyaWN0ID0gKGEsIGIpID0+IGEgPT09IGI7XG5jb25zdCBsZXZlbnNodGVpbiA9IChhLCBiLCBtYXhEaXN0ID0gSW5maW5pdHksIGVxdWl2ID0gZXFTdHJpY3QpID0+IHtcbiAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgaWYgKGEubGVuZ3RoID4gYi5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgdG1wID0gYTtcbiAgICAgICAgYSA9IGI7XG4gICAgICAgIGIgPSB0bXA7XG4gICAgfVxuICAgIGxldCBsYSA9IGEubGVuZ3RoO1xuICAgIGxldCBsYiA9IGIubGVuZ3RoO1xuICAgIHdoaWxlIChsYSA+IDAgJiYgZXF1aXYoYVt+LWxhXSwgYlt+LWxiXSkpIHtcbiAgICAgICAgbGEtLTtcbiAgICAgICAgbGItLTtcbiAgICB9XG4gICAgbGV0IG9mZnNldCA9IDA7XG4gICAgd2hpbGUgKG9mZnNldCA8IGxhICYmIGVxdWl2KGFbb2Zmc2V0XSwgYltvZmZzZXRdKSkge1xuICAgICAgICBvZmZzZXQrKztcbiAgICB9XG4gICAgbGEgLT0gb2Zmc2V0O1xuICAgIGxiIC09IG9mZnNldDtcbiAgICBpZiAobGEgPT09IDAgfHwgbGIgPCAzKSB7XG4gICAgICAgIHJldHVybiBsYjtcbiAgICB9XG4gICAgbGV0IHggPSAwO1xuICAgIGxldCB5O1xuICAgIGxldCBtaW5EaXN0O1xuICAgIGxldCBkMDtcbiAgICBsZXQgZDE7XG4gICAgbGV0IGQyO1xuICAgIGxldCBkMztcbiAgICBsZXQgZGQ7XG4gICAgbGV0IGR5O1xuICAgIGxldCBheTtcbiAgICBsZXQgYngwO1xuICAgIGxldCBieDE7XG4gICAgbGV0IGJ4MjtcbiAgICBsZXQgYngzO1xuICAgIGNvbnN0IF9taW4gPSAoZDAsIGQxLCBkMiwgYngsIGF5KSA9PiB7XG4gICAgICAgIHJldHVybiBkMCA8IGQxIHx8IGQyIDwgZDFcbiAgICAgICAgICAgID8gZDAgPiBkMlxuICAgICAgICAgICAgICAgID8gZDIgKyAxXG4gICAgICAgICAgICAgICAgOiBkMCArIDFcbiAgICAgICAgICAgIDogZXF1aXYoYXksIGJ4KVxuICAgICAgICAgICAgICAgID8gZDFcbiAgICAgICAgICAgICAgICA6IGQxICsgMTtcbiAgICB9O1xuICAgIGNvbnN0IHZlY3RvciA9IFtdO1xuICAgIGZvciAoeSA9IDA7IHkgPCBsYTsgeSsrKSB7XG4gICAgICAgIHZlY3Rvci5wdXNoKHkgKyAxLCBhW29mZnNldCArIHldKTtcbiAgICB9XG4gICAgY29uc3QgbGVuID0gdmVjdG9yLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgbGIzID0gbGIgLSAzO1xuICAgIGZvciAoOyB4IDwgbGIzOykge1xuICAgICAgICBieDAgPSBiW29mZnNldCArIChkMCA9IHgpXTtcbiAgICAgICAgYngxID0gYltvZmZzZXQgKyAoZDEgPSB4ICsgMSldO1xuICAgICAgICBieDIgPSBiW29mZnNldCArIChkMiA9IHggKyAyKV07XG4gICAgICAgIGJ4MyA9IGJbb2Zmc2V0ICsgKGQzID0geCArIDMpXTtcbiAgICAgICAgZGQgPSB4ICs9IDQ7XG4gICAgICAgIG1pbkRpc3QgPSBJbmZpbml0eTtcbiAgICAgICAgZm9yICh5ID0gMDsgeSA8IGxlbjsgeSArPSAyKSB7XG4gICAgICAgICAgICBkeSA9IHZlY3Rvclt5XTtcbiAgICAgICAgICAgIGF5ID0gdmVjdG9yW3kgKyAxXTtcbiAgICAgICAgICAgIGQwID0gX21pbihkeSwgZDAsIGQxLCBieDAsIGF5KTtcbiAgICAgICAgICAgIGQxID0gX21pbihkMCwgZDEsIGQyLCBieDEsIGF5KTtcbiAgICAgICAgICAgIGQyID0gX21pbihkMSwgZDIsIGQzLCBieDIsIGF5KTtcbiAgICAgICAgICAgIGRkID0gX21pbihkMiwgZDMsIGRkLCBieDMsIGF5KTtcbiAgICAgICAgICAgIGRkIDwgbWluRGlzdCAmJiAobWluRGlzdCA9IGRkKTtcbiAgICAgICAgICAgIHZlY3Rvclt5XSA9IGRkO1xuICAgICAgICAgICAgZDMgPSBkMjtcbiAgICAgICAgICAgIGQyID0gZDE7XG4gICAgICAgICAgICBkMSA9IGQwO1xuICAgICAgICAgICAgZDAgPSBkeTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWluRGlzdCA+IG1heERpc3QpXG4gICAgICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgfVxuICAgIGZvciAoOyB4IDwgbGI7KSB7XG4gICAgICAgIGJ4MCA9IGJbb2Zmc2V0ICsgKGQwID0geCldO1xuICAgICAgICBkZCA9ICsreDtcbiAgICAgICAgbWluRGlzdCA9IEluZmluaXR5O1xuICAgICAgICBmb3IgKHkgPSAwOyB5IDwgbGVuOyB5ICs9IDIpIHtcbiAgICAgICAgICAgIGR5ID0gdmVjdG9yW3ldO1xuICAgICAgICAgICAgdmVjdG9yW3ldID0gZGQgPSBfbWluKGR5LCBkMCwgZGQsIGJ4MCwgdmVjdG9yW3kgKyAxXSk7XG4gICAgICAgICAgICBkZCA8IG1pbkRpc3QgJiYgKG1pbkRpc3QgPSBkZCk7XG4gICAgICAgICAgICBkMCA9IGR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW5EaXN0ID4gbWF4RGlzdClcbiAgICAgICAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICB9XG4gICAgcmV0dXJuIGRkO1xufTtcbmNvbnN0IG5vcm1hbGl6ZWRMZXZlbnNodGVpbiA9IChhLCBiLCBtYXhEaXN0ID0gSW5maW5pdHksIGVxdWl2ID0gZXFTdHJpY3QpID0+IHtcbiAgICBjb25zdCBuID0gTWF0aC5tYXgoYS5sZW5ndGgsIGIubGVuZ3RoKTtcbiAgICByZXR1cm4gbiA+IDAgPyBsZXZlbnNodGVpbihhLCBiLCBtYXhEaXN0LCBlcXVpdikgLyBuIDogMDtcbn07XG5cbmNvbnN0IGZpcnN0ID0gKGJ1ZikgPT4gYnVmWzBdO1xuY29uc3QgcGVlayA9IChidWYpID0+IGJ1ZltidWYubGVuZ3RoIC0gMV07XG5cbmNvbnN0IHN3YXAgPSAoYXJyLCB4LCB5KSA9PiB7XG4gICAgY29uc3QgdCA9IGFyclt4XTtcbiAgICBhcnJbeF0gPSBhcnJbeV07XG4gICAgYXJyW3ldID0gdDtcbn07XG5jb25zdCBtdWx0aVN3YXAgPSAoLi4ueHMpID0+IHtcbiAgICBjb25zdCBbYiwgYywgZF0gPSB4cztcbiAgICBjb25zdCBuID0geHMubGVuZ3RoO1xuICAgIHN3aXRjaCAobikge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gc3dhcDtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIChhLCB4LCB5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dhcChhLCB4LCB5KTtcbiAgICAgICAgICAgICAgICBzd2FwKGIsIHgsIHkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIChhLCB4LCB5KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dhcChhLCB4LCB5KTtcbiAgICAgICAgICAgICAgICBzd2FwKGIsIHgsIHkpO1xuICAgICAgICAgICAgICAgIHN3YXAoYywgeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKGEsIHgsIHkpID0+IHtcbiAgICAgICAgICAgICAgICBzd2FwKGEsIHgsIHkpO1xuICAgICAgICAgICAgICAgIHN3YXAoYiwgeCwgeSk7XG4gICAgICAgICAgICAgICAgc3dhcChjLCB4LCB5KTtcbiAgICAgICAgICAgICAgICBzd2FwKGQsIHgsIHkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAoYSwgeCwgeSkgPT4ge1xuICAgICAgICAgICAgICAgIHN3YXAoYSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IG47IC0taSA+PSAwOylcbiAgICAgICAgICAgICAgICAgICAgc3dhcCh4c1tpXSwgeCwgeSk7XG4gICAgICAgICAgICB9O1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHF1aWNrU29ydChhcnIsIF9jbXAgPSBjb21wYXJlLmNvbXBhcmUsIF9zd2FwID0gc3dhcCwgc3RhcnQgPSAwLCBlbmQgPSBhcnIubGVuZ3RoIC0gMSkge1xuICAgIGlmIChzdGFydCA8IGVuZCkge1xuICAgICAgICBjb25zdCBwaXZvdCA9IGFycltzdGFydCArICgoZW5kIC0gc3RhcnQpID4+IDEpXTtcbiAgICAgICAgbGV0IHMgPSBzdGFydCAtIDE7XG4gICAgICAgIGxldCBlID0gZW5kICsgMTtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBzKys7XG4gICAgICAgICAgICB9IHdoaWxlIChfY21wKGFycltzXSwgcGl2b3QpIDwgMCk7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgZS0tO1xuICAgICAgICAgICAgfSB3aGlsZSAoX2NtcChhcnJbZV0sIHBpdm90KSA+IDApO1xuICAgICAgICAgICAgaWYgKHMgPj0gZSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIF9zd2FwKGFyciwgcywgZSk7XG4gICAgICAgIH1cbiAgICAgICAgcXVpY2tTb3J0KGFyciwgX2NtcCwgX3N3YXAsIHN0YXJ0LCBlKTtcbiAgICAgICAgcXVpY2tTb3J0KGFyciwgX2NtcCwgX3N3YXAsIGUgKyAxLCBlbmQpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyO1xufVxuXG5jb25zdCBzaHVmZmxlUmFuZ2UgPSAoYnVmLCBzdGFydCA9IDAsIGVuZCA9IGJ1Zi5sZW5ndGgsIHJuZCA9IHJhbmRvbS5TWVNURU0pID0+IHtcbiAgICBhcGkuYXNzZXJ0KHN0YXJ0ID49IDAgJiYgZW5kID49IHN0YXJ0ICYmIGVuZCA8PSBidWYubGVuZ3RoLCBgaWxsZWdhbCByYW5nZSAke3N0YXJ0fS4uJHtlbmR9YCk7XG4gICAgbGV0IG4gPSBlbmQgLSBzdGFydDtcbiAgICBjb25zdCBsID0gbjtcbiAgICBpZiAobCA+IDEpIHtcbiAgICAgICAgd2hpbGUgKC0tbiA+PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gKHN0YXJ0ICsgcm5kLmZsb2F0KGwpKSB8IDA7XG4gICAgICAgICAgICBjb25zdCBiID0gKHN0YXJ0ICsgcm5kLmZsb2F0KGwpKSB8IDA7XG4gICAgICAgICAgICBjb25zdCB0ID0gYnVmW2FdO1xuICAgICAgICAgICAgYnVmW2FdID0gYnVmW2JdO1xuICAgICAgICAgICAgYnVmW2JdID0gdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnVmO1xufTtcbmNvbnN0IHNodWZmbGUgPSAoYnVmLCBuID0gYnVmLmxlbmd0aCwgcm5kID0gcmFuZG9tLlNZU1RFTSkgPT4gc2h1ZmZsZVJhbmdlKGJ1ZiwgMCwgbiwgcm5kKTtcblxuY29uc3Qgc29ydEJ5Q2FjaGVkS2V5ID0gKHNyYywga2V5LCBjbXAgPSBjb21wYXJlLmNvbXBhcmUpID0+IHtcbiAgICBjb25zdCBrZXlzID0gY2hlY2tzLmlzRnVuY3Rpb24oa2V5KSA/IHNyYy5tYXAoa2V5KSA6IGtleTtcbiAgICBhcGkuYXNzZXJ0KGtleXMubGVuZ3RoID09PSBzcmMubGVuZ3RoLCBga2V5cy5sZW5ndGggIT0gc3JjLmxlbmd0aGApO1xuICAgIHF1aWNrU29ydChrZXlzLCBjbXAsIG11bHRpU3dhcChzcmMpKTtcbiAgICByZXR1cm4gc3JjO1xufTtcblxuY29uc3Qgc3RhcnRzV2l0aCA9IChidWYsIG5lZWRsZSwgZXF1aXYkMSA9IGVxdWl2LmVxdWl2KSA9PiB7XG4gICAgbGV0IGkgPSBidWYubGVuZ3RoO1xuICAgIGxldCBqID0gbmVlZGxlLmxlbmd0aDtcbiAgICBpZiAoaSA8IGopXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB3aGlsZSAoLWogPj0gMCAmJiBlcXVpdiQxKGJ1ZltqXSwgbmVlZGxlW2pdKSkgeyB9XG4gICAgcmV0dXJuIGogPCAwO1xufTtcblxuY29uc3Qgc3dpenpsZSA9IChvcmRlcikgPT4ge1xuICAgIGNvbnN0IFthLCBiLCBjLCBkLCBlLCBmLCBnLCBoXSA9IG9yZGVyO1xuICAgIHN3aXRjaCAob3JkZXIubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiBbXTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbeFthXV07XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV0sIHhbYl1dO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFt4W2FdLCB4W2JdLCB4W2NdXTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbeFthXSwgeFtiXSwgeFtjXSwgeFtkXV07XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV0sIHhbYl0sIHhbY10sIHhbZF0sIHhbZV1dO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFt4W2FdLCB4W2JdLCB4W2NdLCB4W2RdLCB4W2VdLCB4W2ZdXTtcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbeFthXSwgeFtiXSwgeFtjXSwgeFtkXSwgeFtlXSwgeFtmXSwgeFtnXV07XG4gICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW3hbYV0sIHhbYl0sIHhbY10sIHhbZF0sIHhbZV0sIHhbZl0sIHhbZ10sIHhbaF1dO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IG9yZGVyLmxlbmd0aDsgLS1pID49IDA7KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1tpXSA9IHhbb3JkZXJbaV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmFycmF5SXRlcmF0b3IgPSBhcnJheUl0ZXJhdG9yO1xuZXhwb3J0cy5iaW5hcnlTZWFyY2ggPSBiaW5hcnlTZWFyY2g7XG5leHBvcnRzLmJpbmFyeVNlYXJjaDE2ID0gYmluYXJ5U2VhcmNoMTY7XG5leHBvcnRzLmJpbmFyeVNlYXJjaDIgPSBiaW5hcnlTZWFyY2gyO1xuZXhwb3J0cy5iaW5hcnlTZWFyY2gzMiA9IGJpbmFyeVNlYXJjaDMyO1xuZXhwb3J0cy5iaW5hcnlTZWFyY2g0ID0gYmluYXJ5U2VhcmNoNDtcbmV4cG9ydHMuYmluYXJ5U2VhcmNoOCA9IGJpbmFyeVNlYXJjaDg7XG5leHBvcnRzLmJpbmFyeVNlYXJjaE51bWVyaWMgPSBiaW5hcnlTZWFyY2hOdW1lcmljO1xuZXhwb3J0cy5iaXNlY3QgPSBiaXNlY3Q7XG5leHBvcnRzLmJpc2VjdFdpdGggPSBiaXNlY3RXaXRoO1xuZXhwb3J0cy5ic0VRID0gYnNFUTtcbmV4cG9ydHMuYnNHRSA9IGJzR0U7XG5leHBvcnRzLmJzR1QgPSBic0dUO1xuZXhwb3J0cy5ic0xFID0gYnNMRTtcbmV4cG9ydHMuYnNMVCA9IGJzTFQ7XG5leHBvcnRzLmVuZHNXaXRoID0gZW5kc1dpdGg7XG5leHBvcnRzLmVuc3VyZUFycmF5ID0gZW5zdXJlQXJyYXk7XG5leHBvcnRzLmVuc3VyZUFycmF5TGlrZSA9IGVuc3VyZUFycmF5TGlrZTtcbmV4cG9ydHMuZW5zdXJlSXRlcmFibGUgPSBlbnN1cmVJdGVyYWJsZTtcbmV4cG9ydHMuZmlsbFJhbmdlID0gZmlsbFJhbmdlO1xuZXhwb3J0cy5maW5kID0gZmluZDtcbmV4cG9ydHMuZmluZEluZGV4ID0gZmluZEluZGV4O1xuZXhwb3J0cy5maXJzdCA9IGZpcnN0O1xuZXhwb3J0cy5mdXp6eU1hdGNoID0gZnV6enlNYXRjaDtcbmV4cG9ydHMuaW5zZXJ0ID0gaW5zZXJ0O1xuZXhwb3J0cy5pbnNlcnRVbnNhZmUgPSBpbnNlcnRVbnNhZmU7XG5leHBvcnRzLmludG8gPSBpbnRvO1xuZXhwb3J0cy5pc1NvcnRlZCA9IGlzU29ydGVkO1xuZXhwb3J0cy5sZXZlbnNodGVpbiA9IGxldmVuc2h0ZWluO1xuZXhwb3J0cy5tdWx0aVN3YXAgPSBtdWx0aVN3YXA7XG5leHBvcnRzLm5vcm1hbGl6ZWRMZXZlbnNodGVpbiA9IG5vcm1hbGl6ZWRMZXZlbnNodGVpbjtcbmV4cG9ydHMucGVlayA9IHBlZWs7XG5leHBvcnRzLnF1aWNrU29ydCA9IHF1aWNrU29ydDtcbmV4cG9ydHMuc2h1ZmZsZSA9IHNodWZmbGU7XG5leHBvcnRzLnNodWZmbGVSYW5nZSA9IHNodWZmbGVSYW5nZTtcbmV4cG9ydHMuc29ydEJ5Q2FjaGVkS2V5ID0gc29ydEJ5Q2FjaGVkS2V5O1xuZXhwb3J0cy5zdGFydHNXaXRoID0gc3RhcnRzV2l0aDtcbmV4cG9ydHMuc3dhcCA9IHN3YXA7XG5leHBvcnRzLnN3aXp6bGUgPSBzd2l6emxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBhbGlnbiA9IChhZGRyLCBzaXplKSA9PiAoc2l6ZS0tLCAoYWRkciArIHNpemUpICYgfnNpemUpO1xuY29uc3QgaXNBbGlnbmVkID0gKGFkZHIsIHNpemUpID0+ICEoYWRkciAmIChzaXplIC0gMSkpO1xuXG5jb25zdCBGNjQgPSBuZXcgRmxvYXQ2NEFycmF5KDEpO1xuY29uc3QgRjMyID0gbmV3IEZsb2F0MzJBcnJheShGNjQuYnVmZmVyKTtcbmNvbnN0IEkzMiA9IG5ldyBJbnQzMkFycmF5KEY2NC5idWZmZXIpO1xuY29uc3QgVTMyID0gbmV3IFVpbnQzMkFycmF5KEY2NC5idWZmZXIpO1xuY29uc3QgSVNfTEUgPSAoKEY2NFswXSA9IDIpLCBVMzJbMV0gPT09IDB4NDAwMDAwMDApO1xuY29uc3QgZmxvYXRUb0ludEJpdHMgPSAoeCkgPT4gKChGMzJbMF0gPSB4KSwgSTMyWzBdKTtcbmNvbnN0IGZsb2F0VG9VaW50Qml0cyA9ICh4KSA9PiAoKEYzMlswXSA9IHgpLCBVMzJbMF0pO1xuY29uc3QgaW50Qml0c1RvRmxvYXQgPSAoeCkgPT4gKChJMzJbMF0gPSB4KSwgRjMyWzBdKTtcbmNvbnN0IHVpbnRCaXRzVG9GbG9hdCA9ICh4KSA9PiAoKFUzMlswXSA9IHgpLCBGMzJbMF0pO1xuY29uc3QgZmxvYXRUb0ludEJpdHM2NCA9ICh4KSA9PiAoKEY2NFswXSA9IHgpLCBJU19MRSA/IFtJMzJbMV0sIEkzMlswXV0gOiBbSTMyWzBdLCBJMzJbMV1dKTtcbmNvbnN0IGZsb2F0VG9VaW50Qml0czY0ID0gKHgpID0+ICgoRjY0WzBdID0geCksIElTX0xFID8gW1UzMlsxXSwgVTMyWzBdXSA6IFtVMzJbMF0sIFUzMlsxXV0pO1xuY29uc3QgaW50Qml0c1RvRmxvYXQ2NCA9IChoaSwgbG8pID0+IHtcbiAgICBJU19MRSA/ICgoSTMyWzFdID0gaGkpLCAoSTMyWzBdID0gbG8pKSA6ICgoSTMyWzBdID0gaGkpLCAoSTMyWzFdID0gbG8pKTtcbiAgICByZXR1cm4gRjY0WzBdO1xufTtcbmNvbnN0IHVpbnRCaXRzVG9GbG9hdDY0ID0gKGhpLCBsbykgPT4ge1xuICAgIElTX0xFID8gKChVMzJbMV0gPSBoaSksIChVMzJbMF0gPSBsbykpIDogKChVMzJbMF0gPSBoaSksIChVMzJbMV0gPSBsbykpO1xuICAgIHJldHVybiBGNjRbMF07XG59O1xuY29uc3QgZmxvYXRUb1NvcnRhYmxlSW50ID0gKHgpID0+IHtcbiAgICBpZiAoeCA9PT0gLTApXG4gICAgICAgIHggPSAwO1xuICAgIGNvbnN0IGkgPSBmbG9hdFRvSW50Qml0cyh4KTtcbiAgICByZXR1cm4geCA8IDAgPyB+aSB8ICgxIDw8IDMxKSA6IGk7XG59O1xuY29uc3QgY2xhbXAxMSA9ICh4KSA9PiAoeCA8IC0xID8gLTEgOiB4ID4gMSA/IDEgOiB4KTtcbmNvbnN0IGYzMnU4ID0gKHgpID0+IChjbGFtcDExKHgpICogMHg3ZikgJiAweGZmO1xuY29uc3QgZjMydTE2ID0gKHgpID0+IChjbGFtcDExKHgpICogMHg3ZmZmKSAmIDB4ZmZmZjtcbmNvbnN0IGYzMnUyNCA9ICh4KSA9PiAoY2xhbXAxMSh4KSAqIDB4N2ZmZmZmKSAmIDB4ZmZmZmZmO1xuY29uc3QgZjMydTMyID0gKHgpID0+IChjbGFtcDExKHgpICogMHg3ZmZmZmZmZikgPj4+IDA7XG5jb25zdCB1OGYzMiA9ICh4KSA9PiAoKHggJj0gMHhmZiksICh4IHwgKCh4ID4+IDcpICogMHhmZmZmZmYwMCkpIC8gMHg3Zik7XG5jb25zdCB1MTZmMzIgPSAoeCkgPT4gKCh4ICY9IDB4ZmZmZiksICh4IHwgKCh4ID4+IDE1KSAqIDB4ZmZmZjAwMDApKSAvIDB4N2ZmZik7XG5jb25zdCB1MjRmMzIgPSAoeCkgPT4gKCh4ICY9IDB4ZmZmZmZmKSwgKHggfCAoKHggPj4gMjMpICogMHhmZjAwMDAwMCkpIC8gMHg3ZmZmZmYpO1xuY29uc3QgdTMyZjMyID0gKHgpID0+ICh4IHwgMCkgLyAweDdmZmZmZmZmO1xuXG5jb25zdCBieXRlczE2ID0gKHgsIGxlID0gZmFsc2UpID0+IHtcbiAgICBjb25zdCBiMCA9IHggJiAweGZmO1xuICAgIGNvbnN0IGIxID0gKHggPj4gOCkgJiAweGZmO1xuICAgIHJldHVybiBsZSA/IFtiMCwgYjFdIDogW2IxLCBiMF07XG59O1xuY29uc3QgYnl0ZXMyNCA9ICh4LCBsZSA9IGZhbHNlKSA9PiB7XG4gICAgY29uc3QgYjAgPSB4ICYgMHhmZjtcbiAgICBjb25zdCBiMSA9ICh4ID4+IDgpICYgMHhmZjtcbiAgICBjb25zdCBiMiA9ICh4ID4+IDE2KSAmIDB4ZmY7XG4gICAgcmV0dXJuIGxlID8gW2IwLCBiMSwgYjJdIDogW2IyLCBiMSwgYjBdO1xufTtcbmNvbnN0IGJ5dGVzMzIgPSAoeCwgbGUgPSBmYWxzZSkgPT4ge1xuICAgIGNvbnN0IGIwID0geCAmIDB4ZmY7XG4gICAgY29uc3QgYjEgPSAoeCA+PiA4KSAmIDB4ZmY7XG4gICAgY29uc3QgYjIgPSAoeCA+PiAxNikgJiAweGZmO1xuICAgIGNvbnN0IGIzID0gKHggPj4gMjQpICYgMHhmZjtcbiAgICByZXR1cm4gbGUgPyBbYjAsIGIxLCBiMiwgYjNdIDogW2IzLCBiMiwgYjEsIGIwXTtcbn07XG5jb25zdCBieXRlczY0ID0gKGhpLCBsbywgbGUgPSBmYWxzZSkgPT4ge1xuICAgIHJldHVybiBsZVxuICAgICAgICA/IGJ5dGVzMzIobG8sIGxlKS5jb25jYXQoYnl0ZXMzMihoaSwgbGUpKVxuICAgICAgICA6IGJ5dGVzMzIoaGksIGxlKS5jb25jYXQoYnl0ZXMzMihsbywgbGUpKTtcbn07XG5jb25zdCBieXRlc0YzMiA9ICh4LCBsZSA9IGZhbHNlKSA9PiBieXRlczMyKGZsb2F0VG9VaW50Qml0cyh4KSwgbGUpO1xuY29uc3QgYnl0ZXNGNjQgPSAoeCwgbGUgPSBmYWxzZSkgPT5cbmJ5dGVzNjQoLi4uZmxvYXRUb1VpbnRCaXRzNjQoeCksIGxlKTtcblxuY29uc3QgZGVmQml0cyA9IChuKSA9PiBuZXcgQXJyYXkobikuZmlsbCgwKS5tYXAoKF8sIGkpID0+IDEgPDwgKG4gLSAxIC0gaSkpO1xuY29uc3QgTVNCX0JJVFM4ID0gZGVmQml0cyg4KTtcbmNvbnN0IE1TQl9CSVRTMTYgPSBkZWZCaXRzKDE2KTtcbmNvbnN0IE1TQl9CSVRTMzIgPSBkZWZCaXRzKDMyKTtcbmNvbnN0IE1BU0tTID0gbmV3IEFycmF5KDMzKS5maWxsKDApLm1hcCgoXywgaSkgPT4gTWF0aC5wb3coMiwgaSkgLSAxKTtcblxuY29uc3QgcG9wQ291bnQgPSAoeCkgPT4gKCh4ID0geCAtICgoeCA+Pj4gMSkgJiAweDU1NTU1NTU1KSksXG4gICAgKHggPSAoeCAmIDB4MzMzMzMzMzMpICsgKCh4ID4+PiAyKSAmIDB4MzMzMzMzMzMpKSxcbiAgICAoKCh4ICsgKHggPj4+IDQpKSAmIDB4ZjBmMGYwZikgKiAweDEwMTAxMDEpID4+PiAyNCk7XG5jb25zdCBoYW1taW5nRGlzdCA9ICh4LCB5KSA9PiBwb3BDb3VudCh4IF4geSk7XG5jb25zdCBjbHozMiA9ICh4KSA9PiB4ICE9PSAwID8gMzEgLSAoKE1hdGgubG9nKHggPj4+IDApIC8gTWF0aC5MTjIpIHwgMCkgOiAzMjtcbmNvbnN0IGN0ejMyID0gKHgpID0+IHtcbiAgICBsZXQgYyA9IDMyO1xuICAgIHggJj0gLXg7XG4gICAgeCAmJiBjLS07XG4gICAgeCAmIDB4MDAwMGZmZmYgJiYgKGMgLT0gMTYpO1xuICAgIHggJiAweDAwZmYwMGZmICYmIChjIC09IDgpO1xuICAgIHggJiAweDBmMGYwZjBmICYmIChjIC09IDQpO1xuICAgIHggJiAweDMzMzMzMzMzICYmIChjIC09IDIpO1xuICAgIHggJiAweDU1NTU1NTU1ICYmIChjIC09IDEpO1xuICAgIHJldHVybiBjO1xufTtcbmNvbnN0IGJpdFNpemUgPSAoeCkgPT4gKHggPiAxID8gTWF0aC5jZWlsKE1hdGgubG9nMih4KSkgOiAwKTtcblxuY29uc3QgZGVmTWFzayA9IChhLCBiKSA9PiAofk1BU0tTW2FdICYgTUFTS1NbYl0pID4+PiAwO1xuY29uc3QgbWFza0wgPSAobiwgeCkgPT4gKHggJiBNQVNLU1tuXSkgPj4+IDA7XG5jb25zdCBtYXNrSCA9IChuLCB4KSA9PiAoeCAmIH5NQVNLU1tuXSkgPj4+IDA7XG5cbmNvbnN0IGJpdENsZWFyID0gKHgsIGJpdCkgPT4gKHggJiB+KDEgPDwgYml0KSkgPj4+IDA7XG5jb25zdCBiaXRGbGlwID0gKHgsIGJpdCkgPT4gKHggXiAoMSA8PCBiaXQpKSA+Pj4gMDtcbmNvbnN0IGJpdFNldCA9ICh4LCBiaXQpID0+ICh4IHwgKDEgPDwgYml0KSkgPj4+IDA7XG5jb25zdCBiaXRTZXRXaW5kb3cgPSAoeCwgeSwgZnJvbSwgdG8pID0+IHtcbiAgICBjb25zdCBtID0gZGVmTWFzayhmcm9tLCB0byk7XG4gICAgcmV0dXJuICh4ICYgfm0pIHwgKCh5IDw8ICgxIDw8IGZyb20pKSAmIG0pO1xufTtcbmNvbnN0IGJpdENsZWFyV2luZG93ID0gKHgsIGZyb20sIHRvKSA9PiB4ICYgfmRlZk1hc2soZnJvbSwgdG8pO1xuXG5jb25zdCBlbmNvZGVHcmF5MzIgPSAoeCkgPT4gKHggXiAoeCA+Pj4gMSkpID4+PiAwO1xuY29uc3QgZGVjb2RlR3JheTMyID0gKHgpID0+IHtcbiAgICB4ID0geCBeICh4ID4+PiAxNik7XG4gICAgeCA9IHggXiAoeCA+Pj4gOCk7XG4gICAgeCA9IHggXiAoeCA+Pj4gNCk7XG4gICAgeCA9IHggXiAoeCA+Pj4gMik7XG4gICAgeCA9IHggXiAoeCA+Pj4gMSk7XG4gICAgcmV0dXJuIHggPj4+IDA7XG59O1xuXG5jb25zdCBiaXROb3QgPSAoeCkgPT4gfng7XG5jb25zdCBiaXRBbmQgPSAoYSwgYikgPT4gYSAmIGI7XG5jb25zdCBiaXROYW5kID0gKGEsIGIpID0+IH4oYSAmIGIpO1xuY29uc3QgYml0T3IgPSAoYSwgYikgPT4gYSB8IGI7XG5jb25zdCBiaXROb3IgPSAoYSwgYikgPT4gfihhIHwgYik7XG5jb25zdCBiaXRYb3IgPSAoYSwgYikgPT4gYSBeIGI7XG5jb25zdCBiaXRYbm9yID0gKGEsIGIpID0+IH4oYSBeIGIpO1xuY29uc3QgYml0SW1wbHkgPSAoYSwgYikgPT4gfmEgfCBiO1xuY29uc3QgYml0QW9pMjEgPSAoYSwgYiwgYykgPT4gfihhIHwgKGIgJiBjKSk7XG5jb25zdCBiaXRPYWkyMSA9IChhLCBiLCBjKSA9PiB+KGEgJiAoYiB8IGMpKTtcbmNvbnN0IGJpdEFvaTIyID0gKGEsIGIsIGMsIGQpID0+IH4oKGEgJiBiKSB8IChjICYgZCkpO1xuY29uc3QgYml0T2FpMjIgPSAoYSwgYiwgYywgZCkgPT4gfigoYSB8IGIpICYgKGMgfCBkKSk7XG5jb25zdCBiaXRNdXggPSAoYSwgYiwgcykgPT4gKChhICYgfnMpIHwgKGIgJiBzKSkgPj4+IDA7XG5jb25zdCBiaXREZW11eCA9IChhLCBiLCBzKSA9PiBbXG4gICAgKGEgJiB+cykgPj4+IDAsXG4gICAgKGIgJiBzKSA+Pj4gMCxcbl07XG5jb25zdCBiaXROb3RNID0gKG4sIHgpID0+IG1hc2tMKG4sIH54KTtcbmNvbnN0IGJpdEFuZE0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgYSAmIGIpO1xuY29uc3QgYml0TmFuZE0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgfihhICYgYikpO1xuY29uc3QgYml0T3JNID0gKG4sIGEsIGIpID0+IG1hc2tMKG4sIGEgfCBiKTtcbmNvbnN0IGJpdE5vck0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgfihhIHwgYikpO1xuY29uc3QgYml0WG9yTSA9IChuLCBhLCBiKSA9PiBtYXNrTChuLCBhIF4gYik7XG5jb25zdCBiaXRYbm9yTSA9IChuLCBhLCBiKSA9PiBtYXNrTChuLCB+KGEgXiBiKSk7XG5jb25zdCBiaXRJbXBseU0gPSAobiwgYSwgYikgPT4gbWFza0wobiwgfmEgfCBiKTtcbmNvbnN0IGJpdEFvaTIxTSA9IChuLCBhLCBiLCBjKSA9PiBtYXNrTChuLCB+KGEgfCAoYiAmIGMpKSk7XG5jb25zdCBiaXRPYWkyMU0gPSAobiwgYSwgYiwgYykgPT4gbWFza0wobiwgfihhICYgKGIgfCBjKSkpO1xuY29uc3QgYml0QW9pMjJNID0gKG4sIGEsIGIsIGMsIGQpID0+IG1hc2tMKG4sIH4oKGEgJiBiKSB8IChjICYgZCkpKTtcbmNvbnN0IGJpdE9haTIyTSA9IChuLCBhLCBiLCBjLCBkKSA9PiBtYXNrTChuLCB+KChhIHwgYikgJiAoYyB8IGQpKSk7XG5jb25zdCBiaXRNdXhNID0gKG4sIGEsIGIsIHMpID0+IG1hc2tMKG4sIChhICYgfnMpIHwgKGIgJiBzKSk7XG5jb25zdCBiaXREZW11eE0gPSAobiwgYSwgYiwgcykgPT4gW1xuICAgIG1hc2tMKG4sIGEgJiB+cyksXG4gICAgbWFza0wobiwgYiAmIHMpLFxuXTtcblxuY29uc3QgYmluYXJ5T25lSG90ID0gKHgpID0+ICgxIDw8IHgpID4+PiAwO1xuY29uc3Qgb25lSG90QmluYXJ5ID0gKHgpID0+IDMxIC0gY2x6MzIoeCk7XG5cbmNvbnN0IGlzUG93MiA9ICh4KSA9PiAhIXggJiYgISh4ICYgKHggLSAxKSk7XG5jb25zdCBjZWlsUG93MiA9ICh4KSA9PiB7XG4gICAgeCArPSAoeCA9PT0gMCk7XG4gICAgLS14O1xuICAgIHggfD0geCA+Pj4gMTtcbiAgICB4IHw9IHggPj4+IDI7XG4gICAgeCB8PSB4ID4+PiA0O1xuICAgIHggfD0geCA+Pj4gODtcbiAgICB4IHw9IHggPj4+IDE2O1xuICAgIHJldHVybiB4ICsgMTtcbn07XG5jb25zdCBmbG9vclBvdzIgPSAoeCkgPT4ge1xuICAgIHggfD0geCA+Pj4gMTtcbiAgICB4IHw9IHggPj4+IDI7XG4gICAgeCB8PSB4ID4+PiA0O1xuICAgIHggfD0geCA+Pj4gODtcbiAgICB4IHw9IHggPj4+IDE2O1xuICAgIHJldHVybiB4IC0gKHggPj4+IDEpO1xufTtcblxuY29uc3Qgcm90YXRlTGVmdCA9ICh4LCBuKSA9PiAoKHggPDwgbikgfCAoeCA+Pj4gKDMyIC0gbikpKSA+Pj4gMDtcbmNvbnN0IHJvdGF0ZVJpZ2h0ID0gKHgsIG4pID0+ICgoeCA+Pj4gbikgfCAoeCA8PCAoMzIgLSBuKSkpID4+PiAwO1xuXG5jb25zdCBzcGxhdDRfMjQgPSAoeCkgPT4gKHggJiAweGYpICogMHgxMTExMTE7XG5jb25zdCBzcGxhdDRfMzIgPSAoeCkgPT4gKCh4ICYgMHhmKSAqIDB4MTExMTExMTEpID4+PiAwO1xuY29uc3Qgc3BsYXQ4XzI0ID0gKHgpID0+ICh4ICYgMHhmZikgKiAweDAxMDEwMTtcbmNvbnN0IHNwbGF0OF8zMiA9ICh4KSA9PiAoKHggJiAweGZmKSAqIDB4MDEwMTAxMDEpID4+PiAwO1xuY29uc3Qgc3BsYXQxNl8zMiA9ICh4KSA9PiAoKHggJj0gMHhmZmZmKSwgKCh4IDw8IDE2KSB8IHgpID4+PiAwKTtcbmNvbnN0IHNhbWU0ID0gKHgpID0+ICgoeCA+PiA0KSAmIDB4ZikgPT09ICh4ICYgMHhmKTtcbmNvbnN0IHNhbWU4ID0gKHgpID0+ICgoeCA+PiA4KSAmIDB4ZmYpID09PSAoeCAmIDB4ZmYpO1xuY29uc3QgaW50ZXJsZWF2ZTRfMTJfMjQgPSAoeCkgPT4gKCh4ICYgMHhmMDApICogMHgxMTAwKSB8ICgoeCAmIDB4ZjApICogMHgxMTApIHwgKCh4ICYgMHhmKSAqIDB4MTEpO1xuY29uc3QgaW50ZXJsZWF2ZTRfMTZfMzIgPSAoeCkgPT4gKCgoeCAmIDB4ZjAwMCkgKiAweDExMDAwKSB8XG4gICAgKCh4ICYgMHhmMDApICogMHgxMTAwKSB8XG4gICAgKCh4ICYgMHhmMCkgKiAweDExMCkgfFxuICAgICgoeCAmIDB4ZikgKiAweDExKSkgPj4+XG4gICAgMDtcblxuY29uc3QgbGFuZTE2ID0gKHgsIGxhbmUpID0+ICh4ID4+PiAoKDEgLSBsYW5lKSA8PCA0KSkgJiAweGZmZmY7XG5jb25zdCBsYW5lOCA9ICh4LCBsYW5lKSA9PiAoeCA+Pj4gKCgzIC0gbGFuZSkgPDwgMykpICYgMHhmZjtcbmNvbnN0IGxhbmU0ID0gKHgsIGxhbmUpID0+ICh4ID4+PiAoKDcgLSBsYW5lKSA8PCAyKSkgJiAweGY7XG5jb25zdCBsYW5lMiA9ICh4LCBsYW5lKSA9PiAoeCA+Pj4gKCgxNSAtIGxhbmUpIDw8IDEpKSAmIDB4MztcbmNvbnN0IHNldExhbmUxNiA9ICh4LCB5LCBsYW5lKSA9PiBsYW5lID8gbXV4KHgsIHksIDB4ZmZmZikgOiBtdXgoeCwgeSA8PCAxNiwgMHhmZmZmMDAwMCk7XG5jb25zdCBzZXRMYW5lOCA9ICh4LCB5LCBsYW5lKSA9PiB7XG4gICAgY29uc3QgbCA9ICgzIC0gbGFuZSkgPDwgMztcbiAgICByZXR1cm4gKCh+KDB4ZmYgPDwgbCkgJiB4KSB8ICgoeSAmIDB4ZmYpIDw8IGwpKSA+Pj4gMDtcbn07XG5jb25zdCBzZXRMYW5lNCA9ICh4LCB5LCBsYW5lKSA9PiB7XG4gICAgY29uc3QgbCA9ICg3IC0gbGFuZSkgPDwgMjtcbiAgICByZXR1cm4gKCh+KDB4ZiA8PCBsKSAmIHgpIHwgKCh5ICYgMHhmKSA8PCBsKSkgPj4+IDA7XG59O1xuY29uc3Qgc2V0TGFuZTIgPSAoeCwgeSwgbGFuZSkgPT4ge1xuICAgIGNvbnN0IGwgPSAoMTUgLSBsYW5lKSA8PCAxO1xuICAgIHJldHVybiAoKH4oMHgzIDw8IGwpICYgeCkgfCAoKHkgJiAweDMpIDw8IGwpKSA+Pj4gMDtcbn07XG5jb25zdCBzd2l6emxlOCA9ICh4LCBhLCBiLCBjLCBkKSA9PiAoKGxhbmU4KHgsIGEpIDw8IDI0KSB8XG4gICAgKGxhbmU4KHgsIGIpIDw8IDE2KSB8XG4gICAgKGxhbmU4KHgsIGMpIDw8IDgpIHxcbiAgICBsYW5lOCh4LCBkKSkgPj4+XG4gICAgMDtcbmNvbnN0IHN3aXp6bGU0ID0gKHgsIGEsIGIsIGMsIGQsIGUsIGYsIGcsIGgpID0+ICgobGFuZTQoeCwgYSkgPDwgMjgpIHxcbiAgICAobGFuZTQoeCwgYikgPDwgMjQpIHxcbiAgICAobGFuZTQoeCwgYykgPDwgMjApIHxcbiAgICAobGFuZTQoeCwgZCkgPDwgMTYpIHxcbiAgICAobGFuZTQoeCwgZSkgPDwgMTIpIHxcbiAgICAobGFuZTQoeCwgZikgPDwgOCkgfFxuICAgIChsYW5lNCh4LCBnKSA8PCA0KSB8XG4gICAgbGFuZTQoeCwgaCkpID4+PlxuICAgIDA7XG5jb25zdCBtdXggPSAoYSwgYiwgbWFzaykgPT4gKH5tYXNrICYgYSkgfCAobWFzayAmIGIpO1xuY29uc3QgZmxpcDggPSAoeCkgPT4gKCh4ID4+PiAyNCkgfCAoKHggPj4gOCkgJiAweGZmMDApIHwgKCh4ICYgMHhmZjAwKSA8PCA4KSB8ICh4IDw8IDI0KSkgPj4+IDA7XG5jb25zdCBmbGlwMTYgPSAoeCkgPT4gbXV4KHggPDwgMTYsIHggPj4+IDE2LCAweGZmZmYpO1xuY29uc3QgZmxpcEJ5dGVzID0gZmxpcDg7XG5jb25zdCBzd2FwTGFuZTAyID0gKHgpID0+ICgoeCAmIDB4ZmYwMCkgPDwgMTYpIHwgKCh4ID4+PiAxNikgJiAweGZmMDApIHwgKHggJiAweDAwZmYwMGZmKTtcbmNvbnN0IHN3YXBMYW5lMTMgPSAoeCkgPT4gKCh4ICYgMHhmZikgPDwgMTYpIHwgKCh4ID4+IDE2KSAmIDB4ZmYpIHwgKHggJiAweGZmMDBmZjAwKTtcblxuZXhwb3J0cy5JU19MRSA9IElTX0xFO1xuZXhwb3J0cy5NQVNLUyA9IE1BU0tTO1xuZXhwb3J0cy5NU0JfQklUUzE2ID0gTVNCX0JJVFMxNjtcbmV4cG9ydHMuTVNCX0JJVFMzMiA9IE1TQl9CSVRTMzI7XG5leHBvcnRzLk1TQl9CSVRTOCA9IE1TQl9CSVRTODtcbmV4cG9ydHMuYWxpZ24gPSBhbGlnbjtcbmV4cG9ydHMuYmluYXJ5T25lSG90ID0gYmluYXJ5T25lSG90O1xuZXhwb3J0cy5iaXRBbmQgPSBiaXRBbmQ7XG5leHBvcnRzLmJpdEFuZE0gPSBiaXRBbmRNO1xuZXhwb3J0cy5iaXRBb2kyMSA9IGJpdEFvaTIxO1xuZXhwb3J0cy5iaXRBb2kyMU0gPSBiaXRBb2kyMU07XG5leHBvcnRzLmJpdEFvaTIyID0gYml0QW9pMjI7XG5leHBvcnRzLmJpdEFvaTIyTSA9IGJpdEFvaTIyTTtcbmV4cG9ydHMuYml0Q2xlYXIgPSBiaXRDbGVhcjtcbmV4cG9ydHMuYml0Q2xlYXJXaW5kb3cgPSBiaXRDbGVhcldpbmRvdztcbmV4cG9ydHMuYml0RGVtdXggPSBiaXREZW11eDtcbmV4cG9ydHMuYml0RGVtdXhNID0gYml0RGVtdXhNO1xuZXhwb3J0cy5iaXRGbGlwID0gYml0RmxpcDtcbmV4cG9ydHMuYml0SW1wbHkgPSBiaXRJbXBseTtcbmV4cG9ydHMuYml0SW1wbHlNID0gYml0SW1wbHlNO1xuZXhwb3J0cy5iaXRNdXggPSBiaXRNdXg7XG5leHBvcnRzLmJpdE11eE0gPSBiaXRNdXhNO1xuZXhwb3J0cy5iaXROYW5kID0gYml0TmFuZDtcbmV4cG9ydHMuYml0TmFuZE0gPSBiaXROYW5kTTtcbmV4cG9ydHMuYml0Tm9yID0gYml0Tm9yO1xuZXhwb3J0cy5iaXROb3JNID0gYml0Tm9yTTtcbmV4cG9ydHMuYml0Tm90ID0gYml0Tm90O1xuZXhwb3J0cy5iaXROb3RNID0gYml0Tm90TTtcbmV4cG9ydHMuYml0T2FpMjEgPSBiaXRPYWkyMTtcbmV4cG9ydHMuYml0T2FpMjFNID0gYml0T2FpMjFNO1xuZXhwb3J0cy5iaXRPYWkyMiA9IGJpdE9haTIyO1xuZXhwb3J0cy5iaXRPYWkyMk0gPSBiaXRPYWkyMk07XG5leHBvcnRzLmJpdE9yID0gYml0T3I7XG5leHBvcnRzLmJpdE9yTSA9IGJpdE9yTTtcbmV4cG9ydHMuYml0U2V0ID0gYml0U2V0O1xuZXhwb3J0cy5iaXRTZXRXaW5kb3cgPSBiaXRTZXRXaW5kb3c7XG5leHBvcnRzLmJpdFNpemUgPSBiaXRTaXplO1xuZXhwb3J0cy5iaXRYbm9yID0gYml0WG5vcjtcbmV4cG9ydHMuYml0WG5vck0gPSBiaXRYbm9yTTtcbmV4cG9ydHMuYml0WG9yID0gYml0WG9yO1xuZXhwb3J0cy5iaXRYb3JNID0gYml0WG9yTTtcbmV4cG9ydHMuYnl0ZXMxNiA9IGJ5dGVzMTY7XG5leHBvcnRzLmJ5dGVzMjQgPSBieXRlczI0O1xuZXhwb3J0cy5ieXRlczMyID0gYnl0ZXMzMjtcbmV4cG9ydHMuYnl0ZXM2NCA9IGJ5dGVzNjQ7XG5leHBvcnRzLmJ5dGVzRjMyID0gYnl0ZXNGMzI7XG5leHBvcnRzLmJ5dGVzRjY0ID0gYnl0ZXNGNjQ7XG5leHBvcnRzLmNlaWxQb3cyID0gY2VpbFBvdzI7XG5leHBvcnRzLmNsejMyID0gY2x6MzI7XG5leHBvcnRzLmN0ejMyID0gY3R6MzI7XG5leHBvcnRzLmRlY29kZUdyYXkzMiA9IGRlY29kZUdyYXkzMjtcbmV4cG9ydHMuZGVmTWFzayA9IGRlZk1hc2s7XG5leHBvcnRzLmVuY29kZUdyYXkzMiA9IGVuY29kZUdyYXkzMjtcbmV4cG9ydHMuZjMydTE2ID0gZjMydTE2O1xuZXhwb3J0cy5mMzJ1MjQgPSBmMzJ1MjQ7XG5leHBvcnRzLmYzMnUzMiA9IGYzMnUzMjtcbmV4cG9ydHMuZjMydTggPSBmMzJ1ODtcbmV4cG9ydHMuZmxpcDE2ID0gZmxpcDE2O1xuZXhwb3J0cy5mbGlwOCA9IGZsaXA4O1xuZXhwb3J0cy5mbGlwQnl0ZXMgPSBmbGlwQnl0ZXM7XG5leHBvcnRzLmZsb2F0VG9JbnRCaXRzID0gZmxvYXRUb0ludEJpdHM7XG5leHBvcnRzLmZsb2F0VG9JbnRCaXRzNjQgPSBmbG9hdFRvSW50Qml0czY0O1xuZXhwb3J0cy5mbG9hdFRvU29ydGFibGVJbnQgPSBmbG9hdFRvU29ydGFibGVJbnQ7XG5leHBvcnRzLmZsb2F0VG9VaW50Qml0cyA9IGZsb2F0VG9VaW50Qml0cztcbmV4cG9ydHMuZmxvYXRUb1VpbnRCaXRzNjQgPSBmbG9hdFRvVWludEJpdHM2NDtcbmV4cG9ydHMuZmxvb3JQb3cyID0gZmxvb3JQb3cyO1xuZXhwb3J0cy5oYW1taW5nRGlzdCA9IGhhbW1pbmdEaXN0O1xuZXhwb3J0cy5pbnRCaXRzVG9GbG9hdCA9IGludEJpdHNUb0Zsb2F0O1xuZXhwb3J0cy5pbnRCaXRzVG9GbG9hdDY0ID0gaW50Qml0c1RvRmxvYXQ2NDtcbmV4cG9ydHMuaW50ZXJsZWF2ZTRfMTJfMjQgPSBpbnRlcmxlYXZlNF8xMl8yNDtcbmV4cG9ydHMuaW50ZXJsZWF2ZTRfMTZfMzIgPSBpbnRlcmxlYXZlNF8xNl8zMjtcbmV4cG9ydHMuaXNBbGlnbmVkID0gaXNBbGlnbmVkO1xuZXhwb3J0cy5pc1BvdzIgPSBpc1BvdzI7XG5leHBvcnRzLmxhbmUxNiA9IGxhbmUxNjtcbmV4cG9ydHMubGFuZTIgPSBsYW5lMjtcbmV4cG9ydHMubGFuZTQgPSBsYW5lNDtcbmV4cG9ydHMubGFuZTggPSBsYW5lODtcbmV4cG9ydHMubWFza0ggPSBtYXNrSDtcbmV4cG9ydHMubWFza0wgPSBtYXNrTDtcbmV4cG9ydHMubXV4ID0gbXV4O1xuZXhwb3J0cy5vbmVIb3RCaW5hcnkgPSBvbmVIb3RCaW5hcnk7XG5leHBvcnRzLnBvcENvdW50ID0gcG9wQ291bnQ7XG5leHBvcnRzLnJvdGF0ZUxlZnQgPSByb3RhdGVMZWZ0O1xuZXhwb3J0cy5yb3RhdGVSaWdodCA9IHJvdGF0ZVJpZ2h0O1xuZXhwb3J0cy5zYW1lNCA9IHNhbWU0O1xuZXhwb3J0cy5zYW1lOCA9IHNhbWU4O1xuZXhwb3J0cy5zZXRMYW5lMTYgPSBzZXRMYW5lMTY7XG5leHBvcnRzLnNldExhbmUyID0gc2V0TGFuZTI7XG5leHBvcnRzLnNldExhbmU0ID0gc2V0TGFuZTQ7XG5leHBvcnRzLnNldExhbmU4ID0gc2V0TGFuZTg7XG5leHBvcnRzLnNwbGF0MTZfMzIgPSBzcGxhdDE2XzMyO1xuZXhwb3J0cy5zcGxhdDRfMjQgPSBzcGxhdDRfMjQ7XG5leHBvcnRzLnNwbGF0NF8zMiA9IHNwbGF0NF8zMjtcbmV4cG9ydHMuc3BsYXQ4XzI0ID0gc3BsYXQ4XzI0O1xuZXhwb3J0cy5zcGxhdDhfMzIgPSBzcGxhdDhfMzI7XG5leHBvcnRzLnN3YXBMYW5lMDIgPSBzd2FwTGFuZTAyO1xuZXhwb3J0cy5zd2FwTGFuZTEzID0gc3dhcExhbmUxMztcbmV4cG9ydHMuc3dpenpsZTQgPSBzd2l6emxlNDtcbmV4cG9ydHMuc3dpenpsZTggPSBzd2l6emxlODtcbmV4cG9ydHMudTE2ZjMyID0gdTE2ZjMyO1xuZXhwb3J0cy51MjRmMzIgPSB1MjRmMzI7XG5leHBvcnRzLnUzMmYzMiA9IHUzMmYzMjtcbmV4cG9ydHMudThmMzIgPSB1OGYzMjtcbmV4cG9ydHMudWludEJpdHNUb0Zsb2F0ID0gdWludEJpdHNUb0Zsb2F0O1xuZXhwb3J0cy51aW50Qml0c1RvRmxvYXQ2NCA9IHVpbnRCaXRzVG9GbG9hdDY0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBleGlzdHNBbmROb3ROdWxsID0gKHgpID0+IHggIT0gbnVsbDtcblxuY29uc3QgZXhpc3RzID0gKHQpID0+IHQgIT09IHVuZGVmaW5lZDtcblxuY29uc3QgaGFzQmlnSW50ID0gKCkgPT4gdHlwZW9mIEJpZ0ludCA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBoYXNDcnlwdG8gPSAoKSA9PiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvd1tcImNyeXB0b1wiXSAhPT0gdW5kZWZpbmVkO1xuXG5jb25zdCBoYXNNYXhMZW5ndGggPSAobGVuLCB4KSA9PiB4ICE9IG51bGwgJiYgeC5sZW5ndGggPD0gbGVuO1xuXG5jb25zdCBoYXNNaW5MZW5ndGggPSAobGVuLCB4KSA9PiB4ICE9IG51bGwgJiYgeC5sZW5ndGggPj0gbGVuO1xuXG5jb25zdCBpc0Z1bmN0aW9uID0gKHgpID0+IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCI7XG5cbmNvbnN0IGhhc1BlcmZvcm1hbmNlID0gKCkgPT4gdHlwZW9mIHBlcmZvcm1hbmNlICE9PSBcInVuZGVmaW5lZFwiICYmIGlzRnVuY3Rpb24ocGVyZm9ybWFuY2Uubm93KTtcblxuY29uc3QgaGFzV0FTTSA9ICgpID0+ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgdHlwZW9mIHdpbmRvd1tcIldlYkFzc2VtYmx5XCJdICE9PSBcInVuZGVmaW5lZFwiKSB8fFxuICAgICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHR5cGVvZiBnbG9iYWxbXCJXZWJBc3NlbWJseVwiXSAhPT0gXCJ1bmRlZmluZWRcIik7XG5cbmNvbnN0IGhhc1dlYkdMID0gKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIikuZ2V0Q29udGV4dChcIndlYmdsXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbmNvbnN0IGhhc1dlYlNvY2tldCA9ICgpID0+IHR5cGVvZiBXZWJTb2NrZXQgIT09IFwidW5kZWZpbmVkXCI7XG5cbmNvbnN0IGltcGxlbWVudHNGdW5jdGlvbiA9ICh4LCBmbikgPT4geCAhPSBudWxsICYmIHR5cGVvZiB4W2ZuXSA9PT0gXCJmdW5jdGlvblwiO1xuXG5jb25zdCBpc0FscGhhID0gKHgpID0+IC9eW2Etel0rJC9pLnRlc3QoeCk7XG5jb25zdCBpc0FscGhhTnVtID0gKHgpID0+IC9eW2EtejAtOV0rJC9pLnRlc3QoeCk7XG5jb25zdCBpc051bWVyaWMgPSAoeCkgPT4gL15bMC05XSskLy50ZXN0KHgpO1xuXG5jb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuY29uc3QgaXNBcnJheUxpa2UgPSAoeCkgPT4geCAhPSBudWxsICYmIHR5cGVvZiB4ICE9PSBcImZ1bmN0aW9uXCIgJiYgeC5sZW5ndGggIT09IHVuZGVmaW5lZDtcblxuY29uc3QgaXNBU0NJSSA9ICh4KSA9PiAvXltcXHgwMC1cXHg3Zl0rJC8udGVzdCh4KTtcbmNvbnN0IGlzUHJpbnRhYmxlQVNDSUkgPSAoeCkgPT4gL15bXFx4MjAtXFx4N2VdKyQvLnRlc3QoeCk7XG5cbmNvbnN0IGlzQXN5bmNJdGVyYWJsZSA9ICh4KSA9PiB4ICE9IG51bGwgJiYgdHlwZW9mIHhbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCI7XG5cbmNvbnN0IGlzQmxvYiA9ICh4KSA9PiB4IGluc3RhbmNlb2YgQmxvYjtcblxuY29uc3QgaXNCb29sZWFuID0gKHgpID0+IHR5cGVvZiB4ID09PSBcImJvb2xlYW5cIjtcblxuY29uc3QgaXNDaHJvbWUgPSAoKSA9PiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmICEhd2luZG93W1wiY2hyb21lXCJdO1xuXG5jb25zdCBpc0RhdGFVUkwgPSAoeCkgPT4gL15kYXRhOi4rXFwvKC4rKTtiYXNlNjQsLy50ZXN0KHgpO1xuXG5jb25zdCBpc0RhdGUgPSAoeCkgPT4geCBpbnN0YW5jZW9mIERhdGU7XG5cbmNvbnN0IGlzRXZlbiA9ICh4KSA9PiB4ICUgMiA9PT0gMDtcblxuY29uc3QgaXNGYWxzZSA9ICh4KSA9PiB4ID09PSBmYWxzZTtcblxuY29uc3QgaXNGaWxlID0gKHgpID0+IHggaW5zdGFuY2VvZiBGaWxlO1xuXG5jb25zdCBpc0ZpcmVmb3ggPSAoKSA9PiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmICEhd2luZG93W1wiSW5zdGFsbFRyaWdnZXJcIl07XG5cbmNvbnN0IFJFJDQgPSAvXig/OlstK10/KD86WzAtOV0rKSk/KD86XFwuWzAtOV0qKT8oPzpbZUVdW1xcK1xcLV0/KD86WzAtOV0rKSk/JC87XG5jb25zdCBpc0Zsb2F0U3RyaW5nID0gKHgpID0+IHgubGVuZ3RoID4gMCAmJiBSRSQ0LnRlc3QoeCk7XG5cbmNvbnN0IGlzSGV4ID0gKHgpID0+IC9eW2EtZjAtOV0rJC9pLnRlc3QoeCk7XG5cbmNvbnN0IGlzU3RyaW5nID0gKHgpID0+IHR5cGVvZiB4ID09PSBcInN0cmluZ1wiO1xuXG5jb25zdCBSRSQzID0gL14jKFthLWYwLTldezN9fFthLWYwLTldezR9KD86W2EtZjAtOV17Mn0pezAsMn0pJC9pO1xuY29uc3QgaXNIZXhDb2xvciA9ICh4KSA9PiBpc1N0cmluZyh4KSAmJiBSRSQzLnRlc3QoeCk7XG5cbmNvbnN0IGlzSUUgPSAoKSA9PiB0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAodHlwZW9mIGRvY3VtZW50W1wiZG9jdW1lbnRNb2RlXCJdICE9PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIk1TSUVcIikgPiAwKTtcblxuY29uc3QgaXNJblJhbmdlID0gKG1pbiwgbWF4LCB4KSA9PiB4ID49IG1pbiAmJiB4IDw9IG1heDtcblxuY29uc3QgaXNJbnQzMiA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJudW1iZXJcIiAmJiAoeCB8IDApID09PSB4O1xuXG5jb25zdCBSRSQyID0gL14oPzpbLStdPyg/OjB8WzEtOV1bMC05XSopKSQvO1xuY29uc3QgaXNJbnRTdHJpbmcgPSAoeCkgPT4gUkUkMi50ZXN0KHgpO1xuXG5jb25zdCBpc0l0ZXJhYmxlID0gKHgpID0+IHggIT0gbnVsbCAmJiB0eXBlb2YgeFtTeW1ib2wuaXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCI7XG5cbmNvbnN0IGlzTWFwID0gKHgpID0+IHggaW5zdGFuY2VvZiBNYXA7XG5cbmNvbnN0IGlzTW9iaWxlID0gKCkgPT4gdHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIC9tb2JpbGV8dGFibGV0fGlwKGFkfGhvbmV8b2QpfGFuZHJvaWR8c2lsa3xjcmlvcy9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbmNvbnN0IGlzTmFOID0gKHgpID0+IHggIT09IHg7XG5cbmNvbnN0IGlzTmVnYXRpdmUgPSAoeCkgPT4gdHlwZW9mIHggPT09IFwibnVtYmVyXCIgJiYgeCA8IDA7XG5cbmNvbnN0IGlzTmlsID0gKHgpID0+IHggPT0gbnVsbDtcblxuY29uc3QgaXNOb2RlID0gKCkgPT4gdHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiZcbiAgICB0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucyA9PT0gXCJvYmplY3RcIiAmJlxuICAgIHR5cGVvZiBwcm9jZXNzLnZlcnNpb25zLm5vZGUgIT09IFwidW5kZWZpbmVkXCI7XG5cbmNvbnN0IGlzTm90U3RyaW5nQW5kSXRlcmFibGUgPSAoeCkgPT4geCAhPSBudWxsICYmXG4gICAgdHlwZW9mIHggIT09IFwic3RyaW5nXCIgJiZcbiAgICB0eXBlb2YgeFtTeW1ib2wuaXRlcmF0b3JdID09PSBcImZ1bmN0aW9uXCI7XG5cbmNvbnN0IGlzTnVsbCA9ICh4KSA9PiB4ID09PSBudWxsO1xuXG5jb25zdCBpc051bWJlciA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJudW1iZXJcIjtcblxuY29uc3QgaXNOdW1lcmljSW50ID0gKHgpID0+IC9eWy0rXT9cXGQrJC8udGVzdCh4KTtcbmNvbnN0IGlzTnVtZXJpY0Zsb2F0ID0gKHgpID0+IC9eWy0rXT9cXGQqXFwuP1xcZCsoZVstK10/XFxkKyk/JC9pLnRlc3QoeCk7XG5cbmNvbnN0IGlzT2JqZWN0ID0gKHgpID0+IHggIT09IG51bGwgJiYgdHlwZW9mIHggPT09IFwib2JqZWN0XCI7XG5cbmNvbnN0IGlzT2RkID0gKHgpID0+IHggJSAyICE9PSAwO1xuXG5jb25zdCBPQkpQID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xuY29uc3QgaXNQbGFpbk9iamVjdCA9ICh4KSA9PiB7XG4gICAgbGV0IHA7XG4gICAgcmV0dXJuICh4ICE9IG51bGwgJiZcbiAgICAgICAgdHlwZW9mIHggPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgKChwID0gT0JKUCh4KSkgPT09IG51bGwgfHwgT0JKUChwKSA9PT0gbnVsbCkpO1xufTtcblxuY29uc3QgaXNQb3NpdGl2ZSA9ICh4KSA9PiB0eXBlb2YgeCA9PT0gXCJudW1iZXJcIiAmJiB4ID4gMDtcblxuY29uc3QgaXNQcmltaXRpdmUgPSAoeCkgPT4ge1xuICAgIGNvbnN0IHQgPSB0eXBlb2YgeDtcbiAgICByZXR1cm4gdCA9PT0gXCJzdHJpbmdcIiB8fCB0ID09PSBcIm51bWJlclwiO1xufTtcblxuY29uc3QgaXNQcm9taXNlID0gKHgpID0+IHggaW5zdGFuY2VvZiBQcm9taXNlO1xuXG5jb25zdCBpc1Byb21pc2VMaWtlID0gKHgpID0+IHggaW5zdGFuY2VvZiBQcm9taXNlIHx8XG4gICAgKGltcGxlbWVudHNGdW5jdGlvbih4LCBcInRoZW5cIikgJiYgaW1wbGVtZW50c0Z1bmN0aW9uKHgsIFwiY2F0Y2hcIikpO1xuXG5jb25zdCBJTExFR0FMX0tFWVMgPSBuZXcgU2V0KFtcIl9fcHJvdG9fX1wiLCBcInByb3RvdHlwZVwiLCBcImNvbnN0cnVjdG9yXCJdKTtcbmNvbnN0IGlzSWxsZWdhbEtleSA9ICh4KSA9PiBJTExFR0FMX0tFWVMuaGFzKHgpO1xuY29uc3QgaXNQcm90b1BhdGggPSAocGF0aCkgPT4gaXNBcnJheShwYXRoKVxuICAgID8gcGF0aC5zb21lKGlzSWxsZWdhbEtleSlcbiAgICA6IGlzU3RyaW5nKHBhdGgpXG4gICAgICAgID8gcGF0aC5pbmRleE9mKFwiLlwiKSAhPT0gLTFcbiAgICAgICAgICAgID8gcGF0aC5zcGxpdChcIi5cIikuc29tZShpc0lsbGVnYWxLZXkpXG4gICAgICAgICAgICA6IGlzSWxsZWdhbEtleShwYXRoKVxuICAgICAgICA6IGZhbHNlO1xuXG5jb25zdCBpc1JlZ0V4cCA9ICh4KSA9PiB4IGluc3RhbmNlb2YgUmVnRXhwO1xuXG5jb25zdCBpc1NhZmFyaSA9ICgpID0+IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAvU2FmYXJpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmXG4gICAgIWlzQ2hyb21lKCk7XG5cbmNvbnN0IGlzU2V0ID0gKHgpID0+IHggaW5zdGFuY2VvZiBTZXQ7XG5cbmNvbnN0IGlzU3ltYm9sID0gKHgpID0+IHR5cGVvZiB4ID09PSBcInN5bWJvbFwiO1xuXG5jb25zdCBpc1RyYW5zZmVyYWJsZSA9ICh4KSA9PiB4IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHxcbiAgICAodHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIHggaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlcikgfHxcbiAgICAodHlwZW9mIE1lc3NhZ2VQb3J0ICE9PSBcInVuZGVmaW5lZFwiICYmIHggaW5zdGFuY2VvZiBNZXNzYWdlUG9ydCk7XG5cbmNvbnN0IGlzVHJ1ZSA9ICh4KSA9PiB4ID09PSB0cnVlO1xuXG5jb25zdCBpc1R5cGVkQXJyYXkgPSAoeCkgPT4geCAmJlxuICAgICh4IGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkgfHxcbiAgICAgICAgeCBpbnN0YW5jZW9mIFVpbnQzMkFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBJbnQzMkFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBJbnQ4QXJyYXkgfHxcbiAgICAgICAgeCBpbnN0YW5jZW9mIFVpbnQxNkFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBJbnQxNkFycmF5IHx8XG4gICAgICAgIHggaW5zdGFuY2VvZiBVaW50OENsYW1wZWRBcnJheSk7XG5cbmNvbnN0IGlzVWludDMyID0gKHgpID0+IHR5cGVvZiB4ID09PSBcIm51bWJlclwiICYmIHggPj4+IDAgPT09IHg7XG5cbmNvbnN0IGlzVW5kZWZpbmVkID0gKHgpID0+IHggPT09IHVuZGVmaW5lZDtcblxuY29uc3QgUkUkMSA9IC9eWzAtOWEtZl17OH0tWzAtOWEtZl17NH0tWzAtOWEtZl17NH0tWzAtOWEtZl17NH0tWzAtOWEtZl17MTJ9JC9pO1xuY29uc3QgaXNVVUlEID0gKHgpID0+IFJFJDEudGVzdCh4KTtcblxuY29uc3QgUkUgPSAvXlswLTlhLWZdezh9LVswLTlhLWZdezR9LTRbMC05YS1mXXszfS1bODlhYl1bMC05YS1mXXszfS1bMC05YS1mXXsxMn0kL2k7XG5jb25zdCBpc1VVSUR2NCA9ICh4KSA9PiBSRS50ZXN0KHgpO1xuXG5jb25zdCBpc1plcm8gPSAoeCkgPT4geCA9PT0gMDtcblxuZXhwb3J0cy5leGlzdHMgPSBleGlzdHM7XG5leHBvcnRzLmV4aXN0c0FuZE5vdE51bGwgPSBleGlzdHNBbmROb3ROdWxsO1xuZXhwb3J0cy5oYXNCaWdJbnQgPSBoYXNCaWdJbnQ7XG5leHBvcnRzLmhhc0NyeXB0byA9IGhhc0NyeXB0bztcbmV4cG9ydHMuaGFzTWF4TGVuZ3RoID0gaGFzTWF4TGVuZ3RoO1xuZXhwb3J0cy5oYXNNaW5MZW5ndGggPSBoYXNNaW5MZW5ndGg7XG5leHBvcnRzLmhhc1BlcmZvcm1hbmNlID0gaGFzUGVyZm9ybWFuY2U7XG5leHBvcnRzLmhhc1dBU00gPSBoYXNXQVNNO1xuZXhwb3J0cy5oYXNXZWJHTCA9IGhhc1dlYkdMO1xuZXhwb3J0cy5oYXNXZWJTb2NrZXQgPSBoYXNXZWJTb2NrZXQ7XG5leHBvcnRzLmltcGxlbWVudHNGdW5jdGlvbiA9IGltcGxlbWVudHNGdW5jdGlvbjtcbmV4cG9ydHMuaXNBU0NJSSA9IGlzQVNDSUk7XG5leHBvcnRzLmlzQWxwaGEgPSBpc0FscGhhO1xuZXhwb3J0cy5pc0FscGhhTnVtID0gaXNBbHBoYU51bTtcbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5leHBvcnRzLmlzQXJyYXlMaWtlID0gaXNBcnJheUxpa2U7XG5leHBvcnRzLmlzQXN5bmNJdGVyYWJsZSA9IGlzQXN5bmNJdGVyYWJsZTtcbmV4cG9ydHMuaXNCbG9iID0gaXNCbG9iO1xuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5leHBvcnRzLmlzQ2hyb21lID0gaXNDaHJvbWU7XG5leHBvcnRzLmlzRGF0YVVSTCA9IGlzRGF0YVVSTDtcbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuZXhwb3J0cy5pc0V2ZW4gPSBpc0V2ZW47XG5leHBvcnRzLmlzRmFsc2UgPSBpc0ZhbHNlO1xuZXhwb3J0cy5pc0ZpbGUgPSBpc0ZpbGU7XG5leHBvcnRzLmlzRmlyZWZveCA9IGlzRmlyZWZveDtcbmV4cG9ydHMuaXNGbG9hdFN0cmluZyA9IGlzRmxvYXRTdHJpbmc7XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuZXhwb3J0cy5pc0hleCA9IGlzSGV4O1xuZXhwb3J0cy5pc0hleENvbG9yID0gaXNIZXhDb2xvcjtcbmV4cG9ydHMuaXNJRSA9IGlzSUU7XG5leHBvcnRzLmlzSWxsZWdhbEtleSA9IGlzSWxsZWdhbEtleTtcbmV4cG9ydHMuaXNJblJhbmdlID0gaXNJblJhbmdlO1xuZXhwb3J0cy5pc0ludDMyID0gaXNJbnQzMjtcbmV4cG9ydHMuaXNJbnRTdHJpbmcgPSBpc0ludFN0cmluZztcbmV4cG9ydHMuaXNJdGVyYWJsZSA9IGlzSXRlcmFibGU7XG5leHBvcnRzLmlzTWFwID0gaXNNYXA7XG5leHBvcnRzLmlzTW9iaWxlID0gaXNNb2JpbGU7XG5leHBvcnRzLmlzTmFOID0gaXNOYU47XG5leHBvcnRzLmlzTmVnYXRpdmUgPSBpc05lZ2F0aXZlO1xuZXhwb3J0cy5pc05pbCA9IGlzTmlsO1xuZXhwb3J0cy5pc05vZGUgPSBpc05vZGU7XG5leHBvcnRzLmlzTm90U3RyaW5nQW5kSXRlcmFibGUgPSBpc05vdFN0cmluZ0FuZEl0ZXJhYmxlO1xuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5leHBvcnRzLmlzTnVtZXJpYyA9IGlzTnVtZXJpYztcbmV4cG9ydHMuaXNOdW1lcmljRmxvYXQgPSBpc051bWVyaWNGbG9hdDtcbmV4cG9ydHMuaXNOdW1lcmljSW50ID0gaXNOdW1lcmljSW50O1xuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuZXhwb3J0cy5pc09kZCA9IGlzT2RkO1xuZXhwb3J0cy5pc1BsYWluT2JqZWN0ID0gaXNQbGFpbk9iamVjdDtcbmV4cG9ydHMuaXNQb3NpdGl2ZSA9IGlzUG9zaXRpdmU7XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5leHBvcnRzLmlzUHJpbnRhYmxlQVNDSUkgPSBpc1ByaW50YWJsZUFTQ0lJO1xuZXhwb3J0cy5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5leHBvcnRzLmlzUHJvbWlzZUxpa2UgPSBpc1Byb21pc2VMaWtlO1xuZXhwb3J0cy5pc1Byb3RvUGF0aCA9IGlzUHJvdG9QYXRoO1xuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuZXhwb3J0cy5pc1NhZmFyaSA9IGlzU2FmYXJpO1xuZXhwb3J0cy5pc1NldCA9IGlzU2V0O1xuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuZXhwb3J0cy5pc1RyYW5zZmVyYWJsZSA9IGlzVHJhbnNmZXJhYmxlO1xuZXhwb3J0cy5pc1RydWUgPSBpc1RydWU7XG5leHBvcnRzLmlzVHlwZWRBcnJheSA9IGlzVHlwZWRBcnJheTtcbmV4cG9ydHMuaXNVVUlEID0gaXNVVUlEO1xuZXhwb3J0cy5pc1VVSUR2NCA9IGlzVVVJRHY0O1xuZXhwb3J0cy5pc1VpbnQzMiA9IGlzVWludDMyO1xuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuZXhwb3J0cy5pc1plcm8gPSBpc1plcm87XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbmNvbnN0IGNvbXBhcmUgPSAoYSwgYikgPT4ge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAoYSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBiID09IG51bGwgPyAwIDogLTE7XG4gICAgfVxuICAgIGlmIChiID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGEgPT0gbnVsbCA/IDAgOiAxO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEuY29tcGFyZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBhLmNvbXBhcmUoYik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYi5jb21wYXJlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIC1iLmNvbXBhcmUoYSk7XG4gICAgfVxuICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbn07XG5cbmNvbnN0IGdldEtleSA9IChrKSA9PiB0eXBlb2YgayA9PT0gXCJmdW5jdGlvblwiID8gayA6ICh4KSA9PiB4W2tdO1xuZnVuY3Rpb24gY29tcGFyZUJ5S2V5KGEsIGNtcCA9IGNvbXBhcmUpIHtcbiAgICBjb25zdCBrID0gZ2V0S2V5KGEpO1xuICAgIHJldHVybiAoeCwgeSkgPT4gY21wKGsoeCksIGsoeSkpO1xufVxuZnVuY3Rpb24gY29tcGFyZUJ5S2V5czIoYSwgYiwgY21wQSA9IGNvbXBhcmUsIGNtcEIgPSBjb21wYXJlKSB7XG4gICAgY29uc3Qga2EgPSBnZXRLZXkoYSk7XG4gICAgY29uc3Qga2IgPSBnZXRLZXkoYik7XG4gICAgcmV0dXJuICh4LCB5KSA9PiB7XG4gICAgICAgIGxldCByZXMgPSBjbXBBKGthKHgpLCBrYSh5KSk7XG4gICAgICAgIHJldHVybiByZXMgPT09IDAgPyBjbXBCKGtiKHgpLCBrYih5KSkgOiByZXM7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbXBhcmVCeUtleXMzKGEsIGIsIGMsIGNtcEEgPSBjb21wYXJlLCBjbXBCID0gY29tcGFyZSwgY21wQyA9IGNvbXBhcmUpIHtcbiAgICBjb25zdCBrYSA9IGdldEtleShhKTtcbiAgICBjb25zdCBrYiA9IGdldEtleShiKTtcbiAgICBjb25zdCBrYyA9IGdldEtleShjKTtcbiAgICByZXR1cm4gKHgsIHkpID0+IHtcbiAgICAgICAgbGV0IHJlcyA9IGNtcEEoa2EoeCksIGthKHkpKTtcbiAgICAgICAgcmV0dXJuIHJlcyA9PT0gMFxuICAgICAgICAgICAgPyAocmVzID0gY21wQihrYih4KSwga2IoeSkpKSA9PT0gMFxuICAgICAgICAgICAgICAgID8gY21wQyhrYyh4KSwga2MoeSkpXG4gICAgICAgICAgICAgICAgOiByZXNcbiAgICAgICAgICAgIDogcmVzO1xuICAgIH07XG59XG5mdW5jdGlvbiBjb21wYXJlQnlLZXlzNChhLCBiLCBjLCBkLCBjbXBBID0gY29tcGFyZSwgY21wQiA9IGNvbXBhcmUsIGNtcEMgPSBjb21wYXJlLCBjbXBEID0gY29tcGFyZSkge1xuICAgIGNvbnN0IGthID0gZ2V0S2V5KGEpO1xuICAgIGNvbnN0IGtiID0gZ2V0S2V5KGIpO1xuICAgIGNvbnN0IGtjID0gZ2V0S2V5KGMpO1xuICAgIGNvbnN0IGtkID0gZ2V0S2V5KGQpO1xuICAgIHJldHVybiAoeCwgeSkgPT4ge1xuICAgICAgICBsZXQgcmVzID0gY21wQShrYSh4KSwga2EoeSkpO1xuICAgICAgICByZXR1cm4gcmVzID09PSAwXG4gICAgICAgICAgICA/IChyZXMgPSBjbXBCKGtiKHgpLCBrYih5KSkpID09PSAwXG4gICAgICAgICAgICAgICAgPyAocmVzID0gY21wQyhrYyh4KSwga2MoeSkpKSA9PT0gMFxuICAgICAgICAgICAgICAgICAgICA/IGNtcEQoa2QoeCksIGtkKHkpKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc1xuICAgICAgICAgICAgICAgIDogcmVzXG4gICAgICAgICAgICA6IHJlcztcbiAgICB9O1xufVxuXG5jb25zdCBjb21wYXJlTnVtQXNjID0gKGEsIGIpID0+IGEgLSBiO1xuY29uc3QgY29tcGFyZU51bURlc2MgPSAoYSwgYikgPT4gYiAtIGE7XG5cbmNvbnN0IHJldmVyc2UgPSAoY21wKSA9PiAoYSwgYikgPT4gLWNtcChhLCBiKTtcblxuZXhwb3J0cy5jb21wYXJlID0gY29tcGFyZTtcbmV4cG9ydHMuY29tcGFyZUJ5S2V5ID0gY29tcGFyZUJ5S2V5O1xuZXhwb3J0cy5jb21wYXJlQnlLZXlzMiA9IGNvbXBhcmVCeUtleXMyO1xuZXhwb3J0cy5jb21wYXJlQnlLZXlzMyA9IGNvbXBhcmVCeUtleXMzO1xuZXhwb3J0cy5jb21wYXJlQnlLZXlzNCA9IGNvbXBhcmVCeUtleXM0O1xuZXhwb3J0cy5jb21wYXJlTnVtQXNjID0gY29tcGFyZU51bUFzYztcbmV4cG9ydHMuY29tcGFyZU51bURlc2MgPSBjb21wYXJlTnVtRGVzYztcbmV4cG9ydHMucmV2ZXJzZSA9IHJldmVyc2U7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBlcnJvcnMgPSByZXF1aXJlKCdAdGhpLm5nL2Vycm9ycycpO1xuXG5mdW5jdGlvbiBjb21wKC4uLmZucykge1xuICAgIGxldCBbYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgaSwgal0gPSBmbnM7XG4gICAgc3dpdGNoIChmbnMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIGVycm9ycy5pbGxlZ2FsQXJpdHkoMCk7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBhKGIoLi4ueHMpKTtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKGMoLi4ueHMpKSk7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGEoYihjKGQoLi4ueHMpKSkpO1xuICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBhKGIoYyhkKGUoLi4ueHMpKSkpKTtcbiAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKGMoZChlKGYoLi4ueHMpKSkpKSk7XG4gICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGEoYihjKGQoZShmKGcoLi4ueHMpKSkpKSkpO1xuICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBhKGIoYyhkKGUoZihnKGgoLi4ueHMpKSkpKSkpKTtcbiAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gYShiKGMoZChlKGYoZyhoKGkoLi4ueHMpKSkpKSkpKSk7XG4gICAgICAgIGNhc2UgMTA6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zdCBmbiA9ICguLi54cykgPT4gYShiKGMoZChlKGYoZyhoKGkoaiguLi54cykpKSkpKSkpKSk7XG4gICAgICAgICAgICByZXR1cm4gZm5zLmxlbmd0aCA9PT0gMTAgPyBmbiA6IGNvbXAoZm4sIC4uLmZucy5zbGljZSgxMCkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNvbXBMKC4uLmZucykge1xuICAgIHJldHVybiBjb21wLmFwcGx5KG51bGwsIGZucy5yZXZlcnNlKCkpO1xufVxuY29uc3QgY29tcEkgPSBjb21wTDtcblxuZnVuY3Rpb24gY29tcGxlbWVudChmKSB7XG4gICAgcmV0dXJuICguLi54cykgPT4gIWYoLi4ueHMpO1xufVxuXG5jb25zdCBjb25zdGFudGx5ID0gKHgpID0+ICgpID0+IHg7XG5cbmNvbnN0IGRlbGF5ID0gKGJvZHkpID0+IG5ldyBEZWxheShib2R5KTtcbmNsYXNzIERlbGF5IHtcbiAgICBjb25zdHJ1Y3Rvcihib2R5KSB7XG4gICAgICAgIHRoaXMuYm9keSA9IGJvZHk7XG4gICAgICAgIHRoaXMucmVhbGl6ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgZGVyZWYoKSB7XG4gICAgICAgIGlmICghdGhpcy5yZWFsaXplZCkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuYm9keSgpO1xuICAgICAgICAgICAgdGhpcy5yZWFsaXplZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxuICAgIGlzUmVhbGl6ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWxpemVkO1xuICAgIH1cbn1cblxuY29uc3QgZGVsYXllZCA9ICh4LCB0KSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKHgpLCB0KSk7XG5cbmNvbnN0IGlkZW50aXR5ID0gKHgpID0+IHg7XG5cbmNvbnN0IGlmRGVmID0gKGYsIHgpID0+IHggIT0gbnVsbCA/IGYoeCkgOiB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGp1eHQoLi4uZm5zKSB7XG4gICAgY29uc3QgW2EsIGIsIGMsIGQsIGUsIGYsIGcsIGhdID0gZm5zO1xuICAgIHN3aXRjaCAoZm5zLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFthKHgpXTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KSwgYih4KV07XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW2EoeCksIGIoeCksIGMoeCldO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFthKHgpLCBiKHgpLCBjKHgpLCBkKHgpXTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KSwgYih4KSwgYyh4KSwgZCh4KSwgZSh4KV07XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4gW2EoeCksIGIoeCksIGMoeCksIGQoeCksIGUoeCksIGYoeCldO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IFthKHgpLCBiKHgpLCBjKHgpLCBkKHgpLCBlKHgpLCBmKHgpLCBnKHgpXTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiBbYSh4KSwgYih4KSwgYyh4KSwgZCh4KSwgZSh4KSwgZih4KSwgZyh4KSwgaCh4KV07XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVzID0gbmV3IEFycmF5KGZucy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBmbnMubGVuZ3RoOyAtLWkgPj0gMDspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzW2ldID0gZm5zW2ldKHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcnRpYWwoZm4sIC4uLmFyZ3MpIHtcbiAgICBsZXQgW2EsIGIsIGMsIGQsIGUsIGYsIGcsIGhdID0gYXJncztcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIC4uLnhzKTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gZm4oYSwgYiwgLi4ueHMpO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBmbihhLCBiLCBjLCAuLi54cyk7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIGIsIGMsIGQsIC4uLnhzKTtcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gZm4oYSwgYiwgYywgZCwgZSwgLi4ueHMpO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICByZXR1cm4gKC4uLnhzKSA9PiBmbihhLCBiLCBjLCBkLCBlLCBmLCAuLi54cyk7XG4gICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHJldHVybiAoLi4ueHMpID0+IGZuKGEsIGIsIGMsIGQsIGUsIGYsIGcsIC4uLnhzKTtcbiAgICAgICAgY2FzZSA4OlxuICAgICAgICAgICAgcmV0dXJuICguLi54cykgPT4gZm4oYSwgYiwgYywgZCwgZSwgZiwgZywgaCwgLi4ueHMpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZXJyb3JzLmlsbGVnYWxBcmdzKCk7XG4gICAgfVxufVxuXG5jb25zdCBwcm9taXNpZnkgPSAoZm4pID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IGZuKChlcnIsIHJlc3VsdCkgPT4gKGVyciAhPSBudWxsID8gcmVqZWN0KGVycikgOiByZXNvbHZlKHJlc3VsdCkpKSk7XG5cbmNvbnN0IHRocmVhZEZpcnN0ID0gKGluaXQsIC4uLmZucykgPT4gZm5zLnJlZHVjZSgoYWNjLCBleHByKSA9PiB0eXBlb2YgZXhwciA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBleHByKGFjYylcbiAgICA6IGV4cHJbMF0oYWNjLCAuLi5leHByLnNsaWNlKDEpKSwgaW5pdCk7XG5cbmNvbnN0IHRocmVhZExhc3QgPSAoaW5pdCwgLi4uZm5zKSA9PiBmbnMucmVkdWNlKChhY2MsIGV4cHIpID0+IHR5cGVvZiBleHByID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IGV4cHIoYWNjKVxuICAgIDogZXhwclswXSguLi5leHByLnNsaWNlKDEpLCBhY2MpLCBpbml0KTtcblxuY29uc3QgdHJhbXBvbGluZSA9IChmKSA9PiB7XG4gICAgd2hpbGUgKHR5cGVvZiBmID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZiA9IGYoKTtcbiAgICB9XG4gICAgcmV0dXJuIGY7XG59O1xuXG5leHBvcnRzLkRlbGF5ID0gRGVsYXk7XG5leHBvcnRzLmNvbXAgPSBjb21wO1xuZXhwb3J0cy5jb21wSSA9IGNvbXBJO1xuZXhwb3J0cy5jb21wTCA9IGNvbXBMO1xuZXhwb3J0cy5jb21wbGVtZW50ID0gY29tcGxlbWVudDtcbmV4cG9ydHMuY29uc3RhbnRseSA9IGNvbnN0YW50bHk7XG5leHBvcnRzLmRlbGF5ID0gZGVsYXk7XG5leHBvcnRzLmRlbGF5ZWQgPSBkZWxheWVkO1xuZXhwb3J0cy5pZGVudGl0eSA9IGlkZW50aXR5O1xuZXhwb3J0cy5pZkRlZiA9IGlmRGVmO1xuZXhwb3J0cy5qdXh0ID0ganV4dDtcbmV4cG9ydHMucGFydGlhbCA9IHBhcnRpYWw7XG5leHBvcnRzLnByb21pc2lmeSA9IHByb21pc2lmeTtcbmV4cG9ydHMudGhyZWFkRmlyc3QgPSB0aHJlYWRGaXJzdDtcbmV4cG9ydHMudGhyZWFkTGFzdCA9IHRocmVhZExhc3Q7XG5leHBvcnRzLnRyYW1wb2xpbmUgPSB0cmFtcG9saW5lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBPQkpQID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHt9KTtcbmNvbnN0IEZOID0gXCJmdW5jdGlvblwiO1xuY29uc3QgU1RSID0gXCJzdHJpbmdcIjtcbmNvbnN0IGVxdWl2ID0gKGEsIGIpID0+IHtcbiAgICBsZXQgcHJvdG87XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhLmVxdWl2ID09PSBGTikge1xuICAgICAgICAgICAgcmV0dXJuIGEuZXF1aXYoYik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBhID09IGI7XG4gICAgfVxuICAgIGlmIChiICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBiLmVxdWl2ID09PSBGTikge1xuICAgICAgICAgICAgcmV0dXJuIGIuZXF1aXYoYSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBhID09IGI7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSA9PT0gU1RSIHx8IHR5cGVvZiBiID09PSBTVFIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoKChwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSksIHByb3RvID09IG51bGwgfHwgcHJvdG8gPT09IE9CSlApICYmXG4gICAgICAgICgocHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpLCBwcm90byA9PSBudWxsIHx8IHByb3RvID09PSBPQkpQKSkge1xuICAgICAgICByZXR1cm4gZXF1aXZPYmplY3QoYSwgYik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPT0gRk4gJiZcbiAgICAgICAgYS5sZW5ndGggIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICB0eXBlb2YgYiAhPT0gRk4gJiZcbiAgICAgICAgYi5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gZXF1aXZBcnJheUxpa2UoYSwgYik7XG4gICAgfVxuICAgIGlmIChhIGluc3RhbmNlb2YgU2V0ICYmIGIgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgcmV0dXJuIGVxdWl2U2V0KGEsIGIpO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIE1hcCAmJiBiIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICAgIHJldHVybiBlcXVpdk1hcChhLCBiKTtcbiAgICB9XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIHJldHVybiBhLmdldFRpbWUoKSA9PT0gYi5nZXRUaW1lKCk7XG4gICAgfVxuICAgIGlmIChhIGluc3RhbmNlb2YgUmVnRXhwICYmIGIgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgcmV0dXJuIGEudG9TdHJpbmcoKSA9PT0gYi50b1N0cmluZygpO1xuICAgIH1cbiAgICByZXR1cm4gYSAhPT0gYSAmJiBiICE9PSBiO1xufTtcbmNvbnN0IGVxdWl2QXJyYXlMaWtlID0gKGEsIGIsIF9lcXVpdiA9IGVxdWl2KSA9PiB7XG4gICAgbGV0IGwgPSBhLmxlbmd0aDtcbiAgICBpZiAobCA9PT0gYi5sZW5ndGgpIHtcbiAgICAgICAgd2hpbGUgKC0tbCA+PSAwICYmIF9lcXVpdihhW2xdLCBiW2xdKSlcbiAgICAgICAgICAgIDtcbiAgICB9XG4gICAgcmV0dXJuIGwgPCAwO1xufTtcbmNvbnN0IGVxdWl2U2V0ID0gKGEsIGIsIF9lcXVpdiA9IGVxdWl2KSA9PiBhLnNpemUgPT09IGIuc2l6ZSAmJiBfZXF1aXYoWy4uLmEua2V5cygpXS5zb3J0KCksIFsuLi5iLmtleXMoKV0uc29ydCgpKTtcbmNvbnN0IGVxdWl2TWFwID0gKGEsIGIsIF9lcXVpdiA9IGVxdWl2KSA9PiBhLnNpemUgPT09IGIuc2l6ZSAmJiBfZXF1aXYoWy4uLmFdLnNvcnQoKSwgWy4uLmJdLnNvcnQoKSk7XG5jb25zdCBlcXVpdk9iamVjdCA9IChhLCBiLCBfZXF1aXYgPSBlcXVpdikgPT4ge1xuICAgIGlmIChPYmplY3Qua2V5cyhhKS5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIpLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAobGV0IGsgaW4gYSkge1xuICAgICAgICBpZiAoIWIuaGFzT3duUHJvcGVydHkoaykgfHwgIV9lcXVpdihhW2tdLCBiW2tdKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy5lcXVpdiA9IGVxdWl2O1xuZXhwb3J0cy5lcXVpdkFycmF5TGlrZSA9IGVxdWl2QXJyYXlMaWtlO1xuZXhwb3J0cy5lcXVpdk1hcCA9IGVxdWl2TWFwO1xuZXhwb3J0cy5lcXVpdk9iamVjdCA9IGVxdWl2T2JqZWN0O1xuZXhwb3J0cy5lcXVpdlNldCA9IGVxdWl2U2V0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBkZWZFcnJvciA9IChwcmVmaXgsIHN1ZmZpeCA9IChtc2cpID0+IChtc2cgIT09IHVuZGVmaW5lZCA/IFwiOiBcIiArIG1zZyA6IFwiXCIpKSA9PiBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3Rvcihtc2cpIHtcbiAgICAgICAgc3VwZXIocHJlZml4KG1zZykgKyBzdWZmaXgobXNnKSk7XG4gICAgfVxufTtcblxuY29uc3QgSWxsZWdhbEFyZ3VtZW50RXJyb3IgPSBkZWZFcnJvcigoKSA9PiBcImlsbGVnYWwgYXJndW1lbnQocylcIik7XG5jb25zdCBpbGxlZ2FsQXJncyA9IChtc2cpID0+IHtcbiAgICB0aHJvdyBuZXcgSWxsZWdhbEFyZ3VtZW50RXJyb3IobXNnKTtcbn07XG5cbmNvbnN0IElsbGVnYWxBcml0eUVycm9yID0gZGVmRXJyb3IoKCkgPT4gXCJpbGxlZ2FsIGFyaXR5XCIpO1xuY29uc3QgaWxsZWdhbEFyaXR5ID0gKG4pID0+IHtcbiAgICB0aHJvdyBuZXcgSWxsZWdhbEFyaXR5RXJyb3Iobik7XG59O1xuXG5jb25zdCBJbGxlZ2FsU3RhdGVFcnJvciA9IGRlZkVycm9yKCgpID0+IFwiaWxsZWdhbCBzdGF0ZVwiKTtcbmNvbnN0IGlsbGVnYWxTdGF0ZSA9IChtc2cpID0+IHtcbiAgICB0aHJvdyBuZXcgSWxsZWdhbFN0YXRlRXJyb3IobXNnKTtcbn07XG5cbmNvbnN0IE91dE9mQm91bmRzRXJyb3IgPSBkZWZFcnJvcigoKSA9PiBcImluZGV4IG91dCBvZiBib3VuZHNcIik7XG5jb25zdCBvdXRPZkJvdW5kcyA9IChpbmRleCkgPT4ge1xuICAgIHRocm93IG5ldyBPdXRPZkJvdW5kc0Vycm9yKGluZGV4KTtcbn07XG5jb25zdCBlbnN1cmVJbmRleCA9IChpbmRleCwgbWluLCBtYXgpID0+IChpbmRleCA8IG1pbiB8fCBpbmRleCA+PSBtYXgpICYmIG91dE9mQm91bmRzKGluZGV4KTtcbmNvbnN0IGVuc3VyZUluZGV4MiA9ICh4LCB5LCBtYXhYLCBtYXhZKSA9PiAoeCA8IDAgfHwgeCA+PSBtYXhYIHx8IHkgPCAwIHx8IHkgPj0gbWF4WSkgJiYgb3V0T2ZCb3VuZHMoW3gsIHldKTtcblxuY29uc3QgVW5zdXBwb3J0ZWRPcGVyYXRpb25FcnJvciA9IGRlZkVycm9yKCgpID0+IFwidW5zdXBwb3J0ZWQgb3BlcmF0aW9uXCIpO1xuY29uc3QgdW5zdXBwb3J0ZWQgPSAobXNnKSA9PiB7XG4gICAgdGhyb3cgbmV3IFVuc3VwcG9ydGVkT3BlcmF0aW9uRXJyb3IobXNnKTtcbn07XG5cbmV4cG9ydHMuSWxsZWdhbEFyZ3VtZW50RXJyb3IgPSBJbGxlZ2FsQXJndW1lbnRFcnJvcjtcbmV4cG9ydHMuSWxsZWdhbEFyaXR5RXJyb3IgPSBJbGxlZ2FsQXJpdHlFcnJvcjtcbmV4cG9ydHMuSWxsZWdhbFN0YXRlRXJyb3IgPSBJbGxlZ2FsU3RhdGVFcnJvcjtcbmV4cG9ydHMuT3V0T2ZCb3VuZHNFcnJvciA9IE91dE9mQm91bmRzRXJyb3I7XG5leHBvcnRzLlVuc3VwcG9ydGVkT3BlcmF0aW9uRXJyb3IgPSBVbnN1cHBvcnRlZE9wZXJhdGlvbkVycm9yO1xuZXhwb3J0cy5kZWZFcnJvciA9IGRlZkVycm9yO1xuZXhwb3J0cy5lbnN1cmVJbmRleCA9IGVuc3VyZUluZGV4O1xuZXhwb3J0cy5lbnN1cmVJbmRleDIgPSBlbnN1cmVJbmRleDI7XG5leHBvcnRzLmlsbGVnYWxBcmdzID0gaWxsZWdhbEFyZ3M7XG5leHBvcnRzLmlsbGVnYWxBcml0eSA9IGlsbGVnYWxBcml0eTtcbmV4cG9ydHMuaWxsZWdhbFN0YXRlID0gaWxsZWdhbFN0YXRlO1xuZXhwb3J0cy5vdXRPZkJvdW5kcyA9IG91dE9mQm91bmRzO1xuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5jb25zdCBQMzIgPSAweDEwMDAwMDAwMDtcbmNvbnN0IEhFWCA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuY29uc3QgVTQgPSAoeCkgPT4gSEVYW3ggJiAweGZdO1xuY29uc3QgVTggPSAoeCkgPT4gSEVYWyh4ID4+PiA0KSAmIDB4Zl0gKyBIRVhbeCAmIDB4Zl07XG5jb25zdCBVOEEgPSAoeCwgaSkgPT4gVTgoeFtpXSk7XG5jb25zdCBVMTYgPSAoeCkgPT4gVTgoeCA+Pj4gOCkgKyBVOCh4ICYgMHhmZik7XG5jb25zdCBVMTZCRSA9ICh4LCBpKSA9PiBVOCh4W2ldKSArIFU4KHhbaSArIDFdKTtcbmNvbnN0IFUxNkxFID0gKHgsIGkpID0+IFU4KHhbaSArIDFdKSArIFU4KHhbaV0pO1xuY29uc3QgVTI0ID0gKHgpID0+IFU4KHggPj4+IDE2KSArIFUxNih4KTtcbmNvbnN0IFUyNEJFID0gKHgsIGkpID0+IFU4KHhbaV0pICsgVTE2QkUoeCwgaSArIDEpO1xuY29uc3QgVTI0TEUgPSAoeCwgaSkgPT4gVTgoeFtpICsgMl0pICsgVTE2TEUoeCwgaSk7XG5jb25zdCBVMzIgPSAoeCkgPT4gVTE2KHggPj4+IDE2KSArIFUxNih4KTtcbmNvbnN0IFUzMkJFID0gKHgsIGkpID0+IFUxNkJFKHgsIGkpICsgVTE2QkUoeCwgaSArIDIpO1xuY29uc3QgVTMyTEUgPSAoeCwgaSkgPT4gVTE2TEUoeCwgaSArIDIpICsgVTE2TEUoeCwgaSk7XG5jb25zdCBVNDggPSAoeCkgPT4gVTQ4SEwoeCAvIFAzMiwgeCAlIFAzMik7XG5jb25zdCBVNDhITCA9IChoaSwgbG8pID0+IFUxNihoaSkgKyBVMzIobG8pO1xuY29uc3QgVTQ4QkUgPSAoeCwgaSkgPT4gVTE2QkUoeCwgaSkgKyBVMzJCRSh4LCBpICsgMik7XG5jb25zdCBVNDhMRSA9ICh4LCBpKSA9PiBVMTZMRSh4LCBpICsgNCkgKyBVMzJMRSh4LCBpKTtcbmNvbnN0IFU2NCA9ICh4KSA9PiBVNjRITCh4IC8gUDMyLCB4ICUgUDMyKTtcbmNvbnN0IFU2NEhMID0gKGhpLCBsbykgPT4gVTMyKGhpKSArIFUzMihsbyk7XG5jb25zdCBVNjRCRSA9ICh4LCBpKSA9PiBVMzJCRSh4LCBpKSArIFUzMkJFKHgsIGkgKyA0KTtcbmNvbnN0IFU2NExFID0gKHgsIGkpID0+IFUzMkxFKHgsIGkgKyA0KSArIFUzMkxFKHgsIGkpO1xuY29uc3QgdXVpZCA9IChpZCwgaSA9IDApID0+XG5gJHtVMzJCRShpZCwgaSl9LSR7VTE2QkUoaWQsIGkgKyA0KX0tJHtVMTZCRShpZCwgaSArIDYpfS0ke1UxNkJFKGlkLCBpICsgOCl9LSR7VTQ4QkUoaWQsIGkgKyAxMCl9YDtcblxuZXhwb3J0cy5IRVggPSBIRVg7XG5leHBvcnRzLlUxNiA9IFUxNjtcbmV4cG9ydHMuVTE2QkUgPSBVMTZCRTtcbmV4cG9ydHMuVTE2TEUgPSBVMTZMRTtcbmV4cG9ydHMuVTI0ID0gVTI0O1xuZXhwb3J0cy5VMjRCRSA9IFUyNEJFO1xuZXhwb3J0cy5VMjRMRSA9IFUyNExFO1xuZXhwb3J0cy5VMzIgPSBVMzI7XG5leHBvcnRzLlUzMkJFID0gVTMyQkU7XG5leHBvcnRzLlUzMkxFID0gVTMyTEU7XG5leHBvcnRzLlU0ID0gVTQ7XG5leHBvcnRzLlU0OCA9IFU0ODtcbmV4cG9ydHMuVTQ4QkUgPSBVNDhCRTtcbmV4cG9ydHMuVTQ4SEwgPSBVNDhITDtcbmV4cG9ydHMuVTQ4TEUgPSBVNDhMRTtcbmV4cG9ydHMuVTY0ID0gVTY0O1xuZXhwb3J0cy5VNjRCRSA9IFU2NEJFO1xuZXhwb3J0cy5VNjRITCA9IFU2NEhMO1xuZXhwb3J0cy5VNjRMRSA9IFU2NExFO1xuZXhwb3J0cy5VOCA9IFU4O1xuZXhwb3J0cy5VOEEgPSBVOEE7XG5leHBvcnRzLnV1aWQgPSB1dWlkO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgY2hlY2tzID0gcmVxdWlyZSgnQHRoaS5uZy9jaGVja3MnKTtcbnZhciBlcnJvcnMgPSByZXF1aXJlKCdAdGhpLm5nL2Vycm9ycycpO1xudmFyIHRyYW5zZHVjZXJzQmluYXJ5ID0gcmVxdWlyZSgnQHRoaS5uZy90cmFuc2R1Y2Vycy1iaW5hcnknKTtcblxuY29uc3QgQklOQVJZID0gXCJBR0Z6YlFFQUFBQUJEUU5nQVh3QmYyQUFBWHhnQUFBREJnVUNBQUVBQVFVREFRQUNCaW9IZndCQmdBZ0xmd0JCZ0FnTGZ3QkJpZ2dMZndCQmdBZ0xmd0JCa0lnRUMzOEFRUUFMZndCQkFRc0gwUUVOQm0xbGJXOXllUUlBRVY5ZmQyRnpiVjlqWVd4c1gyTjBiM0p6QUFBU2JHVmlNVEk0WDJWdVkyOWtaVjkxWDJwekFBRURZblZtQXdBU2JHVmlNVEk0WDJSbFkyOWtaVjkxWDJwekFBSVNiR1ZpTVRJNFgyVnVZMjlrWlY5elgycHpBQU1TYkdWaU1USTRYMlJsWTI5a1pWOXpYMnB6QUFRTVgxOWtjMjlmYUdGdVpHeGxBd0VLWDE5a1lYUmhYMlZ1WkFNQ0RWOWZaMnh2WW1Gc1gySmhjMlVEQXd0ZlgyaGxZWEJmWW1GelpRTUVEVjlmYldWdGIzSjVYMkpoYzJVREJReGZYM1JoWW14bFgySmhjMlVEQmdxV0JBVURBQUVMZWdJQ2Z3RitBa0FDZmlBQVJBQUFBQUFBQVBCRFl5QUFSQUFBQUFBQUFBQUFabkVFUUNBQXNRd0JDMElBQ3lJRFFvQUJXZ1JBQTBBZ0FVR0FDR29nQTZkQi93QnhJQU5DQjRnaUEwSUFVaUlDUVFkMGNqb0FBQ0FCUVFGcUlRRWdBZzBBQ3d3QkMwR0FDQ0FEUEFBQVFRRWhBUXNnQVVIL0FYRUxXd0lEZndKK1FYWWhBQU5BQWtBZ0FFVUVRRUVLSVFFTUFRc2dBVUVCYWlFQklBQkJpZ2hxTEFBQUlnSkIvd0J4clNBRGhpQUVoQ0VFSUFCQkFXb2hBQ0FEUWdkOElRTWdBa0VBU0EwQkN3dEJnQWdnQVRvQUFDQUV1Z3U3QVFJQmZnUi9Ba0FDZmlBQW1VUUFBQUFBQUFEZ1EyTUVRQ0FBc0F3QkMwS0FnSUNBZ0lDQWdJQi9DeUlCUWtCOVFvQUJXZ1JBUVFFaEF3TkFJQU5GRFFJZ0FhY2lBMEhBQUhFaEJBSi9RZ0VnQVVJSGh5SUJJQVFiVUVVRVFDQURRWUIvY2lFRlFRRWdCRVVnQVVKL1VuSU5BUm9MSUFOQi93QnhJUVZCQUFzaEF5QUNRWUFJYWlBRk9nQUFJQUpCQVdvaEFnd0FDd0FMUVlBSUlBRkNPWWluUWNBQWNTQUJwMEUvY1hJNkFBQkJBU0VDQ3lBQ1FmOEJjUXQ4QWdOL0EzNUJmeUVBQTBBQ1FDQURRZ2Q4SVFVZ0FFR0JDR290QUFBaUFrRVlkRUVZZFNFQklBSkIvd0J4clNBRGhpQUVoQ0VFSUFCQkFXb2lBRUVJU3cwQUlBVWhBeUFCUVFCSURRRUxDMEdBQ0NBQVFRRnFPZ0FBSUFSQ2Z5QUZoa0lBSUFGQndBQnhRUVoyRzBJQUlBQkIvd0Z4UVFsSkc0UzVDd0FhQ1hCeWIyUjFZMlZ5Y3dFSWJHRnVaM1ZoWjJVQkEwTTVPUUE9XCI7XG5cbmxldCB3YXNtO1xubGV0IFU4O1xuaWYgKGNoZWNrcy5oYXNXQVNNKCkpIHtcbiAgICBjb25zdCBpbnN0ID0gbmV3IFdlYkFzc2VtYmx5Lkluc3RhbmNlKG5ldyBXZWJBc3NlbWJseS5Nb2R1bGUobmV3IFVpbnQ4QXJyYXkoWy4uLnRyYW5zZHVjZXJzQmluYXJ5LmJhc2U2NERlY29kZShCSU5BUlkpXSkpKTtcbiAgICB3YXNtID0gaW5zdC5leHBvcnRzO1xuICAgIFU4ID0gbmV3IFVpbnQ4QXJyYXkod2FzbS5tZW1vcnkuYnVmZmVyLCB3YXNtLmJ1ZiwgMTYpO1xufVxuY29uc3QgZW5zdXJlV0FTTSA9ICgpID0+ICF3YXNtICYmIGVycm9ycy51bnN1cHBvcnRlZChcIldBU00gbW9kdWxlIHVuYXZhaWxhYmxlXCIpO1xuY29uc3QgZW5jb2RlID0gKG9wKSA9PiAoeCkgPT4ge1xuICAgIGVuc3VyZVdBU00oKTtcbiAgICByZXR1cm4gVTguc2xpY2UoMCwgd2FzbVtvcF0oeCkpO1xufTtcbmNvbnN0IGRlY29kZSA9IChvcCkgPT4gKHNyYywgaWR4ID0gMCkgPT4ge1xuICAgIGVuc3VyZVdBU00oKTtcbiAgICBVOC5zZXQoc3JjLnN1YmFycmF5KGlkeCwgTWF0aC5taW4oaWR4ICsgMTAsIHNyYy5sZW5ndGgpKSwgMCk7XG4gICAgcmV0dXJuIFt3YXNtW29wXSgwLCAwKSwgVThbMF1dO1xufTtcbmNvbnN0IGVuY29kZVNMRUIxMjggPSBlbmNvZGUoXCJsZWIxMjhfZW5jb2RlX3NfanNcIik7XG5jb25zdCBkZWNvZGVTTEVCMTI4ID0gZGVjb2RlKFwibGViMTI4X2RlY29kZV9zX2pzXCIpO1xuY29uc3QgZW5jb2RlVUxFQjEyOCA9IGVuY29kZShcImxlYjEyOF9lbmNvZGVfdV9qc1wiKTtcbmNvbnN0IGRlY29kZVVMRUIxMjggPSBkZWNvZGUoXCJsZWIxMjhfZGVjb2RlX3VfanNcIik7XG5cbmV4cG9ydHMuZGVjb2RlU0xFQjEyOCA9IGRlY29kZVNMRUIxMjg7XG5leHBvcnRzLmRlY29kZVVMRUIxMjggPSBkZWNvZGVVTEVCMTI4O1xuZXhwb3J0cy5lbmNvZGVTTEVCMTI4ID0gZW5jb2RlU0xFQjEyODtcbmV4cG9ydHMuZW5jb2RlVUxFQjEyOCA9IGVuY29kZVVMRUIxMjg7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbmNvbnN0IFBJID0gTWF0aC5QSTtcbmNvbnN0IFRBVSA9IFBJICogMjtcbmNvbnN0IEhBTEZfUEkgPSBQSSAvIDI7XG5jb25zdCBUSElSRF9QSSA9IFBJIC8gMztcbmNvbnN0IFFVQVJURVJfUEkgPSBQSSAvIDQ7XG5jb25zdCBTSVhUSF9QSSA9IFBJIC8gNjtcbmNvbnN0IElOVl9QSSA9IDEgLyBQSTtcbmNvbnN0IElOVl9UQVUgPSAxIC8gVEFVO1xuY29uc3QgSU5WX0hBTEZfUEkgPSAxIC8gSEFMRl9QSTtcbmNvbnN0IERFRzJSQUQgPSBQSSAvIDE4MDtcbmNvbnN0IFJBRDJERUcgPSAxODAgLyBQSTtcbmNvbnN0IFBISSA9ICgxICsgTWF0aC5zcXJ0KDUpKSAvIDI7XG5jb25zdCBTUVJUMiA9IE1hdGguU1FSVDI7XG5jb25zdCBTUVJUMyA9IE1hdGguc3FydCgzKTtcbmNvbnN0IFNRUlQyXzIgPSBTUVJUMiAvIDI7XG5jb25zdCBTUVJUMl8zID0gU1FSVDMgLyAyO1xuY29uc3QgVEhJUkQgPSAxIC8gMztcbmNvbnN0IFRXT19USElSRCA9IDIgLyAzO1xuY29uc3QgU0lYVEggPSAxIC8gNjtcbmxldCBFUFMgPSAxZS02O1xuXG5jb25zdCBhYnNEaWZmID0gKHgsIHkpID0+IE1hdGguYWJzKHggLSB5KTtcbmNvbnN0IHNpZ24gPSAoeCwgZXBzID0gRVBTKSA9PiAoeCA+IGVwcyA/IDEgOiB4IDwgLWVwcyA/IC0xIDogMCk7XG5cbmNvbnN0IHNpbmNvcyA9ICh0aGV0YSwgbiA9IDEpID0+IFtcbiAgICBNYXRoLnNpbih0aGV0YSkgKiBuLFxuICAgIE1hdGguY29zKHRoZXRhKSAqIG4sXG5dO1xuY29uc3QgY29zc2luID0gKHRoZXRhLCBuID0gMSkgPT4gW1xuICAgIE1hdGguY29zKHRoZXRhKSAqIG4sXG4gICAgTWF0aC5zaW4odGhldGEpICogbixcbl07XG5jb25zdCBhYnNUaGV0YSA9ICh0aGV0YSkgPT4gKCh0aGV0YSAlPSBUQVUpLCB0aGV0YSA8IDAgPyBUQVUgKyB0aGV0YSA6IHRoZXRhKTtcbmNvbnN0IGFic0lubmVyQW5nbGUgPSAodGhldGEpID0+ICgodGhldGEgPSBNYXRoLmFicyh0aGV0YSkpLCB0aGV0YSA+IFBJID8gVEFVIC0gdGhldGEgOiB0aGV0YSk7XG5jb25zdCBhbmdsZURpc3QgPSAoYSwgYikgPT4gYWJzSW5uZXJBbmdsZShhYnNUaGV0YSgoYiAlIFRBVSkgLSAoYSAlIFRBVSkpKTtcbmNvbnN0IGF0YW4yQWJzID0gKHksIHgpID0+IGFic1RoZXRhKE1hdGguYXRhbjIoeSwgeCkpO1xuY29uc3QgcXVhZHJhbnQgPSAodGhldGEpID0+IChhYnNUaGV0YSh0aGV0YSkgKiBJTlZfSEFMRl9QSSkgfCAwO1xuY29uc3QgZGVnID0gKHRoZXRhKSA9PiB0aGV0YSAqIFJBRDJERUc7XG5jb25zdCByYWQgPSAodGhldGEpID0+IHRoZXRhICogREVHMlJBRDtcbmNvbnN0IGNzYyA9ICh0aGV0YSkgPT4gMSAvIE1hdGguc2luKHRoZXRhKTtcbmNvbnN0IHNlYyA9ICh0aGV0YSkgPT4gMSAvIE1hdGguY29zKHRoZXRhKTtcbmNvbnN0IGNvdCA9ICh0aGV0YSkgPT4gMSAvIE1hdGgudGFuKHRoZXRhKTtcbmNvbnN0IGxvYyA9IChhLCBiLCBnYW1tYSkgPT4gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIgLSAyICogYSAqIGIgKiBNYXRoLmNvcyhnYW1tYSkpO1xuY29uc3Qgbm9ybUNvcyA9ICh4KSA9PiB7XG4gICAgY29uc3QgeDIgPSB4ICogeDtcbiAgICByZXR1cm4gMS4wICsgeDIgKiAoLTQgKyAyICogeDIpO1xufTtcbmNvbnN0IF9fZmFzdENvcyA9ICh4KSA9PiB7XG4gICAgY29uc3QgeDIgPSB4ICogeDtcbiAgICByZXR1cm4gMC45OTk0MDMwNyArIHgyICogKC0wLjQ5NTU4MDcyICsgMC4wMzY3OTE2OCAqIHgyKTtcbn07XG5jb25zdCBmYXN0Q29zID0gKHRoZXRhKSA9PiB7XG4gICAgdGhldGEgJT0gVEFVO1xuICAgIHRoZXRhIDwgMCAmJiAodGhldGEgPSAtdGhldGEpO1xuICAgIHN3aXRjaCAoKHRoZXRhICogSU5WX0hBTEZfUEkpIHwgMCkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICByZXR1cm4gX19mYXN0Q29zKHRoZXRhKTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuIC1fX2Zhc3RDb3MoUEkgLSB0aGV0YSk7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHJldHVybiAtX19mYXN0Q29zKHRoZXRhIC0gUEkpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIF9fZmFzdENvcyhUQVUgLSB0aGV0YSk7XG4gICAgfVxufTtcbmNvbnN0IGZhc3RTaW4gPSAodGhldGEpID0+IGZhc3RDb3MoSEFMRl9QSSAtIHRoZXRhKTtcblxuY29uc3QgYWJzID0gTWF0aC5hYnM7XG5jb25zdCBtYXggPSBNYXRoLm1heDtcbmNvbnN0IGVxRGVsdGEgPSAoYSwgYiwgZXBzID0gRVBTKSA9PiBhYnMoYSAtIGIpIDw9IGVwcztcbmNvbnN0IGVxRGVsdGFTY2FsZWQgPSAoYSwgYiwgZXBzID0gRVBTKSA9PiBhYnMoYSAtIGIpIDw9IGVwcyAqIG1heCgxLCBhYnMoYSksIGFicyhiKSk7XG5cbmNvbnN0IGlzQ3Jvc3NPdmVyID0gKGExLCBhMiwgYjEsIGIyKSA9PiBhMSA8IGIxICYmIGEyID4gYjI7XG5jb25zdCBpc0Nyb3NzVW5kZXIgPSAoYTEsIGEyLCBiMSwgYjIpID0+IGExID4gYjEgJiYgYTIgPCBiMjtcbmNvbnN0IGNsYXNzaWZ5Q3Jvc3NpbmcgPSAoYTEsIGEyLCBiMSwgYjIsIGVwcyA9IEVQUykgPT4gZXFEZWx0YShhMSwgYjEsIGVwcykgJiYgZXFEZWx0YShhMiwgYjIsIGVwcylcbiAgICA/IGVxRGVsdGEoYTEsIGIyLCBlcHMpXG4gICAgICAgID8gXCJmbGF0XCJcbiAgICAgICAgOiBcImVxdWFsXCJcbiAgICA6IGlzQ3Jvc3NPdmVyKGExLCBhMiwgYjEsIGIyKVxuICAgICAgICA/IFwib3ZlclwiXG4gICAgICAgIDogaXNDcm9zc1VuZGVyKGExLCBhMiwgYjEsIGIyKVxuICAgICAgICAgICAgPyBcInVuZGVyXCJcbiAgICAgICAgICAgIDogXCJvdGhlclwiO1xuXG5jb25zdCBpc01pbmltYSA9IChhLCBiLCBjKSA9PiBhID4gYiAmJiBiIDwgYztcbmNvbnN0IGlzTWF4aW1hID0gKGEsIGIsIGMpID0+IGEgPCBiICYmIGIgPiBjO1xuY29uc3QgaW5kZXggPSAocHJlZCwgdmFsdWVzLCBmcm9tID0gMCwgdG8gPSB2YWx1ZXMubGVuZ3RoKSA9PiB7XG4gICAgdG8tLTtcbiAgICBmb3IgKGxldCBpID0gZnJvbSArIDE7IGkgPCB0bzsgaSsrKSB7XG4gICAgICAgIGlmIChwcmVkKHZhbHVlc1tpIC0gMV0sIHZhbHVlc1tpXSwgdmFsdWVzW2kgKyAxXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMTtcbn07XG5jb25zdCBtaW5pbWFJbmRleCA9ICh2YWx1ZXMsIGZyb20gPSAwLCB0byA9IHZhbHVlcy5sZW5ndGgpID0+IGluZGV4KGlzTWluaW1hLCB2YWx1ZXMsIGZyb20sIHRvKTtcbmNvbnN0IG1heGltYUluZGV4ID0gKHZhbHVlcywgZnJvbSA9IDAsIHRvID0gdmFsdWVzLmxlbmd0aCkgPT4gaW5kZXgoaXNNYXhpbWEsIHZhbHVlcywgZnJvbSwgdG8pO1xuZnVuY3Rpb24qIGluZGljZXMoZm4sIHZhbHMsIGZyb20gPSAwLCB0byA9IHZhbHMubGVuZ3RoKSB7XG4gICAgd2hpbGUgKGZyb20gPCB0bykge1xuICAgICAgICBjb25zdCBpID0gZm4odmFscywgZnJvbSwgdG8pO1xuICAgICAgICBpZiAoaSA8IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHlpZWxkIGk7XG4gICAgICAgIGZyb20gPSBpICsgMTtcbiAgICB9XG59XG5jb25zdCBtaW5pbWFJbmRpY2VzID0gKHZhbHVlcywgZnJvbSA9IDAsIHRvID0gdmFsdWVzLmxlbmd0aCkgPT4gaW5kaWNlcyhtaW5pbWFJbmRleCwgdmFsdWVzLCBmcm9tLCB0byk7XG5jb25zdCBtYXhpbWFJbmRpY2VzID0gKHZhbHVlcywgZnJvbSA9IDAsIHRvID0gdmFsdWVzLmxlbmd0aCkgPT4gaW5kaWNlcyhtaW5pbWFJbmRleCwgdmFsdWVzLCBmcm9tLCB0byk7XG5cbmNvbnN0IGNsYW1wID0gKHgsIG1pbiwgbWF4KSA9PiAoeCA8IG1pbiA/IG1pbiA6IHggPiBtYXggPyBtYXggOiB4KTtcbmNvbnN0IGNsYW1wMCA9ICh4KSA9PiAoeCA+IDAgPyB4IDogMCk7XG5jb25zdCBjbGFtcDAxID0gKHgpID0+ICh4IDwgMCA/IDAgOiB4ID4gMSA/IDEgOiB4KTtcbmNvbnN0IGNsYW1wMTEgPSAoeCkgPT4gKHggPCAtMSA/IC0xIDogeCA+IDEgPyAxIDogeCk7XG5jb25zdCBjbGFtcDA1ID0gKHgpID0+ICh4IDwgMCA/IDAgOiB4ID4gMC41ID8gMC41IDogeCk7XG5jb25zdCB3cmFwID0gKHgsIG1pbiwgbWF4KSA9PiB7XG4gICAgaWYgKG1pbiA9PT0gbWF4KVxuICAgICAgICByZXR1cm4gbWluO1xuICAgIGlmICh4ID4gbWF4KSB7XG4gICAgICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgICAgIHggLT0gZDtcbiAgICAgICAgaWYgKHggPiBtYXgpXG4gICAgICAgICAgICB4IC09IGQgKiAoKCh4IC0gbWluKSAvIGQpIHwgMCk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHggPCBtaW4pIHtcbiAgICAgICAgY29uc3QgZCA9IG1heCAtIG1pbjtcbiAgICAgICAgeCArPSBkO1xuICAgICAgICBpZiAoeCA8IG1pbilcbiAgICAgICAgICAgIHggKz0gZCAqICgoKG1pbiAtIHgpIC8gZCArIDEpIHwgMCk7XG4gICAgfVxuICAgIHJldHVybiB4O1xufTtcbmNvbnN0IHdyYXBPbmNlID0gKHgsIG1pbiwgbWF4KSA9PiB4IDwgbWluID8geCAtIG1pbiArIG1heCA6IHggPiBtYXggPyB4IC0gbWF4ICsgbWluIDogeDtcbmNvbnN0IHdyYXAwMSA9ICh4KSA9PiAoeCA8IDAgPyB4ICsgMSA6IHggPiAxID8geCAtIDEgOiB4KTtcbmNvbnN0IHdyYXAxMSA9ICh4KSA9PiAoeCA8IC0xID8geCArIDIgOiB4ID4gMSA/IHggLSAyIDogeCk7XG5jb25zdCBtaW4yaWQgPSAoYSwgYikgPT4gKGEgPD0gYiA/IDAgOiAxKTtcbmNvbnN0IG1pbjNpZCA9IChhLCBiLCBjKSA9PiBhIDw9IGIgPyAoYSA8PSBjID8gMCA6IDIpIDogYiA8PSBjID8gMSA6IDI7XG5jb25zdCBtaW40aWQgPSAoYSwgYiwgYywgZCkgPT4gYSA8PSBiXG4gICAgPyBhIDw9IGNcbiAgICAgICAgPyBhIDw9IGRcbiAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgOiAzXG4gICAgICAgIDogYyA8PSBkXG4gICAgICAgICAgICA/IDJcbiAgICAgICAgICAgIDogM1xuICAgIDogYiA8PSBjXG4gICAgICAgID8gYiA8PSBkXG4gICAgICAgICAgICA/IDFcbiAgICAgICAgICAgIDogM1xuICAgICAgICA6IGMgPD0gZFxuICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICA6IDM7XG5jb25zdCBtYXgyaWQgPSAoYSwgYikgPT4gKGEgPj0gYiA/IDAgOiAxKTtcbmNvbnN0IG1heDNpZCA9IChhLCBiLCBjKSA9PiBhID49IGIgPyAoYSA+PSBjID8gMCA6IDIpIDogYiA+PSBjID8gMSA6IDI7XG5jb25zdCBtYXg0aWQgPSAoYSwgYiwgYywgZCkgPT4gYSA+PSBiXG4gICAgPyBhID49IGNcbiAgICAgICAgPyBhID49IGRcbiAgICAgICAgICAgID8gMFxuICAgICAgICAgICAgOiAzXG4gICAgICAgIDogYyA+PSBkXG4gICAgICAgICAgICA/IDJcbiAgICAgICAgICAgIDogM1xuICAgIDogYiA+PSBjXG4gICAgICAgID8gYiA+PSBkXG4gICAgICAgICAgICA/IDFcbiAgICAgICAgICAgIDogM1xuICAgICAgICA6IGMgPj0gZFxuICAgICAgICAgICAgPyAyXG4gICAgICAgICAgICA6IDM7XG5jb25zdCBtaW5Ob25aZXJvMiA9IChhLCBiKSA9PiBhICE9PSAwID8gKGIgIT09IDAgPyBNYXRoLm1pbihhLCBiKSA6IGEpIDogYjtcbmNvbnN0IG1pbk5vblplcm8zID0gKGEsIGIsIGMpID0+IG1pbk5vblplcm8yKG1pbk5vblplcm8yKGEsIGIpLCBjKTtcbmNvbnN0IHNtaW4gPSAoYSwgYiwgaykgPT4gc21heChhLCBiLCAtayk7XG5jb25zdCBzbWF4ID0gKGEsIGIsIGspID0+IHtcbiAgICBjb25zdCBlYSA9IE1hdGguZXhwKGEgKiBrKTtcbiAgICBjb25zdCBlYiA9IE1hdGguZXhwKGIgKiBrKTtcbiAgICByZXR1cm4gKGEgKiBlYSArIGIgKiBlYikgLyAoZWEgKyBlYik7XG59O1xuY29uc3Qgc2NsYW1wID0gKHgsIG1pbiwgbWF4LCBrKSA9PiBzbWluKHNtYXgoeCwgbWluLCBrKSwgbWF4LCBrKTtcbmNvbnN0IGFic01pbiA9IChhLCBiKSA9PiAoTWF0aC5hYnMoYSkgPCBNYXRoLmFicyhiKSA/IGEgOiBiKTtcbmNvbnN0IGFic01heCA9IChhLCBiKSA9PiAoTWF0aC5hYnMoYSkgPiBNYXRoLmFicyhiKSA/IGEgOiBiKTtcbmNvbnN0IGZvbGRiYWNrID0gKGUsIHgpID0+IHggPCAtZSB8fCB4ID4gZSA/IE1hdGguYWJzKE1hdGguYWJzKCh4IC0gZSkgJSAoNCAqIGUpKSAtIDIgKiBlKSAtIGUgOiB4O1xuY29uc3QgaW5SYW5nZSA9ICh4LCBtaW4sIG1heCkgPT4geCA+PSBtaW4gJiYgeCA8PSBtYXg7XG5jb25zdCBpbk9wZW5SYW5nZSA9ICh4LCBtaW4sIG1heCkgPT4geCA+IG1pbiAmJiB4IDwgbWF4O1xuXG5jb25zdCBub3JtID0gKHgsIGEsIGIpID0+IChiICE9PSBhID8gKHggLSBhKSAvIChiIC0gYSkgOiAwKTtcbmNvbnN0IGZpdCA9ICh4LCBhLCBiLCBjLCBkKSA9PiBjICsgKGQgLSBjKSAqIG5vcm0oeCwgYSwgYik7XG5jb25zdCBmaXRDbGFtcGVkID0gKHgsIGEsIGIsIGMsIGQpID0+IGMgKyAoZCAtIGMpICogY2xhbXAwMShub3JtKHgsIGEsIGIpKTtcbmNvbnN0IGZpdDAxID0gKHgsIGEsIGIpID0+IGEgKyAoYiAtIGEpICogY2xhbXAwMSh4KTtcbmNvbnN0IGZpdDEwID0gKHgsIGEsIGIpID0+IGIgKyAoYSAtIGIpICogY2xhbXAwMSh4KTtcbmNvbnN0IGZpdDExID0gKHgsIGEsIGIpID0+IGEgKyAoYiAtIGEpICogKDAuNSArIDAuNSAqIGNsYW1wMTEoeCkpO1xuXG5jb25zdCBNOCA9IDB4ZmY7XG5jb25zdCBNMTYgPSAweGZmZmY7XG5jb25zdCBzaWduRXh0ZW5kOCA9IChhKSA9PiAoKGEgJj0gTTgpLCBhICYgMHg4MCA/IGEgfCB+TTggOiBhKTtcbmNvbnN0IHNpZ25FeHRlbmQxNiA9IChhKSA9PiAoKGEgJj0gTTE2KSwgYSAmIDB4ODAwMCA/IGEgfCB+TTE2IDogYSk7XG5jb25zdCBhZGRpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApICsgKGIgfCAwKSk7XG5jb25zdCBkaXZpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApIC8gKGIgfCAwKSk7XG5jb25zdCBtdWxpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApICogKGIgfCAwKSk7XG5jb25zdCBzdWJpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApIC0gKGIgfCAwKSk7XG5jb25zdCBhbmRpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApICYgKGIgfCAwKSk7XG5jb25zdCBvcmk4ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQ4KGEgfCAwIHwgKGIgfCAwKSk7XG5jb25zdCB4b3JpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApIF4gKGIgfCAwKSk7XG5jb25zdCBub3RpOCA9IChhKSA9PiBzaWduRXh0ZW5kOCh+YSk7XG5jb25zdCBsc2hpZnRpOCA9IChhLCBiKSA9PiBzaWduRXh0ZW5kOCgoYSB8IDApIDw8IChiIHwgMCkpO1xuY29uc3QgcnNoaWZ0aTggPSAoYSwgYikgPT4gc2lnbkV4dGVuZDgoKGEgfCAwKSA+PiAoYiB8IDApKTtcbmNvbnN0IGFkZGkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoKGEgfCAwKSArIChiIHwgMCkpO1xuY29uc3QgZGl2aTE2ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQxNigoYSB8IDApIC8gKGIgfCAwKSk7XG5jb25zdCBtdWxpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgKiAoYiB8IDApKTtcbmNvbnN0IHN1YmkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoKGEgfCAwKSAtIChiIHwgMCkpO1xuY29uc3QgYW5kaTE2ID0gKGEsIGIpID0+IHNpZ25FeHRlbmQxNigoYSB8IDApICYgKGIgfCAwKSk7XG5jb25zdCBvcmkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoYSB8IDAgfCAoYiB8IDApKTtcbmNvbnN0IHhvcmkxNiA9IChhLCBiKSA9PiBzaWduRXh0ZW5kMTYoKGEgfCAwKSBeIChiIHwgMCkpO1xuY29uc3Qgbm90aTE2ID0gKGEpID0+IHNpZ25FeHRlbmQxNih+YSk7XG5jb25zdCBsc2hpZnRpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgPDwgKGIgfCAwKSk7XG5jb25zdCByc2hpZnRpMTYgPSAoYSwgYikgPT4gc2lnbkV4dGVuZDE2KChhIHwgMCkgPj4gKGIgfCAwKSk7XG5jb25zdCBhZGRpMzIgPSAoYSwgYikgPT4gKChhIHwgMCkgKyAoYiB8IDApKSB8IDA7XG5jb25zdCBkaXZpMzIgPSAoYSwgYikgPT4gKChhIHwgMCkgLyAoYiB8IDApKSB8IDA7XG5jb25zdCBtdWxpMzIgPSAoYSwgYikgPT4gKChhIHwgMCkgKiAoYiB8IDApKSB8IDA7XG5jb25zdCBzdWJpMzIgPSAoYSwgYikgPT4gKChhIHwgMCkgLSAoYiB8IDApKSB8IDA7XG5jb25zdCBhbmRpMzIgPSAoYSwgYikgPT4gKGEgfCAwKSAmIChiIHwgMCk7XG5jb25zdCBvcmkzMiA9IChhLCBiKSA9PiBhIHwgMCB8IChiIHwgMCk7XG5jb25zdCB4b3JpMzIgPSAoYSwgYikgPT4gKGEgfCAwKSBeIChiIHwgMCk7XG5jb25zdCBsc2hpZnRpMzIgPSAoYSwgYikgPT4gKGEgfCAwKSA8PCAoYiB8IDApO1xuY29uc3QgcnNoaWZ0aTMyID0gKGEsIGIpID0+IChhIHwgMCkgPj4gKGIgfCAwKTtcbmNvbnN0IG5vdGkzMiA9IChhKSA9PiB+YTtcbmNvbnN0IGFkZHU4ID0gKGEsIGIpID0+ICgoYSAmIE04KSArIChiICYgTTgpKSAmIE04O1xuY29uc3QgZGl2dTggPSAoYSwgYikgPT4gKChhICYgTTgpIC8gKGIgJiBNOCkpICYgTTg7XG5jb25zdCBtdWx1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgKiAoYiAmIE04KSkgJiBNODtcbmNvbnN0IHN1YnU4ID0gKGEsIGIpID0+ICgoYSAmIE04KSAtIChiICYgTTgpKSAmIE04O1xuY29uc3QgYW5kdTggPSAoYSwgYikgPT4gYSAmIE04ICYgKGIgJiBNOCkgJiBNODtcbmNvbnN0IG9ydTggPSAoYSwgYikgPT4gKChhICYgTTgpIHwgKGIgJiBNOCkpICYgTTg7XG5jb25zdCB4b3J1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgXiAoYiAmIE04KSkgJiBNODtcbmNvbnN0IG5vdHU4ID0gKGEpID0+IH5hICYgTTg7XG5jb25zdCBsc2hpZnR1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgPDwgKGIgJiBNOCkpICYgTTg7XG5jb25zdCByc2hpZnR1OCA9IChhLCBiKSA9PiAoKGEgJiBNOCkgPj4+IChiICYgTTgpKSAmIE04O1xuY29uc3QgYWRkdTE2ID0gKGEsIGIpID0+ICgoYSAmIE0xNikgKyAoYiAmIE0xNikpICYgTTE2O1xuY29uc3QgZGl2dTE2ID0gKGEsIGIpID0+ICgoYSAmIE0xNikgLyAoYiAmIE0xNikpICYgTTE2O1xuY29uc3QgbXVsdTE2ID0gKGEsIGIpID0+ICgoYSAmIE0xNikgKiAoYiAmIE0xNikpICYgTTE2O1xuY29uc3Qgc3VidTE2ID0gKGEsIGIpID0+ICgoYSAmIE0xNikgLSAoYiAmIE0xNikpICYgTTE2O1xuY29uc3QgYW5kdTE2ID0gKGEsIGIpID0+IGEgJiBNMTYgJiAoYiAmIE0xNikgJiBNMTY7XG5jb25zdCBvcnUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpIHwgKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IHhvcnUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpIF4gKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IG5vdHUxNiA9IChhKSA9PiB+YSAmIE0xNjtcbmNvbnN0IGxzaGlmdHUxNiA9IChhLCBiKSA9PiAoKGEgJiBNMTYpIDw8IChiICYgTTE2KSkgJiBNMTY7XG5jb25zdCByc2hpZnR1MTYgPSAoYSwgYikgPT4gKChhICYgTTE2KSA+Pj4gKGIgJiBNMTYpKSAmIE0xNjtcbmNvbnN0IGFkZHUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApICsgKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IGRpdnUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApIC8gKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IG11bHUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApICogKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IHN1YnUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApIC0gKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IGFuZHUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApICYgKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IG9ydTMyID0gKGEsIGIpID0+ICgoYSA+Pj4gMCkgfCAoYiA+Pj4gMCkpID4+PiAwO1xuY29uc3QgeG9ydTMyID0gKGEsIGIpID0+ICgoYSA+Pj4gMCkgXiAoYiA+Pj4gMCkpID4+PiAwO1xuY29uc3Qgbm90dTMyID0gKGEpID0+IH5hID4+PiAwO1xuY29uc3QgbHNoaWZ0dTMyID0gKGEsIGIpID0+ICgoYSA+Pj4gMCkgPDwgKGIgPj4+IDApKSA+Pj4gMDtcbmNvbnN0IHJzaGlmdHUzMiA9IChhLCBiKSA9PiAoKGEgPj4+IDApID4+PiAoYiA+Pj4gMCkpID4+PiAwO1xuXG5jb25zdCBjb3B5c2lnbiA9ICh4LCB5KSA9PiBNYXRoLnNpZ24oeSkgKiBNYXRoLmFicyh4KTtcbmNvbnN0IGV4cDIgPSAoeCkgPT4gMiAqKiB4O1xuY29uc3QgZmRpbSA9ICh4LCB5KSA9PiBNYXRoLm1heCh4IC0geSwgMCk7XG5jb25zdCBmbWEgPSAoeCwgeSwgeikgPT4geCAqIHkgKyB6O1xuY29uc3QgZm1vZCA9ICh4LCB5KSA9PiB4ICUgeTtcbmNvbnN0IGZyZXhwID0gKHgpID0+IHtcbiAgICBpZiAoeCA9PT0gMCB8fCAhaXNGaW5pdGUoeCkpXG4gICAgICAgIHJldHVybiBbeCwgMF07XG4gICAgY29uc3QgYWJzID0gTWF0aC5hYnMoeCk7XG4gICAgbGV0IGV4cCA9IE1hdGgubWF4KC0xMDIzLCBNYXRoLmZsb29yKE1hdGgubG9nMihhYnMpKSArIDEpO1xuICAgIGxldCB5ID0gYWJzICogMiAqKiAtZXhwO1xuICAgIHdoaWxlICh5IDwgMC41KSB7XG4gICAgICAgIHkgKj0gMjtcbiAgICAgICAgZXhwLS07XG4gICAgfVxuICAgIHdoaWxlICh5ID49IDEpIHtcbiAgICAgICAgeSAqPSAwLjU7XG4gICAgICAgIGV4cCsrO1xuICAgIH1cbiAgICByZXR1cm4gW3ggPCAwID8gLXkgOiB5LCBleHBdO1xufTtcbmNvbnN0IGxkZXhwID0gKHgsIGV4cCkgPT4geCAqIDIgKiogZXhwO1xuY29uc3QgcmVtYWluZGVyID0gKHgsIHkpID0+IHggLSB5ICogTWF0aC5yb3VuZCh4IC8geSk7XG5cbmNvbnN0IG1pbkVycm9yID0gKGZuLCBlcnJvciwgcSwgcmVzID0gMTYsIGl0ZXIgPSA4LCBzdGFydCA9IDAsIGVuZCA9IDEsIGVwcyA9IEVQUykgPT4ge1xuICAgIGlmIChpdGVyIDw9IDApXG4gICAgICAgIHJldHVybiAoc3RhcnQgKyBlbmQpIC8gMjtcbiAgICBjb25zdCBkZWx0YSA9IChlbmQgLSBzdGFydCkgLyByZXM7XG4gICAgbGV0IG1pblQgPSBzdGFydDtcbiAgICBsZXQgbWluRSA9IEluZmluaXR5O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHJlczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHQgPSBzdGFydCArIGkgKiBkZWx0YTtcbiAgICAgICAgY29uc3QgZSA9IGVycm9yKHEsIGZuKHQpKTtcbiAgICAgICAgaWYgKGUgPCBtaW5FKSB7XG4gICAgICAgICAgICBpZiAoZSA8PSBlcHMpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgICAgICBtaW5FID0gZTtcbiAgICAgICAgICAgIG1pblQgPSB0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtaW5FcnJvcihmbiwgZXJyb3IsIHEsIHJlcywgaXRlciAtIDEsIE1hdGgubWF4KG1pblQgLSBkZWx0YSwgMCksIE1hdGgubWluKG1pblQgKyBkZWx0YSwgMSkpO1xufTtcblxuY29uc3QgbWl4ID0gKGEsIGIsIHQpID0+IGEgKyAoYiAtIGEpICogdDtcbmNvbnN0IG1peEJpbGluZWFyID0gKGEsIGIsIGMsIGQsIHUsIHYpID0+IHtcbiAgICBjb25zdCBpdSA9IDEgLSB1O1xuICAgIGNvbnN0IGl2ID0gMSAtIHY7XG4gICAgcmV0dXJuIGEgKiBpdSAqIGl2ICsgYiAqIHUgKiBpdiArIGMgKiBpdSAqIHYgKyBkICogdSAqIHY7XG59O1xuY29uc3QgbWl4UXVhZHJhdGljID0gKGEsIGIsIGMsIHQpID0+IHtcbiAgICBjb25zdCBzID0gMSAtIHQ7XG4gICAgcmV0dXJuIGEgKiBzICogcyArIGIgKiAyICogcyAqIHQgKyBjICogdCAqIHQ7XG59O1xuY29uc3QgbWl4Q3ViaWMgPSAoYSwgYiwgYywgZCwgdCkgPT4ge1xuICAgIGNvbnN0IHQyID0gdCAqIHQ7XG4gICAgY29uc3QgcyA9IDEgLSB0O1xuICAgIGNvbnN0IHMyID0gcyAqIHM7XG4gICAgcmV0dXJuIGEgKiBzMiAqIHMgKyBiICogMyAqIHMyICogdCArIGMgKiAzICogdDIgKiBzICsgZCAqIHQyICogdDtcbn07XG5jb25zdCBtaXhIZXJtaXRlID0gKGEsIGIsIGMsIGQsIHQpID0+IHtcbiAgICBjb25zdCB5MSA9IDAuNSAqIChjIC0gYSk7XG4gICAgY29uc3QgeTIgPSAxLjUgKiAoYiAtIGMpICsgMC41ICogKGQgLSBhKTtcbiAgICByZXR1cm4gKCh5MiAqIHQgKyBhIC0gYiArIHkxIC0geTIpICogdCArIHkxKSAqIHQgKyBiO1xufTtcbmNvbnN0IG1peEN1YmljSGVybWl0ZSA9IChhLCB0YSwgYiwgdGIsIHQpID0+IHtcbiAgICBjb25zdCBzID0gdCAtIDE7XG4gICAgY29uc3QgdDIgPSB0ICogdDtcbiAgICBjb25zdCBzMiA9IHMgKiBzO1xuICAgIGNvbnN0IGgwMCA9ICgxICsgMiAqIHQpICogczI7XG4gICAgY29uc3QgaDEwID0gdCAqIHMyO1xuICAgIGNvbnN0IGgwMSA9IHQyICogKDMgLSAyICogdCk7XG4gICAgY29uc3QgaDExID0gdDIgKiBzO1xuICAgIHJldHVybiBoMDAgKiBhICsgaDEwICogdGEgKyBoMDEgKiBiICsgaDExICogdGI7XG59O1xuY29uc3QgbWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyA9IChhLCBiLCBjLCBkLCB0KSA9PiB7XG4gICAgZCAqPSAwLjU7XG4gICAgY29uc3QgYWEgPSAtMC41ICogYSArIDEuNSAqIGIgLSAxLjUgKiBjICsgZDtcbiAgICBjb25zdCBiYiA9IGEgLSAyLjUgKiBiICsgMiAqIGMgLSBkO1xuICAgIGNvbnN0IGNjID0gLTAuNSAqIGEgKyAwLjUgKiBjO1xuICAgIGNvbnN0IGRkID0gYjtcbiAgICBjb25zdCB0MiA9IHQgKiB0O1xuICAgIHJldHVybiB0ICogdDIgKiBhYSArIHQyICogYmIgKyB0ICogY2MgKyBkZDtcbn07XG5jb25zdCBtaXhCaWN1YmljID0gKHMwMCwgczAxLCBzMDIsIHMwMywgczEwLCBzMTEsIHMxMiwgczEzLCBzMjAsIHMyMSwgczIyLCBzMjMsIHMzMCwgczMxLCBzMzIsIHMzMywgdSwgdikgPT4gbWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyhtaXhDdWJpY0hlcm1pdGVGcm9tUG9pbnRzKHMwMCwgczAxLCBzMDIsIHMwMywgdSksIG1peEN1YmljSGVybWl0ZUZyb21Qb2ludHMoczEwLCBzMTEsIHMxMiwgczEzLCB1KSwgbWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cyhzMjAsIHMyMSwgczIyLCBzMjMsIHUpLCBtaXhDdWJpY0hlcm1pdGVGcm9tUG9pbnRzKHMzMCwgczMxLCBzMzIsIHMzMywgdSksIHYpO1xuY29uc3QgdGFuZ2VudENhcmRpbmFsID0gKHByZXYsIG5leHQsIHNjYWxlID0gMC41LCB0YSA9IDAsIHRjID0gMikgPT4gc2NhbGUgKiAoKG5leHQgLSBwcmV2KSAvICh0YyAtIHRhKSk7XG5jb25zdCB0YW5nZW50RGlmZjMgPSAocHJldiwgY3VyciwgbmV4dCwgdGEgPSAwLCB0YiA9IDEsIHRjID0gMikgPT4gMC41ICogKChuZXh0IC0gY3VycikgLyAodGMgLSB0YikgKyAoY3VyciAtIHByZXYpIC8gKHRiIC0gdGEpKTtcbmNvbnN0IHR3ZWVuID0gKGYsIGZyb20sIHRvKSA9PiAodCkgPT4gbWl4KGZyb20sIHRvLCBmKHQpKTtcbmNvbnN0IGNpcmN1bGFyID0gKHQpID0+IHtcbiAgICB0ID0gMSAtIHQ7XG4gICAgcmV0dXJuIE1hdGguc3FydCgxIC0gdCAqIHQpO1xufTtcbmNvbnN0IGludkNpcmN1bGFyID0gKHQpID0+IDEgLSBjaXJjdWxhcigxIC0gdCk7XG5jb25zdCBsZW5zID0gKHBvcywgc3RyZW5ndGgsIHQpID0+IHtcbiAgICBjb25zdCBpbXBsID0gc3RyZW5ndGggPiAwID8gaW52Q2lyY3VsYXIgOiBjaXJjdWxhcjtcbiAgICBjb25zdCB0cCA9IDEgLSBwb3M7XG4gICAgY29uc3QgdGwgPSB0IDw9IHBvcyA/IGltcGwodCAvIHBvcykgKiBwb3MgOiAxIC0gaW1wbCgoMSAtIHQpIC8gdHApICogdHA7XG4gICAgcmV0dXJuIG1peCh0LCB0bCwgTWF0aC5hYnMoc3RyZW5ndGgpKTtcbn07XG5jb25zdCBjb3NpbmUgPSAodCkgPT4gMSAtIChNYXRoLmNvcyh0ICogUEkpICogMC41ICsgMC41KTtcbmNvbnN0IGRlY2ltYXRlZCA9IChuLCB0KSA9PiBNYXRoLmZsb29yKHQgKiBuKSAvIG47XG5jb25zdCBib3VuY2UgPSAoaywgYW1wLCB0KSA9PiB7XG4gICAgY29uc3QgdGsgPSB0ICogaztcbiAgICByZXR1cm4gMSAtICgoYW1wICogTWF0aC5zaW4odGspKSAvIHRrKSAqIE1hdGguY29zKHQgKiBIQUxGX1BJKTtcbn07XG5jb25zdCBlYXNlID0gKGVhc2UsIHQpID0+IE1hdGgucG93KHQsIGVhc2UpO1xuY29uc3QgaW1wdWxzZSA9IChrLCB0KSA9PiB7XG4gICAgY29uc3QgaCA9IGsgKiB0O1xuICAgIHJldHVybiBoICogTWF0aC5leHAoMSAtIGgpO1xufTtcbmNvbnN0IGdhaW4gPSAoaywgdCkgPT4gdCA8IDAuNSA/IDAuNSAqIE1hdGgucG93KDIgKiB0LCBrKSA6IDEgLSAwLjUgKiBNYXRoLnBvdygyIC0gMiAqIHQsIGspO1xuY29uc3QgcGFyYWJvbGEgPSAoaywgdCkgPT4gTWF0aC5wb3coNC4wICogdCAqICgxLjAgLSB0KSwgayk7XG5jb25zdCBjdWJpY1B1bHNlID0gKHcsIGMsIHQpID0+IHtcbiAgICB0ID0gTWF0aC5hYnModCAtIGMpO1xuICAgIHJldHVybiB0ID4gdyA/IDAgOiAoKHQgLz0gdyksIDEgLSB0ICogdCAqICgzIC0gMiAqIHQpKTtcbn07XG5jb25zdCBzaW5jID0gKHQpID0+ICh0ICE9PSAwID8gTWF0aC5zaW4odCkgLyB0IDogMSk7XG5jb25zdCBzaW5jTm9ybWFsaXplZCA9IChrLCB0KSA9PiBzaW5jKFBJICogayAqIHQpO1xuY29uc3QgbGFuY3pvcyA9IChhLCB0KSA9PiB0ICE9PSAwID8gKC1hIDwgdCAmJiB0IDwgYSA/IHNpbmMoUEkgKiB0KSAqIHNpbmMoKFBJICogdCkgLyBhKSA6IDApIDogMTtcbmNvbnN0IHNpZ21vaWQgPSAoYmlhcywgaywgdCkgPT4gdCAhPSBiaWFzID8gMSAvICgxICsgTWF0aC5leHAoLWsgKiAodCAtIGJpYXMpKSkgOiAwLjU7XG5jb25zdCBzaWdtb2lkMDEgPSAoaywgdCkgPT4gc2lnbW9pZCgwLjUsIGssIHQpO1xuY29uc3Qgc2lnbW9pZDExID0gKGssIHQpID0+IHNpZ21vaWQoMCwgaywgdCk7XG5jb25zdCBzY2hsaWNrID0gKGEsIGIsIHQpID0+IHQgPD0gYlxuICAgID8gKGIgKiB0KSAvICh0ICsgYSAqIChiIC0gdCkgKyBFUFMpXG4gICAgOiAoKDEgLSBiKSAqICh0IC0gMSkpIC8gKDEgLSB0IC0gYSAqIChiIC0gdCkgKyBFUFMpICsgMTtcbmNvbnN0IGV4cEZhY3RvciA9IChhLCBiLCBudW0pID0+IChiIC8gYSkgKiogKDEgLyBudW0pO1xuY29uc3QgZ2F1c3NpYW4gPSAoYmlhcywgc2lnbWEsIHQpID0+IE1hdGguZXhwKC0oKHQgLSBiaWFzKSAqKiAyKSAvICgyICogc2lnbWEgKiBzaWdtYSkpO1xuXG5jb25zdCBtb2QgPSAoYSwgYikgPT4gYSAtIGIgKiBNYXRoLmZsb29yKGEgLyBiKTtcbmNvbnN0IGZyYWN0ID0gKHgpID0+IHggLSBNYXRoLmZsb29yKHgpO1xuY29uc3QgdHJ1bmMgPSAoeCkgPT4gKHggPCAwID8gTWF0aC5jZWlsKHgpIDogTWF0aC5mbG9vcih4KSk7XG5jb25zdCByb3VuZFRvID0gKHgsIHByZWMgPSAxKSA9PiBNYXRoLnJvdW5kKHggLyBwcmVjKSAqIHByZWM7XG5jb25zdCBmbG9vclRvID0gKHgsIHByZWMgPSAxKSA9PiBNYXRoLmZsb29yKHggLyBwcmVjKSAqIHByZWM7XG5jb25zdCBjZWlsVG8gPSAoeCwgcHJlYyA9IDEpID0+IE1hdGguY2VpbCh4IC8gcHJlYykgKiBwcmVjO1xuY29uc3Qgcm91bmRFcHMgPSAoeCwgZXBzID0gRVBTKSA9PiB7XG4gICAgY29uc3QgZiA9IGZyYWN0KHgpO1xuICAgIHJldHVybiBmIDw9IGVwcyB8fCBmID49IDEgLSBlcHMgPyBNYXRoLnJvdW5kKHgpIDogeDtcbn07XG5cbmNvbnN0IHNpbXBsaWZ5UmF0aW8gPSAobnVtLCBkZW5vbSkgPT4ge1xuICAgIGxldCBlMSA9IE1hdGguYWJzKG51bSk7XG4gICAgbGV0IGUyID0gTWF0aC5hYnMoZGVub20pO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmIChlMSA8IGUyKSB7XG4gICAgICAgICAgICBjb25zdCB0ID0gZTE7XG4gICAgICAgICAgICBlMSA9IGUyO1xuICAgICAgICAgICAgZTIgPSB0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHIgPSBlMSAlIGUyO1xuICAgICAgICBpZiAocikge1xuICAgICAgICAgICAgZTEgPSByO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtudW0gLyBlMiwgZGVub20gLyBlMl07XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBzYWZlRGl2ID0gKGEsIGIpID0+IChiICE9PSAwID8gYSAvIGIgOiAwKTtcblxuY29uc3QgZGVyaXZhdGl2ZSA9IChmLCBlcHMgPSBFUFMpID0+ICh4KSA9PiAoZih4ICsgZXBzKSAtIGYoeCkpIC8gZXBzO1xuY29uc3Qgc29sdmVMaW5lYXIgPSAoYSwgYikgPT4gc2FmZURpdigtYiwgYSk7XG5jb25zdCBzb2x2ZVF1YWRyYXRpYyA9IChhLCBiLCBjLCBlcHMgPSAxZS05KSA9PiB7XG4gICAgY29uc3QgZCA9IDIgKiBhO1xuICAgIGxldCByID0gYiAqIGIgLSA0ICogYSAqIGM7XG4gICAgcmV0dXJuIHIgPCAwXG4gICAgICAgID8gW11cbiAgICAgICAgOiByIDwgZXBzXG4gICAgICAgICAgICA/IFstYiAvIGRdXG4gICAgICAgICAgICA6ICgociA9IE1hdGguc3FydChyKSksIFsoLWIgLSByKSAvIGQsICgtYiArIHIpIC8gZF0pO1xufTtcbmNvbnN0IHNvbHZlQ3ViaWMgPSAoYSwgYiwgYywgZCwgZXBzID0gMWUtOSkgPT4ge1xuICAgIGNvbnN0IGFhID0gYSAqIGE7XG4gICAgY29uc3QgYmIgPSBiICogYjtcbiAgICBjb25zdCBiYTMgPSBiIC8gKDMgKiBhKTtcbiAgICBjb25zdCBwID0gKDMgKiBhICogYyAtIGJiKSAvICgzICogYWEpO1xuICAgIGNvbnN0IHEgPSAoMiAqIGJiICogYiAtIDkgKiBhICogYiAqIGMgKyAyNyAqIGFhICogZCkgLyAoMjcgKiBhYSAqIGEpO1xuICAgIGlmIChNYXRoLmFicyhwKSA8IGVwcykge1xuICAgICAgICByZXR1cm4gW01hdGguY2JydCgtcSkgLSBiYTNdO1xuICAgIH1cbiAgICBlbHNlIGlmIChNYXRoLmFicyhxKSA8IGVwcykge1xuICAgICAgICByZXR1cm4gcCA8IDBcbiAgICAgICAgICAgID8gWy1NYXRoLnNxcnQoLXApIC0gYmEzLCAtYmEzLCBNYXRoLnNxcnQoLXApIC0gYmEzXVxuICAgICAgICAgICAgOiBbLWJhM107XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBkZW5vbSA9IChxICogcSkgLyA0ICsgKHAgKiBwICogcCkgLyAyNztcbiAgICAgICAgaWYgKE1hdGguYWJzKGRlbm9tKSA8IGVwcykge1xuICAgICAgICAgICAgcmV0dXJuIFsoLTEuNSAqIHEpIC8gcCAtIGJhMywgKDMgKiBxKSAvIHAgLSBiYTNdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlbm9tID4gMCkge1xuICAgICAgICAgICAgY29uc3QgdSA9IE1hdGguY2JydCgtcSAvIDIgLSBNYXRoLnNxcnQoZGVub20pKTtcbiAgICAgICAgICAgIHJldHVybiBbdSAtIHAgLyAoMyAqIHUpIC0gYmEzXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHUgPSAyICogTWF0aC5zcXJ0KC1wIC8gMyksIHQgPSBNYXRoLmFjb3MoKDMgKiBxKSAvIHAgLyB1KSAvIDMsIGsgPSAoMiAqIE1hdGguUEkpIC8gMztcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgdSAqIE1hdGguY29zKHQpIC0gYmEzLFxuICAgICAgICAgICAgICAgIHUgKiBNYXRoLmNvcyh0IC0gaykgLSBiYTMsXG4gICAgICAgICAgICAgICAgdSAqIE1hdGguY29zKHQgLSAyICogaykgLSBiYTMsXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuY29uc3Qgc3RlcCA9IChlZGdlLCB4KSA9PiAoeCA8IGVkZ2UgPyAwIDogMSk7XG5jb25zdCBzbW9vdGhTdGVwID0gKGVkZ2UsIGVkZ2UyLCB4KSA9PiB7XG4gICAgeCA9IGNsYW1wMDEoKHggLSBlZGdlKSAvIChlZGdlMiAtIGVkZ2UpKTtcbiAgICByZXR1cm4gKDMgLSAyICogeCkgKiB4ICogeDtcbn07XG5jb25zdCBzbW9vdGhlclN0ZXAgPSAoZWRnZSwgZWRnZTIsIHgpID0+IHtcbiAgICB4ID0gY2xhbXAwMSgoeCAtIGVkZ2UpIC8gKGVkZ2UyIC0gZWRnZSkpO1xuICAgIHJldHVybiB4ICogeCAqIHggKiAoeCAqICh4ICogNiAtIDE1KSArIDEwKTtcbn07XG5jb25zdCBleHBTdGVwID0gKGssIG4sIHgpID0+IDEgLSBNYXRoLmV4cCgtayAqIE1hdGgucG93KHgsIG4pKTtcblxuZXhwb3J0cy5ERUcyUkFEID0gREVHMlJBRDtcbmV4cG9ydHMuRVBTID0gRVBTO1xuZXhwb3J0cy5IQUxGX1BJID0gSEFMRl9QSTtcbmV4cG9ydHMuSU5WX0hBTEZfUEkgPSBJTlZfSEFMRl9QSTtcbmV4cG9ydHMuSU5WX1BJID0gSU5WX1BJO1xuZXhwb3J0cy5JTlZfVEFVID0gSU5WX1RBVTtcbmV4cG9ydHMuUEhJID0gUEhJO1xuZXhwb3J0cy5QSSA9IFBJO1xuZXhwb3J0cy5RVUFSVEVSX1BJID0gUVVBUlRFUl9QSTtcbmV4cG9ydHMuUkFEMkRFRyA9IFJBRDJERUc7XG5leHBvcnRzLlNJWFRIID0gU0lYVEg7XG5leHBvcnRzLlNJWFRIX1BJID0gU0lYVEhfUEk7XG5leHBvcnRzLlNRUlQyID0gU1FSVDI7XG5leHBvcnRzLlNRUlQyXzIgPSBTUVJUMl8yO1xuZXhwb3J0cy5TUVJUMl8zID0gU1FSVDJfMztcbmV4cG9ydHMuU1FSVDMgPSBTUVJUMztcbmV4cG9ydHMuVEFVID0gVEFVO1xuZXhwb3J0cy5USElSRCA9IFRISVJEO1xuZXhwb3J0cy5USElSRF9QSSA9IFRISVJEX1BJO1xuZXhwb3J0cy5UV09fVEhJUkQgPSBUV09fVEhJUkQ7XG5leHBvcnRzLmFic0RpZmYgPSBhYnNEaWZmO1xuZXhwb3J0cy5hYnNJbm5lckFuZ2xlID0gYWJzSW5uZXJBbmdsZTtcbmV4cG9ydHMuYWJzTWF4ID0gYWJzTWF4O1xuZXhwb3J0cy5hYnNNaW4gPSBhYnNNaW47XG5leHBvcnRzLmFic1RoZXRhID0gYWJzVGhldGE7XG5leHBvcnRzLmFkZGkxNiA9IGFkZGkxNjtcbmV4cG9ydHMuYWRkaTMyID0gYWRkaTMyO1xuZXhwb3J0cy5hZGRpOCA9IGFkZGk4O1xuZXhwb3J0cy5hZGR1MTYgPSBhZGR1MTY7XG5leHBvcnRzLmFkZHUzMiA9IGFkZHUzMjtcbmV4cG9ydHMuYWRkdTggPSBhZGR1ODtcbmV4cG9ydHMuYW5kaTE2ID0gYW5kaTE2O1xuZXhwb3J0cy5hbmRpMzIgPSBhbmRpMzI7XG5leHBvcnRzLmFuZGk4ID0gYW5kaTg7XG5leHBvcnRzLmFuZHUxNiA9IGFuZHUxNjtcbmV4cG9ydHMuYW5kdTMyID0gYW5kdTMyO1xuZXhwb3J0cy5hbmR1OCA9IGFuZHU4O1xuZXhwb3J0cy5hbmdsZURpc3QgPSBhbmdsZURpc3Q7XG5leHBvcnRzLmF0YW4yQWJzID0gYXRhbjJBYnM7XG5leHBvcnRzLmJvdW5jZSA9IGJvdW5jZTtcbmV4cG9ydHMuY2VpbFRvID0gY2VpbFRvO1xuZXhwb3J0cy5jaXJjdWxhciA9IGNpcmN1bGFyO1xuZXhwb3J0cy5jbGFtcCA9IGNsYW1wO1xuZXhwb3J0cy5jbGFtcDAgPSBjbGFtcDA7XG5leHBvcnRzLmNsYW1wMDEgPSBjbGFtcDAxO1xuZXhwb3J0cy5jbGFtcDA1ID0gY2xhbXAwNTtcbmV4cG9ydHMuY2xhbXAxMSA9IGNsYW1wMTE7XG5leHBvcnRzLmNsYXNzaWZ5Q3Jvc3NpbmcgPSBjbGFzc2lmeUNyb3NzaW5nO1xuZXhwb3J0cy5jb3B5c2lnbiA9IGNvcHlzaWduO1xuZXhwb3J0cy5jb3NpbmUgPSBjb3NpbmU7XG5leHBvcnRzLmNvc3NpbiA9IGNvc3NpbjtcbmV4cG9ydHMuY290ID0gY290O1xuZXhwb3J0cy5jc2MgPSBjc2M7XG5leHBvcnRzLmN1YmljUHVsc2UgPSBjdWJpY1B1bHNlO1xuZXhwb3J0cy5kZWNpbWF0ZWQgPSBkZWNpbWF0ZWQ7XG5leHBvcnRzLmRlZyA9IGRlZztcbmV4cG9ydHMuZGVyaXZhdGl2ZSA9IGRlcml2YXRpdmU7XG5leHBvcnRzLmRpdmkxNiA9IGRpdmkxNjtcbmV4cG9ydHMuZGl2aTMyID0gZGl2aTMyO1xuZXhwb3J0cy5kaXZpOCA9IGRpdmk4O1xuZXhwb3J0cy5kaXZ1MTYgPSBkaXZ1MTY7XG5leHBvcnRzLmRpdnUzMiA9IGRpdnUzMjtcbmV4cG9ydHMuZGl2dTggPSBkaXZ1ODtcbmV4cG9ydHMuZWFzZSA9IGVhc2U7XG5leHBvcnRzLmVxRGVsdGEgPSBlcURlbHRhO1xuZXhwb3J0cy5lcURlbHRhU2NhbGVkID0gZXFEZWx0YVNjYWxlZDtcbmV4cG9ydHMuZXhwMiA9IGV4cDI7XG5leHBvcnRzLmV4cEZhY3RvciA9IGV4cEZhY3RvcjtcbmV4cG9ydHMuZXhwU3RlcCA9IGV4cFN0ZXA7XG5leHBvcnRzLmZhc3RDb3MgPSBmYXN0Q29zO1xuZXhwb3J0cy5mYXN0U2luID0gZmFzdFNpbjtcbmV4cG9ydHMuZmRpbSA9IGZkaW07XG5leHBvcnRzLmZpdCA9IGZpdDtcbmV4cG9ydHMuZml0MDEgPSBmaXQwMTtcbmV4cG9ydHMuZml0MTAgPSBmaXQxMDtcbmV4cG9ydHMuZml0MTEgPSBmaXQxMTtcbmV4cG9ydHMuZml0Q2xhbXBlZCA9IGZpdENsYW1wZWQ7XG5leHBvcnRzLmZsb29yVG8gPSBmbG9vclRvO1xuZXhwb3J0cy5mbWEgPSBmbWE7XG5leHBvcnRzLmZtb2QgPSBmbW9kO1xuZXhwb3J0cy5mb2xkYmFjayA9IGZvbGRiYWNrO1xuZXhwb3J0cy5mcmFjdCA9IGZyYWN0O1xuZXhwb3J0cy5mcmV4cCA9IGZyZXhwO1xuZXhwb3J0cy5nYWluID0gZ2FpbjtcbmV4cG9ydHMuZ2F1c3NpYW4gPSBnYXVzc2lhbjtcbmV4cG9ydHMuaW1wdWxzZSA9IGltcHVsc2U7XG5leHBvcnRzLmluT3BlblJhbmdlID0gaW5PcGVuUmFuZ2U7XG5leHBvcnRzLmluUmFuZ2UgPSBpblJhbmdlO1xuZXhwb3J0cy5pbnZDaXJjdWxhciA9IGludkNpcmN1bGFyO1xuZXhwb3J0cy5pc0Nyb3NzT3ZlciA9IGlzQ3Jvc3NPdmVyO1xuZXhwb3J0cy5pc0Nyb3NzVW5kZXIgPSBpc0Nyb3NzVW5kZXI7XG5leHBvcnRzLmlzTWF4aW1hID0gaXNNYXhpbWE7XG5leHBvcnRzLmlzTWluaW1hID0gaXNNaW5pbWE7XG5leHBvcnRzLmxhbmN6b3MgPSBsYW5jem9zO1xuZXhwb3J0cy5sZGV4cCA9IGxkZXhwO1xuZXhwb3J0cy5sZW5zID0gbGVucztcbmV4cG9ydHMubG9jID0gbG9jO1xuZXhwb3J0cy5sc2hpZnRpMTYgPSBsc2hpZnRpMTY7XG5leHBvcnRzLmxzaGlmdGkzMiA9IGxzaGlmdGkzMjtcbmV4cG9ydHMubHNoaWZ0aTggPSBsc2hpZnRpODtcbmV4cG9ydHMubHNoaWZ0dTE2ID0gbHNoaWZ0dTE2O1xuZXhwb3J0cy5sc2hpZnR1MzIgPSBsc2hpZnR1MzI7XG5leHBvcnRzLmxzaGlmdHU4ID0gbHNoaWZ0dTg7XG5leHBvcnRzLm1heDJpZCA9IG1heDJpZDtcbmV4cG9ydHMubWF4M2lkID0gbWF4M2lkO1xuZXhwb3J0cy5tYXg0aWQgPSBtYXg0aWQ7XG5leHBvcnRzLm1heGltYUluZGV4ID0gbWF4aW1hSW5kZXg7XG5leHBvcnRzLm1heGltYUluZGljZXMgPSBtYXhpbWFJbmRpY2VzO1xuZXhwb3J0cy5taW4yaWQgPSBtaW4yaWQ7XG5leHBvcnRzLm1pbjNpZCA9IG1pbjNpZDtcbmV4cG9ydHMubWluNGlkID0gbWluNGlkO1xuZXhwb3J0cy5taW5FcnJvciA9IG1pbkVycm9yO1xuZXhwb3J0cy5taW5Ob25aZXJvMiA9IG1pbk5vblplcm8yO1xuZXhwb3J0cy5taW5Ob25aZXJvMyA9IG1pbk5vblplcm8zO1xuZXhwb3J0cy5taW5pbWFJbmRleCA9IG1pbmltYUluZGV4O1xuZXhwb3J0cy5taW5pbWFJbmRpY2VzID0gbWluaW1hSW5kaWNlcztcbmV4cG9ydHMubWl4ID0gbWl4O1xuZXhwb3J0cy5taXhCaWN1YmljID0gbWl4QmljdWJpYztcbmV4cG9ydHMubWl4QmlsaW5lYXIgPSBtaXhCaWxpbmVhcjtcbmV4cG9ydHMubWl4Q3ViaWMgPSBtaXhDdWJpYztcbmV4cG9ydHMubWl4Q3ViaWNIZXJtaXRlID0gbWl4Q3ViaWNIZXJtaXRlO1xuZXhwb3J0cy5taXhDdWJpY0hlcm1pdGVGcm9tUG9pbnRzID0gbWl4Q3ViaWNIZXJtaXRlRnJvbVBvaW50cztcbmV4cG9ydHMubWl4SGVybWl0ZSA9IG1peEhlcm1pdGU7XG5leHBvcnRzLm1peFF1YWRyYXRpYyA9IG1peFF1YWRyYXRpYztcbmV4cG9ydHMubW9kID0gbW9kO1xuZXhwb3J0cy5tdWxpMTYgPSBtdWxpMTY7XG5leHBvcnRzLm11bGkzMiA9IG11bGkzMjtcbmV4cG9ydHMubXVsaTggPSBtdWxpODtcbmV4cG9ydHMubXVsdTE2ID0gbXVsdTE2O1xuZXhwb3J0cy5tdWx1MzIgPSBtdWx1MzI7XG5leHBvcnRzLm11bHU4ID0gbXVsdTg7XG5leHBvcnRzLm5vcm0gPSBub3JtO1xuZXhwb3J0cy5ub3JtQ29zID0gbm9ybUNvcztcbmV4cG9ydHMubm90aTE2ID0gbm90aTE2O1xuZXhwb3J0cy5ub3RpMzIgPSBub3RpMzI7XG5leHBvcnRzLm5vdGk4ID0gbm90aTg7XG5leHBvcnRzLm5vdHUxNiA9IG5vdHUxNjtcbmV4cG9ydHMubm90dTMyID0gbm90dTMyO1xuZXhwb3J0cy5ub3R1OCA9IG5vdHU4O1xuZXhwb3J0cy5vcmkxNiA9IG9yaTE2O1xuZXhwb3J0cy5vcmkzMiA9IG9yaTMyO1xuZXhwb3J0cy5vcmk4ID0gb3JpODtcbmV4cG9ydHMub3J1MTYgPSBvcnUxNjtcbmV4cG9ydHMub3J1MzIgPSBvcnUzMjtcbmV4cG9ydHMub3J1OCA9IG9ydTg7XG5leHBvcnRzLnBhcmFib2xhID0gcGFyYWJvbGE7XG5leHBvcnRzLnF1YWRyYW50ID0gcXVhZHJhbnQ7XG5leHBvcnRzLnJhZCA9IHJhZDtcbmV4cG9ydHMucmVtYWluZGVyID0gcmVtYWluZGVyO1xuZXhwb3J0cy5yb3VuZEVwcyA9IHJvdW5kRXBzO1xuZXhwb3J0cy5yb3VuZFRvID0gcm91bmRUbztcbmV4cG9ydHMucnNoaWZ0aTE2ID0gcnNoaWZ0aTE2O1xuZXhwb3J0cy5yc2hpZnRpMzIgPSByc2hpZnRpMzI7XG5leHBvcnRzLnJzaGlmdGk4ID0gcnNoaWZ0aTg7XG5leHBvcnRzLnJzaGlmdHUxNiA9IHJzaGlmdHUxNjtcbmV4cG9ydHMucnNoaWZ0dTMyID0gcnNoaWZ0dTMyO1xuZXhwb3J0cy5yc2hpZnR1OCA9IHJzaGlmdHU4O1xuZXhwb3J0cy5zYWZlRGl2ID0gc2FmZURpdjtcbmV4cG9ydHMuc2NobGljayA9IHNjaGxpY2s7XG5leHBvcnRzLnNjbGFtcCA9IHNjbGFtcDtcbmV4cG9ydHMuc2VjID0gc2VjO1xuZXhwb3J0cy5zaWdtb2lkID0gc2lnbW9pZDtcbmV4cG9ydHMuc2lnbW9pZDAxID0gc2lnbW9pZDAxO1xuZXhwb3J0cy5zaWdtb2lkMTEgPSBzaWdtb2lkMTE7XG5leHBvcnRzLnNpZ24gPSBzaWduO1xuZXhwb3J0cy5zaWduRXh0ZW5kMTYgPSBzaWduRXh0ZW5kMTY7XG5leHBvcnRzLnNpZ25FeHRlbmQ4ID0gc2lnbkV4dGVuZDg7XG5leHBvcnRzLnNpbXBsaWZ5UmF0aW8gPSBzaW1wbGlmeVJhdGlvO1xuZXhwb3J0cy5zaW5jID0gc2luYztcbmV4cG9ydHMuc2luY05vcm1hbGl6ZWQgPSBzaW5jTm9ybWFsaXplZDtcbmV4cG9ydHMuc2luY29zID0gc2luY29zO1xuZXhwb3J0cy5zbWF4ID0gc21heDtcbmV4cG9ydHMuc21pbiA9IHNtaW47XG5leHBvcnRzLnNtb290aFN0ZXAgPSBzbW9vdGhTdGVwO1xuZXhwb3J0cy5zbW9vdGhlclN0ZXAgPSBzbW9vdGhlclN0ZXA7XG5leHBvcnRzLnNvbHZlQ3ViaWMgPSBzb2x2ZUN1YmljO1xuZXhwb3J0cy5zb2x2ZUxpbmVhciA9IHNvbHZlTGluZWFyO1xuZXhwb3J0cy5zb2x2ZVF1YWRyYXRpYyA9IHNvbHZlUXVhZHJhdGljO1xuZXhwb3J0cy5zdGVwID0gc3RlcDtcbmV4cG9ydHMuc3ViaTE2ID0gc3ViaTE2O1xuZXhwb3J0cy5zdWJpMzIgPSBzdWJpMzI7XG5leHBvcnRzLnN1Ymk4ID0gc3ViaTg7XG5leHBvcnRzLnN1YnUxNiA9IHN1YnUxNjtcbmV4cG9ydHMuc3VidTMyID0gc3VidTMyO1xuZXhwb3J0cy5zdWJ1OCA9IHN1YnU4O1xuZXhwb3J0cy50YW5nZW50Q2FyZGluYWwgPSB0YW5nZW50Q2FyZGluYWw7XG5leHBvcnRzLnRhbmdlbnREaWZmMyA9IHRhbmdlbnREaWZmMztcbmV4cG9ydHMudHJ1bmMgPSB0cnVuYztcbmV4cG9ydHMudHdlZW4gPSB0d2VlbjtcbmV4cG9ydHMud3JhcCA9IHdyYXA7XG5leHBvcnRzLndyYXAwMSA9IHdyYXAwMTtcbmV4cG9ydHMud3JhcDExID0gd3JhcDExO1xuZXhwb3J0cy53cmFwT25jZSA9IHdyYXBPbmNlO1xuZXhwb3J0cy54b3JpMTYgPSB4b3JpMTY7XG5leHBvcnRzLnhvcmkzMiA9IHhvcmkzMjtcbmV4cG9ydHMueG9yaTggPSB4b3JpODtcbmV4cG9ydHMueG9ydTE2ID0geG9ydTE2O1xuZXhwb3J0cy54b3J1MzIgPSB4b3J1MzI7XG5leHBvcnRzLnhvcnU4ID0geG9ydTg7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBjaGVja3MgPSByZXF1aXJlKCdAdGhpLm5nL2NoZWNrcycpO1xudmFyIGFwaSA9IHJlcXVpcmUoJ0B0aGkubmcvYXBpJyk7XG52YXIgaGV4ID0gcmVxdWlyZSgnQHRoaS5uZy9oZXgnKTtcblxuY29uc3QgSU5WX01BWCA9IDEgLyAweGZmZmZmZmZmO1xuY2xhc3MgQVJhbmRvbSB7XG4gICAgZmxvYXQobm9ybSA9IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50KCkgKiBJTlZfTUFYICogbm9ybTtcbiAgICB9XG4gICAgbm9ybShub3JtID0gMSkge1xuICAgICAgICByZXR1cm4gKHRoaXMuaW50KCkgKiBJTlZfTUFYIC0gMC41KSAqIDIgKiBub3JtO1xuICAgIH1cbiAgICBtaW5tYXgobWluLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmxvYXQoKSAqIChtYXggLSBtaW4pICsgbWluO1xuICAgIH1cbn1cblxuY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb207XG5jbGFzcyBTeXN0ZW1SYW5kb20gZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBpbnQoKSB7XG4gICAgICAgIHJldHVybiAocmFuZG9tKCkgKiA0Mjk0OTY3Mjk2KSAgPj4+IDA7XG4gICAgfVxuICAgIGZsb2F0KG5vcm0gPSAxKSB7XG4gICAgICAgIHJldHVybiByYW5kb20oKSAqIG5vcm07XG4gICAgfVxuICAgIG5vcm0obm9ybSA9IDEpIHtcbiAgICAgICAgcmV0dXJuIChyYW5kb20oKSAtIDAuNSkgKiAyICogbm9ybTtcbiAgICB9XG59XG5jb25zdCBTWVNURU0gPSBuZXcgU3lzdGVtUmFuZG9tKCk7XG5cbmNvbnN0IHJhbmRvbUJ5dGVzRnJvbSA9IChybmQsIGJ1Ziwgc3RhcnQgPSAwLCBlbmQgPSBidWYubGVuZ3RoKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IGVuZDsgLS1pID49IHN0YXJ0Oykge1xuICAgICAgICBidWZbaV0gPSBybmQuaW50KCkgJiAweGZmO1xuICAgIH1cbiAgICByZXR1cm4gYnVmO1xufTtcbmNvbnN0IHJhbmRvbUJ5dGVzID0gY2hlY2tzLmhhc0NyeXB0bygpXG4gICAgPyAoYnVmLCBzdGFydCA9IDAsIGVuZCA9IGJ1Zi5sZW5ndGgpID0+ICh3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhidWYuc3ViYXJyYXkoc3RhcnQsIGVuZCkpLCBidWYpXG4gICAgOiAoYnVmLCBzdGFydCwgZW5kKSA9PiByYW5kb21CeXRlc0Zyb20oU1lTVEVNLCBidWYsIHN0YXJ0LCBlbmQpO1xuXG5jbGFzcyBDcnlwdG8gZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBjb25zdHJ1Y3RvcihzaXplID0gNjQpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDhBcnJheSgoc2l6ZSArIDMpICYgfjMpO1xuICAgICAgICB0aGlzLnUzMiA9IG5ldyBVaW50MzJBcnJheSh0aGlzLmJ1ZmZlci5idWZmZXIpO1xuICAgICAgICB0aGlzLmkgPSBzaXplID4+PiAyO1xuICAgIH1cbiAgICBjb3B5KCkge1xuICAgICAgICByZXR1cm4gbmV3IENyeXB0byh0aGlzLmJ1ZmZlci5sZW5ndGgpO1xuICAgIH1cbiAgICBieXRlcygpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHRoaXMuYnVmZmVyLmJ1ZmZlcik7XG4gICAgfVxuICAgIGludCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaSA+PSB0aGlzLnUzMi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJhbmRvbUJ5dGVzKHRoaXMuYnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuaSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMudTMyW3RoaXMuaSsrXTtcbiAgICB9XG59XG5jb25zdCBDUllQVE8gPSBuZXcgQ3J5cHRvKCk7XG5cbmNvbnN0IERFRkFVTFRfU0VFRF8zMiA9IDB4ZGVjYWZiYWQ7XG5jb25zdCBERUZBVUxUX1NFRURfMTI4ID0gW1xuICAgIDB4ZGVjYWZiYWQsXG4gICAgMHgyZmE5ZDc1YixcbiAgICAweGU0MWY2N2UzLFxuICAgIDB4NWM4M2VjMWEsXG5dO1xuY29uc3QgREVGQVVMVF9TRUVEXzE2MCA9IFsuLi5ERUZBVUxUX1NFRURfMTI4LCAweGY2OWE1YzcxXTtcblxuY2xhc3MgU211c2gzMiBleHRlbmRzIEFSYW5kb20ge1xuICAgIGNvbnN0cnVjdG9yKHNlZWQgPSBERUZBVUxUX1NFRURfMzIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoW3NlZWQsIDBdKTtcbiAgICB9XG4gICAgY29weSgpIHtcbiAgICAgICAgY29uc3QgZ2VuID0gbmV3IFNtdXNoMzIoKTtcbiAgICAgICAgZ2VuLmJ1ZmZlci5zZXQodGhpcy5idWZmZXIpO1xuICAgICAgICByZXR1cm4gZ2VuO1xuICAgIH1cbiAgICBzZWVkKHMpIHtcbiAgICAgICAgdGhpcy5idWZmZXIuc2V0KFtzLCAwXSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpbnQoKSB7XG4gICAgICAgIGNvbnN0IGIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgY29uc3QgbSA9IDB4NWJkMWU5OTU7XG4gICAgICAgIGNvbnN0IGsgPSAoYlsxXSsrICogbSkgPj4+IDA7XG4gICAgICAgIGNvbnN0IHMgPSAoYlswXSA9ICgoayBeIChrID4+IDI0KSBeICgoYlswXSAqIG0pID4+PiAwKSkgKiBtKSA+Pj4gMCk7XG4gICAgICAgIHJldHVybiAocyBeIChzID4+PiAxMykpID4+PiAwO1xuICAgIH1cbn1cblxuY2xhc3MgWG9zaGlybzEyOCBleHRlbmRzIEFSYW5kb20ge1xuICAgIGNvbnN0cnVjdG9yKHNlZWQgPSBERUZBVUxUX1NFRURfMTI4KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KDQpO1xuICAgICAgICB0aGlzLnNlZWQoc2VlZCk7XG4gICAgfVxuICAgIGNvcHkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgWG9zaGlybzEyOCh0aGlzLmJ1ZmZlcik7XG4gICAgfVxuICAgIGJ5dGVzKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIuYnVmZmVyKTtcbiAgICB9XG4gICAgc2VlZChzZWVkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLnNldChzZWVkKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGludCgpIHtcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBsZXQgdCA9IHNbMF0gKyBzWzNdO1xuICAgICAgICBjb25zdCByZXMgPSAoKHQgPDwgNykgfCAodCA+Pj4gMjUpKSA+Pj4gMDtcbiAgICAgICAgdCA9IHNbMV0gPDwgOTtcbiAgICAgICAgc1syXSBePSBzWzBdO1xuICAgICAgICBzWzNdIF49IHNbMV07XG4gICAgICAgIHNbMV0gXj0gc1syXTtcbiAgICAgICAgc1swXSBePSBzWzNdO1xuICAgICAgICBzWzJdIF49IHQ7XG4gICAgICAgIHQgPSBzWzNdO1xuICAgICAgICBzWzNdID0gKCh0IDw8IDExKSB8ICh0ID4+PiAyMSkpID4+PiAwO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbn1cblxuY2xhc3MgWG9yU2hpZnQxMjggZXh0ZW5kcyBBUmFuZG9tIHtcbiAgICBjb25zdHJ1Y3RvcihzZWVkID0gREVGQVVMVF9TRUVEXzEyOCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5ldyBVaW50MzJBcnJheSg0KTtcbiAgICAgICAgdGhpcy5zZWVkKHNlZWQpO1xuICAgIH1cbiAgICBjb3B5KCkge1xuICAgICAgICByZXR1cm4gbmV3IFhvclNoaWZ0MTI4KHRoaXMuYnVmZmVyKTtcbiAgICB9XG4gICAgYnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5idWZmZXIpO1xuICAgIH1cbiAgICBzZWVkKHNlZWQpIHtcbiAgICAgICAgdGhpcy5idWZmZXIuc2V0KHNlZWQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaW50KCkge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGxldCB0ID0gc1szXTtcbiAgICAgICAgbGV0IHc7XG4gICAgICAgIHQgXj0gdCA8PCAxMTtcbiAgICAgICAgdCBePSB0ID4+PiA4O1xuICAgICAgICBzWzNdID0gc1syXTtcbiAgICAgICAgc1syXSA9IHNbMV07XG4gICAgICAgIHcgPSBzWzFdID0gc1swXTtcbiAgICAgICAgcmV0dXJuIChzWzBdID0gKHQgXiB3IF4gKHcgPj4+IDE5KSkgPj4+IDApO1xuICAgIH1cbn1cblxuY2xhc3MgWG9yV293IGV4dGVuZHMgQVJhbmRvbSB7XG4gICAgY29uc3RydWN0b3Ioc2VlZCA9IERFRkFVTFRfU0VFRF8xNjApIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoNSk7XG4gICAgICAgIHRoaXMuc2VlZChzZWVkKTtcbiAgICB9XG4gICAgY29weSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBYb3JXb3codGhpcy5idWZmZXIpO1xuICAgIH1cbiAgICBzZWVkKHNlZWQpIHtcbiAgICAgICAgdGhpcy5idWZmZXIuc2V0KHNlZWQpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgYnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5idWZmZXIpO1xuICAgIH1cbiAgICBpbnQoKSB7XG4gICAgICAgIGNvbnN0IHMgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgbGV0IHQgPSBzWzNdO1xuICAgICAgICBsZXQgdztcbiAgICAgICAgdCBePSB0ID4+PiAyO1xuICAgICAgICB0IF49IHQgPDwgMTtcbiAgICAgICAgc1szXSA9IHNbMl07XG4gICAgICAgIHNbMl0gPSBzWzFdO1xuICAgICAgICB3ID0gc1sxXSA9IHNbMF07XG4gICAgICAgIHQgXj0gdztcbiAgICAgICAgdCBePSB3IDw8IDQ7XG4gICAgICAgIHNbMF0gPSB0O1xuICAgICAgICByZXR1cm4gKHQgKyAoc1s0XSArPSAweDU4N2M1KSkgPj4+IDA7XG4gICAgfVxufVxuXG5jbGFzcyBYc0FkZCBleHRlbmRzIEFSYW5kb20ge1xuICAgIGNvbnN0cnVjdG9yKHNlZWQgPSBERUZBVUxUX1NFRURfMzIpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoNCk7XG4gICAgICAgIHRoaXMuc2VlZChzZWVkKTtcbiAgICB9XG4gICAgYnl0ZXMoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5idWZmZXIpO1xuICAgIH1cbiAgICBjb3B5KCkge1xuICAgICAgICBjb25zdCBnZW4gPSBuZXcgWHNBZGQoKTtcbiAgICAgICAgZ2VuLmJ1ZmZlci5zZXQodGhpcy5idWZmZXIpO1xuICAgICAgICByZXR1cm4gZ2VuO1xuICAgIH1cbiAgICBzZWVkKHNlZWQpIHtcbiAgICAgICAgY29uc3QgcyA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBzLnNldChbc2VlZCwgMCwgMCwgMF0pO1xuICAgICAgICBmb3IgKGxldCBqID0gMCwgaSA9IDE7IGkgPCA4OyBqID0gaSsrKSB7XG4gICAgICAgICAgICBsZXQgeCA9IChzW2ogJiAzXSBeIChzW2ogJiAzXSA+Pj4gMzApKSA+Pj4gMDtcbiAgICAgICAgICAgIHggPSAoMHg4OTY1ICogeCArICgoKDB4NmMwNyAqIHgpICYgMHhmZmZmKSA8PCAxNikpID4+PiAwO1xuICAgICAgICAgICAgc1tpICYgM10gXj0gKGkgKyB4KSA+Pj4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaW50KCkge1xuICAgICAgICBjb25zdCBzID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGxldCB0ID0gc1swXTtcbiAgICAgICAgdCBePSB0IDw8IDE1O1xuICAgICAgICB0IF49IHQgPj4+IDE4O1xuICAgICAgICB0IF49IHNbM10gPDwgMTE7XG4gICAgICAgIHNbMF0gPSBzWzFdO1xuICAgICAgICBzWzFdID0gc1syXTtcbiAgICAgICAgc1syXSA9IHNbM107XG4gICAgICAgIHNbM10gPSB0O1xuICAgICAgICByZXR1cm4gKHQgKyBzWzJdKSA+Pj4gMDtcbiAgICB9XG59XG5cbmNvbnN0IGNvaW4gPSAocm5kID0gU1lTVEVNKSA9PiBybmQuZmxvYXQoKSA8IDAuNTtcbmNvbnN0IGZhaXJDb2luID0gKHJuZCA9IFNZU1RFTSkgPT4ge1xuICAgIGxldCBhLCBiO1xuICAgIGRvIHtcbiAgICAgICAgYSA9IGNvaW4ocm5kKTtcbiAgICAgICAgYiA9IGNvaW4ocm5kKTtcbiAgICB9IHdoaWxlIChhID09PSBiKTtcbiAgICByZXR1cm4gYTtcbn07XG5cbmNvbnN0IHJhbmRvbUlEID0gKGxlbiA9IDQsIHByZWZpeCA9IFwiXCIsIHN5bXMgPSBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCIsIHJuZCA9IFNZU1RFTSkgPT4ge1xuICAgIGNvbnN0IG4gPSBzeW1zLmxlbmd0aDtcbiAgICBmb3IgKDsgLS1sZW4gPj0gMDspIHtcbiAgICAgICAgcHJlZml4ICs9IHN5bXNbcm5kLmludCgpICUgbl07XG4gICAgfVxuICAgIHJldHVybiBwcmVmaXg7XG59O1xuXG5jb25zdCB1bmlxdWVWYWx1ZXNGcm9tID0gKGssIGZuLCBleGlzdGluZyA9IFtdLCBtYXhUcmlhbHMgPSAxMDApID0+IHtcbiAgICBsZXQgbiA9IDA7XG4gICAgd2hpbGUgKG4gPCBrKSB7XG4gICAgICAgIGxldCBpO1xuICAgICAgICBsZXQgdHJpYWxzID0gbWF4VHJpYWxzO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpID0gZm4oKTtcbiAgICAgICAgfSB3aGlsZSAoZXhpc3RpbmcuaW5jbHVkZXMoaSkgJiYgLS10cmlhbHMgPiAwKTtcbiAgICAgICAgaWYgKHRyaWFscyA8PSAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGV4aXN0aW5nLnB1c2goaSk7XG4gICAgICAgIG4rKztcbiAgICB9XG4gICAgcmV0dXJuIGV4aXN0aW5nO1xufTtcbmNvbnN0IHVuaXF1ZUluZGljZXMgPSAoaywgbWF4LCBleGlzdGluZywgbWF4VHJpYWxzID0gbWF4LCBybmQgPSBTWVNURU0pID0+IHtcbiAgICBhcGkuYXNzZXJ0KGsgPj0gMCAmJiBrIDw9IG1heCwgYGsgbXVzdCBiZSBpbiBbMCwgJHttYXh9XSBpbnRlcnZhbGApO1xuICAgIHJldHVybiB1bmlxdWVWYWx1ZXNGcm9tKGssICgpID0+IHJuZC5pbnQoKSAlIG1heCwgZXhpc3RpbmcsIG1heFRyaWFscyk7XG59O1xuXG5jb25zdCB1dWlkdjRCeXRlcyA9IChidWYsIHJuZCkgPT4ge1xuICAgIGJ1ZiA9IGJ1ZiB8fCBuZXcgVWludDhBcnJheSgxNik7XG4gICAgYnVmID0gcm5kID8gcmFuZG9tQnl0ZXNGcm9tKHJuZCwgYnVmKSA6IHJhbmRvbUJ5dGVzKGJ1Zik7XG4gICAgYnVmWzZdID0gMHg0MCB8IChidWZbNl0gJiAweDBmKTtcbiAgICBidWZbOF0gPSAweDgwIHwgKGJ1Zls4XSAmIDB4M2YpO1xuICAgIHJldHVybiBidWY7XG59O1xuY29uc3QgdXVpZCA9IChpZCwgaSA9IDApID0+IGhleC51dWlkKGlkIHx8IHV1aWR2NEJ5dGVzKCksIGkpO1xuXG5jb25zdCB3ZWlnaHRlZFJhbmRvbSA9IChjaG9pY2VzLCB3ZWlnaHRzLCBybmQgPSBTWVNURU0pID0+IHtcbiAgICBjb25zdCBuID0gY2hvaWNlcy5sZW5ndGg7XG4gICAgYXBpLmFzc2VydChuID4gMCwgXCJubyBjaG9pY2VzIGdpdmVuXCIpO1xuICAgIGNvbnN0IG9wdHMgPSB3ZWlnaHRzXG4gICAgICAgID8gY2hvaWNlc1xuICAgICAgICAgICAgLm1hcCgoeCwgaSkgPT4gW3dlaWdodHNbaV0gfHwgMCwgeF0pXG4gICAgICAgICAgICAuc29ydCgoYSwgYikgPT4gYlswXSAtIGFbMF0pXG4gICAgICAgIDogY2hvaWNlcy5tYXAoKHgpID0+IFsxLCB4XSk7XG4gICAgY29uc3QgdG90YWwgPSBvcHRzLnJlZHVjZSgoYWNjLCBvKSA9PiBhY2MgKyBvWzBdLCAwKTtcbiAgICB0b3RhbCA8PSAwICYmIGNvbnNvbGUud2FybihcInRvdGFsIHdlaWdodHMgPD0gMFwiKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjb25zdCByID0gcm5kLmZsb2F0KHRvdGFsKTtcbiAgICAgICAgbGV0IHN1bSA9IHRvdGFsO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgc3VtIC09IG9wdHNbaV1bMF07XG4gICAgICAgICAgICBpZiAoc3VtIDw9IHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0c1tpXVsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG59O1xuXG5jb25zdCBleHBvbmVudGlhbCA9IChybmQgPSBTWVNURU0sIGxhbWJkYSA9IDEwKSA9PiBsYW1iZGEgPT09IDAgPyAoKSA9PiBJbmZpbml0eSA6ICgpID0+IC1NYXRoLmxvZygxIC0gcm5kLmZsb2F0KDEpKSAvIGxhbWJkYTtcblxuY29uc3QgZ2F1c3NpYW4gPSAocm5kID0gU1lTVEVNLCBuID0gMjQsIG9mZnNldCA9IDAsIHNjYWxlID0gMSkgPT4gKCkgPT4ge1xuICAgIGxldCBzdW0gPSAwO1xuICAgIGxldCBtID0gbjtcbiAgICB3aGlsZSAobS0tID4gMClcbiAgICAgICAgc3VtICs9IHJuZC5ub3JtKHNjYWxlKTtcbiAgICByZXR1cm4gc3VtIC8gbiArIG9mZnNldDtcbn07XG5cbmNvbnN0IGdlb21ldHJpYyA9IChybmQgPSBTWVNURU0sIHAgPSAwLjUpID0+IHAgPD0gMFxuICAgID8gKCkgPT4gSW5maW5pdHlcbiAgICA6IHAgPj0gMVxuICAgICAgICA/ICgpID0+IDFcbiAgICAgICAgOiAoKHAgPSBNYXRoLmxvZygxIC0gcCkpLFxuICAgICAgICAgICAgKCkgPT4gTWF0aC5mbG9vcihNYXRoLmxvZygxIC0gcm5kLmZsb2F0KDEpKSAvIHApICsgMSk7XG5cbmNvbnN0IG5vcm1hbCA9IChybmQgPSBTWVNURU0sIGJpYXMgPSAwLCBzaWdtYSA9IDEpID0+IHtcbiAgICBsZXQgYTtcbiAgICBsZXQgYjtcbiAgICBsZXQgcjtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICBiID0gYTtcbiAgICAgICAgICAgIGEgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGEgPSBybmQubm9ybSgpO1xuICAgICAgICAgICAgICAgIGIgPSBybmQubm9ybSgpO1xuICAgICAgICAgICAgICAgIHIgPSBhICogYSArIGIgKiBiO1xuICAgICAgICAgICAgfSB3aGlsZSAociA+IDEgfHwgciA9PT0gMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJpYXMgKyBzaWdtYSAqIGIgKiBNYXRoLnNxcnQoKC0yICogTWF0aC5sb2cocikpIC8gcik7XG4gICAgfTtcbn07XG5cbmNvbnN0IHVuaWZvcm0gPSAocm5kID0gU1lTVEVNLCBtaW4gPSAwLCBtYXggPSAxKSA9PiAoKSA9PiBybmQubWlubWF4KG1pbiwgbWF4KTtcblxuZXhwb3J0cy5BUmFuZG9tID0gQVJhbmRvbTtcbmV4cG9ydHMuQ1JZUFRPID0gQ1JZUFRPO1xuZXhwb3J0cy5DcnlwdG8gPSBDcnlwdG87XG5leHBvcnRzLlNZU1RFTSA9IFNZU1RFTTtcbmV4cG9ydHMuU211c2gzMiA9IFNtdXNoMzI7XG5leHBvcnRzLlN5c3RlbVJhbmRvbSA9IFN5c3RlbVJhbmRvbTtcbmV4cG9ydHMuWG9yU2hpZnQxMjggPSBYb3JTaGlmdDEyODtcbmV4cG9ydHMuWG9yV293ID0gWG9yV293O1xuZXhwb3J0cy5Yb3NoaXJvMTI4ID0gWG9zaGlybzEyODtcbmV4cG9ydHMuWHNBZGQgPSBYc0FkZDtcbmV4cG9ydHMuY29pbiA9IGNvaW47XG5leHBvcnRzLmV4cG9uZW50aWFsID0gZXhwb25lbnRpYWw7XG5leHBvcnRzLmZhaXJDb2luID0gZmFpckNvaW47XG5leHBvcnRzLmdhdXNzaWFuID0gZ2F1c3NpYW47XG5leHBvcnRzLmdlb21ldHJpYyA9IGdlb21ldHJpYztcbmV4cG9ydHMubm9ybWFsID0gbm9ybWFsO1xuZXhwb3J0cy5yYW5kb21CeXRlcyA9IHJhbmRvbUJ5dGVzO1xuZXhwb3J0cy5yYW5kb21CeXRlc0Zyb20gPSByYW5kb21CeXRlc0Zyb207XG5leHBvcnRzLnJhbmRvbUlEID0gcmFuZG9tSUQ7XG5leHBvcnRzLnVuaWZvcm0gPSB1bmlmb3JtO1xuZXhwb3J0cy51bmlxdWVJbmRpY2VzID0gdW5pcXVlSW5kaWNlcztcbmV4cG9ydHMudW5pcXVlVmFsdWVzRnJvbSA9IHVuaXF1ZVZhbHVlc0Zyb207XG5leHBvcnRzLnV1aWQgPSB1dWlkO1xuZXhwb3J0cy51dWlkdjRCeXRlcyA9IHV1aWR2NEJ5dGVzO1xuZXhwb3J0cy53ZWlnaHRlZFJhbmRvbSA9IHdlaWdodGVkUmFuZG9tO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgdHJhbnNkdWNlcnMgPSByZXF1aXJlKCdAdGhpLm5nL3RyYW5zZHVjZXJzJyk7XG52YXIgYmluYXJ5ID0gcmVxdWlyZSgnQHRoaS5uZy9iaW5hcnknKTtcbnZhciBlcnJvcnMgPSByZXF1aXJlKCdAdGhpLm5nL2Vycm9ycycpO1xudmFyIGNvbXBvc2UgPSByZXF1aXJlKCdAdGhpLm5nL2NvbXBvc2UnKTtcbnZhciBoZXggPSByZXF1aXJlKCdAdGhpLm5nL2hleCcpO1xudmFyIHJhbmRvbSA9IHJlcXVpcmUoJ0B0aGkubmcvcmFuZG9tJyk7XG5cbmNvbnN0IEI2NF9DSEFSUyA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiO1xuY29uc3QgQjY0X1NBRkUgPSBCNjRfQ0hBUlMuc3Vic3RyKDAsIDYyKSArIFwiLV9cIjtcbmZ1bmN0aW9uIGJhc2U2NERlY29kZShzcmMpIHtcbiAgICByZXR1cm4gc3JjXG4gICAgICAgID8gdHJhbnNkdWNlcnMuaXRlcmF0b3IxKGJhc2U2NERlY29kZSgpLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGxldCBiYyA9IDAsIGJzID0gMDtcbiAgICAgICAgICAgIHJldHVybiB0cmFuc2R1Y2Vycy5jb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIi1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHggPSBcIitcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiX1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IFwiL1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCI9XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMucmVkdWNlZChhY2MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgeSA9IEI2NF9DSEFSUy5pbmRleE9mKHgpO1xuICAgICAgICAgICAgICAgIGJzID0gYmMgJiAzID8gKGJzIDw8IDYpICsgeSA6IHk7XG4gICAgICAgICAgICAgICAgaWYgKGJjKysgJiAzKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IHIoYWNjLCAyNTUgJiAoYnMgPj4gKCgtMiAqIGJjKSAmIDYpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbn1cbmZ1bmN0aW9uIGJhc2U2NEVuY29kZSguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9IHRyYW5zZHVjZXJzLiRpdGVyKGJhc2U2NEVuY29kZSwgYXJncywgdHJhbnNkdWNlcnMuaXRlcmF0b3IpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBbLi4uaXRlcl0uam9pbihcIlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgbGV0IHN0YXRlID0gMDtcbiAgICAgICAgbGV0IGI7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBPYmplY3QuYXNzaWduKHsgc2FmZTogZmFsc2UsIGJ1ZmZlcjogMTAyNCB9LCBhcmdzWzBdKTtcbiAgICAgICAgY29uc3QgY2hhcnMgPSBvcHRzLnNhZmUgPyBCNjRfU0FGRSA6IEI2NF9DSEFSUztcbiAgICAgICAgY29uc3QgYnVmID0gW107XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICAgICAgYnVmLnB1c2goY2hhcnNbKGIgPj4gMTgpICYgMHgzZl0sIGNoYXJzWyhiID4+IDEyKSAmIDB4M2ZdLCBcIj1cIiwgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zi5wdXNoKGNoYXJzWyhiID4+IDE4KSAmIDB4M2ZdLCBjaGFyc1soYiA+PiAxMikgJiAweDNmXSwgY2hhcnNbKGIgPj4gNikgJiAweDNmXSwgXCI9XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdoaWxlIChidWYubGVuZ3RoICYmICF0cmFuc2R1Y2Vycy5pc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgPSB4IDw8IDE2O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgKz0geCA8PCA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiICs9IHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWYucHVzaChjaGFyc1soYiA+PiAxOCkgJiAweDNmXSwgY2hhcnNbKGIgPj4gMTIpICYgMHgzZl0sIGNoYXJzWyhiID4+IDYpICYgMHgzZl0sIGNoYXJzW2IgJiAweDNmXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnVmLmxlbmd0aCA+PSBvcHRzLmJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBuID0gYnVmLmxlbmd0aDsgaSA8IG4gJiYgIXRyYW5zZHVjZXJzLmlzUmVkdWNlZChhY2MpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVmLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHV0ZjhEZWNvZGUoc3JjKSB7XG4gICAgcmV0dXJuIHNyY1xuICAgICAgICA/IFsuLi50cmFuc2R1Y2Vycy5pdGVyYXRvcjEodXRmOERlY29kZSgpLCBzcmMpXS5qb2luKFwiXCIpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGxldCBzdGF0ZSA9IDA7XG4gICAgICAgICAgICBsZXQgdTA7XG4gICAgICAgICAgICBsZXQgdTE7XG4gICAgICAgICAgICBsZXQgdTI7XG4gICAgICAgICAgICBsZXQgdTM7XG4gICAgICAgICAgICBsZXQgdTQ7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMuY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeCA8IDB4ODApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIFN0cmluZy5mcm9tQ2hhckNvZGUoeCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdTAgPSB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHUxID0geCAmIDB4M2Y7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHUwICYgMHhlMCkgPT09IDB4YzApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCBTdHJpbmcuZnJvbUNoYXJDb2RlKCgodTAgJiAweDFmKSA8PCA2KSB8IHUxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgdTIgPSB4ICYgMHgzZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodTAgJiAweGYwKSA9PT0gMHhlMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIFN0cmluZy5mcm9tQ2hhckNvZGUoKCh1MCAmIDB4MGYpIDw8IDEyKSB8ICh1MSA8PCA2KSB8IHUyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICAgICAgdTMgPSB4ICYgMHgzZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodTAgJiAweGY4KSA9PT0gMHhmMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIGNvZGVQb2ludCgoKHUwICYgNykgPDwgMTgpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHUxIDw8IDEyKSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MiA8PCA2KSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHUzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdTQgPSB4ICYgMHgzZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodTAgJiAweGZjKSA9PT0gMHhmOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIGNvZGVQb2ludCgoKHUwICYgMykgPDwgMjQpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHUxIDw8IDE4KSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MiA8PCAxMikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodTMgPDwgNikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1NCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSA1O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByKGFjYywgY29kZVBvaW50KCgodTAgJiAxKSA8PCAzMCkgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MSA8PCAyNCkgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MiA8PCAxOCkgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1MyA8PCAxMikgfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICh1NCA8PCA2KSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHggJiAweDNmKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5mdW5jdGlvbiB1dGY4RW5jb2RlKHNyYykge1xuICAgIHJldHVybiBzcmMgIT0gbnVsbFxuICAgICAgICA/IHRyYW5zZHVjZXJzLml0ZXJhdG9yKHV0ZjhFbmNvZGUoKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMuY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHUgPSB4LmNoYXJDb2RlQXQoMCksIGJ1ZjtcbiAgICAgICAgICAgICAgICBpZiAodSA+PSAweGQ4MDAgJiYgdSA8PSAweGRmZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAoMHgxMDAwMCArICgodSAmIDB4M2ZmKSA8PCAxMCkpIHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoeC5jaGFyQ29kZUF0KDEpICYgMHgzZmYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodSA8IDB4ODApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCB1KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodSA8IDB4ODAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZiA9IFsweGMwIHwgKHUgPj4gNiksIDB4ODAgfCAodSAmIDB4M2YpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodSA8IDB4MTAwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgMHhlMCB8ICh1ID4+IDEyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gNikgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAodSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh1IDwgMHgyMDAwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgMHhmMCB8ICh1ID4+IDE4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gMTIpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDYpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKHUgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodSA8IDB4NDAwMDAwMCkge1xuICAgICAgICAgICAgICAgICAgICBidWYgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAweGY4IHwgKHUgPj4gMjQpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiAxOCkgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gMTIpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDYpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKHUgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZiA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ZmMgfCAodSA+PiAzMCksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDI0KSAmIDB4M2YpLFxuICAgICAgICAgICAgICAgICAgICAgICAgMHg4MCB8ICgodSA+PiAxOCkgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDB4ODAgfCAoKHUgPj4gMTIpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKCh1ID4+IDYpICYgMHgzZiksXG4gICAgICAgICAgICAgICAgICAgICAgICAweDgwIHwgKHUgJiAweDNmKSxcbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIG4gPSBidWYubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IHIoYWNjLCBidWZbaV0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNkdWNlcnMuaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbn1cbmNvbnN0IGNvZGVQb2ludCA9ICh4KSA9PiB4IDwgMHgxMDAwMFxuICAgID8gU3RyaW5nLmZyb21DaGFyQ29kZSh4KVxuICAgIDogKCh4IC09IDB4MTAwMDApLFxuICAgICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4ZDgwMCB8ICh4ID4+IDEwKSwgMHhkYzAwIHwgKHggJiAweDNmZikpKTtcbmNvbnN0IHV0ZjhMZW5ndGggPSAoc3RyKSA9PiB7XG4gICAgY29uc3QgbiA9IHN0ci5sZW5ndGg7XG4gICAgbGV0IGxlbiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgbGV0IHUgPSBzdHIuY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKHUgPj0gMHhkODAwICYmIHUgPD0gMHhkZmZmKSB7XG4gICAgICAgICAgICB1ID0gKDB4MTAwMDAgKyAoKHUgJiAweDNmZikgPDwgMTApKSB8IChzdHIuY2hhckNvZGVBdCgrK2kpICYgMHgzZmYpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiArPVxuICAgICAgICAgICAgdSA8PSAweDdmXG4gICAgICAgICAgICAgICAgPyAxXG4gICAgICAgICAgICAgICAgOiB1IDw9IDB4N2ZmXG4gICAgICAgICAgICAgICAgICAgID8gMlxuICAgICAgICAgICAgICAgICAgICA6IHUgPD0gMHhmZmZmXG4gICAgICAgICAgICAgICAgICAgICAgICA/IDNcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdSA8PSAweDFmZmZmZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gNFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdSA8PSAweDNmZmZmZmZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyA1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogNjtcbiAgICB9XG4gICAgcmV0dXJuIGxlbjtcbn07XG5cbmNvbnN0IGk4ID0gKHgpID0+IFtcImk4XCIsIHhdO1xuY29uc3QgaThhcnJheSA9ICh4KSA9PiBbXCJpOGFcIiwgeF07XG5jb25zdCB1OCA9ICh4KSA9PiBbXCJ1OFwiLCB4XTtcbmNvbnN0IHU4YXJyYXkgPSAoeCkgPT4gW1widThhXCIsIHhdO1xuY29uc3QgaTE2ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcImkxNlwiLCB4LCBsZV07XG5jb25zdCBpMTZhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJpMTZhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCB1MTYgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1widTE2XCIsIHgsIGxlXTtcbmNvbnN0IHUxNmFycmF5ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcbiAgICBcInUxNmFcIixcbiAgICB4LFxuICAgIGxlLFxuXTtcbmNvbnN0IGkyNCA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXCJpMjRcIiwgeCwgbGVdO1xuY29uc3QgaTI0YXJyYXkgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1xuICAgIFwiaTI0YVwiLFxuICAgIHgsXG4gICAgbGUsXG5dO1xuY29uc3QgdTI0ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcInUyNFwiLCB4LCBsZV07XG5jb25zdCB1MjRhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJ1MjRhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCBpMzIgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1wiaTMyXCIsIHgsIGxlXTtcbmNvbnN0IGkzMmFycmF5ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcbiAgICBcImkzMmFcIixcbiAgICB4LFxuICAgIGxlLFxuXTtcbmNvbnN0IHUzMiA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXCJ1MzJcIiwgeCwgbGVdO1xuY29uc3QgdTMyYXJyYXkgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1xuICAgIFwidTMyYVwiLFxuICAgIHgsXG4gICAgbGUsXG5dO1xuY29uc3QgZjMyID0gKHgsIGxlID0gZmFsc2UpID0+IFtcImYzMlwiLCB4LCBsZV07XG5jb25zdCBmMzJhcnJheSA9ICh4LCBsZSA9IGZhbHNlKSA9PiBbXG4gICAgXCJmMzJhXCIsXG4gICAgeCxcbiAgICBsZSxcbl07XG5jb25zdCBmNjQgPSAoeCwgbGUgPSBmYWxzZSkgPT4gW1wiZjY0XCIsIHgsIGxlXTtcbmNvbnN0IGY2NGFycmF5ID0gKHgsIGxlID0gZmFsc2UpID0+IFtcbiAgICBcImY2NGFcIixcbiAgICB4LFxuICAgIGxlLFxuXTtcbmNvbnN0IHN0ciA9ICh4KSA9PiBbXCJzdHJcIiwgeF07XG5mdW5jdGlvbiBhc0J5dGVzKHNyYykge1xuICAgIHJldHVybiBzcmNcbiAgICAgICAgPyB0cmFuc2R1Y2Vycy5pdGVyYXRvcihhc0J5dGVzKCksIHNyYylcbiAgICAgICAgOiB0cmFuc2R1Y2Vycy5tYXBjYXQoKHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHhbMV07XG4gICAgICAgICAgICBjb25zdCBsZSA9IHhbMl07XG4gICAgICAgICAgICBzd2l0Y2ggKHhbMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaThcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidThcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFt2YWxdO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJpOGFcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidThhXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4WzFdO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJpMTZcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidTE2XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnkuYnl0ZXMxNih2YWwsIGxlKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaTE2YVwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1MTZhXCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cmFuc2R1Y2Vycy5tYXBjYXQoKHgpID0+IGJpbmFyeS5ieXRlczE2KHgsIGxlKSwgeFsxXSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImkyNFwiOlxuICAgICAgICAgICAgICAgIGNhc2UgXCJ1MjRcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeS5ieXRlczI0KHZhbCwgbGUpO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJpMjRhXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInUyNGFcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLm1hcGNhdCgoeCkgPT4gYmluYXJ5LmJ5dGVzMjQoeCwgbGUpLCB4WzFdKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiaTMyXCI6XG4gICAgICAgICAgICAgICAgY2FzZSBcInUzMlwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5LmJ5dGVzMzIodmFsLCBsZSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImkzMmFcIjpcbiAgICAgICAgICAgICAgICBjYXNlIFwidTMyYVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMubWFwY2F0KCh4KSA9PiBiaW5hcnkuYnl0ZXMzMih4LCBsZSksIHhbMV0pO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJmMzJcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeS5ieXRlc0YzMih2YWwsIGxlKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZjMyYVwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMubWFwY2F0KCh4KSA9PiBiaW5hcnkuYnl0ZXNGMzIoeCwgbGUpLCB4WzFdKTtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZjY0XCI6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnkuYnl0ZXNGNjQodmFsLCBsZSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcImY2NGFcIjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXJzLm1hcGNhdCgoeCkgPT4gYmluYXJ5LmJ5dGVzRjY0KHgsIGxlKSwgeFsxXSk7XG4gICAgICAgICAgICAgICAgY2FzZSBcInN0clwiOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdXRmOEVuY29kZSh4WzFdKTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMudW5zdXBwb3J0ZWQoYGludmFsaWQgc3RydWN0IGl0ZW06ICR7eFswXX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59XG5mdW5jdGlvbiBieXRlcyhjYXAgPSAxMDI0LCBzcmMpIHtcbiAgICBsZXQgdmlldztcbiAgICBsZXQgcG9zID0gMDtcbiAgICBjb25zdCBlbnN1cmUgPSAoYWNjLCBzaXplKSA9PiB7XG4gICAgICAgIGlmIChwb3MgKyBzaXplIDw9IGNhcClcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIGNhcCAqPSAyO1xuICAgICAgICBjb25zdCBidWYgPSBuZXcgVWludDhBcnJheShjYXApO1xuICAgICAgICBidWYuc2V0KGFjYyk7XG4gICAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmLmJ1ZmZlcik7XG4gICAgICAgIHJldHVybiBidWY7XG4gICAgfTtcbiAgICBjb25zdCBzZXRBcnJheSA9IChmbiwgc3RyaWRlLCBhY2MsIHgsIGxlKSA9PiB7XG4gICAgICAgIGNvbnN0IG4gPSB4Lmxlbmd0aDtcbiAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgc3RyaWRlICogbik7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrLCBwb3MgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2aWV3W2ZuXShwb3MsIHhbaV0sIGxlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgIH07XG4gICAgcmV0dXJuIHNyY1xuICAgICAgICA/IHRyYW5zZHVjZXJzLnJlZHVjZShieXRlcyhjYXApLCBzcmMpXG4gICAgICAgIDogW1xuICAgICAgICAgICAgKCkgPT4gbmV3IFVpbnQ4QXJyYXkoY2FwKSxcbiAgICAgICAgICAgIChhY2MpID0+IGFjYy5zdWJhcnJheSgwLCBwb3MpLFxuICAgICAgICAgICAgKGFjYywgW3R5cGUsIHgsIGxlID0gZmFsc2VdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF2aWV3IHx8IHZpZXcuYnVmZmVyICE9PSBhY2MuYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhcCA9IGFjYy5ieXRlTGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB2aWV3ID0gbmV3IERhdGFWaWV3KGFjYy5idWZmZXIsIGFjYy5ieXRlT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpOFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEludDgocG9zLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpOGFcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IHgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgSW50OEFycmF5KGFjYy5idWZmZXIsIGFjYy5ieXRlT2Zmc2V0KS5zZXQoeCwgcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSBuO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInU4XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDgocG9zLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1OGFcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbiA9IHgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2Muc2V0KHgsIHBvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpMTZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRJbnQxNihwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpMTZhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldEludDE2XCIsIDIsIGFjYywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1MTZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYocG9zLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidTE2YVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gc2V0QXJyYXkoXCJzZXRVaW50MTZcIiwgMiwgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImkyNFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldEludDMyKHBvcywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImkyNGFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHNldEFycmF5KFwic2V0SW50MzJcIiwgMywgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInUyNFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgNCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMihwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSAzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ1MjRhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldFVpbnQzMlwiLCAzLCBhY2MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaTMyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCA0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0SW50MzIocG9zLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3MgKz0gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaTMyYVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gc2V0QXJyYXkoXCJzZXRJbnQzMlwiLCA0LCBhY2MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwidTMyXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCA0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKHBvcywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInUzMmFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHNldEFycmF5KFwic2V0VWludDMyXCIsIDQsIGFjYywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmMzJcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IGVuc3VyZShhY2MsIDQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRGbG9hdDMyKHBvcywgeCwgbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImYzMmFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHNldEFycmF5KFwic2V0RmxvYXQzMlwiLCA0LCBhY2MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZjY0XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBlbnN1cmUoYWNjLCA4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0RmxvYXQ2NChwb3MsIHgsIGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSA4O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJmNjRhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSBzZXRBcnJheShcInNldEZsb2F0NjRcIiwgOCwgYWNjLCB4LCBsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInN0clwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXRmID0gWy4uLnV0ZjhFbmNvZGUoeCldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZW5zdXJlKGFjYywgdXRmLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2Muc2V0KHV0ZiwgcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcyArPSB1dGYubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF07XG59XG5cbmZ1bmN0aW9uIGJpdHMoLi4uYXJncykge1xuICAgIHJldHVybiAodHJhbnNkdWNlcnMuJGl0ZXIoYml0cywgYXJncywgdHJhbnNkdWNlcnMuaXRlcmF0b3IpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBzaXplID0gYXJnc1swXSB8fCA4O1xuICAgICAgICAgICAgY29uc3QgbXNiID0gYXJnc1sxXSAhPT0gZmFsc2U7XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNkdWNlcnMuY29tcFIocmZuLCBtc2JcbiAgICAgICAgICAgICAgICA/IChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IHNpemU7IC0taSA+PSAwICYmICF0cmFuc2R1Y2Vycy5pc1JlZHVjZWQoYWNjKTspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsICh4ID4+PiBpKSAmIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemUgJiYgIXRyYW5zZHVjZXJzLmlzUmVkdWNlZChhY2MpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsICh4ID4+PiBpKSAmIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gaGV4RHVtcCguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9IHRyYW5zZHVjZXJzLiRpdGVyKGhleER1bXAsIGFyZ3MsIHRyYW5zZHVjZXJzLml0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgeyBjb2xzLCBhZGRyZXNzIH0gPSBPYmplY3QuYXNzaWduKHsgY29sczogMTYsIGFkZHJlc3M6IDAgfSwgYXJnc1swXSk7XG4gICAgcmV0dXJuIHRyYW5zZHVjZXJzLmNvbXAodHJhbnNkdWNlcnMucGFkTGFzdChjb2xzLCAwKSwgdHJhbnNkdWNlcnMubWFwKGNvbXBvc2UuanV4dChoZXguVTgsICh4KSA9PiAoeCA+IDMxICYmIHggPCAxMjcgPyBTdHJpbmcuZnJvbUNoYXJDb2RlKHgpIDogXCIuXCIpKSksIHRyYW5zZHVjZXJzLnBhcnRpdGlvbihjb2xzLCB0cnVlKSwgdHJhbnNkdWNlcnMubWFwKGNvbXBvc2UuanV4dCgoeCkgPT4geC5tYXAoKHkpID0+IHlbMF0pLmpvaW4oXCIgXCIpLCAoeCkgPT4geC5tYXAoKHkpID0+IHlbMV0pLmpvaW4oXCJcIikpKSwgdHJhbnNkdWNlcnMubWFwSW5kZXhlZCgoaSwgW2gsIGFdKSA9PiBgJHtoZXguVTMyKGFkZHJlc3MgKyBpICogY29scyl9IHwgJHtofSB8ICR7YX1gKSk7XG59XG5jb25zdCBoZXhEdW1wU3RyaW5nID0gKG9wdHMsIHNyYykgPT4gWy4uLmhleER1bXAob3B0cywgc3JjKV0uam9pbihcIlxcblwiKTtcblxuZnVuY3Rpb24gcGFydGl0aW9uQml0cyguLi5hcmdzKSB7XG4gICAgcmV0dXJuICh0cmFuc2R1Y2Vycy4kaXRlcihwYXJ0aXRpb25CaXRzLCBhcmdzLCB0cmFuc2R1Y2Vycy5pdGVyYXRvcikgfHxcbiAgICAgICAgKChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRlc3RTaXplID0gYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IHNyY1NpemUgPSBhcmdzWzFdIHx8IDg7XG4gICAgICAgICAgICByZXR1cm4gZGVzdFNpemUgPCBzcmNTaXplXG4gICAgICAgICAgICAgICAgPyBzbWFsbChyZm4sIGRlc3RTaXplLCBzcmNTaXplKVxuICAgICAgICAgICAgICAgIDogZGVzdFNpemUgPiBzcmNTaXplXG4gICAgICAgICAgICAgICAgICAgID8gbGFyZ2UocmZuLCBkZXN0U2l6ZSwgc3JjU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZm47XG4gICAgICAgIH0pKTtcbn1cbmNvbnN0IHNtYWxsID0gKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSwgbiwgd29yZFNpemUpID0+IHtcbiAgICBjb25zdCBtYXhiID0gd29yZFNpemUgLSBuO1xuICAgIGNvbnN0IG0xID0gKDEgPDwgd29yZFNpemUpIC0gMTtcbiAgICBjb25zdCBtMiA9ICgxIDw8IG4pIC0gMTtcbiAgICBsZXQgciA9IDA7XG4gICAgbGV0IHkgPSAwO1xuICAgIHJldHVybiBbXG4gICAgICAgIGluaXQsXG4gICAgICAgIChhY2MpID0+IGNvbXBsZXRlKHIgPiAwID8gcmVkdWNlKGFjYywgeSkgOiBhY2MpLFxuICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICBsZXQgYiA9IDA7XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgeSArICgoeCA+Pj4gKG1heGIgKyByKSkgJiBtMikpO1xuICAgICAgICAgICAgICAgIGIgKz0gbiAtIHI7XG4gICAgICAgICAgICAgICAgeCA9ICh4IDw8IChuIC0gcikpICYgbTE7XG4gICAgICAgICAgICAgICAgeSA9IDA7XG4gICAgICAgICAgICAgICAgciA9IDA7XG4gICAgICAgICAgICB9IHdoaWxlIChiIDw9IG1heGIgJiYgIXRyYW5zZHVjZXJzLmlzUmVkdWNlZChhY2MpKTtcbiAgICAgICAgICAgIHIgPSB3b3JkU2l6ZSAtIGI7XG4gICAgICAgICAgICB5ID0gciA+IDAgPyAoeCA+Pj4gbWF4YikgJiBtMiA6IDA7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LFxuICAgIF07XG59O1xuY29uc3QgbGFyZ2UgPSAoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdLCBuLCB3b3JkU2l6ZSkgPT4ge1xuICAgIGNvbnN0IG0xID0gKDEgPDwgd29yZFNpemUpIC0gMTtcbiAgICBsZXQgciA9IDA7XG4gICAgbGV0IHkgPSAwO1xuICAgIHJldHVybiBbXG4gICAgICAgIGluaXQsXG4gICAgICAgIChhY2MpID0+IGNvbXBsZXRlKHIgPiAwID8gcmVkdWNlKGFjYywgeSkgOiBhY2MpLFxuICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICBpZiAociArIHdvcmRTaXplIDw9IG4pIHtcbiAgICAgICAgICAgICAgICB5IHw9ICh4ICYgbTEpIDw8IChuIC0gd29yZFNpemUgLSByKTtcbiAgICAgICAgICAgICAgICByICs9IHdvcmRTaXplO1xuICAgICAgICAgICAgICAgIGlmIChyID09PSBuKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIHkpO1xuICAgICAgICAgICAgICAgICAgICB5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgciA9IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgayA9IG4gLSByO1xuICAgICAgICAgICAgICAgIHIgPSB3b3JkU2l6ZSAtIGs7XG4gICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgeSB8ICgoeCA+Pj4gcikgJiAoKDEgPDwgaykgLSAxKSkpO1xuICAgICAgICAgICAgICAgIHkgPSAoeCAmICgoMSA8PCByKSAtIDEpKSA8PCAobiAtIHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICBdO1xufTtcblxuY29uc3QgcmFuZG9tQml0cyA9IChwcm9iLCBudW0sIHJuZCA9IHJhbmRvbS5TWVNURU0pID0+IHRyYW5zZHVjZXJzLnJlcGVhdGVkbHkoKCkgPT4gKHJuZC5mbG9hdCgpIDwgcHJvYiA/IDEgOiAwKSwgbnVtKTtcblxuZXhwb3J0cy5hc0J5dGVzID0gYXNCeXRlcztcbmV4cG9ydHMuYmFzZTY0RGVjb2RlID0gYmFzZTY0RGVjb2RlO1xuZXhwb3J0cy5iYXNlNjRFbmNvZGUgPSBiYXNlNjRFbmNvZGU7XG5leHBvcnRzLmJpdHMgPSBiaXRzO1xuZXhwb3J0cy5ieXRlcyA9IGJ5dGVzO1xuZXhwb3J0cy5mMzIgPSBmMzI7XG5leHBvcnRzLmYzMmFycmF5ID0gZjMyYXJyYXk7XG5leHBvcnRzLmY2NCA9IGY2NDtcbmV4cG9ydHMuZjY0YXJyYXkgPSBmNjRhcnJheTtcbmV4cG9ydHMuaGV4RHVtcCA9IGhleER1bXA7XG5leHBvcnRzLmhleER1bXBTdHJpbmcgPSBoZXhEdW1wU3RyaW5nO1xuZXhwb3J0cy5pMTYgPSBpMTY7XG5leHBvcnRzLmkxNmFycmF5ID0gaTE2YXJyYXk7XG5leHBvcnRzLmkyNCA9IGkyNDtcbmV4cG9ydHMuaTI0YXJyYXkgPSBpMjRhcnJheTtcbmV4cG9ydHMuaTMyID0gaTMyO1xuZXhwb3J0cy5pMzJhcnJheSA9IGkzMmFycmF5O1xuZXhwb3J0cy5pOCA9IGk4O1xuZXhwb3J0cy5pOGFycmF5ID0gaThhcnJheTtcbmV4cG9ydHMucGFydGl0aW9uQml0cyA9IHBhcnRpdGlvbkJpdHM7XG5leHBvcnRzLnJhbmRvbUJpdHMgPSByYW5kb21CaXRzO1xuZXhwb3J0cy5zdHIgPSBzdHI7XG5leHBvcnRzLnUxNiA9IHUxNjtcbmV4cG9ydHMudTE2YXJyYXkgPSB1MTZhcnJheTtcbmV4cG9ydHMudTI0ID0gdTI0O1xuZXhwb3J0cy51MjRhcnJheSA9IHUyNGFycmF5O1xuZXhwb3J0cy51MzIgPSB1MzI7XG5leHBvcnRzLnUzMmFycmF5ID0gdTMyYXJyYXk7XG5leHBvcnRzLnU4ID0gdTg7XG5leHBvcnRzLnU4YXJyYXkgPSB1OGFycmF5O1xuZXhwb3J0cy51dGY4RGVjb2RlID0gdXRmOERlY29kZTtcbmV4cG9ydHMudXRmOEVuY29kZSA9IHV0ZjhFbmNvZGU7XG5leHBvcnRzLnV0ZjhMZW5ndGggPSB1dGY4TGVuZ3RoO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgYXBpID0gcmVxdWlyZSgnQHRoaS5uZy9hcGknKTtcbnZhciBjaGVja3MgPSByZXF1aXJlKCdAdGhpLm5nL2NoZWNrcycpO1xudmFyIGVycm9ycyA9IHJlcXVpcmUoJ0B0aGkubmcvZXJyb3JzJyk7XG52YXIgY29tcG9zZSA9IHJlcXVpcmUoJ0B0aGkubmcvY29tcG9zZScpO1xudmFyIGNvbXBhcmUgPSByZXF1aXJlKCdAdGhpLm5nL2NvbXBhcmUnKTtcbnZhciBtYXRoID0gcmVxdWlyZSgnQHRoaS5uZy9tYXRoJyk7XG52YXIgYXJyYXlzID0gcmVxdWlyZSgnQHRoaS5uZy9hcnJheXMnKTtcbnZhciByYW5kb20gPSByZXF1aXJlKCdAdGhpLm5nL3JhbmRvbScpO1xuXG5jb25zdCBlbnN1cmVUcmFuc2R1Y2VyID0gKHgpID0+IGNoZWNrcy5pbXBsZW1lbnRzRnVuY3Rpb24oeCwgXCJ4Zm9ybVwiKSA/IHgueGZvcm0oKSA6IHg7XG5cbmNsYXNzIFJlZHVjZWQge1xuICAgIGNvbnN0cnVjdG9yKHZhbCkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgIH1cbiAgICBkZXJlZigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWU7XG4gICAgfVxufVxuY29uc3QgcmVkdWNlZCA9ICh4KSA9PiBuZXcgUmVkdWNlZCh4KTtcbmNvbnN0IGlzUmVkdWNlZCA9ICh4KSA9PiB4IGluc3RhbmNlb2YgUmVkdWNlZDtcbmNvbnN0IGVuc3VyZVJlZHVjZWQgPSAoeCkgPT4geCBpbnN0YW5jZW9mIFJlZHVjZWQgPyB4IDogbmV3IFJlZHVjZWQoeCk7XG5jb25zdCB1bnJlZHVjZWQgPSAoeCkgPT4gKHggaW5zdGFuY2VvZiBSZWR1Y2VkID8geC5kZXJlZigpIDogeCk7XG5cbmNvbnN0IHBhcnNlQXJncyA9IChhcmdzKSA9PiBhcmdzLmxlbmd0aCA9PT0gMlxuICAgID8gW3VuZGVmaW5lZCwgYXJnc1sxXV1cbiAgICA6IGFyZ3MubGVuZ3RoID09PSAzXG4gICAgICAgID8gW2FyZ3NbMV0sIGFyZ3NbMl1dXG4gICAgICAgIDogZXJyb3JzLmlsbGVnYWxBcml0eShhcmdzLmxlbmd0aCk7XG5mdW5jdGlvbiByZWR1Y2UoLi4uYXJncykge1xuICAgIGNvbnN0IHJmbiA9IGFyZ3NbMF07XG4gICAgY29uc3QgaW5pdCA9IHJmblswXTtcbiAgICBjb25zdCBjb21wbGV0ZSA9IHJmblsxXTtcbiAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgYXJncyA9IHBhcnNlQXJncyhhcmdzKTtcbiAgICBjb25zdCBhY2MgPSBhcmdzWzBdID09IG51bGwgPyBpbml0KCkgOiBhcmdzWzBdO1xuICAgIGNvbnN0IHhzID0gYXJnc1sxXTtcbiAgICByZXR1cm4gdW5yZWR1Y2VkKGNvbXBsZXRlKGNoZWNrcy5pbXBsZW1lbnRzRnVuY3Rpb24oeHMsIFwiJHJlZHVjZVwiKVxuICAgICAgICA/IHhzLiRyZWR1Y2UocmVkdWNlLCBhY2MpXG4gICAgICAgIDogY2hlY2tzLmlzQXJyYXlMaWtlKHhzKVxuICAgICAgICAgICAgPyByZWR1Y2VBcnJheShyZWR1Y2UsIGFjYywgeHMpXG4gICAgICAgICAgICA6IHJlZHVjZUl0ZXJhYmxlKHJlZHVjZSwgYWNjLCB4cykpKTtcbn1cbmZ1bmN0aW9uIHJlZHVjZVJpZ2h0KC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZm4gPSBhcmdzWzBdO1xuICAgIGNvbnN0IGluaXQgPSByZm5bMF07XG4gICAgY29uc3QgY29tcGxldGUgPSByZm5bMV07XG4gICAgY29uc3QgcmVkdWNlID0gcmZuWzJdO1xuICAgIGFyZ3MgPSBwYXJzZUFyZ3MoYXJncyk7XG4gICAgbGV0IGFjYyA9IGFyZ3NbMF0gPT0gbnVsbCA/IGluaXQoKSA6IGFyZ3NbMF07XG4gICAgY29uc3QgeHMgPSBhcmdzWzFdO1xuICAgIGZvciAobGV0IGkgPSB4cy5sZW5ndGg7IC0taSA+PSAwOykge1xuICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCB4c1tpXSk7XG4gICAgICAgIGlmIChpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgYWNjID0gYWNjLmRlcmVmKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5yZWR1Y2VkKGNvbXBsZXRlKGFjYykpO1xufVxuY29uc3QgcmVkdWNlQXJyYXkgPSAocmZuLCBhY2MsIHhzKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSB4cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgYWNjID0gcmZuKGFjYywgeHNbaV0pO1xuICAgICAgICBpZiAoaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgIGFjYyA9IGFjYy5kZXJlZigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbn07XG5jb25zdCByZWR1Y2VJdGVyYWJsZSA9IChyZm4sIGFjYywgeHMpID0+IHtcbiAgICBmb3IgKGxldCB4IG9mIHhzKSB7XG4gICAgICAgIGFjYyA9IHJmbihhY2MsIHgpO1xuICAgICAgICBpZiAoaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgIGFjYyA9IGFjYy5kZXJlZigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFjYztcbn07XG5jb25zdCByZWR1Y2VyID0gKGluaXQsIHJmbikgPT4gW2luaXQsIChhY2MpID0+IGFjYywgcmZuXTtcbmNvbnN0ICQkcmVkdWNlID0gKHJmbiwgYXJncykgPT4ge1xuICAgIGNvbnN0IG4gPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKGFyZ3Nbbl0pXG4gICAgICAgID8gYXJncy5sZW5ndGggPiAxXG4gICAgICAgICAgICA/IHJlZHVjZShyZm4uYXBwbHkobnVsbCwgYXJncy5zbGljZSgwLCBuKSksIGFyZ3Nbbl0pXG4gICAgICAgICAgICA6IHJlZHVjZShyZm4oKSwgYXJnc1swXSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG59O1xuXG5mdW5jdGlvbiBwdXNoKHhzKSB7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gWy4uLnhzXVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gW10sIChhY2MsIHgpID0+IChhY2MucHVzaCh4KSwgYWNjKSk7XG59XG5cbmZ1bmN0aW9uKiBpdGVyYXRvcih4Zm9ybSwgeHMpIHtcbiAgICBjb25zdCByZm4gPSBlbnN1cmVUcmFuc2R1Y2VyKHhmb3JtKShwdXNoKCkpO1xuICAgIGNvbnN0IGNvbXBsZXRlID0gcmZuWzFdO1xuICAgIGNvbnN0IHJlZHVjZSA9IHJmblsyXTtcbiAgICBmb3IgKGxldCB4IG9mIHhzKSB7XG4gICAgICAgIGNvbnN0IHkgPSByZWR1Y2UoW10sIHgpO1xuICAgICAgICBpZiAoaXNSZWR1Y2VkKHkpKSB7XG4gICAgICAgICAgICB5aWVsZCogdW5yZWR1Y2VkKGNvbXBsZXRlKHkuZGVyZWYoKSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5Lmxlbmd0aCkge1xuICAgICAgICAgICAgeWllbGQqIHk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgeWllbGQqIHVucmVkdWNlZChjb21wbGV0ZShbXSkpO1xufVxuZnVuY3Rpb24qIGl0ZXJhdG9yMSh4Zm9ybSwgeHMpIHtcbiAgICBjb25zdCByZWR1Y2UgPSAoZW5zdXJlVHJhbnNkdWNlcih4Zm9ybSkoW2FwaS5OT19PUCwgYXBpLk5PX09QLCAoXywgeCkgPT4geF0pKVsyXTtcbiAgICBmb3IgKGxldCB4IG9mIHhzKSB7XG4gICAgICAgIGxldCB5ID0gcmVkdWNlKGFwaS5TRU1BUEhPUkUsIHgpO1xuICAgICAgICBpZiAoaXNSZWR1Y2VkKHkpKSB7XG4gICAgICAgICAgICB5ID0gdW5yZWR1Y2VkKHkuZGVyZWYoKSk7XG4gICAgICAgICAgICBpZiAoeSAhPT0gYXBpLlNFTUFQSE9SRSkge1xuICAgICAgICAgICAgICAgIHlpZWxkIHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgIT09IGFwaS5TRU1BUEhPUkUpIHtcbiAgICAgICAgICAgIHlpZWxkIHk7XG4gICAgICAgIH1cbiAgICB9XG59XG5jb25zdCAkaXRlciA9ICh4Zm9ybSwgYXJncywgaW1wbCA9IGl0ZXJhdG9yMSkgPT4ge1xuICAgIGNvbnN0IG4gPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKGFyZ3Nbbl0pXG4gICAgICAgID8gYXJncy5sZW5ndGggPiAxXG4gICAgICAgICAgICA/IGltcGwoeGZvcm0uYXBwbHkobnVsbCwgYXJncy5zbGljZSgwLCBuKSksIGFyZ3Nbbl0pXG4gICAgICAgICAgICA6IGltcGwoeGZvcm0oKSwgYXJnc1swXSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG59O1xuXG5jb25zdCBjb21wUiA9IChyZm4sIGZuKSA9PiBbcmZuWzBdLCByZm5bMV0sIGZuXTtcblxuZnVuY3Rpb24gbWFwKGZuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShtYXAoZm4pLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHIoYWNjLCBmbih4KSkpO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiB0cmFuc2R1Y2UoLi4uYXJncykge1xuICAgIHJldHVybiAkdHJhbnNkdWNlKHRyYW5zZHVjZSwgcmVkdWNlLCBhcmdzKTtcbn1cbmZ1bmN0aW9uIHRyYW5zZHVjZVJpZ2h0KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gJHRyYW5zZHVjZSh0cmFuc2R1Y2VSaWdodCwgcmVkdWNlUmlnaHQsIGFyZ3MpO1xufVxuY29uc3QgJHRyYW5zZHVjZSA9ICh0Zm4sIHJmbiwgYXJncykgPT4ge1xuICAgIGxldCBhY2MsIHhzO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgeHMgPSBhcmdzWzNdO1xuICAgICAgICAgICAgYWNjID0gYXJnc1syXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICB4cyA9IGFyZ3NbMl07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuIG1hcCgoeCkgPT4gdGZuKGFyZ3NbMF0sIGFyZ3NbMV0sIHgpKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGVycm9ycy5pbGxlZ2FsQXJpdHkoYXJncy5sZW5ndGgpO1xuICAgIH1cbiAgICByZXR1cm4gcmZuKGVuc3VyZVRyYW5zZHVjZXIoYXJnc1swXSkoYXJnc1sxXSksIGFjYywgeHMpO1xufTtcblxuY29uc3QgTk9fT1BfUkVEVUNFUiA9IFthcGkuTk9fT1AsIGFwaS5OT19PUCwgYXBpLk5PX09QXTtcbmZ1bmN0aW9uIHJ1bih0eCwgLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0cmFuc2R1Y2UodHgsIE5PX09QX1JFRFVDRVIsIGFyZ3NbMF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc3QgZnggPSBhcmdzWzBdO1xuICAgICAgICB0cmFuc2R1Y2UodHgsIFthcGkuTk9fT1AsIGFwaS5OT19PUCwgKF8sIHgpID0+IGZ4KHgpXSwgYXJnc1sxXSk7XG4gICAgfVxufVxuXG5jb25zdCBzdGVwID0gKHR4KSA9PiB7XG4gICAgY29uc3QgeyAxOiBjb21wbGV0ZSwgMjogcmVkdWNlIH0gPSBlbnN1cmVUcmFuc2R1Y2VyKHR4KShwdXNoKCkpO1xuICAgIGxldCBkb25lID0gZmFsc2U7XG4gICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgIGlmICghZG9uZSkge1xuICAgICAgICAgICAgbGV0IGFjYyA9IHJlZHVjZShbXSwgeCk7XG4gICAgICAgICAgICBkb25lID0gaXNSZWR1Y2VkKGFjYyk7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIGFjYyA9IGNvbXBsZXRlKGFjYy5kZXJlZigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2MubGVuZ3RoID09PSAxID8gYWNjWzBdIDogYWNjLmxlbmd0aCA+IDAgPyBhY2MgOiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuY29uc3QgX19tYXRob3AgPSAocmZuLCBmbiwgaW5pdERlZmF1bHQsIGFyZ3MpID0+IHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShyZm4sIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBjb25zdCBpbml0ID0gYXJnc1swXSB8fCBpbml0RGVmYXVsdDtcbiAgICByZXR1cm4gcmVkdWNlcigoKSA9PiBpbml0LCBmbik7XG59O1xuXG5mdW5jdGlvbiBhZGQoLi4uYXJncykge1xuICAgIHJldHVybiBfX21hdGhvcChhZGQsIChhY2MsIHgpID0+IGFjYyArIHgsIDAsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBhc3NvY01hcCh4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShhc3NvY01hcCgpLCB4cylcbiAgICAgICAgOiByZWR1Y2VyKCgpID0+IG5ldyBNYXAoKSwgKGFjYywgW2ssIHZdKSA9PiBhY2Muc2V0KGssIHYpKTtcbn1cblxuZnVuY3Rpb24gYXNzb2NPYmooeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UoYXNzb2NPYmooKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiAoe30pLCAoYWNjLCBbaywgdl0pID0+ICgoYWNjW2tdID0gdiksIGFjYykpO1xufVxuXG5mdW5jdGlvbiBhdXRvT2JqKHByZWZpeCwgeHMpIHtcbiAgICBsZXQgaWQgPSAwO1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShhdXRvT2JqKHByZWZpeCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gKHt9KSwgKGFjYywgdikgPT4gKChhY2NbcHJlZml4ICsgaWQrK10gPSB2KSwgYWNjKSk7XG59XG5cbmZ1bmN0aW9uIGNvbmooeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UoY29uaigpLCB4cylcbiAgICAgICAgOiByZWR1Y2VyKCgpID0+IG5ldyBTZXQoKSwgKGFjYywgeCkgPT4gYWNjLmFkZCh4KSk7XG59XG5cbmZ1bmN0aW9uIGNvdW50KC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShjb3VudCwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGxldCBvZmZzZXQgPSBhcmdzWzBdIHx8IDA7XG4gICAgbGV0IHN0ZXAgPSBhcmdzWzFdIHx8IDE7XG4gICAgcmV0dXJuIHJlZHVjZXIoKCkgPT4gb2Zmc2V0LCAoYWNjLCBfKSA9PiBhY2MgKyBzdGVwKTtcbn1cblxuZnVuY3Rpb24gZGl2KGluaXQsIHhzKSB7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gcmVkdWNlKGRpdihpbml0KSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiBpbml0LCAoYWNjLCB4KSA9PiBhY2MgLyB4KTtcbn1cblxuZnVuY3Rpb24gZXZlcnkoLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKGV2ZXJ5LCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3QgcHJlZCA9IGFyZ3NbMF07XG4gICAgcmV0dXJuIHJlZHVjZXIoKCkgPT4gdHJ1ZSwgcHJlZFxuICAgICAgICA/IChhY2MsIHgpID0+IChwcmVkKHgpID8gYWNjIDogcmVkdWNlZChmYWxzZSkpXG4gICAgICAgIDogKGFjYywgeCkgPT4gKHggPyBhY2MgOiByZWR1Y2VkKGZhbHNlKSkpO1xufVxuXG5mdW5jdGlvbiBmaWxsKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShmaWxsLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgbGV0IHN0YXJ0ID0gYXJnc1swXSB8fCAwO1xuICAgIHJldHVybiByZWR1Y2VyKCgpID0+IFtdLCAoYWNjLCB4KSA9PiAoKGFjY1tzdGFydCsrXSA9IHgpLCBhY2MpKTtcbn1cbmZ1bmN0aW9uIGZpbGxOKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gZmlsbCguLi5hcmdzKTtcbn1cblxuY29uc3QgX19ncm91cEJ5T3B0cyA9IChvcHRzKSA9PiAoT2JqZWN0LmFzc2lnbih7IGtleTogY29tcG9zZS5pZGVudGl0eSwgZ3JvdXA6IHB1c2goKSB9LCBvcHRzKSk7XG5cbmZ1bmN0aW9uIGdyb3VwQnlNYXAoLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKGdyb3VwQnlNYXAsIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBjb25zdCBvcHRzID0gX19ncm91cEJ5T3B0cyhhcmdzWzBdKTtcbiAgICBjb25zdCBbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0gPSBvcHRzLmdyb3VwO1xuICAgIHJldHVybiBbXG4gICAgICAgICgpID0+IG5ldyBNYXAoKSxcbiAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgZm9yIChsZXQgayBvZiBhY2Mua2V5cygpKSB7XG4gICAgICAgICAgICAgICAgYWNjLnNldChrLCBjb21wbGV0ZShhY2MuZ2V0KGspKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LFxuICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBrID0gb3B0cy5rZXkoeCk7XG4gICAgICAgICAgICByZXR1cm4gYWNjLnNldChrLCBhY2MuaGFzKGspXG4gICAgICAgICAgICAgICAgPyByZWR1Y2UoYWNjLmdldChrKSwgeClcbiAgICAgICAgICAgICAgICA6IHJlZHVjZShpbml0KCksIHgpKTtcbiAgICAgICAgfSxcbiAgICBdO1xufVxuXG5mdW5jdGlvbiBmcmVxdWVuY2llcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkJHJlZHVjZShmcmVxdWVuY2llcywgYXJncykgfHxcbiAgICAgICAgZ3JvdXBCeU1hcCh7IGtleTogYXJnc1swXSB8fCBjb21wb3NlLmlkZW50aXR5LCBncm91cDogY291bnQoKSB9KSk7XG59XG5cbmZ1bmN0aW9uIGdyb3VwQnlPYmooLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKGdyb3VwQnlPYmosIGFyZ3MpO1xuICAgIGlmIChyZXMpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3Qgb3B0cyA9IF9fZ3JvdXBCeU9wdHMoYXJnc1swXSk7XG4gICAgY29uc3QgW19pbml0LCBjb21wbGV0ZSwgX3JlZHVjZV0gPSBvcHRzLmdyb3VwO1xuICAgIHJldHVybiBbXG4gICAgICAgICgpID0+ICh7fSksXG4gICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGsgaW4gYWNjKSB7XG4gICAgICAgICAgICAgICAgYWNjW2tdID0gY29tcGxldGUoYWNjW2tdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sXG4gICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGsgPSBvcHRzLmtleSh4KTtcbiAgICAgICAgICAgIGFjY1trXSA9IGFjY1trXVxuICAgICAgICAgICAgICAgID8gX3JlZHVjZShhY2Nba10sIHgpXG4gICAgICAgICAgICAgICAgOiBfcmVkdWNlKF9pbml0KCksIHgpO1xuICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgfSxcbiAgICBdO1xufVxuXG5jb25zdCBicmFuY2hQcmVkID0gKGtleSwgYiwgbCwgcikgPT4gKHgpID0+IChrZXkoeCkgJiBiID8gciA6IGwpO1xuY29uc3QgZ3JvdXBCaW5hcnkgPSAoYml0cywga2V5LCBicmFuY2gsIGxlYWYsIGxlZnQgPSBcImxcIiwgcmlnaHQgPSBcInJcIikgPT4ge1xuICAgIGNvbnN0IGluaXQgPSBicmFuY2ggfHwgKCgpID0+ICh7fSkpO1xuICAgIGxldCByZm4gPSBncm91cEJ5T2JqKHtcbiAgICAgICAga2V5OiBicmFuY2hQcmVkKGtleSwgMSwgbGVmdCwgcmlnaHQpLFxuICAgICAgICBncm91cDogbGVhZiB8fCBwdXNoKCksXG4gICAgfSk7XG4gICAgZm9yIChsZXQgaSA9IDIsIG1heEluZGV4ID0gMSA8PCBiaXRzOyBpIDwgbWF4SW5kZXg7IGkgPDw9IDEpIHtcbiAgICAgICAgcmZuID0gZ3JvdXBCeU9iaih7XG4gICAgICAgICAgICBrZXk6IGJyYW5jaFByZWQoa2V5LCBpLCBsZWZ0LCByaWdodCksXG4gICAgICAgICAgICBncm91cDogW2luaXQsIHJmblsxXSwgcmZuWzJdXSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBbaW5pdCwgcmZuWzFdLCByZm5bMl1dO1xufTtcblxuZnVuY3Rpb24gbGFzdCh4cykge1xuICAgIHJldHVybiB4cyA/IHJlZHVjZShsYXN0KCksIHhzKSA6IHJlZHVjZXIoYXBpLk5PX09QLCAoXywgeCkgPT4geCk7XG59XG5cbmZ1bmN0aW9uIG1heCh4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShtYXgoKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiAtSW5maW5pdHksIChhY2MsIHgpID0+IE1hdGgubWF4KGFjYywgeCkpO1xufVxuXG5mdW5jdGlvbiBtYXhDb21wYXJlKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShtYXhDb21wYXJlLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3QgaW5pdCA9IGFyZ3NbMF07XG4gICAgY29uc3QgY21wID0gYXJnc1sxXSB8fCBjb21wYXJlLmNvbXBhcmU7XG4gICAgcmV0dXJuIHJlZHVjZXIoaW5pdCwgKGFjYywgeCkgPT4gKGNtcChhY2MsIHgpID49IDAgPyBhY2MgOiB4KSk7XG59XG5cbmZ1bmN0aW9uIG1heE1hZyh4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShtYXhNYWcoKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiAwLCAoYWNjLCB4KSA9PiAoTWF0aC5hYnMoeCkgPiBNYXRoLmFicyhhY2MpID8geCA6IGFjYykpO1xufVxuXG5mdW5jdGlvbiBtZWFuKHhzKSB7XG4gICAgbGV0IG4gPSAxO1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShtZWFuKCksIHhzKVxuICAgICAgICA6IFtcbiAgICAgICAgICAgICgpID0+IChuID0gMCksXG4gICAgICAgICAgICAoYWNjKSA9PiAobiA+IDEgPyBhY2MgLyBuIDogYWNjKSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IChuKyssIGFjYyArIHgpLFxuICAgICAgICBdO1xufVxuXG5mdW5jdGlvbiBtaW4oeHMpIHtcbiAgICByZXR1cm4geHNcbiAgICAgICAgPyByZWR1Y2UobWluKCksIHhzKVxuICAgICAgICA6IHJlZHVjZXIoKCkgPT4gSW5maW5pdHksIChhY2MsIHgpID0+IE1hdGgubWluKGFjYywgeCkpO1xufVxuXG5mdW5jdGlvbiBtaW5Db21wYXJlKC4uLmFyZ3MpIHtcbiAgICBjb25zdCByZXMgPSAkJHJlZHVjZShtaW5Db21wYXJlLCBhcmdzKTtcbiAgICBpZiAocmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgY29uc3QgaW5pdCA9IGFyZ3NbMF07XG4gICAgY29uc3QgY21wID0gYXJnc1sxXSB8fCBjb21wYXJlLmNvbXBhcmU7XG4gICAgcmV0dXJuIHJlZHVjZXIoaW5pdCwgKGFjYywgeCkgPT4gKGNtcChhY2MsIHgpIDw9IDAgPyBhY2MgOiB4KSk7XG59XG5cbmZ1bmN0aW9uIG1pbk1hZyh4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShtaW5NYWcoKSwgeHMpXG4gICAgICAgIDogcmVkdWNlcigoKSA9PiBJbmZpbml0eSwgKGFjYywgeCkgPT4gKE1hdGguYWJzKHgpIDwgTWF0aC5hYnMoYWNjKSA/IHggOiBhY2MpKTtcbn1cblxuZnVuY3Rpb24ganV4dFIoLi4ucnMpIHtcbiAgICBsZXQgW2EsIGIsIGNdID0gcnM7XG4gICAgY29uc3QgbiA9IHJzLmxlbmd0aDtcbiAgICBzd2l0Y2ggKG4pIHtcbiAgICAgICAgY2FzZSAxOiB7XG4gICAgICAgICAgICBjb25zdCByID0gYVsyXTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgKCkgPT4gW2FbMF0oKV0sXG4gICAgICAgICAgICAgICAgKGFjYykgPT4gW2FbMV0oYWNjWzBdKV0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTEgPSByKGFjY1swXSwgeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWExKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZHVjZWQoW3VucmVkdWNlZChhYTEpXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthYTFdO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgMjoge1xuICAgICAgICAgICAgY29uc3QgcmEgPSBhWzJdO1xuICAgICAgICAgICAgY29uc3QgcmIgPSBiWzJdO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAoKSA9PiBbYVswXSgpLCBiWzBdKCldLFxuICAgICAgICAgICAgICAgIChhY2MpID0+IFthWzFdKGFjY1swXSksIGJbMV0oYWNjWzFdKV0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTEgPSByYShhY2NbMF0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhYTIgPSByYihhY2NbMV0sIHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZWR1Y2VkKGFhMSkgfHwgaXNSZWR1Y2VkKGFhMikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2VkKFt1bnJlZHVjZWQoYWExKSwgdW5yZWR1Y2VkKGFhMildKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2FhMSwgYWEyXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIDM6IHtcbiAgICAgICAgICAgIGNvbnN0IHJhID0gYVsyXTtcbiAgICAgICAgICAgIGNvbnN0IHJiID0gYlsyXTtcbiAgICAgICAgICAgIGNvbnN0IHJjID0gY1syXTtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgKCkgPT4gW2FbMF0oKSwgYlswXSgpLCBjWzBdKCldLFxuICAgICAgICAgICAgICAgIChhY2MpID0+IFthWzFdKGFjY1swXSksIGJbMV0oYWNjWzFdKSwgY1sxXShhY2NbMl0pXSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFhMSA9IHJhKGFjY1swXSwgeCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFhMiA9IHJiKGFjY1sxXSwgeCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFhMyA9IHJjKGFjY1syXSwgeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWExKSB8fCBpc1JlZHVjZWQoYWEyKSB8fCBpc1JlZHVjZWQoYWEzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZHVjZWQoW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVucmVkdWNlZChhYTEpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVucmVkdWNlZChhYTIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVucmVkdWNlZChhYTMpLFxuICAgICAgICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthYTEsIGFhMiwgYWEzXTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICAoKSA9PiBycy5tYXAoKHIpID0+IHJbMF0oKSksXG4gICAgICAgICAgICAgICAgKGFjYykgPT4gcnMubWFwKChyLCBpKSA9PiByWzFdKGFjY1tpXSkpLFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYSA9IHJzW2ldWzJdKGFjY1tpXSwgeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNSZWR1Y2VkKGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYSA9IHVucmVkdWNlZChhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc1tpXSA9IGE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvbmUgPyByZWR1Y2VkKHJlcykgOiByZXM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgfVxufVxuXG5jb25zdCBtaW5NYXggPSAoKSA9PiBqdXh0UihtaW4oKSwgbWF4KCkpO1xuXG5mdW5jdGlvbiBtdWwoLi4uYXJncykge1xuICAgIHJldHVybiBfX21hdGhvcChtdWwsIChhY2MsIHgpID0+IGFjYyAqIHgsIDEsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBub3JtQ291bnQoLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKG5vcm1Db3VudCwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IG5vcm0gPSBhcmdzWzBdO1xuICAgIHJldHVybiBbKCkgPT4gMCwgKGFjYykgPT4gYWNjIC8gbm9ybSwgKGFjYykgPT4gYWNjICsgMV07XG59XG5cbmZ1bmN0aW9uIG5vcm1GcmVxdWVuY2llcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkJHJlZHVjZShub3JtRnJlcXVlbmNpZXMsIGFyZ3MpIHx8XG4gICAgICAgIGdyb3VwQnlNYXAoe1xuICAgICAgICAgICAga2V5OiBhcmdzWzFdIHx8IGNvbXBvc2UuaWRlbnRpdHksXG4gICAgICAgICAgICBncm91cDogbm9ybUNvdW50KGFyZ3NbMF0pLFxuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1GcmVxdWVuY2llc0F1dG8oLi4uYXJncykge1xuICAgIGNvbnN0IHJlcyA9ICQkcmVkdWNlKG5vcm1GcmVxdWVuY2llc0F1dG8sIGFyZ3MpO1xuICAgIGlmIChyZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBjb25zdCBbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0gPSBmcmVxdWVuY2llcyguLi5hcmdzKTtcbiAgICBsZXQgbm9ybSA9IDA7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgaW5pdCxcbiAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgYWNjID0gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgIGZvciAobGV0IHAgb2YgYWNjKSB7XG4gICAgICAgICAgICAgICAgYWNjLnNldChwWzBdLCBwWzFdIC8gbm9ybSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LFxuICAgICAgICAoYWNjLCB4KSA9PiAobm9ybSsrLCByZWR1Y2UoYWNjLCB4KSksXG4gICAgXTtcbn1cblxuY29uc3QgcHVzaENvcHkgPSAoKSA9PiByZWR1Y2VyKCgpID0+IFtdLCAoYWNjLCB4KSA9PiAoKGFjYyA9IGFjYy5zbGljZSgpKS5wdXNoKHgpLCBhY2MpKTtcblxuZnVuY3Rpb24gcHVzaFNvcnQoY21wID0gY29tcGFyZS5jb21wYXJlLCB4cykge1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IFsuLi54c10uc29ydChjbXApXG4gICAgICAgIDogW1xuICAgICAgICAgICAgKCkgPT4gW10sXG4gICAgICAgICAgICAoYWNjKSA9PiBhY2Muc29ydChjbXApLFxuICAgICAgICAgICAgKGFjYywgeCkgPT4gKGFjYy5wdXNoKHgpLCBhY2MpLFxuICAgICAgICBdO1xufVxuXG5mdW5jdGlvbiByZWR1Y3Rpb25zKHJmbiwgeHMpIHtcbiAgICBjb25zdCBbaW5pdCwgY29tcGxldGUsIF9yZWR1Y2VdID0gcmZuO1xuICAgIHJldHVybiB4c1xuICAgICAgICA/IHJlZHVjZShyZWR1Y3Rpb25zKHJmbiksIHhzKVxuICAgICAgICA6IFtcbiAgICAgICAgICAgICgpID0+IFtpbml0KCldLFxuICAgICAgICAgICAgKGFjYykgPT4gKChhY2NbYWNjLmxlbmd0aCAtIDFdID0gY29tcGxldGUoYWNjW2FjYy5sZW5ndGggLSAxXSkpLCBhY2MpLFxuICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IF9yZWR1Y2UoYWNjW2FjYy5sZW5ndGggLSAxXSwgeCk7XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChyZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjYy5wdXNoKHJlcy5kZXJlZigpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZHVjZWQoYWNjKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWNjLnB1c2gocmVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgXTtcbn1cblxuZnVuY3Rpb24gc29tZSguLi5hcmdzKSB7XG4gICAgY29uc3QgcmVzID0gJCRyZWR1Y2Uoc29tZSwgYXJncyk7XG4gICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGNvbnN0IHByZWQgPSBhcmdzWzBdO1xuICAgIHJldHVybiByZWR1Y2VyKCgpID0+IGZhbHNlLCBwcmVkXG4gICAgICAgID8gKGFjYywgeCkgPT4gKHByZWQoeCkgPyByZWR1Y2VkKHRydWUpIDogYWNjKVxuICAgICAgICA6IChhY2MsIHgpID0+ICh4ID8gcmVkdWNlZCh0cnVlKSA6IGFjYykpO1xufVxuXG5mdW5jdGlvbiBzdHIoc2VwLCB4cykge1xuICAgIHNlcCA9IHNlcCB8fCBcIlwiO1xuICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgcmV0dXJuIHhzXG4gICAgICAgID8gWy4uLnhzXS5qb2luKHNlcClcbiAgICAgICAgOiByZWR1Y2VyKCgpID0+IFwiXCIsIChhY2MsIHgpID0+ICgoYWNjID0gZmlyc3QgPyBhY2MgKyB4IDogYWNjICsgc2VwICsgeCksIChmaXJzdCA9IGZhbHNlKSwgYWNjKSk7XG59XG5cbmZ1bmN0aW9uIHN1YiguLi5hcmdzKSB7XG4gICAgcmV0dXJuIF9fbWF0aG9wKHN1YiwgKGFjYywgeCkgPT4gYWNjIC0geCwgMCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGJlbmNobWFyayhzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShiZW5jaG1hcmsoKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBsZXQgcHJldiA9IERhdGUubm93KCk7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCBfKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHQgLSBwcmV2O1xuICAgICAgICAgICAgICAgIHByZXYgPSB0O1xuICAgICAgICAgICAgICAgIHJldHVybiByKGFjYywgeCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbn1cblxuY29uc3QgY2F0ID0gKCkgPT4gKHJmbikgPT4ge1xuICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICBpZiAoeCkge1xuICAgICAgICAgICAgZm9yIChsZXQgeSBvZiB1bnJlZHVjZWQoeCkpIHtcbiAgICAgICAgICAgICAgICBhY2MgPSByKGFjYywgeSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNSZWR1Y2VkKHgpID8gZW5zdXJlUmVkdWNlZChhY2MpIDogYWNjO1xuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gY29udmVyZ2UoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIoY29udmVyZ2UsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgcHJlZCA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgcHJldiA9IGFwaS5TRU1BUEhPUkU7XG4gICAgICAgICAgICBsZXQgZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb25lIHx8IChwcmV2ICE9PSBhcGkuU0VNQVBIT1JFICYmIHByZWQocHJldiwgeCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5zdXJlUmVkdWNlZChyKGFjYywgeCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2ID0geDtcbiAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmFuZ2UoZnJvbSwgdG8sIHN0ZXApIHtcbiAgICByZXR1cm4gbmV3IFJhbmdlKGZyb20sIHRvLCBzdGVwKTtcbn1cbmNsYXNzIFJhbmdlIHtcbiAgICBjb25zdHJ1Y3Rvcihmcm9tLCB0bywgc3RlcCkge1xuICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmcm9tID0gMDtcbiAgICAgICAgICAgIHRvID0gSW5maW5pdHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdG8gPSBmcm9tO1xuICAgICAgICAgICAgZnJvbSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgc3RlcCA9IHN0ZXAgPT09IHVuZGVmaW5lZCA/IChmcm9tIDwgdG8gPyAxIDogLTEpIDogc3RlcDtcbiAgICAgICAgdGhpcy5mcm9tID0gZnJvbTtcbiAgICAgICAgdGhpcy50byA9IHRvO1xuICAgICAgICB0aGlzLnN0ZXAgPSBzdGVwO1xuICAgIH1cbiAgICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgICAgIGxldCB7IGZyb20sIHRvLCBzdGVwIH0gPSB0aGlzO1xuICAgICAgICBpZiAoc3RlcCA+IDApIHtcbiAgICAgICAgICAgIHdoaWxlIChmcm9tIDwgdG8pIHtcbiAgICAgICAgICAgICAgICB5aWVsZCBmcm9tO1xuICAgICAgICAgICAgICAgIGZyb20gKz0gc3RlcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGVwIDwgMCkge1xuICAgICAgICAgICAgd2hpbGUgKGZyb20gPiB0bykge1xuICAgICAgICAgICAgICAgIHlpZWxkIGZyb207XG4gICAgICAgICAgICAgICAgZnJvbSArPSBzdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgICRyZWR1Y2UocmZuLCBhY2MpIHtcbiAgICAgICAgY29uc3Qgc3RlcCA9IHRoaXMuc3RlcDtcbiAgICAgICAgaWYgKHN0ZXAgPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5mcm9tLCBuID0gdGhpcy50bzsgaSA8IG4gJiYgIWlzUmVkdWNlZChhY2MpOyBpICs9IHN0ZXApIHtcbiAgICAgICAgICAgICAgICBhY2MgPSByZm4oYWNjLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmZyb20sIG4gPSB0aGlzLnRvOyBpID4gbiAmJiAhaXNSZWR1Y2VkKGFjYyk7IGkgKz0gc3RlcCkge1xuICAgICAgICAgICAgICAgIGFjYyA9IHJmbihhY2MsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY2M7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogcmFuZ2UyZCguLi5hcmdzKSB7XG4gICAgbGV0IGZyb21YLCB0b1gsIHN0ZXBYO1xuICAgIGxldCBmcm9tWSwgdG9ZLCBzdGVwWTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHN0ZXBYID0gYXJnc1s0XTtcbiAgICAgICAgICAgIHN0ZXBZID0gYXJnc1s1XTtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgW2Zyb21YLCB0b1gsIGZyb21ZLCB0b1ldID0gYXJncztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBbdG9YLCB0b1ldID0gYXJncztcbiAgICAgICAgICAgIGZyb21YID0gZnJvbVkgPSAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBlcnJvcnMuaWxsZWdhbEFyaXR5KGFyZ3MubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgcnggPSByYW5nZShmcm9tWCwgdG9YLCBzdGVwWCk7XG4gICAgZm9yIChsZXQgeSBvZiByYW5nZShmcm9tWSwgdG9ZLCBzdGVwWSkpIHtcbiAgICAgICAgZm9yIChsZXQgeCBvZiByeCkge1xuICAgICAgICAgICAgeWllbGQgW3gsIHldO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiogemlwKC4uLnNyYykge1xuICAgIGNvbnN0IGl0ZXJzID0gc3JjLm1hcCgocykgPT4gc1tTeW1ib2wuaXRlcmF0b3JdKCkpO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGNvbnN0IHR1cGxlID0gW107XG4gICAgICAgIGZvciAobGV0IGkgb2YgaXRlcnMpIHtcbiAgICAgICAgICAgIGxldCB2ID0gaS5uZXh0KCk7XG4gICAgICAgICAgICBpZiAodi5kb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHVwbGUucHVzaCh2LnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCB0dXBsZTtcbiAgICB9XG59XG5cbmNvbnN0IGJ1aWxkS2VybmVsMWQgPSAod2VpZ2h0cywgdykgPT4ge1xuICAgIGNvbnN0IHcyID0gdyA+PiAxO1xuICAgIHJldHVybiBbLi4uemlwKHdlaWdodHMsIHJhbmdlKC13MiwgdzIgKyAxKSldO1xufTtcbmNvbnN0IGJ1aWxkS2VybmVsMmQgPSAod2VpZ2h0cywgdywgaCA9IHcpID0+IHtcbiAgICBjb25zdCB3MiA9IHcgPj4gMTtcbiAgICBjb25zdCBoMiA9IGggPj4gMTtcbiAgICByZXR1cm4gWy4uLnppcCh3ZWlnaHRzLCByYW5nZTJkKC13MiwgdzIgKyAxLCAtaDIsIGgyICsgMSkpXTtcbn07XG5jb25zdCBrZXJuZWxMb29rdXAxZCA9IChzcmMsIHgsIHdpZHRoLCB3cmFwLCBib3JkZXIpID0+IHdyYXBcbiAgICA/ICh7IDA6IHcsIDE6IG94IH0pID0+IHtcbiAgICAgICAgY29uc3QgeHggPSB4IDwgLW94ID8gd2lkdGggKyBveCA6IHggPj0gd2lkdGggLSBveCA/IG94IC0gMSA6IHggKyBveDtcbiAgICAgICAgcmV0dXJuIHcgKiBzcmNbeHhdO1xuICAgIH1cbiAgICA6ICh7IDA6IHcsIDE6IG94IH0pID0+IHtcbiAgICAgICAgcmV0dXJuIHggPCAtb3ggfHwgeCA+PSB3aWR0aCAtIG94ID8gYm9yZGVyIDogdyAqIHNyY1t4ICsgb3hdO1xuICAgIH07XG5jb25zdCBrZXJuZWxMb29rdXAyZCA9IChzcmMsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHdyYXAsIGJvcmRlcikgPT4gd3JhcFxuICAgID8gKHsgMDogdywgMTogeyAwOiBveCwgMTogb3kgfSB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHh4ID0geCA8IC1veCA/IHdpZHRoICsgb3ggOiB4ID49IHdpZHRoIC0gb3ggPyBveCAtIDEgOiB4ICsgb3g7XG4gICAgICAgIGNvbnN0IHl5ID0geSA8IC1veSA/IGhlaWdodCArIG95IDogeSA+PSBoZWlnaHQgLSBveSA/IG95IC0gMSA6IHkgKyBveTtcbiAgICAgICAgcmV0dXJuIHcgKiBzcmNbeXkgKiB3aWR0aCArIHh4XTtcbiAgICB9XG4gICAgOiAoeyAwOiB3LCAxOiB7IDA6IG94LCAxOiBveSB9IH0pID0+IHtcbiAgICAgICAgcmV0dXJuIHggPCAtb3ggfHwgeSA8IC1veSB8fCB4ID49IHdpZHRoIC0gb3ggfHwgeSA+PSBoZWlnaHQgLSBveVxuICAgICAgICAgICAgPyBib3JkZXJcbiAgICAgICAgICAgIDogdyAqIHNyY1soeSArIG95KSAqIHdpZHRoICsgeCArIG94XTtcbiAgICB9O1xuY29uc3Qga2VybmVsRXJyb3IgPSAoKSA9PiBlcnJvcnMuaWxsZWdhbEFyZ3MoYG5vIGtlcm5lbCBvciBrZXJuZWwgY29uZmlnYCk7XG5mdW5jdGlvbiBjb252b2x2ZTFkKG9wdHMsIGluZGljZXMpIHtcbiAgICBpZiAoaW5kaWNlcykge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3IxKGNvbnZvbHZlMWQob3B0cyksIGluZGljZXMpO1xuICAgIH1cbiAgICBjb25zdCB7IHNyYywgd2lkdGggfSA9IG9wdHM7XG4gICAgY29uc3Qgd3JhcCA9IG9wdHMud3JhcCAhPT0gZmFsc2U7XG4gICAgY29uc3QgYm9yZGVyID0gb3B0cy5ib3JkZXIgfHwgMDtcbiAgICBjb25zdCByZm4gPSBvcHRzLnJlZHVjZSB8fCBhZGQ7XG4gICAgbGV0IGtlcm5lbCA9IG9wdHMua2VybmVsO1xuICAgIGlmICgha2VybmVsKSB7XG4gICAgICAgICEob3B0cy53ZWlnaHRzICYmIG9wdHMua3dpZHRoKSAmJiBrZXJuZWxFcnJvcigpO1xuICAgICAgICBrZXJuZWwgPSBidWlsZEtlcm5lbDFkKG9wdHMud2VpZ2h0cywgb3B0cy5rd2lkdGgpO1xuICAgIH1cbiAgICByZXR1cm4gbWFwKChwKSA9PiB0cmFuc2R1Y2UobWFwKGtlcm5lbExvb2t1cDFkKHNyYywgcCwgd2lkdGgsIHdyYXAsIGJvcmRlcikpLCByZm4oKSwga2VybmVsKSk7XG59XG5mdW5jdGlvbiBjb252b2x2ZTJkKG9wdHMsIGluZGljZXMpIHtcbiAgICBpZiAoaW5kaWNlcykge1xuICAgICAgICByZXR1cm4gaXRlcmF0b3IxKGNvbnZvbHZlMmQob3B0cyksIGluZGljZXMpO1xuICAgIH1cbiAgICBjb25zdCB7IHNyYywgd2lkdGgsIGhlaWdodCB9ID0gb3B0cztcbiAgICBjb25zdCB3cmFwID0gb3B0cy53cmFwICE9PSBmYWxzZTtcbiAgICBjb25zdCBib3JkZXIgPSBvcHRzLmJvcmRlciB8fCAwO1xuICAgIGNvbnN0IHJmbiA9IG9wdHMucmVkdWNlIHx8IGFkZDtcbiAgICBsZXQga2VybmVsID0gb3B0cy5rZXJuZWw7XG4gICAgaWYgKCFrZXJuZWwpIHtcbiAgICAgICAgIShvcHRzLndlaWdodHMgJiYgb3B0cy5rd2lkdGggJiYgb3B0cy5raGVpZ2h0KSAmJiBrZXJuZWxFcnJvcigpO1xuICAgICAgICBrZXJuZWwgPSBidWlsZEtlcm5lbDJkKG9wdHMud2VpZ2h0cywgb3B0cy5rd2lkdGgsIG9wdHMua2hlaWdodCk7XG4gICAgfVxuICAgIHJldHVybiBtYXAoKHApID0+IHRyYW5zZHVjZShtYXAoa2VybmVsTG9va3VwMmQoc3JjLCBwWzBdLCBwWzFdLCB3aWR0aCwgaGVpZ2h0LCB3cmFwLCBib3JkZXIpKSwgcmZuKCksIGtlcm5lbCkpO1xufVxuXG5mdW5jdGlvbiBkZWR1cGUoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIoZGVkdXBlLCBhcmdzKSB8fFxuICAgICAgICAoKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IGVxdWl2ID0gYXJnc1swXTtcbiAgICAgICAgICAgIGxldCBwcmV2ID0gYXBpLlNFTUFQSE9SRTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIGVxdWl2XG4gICAgICAgICAgICAgICAgPyAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2ICE9PSBhcGkuU0VNQVBIT1JFICYmIGVxdWl2KHByZXYsIHgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhY2NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHIoYWNjLCB4KTtcbiAgICAgICAgICAgICAgICAgICAgcHJldiA9IHg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSBwcmV2ID09PSB4ID8gYWNjIDogcihhY2MsIHgpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2ID0geDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xufVxuXG5jb25zdCBkZWxheWVkID0gKHQpID0+IG1hcCgoeCkgPT4gY29tcG9zZS5kZWxheWVkKHgsIHQpKTtcblxuZnVuY3Rpb24gZGlzdGluY3QoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIoZGlzdGluY3QsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3Qgb3B0cyA9IChhcmdzWzBdIHx8IHt9KTtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IG9wdHMua2V5O1xuICAgICAgICAgICAgY29uc3Qgc2VlbiA9IChvcHRzLmNhY2hlIHx8ICgoKSA9PiBuZXcgU2V0KCkpKSgpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwga2V5XG4gICAgICAgICAgICAgICAgPyAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBrZXkoeCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhc2Vlbi5oYXMoaykgPyAoc2Vlbi5hZGQoayksIHIoYWNjLCB4KSkgOiBhY2M7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIDogKGFjYywgeCkgPT4gIXNlZW4uaGFzKHgpID8gKHNlZW4uYWRkKHgpLCByKGFjYywgeCkpIDogYWNjKTtcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiB0aHJvdHRsZShwcmVkLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMSh0aHJvdHRsZShwcmVkKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBfcHJlZCA9IHByZWQoKTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IChfcHJlZCh4KSA/IHIoYWNjLCB4KSA6IGFjYykpO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBkcm9wTnRoKG4sIHNyYykge1xuICAgIGlmIChjaGVja3MuaXNJdGVyYWJsZShzcmMpKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvcjEoZHJvcE50aChuKSwgc3JjKTtcbiAgICB9XG4gICAgbiA9IG1hdGguY2xhbXAwKG4gLSAxKTtcbiAgICByZXR1cm4gdGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICBsZXQgc2tpcCA9IG47XG4gICAgICAgIHJldHVybiAoKSA9PiAoc2tpcC0tID4gMCA/IHRydWUgOiAoKHNraXAgPSBuKSwgZmFsc2UpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gZHJvcFdoaWxlKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gKCRpdGVyKGRyb3BXaGlsZSwgYXJncykgfHxcbiAgICAgICAgKChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBwcmVkID0gYXJnc1swXTtcbiAgICAgICAgICAgIGxldCBvayA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiAob2sgPSBvayAmJiBwcmVkKHgpKSA/IGFjYyA6IHIoYWNjLCB4KSk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gZHJvcChuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShkcm9wKG4pLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGxldCBtID0gbjtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IG0gPiAwID8gKG0tLSwgYWNjKSA6IHIoYWNjLCB4KSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGR1cGxpY2F0ZShuID0gMSwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcihkdXBsaWNhdGUobiksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBuOyBpID49IDAgJiYgIWlzUmVkdWNlZChhY2MpOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcihhY2MsIHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGZpbHRlcihwcmVkLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShmaWx0ZXIocHJlZCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4gKHByZWQoeCkgPyByKGFjYywgeCkgOiBhY2MpKTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gZmlsdGVyRnV6enkoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSBhcmdzLmxlbmd0aCA+IDEgJiYgJGl0ZXIoZmlsdGVyRnV6enksIGFyZ3MpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCBxdWVyeSA9IGFyZ3NbMF07XG4gICAgY29uc3QgeyBrZXksIGVxdWl2IH0gPSAoYXJnc1sxXSB8fCB7fSk7XG4gICAgcmV0dXJuIGZpbHRlcigoeCkgPT4gYXJyYXlzLmZ1enp5TWF0Y2goa2V5ICE9IG51bGwgPyBrZXkoeCkgOiB4LCBxdWVyeSwgZXF1aXYpKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbldpdGgoZm4sIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IoZmxhdHRlbldpdGgoZm4pLCBjaGVja3MuaXNTdHJpbmcoc3JjKSA/IFtzcmNdIDogc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlZHVjZSA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IGZsYXR0ZW4gPSAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeHggPSBmbih4KTtcbiAgICAgICAgICAgICAgICBpZiAoeHgpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgeSBvZiB4eCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gZmxhdHRlbihhY2MsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZHVjZShhY2MsIHgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIGZsYXR0ZW4pO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuKHNyYykge1xuICAgIHJldHVybiBmbGF0dGVuV2l0aCgoeCkgPT4gKGNoZWNrcy5pc05vdFN0cmluZ0FuZEl0ZXJhYmxlKHgpID8geCA6IHVuZGVmaW5lZCksIHNyYyk7XG59XG5cbmZ1bmN0aW9uIG1hcEluZGV4ZWQoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIobWFwSW5kZXhlZCwgYXJncykgfHxcbiAgICAgICAgKChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBmbiA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgaSA9IGFyZ3NbMV0gfHwgMDtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHIoYWNjLCBmbihpKyssIHgpKSk7XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gaW5kZXhlZCguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKGluZGV4ZWQsIGFyZ3MpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCBmcm9tID0gYXJnc1swXSB8fCAwO1xuICAgIHJldHVybiBtYXBJbmRleGVkKChpLCB4KSA9PiBbZnJvbSArIGksIHhdKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJsZWF2ZShzZXAsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IoaW50ZXJsZWF2ZShzZXApLCBzcmMpXG4gICAgICAgIDogKHJmbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgciA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IF9zZXAgPSB0eXBlb2Ygc2VwID09PSBcImZ1bmN0aW9uXCIgPyBzZXAgOiAoKSA9PiBzZXA7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgYWNjID0gcihhY2MsIF9zZXAoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzUmVkdWNlZChhY2MpID8gYWNjIDogcihhY2MsIHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNvbXAoLi4uZm5zKSB7XG4gICAgZm5zID0gZm5zLm1hcChlbnN1cmVUcmFuc2R1Y2VyKTtcbiAgICByZXR1cm4gY29tcG9zZS5jb21wLmFwcGx5KG51bGwsIGZucyk7XG59XG5cbmZ1bmN0aW9uKiBub3JtUmFuZ2UobiwgaW5jbHVkZUxhc3QgPSB0cnVlKSB7XG4gICAgaWYgKG4gPiAwKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBtID0gaW5jbHVkZUxhc3QgPyBuICsgMSA6IG47IGkgPCBtOyBpKyspIHtcbiAgICAgICAgICAgIHlpZWxkIGkgLyBuO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24qIG5vcm1SYW5nZTJkKG54LCBueSwgaW5jbHVkZUxhc3RYID0gdHJ1ZSwgaW5jbHVkZUxhc3RZID0gdHJ1ZSkge1xuICAgIGNvbnN0IHJ4ID0gWy4uLm5vcm1SYW5nZShueCwgaW5jbHVkZUxhc3RYKV07XG4gICAgZm9yIChsZXQgeSBvZiBub3JtUmFuZ2UobnksIGluY2x1ZGVMYXN0WSkpIHtcbiAgICAgICAgeWllbGQqIG1hcCgoeCkgPT4gW3gsIHldLCByeCk7XG4gICAgfVxufVxuZnVuY3Rpb24qIG5vcm1SYW5nZTNkKG54LCBueSwgbnosIGluY2x1ZGVMYXN0WCA9IHRydWUsIGluY2x1ZGVMYXN0WSA9IHRydWUsIGluY2x1ZGVMYXN0WiA9IHRydWUpIHtcbiAgICBjb25zdCBzbGljZVhZID0gWy4uLm5vcm1SYW5nZTJkKG54LCBueSwgaW5jbHVkZUxhc3RYLCBpbmNsdWRlTGFzdFkpXTtcbiAgICBmb3IgKGxldCB6IG9mIG5vcm1SYW5nZShueiwgaW5jbHVkZUxhc3RaKSkge1xuICAgICAgICB5aWVsZCogbWFwKCh4eSkgPT4gWy4uLnh5LCB6XSwgc2xpY2VYWSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBtYXBjYXQoZm4sIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpID8gaXRlcmF0b3IobWFwY2F0KGZuKSwgc3JjKSA6IGNvbXAobWFwKGZuKSwgY2F0KCkpO1xufVxuXG5mdW5jdGlvbiBwYXJ0aXRpb24oLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihwYXJ0aXRpb24sIGFyZ3MsIGl0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgbGV0IHNpemUgPSBhcmdzWzBdLCBhbGwsIHN0ZXA7XG4gICAgaWYgKHR5cGVvZiBhcmdzWzFdID09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgc3RlcCA9IGFyZ3NbMV07XG4gICAgICAgIGFsbCA9IGFyZ3NbMl07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzdGVwID0gc2l6ZTtcbiAgICAgICAgYWxsID0gYXJnc1sxXTtcbiAgICB9XG4gICAgcmV0dXJuIChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgbGV0IGJ1ZiA9IFtdO1xuICAgICAgICBsZXQgc2tpcCA9IDA7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhbGwgJiYgYnVmLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmKTtcbiAgICAgICAgICAgICAgICAgICAgYnVmID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc2tpcCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChidWYubGVuZ3RoIDwgc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnVmLnB1c2goeCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1Zi5sZW5ndGggPT09IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1Zik7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWYgPSBzdGVwIDwgc2l6ZSA/IGJ1Zi5zbGljZShzdGVwKSA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2tpcCA9IHN0ZXAgLSBzaXplO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBza2lwLS07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIGludGVycG9sYXRlKGZuLCB3aW5kb3csIG4sIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IoaW50ZXJwb2xhdGUoZm4sIHdpbmRvdywgbiksIHNyYylcbiAgICAgICAgOiBjb21wKHBhcnRpdGlvbih3aW5kb3csIDEpLCBtYXBjYXQoKGNodW5rKSA9PiBtYXAoKHQpID0+IGZuKGNodW5rLCB0KSwgbm9ybVJhbmdlKG4sIGZhbHNlKSkpKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJwb2xhdGVIZXJtaXRlKG4sIHNyYykge1xuICAgIHJldHVybiBpbnRlcnBvbGF0ZSgoY2h1bmssIHQpID0+IG1hdGgubWl4SGVybWl0ZSguLi5jaHVuaywgdCksIDQsIG4sIHNyYyk7XG59XG5cbmZ1bmN0aW9uIGludGVycG9sYXRlTGluZWFyKG4sIHNyYykge1xuICAgIHJldHVybiBpbnRlcnBvbGF0ZSgoY2h1bmssIHQpID0+IG1hdGgubWl4KC4uLmNodW5rLCB0KSwgMiwgbiwgc3JjKTtcbn1cblxuZnVuY3Rpb24gaW50ZXJwb3NlKHNlcCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcihpbnRlcnBvc2Uoc2VwKSwgc3JjKVxuICAgICAgICA6IChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBfc2VwID0gdHlwZW9mIHNlcCA9PT0gXCJmdW5jdGlvblwiID8gc2VwIDogKCkgPT4gc2VwO1xuICAgICAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIoYWNjLCB4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWNjID0gcihhY2MsIF9zZXAoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzUmVkdWNlZChhY2MpID8gYWNjIDogcihhY2MsIHgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGtlZXAoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIoa2VlcCwgYXJncykgfHxcbiAgICAgICAgKChyZm4pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgICAgICBjb25zdCBwcmVkID0gYXJnc1swXSB8fCBjb21wb3NlLmlkZW50aXR5O1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4gcHJlZCh4KSAhPSBudWxsID8gcihhY2MsIHgpIDogYWNjKTtcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiBsYWJlbGVkKGlkLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShsYWJlbGVkKGlkKSwgc3JjKVxuICAgICAgICA6IG1hcChjaGVja3MuaXNGdW5jdGlvbihpZCkgPyAoeCkgPT4gW2lkKHgpLCB4XSA6ICh4KSA9PiBbaWQsIHhdKTtcbn1cblxuY29uc3QgZGVlcFRyYW5zZm9ybSA9IChzcGVjKSA9PiB7XG4gICAgaWYgKGNoZWNrcy5pc0Z1bmN0aW9uKHNwZWMpKSB7XG4gICAgICAgIHJldHVybiBzcGVjO1xuICAgIH1cbiAgICBjb25zdCBtYXBmbnMgPSBPYmplY3Qua2V5cyhzcGVjWzFdIHx8IHt9KS5yZWR1Y2UoKGFjYywgaykgPT4gKChhY2Nba10gPSBkZWVwVHJhbnNmb3JtKHNwZWNbMV1ba10pKSwgYWNjKSwge30pO1xuICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICBjb25zdCByZXMgPSBPYmplY3QuYXNzaWduKHt9LCB4KTtcbiAgICAgICAgZm9yIChsZXQgayBpbiBtYXBmbnMpIHtcbiAgICAgICAgICAgIHJlc1trXSA9IG1hcGZuc1trXShyZXNba10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzcGVjWzBdKHJlcyk7XG4gICAgfTtcbn07XG5cbmZ1bmN0aW9uIG1hcERlZXAoc3BlYywgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEobWFwRGVlcChzcGVjKSwgc3JjKVxuICAgICAgICA6IG1hcChkZWVwVHJhbnNmb3JtKHNwZWMpKTtcbn1cblxuZnVuY3Rpb24gbWFwS2V5cyguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKG1hcEtleXMsIGFyZ3MpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCBrZXlzID0gYXJnc1swXTtcbiAgICBjb25zdCBjb3B5ID0gYXJnc1sxXSAhPT0gZmFsc2U7XG4gICAgcmV0dXJuIG1hcCgoeCkgPT4ge1xuICAgICAgICBjb25zdCByZXMgPSBjb3B5ID8gT2JqZWN0LmFzc2lnbih7fSwgeCkgOiB4O1xuICAgICAgICBmb3IgKGxldCBrIGluIGtleXMpIHtcbiAgICAgICAgICAgIHJlc1trXSA9IGtleXNba10oeFtrXSwgeCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gbWFwTnRoKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIobWFwTnRoLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgbGV0IG4gPSBhcmdzWzBdIC0gMTtcbiAgICBsZXQgb2Zmc2V0O1xuICAgIGxldCBmbjtcbiAgICBpZiAodHlwZW9mIGFyZ3NbMV0gPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgb2Zmc2V0ID0gYXJnc1sxXTtcbiAgICAgICAgZm4gPSBhcmdzWzJdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm4gPSBhcmdzWzFdO1xuICAgICAgICBvZmZzZXQgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gKHJmbikgPT4ge1xuICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICBsZXQgc2tpcCA9IDAsIG9mZiA9IG9mZnNldDtcbiAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgaWYgKG9mZiA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChza2lwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNraXAgPSBuO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcihhY2MsIGZuKHgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2tpcC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgb2ZmLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcihhY2MsIHgpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBtYXBWYWxzKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIobWFwVmFscywgYXJncyk7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IGZuID0gYXJnc1swXTtcbiAgICBjb25zdCBjb3B5ID0gYXJnc1sxXSAhPT0gZmFsc2U7XG4gICAgcmV0dXJuIG1hcCgoeCkgPT4ge1xuICAgICAgICBjb25zdCByZXMgPSBjb3B5ID8ge30gOiB4O1xuICAgICAgICBmb3IgKGxldCBrIGluIHgpIHtcbiAgICAgICAgICAgIHJlc1trXSA9IGZuKHhba10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIG1hcGNhdEluZGV4ZWQoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIobWFwY2F0SW5kZXhlZCwgYXJncywgaXRlcmF0b3IpIHx8XG4gICAgICAgIGNvbXAobWFwSW5kZXhlZChhcmdzWzBdLCBhcmdzWzFdKSwgY2F0KCkpKTtcbn1cblxuZnVuY3Rpb24gdGFrZShuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHRha2UobiksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgbGV0IG0gPSBuO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4gLS1tID4gMFxuICAgICAgICAgICAgICAgID8gcihhY2MsIHgpXG4gICAgICAgICAgICAgICAgOiBtID09PSAwXG4gICAgICAgICAgICAgICAgICAgID8gZW5zdXJlUmVkdWNlZChyKGFjYywgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogcmVkdWNlZChhY2MpKTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hGaXJzdChwcmVkLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IFsuLi5pdGVyYXRvcjEobWF0Y2hGaXJzdChwcmVkKSwgc3JjKV1bMF1cbiAgICAgICAgOiBjb21wKGZpbHRlcihwcmVkKSwgdGFrZSgxKSk7XG59XG5cbmNvbnN0IF9fZHJhaW4gPSAoYnVmLCBjb21wbGV0ZSwgcmVkdWNlKSA9PiAoYWNjKSA9PiB7XG4gICAgd2hpbGUgKGJ1Zi5sZW5ndGggJiYgIWlzUmVkdWNlZChhY2MpKSB7XG4gICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1Zi5zaGlmdCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBsZXRlKGFjYyk7XG59O1xuXG5mdW5jdGlvbiB0YWtlTGFzdChuLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHRha2VMYXN0KG4pLCBzcmMpXG4gICAgICAgIDogKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnVmID0gW107XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgX19kcmFpbihidWYsIGNvbXBsZXRlLCByZWR1Y2UpLFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1Zi5sZW5ndGggPT09IG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1Zi5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJ1Zi5wdXNoKHgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9O1xufVxuXG5mdW5jdGlvbiBtYXRjaExhc3QocHJlZCwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBbLi4uaXRlcmF0b3IobWF0Y2hMYXN0KHByZWQpLCBzcmMpXVswXVxuICAgICAgICA6IGNvbXAoZmlsdGVyKHByZWQpLCB0YWtlTGFzdCgxKSk7XG59XG5cbmZ1bmN0aW9uIG1vdmluZ0F2ZXJhZ2UocGVyaW9kLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShtb3ZpbmdBdmVyYWdlKHBlcmlvZCksIHNyYylcbiAgICAgICAgOiAocmZuKSA9PiB7XG4gICAgICAgICAgICBwZXJpb2QgfD0gMDtcbiAgICAgICAgICAgIHBlcmlvZCA8IDIgJiYgZXJyb3JzLmlsbGVnYWxBcmdzKFwicGVyaW9kIG11c3QgYmUgPj0gMlwiKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZHVjZSA9IHJmblsyXTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvdyA9IFtdO1xuICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICByZXR1cm4gY29tcFIocmZuLCAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbiA9IHdpbmRvdy5wdXNoKHgpO1xuICAgICAgICAgICAgICAgIHN1bSArPSB4O1xuICAgICAgICAgICAgICAgIG4gPiBwZXJpb2QgJiYgKHN1bSAtPSB3aW5kb3cuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG4gPj0gcGVyaW9kID8gcmVkdWNlKGFjYywgc3VtIC8gcGVyaW9kKSA6IGFjYztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xufVxuXG5jb25zdCBfX3NvcnRPcHRzID0gKG9wdHMpID0+IChPYmplY3QuYXNzaWduKHsga2V5OiBjb21wb3NlLmlkZW50aXR5LCBjb21wYXJlOiBjb21wYXJlLmNvbXBhcmUgfSwgb3B0cykpO1xuXG5mdW5jdGlvbiBtb3ZpbmdNZWRpYW4oLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihtb3ZpbmdNZWRpYW4sIGFyZ3MpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCB7IGtleSwgY29tcGFyZSB9ID0gX19zb3J0T3B0cyhhcmdzWzFdKTtcbiAgICBjb25zdCBuID0gYXJnc1swXTtcbiAgICBjb25zdCBtID0gbiA+PiAxO1xuICAgIHJldHVybiBjb21wKHBhcnRpdGlvbihuLCAxLCB0cnVlKSwgbWFwKCh3aW5kb3cpID0+IHdpbmRvdy5zbGljZSgpLnNvcnQoKGEsIGIpID0+IGNvbXBhcmUoa2V5KGEpLCBrZXkoYikpKVttXSkpO1xufVxuXG5mdW5jdGlvbiBtdWx0aXBsZXgoLi4uYXJncykge1xuICAgIHJldHVybiBtYXAoY29tcG9zZS5qdXh0LmFwcGx5KG51bGwsIGFyZ3MubWFwKHN0ZXApKSk7XG59XG5cbmNvbnN0IHJlbmFtZXIgPSAoa21hcCkgPT4ge1xuICAgIGNvbnN0IGtzID0gT2JqZWN0LmtleXMoa21hcCk7XG4gICAgY29uc3QgW2EyLCBiMiwgYzJdID0ga3M7XG4gICAgY29uc3QgW2ExLCBiMSwgYzFdID0ga3MubWFwKChrKSA9PiBrbWFwW2tdKTtcbiAgICBzd2l0Y2ggKGtzLmxlbmd0aCkge1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICByZXR1cm4gKHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXMgPSB7fTtcbiAgICAgICAgICAgICAgICBsZXQgdjtcbiAgICAgICAgICAgICAgICAodiA9IHhbYzFdKSwgdiAhPT0gdW5kZWZpbmVkICYmIChyZXNbYzJdID0gdik7XG4gICAgICAgICAgICAgICAgKHYgPSB4W2IxXSksIHYgIT09IHVuZGVmaW5lZCAmJiAocmVzW2IyXSA9IHYpO1xuICAgICAgICAgICAgICAgICh2ID0geFthMV0pLCB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1thMl0gPSB2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHY7XG4gICAgICAgICAgICAgICAgKHYgPSB4W2IxXSksIHYgIT09IHVuZGVmaW5lZCAmJiAocmVzW2IyXSA9IHYpO1xuICAgICAgICAgICAgICAgICh2ID0geFthMV0pLCB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1thMl0gPSB2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgcmV0dXJuICh4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0ge307XG4gICAgICAgICAgICAgICAgbGV0IHYgPSB4W2ExXTtcbiAgICAgICAgICAgICAgICB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1thMl0gPSB2KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAoeCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBrLCB2O1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IHt9O1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAoayA9IGtzW2ldKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICh2ID0geFtrbWFwW2tdXSksXG4gICAgICAgICAgICAgICAgICAgICAgICB2ICE9PSB1bmRlZmluZWQgJiYgKHJlc1trXSA9IHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfTtcbiAgICB9XG59O1xuXG5mdW5jdGlvbiByZW5hbWUoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSBhcmdzLmxlbmd0aCA+IDIgJiYgJGl0ZXIocmVuYW1lLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgbGV0IGttYXAgPSBhcmdzWzBdO1xuICAgIGlmIChjaGVja3MuaXNBcnJheShrbWFwKSkge1xuICAgICAgICBrbWFwID0ga21hcC5yZWR1Y2UoKGFjYywgaywgaSkgPT4gKChhY2Nba10gPSBpKSwgYWNjKSwge30pO1xuICAgIH1cbiAgICBpZiAoYXJnc1sxXSkge1xuICAgICAgICBjb25zdCBrcyA9IE9iamVjdC5rZXlzKGttYXApO1xuICAgICAgICByZXR1cm4gbWFwKCh5KSA9PiB0cmFuc2R1Y2UoY29tcChtYXAoKGspID0+IFtrLCB5W2ttYXBba11dXSksIGZpbHRlcigoeCkgPT4geFsxXSAhPT0gdW5kZWZpbmVkKSksIGFyZ3NbMV0sIGtzKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gbWFwKHJlbmFtZXIoa21hcCkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gbXVsdGlwbGV4T2JqKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIobXVsdGlwbGV4T2JqLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgW3hmb3JtcywgcmZuXSA9IGFyZ3M7XG4gICAgY29uc3Qga3MgPSBPYmplY3Qua2V5cyh4Zm9ybXMpO1xuICAgIHJldHVybiBjb21wKG11bHRpcGxleC5hcHBseShudWxsLCBrcy5tYXAoKGspID0+IHhmb3Jtc1trXSkpLCByZW5hbWUoa3MsIHJmbikpO1xufVxuXG5jb25zdCBub29wID0gKCkgPT4gKHJmbikgPT4gcmZuO1xuXG5mdW5jdGlvbiBwYWRMYXN0KG4sIGZpbGwsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IocGFkTGFzdChuLCBmaWxsKSwgc3JjKVxuICAgICAgICA6IChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgICAgIGxldCBtID0gMDtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZW0gPSBtICUgbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlICgrK3JlbSA8PSBuICYmICFpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGZpbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4gKG0rKywgcmVkdWNlKGFjYywgeCkpLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcbn1cblxuZnVuY3Rpb24gcGFnZSguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkaXRlcihwYWdlLCBhcmdzKSB8fFxuICAgICAgICBjb21wKGRyb3AoYXJnc1swXSAqIChhcmdzWzFdIHx8IDEwKSksIHRha2UoYXJnc1sxXSB8fCAxMCkpKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uQnkoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIocGFydGl0aW9uQnksIGFyZ3MsIGl0ZXJhdG9yKSB8fFxuICAgICAgICAoKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZm4gPSBhcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgZiA9IGFyZ3NbMV0gPT09IHRydWUgPyBmbigpIDogZm47XG4gICAgICAgICAgICBsZXQgcHJldiA9IGFwaS5TRU1BUEhPUkU7XG4gICAgICAgICAgICBsZXQgY2h1bms7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2h1bmsgJiYgY2h1bmsubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBjaHVuayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlKGFjYyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnIgPSBmKHgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocHJldiA9PT0gYXBpLlNFTUFQSE9SRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldiA9IGN1cnI7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA9IFt4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjdXJyID09PSBwcmV2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuay5wdXNoKHgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgJiYgKGFjYyA9IHJlZHVjZShhY2MsIGNodW5rKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA9IGlzUmVkdWNlZChhY2MpID8gbnVsbCA6IFt4XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXYgPSBjdXJyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uT2Yoc2l6ZXMsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IocGFydGl0aW9uT2Yoc2l6ZXMpLCBzcmMpXG4gICAgICAgIDogcGFydGl0aW9uQnkoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGkgPSAwLCBqID0gMDtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGkrKyA9PT0gc2l6ZXNbal0pIHtcbiAgICAgICAgICAgICAgICAgICAgaSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGogPSAoaiArIDEpICUgc2l6ZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gajtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sIHRydWUpO1xufVxuXG5mdW5jdGlvbiBwYXJ0aXRpb25Tb3J0KC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIocGFydGl0aW9uU29ydCwgYXJncywgaXRlcmF0b3IpO1xuICAgIGlmIChpdGVyKSB7XG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIH1cbiAgICBjb25zdCB7IGtleSwgY29tcGFyZSB9ID0gX19zb3J0T3B0cyhhcmdzWzFdKTtcbiAgICByZXR1cm4gY29tcChwYXJ0aXRpb24oYXJnc1swXSwgdHJ1ZSksIG1hcGNhdCgod2luZG93KSA9PiB3aW5kb3cuc2xpY2UoKS5zb3J0KChhLCBiKSA9PiBjb21wYXJlKGtleShhKSwga2V5KGIpKSkpKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uU3luYyguLi5hcmdzKSB7XG4gICAgY29uc3QgaXRlciA9ICRpdGVyKHBhcnRpdGlvblN5bmMsIGFyZ3MsIGl0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcilcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgY29uc3QgeyBrZXksIG1lcmdlT25seSwgcmVzZXQsIGFsbCwgYmFja1ByZXNzdXJlIH0gPSBPYmplY3QuYXNzaWduKHsga2V5OiBjb21wb3NlLmlkZW50aXR5LCBtZXJnZU9ubHk6IGZhbHNlLCByZXNldDogdHJ1ZSwgYWxsOiB0cnVlLCBiYWNrUHJlc3N1cmU6IDAgfSwgYXJnc1sxXSk7XG4gICAgY29uc3QgcmVxdWlyZWRLZXlzID0gY2hlY2tzLmlzQXJyYXkoYXJnc1swXSlcbiAgICAgICAgPyBuZXcgU2V0KGFyZ3NbMF0pXG4gICAgICAgIDogYXJnc1swXTtcbiAgICBjb25zdCBjdXJyS2V5cyA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBjYWNoZSA9IG5ldyBNYXAoKTtcbiAgICBsZXQgY3VyciA9IHt9O1xuICAgIGNvbnN0IHhmb3JtID0gKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICBsZXQgZmlyc3QgPSB0cnVlO1xuICAgICAgICBpZiAobWVyZ2VPbmx5IHx8IGJhY2tQcmVzc3VyZSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgocmVzZXQgJiYgYWxsICYmIGN1cnJLZXlzLnNpemUgPiAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKCFyZXNldCAmJiBmaXJzdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGN1cnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VyciA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycktleXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlKGFjYyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGsgPSBrZXkoeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1aXJlZEtleXMuaGFzKGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyW2tdID0geDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJLZXlzLmFkZChrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXJnZU9ubHkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZElucHV0cyhyZXF1aXJlZEtleXMsIGN1cnJLZXlzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGN1cnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc2V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycktleXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnIgPSBPYmplY3QuYXNzaWduKHt9LCBjdXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhbGwgJiYgY3VycktleXMuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGNvbGxlY3QoY2FjaGUsIGN1cnJLZXlzKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWNoZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycktleXMuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGxldGUoYWNjKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgayA9IGtleSh4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcXVpcmVkS2V5cy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzbG90ID0gY2FjaGUuZ2V0KGspO1xuICAgICAgICAgICAgICAgICAgICAgICAgIXNsb3QgJiYgY2FjaGUuc2V0KGssIChzbG90ID0gW10pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsb3QubGVuZ3RoID49IGJhY2tQcmVzc3VyZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9ycy5pbGxlZ2FsU3RhdGUoYG1heCBiYWNrIHByZXNzdXJlICgke2JhY2tQcmVzc3VyZX0pIGV4Y2VlZGVkIGZvciBpbnB1dDogJHtTdHJpbmcoayl9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzbG90LnB1c2goeCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyS2V5cy5hZGQoayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAocmVxdWlyZWRJbnB1dHMocmVxdWlyZWRLZXlzLCBjdXJyS2V5cykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBjb2xsZWN0KGNhY2hlLCBjdXJyS2V5cykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVkdWNlZChhY2MpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB4Zm9ybS5rZXlzID0gKCkgPT4gcmVxdWlyZWRLZXlzO1xuICAgIHhmb3JtLmNsZWFyID0gKCkgPT4ge1xuICAgICAgICBjYWNoZS5jbGVhcigpO1xuICAgICAgICByZXF1aXJlZEtleXMuY2xlYXIoKTtcbiAgICAgICAgY3VycktleXMuY2xlYXIoKTtcbiAgICAgICAgY3VyciA9IHt9O1xuICAgIH07XG4gICAgeGZvcm0uYWRkID0gKGlkKSA9PiB7XG4gICAgICAgIHJlcXVpcmVkS2V5cy5hZGQoaWQpO1xuICAgIH07XG4gICAgeGZvcm0uZGVsZXRlID0gKGlkLCBjbGVhbiA9IHRydWUpID0+IHtcbiAgICAgICAgY2FjaGUuZGVsZXRlKGlkKTtcbiAgICAgICAgcmVxdWlyZWRLZXlzLmRlbGV0ZShpZCk7XG4gICAgICAgIGlmIChjbGVhbikge1xuICAgICAgICAgICAgY3VycktleXMuZGVsZXRlKGlkKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjdXJyW2lkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIHhmb3JtO1xufVxuY29uc3QgcmVxdWlyZWRJbnB1dHMgPSAocmVxdWlyZWQsIGN1cnIpID0+IHtcbiAgICBpZiAoY3Vyci5zaXplIDwgcmVxdWlyZWQuc2l6ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAobGV0IGlkIG9mIHJlcXVpcmVkKSB7XG4gICAgICAgIGlmICghY3Vyci5oYXMoaWQpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5jb25zdCBjb2xsZWN0ID0gKGNhY2hlLCBjdXJyS2V5cykgPT4ge1xuICAgIGNvbnN0IGN1cnIgPSB7fTtcbiAgICBmb3IgKGxldCBpZCBvZiBjdXJyS2V5cykge1xuICAgICAgICBjb25zdCBzbG90ID0gY2FjaGUuZ2V0KGlkKTtcbiAgICAgICAgY3VycltpZF0gPSBzbG90LnNoaWZ0KCk7XG4gICAgICAgICFzbG90Lmxlbmd0aCAmJiBjdXJyS2V5cy5kZWxldGUoaWQpO1xuICAgIH1cbiAgICByZXR1cm4gY3Vycjtcbn07XG5cbmZ1bmN0aW9uIHBhcnRpdGlvblRpbWUocGVyaW9kLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yKHBhcnRpdGlvblRpbWUocGVyaW9kKSwgc3JjKVxuICAgICAgICA6IHBhcnRpdGlvbkJ5KCgpID0+IHtcbiAgICAgICAgICAgIGxldCBsYXN0ID0gMDtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgdCAtIGxhc3QgPj0gcGVyaW9kICYmIChsYXN0ID0gdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LCB0cnVlKTtcbn1cblxuZnVuY3Rpb24gcGFydGl0aW9uV2hlbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkaXRlcihwYXJ0aXRpb25XaGVuLCBhcmdzLCBpdGVyYXRvcikgfHxcbiAgICAgICAgKChbaW5pdCwgY29tcGxldGUsIHJlZHVjZV0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByZWQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgY29uc3QgZiA9IGFyZ3NbMV0gPT09IHRydWUgPyBwcmVkKCkgOiBwcmVkO1xuICAgICAgICAgICAgbGV0IGNodW5rO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBpbml0LFxuICAgICAgICAgICAgICAgIChhY2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgY2h1bmspO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZShhY2MpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZih4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmsgJiYgKGFjYyA9IHJlZHVjZShhY2MsIGNodW5rKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaHVuayA9IGlzUmVkdWNlZChhY2MpID8gbnVsbCA6IFt4XTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rID8gY2h1bmsucHVzaCh4KSA6IChjaHVuayA9IFt4XSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSkpO1xufVxuXG5mdW5jdGlvbiBwZWVrKHNyYykge1xuICAgIHJldHVybiBtYXAoYXJyYXlzLnBlZWssIHNyYyk7XG59XG5cbmZ1bmN0aW9uIHBsdWNrKGtleSwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEocGx1Y2soa2V5KSwgc3JjKVxuICAgICAgICA6IG1hcCgoeCkgPT4geFtrZXldKTtcbn1cblxuZnVuY3Rpb24gc2FtcGxlKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIoc2FtcGxlLCBhcmdzKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgcHJvYiA9IGFyZ3NbMF07XG4gICAgY29uc3Qgcm5kID0gYXJnc1sxXSB8fCByYW5kb20uU1lTVEVNO1xuICAgIHJldHVybiAocmZuKSA9PiB7XG4gICAgICAgIGNvbnN0IHIgPSByZm5bMl07XG4gICAgICAgIHJldHVybiBjb21wUihyZm4sIChhY2MsIHgpID0+IHJuZC5mbG9hdCgpIDwgcHJvYiA/IHIoYWNjLCB4KSA6IGFjYyk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gc2NhbiguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgoYXJncy5sZW5ndGggPiAyICYmICRpdGVyKHNjYW4sIGFyZ3MsIGl0ZXJhdG9yKSkgfHxcbiAgICAgICAgKChbaW5pdG8sIGNvbXBsZXRlbywgcmVkdWNlb10pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFtpbml0aSwgY29tcGxldGVpLCByZWR1Y2VpXSA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgYWNjID0gYXJncy5sZW5ndGggPiAxICYmIGFyZ3NbMV0gIT0gbnVsbCA/IGFyZ3NbMV0gOiBpbml0aSgpO1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBpbml0byxcbiAgICAgICAgICAgICAgICAoX2FjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYSA9IGNvbXBsZXRlaShhY2MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYSAhPT0gYWNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfYWNjID0gdW5yZWR1Y2VkKHJlZHVjZW8oX2FjYywgYSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IGE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wbGV0ZW8oX2FjYyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoX2FjYywgeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2VpKGFjYywgeCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1JlZHVjZWQoYWNjKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuc3VyZVJlZHVjZWQocmVkdWNlbyhfYWNjLCBhY2MuZGVyZWYoKSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWR1Y2VvKF9hY2MsIGFjYyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0pKTtcbn1cblxuY29uc3Qga2V5U2VsZWN0b3IgPSAoa2V5cykgPT4gcmVuYW1lcihrZXlzLnJlZHVjZSgoYWNjLCB4KSA9PiAoKGFjY1t4XSA9IHgpLCBhY2MpLCB7fSkpO1xuXG5mdW5jdGlvbiBzZWxlY3RLZXlzKGtleXMsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3IxKHNlbGVjdEtleXMoa2V5cyksIHNyYylcbiAgICAgICAgOiBtYXAoa2V5U2VsZWN0b3Ioa2V5cykpO1xufVxuXG5jb25zdCBzaWRlRWZmZWN0ID0gKGZuKSA9PiBtYXAoKHgpID0+IChmbih4KSwgeCkpO1xuXG5mdW5jdGlvbiBzbGlkaW5nV2luZG93KC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIoc2xpZGluZ1dpbmRvdywgYXJncyk7XG4gICAgaWYgKGl0ZXIpXG4gICAgICAgIHJldHVybiBpdGVyO1xuICAgIGNvbnN0IHNpemUgPSBhcmdzWzBdO1xuICAgIGNvbnN0IHBhcnRpYWwgPSBhcmdzWzFdICE9PSBmYWxzZTtcbiAgICByZXR1cm4gKHJmbikgPT4ge1xuICAgICAgICBjb25zdCByZWR1Y2UgPSByZm5bMl07XG4gICAgICAgIGxldCBidWYgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4ge1xuICAgICAgICAgICAgYnVmLnB1c2goeCk7XG4gICAgICAgICAgICBjb25zdCBfc2l6ZSA9IGFwaS5kZXJlZihzaXplKTtcbiAgICAgICAgICAgIGlmIChwYXJ0aWFsIHx8IGJ1Zi5sZW5ndGggPj0gX3NpemUpIHtcbiAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYpO1xuICAgICAgICAgICAgICAgIGJ1ZiA9IGJ1Zi5zbGljZShidWYubGVuZ3RoID49IF9zaXplID8gMSA6IDAsIF9zaXplKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHN0cmVhbVNodWZmbGUoLi4uYXJncykge1xuICAgIHJldHVybiAoJGl0ZXIoc3RyZWFtU2h1ZmZsZSwgYXJncywgaXRlcmF0b3IpIHx8XG4gICAgICAgICgoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuID0gYXJnc1swXTtcbiAgICAgICAgICAgIGNvbnN0IG1heFN3YXBzID0gYXJnc1sxXSB8fCBuO1xuICAgICAgICAgICAgY29uc3QgYnVmID0gW107XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICAgICAgKGFjYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoYnVmLmxlbmd0aCAmJiAhaXNSZWR1Y2VkKGFjYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5cy5zaHVmZmxlKGJ1ZiwgbWF4U3dhcHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjID0gcmVkdWNlKGFjYywgYnVmLnNoaWZ0KCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFjYyA9IGNvbXBsZXRlKGFjYyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoYWNjLCB4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGJ1Zi5wdXNoKHgpO1xuICAgICAgICAgICAgICAgICAgICBhcnJheXMuc2h1ZmZsZShidWYsIG1heFN3YXBzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1Zi5sZW5ndGggPT09IG4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjYyA9IHJlZHVjZShhY2MsIGJ1Zi5zaGlmdCgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHN0cmVhbVNvcnQoLi4uYXJncykge1xuICAgIGNvbnN0IGl0ZXIgPSAkaXRlcihzdHJlYW1Tb3J0LCBhcmdzLCBpdGVyYXRvcik7XG4gICAgaWYgKGl0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgfVxuICAgIGNvbnN0IHsga2V5LCBjb21wYXJlIH0gPSBfX3NvcnRPcHRzKGFyZ3NbMV0pO1xuICAgIGNvbnN0IG4gPSBhcmdzWzBdO1xuICAgIHJldHVybiAoW2luaXQsIGNvbXBsZXRlLCByZWR1Y2VdKSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1ZiA9IFtdO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIF9fZHJhaW4oYnVmLCBjb21wbGV0ZSwgcmVkdWNlKSxcbiAgICAgICAgICAgIChhY2MsIHgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZHggPSBhcnJheXMuYmluYXJ5U2VhcmNoKGJ1ZiwgeCwga2V5LCBjb21wYXJlKTtcbiAgICAgICAgICAgICAgICBidWYuc3BsaWNlKGlkeCA8IDAgPyAtKGlkeCArIDEpIDogaWR4LCAwLCB4KTtcbiAgICAgICAgICAgICAgICBpZiAoYnVmLmxlbmd0aCA9PT0gbikge1xuICAgICAgICAgICAgICAgICAgICBhY2MgPSByZWR1Y2UoYWNjLCBidWYuc2hpZnQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHN0cnVjdChmaWVsZHMsIHNyYykge1xuICAgIHJldHVybiBjaGVja3MuaXNJdGVyYWJsZShzcmMpXG4gICAgICAgID8gaXRlcmF0b3Ioc3RydWN0KGZpZWxkcyksIHNyYylcbiAgICAgICAgOiBjb21wKHBhcnRpdGlvbk9mKGZpZWxkcy5tYXAoKGYpID0+IGZbMV0pKSwgcGFydGl0aW9uKGZpZWxkcy5sZW5ndGgpLCByZW5hbWUoZmllbGRzLm1hcCgoZikgPT4gZlswXSkpLCBtYXBLZXlzKGZpZWxkcy5yZWR1Y2UoKGFjYywgZikgPT4gKGZbMl0gPyAoKGFjY1tmWzBdXSA9IGZbMl0pLCBhY2MpIDogYWNjKSwge30pLCBmYWxzZSkpO1xufVxuXG5mdW5jdGlvbiBzd2l6emxlKG9yZGVyLCBzcmMpIHtcbiAgICByZXR1cm4gY2hlY2tzLmlzSXRlcmFibGUoc3JjKVxuICAgICAgICA/IGl0ZXJhdG9yMShzd2l6emxlKG9yZGVyKSwgc3JjKVxuICAgICAgICA6IG1hcChhcnJheXMuc3dpenpsZShvcmRlcikpO1xufVxuXG5mdW5jdGlvbiB0YWtlTnRoKG4sIHNyYykge1xuICAgIGlmIChjaGVja3MuaXNJdGVyYWJsZShzcmMpKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvcjEodGFrZU50aChuKSwgc3JjKTtcbiAgICB9XG4gICAgbiA9IG1hdGguY2xhbXAwKG4gLSAxKTtcbiAgICByZXR1cm4gdGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICBsZXQgc2tpcCA9IDA7XG4gICAgICAgIHJldHVybiAoKSA9PiAoc2tpcCA9PT0gMCA/ICgoc2tpcCA9IG4pLCB0cnVlKSA6IChza2lwLS0sIGZhbHNlKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRha2VXaGlsZSguLi5hcmdzKSB7XG4gICAgcmV0dXJuICgkaXRlcih0YWtlV2hpbGUsIGFyZ3MpIHx8XG4gICAgICAgICgocmZuKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByID0gcmZuWzJdO1xuICAgICAgICAgICAgY29uc3QgcHJlZCA9IGFyZ3NbMF07XG4gICAgICAgICAgICBsZXQgb2sgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGNvbXBSKHJmbiwgKGFjYywgeCkgPT4gKG9rID0gb2sgJiYgcHJlZCh4KSkgPyByKGFjYywgeCkgOiByZWR1Y2VkKGFjYykpO1xuICAgICAgICB9KSk7XG59XG5cbmZ1bmN0aW9uIHRocm90dGxlVGltZShkZWxheSwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEodGhyb3R0bGVUaW1lKGRlbGF5KSwgc3JjKVxuICAgICAgICA6IHRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBsYXN0ID0gMDtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHQgLSBsYXN0ID49IGRlbGF5ID8gKChsYXN0ID0gdCksIHRydWUpIDogZmFsc2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbn1cblxuZnVuY3Rpb24gdG9nZ2xlKG9uLCBvZmYsIGluaXRpYWwgPSBmYWxzZSwgc3JjKSB7XG4gICAgcmV0dXJuIGNoZWNrcy5pc0l0ZXJhYmxlKHNyYylcbiAgICAgICAgPyBpdGVyYXRvcjEodG9nZ2xlKG9uLCBvZmYsIGluaXRpYWwpLCBzcmMpXG4gICAgICAgIDogKFtpbml0LCBjb21wbGV0ZSwgcmVkdWNlXSkgPT4ge1xuICAgICAgICAgICAgbGV0IHN0YXRlID0gaW5pdGlhbDtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSxcbiAgICAgICAgICAgICAgICAoYWNjKSA9PiByZWR1Y2UoYWNjLCAoc3RhdGUgPSAhc3RhdGUpID8gb24gOiBvZmYpLFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfTtcbn1cblxuY29uc3QgdHJhY2UgPSAocHJlZml4ID0gXCJcIikgPT4gc2lkZUVmZmVjdCgoeCkgPT4gY29uc29sZS5sb2cocHJlZml4LCB4KSk7XG5cbmZ1bmN0aW9uIHdvcmRXcmFwKC4uLmFyZ3MpIHtcbiAgICBjb25zdCBpdGVyID0gJGl0ZXIod29yZFdyYXAsIGFyZ3MsIGl0ZXJhdG9yKTtcbiAgICBpZiAoaXRlcikge1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9XG4gICAgY29uc3QgbGluZUxlbmd0aCA9IGFyZ3NbMF07XG4gICAgY29uc3QgeyBkZWxpbSwgYWx3YXlzIH0gPSBPYmplY3QuYXNzaWduKHsgZGVsaW06IDEsIGFsd2F5czogdHJ1ZSB9LCBhcmdzWzFdKTtcbiAgICByZXR1cm4gcGFydGl0aW9uQnkoKCkgPT4ge1xuICAgICAgICBsZXQgbiA9IDA7XG4gICAgICAgIGxldCBmbGFnID0gZmFsc2U7XG4gICAgICAgIHJldHVybiAodykgPT4ge1xuICAgICAgICAgICAgbiArPSB3Lmxlbmd0aCArIGRlbGltO1xuICAgICAgICAgICAgaWYgKG4gPiBsaW5lTGVuZ3RoICsgKGFsd2F5cyA/IDAgOiBkZWxpbSkpIHtcbiAgICAgICAgICAgICAgICBmbGFnID0gIWZsYWc7XG4gICAgICAgICAgICAgICAgbiA9IHcubGVuZ3RoICsgZGVsaW07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmxhZztcbiAgICAgICAgfTtcbiAgICB9LCB0cnVlKTtcbn1cblxuY29uc3QgbG9va3VwMWQgPSAoc3JjKSA9PiAoaSkgPT4gc3JjW2ldO1xuY29uc3QgbG9va3VwMmQgPSAoc3JjLCB3aWR0aCkgPT4gKGkpID0+IHNyY1tpWzBdICsgaVsxXSAqIHdpZHRoXTtcbmNvbnN0IGxvb2t1cDNkID0gKHNyYywgd2lkdGgsIGhlaWdodCkgPT4ge1xuICAgIGNvbnN0IHN0cmlkZXogPSB3aWR0aCAqIGhlaWdodDtcbiAgICByZXR1cm4gKGkpID0+IHNyY1tpWzBdICsgaVsxXSAqIHdpZHRoICsgaVsyXSAqIHN0cmlkZXpdO1xufTtcblxuZnVuY3Rpb24qIGFzSXRlcmFibGUoc3JjKSB7XG4gICAgeWllbGQqIHNyYztcbn1cblxuZnVuY3Rpb24qIHJlcGVhdGVkbHkoZm4sIG4gPSBJbmZpbml0eSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHlpZWxkIGZuKGkpO1xuICAgIH1cbn1cblxuY29uc3QgY2hvaWNlcyA9IChjaG9pY2VzLCB3ZWlnaHRzLCBybmQgPSByYW5kb20uU1lTVEVNKSA9PiByZXBlYXRlZGx5KHdlaWdodHNcbiAgICA/IHJhbmRvbS53ZWlnaHRlZFJhbmRvbShhcnJheXMuZW5zdXJlQXJyYXkoY2hvaWNlcyksIHdlaWdodHMsIHJuZClcbiAgICA6ICgpID0+IGNob2ljZXNbcm5kLmZsb2F0KGNob2ljZXMubGVuZ3RoKSB8IDBdKTtcblxuZnVuY3Rpb24qIGNvbmNhdCguLi54cykge1xuICAgIGZvciAobGV0IHggb2YgeHMpIHtcbiAgICAgICAgeCAhPSBudWxsICYmICh5aWVsZCogYXJyYXlzLmVuc3VyZUl0ZXJhYmxlKHgpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBjdXJ2ZShzdGFydCwgZW5kLCBzdGVwcyA9IDEwLCByYXRlID0gMC4xKSB7XG4gICAgY29uc3QgYyA9IE1hdGguZXhwKC1NYXRoLmxvZygoTWF0aC5hYnMoZW5kIC0gc3RhcnQpICsgcmF0ZSkgLyByYXRlKSAvIHN0ZXBzKTtcbiAgICBjb25zdCBvZmZzZXQgPSAoc3RhcnQgPCBlbmQgPyBlbmQgKyByYXRlIDogZW5kIC0gcmF0ZSkgKiAoMSAtIGMpO1xuICAgIHN0ZXBzID4gMCAmJiAoeWllbGQgc3RhcnQpO1xuICAgIGZvciAobGV0IHggPSBzdGFydDsgLS1zdGVwcyA+PSAwOykge1xuICAgICAgICB5aWVsZCAoeCA9IG9mZnNldCArIHggKiBjKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBjeWNsZShpbnB1dCwgbnVtID0gSW5maW5pdHkpIHtcbiAgICBpZiAobnVtIDwgMSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGxldCBjYWNoZSA9IFtdO1xuICAgIGZvciAobGV0IGkgb2YgaW5wdXQpIHtcbiAgICAgICAgY2FjaGUucHVzaChpKTtcbiAgICAgICAgeWllbGQgaTtcbiAgICB9XG4gICAgaWYgKGNhY2hlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgd2hpbGUgKC0tbnVtID4gMCkge1xuICAgICAgICAgICAgeWllbGQqIGNhY2hlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkdXAoeCkge1xuICAgIHJldHVybiBjaGVja3MuaXNTdHJpbmcoeClcbiAgICAgICAgPyB4ICsgeFxuICAgICAgICA6IGNoZWNrcy5pc0FycmF5KHgpXG4gICAgICAgICAgICA/IHguY29uY2F0KHgpXG4gICAgICAgICAgICA6ICgoeCA9IGFycmF5cy5lbnN1cmVBcnJheSh4KSksIGNvbmNhdCh4LCB4KSk7XG59XG5cbmZ1bmN0aW9uKiByZXBlYXQoeCwgbiA9IEluZmluaXR5KSB7XG4gICAgd2hpbGUgKG4tLSA+IDApIHtcbiAgICAgICAgeWllbGQgeDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uKiBleHRlbmRTaWRlcyhzcmMsIG51bUxlZnQgPSAxLCBudW1SaWdodCA9IG51bUxlZnQpIHtcbiAgICBsZXQgcHJldiA9IGFwaS5TRU1BUEhPUkU7XG4gICAgZm9yIChsZXQgeCBvZiBzcmMpIHtcbiAgICAgICAgaWYgKG51bUxlZnQgPiAwICYmIHByZXYgPT09IGFwaS5TRU1BUEhPUkUpIHtcbiAgICAgICAgICAgIHlpZWxkKiByZXBlYXQoeCwgbnVtTGVmdCk7XG4gICAgICAgICAgICBudW1MZWZ0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCB4O1xuICAgICAgICBwcmV2ID0geDtcbiAgICB9XG4gICAgaWYgKG51bVJpZ2h0ID4gMCAmJiBwcmV2ICE9PSBhcGkuU0VNQVBIT1JFKSB7XG4gICAgICAgIHlpZWxkKiByZXBlYXQocHJldiwgbnVtUmlnaHQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24qIGl0ZXJhdGUoZm4sIHNlZWQsIG51bSA9IEluZmluaXR5KSB7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbnVtOyBpKyspIHtcbiAgICAgICAgeWllbGQgc2VlZDtcbiAgICAgICAgc2VlZCA9IGZuKHNlZWQsIGkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24qIHBhaXJzKHgpIHtcbiAgICBmb3IgKGxldCBrIGluIHgpIHtcbiAgICAgICAgaWYgKHguaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIHlpZWxkIFtrLCB4W2tdXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24qIHBlcm11dGF0aW9ucyguLi5zcmMpIHtcbiAgICBjb25zdCBuID0gc3JjLmxlbmd0aCAtIDE7XG4gICAgaWYgKG4gPCAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc3RlcCA9IG5ldyBBcnJheShuICsgMSkuZmlsbCgwKTtcbiAgICBjb25zdCByZWFsaXplZCA9IHNyYy5tYXAoYXJyYXlzLmVuc3VyZUFycmF5TGlrZSk7XG4gICAgY29uc3QgdG90YWwgPSByZWFsaXplZC5yZWR1Y2UoKGFjYywgeCkgPT4gYWNjICogeC5sZW5ndGgsIDEpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWw7IGkrKykge1xuICAgICAgICBjb25zdCB0dXBsZSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBqID0gbjsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZWFsaXplZFtqXTtcbiAgICAgICAgICAgIGxldCBzID0gc3RlcFtqXTtcbiAgICAgICAgICAgIGlmIChzID09PSByLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHN0ZXBbal0gPSBzID0gMDtcbiAgICAgICAgICAgICAgICBqID4gMCAmJiBzdGVwW2ogLSAxXSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHVwbGVbal0gPSByW3NdO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXBbbl0rKztcbiAgICAgICAgeWllbGQgdHVwbGU7XG4gICAgfVxufVxuY29uc3QgcGVybXV0YXRpb25zTiA9IChuLCBtID0gbiwgb2Zmc2V0cykgPT4ge1xuICAgIGlmIChvZmZzZXRzICYmIG9mZnNldHMubGVuZ3RoIDwgbikge1xuICAgICAgICBlcnJvcnMuaWxsZWdhbEFyZ3MoYGluc3VmZmljaWVudCBvZmZzZXRzLCBnb3QgJHtvZmZzZXRzLmxlbmd0aH0sIG5lZWRlZCAke259YCk7XG4gICAgfVxuICAgIGNvbnN0IHNlcXMgPSBbXTtcbiAgICB3aGlsZSAoLS1uID49IDApIHtcbiAgICAgICAgY29uc3QgbyA9IG9mZnNldHMgPyBvZmZzZXRzW25dIDogMDtcbiAgICAgICAgc2Vxc1tuXSA9IHJhbmdlKG8sIG8gKyBtKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlcm11dGF0aW9ucy5hcHBseShudWxsLCBzZXFzKTtcbn07XG5cbmNvbnN0IGtleVBlcm11dGF0aW9ucyA9IChzcGVjKSA9PiAobWFwKCh4KSA9PiBhc3NvY09iaihwYXJ0aXRpb24oMiwgeCkpLCBwZXJtdXRhdGlvbnMoLi4ubWFwY2F0KChbaywgdl0pID0+IFtba10sIHZdLCBwYWlycyhzcGVjKSkpKSk7XG5cbmZ1bmN0aW9uKiBrZXlzKHgpIHtcbiAgICBmb3IgKGxldCBrIGluIHgpIHtcbiAgICAgICAgaWYgKHguaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgIHlpZWxkIGs7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IGxpbmUgPSAoc3RhcnQsIGVuZCwgc3RlcHMgPSAxMCkgPT4ge1xuICAgIGNvbnN0IGRlbHRhID0gZW5kIC0gc3RhcnQ7XG4gICAgcmV0dXJuIG1hcCgodCkgPT4gc3RhcnQgKyBkZWx0YSAqIHQsIG5vcm1SYW5nZShzdGVwcykpO1xufTtcblxuY29uc3QgcGFkU2lkZXMgPSAoc3JjLCB4LCBudW1MZWZ0ID0gMSwgbnVtUmlnaHQgPSBudW1MZWZ0KSA9PiBudW1MZWZ0ID4gMFxuICAgID8gbnVtUmlnaHQgPiAwXG4gICAgICAgID8gY29uY2F0KHJlcGVhdCh4LCBudW1MZWZ0KSwgc3JjLCByZXBlYXQoeCwgbnVtUmlnaHQpKVxuICAgICAgICA6IGNvbmNhdChyZXBlYXQoeCwgbnVtTGVmdCksIHNyYylcbiAgICA6IG51bVJpZ2h0ID4gMFxuICAgICAgICA/IGNvbmNhdChzcmMsIHJlcGVhdCh4LCBudW1SaWdodCkpXG4gICAgICAgIDogY29uY2F0KHNyYyk7XG5cbmZ1bmN0aW9uKiByZXZlcnNlKGlucHV0KSB7XG4gICAgY29uc3QgX2lucHV0ID0gYXJyYXlzLmVuc3VyZUFycmF5KGlucHV0KTtcbiAgICBsZXQgbiA9IF9pbnB1dC5sZW5ndGg7XG4gICAgd2hpbGUgKC0tbiA+PSAwKSB7XG4gICAgICAgIHlpZWxkIF9pbnB1dFtuXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhbGluZHJvbWUoeCkge1xuICAgIHJldHVybiBjaGVja3MuaXNTdHJpbmcoeClcbiAgICAgICAgPyBzdHIoXCJcIiwgY29uY2F0KFt4XSwgcmV2ZXJzZSh4KSkpXG4gICAgICAgIDogY2hlY2tzLmlzQXJyYXkoeClcbiAgICAgICAgICAgID8geC5jb25jYXQoeC5zbGljZSgpLnJldmVyc2UoKSlcbiAgICAgICAgICAgIDogKCh4ID0gYXJyYXlzLmVuc3VyZUFycmF5KHgpKSwgY29uY2F0KHgsIHJldmVyc2UoeCkpKTtcbn1cblxuZnVuY3Rpb24qIHJhbmdlM2QoLi4uYXJncykge1xuICAgIGxldCBmcm9tWCwgdG9YLCBzdGVwWDtcbiAgICBsZXQgZnJvbVksIHRvWSwgc3RlcFk7XG4gICAgbGV0IGZyb21aLCB0b1osIHN0ZXBaO1xuICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgc3RlcFggPSBhcmdzWzZdO1xuICAgICAgICAgICAgc3RlcFkgPSBhcmdzWzddO1xuICAgICAgICAgICAgc3RlcFogPSBhcmdzWzhdO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICBbZnJvbVgsIHRvWCwgZnJvbVksIHRvWSwgZnJvbVosIHRvWl0gPSBhcmdzO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIFt0b1gsIHRvWSwgdG9aXSA9IGFyZ3M7XG4gICAgICAgICAgICBmcm9tWCA9IGZyb21ZID0gZnJvbVogPSAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBlcnJvcnMuaWxsZWdhbEFyaXR5KGFyZ3MubGVuZ3RoKTtcbiAgICB9XG4gICAgY29uc3QgcnggPSByYW5nZShmcm9tWCwgdG9YLCBzdGVwWCk7XG4gICAgY29uc3QgcnkgPSByYW5nZShmcm9tWSwgdG9ZLCBzdGVwWSk7XG4gICAgZm9yIChsZXQgeiBvZiByYW5nZShmcm9tWiwgdG9aLCBzdGVwWikpIHtcbiAgICAgICAgZm9yIChsZXQgeSBvZiByeSkge1xuICAgICAgICAgICAgZm9yIChsZXQgeCBvZiByeCkge1xuICAgICAgICAgICAgICAgIHlpZWxkIFt4LCB5LCB6XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgcmFuZ2VOZCA9IChtaW4sIG1heCkgPT4gcGVybXV0YXRpb25zLmFwcGx5KG51bGwsICgobWF4XG4gICAgPyBbLi4ubWFwKChbYSwgYl0pID0+IHJhbmdlKGEsIGIpLCB6aXAobWluLCBtYXgpKV1cbiAgICA6IFsuLi5tYXAocmFuZ2UsIG1pbildKSkpO1xuXG5mdW5jdGlvbiogc29ydGVkS2V5cyh4LCBjbXAgPSBjb21wYXJlLmNvbXBhcmUpIHtcbiAgICB5aWVsZCogT2JqZWN0LmtleXMoeCkuc29ydChjbXApO1xufVxuXG5mdW5jdGlvbiogc3ltbWV0cmljKHNyYykge1xuICAgIGxldCBoZWFkID0gdW5kZWZpbmVkO1xuICAgIGZvciAobGV0IHggb2Ygc3JjKSB7XG4gICAgICAgIGhlYWQgPSB7IHgsIG46IGhlYWQgfTtcbiAgICAgICAgeWllbGQgeDtcbiAgICB9XG4gICAgd2hpbGUgKGhlYWQpIHtcbiAgICAgICAgeWllbGQgaGVhZC54O1xuICAgICAgICBoZWFkID0gaGVhZC5uO1xuICAgIH1cbn1cblxuZnVuY3Rpb24qIHR3ZWVuKG9wdHMpIHtcbiAgICBjb25zdCB7IG1pbiwgbWF4LCBudW0sIGluaXQsIG1peCwgc3RvcHMgfSA9IG9wdHM7XG4gICAgY29uc3QgZWFzaW5nID0gb3B0cy5lYXNpbmcgfHwgKCh4KSA9PiB4KTtcbiAgICBsZXQgbCA9IHN0b3BzLmxlbmd0aDtcbiAgICBpZiAobCA8IDEpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAobCA9PT0gMSkge1xuICAgICAgICB5aWVsZCogcmVwZWF0KG1peChpbml0KHN0b3BzWzBdWzFdLCBzdG9wc1swXVsxXSksIDApLCBudW0pO1xuICAgIH1cbiAgICBzdG9wcy5zb3J0KChhLCBiKSA9PiBhWzBdIC0gYlswXSk7XG4gICAgc3RvcHNbbCAtIDFdWzBdIDwgbWF4ICYmIHN0b3BzLnB1c2goW21heCwgc3RvcHNbbCAtIDFdWzFdXSk7XG4gICAgc3RvcHNbMF1bMF0gPiBtaW4gJiYgc3RvcHMudW5zaGlmdChbbWluLCBzdG9wc1swXVsxXV0pO1xuICAgIGNvbnN0IHJhbmdlID0gbWF4IC0gbWluO1xuICAgIGxldCBzdGFydCA9IHN0b3BzWzBdWzBdO1xuICAgIGxldCBlbmQgPSBzdG9wc1sxXVswXTtcbiAgICBsZXQgZGVsdGEgPSBlbmQgLSBzdGFydDtcbiAgICBsZXQgaW50ZXJ2YWwgPSBpbml0KHN0b3BzWzBdWzFdLCBzdG9wc1sxXVsxXSk7XG4gICAgbGV0IGkgPSAxO1xuICAgIGwgPSBzdG9wcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgdCBvZiBub3JtUmFuZ2UobnVtKSkge1xuICAgICAgICB0ID0gbWluICsgcmFuZ2UgKiB0O1xuICAgICAgICBpZiAodCA+IGVuZCkge1xuICAgICAgICAgICAgd2hpbGUgKGkgPCBsICYmIHQgPiBzdG9wc1tpXVswXSlcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBzdGFydCA9IHN0b3BzW2kgLSAxXVswXTtcbiAgICAgICAgICAgIGVuZCA9IHN0b3BzW2ldWzBdO1xuICAgICAgICAgICAgZGVsdGEgPSBlbmQgLSBzdGFydDtcbiAgICAgICAgICAgIGludGVydmFsID0gaW5pdChzdG9wc1tpIC0gMV1bMV0sIHN0b3BzW2ldWzFdKTtcbiAgICAgICAgfVxuICAgICAgICB5aWVsZCBtaXgoaW50ZXJ2YWwsIGVhc2luZyhkZWx0YSAhPT0gMCA/ICh0IC0gc3RhcnQpIC8gZGVsdGEgOiAwKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiogdmFscyh4KSB7XG4gICAgZm9yIChsZXQgayBpbiB4KSB7XG4gICAgICAgIGlmICh4Lmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICB5aWVsZCB4W2tdO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiogd3JhcFNpZGVzKHNyYywgbnVtTGVmdCA9IDEsIG51bVJpZ2h0ID0gbnVtTGVmdCkge1xuICAgIGNvbnN0IF9zcmMgPSBhcnJheXMuZW5zdXJlQXJyYXkoc3JjKTtcbiAgICAhKG1hdGguaW5SYW5nZShudW1MZWZ0LCAwLCBfc3JjLmxlbmd0aCkgJiYgbWF0aC5pblJhbmdlKG51bVJpZ2h0LCAwLCBfc3JjLmxlbmd0aCkpICYmXG4gICAgICAgIGVycm9ycy5pbGxlZ2FsQXJncyhgYWxsb3dlZCB3cmFwIHJhbmdlOiBbMC4uJHtfc3JjLmxlbmd0aH1dYCk7XG4gICAgaWYgKG51bUxlZnQgPiAwKSB7XG4gICAgICAgIGZvciAobGV0IG0gPSBfc3JjLmxlbmd0aCwgaSA9IG0gLSBudW1MZWZ0OyBpIDwgbTsgaSsrKSB7XG4gICAgICAgICAgICB5aWVsZCBfc3JjW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHlpZWxkKiBfc3JjO1xuICAgIGlmIChudW1SaWdodCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1SaWdodDsgaSsrKSB7XG4gICAgICAgICAgICB5aWVsZCBfc3JjW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnRzLiQkcmVkdWNlID0gJCRyZWR1Y2U7XG5leHBvcnRzLiRpdGVyID0gJGl0ZXI7XG5leHBvcnRzLlJhbmdlID0gUmFuZ2U7XG5leHBvcnRzLlJlZHVjZWQgPSBSZWR1Y2VkO1xuZXhwb3J0cy5hZGQgPSBhZGQ7XG5leHBvcnRzLmFzSXRlcmFibGUgPSBhc0l0ZXJhYmxlO1xuZXhwb3J0cy5hc3NvY01hcCA9IGFzc29jTWFwO1xuZXhwb3J0cy5hc3NvY09iaiA9IGFzc29jT2JqO1xuZXhwb3J0cy5hdXRvT2JqID0gYXV0b09iajtcbmV4cG9ydHMuYmVuY2htYXJrID0gYmVuY2htYXJrO1xuZXhwb3J0cy5idWlsZEtlcm5lbDFkID0gYnVpbGRLZXJuZWwxZDtcbmV4cG9ydHMuYnVpbGRLZXJuZWwyZCA9IGJ1aWxkS2VybmVsMmQ7XG5leHBvcnRzLmNhdCA9IGNhdDtcbmV4cG9ydHMuY2hvaWNlcyA9IGNob2ljZXM7XG5leHBvcnRzLmNvbXAgPSBjb21wO1xuZXhwb3J0cy5jb21wUiA9IGNvbXBSO1xuZXhwb3J0cy5jb25jYXQgPSBjb25jYXQ7XG5leHBvcnRzLmNvbmogPSBjb25qO1xuZXhwb3J0cy5jb252ZXJnZSA9IGNvbnZlcmdlO1xuZXhwb3J0cy5jb252b2x2ZTFkID0gY29udm9sdmUxZDtcbmV4cG9ydHMuY29udm9sdmUyZCA9IGNvbnZvbHZlMmQ7XG5leHBvcnRzLmNvdW50ID0gY291bnQ7XG5leHBvcnRzLmN1cnZlID0gY3VydmU7XG5leHBvcnRzLmN5Y2xlID0gY3ljbGU7XG5leHBvcnRzLmRlZHVwZSA9IGRlZHVwZTtcbmV4cG9ydHMuZGVlcFRyYW5zZm9ybSA9IGRlZXBUcmFuc2Zvcm07XG5leHBvcnRzLmRlbGF5ZWQgPSBkZWxheWVkO1xuZXhwb3J0cy5kaXN0aW5jdCA9IGRpc3RpbmN0O1xuZXhwb3J0cy5kaXYgPSBkaXY7XG5leHBvcnRzLmRyb3AgPSBkcm9wO1xuZXhwb3J0cy5kcm9wTnRoID0gZHJvcE50aDtcbmV4cG9ydHMuZHJvcFdoaWxlID0gZHJvcFdoaWxlO1xuZXhwb3J0cy5kdXAgPSBkdXA7XG5leHBvcnRzLmR1cGxpY2F0ZSA9IGR1cGxpY2F0ZTtcbmV4cG9ydHMuZW5zdXJlUmVkdWNlZCA9IGVuc3VyZVJlZHVjZWQ7XG5leHBvcnRzLmV2ZXJ5ID0gZXZlcnk7XG5leHBvcnRzLmV4dGVuZFNpZGVzID0gZXh0ZW5kU2lkZXM7XG5leHBvcnRzLmZpbGwgPSBmaWxsO1xuZXhwb3J0cy5maWxsTiA9IGZpbGxOO1xuZXhwb3J0cy5maWx0ZXIgPSBmaWx0ZXI7XG5leHBvcnRzLmZpbHRlckZ1enp5ID0gZmlsdGVyRnV6enk7XG5leHBvcnRzLmZsYXR0ZW4gPSBmbGF0dGVuO1xuZXhwb3J0cy5mbGF0dGVuV2l0aCA9IGZsYXR0ZW5XaXRoO1xuZXhwb3J0cy5mcmVxdWVuY2llcyA9IGZyZXF1ZW5jaWVzO1xuZXhwb3J0cy5ncm91cEJpbmFyeSA9IGdyb3VwQmluYXJ5O1xuZXhwb3J0cy5ncm91cEJ5TWFwID0gZ3JvdXBCeU1hcDtcbmV4cG9ydHMuZ3JvdXBCeU9iaiA9IGdyb3VwQnlPYmo7XG5leHBvcnRzLmluZGV4ZWQgPSBpbmRleGVkO1xuZXhwb3J0cy5pbnRlcmxlYXZlID0gaW50ZXJsZWF2ZTtcbmV4cG9ydHMuaW50ZXJwb2xhdGUgPSBpbnRlcnBvbGF0ZTtcbmV4cG9ydHMuaW50ZXJwb2xhdGVIZXJtaXRlID0gaW50ZXJwb2xhdGVIZXJtaXRlO1xuZXhwb3J0cy5pbnRlcnBvbGF0ZUxpbmVhciA9IGludGVycG9sYXRlTGluZWFyO1xuZXhwb3J0cy5pbnRlcnBvc2UgPSBpbnRlcnBvc2U7XG5leHBvcnRzLmlzUmVkdWNlZCA9IGlzUmVkdWNlZDtcbmV4cG9ydHMuaXRlcmF0ZSA9IGl0ZXJhdGU7XG5leHBvcnRzLml0ZXJhdG9yID0gaXRlcmF0b3I7XG5leHBvcnRzLml0ZXJhdG9yMSA9IGl0ZXJhdG9yMTtcbmV4cG9ydHMuanV4dFIgPSBqdXh0UjtcbmV4cG9ydHMua2VlcCA9IGtlZXA7XG5leHBvcnRzLmtleVBlcm11dGF0aW9ucyA9IGtleVBlcm11dGF0aW9ucztcbmV4cG9ydHMua2V5U2VsZWN0b3IgPSBrZXlTZWxlY3RvcjtcbmV4cG9ydHMua2V5cyA9IGtleXM7XG5leHBvcnRzLmxhYmVsZWQgPSBsYWJlbGVkO1xuZXhwb3J0cy5sYXN0ID0gbGFzdDtcbmV4cG9ydHMubGluZSA9IGxpbmU7XG5leHBvcnRzLmxvb2t1cDFkID0gbG9va3VwMWQ7XG5leHBvcnRzLmxvb2t1cDJkID0gbG9va3VwMmQ7XG5leHBvcnRzLmxvb2t1cDNkID0gbG9va3VwM2Q7XG5leHBvcnRzLm1hcCA9IG1hcDtcbmV4cG9ydHMubWFwRGVlcCA9IG1hcERlZXA7XG5leHBvcnRzLm1hcEluZGV4ZWQgPSBtYXBJbmRleGVkO1xuZXhwb3J0cy5tYXBLZXlzID0gbWFwS2V5cztcbmV4cG9ydHMubWFwTnRoID0gbWFwTnRoO1xuZXhwb3J0cy5tYXBWYWxzID0gbWFwVmFscztcbmV4cG9ydHMubWFwY2F0ID0gbWFwY2F0O1xuZXhwb3J0cy5tYXBjYXRJbmRleGVkID0gbWFwY2F0SW5kZXhlZDtcbmV4cG9ydHMubWF0Y2hGaXJzdCA9IG1hdGNoRmlyc3Q7XG5leHBvcnRzLm1hdGNoTGFzdCA9IG1hdGNoTGFzdDtcbmV4cG9ydHMubWF4ID0gbWF4O1xuZXhwb3J0cy5tYXhDb21wYXJlID0gbWF4Q29tcGFyZTtcbmV4cG9ydHMubWF4TWFnID0gbWF4TWFnO1xuZXhwb3J0cy5tZWFuID0gbWVhbjtcbmV4cG9ydHMubWluID0gbWluO1xuZXhwb3J0cy5taW5Db21wYXJlID0gbWluQ29tcGFyZTtcbmV4cG9ydHMubWluTWFnID0gbWluTWFnO1xuZXhwb3J0cy5taW5NYXggPSBtaW5NYXg7XG5leHBvcnRzLm1vdmluZ0F2ZXJhZ2UgPSBtb3ZpbmdBdmVyYWdlO1xuZXhwb3J0cy5tb3ZpbmdNZWRpYW4gPSBtb3ZpbmdNZWRpYW47XG5leHBvcnRzLm11bCA9IG11bDtcbmV4cG9ydHMubXVsdGlwbGV4ID0gbXVsdGlwbGV4O1xuZXhwb3J0cy5tdWx0aXBsZXhPYmogPSBtdWx0aXBsZXhPYmo7XG5leHBvcnRzLm5vb3AgPSBub29wO1xuZXhwb3J0cy5ub3JtQ291bnQgPSBub3JtQ291bnQ7XG5leHBvcnRzLm5vcm1GcmVxdWVuY2llcyA9IG5vcm1GcmVxdWVuY2llcztcbmV4cG9ydHMubm9ybUZyZXF1ZW5jaWVzQXV0byA9IG5vcm1GcmVxdWVuY2llc0F1dG87XG5leHBvcnRzLm5vcm1SYW5nZSA9IG5vcm1SYW5nZTtcbmV4cG9ydHMubm9ybVJhbmdlMmQgPSBub3JtUmFuZ2UyZDtcbmV4cG9ydHMubm9ybVJhbmdlM2QgPSBub3JtUmFuZ2UzZDtcbmV4cG9ydHMucGFkTGFzdCA9IHBhZExhc3Q7XG5leHBvcnRzLnBhZFNpZGVzID0gcGFkU2lkZXM7XG5leHBvcnRzLnBhZ2UgPSBwYWdlO1xuZXhwb3J0cy5wYWlycyA9IHBhaXJzO1xuZXhwb3J0cy5wYWxpbmRyb21lID0gcGFsaW5kcm9tZTtcbmV4cG9ydHMucGFydGl0aW9uID0gcGFydGl0aW9uO1xuZXhwb3J0cy5wYXJ0aXRpb25CeSA9IHBhcnRpdGlvbkJ5O1xuZXhwb3J0cy5wYXJ0aXRpb25PZiA9IHBhcnRpdGlvbk9mO1xuZXhwb3J0cy5wYXJ0aXRpb25Tb3J0ID0gcGFydGl0aW9uU29ydDtcbmV4cG9ydHMucGFydGl0aW9uU3luYyA9IHBhcnRpdGlvblN5bmM7XG5leHBvcnRzLnBhcnRpdGlvblRpbWUgPSBwYXJ0aXRpb25UaW1lO1xuZXhwb3J0cy5wYXJ0aXRpb25XaGVuID0gcGFydGl0aW9uV2hlbjtcbmV4cG9ydHMucGVlayA9IHBlZWs7XG5leHBvcnRzLnBlcm11dGF0aW9ucyA9IHBlcm11dGF0aW9ucztcbmV4cG9ydHMucGVybXV0YXRpb25zTiA9IHBlcm11dGF0aW9uc047XG5leHBvcnRzLnBsdWNrID0gcGx1Y2s7XG5leHBvcnRzLnB1c2ggPSBwdXNoO1xuZXhwb3J0cy5wdXNoQ29weSA9IHB1c2hDb3B5O1xuZXhwb3J0cy5wdXNoU29ydCA9IHB1c2hTb3J0O1xuZXhwb3J0cy5yYW5nZSA9IHJhbmdlO1xuZXhwb3J0cy5yYW5nZTJkID0gcmFuZ2UyZDtcbmV4cG9ydHMucmFuZ2UzZCA9IHJhbmdlM2Q7XG5leHBvcnRzLnJhbmdlTmQgPSByYW5nZU5kO1xuZXhwb3J0cy5yZWR1Y2UgPSByZWR1Y2U7XG5leHBvcnRzLnJlZHVjZVJpZ2h0ID0gcmVkdWNlUmlnaHQ7XG5leHBvcnRzLnJlZHVjZWQgPSByZWR1Y2VkO1xuZXhwb3J0cy5yZWR1Y2VyID0gcmVkdWNlcjtcbmV4cG9ydHMucmVkdWN0aW9ucyA9IHJlZHVjdGlvbnM7XG5leHBvcnRzLnJlbmFtZSA9IHJlbmFtZTtcbmV4cG9ydHMucmVuYW1lciA9IHJlbmFtZXI7XG5leHBvcnRzLnJlcGVhdCA9IHJlcGVhdDtcbmV4cG9ydHMucmVwZWF0ZWRseSA9IHJlcGVhdGVkbHk7XG5leHBvcnRzLnJldmVyc2UgPSByZXZlcnNlO1xuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLnNhbXBsZSA9IHNhbXBsZTtcbmV4cG9ydHMuc2NhbiA9IHNjYW47XG5leHBvcnRzLnNlbGVjdEtleXMgPSBzZWxlY3RLZXlzO1xuZXhwb3J0cy5zaWRlRWZmZWN0ID0gc2lkZUVmZmVjdDtcbmV4cG9ydHMuc2xpZGluZ1dpbmRvdyA9IHNsaWRpbmdXaW5kb3c7XG5leHBvcnRzLnNvbWUgPSBzb21lO1xuZXhwb3J0cy5zb3J0ZWRLZXlzID0gc29ydGVkS2V5cztcbmV4cG9ydHMuc3RlcCA9IHN0ZXA7XG5leHBvcnRzLnN0ciA9IHN0cjtcbmV4cG9ydHMuc3RyZWFtU2h1ZmZsZSA9IHN0cmVhbVNodWZmbGU7XG5leHBvcnRzLnN0cmVhbVNvcnQgPSBzdHJlYW1Tb3J0O1xuZXhwb3J0cy5zdHJ1Y3QgPSBzdHJ1Y3Q7XG5leHBvcnRzLnN1YiA9IHN1YjtcbmV4cG9ydHMuc3dpenpsZSA9IHN3aXp6bGU7XG5leHBvcnRzLnN5bW1ldHJpYyA9IHN5bW1ldHJpYztcbmV4cG9ydHMudGFrZSA9IHRha2U7XG5leHBvcnRzLnRha2VMYXN0ID0gdGFrZUxhc3Q7XG5leHBvcnRzLnRha2VOdGggPSB0YWtlTnRoO1xuZXhwb3J0cy50YWtlV2hpbGUgPSB0YWtlV2hpbGU7XG5leHBvcnRzLnRocm90dGxlID0gdGhyb3R0bGU7XG5leHBvcnRzLnRocm90dGxlVGltZSA9IHRocm90dGxlVGltZTtcbmV4cG9ydHMudG9nZ2xlID0gdG9nZ2xlO1xuZXhwb3J0cy50cmFjZSA9IHRyYWNlO1xuZXhwb3J0cy50cmFuc2R1Y2UgPSB0cmFuc2R1Y2U7XG5leHBvcnRzLnRyYW5zZHVjZVJpZ2h0ID0gdHJhbnNkdWNlUmlnaHQ7XG5leHBvcnRzLnR3ZWVuID0gdHdlZW47XG5leHBvcnRzLnVucmVkdWNlZCA9IHVucmVkdWNlZDtcbmV4cG9ydHMudmFscyA9IHZhbHM7XG5leHBvcnRzLndvcmRXcmFwID0gd29yZFdyYXA7XG5leHBvcnRzLndyYXBTaWRlcyA9IHdyYXBTaWRlcztcbmV4cG9ydHMuemlwID0gemlwO1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBkZXNlbGVjdEN1cnJlbnQgPSByZXF1aXJlKFwidG9nZ2xlLXNlbGVjdGlvblwiKTtcblxudmFyIGNsaXBib2FyZFRvSUUxMUZvcm1hdHRpbmcgPSB7XG4gIFwidGV4dC9wbGFpblwiOiBcIlRleHRcIixcbiAgXCJ0ZXh0L2h0bWxcIjogXCJVcmxcIixcbiAgXCJkZWZhdWx0XCI6IFwiVGV4dFwiXG59XG5cbnZhciBkZWZhdWx0TWVzc2FnZSA9IFwiQ29weSB0byBjbGlwYm9hcmQ6ICN7a2V5fSwgRW50ZXJcIjtcblxuZnVuY3Rpb24gZm9ybWF0KG1lc3NhZ2UpIHtcbiAgdmFyIGNvcHlLZXkgPSAoL21hYyBvcyB4L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSA/IFwi4oyYXCIgOiBcIkN0cmxcIikgKyBcIitDXCI7XG4gIHJldHVybiBtZXNzYWdlLnJlcGxhY2UoLyN7XFxzKmtleVxccyp9L2csIGNvcHlLZXkpO1xufVxuXG5mdW5jdGlvbiBjb3B5KHRleHQsIG9wdGlvbnMpIHtcbiAgdmFyIGRlYnVnLFxuICAgIG1lc3NhZ2UsXG4gICAgcmVzZWxlY3RQcmV2aW91cyxcbiAgICByYW5nZSxcbiAgICBzZWxlY3Rpb24sXG4gICAgbWFyayxcbiAgICBzdWNjZXNzID0gZmFsc2U7XG4gIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICBkZWJ1ZyA9IG9wdGlvbnMuZGVidWcgfHwgZmFsc2U7XG4gIHRyeSB7XG4gICAgcmVzZWxlY3RQcmV2aW91cyA9IGRlc2VsZWN0Q3VycmVudCgpO1xuXG4gICAgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgIHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuXG4gICAgbWFyayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIG1hcmsudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgIC8vIHJlc2V0IHVzZXIgc3R5bGVzIGZvciBzcGFuIGVsZW1lbnRcbiAgICBtYXJrLnN0eWxlLmFsbCA9IFwidW5zZXRcIjtcbiAgICAvLyBwcmV2ZW50cyBzY3JvbGxpbmcgdG8gdGhlIGVuZCBvZiB0aGUgcGFnZVxuICAgIG1hcmsuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XG4gICAgbWFyay5zdHlsZS50b3AgPSAwO1xuICAgIG1hcmsuc3R5bGUuY2xpcCA9IFwicmVjdCgwLCAwLCAwLCAwKVwiO1xuICAgIC8vIHVzZWQgdG8gcHJlc2VydmUgc3BhY2VzIGFuZCBsaW5lIGJyZWFrc1xuICAgIG1hcmsuc3R5bGUud2hpdGVTcGFjZSA9IFwicHJlXCI7XG4gICAgLy8gZG8gbm90IGluaGVyaXQgdXNlci1zZWxlY3QgKGl0IG1heSBiZSBgbm9uZWApXG4gICAgbWFyay5zdHlsZS53ZWJraXRVc2VyU2VsZWN0ID0gXCJ0ZXh0XCI7XG4gICAgbWFyay5zdHlsZS5Nb3pVc2VyU2VsZWN0ID0gXCJ0ZXh0XCI7XG4gICAgbWFyay5zdHlsZS5tc1VzZXJTZWxlY3QgPSBcInRleHRcIjtcbiAgICBtYXJrLnN0eWxlLnVzZXJTZWxlY3QgPSBcInRleHRcIjtcbiAgICBtYXJrLmFkZEV2ZW50TGlzdGVuZXIoXCJjb3B5XCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBpZiAob3B0aW9ucy5mb3JtYXQpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAodHlwZW9mIGUuY2xpcGJvYXJkRGF0YSA9PT0gXCJ1bmRlZmluZWRcIikgeyAvLyBJRSAxMVxuICAgICAgICAgIGRlYnVnICYmIGNvbnNvbGUud2FybihcInVuYWJsZSB0byB1c2UgZS5jbGlwYm9hcmREYXRhXCIpO1xuICAgICAgICAgIGRlYnVnICYmIGNvbnNvbGUud2FybihcInRyeWluZyBJRSBzcGVjaWZpYyBzdHVmZlwiKTtcbiAgICAgICAgICB3aW5kb3cuY2xpcGJvYXJkRGF0YS5jbGVhckRhdGEoKTtcbiAgICAgICAgICB2YXIgZm9ybWF0ID0gY2xpcGJvYXJkVG9JRTExRm9ybWF0dGluZ1tvcHRpb25zLmZvcm1hdF0gfHwgY2xpcGJvYXJkVG9JRTExRm9ybWF0dGluZ1tcImRlZmF1bHRcIl1cbiAgICAgICAgICB3aW5kb3cuY2xpcGJvYXJkRGF0YS5zZXREYXRhKGZvcm1hdCwgdGV4dCk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGFsbCBvdGhlciBicm93c2Vyc1xuICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5jbGVhckRhdGEoKTtcbiAgICAgICAgICBlLmNsaXBib2FyZERhdGEuc2V0RGF0YShvcHRpb25zLmZvcm1hdCwgdGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLm9uQ29weSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIG9wdGlvbnMub25Db3B5KGUuY2xpcGJvYXJkRGF0YSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG1hcmspO1xuXG4gICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKG1hcmspO1xuICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG5cbiAgICB2YXIgc3VjY2Vzc2Z1bCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiY29weVwiKTtcbiAgICBpZiAoIXN1Y2Nlc3NmdWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImNvcHkgY29tbWFuZCB3YXMgdW5zdWNjZXNzZnVsXCIpO1xuICAgIH1cbiAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZGVidWcgJiYgY29uc29sZS5lcnJvcihcInVuYWJsZSB0byBjb3B5IHVzaW5nIGV4ZWNDb21tYW5kOiBcIiwgZXJyKTtcbiAgICBkZWJ1ZyAmJiBjb25zb2xlLndhcm4oXCJ0cnlpbmcgSUUgc3BlY2lmaWMgc3R1ZmZcIik7XG4gICAgdHJ5IHtcbiAgICAgIHdpbmRvdy5jbGlwYm9hcmREYXRhLnNldERhdGEob3B0aW9ucy5mb3JtYXQgfHwgXCJ0ZXh0XCIsIHRleHQpO1xuICAgICAgb3B0aW9ucy5vbkNvcHkgJiYgb3B0aW9ucy5vbkNvcHkod2luZG93LmNsaXBib2FyZERhdGEpO1xuICAgICAgc3VjY2VzcyA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBkZWJ1ZyAmJiBjb25zb2xlLmVycm9yKFwidW5hYmxlIHRvIGNvcHkgdXNpbmcgY2xpcGJvYXJkRGF0YTogXCIsIGVycik7XG4gICAgICBkZWJ1ZyAmJiBjb25zb2xlLmVycm9yKFwiZmFsbGluZyBiYWNrIHRvIHByb21wdFwiKTtcbiAgICAgIG1lc3NhZ2UgPSBmb3JtYXQoXCJtZXNzYWdlXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMubWVzc2FnZSA6IGRlZmF1bHRNZXNzYWdlKTtcbiAgICAgIHdpbmRvdy5wcm9tcHQobWVzc2FnZSwgdGV4dCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChzZWxlY3Rpb24pIHtcbiAgICAgIGlmICh0eXBlb2Ygc2VsZWN0aW9uLnJlbW92ZVJhbmdlID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlUmFuZ2UocmFuZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXJrKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG1hcmspO1xuICAgIH1cbiAgICByZXNlbGVjdFByZXZpb3VzKCk7XG4gIH1cblxuICByZXR1cm4gc3VjY2Vzcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb3B5O1xuIiwiLyohIGllZWU3NTQuIEJTRC0zLUNsYXVzZSBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi9cbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIi8qKlxuICogbWFya2VkIC0gYSBtYXJrZG93biBwYXJzZXJcbiAqIENvcHlyaWdodCAoYykgMjAxMS0yMDIxLCBDaHJpc3RvcGhlciBKZWZmcmV5LiAoTUlUIExpY2Vuc2VkKVxuICogaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZFxuICovXG5cbi8qKlxuICogRE8gTk9UIEVESVQgVEhJUyBGSUxFXG4gKiBUaGUgY29kZSBpbiB0aGlzIGZpbGUgaXMgZ2VuZXJhdGVkIGZyb20gZmlsZXMgaW4gLi9zcmMvXG4gKi9cblxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZ2xvYmFsID0gdHlwZW9mIGdsb2JhbFRoaXMgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsVGhpcyA6IGdsb2JhbCB8fCBzZWxmLCBmYWN0b3J5KGdsb2JhbC5tYXJrZWQgPSB7fSkpO1xufSkodGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICBmdW5jdGlvbiBfZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtcbiAgICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtcbiAgICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2NyZWF0ZUNsYXNzKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuICAgIGlmIChzdGF0aWNQcm9wcykgX2RlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtcbiAgICByZXR1cm4gQ29uc3RydWN0b3I7XG4gIH1cblxuICBmdW5jdGlvbiBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobywgbWluTGVuKSB7XG4gICAgaWYgKCFvKSByZXR1cm47XG4gICAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcbiAgICB2YXIgbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSk7XG4gICAgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTtcbiAgICBpZiAobiA9PT0gXCJNYXBcIiB8fCBuID09PSBcIlNldFwiKSByZXR1cm4gQXJyYXkuZnJvbShvKTtcbiAgICBpZiAobiA9PT0gXCJBcmd1bWVudHNcIiB8fCAvXig/OlVpfEkpbnQoPzo4fDE2fDMyKSg/OkNsYW1wZWQpP0FycmF5JC8udGVzdChuKSkgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG4gIH1cblxuICBmdW5jdGlvbiBfYXJyYXlMaWtlVG9BcnJheShhcnIsIGxlbikge1xuICAgIGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkobGVuKTsgaSA8IGxlbjsgaSsrKSBhcnIyW2ldID0gYXJyW2ldO1xuXG4gICAgcmV0dXJuIGFycjI7XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlckxvb3NlKG8sIGFsbG93QXJyYXlMaWtlKSB7XG4gICAgdmFyIGl0ID0gdHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBvW1N5bWJvbC5pdGVyYXRvcl0gfHwgb1tcIkBAaXRlcmF0b3JcIl07XG4gICAgaWYgKGl0KSByZXR1cm4gKGl0ID0gaXQuY2FsbChvKSkubmV4dC5iaW5kKGl0KTtcblxuICAgIGlmIChBcnJheS5pc0FycmF5KG8pIHx8IChpdCA9IF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvKSkgfHwgYWxsb3dBcnJheUxpa2UgJiYgbyAmJiB0eXBlb2Ygby5sZW5ndGggPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGlmIChpdCkgbyA9IGl0O1xuICAgICAgdmFyIGkgPSAwO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGkgPj0gby5sZW5ndGgpIHJldHVybiB7XG4gICAgICAgICAgZG9uZTogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRvbmU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiBvW2krK11cbiAgICAgICAgfTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBpdGVyYXRlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RGVmYXVsdHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2VVcmw6IG51bGwsXG4gICAgICBicmVha3M6IGZhbHNlLFxuICAgICAgZXh0ZW5zaW9uczogbnVsbCxcbiAgICAgIGdmbTogdHJ1ZSxcbiAgICAgIGhlYWRlcklkczogdHJ1ZSxcbiAgICAgIGhlYWRlclByZWZpeDogJycsXG4gICAgICBoaWdobGlnaHQ6IG51bGwsXG4gICAgICBsYW5nUHJlZml4OiAnbGFuZ3VhZ2UtJyxcbiAgICAgIG1hbmdsZTogdHJ1ZSxcbiAgICAgIHBlZGFudGljOiBmYWxzZSxcbiAgICAgIHJlbmRlcmVyOiBudWxsLFxuICAgICAgc2FuaXRpemU6IGZhbHNlLFxuICAgICAgc2FuaXRpemVyOiBudWxsLFxuICAgICAgc2lsZW50OiBmYWxzZSxcbiAgICAgIHNtYXJ0TGlzdHM6IGZhbHNlLFxuICAgICAgc21hcnR5cGFudHM6IGZhbHNlLFxuICAgICAgdG9rZW5pemVyOiBudWxsLFxuICAgICAgd2Fsa1Rva2VuczogbnVsbCxcbiAgICAgIHhodG1sOiBmYWxzZVxuICAgIH07XG4gIH1cbiAgZXhwb3J0cy5kZWZhdWx0cyA9IGdldERlZmF1bHRzKCk7XG4gIGZ1bmN0aW9uIGNoYW5nZURlZmF1bHRzKG5ld0RlZmF1bHRzKSB7XG4gICAgZXhwb3J0cy5kZWZhdWx0cyA9IG5ld0RlZmF1bHRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlcnNcbiAgICovXG4gIHZhciBlc2NhcGVUZXN0ID0gL1smPD5cIiddLztcbiAgdmFyIGVzY2FwZVJlcGxhY2UgPSAvWyY8PlwiJ10vZztcbiAgdmFyIGVzY2FwZVRlc3ROb0VuY29kZSA9IC9bPD5cIiddfCYoPyEjP1xcdys7KS87XG4gIHZhciBlc2NhcGVSZXBsYWNlTm9FbmNvZGUgPSAvWzw+XCInXXwmKD8hIz9cXHcrOykvZztcbiAgdmFyIGVzY2FwZVJlcGxhY2VtZW50cyA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmIzM5OydcbiAgfTtcblxuICB2YXIgZ2V0RXNjYXBlUmVwbGFjZW1lbnQgPSBmdW5jdGlvbiBnZXRFc2NhcGVSZXBsYWNlbWVudChjaCkge1xuICAgIHJldHVybiBlc2NhcGVSZXBsYWNlbWVudHNbY2hdO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGVzY2FwZShodG1sLCBlbmNvZGUpIHtcbiAgICBpZiAoZW5jb2RlKSB7XG4gICAgICBpZiAoZXNjYXBlVGVzdC50ZXN0KGh0bWwpKSB7XG4gICAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoZXNjYXBlUmVwbGFjZSwgZ2V0RXNjYXBlUmVwbGFjZW1lbnQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZXNjYXBlVGVzdE5vRW5jb2RlLnRlc3QoaHRtbCkpIHtcbiAgICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZShlc2NhcGVSZXBsYWNlTm9FbmNvZGUsIGdldEVzY2FwZVJlcGxhY2VtZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaHRtbDtcbiAgfVxuICB2YXIgdW5lc2NhcGVUZXN0ID0gLyYoIyg/OlxcZCspfCg/OiN4WzAtOUEtRmEtZl0rKXwoPzpcXHcrKSk7Py9pZztcbiAgZnVuY3Rpb24gdW5lc2NhcGUoaHRtbCkge1xuICAgIC8vIGV4cGxpY2l0bHkgbWF0Y2ggZGVjaW1hbCwgaGV4LCBhbmQgbmFtZWQgSFRNTCBlbnRpdGllc1xuICAgIHJldHVybiBodG1sLnJlcGxhY2UodW5lc2NhcGVUZXN0LCBmdW5jdGlvbiAoXywgbikge1xuICAgICAgbiA9IG4udG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChuID09PSAnY29sb24nKSByZXR1cm4gJzonO1xuXG4gICAgICBpZiAobi5jaGFyQXQoMCkgPT09ICcjJykge1xuICAgICAgICByZXR1cm4gbi5jaGFyQXQoMSkgPT09ICd4JyA/IFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQobi5zdWJzdHJpbmcoMiksIDE2KSkgOiBTdHJpbmcuZnJvbUNoYXJDb2RlKCtuLnN1YnN0cmluZygxKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnJztcbiAgICB9KTtcbiAgfVxuICB2YXIgY2FyZXQgPSAvKF58W15cXFtdKVxcXi9nO1xuICBmdW5jdGlvbiBlZGl0KHJlZ2V4LCBvcHQpIHtcbiAgICByZWdleCA9IHJlZ2V4LnNvdXJjZSB8fCByZWdleDtcbiAgICBvcHQgPSBvcHQgfHwgJyc7XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIHJlcGxhY2UobmFtZSwgdmFsKSB7XG4gICAgICAgIHZhbCA9IHZhbC5zb3VyY2UgfHwgdmFsO1xuICAgICAgICB2YWwgPSB2YWwucmVwbGFjZShjYXJldCwgJyQxJyk7XG4gICAgICAgIHJlZ2V4ID0gcmVnZXgucmVwbGFjZShuYW1lLCB2YWwpO1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgfSxcbiAgICAgIGdldFJlZ2V4OiBmdW5jdGlvbiBnZXRSZWdleCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAocmVnZXgsIG9wdCk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gb2JqO1xuICB9XG4gIHZhciBub25Xb3JkQW5kQ29sb25UZXN0ID0gL1teXFx3Ol0vZztcbiAgdmFyIG9yaWdpbkluZGVwZW5kZW50VXJsID0gL14kfF5bYS16XVthLXowLTkrLi1dKjp8Xls/I10vaTtcbiAgZnVuY3Rpb24gY2xlYW5Vcmwoc2FuaXRpemUsIGJhc2UsIGhyZWYpIHtcbiAgICBpZiAoc2FuaXRpemUpIHtcbiAgICAgIHZhciBwcm90O1xuXG4gICAgICB0cnkge1xuICAgICAgICBwcm90ID0gZGVjb2RlVVJJQ29tcG9uZW50KHVuZXNjYXBlKGhyZWYpKS5yZXBsYWNlKG5vbldvcmRBbmRDb2xvblRlc3QsICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb3QuaW5kZXhPZignamF2YXNjcmlwdDonKSA9PT0gMCB8fCBwcm90LmluZGV4T2YoJ3Zic2NyaXB0OicpID09PSAwIHx8IHByb3QuaW5kZXhPZignZGF0YTonKSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoYmFzZSAmJiAhb3JpZ2luSW5kZXBlbmRlbnRVcmwudGVzdChocmVmKSkge1xuICAgICAgaHJlZiA9IHJlc29sdmVVcmwoYmFzZSwgaHJlZik7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGhyZWYgPSBlbmNvZGVVUkkoaHJlZikucmVwbGFjZSgvJTI1L2csICclJyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhyZWY7XG4gIH1cbiAgdmFyIGJhc2VVcmxzID0ge307XG4gIHZhciBqdXN0RG9tYWluID0gL15bXjpdKzpcXC8qW14vXSokLztcbiAgdmFyIHByb3RvY29sID0gL14oW146XSs6KVtcXHNcXFNdKiQvO1xuICB2YXIgZG9tYWluID0gL14oW146XSs6XFwvKlteL10qKVtcXHNcXFNdKiQvO1xuICBmdW5jdGlvbiByZXNvbHZlVXJsKGJhc2UsIGhyZWYpIHtcbiAgICBpZiAoIWJhc2VVcmxzWycgJyArIGJhc2VdKSB7XG4gICAgICAvLyB3ZSBjYW4gaWdub3JlIGV2ZXJ5dGhpbmcgaW4gYmFzZSBhZnRlciB0aGUgbGFzdCBzbGFzaCBvZiBpdHMgcGF0aCBjb21wb25lbnQsXG4gICAgICAvLyBidXQgd2UgbWlnaHQgbmVlZCB0byBhZGQgX3RoYXRfXG4gICAgICAvLyBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzk4NiNzZWN0aW9uLTNcbiAgICAgIGlmIChqdXN0RG9tYWluLnRlc3QoYmFzZSkpIHtcbiAgICAgICAgYmFzZVVybHNbJyAnICsgYmFzZV0gPSBiYXNlICsgJy8nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFzZVVybHNbJyAnICsgYmFzZV0gPSBydHJpbShiYXNlLCAnLycsIHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGJhc2UgPSBiYXNlVXJsc1snICcgKyBiYXNlXTtcbiAgICB2YXIgcmVsYXRpdmVCYXNlID0gYmFzZS5pbmRleE9mKCc6JykgPT09IC0xO1xuXG4gICAgaWYgKGhyZWYuc3Vic3RyaW5nKDAsIDIpID09PSAnLy8nKSB7XG4gICAgICBpZiAocmVsYXRpdmVCYXNlKSB7XG4gICAgICAgIHJldHVybiBocmVmO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmFzZS5yZXBsYWNlKHByb3RvY29sLCAnJDEnKSArIGhyZWY7XG4gICAgfSBlbHNlIGlmIChocmVmLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICBpZiAocmVsYXRpdmVCYXNlKSB7XG4gICAgICAgIHJldHVybiBocmVmO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYmFzZS5yZXBsYWNlKGRvbWFpbiwgJyQxJykgKyBocmVmO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYmFzZSArIGhyZWY7XG4gICAgfVxuICB9XG4gIHZhciBub29wVGVzdCA9IHtcbiAgICBleGVjOiBmdW5jdGlvbiBub29wVGVzdCgpIHt9XG4gIH07XG4gIGZ1bmN0aW9uIG1lcmdlKG9iaikge1xuICAgIHZhciBpID0gMSxcbiAgICAgICAgdGFyZ2V0LFxuICAgICAgICBrZXk7XG5cbiAgICBmb3IgKDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzW2ldO1xuXG4gICAgICBmb3IgKGtleSBpbiB0YXJnZXQpIHtcbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIGtleSkpIHtcbiAgICAgICAgICBvYmpba2V5XSA9IHRhcmdldFtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuICBmdW5jdGlvbiBzcGxpdENlbGxzKHRhYmxlUm93LCBjb3VudCkge1xuICAgIC8vIGVuc3VyZSB0aGF0IGV2ZXJ5IGNlbGwtZGVsaW1pdGluZyBwaXBlIGhhcyBhIHNwYWNlXG4gICAgLy8gYmVmb3JlIGl0IHRvIGRpc3Rpbmd1aXNoIGl0IGZyb20gYW4gZXNjYXBlZCBwaXBlXG4gICAgdmFyIHJvdyA9IHRhYmxlUm93LnJlcGxhY2UoL1xcfC9nLCBmdW5jdGlvbiAobWF0Y2gsIG9mZnNldCwgc3RyKSB7XG4gICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxuICAgICAgICAgIGN1cnIgPSBvZmZzZXQ7XG5cbiAgICAgIHdoaWxlICgtLWN1cnIgPj0gMCAmJiBzdHJbY3Vycl0gPT09ICdcXFxcJykge1xuICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICAgIC8vIG9kZCBudW1iZXIgb2Ygc2xhc2hlcyBtZWFucyB8IGlzIGVzY2FwZWRcbiAgICAgICAgLy8gc28gd2UgbGVhdmUgaXQgYWxvbmVcbiAgICAgICAgcmV0dXJuICd8JztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCBzcGFjZSBiZWZvcmUgdW5lc2NhcGVkIHxcbiAgICAgICAgcmV0dXJuICcgfCc7XG4gICAgICB9XG4gICAgfSksXG4gICAgICAgIGNlbGxzID0gcm93LnNwbGl0KC8gXFx8Lyk7XG4gICAgdmFyIGkgPSAwOyAvLyBGaXJzdC9sYXN0IGNlbGwgaW4gYSByb3cgY2Fubm90IGJlIGVtcHR5IGlmIGl0IGhhcyBubyBsZWFkaW5nL3RyYWlsaW5nIHBpcGVcblxuICAgIGlmICghY2VsbHNbMF0udHJpbSgpKSB7XG4gICAgICBjZWxscy5zaGlmdCgpO1xuICAgIH1cblxuICAgIGlmICghY2VsbHNbY2VsbHMubGVuZ3RoIC0gMV0udHJpbSgpKSB7XG4gICAgICBjZWxscy5wb3AoKTtcbiAgICB9XG5cbiAgICBpZiAoY2VsbHMubGVuZ3RoID4gY291bnQpIHtcbiAgICAgIGNlbGxzLnNwbGljZShjb3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChjZWxscy5sZW5ndGggPCBjb3VudCkge1xuICAgICAgICBjZWxscy5wdXNoKCcnKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKDsgaSA8IGNlbGxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBsZWFkaW5nIG9yIHRyYWlsaW5nIHdoaXRlc3BhY2UgaXMgaWdub3JlZCBwZXIgdGhlIGdmbSBzcGVjXG4gICAgICBjZWxsc1tpXSA9IGNlbGxzW2ldLnRyaW0oKS5yZXBsYWNlKC9cXFxcXFx8L2csICd8Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNlbGxzO1xuICB9IC8vIFJlbW92ZSB0cmFpbGluZyAnYydzLiBFcXVpdmFsZW50IHRvIHN0ci5yZXBsYWNlKC9jKiQvLCAnJykuXG4gIC8vIC9jKiQvIGlzIHZ1bG5lcmFibGUgdG8gUkVET1MuXG4gIC8vIGludmVydDogUmVtb3ZlIHN1ZmZpeCBvZiBub24tYyBjaGFycyBpbnN0ZWFkLiBEZWZhdWx0IGZhbHNleS5cblxuICBmdW5jdGlvbiBydHJpbShzdHIsIGMsIGludmVydCkge1xuICAgIHZhciBsID0gc3RyLmxlbmd0aDtcblxuICAgIGlmIChsID09PSAwKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfSAvLyBMZW5ndGggb2Ygc3VmZml4IG1hdGNoaW5nIHRoZSBpbnZlcnQgY29uZGl0aW9uLlxuXG5cbiAgICB2YXIgc3VmZkxlbiA9IDA7IC8vIFN0ZXAgbGVmdCB1bnRpbCB3ZSBmYWlsIHRvIG1hdGNoIHRoZSBpbnZlcnQgY29uZGl0aW9uLlxuXG4gICAgd2hpbGUgKHN1ZmZMZW4gPCBsKSB7XG4gICAgICB2YXIgY3VyckNoYXIgPSBzdHIuY2hhckF0KGwgLSBzdWZmTGVuIC0gMSk7XG5cbiAgICAgIGlmIChjdXJyQ2hhciA9PT0gYyAmJiAhaW52ZXJ0KSB7XG4gICAgICAgIHN1ZmZMZW4rKztcbiAgICAgIH0gZWxzZSBpZiAoY3VyckNoYXIgIT09IGMgJiYgaW52ZXJ0KSB7XG4gICAgICAgIHN1ZmZMZW4rKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHIuc3Vic3RyKDAsIGwgLSBzdWZmTGVuKTtcbiAgfVxuICBmdW5jdGlvbiBmaW5kQ2xvc2luZ0JyYWNrZXQoc3RyLCBiKSB7XG4gICAgaWYgKHN0ci5pbmRleE9mKGJbMV0pID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIHZhciBsID0gc3RyLmxlbmd0aDtcbiAgICB2YXIgbGV2ZWwgPSAwLFxuICAgICAgICBpID0gMDtcblxuICAgIGZvciAoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAoc3RyW2ldID09PSAnXFxcXCcpIHtcbiAgICAgICAgaSsrO1xuICAgICAgfSBlbHNlIGlmIChzdHJbaV0gPT09IGJbMF0pIHtcbiAgICAgICAgbGV2ZWwrKztcbiAgICAgIH0gZWxzZSBpZiAoc3RyW2ldID09PSBiWzFdKSB7XG4gICAgICAgIGxldmVsLS07XG5cbiAgICAgICAgaWYgKGxldmVsIDwgMCkge1xuICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGZ1bmN0aW9uIGNoZWNrU2FuaXRpemVEZXByZWNhdGlvbihvcHQpIHtcbiAgICBpZiAob3B0ICYmIG9wdC5zYW5pdGl6ZSAmJiAhb3B0LnNpbGVudCkge1xuICAgICAgY29uc29sZS53YXJuKCdtYXJrZWQoKTogc2FuaXRpemUgYW5kIHNhbml0aXplciBwYXJhbWV0ZXJzIGFyZSBkZXByZWNhdGVkIHNpbmNlIHZlcnNpb24gMC43LjAsIHNob3VsZCBub3QgYmUgdXNlZCBhbmQgd2lsbCBiZSByZW1vdmVkIGluIHRoZSBmdXR1cmUuIFJlYWQgbW9yZSBoZXJlOiBodHRwczovL21hcmtlZC5qcy5vcmcvIy9VU0lOR19BRFZBTkNFRC5tZCNvcHRpb25zJyk7XG4gICAgfVxuICB9IC8vIGNvcGllZCBmcm9tIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS81NDUwMTEzLzgwNjc3N1xuXG4gIGZ1bmN0aW9uIHJlcGVhdFN0cmluZyhwYXR0ZXJuLCBjb3VudCkge1xuICAgIGlmIChjb3VudCA8IDEpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgICB3aGlsZSAoY291bnQgPiAxKSB7XG4gICAgICBpZiAoY291bnQgJiAxKSB7XG4gICAgICAgIHJlc3VsdCArPSBwYXR0ZXJuO1xuICAgICAgfVxuXG4gICAgICBjb3VudCA+Pj0gMTtcbiAgICAgIHBhdHRlcm4gKz0gcGF0dGVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0ICsgcGF0dGVybjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG91dHB1dExpbmsoY2FwLCBsaW5rLCByYXcsIGxleGVyKSB7XG4gICAgdmFyIGhyZWYgPSBsaW5rLmhyZWY7XG4gICAgdmFyIHRpdGxlID0gbGluay50aXRsZSA/IGVzY2FwZShsaW5rLnRpdGxlKSA6IG51bGw7XG4gICAgdmFyIHRleHQgPSBjYXBbMV0ucmVwbGFjZSgvXFxcXChbXFxbXFxdXSkvZywgJyQxJyk7XG5cbiAgICBpZiAoY2FwWzBdLmNoYXJBdCgwKSAhPT0gJyEnKSB7XG4gICAgICBsZXhlci5zdGF0ZS5pbkxpbmsgPSB0cnVlO1xuICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICB0eXBlOiAnbGluaycsXG4gICAgICAgIHJhdzogcmF3LFxuICAgICAgICBocmVmOiBocmVmLFxuICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgIHRva2VuczogbGV4ZXIuaW5saW5lVG9rZW5zKHRleHQsIFtdKVxuICAgICAgfTtcbiAgICAgIGxleGVyLnN0YXRlLmluTGluayA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiAnaW1hZ2UnLFxuICAgICAgICByYXc6IHJhdyxcbiAgICAgICAgaHJlZjogaHJlZixcbiAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICB0ZXh0OiBlc2NhcGUodGV4dClcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5kZW50Q29kZUNvbXBlbnNhdGlvbihyYXcsIHRleHQpIHtcbiAgICB2YXIgbWF0Y2hJbmRlbnRUb0NvZGUgPSByYXcubWF0Y2goL14oXFxzKykoPzpgYGApLyk7XG5cbiAgICBpZiAobWF0Y2hJbmRlbnRUb0NvZGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH1cblxuICAgIHZhciBpbmRlbnRUb0NvZGUgPSBtYXRjaEluZGVudFRvQ29kZVsxXTtcbiAgICByZXR1cm4gdGV4dC5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICB2YXIgbWF0Y2hJbmRlbnRJbk5vZGUgPSBub2RlLm1hdGNoKC9eXFxzKy8pO1xuXG4gICAgICBpZiAobWF0Y2hJbmRlbnRJbk5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9XG5cbiAgICAgIHZhciBpbmRlbnRJbk5vZGUgPSBtYXRjaEluZGVudEluTm9kZVswXTtcblxuICAgICAgaWYgKGluZGVudEluTm9kZS5sZW5ndGggPj0gaW5kZW50VG9Db2RlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbm9kZS5zbGljZShpbmRlbnRUb0NvZGUubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfSkuam9pbignXFxuJyk7XG4gIH1cbiAgLyoqXG4gICAqIFRva2VuaXplclxuICAgKi9cblxuXG4gIHZhciBUb2tlbml6ZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRva2VuaXplcihvcHRpb25zKSB7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IGV4cG9ydHMuZGVmYXVsdHM7XG4gICAgfVxuXG4gICAgdmFyIF9wcm90byA9IFRva2VuaXplci5wcm90b3R5cGU7XG5cbiAgICBfcHJvdG8uc3BhY2UgPSBmdW5jdGlvbiBzcGFjZShzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLm5ld2xpbmUuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIGlmIChjYXBbMF0ubGVuZ3RoID4gMSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiAnc3BhY2UnLFxuICAgICAgICAgICAgcmF3OiBjYXBbMF1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByYXc6ICdcXG4nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5jb2RlID0gZnVuY3Rpb24gY29kZShzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmNvZGUuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gY2FwWzBdLnJlcGxhY2UoL14gezEsNH0vZ20sICcnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnY29kZScsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgY29kZUJsb2NrU3R5bGU6ICdpbmRlbnRlZCcsXG4gICAgICAgICAgdGV4dDogIXRoaXMub3B0aW9ucy5wZWRhbnRpYyA/IHJ0cmltKHRleHQsICdcXG4nKSA6IHRleHRcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmZlbmNlcyA9IGZ1bmN0aW9uIGZlbmNlcyhzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmZlbmNlcy5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHJhdyA9IGNhcFswXTtcbiAgICAgICAgdmFyIHRleHQgPSBpbmRlbnRDb2RlQ29tcGVuc2F0aW9uKHJhdywgY2FwWzNdIHx8ICcnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnY29kZScsXG4gICAgICAgICAgcmF3OiByYXcsXG4gICAgICAgICAgbGFuZzogY2FwWzJdID8gY2FwWzJdLnRyaW0oKSA6IGNhcFsyXSxcbiAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5oZWFkaW5nID0gZnVuY3Rpb24gaGVhZGluZyhzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmhlYWRpbmcuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gY2FwWzJdLnRyaW0oKTsgLy8gcmVtb3ZlIHRyYWlsaW5nICNzXG5cbiAgICAgICAgaWYgKC8jJC8udGVzdCh0ZXh0KSkge1xuICAgICAgICAgIHZhciB0cmltbWVkID0gcnRyaW0odGV4dCwgJyMnKTtcblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgICAgIHRleHQgPSB0cmltbWVkLnRyaW0oKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCF0cmltbWVkIHx8IC8gJC8udGVzdCh0cmltbWVkKSkge1xuICAgICAgICAgICAgLy8gQ29tbW9uTWFyayByZXF1aXJlcyBzcGFjZSBiZWZvcmUgdHJhaWxpbmcgI3NcbiAgICAgICAgICAgIHRleHQgPSB0cmltbWVkLnRyaW0oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9rZW4gPSB7XG4gICAgICAgICAgdHlwZTogJ2hlYWRpbmcnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIGRlcHRoOiBjYXBbMV0ubGVuZ3RoLFxuICAgICAgICAgIHRleHQ6IHRleHQsXG4gICAgICAgICAgdG9rZW5zOiBbXVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxleGVyLmlubGluZSh0b2tlbi50ZXh0LCB0b2tlbi50b2tlbnMpO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5ociA9IGZ1bmN0aW9uIGhyKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2suaHIuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2hyJyxcbiAgICAgICAgICByYXc6IGNhcFswXVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uYmxvY2txdW90ZSA9IGZ1bmN0aW9uIGJsb2NrcXVvdGUoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5ibG9ja3F1b3RlLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdGV4dCA9IGNhcFswXS5yZXBsYWNlKC9eICo+ID8vZ20sICcnKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnYmxvY2txdW90ZScsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdG9rZW5zOiB0aGlzLmxleGVyLmJsb2NrVG9rZW5zKHRleHQsIFtdKSxcbiAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5saXN0ID0gZnVuY3Rpb24gbGlzdChzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmxpc3QuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciByYXcsIGlzdGFzaywgaXNjaGVja2VkLCBpbmRlbnQsIGksIGJsYW5rTGluZSwgZW5kc1dpdGhCbGFua0xpbmUsIGxpbmUsIG5leHRMaW5lLCByYXdMaW5lLCBpdGVtQ29udGVudHMsIGVuZEVhcmx5O1xuICAgICAgICB2YXIgYnVsbCA9IGNhcFsxXS50cmltKCk7XG4gICAgICAgIHZhciBpc29yZGVyZWQgPSBidWxsLmxlbmd0aCA+IDE7XG4gICAgICAgIHZhciBsaXN0ID0ge1xuICAgICAgICAgIHR5cGU6ICdsaXN0JyxcbiAgICAgICAgICByYXc6ICcnLFxuICAgICAgICAgIG9yZGVyZWQ6IGlzb3JkZXJlZCxcbiAgICAgICAgICBzdGFydDogaXNvcmRlcmVkID8gK2J1bGwuc2xpY2UoMCwgLTEpIDogJycsXG4gICAgICAgICAgbG9vc2U6IGZhbHNlLFxuICAgICAgICAgIGl0ZW1zOiBbXVxuICAgICAgICB9O1xuICAgICAgICBidWxsID0gaXNvcmRlcmVkID8gXCJcXFxcZHsxLDl9XFxcXFwiICsgYnVsbC5zbGljZSgtMSkgOiBcIlxcXFxcIiArIGJ1bGw7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgICAgICAgIGJ1bGwgPSBpc29yZGVyZWQgPyBidWxsIDogJ1sqKy1dJztcbiAgICAgICAgfSAvLyBHZXQgbmV4dCBsaXN0IGl0ZW1cblxuXG4gICAgICAgIHZhciBpdGVtUmVnZXggPSBuZXcgUmVnRXhwKFwiXiggezAsM31cIiArIGJ1bGwgKyBcIikoKD86IFteXFxcXG5dKik/KD86XFxcXG58JCkpXCIpOyAvLyBDaGVjayBpZiBjdXJyZW50IGJ1bGxldCBwb2ludCBjYW4gc3RhcnQgYSBuZXcgTGlzdCBJdGVtXG5cbiAgICAgICAgd2hpbGUgKHNyYykge1xuICAgICAgICAgIGVuZEVhcmx5ID0gZmFsc2U7XG5cbiAgICAgICAgICBpZiAoIShjYXAgPSBpdGVtUmVnZXguZXhlYyhzcmMpKSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMucnVsZXMuYmxvY2suaHIudGVzdChzcmMpKSB7XG4gICAgICAgICAgICAvLyBFbmQgbGlzdCBpZiBidWxsZXQgd2FzIGFjdHVhbGx5IEhSIChwb3NzaWJseSBtb3ZlIGludG8gaXRlbVJlZ2V4PylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJhdyA9IGNhcFswXTtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHJhdy5sZW5ndGgpO1xuICAgICAgICAgIGxpbmUgPSBjYXBbMl0uc3BsaXQoJ1xcbicsIDEpWzBdO1xuICAgICAgICAgIG5leHRMaW5lID0gc3JjLnNwbGl0KCdcXG4nLCAxKVswXTtcblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMpIHtcbiAgICAgICAgICAgIGluZGVudCA9IDI7XG4gICAgICAgICAgICBpdGVtQ29udGVudHMgPSBsaW5lLnRyaW1MZWZ0KCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluZGVudCA9IGNhcFsyXS5zZWFyY2goL1teIF0vKTsgLy8gRmluZCBmaXJzdCBub24tc3BhY2UgY2hhclxuXG4gICAgICAgICAgICBpbmRlbnQgPSBpbmRlbnQgPiA0ID8gMSA6IGluZGVudDsgLy8gVHJlYXQgaW5kZW50ZWQgY29kZSBibG9ja3MgKD4gNCBzcGFjZXMpIGFzIGhhdmluZyBvbmx5IDEgaW5kZW50XG5cbiAgICAgICAgICAgIGl0ZW1Db250ZW50cyA9IGxpbmUuc2xpY2UoaW5kZW50KTtcbiAgICAgICAgICAgIGluZGVudCArPSBjYXBbMV0ubGVuZ3RoO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGJsYW5rTGluZSA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFsaW5lICYmIC9eICokLy50ZXN0KG5leHRMaW5lKSkge1xuICAgICAgICAgICAgLy8gSXRlbXMgYmVnaW4gd2l0aCBhdCBtb3N0IG9uZSBibGFuayBsaW5lXG4gICAgICAgICAgICByYXcgKz0gbmV4dExpbmUgKyAnXFxuJztcbiAgICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcobmV4dExpbmUubGVuZ3RoICsgMSk7XG4gICAgICAgICAgICBlbmRFYXJseSA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFlbmRFYXJseSkge1xuICAgICAgICAgICAgdmFyIG5leHRCdWxsZXRSZWdleCA9IG5ldyBSZWdFeHAoXCJeIHswLFwiICsgTWF0aC5taW4oMywgaW5kZW50IC0gMSkgKyBcIn0oPzpbKistXXxcXFxcZHsxLDl9Wy4pXSlcIik7IC8vIENoZWNrIGlmIGZvbGxvd2luZyBsaW5lcyBzaG91bGQgYmUgaW5jbHVkZWQgaW4gTGlzdCBJdGVtXG5cbiAgICAgICAgICAgIHdoaWxlIChzcmMpIHtcbiAgICAgICAgICAgICAgcmF3TGluZSA9IHNyYy5zcGxpdCgnXFxuJywgMSlbMF07XG4gICAgICAgICAgICAgIGxpbmUgPSByYXdMaW5lOyAvLyBSZS1hbGlnbiB0byBmb2xsb3cgY29tbW9ubWFyayBuZXN0aW5nIHJ1bGVzXG5cbiAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgICAgICAgICAgICAgIGxpbmUgPSBsaW5lLnJlcGxhY2UoL14gezEsNH0oPz0oIHs0fSkqW14gXSkvZywgJyAgJyk7XG4gICAgICAgICAgICAgIH0gLy8gRW5kIGxpc3QgaXRlbSBpZiBmb3VuZCBzdGFydCBvZiBuZXcgYnVsbGV0XG5cblxuICAgICAgICAgICAgICBpZiAobmV4dEJ1bGxldFJlZ2V4LnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChsaW5lLnNlYXJjaCgvW14gXS8pID49IGluZGVudCB8fCAhbGluZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBEZWRlbnQgaWYgcG9zc2libGVcbiAgICAgICAgICAgICAgICBpdGVtQ29udGVudHMgKz0gJ1xcbicgKyBsaW5lLnNsaWNlKGluZGVudCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWJsYW5rTGluZSkge1xuICAgICAgICAgICAgICAgIC8vIFVudGlsIGJsYW5rIGxpbmUsIGl0ZW0gZG9lc24ndCBuZWVkIGluZGVudGF0aW9uXG4gICAgICAgICAgICAgICAgaXRlbUNvbnRlbnRzICs9ICdcXG4nICsgbGluZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBPdGhlcndpc2UsIGltcHJvcGVyIGluZGVudGF0aW9uIGVuZHMgdGhpcyBpdGVtXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIWJsYW5rTGluZSAmJiAhbGluZS50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBjdXJyZW50IGxpbmUgaXMgYmxhbmtcbiAgICAgICAgICAgICAgICBibGFua0xpbmUgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmF3ICs9IHJhd0xpbmUgKyAnXFxuJztcbiAgICAgICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyhyYXdMaW5lLmxlbmd0aCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghbGlzdC5sb29zZSkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIHByZXZpb3VzIGl0ZW0gZW5kZWQgd2l0aCBhIGJsYW5rIGxpbmUsIHRoZSBsaXN0IGlzIGxvb3NlXG4gICAgICAgICAgICBpZiAoZW5kc1dpdGhCbGFua0xpbmUpIHtcbiAgICAgICAgICAgICAgbGlzdC5sb29zZSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9cXG4gKlxcbiAqJC8udGVzdChyYXcpKSB7XG4gICAgICAgICAgICAgIGVuZHNXaXRoQmxhbmtMaW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IC8vIENoZWNrIGZvciB0YXNrIGxpc3QgaXRlbXNcblxuXG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICAgICAgICAgIGlzdGFzayA9IC9eXFxbWyB4WF1cXF0gLy5leGVjKGl0ZW1Db250ZW50cyk7XG5cbiAgICAgICAgICAgIGlmIChpc3Rhc2spIHtcbiAgICAgICAgICAgICAgaXNjaGVja2VkID0gaXN0YXNrWzBdICE9PSAnWyBdICc7XG4gICAgICAgICAgICAgIGl0ZW1Db250ZW50cyA9IGl0ZW1Db250ZW50cy5yZXBsYWNlKC9eXFxbWyB4WF1cXF0gKy8sICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0Lml0ZW1zLnB1c2goe1xuICAgICAgICAgICAgdHlwZTogJ2xpc3RfaXRlbScsXG4gICAgICAgICAgICByYXc6IHJhdyxcbiAgICAgICAgICAgIHRhc2s6ICEhaXN0YXNrLFxuICAgICAgICAgICAgY2hlY2tlZDogaXNjaGVja2VkLFxuICAgICAgICAgICAgbG9vc2U6IGZhbHNlLFxuICAgICAgICAgICAgdGV4dDogaXRlbUNvbnRlbnRzXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGlzdC5yYXcgKz0gcmF3O1xuICAgICAgICB9IC8vIERvIG5vdCBjb25zdW1lIG5ld2xpbmVzIGF0IGVuZCBvZiBmaW5hbCBpdGVtLiBBbHRlcm5hdGl2ZWx5LCBtYWtlIGl0ZW1SZWdleCAqc3RhcnQqIHdpdGggYW55IG5ld2xpbmVzIHRvIHNpbXBsaWZ5L3NwZWVkIHVwIGVuZHNXaXRoQmxhbmtMaW5lIGxvZ2ljXG5cblxuICAgICAgICBsaXN0Lml0ZW1zW2xpc3QuaXRlbXMubGVuZ3RoIC0gMV0ucmF3ID0gcmF3LnRyaW1SaWdodCgpO1xuICAgICAgICBsaXN0Lml0ZW1zW2xpc3QuaXRlbXMubGVuZ3RoIC0gMV0udGV4dCA9IGl0ZW1Db250ZW50cy50cmltUmlnaHQoKTtcbiAgICAgICAgbGlzdC5yYXcgPSBsaXN0LnJhdy50cmltUmlnaHQoKTtcbiAgICAgICAgdmFyIGwgPSBsaXN0Lml0ZW1zLmxlbmd0aDsgLy8gSXRlbSBjaGlsZCB0b2tlbnMgaGFuZGxlZCBoZXJlIGF0IGVuZCBiZWNhdXNlIHdlIG5lZWRlZCB0byBoYXZlIHRoZSBmaW5hbCBpdGVtIHRvIHRyaW0gaXQgZmlyc3RcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5sZXhlci5zdGF0ZS50b3AgPSBmYWxzZTtcbiAgICAgICAgICBsaXN0Lml0ZW1zW2ldLnRva2VucyA9IHRoaXMubGV4ZXIuYmxvY2tUb2tlbnMobGlzdC5pdGVtc1tpXS50ZXh0LCBbXSk7XG5cbiAgICAgICAgICBpZiAoIWxpc3QubG9vc2UgJiYgbGlzdC5pdGVtc1tpXS50b2tlbnMuc29tZShmdW5jdGlvbiAodCkge1xuICAgICAgICAgICAgcmV0dXJuIHQudHlwZSA9PT0gJ3NwYWNlJztcbiAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgbGlzdC5sb29zZSA9IHRydWU7XG4gICAgICAgICAgICBsaXN0Lml0ZW1zW2ldLmxvb3NlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmh0bWwgPSBmdW5jdGlvbiBodG1sKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuYmxvY2suaHRtbC5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICAgIHR5cGU6ICdodG1sJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICBwcmU6ICF0aGlzLm9wdGlvbnMuc2FuaXRpemVyICYmIChjYXBbMV0gPT09ICdwcmUnIHx8IGNhcFsxXSA9PT0gJ3NjcmlwdCcgfHwgY2FwWzFdID09PSAnc3R5bGUnKSxcbiAgICAgICAgICB0ZXh0OiBjYXBbMF1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNhbml0aXplKSB7XG4gICAgICAgICAgdG9rZW4udHlwZSA9ICdwYXJhZ3JhcGgnO1xuICAgICAgICAgIHRva2VuLnRleHQgPSB0aGlzLm9wdGlvbnMuc2FuaXRpemVyID8gdGhpcy5vcHRpb25zLnNhbml0aXplcihjYXBbMF0pIDogZXNjYXBlKGNhcFswXSk7XG4gICAgICAgICAgdG9rZW4udG9rZW5zID0gW107XG4gICAgICAgICAgdGhpcy5sZXhlci5pbmxpbmUodG9rZW4udGV4dCwgdG9rZW4udG9rZW5zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmRlZiA9IGZ1bmN0aW9uIGRlZihzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmRlZi5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgaWYgKGNhcFszXSkgY2FwWzNdID0gY2FwWzNdLnN1YnN0cmluZygxLCBjYXBbM10ubGVuZ3RoIC0gMSk7XG4gICAgICAgIHZhciB0YWcgPSBjYXBbMV0udG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2RlZicsXG4gICAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgaHJlZjogY2FwWzJdLFxuICAgICAgICAgIHRpdGxlOiBjYXBbM11cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLnRhYmxlID0gZnVuY3Rpb24gdGFibGUoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay50YWJsZS5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgdHlwZTogJ3RhYmxlJyxcbiAgICAgICAgICBoZWFkZXI6IHNwbGl0Q2VsbHMoY2FwWzFdKS5tYXAoZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHRleHQ6IGNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSksXG4gICAgICAgICAgYWxpZ246IGNhcFsyXS5yZXBsYWNlKC9eICp8XFx8ICokL2csICcnKS5zcGxpdCgvICpcXHwgKi8pLFxuICAgICAgICAgIHJvd3M6IGNhcFszXSA/IGNhcFszXS5yZXBsYWNlKC9cXG5bIFxcdF0qJC8sICcnKS5zcGxpdCgnXFxuJykgOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpdGVtLmhlYWRlci5sZW5ndGggPT09IGl0ZW0uYWxpZ24ubGVuZ3RoKSB7XG4gICAgICAgICAgaXRlbS5yYXcgPSBjYXBbMF07XG4gICAgICAgICAgdmFyIGwgPSBpdGVtLmFsaWduLmxlbmd0aDtcbiAgICAgICAgICB2YXIgaSwgaiwgaywgcm93O1xuXG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKC9eICotKzogKiQvLnRlc3QoaXRlbS5hbGlnbltpXSkpIHtcbiAgICAgICAgICAgICAgaXRlbS5hbGlnbltpXSA9ICdyaWdodCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9eICo6LSs6ICokLy50ZXN0KGl0ZW0uYWxpZ25baV0pKSB7XG4gICAgICAgICAgICAgIGl0ZW0uYWxpZ25baV0gPSAnY2VudGVyJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL14gKjotKyAqJC8udGVzdChpdGVtLmFsaWduW2ldKSkge1xuICAgICAgICAgICAgICBpdGVtLmFsaWduW2ldID0gJ2xlZnQnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaXRlbS5hbGlnbltpXSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbCA9IGl0ZW0ucm93cy5sZW5ndGg7XG5cbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtLnJvd3NbaV0gPSBzcGxpdENlbGxzKGl0ZW0ucm93c1tpXSwgaXRlbS5oZWFkZXIubGVuZ3RoKS5tYXAoZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBjXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IC8vIHBhcnNlIGNoaWxkIHRva2VucyBpbnNpZGUgaGVhZGVycyBhbmQgY2VsbHNcbiAgICAgICAgICAvLyBoZWFkZXIgY2hpbGQgdG9rZW5zXG5cblxuICAgICAgICAgIGwgPSBpdGVtLmhlYWRlci5sZW5ndGg7XG5cbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbDsgaisrKSB7XG4gICAgICAgICAgICBpdGVtLmhlYWRlcltqXS50b2tlbnMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKGl0ZW0uaGVhZGVyW2pdLnRleHQsIGl0ZW0uaGVhZGVyW2pdLnRva2Vucyk7XG4gICAgICAgICAgfSAvLyBjZWxsIGNoaWxkIHRva2Vuc1xuXG5cbiAgICAgICAgICBsID0gaXRlbS5yb3dzLmxlbmd0aDtcblxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsOyBqKyspIHtcbiAgICAgICAgICAgIHJvdyA9IGl0ZW0ucm93c1tqXTtcblxuICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IHJvdy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICByb3dba10udG9rZW5zID0gW107XG4gICAgICAgICAgICAgIHRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKHJvd1trXS50ZXh0LCByb3dba10udG9rZW5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8ubGhlYWRpbmcgPSBmdW5jdGlvbiBsaGVhZGluZyhzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmJsb2NrLmxoZWFkaW5nLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB7XG4gICAgICAgICAgdHlwZTogJ2hlYWRpbmcnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIGRlcHRoOiBjYXBbMl0uY2hhckF0KDApID09PSAnPScgPyAxIDogMixcbiAgICAgICAgICB0ZXh0OiBjYXBbMV0sXG4gICAgICAgICAgdG9rZW5zOiBbXVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmxleGVyLmlubGluZSh0b2tlbi50ZXh0LCB0b2tlbi50b2tlbnMpO1xuICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5wYXJhZ3JhcGggPSBmdW5jdGlvbiBwYXJhZ3JhcGgoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay5wYXJhZ3JhcGguZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0b2tlbiA9IHtcbiAgICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiBjYXBbMV0uY2hhckF0KGNhcFsxXS5sZW5ndGggLSAxKSA9PT0gJ1xcbicgPyBjYXBbMV0uc2xpY2UoMCwgLTEpIDogY2FwWzFdLFxuICAgICAgICAgIHRva2VuczogW11cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5sZXhlci5pbmxpbmUodG9rZW4udGV4dCwgdG9rZW4udG9rZW5zKTtcbiAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8udGV4dCA9IGZ1bmN0aW9uIHRleHQoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5ibG9jay50ZXh0LmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdG9rZW4gPSB7XG4gICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIHRleHQ6IGNhcFswXSxcbiAgICAgICAgICB0b2tlbnM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubGV4ZXIuaW5saW5lKHRva2VuLnRleHQsIHRva2VuLnRva2Vucyk7XG4gICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgX3Byb3RvLmVzY2FwZSA9IGZ1bmN0aW9uIGVzY2FwZSQxKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLmVzY2FwZS5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnZXNjYXBlJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiBlc2NhcGUoY2FwWzFdKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8udGFnID0gZnVuY3Rpb24gdGFnKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLnRhZy5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgaWYgKCF0aGlzLmxleGVyLnN0YXRlLmluTGluayAmJiAvXjxhIC9pLnRlc3QoY2FwWzBdKSkge1xuICAgICAgICAgIHRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxleGVyLnN0YXRlLmluTGluayAmJiAvXjxcXC9hPi9pLnRlc3QoY2FwWzBdKSkge1xuICAgICAgICAgIHRoaXMubGV4ZXIuc3RhdGUuaW5MaW5rID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayAmJiAvXjwocHJlfGNvZGV8a2JkfHNjcmlwdCkoXFxzfD4pL2kudGVzdChjYXBbMF0pKSB7XG4gICAgICAgICAgdGhpcy5sZXhlci5zdGF0ZS5pblJhd0Jsb2NrID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2sgJiYgL148XFwvKHByZXxjb2RlfGtiZHxzY3JpcHQpKFxcc3w+KS9pLnRlc3QoY2FwWzBdKSkge1xuICAgICAgICAgIHRoaXMubGV4ZXIuc3RhdGUuaW5SYXdCbG9jayA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiB0aGlzLm9wdGlvbnMuc2FuaXRpemUgPyAndGV4dCcgOiAnaHRtbCcsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgaW5MaW5rOiB0aGlzLmxleGVyLnN0YXRlLmluTGluayxcbiAgICAgICAgICBpblJhd0Jsb2NrOiB0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2ssXG4gICAgICAgICAgdGV4dDogdGhpcy5vcHRpb25zLnNhbml0aXplID8gdGhpcy5vcHRpb25zLnNhbml0aXplciA/IHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIoY2FwWzBdKSA6IGVzY2FwZShjYXBbMF0pIDogY2FwWzBdXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5saW5rID0gZnVuY3Rpb24gbGluayhzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5saW5rLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICB2YXIgdHJpbW1lZFVybCA9IGNhcFsyXS50cmltKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucGVkYW50aWMgJiYgL148Ly50ZXN0KHRyaW1tZWRVcmwpKSB7XG4gICAgICAgICAgLy8gY29tbW9ubWFyayByZXF1aXJlcyBtYXRjaGluZyBhbmdsZSBicmFja2V0c1xuICAgICAgICAgIGlmICghLz4kLy50ZXN0KHRyaW1tZWRVcmwpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSAvLyBlbmRpbmcgYW5nbGUgYnJhY2tldCBjYW5ub3QgYmUgZXNjYXBlZFxuXG5cbiAgICAgICAgICB2YXIgcnRyaW1TbGFzaCA9IHJ0cmltKHRyaW1tZWRVcmwuc2xpY2UoMCwgLTEpLCAnXFxcXCcpO1xuXG4gICAgICAgICAgaWYgKCh0cmltbWVkVXJsLmxlbmd0aCAtIHJ0cmltU2xhc2gubGVuZ3RoKSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZmluZCBjbG9zaW5nIHBhcmVudGhlc2lzXG4gICAgICAgICAgdmFyIGxhc3RQYXJlbkluZGV4ID0gZmluZENsb3NpbmdCcmFja2V0KGNhcFsyXSwgJygpJyk7XG5cbiAgICAgICAgICBpZiAobGFzdFBhcmVuSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gY2FwWzBdLmluZGV4T2YoJyEnKSA9PT0gMCA/IDUgOiA0O1xuICAgICAgICAgICAgdmFyIGxpbmtMZW4gPSBzdGFydCArIGNhcFsxXS5sZW5ndGggKyBsYXN0UGFyZW5JbmRleDtcbiAgICAgICAgICAgIGNhcFsyXSA9IGNhcFsyXS5zdWJzdHJpbmcoMCwgbGFzdFBhcmVuSW5kZXgpO1xuICAgICAgICAgICAgY2FwWzBdID0gY2FwWzBdLnN1YnN0cmluZygwLCBsaW5rTGVuKS50cmltKCk7XG4gICAgICAgICAgICBjYXBbM10gPSAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaHJlZiA9IGNhcFsyXTtcbiAgICAgICAgdmFyIHRpdGxlID0gJyc7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgICAgICAgIC8vIHNwbGl0IHBlZGFudGljIGhyZWYgYW5kIHRpdGxlXG4gICAgICAgICAgdmFyIGxpbmsgPSAvXihbXidcIl0qW15cXHNdKVxccysoWydcIl0pKC4qKVxcMi8uZXhlYyhocmVmKTtcblxuICAgICAgICAgIGlmIChsaW5rKSB7XG4gICAgICAgICAgICBocmVmID0gbGlua1sxXTtcbiAgICAgICAgICAgIHRpdGxlID0gbGlua1szXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGl0bGUgPSBjYXBbM10gPyBjYXBbM10uc2xpY2UoMSwgLTEpIDogJyc7XG4gICAgICAgIH1cblxuICAgICAgICBocmVmID0gaHJlZi50cmltKCk7XG5cbiAgICAgICAgaWYgKC9ePC8udGVzdChocmVmKSkge1xuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMucGVkYW50aWMgJiYgIS8+JC8udGVzdCh0cmltbWVkVXJsKSkge1xuICAgICAgICAgICAgLy8gcGVkYW50aWMgYWxsb3dzIHN0YXJ0aW5nIGFuZ2xlIGJyYWNrZXQgd2l0aG91dCBlbmRpbmcgYW5nbGUgYnJhY2tldFxuICAgICAgICAgICAgaHJlZiA9IGhyZWYuc2xpY2UoMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGhyZWYgPSBocmVmLnNsaWNlKDEsIC0xKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb3V0cHV0TGluayhjYXAsIHtcbiAgICAgICAgICBocmVmOiBocmVmID8gaHJlZi5yZXBsYWNlKHRoaXMucnVsZXMuaW5saW5lLl9lc2NhcGVzLCAnJDEnKSA6IGhyZWYsXG4gICAgICAgICAgdGl0bGU6IHRpdGxlID8gdGl0bGUucmVwbGFjZSh0aGlzLnJ1bGVzLmlubGluZS5fZXNjYXBlcywgJyQxJykgOiB0aXRsZVxuICAgICAgICB9LCBjYXBbMF0sIHRoaXMubGV4ZXIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8ucmVmbGluayA9IGZ1bmN0aW9uIHJlZmxpbmsoc3JjLCBsaW5rcykge1xuICAgICAgdmFyIGNhcDtcblxuICAgICAgaWYgKChjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5yZWZsaW5rLmV4ZWMoc3JjKSkgfHwgKGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLm5vbGluay5leGVjKHNyYykpKSB7XG4gICAgICAgIHZhciBsaW5rID0gKGNhcFsyXSB8fCBjYXBbMV0pLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgICAgICAgbGluayA9IGxpbmtzW2xpbmsudG9Mb3dlckNhc2UoKV07XG5cbiAgICAgICAgaWYgKCFsaW5rIHx8ICFsaW5rLmhyZWYpIHtcbiAgICAgICAgICB2YXIgdGV4dCA9IGNhcFswXS5jaGFyQXQoMCk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIHJhdzogdGV4dCxcbiAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dExpbmsoY2FwLCBsaW5rLCBjYXBbMF0sIHRoaXMubGV4ZXIpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uZW1TdHJvbmcgPSBmdW5jdGlvbiBlbVN0cm9uZyhzcmMsIG1hc2tlZFNyYywgcHJldkNoYXIpIHtcbiAgICAgIGlmIChwcmV2Q2hhciA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHByZXZDaGFyID0gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBtYXRjaCA9IHRoaXMucnVsZXMuaW5saW5lLmVtU3Ryb25nLmxEZWxpbS5leGVjKHNyYyk7XG4gICAgICBpZiAoIW1hdGNoKSByZXR1cm47IC8vIF8gY2FuJ3QgYmUgYmV0d2VlbiB0d28gYWxwaGFudW1lcmljcy4gXFxwe0x9XFxwe059IGluY2x1ZGVzIG5vbi1lbmdsaXNoIGFscGhhYmV0L251bWJlcnMgYXMgd2VsbFxuXG4gICAgICBpZiAobWF0Y2hbM10gJiYgcHJldkNoYXIubWF0Y2goLyg/OlswLTlBLVphLXpcXHhBQVxceEIyXFx4QjNcXHhCNVxceEI5XFx4QkFcXHhCQy1cXHhCRVxceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzN0ZcXHUwMzg2XFx1MDM4OC1cXHUwMzhBXFx1MDM4Q1xcdTAzOEUtXFx1MDNBMVxcdTAzQTMtXFx1MDNGNVxcdTAzRjctXFx1MDQ4MVxcdTA0OEEtXFx1MDUyRlxcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYwLVxcdTA1ODhcXHUwNUQwLVxcdTA1RUFcXHUwNUVGLVxcdTA1RjJcXHUwNjIwLVxcdTA2NEFcXHUwNjYwLVxcdTA2NjlcXHUwNjZFXFx1MDY2RlxcdTA2NzEtXFx1MDZEM1xcdTA2RDVcXHUwNkU1XFx1MDZFNlxcdTA2RUUtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwXFx1MDcxMi1cXHUwNzJGXFx1MDc0RC1cXHUwN0E1XFx1MDdCMVxcdTA3QzAtXFx1MDdFQVxcdTA3RjRcXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgxNVxcdTA4MUFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4NjAtXFx1MDg2QVxcdTA4NzAtXFx1MDg4N1xcdTA4ODktXFx1MDg4RVxcdTA4QTAtXFx1MDhDOVxcdTA5MDQtXFx1MDkzOVxcdTA5M0RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk2Ni1cXHUwOTZGXFx1MDk3MS1cXHUwOTgwXFx1MDk4NS1cXHUwOThDXFx1MDk4RlxcdTA5OTBcXHUwOTkzLVxcdTA5QThcXHUwOUFBLVxcdTA5QjBcXHUwOUIyXFx1MDlCNi1cXHUwOUI5XFx1MDlCRFxcdTA5Q0VcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFMVxcdTA5RTYtXFx1MDlGMVxcdTA5RjQtXFx1MDlGOVxcdTA5RkNcXHUwQTA1LVxcdTBBMEFcXHUwQTBGXFx1MEExMFxcdTBBMTMtXFx1MEEyOFxcdTBBMkEtXFx1MEEzMFxcdTBBMzJcXHUwQTMzXFx1MEEzNVxcdTBBMzZcXHUwQTM4XFx1MEEzOVxcdTBBNTktXFx1MEE1Q1xcdTBBNUVcXHUwQTY2LVxcdTBBNkZcXHUwQTcyLVxcdTBBNzRcXHUwQTg1LVxcdTBBOERcXHUwQThGLVxcdTBBOTFcXHUwQTkzLVxcdTBBQThcXHUwQUFBLVxcdTBBQjBcXHUwQUIyXFx1MEFCM1xcdTBBQjUtXFx1MEFCOVxcdTBBQkRcXHUwQUQwXFx1MEFFMFxcdTBBRTFcXHUwQUU2LVxcdTBBRUZcXHUwQUY5XFx1MEIwNS1cXHUwQjBDXFx1MEIwRlxcdTBCMTBcXHUwQjEzLVxcdTBCMjhcXHUwQjJBLVxcdTBCMzBcXHUwQjMyXFx1MEIzM1xcdTBCMzUtXFx1MEIzOVxcdTBCM0RcXHUwQjVDXFx1MEI1RFxcdTBCNUYtXFx1MEI2MVxcdTBCNjYtXFx1MEI2RlxcdTBCNzEtXFx1MEI3N1xcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJEMFxcdTBCRTYtXFx1MEJGMlxcdTBDMDUtXFx1MEMwQ1xcdTBDMEUtXFx1MEMxMFxcdTBDMTItXFx1MEMyOFxcdTBDMkEtXFx1MEMzOVxcdTBDM0RcXHUwQzU4LVxcdTBDNUFcXHUwQzVEXFx1MEM2MFxcdTBDNjFcXHUwQzY2LVxcdTBDNkZcXHUwQzc4LVxcdTBDN0VcXHUwQzgwXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCRFxcdTBDRERcXHUwQ0RFXFx1MENFMFxcdTBDRTFcXHUwQ0U2LVxcdTBDRUZcXHUwQ0YxXFx1MENGMlxcdTBEMDQtXFx1MEQwQ1xcdTBEMEUtXFx1MEQxMFxcdTBEMTItXFx1MEQzQVxcdTBEM0RcXHUwRDRFXFx1MEQ1NC1cXHUwRDU2XFx1MEQ1OC1cXHUwRDYxXFx1MEQ2Ni1cXHUwRDc4XFx1MEQ3QS1cXHUwRDdGXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBERTYtXFx1MERFRlxcdTBFMDEtXFx1MEUzMFxcdTBFMzJcXHUwRTMzXFx1MEU0MC1cXHUwRTQ2XFx1MEU1MC1cXHUwRTU5XFx1MEU4MVxcdTBFODJcXHUwRTg0XFx1MEU4Ni1cXHUwRThBXFx1MEU4Qy1cXHUwRUEzXFx1MEVBNVxcdTBFQTctXFx1MEVCMFxcdTBFQjJcXHUwRUIzXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRUQwLVxcdTBFRDlcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEYyMC1cXHUwRjMzXFx1MEY0MC1cXHUwRjQ3XFx1MEY0OS1cXHUwRjZDXFx1MEY4OC1cXHUwRjhDXFx1MTAwMC1cXHUxMDJBXFx1MTAzRi1cXHUxMDQ5XFx1MTA1MC1cXHUxMDU1XFx1MTA1QS1cXHUxMDVEXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2RS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4RVxcdTEwOTAtXFx1MTA5OVxcdTEwQTAtXFx1MTBDNVxcdTEwQzdcXHUxMENEXFx1MTBEMC1cXHUxMEZBXFx1MTBGQy1cXHUxMjQ4XFx1MTI0QS1cXHUxMjREXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNUEtXFx1MTI1RFxcdTEyNjAtXFx1MTI4OFxcdTEyOEEtXFx1MTI4RFxcdTEyOTAtXFx1MTJCMFxcdTEyQjItXFx1MTJCNVxcdTEyQjgtXFx1MTJCRVxcdTEyQzBcXHUxMkMyLVxcdTEyQzVcXHUxMkM4LVxcdTEyRDZcXHUxMkQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNUFcXHUxMzY5LVxcdTEzN0NcXHUxMzgwLVxcdTEzOEZcXHUxM0EwLVxcdTEzRjVcXHUxM0Y4LVxcdTEzRkRcXHUxNDAxLVxcdTE2NkNcXHUxNjZGLVxcdTE2N0ZcXHUxNjgxLVxcdTE2OUFcXHUxNkEwLVxcdTE2RUFcXHUxNkVFLVxcdTE2RjhcXHUxNzAwLVxcdTE3MTFcXHUxNzFGLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NkNcXHUxNzZFLVxcdTE3NzBcXHUxNzgwLVxcdTE3QjNcXHUxN0Q3XFx1MTdEQ1xcdTE3RTAtXFx1MTdFOVxcdTE3RjAtXFx1MTdGOVxcdTE4MTAtXFx1MTgxOVxcdTE4MjAtXFx1MTg3OFxcdTE4ODAtXFx1MTg4NFxcdTE4ODctXFx1MThBOFxcdTE4QUFcXHUxOEIwLVxcdTE4RjVcXHUxOTAwLVxcdTE5MUVcXHUxOTQ2LVxcdTE5NkRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5QUJcXHUxOUIwLVxcdTE5QzlcXHUxOUQwLVxcdTE5REFcXHUxQTAwLVxcdTFBMTZcXHUxQTIwLVxcdTFBNTRcXHUxQTgwLVxcdTFBODlcXHUxQTkwLVxcdTFBOTlcXHUxQUE3XFx1MUIwNS1cXHUxQjMzXFx1MUI0NS1cXHUxQjRDXFx1MUI1MC1cXHUxQjU5XFx1MUI4My1cXHUxQkEwXFx1MUJBRS1cXHUxQkU1XFx1MUMwMC1cXHUxQzIzXFx1MUM0MC1cXHUxQzQ5XFx1MUM0RC1cXHUxQzdEXFx1MUM4MC1cXHUxQzg4XFx1MUM5MC1cXHUxQ0JBXFx1MUNCRC1cXHUxQ0JGXFx1MUNFOS1cXHUxQ0VDXFx1MUNFRS1cXHUxQ0YzXFx1MUNGNVxcdTFDRjZcXHUxQ0ZBXFx1MUQwMC1cXHUxREJGXFx1MUUwMC1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwNzBcXHUyMDcxXFx1MjA3NC1cXHUyMDc5XFx1MjA3Ri1cXHUyMDg5XFx1MjA5MC1cXHUyMDlDXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTJEXFx1MjEyRi1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNTAtXFx1MjE4OVxcdTI0NjAtXFx1MjQ5QlxcdTI0RUEtXFx1MjRGRlxcdTI3NzYtXFx1Mjc5M1xcdTJDMDAtXFx1MkNFNFxcdTJDRUItXFx1MkNFRVxcdTJDRjJcXHUyQ0YzXFx1MkNGRFxcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEODAtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJFMkZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDlELVxcdTMwOUZcXHUzMEExLVxcdTMwRkFcXHUzMEZDLVxcdTMwRkZcXHUzMTA1LVxcdTMxMkZcXHUzMTMxLVxcdTMxOEVcXHUzMTkyLVxcdTMxOTVcXHUzMUEwLVxcdTMxQkZcXHUzMUYwLVxcdTMxRkZcXHUzMjIwLVxcdTMyMjlcXHUzMjQ4LVxcdTMyNEZcXHUzMjUxLVxcdTMyNUZcXHUzMjgwLVxcdTMyODlcXHUzMkIxLVxcdTMyQkZcXHUzNDAwLVxcdTREQkZcXHU0RTAwLVxcdUE0OENcXHVBNEQwLVxcdUE0RkRcXHVBNTAwLVxcdUE2MENcXHVBNjEwLVxcdUE2MkJcXHVBNjQwLVxcdUE2NkVcXHVBNjdGLVxcdUE2OURcXHVBNkEwLVxcdUE2RUZcXHVBNzE3LVxcdUE3MUZcXHVBNzIyLVxcdUE3ODhcXHVBNzhCLVxcdUE3Q0FcXHVBN0QwXFx1QTdEMVxcdUE3RDNcXHVBN0Q1LVxcdUE3RDlcXHVBN0YyLVxcdUE4MDFcXHVBODAzLVxcdUE4MDVcXHVBODA3LVxcdUE4MEFcXHVBODBDLVxcdUE4MjJcXHVBODMwLVxcdUE4MzVcXHVBODQwLVxcdUE4NzNcXHVBODgyLVxcdUE4QjNcXHVBOEQwLVxcdUE4RDlcXHVBOEYyLVxcdUE4RjdcXHVBOEZCXFx1QThGRFxcdUE4RkVcXHVBOTAwLVxcdUE5MjVcXHVBOTMwLVxcdUE5NDZcXHVBOTYwLVxcdUE5N0NcXHVBOTg0LVxcdUE5QjJcXHVBOUNGLVxcdUE5RDlcXHVBOUUwLVxcdUE5RTRcXHVBOUU2LVxcdUE5RkVcXHVBQTAwLVxcdUFBMjhcXHVBQTQwLVxcdUFBNDJcXHVBQTQ0LVxcdUFBNEJcXHVBQTUwLVxcdUFBNTlcXHVBQTYwLVxcdUFBNzZcXHVBQTdBXFx1QUE3RS1cXHVBQUFGXFx1QUFCMVxcdUFBQjVcXHVBQUI2XFx1QUFCOS1cXHVBQUJEXFx1QUFDMFxcdUFBQzJcXHVBQURCLVxcdUFBRERcXHVBQUUwLVxcdUFBRUFcXHVBQUYyLVxcdUFBRjRcXHVBQjAxLVxcdUFCMDZcXHVBQjA5LVxcdUFCMEVcXHVBQjExLVxcdUFCMTZcXHVBQjIwLVxcdUFCMjZcXHVBQjI4LVxcdUFCMkVcXHVBQjMwLVxcdUFCNUFcXHVBQjVDLVxcdUFCNjlcXHVBQjcwLVxcdUFCRTJcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFEXFx1RkIxRi1cXHVGQjI4XFx1RkIyQS1cXHVGQjM2XFx1RkIzOC1cXHVGQjNDXFx1RkIzRVxcdUZCNDBcXHVGQjQxXFx1RkI0M1xcdUZCNDRcXHVGQjQ2LVxcdUZCQjFcXHVGQkQzLVxcdUZEM0RcXHVGRDUwLVxcdUZEOEZcXHVGRDkyLVxcdUZEQzdcXHVGREYwLVxcdUZERkJcXHVGRTcwLVxcdUZFNzRcXHVGRTc2LVxcdUZFRkNcXHVGRjEwLVxcdUZGMTlcXHVGRjIxLVxcdUZGM0FcXHVGRjQxLVxcdUZGNUFcXHVGRjY2LVxcdUZGQkVcXHVGRkMyLVxcdUZGQzdcXHVGRkNBLVxcdUZGQ0ZcXHVGRkQyLVxcdUZGRDdcXHVGRkRBLVxcdUZGRENdfFxcdUQ4MDBbXFx1REMwMC1cXHVEQzBCXFx1REMwRC1cXHVEQzI2XFx1REMyOC1cXHVEQzNBXFx1REMzQ1xcdURDM0RcXHVEQzNGLVxcdURDNERcXHVEQzUwLVxcdURDNURcXHVEQzgwLVxcdURDRkFcXHVERDA3LVxcdUREMzNcXHVERDQwLVxcdURENzhcXHVERDhBXFx1REQ4QlxcdURFODAtXFx1REU5Q1xcdURFQTAtXFx1REVEMFxcdURFRTEtXFx1REVGQlxcdURGMDAtXFx1REYyM1xcdURGMkQtXFx1REY0QVxcdURGNTAtXFx1REY3NVxcdURGODAtXFx1REY5RFxcdURGQTAtXFx1REZDM1xcdURGQzgtXFx1REZDRlxcdURGRDEtXFx1REZENV18XFx1RDgwMVtcXHVEQzAwLVxcdURDOURcXHVEQ0EwLVxcdURDQTlcXHVEQ0IwLVxcdURDRDNcXHVEQ0Q4LVxcdURDRkJcXHVERDAwLVxcdUREMjdcXHVERDMwLVxcdURENjNcXHVERDcwLVxcdUREN0FcXHVERDdDLVxcdUREOEFcXHVERDhDLVxcdUREOTJcXHVERDk0XFx1REQ5NVxcdUREOTctXFx1RERBMVxcdUREQTMtXFx1RERCMVxcdUREQjMtXFx1RERCOVxcdUREQkJcXHVEREJDXFx1REUwMC1cXHVERjM2XFx1REY0MC1cXHVERjU1XFx1REY2MC1cXHVERjY3XFx1REY4MC1cXHVERjg1XFx1REY4Ny1cXHVERkIwXFx1REZCMi1cXHVERkJBXXxcXHVEODAyW1xcdURDMDAtXFx1REMwNVxcdURDMDhcXHVEQzBBLVxcdURDMzVcXHVEQzM3XFx1REMzOFxcdURDM0NcXHVEQzNGLVxcdURDNTVcXHVEQzU4LVxcdURDNzZcXHVEQzc5LVxcdURDOUVcXHVEQ0E3LVxcdURDQUZcXHVEQ0UwLVxcdURDRjJcXHVEQ0Y0XFx1RENGNVxcdURDRkItXFx1REQxQlxcdUREMjAtXFx1REQzOVxcdUREODAtXFx1RERCN1xcdUREQkMtXFx1RERDRlxcdURERDItXFx1REUwMFxcdURFMTAtXFx1REUxM1xcdURFMTUtXFx1REUxN1xcdURFMTktXFx1REUzNVxcdURFNDAtXFx1REU0OFxcdURFNjAtXFx1REU3RVxcdURFODAtXFx1REU5RlxcdURFQzAtXFx1REVDN1xcdURFQzktXFx1REVFNFxcdURFRUItXFx1REVFRlxcdURGMDAtXFx1REYzNVxcdURGNDAtXFx1REY1NVxcdURGNTgtXFx1REY3MlxcdURGNzgtXFx1REY5MVxcdURGQTktXFx1REZBRl18XFx1RDgwM1tcXHVEQzAwLVxcdURDNDhcXHVEQzgwLVxcdURDQjJcXHVEQ0MwLVxcdURDRjJcXHVEQ0ZBLVxcdUREMjNcXHVERDMwLVxcdUREMzlcXHVERTYwLVxcdURFN0VcXHVERTgwLVxcdURFQTlcXHVERUIwXFx1REVCMVxcdURGMDAtXFx1REYyN1xcdURGMzAtXFx1REY0NVxcdURGNTEtXFx1REY1NFxcdURGNzAtXFx1REY4MVxcdURGQjAtXFx1REZDQlxcdURGRTAtXFx1REZGNl18XFx1RDgwNFtcXHVEQzAzLVxcdURDMzdcXHVEQzUyLVxcdURDNkZcXHVEQzcxXFx1REM3MlxcdURDNzVcXHVEQzgzLVxcdURDQUZcXHVEQ0QwLVxcdURDRThcXHVEQ0YwLVxcdURDRjlcXHVERDAzLVxcdUREMjZcXHVERDM2LVxcdUREM0ZcXHVERDQ0XFx1REQ0N1xcdURENTAtXFx1REQ3MlxcdURENzZcXHVERDgzLVxcdUREQjJcXHVEREMxLVxcdUREQzRcXHVEREQwLVxcdUREREFcXHVERERDXFx1RERFMS1cXHVEREY0XFx1REUwMC1cXHVERTExXFx1REUxMy1cXHVERTJCXFx1REU4MC1cXHVERTg2XFx1REU4OFxcdURFOEEtXFx1REU4RFxcdURFOEYtXFx1REU5RFxcdURFOUYtXFx1REVBOFxcdURFQjAtXFx1REVERVxcdURFRjAtXFx1REVGOVxcdURGMDUtXFx1REYwQ1xcdURGMEZcXHVERjEwXFx1REYxMy1cXHVERjI4XFx1REYyQS1cXHVERjMwXFx1REYzMlxcdURGMzNcXHVERjM1LVxcdURGMzlcXHVERjNEXFx1REY1MFxcdURGNUQtXFx1REY2MV18XFx1RDgwNVtcXHVEQzAwLVxcdURDMzRcXHVEQzQ3LVxcdURDNEFcXHVEQzUwLVxcdURDNTlcXHVEQzVGLVxcdURDNjFcXHVEQzgwLVxcdURDQUZcXHVEQ0M0XFx1RENDNVxcdURDQzdcXHVEQ0QwLVxcdURDRDlcXHVERDgwLVxcdUREQUVcXHVEREQ4LVxcdUREREJcXHVERTAwLVxcdURFMkZcXHVERTQ0XFx1REU1MC1cXHVERTU5XFx1REU4MC1cXHVERUFBXFx1REVCOFxcdURFQzAtXFx1REVDOVxcdURGMDAtXFx1REYxQVxcdURGMzAtXFx1REYzQlxcdURGNDAtXFx1REY0Nl18XFx1RDgwNltcXHVEQzAwLVxcdURDMkJcXHVEQ0EwLVxcdURDRjJcXHVEQ0ZGLVxcdUREMDZcXHVERDA5XFx1REQwQy1cXHVERDEzXFx1REQxNVxcdUREMTZcXHVERDE4LVxcdUREMkZcXHVERDNGXFx1REQ0MVxcdURENTAtXFx1REQ1OVxcdUREQTAtXFx1RERBN1xcdUREQUEtXFx1REREMFxcdURERTFcXHVEREUzXFx1REUwMFxcdURFMEItXFx1REUzMlxcdURFM0FcXHVERTUwXFx1REU1Qy1cXHVERTg5XFx1REU5RFxcdURFQjAtXFx1REVGOF18XFx1RDgwN1tcXHVEQzAwLVxcdURDMDhcXHVEQzBBLVxcdURDMkVcXHVEQzQwXFx1REM1MC1cXHVEQzZDXFx1REM3Mi1cXHVEQzhGXFx1REQwMC1cXHVERDA2XFx1REQwOFxcdUREMDlcXHVERDBCLVxcdUREMzBcXHVERDQ2XFx1REQ1MC1cXHVERDU5XFx1REQ2MC1cXHVERDY1XFx1REQ2N1xcdURENjhcXHVERDZBLVxcdUREODlcXHVERDk4XFx1RERBMC1cXHVEREE5XFx1REVFMC1cXHVERUYyXFx1REZCMFxcdURGQzAtXFx1REZENF18XFx1RDgwOFtcXHVEQzAwLVxcdURGOTldfFxcdUQ4MDlbXFx1REMwMC1cXHVEQzZFXFx1REM4MC1cXHVERDQzXXxcXHVEODBCW1xcdURGOTAtXFx1REZGMF18W1xcdUQ4MENcXHVEODFDLVxcdUQ4MjBcXHVEODIyXFx1RDg0MC1cXHVEODY4XFx1RDg2QS1cXHVEODZDXFx1RDg2Ri1cXHVEODcyXFx1RDg3NC1cXHVEODc5XFx1RDg4MC1cXHVEODgzXVtcXHVEQzAwLVxcdURGRkZdfFxcdUQ4MERbXFx1REMwMC1cXHVEQzJFXXxcXHVEODExW1xcdURDMDAtXFx1REU0Nl18XFx1RDgxQVtcXHVEQzAwLVxcdURFMzhcXHVERTQwLVxcdURFNUVcXHVERTYwLVxcdURFNjlcXHVERTcwLVxcdURFQkVcXHVERUMwLVxcdURFQzlcXHVERUQwLVxcdURFRURcXHVERjAwLVxcdURGMkZcXHVERjQwLVxcdURGNDNcXHVERjUwLVxcdURGNTlcXHVERjVCLVxcdURGNjFcXHVERjYzLVxcdURGNzdcXHVERjdELVxcdURGOEZdfFxcdUQ4MUJbXFx1REU0MC1cXHVERTk2XFx1REYwMC1cXHVERjRBXFx1REY1MFxcdURGOTMtXFx1REY5RlxcdURGRTBcXHVERkUxXFx1REZFM118XFx1RDgyMVtcXHVEQzAwLVxcdURGRjddfFxcdUQ4MjNbXFx1REMwMC1cXHVEQ0Q1XFx1REQwMC1cXHVERDA4XXxcXHVEODJCW1xcdURGRjAtXFx1REZGM1xcdURGRjUtXFx1REZGQlxcdURGRkRcXHVERkZFXXxcXHVEODJDW1xcdURDMDAtXFx1REQyMlxcdURENTAtXFx1REQ1MlxcdURENjQtXFx1REQ2N1xcdURENzAtXFx1REVGQl18XFx1RDgyRltcXHVEQzAwLVxcdURDNkFcXHVEQzcwLVxcdURDN0NcXHVEQzgwLVxcdURDODhcXHVEQzkwLVxcdURDOTldfFxcdUQ4MzRbXFx1REVFMC1cXHVERUYzXFx1REY2MC1cXHVERjc4XXxcXHVEODM1W1xcdURDMDAtXFx1REM1NFxcdURDNTYtXFx1REM5Q1xcdURDOUVcXHVEQzlGXFx1RENBMlxcdURDQTVcXHVEQ0E2XFx1RENBOS1cXHVEQ0FDXFx1RENBRS1cXHVEQ0I5XFx1RENCQlxcdURDQkQtXFx1RENDM1xcdURDQzUtXFx1REQwNVxcdUREMDctXFx1REQwQVxcdUREMEQtXFx1REQxNFxcdUREMTYtXFx1REQxQ1xcdUREMUUtXFx1REQzOVxcdUREM0ItXFx1REQzRVxcdURENDAtXFx1REQ0NFxcdURENDZcXHVERDRBLVxcdURENTBcXHVERDUyLVxcdURFQTVcXHVERUE4LVxcdURFQzBcXHVERUMyLVxcdURFREFcXHVERURDLVxcdURFRkFcXHVERUZDLVxcdURGMTRcXHVERjE2LVxcdURGMzRcXHVERjM2LVxcdURGNEVcXHVERjUwLVxcdURGNkVcXHVERjcwLVxcdURGODhcXHVERjhBLVxcdURGQThcXHVERkFBLVxcdURGQzJcXHVERkM0LVxcdURGQ0JcXHVERkNFLVxcdURGRkZdfFxcdUQ4MzdbXFx1REYwMC1cXHVERjFFXXxcXHVEODM4W1xcdUREMDAtXFx1REQyQ1xcdUREMzctXFx1REQzRFxcdURENDAtXFx1REQ0OVxcdURENEVcXHVERTkwLVxcdURFQURcXHVERUMwLVxcdURFRUJcXHVERUYwLVxcdURFRjldfFxcdUQ4MzlbXFx1REZFMC1cXHVERkU2XFx1REZFOC1cXHVERkVCXFx1REZFRFxcdURGRUVcXHVERkYwLVxcdURGRkVdfFxcdUQ4M0FbXFx1REMwMC1cXHVEQ0M0XFx1RENDNy1cXHVEQ0NGXFx1REQwMC1cXHVERDQzXFx1REQ0QlxcdURENTAtXFx1REQ1OV18XFx1RDgzQltcXHVEQzcxLVxcdURDQUJcXHVEQ0FELVxcdURDQUZcXHVEQ0IxLVxcdURDQjRcXHVERDAxLVxcdUREMkRcXHVERDJGLVxcdUREM0RcXHVERTAwLVxcdURFMDNcXHVERTA1LVxcdURFMUZcXHVERTIxXFx1REUyMlxcdURFMjRcXHVERTI3XFx1REUyOS1cXHVERTMyXFx1REUzNC1cXHVERTM3XFx1REUzOVxcdURFM0JcXHVERTQyXFx1REU0N1xcdURFNDlcXHVERTRCXFx1REU0RC1cXHVERTRGXFx1REU1MVxcdURFNTJcXHVERTU0XFx1REU1N1xcdURFNTlcXHVERTVCXFx1REU1RFxcdURFNUZcXHVERTYxXFx1REU2MlxcdURFNjRcXHVERTY3LVxcdURFNkFcXHVERTZDLVxcdURFNzJcXHVERTc0LVxcdURFNzdcXHVERTc5LVxcdURFN0NcXHVERTdFXFx1REU4MC1cXHVERTg5XFx1REU4Qi1cXHVERTlCXFx1REVBMS1cXHVERUEzXFx1REVBNS1cXHVERUE5XFx1REVBQi1cXHVERUJCXXxcXHVEODNDW1xcdUREMDAtXFx1REQwQ118XFx1RDgzRVtcXHVERkYwLVxcdURGRjldfFxcdUQ4NjlbXFx1REMwMC1cXHVERURGXFx1REYwMC1cXHVERkZGXXxcXHVEODZEW1xcdURDMDAtXFx1REYzOFxcdURGNDAtXFx1REZGRl18XFx1RDg2RVtcXHVEQzAwLVxcdURDMURcXHVEQzIwLVxcdURGRkZdfFxcdUQ4NzNbXFx1REMwMC1cXHVERUExXFx1REVCMC1cXHVERkZGXXxcXHVEODdBW1xcdURDMDAtXFx1REZFMF18XFx1RDg3RVtcXHVEQzAwLVxcdURFMURdfFxcdUQ4ODRbXFx1REMwMC1cXHVERjRBXSkvKSkgcmV0dXJuO1xuICAgICAgdmFyIG5leHRDaGFyID0gbWF0Y2hbMV0gfHwgbWF0Y2hbMl0gfHwgJyc7XG5cbiAgICAgIGlmICghbmV4dENoYXIgfHwgbmV4dENoYXIgJiYgKHByZXZDaGFyID09PSAnJyB8fCB0aGlzLnJ1bGVzLmlubGluZS5wdW5jdHVhdGlvbi5leGVjKHByZXZDaGFyKSkpIHtcbiAgICAgICAgdmFyIGxMZW5ndGggPSBtYXRjaFswXS5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgckRlbGltLFxuICAgICAgICAgICAgckxlbmd0aCxcbiAgICAgICAgICAgIGRlbGltVG90YWwgPSBsTGVuZ3RoLFxuICAgICAgICAgICAgbWlkRGVsaW1Ub3RhbCA9IDA7XG4gICAgICAgIHZhciBlbmRSZWcgPSBtYXRjaFswXVswXSA9PT0gJyonID8gdGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmcuckRlbGltQXN0IDogdGhpcy5ydWxlcy5pbmxpbmUuZW1TdHJvbmcuckRlbGltVW5kO1xuICAgICAgICBlbmRSZWcubGFzdEluZGV4ID0gMDsgLy8gQ2xpcCBtYXNrZWRTcmMgdG8gc2FtZSBzZWN0aW9uIG9mIHN0cmluZyBhcyBzcmMgKG1vdmUgdG8gbGV4ZXI/KVxuXG4gICAgICAgIG1hc2tlZFNyYyA9IG1hc2tlZFNyYy5zbGljZSgtMSAqIHNyYy5sZW5ndGggKyBsTGVuZ3RoKTtcblxuICAgICAgICB3aGlsZSAoKG1hdGNoID0gZW5kUmVnLmV4ZWMobWFza2VkU3JjKSkgIT0gbnVsbCkge1xuICAgICAgICAgIHJEZWxpbSA9IG1hdGNoWzFdIHx8IG1hdGNoWzJdIHx8IG1hdGNoWzNdIHx8IG1hdGNoWzRdIHx8IG1hdGNoWzVdIHx8IG1hdGNoWzZdO1xuICAgICAgICAgIGlmICghckRlbGltKSBjb250aW51ZTsgLy8gc2tpcCBzaW5nbGUgKiBpbiBfX2FiYyphYmNfX1xuXG4gICAgICAgICAgckxlbmd0aCA9IHJEZWxpbS5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAobWF0Y2hbM10gfHwgbWF0Y2hbNF0pIHtcbiAgICAgICAgICAgIC8vIGZvdW5kIGFub3RoZXIgTGVmdCBEZWxpbVxuICAgICAgICAgICAgZGVsaW1Ub3RhbCArPSByTGVuZ3RoO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChtYXRjaFs1XSB8fCBtYXRjaFs2XSkge1xuICAgICAgICAgICAgLy8gZWl0aGVyIExlZnQgb3IgUmlnaHQgRGVsaW1cbiAgICAgICAgICAgIGlmIChsTGVuZ3RoICUgMyAmJiAhKChsTGVuZ3RoICsgckxlbmd0aCkgJSAzKSkge1xuICAgICAgICAgICAgICBtaWREZWxpbVRvdGFsICs9IHJMZW5ndGg7XG4gICAgICAgICAgICAgIGNvbnRpbnVlOyAvLyBDb21tb25NYXJrIEVtcGhhc2lzIFJ1bGVzIDktMTBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZWxpbVRvdGFsIC09IHJMZW5ndGg7XG4gICAgICAgICAgaWYgKGRlbGltVG90YWwgPiAwKSBjb250aW51ZTsgLy8gSGF2ZW4ndCBmb3VuZCBlbm91Z2ggY2xvc2luZyBkZWxpbWl0ZXJzXG4gICAgICAgICAgLy8gUmVtb3ZlIGV4dHJhIGNoYXJhY3RlcnMuICphKioqIC0+ICphKlxuXG4gICAgICAgICAgckxlbmd0aCA9IE1hdGgubWluKHJMZW5ndGgsIHJMZW5ndGggKyBkZWxpbVRvdGFsICsgbWlkRGVsaW1Ub3RhbCk7IC8vIENyZWF0ZSBgZW1gIGlmIHNtYWxsZXN0IGRlbGltaXRlciBoYXMgb2RkIGNoYXIgY291bnQuICphKioqXG5cbiAgICAgICAgICBpZiAoTWF0aC5taW4obExlbmd0aCwgckxlbmd0aCkgJSAyKSB7XG4gICAgICAgICAgICB2YXIgX3RleHQgPSBzcmMuc2xpY2UoMSwgbExlbmd0aCArIG1hdGNoLmluZGV4ICsgckxlbmd0aCk7XG5cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHR5cGU6ICdlbScsXG4gICAgICAgICAgICAgIHJhdzogc3JjLnNsaWNlKDAsIGxMZW5ndGggKyBtYXRjaC5pbmRleCArIHJMZW5ndGggKyAxKSxcbiAgICAgICAgICAgICAgdGV4dDogX3RleHQsXG4gICAgICAgICAgICAgIHRva2VuczogdGhpcy5sZXhlci5pbmxpbmVUb2tlbnMoX3RleHQsIFtdKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IC8vIENyZWF0ZSAnc3Ryb25nJyBpZiBzbWFsbGVzdCBkZWxpbWl0ZXIgaGFzIGV2ZW4gY2hhciBjb3VudC4gKiphKioqXG5cblxuICAgICAgICAgIHZhciB0ZXh0ID0gc3JjLnNsaWNlKDIsIGxMZW5ndGggKyBtYXRjaC5pbmRleCArIHJMZW5ndGggLSAxKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogJ3N0cm9uZycsXG4gICAgICAgICAgICByYXc6IHNyYy5zbGljZSgwLCBsTGVuZ3RoICsgbWF0Y2guaW5kZXggKyByTGVuZ3RoICsgMSksXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgICAgdG9rZW5zOiB0aGlzLmxleGVyLmlubGluZVRva2Vucyh0ZXh0LCBbXSlcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5jb2Rlc3BhbiA9IGZ1bmN0aW9uIGNvZGVzcGFuKHNyYykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLmNvZGUuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gY2FwWzJdLnJlcGxhY2UoL1xcbi9nLCAnICcpO1xuICAgICAgICB2YXIgaGFzTm9uU3BhY2VDaGFycyA9IC9bXiBdLy50ZXN0KHRleHQpO1xuICAgICAgICB2YXIgaGFzU3BhY2VDaGFyc09uQm90aEVuZHMgPSAvXiAvLnRlc3QodGV4dCkgJiYgLyAkLy50ZXN0KHRleHQpO1xuXG4gICAgICAgIGlmIChoYXNOb25TcGFjZUNoYXJzICYmIGhhc1NwYWNlQ2hhcnNPbkJvdGhFbmRzKSB7XG4gICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyaW5nKDEsIHRleHQubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZXh0ID0gZXNjYXBlKHRleHQsIHRydWUpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdjb2Rlc3BhbicsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uYnIgPSBmdW5jdGlvbiBicihzcmMpIHtcbiAgICAgIHZhciBjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS5ici5leGVjKHNyYyk7XG5cbiAgICAgIGlmIChjYXApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnYnInLFxuICAgICAgICAgIHJhdzogY2FwWzBdXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5kZWwgPSBmdW5jdGlvbiBkZWwoc3JjKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUuZGVsLmV4ZWMoc3JjKTtcblxuICAgICAgaWYgKGNhcCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdkZWwnLFxuICAgICAgICAgIHJhdzogY2FwWzBdLFxuICAgICAgICAgIHRleHQ6IGNhcFsyXSxcbiAgICAgICAgICB0b2tlbnM6IHRoaXMubGV4ZXIuaW5saW5lVG9rZW5zKGNhcFsyXSwgW10pXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by5hdXRvbGluayA9IGZ1bmN0aW9uIGF1dG9saW5rKHNyYywgbWFuZ2xlKSB7XG4gICAgICB2YXIgY2FwID0gdGhpcy5ydWxlcy5pbmxpbmUuYXV0b2xpbmsuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0ZXh0LCBocmVmO1xuXG4gICAgICAgIGlmIChjYXBbMl0gPT09ICdAJykge1xuICAgICAgICAgIHRleHQgPSBlc2NhcGUodGhpcy5vcHRpb25zLm1hbmdsZSA/IG1hbmdsZShjYXBbMV0pIDogY2FwWzFdKTtcbiAgICAgICAgICBocmVmID0gJ21haWx0bzonICsgdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0ZXh0ID0gZXNjYXBlKGNhcFsxXSk7XG4gICAgICAgICAgaHJlZiA9IHRleHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdsaW5rJyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiB0ZXh0LFxuICAgICAgICAgIGhyZWY6IGhyZWYsXG4gICAgICAgICAgdG9rZW5zOiBbe1xuICAgICAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICAgICAgcmF3OiB0ZXh0LFxuICAgICAgICAgICAgdGV4dDogdGV4dFxuICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIF9wcm90by51cmwgPSBmdW5jdGlvbiB1cmwoc3JjLCBtYW5nbGUpIHtcbiAgICAgIHZhciBjYXA7XG5cbiAgICAgIGlmIChjYXAgPSB0aGlzLnJ1bGVzLmlubGluZS51cmwuZXhlYyhzcmMpKSB7XG4gICAgICAgIHZhciB0ZXh0LCBocmVmO1xuXG4gICAgICAgIGlmIChjYXBbMl0gPT09ICdAJykge1xuICAgICAgICAgIHRleHQgPSBlc2NhcGUodGhpcy5vcHRpb25zLm1hbmdsZSA/IG1hbmdsZShjYXBbMF0pIDogY2FwWzBdKTtcbiAgICAgICAgICBocmVmID0gJ21haWx0bzonICsgdGV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkbyBleHRlbmRlZCBhdXRvbGluayBwYXRoIHZhbGlkYXRpb25cbiAgICAgICAgICB2YXIgcHJldkNhcFplcm87XG5cbiAgICAgICAgICBkbyB7XG4gICAgICAgICAgICBwcmV2Q2FwWmVybyA9IGNhcFswXTtcbiAgICAgICAgICAgIGNhcFswXSA9IHRoaXMucnVsZXMuaW5saW5lLl9iYWNrcGVkYWwuZXhlYyhjYXBbMF0pWzBdO1xuICAgICAgICAgIH0gd2hpbGUgKHByZXZDYXBaZXJvICE9PSBjYXBbMF0pO1xuXG4gICAgICAgICAgdGV4dCA9IGVzY2FwZShjYXBbMF0pO1xuXG4gICAgICAgICAgaWYgKGNhcFsxXSA9PT0gJ3d3dy4nKSB7XG4gICAgICAgICAgICBocmVmID0gJ2h0dHA6Ly8nICsgdGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaHJlZiA9IHRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiAnbGluaycsXG4gICAgICAgICAgcmF3OiBjYXBbMF0sXG4gICAgICAgICAgdGV4dDogdGV4dCxcbiAgICAgICAgICBocmVmOiBocmVmLFxuICAgICAgICAgIHRva2VuczogW3tcbiAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgIHJhdzogdGV4dCxcbiAgICAgICAgICAgIHRleHQ6IHRleHRcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICBfcHJvdG8uaW5saW5lVGV4dCA9IGZ1bmN0aW9uIGlubGluZVRleHQoc3JjLCBzbWFydHlwYW50cykge1xuICAgICAgdmFyIGNhcCA9IHRoaXMucnVsZXMuaW5saW5lLnRleHQuZXhlYyhzcmMpO1xuXG4gICAgICBpZiAoY2FwKSB7XG4gICAgICAgIHZhciB0ZXh0O1xuXG4gICAgICAgIGlmICh0aGlzLmxleGVyLnN0YXRlLmluUmF3QmxvY2spIHtcbiAgICAgICAgICB0ZXh0ID0gdGhpcy5vcHRpb25zLnNhbml0aXplID8gdGhpcy5vcHRpb25zLnNhbml0aXplciA/IHRoaXMub3B0aW9ucy5zYW5pdGl6ZXIoY2FwWzBdKSA6IGVzY2FwZShjYXBbMF0pIDogY2FwWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHQgPSBlc2NhcGUodGhpcy5vcHRpb25zLnNtYXJ0eXBhbnRzID8gc21hcnR5cGFudHMoY2FwWzBdKSA6IGNhcFswXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICByYXc6IGNhcFswXSxcbiAgICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBUb2tlbml6ZXI7XG4gIH0oKTtcblxuICAvKipcbiAgICogQmxvY2stTGV2ZWwgR3JhbW1hclxuICAgKi9cblxuICB2YXIgYmxvY2sgPSB7XG4gICAgbmV3bGluZTogL14oPzogKig/OlxcbnwkKSkrLyxcbiAgICBjb2RlOiAvXiggezR9W15cXG5dKyg/Olxcbig/OiAqKD86XFxufCQpKSopPykrLyxcbiAgICBmZW5jZXM6IC9eIHswLDN9KGB7Myx9KD89W15gXFxuXSpcXG4pfH57Myx9KShbXlxcbl0qKVxcbig/OnwoW1xcc1xcU10qPylcXG4pKD86IHswLDN9XFwxW35gXSogKig/PVxcbnwkKXwkKS8sXG4gICAgaHI6IC9eIHswLDN9KCg/Oi0gKil7Myx9fCg/Ol8gKil7Myx9fCg/OlxcKiAqKXszLH0pKD86XFxuK3wkKS8sXG4gICAgaGVhZGluZzogL14gezAsM30oI3sxLDZ9KSg/PVxcc3wkKSguKikoPzpcXG4rfCQpLyxcbiAgICBibG9ja3F1b3RlOiAvXiggezAsM30+ID8ocGFyYWdyYXBofFteXFxuXSopKD86XFxufCQpKSsvLFxuICAgIGxpc3Q6IC9eKCB7MCwzfWJ1bGwpKCBbXlxcbl0rPyk/KD86XFxufCQpLyxcbiAgICBodG1sOiAnXiB7MCwzfSg/OicgLy8gb3B0aW9uYWwgaW5kZW50YXRpb25cbiAgICArICc8KHNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpW1xcXFxzPl1bXFxcXHNcXFxcU10qPyg/OjwvXFxcXDE+W15cXFxcbl0qXFxcXG4rfCQpJyAvLyAoMSlcbiAgICArICd8Y29tbWVudFteXFxcXG5dKihcXFxcbit8JCknIC8vICgyKVxuICAgICsgJ3w8XFxcXD9bXFxcXHNcXFxcU10qPyg/OlxcXFw/PlxcXFxuKnwkKScgLy8gKDMpXG4gICAgKyAnfDwhW0EtWl1bXFxcXHNcXFxcU10qPyg/Oj5cXFxcbip8JCknIC8vICg0KVxuICAgICsgJ3w8IVxcXFxbQ0RBVEFcXFxcW1tcXFxcc1xcXFxTXSo/KD86XFxcXF1cXFxcXT5cXFxcbip8JCknIC8vICg1KVxuICAgICsgJ3w8Lz8odGFnKSg/OiArfFxcXFxufC8/PilbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuICopK1xcXFxufCQpJyAvLyAoNilcbiAgICArICd8PCg/IXNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWEpKFthLXpdW1xcXFx3LV0qKSg/OmF0dHJpYnV0ZSkqPyAqLz8+KD89WyBcXFxcdF0qKD86XFxcXG58JCkpW1xcXFxzXFxcXFNdKj8oPzooPzpcXFxcbiAqKStcXFxcbnwkKScgLy8gKDcpIG9wZW4gdGFnXG4gICAgKyAnfDwvKD8hc2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYSlbYS16XVtcXFxcdy1dKlxcXFxzKj4oPz1bIFxcXFx0XSooPzpcXFxcbnwkKSlbXFxcXHNcXFxcU10qPyg/Oig/OlxcXFxuICopK1xcXFxufCQpJyAvLyAoNykgY2xvc2luZyB0YWdcbiAgICArICcpJyxcbiAgICBkZWY6IC9eIHswLDN9XFxbKGxhYmVsKVxcXTogKlxcbj8gKjw/KFteXFxzPl0rKT4/KD86KD86ICtcXG4/ICp8ICpcXG4gKikodGl0bGUpKT8gKig/Olxcbit8JCkvLFxuICAgIHRhYmxlOiBub29wVGVzdCxcbiAgICBsaGVhZGluZzogL14oW15cXG5dKylcXG4gezAsM30oPSt8LSspICooPzpcXG4rfCQpLyxcbiAgICAvLyByZWdleCB0ZW1wbGF0ZSwgcGxhY2Vob2xkZXJzIHdpbGwgYmUgcmVwbGFjZWQgYWNjb3JkaW5nIHRvIGRpZmZlcmVudCBwYXJhZ3JhcGhcbiAgICAvLyBpbnRlcnJ1cHRpb24gcnVsZXMgb2YgY29tbW9ubWFyayBhbmQgdGhlIG9yaWdpbmFsIG1hcmtkb3duIHNwZWM6XG4gICAgX3BhcmFncmFwaDogL14oW15cXG5dKyg/Olxcbig/IWhyfGhlYWRpbmd8bGhlYWRpbmd8YmxvY2txdW90ZXxmZW5jZXN8bGlzdHxodG1sfHRhYmxlfCArXFxuKVteXFxuXSspKikvLFxuICAgIHRleHQ6IC9eW15cXG5dKy9cbiAgfTtcbiAgYmxvY2suX2xhYmVsID0gLyg/IVxccypcXF0pKD86XFxcXFtcXFtcXF1dfFteXFxbXFxdXSkrLztcbiAgYmxvY2suX3RpdGxlID0gLyg/OlwiKD86XFxcXFwiP3xbXlwiXFxcXF0pKlwifCdbXidcXG5dKig/OlxcblteJ1xcbl0rKSpcXG4/J3xcXChbXigpXSpcXCkpLztcbiAgYmxvY2suZGVmID0gZWRpdChibG9jay5kZWYpLnJlcGxhY2UoJ2xhYmVsJywgYmxvY2suX2xhYmVsKS5yZXBsYWNlKCd0aXRsZScsIGJsb2NrLl90aXRsZSkuZ2V0UmVnZXgoKTtcbiAgYmxvY2suYnVsbGV0ID0gLyg/OlsqKy1dfFxcZHsxLDl9Wy4pXSkvO1xuICBibG9jay5saXN0SXRlbVN0YXJ0ID0gZWRpdCgvXiggKikoYnVsbCkgKi8pLnJlcGxhY2UoJ2J1bGwnLCBibG9jay5idWxsZXQpLmdldFJlZ2V4KCk7XG4gIGJsb2NrLmxpc3QgPSBlZGl0KGJsb2NrLmxpc3QpLnJlcGxhY2UoL2J1bGwvZywgYmxvY2suYnVsbGV0KS5yZXBsYWNlKCdocicsICdcXFxcbisoPz1cXFxcMT8oPzooPzotICopezMsfXwoPzpfICopezMsfXwoPzpcXFxcKiAqKXszLH0pKD86XFxcXG4rfCQpKScpLnJlcGxhY2UoJ2RlZicsICdcXFxcbisoPz0nICsgYmxvY2suZGVmLnNvdXJjZSArICcpJykuZ2V0UmVnZXgoKTtcbiAgYmxvY2suX3RhZyA9ICdhZGRyZXNzfGFydGljbGV8YXNpZGV8YmFzZXxiYXNlZm9udHxibG9ja3F1b3RlfGJvZHl8Y2FwdGlvbicgKyAnfGNlbnRlcnxjb2x8Y29sZ3JvdXB8ZGR8ZGV0YWlsc3xkaWFsb2d8ZGlyfGRpdnxkbHxkdHxmaWVsZHNldHxmaWdjYXB0aW9uJyArICd8ZmlndXJlfGZvb3Rlcnxmb3JtfGZyYW1lfGZyYW1lc2V0fGhbMS02XXxoZWFkfGhlYWRlcnxocnxodG1sfGlmcmFtZScgKyAnfGxlZ2VuZHxsaXxsaW5rfG1haW58bWVudXxtZW51aXRlbXxtZXRhfG5hdnxub2ZyYW1lc3xvbHxvcHRncm91cHxvcHRpb24nICsgJ3xwfHBhcmFtfHNlY3Rpb258c291cmNlfHN1bW1hcnl8dGFibGV8dGJvZHl8dGR8dGZvb3R8dGh8dGhlYWR8dGl0bGV8dHInICsgJ3x0cmFja3x1bCc7XG4gIGJsb2NrLl9jb21tZW50ID0gLzwhLS0oPyEtPz4pW1xcc1xcU10qPyg/Oi0tPnwkKS87XG4gIGJsb2NrLmh0bWwgPSBlZGl0KGJsb2NrLmh0bWwsICdpJykucmVwbGFjZSgnY29tbWVudCcsIGJsb2NrLl9jb21tZW50KS5yZXBsYWNlKCd0YWcnLCBibG9jay5fdGFnKS5yZXBsYWNlKCdhdHRyaWJ1dGUnLCAvICtbYS16QS1aOl9dW1xcdy46LV0qKD86ICo9ICpcIlteXCJcXG5dKlwifCAqPSAqJ1teJ1xcbl0qJ3wgKj0gKlteXFxzXCInPTw+YF0rKT8vKS5nZXRSZWdleCgpO1xuICBibG9jay5wYXJhZ3JhcGggPSBlZGl0KGJsb2NrLl9wYXJhZ3JhcGgpLnJlcGxhY2UoJ2hyJywgYmxvY2suaHIpLnJlcGxhY2UoJ2hlYWRpbmcnLCAnIHswLDN9I3sxLDZ9ICcpLnJlcGxhY2UoJ3xsaGVhZGluZycsICcnKSAvLyBzZXRleCBoZWFkaW5ncyBkb24ndCBpbnRlcnJ1cHQgY29tbW9ubWFyayBwYXJhZ3JhcGhzXG4gIC5yZXBsYWNlKCd8dGFibGUnLCAnJykucmVwbGFjZSgnYmxvY2txdW90ZScsICcgezAsM30+JykucmVwbGFjZSgnZmVuY2VzJywgJyB7MCwzfSg/OmB7Myx9KD89W15gXFxcXG5dKlxcXFxuKXx+ezMsfSlbXlxcXFxuXSpcXFxcbicpLnJlcGxhY2UoJ2xpc3QnLCAnIHswLDN9KD86WyorLV18MVsuKV0pICcpIC8vIG9ubHkgbGlzdHMgc3RhcnRpbmcgZnJvbSAxIGNhbiBpbnRlcnJ1cHRcbiAgLnJlcGxhY2UoJ2h0bWwnLCAnPC8/KD86dGFnKSg/OiArfFxcXFxufC8/Pil8PCg/OnNjcmlwdHxwcmV8c3R5bGV8dGV4dGFyZWF8IS0tKScpLnJlcGxhY2UoJ3RhZycsIGJsb2NrLl90YWcpIC8vIHBhcnMgY2FuIGJlIGludGVycnVwdGVkIGJ5IHR5cGUgKDYpIGh0bWwgYmxvY2tzXG4gIC5nZXRSZWdleCgpO1xuICBibG9jay5ibG9ja3F1b3RlID0gZWRpdChibG9jay5ibG9ja3F1b3RlKS5yZXBsYWNlKCdwYXJhZ3JhcGgnLCBibG9jay5wYXJhZ3JhcGgpLmdldFJlZ2V4KCk7XG4gIC8qKlxuICAgKiBOb3JtYWwgQmxvY2sgR3JhbW1hclxuICAgKi9cblxuICBibG9jay5ub3JtYWwgPSBtZXJnZSh7fSwgYmxvY2spO1xuICAvKipcbiAgICogR0ZNIEJsb2NrIEdyYW1tYXJcbiAgICovXG5cbiAgYmxvY2suZ2ZtID0gbWVyZ2Uoe30sIGJsb2NrLm5vcm1hbCwge1xuICAgIHRhYmxlOiAnXiAqKFteXFxcXG4gXS4qXFxcXHwuKilcXFxcbicgLy8gSGVhZGVyXG4gICAgKyAnIHswLDN9KD86XFxcXHwgKik/KDo/LSs6PyAqKD86XFxcXHwgKjo/LSs6PyAqKSopKD86XFxcXHwgKik/JyAvLyBBbGlnblxuICAgICsgJyg/OlxcXFxuKCg/Oig/ISAqXFxcXG58aHJ8aGVhZGluZ3xibG9ja3F1b3RlfGNvZGV8ZmVuY2VzfGxpc3R8aHRtbCkuKig/OlxcXFxufCQpKSopXFxcXG4qfCQpJyAvLyBDZWxsc1xuXG4gIH0pO1xuICBibG9jay5nZm0udGFibGUgPSBlZGl0KGJsb2NrLmdmbS50YWJsZSkucmVwbGFjZSgnaHInLCBibG9jay5ocikucmVwbGFjZSgnaGVhZGluZycsICcgezAsM30jezEsNn0gJykucmVwbGFjZSgnYmxvY2txdW90ZScsICcgezAsM30+JykucmVwbGFjZSgnY29kZScsICcgezR9W15cXFxcbl0nKS5yZXBsYWNlKCdmZW5jZXMnLCAnIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuJykucmVwbGFjZSgnbGlzdCcsICcgezAsM30oPzpbKistXXwxWy4pXSkgJykgLy8gb25seSBsaXN0cyBzdGFydGluZyBmcm9tIDEgY2FuIGludGVycnVwdFxuICAucmVwbGFjZSgnaHRtbCcsICc8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pJykucmVwbGFjZSgndGFnJywgYmxvY2suX3RhZykgLy8gdGFibGVzIGNhbiBiZSBpbnRlcnJ1cHRlZCBieSB0eXBlICg2KSBodG1sIGJsb2Nrc1xuICAuZ2V0UmVnZXgoKTtcbiAgYmxvY2suZ2ZtLnBhcmFncmFwaCA9IGVkaXQoYmxvY2suX3BhcmFncmFwaCkucmVwbGFjZSgnaHInLCBibG9jay5ocikucmVwbGFjZSgnaGVhZGluZycsICcgezAsM30jezEsNn0gJykucmVwbGFjZSgnfGxoZWFkaW5nJywgJycpIC8vIHNldGV4IGhlYWRpbmdzIGRvbid0IGludGVycnVwdCBjb21tb25tYXJrIHBhcmFncmFwaHNcbiAgLnJlcGxhY2UoJ3RhYmxlJywgYmxvY2suZ2ZtLnRhYmxlKSAvLyBpbnRlcnJ1cHQgcGFyYWdyYXBocyB3aXRoIHRhYmxlXG4gIC5yZXBsYWNlKCdibG9ja3F1b3RlJywgJyB7MCwzfT4nKS5yZXBsYWNlKCdmZW5jZXMnLCAnIHswLDN9KD86YHszLH0oPz1bXmBcXFxcbl0qXFxcXG4pfH57Myx9KVteXFxcXG5dKlxcXFxuJykucmVwbGFjZSgnbGlzdCcsICcgezAsM30oPzpbKistXXwxWy4pXSkgJykgLy8gb25seSBsaXN0cyBzdGFydGluZyBmcm9tIDEgY2FuIGludGVycnVwdFxuICAucmVwbGFjZSgnaHRtbCcsICc8Lz8oPzp0YWcpKD86ICt8XFxcXG58Lz8+KXw8KD86c2NyaXB0fHByZXxzdHlsZXx0ZXh0YXJlYXwhLS0pJykucmVwbGFjZSgndGFnJywgYmxvY2suX3RhZykgLy8gcGFycyBjYW4gYmUgaW50ZXJydXB0ZWQgYnkgdHlwZSAoNikgaHRtbCBibG9ja3NcbiAgLmdldFJlZ2V4KCk7XG4gIC8qKlxuICAgKiBQZWRhbnRpYyBncmFtbWFyIChvcmlnaW5hbCBKb2huIEdydWJlcidzIGxvb3NlIG1hcmtkb3duIHNwZWNpZmljYXRpb24pXG4gICAqL1xuXG4gIGJsb2NrLnBlZGFudGljID0gbWVyZ2Uoe30sIGJsb2NrLm5vcm1hbCwge1xuICAgIGh0bWw6IGVkaXQoJ14gKig/OmNvbW1lbnQgKig/OlxcXFxufFxcXFxzKiQpJyArICd8PCh0YWcpW1xcXFxzXFxcXFNdKz88L1xcXFwxPiAqKD86XFxcXG57Mix9fFxcXFxzKiQpJyAvLyBjbG9zZWQgdGFnXG4gICAgKyAnfDx0YWcoPzpcIlteXCJdKlwifFxcJ1teXFwnXSpcXCd8XFxcXHNbXlxcJ1wiLz5cXFxcc10qKSo/Lz8+ICooPzpcXFxcbnsyLH18XFxcXHMqJCkpJykucmVwbGFjZSgnY29tbWVudCcsIGJsb2NrLl9jb21tZW50KS5yZXBsYWNlKC90YWcvZywgJyg/ISg/OicgKyAnYXxlbXxzdHJvbmd8c21hbGx8c3xjaXRlfHF8ZGZufGFiYnJ8ZGF0YXx0aW1lfGNvZGV8dmFyfHNhbXB8a2JkfHN1YicgKyAnfHN1cHxpfGJ8dXxtYXJrfHJ1Ynl8cnR8cnB8YmRpfGJkb3xzcGFufGJyfHdicnxpbnN8ZGVsfGltZyknICsgJ1xcXFxiKVxcXFx3Kyg/ITp8W15cXFxcd1xcXFxzQF0qQClcXFxcYicpLmdldFJlZ2V4KCksXG4gICAgZGVmOiAvXiAqXFxbKFteXFxdXSspXFxdOiAqPD8oW15cXHM+XSspPj8oPzogKyhbXCIoXVteXFxuXStbXCIpXSkpPyAqKD86XFxuK3wkKS8sXG4gICAgaGVhZGluZzogL14oI3sxLDZ9KSguKikoPzpcXG4rfCQpLyxcbiAgICBmZW5jZXM6IG5vb3BUZXN0LFxuICAgIC8vIGZlbmNlcyBub3Qgc3VwcG9ydGVkXG4gICAgcGFyYWdyYXBoOiBlZGl0KGJsb2NrLm5vcm1hbC5fcGFyYWdyYXBoKS5yZXBsYWNlKCdocicsIGJsb2NrLmhyKS5yZXBsYWNlKCdoZWFkaW5nJywgJyAqI3sxLDZ9ICpbXlxcbl0nKS5yZXBsYWNlKCdsaGVhZGluZycsIGJsb2NrLmxoZWFkaW5nKS5yZXBsYWNlKCdibG9ja3F1b3RlJywgJyB7MCwzfT4nKS5yZXBsYWNlKCd8ZmVuY2VzJywgJycpLnJlcGxhY2UoJ3xsaXN0JywgJycpLnJlcGxhY2UoJ3xodG1sJywgJycpLmdldFJlZ2V4KClcbiAgfSk7XG4gIC8qKlxuICAgKiBJbmxpbmUtTGV2ZWwgR3JhbW1hclxuICAgKi9cblxuICB2YXIgaW5saW5lID0ge1xuICAgIGVzY2FwZTogL15cXFxcKFshXCIjJCUmJygpKissXFwtLi86Ozw9Pj9AXFxbXFxdXFxcXF5fYHt8fX5dKS8sXG4gICAgYXV0b2xpbms6IC9ePChzY2hlbWU6W15cXHNcXHgwMC1cXHgxZjw+XSp8ZW1haWwpPi8sXG4gICAgdXJsOiBub29wVGVzdCxcbiAgICB0YWc6ICdeY29tbWVudCcgKyAnfF48L1thLXpBLVpdW1xcXFx3Oi1dKlxcXFxzKj4nIC8vIHNlbGYtY2xvc2luZyB0YWdcbiAgICArICd8XjxbYS16QS1aXVtcXFxcdy1dKig/OmF0dHJpYnV0ZSkqP1xcXFxzKi8/PicgLy8gb3BlbiB0YWdcbiAgICArICd8XjxcXFxcP1tcXFxcc1xcXFxTXSo/XFxcXD8+JyAvLyBwcm9jZXNzaW5nIGluc3RydWN0aW9uLCBlLmcuIDw/cGhwID8+XG4gICAgKyAnfF48IVthLXpBLVpdK1xcXFxzW1xcXFxzXFxcXFNdKj8+JyAvLyBkZWNsYXJhdGlvbiwgZS5nLiA8IURPQ1RZUEUgaHRtbD5cbiAgICArICd8XjwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPicsXG4gICAgLy8gQ0RBVEEgc2VjdGlvblxuICAgIGxpbms6IC9eIT9cXFsobGFiZWwpXFxdXFwoXFxzKihocmVmKSg/OlxccysodGl0bGUpKT9cXHMqXFwpLyxcbiAgICByZWZsaW5rOiAvXiE/XFxbKGxhYmVsKVxcXVxcWyg/IVxccypcXF0pKCg/OlxcXFxbXFxbXFxdXT98W15cXFtcXF1cXFxcXSkrKVxcXS8sXG4gICAgbm9saW5rOiAvXiE/XFxbKD8hXFxzKlxcXSkoKD86XFxbW15cXFtcXF1dKlxcXXxcXFxcW1xcW1xcXV18W15cXFtcXF1dKSopXFxdKD86XFxbXFxdKT8vLFxuICAgIHJlZmxpbmtTZWFyY2g6ICdyZWZsaW5rfG5vbGluayg/IVxcXFwoKScsXG4gICAgZW1TdHJvbmc6IHtcbiAgICAgIGxEZWxpbTogL14oPzpcXCorKD86KFtwdW5jdF9dKXxbXlxccypdKSl8Xl8rKD86KFtwdW5jdCpdKXwoW15cXHNfXSkpLyxcbiAgICAgIC8vICAgICAgICAoMSkgYW5kICgyKSBjYW4gb25seSBiZSBhIFJpZ2h0IERlbGltaXRlci4gKDMpIGFuZCAoNCkgY2FuIG9ubHkgYmUgTGVmdC4gICg1KSBhbmQgKDYpIGNhbiBiZSBlaXRoZXIgTGVmdCBvciBSaWdodC5cbiAgICAgIC8vICAgICAgICAoKSBTa2lwIG9ycGhhbiBkZWxpbSBpbnNpZGUgc3Ryb25nICAgICgxKSAjKioqICAgICAgICAgICAgICAgICgyKSBhKioqIywgYSoqKiAgICAgICAgICAgICAgICAgICAoMykgIyoqKmEsICoqKmEgICAgICAgICAgICAgICAgICg0KSAqKiojICAgICAgICAgICAgICAoNSkgIyoqKiMgICAgICAgICAgICAgICAgICg2KSBhKioqYVxuICAgICAgckRlbGltQXN0OiAvXlteXypdKj9cXF9cXF9bXl8qXSo/XFwqW15fKl0qPyg/PVxcX1xcXyl8W3B1bmN0X10oXFwqKykoPz1bXFxzXXwkKXxbXnB1bmN0Kl9cXHNdKFxcKispKD89W3B1bmN0X1xcc118JCl8W3B1bmN0X1xcc10oXFwqKykoPz1bXnB1bmN0Kl9cXHNdKXxbXFxzXShcXCorKSg/PVtwdW5jdF9dKXxbcHVuY3RfXShcXCorKSg/PVtwdW5jdF9dKXxbXnB1bmN0Kl9cXHNdKFxcKispKD89W15wdW5jdCpfXFxzXSkvLFxuICAgICAgckRlbGltVW5kOiAvXlteXypdKj9cXCpcXCpbXl8qXSo/XFxfW15fKl0qPyg/PVxcKlxcKil8W3B1bmN0Kl0oXFxfKykoPz1bXFxzXXwkKXxbXnB1bmN0Kl9cXHNdKFxcXyspKD89W3B1bmN0Klxcc118JCl8W3B1bmN0Klxcc10oXFxfKykoPz1bXnB1bmN0Kl9cXHNdKXxbXFxzXShcXF8rKSg/PVtwdW5jdCpdKXxbcHVuY3QqXShcXF8rKSg/PVtwdW5jdCpdKS8gLy8gXi0gTm90IGFsbG93ZWQgZm9yIF9cblxuICAgIH0sXG4gICAgY29kZTogL14oYCspKFteYF18W15gXVtcXHNcXFNdKj9bXmBdKVxcMSg/IWApLyxcbiAgICBicjogL14oIHsyLH18XFxcXClcXG4oPyFcXHMqJCkvLFxuICAgIGRlbDogbm9vcFRlc3QsXG4gICAgdGV4dDogL14oYCt8W15gXSkoPzooPz0gezIsfVxcbil8W1xcc1xcU10qPyg/Oig/PVtcXFxcPCFcXFtgKl9dfFxcYl98JCl8W14gXSg/PSB7Mix9XFxuKSkpLyxcbiAgICBwdW5jdHVhdGlvbjogL14oW1xcc3B1bmN0dWF0aW9uXSkvXG4gIH07IC8vIGxpc3Qgb2YgcHVuY3R1YXRpb24gbWFya3MgZnJvbSBDb21tb25NYXJrIHNwZWNcbiAgLy8gd2l0aG91dCAqIGFuZCBfIHRvIGhhbmRsZSB0aGUgZGlmZmVyZW50IGVtcGhhc2lzIG1hcmtlcnMgKiBhbmQgX1xuXG4gIGlubGluZS5fcHVuY3R1YXRpb24gPSAnIVwiIyQlJlxcJygpK1xcXFwtLiwvOjs8PT4/QFxcXFxbXFxcXF1gXnt8fX4nO1xuICBpbmxpbmUucHVuY3R1YXRpb24gPSBlZGl0KGlubGluZS5wdW5jdHVhdGlvbikucmVwbGFjZSgvcHVuY3R1YXRpb24vZywgaW5saW5lLl9wdW5jdHVhdGlvbikuZ2V0UmVnZXgoKTsgLy8gc2VxdWVuY2VzIGVtIHNob3VsZCBza2lwIG92ZXIgW3RpdGxlXShsaW5rKSwgYGNvZGVgLCA8aHRtbD5cblxuICBpbmxpbmUuYmxvY2tTa2lwID0gL1xcW1teXFxdXSo/XFxdXFwoW15cXCldKj9cXCl8YFteYF0qP2B8PFtePl0qPz4vZztcbiAgaW5saW5lLmVzY2FwZWRFbVN0ID0gL1xcXFxcXCp8XFxcXF8vZztcbiAgaW5saW5lLl9jb21tZW50ID0gZWRpdChibG9jay5fY29tbWVudCkucmVwbGFjZSgnKD86LS0+fCQpJywgJy0tPicpLmdldFJlZ2V4KCk7XG4gIGlubGluZS5lbVN0cm9uZy5sRGVsaW0gPSBlZGl0KGlubGluZS5lbVN0cm9uZy5sRGVsaW0pLnJlcGxhY2UoL3B1bmN0L2csIGlubGluZS5fcHVuY3R1YXRpb24pLmdldFJlZ2V4KCk7XG4gIGlubGluZS5lbVN0cm9uZy5yRGVsaW1Bc3QgPSBlZGl0KGlubGluZS5lbVN0cm9uZy5yRGVsaW1Bc3QsICdnJykucmVwbGFjZSgvcHVuY3QvZywgaW5saW5lLl9wdW5jdHVhdGlvbikuZ2V0UmVnZXgoKTtcbiAgaW5saW5lLmVtU3Ryb25nLnJEZWxpbVVuZCA9IGVkaXQoaW5saW5lLmVtU3Ryb25nLnJEZWxpbVVuZCwgJ2cnKS5yZXBsYWNlKC9wdW5jdC9nLCBpbmxpbmUuX3B1bmN0dWF0aW9uKS5nZXRSZWdleCgpO1xuICBpbmxpbmUuX2VzY2FwZXMgPSAvXFxcXChbIVwiIyQlJicoKSorLFxcLS4vOjs8PT4/QFxcW1xcXVxcXFxeX2B7fH1+XSkvZztcbiAgaW5saW5lLl9zY2hlbWUgPSAvW2EtekEtWl1bYS16QS1aMC05Ky4tXXsxLDMxfS87XG4gIGlubGluZS5fZW1haWwgPSAvW2EtekEtWjAtOS4hIyQlJicqKy89P15fYHt8fX4tXSsoQClbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKyg/IVstX10pLztcbiAgaW5saW5lLmF1dG9saW5rID0gZWRpdChpbmxpbmUuYXV0b2xpbmspLnJlcGxhY2UoJ3NjaGVtZScsIGlubGluZS5fc2NoZW1lKS5yZXBsYWNlKCdlbWFpbCcsIGlubGluZS5fZW1haWwpLmdldFJlZ2V4KCk7XG4gIGlubGluZS5fYXR0cmlidXRlID0gL1xccytbYS16QS1aOl9dW1xcdy46LV0qKD86XFxzKj1cXHMqXCJbXlwiXSpcInxcXHMqPVxccyonW14nXSonfFxccyo9XFxzKlteXFxzXCInPTw+YF0rKT8vO1xuICBpbmxpbmUudGFnID0gZWRpdChpbmxpbmUudGFnKS5yZXBsYWNlKCdjb21tZW50JywgaW5saW5lLl9jb21tZW50KS5yZXBsYWNlKCdhdHRyaWJ1dGUnLCBpbmxpbmUuX2F0dHJpYnV0ZSkuZ2V0UmVnZXgoKTtcbiAgaW5saW5lLl9sYWJlbCA9IC8oPzpcXFsoPzpcXFxcLnxbXlxcW1xcXVxcXFxdKSpcXF18XFxcXC58YFteYF0qYHxbXlxcW1xcXVxcXFxgXSkqPy87XG4gIGlubGluZS5faHJlZiA9IC88KD86XFxcXC58W15cXG48PlxcXFxdKSs+fFteXFxzXFx4MDAtXFx4MWZdKi87XG4gIGlubGluZS5fdGl0bGUgPSAvXCIoPzpcXFxcXCI/fFteXCJcXFxcXSkqXCJ8Jyg/OlxcXFwnP3xbXidcXFxcXSkqJ3xcXCgoPzpcXFxcXFwpP3xbXilcXFxcXSkqXFwpLztcbiAgaW5saW5lLmxpbmsgPSBlZGl0KGlubGluZS5saW5rKS5yZXBsYWNlKCdsYWJlbCcsIGlubGluZS5fbGFiZWwpLnJlcGxhY2UoJ2hyZWYnLCBpbmxpbmUuX2hyZWYpLnJlcGxhY2UoJ3RpdGxlJywgaW5saW5lLl90aXRsZSkuZ2V0UmVnZXgoKTtcbiAgaW5saW5lLnJlZmxpbmsgPSBlZGl0KGlubGluZS5yZWZsaW5rKS5yZXBsYWNlKCdsYWJlbCcsIGlubGluZS5fbGFiZWwpLmdldFJlZ2V4KCk7XG4gIGlubGluZS5yZWZsaW5rU2VhcmNoID0gZWRpdChpbmxpbmUucmVmbGlua1NlYXJjaCwgJ2cnKS5yZXBsYWNlKCdyZWZsaW5rJywgaW5saW5lLnJlZmxpbmspLnJlcGxhY2UoJ25vbGluaycsIGlubGluZS5ub2xpbmspLmdldFJlZ2V4KCk7XG4gIC8qKlxuICAgKiBOb3JtYWwgSW5saW5lIEdyYW1tYXJcbiAgICovXG5cbiAgaW5saW5lLm5vcm1hbCA9IG1lcmdlKHt9LCBpbmxpbmUpO1xuICAvKipcbiAgICogUGVkYW50aWMgSW5saW5lIEdyYW1tYXJcbiAgICovXG5cbiAgaW5saW5lLnBlZGFudGljID0gbWVyZ2Uoe30sIGlubGluZS5ub3JtYWwsIHtcbiAgICBzdHJvbmc6IHtcbiAgICAgIHN0YXJ0OiAvXl9ffFxcKlxcKi8sXG4gICAgICBtaWRkbGU6IC9eX18oPz1cXFMpKFtcXHNcXFNdKj9cXFMpX18oPyFfKXxeXFwqXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKlxcKig/IVxcKikvLFxuICAgICAgZW5kQXN0OiAvXFwqXFwqKD8hXFwqKS9nLFxuICAgICAgZW5kVW5kOiAvX18oPyFfKS9nXG4gICAgfSxcbiAgICBlbToge1xuICAgICAgc3RhcnQ6IC9eX3xcXCovLFxuICAgICAgbWlkZGxlOiAvXigpXFwqKD89XFxTKShbXFxzXFxTXSo/XFxTKVxcKig/IVxcKil8Xl8oPz1cXFMpKFtcXHNcXFNdKj9cXFMpXyg/IV8pLyxcbiAgICAgIGVuZEFzdDogL1xcKig/IVxcKikvZyxcbiAgICAgIGVuZFVuZDogL18oPyFfKS9nXG4gICAgfSxcbiAgICBsaW5rOiBlZGl0KC9eIT9cXFsobGFiZWwpXFxdXFwoKC4qPylcXCkvKS5yZXBsYWNlKCdsYWJlbCcsIGlubGluZS5fbGFiZWwpLmdldFJlZ2V4KCksXG4gICAgcmVmbGluazogZWRpdCgvXiE/XFxbKGxhYmVsKVxcXVxccypcXFsoW15cXF1dKilcXF0vKS5yZXBsYWNlKCdsYWJlbCcsIGlubGluZS5fbGFiZWwpLmdldFJlZ2V4KClcbiAgfSk7XG4gIC8qKlxuICAgKiBHRk0gSW5saW5lIEdyYW1tYXJcbiAgICovXG5cbiAgaW5saW5lLmdmbSA9IG1lcmdlKHt9LCBpbmxpbmUubm9ybWFsLCB7XG4gICAgZXNjYXBlOiBlZGl0KGlubGluZS5lc2NhcGUpLnJlcGxhY2UoJ10pJywgJ358XSknKS5nZXRSZWdleCgpLFxuICAgIF9leHRlbmRlZF9lbWFpbDogL1tBLVphLXowLTkuXystXSsoQClbYS16QS1aMC05LV9dKyg/OlxcLlthLXpBLVowLTktX10qW2EtekEtWjAtOV0pKyg/IVstX10pLyxcbiAgICB1cmw6IC9eKCg/OmZ0cHxodHRwcz8pOlxcL1xcL3x3d3dcXC4pKD86W2EtekEtWjAtOVxcLV0rXFwuPykrW15cXHM8XSp8XmVtYWlsLyxcbiAgICBfYmFja3BlZGFsOiAvKD86W14/IS4sOjsqX34oKSZdK3xcXChbXildKlxcKXwmKD8hW2EtekEtWjAtOV0rOyQpfFs/IS4sOjsqX34pXSsoPyEkKSkrLyxcbiAgICBkZWw6IC9eKH5+PykoPz1bXlxcc35dKShbXFxzXFxTXSo/W15cXHN+XSlcXDEoPz1bXn5dfCQpLyxcbiAgICB0ZXh0OiAvXihbYH5dK3xbXmB+XSkoPzooPz0gezIsfVxcbil8KD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKXxbXFxzXFxTXSo/KD86KD89W1xcXFw8IVxcW2Aqfl9dfFxcYl98aHR0cHM/OlxcL1xcL3xmdHA6XFwvXFwvfHd3d1xcLnwkKXxbXiBdKD89IHsyLH1cXG4pfFteYS16QS1aMC05LiEjJCUmJyorXFwvPT9fYHtcXHx9fi1dKD89W2EtekEtWjAtOS4hIyQlJicqK1xcLz0/X2B7XFx8fX4tXStAKSkpL1xuICB9KTtcbiAgaW5saW5lLmdmbS51cmwgPSBlZGl0KGlubGluZS5nZm0udXJsLCAnaScpLnJlcGxhY2UoJ2VtYWlsJywgaW5saW5lLmdmbS5fZXh0ZW5kZWRfZW1haWwpLmdldFJlZ2V4KCk7XG4gIC8qKlxuICAgKiBHRk0gKyBMaW5lIEJyZWFrcyBJbmxpbmUgR3JhbW1hclxuICAgKi9cblxuICBpbmxpbmUuYnJlYWtzID0gbWVyZ2Uoe30sIGlubGluZS5nZm0sIHtcbiAgICBicjogZWRpdChpbmxpbmUuYnIpLnJlcGxhY2UoJ3syLH0nLCAnKicpLmdldFJlZ2V4KCksXG4gICAgdGV4dDogZWRpdChpbmxpbmUuZ2ZtLnRleHQpLnJlcGxhY2UoJ1xcXFxiXycsICdcXFxcYl98IHsyLH1cXFxcbicpLnJlcGxhY2UoL1xcezIsXFx9L2csICcqJykuZ2V0UmVnZXgoKVxuICB9KTtcblxuICAvKipcbiAgICogc21hcnR5cGFudHMgdGV4dCByZXBsYWNlbWVudFxuICAgKi9cblxuICBmdW5jdGlvbiBzbWFydHlwYW50cyh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQgLy8gZW0tZGFzaGVzXG4gICAgLnJlcGxhY2UoLy0tLS9nLCBcIlxcdTIwMTRcIikgLy8gZW4tZGFzaGVzXG4gICAgLnJlcGxhY2UoLy0tL2csIFwiXFx1MjAxM1wiKSAvLyBvcGVuaW5nIHNpbmdsZXNcbiAgICAucmVwbGFjZSgvKF58Wy1cXHUyMDE0LyhcXFt7XCJcXHNdKScvZywgXCIkMVxcdTIwMThcIikgLy8gY2xvc2luZyBzaW5nbGVzICYgYXBvc3Ryb3BoZXNcbiAgICAucmVwbGFjZSgvJy9nLCBcIlxcdTIwMTlcIikgLy8gb3BlbmluZyBkb3VibGVzXG4gICAgLnJlcGxhY2UoLyhefFstXFx1MjAxNC8oXFxbe1xcdTIwMThcXHNdKVwiL2csIFwiJDFcXHUyMDFDXCIpIC8vIGNsb3NpbmcgZG91Ymxlc1xuICAgIC5yZXBsYWNlKC9cIi9nLCBcIlxcdTIwMURcIikgLy8gZWxsaXBzZXNcbiAgICAucmVwbGFjZSgvXFwuezN9L2csIFwiXFx1MjAyNlwiKTtcbiAgfVxuICAvKipcbiAgICogbWFuZ2xlIGVtYWlsIGFkZHJlc3Nlc1xuICAgKi9cblxuXG4gIGZ1bmN0aW9uIG1hbmdsZSh0ZXh0KSB7XG4gICAgdmFyIG91dCA9ICcnLFxuICAgICAgICBpLFxuICAgICAgICBjaDtcbiAgICB2YXIgbCA9IHRleHQubGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgY2ggPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG5cbiAgICAgIGlmIChNYXRoLnJhbmRvbSgpID4gMC41KSB7XG4gICAgICAgIGNoID0gJ3gnICsgY2gudG9TdHJpbmcoMTYpO1xuICAgICAgfVxuXG4gICAgICBvdXQgKz0gJyYjJyArIGNoICsgJzsnO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgLyoqXG4gICAqIEJsb2NrIExleGVyXG4gICAqL1xuXG5cbiAgdmFyIExleGVyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMZXhlcihvcHRpb25zKSB7XG4gICAgICB0aGlzLnRva2VucyA9IFtdO1xuICAgICAgdGhpcy50b2tlbnMubGlua3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBleHBvcnRzLmRlZmF1bHRzO1xuICAgICAgdGhpcy5vcHRpb25zLnRva2VuaXplciA9IHRoaXMub3B0aW9ucy50b2tlbml6ZXIgfHwgbmV3IFRva2VuaXplcigpO1xuICAgICAgdGhpcy50b2tlbml6ZXIgPSB0aGlzLm9wdGlvbnMudG9rZW5pemVyO1xuICAgICAgdGhpcy50b2tlbml6ZXIub3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIHRoaXMudG9rZW5pemVyLmxleGVyID0gdGhpcztcbiAgICAgIHRoaXMuaW5saW5lUXVldWUgPSBbXTtcbiAgICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAgIGluTGluazogZmFsc2UsXG4gICAgICAgIGluUmF3QmxvY2s6IGZhbHNlLFxuICAgICAgICB0b3A6IHRydWVcbiAgICAgIH07XG4gICAgICB2YXIgcnVsZXMgPSB7XG4gICAgICAgIGJsb2NrOiBibG9jay5ub3JtYWwsXG4gICAgICAgIGlubGluZTogaW5saW5lLm5vcm1hbFxuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wZWRhbnRpYykge1xuICAgICAgICBydWxlcy5ibG9jayA9IGJsb2NrLnBlZGFudGljO1xuICAgICAgICBydWxlcy5pbmxpbmUgPSBpbmxpbmUucGVkYW50aWM7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5nZm0pIHtcbiAgICAgICAgcnVsZXMuYmxvY2sgPSBibG9jay5nZm07XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5icmVha3MpIHtcbiAgICAgICAgICBydWxlcy5pbmxpbmUgPSBpbmxpbmUuYnJlYWtzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJ1bGVzLmlubGluZSA9IGlubGluZS5nZm07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy50b2tlbml6ZXIucnVsZXMgPSBydWxlcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhwb3NlIFJ1bGVzXG4gICAgICovXG5cblxuICAgIC8qKlxuICAgICAqIFN0YXRpYyBMZXggTWV0aG9kXG4gICAgICovXG4gICAgTGV4ZXIubGV4ID0gZnVuY3Rpb24gbGV4KHNyYywgb3B0aW9ucykge1xuICAgICAgdmFyIGxleGVyID0gbmV3IExleGVyKG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIGxleGVyLmxleChzcmMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdGF0aWMgTGV4IElubGluZSBNZXRob2RcbiAgICAgKi9cbiAgICA7XG5cbiAgICBMZXhlci5sZXhJbmxpbmUgPSBmdW5jdGlvbiBsZXhJbmxpbmUoc3JjLCBvcHRpb25zKSB7XG4gICAgICB2YXIgbGV4ZXIgPSBuZXcgTGV4ZXIob3B0aW9ucyk7XG4gICAgICByZXR1cm4gbGV4ZXIuaW5saW5lVG9rZW5zKHNyYyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFByZXByb2Nlc3NpbmdcbiAgICAgKi9cbiAgICA7XG5cbiAgICB2YXIgX3Byb3RvID0gTGV4ZXIucHJvdG90eXBlO1xuXG4gICAgX3Byb3RvLmxleCA9IGZ1bmN0aW9uIGxleChzcmMpIHtcbiAgICAgIHNyYyA9IHNyYy5yZXBsYWNlKC9cXHJcXG58XFxyL2csICdcXG4nKS5yZXBsYWNlKC9cXHQvZywgJyAgICAnKTtcbiAgICAgIHRoaXMuYmxvY2tUb2tlbnMoc3JjLCB0aGlzLnRva2Vucyk7XG4gICAgICB2YXIgbmV4dDtcblxuICAgICAgd2hpbGUgKG5leHQgPSB0aGlzLmlubGluZVF1ZXVlLnNoaWZ0KCkpIHtcbiAgICAgICAgdGhpcy5pbmxpbmVUb2tlbnMobmV4dC5zcmMsIG5leHQudG9rZW5zKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMudG9rZW5zO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMZXhpbmdcbiAgICAgKi9cbiAgICA7XG5cbiAgICBfcHJvdG8uYmxvY2tUb2tlbnMgPSBmdW5jdGlvbiBibG9ja1Rva2VucyhzcmMsIHRva2Vucykge1xuICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgaWYgKHRva2VucyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRva2VucyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBlZGFudGljKSB7XG4gICAgICAgIHNyYyA9IHNyYy5yZXBsYWNlKC9eICskL2dtLCAnJyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0b2tlbiwgbGFzdFRva2VuLCBjdXRTcmMsIGxhc3RQYXJhZ3JhcGhDbGlwcGVkO1xuXG4gICAgICB3aGlsZSAoc3JjKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucyAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5ibG9jayAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5ibG9jay5zb21lKGZ1bmN0aW9uIChleHRUb2tlbml6ZXIpIHtcbiAgICAgICAgICBpZiAodG9rZW4gPSBleHRUb2tlbml6ZXIuY2FsbCh7XG4gICAgICAgICAgICBsZXhlcjogX3RoaXNcbiAgICAgICAgICB9LCBzcmMsIHRva2VucykpIHtcbiAgICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gbmV3bGluZVxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuc3BhY2Uoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG5cbiAgICAgICAgICBpZiAodG9rZW4udHlwZSkge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGNvZGVcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmNvZGUoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTsgLy8gQW4gaW5kZW50ZWQgY29kZSBibG9jayBjYW5ub3QgaW50ZXJydXB0IGEgcGFyYWdyYXBoLlxuXG4gICAgICAgICAgaWYgKGxhc3RUb2tlbiAmJiAobGFzdFRva2VuLnR5cGUgPT09ICdwYXJhZ3JhcGgnIHx8IGxhc3RUb2tlbi50eXBlID09PSAndGV4dCcpKSB7XG4gICAgICAgICAgICBsYXN0VG9rZW4ucmF3ICs9ICdcXG4nICsgdG9rZW4ucmF3O1xuICAgICAgICAgICAgbGFzdFRva2VuLnRleHQgKz0gJ1xcbicgKyB0b2tlbi50ZXh0O1xuICAgICAgICAgICAgdGhpcy5pbmxpbmVRdWV1ZVt0aGlzLmlubGluZVF1ZXVlLmxlbmd0aCAtIDFdLnNyYyA9IGxhc3RUb2tlbi50ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gZmVuY2VzXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5mZW5jZXMoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGhlYWRpbmdcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmhlYWRpbmcoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGhyXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5ocihzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gYmxvY2txdW90ZVxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuYmxvY2txdW90ZShzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gbGlzdFxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIubGlzdChzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gaHRtbFxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuaHRtbChzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gZGVmXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5kZWYoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgKGxhc3RUb2tlbi50eXBlID09PSAncGFyYWdyYXBoJyB8fCBsYXN0VG9rZW4udHlwZSA9PT0gJ3RleHQnKSkge1xuICAgICAgICAgICAgbGFzdFRva2VuLnJhdyArPSAnXFxuJyArIHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9ICdcXG4nICsgdG9rZW4ucmF3O1xuICAgICAgICAgICAgdGhpcy5pbmxpbmVRdWV1ZVt0aGlzLmlubGluZVF1ZXVlLmxlbmd0aCAtIDFdLnNyYyA9IGxhc3RUb2tlbi50ZXh0O1xuICAgICAgICAgIH0gZWxzZSBpZiAoIXRoaXMudG9rZW5zLmxpbmtzW3Rva2VuLnRhZ10pIHtcbiAgICAgICAgICAgIHRoaXMudG9rZW5zLmxpbmtzW3Rva2VuLnRhZ10gPSB7XG4gICAgICAgICAgICAgIGhyZWY6IHRva2VuLmhyZWYsXG4gICAgICAgICAgICAgIHRpdGxlOiB0b2tlbi50aXRsZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyB0YWJsZSAoZ2ZtKVxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIudGFibGUoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGxoZWFkaW5nXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5saGVhZGluZyhzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gdG9wLWxldmVsIHBhcmFncmFwaFxuICAgICAgICAvLyBwcmV2ZW50IHBhcmFncmFwaCBjb25zdW1pbmcgZXh0ZW5zaW9ucyBieSBjbGlwcGluZyAnc3JjJyB0byBleHRlbnNpb24gc3RhcnRcblxuXG4gICAgICAgIGN1dFNyYyA9IHNyYztcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmV4dGVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRCbG9jaykge1xuICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnRJbmRleCA9IEluZmluaXR5O1xuICAgICAgICAgICAgdmFyIHRlbXBTcmMgPSBzcmMuc2xpY2UoMSk7XG4gICAgICAgICAgICB2YXIgdGVtcFN0YXJ0ID0gdm9pZCAwO1xuXG4gICAgICAgICAgICBfdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRCbG9jay5mb3JFYWNoKGZ1bmN0aW9uIChnZXRTdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgIHRlbXBTdGFydCA9IGdldFN0YXJ0SW5kZXguY2FsbCh7XG4gICAgICAgICAgICAgICAgbGV4ZXI6IHRoaXNcbiAgICAgICAgICAgICAgfSwgdGVtcFNyYyk7XG5cbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZW1wU3RhcnQgPT09ICdudW1iZXInICYmIHRlbXBTdGFydCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRJbmRleCA9IE1hdGgubWluKHN0YXJ0SW5kZXgsIHRlbXBTdGFydCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRJbmRleCA8IEluZmluaXR5ICYmIHN0YXJ0SW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICBjdXRTcmMgPSBzcmMuc3Vic3RyaW5nKDAsIHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudG9wICYmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnBhcmFncmFwaChjdXRTcmMpKSkge1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICBpZiAobGFzdFBhcmFncmFwaENsaXBwZWQgJiYgbGFzdFRva2VuLnR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgICAgICAgICBsYXN0VG9rZW4ucmF3ICs9ICdcXG4nICsgdG9rZW4ucmF3O1xuICAgICAgICAgICAgbGFzdFRva2VuLnRleHQgKz0gJ1xcbicgKyB0b2tlbi50ZXh0O1xuICAgICAgICAgICAgdGhpcy5pbmxpbmVRdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuaW5saW5lUXVldWVbdGhpcy5pbmxpbmVRdWV1ZS5sZW5ndGggLSAxXS5zcmMgPSBsYXN0VG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxhc3RQYXJhZ3JhcGhDbGlwcGVkID0gY3V0U3JjLmxlbmd0aCAhPT0gc3JjLmxlbmd0aDtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIHRleHRcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLnRleHQoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgbGFzdFRva2VuLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgbGFzdFRva2VuLnJhdyArPSAnXFxuJyArIHRva2VuLnJhdztcbiAgICAgICAgICAgIGxhc3RUb2tlbi50ZXh0ICs9ICdcXG4nICsgdG9rZW4udGV4dDtcbiAgICAgICAgICAgIHRoaXMuaW5saW5lUXVldWUucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmlubGluZVF1ZXVlW3RoaXMuaW5saW5lUXVldWUubGVuZ3RoIC0gMV0uc3JjID0gbGFzdFRva2VuLnRleHQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzcmMpIHtcbiAgICAgICAgICB2YXIgZXJyTXNnID0gJ0luZmluaXRlIGxvb3Agb24gYnl0ZTogJyArIHNyYy5jaGFyQ29kZUF0KDApO1xuXG4gICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGF0ZS50b3AgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRva2VucztcbiAgICB9O1xuXG4gICAgX3Byb3RvLmlubGluZSA9IGZ1bmN0aW9uIGlubGluZShzcmMsIHRva2Vucykge1xuICAgICAgdGhpcy5pbmxpbmVRdWV1ZS5wdXNoKHtcbiAgICAgICAgc3JjOiBzcmMsXG4gICAgICAgIHRva2VuczogdG9rZW5zXG4gICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGV4aW5nL0NvbXBpbGluZ1xuICAgICAqL1xuICAgIDtcblxuICAgIF9wcm90by5pbmxpbmVUb2tlbnMgPSBmdW5jdGlvbiBpbmxpbmVUb2tlbnMoc3JjLCB0b2tlbnMpIHtcbiAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG4gICAgICBpZiAodG9rZW5zID09PSB2b2lkIDApIHtcbiAgICAgICAgdG9rZW5zID0gW107XG4gICAgICB9XG5cbiAgICAgIHZhciB0b2tlbiwgbGFzdFRva2VuLCBjdXRTcmM7IC8vIFN0cmluZyB3aXRoIGxpbmtzIG1hc2tlZCB0byBhdm9pZCBpbnRlcmZlcmVuY2Ugd2l0aCBlbSBhbmQgc3Ryb25nXG5cbiAgICAgIHZhciBtYXNrZWRTcmMgPSBzcmM7XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB2YXIga2VlcFByZXZDaGFyLCBwcmV2Q2hhcjsgLy8gTWFzayBvdXQgcmVmbGlua3NcblxuICAgICAgaWYgKHRoaXMudG9rZW5zLmxpbmtzKSB7XG4gICAgICAgIHZhciBsaW5rcyA9IE9iamVjdC5rZXlzKHRoaXMudG9rZW5zLmxpbmtzKTtcblxuICAgICAgICBpZiAobGlua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHdoaWxlICgobWF0Y2ggPSB0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUucmVmbGlua1NlYXJjaC5leGVjKG1hc2tlZFNyYykpICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChsaW5rcy5pbmNsdWRlcyhtYXRjaFswXS5zbGljZShtYXRjaFswXS5sYXN0SW5kZXhPZignWycpICsgMSwgLTEpKSkge1xuICAgICAgICAgICAgICBtYXNrZWRTcmMgPSBtYXNrZWRTcmMuc2xpY2UoMCwgbWF0Y2guaW5kZXgpICsgJ1snICsgcmVwZWF0U3RyaW5nKCdhJywgbWF0Y2hbMF0ubGVuZ3RoIC0gMikgKyAnXScgKyBtYXNrZWRTcmMuc2xpY2UodGhpcy50b2tlbml6ZXIucnVsZXMuaW5saW5lLnJlZmxpbmtTZWFyY2gubGFzdEluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gLy8gTWFzayBvdXQgb3RoZXIgYmxvY2tzXG5cblxuICAgICAgd2hpbGUgKChtYXRjaCA9IHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5ibG9ja1NraXAuZXhlYyhtYXNrZWRTcmMpKSAhPSBudWxsKSB7XG4gICAgICAgIG1hc2tlZFNyYyA9IG1hc2tlZFNyYy5zbGljZSgwLCBtYXRjaC5pbmRleCkgKyAnWycgKyByZXBlYXRTdHJpbmcoJ2EnLCBtYXRjaFswXS5sZW5ndGggLSAyKSArICddJyArIG1hc2tlZFNyYy5zbGljZSh0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuYmxvY2tTa2lwLmxhc3RJbmRleCk7XG4gICAgICB9IC8vIE1hc2sgb3V0IGVzY2FwZWQgZW0gJiBzdHJvbmcgZGVsaW1pdGVyc1xuXG5cbiAgICAgIHdoaWxlICgobWF0Y2ggPSB0aGlzLnRva2VuaXplci5ydWxlcy5pbmxpbmUuZXNjYXBlZEVtU3QuZXhlYyhtYXNrZWRTcmMpKSAhPSBudWxsKSB7XG4gICAgICAgIG1hc2tlZFNyYyA9IG1hc2tlZFNyYy5zbGljZSgwLCBtYXRjaC5pbmRleCkgKyAnKysnICsgbWFza2VkU3JjLnNsaWNlKHRoaXMudG9rZW5pemVyLnJ1bGVzLmlubGluZS5lc2NhcGVkRW1TdC5sYXN0SW5kZXgpO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAoc3JjKSB7XG4gICAgICAgIGlmICgha2VlcFByZXZDaGFyKSB7XG4gICAgICAgICAgcHJldkNoYXIgPSAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIGtlZXBQcmV2Q2hhciA9IGZhbHNlOyAvLyBleHRlbnNpb25zXG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5leHRlbnNpb25zICYmIHRoaXMub3B0aW9ucy5leHRlbnNpb25zLmlubGluZSAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5pbmxpbmUuc29tZShmdW5jdGlvbiAoZXh0VG9rZW5pemVyKSB7XG4gICAgICAgICAgaWYgKHRva2VuID0gZXh0VG9rZW5pemVyLmNhbGwoe1xuICAgICAgICAgICAgbGV4ZXI6IF90aGlzMlxuICAgICAgICAgIH0sIHNyYywgdG9rZW5zKSkge1xuICAgICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSkpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBlc2NhcGVcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmVzY2FwZShzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gdGFnXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci50YWcoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgdG9rZW4udHlwZSA9PT0gJ3RleHQnICYmIGxhc3RUb2tlbi50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIGxhc3RUb2tlbi5yYXcgKz0gdG9rZW4ucmF3O1xuICAgICAgICAgICAgbGFzdFRva2VuLnRleHQgKz0gdG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGxpbmtcblxuXG4gICAgICAgIGlmICh0b2tlbiA9IHRoaXMudG9rZW5pemVyLmxpbmsoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIHJlZmxpbmssIG5vbGlua1xuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIucmVmbGluayhzcmMsIHRoaXMudG9rZW5zLmxpbmtzKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgdG9rZW4udHlwZSA9PT0gJ3RleHQnICYmIGxhc3RUb2tlbi50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgIGxhc3RUb2tlbi5yYXcgKz0gdG9rZW4ucmF3O1xuICAgICAgICAgICAgbGFzdFRva2VuLnRleHQgKz0gdG9rZW4udGV4dDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGVtICYgc3Ryb25nXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5lbVN0cm9uZyhzcmMsIG1hc2tlZFNyYywgcHJldkNoYXIpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gY29kZVxuXG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuY29kZXNwYW4oc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGJyXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5icihzcmMpKSB7XG4gICAgICAgICAgc3JjID0gc3JjLnN1YnN0cmluZyh0b2tlbi5yYXcubGVuZ3RoKTtcbiAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH0gLy8gZGVsIChnZm0pXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5kZWwoc3JjKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG4gICAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IC8vIGF1dG9saW5rXG5cblxuICAgICAgICBpZiAodG9rZW4gPSB0aGlzLnRva2VuaXplci5hdXRvbGluayhzcmMsIG1hbmdsZSkpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyB1cmwgKGdmbSlcblxuXG4gICAgICAgIGlmICghdGhpcy5zdGF0ZS5pbkxpbmsgJiYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIudXJsKHNyYywgbWFuZ2xlKSkpIHtcbiAgICAgICAgICBzcmMgPSBzcmMuc3Vic3RyaW5nKHRva2VuLnJhdy5sZW5ndGgpO1xuICAgICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyB0ZXh0XG4gICAgICAgIC8vIHByZXZlbnQgaW5saW5lVGV4dCBjb25zdW1pbmcgZXh0ZW5zaW9ucyBieSBjbGlwcGluZyAnc3JjJyB0byBleHRlbnNpb24gc3RhcnRcblxuXG4gICAgICAgIGN1dFNyYyA9IHNyYztcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmV4dGVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMuc3RhcnRJbmxpbmUpIHtcbiAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN0YXJ0SW5kZXggPSBJbmZpbml0eTtcbiAgICAgICAgICAgIHZhciB0ZW1wU3JjID0gc3JjLnNsaWNlKDEpO1xuICAgICAgICAgICAgdmFyIHRlbXBTdGFydCA9IHZvaWQgMDtcblxuICAgICAgICAgICAgX3RoaXMyLm9wdGlvbnMuZXh0ZW5zaW9ucy5zdGFydElubGluZS5mb3JFYWNoKGZ1bmN0aW9uIChnZXRTdGFydEluZGV4KSB7XG4gICAgICAgICAgICAgIHRlbXBTdGFydCA9IGdldFN0YXJ0SW5kZXguY2FsbCh7XG4gICAgICAgICAgICAgICAgbGV4ZXI6IHRoaXNcbiAgICAgICAgICAgICAgfSwgdGVtcFNyYyk7XG5cbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZW1wU3RhcnQgPT09ICdudW1iZXInICYmIHRlbXBTdGFydCA+PSAwKSB7XG4gICAgICAgICAgICAgICAgc3RhcnRJbmRleCA9IE1hdGgubWluKHN0YXJ0SW5kZXgsIHRlbXBTdGFydCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnRJbmRleCA8IEluZmluaXR5ICYmIHN0YXJ0SW5kZXggPj0gMCkge1xuICAgICAgICAgICAgICBjdXRTcmMgPSBzcmMuc3Vic3RyaW5nKDAsIHN0YXJ0SW5kZXggKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRva2VuID0gdGhpcy50b2tlbml6ZXIuaW5saW5lVGV4dChjdXRTcmMsIHNtYXJ0eXBhbnRzKSkge1xuICAgICAgICAgIHNyYyA9IHNyYy5zdWJzdHJpbmcodG9rZW4ucmF3Lmxlbmd0aCk7XG5cbiAgICAgICAgICBpZiAodG9rZW4ucmF3LnNsaWNlKC0xKSAhPT0gJ18nKSB7XG4gICAgICAgICAgICAvLyBUcmFjayBwcmV2Q2hhciBiZWZvcmUgc3RyaW5nIG9mIF9fX18gc3RhcnRlZFxuICAgICAgICAgICAgcHJldkNoYXIgPSB0b2tlbi5yYXcuc2xpY2UoLTEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGtlZXBQcmV2Q2hhciA9IHRydWU7XG4gICAgICAgICAgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXTtcblxuICAgICAgICAgIGlmIChsYXN0VG9rZW4gJiYgbGFzdFRva2VuLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgICAgICAgbGFzdFRva2VuLnJhdyArPSB0b2tlbi5yYXc7XG4gICAgICAgICAgICBsYXN0VG9rZW4udGV4dCArPSB0b2tlbi50ZXh0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3JjKSB7XG4gICAgICAgICAgdmFyIGVyck1zZyA9ICdJbmZpbml0ZSBsb29wIG9uIGJ5dGU6ICcgKyBzcmMuY2hhckNvZGVBdCgwKTtcblxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyck1zZyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVyck1zZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0b2tlbnM7XG4gICAgfTtcblxuICAgIF9jcmVhdGVDbGFzcyhMZXhlciwgbnVsbCwgW3tcbiAgICAgIGtleTogXCJydWxlc1wiLFxuICAgICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgYmxvY2s6IGJsb2NrLFxuICAgICAgICAgIGlubGluZTogaW5saW5lXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIExleGVyO1xuICB9KCk7XG5cbiAgLyoqXG4gICAqIFJlbmRlcmVyXG4gICAqL1xuXG4gIHZhciBSZW5kZXJlciA9IC8qI19fUFVSRV9fKi9mdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVuZGVyZXIob3B0aW9ucykge1xuICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCBleHBvcnRzLmRlZmF1bHRzO1xuICAgIH1cblxuICAgIHZhciBfcHJvdG8gPSBSZW5kZXJlci5wcm90b3R5cGU7XG5cbiAgICBfcHJvdG8uY29kZSA9IGZ1bmN0aW9uIGNvZGUoX2NvZGUsIGluZm9zdHJpbmcsIGVzY2FwZWQpIHtcbiAgICAgIHZhciBsYW5nID0gKGluZm9zdHJpbmcgfHwgJycpLm1hdGNoKC9cXFMqLylbMF07XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm9wdGlvbnMuaGlnaGxpZ2h0KF9jb2RlLCBsYW5nKTtcblxuICAgICAgICBpZiAob3V0ICE9IG51bGwgJiYgb3V0ICE9PSBfY29kZSkge1xuICAgICAgICAgIGVzY2FwZWQgPSB0cnVlO1xuICAgICAgICAgIF9jb2RlID0gb3V0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIF9jb2RlID0gX2NvZGUucmVwbGFjZSgvXFxuJC8sICcnKSArICdcXG4nO1xuXG4gICAgICBpZiAoIWxhbmcpIHtcbiAgICAgICAgcmV0dXJuICc8cHJlPjxjb2RlPicgKyAoZXNjYXBlZCA/IF9jb2RlIDogZXNjYXBlKF9jb2RlLCB0cnVlKSkgKyAnPC9jb2RlPjwvcHJlPlxcbic7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiAnPHByZT48Y29kZSBjbGFzcz1cIicgKyB0aGlzLm9wdGlvbnMubGFuZ1ByZWZpeCArIGVzY2FwZShsYW5nLCB0cnVlKSArICdcIj4nICsgKGVzY2FwZWQgPyBfY29kZSA6IGVzY2FwZShfY29kZSwgdHJ1ZSkpICsgJzwvY29kZT48L3ByZT5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uYmxvY2txdW90ZSA9IGZ1bmN0aW9uIGJsb2NrcXVvdGUocXVvdGUpIHtcbiAgICAgIHJldHVybiAnPGJsb2NrcXVvdGU+XFxuJyArIHF1b3RlICsgJzwvYmxvY2txdW90ZT5cXG4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uaHRtbCA9IGZ1bmN0aW9uIGh0bWwoX2h0bWwpIHtcbiAgICAgIHJldHVybiBfaHRtbDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLmhlYWRpbmcgPSBmdW5jdGlvbiBoZWFkaW5nKHRleHQsIGxldmVsLCByYXcsIHNsdWdnZXIpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGVhZGVySWRzKSB7XG4gICAgICAgIHJldHVybiAnPGgnICsgbGV2ZWwgKyAnIGlkPVwiJyArIHRoaXMub3B0aW9ucy5oZWFkZXJQcmVmaXggKyBzbHVnZ2VyLnNsdWcocmF3KSArICdcIj4nICsgdGV4dCArICc8L2gnICsgbGV2ZWwgKyAnPlxcbic7XG4gICAgICB9IC8vIGlnbm9yZSBJRHNcblxuXG4gICAgICByZXR1cm4gJzxoJyArIGxldmVsICsgJz4nICsgdGV4dCArICc8L2gnICsgbGV2ZWwgKyAnPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by5ociA9IGZ1bmN0aW9uIGhyKCkge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy54aHRtbCA/ICc8aHIvPlxcbicgOiAnPGhyPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by5saXN0ID0gZnVuY3Rpb24gbGlzdChib2R5LCBvcmRlcmVkLCBzdGFydCkge1xuICAgICAgdmFyIHR5cGUgPSBvcmRlcmVkID8gJ29sJyA6ICd1bCcsXG4gICAgICAgICAgc3RhcnRhdHQgPSBvcmRlcmVkICYmIHN0YXJ0ICE9PSAxID8gJyBzdGFydD1cIicgKyBzdGFydCArICdcIicgOiAnJztcbiAgICAgIHJldHVybiAnPCcgKyB0eXBlICsgc3RhcnRhdHQgKyAnPlxcbicgKyBib2R5ICsgJzwvJyArIHR5cGUgKyAnPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by5saXN0aXRlbSA9IGZ1bmN0aW9uIGxpc3RpdGVtKHRleHQpIHtcbiAgICAgIHJldHVybiAnPGxpPicgKyB0ZXh0ICsgJzwvbGk+XFxuJztcbiAgICB9O1xuXG4gICAgX3Byb3RvLmNoZWNrYm94ID0gZnVuY3Rpb24gY2hlY2tib3goY2hlY2tlZCkge1xuICAgICAgcmV0dXJuICc8aW5wdXQgJyArIChjaGVja2VkID8gJ2NoZWNrZWQ9XCJcIiAnIDogJycpICsgJ2Rpc2FibGVkPVwiXCIgdHlwZT1cImNoZWNrYm94XCInICsgKHRoaXMub3B0aW9ucy54aHRtbCA/ICcgLycgOiAnJykgKyAnPiAnO1xuICAgIH07XG5cbiAgICBfcHJvdG8ucGFyYWdyYXBoID0gZnVuY3Rpb24gcGFyYWdyYXBoKHRleHQpIHtcbiAgICAgIHJldHVybiAnPHA+JyArIHRleHQgKyAnPC9wPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by50YWJsZSA9IGZ1bmN0aW9uIHRhYmxlKGhlYWRlciwgYm9keSkge1xuICAgICAgaWYgKGJvZHkpIGJvZHkgPSAnPHRib2R5PicgKyBib2R5ICsgJzwvdGJvZHk+JztcbiAgICAgIHJldHVybiAnPHRhYmxlPlxcbicgKyAnPHRoZWFkPlxcbicgKyBoZWFkZXIgKyAnPC90aGVhZD5cXG4nICsgYm9keSArICc8L3RhYmxlPlxcbic7XG4gICAgfTtcblxuICAgIF9wcm90by50YWJsZXJvdyA9IGZ1bmN0aW9uIHRhYmxlcm93KGNvbnRlbnQpIHtcbiAgICAgIHJldHVybiAnPHRyPlxcbicgKyBjb250ZW50ICsgJzwvdHI+XFxuJztcbiAgICB9O1xuXG4gICAgX3Byb3RvLnRhYmxlY2VsbCA9IGZ1bmN0aW9uIHRhYmxlY2VsbChjb250ZW50LCBmbGFncykge1xuICAgICAgdmFyIHR5cGUgPSBmbGFncy5oZWFkZXIgPyAndGgnIDogJ3RkJztcbiAgICAgIHZhciB0YWcgPSBmbGFncy5hbGlnbiA/ICc8JyArIHR5cGUgKyAnIGFsaWduPVwiJyArIGZsYWdzLmFsaWduICsgJ1wiPicgOiAnPCcgKyB0eXBlICsgJz4nO1xuICAgICAgcmV0dXJuIHRhZyArIGNvbnRlbnQgKyAnPC8nICsgdHlwZSArICc+XFxuJztcbiAgICB9IC8vIHNwYW4gbGV2ZWwgcmVuZGVyZXJcbiAgICA7XG5cbiAgICBfcHJvdG8uc3Ryb25nID0gZnVuY3Rpb24gc3Ryb25nKHRleHQpIHtcbiAgICAgIHJldHVybiAnPHN0cm9uZz4nICsgdGV4dCArICc8L3N0cm9uZz4nO1xuICAgIH07XG5cbiAgICBfcHJvdG8uZW0gPSBmdW5jdGlvbiBlbSh0ZXh0KSB7XG4gICAgICByZXR1cm4gJzxlbT4nICsgdGV4dCArICc8L2VtPic7XG4gICAgfTtcblxuICAgIF9wcm90by5jb2Rlc3BhbiA9IGZ1bmN0aW9uIGNvZGVzcGFuKHRleHQpIHtcbiAgICAgIHJldHVybiAnPGNvZGU+JyArIHRleHQgKyAnPC9jb2RlPic7XG4gICAgfTtcblxuICAgIF9wcm90by5iciA9IGZ1bmN0aW9uIGJyKCkge1xuICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy54aHRtbCA/ICc8YnIvPicgOiAnPGJyPic7XG4gICAgfTtcblxuICAgIF9wcm90by5kZWwgPSBmdW5jdGlvbiBkZWwodGV4dCkge1xuICAgICAgcmV0dXJuICc8ZGVsPicgKyB0ZXh0ICsgJzwvZGVsPic7XG4gICAgfTtcblxuICAgIF9wcm90by5saW5rID0gZnVuY3Rpb24gbGluayhocmVmLCB0aXRsZSwgdGV4dCkge1xuICAgICAgaHJlZiA9IGNsZWFuVXJsKHRoaXMub3B0aW9ucy5zYW5pdGl6ZSwgdGhpcy5vcHRpb25zLmJhc2VVcmwsIGhyZWYpO1xuXG4gICAgICBpZiAoaHJlZiA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgIH1cblxuICAgICAgdmFyIG91dCA9ICc8YSBocmVmPVwiJyArIGVzY2FwZShocmVmKSArICdcIic7XG5cbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICBvdXQgKz0gJyB0aXRsZT1cIicgKyB0aXRsZSArICdcIic7XG4gICAgICB9XG5cbiAgICAgIG91dCArPSAnPicgKyB0ZXh0ICsgJzwvYT4nO1xuICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLmltYWdlID0gZnVuY3Rpb24gaW1hZ2UoaHJlZiwgdGl0bGUsIHRleHQpIHtcbiAgICAgIGhyZWYgPSBjbGVhblVybCh0aGlzLm9wdGlvbnMuc2FuaXRpemUsIHRoaXMub3B0aW9ucy5iYXNlVXJsLCBocmVmKTtcblxuICAgICAgaWYgKGhyZWYgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICB9XG5cbiAgICAgIHZhciBvdXQgPSAnPGltZyBzcmM9XCInICsgaHJlZiArICdcIiBhbHQ9XCInICsgdGV4dCArICdcIic7XG5cbiAgICAgIGlmICh0aXRsZSkge1xuICAgICAgICBvdXQgKz0gJyB0aXRsZT1cIicgKyB0aXRsZSArICdcIic7XG4gICAgICB9XG5cbiAgICAgIG91dCArPSB0aGlzLm9wdGlvbnMueGh0bWwgPyAnLz4nIDogJz4nO1xuICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLnRleHQgPSBmdW5jdGlvbiB0ZXh0KF90ZXh0KSB7XG4gICAgICByZXR1cm4gX3RleHQ7XG4gICAgfTtcblxuICAgIHJldHVybiBSZW5kZXJlcjtcbiAgfSgpO1xuXG4gIC8qKlxuICAgKiBUZXh0UmVuZGVyZXJcbiAgICogcmV0dXJucyBvbmx5IHRoZSB0ZXh0dWFsIHBhcnQgb2YgdGhlIHRva2VuXG4gICAqL1xuICB2YXIgVGV4dFJlbmRlcmVyID0gLyojX19QVVJFX18qL2Z1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUZXh0UmVuZGVyZXIoKSB7fVxuXG4gICAgdmFyIF9wcm90byA9IFRleHRSZW5kZXJlci5wcm90b3R5cGU7XG5cbiAgICAvLyBubyBuZWVkIGZvciBibG9jayBsZXZlbCByZW5kZXJlcnNcbiAgICBfcHJvdG8uc3Ryb25nID0gZnVuY3Rpb24gc3Ryb25nKHRleHQpIHtcbiAgICAgIHJldHVybiB0ZXh0O1xuICAgIH07XG5cbiAgICBfcHJvdG8uZW0gPSBmdW5jdGlvbiBlbSh0ZXh0KSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLmNvZGVzcGFuID0gZnVuY3Rpb24gY29kZXNwYW4odGV4dCkge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5kZWwgPSBmdW5jdGlvbiBkZWwodGV4dCkge1xuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5odG1sID0gZnVuY3Rpb24gaHRtbCh0ZXh0KSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLnRleHQgPSBmdW5jdGlvbiB0ZXh0KF90ZXh0KSB7XG4gICAgICByZXR1cm4gX3RleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5saW5rID0gZnVuY3Rpb24gbGluayhocmVmLCB0aXRsZSwgdGV4dCkge1xuICAgICAgcmV0dXJuICcnICsgdGV4dDtcbiAgICB9O1xuXG4gICAgX3Byb3RvLmltYWdlID0gZnVuY3Rpb24gaW1hZ2UoaHJlZiwgdGl0bGUsIHRleHQpIHtcbiAgICAgIHJldHVybiAnJyArIHRleHQ7XG4gICAgfTtcblxuICAgIF9wcm90by5iciA9IGZ1bmN0aW9uIGJyKCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH07XG5cbiAgICByZXR1cm4gVGV4dFJlbmRlcmVyO1xuICB9KCk7XG5cbiAgLyoqXG4gICAqIFNsdWdnZXIgZ2VuZXJhdGVzIGhlYWRlciBpZFxuICAgKi9cbiAgdmFyIFNsdWdnZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNsdWdnZXIoKSB7XG4gICAgICB0aGlzLnNlZW4gPSB7fTtcbiAgICB9XG5cbiAgICB2YXIgX3Byb3RvID0gU2x1Z2dlci5wcm90b3R5cGU7XG5cbiAgICBfcHJvdG8uc2VyaWFsaXplID0gZnVuY3Rpb24gc2VyaWFsaXplKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCkgLy8gcmVtb3ZlIGh0bWwgdGFnc1xuICAgICAgLnJlcGxhY2UoLzxbIVxcL2Etel0uKj8+L2lnLCAnJykgLy8gcmVtb3ZlIHVud2FudGVkIGNoYXJzXG4gICAgICAucmVwbGFjZSgvW1xcdTIwMDAtXFx1MjA2RlxcdTJFMDAtXFx1MkU3RlxcXFwnIVwiIyQlJigpKissLi86Ozw9Pj9AW1xcXV5ge3x9fl0vZywgJycpLnJlcGxhY2UoL1xccy9nLCAnLScpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgbmV4dCBzYWZlICh1bmlxdWUpIHNsdWcgdG8gdXNlXG4gICAgICovXG4gICAgO1xuXG4gICAgX3Byb3RvLmdldE5leHRTYWZlU2x1ZyA9IGZ1bmN0aW9uIGdldE5leHRTYWZlU2x1ZyhvcmlnaW5hbFNsdWcsIGlzRHJ5UnVuKSB7XG4gICAgICB2YXIgc2x1ZyA9IG9yaWdpbmFsU2x1ZztcbiAgICAgIHZhciBvY2N1cmVuY2VBY2N1bXVsYXRvciA9IDA7XG5cbiAgICAgIGlmICh0aGlzLnNlZW4uaGFzT3duUHJvcGVydHkoc2x1ZykpIHtcbiAgICAgICAgb2NjdXJlbmNlQWNjdW11bGF0b3IgPSB0aGlzLnNlZW5bb3JpZ2luYWxTbHVnXTtcblxuICAgICAgICBkbyB7XG4gICAgICAgICAgb2NjdXJlbmNlQWNjdW11bGF0b3IrKztcbiAgICAgICAgICBzbHVnID0gb3JpZ2luYWxTbHVnICsgJy0nICsgb2NjdXJlbmNlQWNjdW11bGF0b3I7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuc2Vlbi5oYXNPd25Qcm9wZXJ0eShzbHVnKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghaXNEcnlSdW4pIHtcbiAgICAgICAgdGhpcy5zZWVuW29yaWdpbmFsU2x1Z10gPSBvY2N1cmVuY2VBY2N1bXVsYXRvcjtcbiAgICAgICAgdGhpcy5zZWVuW3NsdWddID0gMDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHNsdWc7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgc3RyaW5nIHRvIHVuaXF1ZSBpZFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gICAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmRyeXJ1biBHZW5lcmF0ZXMgdGhlIG5leHQgdW5pcXVlIHNsdWcgd2l0aG91dCB1cGRhdGluZyB0aGUgaW50ZXJuYWwgYWNjdW11bGF0b3IuXG4gICAgICovXG4gICAgO1xuXG4gICAgX3Byb3RvLnNsdWcgPSBmdW5jdGlvbiBzbHVnKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNsdWcgPSB0aGlzLnNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgICByZXR1cm4gdGhpcy5nZXROZXh0U2FmZVNsdWcoc2x1Zywgb3B0aW9ucy5kcnlydW4pO1xuICAgIH07XG5cbiAgICByZXR1cm4gU2x1Z2dlcjtcbiAgfSgpO1xuXG4gIC8qKlxuICAgKiBQYXJzaW5nICYgQ29tcGlsaW5nXG4gICAqL1xuXG4gIHZhciBQYXJzZXIgPSAvKiNfX1BVUkVfXyovZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBhcnNlcihvcHRpb25zKSB7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IGV4cG9ydHMuZGVmYXVsdHM7XG4gICAgICB0aGlzLm9wdGlvbnMucmVuZGVyZXIgPSB0aGlzLm9wdGlvbnMucmVuZGVyZXIgfHwgbmV3IFJlbmRlcmVyKCk7XG4gICAgICB0aGlzLnJlbmRlcmVyID0gdGhpcy5vcHRpb25zLnJlbmRlcmVyO1xuICAgICAgdGhpcy5yZW5kZXJlci5vcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgdGhpcy50ZXh0UmVuZGVyZXIgPSBuZXcgVGV4dFJlbmRlcmVyKCk7XG4gICAgICB0aGlzLnNsdWdnZXIgPSBuZXcgU2x1Z2dlcigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdGF0aWMgUGFyc2UgTWV0aG9kXG4gICAgICovXG5cblxuICAgIFBhcnNlci5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKHRva2Vucywgb3B0aW9ucykge1xuICAgICAgdmFyIHBhcnNlciA9IG5ldyBQYXJzZXIob3B0aW9ucyk7XG4gICAgICByZXR1cm4gcGFyc2VyLnBhcnNlKHRva2Vucyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXRpYyBQYXJzZSBJbmxpbmUgTWV0aG9kXG4gICAgICovXG4gICAgO1xuXG4gICAgUGFyc2VyLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gcGFyc2VJbmxpbmUodG9rZW5zLCBvcHRpb25zKSB7XG4gICAgICB2YXIgcGFyc2VyID0gbmV3IFBhcnNlcihvcHRpb25zKTtcbiAgICAgIHJldHVybiBwYXJzZXIucGFyc2VJbmxpbmUodG9rZW5zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGFyc2UgTG9vcFxuICAgICAqL1xuICAgIDtcblxuICAgIHZhciBfcHJvdG8gPSBQYXJzZXIucHJvdG90eXBlO1xuXG4gICAgX3Byb3RvLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UodG9rZW5zLCB0b3ApIHtcbiAgICAgIGlmICh0b3AgPT09IHZvaWQgMCkge1xuICAgICAgICB0b3AgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3V0ID0gJycsXG4gICAgICAgICAgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbDIsXG4gICAgICAgICAgbDMsXG4gICAgICAgICAgcm93LFxuICAgICAgICAgIGNlbGwsXG4gICAgICAgICAgaGVhZGVyLFxuICAgICAgICAgIGJvZHksXG4gICAgICAgICAgdG9rZW4sXG4gICAgICAgICAgb3JkZXJlZCxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBsb29zZSxcbiAgICAgICAgICBpdGVtQm9keSxcbiAgICAgICAgICBpdGVtLFxuICAgICAgICAgIGNoZWNrZWQsXG4gICAgICAgICAgdGFzayxcbiAgICAgICAgICBjaGVja2JveCxcbiAgICAgICAgICByZXQ7XG4gICAgICB2YXIgbCA9IHRva2Vucy5sZW5ndGg7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07IC8vIFJ1biBhbnkgcmVuZGVyZXIgZXh0ZW5zaW9uc1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucyAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3Rva2VuLnR5cGVdKSB7XG4gICAgICAgICAgcmV0ID0gdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3Rva2VuLnR5cGVdLmNhbGwoe1xuICAgICAgICAgICAgcGFyc2VyOiB0aGlzXG4gICAgICAgICAgfSwgdG9rZW4pO1xuXG4gICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UgfHwgIVsnc3BhY2UnLCAnaHInLCAnaGVhZGluZycsICdjb2RlJywgJ3RhYmxlJywgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcsICdodG1sJywgJ3BhcmFncmFwaCcsICd0ZXh0J10uaW5jbHVkZXModG9rZW4udHlwZSkpIHtcbiAgICAgICAgICAgIG91dCArPSByZXQgfHwgJyc7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdzcGFjZSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnaHInOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gdGhpcy5yZW5kZXJlci5ocigpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2hlYWRpbmcnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gdGhpcy5yZW5kZXJlci5oZWFkaW5nKHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zKSwgdG9rZW4uZGVwdGgsIHVuZXNjYXBlKHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zLCB0aGlzLnRleHRSZW5kZXJlcikpLCB0aGlzLnNsdWdnZXIpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2NvZGUnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gdGhpcy5yZW5kZXJlci5jb2RlKHRva2VuLnRleHQsIHRva2VuLmxhbmcsIHRva2VuLmVzY2FwZWQpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ3RhYmxlJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaGVhZGVyID0gJyc7IC8vIGhlYWRlclxuXG4gICAgICAgICAgICAgIGNlbGwgPSAnJztcbiAgICAgICAgICAgICAgbDIgPSB0b2tlbi5oZWFkZXIubGVuZ3RoO1xuXG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgY2VsbCArPSB0aGlzLnJlbmRlcmVyLnRhYmxlY2VsbCh0aGlzLnBhcnNlSW5saW5lKHRva2VuLmhlYWRlcltqXS50b2tlbnMpLCB7XG4gICAgICAgICAgICAgICAgICBoZWFkZXI6IHRydWUsXG4gICAgICAgICAgICAgICAgICBhbGlnbjogdG9rZW4uYWxpZ25bal1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGhlYWRlciArPSB0aGlzLnJlbmRlcmVyLnRhYmxlcm93KGNlbGwpO1xuICAgICAgICAgICAgICBib2R5ID0gJyc7XG4gICAgICAgICAgICAgIGwyID0gdG9rZW4ucm93cy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGwyOyBqKyspIHtcbiAgICAgICAgICAgICAgICByb3cgPSB0b2tlbi5yb3dzW2pdO1xuICAgICAgICAgICAgICAgIGNlbGwgPSAnJztcbiAgICAgICAgICAgICAgICBsMyA9IHJvdy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgbDM7IGsrKykge1xuICAgICAgICAgICAgICAgICAgY2VsbCArPSB0aGlzLnJlbmRlcmVyLnRhYmxlY2VsbCh0aGlzLnBhcnNlSW5saW5lKHJvd1trXS50b2tlbnMpLCB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGFsaWduOiB0b2tlbi5hbGlnbltrXVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYm9keSArPSB0aGlzLnJlbmRlcmVyLnRhYmxlcm93KGNlbGwpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIudGFibGUoaGVhZGVyLCBib2R5KTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdibG9ja3F1b3RlJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYm9keSA9IHRoaXMucGFyc2UodG9rZW4udG9rZW5zKTtcbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIuYmxvY2txdW90ZShib2R5KTtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdsaXN0JzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3JkZXJlZCA9IHRva2VuLm9yZGVyZWQ7XG4gICAgICAgICAgICAgIHN0YXJ0ID0gdG9rZW4uc3RhcnQ7XG4gICAgICAgICAgICAgIGxvb3NlID0gdG9rZW4ubG9vc2U7XG4gICAgICAgICAgICAgIGwyID0gdG9rZW4uaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgICBib2R5ID0gJyc7XG5cbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGwyOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gdG9rZW4uaXRlbXNbal07XG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9IGl0ZW0uY2hlY2tlZDtcbiAgICAgICAgICAgICAgICB0YXNrID0gaXRlbS50YXNrO1xuICAgICAgICAgICAgICAgIGl0ZW1Cb2R5ID0gJyc7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXRlbS50YXNrKSB7XG4gICAgICAgICAgICAgICAgICBjaGVja2JveCA9IHRoaXMucmVuZGVyZXIuY2hlY2tib3goY2hlY2tlZCk7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChsb29zZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS50b2tlbnMubGVuZ3RoID4gMCAmJiBpdGVtLnRva2Vuc1swXS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udG9rZW5zWzBdLnRleHQgPSBjaGVja2JveCArICcgJyArIGl0ZW0udG9rZW5zWzBdLnRleHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS50b2tlbnNbMF0udG9rZW5zICYmIGl0ZW0udG9rZW5zWzBdLnRva2Vucy5sZW5ndGggPiAwICYmIGl0ZW0udG9rZW5zWzBdLnRva2Vuc1swXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udG9rZW5zWzBdLnRva2Vuc1swXS50ZXh0ID0gY2hlY2tib3ggKyAnICcgKyBpdGVtLnRva2Vuc1swXS50b2tlbnNbMF0udGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgaXRlbS50b2tlbnMudW5zaGlmdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBjaGVja2JveFxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQm9keSArPSBjaGVja2JveDtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpdGVtQm9keSArPSB0aGlzLnBhcnNlKGl0ZW0udG9rZW5zLCBsb29zZSk7XG4gICAgICAgICAgICAgICAgYm9keSArPSB0aGlzLnJlbmRlcmVyLmxpc3RpdGVtKGl0ZW1Cb2R5LCB0YXNrLCBjaGVja2VkKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIG91dCArPSB0aGlzLnJlbmRlcmVyLmxpc3QoYm9keSwgb3JkZXJlZCwgc3RhcnQpO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAvLyBUT0RPIHBhcnNlIGlubGluZSBjb250ZW50IGlmIHBhcmFtZXRlciBtYXJrZG93bj0xXG4gICAgICAgICAgICAgIG91dCArPSB0aGlzLnJlbmRlcmVyLmh0bWwodG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAncGFyYWdyYXBoJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHRoaXMucmVuZGVyZXIucGFyYWdyYXBoKHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zKSk7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJvZHkgPSB0b2tlbi50b2tlbnMgPyB0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucykgOiB0b2tlbi50ZXh0O1xuXG4gICAgICAgICAgICAgIHdoaWxlIChpICsgMSA8IGwgJiYgdG9rZW5zW2kgKyAxXS50eXBlID09PSAndGV4dCcpIHtcbiAgICAgICAgICAgICAgICB0b2tlbiA9IHRva2Vuc1srK2ldO1xuICAgICAgICAgICAgICAgIGJvZHkgKz0gJ1xcbicgKyAodG9rZW4udG9rZW5zID8gdGhpcy5wYXJzZUlubGluZSh0b2tlbi50b2tlbnMpIDogdG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBvdXQgKz0gdG9wID8gdGhpcy5yZW5kZXJlci5wYXJhZ3JhcGgoYm9keSkgOiBib2R5O1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHZhciBlcnJNc2cgPSAnVG9rZW4gd2l0aCBcIicgKyB0b2tlbi50eXBlICsgJ1wiIHR5cGUgd2FzIG5vdCBmb3VuZC4nO1xuXG4gICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJNc2cpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyTXNnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBhcnNlIElubGluZSBUb2tlbnNcbiAgICAgKi9cbiAgICA7XG5cbiAgICBfcHJvdG8ucGFyc2VJbmxpbmUgPSBmdW5jdGlvbiBwYXJzZUlubGluZSh0b2tlbnMsIHJlbmRlcmVyKSB7XG4gICAgICByZW5kZXJlciA9IHJlbmRlcmVyIHx8IHRoaXMucmVuZGVyZXI7XG4gICAgICB2YXIgb3V0ID0gJycsXG4gICAgICAgICAgaSxcbiAgICAgICAgICB0b2tlbixcbiAgICAgICAgICByZXQ7XG4gICAgICB2YXIgbCA9IHRva2Vucy5sZW5ndGg7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdG9rZW4gPSB0b2tlbnNbaV07IC8vIFJ1biBhbnkgcmVuZGVyZXIgZXh0ZW5zaW9uc1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucyAmJiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucy5yZW5kZXJlcnMgJiYgdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3Rva2VuLnR5cGVdKSB7XG4gICAgICAgICAgcmV0ID0gdGhpcy5vcHRpb25zLmV4dGVuc2lvbnMucmVuZGVyZXJzW3Rva2VuLnR5cGVdLmNhbGwoe1xuICAgICAgICAgICAgcGFyc2VyOiB0aGlzXG4gICAgICAgICAgfSwgdG9rZW4pO1xuXG4gICAgICAgICAgaWYgKHJldCAhPT0gZmFsc2UgfHwgIVsnZXNjYXBlJywgJ2h0bWwnLCAnbGluaycsICdpbWFnZScsICdzdHJvbmcnLCAnZW0nLCAnY29kZXNwYW4nLCAnYnInLCAnZGVsJywgJ3RleHQnXS5pbmNsdWRlcyh0b2tlbi50eXBlKSkge1xuICAgICAgICAgICAgb3V0ICs9IHJldCB8fCAnJztcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgICAgIGNhc2UgJ2VzY2FwZSc6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG91dCArPSByZW5kZXJlci50ZXh0KHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gcmVuZGVyZXIuaHRtbCh0b2tlbi50ZXh0KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdsaW5rJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmxpbmsodG9rZW4uaHJlZiwgdG9rZW4udGl0bGUsIHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zLCByZW5kZXJlcikpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2ltYWdlJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmltYWdlKHRva2VuLmhyZWYsIHRva2VuLnRpdGxlLCB0b2tlbi50ZXh0KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICdzdHJvbmcnOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBvdXQgKz0gcmVuZGVyZXIuc3Ryb25nKHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zLCByZW5kZXJlcikpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2VtJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmVtKHRoaXMucGFyc2VJbmxpbmUodG9rZW4udG9rZW5zLCByZW5kZXJlcikpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2NvZGVzcGFuJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmNvZGVzcGFuKHRva2VuLnRleHQpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgJ2JyJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmJyKCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnZGVsJzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLmRlbCh0aGlzLnBhcnNlSW5saW5lKHRva2VuLnRva2VucywgcmVuZGVyZXIpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgb3V0ICs9IHJlbmRlcmVyLnRleHQodG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdmFyIGVyck1zZyA9ICdUb2tlbiB3aXRoIFwiJyArIHRva2VuLnR5cGUgKyAnXCIgdHlwZSB3YXMgbm90IGZvdW5kLic7XG5cbiAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVyck1zZyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJNc2cpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFBhcnNlcjtcbiAgfSgpO1xuXG4gIC8qKlxuICAgKiBNYXJrZWRcbiAgICovXG5cbiAgZnVuY3Rpb24gbWFya2VkKHNyYywgb3B0LCBjYWxsYmFjaykge1xuICAgIC8vIHRocm93IGVycm9yIGluIGNhc2Ugb2Ygbm9uIHN0cmluZyBpbnB1dFxuICAgIGlmICh0eXBlb2Ygc3JjID09PSAndW5kZWZpbmVkJyB8fCBzcmMgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFya2VkKCk6IGlucHV0IHBhcmFtZXRlciBpcyB1bmRlZmluZWQgb3IgbnVsbCcpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc3JjICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXJrZWQoKTogaW5wdXQgcGFyYW1ldGVyIGlzIG9mIHR5cGUgJyArIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzcmMpICsgJywgc3RyaW5nIGV4cGVjdGVkJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBvcHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0O1xuICAgICAgb3B0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBvcHQgPSBtZXJnZSh7fSwgbWFya2VkLmRlZmF1bHRzLCBvcHQgfHwge30pO1xuICAgIGNoZWNrU2FuaXRpemVEZXByZWNhdGlvbihvcHQpO1xuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgaGlnaGxpZ2h0ID0gb3B0LmhpZ2hsaWdodDtcbiAgICAgIHZhciB0b2tlbnM7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHRva2VucyA9IExleGVyLmxleChzcmMsIG9wdCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICB2YXIgb3V0O1xuXG4gICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChvcHQud2Fsa1Rva2Vucykge1xuICAgICAgICAgICAgICBtYXJrZWQud2Fsa1Rva2Vucyh0b2tlbnMsIG9wdC53YWxrVG9rZW5zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0ID0gUGFyc2VyLnBhcnNlKHRva2Vucywgb3B0KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBlcnIgPSBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG9wdC5oaWdobGlnaHQgPSBoaWdobGlnaHQ7XG4gICAgICAgIHJldHVybiBlcnIgPyBjYWxsYmFjayhlcnIpIDogY2FsbGJhY2sobnVsbCwgb3V0KTtcbiAgICAgIH07XG5cbiAgICAgIGlmICghaGlnaGxpZ2h0IHx8IGhpZ2hsaWdodC5sZW5ndGggPCAzKSB7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG5cbiAgICAgIGRlbGV0ZSBvcHQuaGlnaGxpZ2h0O1xuICAgICAgaWYgKCF0b2tlbnMubGVuZ3RoKSByZXR1cm4gZG9uZSgpO1xuICAgICAgdmFyIHBlbmRpbmcgPSAwO1xuICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW5zLCBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICdjb2RlJykge1xuICAgICAgICAgIHBlbmRpbmcrKztcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGhpZ2hsaWdodCh0b2tlbi50ZXh0LCB0b2tlbi5sYW5nLCBmdW5jdGlvbiAoZXJyLCBjb2RlKSB7XG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZG9uZShlcnIpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKGNvZGUgIT0gbnVsbCAmJiBjb2RlICE9PSB0b2tlbi50ZXh0KSB7XG4gICAgICAgICAgICAgICAgdG9rZW4udGV4dCA9IGNvZGU7XG4gICAgICAgICAgICAgICAgdG9rZW4uZXNjYXBlZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBwZW5kaW5nLS07XG5cbiAgICAgICAgICAgICAgaWYgKHBlbmRpbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHBlbmRpbmcgPT09IDApIHtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBfdG9rZW5zID0gTGV4ZXIubGV4KHNyYywgb3B0KTtcblxuICAgICAgaWYgKG9wdC53YWxrVG9rZW5zKSB7XG4gICAgICAgIG1hcmtlZC53YWxrVG9rZW5zKF90b2tlbnMsIG9wdC53YWxrVG9rZW5zKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFBhcnNlci5wYXJzZShfdG9rZW5zLCBvcHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUubWVzc2FnZSArPSAnXFxuUGxlYXNlIHJlcG9ydCB0aGlzIHRvIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZWRqcy9tYXJrZWQuJztcblxuICAgICAgaWYgKG9wdC5zaWxlbnQpIHtcbiAgICAgICAgcmV0dXJuICc8cD5BbiBlcnJvciBvY2N1cnJlZDo8L3A+PHByZT4nICsgZXNjYXBlKGUubWVzc2FnZSArICcnLCB0cnVlKSArICc8L3ByZT4nO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICAvKipcbiAgICogT3B0aW9uc1xuICAgKi9cblxuICBtYXJrZWQub3B0aW9ucyA9IG1hcmtlZC5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdCkge1xuICAgIG1lcmdlKG1hcmtlZC5kZWZhdWx0cywgb3B0KTtcbiAgICBjaGFuZ2VEZWZhdWx0cyhtYXJrZWQuZGVmYXVsdHMpO1xuICAgIHJldHVybiBtYXJrZWQ7XG4gIH07XG5cbiAgbWFya2VkLmdldERlZmF1bHRzID0gZ2V0RGVmYXVsdHM7XG4gIG1hcmtlZC5kZWZhdWx0cyA9IGV4cG9ydHMuZGVmYXVsdHM7XG4gIC8qKlxuICAgKiBVc2UgRXh0ZW5zaW9uXG4gICAqL1xuXG4gIG1hcmtlZC51c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuICAgIH1cblxuICAgIHZhciBvcHRzID0gbWVyZ2UuYXBwbHkodm9pZCAwLCBbe31dLmNvbmNhdChhcmdzKSk7XG4gICAgdmFyIGV4dGVuc2lvbnMgPSBtYXJrZWQuZGVmYXVsdHMuZXh0ZW5zaW9ucyB8fCB7XG4gICAgICByZW5kZXJlcnM6IHt9LFxuICAgICAgY2hpbGRUb2tlbnM6IHt9XG4gICAgfTtcbiAgICB2YXIgaGFzRXh0ZW5zaW9ucztcbiAgICBhcmdzLmZvckVhY2goZnVuY3Rpb24gKHBhY2spIHtcbiAgICAgIC8vID09LS0gUGFyc2UgXCJhZGRvblwiIGV4dGVuc2lvbnMgLS09PSAvL1xuICAgICAgaWYgKHBhY2suZXh0ZW5zaW9ucykge1xuICAgICAgICBoYXNFeHRlbnNpb25zID0gdHJ1ZTtcbiAgICAgICAgcGFjay5leHRlbnNpb25zLmZvckVhY2goZnVuY3Rpb24gKGV4dCkge1xuICAgICAgICAgIGlmICghZXh0Lm5hbWUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZXh0ZW5zaW9uIG5hbWUgcmVxdWlyZWQnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZXh0LnJlbmRlcmVyKSB7XG4gICAgICAgICAgICAvLyBSZW5kZXJlciBleHRlbnNpb25zXG4gICAgICAgICAgICB2YXIgcHJldlJlbmRlcmVyID0gZXh0ZW5zaW9ucy5yZW5kZXJlcnMgPyBleHRlbnNpb25zLnJlbmRlcmVyc1tleHQubmFtZV0gOiBudWxsO1xuXG4gICAgICAgICAgICBpZiAocHJldlJlbmRlcmVyKSB7XG4gICAgICAgICAgICAgIC8vIFJlcGxhY2UgZXh0ZW5zaW9uIHdpdGggZnVuYyB0byBydW4gbmV3IGV4dGVuc2lvbiBidXQgZmFsbCBiYWNrIGlmIGZhbHNlXG4gICAgICAgICAgICAgIGV4dGVuc2lvbnMucmVuZGVyZXJzW2V4dC5uYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjIpLCBfa2V5MiA9IDA7IF9rZXkyIDwgX2xlbjI7IF9rZXkyKyspIHtcbiAgICAgICAgICAgICAgICAgIGFyZ3NbX2tleTJdID0gYXJndW1lbnRzW19rZXkyXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0gZXh0LnJlbmRlcmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgIHJldCA9IHByZXZSZW5kZXJlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZXh0ZW5zaW9ucy5yZW5kZXJlcnNbZXh0Lm5hbWVdID0gZXh0LnJlbmRlcmVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChleHQudG9rZW5pemVyKSB7XG4gICAgICAgICAgICAvLyBUb2tlbml6ZXIgRXh0ZW5zaW9uc1xuICAgICAgICAgICAgaWYgKCFleHQubGV2ZWwgfHwgZXh0LmxldmVsICE9PSAnYmxvY2snICYmIGV4dC5sZXZlbCAhPT0gJ2lubGluZScpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZXh0ZW5zaW9uIGxldmVsIG11c3QgYmUgJ2Jsb2NrJyBvciAnaW5saW5lJ1wiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4dGVuc2lvbnNbZXh0LmxldmVsXSkge1xuICAgICAgICAgICAgICBleHRlbnNpb25zW2V4dC5sZXZlbF0udW5zaGlmdChleHQudG9rZW5pemVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4dGVuc2lvbnNbZXh0LmxldmVsXSA9IFtleHQudG9rZW5pemVyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4dC5zdGFydCkge1xuICAgICAgICAgICAgICAvLyBGdW5jdGlvbiB0byBjaGVjayBmb3Igc3RhcnQgb2YgdG9rZW5cbiAgICAgICAgICAgICAgaWYgKGV4dC5sZXZlbCA9PT0gJ2Jsb2NrJykge1xuICAgICAgICAgICAgICAgIGlmIChleHRlbnNpb25zLnN0YXJ0QmxvY2spIHtcbiAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnMuc3RhcnRCbG9jay5wdXNoKGV4dC5zdGFydCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnMuc3RhcnRCbG9jayA9IFtleHQuc3RhcnRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChleHQubGV2ZWwgPT09ICdpbmxpbmUnKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dGVuc2lvbnMuc3RhcnRJbmxpbmUpIHtcbiAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnMuc3RhcnRJbmxpbmUucHVzaChleHQuc3RhcnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBleHRlbnNpb25zLnN0YXJ0SW5saW5lID0gW2V4dC5zdGFydF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGV4dC5jaGlsZFRva2Vucykge1xuICAgICAgICAgICAgLy8gQ2hpbGQgdG9rZW5zIHRvIGJlIHZpc2l0ZWQgYnkgd2Fsa1Rva2Vuc1xuICAgICAgICAgICAgZXh0ZW5zaW9ucy5jaGlsZFRva2Vuc1tleHQubmFtZV0gPSBleHQuY2hpbGRUb2tlbnM7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gLy8gPT0tLSBQYXJzZSBcIm92ZXJ3cml0ZVwiIGV4dGVuc2lvbnMgLS09PSAvL1xuXG5cbiAgICAgIGlmIChwYWNrLnJlbmRlcmVyKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHJlbmRlcmVyID0gbWFya2VkLmRlZmF1bHRzLnJlbmRlcmVyIHx8IG5ldyBSZW5kZXJlcigpO1xuXG4gICAgICAgICAgdmFyIF9sb29wID0gZnVuY3Rpb24gX2xvb3AocHJvcCkge1xuICAgICAgICAgICAgdmFyIHByZXZSZW5kZXJlciA9IHJlbmRlcmVyW3Byb3BdOyAvLyBSZXBsYWNlIHJlbmRlcmVyIHdpdGggZnVuYyB0byBydW4gZXh0ZW5zaW9uLCBidXQgZmFsbCBiYWNrIGlmIGZhbHNlXG5cbiAgICAgICAgICAgIHJlbmRlcmVyW3Byb3BdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBmb3IgKHZhciBfbGVuMyA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBuZXcgQXJyYXkoX2xlbjMpLCBfa2V5MyA9IDA7IF9rZXkzIDwgX2xlbjM7IF9rZXkzKyspIHtcbiAgICAgICAgICAgICAgICBhcmdzW19rZXkzXSA9IGFyZ3VtZW50c1tfa2V5M107XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICB2YXIgcmV0ID0gcGFjay5yZW5kZXJlcltwcm9wXS5hcHBseShyZW5kZXJlciwgYXJncyk7XG5cbiAgICAgICAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICByZXQgPSBwcmV2UmVuZGVyZXIuYXBwbHkocmVuZGVyZXIsIGFyZ3MpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcGFjay5yZW5kZXJlcikge1xuICAgICAgICAgICAgX2xvb3AocHJvcCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb3B0cy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAocGFjay50b2tlbml6ZXIpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB2YXIgdG9rZW5pemVyID0gbWFya2VkLmRlZmF1bHRzLnRva2VuaXplciB8fCBuZXcgVG9rZW5pemVyKCk7XG5cbiAgICAgICAgICB2YXIgX2xvb3AyID0gZnVuY3Rpb24gX2xvb3AyKHByb3ApIHtcbiAgICAgICAgICAgIHZhciBwcmV2VG9rZW5pemVyID0gdG9rZW5pemVyW3Byb3BdOyAvLyBSZXBsYWNlIHRva2VuaXplciB3aXRoIGZ1bmMgdG8gcnVuIGV4dGVuc2lvbiwgYnV0IGZhbGwgYmFjayBpZiBmYWxzZVxuXG4gICAgICAgICAgICB0b2tlbml6ZXJbcHJvcF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIGZvciAodmFyIF9sZW40ID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuNCksIF9rZXk0ID0gMDsgX2tleTQgPCBfbGVuNDsgX2tleTQrKykge1xuICAgICAgICAgICAgICAgIGFyZ3NbX2tleTRdID0gYXJndW1lbnRzW19rZXk0XTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZhciByZXQgPSBwYWNrLnRva2VuaXplcltwcm9wXS5hcHBseSh0b2tlbml6ZXIsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0ID0gcHJldlRva2VuaXplci5hcHBseSh0b2tlbml6ZXIsIGFyZ3MpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gcGFjay50b2tlbml6ZXIpIHtcbiAgICAgICAgICAgIF9sb29wMihwcm9wKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvcHRzLnRva2VuaXplciA9IHRva2VuaXplcjtcbiAgICAgICAgfSkoKTtcbiAgICAgIH0gLy8gPT0tLSBQYXJzZSBXYWxrVG9rZW5zIGV4dGVuc2lvbnMgLS09PSAvL1xuXG5cbiAgICAgIGlmIChwYWNrLndhbGtUb2tlbnMpIHtcbiAgICAgICAgdmFyIF93YWxrVG9rZW5zID0gbWFya2VkLmRlZmF1bHRzLndhbGtUb2tlbnM7XG5cbiAgICAgICAgb3B0cy53YWxrVG9rZW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gICAgICAgICAgcGFjay53YWxrVG9rZW5zLmNhbGwodGhpcywgdG9rZW4pO1xuXG4gICAgICAgICAgaWYgKF93YWxrVG9rZW5zKSB7XG4gICAgICAgICAgICBfd2Fsa1Rva2Vucy5jYWxsKHRoaXMsIHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChoYXNFeHRlbnNpb25zKSB7XG4gICAgICAgIG9wdHMuZXh0ZW5zaW9ucyA9IGV4dGVuc2lvbnM7XG4gICAgICB9XG5cbiAgICAgIG1hcmtlZC5zZXRPcHRpb25zKG9wdHMpO1xuICAgIH0pO1xuICB9O1xuICAvKipcbiAgICogUnVuIGNhbGxiYWNrIGZvciBldmVyeSB0b2tlblxuICAgKi9cblxuXG4gIG1hcmtlZC53YWxrVG9rZW5zID0gZnVuY3Rpb24gKHRva2VucywgY2FsbGJhY2spIHtcbiAgICB2YXIgX2xvb3AzID0gZnVuY3Rpb24gX2xvb3AzKCkge1xuICAgICAgdmFyIHRva2VuID0gX3N0ZXAudmFsdWU7XG4gICAgICBjYWxsYmFjay5jYWxsKG1hcmtlZCwgdG9rZW4pO1xuXG4gICAgICBzd2l0Y2ggKHRva2VuLnR5cGUpIHtcbiAgICAgICAgY2FzZSAndGFibGUnOlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZvciAodmFyIF9pdGVyYXRvcjIgPSBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlckxvb3NlKHRva2VuLmhlYWRlciksIF9zdGVwMjsgIShfc3RlcDIgPSBfaXRlcmF0b3IyKCkpLmRvbmU7KSB7XG4gICAgICAgICAgICAgIHZhciBjZWxsID0gX3N0ZXAyLnZhbHVlO1xuICAgICAgICAgICAgICBtYXJrZWQud2Fsa1Rva2VucyhjZWxsLnRva2VucywgY2FsbGJhY2spO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3IzID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXJMb29zZSh0b2tlbi5yb3dzKSwgX3N0ZXAzOyAhKF9zdGVwMyA9IF9pdGVyYXRvcjMoKSkuZG9uZTspIHtcbiAgICAgICAgICAgICAgdmFyIHJvdyA9IF9zdGVwMy52YWx1ZTtcblxuICAgICAgICAgICAgICBmb3IgKHZhciBfaXRlcmF0b3I0ID0gX2NyZWF0ZUZvck9mSXRlcmF0b3JIZWxwZXJMb29zZShyb3cpLCBfc3RlcDQ7ICEoX3N0ZXA0ID0gX2l0ZXJhdG9yNCgpKS5kb25lOykge1xuICAgICAgICAgICAgICAgIHZhciBfY2VsbCA9IF9zdGVwNC52YWx1ZTtcbiAgICAgICAgICAgICAgICBtYXJrZWQud2Fsa1Rva2VucyhfY2VsbC50b2tlbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgY2FzZSAnbGlzdCc6XG4gICAgICAgICAge1xuICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW4uaXRlbXMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlmIChtYXJrZWQuZGVmYXVsdHMuZXh0ZW5zaW9ucyAmJiBtYXJrZWQuZGVmYXVsdHMuZXh0ZW5zaW9ucy5jaGlsZFRva2VucyAmJiBtYXJrZWQuZGVmYXVsdHMuZXh0ZW5zaW9ucy5jaGlsZFRva2Vuc1t0b2tlbi50eXBlXSkge1xuICAgICAgICAgICAgICAvLyBXYWxrIGFueSBleHRlbnNpb25zXG4gICAgICAgICAgICAgIG1hcmtlZC5kZWZhdWx0cy5leHRlbnNpb25zLmNoaWxkVG9rZW5zW3Rva2VuLnR5cGVdLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkVG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW5bY2hpbGRUb2tlbnNdLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0b2tlbi50b2tlbnMpIHtcbiAgICAgICAgICAgICAgbWFya2VkLndhbGtUb2tlbnModG9rZW4udG9rZW5zLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBmb3IgKHZhciBfaXRlcmF0b3IgPSBfY3JlYXRlRm9yT2ZJdGVyYXRvckhlbHBlckxvb3NlKHRva2VucyksIF9zdGVwOyAhKF9zdGVwID0gX2l0ZXJhdG9yKCkpLmRvbmU7KSB7XG4gICAgICBfbG9vcDMoKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBQYXJzZSBJbmxpbmVcbiAgICovXG5cblxuICBtYXJrZWQucGFyc2VJbmxpbmUgPSBmdW5jdGlvbiAoc3JjLCBvcHQpIHtcbiAgICAvLyB0aHJvdyBlcnJvciBpbiBjYXNlIG9mIG5vbiBzdHJpbmcgaW5wdXRcbiAgICBpZiAodHlwZW9mIHNyYyA9PT0gJ3VuZGVmaW5lZCcgfHwgc3JjID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcmtlZC5wYXJzZUlubGluZSgpOiBpbnB1dCBwYXJhbWV0ZXIgaXMgdW5kZWZpbmVkIG9yIG51bGwnKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNyYyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignbWFya2VkLnBhcnNlSW5saW5lKCk6IGlucHV0IHBhcmFtZXRlciBpcyBvZiB0eXBlICcgKyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoc3JjKSArICcsIHN0cmluZyBleHBlY3RlZCcpO1xuICAgIH1cblxuICAgIG9wdCA9IG1lcmdlKHt9LCBtYXJrZWQuZGVmYXVsdHMsIG9wdCB8fCB7fSk7XG4gICAgY2hlY2tTYW5pdGl6ZURlcHJlY2F0aW9uKG9wdCk7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHRva2VucyA9IExleGVyLmxleElubGluZShzcmMsIG9wdCk7XG5cbiAgICAgIGlmIChvcHQud2Fsa1Rva2Vucykge1xuICAgICAgICBtYXJrZWQud2Fsa1Rva2Vucyh0b2tlbnMsIG9wdC53YWxrVG9rZW5zKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFBhcnNlci5wYXJzZUlubGluZSh0b2tlbnMsIG9wdCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5tZXNzYWdlICs9ICdcXG5QbGVhc2UgcmVwb3J0IHRoaXMgdG8gaHR0cHM6Ly9naXRodWIuY29tL21hcmtlZGpzL21hcmtlZC4nO1xuXG4gICAgICBpZiAob3B0LnNpbGVudCkge1xuICAgICAgICByZXR1cm4gJzxwPkFuIGVycm9yIG9jY3VycmVkOjwvcD48cHJlPicgKyBlc2NhcGUoZS5tZXNzYWdlICsgJycsIHRydWUpICsgJzwvcHJlPic7XG4gICAgICB9XG5cbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogRXhwb3NlXG4gICAqL1xuXG5cbiAgbWFya2VkLlBhcnNlciA9IFBhcnNlcjtcbiAgbWFya2VkLnBhcnNlciA9IFBhcnNlci5wYXJzZTtcbiAgbWFya2VkLlJlbmRlcmVyID0gUmVuZGVyZXI7XG4gIG1hcmtlZC5UZXh0UmVuZGVyZXIgPSBUZXh0UmVuZGVyZXI7XG4gIG1hcmtlZC5MZXhlciA9IExleGVyO1xuICBtYXJrZWQubGV4ZXIgPSBMZXhlci5sZXg7XG4gIG1hcmtlZC5Ub2tlbml6ZXIgPSBUb2tlbml6ZXI7XG4gIG1hcmtlZC5TbHVnZ2VyID0gU2x1Z2dlcjtcbiAgbWFya2VkLnBhcnNlID0gbWFya2VkO1xuICB2YXIgb3B0aW9ucyA9IG1hcmtlZC5vcHRpb25zO1xuICB2YXIgc2V0T3B0aW9ucyA9IG1hcmtlZC5zZXRPcHRpb25zO1xuICB2YXIgdXNlID0gbWFya2VkLnVzZTtcbiAgdmFyIHdhbGtUb2tlbnMgPSBtYXJrZWQud2Fsa1Rva2VucztcbiAgdmFyIHBhcnNlSW5saW5lID0gbWFya2VkLnBhcnNlSW5saW5lO1xuICB2YXIgcGFyc2UgPSBtYXJrZWQ7XG4gIHZhciBwYXJzZXIgPSBQYXJzZXIucGFyc2U7XG4gIHZhciBsZXhlciA9IExleGVyLmxleDtcblxuICBleHBvcnRzLkxleGVyID0gTGV4ZXI7XG4gIGV4cG9ydHMuUGFyc2VyID0gUGFyc2VyO1xuICBleHBvcnRzLlJlbmRlcmVyID0gUmVuZGVyZXI7XG4gIGV4cG9ydHMuU2x1Z2dlciA9IFNsdWdnZXI7XG4gIGV4cG9ydHMuVGV4dFJlbmRlcmVyID0gVGV4dFJlbmRlcmVyO1xuICBleHBvcnRzLlRva2VuaXplciA9IFRva2VuaXplcjtcbiAgZXhwb3J0cy5nZXREZWZhdWx0cyA9IGdldERlZmF1bHRzO1xuICBleHBvcnRzLmxleGVyID0gbGV4ZXI7XG4gIGV4cG9ydHMubWFya2VkID0gbWFya2VkO1xuICBleHBvcnRzLm9wdGlvbnMgPSBvcHRpb25zO1xuICBleHBvcnRzLnBhcnNlID0gcGFyc2U7XG4gIGV4cG9ydHMucGFyc2VJbmxpbmUgPSBwYXJzZUlubGluZTtcbiAgZXhwb3J0cy5wYXJzZXIgPSBwYXJzZXI7XG4gIGV4cG9ydHMuc2V0T3B0aW9ucyA9IHNldE9wdGlvbnM7XG4gIGV4cG9ydHMudXNlID0gdXNlO1xuICBleHBvcnRzLndhbGtUb2tlbnMgPSB3YWxrVG9rZW5zO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZWN0aW9uID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XG4gIGlmICghc2VsZWN0aW9uLnJhbmdlQ291bnQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge307XG4gIH1cbiAgdmFyIGFjdGl2ZSA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cbiAgdmFyIHJhbmdlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdGlvbi5yYW5nZUNvdW50OyBpKyspIHtcbiAgICByYW5nZXMucHVzaChzZWxlY3Rpb24uZ2V0UmFuZ2VBdChpKSk7XG4gIH1cblxuICBzd2l0Y2ggKGFjdGl2ZS50YWdOYW1lLnRvVXBwZXJDYXNlKCkpIHsgLy8gLnRvVXBwZXJDYXNlIGhhbmRsZXMgWEhUTUxcbiAgICBjYXNlICdJTlBVVCc6XG4gICAgY2FzZSAnVEVYVEFSRUEnOlxuICAgICAgYWN0aXZlLmJsdXIoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIGFjdGl2ZSA9IG51bGw7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBzZWxlY3Rpb24udHlwZSA9PT0gJ0NhcmV0JyAmJlxuICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcblxuICAgIGlmICghc2VsZWN0aW9uLnJhbmdlQ291bnQpIHtcbiAgICAgIHJhbmdlcy5mb3JFYWNoKGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBhY3RpdmUgJiZcbiAgICBhY3RpdmUuZm9jdXMoKTtcbiAgfTtcbn07XG4iLCJpbXBvcnQgeyBlbWl0dGVyIH0gZnJvbSBcIi4vZW1pdHRlclwiO1xuaW1wb3J0IHsgdG9rZW5pemUgfSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcbmltcG9ydCB7IHBhcnNlIH0gZnJvbSBcIi4vcGFyc2VyXCI7XG5cbmV4cG9ydCBjb25zdCBjb21waWxlOiBDb21waWxlciA9IChzcmMpID0+IHtcbiAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUoc3JjKTtcbiAgY29uc3QgYXN0ID0gcGFyc2UodG9rZW5zKTtcbiAgY29uc3Qgd2FzbSA9IGVtaXR0ZXIoYXN0KTtcbiAgcmV0dXJuIHdhc207XG59O1xuXG5leHBvcnQgY29uc3QgcnVudGltZTogUnVudGltZSA9IGFzeW5jIChzcmMsIHsgcHJpbnQsIGRpc3BsYXlNZW1vcnkgfSkgPT4ge1xuICBjb25zdCB3YXNtID0gY29tcGlsZShzcmMpO1xuICBjb25zdCBpbXBvcnRPYmplY3QgPSB7XG4gICAgZW52OiB7IHByaW50LCBtZW1vcnk6IGRpc3BsYXlNZW1vcnkgfSxcbiAgfTtcbiAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZSh3YXNtLCBpbXBvcnRPYmplY3QpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHJlc3VsdC5pbnN0YW5jZS5leHBvcnRzLnJ1bigpO1xuICB9O1xufTtcbiIsImV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb25zdGFudHMge1xuICBzdGF0aWMgcmVhZG9ubHkgQ0FOVkFTX0RJTTogbnVtYmVyID0gMTAwO1xufVxuIiwiaW1wb3J0IHsgc3RyVG9CaW5hcnlOYW1lLCBudW1Ub0llZWU3NTRBcnJheSB9IGZyb20gXCIuL2VuY29kaW5nXCI7XG5pbXBvcnQgdHJhdmVyc2UgZnJvbSBcIi4vdHJhdmVyc2VcIjtcbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0ICogYXMgbGViIGZyb20gXCJAdGhpLm5nL2xlYjEyOFwiO1xuXG5jb25zdCBmbGF0dGVuID0gKGFycjogYW55W10pID0+IFtdLmNvbmNhdCguLi5hcnIpO1xuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvbW9kdWxlcy5odG1sI3NlY3Rpb25zXG5lbnVtIFNlY3Rpb24ge1xuICBjdXN0b20gPSAwLFxuICB0eXBlID0gMSxcbiAgaW1wb3J0ID0gMixcbiAgZnVuYyA9IDMsXG4gIHRhYmxlID0gNCxcbiAgbWVtb3J5ID0gNSxcbiAgZ2xvYmFsID0gNixcbiAgZXhwb3J0ID0gNyxcbiAgc3RhcnQgPSA4LFxuICBlbGVtZW50ID0gOSxcbiAgY29kZSA9IDEwLFxuICBkYXRhID0gMTEsXG59XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS90eXBlcy5odG1sXG5lbnVtIFZhbFR5cGUge1xuICBpMzIgPSAweDdmLFxuICBmMzIgPSAweDdkLFxufVxuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9zeW50YXgvaW5zdHJ1Y3Rpb25zLmh0bWwjc3ludGF4LUJsb2NrVHlwZVxuZW51bSBCbG9ja1R5cGUge1xuICB2b2lkID0gMHg0MCxcbn1cblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L2luc3RydWN0aW9ucy5odG1sXG5lbnVtIE9wY29kZSB7XG4gIGJsb2NrID0gMHgwMixcbiAgbG9vcCA9IDB4MDMsXG4gIGJyID0gMHgwYyxcbiAgYnJfaWYgPSAweDBkLFxuICBlbmQgPSAweDBiLFxuICBjYWxsID0gMHgxMCxcbiAgZ2V0X2xvY2FsID0gMHgyMCxcbiAgc2V0X2xvY2FsID0gMHgyMSxcbiAgaTMyX3N0b3JlXzggPSAweDNhLFxuICBmMzJfY29uc3QgPSAweDQzLFxuICBpMzJfZXF6ID0gMHg0NSxcbiAgZjMyX2VxID0gMHg1YixcbiAgZjMyX2x0ID0gMHg1ZCxcbiAgZjMyX2d0ID0gMHg1ZSxcbiAgaTMyX2FuZCA9IDB4NzEsXG4gIGkzMl9vciA9IDB4NzIsXG4gIGYzMl9hZGQgPSAweDkyLFxuICBmMzJfc3ViID0gMHg5MyxcbiAgZjMyX211bCA9IDB4OTQsXG4gIGYzMl9kaXYgPSAweDk1LFxuICBpMzJfdHJ1bmNfZjMyX3MgPSAweGE4LFxufVxuXG5jb25zdCBiaW5hcnlPcGNvZGUgPSB7XG4gIFwiK1wiOiBPcGNvZGUuZjMyX2FkZCxcbiAgXCItXCI6IE9wY29kZS5mMzJfc3ViLFxuICBcIipcIjogT3Bjb2RlLmYzMl9tdWwsXG4gIFwiL1wiOiBPcGNvZGUuZjMyX2RpdixcbiAgXCI9PVwiOiBPcGNvZGUuZjMyX2VxLFxuICBcIj5cIjogT3Bjb2RlLmYzMl9ndCxcbiAgXCI8XCI6IE9wY29kZS5mMzJfbHQsXG4gIFwiJiZcIjogT3Bjb2RlLmkzMl9hbmQsXG4gIFwifHxcIjogT3Bjb2RlLmkzMl9vcixcbn07XG5cbi8vIFJlZmVyZW5jZTogaHR0cDovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L21vZHVsZXMuaHRtbCNleHBvcnQtc2VjdGlvblxuZW51bSBFeHBvcnRUeXBlIHtcbiAgZnVuYyA9IDB4MDAsXG4gIHRhYmxlID0gMHgwMSxcbiAgbWVtID0gMHgwMixcbiAgZ2xvYmFsID0gMHgwMyxcbn1cblxuLy8gUmVmZXJlbmNlOiBodHRwOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvdHlwZXMuaHRtbCNmdW5jdGlvbi10eXBlc1xuY29uc3QgZnVuY3Rpb25UeXBlID0gMHg2MDtcblxuY29uc3QgZW1wdHlBcnJheSA9IDB4MDtcblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L21vZHVsZXMuaHRtbCNiaW5hcnktbW9kdWxlXG5jb25zdCBtYWdpY01vZHVsZUhlYWRlciA9IFsweDAwLCAweDYxLCAweDczLCAweDZkXTtcbmNvbnN0IG1vZHVsZVZlcnNpb24gPSBbMHgwMSwgMHgwMCwgMHgwMCwgMHgwMF07XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS9jb252ZW50aW9ucy5odG1sI3ZlY3RvcnNcbmNvbnN0IGVuY29kZVZlY3RvciA9IChkYXRhOiBhbnlbXSkgPT4gW1xuICAuLi5sZWIuZW5jb2RlVUxFQjEyOChkYXRhLmxlbmd0aCksXG4gIC4uLmZsYXR0ZW4oZGF0YSksXG5dO1xuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvbW9kdWxlcy5odG1sI2NvZGUtc2VjdGlvblxuY29uc3QgZW5jb2RlTG9jYWwgPSAoY291bnQ6IG51bWJlciwgdHlwZTogVmFsVHlwZSkgPT4gW1xuICAuLi5sZWIuZW5jb2RlVUxFQjEyOChjb3VudCksXG4gIHR5cGUsXG5dO1xuXG4vLyBSZWZlcmVuY2U6IGh0dHBzOi8vd2ViYXNzZW1ibHkuZ2l0aHViLmlvL3NwZWMvY29yZS9iaW5hcnkvbW9kdWxlcy5odG1sI3NlY3Rpb25zXG5jb25zdCBjcmVhdGVTZWN0aW9uID0gKHNlY3Rpb25UeXBlOiBTZWN0aW9uLCBkYXRhOiBhbnlbXSkgPT4gW1xuICBzZWN0aW9uVHlwZSxcbiAgLi4uZW5jb2RlVmVjdG9yKGRhdGEpLFxuXTtcblxuY29uc3QgY29kZUZyb21Bc3QgPSAoYXN0OiBQcm9ncmFtKSA9PiB7XG4gIGNvbnN0IGNvZGU6IG51bWJlcltdID0gW107XG5cbiAgY29uc3Qgc3ltYm9scyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgY29uc3QgbG9jYWxJbmRleEZvclN5bWJvbCA9IChuYW1lOiBzdHJpbmcpOiBudW1iZXIgPT4ge1xuICAgIGlmICghc3ltYm9scy5oYXMobmFtZSkpIHtcbiAgICAgIHN5bWJvbHMuc2V0KG5hbWUsIHN5bWJvbHMuc2l6ZSk7XG4gICAgfVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uXG4gICAgcmV0dXJuIHN5bWJvbHMuZ2V0KG5hbWUpITtcbiAgfTtcblxuICBjb25zdCBlbWl0RXhwcmVzc2lvbiA9IChub2RlOiBFeHByZXNzaW9uTm9kZSkgPT5cbiAgICB0cmF2ZXJzZShub2RlLCAobm9kZSkgPT4ge1xuICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlckxpdGVyYWxcIjpcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmYzMl9jb25zdCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLm51bVRvSWVlZTc1NEFycmF5KChub2RlIGFzIE51bWJlckxpdGVyYWxOb2RlKS52YWx1ZSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaWRlbnRpZmllclwiOlxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZ2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goXG4gICAgICAgICAgICAuLi5sZWIuZW5jb2RlVUxFQjEyOChcbiAgICAgICAgICAgICAgbG9jYWxJbmRleEZvclN5bWJvbCgobm9kZSBhcyBJZGVudGlmaWVyTm9kZSkudmFsdWUpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgICAgICBjb2RlLnB1c2goYmluYXJ5T3Bjb2RlWyhub2RlIGFzIEJpbmFyeUV4cHJlc2lvbk5vZGUpLm9wZXJhdG9yXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgY29uc3QgZW1pdFN0YXRlbWVudHMgPSAoc3RhdGVtZW50czogU3RhdGVtZW50Tm9kZVtdKSA9PlxuICAgIHN0YXRlbWVudHMuZm9yRWFjaCgoc3RhdGVtZW50KSA9PiB7XG4gICAgICBzd2l0Y2ggKHN0YXRlbWVudC50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJwcmludFN0YXRlbWVudFwiOlxuICAgICAgICAgIGVtaXRFeHByZXNzaW9uKHN0YXRlbWVudC5leHByZXNzaW9uKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmNhbGwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOCgwKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ2YXJpYWJsZURlY2xhcmF0aW9uXCI6XG4gICAgICAgICAgZW1pdEV4cHJlc3Npb24oc3RhdGVtZW50LmluaXRpYWxpemVyKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLnNldF9sb2NhbCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLmxlYi5lbmNvZGVVTEVCMTI4KGxvY2FsSW5kZXhGb3JTeW1ib2woc3RhdGVtZW50Lm5hbWUpKSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ2YXJpYWJsZUFzc2lnbm1lbnRcIjpcbiAgICAgICAgICBlbWl0RXhwcmVzc2lvbihzdGF0ZW1lbnQudmFsdWUpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuc2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVNMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChzdGF0ZW1lbnQubmFtZSkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIndoaWxlU3RhdGVtZW50XCI6XG4gICAgICAgICAgLy8gT3V0ZXIgYmxvY2tcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmJsb2NrKTtcbiAgICAgICAgICBjb2RlLnB1c2goQmxvY2tUeXBlLnZvaWQpO1xuXG4gICAgICAgICAgLy8gSW5uZXIgbG9vcFxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUubG9vcCk7XG4gICAgICAgICAgY29kZS5wdXNoKEJsb2NrVHlwZS52b2lkKTtcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIHdoaWxlIGV4cHJlc3Npb25cbiAgICAgICAgICBlbWl0RXhwcmVzc2lvbihzdGF0ZW1lbnQuZXhwcmVzc2lvbik7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5pMzJfZXF6KTtcblxuICAgICAgICAgIC8vIGJyX2lmICRsYWJlbDBcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmJyX2lmKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVNMRUIxMjgoMSkpO1xuXG4gICAgICAgICAgLy8gTmVzdGVkIGxvZ2ljXG4gICAgICAgICAgZW1pdFN0YXRlbWVudHMoc3RhdGVtZW50LnN0YXRlbWVudHMpO1xuXG4gICAgICAgICAgLy8gYnIgJGxhYmVsMVxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuYnIpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlU0xFQjEyOCgwKSk7XG5cbiAgICAgICAgICAvLyBFbmQgbG9vcFxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZW5kKTtcblxuICAgICAgICAgIC8vIEVuZCBibG9ja1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZW5kKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNldHBpeGVsU3RhdGVtZW50XCI6XG4gICAgICAgICAgLy8gQ29tcHV0ZSBhbmQgY2FjaGUgdGhlIHBhcmFtZXRlcnNcbiAgICAgICAgICBlbWl0RXhwcmVzc2lvbihzdGF0ZW1lbnQueCk7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5zZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKFwieFwiKSkpO1xuXG4gICAgICAgICAgZW1pdEV4cHJlc3Npb24oc3RhdGVtZW50LnkpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuc2V0X2xvY2FsKTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubGViLmVuY29kZVVMRUIxMjgobG9jYWxJbmRleEZvclN5bWJvbChcInlcIikpKTtcblxuICAgICAgICAgIGVtaXRFeHByZXNzaW9uKHN0YXRlbWVudC5jb2xvcik7XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5zZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKFwiY29sb3JcIikpKTtcblxuICAgICAgICAgIC8vIENvbXB1dGUgdGhlIG9mZnNldCAoeSAqIDEwMCkgKyB4XG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5nZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKFwieVwiKSkpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZjMyX2NvbnN0KTtcbiAgICAgICAgICBjb2RlLnB1c2goLi4ubnVtVG9JZWVlNzU0QXJyYXkoQ29uc3RhbnRzLkNBTlZBU19ESU0pKTtcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmYzMl9tdWwpO1xuXG4gICAgICAgICAgY29kZS5wdXNoKE9wY29kZS5nZXRfbG9jYWwpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5sZWIuZW5jb2RlVUxFQjEyOChsb2NhbEluZGV4Rm9yU3ltYm9sKFwieFwiKSkpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuZjMyX2FkZCk7XG5cbiAgICAgICAgICAvLyBDb252ZXJ0IHRvIGFuIGludGVnZXJcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmkzMl90cnVuY19mMzJfcyk7XG5cbiAgICAgICAgICAvLyBGZXRjaCB0aGUgY29sb3JcbiAgICAgICAgICBjb2RlLnB1c2goT3Bjb2RlLmdldF9sb2NhbCk7XG4gICAgICAgICAgY29kZS5wdXNoKC4uLmxlYi5lbmNvZGVVTEVCMTI4KGxvY2FsSW5kZXhGb3JTeW1ib2woXCJjb2xvclwiKSkpO1xuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuaTMyX3RydW5jX2YzMl9zKTtcblxuICAgICAgICAgIC8vIFdyaXRlIHRvIG1lbW9yeVxuICAgICAgICAgIGNvZGUucHVzaChPcGNvZGUuaTMyX3N0b3JlXzgpO1xuICAgICAgICAgIGNvZGUucHVzaCguLi5bMHgwMCwgMHgwMF0pOyAvLyBNZW1vcnkgYWxpZ24gYW5kIG9mZnNldCBhdHRyaWJ1dGVzXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgZW1pdFN0YXRlbWVudHMoYXN0KTtcblxuICByZXR1cm4geyBjb2RlLCBsb2NhbENvdW50OiBzeW1ib2xzLnNpemUgfTtcbn07XG5cbi8vIFJlZmVyZW5jZTogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS9tb2R1bGVzLmh0bWxcbmV4cG9ydCBjb25zdCBlbWl0dGVyOiBFbWl0dGVyID0gKGFzdDogUHJvZ3JhbSkgPT4ge1xuICAvLyBGdW5jdGlvbiB0eXBlcyBjb250YWluIHZlY3RvcnMgb2YgcGFyYW1ldGVycyBhbmQgYSByZXR1cm4gdHlwZVxuICBjb25zdCB2b2lkVm9pZFR5cGUgPSBbZnVuY3Rpb25UeXBlLCBlbXB0eUFycmF5LCBlbXB0eUFycmF5XTtcblxuICBjb25zdCBmbG9hdFZvaWRUeXBlID0gW1xuICAgIGZ1bmN0aW9uVHlwZSxcbiAgICAuLi5lbmNvZGVWZWN0b3IoW1ZhbFR5cGUuZjMyXSkgLyogUGFyYW1ldGVyIHR5cGVzICovLFxuICAgIGVtcHR5QXJyYXkgLyogUmV0dXJuIHR5cGVzICovLFxuICBdO1xuXG4gIC8vIFZlY3RvciBvZiBmdW5jdGlvbiB0eXBlc1xuICBjb25zdCB0eXBlU2VjdGlvbiA9IGNyZWF0ZVNlY3Rpb24oXG4gICAgU2VjdGlvbi50eXBlLFxuICAgIGVuY29kZVZlY3Rvcihbdm9pZFZvaWRUeXBlLCBmbG9hdFZvaWRUeXBlXSlcbiAgKTtcblxuICAvLyBWZWN0b3Igb2YgdHlwZSBpbmRpY2VzIGluZGljYXRpbmcgdGhlIHR5cGUgb2YgZWFjaCBmdW5jdGlvbiBpbiB0aGUgY29kZSBzZWN0aW9uXG4gIGNvbnN0IGZ1bmNTZWN0aW9uID0gY3JlYXRlU2VjdGlvbihcbiAgICBTZWN0aW9uLmZ1bmMsXG4gICAgZW5jb2RlVmVjdG9yKFsweDAwIC8qIEluZGV4IG9mIHRoZSB0eXBlICovXSlcbiAgKTtcblxuICAvLyBWZWN0b3Igb2YgaW1wb3J0ZWQgZnVuY3Rpb25zXG4gIGNvbnN0IHByaW50RnVuY3Rpb25JbXBvcnQgPSBbXG4gICAgLi4uc3RyVG9CaW5hcnlOYW1lKFwiZW52XCIpLFxuICAgIC4uLnN0clRvQmluYXJ5TmFtZShcInByaW50XCIpLFxuICAgIEV4cG9ydFR5cGUuZnVuYyxcbiAgICAweDAxIC8qIEluZGV4IG9mIHRoZSB0eXBlICovLFxuICBdO1xuXG4gIGNvbnN0IG1lbW9yeUltcG9ydCA9IFtcbiAgICAuLi5zdHJUb0JpbmFyeU5hbWUoXCJlbnZcIiksXG4gICAgLi4uc3RyVG9CaW5hcnlOYW1lKFwibWVtb3J5XCIpLFxuICAgIEV4cG9ydFR5cGUubWVtLFxuICAgIC8vIExpbWl0czogaHR0cHM6Ly93ZWJhc3NlbWJseS5naXRodWIuaW8vc3BlYy9jb3JlL2JpbmFyeS90eXBlcy5odG1sI2xpbWl0c1xuICAgIDB4MDAsXG4gICAgMHgwMSxcbiAgXTtcblxuICBjb25zdCBpbXBvcnRTZWN0aW9uID0gY3JlYXRlU2VjdGlvbihcbiAgICBTZWN0aW9uLmltcG9ydCxcbiAgICBlbmNvZGVWZWN0b3IoW3ByaW50RnVuY3Rpb25JbXBvcnQsIG1lbW9yeUltcG9ydF0pXG4gICk7XG5cbiAgLy8gVmVjdG9yIG9mIGV4cG9ydGVkIGZ1bmN0aW9uc1xuICBjb25zdCBleHBvcnRTZWN0aW9uID0gY3JlYXRlU2VjdGlvbihcbiAgICBTZWN0aW9uLmV4cG9ydCxcbiAgICBlbmNvZGVWZWN0b3IoW1xuICAgICAgW1xuICAgICAgICAuLi5zdHJUb0JpbmFyeU5hbWUoXCJydW5cIiksXG4gICAgICAgIEV4cG9ydFR5cGUuZnVuYyxcbiAgICAgICAgMHgwMSAvKiBJbmRleCBvZiB0aGUgZnVuY3Rpb24gKi8sXG4gICAgICBdLFxuICAgIF0pXG4gICk7XG5cbiAgLy8gVmVjdG9ycyBvZiBmdW5jdGlvbnNcbiAgY29uc3QgeyBjb2RlLCBsb2NhbENvdW50IH0gPSBjb2RlRnJvbUFzdChhc3QpO1xuICBjb25zdCBsb2NhbHMgPSBsb2NhbENvdW50ID4gMCA/IFtlbmNvZGVMb2NhbChsb2NhbENvdW50LCBWYWxUeXBlLmYzMildIDogW107XG5cbiAgY29uc3QgZnVuY3Rpb25Cb2R5ID0gZW5jb2RlVmVjdG9yKFtcbiAgICAuLi5lbmNvZGVWZWN0b3IobG9jYWxzKSxcbiAgICAuLi5jb2RlLFxuICAgIE9wY29kZS5lbmQsXG4gIF0pO1xuXG4gIGNvbnN0IGNvZGVTZWN0aW9uID0gY3JlYXRlU2VjdGlvbihTZWN0aW9uLmNvZGUsIGVuY29kZVZlY3RvcihbZnVuY3Rpb25Cb2R5XSkpO1xuXG4gIHJldHVybiBVaW50OEFycmF5LmZyb20oW1xuICAgIC4uLm1hZ2ljTW9kdWxlSGVhZGVyLFxuICAgIC4uLm1vZHVsZVZlcnNpb24sXG4gICAgLi4udHlwZVNlY3Rpb24sXG4gICAgLi4uaW1wb3J0U2VjdGlvbixcbiAgICAuLi5mdW5jU2VjdGlvbixcbiAgICAuLi5leHBvcnRTZWN0aW9uLFxuICAgIC4uLmNvZGVTZWN0aW9uLFxuICBdKTtcbn07XG4iLCJleHBvcnQgY29uc3QgbnVtVG9JZWVlNzU0QXJyYXkgPSAobjogbnVtYmVyKTogVWludDhBcnJheSA9PiB7XG4gIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5hbGxvY1Vuc2FmZSg0KTtcbiAgYnVmLndyaXRlRmxvYXRMRShuLCAwKTtcbiAgcmV0dXJuIFVpbnQ4QXJyYXkuZnJvbShidWYpO1xufTtcblxuLy8gUmVmZXJlbmNlOiBodHRwczovL3dlYmFzc2VtYmx5LmdpdGh1Yi5pby9zcGVjL2NvcmUvYmluYXJ5L3ZhbHVlcy5odG1sI2JpbmFyeS1uYW1lXG5leHBvcnQgY29uc3Qgc3RyVG9CaW5hcnlOYW1lID0gKHN0cjogc3RyaW5nKTogbnVtYmVyW10gPT4gW1xuICBzdHIubGVuZ3RoLFxuICAuLi5zdHIuc3BsaXQoXCJcIikubWFwKChzKSA9PiBzLmNoYXJDb2RlQXQoMCkpLFxuXTtcbiIsImltcG9ydCB7IHRva2VuaXplIH0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCIuL3BhcnNlclwiO1xuaW1wb3J0IHsgQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbmNvbnN0IGFwcGx5T3BlcmF0b3IgPSAob3BlcmF0b3I6IHN0cmluZywgbGVmdDogbnVtYmVyLCByaWdodDogbnVtYmVyKSA9PiB7XG4gIHN3aXRjaCAob3BlcmF0b3IpIHtcbiAgICBjYXNlIFwiK1wiOlxuICAgICAgcmV0dXJuIGxlZnQgKyByaWdodDtcbiAgICBjYXNlIFwiLVwiOlxuICAgICAgcmV0dXJuIGxlZnQgLSByaWdodDtcbiAgICBjYXNlIFwiKlwiOlxuICAgICAgcmV0dXJuIGxlZnQgKiByaWdodDtcbiAgICBjYXNlIFwiL1wiOlxuICAgICAgcmV0dXJuIGxlZnQgLyByaWdodDtcbiAgICBjYXNlIFwiPT1cIjpcbiAgICAgIHJldHVybiBsZWZ0ID09IHJpZ2h0ID8gMSA6IDA7XG4gICAgY2FzZSBcIj5cIjpcbiAgICAgIHJldHVybiBsZWZ0ID4gcmlnaHQgPyAxIDogMDtcbiAgICBjYXNlIFwiPFwiOlxuICAgICAgcmV0dXJuIGxlZnQgPCByaWdodCA/IDEgOiAwO1xuICAgIGNhc2UgXCImJlwiOlxuICAgICAgcmV0dXJuIGxlZnQgJiYgcmlnaHQ7XG4gICAgY2FzZSBcInx8XCI6XG4gICAgICByZXR1cm4gbGVmdCB8fCByaWdodDtcbiAgfVxuICB0aHJvdyBFcnJvcihgVW5rbm93biBiaW5hcnkgb3BlcmF0b3IgJHtvcGVyYXRvcn1gKTtcbn07XG5cbmV4cG9ydCBjb25zdCBydW50aW1lOiBSdW50aW1lID1cbiAgYXN5bmMgKHNyYywgeyBwcmludCwgZGlzcGxheU1lbW9yeSB9KSA9PlxuICAoKSA9PiB7XG4gICAgY29uc3QgdG9rZW5zID0gdG9rZW5pemUoc3JjKTtcbiAgICBjb25zdCBhc3QgPSBwYXJzZSh0b2tlbnMpO1xuXG4gICAgY29uc3Qgc3ltYm9scyA9IG5ldyBNYXAoKTtcblxuICAgIGNvbnN0IGV2YWx1YXRlRXhwcmVzc2lvbiA9IChleHByZXNzaW9uOiBFeHByZXNzaW9uTm9kZSk6IG51bWJlciA9PiB7XG4gICAgICBzd2l0Y2ggKGV4cHJlc3Npb24udHlwZSkge1xuICAgICAgICBjYXNlIFwibnVtYmVyTGl0ZXJhbFwiOlxuICAgICAgICAgIHJldHVybiBleHByZXNzaW9uLnZhbHVlO1xuICAgICAgICBjYXNlIFwiYmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICAgIHJldHVybiBhcHBseU9wZXJhdG9yKFxuICAgICAgICAgICAgZXhwcmVzc2lvbi5vcGVyYXRvcixcbiAgICAgICAgICAgIGV2YWx1YXRlRXhwcmVzc2lvbihleHByZXNzaW9uLmxlZnQpLFxuICAgICAgICAgICAgZXZhbHVhdGVFeHByZXNzaW9uKGV4cHJlc3Npb24ucmlnaHQpXG4gICAgICAgICAgKTtcbiAgICAgICAgY2FzZSBcImlkZW50aWZpZXJcIjpcbiAgICAgICAgICByZXR1cm4gc3ltYm9scy5nZXQoZXhwcmVzc2lvbi52YWx1ZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGV4ZWN1dGVTdGF0ZW1lbnRzID0gKHN0YXRlbWVudHM6IFN0YXRlbWVudE5vZGVbXSkgPT4ge1xuICAgICAgc3RhdGVtZW50cy5mb3JFYWNoKChzdGF0ZW1lbnQpID0+IHtcbiAgICAgICAgc3dpdGNoIChzdGF0ZW1lbnQudHlwZSkge1xuICAgICAgICAgIGNhc2UgXCJwcmludFN0YXRlbWVudFwiOlxuICAgICAgICAgICAgcHJpbnQoZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC5leHByZXNzaW9uKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidmFyaWFibGVEZWNsYXJhdGlvblwiOlxuICAgICAgICAgICAgc3ltYm9scy5zZXQoXG4gICAgICAgICAgICAgIHN0YXRlbWVudC5uYW1lLFxuICAgICAgICAgICAgICBldmFsdWF0ZUV4cHJlc3Npb24oc3RhdGVtZW50LmluaXRpYWxpemVyKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ2YXJpYWJsZUFzc2lnbm1lbnRcIjpcbiAgICAgICAgICAgIHN5bWJvbHMuc2V0KHN0YXRlbWVudC5uYW1lLCBldmFsdWF0ZUV4cHJlc3Npb24oc3RhdGVtZW50LnZhbHVlKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwid2hpbGVTdGF0ZW1lbnRcIjpcbiAgICAgICAgICAgIHdoaWxlIChldmFsdWF0ZUV4cHJlc3Npb24oc3RhdGVtZW50LmV4cHJlc3Npb24pKSB7XG4gICAgICAgICAgICAgIGV4ZWN1dGVTdGF0ZW1lbnRzKHN0YXRlbWVudC5zdGF0ZW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzZXRwaXhlbFN0YXRlbWVudFwiOiB7XG4gICAgICAgICAgICBjb25zdCB4ID0gZXZhbHVhdGVFeHByZXNzaW9uKHN0YXRlbWVudC54KTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSBldmFsdWF0ZUV4cHJlc3Npb24oc3RhdGVtZW50LnkpO1xuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBldmFsdWF0ZUV4cHJlc3Npb24oc3RhdGVtZW50LmNvbG9yKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3BsYXlCdWZmZXIgPSBuZXcgVWludDhBcnJheShkaXNwbGF5TWVtb3J5LmJ1ZmZlcik7XG4gICAgICAgICAgICBkaXNwbGF5QnVmZmVyW3kgKiBDb25zdGFudHMuQ0FOVkFTX0RJTSArIHhdID0gY29sb3I7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBleGVjdXRlU3RhdGVtZW50cyhhc3QpO1xuICB9O1xuIiwiZXhwb3J0IGNsYXNzIFBhcnNlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICB0b2tlbjogVG9rZW47XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgdG9rZW46IFRva2VuKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBwYXJzZTogUGFyc2VyID0gKHRva2VucykgPT4ge1xuICBjb25zdCB0b2tlbkl0ZXJhdG9yID0gdG9rZW5zW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgbGV0IGN1cnJlbnRUb2tlbiA9IHRva2VuSXRlcmF0b3IubmV4dCgpLnZhbHVlO1xuXG4gIGNvbnN0IGN1cnJlbnRUb2tlbklzS2V5d29yZCA9IChuYW1lOiBzdHJpbmcpID0+XG4gICAgY3VycmVudFRva2VuLnZhbHVlID09PSBuYW1lICYmIGN1cnJlbnRUb2tlbi50eXBlID09PSBcImtleXdvcmRcIjtcblxuICBjb25zdCBlYXRUb2tlbiA9ICh2YWx1ZT86IHN0cmluZykgPT4ge1xuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZSAhPT0gY3VycmVudFRva2VuLnZhbHVlKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXG4gICAgICAgIGBVbmV4cGVjdGVkIHRva2VuIHZhbHVlLCBleHBlY3RlZCAke3ZhbHVlfSwgcmVjZWl2ZWQgJHtjdXJyZW50VG9rZW4udmFsdWV9YCxcbiAgICAgICAgY3VycmVudFRva2VuXG4gICAgICApO1xuICAgIH1cbiAgICBjdXJyZW50VG9rZW4gPSB0b2tlbkl0ZXJhdG9yLm5leHQoKS52YWx1ZTtcbiAgfTtcblxuICBjb25zdCBwYXJzZUV4cHJlc3Npb246IFBhcnNlclN0ZXA8RXhwcmVzc2lvbk5vZGU+ID0gKCkgPT4ge1xuICAgIGxldCBub2RlOiBFeHByZXNzaW9uTm9kZTtcbiAgICBzd2l0Y2ggKGN1cnJlbnRUb2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIG5vZGUgPSB7XG4gICAgICAgICAgdHlwZTogXCJudW1iZXJMaXRlcmFsXCIsXG4gICAgICAgICAgdmFsdWU6IE51bWJlcihjdXJyZW50VG9rZW4udmFsdWUpLFxuICAgICAgICB9O1xuICAgICAgICBlYXRUb2tlbigpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgIG5vZGUgPSB7IHR5cGU6IFwiaWRlbnRpZmllclwiLCB2YWx1ZTogY3VycmVudFRva2VuLnZhbHVlIH07XG4gICAgICAgIGVhdFRva2VuKCk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgY2FzZSBcInBhcmVudGhlc2VzXCI6IHtcbiAgICAgICAgZWF0VG9rZW4oXCIoXCIpO1xuICAgICAgICBjb25zdCBsZWZ0ID0gcGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIGNvbnN0IG9wZXJhdG9yID0gY3VycmVudFRva2VuLnZhbHVlO1xuICAgICAgICBlYXRUb2tlbigpO1xuICAgICAgICBjb25zdCByaWdodCA9IHBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICBlYXRUb2tlbihcIilcIik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogXCJiaW5hcnlFeHByZXNzaW9uXCIsXG4gICAgICAgICAgbGVmdCxcbiAgICAgICAgICByaWdodCxcbiAgICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IgYXMgT3BlcmF0b3IsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXG4gICAgICAgICAgYFVuZXhwZWN0ZWQgdG9rZW4gdHlwZSAke2N1cnJlbnRUb2tlbi50eXBlfWAsXG4gICAgICAgICAgY3VycmVudFRva2VuXG4gICAgICAgICk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHBhcnNlUHJpbnRTdGF0ZW1lbnQ6IFBhcnNlclN0ZXA8UHJpbnRTdGF0ZW1lbnROb2RlPiA9ICgpID0+IHtcbiAgICBlYXRUb2tlbihcInByaW50XCIpO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcInByaW50U3RhdGVtZW50XCIsXG4gICAgICBleHByZXNzaW9uOiBwYXJzZUV4cHJlc3Npb24oKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IHBhcnNlV2hpbGVTdGF0ZW1lbnQ6IFBhcnNlclN0ZXA8V2hpbGVTdGF0ZW1lbnROb2RlPiA9ICgpID0+IHtcbiAgICBlYXRUb2tlbihcIndoaWxlXCIpO1xuXG4gICAgY29uc3QgZXhwcmVzc2lvbiA9IHBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgY29uc3Qgc3RhdGVtZW50czogU3RhdGVtZW50Tm9kZVtdID0gW107XG4gICAgd2hpbGUgKCFjdXJyZW50VG9rZW5Jc0tleXdvcmQoXCJlbmR3aGlsZVwiKSkge1xuICAgICAgc3RhdGVtZW50cy5wdXNoKHBhcnNlU3RhdGVtZW50KCkpO1xuICAgIH1cblxuICAgIGVhdFRva2VuKFwiZW5kd2hpbGVcIik7XG5cbiAgICByZXR1cm4geyB0eXBlOiBcIndoaWxlU3RhdGVtZW50XCIsIGV4cHJlc3Npb24sIHN0YXRlbWVudHMgfTtcbiAgfTtcblxuICBjb25zdCBwYXJzZVZhcmlhYmxlQXNzaWdubWVudDogUGFyc2VyU3RlcDxWYXJpYWJsZUFzc2lnbm1lbnROb2RlPiA9ICgpID0+IHtcbiAgICBjb25zdCBuYW1lID0gY3VycmVudFRva2VuLnZhbHVlO1xuICAgIGVhdFRva2VuKCk7XG4gICAgZWF0VG9rZW4oXCI9XCIpO1xuICAgIHJldHVybiB7IHR5cGU6IFwidmFyaWFibGVBc3NpZ25tZW50XCIsIG5hbWUsIHZhbHVlOiBwYXJzZUV4cHJlc3Npb24oKSB9O1xuICB9O1xuXG4gIGNvbnN0IHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudDogUGFyc2VyU3RlcDxcbiAgICBWYXJpYWJsZURlY2xhcmF0aW9uTm9kZVxuICA+ID0gKCkgPT4ge1xuICAgIGVhdFRva2VuKFwidmFyXCIpO1xuICAgIGNvbnN0IG5hbWUgPSBjdXJyZW50VG9rZW4udmFsdWU7XG4gICAgZWF0VG9rZW4oKTtcbiAgICBlYXRUb2tlbihcIj1cIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwidmFyaWFibGVEZWNsYXJhdGlvblwiLFxuICAgICAgbmFtZSxcbiAgICAgIGluaXRpYWxpemVyOiBwYXJzZUV4cHJlc3Npb24oKSxcbiAgICB9O1xuICB9O1xuXG4gIGNvbnN0IHBhcnNlU2V0UGl4ZWxTdGF0ZW1lbnQ6IFBhcnNlclN0ZXA8U2V0UGl4ZWxTdGF0ZW1lbnROb2RlPiA9ICgpID0+IHtcbiAgICBlYXRUb2tlbihcInNldHBpeGVsXCIpO1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcInNldHBpeGVsU3RhdGVtZW50XCIsXG4gICAgICB4OiBwYXJzZUV4cHJlc3Npb24oKSxcbiAgICAgIHk6IHBhcnNlRXhwcmVzc2lvbigpLFxuICAgICAgY29sb3I6IHBhcnNlRXhwcmVzc2lvbigpLFxuICAgIH07XG4gIH07XG5cbiAgY29uc3QgcGFyc2VTdGF0ZW1lbnQ6IFBhcnNlclN0ZXA8U3RhdGVtZW50Tm9kZT4gPSAoKSA9PiB7XG4gICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSBcImtleXdvcmRcIikge1xuICAgICAgc3dpdGNoIChjdXJyZW50VG9rZW4udmFsdWUpIHtcbiAgICAgICAgY2FzZSBcInByaW50XCI6XG4gICAgICAgICAgcmV0dXJuIHBhcnNlUHJpbnRTdGF0ZW1lbnQoKTtcbiAgICAgICAgY2FzZSBcInZhclwiOlxuICAgICAgICAgIHJldHVybiBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKTtcbiAgICAgICAgY2FzZSBcIndoaWxlXCI6XG4gICAgICAgICAgcmV0dXJuIHBhcnNlV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgICAgY2FzZSBcInNldHBpeGVsXCI6XG4gICAgICAgICAgcmV0dXJuIHBhcnNlU2V0UGl4ZWxTdGF0ZW1lbnQoKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VyRXJyb3IoXG4gICAgICAgICAgICBgVW5rbm93biBrZXl3b3JkICR7Y3VycmVudFRva2VuLnZhbHVlfWAsXG4gICAgICAgICAgICBjdXJyZW50VG9rZW5cbiAgICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY3VycmVudFRva2VuLnR5cGUgPT09IFwiaWRlbnRpZmllclwiKSB7XG4gICAgICByZXR1cm4gcGFyc2VWYXJpYWJsZUFzc2lnbm1lbnQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlckVycm9yKFxuICAgICAgICBgVW5leHBlY3RlZCB0b2tlbiB0eXBlICR7Y3VycmVudFRva2VuLnZhbHVlfWAsXG4gICAgICAgIGN1cnJlbnRUb2tlblxuICAgICAgKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgbm9kZXM6IFN0YXRlbWVudE5vZGVbXSA9IFtdO1xuICB3aGlsZSAoY3VycmVudFRva2VuKSB7XG4gICAgbm9kZXMucHVzaChwYXJzZVN0YXRlbWVudCgpKTtcbiAgfVxuXG4gIHJldHVybiBub2Rlcztcbn07XG4iLCJleHBvcnQgY29uc3Qga2V5d29yZHMgPSBbXCJwcmludFwiLCBcInZhclwiLCBcIndoaWxlXCIsIFwiZW5kd2hpbGVcIiwgXCJzZXRwaXhlbFwiXTtcbmV4cG9ydCBjb25zdCBvcGVyYXRvcnMgPSBbXCIrXCIsIFwiLVwiLCBcIipcIiwgXCIvXCIsIFwiPT1cIiwgXCI8XCIsIFwiPlwiLCBcIiYmXCIsIFwifHxcIl07XG5cbmNvbnN0IGVzY2FwZVJlZ2V4ID0gKHRleHQ6IHN0cmluZykgPT5cbiAgdGV4dC5yZXBsYWNlKC9bLVtcXF17fSgpKis/LixcXFxcXiR8I1xcc10vZywgXCJcXFxcJCZcIik7XG5cbmV4cG9ydCBjbGFzcyBUb2tlbml6ZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgaW5kZXg6IG51bWJlcjtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICB9XG59XG5cbi8vIFJldHVybnMgYSB0b2tlbiBpZiB0aGUgcmVnZXggbWF0Y2hlcyBhdCB0aGUgY3VycmVudCBpbmRleFxuY29uc3QgcmVnZXhNYXRjaGVyID1cbiAgKHJlZ2V4OiBzdHJpbmcsIHR5cGU6IFRva2VuVHlwZSk6IE1hdGNoZXIgPT5cbiAgKGlucHV0LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG1hdGNoID0gaW5wdXQuc3Vic3RyaW5nKGluZGV4KS5tYXRjaChyZWdleCk7XG4gICAgcmV0dXJuIG1hdGNoICYmIHsgdHlwZSwgdmFsdWU6IG1hdGNoWzBdIH07XG4gIH07XG5cbmNvbnN0IG1hdGNoZXJzID0gW1xuICByZWdleE1hdGNoZXIoXCJeLT9bLjAtOV0rKFtlRV0tP1swLTldezJ9KT9cIiwgXCJudW1iZXJcIiksXG4gIHJlZ2V4TWF0Y2hlcihgXigke2tleXdvcmRzLmpvaW4oXCJ8XCIpfSlgLCBcImtleXdvcmRcIiksXG4gIHJlZ2V4TWF0Y2hlcihcIl5cXFxccytcIiwgXCJ3aGl0ZXNwYWNlXCIpLFxuICByZWdleE1hdGNoZXIoYF4oJHtvcGVyYXRvcnMubWFwKGVzY2FwZVJlZ2V4KS5qb2luKFwifFwiKX0pYCwgXCJvcGVyYXRvclwiKSxcbiAgcmVnZXhNYXRjaGVyKGBeW2EtekEtWl0rYCwgXCJpZGVudGlmaWVyXCIpLFxuICByZWdleE1hdGNoZXIoYF49YCwgXCJhc3NpZ25tZW50XCIpLFxuICByZWdleE1hdGNoZXIoXCJeWygpXXsxfVwiLCBcInBhcmVudGhlc2VzXCIpLFxuXTtcblxuY29uc3QgbG9jYXRpb25Gb3JJbmRleCA9IChpbnB1dDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiAoe1xuICBjaGFyOiBpbmRleCAtIGlucHV0Lmxhc3RJbmRleE9mKFwiXFxuXCIsIGluZGV4KSAtIDEsXG4gIGxpbmU6IGlucHV0LnN1YnN0cmluZygwLCBpbmRleCkuc3BsaXQoXCJcXG5cIikubGVuZ3RoIC0gMSxcbn0pO1xuXG5leHBvcnQgY29uc3QgdG9rZW5pemU6IFRva2VuaXplciA9IChpbnB1dCkgPT4ge1xuICBjb25zdCB0b2tlbnM6IFRva2VuW10gPSBbXTtcbiAgbGV0IGluZGV4ID0gMDtcbiAgd2hpbGUgKGluZGV4IDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgY29uc3QgbWF0Y2hlcyA9IG1hdGNoZXJzLm1hcCgobSkgPT4gbShpbnB1dCwgaW5kZXgpKS5maWx0ZXIoKGYpID0+IGYpO1xuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA+IDAgJiYgbWF0Y2hlc1swXSkge1xuICAgICAgLy8gVGFrZSB0aGUgaGlnaGVzdCBwcmlvcml0eSBtYXRjaCAoYXQgZmlyc3QgaW5kZXgpXG4gICAgICBjb25zdCBtYXRjaCA9IG1hdGNoZXNbMF07XG4gICAgICBpZiAobWF0Y2gudHlwZSAhPT0gXCJ3aGl0ZXNwYWNlXCIpIHtcbiAgICAgICAgdG9rZW5zLnB1c2goeyAuLi5tYXRjaCwgLi4ubG9jYXRpb25Gb3JJbmRleChpbnB1dCwgaW5kZXgpIH0pO1xuICAgICAgfVxuICAgICAgaW5kZXggKz0gbWF0Y2gudmFsdWUubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVG9rZW5pemVyRXJyb3IoXG4gICAgICAgIGBVbmV4cGVjdGVkIHRva2VuICR7aW5wdXQuc3Vic3RyaW5nKGluZGV4LCBpbmRleCArIDEpfWAsXG4gICAgICAgIGluZGV4XG4gICAgICApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdG9rZW5zO1xufTtcbiIsIi8vIFBvc3RvcmRlciBBU1QgdHJhdmVyc2FsIGZvciB0aGUgc3RhY2sgbWFjaGluZSAob3BlcmFuZHMgdGhlbiBvcGVyYXRvcilcbmNvbnN0IHRyYXZlcnNlOiBUcmF2ZXJzZSA9IChub2RlcywgdmlzaXRvcikgPT4ge1xuICBub2RlcyA9IEFycmF5LmlzQXJyYXkobm9kZXMpID8gbm9kZXMgOiBbbm9kZXNdO1xuICBub2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgKE9iamVjdC5rZXlzKG5vZGUpIGFzIChrZXlvZiBQcm9ncmFtTm9kZSlbXSkuZm9yRWFjaCgocHJvcCkgPT4ge1xuICAgICAgY29uc3QgdmFsdWUgPSBub2RlW3Byb3BdO1xuICAgICAgY29uc3QgdmFsdWVBc0FycmF5OiBzdHJpbmdbXSA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbdmFsdWVdO1xuICAgICAgdmFsdWVBc0FycmF5LmZvckVhY2goKGNoaWxkTm9kZTogYW55KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgY2hpbGROb2RlLnR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB0cmF2ZXJzZShjaGlsZE5vZGUsIHZpc2l0b3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB2aXNpdG9yKG5vZGUpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHRyYXZlcnNlO1xuIl19
