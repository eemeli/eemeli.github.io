(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MF = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var dataModel = createCommonjsModule(function (module, exports) {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isSelectMessage = exports.isMessage = exports.hasMeta = void 0;
	const hasMeta = (part) => !!part.meta &&
	    typeof part.meta === 'object' &&
	    Object.keys(part.meta).length > 0;
	exports.hasMeta = hasMeta;
	const isMessage = (msg) => !!msg &&
	    typeof msg === 'object' &&
	    'type' in msg &&
	    (msg.type === 'message' || msg.type === 'select');
	exports.isMessage = isMessage;
	const isSelectMessage = (msg) => msg.type === 'select';
	exports.isSelectMessage = isSelectMessage;
	});

	var formattable$1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Formattable = void 0;
	class Formattable {
	    constructor(value, format) {
	        this.value = value;
	        if (format)
	            Object.assign(this, format);
	    }
	    getValue() {
	        return this.value;
	    }
	    matchSelectKey(key, _locales, _localeMatcher) {
	        return String(this.getValue()) === key;
	    }
	    toParts(source, _locales, _localeMatcher) {
	        let value = this.getValue();
	        if (value == null || typeof value === 'boolean' || value instanceof Boolean)
	            value = String(value);
	        // At this point, value is string | symbol | function | object
	        return [{ type: 'dynamic', value, source }];
	    }
	    toString(locales, localeMatcher) {
	        const value = this.getValue();
	        if (locales && value && typeof value.toLocaleString === 'function')
	            try {
	                return value.toLocaleString(locales, { localeMatcher });
	            }
	            catch (_) {
	                // TODO: Report error?
	            }
	        return String(value);
	    }
	}
	exports.Formattable = Formattable;
	});

	var formattableDatetime = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FormattableDateTime = void 0;

	class FormattableDateTime extends formattable$1.Formattable {
	    constructor(date, arg, options) {
	        let lc;
	        if (typeof arg === 'string')
	            lc = [arg];
	        else if (Array.isArray(arg))
	            lc = arg.slice();
	        else {
	            lc = undefined;
	            options = arg !== null && arg !== void 0 ? arg : undefined;
	        }
	        if (date instanceof FormattableDateTime) {
	            super(date.value);
	            this.locales = date.locales || lc;
	            this.options = date.options ? Object.assign(Object.assign({}, date.options), options) : options;
	        }
	        else {
	            super(date);
	            this.locales = lc;
	            this.options = options;
	        }
	    }
	    getDateTimeFormatter(locales, localeMatcher) {
	        const options = Object.assign({ localeMatcher }, this.options);
	        return new Intl.DateTimeFormat(this.locales || locales, options);
	    }
	    toParts(source, locales, localeMatcher) {
	        const dtf = this.getDateTimeFormatter(locales, localeMatcher);
	        const parts = dtf.formatToParts(this.getValue());
	        for (const part of parts)
	            part.source = source;
	        return parts;
	    }
	    toString(locales, localeMatcher) {
	        var _a;
	        const hasOpt = this.options &&
	            Object.keys(this.options).some(key => key !== 'localeMatcher');
	        const date = this.getValue();
	        if (hasOpt) {
	            const dtf = this.getDateTimeFormatter(locales, localeMatcher);
	            return dtf.format(date);
	        }
	        else {
	            const lm = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.localeMatcher) || localeMatcher;
	            const options = lm ? { localeMatcher: lm } : undefined;
	            return date.toLocaleString(this.locales || locales, options);
	        }
	    }
	}
	exports.FormattableDateTime = FormattableDateTime;
	});

	var formattableNumber = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FormattableNumber = void 0;

	class FormattableNumber extends formattable$1.Formattable {
	    constructor(number, arg, options) {
	        let lc;
	        if (typeof arg === 'string')
	            lc = [arg];
	        else if (Array.isArray(arg))
	            lc = arg.slice();
	        else {
	            lc = undefined;
	            options = arg !== null && arg !== void 0 ? arg : undefined;
	        }
	        if (number instanceof FormattableNumber) {
	            super(number.value);
	            this.locales = number.locales || lc;
	            this.options = number.options
	                ? Object.assign(Object.assign({}, number.options), options) : options;
	        }
	        else {
	            super(number);
	            this.locales = lc;
	            this.options = options;
	        }
	    }
	    getNumberFormatter(locales, localeMatcher) {
	        const options = Object.assign({ localeMatcher }, this.options);
	        return new Intl.NumberFormat(this.locales || locales, options);
	    }
	    getPluralCategory(locales, localeMatcher) {
	        const options = Object.assign({ localeMatcher }, this.options);
	        const pr = new Intl.PluralRules(this.locales || locales, options);
	        // Intl.PluralRules really does need a number
	        const num = Number(this.getValue());
	        return pr.select(num);
	    }
	    /** Uses value directly due to plural offset weirdness */
	    matchSelectKey(key, locales, localeMatcher) {
	        return ((/^[0-9]+$/.test(key) && key === String(this.value)) ||
	            key === this.getPluralCategory(locales, localeMatcher));
	    }
	    toParts(source, locales, localeMatcher) {
	        const nf = this.getNumberFormatter(locales, localeMatcher);
	        const number = this.getValue(); // FIXME: TS should know that bigint is fine here
	        const parts = nf.formatToParts(number);
	        for (const part of parts)
	            part.source = source;
	        return parts;
	    }
	    toString(locales, localeMatcher) {
	        const nf = this.getNumberFormatter(locales, localeMatcher);
	        return nf.format(this.getValue());
	    }
	}
	exports.FormattableNumber = FormattableNumber;
	});

	var asFormattable_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.asFormattable = void 0;



	function asFormattable(value) {
	    if (value instanceof formattable$1.Formattable)
	        return value;
	    if (typeof value === 'number' || typeof value === 'bigint')
	        return new formattableNumber.FormattableNumber(value);
	    if (value instanceof Date)
	        return new formattableDatetime.FormattableDateTime(value);
	    return new formattable$1.Formattable(value);
	}
	exports.asFormattable = asFormattable;
	});

	var detectGrammar = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getFormattedSelectMeta = void 0;

	const grammarCases = [
	    'ablative',
	    'absolutive',
	    'accusative',
	    'adessive',
	    'adverbial',
	    'agentive',
	    'allative',
	    'antessive',
	    'benefactive',
	    'causal',
	    'comitative',
	    'dative',
	    'delative',
	    'distributive',
	    'elative',
	    'ergative',
	    'essive',
	    'formal',
	    'genitive',
	    'illative',
	    'inessive',
	    'initiative',
	    'instructive',
	    'instrumental',
	    'intransitive',
	    'lative',
	    'limitative',
	    'locative',
	    'nominative',
	    'objective',
	    'oblique',
	    'ornative',
	    'partitive',
	    'privative',
	    'possessive',
	    'prepositional',
	    'prolative',
	    'sociative',
	    'sublative',
	    'superessive',
	    'superlative',
	    'temporal',
	    'terminative',
	    'translative',
	    'vocative'
	];
	const genders = ['common', 'feminine', 'masculine', 'neuter'];
	const plurals = ['zero', 'one', 'two', 'few', 'many'];
	const isNumeric = (str) => Number.isFinite(Number(str));
	function getFormattedSelectMeta(ctx, selectMsg, key, sel, fallback) {
	    let hasMeta = false;
	    const meta = {};
	    const { gcase, gender, plural } = detectGrammarSelectors(selectMsg);
	    if (gcase !== -1) {
	        hasMeta = true;
	        if (fallback[gcase]) {
	            const { fmt, def } = sel[gcase];
	            meta.case = String(fmt.getValue());
	            meta.caseFallback = def;
	        }
	        else {
	            meta.case = key[gcase];
	        }
	    }
	    if (gender !== -1) {
	        hasMeta = true;
	        if (fallback[gender]) {
	            const { fmt, def } = sel[gender];
	            meta.gender = String(fmt.getValue());
	            meta.genderFallback = def;
	        }
	        else {
	            meta.gender = key[gender];
	        }
	    }
	    if (plural !== -1) {
	        const { fmt, def } = sel[plural];
	        if (fmt instanceof formattable.FormattableNumber) {
	            hasMeta = true;
	            if (fallback[plural]) {
	                meta.plural = fmt.getPluralCategory(ctx.locales, ctx.localeMatcher);
	                meta.pluralFallback = def;
	            }
	            else {
	                meta.plural = key[plural];
	            }
	        }
	    }
	    return hasMeta ? meta : null;
	}
	exports.getFormattedSelectMeta = getFormattedSelectMeta;
	/**
	 * Duck-type selectors based on the keys used to match them.
	 *
	 * Detects grammatical cases, grammatical genders, and plural categories.
	 *
	 * @returns Indices of first matching selectors, or -1 for no match.
	 */
	function detectGrammarSelectors({ cases, select }) {
	    const defaults = select.map(s => s.fallback || 'other');
	    const gc = new Array(select.length).fill(null);
	    for (const { key } of cases) {
	        for (let i = 0; i < gc.length; ++i) {
	            const c = gc[i];
	            if (c === 4 /* Other */)
	                continue;
	            const k = key[i];
	            if (k === defaults[i])
	                continue;
	            if (isNumeric(k) || plurals.includes(k)) {
	                if (c !== 3 /* Plural */)
	                    gc[i] = c ? 4 /* Other */ : 3 /* Plural */;
	            }
	            else if (grammarCases.includes(k)) {
	                if (c !== 1 /* Case */)
	                    gc[i] = c ? 4 /* Other */ : 1 /* Case */;
	            }
	            else if (genders.includes(k)) {
	                if (c !== 2 /* Gender */)
	                    gc[i] = c ? 4 /* Other */ : 2 /* Gender */;
	            }
	            else {
	                gc[i] = 4 /* Other */;
	            }
	        }
	    }
	    return {
	        gcase: gc.indexOf(1 /* Case */),
	        gender: gc.indexOf(2 /* Gender */),
	        plural: gc.indexOf(3 /* Plural */)
	    };
	}
	});

	var formattableMessage = createCommonjsModule(function (module, exports) {
	var __classPrivateFieldSet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) || function (receiver, privateMap, value) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to set private field on non-instance");
	    }
	    privateMap.set(receiver, value);
	    return value;
	};
	var __classPrivateFieldGet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) || function (receiver, privateMap) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to get private field on non-instance");
	    }
	    return privateMap.get(receiver);
	};
	var _context, _meta, _pattern, _string;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FormattableMessage = void 0;


	class FormattableMessage extends formattable$1.Formattable {
	    constructor(context, message) {
	        super(message);
	        _context.set(this, void 0);
	        _meta.set(this, null);
	        _pattern.set(this, null);
	        _string.set(this, null);
	        __classPrivateFieldSet(this, _context, context);
	        if (message.meta)
	            __classPrivateFieldSet(this, _meta, Object.assign({}, message.meta));
	    }
	    getPattern() {
	        if (__classPrivateFieldGet(this, _pattern))
	            return __classPrivateFieldGet(this, _pattern);
	        const msg = this.getValue();
	        if (msg.type === 'message')
	            return (__classPrivateFieldSet(this, _pattern, msg.value));
	        const ctx = __classPrivateFieldGet(this, _context);
	        const sel = msg.select.map(({ value, fallback }) => ({
	            fmt: ctx.getFormatter(value).asFormattable(ctx, value),
	            def: fallback || 'other'
	        }));
	        cases: for (const { key, value } of msg.cases) {
	            const fallback = new Array(key.length);
	            for (let i = 0; i < key.length; ++i) {
	                const k = key[i];
	                const s = sel[i];
	                if (typeof k !== 'string' || !s)
	                    continue cases;
	                if (s.fmt.matchSelectKey(k, ctx.locales, ctx.localeMatcher))
	                    fallback[i] = false;
	                else if (s.def === k)
	                    fallback[i] = true;
	                else
	                    continue cases;
	            }
	            const meta = detectGrammar.getFormattedSelectMeta(ctx, msg, key, sel, fallback);
	            if (meta) {
	                if (__classPrivateFieldGet(this, _meta))
	                    Object.assign(__classPrivateFieldGet(this, _meta), meta);
	                else
	                    __classPrivateFieldSet(this, _meta, meta);
	            }
	            if (__classPrivateFieldGet(this, _meta))
	                __classPrivateFieldGet(this, _meta)['selectResult'] = 'success';
	            return (__classPrivateFieldSet(this, _pattern, value));
	        }
	        if (!__classPrivateFieldGet(this, _meta))
	            __classPrivateFieldSet(this, _meta, {});
	        __classPrivateFieldGet(this, _meta)['selectResult'] = 'no-match';
	        return (__classPrivateFieldSet(this, _pattern, []));
	    }
	    matchSelectKey(key) {
	        return this.toString() === key;
	    }
	    toParts(source) {
	        const pattern = this.getPattern();
	        const res = [];
	        if (__classPrivateFieldGet(this, _meta))
	            res.push({ type: 'meta', value: '', meta: Object.assign({}, __classPrivateFieldGet(this, _meta)) });
	        const ctx = __classPrivateFieldGet(this, _context);
	        for (const elem of pattern) {
	            const parts = ctx.getFormatter(elem).formatToParts(ctx, elem);
	            Array.prototype.push.apply(res, parts);
	        }
	        if (source)
	            for (const part of res)
	                part.source = part.source ? source + '/' + part.source : source;
	        return res;
	    }
	    toString() {
	        if (typeof __classPrivateFieldGet(this, _string) !== 'string') {
	            __classPrivateFieldSet(this, _string, '');
	            const ctx = __classPrivateFieldGet(this, _context);
	            for (const elem of this.getPattern())
	                __classPrivateFieldSet(this, _string, __classPrivateFieldGet(this, _string) + ctx.getFormatter(elem).formatToString(ctx, elem));
	        }
	        return __classPrivateFieldGet(this, _string);
	    }
	}
	exports.FormattableMessage = FormattableMessage;
	_context = new WeakMap(), _meta = new WeakMap(), _pattern = new WeakMap(), _string = new WeakMap();
	});

	var formattable = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.FormattableNumber = exports.FormattableMessage = exports.FormattableDateTime = exports.Formattable = exports.asFormattable = void 0;

	Object.defineProperty(exports, "asFormattable", { enumerable: true, get: function () { return asFormattable_1.asFormattable; } });

	Object.defineProperty(exports, "Formattable", { enumerable: true, get: function () { return formattable$1.Formattable; } });

	Object.defineProperty(exports, "FormattableDateTime", { enumerable: true, get: function () { return formattableDatetime.FormattableDateTime; } });

	Object.defineProperty(exports, "FormattableMessage", { enumerable: true, get: function () { return formattableMessage.FormattableMessage; } });

	Object.defineProperty(exports, "FormattableNumber", { enumerable: true, get: function () { return formattableNumber.FormattableNumber; } });
	});

	var literal = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.formatter = exports.isLiteral = void 0;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const isLiteral = (part) => !!part && typeof part === 'object' && part.type === 'literal';
	exports.isLiteral = isLiteral;
	exports.formatter = {
	    type: 'literal',
	    asFormattable: (_ctx, lit) => formattable.asFormattable(lit.value),
	    formatToParts(_ctx, lit) {
	        const fmt = { type: 'literal', value: lit.value };
	        return lit.meta
	            ? [{ type: 'meta', value: '', meta: Object.assign({}, lit.meta) }, fmt]
	            : [fmt];
	    },
	    formatToString: (_ctx, lit) => lit.value
	};
	});

	var utilArgSource = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getArgSource = void 0;

	/** Get a string source identifier for a Literal or Variable `arg`. */
	function getArgSource(arg) {
	    if (pattern.isVariable(arg)) {
	        return ('$' +
	            arg.var_path
	                .map(vp => {
	                const str = getArgSource(vp);
	                return str[0] === '$' ? `(${str})` : str;
	            })
	                .join('.'));
	    }
	    return pattern.isLiteral(arg) ? String(arg.value) : '???';
	}
	exports.getArgSource = getArgSource;
	});

	var _function = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.formatter = exports.isFunction = void 0;



	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const isFunction = (part) => !!part && typeof part === 'object' && part.type === 'function';
	exports.isFunction = isFunction;
	function formatFunctionToParts(ctx, fn) {
	    const srcArgs = fn.args.map(utilArgSource.getArgSource);
	    const source = fn.func + '(' + srcArgs.join(', ') + ')';
	    let res;
	    try {
	        const fmt = callRuntimeFunction(ctx, fn);
	        res = fmt.toParts(source, ctx.locales, ctx.localeMatcher);
	    }
	    catch (error) {
	        let meta;
	        if (error instanceof Error) {
	            meta = Object.assign(Object.assign({}, fn.meta), { error_name: error.name, error_message: error.message });
	            if (error.stack)
	                meta.error_stack = error.stack;
	        }
	        else
	            meta = Object.assign(Object.assign({}, fn.meta), { error_message: String(error) });
	        return [
	            { type: 'meta', value: '', meta, source },
	            { type: 'fallback', value: fallbackValue(ctx, fn), source }
	        ];
	    }
	    if (fn.meta)
	        res.unshift({ type: 'meta', value: '', source, meta: Object.assign({}, fn.meta) });
	    return res;
	}
	function formatFunctionToString(ctx, fn) {
	    try {
	        const fmt = callRuntimeFunction(ctx, fn);
	        return fmt.toString(ctx.locales, ctx.localeMatcher);
	    }
	    catch (_) {
	        // TODO: report error
	        return '{' + fallbackValue(ctx, fn) + '}';
	    }
	}
	function callRuntimeFunction(ctx, { args, func, options }) {
	    const rf = ctx.types.function[func];
	    const fnArgs = args.map(arg => ctx.getFormatter(arg).asFormattable(ctx, arg));
	    const fnOpt = resolveOptions(ctx, options, rf === null || rf === void 0 ? void 0 : rf.options);
	    const res = rf.call(ctx.locales, fnOpt, ...fnArgs);
	    return formattable.asFormattable(res);
	}
	function fallbackValue(ctx, fn) {
	    const resolve = (v) => ctx.getFormatter(v).asFormattable(ctx, v).getValue();
	    const args = fn.args.map(resolve);
	    if (fn.options)
	        for (const [key, value] of Object.entries(fn.options))
	            args.push(`${key}: ${resolve(value)}`);
	    return `${fn.func}(${args.join(', ')})`;
	}
	function resolveOptions(ctx, options, expected) {
	    const opt = { localeMatcher: ctx.localeMatcher };
	    if (options && expected) {
	        for (const [key, value] of Object.entries(options)) {
	            const exp = typeof expected === 'string' || Array.isArray(expected)
	                ? expected
	                : expected[key];
	            if (!exp || exp === 'never')
	                continue; // TODO: report error
	            const res = ctx.getFormatter(value).asFormattable(ctx, value).getValue();
	            if (exp === 'any' ||
	                exp === typeof res ||
	                (Array.isArray(exp) && typeof res === 'string' && exp.includes(res))) {
	                opt[key] = res;
	            }
	            else if (literal.isLiteral(value)) {
	                switch (exp) {
	                    case 'boolean':
	                        if (res === 'true')
	                            opt[key] = true;
	                        else if (res === 'false')
	                            opt[key] = false;
	                        break;
	                    case 'number':
	                        opt[key] = Number(res);
	                }
	            }
	            // TODO: else report error
	        }
	    }
	    return opt;
	}
	exports.formatter = {
	    type: 'function',
	    asFormattable(ctx, fn) {
	        try {
	            return callRuntimeFunction(ctx, fn);
	        }
	        catch (_) {
	            // TODO: report error
	            return formattable.asFormattable(undefined);
	        }
	    },
	    formatToParts: formatFunctionToParts,
	    formatToString: formatFunctionToString,
	    initContext: mf => mf.resolvedOptions().runtime
	};
	});

	var term = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.formatter = exports.isTerm = void 0;


	const isTermContext = (ctx) => typeof ctx.types.term === 'function';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const isTerm = (part) => !!part && typeof part === 'object' && part.type === 'term';
	exports.isTerm = isTerm;
	function formatTermToParts(ctx, term) {
	    const fmtMsg = getFormattableMessage(ctx, term);
	    const source = getSource(term);
	    const res = fmtMsg
	        ? fmtMsg.toParts(source)
	        : [{ type: 'fallback', value: fallbackValue(ctx, term), source }];
	    if (term.meta)
	        res.unshift({ type: 'meta', value: '', meta: Object.assign({}, term.meta), source });
	    return res;
	}
	function getSource({ msg_path, res_id }) {
	    const name = msg_path.map(utilArgSource.getArgSource).join('.');
	    return res_id ? `-${res_id}::${name}` : `-${name}`;
	}
	function getFormattableMessage(ctx, { msg_path, res_id, scope }) {
	    if (!isTermContext(ctx))
	        return null;
	    const strPath = msg_path.map(elem => ctx.getFormatter(elem).formatToString(ctx, elem));
	    const msg = ctx.types.term(res_id, strPath);
	    if (!msg)
	        return null;
	    let msgCtx = ctx;
	    if (res_id || scope) {
	        const types = Object.assign({}, ctx.types);
	        if (res_id)
	            types.term = (msgResId, msgPath) => ctx.types.term(msgResId || res_id, msgPath);
	        if (scope) {
	            // If the variable type isn't actually available, this has no effect
	            types.variable = Object.assign({}, ctx.types.variable);
	            for (const [key, value] of Object.entries(scope))
	                types.variable[key] = ctx.getFormatter(value).asFormattable(ctx, value);
	        }
	        msgCtx = Object.assign(Object.assign({}, ctx), { types });
	    }
	    return new formattable.FormattableMessage(msgCtx, msg);
	}
	function fallbackValue(ctx, term) {
	    const resolve = (v) => ctx.getFormatter(v).asFormattable(ctx, v).getValue();
	    let name = term.msg_path.map(resolve).join('.');
	    if (term.res_id)
	        name = term.res_id + '::' + name;
	    if (!term.scope)
	        return '-' + name;
	    const scope = Object.entries(term.scope).map(([key, value]) => `${key}: ${resolve(value)}`);
	    return `-${name}(${scope.join(', ')})`;
	}
	exports.formatter = {
	    type: 'term',
	    asFormattable: (ctx, term) => { var _a; return (_a = getFormattableMessage(ctx, term)) !== null && _a !== void 0 ? _a : formattable.asFormattable(undefined); },
	    formatToParts: formatTermToParts,
	    formatToString: (ctx, term) => {
	        var _a, _b;
	        return (_b = (_a = getFormattableMessage(ctx, term)) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '{' + fallbackValue(ctx, term) + '}';
	    },
	    initContext: (mf, resId) => (msgResId, msgPath) => mf.getMessage(msgResId || resId, msgPath)
	};
	});

	var variable = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.formatter = exports.isVariable = void 0;


	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const isVariable = (part) => !!part && typeof part === 'object' && part.type === 'variable';
	exports.isVariable = isVariable;
	function formatVariableToParts(ctx, part) {
	    const value = getValue(ctx, part);
	    const source = utilArgSource.getArgSource(part);
	    const res = value === undefined
	        ? [{ type: 'fallback', value: fallbackValue(ctx, part), source }]
	        : formattable.asFormattable(value).toParts(source, ctx.locales, ctx.localeMatcher);
	    if (part.meta)
	        res.unshift({ type: 'meta', value: '', meta: Object.assign({}, part.meta), source });
	    return res;
	}
	function formatVariableToString(ctx, part) {
	    const value = getValue(ctx, part);
	    return value === undefined
	        ? '{' + fallbackValue(ctx, part) + '}'
	        : formattable.asFormattable(value).toString(ctx.locales, ctx.localeMatcher);
	}
	/** @returns `undefined` if value not found */
	function getValue(ctx, { var_path }) {
	    if (var_path.length === 0)
	        return undefined;
	    let val = ctx.types.variable;
	    for (const p of var_path) {
	        if (!val || val instanceof formattable.Formattable)
	            return undefined;
	        try {
	            const arg = ctx.getFormatter(p).asFormattable(ctx, p).getValue();
	            if (arg === undefined)
	                return undefined;
	            val = val[String(arg)];
	        }
	        catch (_) {
	            // TODO: report error
	            return undefined;
	        }
	    }
	    return val;
	}
	function fallbackValue(ctx, { var_path }) {
	    const path = var_path.map(v => ctx.getFormatter(v).asFormattable(ctx, v).getValue());
	    return '$' + path.join('.');
	}
	exports.formatter = {
	    type: 'variable',
	    asFormattable: (ctx, part) => formattable.asFormattable(getValue(ctx, part)),
	    formatToParts: formatVariableToParts,
	    formatToString: formatVariableToString,
	    initContext: (_mf, _resId, scope) => scope
	};
	});

	var pattern = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.patternFormatters = exports.isVariable = exports.getArgSource = exports.isTerm = exports.isLiteral = exports.isFunction = void 0;




	var function_2 = _function;
	Object.defineProperty(exports, "isFunction", { enumerable: true, get: function () { return function_2.isFunction; } });
	var literal_2 = literal;
	Object.defineProperty(exports, "isLiteral", { enumerable: true, get: function () { return literal_2.isLiteral; } });
	var term_2 = term;
	Object.defineProperty(exports, "isTerm", { enumerable: true, get: function () { return term_2.isTerm; } });

	Object.defineProperty(exports, "getArgSource", { enumerable: true, get: function () { return utilArgSource.getArgSource; } });
	var variable_2 = variable;
	Object.defineProperty(exports, "isVariable", { enumerable: true, get: function () { return variable_2.isVariable; } });
	exports.patternFormatters = [literal.formatter, variable.formatter, _function.formatter, term.formatter];
	});

	var resourceReader = createCommonjsModule(function (module, exports) {
	var __classPrivateFieldSet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) || function (receiver, privateMap, value) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to set private field on non-instance");
	    }
	    privateMap.set(receiver, value);
	    return value;
	};
	var __classPrivateFieldGet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) || function (receiver, privateMap) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to get private field on non-instance");
	    }
	    return privateMap.get(receiver);
	};
	var _data;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ResourceReader = void 0;

	/**
	 * Provides the minimum required runtime interface for accessing resources.
	 * This base class is applied automatically for Resource values, but an
	 * implementation may extend this to provide its own `getId()` and
	 * `getMessage(path)`.
	 */
	class ResourceReader {
	    constructor(data) {
	        _data.set(this, void 0);
	        __classPrivateFieldSet(this, _data, data);
	    }
	    static from(src) {
	        return src instanceof ResourceReader ? src : new ResourceReader(src);
	    }
	    getId() {
	        return __classPrivateFieldGet(this, _data).id;
	    }
	    getMessage(path) {
	        if (path.length === 0)
	            return undefined;
	        let msg = __classPrivateFieldGet(this, _data).entries[path[0]];
	        for (let i = 1; i < path.length; ++i) {
	            if (!msg || dataModel.isMessage(msg))
	                return undefined;
	            msg = msg.entries[path[i]];
	        }
	        return dataModel.isMessage(msg) ? msg : undefined;
	    }
	}
	exports.ResourceReader = ResourceReader;
	_data = new WeakMap();
	});

	var _default = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.runtime = exports.number = exports.datetime = void 0;

	exports.datetime = {
	    call: function datetime(locales, options, arg) {
	        let date;
	        if (arg instanceof formattable.FormattableDateTime)
	            date = arg;
	        else {
	            const value = arg.getValue();
	            date = new Date(typeof value === 'number' ? value : String(value));
	        }
	        return new formattable.FormattableDateTime(date, locales, options);
	    },
	    options: {
	        localeMatcher: ['best fit', 'lookup'],
	        weekday: ['long', 'short', 'narrow'],
	        era: ['long', 'short', 'narrow'],
	        year: ['numeric', '2-digit'],
	        month: ['numeric', '2-digit', 'long', 'short', 'narrow'],
	        day: ['numeric', '2-digit'],
	        hour: ['numeric', '2-digit'],
	        minute: ['numeric', '2-digit'],
	        second: ['numeric', '2-digit'],
	        timeZoneName: ['long', 'short'],
	        formatMatcher: ['best fit', 'basic'],
	        hour12: 'boolean',
	        timeZone: 'string',
	        // ES 2020
	        dateStyle: ['full', 'long', 'medium', 'short'],
	        timeStyle: ['full', 'long', 'medium', 'short'],
	        calendar: 'string',
	        dayPeriod: ['narrow', 'short', 'long'],
	        numberingSystem: 'string',
	        hourCycle: ['h11', 'h12', 'h23', 'h24'],
	        fractionalSecondDigits: 'number' // 0 | 1 | 2 | 3
	    }
	};
	exports.number = {
	    call: function number(locales, options, arg) {
	        const num = arg instanceof formattable.FormattableNumber ? arg : Number(arg.getValue());
	        return new formattable.FormattableNumber(num, locales, options);
	    },
	    options: {
	        localeMatcher: ['best fit', 'lookup'],
	        style: 'string',
	        currency: 'string',
	        currencyDisplay: 'string',
	        currencySign: 'string',
	        useGrouping: 'boolean',
	        minimumIntegerDigits: 'number',
	        minimumFractionDigits: 'number',
	        maximumFractionDigits: 'number',
	        minimumSignificantDigits: 'number',
	        maximumSignificantDigits: 'number',
	        // ES 2020
	        compactDisplay: 'string',
	        notation: 'string',
	        signDisplay: 'string',
	        unit: 'string',
	        unitDisplay: 'string',
	        // Intl.PluralRules
	        type: ['cardinal', 'ordinal']
	    }
	};
	exports.runtime = {
	    datetime: exports.datetime,
	    number: exports.number
	};
	});

	var fluent = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.runtime = void 0;

	exports.runtime = {
	    DATETIME: _default.datetime,
	    NUMBER: _default.number
	};
	});

	var mf1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.runtime = exports.time = exports.number = exports.duration = exports.date = void 0;

	const getParam = (options) => (options && String(options.param).trim()) || undefined;
	exports.date = {
	    call: function date(locales, options, arg) {
	        let date;
	        if (arg instanceof formattable.FormattableDateTime)
	            date = arg;
	        else {
	            const value = arg.getValue();
	            date = new Date(typeof value === 'number' ? value : String(value));
	        }
	        const size = getParam(options);
	        const opt = {
	            localeMatcher: options === null || options === void 0 ? void 0 : options.localeMatcher,
	            weekday: size === 'full' ? 'long' : undefined,
	            day: 'numeric',
	            month: size === 'short'
	                ? 'numeric'
	                : size === 'full' || size === 'long'
	                    ? 'long'
	                    : 'short',
	            year: 'numeric'
	        };
	        return new formattable.FormattableDateTime(date, locales, opt);
	    },
	    options: { param: 'string' }
	};
	/**
	 * Represent a duration in seconds as a string
	 *
	 * @return Includes one or two `:` separators, and matches the pattern
	 *   `hhhh:mm:ss`, possibly with a leading `-` for negative values and a
	 *   trailing `.sss` part for non-integer input
	 */
	exports.duration = {
	    call: function duration(_locales, _options, arg) {
	        let value = Number(arg.getValue());
	        if (!isFinite(value))
	            return String(value);
	        let sign = '';
	        if (value < 0) {
	            sign = '-';
	            value = Math.abs(value);
	        }
	        else {
	            value = Number(value);
	        }
	        const sec = value % 60;
	        const parts = [Math.round(sec) === sec ? sec : sec.toFixed(3)];
	        if (value < 60) {
	            parts.unshift(0); // at least one : is required
	        }
	        else {
	            value = Math.round((value - Number(parts[0])) / 60);
	            parts.unshift(value % 60); // minutes
	            if (value >= 60) {
	                value = Math.round((value - Number(parts[0])) / 60);
	                parts.unshift(value); // hours
	            }
	        }
	        const first = parts.shift();
	        return (sign +
	            first +
	            ':' +
	            parts.map(n => (n < 10 ? '0' + String(n) : String(n))).join(':'));
	    },
	    options: 'never'
	};
	class FormattableMF1Number extends formattable.FormattableNumber {
	    getValue() {
	        const num = this.value;
	        const opt = (this.options || {});
	        const offset = Number(opt.pluralOffset || 0);
	        return typeof num === 'bigint' ? num - BigInt(offset) : num - offset;
	    }
	}
	exports.number = {
	    call: function number(locales, options, arg) {
	        const num = arg instanceof formattable.FormattableNumber ? arg : Number(arg.getValue());
	        const opt = {};
	        if (options) {
	            switch (String(options.param).trim()) {
	                case 'integer':
	                    opt.maximumFractionDigits = 0;
	                    break;
	                case 'percent':
	                    opt.style = 'percent';
	                    break;
	                case 'currency': {
	                    opt.style = 'currency';
	                    opt.currency = 'USD';
	                    break;
	                }
	            }
	            const offset = Number(options.pluralOffset);
	            if (Number.isFinite(offset))
	                opt.pluralOffset = offset;
	            if (options.type === 'ordinal')
	                opt.type = 'ordinal';
	        }
	        return new FormattableMF1Number(num, locales, opt);
	    },
	    options: {
	        param: 'string',
	        pluralOffset: 'number',
	        type: ['cardinal', 'ordinal']
	    }
	};
	exports.time = {
	    call: function time(locales, options, arg) {
	        let time;
	        if (arg instanceof formattable.FormattableDateTime)
	            time = arg;
	        else {
	            const value = arg.getValue();
	            time = new Date(typeof value === 'number' ? value : String(value));
	        }
	        const size = getParam(options);
	        const opt = {
	            localeMatcher: options === null || options === void 0 ? void 0 : options.localeMatcher,
	            second: size === 'short' ? undefined : 'numeric',
	            minute: 'numeric',
	            hour: 'numeric',
	            timeZoneName: size === 'full' || size === 'long' ? 'short' : undefined
	        };
	        return new formattable.FormattableDateTime(time, locales, opt);
	    },
	    options: { param: ['short', 'default', 'long', 'full'] }
	};
	exports.runtime = {
	    date: exports.date,
	    duration: exports.duration,
	    number: exports.number,
	    time: exports.time
	};
	});

	var runtime = createCommonjsModule(function (module, exports) {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mf1Runtime = exports.fluentRuntime = exports.defaultRuntime = void 0;

	Object.defineProperty(exports, "defaultRuntime", { enumerable: true, get: function () { return _default.runtime; } });

	Object.defineProperty(exports, "fluentRuntime", { enumerable: true, get: function () { return fluent.runtime; } });

	Object.defineProperty(exports, "mf1Runtime", { enumerable: true, get: function () { return mf1.runtime; } });
	});

	var messageformat = createCommonjsModule(function (module, exports) {
	var __classPrivateFieldSet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) || function (receiver, privateMap, value) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to set private field on non-instance");
	    }
	    privateMap.set(receiver, value);
	    return value;
	};
	var __classPrivateFieldGet = (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) || function (receiver, privateMap) {
	    if (!privateMap.has(receiver)) {
	        throw new TypeError("attempted to get private field on non-instance");
	    }
	    return privateMap.get(receiver);
	};
	var _formatters, _localeMatcher, _locales, _resources, _runtime;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.MessageFormat = void 0;




	/**
	 * Create a new message formatter.
	 *
	 * If `runtime` is unset, a default minimal set is used, consisting of `plural`
	 * for selection and `datetime` & `number` formatters based on the `Intl`
	 * equivalents.
	 */
	class MessageFormat {
	    constructor(locales, options, ...resources) {
	        var _a, _b, _c, _d;
	        _formatters.set(this, void 0);
	        _localeMatcher.set(this, void 0);
	        _locales.set(this, void 0);
	        _resources.set(this, void 0);
	        _runtime.set(this, void 0);
	        __classPrivateFieldSet(this, _formatters, (_b = (_a = options === null || options === void 0 ? void 0 : options.formatters) === null || _a === void 0 ? void 0 : _a.map(fmtOpt => {
	            if (typeof fmtOpt === 'string') {
	                const fmt = pattern.patternFormatters.find(fmt => fmt.type === fmtOpt);
	                if (!fmt)
	                    throw new RangeError(`Unsupported pattern type: ${fmtOpt}`);
	                return fmt;
	            }
	            else
	                return fmtOpt;
	        })) !== null && _b !== void 0 ? _b : pattern.patternFormatters);
	        __classPrivateFieldSet(this, _localeMatcher, (_c = options === null || options === void 0 ? void 0 : options.localeMatcher) !== null && _c !== void 0 ? _c : 'best fit');
	        __classPrivateFieldSet(this, _locales, Array.isArray(locales) ? locales : [locales]);
	        __classPrivateFieldSet(this, _resources, resources.map(resourceReader.ResourceReader.from));
	        __classPrivateFieldSet(this, _runtime, (_d = options === null || options === void 0 ? void 0 : options.runtime) !== null && _d !== void 0 ? _d : runtime.defaultRuntime);
	    }
	    addResources(...resources) {
	        __classPrivateFieldGet(this, _resources).splice(0, 0, ...resources.map(resourceReader.ResourceReader.from));
	    }
	    format(arg0, arg1, arg2) {
	        const fmtMsg = this.getFormattableMessage(...this.parseArgs(arg0, arg1, arg2));
	        return fmtMsg ? fmtMsg.toString() : '';
	    }
	    formatToParts(arg0, arg1, arg2) {
	        const fmtMsg = this.getFormattableMessage(...this.parseArgs(arg0, arg1, arg2));
	        return fmtMsg ? fmtMsg.toParts() : [];
	    }
	    getMessage(resId, path) {
	        const p = Array.isArray(path) ? path : [path];
	        for (const res of __classPrivateFieldGet(this, _resources)) {
	            if (res.getId() === resId) {
	                const msg = res.getMessage(p);
	                if (msg)
	                    return msg;
	            }
	        }
	        return undefined;
	    }
	    resolvedOptions() {
	        return {
	            localeMatcher: __classPrivateFieldGet(this, _localeMatcher),
	            locales: __classPrivateFieldGet(this, _locales).slice(),
	            runtime: __classPrivateFieldGet(this, _runtime)
	        };
	    }
	    getFormattableMessage(resId, msgPath, scope) {
	        const msg = this.getMessage(resId, msgPath);
	        if (!msg)
	            return null;
	        const ctx = this.createContext(resId, scope);
	        return new formattable.FormattableMessage(ctx, msg);
	    }
	    createContext(resId, scope) {
	        const getFormatter = ({ type }) => {
	            const fmt = __classPrivateFieldGet(this, _formatters).find(fmt => fmt.type === type);
	            if (fmt)
	                return fmt;
	            throw new Error(`Unsupported pattern element: ${type}`);
	        };
	        const ctx = {
	            getFormatter,
	            localeMatcher: __classPrivateFieldGet(this, _localeMatcher),
	            locales: __classPrivateFieldGet(this, _locales),
	            types: {}
	        };
	        for (const fmt of __classPrivateFieldGet(this, _formatters)) {
	            if (typeof fmt.initContext === 'function')
	                ctx.types[fmt.type] = fmt.initContext(this, resId, scope);
	        }
	        return ctx;
	    }
	    parseArgs(...args) {
	        let resId;
	        let msgPath;
	        let scope;
	        if (typeof args[1] === 'string' || Array.isArray(args[1])) {
	            // (resId: string, msgPath: string | string[], scope?: Scope)
	            if (typeof args[0] !== 'string')
	                throw new Error(`Invalid resId argument: ${args[0]}`);
	            [resId, msgPath, scope] = args;
	        }
	        else {
	            // (msgPath: string | string[], scope?: Scope)
	            const r0 = __classPrivateFieldGet(this, _resources)[0];
	            if (!r0)
	                throw new Error('No resources available');
	            const id0 = r0.getId();
	            for (const res of __classPrivateFieldGet(this, _resources))
	                if (res.getId() !== id0)
	                    throw new Error('Explicit resource id required to differentiate resources');
	            resId = id0;
	            [msgPath, scope] = args;
	        }
	        return [resId, msgPath, scope || {}];
	    }
	}
	exports.MessageFormat = MessageFormat;
	_formatters = new WeakMap(), _localeMatcher = new WeakMap(), _locales = new WeakMap(), _resources = new WeakMap(), _runtime = new WeakMap();
	});

	var validate_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validate = void 0;



	function validate(resources, runtime) {
	    function handleMsgParts(parts) {
	        for (const part of parts) {
	            if (_function.isFunction(part)) {
	                const { args, func } = part;
	                const fn = runtime[func];
	                if (!fn || typeof fn !== 'object' || typeof fn.call !== 'function')
	                    throw new ReferenceError(`Runtime function not available: ${func}`);
	                handleMsgParts(args);
	                // TODO: Once runtime arg requirements are defined, test against them
	            }
	            else if (term.isTerm(part)) {
	                const { msg_path, res_id } = part;
	                if (res_id) {
	                    let found = false;
	                    for (const res of resources) {
	                        if (res.id === res_id) {
	                            found = true;
	                            break;
	                        }
	                    }
	                    if (!found)
	                        throw new ReferenceError(`Resource not available: ${res_id}`);
	                }
	                handleMsgParts(msg_path);
	            }
	        }
	    }
	    function handleMsgGroup({ entries }) {
	        for (const msg of Object.values(entries)) {
	            if ('entries' in msg)
	                handleMsgGroup(msg);
	            else if (dataModel.isSelectMessage(msg)) {
	                handleMsgParts(msg.select.map(sel => sel.value));
	                for (const { value } of msg.cases)
	                    handleMsgParts(value);
	            }
	            else
	                handleMsgParts(msg.value);
	        }
	    }
	    for (const res of resources)
	        handleMsgGroup(res);
	}
	exports.validate = validate;
	});

	var lib = createCommonjsModule(function (module, exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.validate = exports.ResourceReader = exports.MessageFormat = void 0;
	__exportStar(dataModel, exports);
	__exportStar(formattable, exports);

	Object.defineProperty(exports, "MessageFormat", { enumerable: true, get: function () { return messageformat.MessageFormat; } });
	__exportStar(pattern, exports);

	Object.defineProperty(exports, "ResourceReader", { enumerable: true, get: function () { return resourceReader.ResourceReader; } });
	__exportStar(runtime, exports);
	 // must be after ./messageformat -- but why!?
	Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validate_1.validate; } });
	});

	var index = /*@__PURE__*/getDefaultExportFromCjs(lib);

	return index;

})));
