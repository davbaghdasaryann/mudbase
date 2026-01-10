export interface IErrorHandler {
    (e: Error): void;
}

// Creates 'Error' object from any object
export function makeError(err: any): Error {
    if (err instanceof Error) return err;

    if (typeof err === 'string') return new Error(err);

    return new Error(`Unknown error type: ${err}`);
}

export function getErrorString(error: Error | string | unknown | undefined, defaultText?: string): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (defaultText !== undefined) return defaultText;
    return error as string;
}
