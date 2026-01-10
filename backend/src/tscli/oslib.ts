import os from 'os';

export function resolveHomeDirOpt(path: string | undefined) {
    if (path === undefined) return undefined;
    return resolveHomeDir(path);
}


export function resolveHomeDir(path: string) {

    if (!path || typeof path !== 'string') {
        return '';
    }

    if (path.startsWith('~/') || path === '~') {
        return path.replace('~', os.homedir());
    }

    return path;
}

