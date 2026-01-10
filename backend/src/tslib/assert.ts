
export function assertAlertThrow(cond: any, message: string) {
    if (!cond) {
        alert(message); // TODO: figure out better error handling
        throw new Error(message);
    }
    return cond!;
}

export function assertThrow(cond: any, message: string) {
    if (!cond) {
        throw new Error(message);
    }
    return cond!;
}

export function assertNotEmpty(cond: string | Array<any> | undefined | null, message: string) {
    return assertAlertThrow(cond && cond.length > 0, message);
}

export function assertObject<T>(condition?: T, message?: string | Error, code?: number): T {
    if (!condition) {
        if (message instanceof Error) throw message

        let err = new Error(message)
        if (code) err.name = code.toString()
        throw err
    }

    return condition!
}
