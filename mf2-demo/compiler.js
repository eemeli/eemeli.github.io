(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Compiler = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
		if (n.__esModule) return n;
		var a = Object.defineProperty({}, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	/*
	 * Base class for all Fluent AST nodes.
	 *
	 * All productions described in the ASDL subclass BaseNode, including Span and
	 * Annotation.
	 *
	 */
	class BaseNode {
	    equals(other, ignoredFields = ["span"]) {
	        const thisKeys = new Set(Object.keys(this));
	        const otherKeys = new Set(Object.keys(other));
	        if (ignoredFields) {
	            for (const fieldName of ignoredFields) {
	                thisKeys.delete(fieldName);
	                otherKeys.delete(fieldName);
	            }
	        }
	        if (thisKeys.size !== otherKeys.size) {
	            return false;
	        }
	        for (const fieldName of thisKeys) {
	            if (!otherKeys.has(fieldName)) {
	                return false;
	            }
	            const thisVal = this[fieldName];
	            const otherVal = other[fieldName];
	            if (typeof thisVal !== typeof otherVal) {
	                return false;
	            }
	            if (thisVal instanceof Array && otherVal instanceof Array) {
	                if (thisVal.length !== otherVal.length) {
	                    return false;
	                }
	                for (let i = 0; i < thisVal.length; ++i) {
	                    if (!scalarsEqual(thisVal[i], otherVal[i], ignoredFields)) {
	                        return false;
	                    }
	                }
	            }
	            else if (!scalarsEqual(thisVal, otherVal, ignoredFields)) {
	                return false;
	            }
	        }
	        return true;
	    }
	    clone() {
	        function visit(value) {
	            if (value instanceof BaseNode) {
	                return value.clone();
	            }
	            if (Array.isArray(value)) {
	                return value.map(visit);
	            }
	            return value;
	        }
	        const clone = Object.create(this.constructor.prototype);
	        for (const prop of Object.keys(this)) {
	            clone[prop] = visit(this[prop]);
	        }
	        return clone;
	    }
	}
	function scalarsEqual(thisVal, otherVal, ignoredFields) {
	    if (thisVal instanceof BaseNode && otherVal instanceof BaseNode) {
	        return thisVal.equals(otherVal, ignoredFields);
	    }
	    return thisVal === otherVal;
	}
	/*
	 * Base class for AST nodes which can have Spans.
	 */
	class SyntaxNode extends BaseNode {
	    addSpan(start, end) {
	        this.span = new Span(start, end);
	    }
	}
	class Resource extends SyntaxNode {
	    constructor(body = []) {
	        super();
	        this.type = "Resource";
	        this.body = body;
	    }
	}
	class Message extends SyntaxNode {
	    constructor(id, value = null, attributes = [], comment = null) {
	        super();
	        this.type = "Message";
	        this.id = id;
	        this.value = value;
	        this.attributes = attributes;
	        this.comment = comment;
	    }
	}
	class Term extends SyntaxNode {
	    constructor(id, value, attributes = [], comment = null) {
	        super();
	        this.type = "Term";
	        this.id = id;
	        this.value = value;
	        this.attributes = attributes;
	        this.comment = comment;
	    }
	}
	class Pattern extends SyntaxNode {
	    constructor(elements) {
	        super();
	        this.type = "Pattern";
	        this.elements = elements;
	    }
	}
	class TextElement extends SyntaxNode {
	    constructor(value) {
	        super();
	        this.type = "TextElement";
	        this.value = value;
	    }
	}
	class Placeable extends SyntaxNode {
	    constructor(expression) {
	        super();
	        this.type = "Placeable";
	        this.expression = expression;
	    }
	}
	// An abstract base class for Literals.
	class BaseLiteral extends SyntaxNode {
	    constructor(value) {
	        super();
	        // The "value" field contains the exact contents of the literal,
	        // character-for-character.
	        this.value = value;
	    }
	}
	class StringLiteral extends BaseLiteral {
	    constructor() {
	        super(...arguments);
	        this.type = "StringLiteral";
	    }
	    parse() {
	        // Backslash backslash, backslash double quote, uHHHH, UHHHHHH.
	        const KNOWN_ESCAPES = /(?:\\\\|\\"|\\u([0-9a-fA-F]{4})|\\U([0-9a-fA-F]{6}))/g;
	        function fromEscapeSequence(match, codepoint4, codepoint6) {
	            switch (match) {
	                case "\\\\":
	                    return "\\";
	                case "\\\"":
	                    return "\"";
	                default: {
	                    let codepoint = parseInt(codepoint4 || codepoint6, 16);
	                    if (codepoint <= 0xD7FF || 0xE000 <= codepoint) {
	                        // It's a Unicode scalar value.
	                        return String.fromCodePoint(codepoint);
	                    }
	                    // Escape sequences reresenting surrogate code points are
	                    // well-formed but invalid in Fluent. Replace them with U+FFFD
	                    // REPLACEMENT CHARACTER.
	                    return "�";
	                }
	            }
	        }
	        let value = this.value.replace(KNOWN_ESCAPES, fromEscapeSequence);
	        return { value };
	    }
	}
	class NumberLiteral extends BaseLiteral {
	    constructor() {
	        super(...arguments);
	        this.type = "NumberLiteral";
	    }
	    parse() {
	        let value = parseFloat(this.value);
	        let decimalPos = this.value.indexOf(".");
	        let precision = decimalPos > 0
	            ? this.value.length - decimalPos - 1
	            : 0;
	        return { value, precision };
	    }
	}
	class MessageReference extends SyntaxNode {
	    constructor(id, attribute = null) {
	        super();
	        this.type = "MessageReference";
	        this.id = id;
	        this.attribute = attribute;
	    }
	}
	class TermReference extends SyntaxNode {
	    constructor(id, attribute = null, args = null) {
	        super();
	        this.type = "TermReference";
	        this.id = id;
	        this.attribute = attribute;
	        this.arguments = args;
	    }
	}
	class VariableReference extends SyntaxNode {
	    constructor(id) {
	        super();
	        this.type = "VariableReference";
	        this.id = id;
	    }
	}
	class FunctionReference extends SyntaxNode {
	    constructor(id, args) {
	        super();
	        this.type = "FunctionReference";
	        this.id = id;
	        this.arguments = args;
	    }
	}
	class SelectExpression extends SyntaxNode {
	    constructor(selector, variants) {
	        super();
	        this.type = "SelectExpression";
	        this.selector = selector;
	        this.variants = variants;
	    }
	}
	class CallArguments extends SyntaxNode {
	    constructor(positional = [], named = []) {
	        super();
	        this.type = "CallArguments";
	        this.positional = positional;
	        this.named = named;
	    }
	}
	class Attribute extends SyntaxNode {
	    constructor(id, value) {
	        super();
	        this.type = "Attribute";
	        this.id = id;
	        this.value = value;
	    }
	}
	class Variant extends SyntaxNode {
	    constructor(key, value, def) {
	        super();
	        this.type = "Variant";
	        this.key = key;
	        this.value = value;
	        this.default = def;
	    }
	}
	class NamedArgument extends SyntaxNode {
	    constructor(name, value) {
	        super();
	        this.type = "NamedArgument";
	        this.name = name;
	        this.value = value;
	    }
	}
	class Identifier extends SyntaxNode {
	    constructor(name) {
	        super();
	        this.type = "Identifier";
	        this.name = name;
	    }
	}
	class BaseComment extends SyntaxNode {
	    constructor(content) {
	        super();
	        this.content = content;
	    }
	}
	class Comment extends BaseComment {
	    constructor() {
	        super(...arguments);
	        this.type = "Comment";
	    }
	}
	class GroupComment extends BaseComment {
	    constructor() {
	        super(...arguments);
	        this.type = "GroupComment";
	    }
	}
	class ResourceComment extends BaseComment {
	    constructor() {
	        super(...arguments);
	        this.type = "ResourceComment";
	    }
	}
	class Junk extends SyntaxNode {
	    constructor(content) {
	        super();
	        this.type = "Junk";
	        this.annotations = [];
	        this.content = content;
	    }
	    addAnnotation(annotation) {
	        this.annotations.push(annotation);
	    }
	}
	class Span extends BaseNode {
	    constructor(start, end) {
	        super();
	        this.type = "Span";
	        this.start = start;
	        this.end = end;
	    }
	}
	class Annotation extends SyntaxNode {
	    constructor(code, args = [], message) {
	        super();
	        this.type = "Annotation";
	        this.code = code;
	        this.arguments = args;
	        this.message = message;
	    }
	}

	class ParseError extends Error {
	    constructor(code, ...args) {
	        super();
	        this.code = code;
	        this.args = args;
	        this.message = getErrorMessage(code, args);
	    }
	}
	/* eslint-disable complexity */
	function getErrorMessage(code, args) {
	    switch (code) {
	        case "E0001":
	            return "Generic error";
	        case "E0002":
	            return "Expected an entry start";
	        case "E0003": {
	            const [token] = args;
	            return `Expected token: "${token}"`;
	        }
	        case "E0004": {
	            const [range] = args;
	            return `Expected a character from range: "${range}"`;
	        }
	        case "E0005": {
	            const [id] = args;
	            return `Expected message "${id}" to have a value or attributes`;
	        }
	        case "E0006": {
	            const [id] = args;
	            return `Expected term "-${id}" to have a value`;
	        }
	        case "E0007":
	            return "Keyword cannot end with a whitespace";
	        case "E0008":
	            return "The callee has to be an upper-case identifier or a term";
	        case "E0009":
	            return "The argument name has to be a simple identifier";
	        case "E0010":
	            return "Expected one of the variants to be marked as default (*)";
	        case "E0011":
	            return 'Expected at least one variant after "->"';
	        case "E0012":
	            return "Expected value";
	        case "E0013":
	            return "Expected variant key";
	        case "E0014":
	            return "Expected literal";
	        case "E0015":
	            return "Only one variant can be marked as default (*)";
	        case "E0016":
	            return "Message references cannot be used as selectors";
	        case "E0017":
	            return "Terms cannot be used as selectors";
	        case "E0018":
	            return "Attributes of messages cannot be used as selectors";
	        case "E0019":
	            return "Attributes of terms cannot be used as placeables";
	        case "E0020":
	            return "Unterminated string expression";
	        case "E0021":
	            return "Positional arguments must not follow named arguments";
	        case "E0022":
	            return "Named arguments must be unique";
	        case "E0024":
	            return "Cannot access variants of a message.";
	        case "E0025": {
	            const [char] = args;
	            return `Unknown escape sequence: \\${char}.`;
	        }
	        case "E0026": {
	            const [sequence] = args;
	            return `Invalid Unicode escape sequence: ${sequence}.`;
	        }
	        case "E0027":
	            return "Unbalanced closing brace in TextElement.";
	        case "E0028":
	            return "Expected an inline expression";
	        case "E0029":
	            return "Expected simple expression as selector";
	        default:
	            return code;
	    }
	}

	/* eslint no-magic-numbers: "off" */
	class ParserStream {
	    constructor(string) {
	        this.string = string;
	        this.index = 0;
	        this.peekOffset = 0;
	    }
	    charAt(offset) {
	        // When the cursor is at CRLF, return LF but don't move the cursor.
	        // The cursor still points to the EOL position, which in this case is the
	        // beginning of the compound CRLF sequence. This ensures slices of
	        // [inclusive, exclusive) continue to work properly.
	        if (this.string[offset] === "\r"
	            && this.string[offset + 1] === "\n") {
	            return "\n";
	        }
	        return this.string[offset];
	    }
	    currentChar() {
	        return this.charAt(this.index);
	    }
	    currentPeek() {
	        return this.charAt(this.index + this.peekOffset);
	    }
	    next() {
	        this.peekOffset = 0;
	        // Skip over the CRLF as if it was a single character.
	        if (this.string[this.index] === "\r"
	            && this.string[this.index + 1] === "\n") {
	            this.index++;
	        }
	        this.index++;
	        return this.string[this.index];
	    }
	    peek() {
	        // Skip over the CRLF as if it was a single character.
	        if (this.string[this.index + this.peekOffset] === "\r"
	            && this.string[this.index + this.peekOffset + 1] === "\n") {
	            this.peekOffset++;
	        }
	        this.peekOffset++;
	        return this.string[this.index + this.peekOffset];
	    }
	    resetPeek(offset = 0) {
	        this.peekOffset = offset;
	    }
	    skipToPeek() {
	        this.index += this.peekOffset;
	        this.peekOffset = 0;
	    }
	}
	const EOL = "\n";
	const EOF = undefined;
	const SPECIAL_LINE_START_CHARS = ["}", ".", "[", "*"];
	class FluentParserStream extends ParserStream {
	    peekBlankInline() {
	        const start = this.index + this.peekOffset;
	        while (this.currentPeek() === " ") {
	            this.peek();
	        }
	        return this.string.slice(start, this.index + this.peekOffset);
	    }
	    skipBlankInline() {
	        const blank = this.peekBlankInline();
	        this.skipToPeek();
	        return blank;
	    }
	    peekBlankBlock() {
	        let blank = "";
	        while (true) {
	            const lineStart = this.peekOffset;
	            this.peekBlankInline();
	            if (this.currentPeek() === EOL) {
	                blank += EOL;
	                this.peek();
	                continue;
	            }
	            if (this.currentPeek() === EOF) {
	                // Treat the blank line at EOF as a blank block.
	                return blank;
	            }
	            // Any other char; reset to column 1 on this line.
	            this.resetPeek(lineStart);
	            return blank;
	        }
	    }
	    skipBlankBlock() {
	        const blank = this.peekBlankBlock();
	        this.skipToPeek();
	        return blank;
	    }
	    peekBlank() {
	        while (this.currentPeek() === " " || this.currentPeek() === EOL) {
	            this.peek();
	        }
	    }
	    skipBlank() {
	        this.peekBlank();
	        this.skipToPeek();
	    }
	    expectChar(ch) {
	        if (this.currentChar() === ch) {
	            this.next();
	            return;
	        }
	        throw new ParseError("E0003", ch);
	    }
	    expectLineEnd() {
	        if (this.currentChar() === EOF) {
	            // EOF is a valid line end in Fluent.
	            return;
	        }
	        if (this.currentChar() === EOL) {
	            this.next();
	            return;
	        }
	        // Unicode Character 'SYMBOL FOR NEWLINE' (U+2424)
	        throw new ParseError("E0003", "\u2424");
	    }
	    takeChar(f) {
	        const ch = this.currentChar();
	        if (ch === EOF) {
	            return EOF;
	        }
	        if (f(ch)) {
	            this.next();
	            return ch;
	        }
	        return null;
	    }
	    isCharIdStart(ch) {
	        if (ch === EOF) {
	            return false;
	        }
	        const cc = ch.charCodeAt(0);
	        return (cc >= 97 && cc <= 122) || // a-z
	            (cc >= 65 && cc <= 90); // A-Z
	    }
	    isIdentifierStart() {
	        return this.isCharIdStart(this.currentPeek());
	    }
	    isNumberStart() {
	        const ch = this.currentChar() === "-"
	            ? this.peek()
	            : this.currentChar();
	        if (ch === EOF) {
	            this.resetPeek();
	            return false;
	        }
	        const cc = ch.charCodeAt(0);
	        const isDigit = cc >= 48 && cc <= 57; // 0-9
	        this.resetPeek();
	        return isDigit;
	    }
	    isCharPatternContinuation(ch) {
	        if (ch === EOF) {
	            return false;
	        }
	        return !SPECIAL_LINE_START_CHARS.includes(ch);
	    }
	    isValueStart() {
	        // Inline Patterns may start with any char.
	        const ch = this.currentPeek();
	        return ch !== EOL && ch !== EOF;
	    }
	    isValueContinuation() {
	        const column1 = this.peekOffset;
	        this.peekBlankInline();
	        if (this.currentPeek() === "{") {
	            this.resetPeek(column1);
	            return true;
	        }
	        if (this.peekOffset - column1 === 0) {
	            return false;
	        }
	        if (this.isCharPatternContinuation(this.currentPeek())) {
	            this.resetPeek(column1);
	            return true;
	        }
	        return false;
	    }
	    // -1 - any
	    //  0 - comment
	    //  1 - group comment
	    //  2 - resource comment
	    isNextLineComment(level = -1) {
	        if (this.currentChar() !== EOL) {
	            return false;
	        }
	        let i = 0;
	        while (i <= level || (level === -1 && i < 3)) {
	            if (this.peek() !== "#") {
	                if (i <= level && level !== -1) {
	                    this.resetPeek();
	                    return false;
	                }
	                break;
	            }
	            i++;
	        }
	        // The first char after #, ## or ###.
	        const ch = this.peek();
	        if (ch === " " || ch === EOL) {
	            this.resetPeek();
	            return true;
	        }
	        this.resetPeek();
	        return false;
	    }
	    isVariantStart() {
	        const currentPeekOffset = this.peekOffset;
	        if (this.currentPeek() === "*") {
	            this.peek();
	        }
	        if (this.currentPeek() === "[") {
	            this.resetPeek(currentPeekOffset);
	            return true;
	        }
	        this.resetPeek(currentPeekOffset);
	        return false;
	    }
	    isAttributeStart() {
	        return this.currentPeek() === ".";
	    }
	    skipToNextEntryStart(junkStart) {
	        let lastNewline = this.string.lastIndexOf(EOL, this.index);
	        if (junkStart < lastNewline) {
	            // Last seen newline is _after_ the junk start. It's safe to rewind
	            // without the risk of resuming at the same broken entry.
	            this.index = lastNewline;
	        }
	        while (this.currentChar()) {
	            // We're only interested in beginnings of line.
	            if (this.currentChar() !== EOL) {
	                this.next();
	                continue;
	            }
	            // Break if the first char in this line looks like an entry start.
	            const first = this.next();
	            if (this.isCharIdStart(first) || first === "-" || first === "#") {
	                break;
	            }
	        }
	    }
	    takeIDStart() {
	        if (this.isCharIdStart(this.currentChar())) {
	            const ret = this.currentChar();
	            this.next();
	            return ret;
	        }
	        throw new ParseError("E0004", "a-zA-Z");
	    }
	    takeIDChar() {
	        const closure = (ch) => {
	            const cc = ch.charCodeAt(0);
	            return ((cc >= 97 && cc <= 122) || // a-z
	                (cc >= 65 && cc <= 90) || // A-Z
	                (cc >= 48 && cc <= 57) || // 0-9
	                cc === 95 || cc === 45); // _-
	        };
	        return this.takeChar(closure);
	    }
	    takeDigit() {
	        const closure = (ch) => {
	            const cc = ch.charCodeAt(0);
	            return (cc >= 48 && cc <= 57); // 0-9
	        };
	        return this.takeChar(closure);
	    }
	    takeHexDigit() {
	        const closure = (ch) => {
	            const cc = ch.charCodeAt(0);
	            return (cc >= 48 && cc <= 57) // 0-9
	                || (cc >= 65 && cc <= 70) // A-F
	                || (cc >= 97 && cc <= 102); // a-f
	        };
	        return this.takeChar(closure);
	    }
	}

	/*  eslint no-magic-numbers: [0]  */
	const trailingWSRe = /[ \t\n\r]+$/;
	function withSpan(fn) {
	    return function (ps, ...args) {
	        if (!this.withSpans) {
	            return fn.call(this, ps, ...args);
	        }
	        const start = ps.index;
	        const node = fn.call(this, ps, ...args);
	        // Don't re-add the span if the node already has it. This may happen when
	        // one decorated function calls another decorated function.
	        if (node.span) {
	            return node;
	        }
	        const end = ps.index;
	        node.addSpan(start, end);
	        return node;
	    };
	}
	class FluentParser {
	    constructor({ withSpans = true } = {}) {
	        this.withSpans = withSpans;
	        // Poor man's decorators.
	        /* eslint-disable @typescript-eslint/unbound-method */
	        this.getComment = withSpan(this.getComment);
	        this.getMessage = withSpan(this.getMessage);
	        this.getTerm = withSpan(this.getTerm);
	        this.getAttribute = withSpan(this.getAttribute);
	        this.getIdentifier = withSpan(this.getIdentifier);
	        this.getVariant = withSpan(this.getVariant);
	        this.getNumber = withSpan(this.getNumber);
	        this.getPattern = withSpan(this.getPattern);
	        this.getTextElement = withSpan(this.getTextElement);
	        this.getPlaceable = withSpan(this.getPlaceable);
	        this.getExpression = withSpan(this.getExpression);
	        this.getInlineExpression = withSpan(this.getInlineExpression);
	        this.getCallArgument = withSpan(this.getCallArgument);
	        this.getCallArguments = withSpan(this.getCallArguments);
	        this.getString = withSpan(this.getString);
	        this.getLiteral = withSpan(this.getLiteral);
	        this.getComment = withSpan(this.getComment);
	        /* eslint-enable @typescript-eslint/unbound-method */
	    }
	    parse(source) {
	        const ps = new FluentParserStream(source);
	        ps.skipBlankBlock();
	        const entries = [];
	        let lastComment = null;
	        while (ps.currentChar()) {
	            const entry = this.getEntryOrJunk(ps);
	            const blankLines = ps.skipBlankBlock();
	            // Regular Comments require special logic. Comments may be attached to
	            // Messages or Terms if they are followed immediately by them. However
	            // they should parse as standalone when they're followed by Junk.
	            // Consequently, we only attach Comments once we know that the Message
	            // or the Term parsed successfully.
	            if (entry instanceof Comment
	                && blankLines.length === 0
	                && ps.currentChar()) {
	                // Stash the comment and decide what to do with it in the next pass.
	                lastComment = entry;
	                continue;
	            }
	            if (lastComment) {
	                if (entry instanceof Message || entry instanceof Term) {
	                    entry.comment = lastComment;
	                    if (this.withSpans) {
	                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	                        entry.span.start = entry.comment.span.start;
	                    }
	                }
	                else {
	                    entries.push(lastComment);
	                }
	                // In either case, the stashed comment has been dealt with; clear it.
	                lastComment = null;
	            }
	            // No special logic for other types of entries.
	            entries.push(entry);
	        }
	        const res = new Resource(entries);
	        if (this.withSpans) {
	            res.addSpan(0, ps.index);
	        }
	        return res;
	    }
	    /*
	     * Parse the first Message or Term in `source`.
	     *
	     * Skip all encountered comments and start parsing at the first Message or
	     * Term start. Return Junk if the parsing is not successful.
	     *
	     * Preceding comments are ignored unless they contain syntax errors
	     * themselves, in which case Junk for the invalid comment is returned.
	     */
	    parseEntry(source) {
	        const ps = new FluentParserStream(source);
	        ps.skipBlankBlock();
	        while (ps.currentChar() === "#") {
	            const skipped = this.getEntryOrJunk(ps);
	            if (skipped instanceof Junk) {
	                // Don't skip Junk comments.
	                return skipped;
	            }
	            ps.skipBlankBlock();
	        }
	        return this.getEntryOrJunk(ps);
	    }
	    getEntryOrJunk(ps) {
	        const entryStartPos = ps.index;
	        try {
	            const entry = this.getEntry(ps);
	            ps.expectLineEnd();
	            return entry;
	        }
	        catch (err) {
	            if (!(err instanceof ParseError)) {
	                throw err;
	            }
	            let errorIndex = ps.index;
	            ps.skipToNextEntryStart(entryStartPos);
	            const nextEntryStart = ps.index;
	            if (nextEntryStart < errorIndex) {
	                // The position of the error must be inside of the Junk's span.
	                errorIndex = nextEntryStart;
	            }
	            // Create a Junk instance
	            const slice = ps.string.substring(entryStartPos, nextEntryStart);
	            const junk = new Junk(slice);
	            if (this.withSpans) {
	                junk.addSpan(entryStartPos, nextEntryStart);
	            }
	            const annot = new Annotation(err.code, err.args, err.message);
	            annot.addSpan(errorIndex, errorIndex);
	            junk.addAnnotation(annot);
	            return junk;
	        }
	    }
	    getEntry(ps) {
	        if (ps.currentChar() === "#") {
	            return this.getComment(ps);
	        }
	        if (ps.currentChar() === "-") {
	            return this.getTerm(ps);
	        }
	        if (ps.isIdentifierStart()) {
	            return this.getMessage(ps);
	        }
	        throw new ParseError("E0002");
	    }
	    getComment(ps) {
	        // 0 - comment
	        // 1 - group comment
	        // 2 - resource comment
	        let level = -1;
	        let content = "";
	        while (true) {
	            let i = -1;
	            while (ps.currentChar() === "#" && (i < (level === -1 ? 2 : level))) {
	                ps.next();
	                i++;
	            }
	            if (level === -1) {
	                level = i;
	            }
	            if (ps.currentChar() !== EOL) {
	                ps.expectChar(" ");
	                let ch;
	                while ((ch = ps.takeChar(x => x !== EOL))) {
	                    content += ch;
	                }
	            }
	            if (ps.isNextLineComment(level)) {
	                content += ps.currentChar();
	                ps.next();
	            }
	            else {
	                break;
	            }
	        }
	        let Comment$1;
	        switch (level) {
	            case 0:
	                Comment$1 = Comment;
	                break;
	            case 1:
	                Comment$1 = GroupComment;
	                break;
	            default:
	                Comment$1 = ResourceComment;
	        }
	        return new Comment$1(content);
	    }
	    getMessage(ps) {
	        const id = this.getIdentifier(ps);
	        ps.skipBlankInline();
	        ps.expectChar("=");
	        const value = this.maybeGetPattern(ps);
	        const attrs = this.getAttributes(ps);
	        if (value === null && attrs.length === 0) {
	            throw new ParseError("E0005", id.name);
	        }
	        return new Message(id, value, attrs);
	    }
	    getTerm(ps) {
	        ps.expectChar("-");
	        const id = this.getIdentifier(ps);
	        ps.skipBlankInline();
	        ps.expectChar("=");
	        const value = this.maybeGetPattern(ps);
	        if (value === null) {
	            throw new ParseError("E0006", id.name);
	        }
	        const attrs = this.getAttributes(ps);
	        return new Term(id, value, attrs);
	    }
	    getAttribute(ps) {
	        ps.expectChar(".");
	        const key = this.getIdentifier(ps);
	        ps.skipBlankInline();
	        ps.expectChar("=");
	        const value = this.maybeGetPattern(ps);
	        if (value === null) {
	            throw new ParseError("E0012");
	        }
	        return new Attribute(key, value);
	    }
	    getAttributes(ps) {
	        const attrs = [];
	        ps.peekBlank();
	        while (ps.isAttributeStart()) {
	            ps.skipToPeek();
	            const attr = this.getAttribute(ps);
	            attrs.push(attr);
	            ps.peekBlank();
	        }
	        return attrs;
	    }
	    getIdentifier(ps) {
	        let name = ps.takeIDStart();
	        let ch;
	        while ((ch = ps.takeIDChar())) {
	            name += ch;
	        }
	        return new Identifier(name);
	    }
	    getVariantKey(ps) {
	        const ch = ps.currentChar();
	        if (ch === EOF) {
	            throw new ParseError("E0013");
	        }
	        const cc = ch.charCodeAt(0);
	        if ((cc >= 48 && cc <= 57) || cc === 45) { // 0-9, -
	            return this.getNumber(ps);
	        }
	        return this.getIdentifier(ps);
	    }
	    getVariant(ps, hasDefault = false) {
	        let defaultIndex = false;
	        if (ps.currentChar() === "*") {
	            if (hasDefault) {
	                throw new ParseError("E0015");
	            }
	            ps.next();
	            defaultIndex = true;
	        }
	        ps.expectChar("[");
	        ps.skipBlank();
	        const key = this.getVariantKey(ps);
	        ps.skipBlank();
	        ps.expectChar("]");
	        const value = this.maybeGetPattern(ps);
	        if (value === null) {
	            throw new ParseError("E0012");
	        }
	        return new Variant(key, value, defaultIndex);
	    }
	    getVariants(ps) {
	        const variants = [];
	        let hasDefault = false;
	        ps.skipBlank();
	        while (ps.isVariantStart()) {
	            const variant = this.getVariant(ps, hasDefault);
	            if (variant.default) {
	                hasDefault = true;
	            }
	            variants.push(variant);
	            ps.expectLineEnd();
	            ps.skipBlank();
	        }
	        if (variants.length === 0) {
	            throw new ParseError("E0011");
	        }
	        if (!hasDefault) {
	            throw new ParseError("E0010");
	        }
	        return variants;
	    }
	    getDigits(ps) {
	        let num = "";
	        let ch;
	        while ((ch = ps.takeDigit())) {
	            num += ch;
	        }
	        if (num.length === 0) {
	            throw new ParseError("E0004", "0-9");
	        }
	        return num;
	    }
	    getNumber(ps) {
	        let value = "";
	        if (ps.currentChar() === "-") {
	            ps.next();
	            value += `-${this.getDigits(ps)}`;
	        }
	        else {
	            value += this.getDigits(ps);
	        }
	        if (ps.currentChar() === ".") {
	            ps.next();
	            value += `.${this.getDigits(ps)}`;
	        }
	        return new NumberLiteral(value);
	    }
	    // maybeGetPattern distinguishes between patterns which start on the same line
	    // as the identifier (a.k.a. inline signleline patterns and inline multiline
	    // patterns) and patterns which start on a new line (a.k.a. block multiline
	    // patterns). The distinction is important for the dedentation logic: the
	    // indent of the first line of a block pattern must be taken into account when
	    // calculating the maximum common indent.
	    maybeGetPattern(ps) {
	        ps.peekBlankInline();
	        if (ps.isValueStart()) {
	            ps.skipToPeek();
	            return this.getPattern(ps, false);
	        }
	        ps.peekBlankBlock();
	        if (ps.isValueContinuation()) {
	            ps.skipToPeek();
	            return this.getPattern(ps, true);
	        }
	        return null;
	    }
	    getPattern(ps, isBlock) {
	        const elements = [];
	        let commonIndentLength;
	        if (isBlock) {
	            // A block pattern is a pattern which starts on a new line. Store and
	            // measure the indent of this first line for the dedentation logic.
	            const blankStart = ps.index;
	            const firstIndent = ps.skipBlankInline();
	            elements.push(this.getIndent(ps, firstIndent, blankStart));
	            commonIndentLength = firstIndent.length;
	        }
	        else {
	            commonIndentLength = Infinity;
	        }
	        let ch;
	        elements: while ((ch = ps.currentChar())) {
	            switch (ch) {
	                case EOL: {
	                    const blankStart = ps.index;
	                    const blankLines = ps.peekBlankBlock();
	                    if (ps.isValueContinuation()) {
	                        ps.skipToPeek();
	                        const indent = ps.skipBlankInline();
	                        commonIndentLength = Math.min(commonIndentLength, indent.length);
	                        elements.push(this.getIndent(ps, blankLines + indent, blankStart));
	                        continue elements;
	                    }
	                    // The end condition for getPattern's while loop is a newline
	                    // which is not followed by a valid pattern continuation.
	                    ps.resetPeek();
	                    break elements;
	                }
	                case "{":
	                    elements.push(this.getPlaceable(ps));
	                    continue elements;
	                case "}":
	                    throw new ParseError("E0027");
	                default:
	                    elements.push(this.getTextElement(ps));
	            }
	        }
	        const dedented = this.dedent(elements, commonIndentLength);
	        return new Pattern(dedented);
	    }
	    // Create a token representing an indent. It's not part of the AST and it will
	    // be trimmed and merged into adjacent TextElements, or turned into a new
	    // TextElement, if it's surrounded by two Placeables.
	    getIndent(ps, value, start) {
	        return new Indent(value, start, ps.index);
	    }
	    // Dedent a list of elements by removing the maximum common indent from the
	    // beginning of text lines. The common indent is calculated in getPattern.
	    dedent(elements, commonIndent) {
	        const trimmed = [];
	        for (let element of elements) {
	            if (element instanceof Placeable) {
	                trimmed.push(element);
	                continue;
	            }
	            if (element instanceof Indent) {
	                // Strip common indent.
	                element.value = element.value.slice(0, element.value.length - commonIndent);
	                if (element.value.length === 0) {
	                    continue;
	                }
	            }
	            let prev = trimmed[trimmed.length - 1];
	            if (prev && prev instanceof TextElement) {
	                // Join adjacent TextElements by replacing them with their sum.
	                const sum = new TextElement(prev.value + element.value);
	                if (this.withSpans) {
	                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	                    sum.addSpan(prev.span.start, element.span.end);
	                }
	                trimmed[trimmed.length - 1] = sum;
	                continue;
	            }
	            if (element instanceof Indent) {
	                // If the indent hasn't been merged into a preceding TextElement,
	                // convert it into a new TextElement.
	                const textElement = new TextElement(element.value);
	                if (this.withSpans) {
	                    textElement.addSpan(element.span.start, element.span.end);
	                }
	                element = textElement;
	            }
	            trimmed.push(element);
	        }
	        // Trim trailing whitespace from the Pattern.
	        const lastElement = trimmed[trimmed.length - 1];
	        if (lastElement instanceof TextElement) {
	            lastElement.value = lastElement.value.replace(trailingWSRe, "");
	            if (lastElement.value.length === 0) {
	                trimmed.pop();
	            }
	        }
	        return trimmed;
	    }
	    getTextElement(ps) {
	        let buffer = "";
	        let ch;
	        while ((ch = ps.currentChar())) {
	            if (ch === "{" || ch === "}") {
	                return new TextElement(buffer);
	            }
	            if (ch === EOL) {
	                return new TextElement(buffer);
	            }
	            buffer += ch;
	            ps.next();
	        }
	        return new TextElement(buffer);
	    }
	    getEscapeSequence(ps) {
	        const next = ps.currentChar();
	        switch (next) {
	            case "\\":
	            case "\"":
	                ps.next();
	                return `\\${next}`;
	            case "u":
	                return this.getUnicodeEscapeSequence(ps, next, 4);
	            case "U":
	                return this.getUnicodeEscapeSequence(ps, next, 6);
	            default:
	                throw new ParseError("E0025", next);
	        }
	    }
	    getUnicodeEscapeSequence(ps, u, digits) {
	        ps.expectChar(u);
	        let sequence = "";
	        for (let i = 0; i < digits; i++) {
	            const ch = ps.takeHexDigit();
	            if (!ch) {
	                throw new ParseError("E0026", `\\${u}${sequence}${ps.currentChar()}`);
	            }
	            sequence += ch;
	        }
	        return `\\${u}${sequence}`;
	    }
	    getPlaceable(ps) {
	        ps.expectChar("{");
	        ps.skipBlank();
	        const expression = this.getExpression(ps);
	        ps.expectChar("}");
	        return new Placeable(expression);
	    }
	    getExpression(ps) {
	        const selector = this.getInlineExpression(ps);
	        ps.skipBlank();
	        if (ps.currentChar() === "-") {
	            if (ps.peek() !== ">") {
	                ps.resetPeek();
	                return selector;
	            }
	            // Validate selector expression according to
	            // abstract.js in the Fluent specification
	            if (selector instanceof MessageReference) {
	                if (selector.attribute === null) {
	                    throw new ParseError("E0016");
	                }
	                else {
	                    throw new ParseError("E0018");
	                }
	            }
	            else if (selector instanceof TermReference) {
	                if (selector.attribute === null) {
	                    throw new ParseError("E0017");
	                }
	            }
	            else if (selector instanceof Placeable) {
	                throw new ParseError("E0029");
	            }
	            ps.next();
	            ps.next();
	            ps.skipBlankInline();
	            ps.expectLineEnd();
	            const variants = this.getVariants(ps);
	            return new SelectExpression(selector, variants);
	        }
	        if (selector instanceof TermReference && selector.attribute !== null) {
	            throw new ParseError("E0019");
	        }
	        return selector;
	    }
	    getInlineExpression(ps) {
	        if (ps.currentChar() === "{") {
	            return this.getPlaceable(ps);
	        }
	        if (ps.isNumberStart()) {
	            return this.getNumber(ps);
	        }
	        if (ps.currentChar() === '"') {
	            return this.getString(ps);
	        }
	        if (ps.currentChar() === "$") {
	            ps.next();
	            const id = this.getIdentifier(ps);
	            return new VariableReference(id);
	        }
	        if (ps.currentChar() === "-") {
	            ps.next();
	            const id = this.getIdentifier(ps);
	            let attr;
	            if (ps.currentChar() === ".") {
	                ps.next();
	                attr = this.getIdentifier(ps);
	            }
	            let args;
	            ps.peekBlank();
	            if (ps.currentPeek() === "(") {
	                ps.skipToPeek();
	                args = this.getCallArguments(ps);
	            }
	            return new TermReference(id, attr, args);
	        }
	        if (ps.isIdentifierStart()) {
	            const id = this.getIdentifier(ps);
	            ps.peekBlank();
	            if (ps.currentPeek() === "(") {
	                // It's a Function. Ensure it's all upper-case.
	                if (!/^[A-Z][A-Z0-9_-]*$/.test(id.name)) {
	                    throw new ParseError("E0008");
	                }
	                ps.skipToPeek();
	                let args = this.getCallArguments(ps);
	                return new FunctionReference(id, args);
	            }
	            let attr;
	            if (ps.currentChar() === ".") {
	                ps.next();
	                attr = this.getIdentifier(ps);
	            }
	            return new MessageReference(id, attr);
	        }
	        throw new ParseError("E0028");
	    }
	    getCallArgument(ps) {
	        const exp = this.getInlineExpression(ps);
	        ps.skipBlank();
	        if (ps.currentChar() !== ":") {
	            return exp;
	        }
	        if (exp instanceof MessageReference && exp.attribute === null) {
	            ps.next();
	            ps.skipBlank();
	            const value = this.getLiteral(ps);
	            return new NamedArgument(exp.id, value);
	        }
	        throw new ParseError("E0009");
	    }
	    getCallArguments(ps) {
	        const positional = [];
	        const named = [];
	        const argumentNames = new Set();
	        ps.expectChar("(");
	        ps.skipBlank();
	        while (true) {
	            if (ps.currentChar() === ")") {
	                break;
	            }
	            const arg = this.getCallArgument(ps);
	            if (arg instanceof NamedArgument) {
	                if (argumentNames.has(arg.name.name)) {
	                    throw new ParseError("E0022");
	                }
	                named.push(arg);
	                argumentNames.add(arg.name.name);
	            }
	            else if (argumentNames.size > 0) {
	                throw new ParseError("E0021");
	            }
	            else {
	                positional.push(arg);
	            }
	            ps.skipBlank();
	            if (ps.currentChar() === ",") {
	                ps.next();
	                ps.skipBlank();
	                continue;
	            }
	            break;
	        }
	        ps.expectChar(")");
	        return new CallArguments(positional, named);
	    }
	    getString(ps) {
	        ps.expectChar("\"");
	        let value = "";
	        let ch;
	        while ((ch = ps.takeChar(x => x !== '"' && x !== EOL))) {
	            if (ch === "\\") {
	                value += this.getEscapeSequence(ps);
	            }
	            else {
	                value += ch;
	            }
	        }
	        if (ps.currentChar() === EOL) {
	            throw new ParseError("E0020");
	        }
	        ps.expectChar("\"");
	        return new StringLiteral(value);
	    }
	    getLiteral(ps) {
	        if (ps.isNumberStart()) {
	            return this.getNumber(ps);
	        }
	        if (ps.currentChar() === '"') {
	            return this.getString(ps);
	        }
	        throw new ParseError("E0014");
	    }
	}
	class Indent {
	    constructor(value, start, end) {
	        this.type = "Indent";
	        this.value = value;
	        this.span = new Span(start, end);
	    }
	}

	function indentExceptFirstLine(content) {
	    return content.split("\n").join("\n    ");
	}
	function includesNewLine(elem) {
	    return elem instanceof TextElement && elem.value.includes("\n");
	}
	function isSelectExpr(elem) {
	    return elem instanceof Placeable
	        && elem.expression instanceof SelectExpression;
	}
	function shouldStartOnNewLine(pattern) {
	    const isMultiline = pattern.elements.some(isSelectExpr) ||
	        pattern.elements.some(includesNewLine);
	    if (isMultiline) {
	        const firstElement = pattern.elements[0];
	        if (firstElement instanceof TextElement) {
	            const firstChar = firstElement.value[0];
	            // Due to the indentation requirement these text characters may not appear
	            // as the first character on a new line.
	            if (firstChar === "[" || firstChar === "." || firstChar === "*") {
	                return false;
	            }
	        }
	        return true;
	    }
	    return false;
	}
	// Bit masks representing the state of the serializer.
	const HAS_ENTRIES = 1;
	class FluentSerializer {
	    constructor({ withJunk = false } = {}) {
	        this.withJunk = withJunk;
	    }
	    serialize(resource) {
	        if (!(resource instanceof Resource)) {
	            throw new Error(`Unknown resource type: ${resource}`);
	        }
	        let state = 0;
	        const parts = [];
	        for (const entry of resource.body) {
	            if (!(entry instanceof Junk) || this.withJunk) {
	                parts.push(this.serializeEntry(entry, state));
	                if (!(state & HAS_ENTRIES)) {
	                    state |= HAS_ENTRIES;
	                }
	            }
	        }
	        return parts.join("");
	    }
	    serializeEntry(entry, state = 0) {
	        if (entry instanceof Message) {
	            return serializeMessage(entry);
	        }
	        if (entry instanceof Term) {
	            return serializeTerm(entry);
	        }
	        if (entry instanceof Comment) {
	            if (state & HAS_ENTRIES) {
	                return `\n${serializeComment(entry, "#")}\n`;
	            }
	            return `${serializeComment(entry, "#")}\n`;
	        }
	        if (entry instanceof GroupComment) {
	            if (state & HAS_ENTRIES) {
	                return `\n${serializeComment(entry, "##")}\n`;
	            }
	            return `${serializeComment(entry, "##")}\n`;
	        }
	        if (entry instanceof ResourceComment) {
	            if (state & HAS_ENTRIES) {
	                return `\n${serializeComment(entry, "###")}\n`;
	            }
	            return `${serializeComment(entry, "###")}\n`;
	        }
	        if (entry instanceof Junk) {
	            return serializeJunk(entry);
	        }
	        throw new Error(`Unknown entry type: ${entry}`);
	    }
	}
	function serializeComment(comment, prefix = "#") {
	    const prefixed = comment.content.split("\n").map(line => line.length ? `${prefix} ${line}` : prefix).join("\n");
	    // Add the trailing newline.
	    return `${prefixed}\n`;
	}
	function serializeJunk(junk) {
	    return junk.content;
	}
	function serializeMessage(message) {
	    const parts = [];
	    if (message.comment) {
	        parts.push(serializeComment(message.comment));
	    }
	    parts.push(`${message.id.name} =`);
	    if (message.value) {
	        parts.push(serializePattern(message.value));
	    }
	    for (const attribute of message.attributes) {
	        parts.push(serializeAttribute(attribute));
	    }
	    parts.push("\n");
	    return parts.join("");
	}
	function serializeTerm(term) {
	    const parts = [];
	    if (term.comment) {
	        parts.push(serializeComment(term.comment));
	    }
	    parts.push(`-${term.id.name} =`);
	    parts.push(serializePattern(term.value));
	    for (const attribute of term.attributes) {
	        parts.push(serializeAttribute(attribute));
	    }
	    parts.push("\n");
	    return parts.join("");
	}
	function serializeAttribute(attribute) {
	    const value = indentExceptFirstLine(serializePattern(attribute.value));
	    return `\n    .${attribute.id.name} =${value}`;
	}
	function serializePattern(pattern) {
	    const content = pattern.elements.map(serializeElement).join("");
	    if (shouldStartOnNewLine(pattern)) {
	        return `\n    ${indentExceptFirstLine(content)}`;
	    }
	    return ` ${indentExceptFirstLine(content)}`;
	}
	function serializeElement(element) {
	    if (element instanceof TextElement) {
	        return element.value;
	    }
	    if (element instanceof Placeable) {
	        return serializePlaceable(element);
	    }
	    throw new Error(`Unknown element type: ${element}`);
	}
	function serializePlaceable(placeable) {
	    const expr = placeable.expression;
	    if (expr instanceof Placeable) {
	        return `{${serializePlaceable(expr)}}`;
	    }
	    if (expr instanceof SelectExpression) {
	        // Special-case select expression to control the whitespace around the
	        // opening and the closing brace.
	        return `{ ${serializeExpression(expr)}}`;
	    }
	    return `{ ${serializeExpression(expr)} }`;
	}
	function serializeExpression(expr) {
	    if (expr instanceof StringLiteral) {
	        return `"${expr.value}"`;
	    }
	    if (expr instanceof NumberLiteral) {
	        return expr.value;
	    }
	    if (expr instanceof VariableReference) {
	        return `$${expr.id.name}`;
	    }
	    if (expr instanceof TermReference) {
	        let out = `-${expr.id.name}`;
	        if (expr.attribute) {
	            out += `.${expr.attribute.name}`;
	        }
	        if (expr.arguments) {
	            out += serializeCallArguments(expr.arguments);
	        }
	        return out;
	    }
	    if (expr instanceof MessageReference) {
	        let out = expr.id.name;
	        if (expr.attribute) {
	            out += `.${expr.attribute.name}`;
	        }
	        return out;
	    }
	    if (expr instanceof FunctionReference) {
	        return `${expr.id.name}${serializeCallArguments(expr.arguments)}`;
	    }
	    if (expr instanceof SelectExpression) {
	        let out = `${serializeExpression(expr.selector)} ->`;
	        for (let variant of expr.variants) {
	            out += serializeVariant(variant);
	        }
	        return `${out}\n`;
	    }
	    if (expr instanceof Placeable) {
	        return serializePlaceable(expr);
	    }
	    throw new Error(`Unknown expression type: ${expr}`);
	}
	function serializeVariant(variant) {
	    const key = serializeVariantKey(variant.key);
	    const value = indentExceptFirstLine(serializePattern(variant.value));
	    if (variant.default) {
	        return `\n   *[${key}]${value}`;
	    }
	    return `\n    [${key}]${value}`;
	}
	function serializeCallArguments(expr) {
	    const positional = expr.positional.map(serializeExpression).join(", ");
	    const named = expr.named.map(serializeNamedArgument).join(", ");
	    if (expr.positional.length > 0 && expr.named.length > 0) {
	        return `(${positional}, ${named})`;
	    }
	    return `(${positional || named})`;
	}
	function serializeNamedArgument(arg) {
	    const value = serializeExpression(arg.value);
	    return `${arg.name.name}: ${value}`;
	}
	function serializeVariantKey(key) {
	    if (key instanceof Identifier) {
	        return key.name;
	    }
	    if (key instanceof NumberLiteral) {
	        return key.value;
	    }
	    throw new Error(`Unknown variant key type: ${key}`);
	}

	/**
	 * A read-only visitor.
	 *
	 * Subclasses can be used to gather information from an AST.
	 *
	 * To handle specific node types add methods like `visitPattern`.
	 * Then, to descend into children call `genericVisit`.
	 *
	 * Visiting methods must implement the following interface:
	 *
	 *     interface VisitingMethod {
	 *         (this: Visitor, node: AST.BaseNode): void;
	 *     }
	 */
	class Visitor {
	    visit(node) {
	        let visit = this[`visit${node.type}`];
	        if (typeof visit === "function") {
	            visit.call(this, node);
	        }
	        else {
	            this.genericVisit(node);
	        }
	    }
	    genericVisit(node) {
	        for (const key of Object.keys(node)) {
	            let prop = node[key];
	            if (prop instanceof BaseNode) {
	                this.visit(prop);
	            }
	            else if (Array.isArray(prop)) {
	                for (let element of prop) {
	                    this.visit(element);
	                }
	            }
	        }
	    }
	}
	/**
	 * A read-and-write visitor.
	 *
	 * Subclasses can be used to modify an AST in-place.
	 *
	 * To handle specific node types add methods like `visitPattern`.
	 * Then, to descend into children call `genericVisit`.
	 *
	 * Visiting methods must implement the following interface:
	 *
	 *     interface TransformingMethod {
	 *         (this: Transformer, node: AST.BaseNode): AST.BaseNode | undefined;
	 *     }
	 *
	 * The returned node will replace the original one in the AST. Return
	 * `undefined` to remove the node instead.
	 */
	class Transformer extends Visitor {
	    visit(node) {
	        let visit = this[`visit${node.type}`];
	        if (typeof visit === "function") {
	            return visit.call(this, node);
	        }
	        return this.genericVisit(node);
	    }
	    genericVisit(node) {
	        for (const key of Object.keys(node)) {
	            let prop = node[key];
	            if (prop instanceof BaseNode) {
	                let newVal = this.visit(prop);
	                if (newVal === undefined) {
	                    delete node[key];
	                }
	                else {
	                    node[key] = newVal;
	                }
	            }
	            else if (Array.isArray(prop)) {
	                let newVals = [];
	                for (let element of prop) {
	                    let newVal = this.visit(element);
	                    if (newVal !== undefined) {
	                        newVals.push(newVal);
	                    }
	                }
	                node[key] = newVals;
	            }
	        }
	        return node;
	    }
	}

	function parse(source, opts) {
	    const parser = new FluentParser(opts);
	    return parser.parse(source);
	}
	function serialize(resource, opts) {
	    const serializer = new FluentSerializer(opts);
	    return serializer.serialize(resource);
	}
	function lineOffset(source, pos) {
	    // Subtract 1 to get the offset.
	    return source.substring(0, pos).split("\n").length - 1;
	}
	function columnOffset(source, pos) {
	    // Find the last line break starting backwards from the index just before
	    // pos.  This allows us to correctly handle ths case where the character at
	    // pos  is a line break as well.
	    const fromIndex = pos - 1;
	    const prevLineBreak = source.lastIndexOf("\n", fromIndex);
	    // pos is a position in the first line of source.
	    if (prevLineBreak === -1) {
	        return pos;
	    }
	    // Subtracting two offsets gives length; subtract 1 to get the offset.
	    return pos - prevLineBreak - 1;
	}

	var esm = /*#__PURE__*/Object.freeze({
		__proto__: null,
		parse: parse,
		serialize: serialize,
		lineOffset: lineOffset,
		columnOffset: columnOffset,
		BaseNode: BaseNode,
		SyntaxNode: SyntaxNode,
		Resource: Resource,
		Message: Message,
		Term: Term,
		Pattern: Pattern,
		TextElement: TextElement,
		Placeable: Placeable,
		BaseLiteral: BaseLiteral,
		StringLiteral: StringLiteral,
		NumberLiteral: NumberLiteral,
		MessageReference: MessageReference,
		TermReference: TermReference,
		VariableReference: VariableReference,
		FunctionReference: FunctionReference,
		SelectExpression: SelectExpression,
		CallArguments: CallArguments,
		Attribute: Attribute,
		Variant: Variant,
		NamedArgument: NamedArgument,
		Identifier: Identifier,
		BaseComment: BaseComment,
		Comment: Comment,
		GroupComment: GroupComment,
		ResourceComment: ResourceComment,
		Junk: Junk,
		Span: Span,
		Annotation: Annotation,
		ParseError: ParseError,
		FluentParser: FluentParser,
		FluentSerializer: FluentSerializer,
		serializeExpression: serializeExpression,
		serializeVariantKey: serializeVariantKey,
		Visitor: Visitor,
		Transformer: Transformer
	});

	// do not edit .js files directly - edit src/index.jst



	var fastDeepEqual = function equal(a, b) {
	  if (a === b) return true;

	  if (a && b && typeof a == 'object' && typeof b == 'object') {
	    if (a.constructor !== b.constructor) return false;

	    var length, i, keys;
	    if (Array.isArray(a)) {
	      length = a.length;
	      if (length != b.length) return false;
	      for (i = length; i-- !== 0;)
	        if (!equal(a[i], b[i])) return false;
	      return true;
	    }



	    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
	    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
	    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

	    keys = Object.keys(a);
	    length = keys.length;
	    if (length !== Object.keys(b).length) return false;

	    for (i = length; i-- !== 0;)
	      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

	    for (i = length; i-- !== 0;) {
	      var key = keys[i];

	      if (!equal(a[key], b[key])) return false;
	    }

	    return true;
	  }

	  // true if both NaN, false otherwise
	  return a!==a && b!==b;
	};

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

	var lib$1 = createCommonjsModule(function (module, exports) {
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

	var fluentAstToMessage = createCommonjsModule(function (module, exports) {
	var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.astToMessage = void 0;
	const fast_deep_equal_1 = __importDefault(fastDeepEqual);

	const variantKey = ({ key }) => key.type === 'Identifier' ? key.name : key.parse().value;
	function asSelectArg(sel) {
	    let fallback = '';
	    const keys = sel.variants.map(v => {
	        const id = variantKey(v);
	        if (v.default)
	            fallback = id;
	        return id;
	    });
	    return { selector: sel.selector, fallback, keys };
	}
	function findSelectArgs(pattern) {
	    const args = [];
	    const add = (arg) => {
	        const prev = args.find(a => fast_deep_equal_1.default(a.selector, arg.selector));
	        if (prev)
	            for (const key of arg.keys)
	                prev.keys.push(key);
	        else
	            args.push(arg);
	    };
	    for (const el of pattern.elements)
	        if (el.type === 'Placeable' && el.expression.type === 'SelectExpression') {
	            add(asSelectArg(el.expression));
	            for (const v of el.expression.variants)
	                for (const arg of findSelectArgs(v.value))
	                    add(arg);
	        }
	    return args;
	}
	function expressionToPart(exp) {
	    switch (exp.type) {
	        case 'NumberLiteral':
	            return {
	                type: 'function',
	                func: 'NUMBER',
	                args: [{ type: 'literal', value: exp.value }]
	            };
	        case 'StringLiteral':
	            return { type: 'literal', value: exp.parse().value };
	        case 'VariableReference':
	            return {
	                type: 'variable',
	                var_path: [{ type: 'literal', value: exp.id.name }]
	            };
	        case 'FunctionReference': {
	            const func = exp.id.name;
	            const { positional, named } = exp.arguments;
	            const args = positional.map(exp => {
	                const part = expressionToPart(exp);
	                if (lib$1.isFunction(part) || lib$1.isTerm(part))
	                    throw new Error(`A Fluent ${exp.type} is not supported here.`);
	                return part;
	            });
	            if (named.length === 0)
	                return { type: 'function', func, args };
	            const options = {};
	            for (const { name, value } of named)
	                options[name.name] = {
	                    type: 'literal',
	                    value: value.type === 'NumberLiteral' ? value.value : value.parse().value
	                };
	            return { type: 'function', func, args, options };
	        }
	        case 'MessageReference': {
	            const id = exp.attribute
	                ? `${exp.id.name}.${exp.attribute.name}`
	                : exp.id.name;
	            return { type: 'term', msg_path: [{ type: 'literal', value: id }] };
	        }
	        case 'TermReference': {
	            const id = exp.attribute
	                ? `-${exp.id.name}.${exp.attribute.name}`
	                : `-${exp.id.name}`;
	            if (!exp.arguments)
	                return { type: 'term', msg_path: [{ type: 'literal', value: id }] };
	            const scope = {};
	            for (const { name, value } of exp.arguments.named)
	                scope[name.name] = {
	                    type: 'literal',
	                    value: value.type === 'NumberLiteral' ? value.value : value.parse().value
	                };
	            return {
	                type: 'term',
	                msg_path: [{ type: 'literal', value: id }],
	                scope
	            };
	        }
	        /* istanbul ignore next - never happens */
	        case 'Placeable':
	            return expressionToPart(exp.expression);
	        /* istanbul ignore next - never happens */
	        default:
	            throw new Error(`${exp.type} not supported here`);
	    }
	}
	const elementToPart = (el) => el.type === 'TextElement'
	    ? { type: 'literal', value: el.value }
	    : expressionToPart(el.expression);
	function asFluentSelect(el) {
	    if (el.type === 'TextElement')
	        return null;
	    switch (el.expression.type) {
	        case 'SelectExpression':
	            return el.expression;
	        /* istanbul ignore next - never happens */
	        case 'Placeable':
	            return asFluentSelect(el.expression);
	        default:
	            return null;
	    }
	}
	function astToMessage(ast, comment) {
	    const args = findSelectArgs(ast);
	    if (args.length === 0) {
	        const msg = {
	            type: 'message',
	            value: ast.elements.map(elementToPart)
	        };
	        if (comment)
	            msg.meta = { comment: comment.content };
	        return msg;
	    }
	    // First determine the keys for all cases, with empty values
	    let keys = [];
	    for (let i = 0; i < args.length; ++i) {
	        const arg = args[i];
	        const kk = Array.from(new Set(arg.keys));
	        kk.sort((a, b) => {
	            if (a === arg.fallback)
	                return 1;
	            if (typeof a === 'number' || b === arg.fallback)
	                return -1;
	            if (typeof b === 'number')
	                return 1;
	            return 0;
	        });
	        if (i === 0)
	            keys = kk.map(key => [key]);
	        else
	            for (let i = keys.length - 1; i >= 0; --i)
	                keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
	    }
	    const cases = keys.map(key => ({
	        key: key.map(k => String(k)),
	        value: []
	    }));
	    /**
	     * This reads `args` and modifies `cases`
	     *
	     * @param pluralArg - Required by # octothorpes
	     * @param filter - Selects which cases we're adding to
	     */
	    function addParts(pattern, filter) {
	        for (const el of pattern.elements) {
	            const sel = asFluentSelect(el);
	            if (sel) {
	                const idx = args.findIndex(a => fast_deep_equal_1.default(a.selector, sel.selector));
	                for (const v of sel.variants)
	                    addParts(v.value, [...filter, { idx, value: variantKey(v) }]);
	            }
	            else {
	                for (const c of cases)
	                    if (filter.every(({ idx, value }) => c.key[idx] === String(value))) {
	                        const last = c.value[c.value.length - 1];
	                        const part = elementToPart(el);
	                        if (lib$1.isLiteral(last) &&
	                            lib$1.isLiteral(part) &&
	                            !lib$1.hasMeta(last) &&
	                            !lib$1.hasMeta(part))
	                            last.value += part.value;
	                        else
	                            c.value.push(part);
	                    }
	            }
	        }
	    }
	    addParts(ast, []);
	    const select = args.map(arg => ({
	        value: expressionToPart(arg.selector),
	        fallback: String(arg.fallback)
	    }));
	    const msg = { type: 'select', select, cases };
	    if (comment)
	        msg.meta = { comment: comment.content };
	    return msg;
	}
	exports.astToMessage = astToMessage;
	});

	var syntax_1 = /*@__PURE__*/getAugmentedNamespace(esm);

	var fluentCompile = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.compileFluent = void 0;


	function compileFluent(src, { id, locale }) {
	    const ast = syntax_1.parse(src, { withSpans: false });
	    const entries = {};
	    let groupComment = '';
	    const resourceComments = [];
	    for (const msg of ast.body) {
	        switch (msg.type) {
	            case 'Message':
	            case 'Term': {
	                const id = msg.type === 'Term' ? `-${msg.id.name}` : msg.id.name;
	                if (msg.value) {
	                    const entry = fluentAstToMessage.astToMessage(msg.value, msg.comment);
	                    if (groupComment) {
	                        if (entry.meta)
	                            entry.meta.group = groupComment;
	                        else
	                            entry.meta = { group: groupComment };
	                    }
	                    entries[id] = entry;
	                }
	                for (const attr of msg.attributes)
	                    entries[`${id}.${attr.id.name}`] = fluentAstToMessage.astToMessage(attr.value, null);
	                break;
	            }
	            case 'GroupComment':
	                groupComment = msg.content;
	                break;
	            case 'ResourceComment':
	                resourceComments.push(msg.content);
	                break;
	        }
	    }
	    const res = { type: 'resource', id, locale, entries };
	    if (resourceComments.length > 0)
	        res.meta = { comment: resourceComments.join('\n\n') };
	    return res;
	}
	exports.compileFluent = compileFluent;
	});

	var moo = createCommonjsModule(function (module) {
	(function(root, factory) {
	  if (module.exports) {
	    module.exports = factory();
	  } else {
	    root.moo = factory();
	  }
	}(commonjsGlobal, function() {

	  var hasOwnProperty = Object.prototype.hasOwnProperty;
	  var toString = Object.prototype.toString;
	  var hasSticky = typeof new RegExp().sticky === 'boolean';

	  /***************************************************************************/

	  function isRegExp(o) { return o && toString.call(o) === '[object RegExp]' }
	  function isObject(o) { return o && typeof o === 'object' && !isRegExp(o) && !Array.isArray(o) }

	  function reEscape(s) {
	    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
	  }
	  function reGroups(s) {
	    var re = new RegExp('|' + s);
	    return re.exec('').length - 1
	  }
	  function reCapture(s) {
	    return '(' + s + ')'
	  }
	  function reUnion(regexps) {
	    if (!regexps.length) return '(?!)'
	    var source =  regexps.map(function(s) {
	      return "(?:" + s + ")"
	    }).join('|');
	    return "(?:" + source + ")"
	  }

	  function regexpOrLiteral(obj) {
	    if (typeof obj === 'string') {
	      return '(?:' + reEscape(obj) + ')'

	    } else if (isRegExp(obj)) {
	      // TODO: consider /u support
	      if (obj.ignoreCase) throw new Error('RegExp /i flag not allowed')
	      if (obj.global) throw new Error('RegExp /g flag is implied')
	      if (obj.sticky) throw new Error('RegExp /y flag is implied')
	      if (obj.multiline) throw new Error('RegExp /m flag is implied')
	      return obj.source

	    } else {
	      throw new Error('Not a pattern: ' + obj)
	    }
	  }

	  function objectToRules(object) {
	    var keys = Object.getOwnPropertyNames(object);
	    var result = [];
	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];
	      var thing = object[key];
	      var rules = [].concat(thing);
	      if (key === 'include') {
	        for (var j = 0; j < rules.length; j++) {
	          result.push({include: rules[j]});
	        }
	        continue
	      }
	      var match = [];
	      rules.forEach(function(rule) {
	        if (isObject(rule)) {
	          if (match.length) result.push(ruleOptions(key, match));
	          result.push(ruleOptions(key, rule));
	          match = [];
	        } else {
	          match.push(rule);
	        }
	      });
	      if (match.length) result.push(ruleOptions(key, match));
	    }
	    return result
	  }

	  function arrayToRules(array) {
	    var result = [];
	    for (var i = 0; i < array.length; i++) {
	      var obj = array[i];
	      if (obj.include) {
	        var include = [].concat(obj.include);
	        for (var j = 0; j < include.length; j++) {
	          result.push({include: include[j]});
	        }
	        continue
	      }
	      if (!obj.type) {
	        throw new Error('Rule has no type: ' + JSON.stringify(obj))
	      }
	      result.push(ruleOptions(obj.type, obj));
	    }
	    return result
	  }

	  function ruleOptions(type, obj) {
	    if (!isObject(obj)) {
	      obj = { match: obj };
	    }
	    if (obj.include) {
	      throw new Error('Matching rules cannot also include states')
	    }

	    // nb. error and fallback imply lineBreaks
	    var options = {
	      defaultType: type,
	      lineBreaks: !!obj.error || !!obj.fallback,
	      pop: false,
	      next: null,
	      push: null,
	      error: false,
	      fallback: false,
	      value: null,
	      type: null,
	      shouldThrow: false,
	    };

	    // Avoid Object.assign(), so we support IE9+
	    for (var key in obj) {
	      if (hasOwnProperty.call(obj, key)) {
	        options[key] = obj[key];
	      }
	    }

	    // type transform cannot be a string
	    if (typeof options.type === 'string' && type !== options.type) {
	      throw new Error("Type transform cannot be a string (type '" + options.type + "' for token '" + type + "')")
	    }

	    // convert to array
	    var match = options.match;
	    options.match = Array.isArray(match) ? match : match ? [match] : [];
	    options.match.sort(function(a, b) {
	      return isRegExp(a) && isRegExp(b) ? 0
	           : isRegExp(b) ? -1 : isRegExp(a) ? +1 : b.length - a.length
	    });
	    return options
	  }

	  function toRules(spec) {
	    return Array.isArray(spec) ? arrayToRules(spec) : objectToRules(spec)
	  }

	  var defaultErrorRule = ruleOptions('error', {lineBreaks: true, shouldThrow: true});
	  function compileRules(rules, hasStates) {
	    var errorRule = null;
	    var fast = Object.create(null);
	    var fastAllowed = true;
	    var unicodeFlag = null;
	    var groups = [];
	    var parts = [];

	    // If there is a fallback rule, then disable fast matching
	    for (var i = 0; i < rules.length; i++) {
	      if (rules[i].fallback) {
	        fastAllowed = false;
	      }
	    }

	    for (var i = 0; i < rules.length; i++) {
	      var options = rules[i];

	      if (options.include) {
	        // all valid inclusions are removed by states() preprocessor
	        throw new Error('Inheritance is not allowed in stateless lexers')
	      }

	      if (options.error || options.fallback) {
	        // errorRule can only be set once
	        if (errorRule) {
	          if (!options.fallback === !errorRule.fallback) {
	            throw new Error("Multiple " + (options.fallback ? "fallback" : "error") + " rules not allowed (for token '" + options.defaultType + "')")
	          } else {
	            throw new Error("fallback and error are mutually exclusive (for token '" + options.defaultType + "')")
	          }
	        }
	        errorRule = options;
	      }

	      var match = options.match.slice();
	      if (fastAllowed) {
	        while (match.length && typeof match[0] === 'string' && match[0].length === 1) {
	          var word = match.shift();
	          fast[word.charCodeAt(0)] = options;
	        }
	      }

	      // Warn about inappropriate state-switching options
	      if (options.pop || options.push || options.next) {
	        if (!hasStates) {
	          throw new Error("State-switching options are not allowed in stateless lexers (for token '" + options.defaultType + "')")
	        }
	        if (options.fallback) {
	          throw new Error("State-switching options are not allowed on fallback tokens (for token '" + options.defaultType + "')")
	        }
	      }

	      // Only rules with a .match are included in the RegExp
	      if (match.length === 0) {
	        continue
	      }
	      fastAllowed = false;

	      groups.push(options);

	      // Check unicode flag is used everywhere or nowhere
	      for (var j = 0; j < match.length; j++) {
	        var obj = match[j];
	        if (!isRegExp(obj)) {
	          continue
	        }

	        if (unicodeFlag === null) {
	          unicodeFlag = obj.unicode;
	        } else if (unicodeFlag !== obj.unicode && options.fallback === false) {
	          throw new Error('If one rule is /u then all must be')
	        }
	      }

	      // convert to RegExp
	      var pat = reUnion(match.map(regexpOrLiteral));

	      // validate
	      var regexp = new RegExp(pat);
	      if (regexp.test("")) {
	        throw new Error("RegExp matches empty string: " + regexp)
	      }
	      var groupCount = reGroups(pat);
	      if (groupCount > 0) {
	        throw new Error("RegExp has capture groups: " + regexp + "\nUse (?: … ) instead")
	      }

	      // try and detect rules matching newlines
	      if (!options.lineBreaks && regexp.test('\n')) {
	        throw new Error('Rule should declare lineBreaks: ' + regexp)
	      }

	      // store regex
	      parts.push(reCapture(pat));
	    }


	    // If there's no fallback rule, use the sticky flag so we only look for
	    // matches at the current index.
	    //
	    // If we don't support the sticky flag, then fake it using an irrefutable
	    // match (i.e. an empty pattern).
	    var fallbackRule = errorRule && errorRule.fallback;
	    var flags = hasSticky && !fallbackRule ? 'ym' : 'gm';
	    var suffix = hasSticky || fallbackRule ? '' : '|';

	    if (unicodeFlag === true) flags += "u";
	    var combined = new RegExp(reUnion(parts) + suffix, flags);
	    return {regexp: combined, groups: groups, fast: fast, error: errorRule || defaultErrorRule}
	  }

	  function compile(rules) {
	    var result = compileRules(toRules(rules));
	    return new Lexer({start: result}, 'start')
	  }

	  function checkStateGroup(g, name, map) {
	    var state = g && (g.push || g.next);
	    if (state && !map[state]) {
	      throw new Error("Missing state '" + state + "' (in token '" + g.defaultType + "' of state '" + name + "')")
	    }
	    if (g && g.pop && +g.pop !== 1) {
	      throw new Error("pop must be 1 (in token '" + g.defaultType + "' of state '" + name + "')")
	    }
	  }
	  function compileStates(states, start) {
	    var all = states.$all ? toRules(states.$all) : [];
	    delete states.$all;

	    var keys = Object.getOwnPropertyNames(states);
	    if (!start) start = keys[0];

	    var ruleMap = Object.create(null);
	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];
	      ruleMap[key] = toRules(states[key]).concat(all);
	    }
	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];
	      var rules = ruleMap[key];
	      var included = Object.create(null);
	      for (var j = 0; j < rules.length; j++) {
	        var rule = rules[j];
	        if (!rule.include) continue
	        var splice = [j, 1];
	        if (rule.include !== key && !included[rule.include]) {
	          included[rule.include] = true;
	          var newRules = ruleMap[rule.include];
	          if (!newRules) {
	            throw new Error("Cannot include nonexistent state '" + rule.include + "' (in state '" + key + "')")
	          }
	          for (var k = 0; k < newRules.length; k++) {
	            var newRule = newRules[k];
	            if (rules.indexOf(newRule) !== -1) continue
	            splice.push(newRule);
	          }
	        }
	        rules.splice.apply(rules, splice);
	        j--;
	      }
	    }

	    var map = Object.create(null);
	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];
	      map[key] = compileRules(ruleMap[key], true);
	    }

	    for (var i = 0; i < keys.length; i++) {
	      var name = keys[i];
	      var state = map[name];
	      var groups = state.groups;
	      for (var j = 0; j < groups.length; j++) {
	        checkStateGroup(groups[j], name, map);
	      }
	      var fastKeys = Object.getOwnPropertyNames(state.fast);
	      for (var j = 0; j < fastKeys.length; j++) {
	        checkStateGroup(state.fast[fastKeys[j]], name, map);
	      }
	    }

	    return new Lexer(map, start)
	  }

	  function keywordTransform(map) {
	    var reverseMap = Object.create(null);
	    var byLength = Object.create(null);
	    var types = Object.getOwnPropertyNames(map);
	    for (var i = 0; i < types.length; i++) {
	      var tokenType = types[i];
	      var item = map[tokenType];
	      var keywordList = Array.isArray(item) ? item : [item];
	      keywordList.forEach(function(keyword) {
	        (byLength[keyword.length] = byLength[keyword.length] || []).push(keyword);
	        if (typeof keyword !== 'string') {
	          throw new Error("keyword must be string (in keyword '" + tokenType + "')")
	        }
	        reverseMap[keyword] = tokenType;
	      });
	    }

	    // fast string lookup
	    // https://jsperf.com/string-lookups
	    function str(x) { return JSON.stringify(x) }
	    var source = '';
	    source += 'switch (value.length) {\n';
	    for (var length in byLength) {
	      var keywords = byLength[length];
	      source += 'case ' + length + ':\n';
	      source += 'switch (value) {\n';
	      keywords.forEach(function(keyword) {
	        var tokenType = reverseMap[keyword];
	        source += 'case ' + str(keyword) + ': return ' + str(tokenType) + '\n';
	      });
	      source += '}\n';
	    }
	    source += '}\n';
	    return Function('value', source) // type
	  }

	  /***************************************************************************/

	  var Lexer = function(states, state) {
	    this.startState = state;
	    this.states = states;
	    this.buffer = '';
	    this.stack = [];
	    this.reset();
	  };

	  Lexer.prototype.reset = function(data, info) {
	    this.buffer = data || '';
	    this.index = 0;
	    this.line = info ? info.line : 1;
	    this.col = info ? info.col : 1;
	    this.queuedToken = info ? info.queuedToken : null;
	    this.queuedThrow = info ? info.queuedThrow : null;
	    this.setState(info ? info.state : this.startState);
	    this.stack = info && info.stack ? info.stack.slice() : [];
	    return this
	  };

	  Lexer.prototype.save = function() {
	    return {
	      line: this.line,
	      col: this.col,
	      state: this.state,
	      stack: this.stack.slice(),
	      queuedToken: this.queuedToken,
	      queuedThrow: this.queuedThrow,
	    }
	  };

	  Lexer.prototype.setState = function(state) {
	    if (!state || this.state === state) return
	    this.state = state;
	    var info = this.states[state];
	    this.groups = info.groups;
	    this.error = info.error;
	    this.re = info.regexp;
	    this.fast = info.fast;
	  };

	  Lexer.prototype.popState = function() {
	    this.setState(this.stack.pop());
	  };

	  Lexer.prototype.pushState = function(state) {
	    this.stack.push(this.state);
	    this.setState(state);
	  };

	  var eat = hasSticky ? function(re, buffer) { // assume re is /y
	    return re.exec(buffer)
	  } : function(re, buffer) { // assume re is /g
	    var match = re.exec(buffer);
	    // will always match, since we used the |(?:) trick
	    if (match[0].length === 0) {
	      return null
	    }
	    return match
	  };

	  Lexer.prototype._getGroup = function(match) {
	    var groupCount = this.groups.length;
	    for (var i = 0; i < groupCount; i++) {
	      if (match[i + 1] !== undefined) {
	        return this.groups[i]
	      }
	    }
	    throw new Error('Cannot find token type for matched text')
	  };

	  function tokenToString() {
	    return this.value
	  }

	  Lexer.prototype.next = function() {
	    var index = this.index;

	    // If a fallback token matched, we don't need to re-run the RegExp
	    if (this.queuedGroup) {
	      var token = this._token(this.queuedGroup, this.queuedText, index);
	      this.queuedGroup = null;
	      this.queuedText = "";
	      return token
	    }

	    var buffer = this.buffer;
	    if (index === buffer.length) {
	      return // EOF
	    }

	    // Fast matching for single characters
	    var group = this.fast[buffer.charCodeAt(index)];
	    if (group) {
	      return this._token(group, buffer.charAt(index), index)
	    }

	    // Execute RegExp
	    var re = this.re;
	    re.lastIndex = index;
	    var match = eat(re, buffer);

	    // Error tokens match the remaining buffer
	    var error = this.error;
	    if (match == null) {
	      return this._token(error, buffer.slice(index, buffer.length), index)
	    }

	    var group = this._getGroup(match);
	    var text = match[0];

	    if (error.fallback && match.index !== index) {
	      this.queuedGroup = group;
	      this.queuedText = text;

	      // Fallback tokens contain the unmatched portion of the buffer
	      return this._token(error, buffer.slice(index, match.index), index)
	    }

	    return this._token(group, text, index)
	  };

	  Lexer.prototype._token = function(group, text, offset) {
	    // count line breaks
	    var lineBreaks = 0;
	    if (group.lineBreaks) {
	      var matchNL = /\n/g;
	      var nl = 1;
	      if (text === '\n') {
	        lineBreaks = 1;
	      } else {
	        while (matchNL.exec(text)) { lineBreaks++; nl = matchNL.lastIndex; }
	      }
	    }

	    var token = {
	      type: (typeof group.type === 'function' && group.type(text)) || group.defaultType,
	      value: typeof group.value === 'function' ? group.value(text) : text,
	      text: text,
	      toString: tokenToString,
	      offset: offset,
	      lineBreaks: lineBreaks,
	      line: this.line,
	      col: this.col,
	    };
	    // nb. adding more props to token object will make V8 sad!

	    var size = text.length;
	    this.index += size;
	    this.line += lineBreaks;
	    if (lineBreaks !== 0) {
	      this.col = size - nl + 1;
	    } else {
	      this.col += size;
	    }

	    // throw, if no rule with {error: true}
	    if (group.shouldThrow) {
	      throw new Error(this.formatError(token, "invalid syntax"))
	    }

	    if (group.pop) this.popState();
	    else if (group.push) this.pushState(group.push);
	    else if (group.next) this.setState(group.next);

	    return token
	  };

	  if (typeof Symbol !== 'undefined' && Symbol.iterator) {
	    var LexerIterator = function(lexer) {
	      this.lexer = lexer;
	    };

	    LexerIterator.prototype.next = function() {
	      var token = this.lexer.next();
	      return {value: token, done: !token}
	    };

	    LexerIterator.prototype[Symbol.iterator] = function() {
	      return this
	    };

	    Lexer.prototype[Symbol.iterator] = function() {
	      return new LexerIterator(this)
	    };
	  }

	  Lexer.prototype.formatError = function(token, message) {
	    if (token == null) {
	      // An undefined token indicates EOF
	      var text = this.buffer.slice(this.index);
	      var token = {
	        text: text,
	        offset: this.index,
	        lineBreaks: text.indexOf('\n') === -1 ? 0 : 1,
	        line: this.line,
	        col: this.col,
	      };
	    }
	    var start = Math.max(0, token.offset - token.col + 1);
	    var eol = token.lineBreaks ? token.text.indexOf('\n') : token.text.length;
	    var firstLine = this.buffer.substring(start, token.offset + eol);
	    message += " at line " + token.line + " col " + token.col + ":\n\n";
	    message += "  " + firstLine + "\n";
	    message += "  " + Array(token.col).join(" ") + "^";
	    return message
	  };

	  Lexer.prototype.clone = function() {
	    return new Lexer(this.states, this.state)
	  };

	  Lexer.prototype.has = function(tokenType) {
	    return true
	  };


	  return {
	    compile: compile,
	    states: compileStates,
	    error: Object.freeze({error: true}),
	    fallback: Object.freeze({fallback: true}),
	    keywords: keywordTransform,
	  }

	}));
	});

	var lexer = createCommonjsModule(function (module, exports) {
	var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.lexer = exports.states = void 0;
	const moo_1 = __importDefault(moo);
	exports.states = {
	    body: {
	        doubleapos: { match: "''", value: () => "'" },
	        quoted: {
	            lineBreaks: true,
	            match: /'[{}#](?:[^]*?[^'])?'(?!')/u,
	            value: src => src.slice(1, -1).replace(/''/g, "'")
	        },
	        argument: {
	            lineBreaks: true,
	            match: /\{\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*/u,
	            push: 'arg',
	            value: src => src.substring(1).trim()
	        },
	        octothorpe: '#',
	        end: { match: '}', pop: 1 },
	        content: { lineBreaks: true, match: /[^][^{}#']*/u }
	    },
	    arg: {
	        select: {
	            lineBreaks: true,
	            match: /,\s*(?:plural|select|selectordinal)\s*,\s*/u,
	            next: 'select',
	            value: src => src.split(',')[1].trim()
	        },
	        'func-args': {
	            lineBreaks: true,
	            match: /,\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*,/u,
	            next: 'body',
	            value: src => src.split(',')[1].trim()
	        },
	        'func-simple': {
	            lineBreaks: true,
	            match: /,\s*[^\p{Pat_Syn}\p{Pat_WS}]+\s*/u,
	            value: src => src.substring(1).trim()
	        },
	        end: { match: '}', pop: 1 }
	    },
	    select: {
	        offset: {
	            lineBreaks: true,
	            match: /\s*offset\s*:\s*\d+\s*/u,
	            value: src => src.split(':')[1].trim()
	        },
	        case: {
	            lineBreaks: true,
	            match: /\s*(?:=\d+|[^\p{Pat_Syn}\p{Pat_WS}]+)\s*\{/u,
	            push: 'body',
	            value: src => src.substring(0, src.indexOf('{')).trim()
	        },
	        end: { match: /\s*\}/u, pop: 1 }
	    }
	};
	exports.lexer = moo_1.default.states(exports.states);
	});

	var parser = createCommonjsModule(function (module, exports) {
	/**
	 * An AST parser for ICU MessageFormat strings
	 *
	 * @packageDocumentation
	 * @example
	 * ```
	 * import { parse } from '@messageformat/parser
	 *
	 * parse('So {wow}.')
	 * [ { type: 'content', value: 'So ' },
	 *   { type: 'argument', arg: 'wow' },
	 *   { type: 'content', value: '.' } ]
	 *
	 *
	 * parse('Such { thing }. { count, selectordinal, one {First} two {Second}' +
	 *       '                  few {Third} other {#th} } word.')
	 * [ { type: 'content', value: 'Such ' },
	 *   { type: 'argument', arg: 'thing' },
	 *   { type: 'content', value: '. ' },
	 *   { type: 'selectordinal',
	 *     arg: 'count',
	 *     cases: [
	 *       { key: 'one', tokens: [ { type: 'content', value: 'First' } ] },
	 *       { key: 'two', tokens: [ { type: 'content', value: 'Second' } ] },
	 *       { key: 'few', tokens: [ { type: 'content', value: 'Third' } ] },
	 *       { key: 'other',
	 *         tokens: [ { type: 'octothorpe' }, { type: 'content', value: 'th' } ] }
	 *     ] },
	 *   { type: 'content', value: ' word.' } ]
	 *
	 *
	 * parse('Many{type,select,plural{ numbers}selectordinal{ counting}' +
	 *                          'select{ choices}other{ some {type}}}.')
	 * [ { type: 'content', value: 'Many' },
	 *   { type: 'select',
	 *     arg: 'type',
	 *     cases: [
	 *       { key: 'plural', tokens: [ { type: 'content', value: 'numbers' } ] },
	 *       { key: 'selectordinal', tokens: [ { type: 'content', value: 'counting' } ] },
	 *       { key: 'select', tokens: [ { type: 'content', value: 'choices' } ] },
	 *       { key: 'other',
	 *         tokens: [ { type: 'content', value: 'some ' }, { type: 'argument', arg: 'type' } ] }
	 *     ] },
	 *   { type: 'content', value: '.' } ]
	 *
	 *
	 * parse('{Such compliance')
	 * // ParseError: invalid syntax at line 1 col 7:
	 * //
	 * //  {Such compliance
	 * //        ^
	 *
	 *
	 * const msg = '{words, plural, zero{No words} one{One word} other{# words}}'
	 * parse(msg)
	 * [ { type: 'plural',
	 *     arg: 'words',
	 *     cases: [
	 *       { key: 'zero', tokens: [ { type: 'content', value: 'No words' } ] },
	 *       { key: 'one', tokens: [ { type: 'content', value: 'One word' } ] },
	 *       { key: 'other',
	 *         tokens: [ { type: 'octothorpe' }, { type: 'content', value: ' words' } ] }
	 *     ] } ]
	 *
	 *
	 * parse(msg, { cardinal: [ 'one', 'other' ], ordinal: [ 'one', 'two', 'few', 'other' ] })
	 * // ParseError: The plural case zero is not valid in this locale at line 1 col 17:
	 * //
	 * //   {words, plural, zero{
	 * //                   ^
	 * ```
	 */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parse = exports.ParseError = void 0;

	const getContext = (lt) => ({
	    offset: lt.offset,
	    line: lt.line,
	    col: lt.col,
	    text: lt.text,
	    lineBreaks: lt.lineBreaks
	});
	const isSelectType = (type) => type === 'plural' || type === 'select' || type === 'selectordinal';
	function strictArgStyleParam(lt, param) {
	    let value = '';
	    let text = '';
	    for (const p of param) {
	        const pText = p.ctx.text;
	        text += pText;
	        switch (p.type) {
	            case 'content':
	                value += p.value;
	                break;
	            case 'argument':
	            case 'function':
	            case 'octothorpe':
	                value += pText;
	                break;
	            default:
	                throw new ParseError(lt, `Unsupported part in strict mode function arg style: ${pText}`);
	        }
	    }
	    const c = {
	        type: 'content',
	        value: value.trim(),
	        ctx: Object.assign({}, param[0].ctx, { text })
	    };
	    return [c];
	}
	const strictArgTypes = [
	    'number',
	    'date',
	    'time',
	    'spellout',
	    'ordinal',
	    'duration'
	];
	const defaultPluralKeys = ['zero', 'one', 'two', 'few', 'many', 'other'];
	/**
	 * Thrown by {@link parse} on error
	 *
	 * @public
	 */
	class ParseError extends Error {
	    /** @internal */
	    constructor(lt, msg) {
	        super(lexer.lexer.formatError(lt, msg));
	    }
	}
	exports.ParseError = ParseError;
	class Parser {
	    constructor(src, opt) {
	        this.lexer = lexer.lexer.reset(src);
	        this.cardinalKeys = (opt && opt.cardinal) || defaultPluralKeys;
	        this.ordinalKeys = (opt && opt.ordinal) || defaultPluralKeys;
	        this.strict = (opt && opt.strict) || false;
	    }
	    parse() {
	        return this.parseBody(false, true);
	    }
	    checkSelectKey(lt, type, key) {
	        if (key[0] === '=') {
	            if (type === 'select')
	                throw new ParseError(lt, `The case ${key} is not valid with select`);
	        }
	        else if (type !== 'select') {
	            const keys = type === 'plural' ? this.cardinalKeys : this.ordinalKeys;
	            if (keys.length > 0 && !keys.includes(key)) {
	                const msg = `The ${type} case ${key} is not valid in this locale`;
	                throw new ParseError(lt, msg);
	            }
	        }
	    }
	    parseSelect({ value: arg }, inPlural, ctx, type) {
	        const sel = { type, arg, cases: [], ctx };
	        if (type === 'plural' || type === 'selectordinal')
	            inPlural = true;
	        else if (this.strict)
	            inPlural = false;
	        for (const lt of this.lexer) {
	            switch (lt.type) {
	                case 'offset':
	                    if (type === 'select')
	                        throw new ParseError(lt, 'Unexpected plural offset for select');
	                    if (sel.cases.length > 0)
	                        throw new ParseError(lt, 'Plural offset must be set before cases');
	                    sel.pluralOffset = Number(lt.value);
	                    ctx.text += lt.text;
	                    ctx.lineBreaks += lt.lineBreaks;
	                    break;
	                case 'case': {
	                    this.checkSelectKey(lt, type, lt.value);
	                    sel.cases.push({
	                        key: lt.value,
	                        tokens: this.parseBody(inPlural),
	                        ctx: getContext(lt)
	                    });
	                    break;
	                }
	                case 'end':
	                    return sel;
	                /* istanbul ignore next: never happens */
	                default:
	                    throw new ParseError(lt, `Unexpected lexer token: ${lt.type}`);
	            }
	        }
	        throw new ParseError(null, 'Unexpected message end');
	    }
	    parseArgToken(lt, inPlural) {
	        const ctx = getContext(lt);
	        const argType = this.lexer.next();
	        if (!argType)
	            throw new ParseError(null, 'Unexpected message end');
	        ctx.text += argType.text;
	        ctx.lineBreaks += argType.lineBreaks;
	        if (this.strict &&
	            (argType.type === 'func-simple' || argType.type === 'func-args') &&
	            !strictArgTypes.includes(argType.value)) {
	            const msg = `Invalid strict mode function arg type: ${argType.value}`;
	            throw new ParseError(lt, msg);
	        }
	        switch (argType.type) {
	            case 'end':
	                return { type: 'argument', arg: lt.value, ctx };
	            case 'func-simple': {
	                const end = this.lexer.next();
	                if (!end)
	                    throw new ParseError(null, 'Unexpected message end');
	                /* istanbul ignore if: never happens */
	                if (end.type !== 'end')
	                    throw new ParseError(end, `Unexpected lexer token: ${end.type}`);
	                ctx.text += end.text;
	                if (isSelectType(argType.value.toLowerCase()))
	                    throw new ParseError(argType, `Invalid type identifier: ${argType.value}`);
	                return {
	                    type: 'function',
	                    arg: lt.value,
	                    key: argType.value,
	                    ctx
	                };
	            }
	            case 'func-args': {
	                if (isSelectType(argType.value.toLowerCase())) {
	                    const msg = `Invalid type identifier: ${argType.value}`;
	                    throw new ParseError(argType, msg);
	                }
	                let param = this.parseBody(this.strict ? false : inPlural);
	                if (this.strict && param.length > 0)
	                    param = strictArgStyleParam(lt, param);
	                return {
	                    type: 'function',
	                    arg: lt.value,
	                    key: argType.value,
	                    param,
	                    ctx
	                };
	            }
	            case 'select':
	                /* istanbul ignore else: never happens */
	                if (isSelectType(argType.value))
	                    return this.parseSelect(lt, inPlural, ctx, argType.value);
	                else
	                    throw new ParseError(argType, `Unexpected select type ${argType.value}`);
	            /* istanbul ignore next: never happens */
	            default:
	                throw new ParseError(argType, `Unexpected lexer token: ${argType.type}`);
	        }
	    }
	    parseBody(inPlural, atRoot) {
	        const tokens = [];
	        let content = null;
	        for (const lt of this.lexer) {
	            if (lt.type === 'argument') {
	                if (content)
	                    content = null;
	                tokens.push(this.parseArgToken(lt, inPlural));
	            }
	            else if (lt.type === 'octothorpe' && inPlural) {
	                if (content)
	                    content = null;
	                tokens.push({ type: 'octothorpe', ctx: getContext(lt) });
	            }
	            else if (lt.type === 'end' && !atRoot) {
	                return tokens;
	            }
	            else {
	                let value = lt.value;
	                if (!inPlural && lt.type === 'quoted' && value[0] === '#') {
	                    if (value.includes('{')) {
	                        const errMsg = `Unsupported escape pattern: ${value}`;
	                        throw new ParseError(lt, errMsg);
	                    }
	                    value = lt.text;
	                }
	                if (content) {
	                    content.value += value;
	                    content.ctx.text += lt.text;
	                    content.ctx.lineBreaks += lt.lineBreaks;
	                }
	                else {
	                    content = { type: 'content', value, ctx: getContext(lt) };
	                    tokens.push(content);
	                }
	            }
	        }
	        if (atRoot)
	            return tokens;
	        throw new ParseError(null, 'Unexpected message end');
	    }
	}
	/**
	 * Parse an input string into an array of tokens
	 *
	 * @public
	 * @remarks
	 * The parser only supports the default `DOUBLE_OPTIONAL`
	 * {@link http://www.icu-project.org/apiref/icu4c/messagepattern_8h.html#af6e0757e0eb81c980b01ee5d68a9978b | apostrophe mode}.
	 */
	function parse(src, options = {}) {
	    const parser = new Parser(src, options);
	    return parser.parse();
	}
	exports.parse = parse;
	});

	var pluralCategories = createCommonjsModule(function (module, exports) {
	var z = "zero", o = "one", t = "two", f = "few", m = "many", x = "other";
	var a = {cardinal:[o,x],ordinal:[x]};
	var b = {cardinal:[x],ordinal:[x]};
	var c = {cardinal:[o,f,m,x],ordinal:[x]};
	var d = {cardinal:[o,x],ordinal:[o,x]};
	var e = {cardinal:[o,t,x],ordinal:[x]};

	(function (root, pluralCategories) {
	  Object.defineProperty(pluralCategories, '__esModule', { value: true });
	  {
	    module.exports = pluralCategories;
	  }
	}(commonjsGlobal, {
	_in: b,
	af: a,
	ak: a,
	am: a,
	an: a,
	ar: {cardinal:[z,o,t,f,m,x],ordinal:[x]},
	ars: {cardinal:[z,o,t,f,m,x],ordinal:[x]},
	as: {cardinal:[o,x],ordinal:[o,t,f,m,x]},
	asa: a,
	ast: a,
	az: {cardinal:[o,x],ordinal:[o,f,m,x]},
	be: {cardinal:[o,f,m,x],ordinal:[f,x]},
	bem: a,
	bez: a,
	bg: a,
	bho: a,
	bm: b,
	bn: {cardinal:[o,x],ordinal:[o,t,f,m,x]},
	bo: b,
	br: {cardinal:[o,t,f,m,x],ordinal:[x]},
	brx: a,
	bs: {cardinal:[o,f,x],ordinal:[x]},
	ca: {cardinal:[o,x],ordinal:[o,t,f,x]},
	ce: a,
	ceb: a,
	cgg: a,
	chr: a,
	ckb: a,
	cs: c,
	cy: {cardinal:[z,o,t,f,m,x],ordinal:[z,o,t,f,m,x]},
	da: a,
	de: a,
	dsb: {cardinal:[o,t,f,x],ordinal:[x]},
	dv: a,
	dz: b,
	ee: a,
	el: a,
	en: {cardinal:[o,x],ordinal:[o,t,f,x]},
	eo: a,
	es: a,
	et: a,
	eu: a,
	fa: a,
	ff: a,
	fi: a,
	fil: d,
	fo: a,
	fr: d,
	fur: a,
	fy: a,
	ga: {cardinal:[o,t,f,m,x],ordinal:[o,x]},
	gd: {cardinal:[o,t,f,x],ordinal:[o,t,f,x]},
	gl: a,
	gsw: a,
	gu: {cardinal:[o,x],ordinal:[o,t,f,m,x]},
	guw: a,
	gv: {cardinal:[o,t,f,m,x],ordinal:[x]},
	ha: a,
	haw: a,
	he: {cardinal:[o,t,m,x],ordinal:[x]},
	hi: {cardinal:[o,x],ordinal:[o,t,f,m,x]},
	hr: {cardinal:[o,f,x],ordinal:[x]},
	hsb: {cardinal:[o,t,f,x],ordinal:[x]},
	hu: d,
	hy: d,
	ia: a,
	id: b,
	ig: b,
	ii: b,
	io: a,
	is: a,
	it: {cardinal:[o,x],ordinal:[m,x]},
	iu: e,
	iw: {cardinal:[o,t,m,x],ordinal:[x]},
	ja: b,
	jbo: b,
	jgo: a,
	ji: a,
	jmc: a,
	jv: b,
	jw: b,
	ka: {cardinal:[o,x],ordinal:[o,m,x]},
	kab: a,
	kaj: a,
	kcg: a,
	kde: b,
	kea: b,
	kk: {cardinal:[o,x],ordinal:[m,x]},
	kkj: a,
	kl: a,
	km: b,
	kn: a,
	ko: b,
	ks: a,
	ksb: a,
	ksh: {cardinal:[z,o,x],ordinal:[x]},
	ku: a,
	kw: {cardinal:[z,o,t,f,m,x],ordinal:[o,m,x]},
	ky: a,
	lag: {cardinal:[z,o,x],ordinal:[x]},
	lb: a,
	lg: a,
	lkt: b,
	ln: a,
	lo: {cardinal:[x],ordinal:[o,x]},
	lt: c,
	lv: {cardinal:[z,o,x],ordinal:[x]},
	mas: a,
	mg: a,
	mgo: a,
	mk: {cardinal:[o,x],ordinal:[o,t,m,x]},
	ml: a,
	mn: a,
	mo: {cardinal:[o,f,x],ordinal:[o,x]},
	mr: {cardinal:[o,x],ordinal:[o,t,f,x]},
	ms: {cardinal:[x],ordinal:[o,x]},
	mt: c,
	my: b,
	nah: a,
	naq: e,
	nb: a,
	nd: a,
	ne: d,
	nl: a,
	nn: a,
	nnh: a,
	no: a,
	nqo: b,
	nr: a,
	nso: a,
	ny: a,
	nyn: a,
	om: a,
	or: {cardinal:[o,x],ordinal:[o,t,f,m,x]},
	os: a,
	osa: b,
	pa: a,
	pap: a,
	pl: c,
	prg: {cardinal:[z,o,x],ordinal:[x]},
	ps: a,
	pt: a,
	pt_PT: a,
	rm: a,
	ro: {cardinal:[o,f,x],ordinal:[o,x]},
	rof: a,
	root: b,
	ru: c,
	rwk: a,
	sah: b,
	saq: a,
	sc: {cardinal:[o,x],ordinal:[m,x]},
	scn: {cardinal:[o,x],ordinal:[m,x]},
	sd: a,
	sdh: a,
	se: e,
	seh: a,
	ses: b,
	sg: b,
	sh: {cardinal:[o,f,x],ordinal:[x]},
	shi: {cardinal:[o,f,x],ordinal:[x]},
	si: a,
	sk: c,
	sl: {cardinal:[o,t,f,x],ordinal:[x]},
	sma: e,
	smi: e,
	smj: e,
	smn: e,
	sms: e,
	sn: a,
	so: a,
	sq: {cardinal:[o,x],ordinal:[o,m,x]},
	sr: {cardinal:[o,f,x],ordinal:[x]},
	ss: a,
	ssy: a,
	st: a,
	su: b,
	sv: d,
	sw: a,
	syr: a,
	ta: a,
	te: a,
	teo: a,
	th: b,
	ti: a,
	tig: a,
	tk: {cardinal:[o,x],ordinal:[f,x]},
	tl: d,
	tn: a,
	to: b,
	tr: a,
	ts: a,
	tzm: a,
	ug: a,
	uk: {cardinal:[o,f,m,x],ordinal:[f,x]},
	ur: a,
	uz: a,
	ve: a,
	vi: {cardinal:[x],ordinal:[o,x]},
	vo: a,
	vun: a,
	wa: a,
	wae: a,
	wo: b,
	xh: a,
	xog: a,
	yi: a,
	yo: b,
	yue: b,
	zh: b,
	zu: a
	}));
	});

	var mf1AstToMessage = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.astToMessage = void 0;

	const isAstSelect = (token) => token.type === 'plural' ||
	    token.type === 'select' ||
	    token.type === 'selectordinal';
	const asPluralKey = (key) => /^=\d+$/.test(key) ? Number(key.substring(1)) : key;
	function asSelectArg(sel) {
	    const isPlural = sel.type !== 'select';
	    const keys = sel.cases.map(c => (isPlural ? asPluralKey(c.key) : c.key));
	    const arg = { type: sel.type, arg: sel.arg, keys };
	    if ('pluralOffset' in sel)
	        arg.pluralOffset = sel.pluralOffset;
	    return arg;
	}
	const equalSelectArgs = (a) => (b) => a.arg === b.arg && a.pluralOffset === b.pluralOffset && a.type === b.type;
	function findSelectArgs(tokens) {
	    const args = [];
	    const add = (arg) => {
	        const prev = args.find(equalSelectArgs(arg));
	        if (prev)
	            for (const key of arg.keys)
	                prev.keys.push(key);
	        else
	            args.push(arg);
	    };
	    for (const token of tokens)
	        if (isAstSelect(token)) {
	            add(asSelectArg(token));
	            for (const c of token.cases)
	                for (const arg of findSelectArgs(c.tokens))
	                    add(arg);
	        }
	    return args;
	}
	function tokenToPart(token, pluralArg, pluralOffset) {
	    switch (token.type) {
	        case 'content':
	            return { type: 'literal', value: token.value };
	        case 'argument':
	            return {
	                type: 'variable',
	                var_path: [{ type: 'literal', value: token.arg }]
	            };
	        case 'function': {
	            const fn = {
	                type: 'function',
	                func: token.key,
	                args: [
	                    {
	                        type: 'variable',
	                        var_path: [{ type: 'literal', value: token.arg }]
	                    }
	                ]
	            };
	            if (token.param && token.param.length > 0) {
	                let value = '';
	                for (const pt of token.param) {
	                    if (pt.type === 'content')
	                        value += pt.value;
	                    else
	                        throw new Error(`Unsupported param type: ${pt.type}`);
	                }
	                fn.options = { param: { type: 'literal', value } };
	            }
	            return fn;
	        }
	        case 'octothorpe': {
	            if (!pluralArg)
	                return { type: 'literal', value: '#' };
	            const fn = {
	                type: 'function',
	                func: 'number',
	                args: [
	                    {
	                        type: 'variable',
	                        var_path: [{ type: 'literal', value: pluralArg }]
	                    }
	                ]
	            };
	            if (pluralOffset)
	                fn.options = {
	                    pluralOffset: { type: 'literal', value: String(pluralOffset) }
	                };
	            return fn;
	        }
	        /* istanbul ignore next - never happens */
	        default:
	            throw new Error(`Unsupported token type: ${token.type}`);
	    }
	}
	function argToPart({ arg, pluralOffset, type }) {
	    const argVar = {
	        type: 'variable',
	        var_path: [{ type: 'literal', value: arg }]
	    };
	    if (type === 'select')
	        return argVar;
	    const fn = { type: 'function', func: 'number', args: [argVar] };
	    const po = pluralOffset
	        ? { type: 'literal', value: String(pluralOffset) }
	        : null;
	    const oo = type === 'selectordinal'
	        ? { type: 'literal', value: 'ordinal' }
	        : null;
	    if (po && oo)
	        fn.options = { pluralOffset: po, type: oo };
	    else if (po)
	        fn.options = { pluralOffset: po };
	    else if (oo)
	        fn.options = { type: oo };
	    return fn;
	}
	/**
	 * Converts the `@messageformat/parser` AST representation of a
	 * MessageFormat 1 message into the corresponding MessageFormat 2
	 * data model.
	 *
	 * If the source message contains any inner selectors, they will be
	 * lifted into a single top-level selector.
	 *
	 * In addition to `number` and other default MF1 formatters, a
	 * `plural` runtime function is expected, accepting these options:
	 * ```ts
	 * {
	 *   pluralOffset?: number
	 *   type: 'cardinal' | 'ordinal' = 'cardinal'
	 * }
	 * ```
	 *
	 * Only literal values are supported in formatter parameters. Any
	 * such value will be passed in as an option `{ param: string }`.
	 */
	function astToMessage(ast) {
	    const args = findSelectArgs(ast);
	    if (args.length === 0)
	        return {
	            type: 'message',
	            value: ast.map(token => tokenToPart(token, null, null))
	        };
	    // First determine the keys for all cases, with empty values
	    let keys = [];
	    for (let i = 0; i < args.length; ++i) {
	        const kk = Array.from(new Set(args[i].keys));
	        kk.sort((a, b) => {
	            if (typeof a === 'number' || b === 'other')
	                return -1;
	            if (typeof b === 'number' || a === 'other')
	                return 1;
	            return 0;
	        });
	        if (i === 0)
	            keys = kk.map(key => [key]);
	        else
	            for (let i = keys.length - 1; i >= 0; --i)
	                keys.splice(i, 1, ...kk.map(key => [...keys[i], key]));
	    }
	    const cases = keys.map(key => ({
	        key: key.map(k => String(k)),
	        value: []
	    }));
	    /**
	     * This reads `args` and modifies `cases`
	     *
	     * @param pluralArg - Required by # octothorpes
	     * @param filter - Selects which cases we're adding to
	     */
	    function addParts(tokens, pluralArg, pluralOffset, filter) {
	        for (const token of tokens) {
	            if (isAstSelect(token)) {
	                const isPlural = token.type !== 'select';
	                const pa = isPlural ? token.arg : pluralArg;
	                const po = isPlural ? token.pluralOffset || null : pluralOffset;
	                const idx = args.findIndex(equalSelectArgs(token));
	                for (const c of token.cases) {
	                    const value = isPlural ? asPluralKey(c.key) : c.key;
	                    addParts(c.tokens, pa, po, [...filter, { idx, value }]);
	                }
	            }
	            else {
	                for (const c of cases)
	                    if (filter.every(({ idx, value }) => c.key[idx] === String(value))) {
	                        const last = c.value[c.value.length - 1];
	                        const part = tokenToPart(token, pluralArg, pluralOffset);
	                        if (lib$1.isLiteral(last) &&
	                            lib$1.isLiteral(part) &&
	                            !lib$1.hasMeta(last) &&
	                            !lib$1.hasMeta(part)) {
	                            last.value += part.value;
	                        }
	                        else
	                            c.value.push(part);
	                    }
	            }
	        }
	    }
	    addParts(ast, null, null, []);
	    const select = args.map(arg => ({ value: argToPart(arg) }));
	    return { type: 'select', select, cases };
	}
	exports.astToMessage = astToMessage;
	});

	var mf1Compile = createCommonjsModule(function (module, exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (commonjsGlobal && commonjsGlobal.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (commonjsGlobal && commonjsGlobal.__importStar) || function (mod) {
	    if (mod && mod.__esModule) return mod;
	    var result = {};
	    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
	    __setModuleDefault(result, mod);
	    return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.compileMF1 = void 0;

	const PluralCategories = __importStar(pluralCategories);

	const isPluralId = (id) => id in PluralCategories;
	function normalize(locale) {
	    if (typeof locale !== 'string' || locale.length < 2)
	        throw new Error(`Invalid language tag: ${locale}`);
	    // The only locale for which anything but the primary subtag matters is
	    // Portuguese as spoken in Portugal.
	    if (locale.startsWith('pt-PT'))
	        return 'pt_PT';
	    const m = locale.match(/.+?(?=[-_])/);
	    return m ? m[0] : locale;
	}
	function compileMessageGroup(src, options) {
	    const entries = {};
	    for (const [key, value] of Object.entries(src)) {
	        entries[key] =
	            typeof value === 'string'
	                ? mf1AstToMessage.astToMessage(parser.parse(value, options))
	                : compileMessageGroup(value, options);
	    }
	    return { type: 'group', entries };
	}
	function compileMF1(src, { id, locale, strict }) {
	    const lc = normalize(locale);
	    if (!isPluralId(lc))
	        throw new Error(`Unsupported locale: ${locale}`);
	    const { cardinal, ordinal } = PluralCategories[lc];
	    const { entries } = compileMessageGroup(src, { cardinal, ordinal, strict });
	    return { type: 'resource', id, locale, entries };
	}
	exports.compileMF1 = compileMF1;
	});

	var lib = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.compileMF1 = exports.compileFluent = void 0;

	Object.defineProperty(exports, "compileFluent", { enumerable: true, get: function () { return fluentCompile.compileFluent; } });

	Object.defineProperty(exports, "compileMF1", { enumerable: true, get: function () { return mf1Compile.compileMF1; } });
	});

	var index = /*@__PURE__*/getDefaultExportFromCjs(lib);

	return index;

})));
