// import * as UUID from 'uuid';
import { v4 as uuidv4 } from 'uuid';
// import bs58 from 'bs58';
// const bs58check = require('bs58check'); // Works with CommonJS
import bs58check from 'bs58check';

enum TokenBase {
    Base16 = '0123456789abcdef',
    Base36 = '0123456789abcdefghijklmnopqrstuvwxyz',
    Base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
    Base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    Base66 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~',
    Base71 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!'()*-._~",
}

export function generateSessionToken() {

    // const bs58 = (await import('bs58')).default; // Dynamically import bs58
    const uuidBuffer = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
    return bs58check.encode(uuidBuffer);
}


/*
export function generateSessionToken() {

    // Options
    const bits = 128;
    const baseEncoding = TokenBase.Base58;

    const bytes = bits / 8;
    const baseLength = baseEncoding.length;
    const tokenLength = Math.ceil(bits / Math.log2(baseLength));

    const buffer = Buffer.allocUnsafe(bytes);

    for (let i = 0; i < bytes; i += 16) {
        UUID.v4(null, buffer, i);
        UUID.v4(
    }

    const digits = [0];

    for (let i = 0; i < buffer.length; ++i) {
        let carry = buffer[i];

        for (let j = 0; j < digits.length; ++j) {
            // tslint:disable-next-line:no-bitwise
            carry += digits[j] << 8;
            digits[j] = carry % baseLength;

            // tslint:disable-next-line:no-bitwise
            carry = (carry / baseLength) | 0;
        }

        while (carry > 0) {
            digits.push(carry % baseLength);
            // tslint:disable-next-line:no-bitwise
            carry = (carry / baseLength) | 0;
        }
    }

    // Leading zeros
    let token = digits.length < tokenLength ? baseEncoding[0].repeat(tokenLength - digits.length) : '';

    let i = digits.length;

    while (i--) {
        token += baseEncoding[digits[i]];
    }

    return token;
}
    */
