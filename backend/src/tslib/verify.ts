
export function verifyObject<T>(condition?: T, message?: string | Error, code?: number): T {
    if (!condition) {
        if (message instanceof Error) throw message;

        let err = new Error(message);
        if (code) err.name = code.toString();
        throw err;
    }

    return condition!;
}

export function verify(condition: any, message?: string | Error, code?: number) {
    if (!condition) {
        if (message instanceof Error) throw message;

        let err = new Error(message);
        if (code) err.name = code.toString();
        throw err;
    }

    return condition;
}
