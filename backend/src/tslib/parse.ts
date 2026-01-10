import {validateDoubleInteger} from './validate';

export function parseBool(value: string | boolean | undefined, defaultValue = false): boolean {
    if (value === undefined) return defaultValue;
    if (typeof value === 'boolean') return value;

    switch (value.trim().toLowerCase()) {
        case '1':
        case 'true':
        case 'yes':
            return true;
        case '0':
        case 'false':
        case 'no':
            return false;
        default:
            throw new Error(`Invalid boolean string: ${value}`);
    }    


    // console.log(value);

    // return (['true', 'false', true, false].includes(value) && JSON.parse(value)) || defaultValue;
}

export function parseThousandsSeparator(num: number): string {
    // num = Math.round(num);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
}

export function roundToThree(num: number): number {
    return Math.round(num * 1000) / 1000;
}

export function roundNumber(num: number): number {
    return Math.round(num);
}

export function fixedToThree(num?: number): string {
    // if (!num) {
    //     return '0';
    // }
    // return num.toFixed(3);

    if (!num) {
        return '0';
    }
    const rounded = Math.round(num * 1000) / 1000;
    if (Number.isInteger(rounded)) {
        return rounded.toString();
    }
    return rounded.toFixed(3);
}

export function fixedNumber(num?: number): string {
    if (!num) {
        return '0';
    }
    return num.toFixed(0);
}

export function normalizeArmenianDecimalPoint(input: unknown): unknown {
    if (typeof input !== 'string' && typeof input !== 'number') {
        return input;
    }

    // console.log('str', typeof input)

    const str = String(input);
    return str
        .split('')
        .map((ch) => (ch.charCodeAt(0) === 8228 ? String.fromCharCode(46) : ch))
        .join('');
}
