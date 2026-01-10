import * as z from 'zod';

const emailSchema = z.string().email();
export function validateEmail(email: string) {
    const result = emailSchema.safeParse(email);
    return result.success;

    // const re =
    //     /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    // return re.test(String(email).toLowerCase())
}

export function validateJavaScriptVariableName(name: string) {
    const re = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;
    //const re = /^[\p{L}\p{Nl}$_][\p{L}\p{Nl}$\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*$/;
    return re.test(name);
}

const mongoIdSchema = z.coerce.string().regex(/^[0-9a-fA-F]{24}$/, {
    message: 'Invalid MongoDB ObjectId',
});

export function validateMongoObjectId(v: string) {
    const result = mongoIdSchema.safeParse(v);
    return result.success;
}

const integerSchema = z.coerce.number().int();

export function validateInteger(v: string): boolean {
    const result = integerSchema.safeParse(v);
    // console.log(`"${v}"`, result);
    return result.success;
    // // This regex matches an optional negative sign followed by one or more digits
    // const regex = /^-?\d+$/;
    // return regex.test(input.trim());
}


const positiveNumberSchema = z.coerce.number().positive();

export function validatePositiveDoubleInteger(v: unknown): boolean {
    const str = typeof v === "string" ? v : String(v);


    let normalized = (typeof str.normalize === "function") ? str.normalize("NFKC") : str;

    normalized = normalized
        .split('')
        .map(ch => (ch.charCodeAt(0) === 8228 ? String.fromCharCode(46) : ch))
        .join('');

    const result = positiveNumberSchema.safeParse(normalized);
    return result.success;
}


const nonNegativeNumberSchema = z.coerce.number().min(0);

export function validateDoubleInteger(v: unknown): boolean {
    const str = typeof v === "string" ? v : String(v);

    let normalized = typeof str.normalize === "function" ? str.normalize("NFKC") : str;

    normalized = normalized
        .split('')
        .map(ch => (ch.charCodeAt(0) === 8228 ? String.fromCharCode(46) : ch))
        .join('');

    const result = nonNegativeNumberSchema.safeParse(normalized);
    return result.success;
}



const positiveIntegerSchema = z.coerce.number().int().positive();

export function validatePositiveInteger(input: string): boolean {
    const result = positiveIntegerSchema.safeParse(input);
    return result.success;

    // // This regex matches one or more digits only (no negative sign allowed)
    // const regex = /^\d+$/;
    // return regex.test(input.trim());
}



const phoneNumberSchema = z.coerce.string().regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format. Expected E.164 format.',
});





export function validatePhoneNumber(v: string) {
    const result = phoneNumberSchema.safeParse(v);
    return result.success;
}
