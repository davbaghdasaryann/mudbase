function trimSlashes(str: string): string {
    return str.replace(/^\/+|\/+$/g, '');
}

export function isPathnameEqual(path1: string, path2: string) {
    return trimSlashes(path1) === trimSlashes(path2);
}
