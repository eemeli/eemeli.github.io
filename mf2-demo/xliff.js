(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== 'undefined' ? globalThis : global || self),
      (global.XLIFF = factory()));
})(this, function () {
  'use strict';

  var commonjsGlobal =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : typeof self !== 'undefined'
      ? self
      : {};

  function getDefaultExportFromCjs(x) {
    return x &&
      x.__esModule &&
      Object.prototype.hasOwnProperty.call(x, 'default')
      ? x['default']
      : x;
  }

  function getAugmentedNamespace(n) {
    if (n.__esModule) return n;
    var a = Object.defineProperty({}, '__esModule', { value: true });
    Object.keys(n).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(n, k);
      Object.defineProperty(
        a,
        k,
        d.get
          ? d
          : {
              enumerable: true,
              get: function () {
                return n[k];
              }
            }
      );
    });
    return a;
  }

  function createCommonjsModule(fn) {
    var module = { exports: {} };
    return fn(module, module.exports), module.exports;
  }

  // do not edit .js files directly - edit src/index.jst

  var fastDeepEqual = function equal(a, b) {
    if (a === b) return true;

    if (a && b && typeof a == 'object' && typeof b == 'object') {
      if (a.constructor !== b.constructor) return false;

      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length) return false;
        for (i = length; i-- !== 0; ) if (!equal(a[i], b[i])) return false;
        return true;
      }

      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();

      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length) return false;

      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

      for (i = length; i-- !== 0; ) {
        var key = keys[i];

        if (!equal(a[key], b[key])) return false;
      }

      return true;
    }

    // true if both NaN, false otherwise
    return a !== a && b !== b;
  };

  var dataModel = createCommonjsModule(function (module, exports) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.isSelectMessage = exports.isMessage = exports.hasMeta = void 0;
    const hasMeta = part =>
      !!part.meta &&
      typeof part.meta === 'object' &&
      Object.keys(part.meta).length > 0;
    exports.hasMeta = hasMeta;
    const isMessage = msg =>
      !!msg &&
      typeof msg === 'object' &&
      'type' in msg &&
      (msg.type === 'message' || msg.type === 'select');
    exports.isMessage = isMessage;
    const isSelectMessage = msg => msg.type === 'select';
    exports.isSelectMessage = isSelectMessage;
  });

  var formattable$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Formattable = void 0;
    class Formattable {
      constructor(value, format) {
        this.value = value;
        if (format) Object.assign(this, format);
      }
      getValue() {
        return this.value;
      }
      matchSelectKey(key, _locales, _localeMatcher) {
        return String(this.getValue()) === key;
      }
      toParts(source, _locales, _localeMatcher) {
        let value = this.getValue();
        if (
          value == null ||
          typeof value === 'boolean' ||
          value instanceof Boolean
        )
          value = String(value);
        // At this point, value is string | symbol | function | object
        return [{ type: 'dynamic', value, source }];
      }
      toString(locales, localeMatcher) {
        const value = this.getValue();
        if (locales && value && typeof value.toLocaleString === 'function')
          try {
            return value.toLocaleString(locales, { localeMatcher });
          } catch (_) {
            // TODO: Report error?
          }
        return String(value);
      }
    }
    exports.Formattable = Formattable;
  });

  var formattableDatetime = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.FormattableDateTime = void 0;

    class FormattableDateTime extends formattable$1.Formattable {
      constructor(date, arg, options) {
        let lc;
        if (typeof arg === 'string') lc = [arg];
        else if (Array.isArray(arg)) lc = arg.slice();
        else {
          lc = undefined;
          options = arg !== null && arg !== void 0 ? arg : undefined;
        }
        if (date instanceof FormattableDateTime) {
          super(date.value);
          this.locales = date.locales || lc;
          this.options = date.options
            ? Object.assign(Object.assign({}, date.options), options)
            : options;
        } else {
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
        for (const part of parts) part.source = source;
        return parts;
      }
      toString(locales, localeMatcher) {
        var _a;
        const hasOpt =
          this.options &&
          Object.keys(this.options).some(key => key !== 'localeMatcher');
        const date = this.getValue();
        if (hasOpt) {
          const dtf = this.getDateTimeFormatter(locales, localeMatcher);
          return dtf.format(date);
        } else {
          const lm =
            ((_a = this.options) === null || _a === void 0
              ? void 0
              : _a.localeMatcher) || localeMatcher;
          const options = lm ? { localeMatcher: lm } : undefined;
          return date.toLocaleString(this.locales || locales, options);
        }
      }
    }
    exports.FormattableDateTime = FormattableDateTime;
  });

  var formattableNumber = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.FormattableNumber = void 0;

    class FormattableNumber extends formattable$1.Formattable {
      constructor(number, arg, options) {
        let lc;
        if (typeof arg === 'string') lc = [arg];
        else if (Array.isArray(arg)) lc = arg.slice();
        else {
          lc = undefined;
          options = arg !== null && arg !== void 0 ? arg : undefined;
        }
        if (number instanceof FormattableNumber) {
          super(number.value);
          this.locales = number.locales || lc;
          this.options = number.options
            ? Object.assign(Object.assign({}, number.options), options)
            : options;
        } else {
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
        return (
          (/^[0-9]+$/.test(key) && key === String(this.value)) ||
          key === this.getPluralCategory(locales, localeMatcher)
        );
      }
      toParts(source, locales, localeMatcher) {
        const nf = this.getNumberFormatter(locales, localeMatcher);
        const number = this.getValue(); // FIXME: TS should know that bigint is fine here
        const parts = nf.formatToParts(number);
        for (const part of parts) part.source = source;
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
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.asFormattable = void 0;

    function asFormattable(value) {
      if (value instanceof formattable$1.Formattable) return value;
      if (typeof value === 'number' || typeof value === 'bigint')
        return new formattableNumber.FormattableNumber(value);
      if (value instanceof Date)
        return new formattableDatetime.FormattableDateTime(value);
      return new formattable$1.Formattable(value);
    }
    exports.asFormattable = asFormattable;
  });

  var detectGrammar = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
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
    const isNumeric = str => Number.isFinite(Number(str));
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
        } else {
          meta.case = key[gcase];
        }
      }
      if (gender !== -1) {
        hasMeta = true;
        if (fallback[gender]) {
          const { fmt, def } = sel[gender];
          meta.gender = String(fmt.getValue());
          meta.genderFallback = def;
        } else {
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
          } else {
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
          if (c === 4 /* Other */) continue;
          const k = key[i];
          if (k === defaults[i]) continue;
          if (isNumeric(k) || plurals.includes(k)) {
            if (c !== 3 /* Plural */)
              gc[i] = c ? 4 /* Other */ : 3 /* Plural */;
          } else if (grammarCases.includes(k)) {
            if (c !== 1 /* Case */) gc[i] = c ? 4 /* Other */ : 1 /* Case */;
          } else if (genders.includes(k)) {
            if (c !== 2 /* Gender */)
              gc[i] = c ? 4 /* Other */ : 2 /* Gender */;
          } else {
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
    var __classPrivateFieldSet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) ||
      function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to set private field on non-instance');
        }
        privateMap.set(receiver, value);
        return value;
      };
    var __classPrivateFieldGet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) ||
      function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to get private field on non-instance');
        }
        return privateMap.get(receiver);
      };
    var _context, _meta, _pattern, _string;
    Object.defineProperty(exports, '__esModule', { value: true });
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
          return __classPrivateFieldSet(this, _pattern, msg.value);
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
            if (typeof k !== 'string' || !s) continue cases;
            if (s.fmt.matchSelectKey(k, ctx.locales, ctx.localeMatcher))
              fallback[i] = false;
            else if (s.def === k) fallback[i] = true;
            else continue cases;
          }
          const meta = detectGrammar.getFormattedSelectMeta(
            ctx,
            msg,
            key,
            sel,
            fallback
          );
          if (meta) {
            if (__classPrivateFieldGet(this, _meta))
              Object.assign(__classPrivateFieldGet(this, _meta), meta);
            else __classPrivateFieldSet(this, _meta, meta);
          }
          if (__classPrivateFieldGet(this, _meta))
            __classPrivateFieldGet(this, _meta)['selectResult'] = 'success';
          return __classPrivateFieldSet(this, _pattern, value);
        }
        if (!__classPrivateFieldGet(this, _meta))
          __classPrivateFieldSet(this, _meta, {});
        __classPrivateFieldGet(this, _meta)['selectResult'] = 'no-match';
        return __classPrivateFieldSet(this, _pattern, []);
      }
      matchSelectKey(key) {
        return this.toString() === key;
      }
      toParts(source) {
        const pattern = this.getPattern();
        const res = [];
        if (__classPrivateFieldGet(this, _meta))
          res.push({
            type: 'meta',
            value: '',
            meta: Object.assign({}, __classPrivateFieldGet(this, _meta))
          });
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
            __classPrivateFieldSet(
              this,
              _string,
              __classPrivateFieldGet(this, _string) +
                ctx.getFormatter(elem).formatToString(ctx, elem)
            );
        }
        return __classPrivateFieldGet(this, _string);
      }
    }
    exports.FormattableMessage = FormattableMessage;
    (_context = new WeakMap()),
      (_meta = new WeakMap()),
      (_pattern = new WeakMap()),
      (_string = new WeakMap());
  });

  var formattable = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.FormattableNumber = exports.FormattableMessage = exports.FormattableDateTime = exports.Formattable = exports.asFormattable = void 0;

    Object.defineProperty(exports, 'asFormattable', {
      enumerable: true,
      get: function () {
        return asFormattable_1.asFormattable;
      }
    });

    Object.defineProperty(exports, 'Formattable', {
      enumerable: true,
      get: function () {
        return formattable$1.Formattable;
      }
    });

    Object.defineProperty(exports, 'FormattableDateTime', {
      enumerable: true,
      get: function () {
        return formattableDatetime.FormattableDateTime;
      }
    });

    Object.defineProperty(exports, 'FormattableMessage', {
      enumerable: true,
      get: function () {
        return formattableMessage.FormattableMessage;
      }
    });

    Object.defineProperty(exports, 'FormattableNumber', {
      enumerable: true,
      get: function () {
        return formattableNumber.FormattableNumber;
      }
    });
  });

  var literal = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.formatter = exports.isLiteral = void 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isLiteral = part =>
      !!part && typeof part === 'object' && part.type === 'literal';
    exports.isLiteral = isLiteral;
    exports.formatter = {
      type: 'literal',
      asFormattable: (_ctx, lit) => formattable.asFormattable(lit.value),
      formatToParts(_ctx, lit) {
        const fmt = { type: 'literal', value: lit.value };
        return lit.meta
          ? [
              { type: 'meta', value: '', meta: Object.assign({}, lit.meta) },
              fmt
            ]
          : [fmt];
      },
      formatToString: (_ctx, lit) => lit.value
    };
  });

  var utilArgSource = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.getArgSource = void 0;

    /** Get a string source identifier for a Literal or Variable `arg`. */
    function getArgSource(arg) {
      if (pattern.isVariable(arg)) {
        return (
          '$' +
          arg.var_path
            .map(vp => {
              const str = getArgSource(vp);
              return str[0] === '$' ? `(${str})` : str;
            })
            .join('.')
        );
      }
      return pattern.isLiteral(arg) ? String(arg.value) : '???';
    }
    exports.getArgSource = getArgSource;
  });

  var _function = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.formatter = exports.isFunction = void 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isFunction = part =>
      !!part && typeof part === 'object' && part.type === 'function';
    exports.isFunction = isFunction;
    function formatFunctionToParts(ctx, fn) {
      const srcArgs = fn.args.map(utilArgSource.getArgSource);
      const source = fn.func + '(' + srcArgs.join(', ') + ')';
      let res;
      try {
        const fmt = callRuntimeFunction(ctx, fn);
        res = fmt.toParts(source, ctx.locales, ctx.localeMatcher);
      } catch (error) {
        let meta;
        if (error instanceof Error) {
          meta = Object.assign(Object.assign({}, fn.meta), {
            error_name: error.name,
            error_message: error.message
          });
          if (error.stack) meta.error_stack = error.stack;
        } else meta = Object.assign(Object.assign({}, fn.meta), { error_message: String(error) });
        return [
          { type: 'meta', value: '', meta, source },
          { type: 'fallback', value: fallbackValue(ctx, fn), source }
        ];
      }
      if (fn.meta)
        res.unshift({
          type: 'meta',
          value: '',
          source,
          meta: Object.assign({}, fn.meta)
        });
      return res;
    }
    function formatFunctionToString(ctx, fn) {
      try {
        const fmt = callRuntimeFunction(ctx, fn);
        return fmt.toString(ctx.locales, ctx.localeMatcher);
      } catch (_) {
        // TODO: report error
        return '{' + fallbackValue(ctx, fn) + '}';
      }
    }
    function callRuntimeFunction(ctx, { args, func, options }) {
      const rf = ctx.types.function[func];
      const fnArgs = args.map(arg =>
        ctx.getFormatter(arg).asFormattable(ctx, arg)
      );
      const fnOpt = resolveOptions(
        ctx,
        options,
        rf === null || rf === void 0 ? void 0 : rf.options
      );
      const res = rf.call(ctx.locales, fnOpt, ...fnArgs);
      return formattable.asFormattable(res);
    }
    function fallbackValue(ctx, fn) {
      const resolve = v => ctx.getFormatter(v).asFormattable(ctx, v).getValue();
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
          const exp =
            typeof expected === 'string' || Array.isArray(expected)
              ? expected
              : expected[key];
          if (!exp || exp === 'never') continue; // TODO: report error
          const res = ctx
            .getFormatter(value)
            .asFormattable(ctx, value)
            .getValue();
          if (
            exp === 'any' ||
            exp === typeof res ||
            (Array.isArray(exp) && typeof res === 'string' && exp.includes(res))
          ) {
            opt[key] = res;
          } else if (literal.isLiteral(value)) {
            switch (exp) {
              case 'boolean':
                if (res === 'true') opt[key] = true;
                else if (res === 'false') opt[key] = false;
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
        } catch (_) {
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
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.formatter = exports.isTerm = void 0;

    const isTermContext = ctx => typeof ctx.types.term === 'function';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTerm = part =>
      !!part && typeof part === 'object' && part.type === 'term';
    exports.isTerm = isTerm;
    function formatTermToParts(ctx, term) {
      const fmtMsg = getFormattableMessage(ctx, term);
      const source = getSource(term);
      const res = fmtMsg
        ? fmtMsg.toParts(source)
        : [{ type: 'fallback', value: fallbackValue(ctx, term), source }];
      if (term.meta)
        res.unshift({
          type: 'meta',
          value: '',
          meta: Object.assign({}, term.meta),
          source
        });
      return res;
    }
    function getSource({ msg_path, res_id }) {
      const name = msg_path.map(utilArgSource.getArgSource).join('.');
      return res_id ? `-${res_id}::${name}` : `-${name}`;
    }
    function getFormattableMessage(ctx, { msg_path, res_id, scope }) {
      if (!isTermContext(ctx)) return null;
      const strPath = msg_path.map(elem =>
        ctx.getFormatter(elem).formatToString(ctx, elem)
      );
      const msg = ctx.types.term(res_id, strPath);
      if (!msg) return null;
      let msgCtx = ctx;
      if (res_id || scope) {
        const types = Object.assign({}, ctx.types);
        if (res_id)
          types.term = (msgResId, msgPath) =>
            ctx.types.term(msgResId || res_id, msgPath);
        if (scope) {
          // If the variable type isn't actually available, this has no effect
          types.variable = Object.assign({}, ctx.types.variable);
          for (const [key, value] of Object.entries(scope))
            types.variable[key] = ctx
              .getFormatter(value)
              .asFormattable(ctx, value);
        }
        msgCtx = Object.assign(Object.assign({}, ctx), { types });
      }
      return new formattable.FormattableMessage(msgCtx, msg);
    }
    function fallbackValue(ctx, term) {
      const resolve = v => ctx.getFormatter(v).asFormattable(ctx, v).getValue();
      let name = term.msg_path.map(resolve).join('.');
      if (term.res_id) name = term.res_id + '::' + name;
      if (!term.scope) return '-' + name;
      const scope = Object.entries(term.scope).map(
        ([key, value]) => `${key}: ${resolve(value)}`
      );
      return `-${name}(${scope.join(', ')})`;
    }
    exports.formatter = {
      type: 'term',
      asFormattable: (ctx, term) => {
        var _a;
        return (_a = getFormattableMessage(ctx, term)) !== null && _a !== void 0
          ? _a
          : formattable.asFormattable(undefined);
      },
      formatToParts: formatTermToParts,
      formatToString: (ctx, term) => {
        var _a, _b;
        return (_b =
          (_a = getFormattableMessage(ctx, term)) === null || _a === void 0
            ? void 0
            : _a.toString()) !== null && _b !== void 0
          ? _b
          : '{' + fallbackValue(ctx, term) + '}';
      },
      initContext: (mf, resId) => (msgResId, msgPath) =>
        mf.getMessage(msgResId || resId, msgPath)
    };
  });

  var variable = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.formatter = exports.isVariable = void 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isVariable = part =>
      !!part && typeof part === 'object' && part.type === 'variable';
    exports.isVariable = isVariable;
    function formatVariableToParts(ctx, part) {
      const value = getValue(ctx, part);
      const source = utilArgSource.getArgSource(part);
      const res =
        value === undefined
          ? [{ type: 'fallback', value: fallbackValue(ctx, part), source }]
          : formattable
              .asFormattable(value)
              .toParts(source, ctx.locales, ctx.localeMatcher);
      if (part.meta)
        res.unshift({
          type: 'meta',
          value: '',
          meta: Object.assign({}, part.meta),
          source
        });
      return res;
    }
    function formatVariableToString(ctx, part) {
      const value = getValue(ctx, part);
      return value === undefined
        ? '{' + fallbackValue(ctx, part) + '}'
        : formattable
            .asFormattable(value)
            .toString(ctx.locales, ctx.localeMatcher);
    }
    /** @returns `undefined` if value not found */
    function getValue(ctx, { var_path }) {
      if (var_path.length === 0) return undefined;
      let val = ctx.types.variable;
      for (const p of var_path) {
        if (!val || val instanceof formattable.Formattable) return undefined;
        try {
          const arg = ctx.getFormatter(p).asFormattable(ctx, p).getValue();
          if (arg === undefined) return undefined;
          val = val[String(arg)];
        } catch (_) {
          // TODO: report error
          return undefined;
        }
      }
      return val;
    }
    function fallbackValue(ctx, { var_path }) {
      const path = var_path.map(v =>
        ctx.getFormatter(v).asFormattable(ctx, v).getValue()
      );
      return '$' + path.join('.');
    }
    exports.formatter = {
      type: 'variable',
      asFormattable: (ctx, part) =>
        formattable.asFormattable(getValue(ctx, part)),
      formatToParts: formatVariableToParts,
      formatToString: formatVariableToString,
      initContext: (_mf, _resId, scope) => scope
    };
  });

  var pattern = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.patternFormatters = exports.isVariable = exports.getArgSource = exports.isTerm = exports.isLiteral = exports.isFunction = void 0;

    var function_2 = _function;
    Object.defineProperty(exports, 'isFunction', {
      enumerable: true,
      get: function () {
        return function_2.isFunction;
      }
    });
    var literal_2 = literal;
    Object.defineProperty(exports, 'isLiteral', {
      enumerable: true,
      get: function () {
        return literal_2.isLiteral;
      }
    });
    var term_2 = term;
    Object.defineProperty(exports, 'isTerm', {
      enumerable: true,
      get: function () {
        return term_2.isTerm;
      }
    });

    Object.defineProperty(exports, 'getArgSource', {
      enumerable: true,
      get: function () {
        return utilArgSource.getArgSource;
      }
    });
    var variable_2 = variable;
    Object.defineProperty(exports, 'isVariable', {
      enumerable: true,
      get: function () {
        return variable_2.isVariable;
      }
    });
    exports.patternFormatters = [
      literal.formatter,
      variable.formatter,
      _function.formatter,
      term.formatter
    ];
  });

  var resourceReader = createCommonjsModule(function (module, exports) {
    var __classPrivateFieldSet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) ||
      function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to set private field on non-instance');
        }
        privateMap.set(receiver, value);
        return value;
      };
    var __classPrivateFieldGet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) ||
      function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to get private field on non-instance');
        }
        return privateMap.get(receiver);
      };
    var _data;
    Object.defineProperty(exports, '__esModule', { value: true });
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
        if (path.length === 0) return undefined;
        let msg = __classPrivateFieldGet(this, _data).entries[path[0]];
        for (let i = 1; i < path.length; ++i) {
          if (!msg || dataModel.isMessage(msg)) return undefined;
          msg = msg.entries[path[i]];
        }
        return dataModel.isMessage(msg) ? msg : undefined;
      }
    }
    exports.ResourceReader = ResourceReader;
    _data = new WeakMap();
  });

  var _default = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.runtime = exports.number = exports.datetime = void 0;

    exports.datetime = {
      call: function datetime(locales, options, arg) {
        let date;
        if (arg instanceof formattable.FormattableDateTime) date = arg;
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
        const num =
          arg instanceof formattable.FormattableNumber
            ? arg
            : Number(arg.getValue());
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
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.runtime = void 0;

    exports.runtime = {
      DATETIME: _default.datetime,
      NUMBER: _default.number
    };
  });

  var mf1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.runtime = exports.time = exports.number = exports.duration = exports.date = void 0;

    const getParam = options =>
      (options && String(options.param).trim()) || undefined;
    exports.date = {
      call: function date(locales, options, arg) {
        let date;
        if (arg instanceof formattable.FormattableDateTime) date = arg;
        else {
          const value = arg.getValue();
          date = new Date(typeof value === 'number' ? value : String(value));
        }
        const size = getParam(options);
        const opt = {
          localeMatcher:
            options === null || options === void 0
              ? void 0
              : options.localeMatcher,
          weekday: size === 'full' ? 'long' : undefined,
          day: 'numeric',
          month:
            size === 'short'
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
        if (!isFinite(value)) return String(value);
        let sign = '';
        if (value < 0) {
          sign = '-';
          value = Math.abs(value);
        } else {
          value = Number(value);
        }
        const sec = value % 60;
        const parts = [Math.round(sec) === sec ? sec : sec.toFixed(3)];
        if (value < 60) {
          parts.unshift(0); // at least one : is required
        } else {
          value = Math.round((value - Number(parts[0])) / 60);
          parts.unshift(value % 60); // minutes
          if (value >= 60) {
            value = Math.round((value - Number(parts[0])) / 60);
            parts.unshift(value); // hours
          }
        }
        const first = parts.shift();
        return (
          sign +
          first +
          ':' +
          parts.map(n => (n < 10 ? '0' + String(n) : String(n))).join(':')
        );
      },
      options: 'never'
    };
    class FormattableMF1Number extends formattable.FormattableNumber {
      getValue() {
        const num = this.value;
        const opt = this.options || {};
        const offset = Number(opt.pluralOffset || 0);
        return typeof num === 'bigint' ? num - BigInt(offset) : num - offset;
      }
    }
    exports.number = {
      call: function number(locales, options, arg) {
        const num =
          arg instanceof formattable.FormattableNumber
            ? arg
            : Number(arg.getValue());
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
          if (Number.isFinite(offset)) opt.pluralOffset = offset;
          if (options.type === 'ordinal') opt.type = 'ordinal';
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
        if (arg instanceof formattable.FormattableDateTime) time = arg;
        else {
          const value = arg.getValue();
          time = new Date(typeof value === 'number' ? value : String(value));
        }
        const size = getParam(options);
        const opt = {
          localeMatcher:
            options === null || options === void 0
              ? void 0
              : options.localeMatcher,
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
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.mf1Runtime = exports.fluentRuntime = exports.defaultRuntime = void 0;

    Object.defineProperty(exports, 'defaultRuntime', {
      enumerable: true,
      get: function () {
        return _default.runtime;
      }
    });

    Object.defineProperty(exports, 'fluentRuntime', {
      enumerable: true,
      get: function () {
        return fluent.runtime;
      }
    });

    Object.defineProperty(exports, 'mf1Runtime', {
      enumerable: true,
      get: function () {
        return mf1.runtime;
      }
    });
  });

  var messageformat = createCommonjsModule(function (module, exports) {
    var __classPrivateFieldSet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldSet) ||
      function (receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to set private field on non-instance');
        }
        privateMap.set(receiver, value);
        return value;
      };
    var __classPrivateFieldGet =
      (commonjsGlobal && commonjsGlobal.__classPrivateFieldGet) ||
      function (receiver, privateMap) {
        if (!privateMap.has(receiver)) {
          throw new TypeError('attempted to get private field on non-instance');
        }
        return privateMap.get(receiver);
      };
    var _formatters, _localeMatcher, _locales, _resources, _runtime;
    Object.defineProperty(exports, '__esModule', { value: true });
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
        __classPrivateFieldSet(
          this,
          _formatters,
          (_b =
            (_a =
              options === null || options === void 0
                ? void 0
                : options.formatters) === null || _a === void 0
              ? void 0
              : _a.map(fmtOpt => {
                  if (typeof fmtOpt === 'string') {
                    const fmt = pattern.patternFormatters.find(
                      fmt => fmt.type === fmtOpt
                    );
                    if (!fmt)
                      throw new RangeError(
                        `Unsupported pattern type: ${fmtOpt}`
                      );
                    return fmt;
                  } else return fmtOpt;
                })) !== null && _b !== void 0
            ? _b
            : pattern.patternFormatters
        );
        __classPrivateFieldSet(
          this,
          _localeMatcher,
          (_c =
            options === null || options === void 0
              ? void 0
              : options.localeMatcher) !== null && _c !== void 0
            ? _c
            : 'best fit'
        );
        __classPrivateFieldSet(
          this,
          _locales,
          Array.isArray(locales) ? locales : [locales]
        );
        __classPrivateFieldSet(
          this,
          _resources,
          resources.map(resourceReader.ResourceReader.from)
        );
        __classPrivateFieldSet(
          this,
          _runtime,
          (_d =
            options === null || options === void 0
              ? void 0
              : options.runtime) !== null && _d !== void 0
            ? _d
            : runtime.defaultRuntime
        );
      }
      addResources(...resources) {
        __classPrivateFieldGet(this, _resources).splice(
          0,
          0,
          ...resources.map(resourceReader.ResourceReader.from)
        );
      }
      format(arg0, arg1, arg2) {
        const fmtMsg = this.getFormattableMessage(
          ...this.parseArgs(arg0, arg1, arg2)
        );
        return fmtMsg ? fmtMsg.toString() : '';
      }
      formatToParts(arg0, arg1, arg2) {
        const fmtMsg = this.getFormattableMessage(
          ...this.parseArgs(arg0, arg1, arg2)
        );
        return fmtMsg ? fmtMsg.toParts() : [];
      }
      getMessage(resId, path) {
        const p = Array.isArray(path) ? path : [path];
        for (const res of __classPrivateFieldGet(this, _resources)) {
          if (res.getId() === resId) {
            const msg = res.getMessage(p);
            if (msg) return msg;
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
        if (!msg) return null;
        const ctx = this.createContext(resId, scope);
        return new formattable.FormattableMessage(ctx, msg);
      }
      createContext(resId, scope) {
        const getFormatter = ({ type }) => {
          const fmt = __classPrivateFieldGet(this, _formatters).find(
            fmt => fmt.type === type
          );
          if (fmt) return fmt;
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
        } else {
          // (msgPath: string | string[], scope?: Scope)
          const r0 = __classPrivateFieldGet(this, _resources)[0];
          if (!r0) throw new Error('No resources available');
          const id0 = r0.getId();
          for (const res of __classPrivateFieldGet(this, _resources))
            if (res.getId() !== id0)
              throw new Error(
                'Explicit resource id required to differentiate resources'
              );
          resId = id0;
          [msgPath, scope] = args;
        }
        return [resId, msgPath, scope || {}];
      }
    }
    exports.MessageFormat = MessageFormat;
    (_formatters = new WeakMap()),
      (_localeMatcher = new WeakMap()),
      (_locales = new WeakMap()),
      (_resources = new WeakMap()),
      (_runtime = new WeakMap());
  });

  var validate_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.validate = void 0;

    function validate(resources, runtime) {
      function handleMsgParts(parts) {
        for (const part of parts) {
          if (_function.isFunction(part)) {
            const { args, func } = part;
            const fn = runtime[func];
            if (!fn || typeof fn !== 'object' || typeof fn.call !== 'function')
              throw new ReferenceError(
                `Runtime function not available: ${func}`
              );
            handleMsgParts(args);
            // TODO: Once runtime arg requirements are defined, test against them
          } else if (term.isTerm(part)) {
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
          if ('entries' in msg) handleMsgGroup(msg);
          else if (dataModel.isSelectMessage(msg)) {
            handleMsgParts(msg.select.map(sel => sel.value));
            for (const { value } of msg.cases) handleMsgParts(value);
          } else handleMsgParts(msg.value);
        }
      }
      for (const res of resources) handleMsgGroup(res);
    }
    exports.validate = validate;
  });

  var lib$2 = createCommonjsModule(function (module, exports) {
    var __createBinding =
      (commonjsGlobal && commonjsGlobal.__createBinding) ||
      (Object.create
        ? function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            Object.defineProperty(o, k2, {
              enumerable: true,
              get: function () {
                return m[k];
              }
            });
          }
        : function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            o[k2] = m[k];
          });
    var __exportStar =
      (commonjsGlobal && commonjsGlobal.__exportStar) ||
      function (m, exports) {
        for (var p in m)
          if (
            p !== 'default' &&
            !Object.prototype.hasOwnProperty.call(exports, p)
          )
            __createBinding(exports, m, p);
      };
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.validate = exports.ResourceReader = exports.MessageFormat = void 0;
    __exportStar(dataModel, exports);
    __exportStar(formattable, exports);

    Object.defineProperty(exports, 'MessageFormat', {
      enumerable: true,
      get: function () {
        return messageformat.MessageFormat;
      }
    });
    __exportStar(pattern, exports);

    Object.defineProperty(exports, 'ResourceReader', {
      enumerable: true,
      get: function () {
        return resourceReader.ResourceReader;
      }
    });
    __exportStar(runtime, exports);
    // must be after ./messageformat -- but why!?
    Object.defineProperty(exports, 'validate', {
      enumerable: true,
      get: function () {
        return validate_1.validate;
      }
    });
  });

  var mf2xliff_1 = createCommonjsModule(function (module, exports) {
    var __importDefault =
      (commonjsGlobal && commonjsGlobal.__importDefault) ||
      function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
      };
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.mf2xliff = void 0;
    const fast_deep_equal_1 = __importDefault(fastDeepEqual);

    let _id = 0;
    const nextId = () => `m${++_id}`;
    function mf2xliff(source, target) {
      _id = 0;
      const attributes = {
        version: '2.0',
        srcLang: '',
        xmlns: 'urn:oasis:names:tc:xliff:document:2.0',
        'xmlns:mf':
          'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet' // FIXME
      };
      attributes.srcLang = source.locale;
      if (target instanceof lib$2.MessageFormat)
        throw new Error('source and target must be of the same type');
      else if (target) attributes.trgLang = target.locale;
      const elements = [];
      for (const [key, srcMsg] of Object.entries(source.entries)) {
        const trgMsg =
          target === null || target === void 0 ? void 0 : target.entries[key];
        const entry = resolveEntry([key], srcMsg, trgMsg);
        elements.push(entry);
      }
      const file = {
        type: 'element',
        name: 'file',
        attributes: { id: `f:${source.id}`, 'mf:resourceId': source.id },
        elements
      };
      return { type: 'element', name: 'xliff', attributes, elements: [file] };
    }
    exports.mf2xliff = mf2xliff;
    const msgAttributes = (pre, key) => ({
      id: `${pre}:${key.join('.').replace(/ +/g, '_')}`,
      name: key[key.length - 1]
    });
    // TODO Add <cp> escapes
    const asText = value => ({
      type: 'text',
      text: String(lib$2.isLiteral(value) ? value.value : value)
    });
    const mismatch = key =>
      `Structure mismatch between source & target at ${key.join('.')}`;
    function resolveEntry(key, srcMsg, trgMsg) {
      if (lib$2.isMessage(srcMsg)) {
        if (trgMsg) {
          if (!lib$2.isMessage(trgMsg)) throw new Error(mismatch(key));
          if (lib$2.isSelectMessage(srcMsg) || lib$2.isSelectMessage(trgMsg))
            return resolveSelect(key, srcMsg, trgMsg);
          else return resolvePattern(key, srcMsg.value, trgMsg.value);
        } else {
          return lib$2.isSelectMessage(srcMsg)
            ? resolveSelect(key, srcMsg, undefined)
            : resolvePattern(key, srcMsg.value, undefined);
        }
      }
      if (trgMsg && lib$2.isMessage(trgMsg)) throw new Error(mismatch(key));
      return {
        type: 'element',
        name: 'group',
        attributes: msgAttributes('g', key),
        elements: Object.entries(srcMsg.entries).map(([k, srcMsg]) =>
          resolveEntry(
            [...key, k],
            srcMsg,
            trgMsg === null || trgMsg === void 0 ? void 0 : trgMsg.entries[k]
          )
        )
      };
    }
    function resolveSelect(key, srcSel, trgSel) {
      var _a;
      // We might be combining a Pattern and a Select, so let's normalise
      if (lib$2.isSelectMessage(srcSel)) {
        if (trgSel && !lib$2.isSelectMessage(trgSel))
          trgSel = {
            type: 'select',
            select: srcSel.select,
            cases: [{ key: [], value: trgSel.value }]
          };
      } else {
        if (!trgSel || !lib$2.isSelectMessage(trgSel))
          throw new Error(
            `At least one of source & target at ${key.join(
              '.'
            )} must be a select`
          );
        srcSel = {
          type: 'select',
          select: trgSel.select,
          cases: [{ key: [], value: srcSel.value }]
        };
      }
      const select = [];
      const parts = srcSel.select.map(sel => {
        var _a;
        const id = nextId();
        select.push({
          id,
          default: (_a = sel.fallback) !== null && _a !== void 0 ? _a : 'other',
          keys: []
        });
        return resolveSelector(id, sel);
      });
      const elements = [
        { type: 'element', name: 'mf:messageformat', elements: parts }
      ];
      if (!trgSel) {
        // If there's only a source, we use its cases directly
        for (const c of srcSel.cases)
          elements.push(
            resolvePattern([...key, c.key.join(' ')], c.value, undefined)
          );
      } else {
        // If the source and target have different selectors, it gets a bit complicated.
        // First, let's make sure that `selIds` and `parts` includes all the selectors
        // and that we have mappings between the array indices.
        const trgSelMap = [];
        for (const sel of trgSel.select) {
          const prevIdx = srcSel.select.findIndex(prev =>
            fast_deep_equal_1.default(sel, prev)
          );
          if (prevIdx !== -1) trgSelMap.push(prevIdx);
          else {
            const id = nextId();
            select.push({
              id,
              default:
                (_a = sel.fallback) !== null && _a !== void 0 ? _a : 'other',
              keys: []
            });
            trgSelMap.push(select.length - 1);
            parts.push(resolveSelector(id, sel));
          }
        }
        // Collect all of the key values for each case, in the right order
        const addSorted = (i, key) => {
          const { default: def, keys } = select[i];
          if (keys.includes(key)) return;
          if (key === def) keys.push(key);
          else if (Number.isFinite(Number(key))) {
            let pos = 0;
            while (keys[pos] !== def && Number.isFinite(Number(keys[pos])))
              pos += 1;
            keys.splice(pos, 0, key);
          } else {
            let pos = keys.length;
            while (keys[pos - 1] === def) pos -= 1;
            keys.splice(pos, 0, key);
          }
        };
        for (const c of srcSel.cases)
          for (let i = 0; i < c.key.length; ++i) addSorted(i, c.key[i]);
        for (const c of trgSel.cases)
          for (let i = 0; i < c.key.length; ++i)
            addSorted(trgSelMap[i], c.key[i]);
        // Add a separate entry for each combined case
        // TODO: Collapse duplicates to default value only, where possible
        for (const sk of everyKey(select)) {
          const srcCase = srcSel.cases.find(c =>
            c.key.every((k, i) => k === sk[i] || k === select[i].default)
          );
          const trgCase = trgSel.cases.find(c =>
            c.key.every((k, i) => {
              const ti = trgSelMap[i];
              return k === sk[ti] || k === select[ti].default;
            })
          );
          if (!srcCase || !trgCase)
            throw new Error(
              `Case ${sk} not found‽ src:${srcCase} trg:${trgCase}`
            );
          elements.push(
            resolvePattern([...key, sk.join(' ')], srcCase.value, trgCase.value)
          );
        }
      }
      return {
        type: 'element',
        name: 'group',
        attributes: Object.assign(msgAttributes('g', key), {
          'mf:select': select.map(s => s.id).join(' ')
        }),
        elements
      };
    }
    function resolveSelector(id, sel) {
      const part = resolvePart(id, sel.value);
      if (typeof sel.fallback === 'string')
        part.attributes = Object.assign(
          { default: sel.fallback },
          part.attributes
        );
      return part;
    }
    function everyKey(select) {
      let ptr = null;
      const max = select.map(s => s.keys.length - 1);
      function next() {
        if (!ptr) ptr = new Array(select.length).fill(0);
        else {
          for (let i = ptr.length - 1; i >= 0; --i) {
            if (ptr[i] < max[i]) {
              ptr[i] += 1;
              break;
            }
            if (i === 0) return { done: true, value: undefined };
            ptr[i] = 0;
          }
        }
        return { value: ptr.map((j, i) => select[i].keys[j]) };
      }
      return { [Symbol.iterator]: () => ({ next }) };
    }
    function resolvePattern(key, srcPattern, trgPattern) {
      const parts = [];
      const handlePart = p => {
        if (lib$2.isLiteral(p)) return asText(p);
        const id = nextId();
        const part = resolvePart(id, p);
        parts.push(part);
        const attributes = { id: id.substring(1), 'mf:ref': id };
        return { type: 'element', name: 'ph', attributes };
      };
      const se = srcPattern.map(handlePart);
      const source = { type: 'element', name: 'source', elements: se };
      let ge;
      if (trgPattern) {
        const te = trgPattern.map(handlePart);
        const target = { type: 'element', name: 'target', elements: te };
        ge = [source, target];
      } else ge = [source];
      const segment = { type: 'element', name: 'segment', elements: ge };
      const attributes = msgAttributes('u', key);
      let elements;
      if (parts.length > 0) {
        const name = 'mf:messageformat';
        const mf = { type: 'element', name, elements: parts };
        elements = [mf, segment];
      } else elements = [segment];
      return { type: 'element', name: 'unit', attributes, elements };
    }
    function resolvePart(id, part) {
      const attributes = id ? { id } : undefined;
      if (lib$2.isLiteral(part) || lib$2.isVariable(part))
        return resolveArgument(id, part);
      if (lib$2.isFunction(part)) {
        const elements = [];
        if (part.options)
          for (const [name, value] of Object.entries(part.options))
            elements.push({
              type: 'element',
              name: 'mf:option',
              attributes: { name },
              elements: [resolveArgument(null, value)]
            });
        for (const p of part.args) elements.push(resolveArgument(null, p));
        return {
          type: 'element',
          name: 'mf:function',
          attributes: Object.assign({ name: part.func }, attributes),
          elements
        };
      }
      if (lib$2.isTerm(part)) {
        const elements = [];
        if (part.scope)
          for (const [name, value] of Object.entries(part.scope))
            elements.push({
              type: 'element',
              name: 'mf:scope',
              attributes: { name },
              elements: [resolveArgument(null, value)]
            });
        for (const p of part.msg_path) elements.push(resolveArgument(null, p));
        return {
          type: 'element',
          name: 'mf:message',
          attributes: Object.assign(
            part.res_id ? { resourceId: part.res_id } : {},
            attributes
          ),
          elements
        };
      }
      /* istanbul ignore next - never happens */
      throw new Error(`Unsupported part: ${JSON.stringify(part)}`);
    }
    function resolveArgument(id, part) {
      const attributes = id ? { id } : undefined;
      if (lib$2.isLiteral(part) || typeof part !== 'object') {
        return {
          type: 'element',
          name: 'mf:literal',
          attributes,
          elements: [asText(part)]
        };
      }
      if (lib$2.isVariable(part)) {
        const elements = part.var_path.map(p => resolveArgument(null, p));
        return { type: 'element', name: 'mf:variable', attributes, elements };
      }
      throw new Error(`Unsupported part: ${JSON.stringify(part)}`);
    }
  });

  /**
   * Expose `Emitter`.
   */

  var emitterComponent = Emitter;

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }
    return obj;
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.on = Emitter.prototype.addEventListener = function (
    event,
    fn
  ) {
    this._callbacks = this._callbacks || {};
    (this._callbacks[event] = this._callbacks[event] || []).push(fn);
    return this;
  };

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.once = function (event, fn) {
    var self = this;
    this._callbacks = this._callbacks || {};

    function on() {
      self.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };

  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */

  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (
    event,
    fn
  ) {
    this._callbacks = this._callbacks || {};

    // all
    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    }

    // specific event
    var callbacks = this._callbacks[event];
    if (!callbacks) return this;

    // remove all handlers
    if (1 == arguments.length) {
      delete this._callbacks[event];
      return this;
    }

    // remove specific handler
    var cb;
    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];
      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  };

  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */

  Emitter.prototype.emit = function (event) {
    this._callbacks = this._callbacks || {};
    var args = [].slice.call(arguments, 1),
      callbacks = this._callbacks[event];

    if (callbacks) {
      callbacks = callbacks.slice(0);
      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };

  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter.prototype.listeners = function (event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks[event] || [];
  };

  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */

  Emitter.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
  };

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  function Stream() {
    emitterComponent.call(this);
  }
  Stream.prototype = new emitterComponent();
  var stream = Stream;
  // Backwards-compat with node 0.4.x
  Stream.Stream = Stream;

  Stream.prototype.pipe = function (dest, options) {
    var source = this;

    function ondata(chunk) {
      if (dest.writable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }

    dest.on('drain', ondrain);

    // If the 'end' option is not supplied, dest.end() will be called when
    // source gets the 'end' or 'close' events.  Only dest.end() once.
    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }

    var didOnEnd = false;
    function onend() {
      if (didOnEnd) return;
      didOnEnd = true;

      dest.end();
    }

    function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;

      if (typeof dest.destroy === 'function') dest.destroy();
    }

    // don't leave dangling pipes when there are errors.
    function onerror(er) {
      cleanup();
      if (!this.hasListeners('error')) {
        throw er; // Unhandled stream error in pipe.
      }
    }

    source.on('error', onerror);
    dest.on('error', onerror);

    // remove all the event listeners that were added.
    function cleanup() {
      source.off('data', ondata);
      dest.off('drain', ondrain);

      source.off('end', onend);
      source.off('close', onclose);

      source.off('error', onerror);
      dest.off('error', onerror);

      source.off('end', cleanup);
      source.off('close', cleanup);

      dest.off('end', cleanup);
      dest.off('close', cleanup);
    }

    source.on('end', cleanup);
    source.on('close', cleanup);

    dest.on('end', cleanup);
    dest.on('close', cleanup);

    dest.emit('pipe', source);

    // Allow for unix-like usage: A.pipe(B).pipe(C)
    return dest;
  };

  var byteLength_1 = byteLength;
  var toByteArray_1 = toByteArray;
  var fromByteArray_1 = fromByteArray;

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  // Support decoding URL-safe base64 strings, as Node.js does.
  // See: https://en.wikipedia.org/wiki/Base64#URL_applications
  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;

  function getLens(b64) {
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    }

    // Trim off extra bytes after placeholder bytes are found
    // See: https://github.com/beatgammit/base64-js/issues/42
    var validLen = b64.indexOf('=');
    if (validLen === -1) validLen = len;

    var placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);

    return [validLen, placeHoldersLen];
  }

  // base64 is 4/3 + up to two characters of the original data
  function byteLength(b64) {
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
  }

  function _byteLength(b64, validLen, placeHoldersLen) {
    return ((validLen + placeHoldersLen) * 3) / 4 - placeHoldersLen;
  }

  function toByteArray(b64) {
    var tmp;
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];

    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));

    var curByte = 0;

    // if there are placeholders, only get up to the last complete 4 chars
    var len = placeHoldersLen > 0 ? validLen - 4 : validLen;

    var i;
    for (i = 0; i < len; i += 4) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 18) |
        (revLookup[b64.charCodeAt(i + 1)] << 12) |
        (revLookup[b64.charCodeAt(i + 2)] << 6) |
        revLookup[b64.charCodeAt(i + 3)];
      arr[curByte++] = (tmp >> 16) & 0xff;
      arr[curByte++] = (tmp >> 8) & 0xff;
      arr[curByte++] = tmp & 0xff;
    }

    if (placeHoldersLen === 2) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 2) |
        (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[curByte++] = tmp & 0xff;
    }

    if (placeHoldersLen === 1) {
      tmp =
        (revLookup[b64.charCodeAt(i)] << 10) |
        (revLookup[b64.charCodeAt(i + 1)] << 4) |
        (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[curByte++] = (tmp >> 8) & 0xff;
      arr[curByte++] = tmp & 0xff;
    }

    return arr;
  }

  function tripletToBase64(num) {
    return (
      lookup[(num >> 18) & 0x3f] +
      lookup[(num >> 12) & 0x3f] +
      lookup[(num >> 6) & 0x3f] +
      lookup[num & 0x3f]
    );
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp =
        ((uint8[i] << 16) & 0xff0000) +
        ((uint8[i + 1] << 8) & 0xff00) +
        (uint8[i + 2] & 0xff);
      output.push(tripletToBase64(tmp));
    }
    return output.join('');
  }

  function fromByteArray(uint8) {
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(
        encodeChunk(
          uint8,
          i,
          i + maxChunkLength > len2 ? len2 : i + maxChunkLength
        )
      );
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      parts.push(lookup[tmp >> 2] + lookup[(tmp << 4) & 0x3f] + '==');
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      parts.push(
        lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3f] +
          lookup[(tmp << 2) & 0x3f] +
          '='
      );
    }

    return parts.join('');
  }

  var base64Js = {
    byteLength: byteLength_1,
    toByteArray: toByteArray_1,
    fromByteArray: fromByteArray_1
  };

  /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
  var read = function (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << -nBits) - 1);
    s >>= -nBits;
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << -nBits) - 1);
    e >>= -nBits;
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  };

  var write = function (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (
      ;
      mLen >= 8;
      buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8
    ) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (
      ;
      eLen > 0;
      buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8
    ) {}

    buffer[offset + i - d] |= s * 128;
  };

  var ieee754 = {
    read: read,
    write: write
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   */

  var buffer = createCommonjsModule(function (module, exports) {
    const customInspectSymbol =
      typeof Symbol === 'function' && typeof Symbol['for'] === 'function' // eslint-disable-line dot-notation
        ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
        : null;

    exports.Buffer = Buffer;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;

    const K_MAX_LENGTH = 0x7fffffff;
    exports.kMaxLength = K_MAX_LENGTH;

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
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

    if (
      !Buffer.TYPED_ARRAY_SUPPORT &&
      typeof console !== 'undefined' &&
      typeof console.error === 'function'
    ) {
      console.error(
        'This browser lacks typed array (Uint8Array) support which is required by ' +
          '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
      );
    }

    function typedArraySupport() {
      // Can typed array instances can be augmented?
      try {
        const arr = new Uint8Array(1);
        const proto = {
          foo: function () {
            return 42;
          }
        };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }

    Object.defineProperty(Buffer.prototype, 'parent', {
      enumerable: true,
      get: function () {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.buffer;
      }
    });

    Object.defineProperty(Buffer.prototype, 'offset', {
      enumerable: true,
      get: function () {
        if (!Buffer.isBuffer(this)) return undefined;
        return this.byteOffset;
      }
    });

    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError(
          'The value "' + length + '" is invalid for option "size"'
        );
      }
      // Return an augmented `Uint8Array` instance
      const buf = new Uint8Array(length);
      Object.setPrototypeOf(buf, Buffer.prototype);
      return buf;
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

    function Buffer(arg, encodingOrOffset, length) {
      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }

    Buffer.poolSize = 8192; // not used by this implementation

    function from(value, encodingOrOffset, length) {
      if (typeof value === 'string') {
        return fromString(value, encodingOrOffset);
      }

      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }

      if (value == null) {
        throw new TypeError(
          'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
            'or Array-like Object. Received type ' +
            typeof value
        );
      }

      if (
        isInstance(value, ArrayBuffer) ||
        (value && isInstance(value.buffer, ArrayBuffer))
      ) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }

      if (
        typeof SharedArrayBuffer !== 'undefined' &&
        (isInstance(value, SharedArrayBuffer) ||
          (value && isInstance(value.buffer, SharedArrayBuffer)))
      ) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }

      if (typeof value === 'number') {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }

      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer.from(valueOf, encodingOrOffset, length);
      }

      const b = fromObject(value);
      if (b) return b;

      if (
        typeof Symbol !== 'undefined' &&
        Symbol.toPrimitive != null &&
        typeof value[Symbol.toPrimitive] === 'function'
      ) {
        return Buffer.from(
          value[Symbol.toPrimitive]('string'),
          encodingOrOffset,
          length
        );
      }

      throw new TypeError(
        'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
          'or Array-like Object. Received type ' +
          typeof value
      );
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
      return from(value, encodingOrOffset, length);
    };

    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
    // https://github.com/feross/buffer/pull/148
    Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer, Uint8Array);

    function assertSize(size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError(
          'The value "' + size + '" is invalid for option "size"'
        );
      }
    }

    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpreted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(size).fill(fill, encoding)
          : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function (size, fill, encoding) {
      return alloc(size, fill, encoding);
    };

    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function (size) {
      return allocUnsafe(size);
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function (size) {
      return allocUnsafe(size);
    };

    function fromString(string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }

      if (!Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }

      const length = byteLength(string, encoding) | 0;
      let buf = createBuffer(length);

      const actual = buf.write(string, encoding);

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        buf = buf.slice(0, actual);
      }

      return buf;
    }

    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf[i] = array[i] & 255;
      }
      return buf;
    }

    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }

    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }

      let buf;
      if (byteOffset === undefined && length === undefined) {
        buf = new Uint8Array(array);
      } else if (length === undefined) {
        buf = new Uint8Array(array, byteOffset);
      } else {
        buf = new Uint8Array(array, byteOffset, length);
      }

      // Return an augmented `Uint8Array` instance
      Object.setPrototypeOf(buf, Buffer.prototype);

      return buf;
    }

    function fromObject(obj) {
      if (Buffer.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf = createBuffer(len);

        if (buf.length === 0) {
          return buf;
        }

        obj.copy(buf, 0, 0, len);
        return buf;
      }

      if (obj.length !== undefined) {
        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }

      if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }

    function checked(length) {
      // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= K_MAX_LENGTH) {
        throw new RangeError(
          'Attempt to allocate Buffer larger than maximum ' +
            'size: 0x' +
            K_MAX_LENGTH.toString(16) +
            ' bytes'
        );
      }
      return length | 0;
    }

    function SlowBuffer(length) {
      if (+length != length) {
        // eslint-disable-line eqeqeq
        length = 0;
      }
      return Buffer.alloc(+length);
    }

    Buffer.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer.prototype; // so Buffer.isBuffer(Buffer.prototype) will be false
    };

    Buffer.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength);
      if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }

      if (a === b) return 0;

      let x = a.length;
      let y = b.length;

      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }

      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };

    Buffer.isEncoding = function isEncoding(encoding) {
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
          return true;
        default:
          return false;
      }
    };

    Buffer.concat = function concat(list, length) {
      if (!Array.isArray(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }

      if (list.length === 0) {
        return Buffer.alloc(0);
      }

      let i;
      if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }

      const buffer = Buffer.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list.length; ++i) {
        let buf = list[i];
        if (isInstance(buf, Uint8Array)) {
          if (pos + buf.length > buffer.length) {
            if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
            buf.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(buffer, buf, pos);
          }
        } else if (!Buffer.isBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf.copy(buffer, pos);
        }
        pos += buf.length;
      }
      return buffer;
    };

    function byteLength(string, encoding) {
      if (Buffer.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== 'string') {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
            'Received type ' +
            typeof string
        );
      }

      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;

      // Use a for loop to avoid recursion
      let loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len;
          case 'utf8':
          case 'utf-8':
            return utf8ToBytes(string).length;
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2;
          case 'hex':
            return len >>> 1;
          case 'base64':
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length; // assume utf8
            }
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer.byteLength = byteLength;

    function slowToString(encoding, start, end) {
      let loweredCase = false;

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0;
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return '';
      }

      if (end === undefined || end > this.length) {
        end = this.length;
      }

      if (end <= 0) {
        return '';
      }

      // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0;
      start >>>= 0;

      if (end <= start) {
        return '';
      }

      if (!encoding) encoding = 'utf8';

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end);

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end);

          case 'ascii':
            return asciiSlice(this, start, end);

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end);

          case 'base64':
            return base64Slice(this, start, end);

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end);

          default:
            if (loweredCase)
              throw new TypeError('Unknown encoding: ' + encoding);
            encoding = (encoding + '').toLowerCase();
            loweredCase = true;
        }
      }
    }

    // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
    // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
    // reliably in a browserify context because there could be multiple different
    // copies of the 'buffer' package in use. This method works even for Buffer
    // instances that were created from another copy of the `buffer` package.
    // See: https://github.com/feross/buffer/issues/154
    Buffer.prototype._isBuffer = true;

    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }

    Buffer.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits');
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };

    Buffer.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits');
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };

    Buffer.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits');
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };

    Buffer.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return '';
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };

    Buffer.prototype.toLocaleString = Buffer.prototype.toString;

    Buffer.prototype.equals = function equals(b) {
      if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
      if (this === b) return true;
      return Buffer.compare(this, b) === 0;
    };

    Buffer.prototype.inspect = function inspect() {
      let str = '';
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString('hex', 0, max)
        .replace(/(.{2})/g, '$1 ')
        .trim();
      if (this.length > max) str += ' ... ';
      return '<Buffer ' + str + '>';
    };
    if (customInspectSymbol) {
      Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect;
    }

    Buffer.prototype.compare = function compare(
      target,
      start,
      end,
      thisStart,
      thisEnd
    ) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer.from(target, target.offset, target.byteLength);
      }
      if (!Buffer.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. ' +
            'Received type ' +
            typeof target
        );
      }

      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = target ? target.length : 0;
      }
      if (thisStart === undefined) {
        thisStart = 0;
      }
      if (thisEnd === undefined) {
        thisEnd = this.length;
      }

      if (
        start < 0 ||
        end > target.length ||
        thisStart < 0 ||
        thisEnd > this.length
      ) {
        throw new RangeError('out of range index');
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }

      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;

      if (this === target) return 0;

      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);

      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);

      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }

      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1;

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
      }
      byteOffset = +byteOffset; // Coerce to Number.
      if (numberIsNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : buffer.length - 1;
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer.from(val, encoding);
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (Buffer.isBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === 'number') {
        val = val & 0xff; // Search for a byte value [0-255]
        if (typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(
              buffer,
              val,
              byteOffset
            );
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }

      throw new TypeError('val must be string, number or Buffer');
    }

    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (
          encoding === 'ucs2' ||
          encoding === 'ucs-2' ||
          encoding === 'utf16le' ||
          encoding === 'utf-16le'
        ) {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }

      function read(buf, i) {
        if (indexSize === 1) {
          return buf[i];
        } else {
          return buf.readUInt16BE(i * indexSize);
        }
      }

      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (
            read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)
          ) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength)
          byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }

      return -1;
    }

    Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };

    Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };

    Buffer.prototype.lastIndexOf = function lastIndexOf(
      val,
      byteOffset,
      encoding
    ) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };

    function hexWrite(buf, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }

      const strLen = string.length;

      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf[offset + i] = parsed;
      }
      return i;
    }

    function utf8Write(buf, string, offset, length) {
      return blitBuffer(
        utf8ToBytes(string, buf.length - offset),
        buf,
        offset,
        length
      );
    }

    function asciiWrite(buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length);
    }

    function base64Write(buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length);
    }

    function ucs2Write(buf, string, offset, length) {
      return blitBuffer(
        utf16leToBytes(string, buf.length - offset),
        buf,
        offset,
        length
      );
    }

    Buffer.prototype.write = function write(string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
        // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
        // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === undefined) encoding = 'utf8';
        } else {
          encoding = length;
          length = undefined;
        }
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        );
      }

      const remaining = this.length - offset;
      if (length === undefined || length > remaining) length = remaining;

      if (
        (string.length > 0 && (length < 0 || offset < 0)) ||
        offset > this.length
      ) {
        throw new RangeError('Attempt to write outside buffer bounds');
      }

      if (!encoding) encoding = 'utf8';

      let loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length);

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length);

          case 'ascii':
          case 'latin1':
          case 'binary':
            return asciiWrite(this, string, offset, length);

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length);

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length);

          default:
            if (loweredCase)
              throw new TypeError('Unknown encoding: ' + encoding);
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };

    Buffer.prototype.toJSON = function toJSON() {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };

    function base64Slice(buf, start, end) {
      if (start === 0 && end === buf.length) {
        return base64Js.fromByteArray(buf);
      } else {
        return base64Js.fromByteArray(buf.slice(start, end));
      }
    }

    function utf8Slice(buf, start, end) {
      end = Math.min(buf.length, end);
      const res = [];

      let i = start;
      while (i < end) {
        const firstByte = buf[i];
        let codePoint = null;
        let bytesPerSequence =
          firstByte > 0xef
            ? 4
            : firstByte > 0xdf
            ? 3
            : firstByte > 0xbf
            ? 2
            : 1;

        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 0xc0) === 0x80) {
                tempCodePoint =
                  ((firstByte & 0x1f) << 0x6) | (secondByte & 0x3f);
                if (tempCodePoint > 0x7f) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 0xc0) === 0x80 && (thirdByte & 0xc0) === 0x80) {
                tempCodePoint =
                  ((firstByte & 0xf) << 0xc) |
                  ((secondByte & 0x3f) << 0x6) |
                  (thirdByte & 0x3f);
                if (
                  tempCodePoint > 0x7ff &&
                  (tempCodePoint < 0xd800 || tempCodePoint > 0xdfff)
                ) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if (
                (secondByte & 0xc0) === 0x80 &&
                (thirdByte & 0xc0) === 0x80 &&
                (fourthByte & 0xc0) === 0x80
              ) {
                tempCodePoint =
                  ((firstByte & 0xf) << 0x12) |
                  ((secondByte & 0x3f) << 0xc) |
                  ((thirdByte & 0x3f) << 0x6) |
                  (fourthByte & 0x3f);
                if (tempCodePoint > 0xffff && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xfffd;
          bytesPerSequence = 1;
        } else if (codePoint > 0xffff) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000;
          res.push(((codePoint >>> 10) & 0x3ff) | 0xd800);
          codePoint = 0xdc00 | (codePoint & 0x3ff);
        }

        res.push(codePoint);
        i += bytesPerSequence;
      }

      return decodeCodePointsArray(res);
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    const MAX_ARGUMENTS_LENGTH = 0x1000;

    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      let res = '';
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, (i += MAX_ARGUMENTS_LENGTH))
        );
      }
      return res;
    }

    function asciiSlice(buf, start, end) {
      let ret = '';
      end = Math.min(buf.length, end);

      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7f);
      }
      return ret;
    }

    function latin1Slice(buf, start, end) {
      let ret = '';
      end = Math.min(buf.length, end);

      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret;
    }

    function hexSlice(buf, start, end) {
      const len = buf.length;

      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;

      let out = '';
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf[i]];
      }
      return out;
    }

    function utf16leSlice(buf, start, end) {
      const bytes = buf.slice(start, end);
      let res = '';
      // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }

    Buffer.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === undefined ? len : ~~end;

      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }

      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }

      if (end < start) end = start;

      const newBuf = this.subarray(start, end);
      // Return an augmented `Uint8Array` instance
      Object.setPrototypeOf(newBuf, Buffer.prototype);

      return newBuf;
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0)
        throw new RangeError('offset is not uint');
      if (offset + ext > length)
        throw new RangeError('Trying to access beyond buffer length');
    }

    Buffer.prototype.readUintLE = Buffer.prototype.readUIntLE = function readUIntLE(
      offset,
      byteLength,
      noAssert
    ) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }

      return val;
    };

    Buffer.prototype.readUintBE = Buffer.prototype.readUIntBE = function readUIntBE(
      offset,
      byteLength,
      noAssert
    ) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
      }

      let val = this[offset + --byteLength];
      let mul = 1;
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul;
      }

      return val;
    };

    Buffer.prototype.readUint8 = Buffer.prototype.readUInt8 = function readUInt8(
      offset,
      noAssert
    ) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };

    Buffer.prototype.readUint16LE = Buffer.prototype.readUInt16LE = function readUInt16LE(
      offset,
      noAssert
    ) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | (this[offset + 1] << 8);
    };

    Buffer.prototype.readUint16BE = Buffer.prototype.readUInt16BE = function readUInt16BE(
      offset,
      noAssert
    ) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return (this[offset] << 8) | this[offset + 1];
    };

    Buffer.prototype.readUint32LE = Buffer.prototype.readUInt32LE = function readUInt32LE(
      offset,
      noAssert
    ) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (
        (this[offset] | (this[offset + 1] << 8) | (this[offset + 2] << 16)) +
        this[offset + 3] * 0x1000000
      );
    };

    Buffer.prototype.readUint32BE = Buffer.prototype.readUInt32BE = function readUInt32BE(
      offset,
      noAssert
    ) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (
        this[offset] * 0x1000000 +
        ((this[offset + 1] << 16) | (this[offset + 2] << 8) | this[offset + 3])
      );
    };

    Buffer.prototype.readBigUInt64LE = defineBigIntMethod(
      function readBigUInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, 'offset');
        const first = this[offset];
        const last = this[offset + 7];
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8);
        }

        const lo =
          first +
          this[++offset] * 2 ** 8 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 24;

        const hi =
          this[++offset] +
          this[++offset] * 2 ** 8 +
          this[++offset] * 2 ** 16 +
          last * 2 ** 24;

        return BigInt(lo) + (BigInt(hi) << BigInt(32));
      }
    );

    Buffer.prototype.readBigUInt64BE = defineBigIntMethod(
      function readBigUInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, 'offset');
        const first = this[offset];
        const last = this[offset + 7];
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8);
        }

        const hi =
          first * 2 ** 24 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          this[++offset];

        const lo =
          this[++offset] * 2 ** 24 +
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          last;

        return (BigInt(hi) << BigInt(32)) + BigInt(lo);
      }
    );

    Buffer.prototype.readIntLE = function readIntLE(
      offset,
      byteLength,
      noAssert
    ) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val;
    };

    Buffer.prototype.readIntBE = function readIntBE(
      offset,
      byteLength,
      noAssert
    ) {
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      let i = byteLength;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val;
    };

    Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 0x80)) return this[offset];
      return (0xff - this[offset] + 1) * -1;
    };

    Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | (this[offset + 1] << 8);
      return val & 0x8000 ? val | 0xffff0000 : val;
    };

    Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | (this[offset] << 8);
      return val & 0x8000 ? val | 0xffff0000 : val;
    };

    Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (
        this[offset] |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
      );
    };

    Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (
        (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3]
      );
    };

    Buffer.prototype.readBigInt64LE = defineBigIntMethod(
      function readBigInt64LE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, 'offset');
        const first = this[offset];
        const last = this[offset + 7];
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8);
        }

        const val =
          this[offset + 4] +
          this[offset + 5] * 2 ** 8 +
          this[offset + 6] * 2 ** 16 +
          (last << 24); // Overflow

        return (
          (BigInt(val) << BigInt(32)) +
          BigInt(
            first +
              this[++offset] * 2 ** 8 +
              this[++offset] * 2 ** 16 +
              this[++offset] * 2 ** 24
          )
        );
      }
    );

    Buffer.prototype.readBigInt64BE = defineBigIntMethod(
      function readBigInt64BE(offset) {
        offset = offset >>> 0;
        validateNumber(offset, 'offset');
        const first = this[offset];
        const last = this[offset + 7];
        if (first === undefined || last === undefined) {
          boundsError(offset, this.length - 8);
        }

        const val =
          (first << 24) + // Overflow
          this[++offset] * 2 ** 16 +
          this[++offset] * 2 ** 8 +
          this[++offset];

        return (
          (BigInt(val) << BigInt(32)) +
          BigInt(
            this[++offset] * 2 ** 24 +
              this[++offset] * 2 ** 16 +
              this[++offset] * 2 ** 8 +
              last
          )
        );
      }
    );

    Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };

    Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };

    Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };

    Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };

    function checkInt(buf, value, offset, ext, max, min) {
      if (!Buffer.isBuffer(buf))
        throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min)
        throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf.length) throw new RangeError('Index out of range');
    }

    Buffer.prototype.writeUintLE = Buffer.prototype.writeUIntLE = function writeUIntLE(
      value,
      offset,
      byteLength,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      let mul = 1;
      let i = 0;
      this[offset] = value & 0xff;
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xff;
      }

      return offset + byteLength;
    };

    Buffer.prototype.writeUintBE = Buffer.prototype.writeUIntBE = function writeUIntBE(
      value,
      offset,
      byteLength,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      byteLength = byteLength >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      let i = byteLength - 1;
      let mul = 1;
      this[offset + i] = value & 0xff;
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xff;
      }

      return offset + byteLength;
    };

    Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8 = function writeUInt8(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
      this[offset] = value & 0xff;
      return offset + 1;
    };

    Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE = function writeUInt16LE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };

    Buffer.prototype.writeUint16BE = Buffer.prototype.writeUInt16BE = function writeUInt16BE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
      return offset + 2;
    };

    Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE = function writeUInt32LE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
      return offset + 4;
    };

    Buffer.prototype.writeUint32BE = Buffer.prototype.writeUInt32BE = function writeUInt32BE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
      return offset + 4;
    };

    function wrtBigUInt64LE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);

      let lo = Number(value & BigInt(0xffffffff));
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      lo = lo >> 8;
      buf[offset++] = lo;
      let hi = Number((value >> BigInt(32)) & BigInt(0xffffffff));
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      hi = hi >> 8;
      buf[offset++] = hi;
      return offset;
    }

    function wrtBigUInt64BE(buf, value, offset, min, max) {
      checkIntBI(value, min, max, buf, offset, 7);

      let lo = Number(value & BigInt(0xffffffff));
      buf[offset + 7] = lo;
      lo = lo >> 8;
      buf[offset + 6] = lo;
      lo = lo >> 8;
      buf[offset + 5] = lo;
      lo = lo >> 8;
      buf[offset + 4] = lo;
      let hi = Number((value >> BigInt(32)) & BigInt(0xffffffff));
      buf[offset + 3] = hi;
      hi = hi >> 8;
      buf[offset + 2] = hi;
      hi = hi >> 8;
      buf[offset + 1] = hi;
      hi = hi >> 8;
      buf[offset] = hi;
      return offset + 8;
    }

    Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(
      function writeBigUInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(
          this,
          value,
          offset,
          BigInt(0),
          BigInt('0xffffffffffffffff')
        );
      }
    );

    Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(
      function writeBigUInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(
          this,
          value,
          offset,
          BigInt(0),
          BigInt('0xffffffffffffffff')
        );
      }
    );

    Buffer.prototype.writeIntLE = function writeIntLE(
      value,
      offset,
      byteLength,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 0xff;
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
      }

      return offset + byteLength;
    };

    Buffer.prototype.writeIntBE = function writeIntBE(
      value,
      offset,
      byteLength,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      let i = byteLength - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 0xff;
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (((value / mul) >> 0) - sub) & 0xff;
      }

      return offset + byteLength;
    };

    Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
      if (value < 0) value = 0xff + value + 1;
      this[offset] = value & 0xff;
      return offset + 1;
    };

    Buffer.prototype.writeInt16LE = function writeInt16LE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };

    Buffer.prototype.writeInt16BE = function writeInt16BE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
      return offset + 2;
    };

    Buffer.prototype.writeInt32LE = function writeInt32LE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };

    Buffer.prototype.writeInt32BE = function writeInt32BE(
      value,
      offset,
      noAssert
    ) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (value < 0) value = 0xffffffff + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
      return offset + 4;
    };

    Buffer.prototype.writeBigInt64LE = defineBigIntMethod(
      function writeBigInt64LE(value, offset = 0) {
        return wrtBigUInt64LE(
          this,
          value,
          offset,
          -BigInt('0x8000000000000000'),
          BigInt('0x7fffffffffffffff')
        );
      }
    );

    Buffer.prototype.writeBigInt64BE = defineBigIntMethod(
      function writeBigInt64BE(value, offset = 0) {
        return wrtBigUInt64BE(
          this,
          value,
          offset,
          -BigInt('0x8000000000000000'),
          BigInt('0x7fffffffffffffff')
        );
      }
    );

    function checkIEEE754(buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range');
      if (offset < 0) throw new RangeError('Index out of range');
    }

    function writeFloat(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4);
      }
      ieee754.write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE(
      value,
      offset,
      noAssert
    ) {
      return writeFloat(this, value, offset, true, noAssert);
    };

    Buffer.prototype.writeFloatBE = function writeFloatBE(
      value,
      offset,
      noAssert
    ) {
      return writeFloat(this, value, offset, false, noAssert);
    };

    function writeDouble(buf, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8);
      }
      ieee754.write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE(
      value,
      offset,
      noAssert
    ) {
      return writeDouble(this, value, offset, true, noAssert);
    };

    Buffer.prototype.writeDoubleBE = function writeDoubleBE(
      value,
      offset,
      noAssert
    ) {
      return writeDouble(this, value, offset, false, noAssert);
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer.isBuffer(target))
        throw new TypeError('argument should be a Buffer');
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;

      // Copy 0 bytes; we're done
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds');
      }
      if (start < 0 || start >= this.length)
        throw new RangeError('Index out of range');
      if (end < 0) throw new RangeError('sourceEnd out of bounds');

      // Are we oob?
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }

      const len = end - start;

      if (
        this === target &&
        typeof Uint8Array.prototype.copyWithin === 'function'
      ) {
        // Use built-in when available, missing from IE11
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }

      return len;
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill(val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === 'string') {
          encoding = end;
          end = this.length;
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string');
        }
        if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if ((encoding === 'utf8' && code < 128) || encoding === 'latin1') {
            // Fast path: If `val` fits into a single byte, use that numeric value.
            val = code;
          }
        }
      } else if (typeof val === 'number') {
        val = val & 255;
      } else if (typeof val === 'boolean') {
        val = Number(val);
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index');
      }

      if (end <= start) {
        return this;
      }

      start = start >>> 0;
      end = end === undefined ? this.length : end >>> 0;

      if (!val) val = 0;

      let i;
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer.isBuffer(val) ? val : Buffer.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError(
            'The value "' + val + '" is invalid for argument "value"'
          );
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }

      return this;
    };

    // CUSTOM ERRORS
    // =============

    // Simplified versions from Node, changed for Buffer-only usage
    const errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();

          Object.defineProperty(this, 'message', {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });

          // Add the error code to the name to include it in the stack trace.
          this.name = `${this.name} [${sym}]`;
          // Access the stack to generate the error message including the error code
          // from the name.
          this.stack; // eslint-disable-line no-unused-expressions
          // Reset the name to the actual name.
          delete this.name;
        }

        get code() {
          return sym;
        }

        set code(value) {
          Object.defineProperty(this, 'code', {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }

        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }

    E(
      'ERR_BUFFER_OUT_OF_BOUNDS',
      function (name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }

        return 'Attempt to access memory outside buffer bounds';
      },
      RangeError
    );
    E(
      'ERR_INVALID_ARG_TYPE',
      function (name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      'ERR_OUT_OF_RANGE',
      function (str, range, input) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input;
        if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
          received = addNumericalSeparator(String(input));
        } else if (typeof input === 'bigint') {
          received = String(input);
          if (
            input > BigInt(2) ** BigInt(32) ||
            input < -(BigInt(2) ** BigInt(32))
          ) {
            received = addNumericalSeparator(received);
          }
          received += 'n';
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );

    function addNumericalSeparator(val) {
      let res = '';
      let i = val.length;
      const start = val[0] === '-' ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }

    // CHECK FUNCTIONS
    // ===============

    function checkBounds(buf, offset, byteLength) {
      validateNumber(offset, 'offset');
      if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
        boundsError(offset, buf.length - (byteLength + 1));
      }
    }

    function checkIntBI(value, min, max, buf, offset, byteLength) {
      if (value > max || value < min) {
        const n = typeof min === 'bigint' ? 'n' : '';
        let range;
        if (byteLength > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`;
          } else {
            range =
              `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
              `${(byteLength + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE('value', range, value);
      }
      checkBounds(buf, offset, byteLength);
    }

    function validateNumber(value, name) {
      if (typeof value !== 'number') {
        throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value);
      }
    }

    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(
          type || 'offset',
          'an integer',
          value
        );
      }

      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }

      throw new errors.ERR_OUT_OF_RANGE(
        type || 'offset',
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }

    // HELPER FUNCTIONS
    // ================

    const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

    function base64clean(str) {
      // Node takes equal signs as end of the Base64 encoding
      str = str.split('=')[0];
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = str.trim().replace(INVALID_BASE64_RE, '');
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return '';
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '=';
      }
      return str;
    }

    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];

      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xd7ff && codePoint < 0xe000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xdbff) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
              continue;
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
              continue;
            }

            // valid lead
            leadSurrogate = codePoint;

            continue;
          }

          // 2 leads in a row
          if (codePoint < 0xdc00) {
            if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
            leadSurrogate = codePoint;
            continue;
          }

          // valid surrogate pair
          codePoint =
            (((leadSurrogate - 0xd800) << 10) | (codePoint - 0xdc00)) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break;
          bytes.push((codePoint >> 0x6) | 0xc0, (codePoint & 0x3f) | 0x80);
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break;
          bytes.push(
            (codePoint >> 0xc) | 0xe0,
            ((codePoint >> 0x6) & 0x3f) | 0x80,
            (codePoint & 0x3f) | 0x80
          );
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break;
          bytes.push(
            (codePoint >> 0x12) | 0xf0,
            ((codePoint >> 0xc) & 0x3f) | 0x80,
            ((codePoint >> 0x6) & 0x3f) | 0x80,
            (codePoint & 0x3f) | 0x80
          );
        } else {
          throw new Error('Invalid code point');
        }
      }

      return bytes;
    }

    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xff);
      }
      return byteArray;
    }

    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;

        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }

      return byteArray;
    }

    function base64ToBytes(str) {
      return base64Js.toByteArray(base64clean(str));
    }

    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }

    // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
    // the `instanceof` check but they should be treated as of that type.
    // See: https://github.com/feross/buffer/issues/166
    function isInstance(obj, type) {
      return (
        obj instanceof type ||
        (obj != null &&
          obj.constructor != null &&
          obj.constructor.name != null &&
          obj.constructor.name === type.name)
      );
    }
    function numberIsNaN(obj) {
      // For IE11 support
      return obj !== obj; // eslint-disable-line no-self-compare
    }

    // Create lookup table for `toString('hex')`
    // See: https://github.com/feross/buffer/issues/219
    const hexSliceLookupTable = (function () {
      const alphabet = '0123456789abcdef';
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();

    // Return not function with Error if BigInt not supported
    function defineBigIntMethod(fn) {
      return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn;
    }

    function BufferBigIntNotDefined() {
      throw new Error('BigInt not supported');
    }
  });

  /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

  var safeBuffer = createCommonjsModule(function (module, exports) {
    /* eslint-disable node/no-deprecated-api */

    var Buffer = buffer.Buffer;

    // alternative to using Object.keys for old browsers
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (
      Buffer.from &&
      Buffer.alloc &&
      Buffer.allocUnsafe &&
      Buffer.allocUnsafeSlow
    ) {
      module.exports = buffer;
    } else {
      // Copy properties from require('buffer')
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }

    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length);
    }

    SafeBuffer.prototype = Object.create(Buffer.prototype);

    // Copy static methods from Buffer
    copyProps(Buffer, SafeBuffer);

    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number');
      }
      return Buffer(arg, encodingOrOffset, length);
    };

    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }
      var buf = Buffer(size);
      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };

    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }
      return Buffer(size);
    };

    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }
      return buffer.SlowBuffer(size);
    };
  });

  /*<replacement>*/

  var Buffer$1 = safeBuffer.Buffer;
  /*</replacement>*/

  var isEncoding =
    Buffer$1.isEncoding ||
    function (encoding) {
      encoding = '' + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
        case 'raw':
          return true;
        default:
          return false;
      }
    };

  function _normalizeEncoding(enc) {
    if (!enc) return 'utf8';
    var retried;
    while (true) {
      switch (enc) {
        case 'utf8':
        case 'utf-8':
          return 'utf8';
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return 'utf16le';
        case 'latin1':
        case 'binary':
          return 'latin1';
        case 'base64':
        case 'ascii':
        case 'hex':
          return enc;
        default:
          if (retried) return; // undefined
          enc = ('' + enc).toLowerCase();
          retried = true;
      }
    }
  }
  // Do not cache `Buffer.isEncoding` when checking encoding names as some
  // modules monkey-patch it to support additional encodings
  function normalizeEncoding(enc) {
    var nenc = _normalizeEncoding(enc);
    if (
      typeof nenc !== 'string' &&
      (Buffer$1.isEncoding === isEncoding || !isEncoding(enc))
    )
      throw new Error('Unknown encoding: ' + enc);
    return nenc || enc;
  }

  // StringDecoder provides an interface for efficiently splitting a series of
  // buffers into a series of JS strings without breaking apart multi-byte
  // characters.
  var StringDecoder_1 = StringDecoder;
  function StringDecoder(encoding) {
    this.encoding = normalizeEncoding(encoding);
    var nb;
    switch (this.encoding) {
      case 'utf16le':
        this.text = utf16Text;
        this.end = utf16End;
        nb = 4;
        break;
      case 'utf8':
        this.fillLast = utf8FillLast;
        nb = 4;
        break;
      case 'base64':
        this.text = base64Text;
        this.end = base64End;
        nb = 3;
        break;
      default:
        this.write = simpleWrite;
        this.end = simpleEnd;
        return;
    }
    this.lastNeed = 0;
    this.lastTotal = 0;
    this.lastChar = Buffer$1.allocUnsafe(nb);
  }

  StringDecoder.prototype.write = function (buf) {
    if (buf.length === 0) return '';
    var r;
    var i;
    if (this.lastNeed) {
      r = this.fillLast(buf);
      if (r === undefined) return '';
      i = this.lastNeed;
      this.lastNeed = 0;
    } else {
      i = 0;
    }
    if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
    return r || '';
  };

  StringDecoder.prototype.end = utf8End;

  // Returns only complete characters in a Buffer
  StringDecoder.prototype.text = utf8Text;

  // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
  StringDecoder.prototype.fillLast = function (buf) {
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
    this.lastNeed -= buf.length;
  };

  // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
  // continuation byte. If an invalid byte is detected, -2 is returned.
  function utf8CheckByte(byte) {
    if (byte <= 0x7f) return 0;
    else if (byte >> 5 === 0x06) return 2;
    else if (byte >> 4 === 0x0e) return 3;
    else if (byte >> 3 === 0x1e) return 4;
    return byte >> 6 === 0x02 ? -1 : -2;
  }

  // Checks at most 3 bytes at the end of a Buffer in order to detect an
  // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
  // needed to complete the UTF-8 character (if applicable) are returned.
  function utf8CheckIncomplete(self, buf, i) {
    var j = buf.length - 1;
    if (j < i) return 0;
    var nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self.lastNeed = nb - 1;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) self.lastNeed = nb - 2;
      return nb;
    }
    if (--j < i || nb === -2) return 0;
    nb = utf8CheckByte(buf[j]);
    if (nb >= 0) {
      if (nb > 0) {
        if (nb === 2) nb = 0;
        else self.lastNeed = nb - 3;
      }
      return nb;
    }
    return 0;
  }

  // Validates as many continuation bytes for a multi-byte UTF-8 character as
  // needed or are available. If we see a non-continuation byte where we expect
  // one, we "replace" the validated continuation bytes we've seen so far with
  // a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
  // behavior. The continuation byte check is included three times in the case
  // where all of the continuation bytes for a character exist in the same buffer.
  // It is also done this way as a slight performance increase instead of using a
  // loop.
  function utf8CheckExtraBytes(self, buf, p) {
    if ((buf[0] & 0xc0) !== 0x80) {
      self.lastNeed = 0;
      return '\ufffd';
    }
    if (self.lastNeed > 1 && buf.length > 1) {
      if ((buf[1] & 0xc0) !== 0x80) {
        self.lastNeed = 1;
        return '\ufffd';
      }
      if (self.lastNeed > 2 && buf.length > 2) {
        if ((buf[2] & 0xc0) !== 0x80) {
          self.lastNeed = 2;
          return '\ufffd';
        }
      }
    }
  }

  // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
  function utf8FillLast(buf) {
    var p = this.lastTotal - this.lastNeed;
    var r = utf8CheckExtraBytes(this, buf);
    if (r !== undefined) return r;
    if (this.lastNeed <= buf.length) {
      buf.copy(this.lastChar, p, 0, this.lastNeed);
      return this.lastChar.toString(this.encoding, 0, this.lastTotal);
    }
    buf.copy(this.lastChar, p, 0, buf.length);
    this.lastNeed -= buf.length;
  }

  // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
  // partial character, the character's bytes are buffered until the required
  // number of bytes are available.
  function utf8Text(buf, i) {
    var total = utf8CheckIncomplete(this, buf, i);
    if (!this.lastNeed) return buf.toString('utf8', i);
    this.lastTotal = total;
    var end = buf.length - (total - this.lastNeed);
    buf.copy(this.lastChar, 0, end);
    return buf.toString('utf8', i, end);
  }

  // For UTF-8, a replacement character is added when ending on a partial
  // character.
  function utf8End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed) return r + '\ufffd';
    return r;
  }

  // UTF-16LE typically needs two bytes per character, but even if we have an even
  // number of bytes available, we need to check if we end on a leading/high
  // surrogate. In that case, we need to wait for the next two bytes in order to
  // decode the last character properly.
  function utf16Text(buf, i) {
    if ((buf.length - i) % 2 === 0) {
      var r = buf.toString('utf16le', i);
      if (r) {
        var c = r.charCodeAt(r.length - 1);
        if (c >= 0xd800 && c <= 0xdbff) {
          this.lastNeed = 2;
          this.lastTotal = 4;
          this.lastChar[0] = buf[buf.length - 2];
          this.lastChar[1] = buf[buf.length - 1];
          return r.slice(0, -1);
        }
      }
      return r;
    }
    this.lastNeed = 1;
    this.lastTotal = 2;
    this.lastChar[0] = buf[buf.length - 1];
    return buf.toString('utf16le', i, buf.length - 1);
  }

  // For UTF-16LE we do not explicitly append special replacement characters if we
  // end on a partial character, we simply let v8 handle that.
  function utf16End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed) {
      var end = this.lastTotal - this.lastNeed;
      return r + this.lastChar.toString('utf16le', 0, end);
    }
    return r;
  }

  function base64Text(buf, i) {
    var n = (buf.length - i) % 3;
    if (n === 0) return buf.toString('base64', i);
    this.lastNeed = 3 - n;
    this.lastTotal = 3;
    if (n === 1) {
      this.lastChar[0] = buf[buf.length - 1];
    } else {
      this.lastChar[0] = buf[buf.length - 2];
      this.lastChar[1] = buf[buf.length - 1];
    }
    return buf.toString('base64', i, buf.length - n);
  }

  function base64End(buf) {
    var r = buf && buf.length ? this.write(buf) : '';
    if (this.lastNeed)
      return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
    return r;
  }

  // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
  function simpleWrite(buf) {
    return buf.toString(this.encoding);
  }

  function simpleEnd(buf) {
    return buf && buf.length ? this.write(buf) : '';
  }

  var string_decoder = {
    StringDecoder: StringDecoder_1
  };

  var sax = createCommonjsModule(function (module, exports) {
    (function (sax) {
      // wrapper for non-node envs
      sax.parser = function (strict, opt) {
        return new SAXParser(strict, opt);
      };
      sax.SAXParser = SAXParser;
      sax.SAXStream = SAXStream;
      sax.createStream = createStream;

      // When we pass the MAX_BUFFER_LENGTH position, start checking for buffer overruns.
      // When we check, schedule the next check for MAX_BUFFER_LENGTH - (max(buffer lengths)),
      // since that's the earliest that a buffer overrun could occur.  This way, checks are
      // as rare as required, but as often as necessary to ensure never crossing this bound.
      // Furthermore, buffers are only tested at most once per write(), so passing a very
      // large string into write() might have undesirable effects, but this is manageable by
      // the caller, so it is assumed to be safe.  Thus, a call to write() may, in the extreme
      // edge case, result in creating at most one complete copy of the string passed in.
      // Set to Infinity to have unlimited buffers.
      sax.MAX_BUFFER_LENGTH = 64 * 1024;

      var buffers = [
        'comment',
        'sgmlDecl',
        'textNode',
        'tagName',
        'doctype',
        'procInstName',
        'procInstBody',
        'entity',
        'attribName',
        'attribValue',
        'cdata',
        'script'
      ];

      sax.EVENTS = [
        'text',
        'processinginstruction',
        'sgmldeclaration',
        'doctype',
        'comment',
        'opentagstart',
        'attribute',
        'opentag',
        'closetag',
        'opencdata',
        'cdata',
        'closecdata',
        'error',
        'end',
        'ready',
        'script',
        'opennamespace',
        'closenamespace'
      ];

      function SAXParser(strict, opt) {
        if (!(this instanceof SAXParser)) {
          return new SAXParser(strict, opt);
        }

        var parser = this;
        clearBuffers(parser);
        parser.q = parser.c = '';
        parser.bufferCheckPosition = sax.MAX_BUFFER_LENGTH;
        parser.opt = opt || {};
        parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
        parser.looseCase = parser.opt.lowercase ? 'toLowerCase' : 'toUpperCase';
        parser.tags = [];
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.strict = !!strict;
        parser.noscript = !!(strict || parser.opt.noscript);
        parser.state = S.BEGIN;
        parser.strictEntities = parser.opt.strictEntities;
        parser.ENTITIES = parser.strictEntities
          ? Object.create(sax.XML_ENTITIES)
          : Object.create(sax.ENTITIES);
        parser.attribList = [];

        // namespaces form a prototype chain.
        // it always points at the current tag,
        // which protos to its parent tag.
        if (parser.opt.xmlns) {
          parser.ns = Object.create(rootNS);
        }

        // mostly just for error reporting
        parser.trackPosition = parser.opt.position !== false;
        if (parser.trackPosition) {
          parser.position = parser.line = parser.column = 0;
        }
        emit(parser, 'onready');
      }

      if (!Object.create) {
        Object.create = function (o) {
          function F() {}
          F.prototype = o;
          var newf = new F();
          return newf;
        };
      }

      if (!Object.keys) {
        Object.keys = function (o) {
          var a = [];
          for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
          return a;
        };
      }

      function checkBufferLength(parser) {
        var maxAllowed = Math.max(sax.MAX_BUFFER_LENGTH, 10);
        var maxActual = 0;
        for (var i = 0, l = buffers.length; i < l; i++) {
          var len = parser[buffers[i]].length;
          if (len > maxAllowed) {
            // Text/cdata nodes can get big, and since they're buffered,
            // we can get here under normal conditions.
            // Avoid issues by emitting the text node now,
            // so at least it won't get any bigger.
            switch (buffers[i]) {
              case 'textNode':
                closeText(parser);
                break;

              case 'cdata':
                emitNode(parser, 'oncdata', parser.cdata);
                parser.cdata = '';
                break;

              case 'script':
                emitNode(parser, 'onscript', parser.script);
                parser.script = '';
                break;

              default:
                error(parser, 'Max buffer length exceeded: ' + buffers[i]);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        // schedule the next check for the earliest possible buffer overrun.
        var m = sax.MAX_BUFFER_LENGTH - maxActual;
        parser.bufferCheckPosition = m + parser.position;
      }

      function clearBuffers(parser) {
        for (var i = 0, l = buffers.length; i < l; i++) {
          parser[buffers[i]] = '';
        }
      }

      function flushBuffers(parser) {
        closeText(parser);
        if (parser.cdata !== '') {
          emitNode(parser, 'oncdata', parser.cdata);
          parser.cdata = '';
        }
        if (parser.script !== '') {
          emitNode(parser, 'onscript', parser.script);
          parser.script = '';
        }
      }

      SAXParser.prototype = {
        end: function () {
          end(this);
        },
        write: write,
        resume: function () {
          this.error = null;
          return this;
        },
        close: function () {
          return this.write(null);
        },
        flush: function () {
          flushBuffers(this);
        }
      };

      var Stream;
      try {
        Stream = stream.Stream;
      } catch (ex) {
        Stream = function () {};
      }

      var streamWraps = sax.EVENTS.filter(function (ev) {
        return ev !== 'error' && ev !== 'end';
      });

      function createStream(strict, opt) {
        return new SAXStream(strict, opt);
      }

      function SAXStream(strict, opt) {
        if (!(this instanceof SAXStream)) {
          return new SAXStream(strict, opt);
        }

        Stream.apply(this);

        this._parser = new SAXParser(strict, opt);
        this.writable = true;
        this.readable = true;

        var me = this;

        this._parser.onend = function () {
          me.emit('end');
        };

        this._parser.onerror = function (er) {
          me.emit('error', er);

          // if didn't throw, then means error was handled.
          // go ahead and clear error, so we can write again.
          me._parser.error = null;
        };

        this._decoder = null;

        streamWraps.forEach(function (ev) {
          Object.defineProperty(me, 'on' + ev, {
            get: function () {
              return me._parser['on' + ev];
            },
            set: function (h) {
              if (!h) {
                me.removeAllListeners(ev);
                me._parser['on' + ev] = h;
                return h;
              }
              me.on(ev, h);
            },
            enumerable: true,
            configurable: false
          });
        });
      }

      SAXStream.prototype = Object.create(Stream.prototype, {
        constructor: {
          value: SAXStream
        }
      });

      SAXStream.prototype.write = function (data) {
        if (
          typeof Buffer === 'function' &&
          typeof Buffer.isBuffer === 'function' &&
          Buffer.isBuffer(data)
        ) {
          if (!this._decoder) {
            var SD = string_decoder.StringDecoder;
            this._decoder = new SD('utf8');
          }
          data = this._decoder.write(data);
        }

        this._parser.write(data.toString());
        this.emit('data', data);
        return true;
      };

      SAXStream.prototype.end = function (chunk) {
        if (chunk && chunk.length) {
          this.write(chunk);
        }
        this._parser.end();
        return true;
      };

      SAXStream.prototype.on = function (ev, handler) {
        var me = this;
        if (!me._parser['on' + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser['on' + ev] = function () {
            var args =
              arguments.length === 1
                ? [arguments[0]]
                : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }

        return Stream.prototype.on.call(me, ev, handler);
      };

      // this really needs to be replaced with character classes.
      // XML allows all manner of ridiculous numbers and digits.
      var CDATA = '[CDATA[';
      var DOCTYPE = 'DOCTYPE';
      var XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace';
      var XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/';
      var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };

      // http://www.w3.org/TR/REC-xml/#NT-NameStartChar
      // This implementation works on strings, a single character at a time
      // as such, it cannot ever support astral-plane characters (10000-EFFFF)
      // without a significant breaking change to either this  parser, or the
      // JavaScript language.  Implementation of an emoji-capable xml parser
      // is left as an exercise for the reader.
      var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;

      var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

      var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
      var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;

      function isWhitespace(c) {
        return c === ' ' || c === '\n' || c === '\r' || c === '\t';
      }

      function isQuote(c) {
        return c === '"' || c === "'";
      }

      function isAttribEnd(c) {
        return c === '>' || isWhitespace(c);
      }

      function isMatch(regex, c) {
        return regex.test(c);
      }

      function notMatch(regex, c) {
        return !isMatch(regex, c);
      }

      var S = 0;
      sax.STATE = {
        BEGIN: S++, // leading byte order mark or whitespace
        BEGIN_WHITESPACE: S++, // leading whitespace
        TEXT: S++, // general stuff
        TEXT_ENTITY: S++, // &amp and such.
        OPEN_WAKA: S++, // <
        SGML_DECL: S++, // <!BLARG
        SGML_DECL_QUOTED: S++, // <!BLARG foo "bar
        DOCTYPE: S++, // <!DOCTYPE
        DOCTYPE_QUOTED: S++, // <!DOCTYPE "//blah
        DOCTYPE_DTD: S++, // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: S++, // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: S++, // <!-
        COMMENT: S++, // <!--
        COMMENT_ENDING: S++, // <!-- blah -
        COMMENT_ENDED: S++, // <!-- blah --
        CDATA: S++, // <![CDATA[ something
        CDATA_ENDING: S++, // ]
        CDATA_ENDING_2: S++, // ]]
        PROC_INST: S++, // <?hi
        PROC_INST_BODY: S++, // <?hi there
        PROC_INST_ENDING: S++, // <?hi "there" ?
        OPEN_TAG: S++, // <strong
        OPEN_TAG_SLASH: S++, // <strong /
        ATTRIB: S++, // <a
        ATTRIB_NAME: S++, // <a foo
        ATTRIB_NAME_SAW_WHITE: S++, // <a foo _
        ATTRIB_VALUE: S++, // <a foo=
        ATTRIB_VALUE_QUOTED: S++, // <a foo="bar
        ATTRIB_VALUE_CLOSED: S++, // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: S++, // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: S++, // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: S++, // <foo bar=&quot
        CLOSE_TAG: S++, // </a
        CLOSE_TAG_SAW_WHITE: S++, // </a   >
        SCRIPT: S++, // <script> ...
        SCRIPT_ENDING: S++ // <script> ... <
      };

      sax.XML_ENTITIES = {
        amp: '&',
        gt: '>',
        lt: '<',
        quot: '"',
        apos: "'"
      };

      sax.ENTITIES = {
        amp: '&',
        gt: '>',
        lt: '<',
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      };

      Object.keys(sax.ENTITIES).forEach(function (key) {
        var e = sax.ENTITIES[key];
        var s = typeof e === 'number' ? String.fromCharCode(e) : e;
        sax.ENTITIES[key] = s;
      });

      for (var s in sax.STATE) {
        sax.STATE[sax.STATE[s]] = s;
      }

      // shorthand
      S = sax.STATE;

      function emit(parser, event, data) {
        parser[event] && parser[event](data);
      }

      function emitNode(parser, nodeType, data) {
        if (parser.textNode) closeText(parser);
        emit(parser, nodeType, data);
      }

      function closeText(parser) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode) emit(parser, 'ontext', parser.textNode);
        parser.textNode = '';
      }

      function textopts(opt, text) {
        if (opt.trim) text = text.trim();
        if (opt.normalize) text = text.replace(/\s+/g, ' ');
        return text;
      }

      function error(parser, er) {
        closeText(parser);
        if (parser.trackPosition) {
          er +=
            '\nLine: ' +
            parser.line +
            '\nColumn: ' +
            parser.column +
            '\nChar: ' +
            parser.c;
        }
        er = new Error(er);
        parser.error = er;
        emit(parser, 'onerror', er);
        return parser;
      }

      function end(parser) {
        if (parser.sawRoot && !parser.closedRoot)
          strictFail(parser, 'Unclosed root tag');
        if (
          parser.state !== S.BEGIN &&
          parser.state !== S.BEGIN_WHITESPACE &&
          parser.state !== S.TEXT
        ) {
          error(parser, 'Unexpected end');
        }
        closeText(parser);
        parser.c = '';
        parser.closed = true;
        emit(parser, 'onend');
        SAXParser.call(parser, parser.strict, parser.opt);
        return parser;
      }

      function strictFail(parser, message) {
        if (typeof parser !== 'object' || !(parser instanceof SAXParser)) {
          throw new Error('bad call to strictFail');
        }
        if (parser.strict) {
          error(parser, message);
        }
      }

      function newTag(parser) {
        if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
        var parent = parser.tags[parser.tags.length - 1] || parser;
        var tag = (parser.tag = { name: parser.tagName, attributes: {} });

        // will be overridden if tag contails an xmlns="foo" or xmlns:foo="bar"
        if (parser.opt.xmlns) {
          tag.ns = parent.ns;
        }
        parser.attribList.length = 0;
        emitNode(parser, 'onopentagstart', tag);
      }

      function qname(name, attribute) {
        var i = name.indexOf(':');
        var qualName = i < 0 ? ['', name] : name.split(':');
        var prefix = qualName[0];
        var local = qualName[1];

        // <x "xmlns"="http://foo">
        if (attribute && name === 'xmlns') {
          prefix = 'xmlns';
          local = '';
        }

        return { prefix: prefix, local: local };
      }

      function attrib(parser) {
        if (!parser.strict) {
          parser.attribName = parser.attribName[parser.looseCase]();
        }

        if (
          parser.attribList.indexOf(parser.attribName) !== -1 ||
          parser.tag.attributes.hasOwnProperty(parser.attribName)
        ) {
          parser.attribName = parser.attribValue = '';
          return;
        }

        if (parser.opt.xmlns) {
          var qn = qname(parser.attribName, true);
          var prefix = qn.prefix;
          var local = qn.local;

          if (prefix === 'xmlns') {
            // namespace binding attribute. push the binding into scope
            if (local === 'xml' && parser.attribValue !== XML_NAMESPACE) {
              strictFail(
                parser,
                'xml: prefix must be bound to ' +
                  XML_NAMESPACE +
                  '\n' +
                  'Actual: ' +
                  parser.attribValue
              );
            } else if (
              local === 'xmlns' &&
              parser.attribValue !== XMLNS_NAMESPACE
            ) {
              strictFail(
                parser,
                'xmlns: prefix must be bound to ' +
                  XMLNS_NAMESPACE +
                  '\n' +
                  'Actual: ' +
                  parser.attribValue
              );
            } else {
              var tag = parser.tag;
              var parent = parser.tags[parser.tags.length - 1] || parser;
              if (tag.ns === parent.ns) {
                tag.ns = Object.create(parent.ns);
              }
              tag.ns[local] = parser.attribValue;
            }
          }

          // defer onattribute events until all attributes have been seen
          // so any new bindings can take effect. preserve attribute order
          // so deferred events can be emitted in document order
          parser.attribList.push([parser.attribName, parser.attribValue]);
        } else {
          // in non-xmlns mode, we can emit the event right away
          parser.tag.attributes[parser.attribName] = parser.attribValue;
          emitNode(parser, 'onattribute', {
            name: parser.attribName,
            value: parser.attribValue
          });
        }

        parser.attribName = parser.attribValue = '';
      }

      function openTag(parser, selfClosing) {
        if (parser.opt.xmlns) {
          // emit namespace binding events
          var tag = parser.tag;

          // add namespace info to tag
          var qn = qname(parser.tagName);
          tag.prefix = qn.prefix;
          tag.local = qn.local;
          tag.uri = tag.ns[qn.prefix] || '';

          if (tag.prefix && !tag.uri) {
            strictFail(
              parser,
              'Unbound namespace prefix: ' + JSON.stringify(parser.tagName)
            );
            tag.uri = qn.prefix;
          }

          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (tag.ns && parent.ns !== tag.ns) {
            Object.keys(tag.ns).forEach(function (p) {
              emitNode(parser, 'onopennamespace', {
                prefix: p,
                uri: tag.ns[p]
              });
            });
          }

          // handle deferred onattribute events
          // Note: do not apply default ns to attributes:
          //   http://www.w3.org/TR/REC-xml-names/#defaulting
          for (var i = 0, l = parser.attribList.length; i < l; i++) {
            var nv = parser.attribList[i];
            var name = nv[0];
            var value = nv[1];
            var qualName = qname(name, true);
            var prefix = qualName.prefix;
            var local = qualName.local;
            var uri = prefix === '' ? '' : tag.ns[prefix] || '';
            var a = {
              name: name,
              value: value,
              prefix: prefix,
              local: local,
              uri: uri
            };

            // if there's any attributes with an undefined namespace,
            // then fail on them now.
            if (prefix && prefix !== 'xmlns' && !uri) {
              strictFail(
                parser,
                'Unbound namespace prefix: ' + JSON.stringify(prefix)
              );
              a.uri = prefix;
            }
            parser.tag.attributes[name] = a;
            emitNode(parser, 'onattribute', a);
          }
          parser.attribList.length = 0;
        }

        parser.tag.isSelfClosing = !!selfClosing;

        // process the tag
        parser.sawRoot = true;
        parser.tags.push(parser.tag);
        emitNode(parser, 'onopentag', parser.tag);
        if (!selfClosing) {
          // special case for <script> in non-strict mode.
          if (!parser.noscript && parser.tagName.toLowerCase() === 'script') {
            parser.state = S.SCRIPT;
          } else {
            parser.state = S.TEXT;
          }
          parser.tag = null;
          parser.tagName = '';
        }
        parser.attribName = parser.attribValue = '';
        parser.attribList.length = 0;
      }

      function closeTag(parser) {
        if (!parser.tagName) {
          strictFail(parser, 'Weird empty close tag.');
          parser.textNode += '</>';
          parser.state = S.TEXT;
          return;
        }

        if (parser.script) {
          if (parser.tagName !== 'script') {
            parser.script += '</' + parser.tagName + '>';
            parser.tagName = '';
            parser.state = S.SCRIPT;
            return;
          }
          emitNode(parser, 'onscript', parser.script);
          parser.script = '';
        }

        // first make sure that the closing tag actually exists.
        // <a><b></c></b></a> will close everything, otherwise.
        var t = parser.tags.length;
        var tagName = parser.tagName;
        if (!parser.strict) {
          tagName = tagName[parser.looseCase]();
        }
        var closeTo = tagName;
        while (t--) {
          var close = parser.tags[t];
          if (close.name !== closeTo) {
            // fail the first time in strict mode
            strictFail(parser, 'Unexpected close tag');
          } else {
            break;
          }
        }

        // didn't find it.  we already failed for strict, so just abort.
        if (t < 0) {
          strictFail(parser, 'Unmatched closing tag: ' + parser.tagName);
          parser.textNode += '</' + parser.tagName + '>';
          parser.state = S.TEXT;
          return;
        }
        parser.tagName = tagName;
        var s = parser.tags.length;
        while (s-- > t) {
          var tag = (parser.tag = parser.tags.pop());
          parser.tagName = parser.tag.name;
          emitNode(parser, 'onclosetag', parser.tagName);

          var x = {};
          for (var i in tag.ns) {
            x[i] = tag.ns[i];
          }

          var parent = parser.tags[parser.tags.length - 1] || parser;
          if (parser.opt.xmlns && tag.ns !== parent.ns) {
            // remove namespace bindings introduced by tag
            Object.keys(tag.ns).forEach(function (p) {
              var n = tag.ns[p];
              emitNode(parser, 'onclosenamespace', { prefix: p, uri: n });
            });
          }
        }
        if (t === 0) parser.closedRoot = true;
        parser.tagName = parser.attribValue = parser.attribName = '';
        parser.attribList.length = 0;
        parser.state = S.TEXT;
      }

      function parseEntity(parser) {
        var entity = parser.entity;
        var entityLC = entity.toLowerCase();
        var num;
        var numStr = '';

        if (parser.ENTITIES[entity]) {
          return parser.ENTITIES[entity];
        }
        if (parser.ENTITIES[entityLC]) {
          return parser.ENTITIES[entityLC];
        }
        entity = entityLC;
        if (entity.charAt(0) === '#') {
          if (entity.charAt(1) === 'x') {
            entity = entity.slice(2);
            num = parseInt(entity, 16);
            numStr = num.toString(16);
          } else {
            entity = entity.slice(1);
            num = parseInt(entity, 10);
            numStr = num.toString(10);
          }
        }
        entity = entity.replace(/^0+/, '');
        if (isNaN(num) || numStr.toLowerCase() !== entity) {
          strictFail(parser, 'Invalid character entity');
          return '&' + parser.entity + ';';
        }

        return String.fromCodePoint(num);
      }

      function beginWhiteSpace(parser, c) {
        if (c === '<') {
          parser.state = S.OPEN_WAKA;
          parser.startTagPosition = parser.position;
        } else if (!isWhitespace(c)) {
          // have to process this as a text node.
          // weird, but happens.
          strictFail(parser, 'Non-whitespace before first tag.');
          parser.textNode = c;
          parser.state = S.TEXT;
        }
      }

      function charAt(chunk, i) {
        var result = '';
        if (i < chunk.length) {
          result = chunk.charAt(i);
        }
        return result;
      }

      function write(chunk) {
        var parser = this;
        if (this.error) {
          throw this.error;
        }
        if (parser.closed) {
          return error(
            parser,
            'Cannot write after close. Assign an onready handler.'
          );
        }
        if (chunk === null) {
          return end(parser);
        }
        if (typeof chunk === 'object') {
          chunk = chunk.toString();
        }
        var i = 0;
        var c = '';
        while (true) {
          c = charAt(chunk, i++);
          parser.c = c;

          if (!c) {
            break;
          }

          if (parser.trackPosition) {
            parser.position++;
            if (c === '\n') {
              parser.line++;
              parser.column = 0;
            } else {
              parser.column++;
            }
          }

          switch (parser.state) {
            case S.BEGIN:
              parser.state = S.BEGIN_WHITESPACE;
              if (c === '\uFEFF') {
                continue;
              }
              beginWhiteSpace(parser, c);
              continue;

            case S.BEGIN_WHITESPACE:
              beginWhiteSpace(parser, c);
              continue;

            case S.TEXT:
              if (parser.sawRoot && !parser.closedRoot) {
                var starti = i - 1;
                while (c && c !== '<' && c !== '&') {
                  c = charAt(chunk, i++);
                  if (c && parser.trackPosition) {
                    parser.position++;
                    if (c === '\n') {
                      parser.line++;
                      parser.column = 0;
                    } else {
                      parser.column++;
                    }
                  }
                }
                parser.textNode += chunk.substring(starti, i - 1);
              }
              if (
                c === '<' &&
                !(parser.sawRoot && parser.closedRoot && !parser.strict)
              ) {
                parser.state = S.OPEN_WAKA;
                parser.startTagPosition = parser.position;
              } else {
                if (
                  !isWhitespace(c) &&
                  (!parser.sawRoot || parser.closedRoot)
                ) {
                  strictFail(parser, 'Text data outside of root node.');
                }
                if (c === '&') {
                  parser.state = S.TEXT_ENTITY;
                } else {
                  parser.textNode += c;
                }
              }
              continue;

            case S.SCRIPT:
              // only non-strict
              if (c === '<') {
                parser.state = S.SCRIPT_ENDING;
              } else {
                parser.script += c;
              }
              continue;

            case S.SCRIPT_ENDING:
              if (c === '/') {
                parser.state = S.CLOSE_TAG;
              } else {
                parser.script += '<' + c;
                parser.state = S.SCRIPT;
              }
              continue;

            case S.OPEN_WAKA:
              // either a /, ?, !, or text is coming next.
              if (c === '!') {
                parser.state = S.SGML_DECL;
                parser.sgmlDecl = '';
              } else if (isWhitespace(c));
              else if (isMatch(nameStart, c)) {
                parser.state = S.OPEN_TAG;
                parser.tagName = c;
              } else if (c === '/') {
                parser.state = S.CLOSE_TAG;
                parser.tagName = '';
              } else if (c === '?') {
                parser.state = S.PROC_INST;
                parser.procInstName = parser.procInstBody = '';
              } else {
                strictFail(parser, 'Unencoded <');
                // if there was some whitespace, then add that in.
                if (parser.startTagPosition + 1 < parser.position) {
                  var pad = parser.position - parser.startTagPosition;
                  c = new Array(pad).join(' ') + c;
                }
                parser.textNode += '<' + c;
                parser.state = S.TEXT;
              }
              continue;

            case S.SGML_DECL:
              if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
                emitNode(parser, 'onopencdata');
                parser.state = S.CDATA;
                parser.sgmlDecl = '';
                parser.cdata = '';
              } else if (parser.sgmlDecl + c === '--') {
                parser.state = S.COMMENT;
                parser.comment = '';
                parser.sgmlDecl = '';
              } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
                parser.state = S.DOCTYPE;
                if (parser.doctype || parser.sawRoot) {
                  strictFail(
                    parser,
                    'Inappropriately located doctype declaration'
                  );
                }
                parser.doctype = '';
                parser.sgmlDecl = '';
              } else if (c === '>') {
                emitNode(parser, 'onsgmldeclaration', parser.sgmlDecl);
                parser.sgmlDecl = '';
                parser.state = S.TEXT;
              } else if (isQuote(c)) {
                parser.state = S.SGML_DECL_QUOTED;
                parser.sgmlDecl += c;
              } else {
                parser.sgmlDecl += c;
              }
              continue;

            case S.SGML_DECL_QUOTED:
              if (c === parser.q) {
                parser.state = S.SGML_DECL;
                parser.q = '';
              }
              parser.sgmlDecl += c;
              continue;

            case S.DOCTYPE:
              if (c === '>') {
                parser.state = S.TEXT;
                emitNode(parser, 'ondoctype', parser.doctype);
                parser.doctype = true; // just remember that we saw it.
              } else {
                parser.doctype += c;
                if (c === '[') {
                  parser.state = S.DOCTYPE_DTD;
                } else if (isQuote(c)) {
                  parser.state = S.DOCTYPE_QUOTED;
                  parser.q = c;
                }
              }
              continue;

            case S.DOCTYPE_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.q = '';
                parser.state = S.DOCTYPE;
              }
              continue;

            case S.DOCTYPE_DTD:
              parser.doctype += c;
              if (c === ']') {
                parser.state = S.DOCTYPE;
              } else if (isQuote(c)) {
                parser.state = S.DOCTYPE_DTD_QUOTED;
                parser.q = c;
              }
              continue;

            case S.DOCTYPE_DTD_QUOTED:
              parser.doctype += c;
              if (c === parser.q) {
                parser.state = S.DOCTYPE_DTD;
                parser.q = '';
              }
              continue;

            case S.COMMENT:
              if (c === '-') {
                parser.state = S.COMMENT_ENDING;
              } else {
                parser.comment += c;
              }
              continue;

            case S.COMMENT_ENDING:
              if (c === '-') {
                parser.state = S.COMMENT_ENDED;
                parser.comment = textopts(parser.opt, parser.comment);
                if (parser.comment) {
                  emitNode(parser, 'oncomment', parser.comment);
                }
                parser.comment = '';
              } else {
                parser.comment += '-' + c;
                parser.state = S.COMMENT;
              }
              continue;

            case S.COMMENT_ENDED:
              if (c !== '>') {
                strictFail(parser, 'Malformed comment');
                // allow <!-- blah -- bloo --> in non-strict mode,
                // which is a comment of " blah -- bloo "
                parser.comment += '--' + c;
                parser.state = S.COMMENT;
              } else {
                parser.state = S.TEXT;
              }
              continue;

            case S.CDATA:
              if (c === ']') {
                parser.state = S.CDATA_ENDING;
              } else {
                parser.cdata += c;
              }
              continue;

            case S.CDATA_ENDING:
              if (c === ']') {
                parser.state = S.CDATA_ENDING_2;
              } else {
                parser.cdata += ']' + c;
                parser.state = S.CDATA;
              }
              continue;

            case S.CDATA_ENDING_2:
              if (c === '>') {
                if (parser.cdata) {
                  emitNode(parser, 'oncdata', parser.cdata);
                }
                emitNode(parser, 'onclosecdata');
                parser.cdata = '';
                parser.state = S.TEXT;
              } else if (c === ']') {
                parser.cdata += ']';
              } else {
                parser.cdata += ']]' + c;
                parser.state = S.CDATA;
              }
              continue;

            case S.PROC_INST:
              if (c === '?') {
                parser.state = S.PROC_INST_ENDING;
              } else if (isWhitespace(c)) {
                parser.state = S.PROC_INST_BODY;
              } else {
                parser.procInstName += c;
              }
              continue;

            case S.PROC_INST_BODY:
              if (!parser.procInstBody && isWhitespace(c)) {
                continue;
              } else if (c === '?') {
                parser.state = S.PROC_INST_ENDING;
              } else {
                parser.procInstBody += c;
              }
              continue;

            case S.PROC_INST_ENDING:
              if (c === '>') {
                emitNode(parser, 'onprocessinginstruction', {
                  name: parser.procInstName,
                  body: parser.procInstBody
                });
                parser.procInstName = parser.procInstBody = '';
                parser.state = S.TEXT;
              } else {
                parser.procInstBody += '?' + c;
                parser.state = S.PROC_INST_BODY;
              }
              continue;

            case S.OPEN_TAG:
              if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else {
                newTag(parser);
                if (c === '>') {
                  openTag(parser);
                } else if (c === '/') {
                  parser.state = S.OPEN_TAG_SLASH;
                } else {
                  if (!isWhitespace(c)) {
                    strictFail(parser, 'Invalid character in tag name');
                  }
                  parser.state = S.ATTRIB;
                }
              }
              continue;

            case S.OPEN_TAG_SLASH:
              if (c === '>') {
                openTag(parser, true);
                closeTag(parser);
              } else {
                strictFail(
                  parser,
                  'Forward-slash in opening tag not followed by >'
                );
                parser.state = S.ATTRIB;
              }
              continue;

            case S.ATTRIB:
              // haven't read the attribute name yet.
              if (isWhitespace(c)) {
                continue;
              } else if (c === '>') {
                openTag(parser);
              } else if (c === '/') {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.attribValue = '';
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, 'Invalid attribute name');
              }
              continue;

            case S.ATTRIB_NAME:
              if (c === '=') {
                parser.state = S.ATTRIB_VALUE;
              } else if (c === '>') {
                strictFail(parser, 'Attribute without value');
                parser.attribValue = parser.attribName;
                attrib(parser);
                openTag(parser);
              } else if (isWhitespace(c)) {
                parser.state = S.ATTRIB_NAME_SAW_WHITE;
              } else if (isMatch(nameBody, c)) {
                parser.attribName += c;
              } else {
                strictFail(parser, 'Invalid attribute name');
              }
              continue;

            case S.ATTRIB_NAME_SAW_WHITE:
              if (c === '=') {
                parser.state = S.ATTRIB_VALUE;
              } else if (isWhitespace(c)) {
                continue;
              } else {
                strictFail(parser, 'Attribute without value');
                parser.tag.attributes[parser.attribName] = '';
                parser.attribValue = '';
                emitNode(parser, 'onattribute', {
                  name: parser.attribName,
                  value: ''
                });
                parser.attribName = '';
                if (c === '>') {
                  openTag(parser);
                } else if (isMatch(nameStart, c)) {
                  parser.attribName = c;
                  parser.state = S.ATTRIB_NAME;
                } else {
                  strictFail(parser, 'Invalid attribute name');
                  parser.state = S.ATTRIB;
                }
              }
              continue;

            case S.ATTRIB_VALUE:
              if (isWhitespace(c)) {
                continue;
              } else if (isQuote(c)) {
                parser.q = c;
                parser.state = S.ATTRIB_VALUE_QUOTED;
              } else {
                strictFail(parser, 'Unquoted attribute value');
                parser.state = S.ATTRIB_VALUE_UNQUOTED;
                parser.attribValue = c;
              }
              continue;

            case S.ATTRIB_VALUE_QUOTED:
              if (c !== parser.q) {
                if (c === '&') {
                  parser.state = S.ATTRIB_VALUE_ENTITY_Q;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              parser.q = '';
              parser.state = S.ATTRIB_VALUE_CLOSED;
              continue;

            case S.ATTRIB_VALUE_CLOSED:
              if (isWhitespace(c)) {
                parser.state = S.ATTRIB;
              } else if (c === '>') {
                openTag(parser);
              } else if (c === '/') {
                parser.state = S.OPEN_TAG_SLASH;
              } else if (isMatch(nameStart, c)) {
                strictFail(parser, 'No whitespace between attributes');
                parser.attribName = c;
                parser.attribValue = '';
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, 'Invalid attribute name');
              }
              continue;

            case S.ATTRIB_VALUE_UNQUOTED:
              if (!isAttribEnd(c)) {
                if (c === '&') {
                  parser.state = S.ATTRIB_VALUE_ENTITY_U;
                } else {
                  parser.attribValue += c;
                }
                continue;
              }
              attrib(parser);
              if (c === '>') {
                openTag(parser);
              } else {
                parser.state = S.ATTRIB;
              }
              continue;

            case S.CLOSE_TAG:
              if (!parser.tagName) {
                if (isWhitespace(c)) {
                  continue;
                } else if (notMatch(nameStart, c)) {
                  if (parser.script) {
                    parser.script += '</' + c;
                    parser.state = S.SCRIPT;
                  } else {
                    strictFail(parser, 'Invalid tagname in closing tag.');
                  }
                } else {
                  parser.tagName = c;
                }
              } else if (c === '>') {
                closeTag(parser);
              } else if (isMatch(nameBody, c)) {
                parser.tagName += c;
              } else if (parser.script) {
                parser.script += '</' + parser.tagName;
                parser.tagName = '';
                parser.state = S.SCRIPT;
              } else {
                if (!isWhitespace(c)) {
                  strictFail(parser, 'Invalid tagname in closing tag');
                }
                parser.state = S.CLOSE_TAG_SAW_WHITE;
              }
              continue;

            case S.CLOSE_TAG_SAW_WHITE:
              if (isWhitespace(c)) {
                continue;
              }
              if (c === '>') {
                closeTag(parser);
              } else {
                strictFail(parser, 'Invalid characters in closing tag');
              }
              continue;

            case S.TEXT_ENTITY:
            case S.ATTRIB_VALUE_ENTITY_Q:
            case S.ATTRIB_VALUE_ENTITY_U:
              var returnState;
              var buffer;
              switch (parser.state) {
                case S.TEXT_ENTITY:
                  returnState = S.TEXT;
                  buffer = 'textNode';
                  break;

                case S.ATTRIB_VALUE_ENTITY_Q:
                  returnState = S.ATTRIB_VALUE_QUOTED;
                  buffer = 'attribValue';
                  break;

                case S.ATTRIB_VALUE_ENTITY_U:
                  returnState = S.ATTRIB_VALUE_UNQUOTED;
                  buffer = 'attribValue';
                  break;
              }

              if (c === ';') {
                parser[buffer] += parseEntity(parser);
                parser.entity = '';
                parser.state = returnState;
              } else if (
                isMatch(parser.entity.length ? entityBody : entityStart, c)
              ) {
                parser.entity += c;
              } else {
                strictFail(parser, 'Invalid character in entity name');
                parser[buffer] += '&' + parser.entity + c;
                parser.entity = '';
                parser.state = returnState;
              }

              continue;

            default:
              throw new Error(parser, 'Unknown state: ' + parser.state);
          }
        } // while

        if (parser.position >= parser.bufferCheckPosition) {
          checkBufferLength(parser);
        }
        return parser;
      }

      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      /* istanbul ignore next */
      if (!String.fromCodePoint) {
        (function () {
          var stringFromCharCode = String.fromCharCode;
          var floor = Math.floor;
          var fromCodePoint = function () {
            var MAX_SIZE = 0x4000;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
              return '';
            }
            var result = '';
            while (++index < length) {
              var codePoint = Number(arguments[index]);
              if (
                !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
                codePoint < 0 || // not a valid Unicode code point
                codePoint > 0x10ffff || // not a valid Unicode code point
                floor(codePoint) !== codePoint // not an integer
              ) {
                throw RangeError('Invalid code point: ' + codePoint);
              }
              if (codePoint <= 0xffff) {
                // BMP code point
                codeUnits.push(codePoint);
              } else {
                // Astral code point; split in surrogate halves
                // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                codePoint -= 0x10000;
                highSurrogate = (codePoint >> 10) + 0xd800;
                lowSurrogate = (codePoint % 0x400) + 0xdc00;
                codeUnits.push(highSurrogate, lowSurrogate);
              }
              if (index + 1 === length || codeUnits.length > MAX_SIZE) {
                result += stringFromCharCode.apply(null, codeUnits);
                codeUnits.length = 0;
              }
            }
            return result;
          };
          /* istanbul ignore next */
          if (Object.defineProperty) {
            Object.defineProperty(String, 'fromCodePoint', {
              value: fromCodePoint,
              configurable: true,
              writable: true
            });
          } else {
            String.fromCodePoint = fromCodePoint;
          }
        })();
      }
    })(exports);
  });

  var arrayHelper = {
    isArray: function (value) {
      if (Array.isArray) {
        return Array.isArray(value);
      }
      // fallback for older browsers like  IE 8
      return Object.prototype.toString.call(value) === '[object Array]';
    }
  };

  var isArray$2 = arrayHelper.isArray;

  var optionsHelper = {
    copyOptions: function (options) {
      var key,
        copy = {};
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          copy[key] = options[key];
        }
      }
      return copy;
    },

    ensureFlagExists: function (item, options) {
      if (!(item in options) || typeof options[item] !== 'boolean') {
        options[item] = false;
      }
    },

    ensureSpacesExists: function (options) {
      if (
        !('spaces' in options) ||
        (typeof options.spaces !== 'number' &&
          typeof options.spaces !== 'string')
      ) {
        options.spaces = 0;
      }
    },

    ensureAlwaysArrayExists: function (options) {
      if (
        !('alwaysArray' in options) ||
        (typeof options.alwaysArray !== 'boolean' &&
          !isArray$2(options.alwaysArray))
      ) {
        options.alwaysArray = false;
      }
    },

    ensureKeyExists: function (key, options) {
      if (
        !(key + 'Key' in options) ||
        typeof options[key + 'Key'] !== 'string'
      ) {
        options[key + 'Key'] = options.compact ? '_' + key : key;
      }
    },

    checkFnExists: function (key, options) {
      return key + 'Fn' in options;
    }
  };

  var isArray$1 = arrayHelper.isArray;

  var options;
  var currentElement$1;

  function validateOptions$2(userOptions) {
    options = optionsHelper.copyOptions(userOptions);
    optionsHelper.ensureFlagExists('ignoreDeclaration', options);
    optionsHelper.ensureFlagExists('ignoreInstruction', options);
    optionsHelper.ensureFlagExists('ignoreAttributes', options);
    optionsHelper.ensureFlagExists('ignoreText', options);
    optionsHelper.ensureFlagExists('ignoreComment', options);
    optionsHelper.ensureFlagExists('ignoreCdata', options);
    optionsHelper.ensureFlagExists('ignoreDoctype', options);
    optionsHelper.ensureFlagExists('compact', options);
    optionsHelper.ensureFlagExists('alwaysChildren', options);
    optionsHelper.ensureFlagExists('addParent', options);
    optionsHelper.ensureFlagExists('trim', options);
    optionsHelper.ensureFlagExists('nativeType', options);
    optionsHelper.ensureFlagExists('nativeTypeAttributes', options);
    optionsHelper.ensureFlagExists('sanitize', options);
    optionsHelper.ensureFlagExists('instructionHasAttributes', options);
    optionsHelper.ensureFlagExists('captureSpacesBetweenElements', options);
    optionsHelper.ensureAlwaysArrayExists(options);
    optionsHelper.ensureKeyExists('declaration', options);
    optionsHelper.ensureKeyExists('instruction', options);
    optionsHelper.ensureKeyExists('attributes', options);
    optionsHelper.ensureKeyExists('text', options);
    optionsHelper.ensureKeyExists('comment', options);
    optionsHelper.ensureKeyExists('cdata', options);
    optionsHelper.ensureKeyExists('doctype', options);
    optionsHelper.ensureKeyExists('type', options);
    optionsHelper.ensureKeyExists('name', options);
    optionsHelper.ensureKeyExists('elements', options);
    optionsHelper.ensureKeyExists('parent', options);
    return options;
  }

  function nativeType(value) {
    var nValue = Number(value);
    if (!isNaN(nValue)) {
      return nValue;
    }
    var bValue = value.toLowerCase();
    if (bValue === 'true') {
      return true;
    } else if (bValue === 'false') {
      return false;
    }
    return value;
  }

  function addField(type, value) {
    var key;
    if (options.compact) {
      if (
        !currentElement$1[options[type + 'Key']] &&
        (isArray$1(options.alwaysArray)
          ? options.alwaysArray.indexOf(options[type + 'Key']) !== -1
          : options.alwaysArray)
      ) {
        currentElement$1[options[type + 'Key']] = [];
      }
      if (
        currentElement$1[options[type + 'Key']] &&
        !isArray$1(currentElement$1[options[type + 'Key']])
      ) {
        currentElement$1[options[type + 'Key']] = [
          currentElement$1[options[type + 'Key']]
        ];
      }
      if (type + 'Fn' in options && typeof value === 'string') {
        value = options[type + 'Fn'](value, currentElement$1);
      }
      if (
        type === 'instruction' &&
        ('instructionFn' in options || 'instructionNameFn' in options)
      ) {
        for (key in value) {
          if (value.hasOwnProperty(key)) {
            if ('instructionFn' in options) {
              value[key] = options.instructionFn(
                value[key],
                key,
                currentElement$1
              );
            } else {
              var temp = value[key];
              delete value[key];
              value[
                options.instructionNameFn(key, temp, currentElement$1)
              ] = temp;
            }
          }
        }
      }
      if (isArray$1(currentElement$1[options[type + 'Key']])) {
        currentElement$1[options[type + 'Key']].push(value);
      } else {
        currentElement$1[options[type + 'Key']] = value;
      }
    } else {
      if (!currentElement$1[options.elementsKey]) {
        currentElement$1[options.elementsKey] = [];
      }
      var element = {};
      element[options.typeKey] = type;
      if (type === 'instruction') {
        for (key in value) {
          if (value.hasOwnProperty(key)) {
            break;
          }
        }
        element[options.nameKey] =
          'instructionNameFn' in options
            ? options.instructionNameFn(key, value, currentElement$1)
            : key;
        if (options.instructionHasAttributes) {
          element[options.attributesKey] = value[key][options.attributesKey];
          if ('instructionFn' in options) {
            element[options.attributesKey] = options.instructionFn(
              element[options.attributesKey],
              key,
              currentElement$1
            );
          }
        } else {
          if ('instructionFn' in options) {
            value[key] = options.instructionFn(
              value[key],
              key,
              currentElement$1
            );
          }
          element[options.instructionKey] = value[key];
        }
      } else {
        if (type + 'Fn' in options) {
          value = options[type + 'Fn'](value, currentElement$1);
        }
        element[options[type + 'Key']] = value;
      }
      if (options.addParent) {
        element[options.parentKey] = currentElement$1;
      }
      currentElement$1[options.elementsKey].push(element);
    }
  }

  function manipulateAttributes(attributes) {
    if ('attributesFn' in options && attributes) {
      attributes = options.attributesFn(attributes, currentElement$1);
    }
    if (
      (options.trim ||
        'attributeValueFn' in options ||
        'attributeNameFn' in options ||
        options.nativeTypeAttributes) &&
      attributes
    ) {
      var key;
      for (key in attributes) {
        if (attributes.hasOwnProperty(key)) {
          if (options.trim) attributes[key] = attributes[key].trim();
          if (options.nativeTypeAttributes) {
            attributes[key] = nativeType(attributes[key]);
          }
          if ('attributeValueFn' in options)
            attributes[key] = options.attributeValueFn(
              attributes[key],
              key,
              currentElement$1
            );
          if ('attributeNameFn' in options) {
            var temp = attributes[key];
            delete attributes[key];
            attributes[
              options.attributeNameFn(key, attributes[key], currentElement$1)
            ] = temp;
          }
        }
      }
    }
    return attributes;
  }

  function onInstruction(instruction) {
    var attributes = {};
    if (
      instruction.body &&
      (instruction.name.toLowerCase() === 'xml' ||
        options.instructionHasAttributes)
    ) {
      var attrsRegExp = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\w+))\s*/g;
      var match;
      while ((match = attrsRegExp.exec(instruction.body)) !== null) {
        attributes[match[1]] = match[2] || match[3] || match[4];
      }
      attributes = manipulateAttributes(attributes);
    }
    if (instruction.name.toLowerCase() === 'xml') {
      if (options.ignoreDeclaration) {
        return;
      }
      currentElement$1[options.declarationKey] = {};
      if (Object.keys(attributes).length) {
        currentElement$1[options.declarationKey][
          options.attributesKey
        ] = attributes;
      }
      if (options.addParent) {
        currentElement$1[options.declarationKey][
          options.parentKey
        ] = currentElement$1;
      }
    } else {
      if (options.ignoreInstruction) {
        return;
      }
      if (options.trim) {
        instruction.body = instruction.body.trim();
      }
      var value = {};
      if (options.instructionHasAttributes && Object.keys(attributes).length) {
        value[instruction.name] = {};
        value[instruction.name][options.attributesKey] = attributes;
      } else {
        value[instruction.name] = instruction.body;
      }
      addField('instruction', value);
    }
  }

  function onStartElement(name, attributes) {
    var element;
    if (typeof name === 'object') {
      attributes = name.attributes;
      name = name.name;
    }
    attributes = manipulateAttributes(attributes);
    if ('elementNameFn' in options) {
      name = options.elementNameFn(name, currentElement$1);
    }
    if (options.compact) {
      element = {};
      if (
        !options.ignoreAttributes &&
        attributes &&
        Object.keys(attributes).length
      ) {
        element[options.attributesKey] = {};
        var key;
        for (key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            element[options.attributesKey][key] = attributes[key];
          }
        }
      }
      if (
        !(name in currentElement$1) &&
        (isArray$1(options.alwaysArray)
          ? options.alwaysArray.indexOf(name) !== -1
          : options.alwaysArray)
      ) {
        currentElement$1[name] = [];
      }
      if (currentElement$1[name] && !isArray$1(currentElement$1[name])) {
        currentElement$1[name] = [currentElement$1[name]];
      }
      if (isArray$1(currentElement$1[name])) {
        currentElement$1[name].push(element);
      } else {
        currentElement$1[name] = element;
      }
    } else {
      if (!currentElement$1[options.elementsKey]) {
        currentElement$1[options.elementsKey] = [];
      }
      element = {};
      element[options.typeKey] = 'element';
      element[options.nameKey] = name;
      if (
        !options.ignoreAttributes &&
        attributes &&
        Object.keys(attributes).length
      ) {
        element[options.attributesKey] = attributes;
      }
      if (options.alwaysChildren) {
        element[options.elementsKey] = [];
      }
      currentElement$1[options.elementsKey].push(element);
    }
    element[options.parentKey] = currentElement$1; // will be deleted in onEndElement() if !options.addParent
    currentElement$1 = element;
  }

  function onText(text) {
    if (options.ignoreText) {
      return;
    }
    if (!text.trim() && !options.captureSpacesBetweenElements) {
      return;
    }
    if (options.trim) {
      text = text.trim();
    }
    if (options.nativeType) {
      text = nativeType(text);
    }
    if (options.sanitize) {
      text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
    addField('text', text);
  }

  function onComment(comment) {
    if (options.ignoreComment) {
      return;
    }
    if (options.trim) {
      comment = comment.trim();
    }
    addField('comment', comment);
  }

  function onEndElement(name) {
    var parentElement = currentElement$1[options.parentKey];
    if (!options.addParent) {
      delete currentElement$1[options.parentKey];
    }
    currentElement$1 = parentElement;
  }

  function onCdata(cdata) {
    if (options.ignoreCdata) {
      return;
    }
    if (options.trim) {
      cdata = cdata.trim();
    }
    addField('cdata', cdata);
  }

  function onDoctype(doctype) {
    if (options.ignoreDoctype) {
      return;
    }
    doctype = doctype.replace(/^ /, '');
    if (options.trim) {
      doctype = doctype.trim();
    }
    addField('doctype', doctype);
  }

  function onError(error) {
    error.note = error; //console.error(error);
  }

  var xml2js = function (xml, userOptions) {
    var parser = sax.parser(true, {});
    var result = {};
    currentElement$1 = result;

    options = validateOptions$2(userOptions);

    {
      parser.opt = { strictEntities: true };
      parser.onopentag = onStartElement;
      parser.ontext = onText;
      parser.oncomment = onComment;
      parser.onclosetag = onEndElement;
      parser.onerror = onError;
      parser.oncdata = onCdata;
      parser.ondoctype = onDoctype;
      parser.onprocessinginstruction = onInstruction;
    }

    {
      parser.write(xml).close();
    }

    if (result[options.elementsKey]) {
      var temp = result[options.elementsKey];
      delete result[options.elementsKey];
      result[options.elementsKey] = temp;
      delete result.text;
    }

    return result;
  };

  function validateOptions$1(userOptions) {
    var options = optionsHelper.copyOptions(userOptions);
    optionsHelper.ensureSpacesExists(options);
    return options;
  }

  var xml2json = function (xml, userOptions) {
    var options, js, json, parentKey;
    options = validateOptions$1(userOptions);
    js = xml2js(xml, options);
    parentKey = 'compact' in options && options.compact ? '_parent' : 'parent';
    // parentKey = ptions.compact ? '_parent' : 'parent'; // consider this
    if ('addParent' in options && options.addParent) {
      json = JSON.stringify(
        js,
        function (k, v) {
          return k === parentKey ? '_' : v;
        },
        options.spaces
      );
    } else {
      json = JSON.stringify(js, null, options.spaces);
    }
    return json.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  };

  var isArray = arrayHelper.isArray;

  var currentElement, currentElementName;

  function validateOptions(userOptions) {
    var options = optionsHelper.copyOptions(userOptions);
    optionsHelper.ensureFlagExists('ignoreDeclaration', options);
    optionsHelper.ensureFlagExists('ignoreInstruction', options);
    optionsHelper.ensureFlagExists('ignoreAttributes', options);
    optionsHelper.ensureFlagExists('ignoreText', options);
    optionsHelper.ensureFlagExists('ignoreComment', options);
    optionsHelper.ensureFlagExists('ignoreCdata', options);
    optionsHelper.ensureFlagExists('ignoreDoctype', options);
    optionsHelper.ensureFlagExists('compact', options);
    optionsHelper.ensureFlagExists('indentText', options);
    optionsHelper.ensureFlagExists('indentCdata', options);
    optionsHelper.ensureFlagExists('indentAttributes', options);
    optionsHelper.ensureFlagExists('indentInstruction', options);
    optionsHelper.ensureFlagExists('fullTagEmptyElement', options);
    optionsHelper.ensureFlagExists('noQuotesForNativeAttributes', options);
    optionsHelper.ensureSpacesExists(options);
    if (typeof options.spaces === 'number') {
      options.spaces = Array(options.spaces + 1).join(' ');
    }
    optionsHelper.ensureKeyExists('declaration', options);
    optionsHelper.ensureKeyExists('instruction', options);
    optionsHelper.ensureKeyExists('attributes', options);
    optionsHelper.ensureKeyExists('text', options);
    optionsHelper.ensureKeyExists('comment', options);
    optionsHelper.ensureKeyExists('cdata', options);
    optionsHelper.ensureKeyExists('doctype', options);
    optionsHelper.ensureKeyExists('type', options);
    optionsHelper.ensureKeyExists('name', options);
    optionsHelper.ensureKeyExists('elements', options);
    return options;
  }

  function writeIndentation(options, depth, firstLine) {
    return (
      (!firstLine && options.spaces ? '\n' : '') +
      Array(depth + 1).join(options.spaces)
    );
  }

  function writeAttributes(attributes, options, depth) {
    if (options.ignoreAttributes) {
      return '';
    }
    if ('attributesFn' in options) {
      attributes = options.attributesFn(
        attributes,
        currentElementName,
        currentElement
      );
    }
    var key,
      attr,
      attrName,
      quote,
      result = [];
    for (key in attributes) {
      if (
        attributes.hasOwnProperty(key) &&
        attributes[key] !== null &&
        attributes[key] !== undefined
      ) {
        quote =
          options.noQuotesForNativeAttributes &&
          typeof attributes[key] !== 'string'
            ? ''
            : '"';
        attr = '' + attributes[key]; // ensure number and boolean are converted to String
        attr = attr.replace(/"/g, '&quot;');
        attrName =
          'attributeNameFn' in options
            ? options.attributeNameFn(
                key,
                attr,
                currentElementName,
                currentElement
              )
            : key;
        result.push(
          options.spaces && options.indentAttributes
            ? writeIndentation(options, depth + 1, false)
            : ' '
        );
        result.push(
          attrName +
            '=' +
            quote +
            ('attributeValueFn' in options
              ? options.attributeValueFn(
                  attr,
                  key,
                  currentElementName,
                  currentElement
                )
              : attr) +
            quote
        );
      }
    }
    if (
      attributes &&
      Object.keys(attributes).length &&
      options.spaces &&
      options.indentAttributes
    ) {
      result.push(writeIndentation(options, depth, false));
    }
    return result.join('');
  }

  function writeDeclaration(declaration, options, depth) {
    currentElement = declaration;
    currentElementName = 'xml';
    return options.ignoreDeclaration
      ? ''
      : '<?' +
          'xml' +
          writeAttributes(declaration[options.attributesKey], options, depth) +
          '?>';
  }

  function writeInstruction(instruction, options, depth) {
    if (options.ignoreInstruction) {
      return '';
    }
    var key;
    for (key in instruction) {
      if (instruction.hasOwnProperty(key)) {
        break;
      }
    }
    var instructionName =
      'instructionNameFn' in options
        ? options.instructionNameFn(
            key,
            instruction[key],
            currentElementName,
            currentElement
          )
        : key;
    if (typeof instruction[key] === 'object') {
      currentElement = instruction;
      currentElementName = instructionName;
      return (
        '<?' +
        instructionName +
        writeAttributes(
          instruction[key][options.attributesKey],
          options,
          depth
        ) +
        '?>'
      );
    } else {
      var instructionValue = instruction[key] ? instruction[key] : '';
      if ('instructionFn' in options)
        instructionValue = options.instructionFn(
          instructionValue,
          key,
          currentElementName,
          currentElement
        );
      return (
        '<?' +
        instructionName +
        (instructionValue ? ' ' + instructionValue : '') +
        '?>'
      );
    }
  }

  function writeComment(comment, options) {
    return options.ignoreComment
      ? ''
      : '<!--' +
          ('commentFn' in options
            ? options.commentFn(comment, currentElementName, currentElement)
            : comment) +
          '-->';
  }

  function writeCdata(cdata, options) {
    return options.ignoreCdata
      ? ''
      : '<![CDATA[' +
          ('cdataFn' in options
            ? options.cdataFn(cdata, currentElementName, currentElement)
            : cdata.replace(']]>', ']]]]><![CDATA[>')) +
          ']]>';
  }

  function writeDoctype(doctype, options) {
    return options.ignoreDoctype
      ? ''
      : '<!DOCTYPE ' +
          ('doctypeFn' in options
            ? options.doctypeFn(doctype, currentElementName, currentElement)
            : doctype) +
          '>';
  }

  function writeText(text, options) {
    if (options.ignoreText) return '';
    text = '' + text; // ensure Number and Boolean are converted to String
    text = text.replace(/&amp;/g, '&'); // desanitize to avoid double sanitization
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return 'textFn' in options
      ? options.textFn(text, currentElementName, currentElement)
      : text;
  }

  function hasContent(element, options) {
    var i;
    if (element.elements && element.elements.length) {
      for (i = 0; i < element.elements.length; ++i) {
        switch (element.elements[i][options.typeKey]) {
          case 'text':
            if (options.indentText) {
              return true;
            }
            break; // skip to next key
          case 'cdata':
            if (options.indentCdata) {
              return true;
            }
            break; // skip to next key
          case 'instruction':
            if (options.indentInstruction) {
              return true;
            }
            break; // skip to next key
          case 'doctype':
          case 'comment':
          case 'element':
            return true;
          default:
            return true;
        }
      }
    }
    return false;
  }

  function writeElement(element, options, depth) {
    currentElement = element;
    currentElementName = element.name;
    var xml = [],
      elementName =
        'elementNameFn' in options
          ? options.elementNameFn(element.name, element)
          : element.name;
    xml.push('<' + elementName);
    if (element[options.attributesKey]) {
      xml.push(writeAttributes(element[options.attributesKey], options, depth));
    }
    var withClosingTag =
      (element[options.elementsKey] && element[options.elementsKey].length) ||
      (element[options.attributesKey] &&
        element[options.attributesKey]['xml:space'] === 'preserve');
    if (!withClosingTag) {
      if ('fullTagEmptyElementFn' in options) {
        withClosingTag = options.fullTagEmptyElementFn(element.name, element);
      } else {
        withClosingTag = options.fullTagEmptyElement;
      }
    }
    if (withClosingTag) {
      xml.push('>');
      if (element[options.elementsKey] && element[options.elementsKey].length) {
        xml.push(
          writeElements(element[options.elementsKey], options, depth + 1)
        );
        currentElement = element;
        currentElementName = element.name;
      }
      xml.push(
        options.spaces && hasContent(element, options)
          ? '\n' + Array(depth + 1).join(options.spaces)
          : ''
      );
      xml.push('</' + elementName + '>');
    } else {
      xml.push('/>');
    }
    return xml.join('');
  }

  function writeElements(elements, options, depth, firstLine) {
    return elements.reduce(function (xml, element) {
      var indent = writeIndentation(options, depth, firstLine && !xml);
      switch (element.type) {
        case 'element':
          return xml + indent + writeElement(element, options, depth);
        case 'comment':
          return (
            xml + indent + writeComment(element[options.commentKey], options)
          );
        case 'doctype':
          return (
            xml + indent + writeDoctype(element[options.doctypeKey], options)
          );
        case 'cdata':
          return (
            xml +
            (options.indentCdata ? indent : '') +
            writeCdata(element[options.cdataKey], options)
          );
        case 'text':
          return (
            xml +
            (options.indentText ? indent : '') +
            writeText(element[options.textKey], options)
          );
        case 'instruction':
          var instruction = {};
          instruction[element[options.nameKey]] = element[options.attributesKey]
            ? element
            : element[options.instructionKey];
          return (
            xml +
            (options.indentInstruction ? indent : '') +
            writeInstruction(instruction, options, depth)
          );
      }
    }, '');
  }

  function hasContentCompact(element, options, anyContent) {
    var key;
    for (key in element) {
      if (element.hasOwnProperty(key)) {
        switch (key) {
          case options.parentKey:
          case options.attributesKey:
            break; // skip to next key
          case options.textKey:
            if (options.indentText || anyContent) {
              return true;
            }
            break; // skip to next key
          case options.cdataKey:
            if (options.indentCdata || anyContent) {
              return true;
            }
            break; // skip to next key
          case options.instructionKey:
            if (options.indentInstruction || anyContent) {
              return true;
            }
            break; // skip to next key
          case options.doctypeKey:
          case options.commentKey:
            return true;
          default:
            return true;
        }
      }
    }
    return false;
  }

  function writeElementCompact(element, name, options, depth, indent) {
    currentElement = element;
    currentElementName = name;
    var elementName =
      'elementNameFn' in options ? options.elementNameFn(name, element) : name;
    if (typeof element === 'undefined' || element === null || element === '') {
      return ('fullTagEmptyElementFn' in options &&
        options.fullTagEmptyElementFn(name, element)) ||
        options.fullTagEmptyElement
        ? '<' + elementName + '></' + elementName + '>'
        : '<' + elementName + '/>';
    }
    var xml = [];
    if (name) {
      xml.push('<' + elementName);
      if (typeof element !== 'object') {
        xml.push('>' + writeText(element, options) + '</' + elementName + '>');
        return xml.join('');
      }
      if (element[options.attributesKey]) {
        xml.push(
          writeAttributes(element[options.attributesKey], options, depth)
        );
      }
      var withClosingTag =
        hasContentCompact(element, options, true) ||
        (element[options.attributesKey] &&
          element[options.attributesKey]['xml:space'] === 'preserve');
      if (!withClosingTag) {
        if ('fullTagEmptyElementFn' in options) {
          withClosingTag = options.fullTagEmptyElementFn(name, element);
        } else {
          withClosingTag = options.fullTagEmptyElement;
        }
      }
      if (withClosingTag) {
        xml.push('>');
      } else {
        xml.push('/>');
        return xml.join('');
      }
    }
    xml.push(writeElementsCompact(element, options, depth + 1, false));
    currentElement = element;
    currentElementName = name;
    if (name) {
      xml.push(
        (indent ? writeIndentation(options, depth, false) : '') +
          '</' +
          elementName +
          '>'
      );
    }
    return xml.join('');
  }

  function writeElementsCompact(element, options, depth, firstLine) {
    var i,
      key,
      nodes,
      xml = [];
    for (key in element) {
      if (element.hasOwnProperty(key)) {
        nodes = isArray(element[key]) ? element[key] : [element[key]];
        for (i = 0; i < nodes.length; ++i) {
          switch (key) {
            case options.declarationKey:
              xml.push(writeDeclaration(nodes[i], options, depth));
              break;
            case options.instructionKey:
              xml.push(
                (options.indentInstruction
                  ? writeIndentation(options, depth, firstLine)
                  : '') + writeInstruction(nodes[i], options, depth)
              );
              break;
            case options.attributesKey:
            case options.parentKey:
              break; // skip
            case options.textKey:
              xml.push(
                (options.indentText
                  ? writeIndentation(options, depth, firstLine)
                  : '') + writeText(nodes[i], options)
              );
              break;
            case options.cdataKey:
              xml.push(
                (options.indentCdata
                  ? writeIndentation(options, depth, firstLine)
                  : '') + writeCdata(nodes[i], options)
              );
              break;
            case options.doctypeKey:
              xml.push(
                writeIndentation(options, depth, firstLine) +
                  writeDoctype(nodes[i], options)
              );
              break;
            case options.commentKey:
              xml.push(
                writeIndentation(options, depth, firstLine) +
                  writeComment(nodes[i], options)
              );
              break;
            default:
              xml.push(
                writeIndentation(options, depth, firstLine) +
                  writeElementCompact(
                    nodes[i],
                    key,
                    options,
                    depth,
                    hasContentCompact(nodes[i], options)
                  )
              );
          }
          firstLine = firstLine && !xml.length;
        }
      }
    }
    return xml.join('');
  }

  var js2xml = function (js, options) {
    options = validateOptions(options);
    var xml = [];
    currentElement = js;
    currentElementName = '_root_';
    if (options.compact) {
      xml.push(writeElementsCompact(js, options, 0, true));
    } else {
      if (js[options.declarationKey]) {
        xml.push(writeDeclaration(js[options.declarationKey], options, 0));
      }
      if (js[options.elementsKey] && js[options.elementsKey].length) {
        xml.push(
          writeElements(js[options.elementsKey], options, 0, !xml.length)
        );
      }
    }
    return xml.join('');
  };

  var json2xml = function (json, options) {
    if (json instanceof Buffer) {
      json = json.toString();
    }
    var js = null;
    if (typeof json === 'string') {
      try {
        js = JSON.parse(json);
      } catch (e) {
        throw new Error('The JSON structure is invalid');
      }
    } else {
      js = json;
    }
    return js2xml(js, options);
  };

  /*jslint node:true */

  var lib$1 = {
    xml2js: xml2js,
    xml2json: xml2json,
    js2xml: js2xml,
    json2xml: json2xml
  };

  var xliff = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.stringify = exports.parse = void 0;

    function parse(src, options) {
      const opt = Object.assign({ ignoreComment: true }, options, {
        cdataKey: 'text',
        compact: false
      });
      const doc = lib$1.xml2js(src, opt);
      if (
        !doc.elements ||
        doc.elements.length !== 1 ||
        doc.elements[0].name !== 'xliff'
      )
        throw new Error('Could not find <xliff> element in XML');
      return doc;
    }
    exports.parse = parse;
    function stringify(xliff, options) {
      const doc = xliff.name === 'xliff' ? { elements: [xliff] } : xliff;
      const opt = Object.assign({ spaces: 2 }, options, { compact: false });
      return lib$1.js2xml(doc, opt);
    }
    exports.stringify = stringify;
  });

  var xliff2mf_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.xliff2mf = void 0;

    function xliff2mf(xliff$1) {
      if (typeof xliff$1 === 'string') xliff$1 = xliff.parse(xliff$1);
      if (xliff$1.name !== 'xliff') xliff$1 = xliff$1.elements[0];
      const xAttr = xliff$1.attributes;
      return xliff$1.elements.map(file => {
        const fr = resolveFile(file, xAttr);
        return xAttr.trgLang ? fr : { source: fr.source };
      });
    }
    exports.xliff2mf = xliff2mf;
    function resolveFile(file, { srcLang, trgLang }) {
      checkResegment(file);
      const { id } = file.attributes;
      const source = {
        type: 'resource',
        id,
        locale: srcLang,
        entries: {}
      };
      const target = {
        type: 'resource',
        id,
        locale: trgLang || '',
        entries: {}
      };
      for (const el of file.elements) {
        resolveEntry(el, source, target);
      }
      return { source, target };
    }
    const prettyElement = (name, id) =>
      id ? `<${name} id=${JSON.stringify(id)}>` : `<${name}>`;
    function checkResegment({ attributes, name }) {
      if (
        (attributes === null || attributes === void 0
          ? void 0
          : attributes.canResegment) === 'no'
      ) {
        const el = prettyElement(name, attributes.id);
        throw new Error(
          `xliff2mf conversion requires re-segmenting messages, but canResegment="no" is set for ${el}`
        );
      }
    }
    function resolveEntry(entry, source, target) {
      switch (entry.name) {
        case 'group': {
          checkResegment(entry);
          const key = entry.attributes.name || entry.attributes.id;
          if (entry.elements) {
            if (entry.attributes['mf:select']) {
              source.entries[key] = resolveSelect(entry, 'source');
              target.entries[key] = resolveSelect(entry, 'target');
            } else {
              const sg = { type: 'group', entries: {} };
              const tg = { type: 'group', entries: {} };
              source.entries[key] = sg;
              target.entries[key] = tg;
              for (const el of entry.elements) resolveEntry(el, sg, tg);
            }
          }
          return;
        }
        case 'unit': {
          checkResegment(entry);
          const key = entry.attributes.name || entry.attributes.id;
          source.entries[key] = {
            type: 'message',
            value: resolveUnit(entry, 'source')
          };
          target.entries[key] = {
            type: 'message',
            value: resolveUnit(entry, 'target')
          };
          return;
        }
        case 'mf:messageformat':
          throw new Error(
            `Unexpected <mf:messageformat> in <group> without mf:select attribute`
          );
      }
    }
    const idList = src => (src ? src.trim().split(/\s+/) : []);
    function resolveSelect({ attributes, elements }, st) {
      if (!elements || elements.length === 0)
        throw new Error(
          `Select ${prettyElement('group', attributes.id)} cannot be empty`
        );
      let mf = null;
      const cases = [];
      for (const el of elements) {
        switch (el.name) {
          case 'mf:messageformat':
            mf = el;
            break;
          case 'unit': {
            const { id, name } = el.attributes;
            if (!name) {
              const pu = prettyElement('unit', id);
              throw new Error(`The name attribute is required for ${pu}`);
            }
            cases.push({ key: idList(name), value: resolveUnit(el, st) });
            break;
          }
          case 'group': {
            const pg = prettyElement('group', el.attributes.id);
            const ps = prettyElement('group mf:select', attributes.id);
            throw new Error(`Unexpected ${pg} in ${ps}`);
          }
        }
      }
      if (!mf) {
        const el = prettyElement('group', attributes.id);
        throw new Error(`<mf:messageformat> not found in ${el}`);
      }
      const select = idList(attributes['mf:select']).map(selId => {
        var _a;
        const part =
          mf === null || mf === void 0
            ? void 0
            : mf.elements.find(part => {
                var _a;
                return (
                  ((_a = part.attributes) === null || _a === void 0
                    ? void 0
                    : _a.id) === selId
                );
              });
        if (!part) {
          const el = prettyElement('group', attributes.id);
          throw new Error(`Selector ${selId} not found in ${el}`);
        }
        const def =
          (_a = part.attributes) === null || _a === void 0
            ? void 0
            : _a.default;
        const value = resolvePart(part);
        return def ? { value, default: String(def) } : { value };
      });
      return { type: 'select', select, cases };
    }
    function resolveUnit({ attributes, elements }, st) {
      if (!elements) return [];
      let mf = null;
      let pattern = [];
      for (const el of elements) {
        switch (el.name) {
          case 'mf:messageformat':
            mf = el;
            break;
          case 'segment':
          case 'ignorable': {
            const stel = el.elements[st === 'source' ? 0 : 1];
            if ((stel && stel.name !== st) || (!stel && st === 'source')) {
              const pe = prettyElement('unit', attributes.id);
              throw new Error(
                `Expected to find a <${st}> inside <${el.name}> of ${pe}`
              );
            }
            if (stel)
              pattern = pattern.concat(resolveContents(stel.elements, mf));
            break;
          }
        }
      }
      return pattern;
    }
    function resolveContents(contents, mf) {
      const res = [];
      for (const ie of contents) {
        const last = res[res.length - 1];
        const part = resolveInlineElement(ie, mf);
        if (
          lib$2.isLiteral(last) &&
          lib$2.isLiteral(part) &&
          !lib$2.hasMeta(last) &&
          !lib$2.hasMeta(part)
        )
          last.value += part;
        else res.push(part);
      }
      return res;
    }
    const resolveCharCode = cc =>
      String.fromCodePoint(Number(cc.attributes.hex));
    function resolveInlineElement(ie, mf) {
      var _a;
      switch (ie.type) {
        case 'text':
        case 'cdata':
          return { type: 'literal', value: ie.text };
        case 'element':
          switch (ie.name) {
            case 'cp':
              return { type: 'literal', value: resolveCharCode(ie) };
            case 'ph':
              return resolveRef(ie.name, ie.attributes['mf:ref'], mf);
            case 'pc': {
              const part = resolveRef(ie.name, ie.attributes['mf:ref'], mf);
              if (!lib$2.isFunction(part))
                throw new Error(
                  `<pc mf:ref> is only valid for function values`
                );
              const arg = resolveContents(ie.elements, mf);
              if (arg.length > 1)
                throw new Error(
                  'Forming function arguments by concatenation is not supported'
                );
              if (lib$2.isFunction(arg[0]) || lib$2.isTerm(arg[0]))
                throw new Error(`A ${arg[0].type} is not supported here`);
              part.args.unshift(
                (_a = arg[0]) !== null && _a !== void 0 ? _a : ''
              );
              return part;
            }
            // TODO
          }
      }
      throw new Error(`Unsupported inline ${ie.type} <${ie.name}>`);
    }
    function resolveRef(name, ref, mf) {
      if (!ref)
        throw new Error(`Unsupported <${name}> without mf:ref attribute`);
      if (!mf)
        throw new Error(
          `Inline <${name}> requires a preceding <mf:messageformat> in the same <unit>`
        );
      const res = mf.elements.find(el => {
        var _a;
        return (
          ((_a = el.attributes) === null || _a === void 0 ? void 0 : _a.id) ===
          ref
        );
      });
      if (!res)
        throw new Error(
          `MessageFormat value not found for <${name} mf:ref="${ref}">`
        );
      return resolvePart(res);
    }
    const resolveText = text =>
      text
        .map(t => (t.type === 'element' ? resolveCharCode(t) : t.text))
        .join('');
    function resolvePart(part) {
      switch (part.name) {
        case 'mf:literal':
        case 'mf:variable':
          return resolveArgument(part);
        case 'mf:function': {
          const fn = {
            type: 'function',
            func: part.attributes.name,
            args: []
          };
          const options = {};
          let hasOptions = false;
          for (const el of part.elements) {
            if (el.name === 'mf:option') {
              options[el.attributes.name] = resolveOption(el);
              hasOptions = true;
            } else fn.args.push(resolveArgument(el));
          }
          if (hasOptions) fn.options = options;
          return fn;
        }
        case 'mf:message': {
          const mt = { type: 'term', msg_path: [] };
          const scope = {};
          let hasScope = false;
          for (const el of part.elements) {
            if (el.name === 'mf:scope') {
              scope[el.attributes.name] = resolveOption(el);
              hasScope = true;
            } else mt.msg_path.push(resolveArgument(el));
          }
          if (hasScope) mt.scope = scope;
          return mt;
        }
      }
      /* istanbul ignore next - never happens */
      throw new Error(`Unsupported part ${part.type} <${part.name}>`);
    }
    function resolveArgument(part) {
      switch (part.name) {
        case 'mf:literal':
          return { type: 'literal', value: resolveText(part.elements) };
        case 'mf:variable':
          return {
            type: 'variable',
            var_path: part.elements.map(resolveArgument)
          };
      }
      /* istanbul ignore next - never happens */
      throw new Error(`Unsupported argument ${part.type} <${part.name}>`);
    }
    function resolveOption(el) {
      const sv = el.elements.map(resolveArgument);
      switch (sv.length) {
        case 0:
          return { type: 'literal', value: '' };
        case 1:
          return sv[0];
        default:
          throw new Error('Options may only have one value');
      }
    }
  });

  /**
   * XLIFF 2.1 types for TypeScript
   *
   * Includes types for the core spec as well as the following modules:
   *   - Translation Candidates (mtc)
   *   - Glossary (gls)
   *   - Format Style (fs)
   *   - Metadata (mda)
   *   - Resource Data (res)
   *   - Size and Length Restriction (slr)
   *   - Validation (val)
   *
   * For custom extensions, use the `FileOther`, `GroupOther` and `UnitOther`
   * generics to define available elements for the corresponding parent element.
   *
   * http://docs.oasis-open.org/xliff/xliff-core/v2.1/os/xliff-core-v2.1-os.html
   *
   * @module
   */
  //Object.defineProperty(exports, "__esModule", { value: true });

  var xliffSpec = /*#__PURE__*/ Object.freeze({
    __proto__: null
  });

  var require$$0 = /*@__PURE__*/ getAugmentedNamespace(xliffSpec);

  var lib = createCommonjsModule(function (module, exports) {
    var __createBinding =
      (commonjsGlobal && commonjsGlobal.__createBinding) ||
      (Object.create
        ? function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            Object.defineProperty(o, k2, {
              enumerable: true,
              get: function () {
                return m[k];
              }
            });
          }
        : function (o, m, k, k2) {
            if (k2 === undefined) k2 = k;
            o[k2] = m[k];
          });
    var __exportStar =
      (commonjsGlobal && commonjsGlobal.__exportStar) ||
      function (m, exports) {
        for (var p in m)
          if (
            p !== 'default' &&
            !Object.prototype.hasOwnProperty.call(exports, p)
          )
            __createBinding(exports, m, p);
      };
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.xliff2mf = exports.stringify = exports.parse = exports.mf2xliff = void 0;

    Object.defineProperty(exports, 'mf2xliff', {
      enumerable: true,
      get: function () {
        return mf2xliff_1.mf2xliff;
      }
    });

    Object.defineProperty(exports, 'parse', {
      enumerable: true,
      get: function () {
        return xliff.parse;
      }
    });
    Object.defineProperty(exports, 'stringify', {
      enumerable: true,
      get: function () {
        return xliff.stringify;
      }
    });

    Object.defineProperty(exports, 'xliff2mf', {
      enumerable: true,
      get: function () {
        return xliff2mf_1.xliff2mf;
      }
    });
    __exportStar(require$$0, exports);
  });

  var index = /*@__PURE__*/ getDefaultExportFromCjs(lib);

  return index;
});
