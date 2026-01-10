

export function uuidToBase62(u: string): string {
    // parse the hex string into a BigInt
    let n = BigInt('0x' + u.replace(/-/g, ''));

    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let s = '';

    // use BigInt constructor in place of literals
    const zero = BigInt(0);
    const base = BigInt(62);

    while (n > zero) {
        // modulo and division with BigInt
        const rem = n % base;
        s = alphabet[Number(rem)] + s;
        n = n / base;
    }

    return s;
}

export function genUuidBase62() {
    return uuidToBase62(crypto.randomUUID())
}
