(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"_process":18}],2:[function(require,module,exports){
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

},{"@thi.ng/api":1,"@thi.ng/checks":4,"@thi.ng/compare":5,"@thi.ng/equiv":7,"@thi.ng/errors":8,"@thi.ng/random":12}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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
},{"_process":18}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"@thi.ng/errors":8}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var checks = require('@thi.ng/checks');
var errors = require('@thi.ng/errors');
var transducersBinary = require('@thi.ng/transducers-binary');

const BINARY = "AGFzbQEAAAABCgJgAXwBf2AAAXwDBQQAAQABBQMBAAIGFAN/AEGQiAQLfwBBiggLfwBBgAgLB38IBm1lbW9yeQIAC19faGVhcF9iYXNlAwAKX19kYXRhX2VuZAMBEmxlYjEyOF9lbmNvZGVfdV9qcwAAA2J1ZgMCEmxlYjEyOF9kZWNvZGVfdV9qcwABEmxlYjEyOF9lbmNvZGVfc19qcwACEmxlYjEyOF9kZWNvZGVfc19qcwADCoMEBHoCAn8BfgJAAkAgAEQAAAAAAADwQ2MgAEQAAAAAAAAAAGZxRQRADAELIACxIgNCgAFaDQELQYAIIAOnQf8AcToAAEEBDwsDQCABQYAIaiADpyICQf8AcSACQYABciADQgeIIgNQGzoAACABQQFqIQEgA0IAUg0ACyABC14CA38CfgJAA0AgAEEJSw0BIAFBAWohASAAQYAIaiwAACICQf8Aca0gBIYgA4QhAyAAQQFqIQAgBEIHfCEEIAJBf0wNAAtBgAggAToAACADug8LQYAIIAA6AAAgA7oLqwECBH8BfiAAmUQAAAAAAADgQ2MEfiAAsAVCgICAgICAgICAfwsiBUJAfUKAAVQEQEGACCAFQjmIp0HAAHEgBadBP3FyOgAAQQEPCwNAIAWnIgJBwABxIQMgAUGACGoCfwJAIAVCB4ciBUIAUQRAIANFDQELQQEhBCACQYB/ciADRSAFQn9Scg0BGgtBACEEIAJB/wBxCzoAACABQQFqIQEgBA0ACyABQf8BcQt6AgR/A34DQAJAIABBAWohASAFQgd8IQYgAEGACGotAAAiA0EYdEEYdSECIANB/wBxrSAFhiAEhCEEIABBCEsNACABIQAgBiEFIAJBAEgNAQsLQYAIIAE6AAAgBCAEQn8gBkI/g4aEIAJBwABxRSABQf8BcUEJS3IbuQs=";

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

},{"@thi.ng/checks":4,"@thi.ng/errors":8,"@thi.ng/transducers-binary":13}],11:[function(require,module,exports){
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
const eqDeltaFixed = eqDelta;
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
exports.eqDeltaFixed = eqDeltaFixed;
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

},{}],12:[function(require,module,exports){
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

},{"@thi.ng/api":1,"@thi.ng/checks":4,"@thi.ng/hex":9}],13:[function(require,module,exports){
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

},{"@thi.ng/binary":3,"@thi.ng/compose":6,"@thi.ng/errors":8,"@thi.ng/hex":9,"@thi.ng/random":12,"@thi.ng/transducers":14}],14:[function(require,module,exports){
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

},{"@thi.ng/api":1,"@thi.ng/arrays":2,"@thi.ng/checks":4,"@thi.ng/compare":5,"@thi.ng/compose":6,"@thi.ng/errors":8,"@thi.ng/math":11,"@thi.ng/random":12}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
},{"base64-js":15,"buffer":16,"ieee754":17}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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
    var tokens = tokenizer_1.tokenize(src);
    var ast = parser_1.parse(tokens);
    var wasm = emitter_1.emitter(ast);
    return wasm;
};
exports.compile = compile;
var runtime = function (src, env) { return __awaiter(void 0, void 0, void 0, function () {
    var wasm, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                wasm = exports.compile(src);
                return [4 /*yield*/, WebAssembly.instantiate(wasm, { env: env })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, function () {
                        result.instance.exports.run();
                    }];
        }
    });
}); };
exports.runtime = runtime;

},{"./emitter":20,"./parser":23,"./tokenizer":24}],20:[function(require,module,exports){
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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = void 0;
var encoding_1 = require("./encoding");
var leb = __importStar(require("@thi.ng/leb128"));
var flatten = function (arr) { return [].concat.apply([], __spreadArray([], __read(arr))); };
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
var Valtype;
(function (Valtype) {
    Valtype[Valtype["i32"] = 127] = "i32";
    Valtype[Valtype["f32"] = 125] = "f32";
})(Valtype || (Valtype = {}));
// Reference: https://webassembly.github.io/spec/core/binary/instructions.html
var Opcodes;
(function (Opcodes) {
    Opcodes[Opcodes["end"] = 11] = "end";
    Opcodes[Opcodes["call"] = 16] = "call";
    Opcodes[Opcodes["get_local"] = 32] = "get_local";
    Opcodes[Opcodes["f32_const"] = 67] = "f32_const";
    Opcodes[Opcodes["f32_add"] = 146] = "f32_add";
})(Opcodes || (Opcodes = {}));
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
var encodeVector = function (data) { return __spreadArray(__spreadArray([], __read(leb.encodeULEB128(data.length))), __read(flatten(data))); };
// Reference: https://webassembly.github.io/spec/core/binary/modules.html#sections
var createSection = function (sectionType, data) { return __spreadArray([
    sectionType
], __read(encodeVector(data))); };
var codeFromAst = function (ast) {
    var code = [];
    var emitExpression = function (node) {
        switch (node.type) {
            case "numberLiteral":
                code.push(Opcodes.f32_const);
                code.push.apply(code, __spreadArray([], __read(encoding_1.numToIeee754Array(node.value))));
                break;
        }
    };
    ast.forEach(function (statement) {
        switch (statement.type) {
            case "printStatement":
                emitExpression(statement.expression);
                code.push(Opcodes.call);
                code.push.apply(code, __spreadArray([], __read(leb.encodeULEB128(0))));
                break;
        }
    });
    return code;
};
// Reference: https://webassembly.github.io/spec/core/binary/modules.html
var emitter = function (ast) {
    // Function types contain vectors of parameters and a return type
    // TODO: maybe rename the two consts below into something better
    var voidVoidType = [functionType, emptyArray, emptyArray];
    var floatVoidType = __spreadArray(__spreadArray([
        functionType
    ], __read(encodeVector([Valtype.f32]) /* Parameter types */)), [
        emptyArray /* Return types */,
    ]);
    // Vector of function types
    var typeSection = createSection(Section.type, encodeVector([voidVoidType, floatVoidType]));
    // Vector of type indices indicating the type of each function in the code section
    var funcSection = createSection(Section.func, encodeVector([0x00 /* Index of the type */]));
    // Vector of imported functions
    var printFunctionImport = __spreadArray(__spreadArray(__spreadArray([], __read(encoding_1.strToBinaryName("env"))), __read(encoding_1.strToBinaryName("print"))), [
        ExportType.func,
        0x01 /* Index of the type */,
    ]);
    var importSection = createSection(Section.import, encodeVector([printFunctionImport]));
    // Vector of exported functions
    var exportSection = createSection(Section.export, encodeVector([
        __spreadArray(__spreadArray([], __read(encoding_1.strToBinaryName("run"))), [
            ExportType.func,
            0x01 /* Index of the function */,
        ]),
    ]));
    // Vectors of functions
    var functionBody = encodeVector(__spreadArray(__spreadArray([
        emptyArray /* Locals */
    ], __read(codeFromAst(ast))), [
        Opcodes.end,
    ]));
    var codeSection = createSection(Section.code, encodeVector([functionBody]));
    return Uint8Array.from(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(magicModuleHeader)), __read(moduleVersion)), __read(typeSection)), __read(importSection)), __read(funcSection)), __read(exportSection)), __read(codeSection)));
};
exports.emitter = emitter;

},{"./encoding":21,"@thi.ng/leb128":10}],21:[function(require,module,exports){
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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
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
], __read(str.split("").map(function (s) { return s.charCodeAt(0); }))); };
exports.strToBinaryName = strToBinaryName;

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":16}],22:[function(require,module,exports){
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
var runtime = function (src, _a) {
    var print = _a.print;
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_b) {
            return [2 /*return*/, function () {
                    var tokens = tokenizer_1.tokenize(src);
                    var ast = parser_1.parse(tokens);
                    var evaluateExpression = function (expression) {
                        switch (expression.type) {
                            case "numberLiteral":
                                return expression.value;
                        }
                    };
                    var executeStatements = function (statements) {
                        statements.forEach(function (statement) {
                            switch (statement.type) {
                                case "printStatement":
                                    print(evaluateExpression(statement.expression));
                                    break;
                            }
                        });
                    };
                    executeStatements(ast);
                }];
        });
    });
};
exports.runtime = runtime;

},{"./parser":23,"./tokenizer":24}],23:[function(require,module,exports){
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
    var eatToken = function () { return (currentToken = tokenIterator.next().value); };
    var parseExpression = function () {
        var node;
        switch (currentToken.type) {
            default: // TODO: remove this
            case "number":
                node = {
                    type: "numberLiteral",
                    value: Number(currentToken.value),
                };
                eatToken();
                return node;
        }
    };
    var parseStatement = function () {
        // if (currentToken.type === "keyword") { // TOOD: uncomment this
        switch (currentToken.value) {
            default: // TODO: remove this
            case "print":
                eatToken();
                return {
                    type: "printStatement",
                    expression: parseExpression(),
                };
        }
        // } // TOOD: uncomment this
    };
    var nodes = [];
    while (currentToken) {
        nodes.push(parseStatement());
    }
    return nodes;
};
exports.parse = parse;

},{}],24:[function(require,module,exports){
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
exports.tokenize = exports.TokenizerError = exports.keywords = void 0;
exports.keywords = ["print"];
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
    regexMatcher("^[.0-9]+", "number"),
    regexMatcher("^(" + exports.keywords.join("|") + ")", "keyword"),
    regexMatcher("^\\s+", "whitespace"),
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
            throw new TokenizerError("Unexpected token " + input.substring(index, index + 1), index);
        }
    }
    return tokens;
};
exports.tokenize = tokenize;

},{}],25:[function(require,module,exports){
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
var interpreter_1 = require("../src/interpreter");
var compiler_1 = require("../src/compiler");
var tokenizer_1 = require("../src/tokenizer");
var compileButton = document.getElementById("compile");
var interpretButton = document.getElementById("interpret");
var codeArea = document.getElementById("code");
var outputArea = document.getElementById("output");
CodeMirror.defineSimpleMode("simplemode", {
    start: [
        {
            regex: new RegExp("(" + tokenizer_1.keywords.join("|") + ")"),
            token: "keyword",
        },
        {
            regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
            token: "number",
        },
        { regex: /[-+\/*=<>!]+/, token: "operator" },
        { regex: /[a-z$][\w$]*/, token: "variable" },
    ],
});
var editor = CodeMirror.fromTextArea(codeArea, {
    mode: "simplemode",
    theme: "abcdef",
    lineNumbers: true,
});
var sleep = function (ms) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, ms); })];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
var marker;
var logMessage = function (message) {
    return (outputArea.value = outputArea.value + message + "\n");
};
var markError = function (token) {
    if (token.char) {
        marker = editor.markText({ line: token.line, ch: token.char - 1 }, { line: token.line, ch: token.char - 1 + token.value.length }, { className: "error" });
    }
};
var run = function (runtime) { return __awaiter(void 0, void 0, void 0, function () {
    var tickFunction, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (marker) {
                    marker.clear();
                }
                return [4 /*yield*/, sleep(10)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, runtime(editor.getValue(), {
                        print: logMessage,
                    })];
            case 3:
                tickFunction = _a.sent();
                outputArea.value = "";
                logMessage("Executing ... ");
                tickFunction();
                interpretButton === null || interpretButton === void 0 ? void 0 : interpretButton.classList.remove("active");
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                logMessage(error_1.message);
                markError(error_1.token);
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

},{"../src/compiler":19,"../src/interpreter":22,"../src/tokenizer":24}]},{},[25]);
