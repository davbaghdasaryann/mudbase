//
// Adopted from cdigit: https://github.com/LiosK/cdigit
//

/**
 * cdigit
 *
 * @copyright 2018-2023 LiosK
 * @license (MIT OR Apache-2.0)
 */

/** Common interface for check digit algorithm implementations. */
interface CdigitAlgo {
    /** `cdigit` name of the algorithm */
    readonly name: string;

    /** Human-readable name of the algorithm */
    readonly longName: string;

    /**
     * Generates the protected string from the argument using the algorithm. The
     * generated string consists of the original bare string and computed check
     * character(s), which are combined in accordance with the algorithm.
     *
     * @param strWithoutCheckChars - String without check character(s)
     * @returns String with check character(s)
     * @throws `SyntaxError` if an algorithm-specific syntax error occurs. Note
     * that the bundled algorithm objects do not generally throw errors because
     * they ignore the unknown letters in the string to be protected.
     */
    generate(strWithoutCheckChars: string): string;

    /**
     * Checks if a protected string is valid per the algorithm.
     *
     * @param strWithCheckChars - String with check character(s)
     * @returns True if the argument is valid
     * @throws `SyntaxError` if the argument does not contain check character(s)
     * or any other algorithm-specific syntax error occurs. Note that the bundled
     * algorithm objects do not generally throw errors because they ignore the
     * unknown letters in the string to be protected.
     */
    validate(strWithCheckChars: string): boolean;

    /**
     * Generates the check character(s) from the argument using the algorithm.
     * Unlike `generate()`, this method returns the check character(s) only.
     *
     * @param strWithoutCheckChars - String without check character(s)
     * @returns Check character(s)
     * @throws `SyntaxError` if an algorithm-specific syntax error occurs. Note
     * that the bundled algorithm objects do not generally throw errors because
     * they ignore the unknown letters in the string to be protected.
     */
    compute(strWithoutCheckChars: string): string;

    /**
     * Generates the check character(s) from the argument using the algorithm.
     * This method is an alphabet-independent equivalent of `compute()`, where the
     * return value and argument are both represented as arrays of each digit's
     * numerical value.
     *
     * @param numValsWithoutCheckChars - String without check character(s) decoded
     * to an array of numerical values
     * @returns Check character(s) decoded to an array of numerical values
     * @throws `SyntaxError` if the argument contains an invalid numerical value
     * or any other algorithm-specific syntax error occurs.
     */
    computeFromNumVals(numValsWithoutCheckChars: number[]): number[];

    /**
     * Splits a protected string into the pair of original bare string and check
     * character(s).
     *
     * @param strWithCheckChars - String with check character(s)
     * @returns Tuple of [string without check character(s), check character(s)]
     * @throws `SyntaxError` if the argument does not contain check character(s)
     * or any other algorithm-specific syntax error occurs. Note that the bundled
     * algorithm objects do not generally throw errors because they ignore the
     * unknown letters in the string to be protected.
     */
    parse(strWithCheckChars: string): [string, string];
}

class Damm implements CdigitAlgo {
    constructor(readonly name: string, readonly longName: string) {}

    /** Damm operation table */
    private readonly opTable = [
        [0, 3, 1, 7, 5, 9, 8, 6, 4, 2],
        [7, 0, 9, 2, 1, 5, 4, 8, 6, 3],
        [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
        [1, 7, 5, 0, 9, 8, 3, 4, 2, 6],
        [6, 1, 2, 3, 0, 4, 5, 9, 7, 8],
        [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
        [5, 8, 6, 9, 7, 2, 0, 1, 3, 4],
        [8, 9, 4, 5, 3, 6, 2, 0, 1, 7],
        [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
        [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
    ];

    computeFromNumVals(ns: number[]): number[] {
        if (ns.length === 0) {
            throw new SyntaxError('string to be protected is empty');
        } else if (ns.some((e) => e < 0 || e > 9 || !Number.isInteger(e))) {
            throw new SyntaxError('invalid numerical value detected');
        }

        return [ns.reduce((c, e) => this.opTable[c][e], 0)];
    }

    compute(s: string): string {
        const ds = String(s).replace(/[^0-9]/g, '');
        const ns = [...ds].map(Number);
        return String(this.computeFromNumVals(ns)[0]);
    }

    parse(s: string): [string, string] {
        const m = String(s).match(/^(.*)([0-9])$/s);
        if (m != null) {
            return [m[1], m[2]];
        } else {
            throw new SyntaxError('could not find check character(s)');
        }
    }

    generate(s: string): string {
        return `${s}${this.compute(s)}`;
    }

    validate(s: string): boolean {
        const [bare, cc] = this.parse(s);
        return this.compute(bare) === cc;
    }
}

/** Damm algorithm implementation */
export const damm: CdigitAlgo = new Damm('damm', 'Damm Algorithm');

const charMapMemo: {
    [alphabet: string]: {[character: string]: number};
} = {};

const getCharMap = (alphabet: string): {[character: string]: number} => {
    if (charMapMemo[alphabet] == null) {
        charMapMemo[alphabet] = {};
        for (let i = 0; i < alphabet.length; i += 1) {
            const c = alphabet[i];
            if (charMapMemo[alphabet][c] == null) {
                charMapMemo[alphabet][c] = i;
            } else {
                throw new Error('assertion error: chars must be unique');
            }
        }
    }
    return charMapMemo[alphabet];
};

/**
 * Implements ISO 7064 pure system recursive method.
 *
 * This implementation classifies the pure systems into two flavors:
 *
 * - "EXTRA_CHAR": those that use a supplementary check character (i.e., 'X' and
 *   '*') outside the character set of the original bare string (MOD 11-2, 37-2)
 * - "TWO_CCS": those that use two check characters (MOD 97-10, 661-26, 1271-36)
 */
class Pure implements CdigitAlgo {
    constructor(
        readonly name: string,
        readonly longName: string,
        private readonly mod: number,
        private readonly radix: number,
        private readonly alphabet: string,
        private readonly flavor: 'EXTRA_CHAR' | 'TWO_CCS'
    ) {}

    computeFromNumVals(ns: number[]): number[] {
        const maxNumVal =
            this.flavor === 'EXTRA_CHAR' ? this.alphabet.length - 1 : this.alphabet.length;
        if (ns.length === 0) {
            throw new SyntaxError('string to be protected is empty');
        } else if (ns.some((e) => e < 0 || e >= maxNumVal || !Number.isInteger(e))) {
            throw new SyntaxError('invalid numerical value detected');
        }

        let c = 0;
        for (const e of this.flavor === 'TWO_CCS' ? [...ns, 0, 0] : [...ns, 0]) {
            if (c > 0xfff_ffff_ffff) {
                // ~2^44 at max
                c %= this.mod;
            }
            c = c * this.radix + e;
        }
        c = (this.mod + 1 - (c % this.mod)) % this.mod;

        return this.flavor === 'TWO_CCS' ? [Math.floor(c / this.radix), c % this.radix] : [c];
    }

    compute(s: string): string {
        const charMap =
            this.flavor === 'EXTRA_CHAR'
                ? getCharMap(this.alphabet.slice(0, -1))
                : getCharMap(this.alphabet);
        const ns: number[] = [];
        for (const c of String(s)) {
            if (charMap[c] != null) {
                ns.push(charMap[c]);
            }
        }

        const cc = this.computeFromNumVals(ns);
        return this.flavor === 'TWO_CCS'
            ? this.alphabet[cc[0]] + this.alphabet[cc[1]]
            : this.alphabet[cc[0]];
    }

    parse(s: string): [string, string] {
        const charMap = getCharMap(this.alphabet);
        const n = this.flavor === 'TWO_CCS' ? 2 : 1;
        const cc = s.slice(-n);
        if (cc.length === n && [...cc].every((c) => charMap[c] != null)) {
            return [s.slice(0, -n), cc];
        } else {
            throw new SyntaxError('could not find check character(s)');
        }
    }

    generate(s: string): string {
        return `${s}${this.compute(s)}`;
    }

    validate(s: string): boolean {
        const [bare, cc] = this.parse(s);
        return this.compute(bare) === cc;
    }
}

/** Implements ISO 7064 hybrid system recursive method. */
class Hybrid implements CdigitAlgo {
    constructor(
        readonly name: string,
        readonly longName: string,
        private readonly alphabet: string
    ) {}

    computeFromNumVals(ns: number[]): number[] {
        const mod = this.alphabet.length;
        if (ns.length === 0) {
            throw new SyntaxError('string to be protected is empty');
        } else if (ns.some((e) => e < 0 || e >= mod || !Number.isInteger(e))) {
            throw new SyntaxError('invalid numerical value detected');
        }

        let c = mod;
        for (const e of ns) {
            c = (c % (mod + 1)) + e;
            c = (c % mod || mod) * 2;
        }
        c %= mod + 1;

        return [(mod + 1 - c) % mod];
    }

    compute(s: string): string {
        const charMap = getCharMap(this.alphabet);
        const ns: number[] = [];
        for (const c of String(s)) {
            if (charMap[c] != null) {
                ns.push(charMap[c]);
            }
        }

        const cc = this.computeFromNumVals(ns);
        return this.alphabet[cc[0]];
    }

    parse(s: string): [string, string] {
        const charMap = getCharMap(this.alphabet);
        const cc = s.slice(-1);
        if (cc.length === 1 && charMap[cc] != null) {
            return [s.slice(0, -1), cc];
        } else {
            throw new SyntaxError('could not find check character(s)');
        }
    }

    generate(s: string): string {
        return `${s}${this.compute(s)}`;
    }

    validate(s: string): boolean {
        const [bare, cc] = this.parse(s);
        return this.compute(bare) === cc;
    }
}

/** ISO/IEC 7064, MOD 11-2 implementation */
export const mod11_2: CdigitAlgo = new Pure(
    'mod11_2',
    'ISO/IEC 7064, MOD 11-2',
    11,
    2,
    '0123456789X',
    'EXTRA_CHAR'
);

/** ISO/IEC 7064, MOD 37-2 implementation */
export const mod37_2: CdigitAlgo = new Pure(
    'mod37_2',
    'ISO/IEC 7064, MOD 37-2',
    37,
    2,
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*',
    'EXTRA_CHAR'
);

/** ISO/IEC 7064, MOD 97-10 implementation */
export const mod97_10: CdigitAlgo = new Pure(
    'mod97_10',
    'ISO/IEC 7064, MOD 97-10',
    97,
    10,
    '0123456789',
    'TWO_CCS'
);

/** ISO/IEC 7064, MOD 661-26 implementation */
export const mod661_26: CdigitAlgo = new Pure(
    'mod661_26',
    'ISO/IEC 7064, MOD 661-26',
    661,
    26,
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'TWO_CCS'
);

/** ISO/IEC 7064, MOD 1271-36 implementation */
export const mod1271_36: CdigitAlgo = new Pure(
    'mod1271_36',
    'ISO/IEC 7064, MOD 1271-36',
    1271,
    36,
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'TWO_CCS'
);

/** ISO/IEC 7064, MOD 11,10 implementation */
export const mod11_10: CdigitAlgo = new Hybrid('mod11_10', 'ISO/IEC 7064, MOD 11,10', '0123456789');

/** ISO/IEC 7064, MOD 27,26 implementation */
export const mod27_26: CdigitAlgo = new Hybrid(
    'mod27_26',
    'ISO/IEC 7064, MOD 27,26',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
);

/** ISO/IEC 7064, MOD 37,36 implementation */
export const mod37_36: CdigitAlgo = new Hybrid(
    'mod37_36',
    'ISO/IEC 7064, MOD 37,36',
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
);

class Luhn implements CdigitAlgo {
    constructor(readonly name: string, readonly longName: string) {}

    /** Luhn lookup table */
    private readonly lookup = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];

    computeFromNumVals(ns: number[]): number[] {
        if (ns.length === 0) {
            throw new SyntaxError('string to be protected is empty');
        } else if (ns.some((e) => e < 0 || e > 9 || !Number.isInteger(e))) {
            throw new SyntaxError('invalid numerical value detected');
        }

        let sum = 0;
        let odd = 1;
        for (let i = ns.length - 1; i >= 0; i -= 1) {
            if (sum > 0xffff_ffff_ffff) {
                // ~2^48 at max
                sum %= 10;
            }
            sum += odd ? this.lookup[ns[i]] : ns[i];
            odd ^= 1;
        }
        return [(10 - (sum % 10)) % 10];
    }

    compute(s: string): string {
        const ds = String(s).replace(/[^0-9]/g, '');
        const ns = [...ds].map(Number);
        return String(this.computeFromNumVals(ns)[0]);
    }

    parse(s: string): [string, string] {
        const m = String(s).match(/^(.*)([0-9])$/s);
        if (m != null) {
            return [m[1], m[2]];
        } else {
            throw new SyntaxError('could not find check character(s)');
        }
    }

    generate(s: string): string {
        return `${s}${this.compute(s)}`;
    }

    validate(s: string): boolean {
        const [bare, cc] = this.parse(s);
        return this.compute(bare) === cc;
    }
}

/** Luhn algorithm implementation */
export const luhn: CdigitAlgo = new Luhn('luhn', 'Luhn Algorithm');

class Verhoeff implements CdigitAlgo {
    constructor(readonly name: string, readonly longName: string) {}

    /** Verhoeff multiplication table */
    private readonly d = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ];

    /** Verhoeff permutation table */
    private readonly p = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ];

    /** Verhoeff inverse table */
    private readonly inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    computeFromNumVals(ns: number[]): number[] {
        if (ns.length === 0) {
            throw new SyntaxError('string to be protected is empty');
        } else if (ns.some((e) => e < 0 || e > 9 || !Number.isInteger(e))) {
            throw new SyntaxError('invalid numerical value detected');
        }

        // as if: `ns.push(0); let c = 0;` and finished first loop where i == 0
        let c = this.d[0][this.p[0][0]];
        for (let i = 1, len = ns.length; i <= len; i += 1) {
            c = this.d[c][this.p[i & 7][ns[len - i]]];
        }
        return [this.inv[c]];
    }

    compute(s: string): string {
        const ds = String(s).replace(/[^0-9]/g, '');
        const ns = [...ds].map(Number);
        return String(this.computeFromNumVals(ns)[0]);
    }

    parse(s: string): [string, string] {
        const m = String(s).match(/^(.*)([0-9])$/s);
        if (m != null) {
            return [m[1], m[2]];
        } else {
            throw new SyntaxError('could not find check character(s)');
        }
    }

    generate(s: string): string {
        return `${s}${this.compute(s)}`;
    }

    validate(s: string): boolean {
        const [bare, cc] = this.parse(s);
        return this.compute(bare) === cc;
    }
}

/**
 * Verhoeff algorithm implementation
 *
 * Note: There is not a firm consensus on the direction (left to right or right
 * to left) in which a Verhoeff calculator scans numeric text to construct an
 * input digit sequence. This implementation is hard coded to read a string from
 * right to left and append the check digit at the rightmost position, which is
 * a consistent behavior with other popular implementations. Reverse the input
 * string before calling this class' methods if you need to interpret a string
 * from left to right.
 */
export const verhoeff: CdigitAlgo = new Verhoeff('verhoeff', 'Verhoeff Algorithm');

const cdigit = { 
    damm: damm,
    mod11_2: mod11_2,
}

export default cdigit;
