import os from 'os';

import {verify} from './verify';

export function resolveHomeDir(path: string) {
    if (!path || typeof path !== 'string') {
        return '';
    }

    if (path.startsWith('~/') || path === '~') {
        return path.replace('~', os.homedir());
    }

    return path;
}


export function makeFilePath(...comps: string[]) {
    return comps.join('/')
}

export function makeFilePathExt(...comps: string[]) {
    let total = comps.length
    var current = 0
    let path = ''

    comps.forEach((val: string, index: number) => {
        if (path.length !== 0) path += index === total - 1 ? '.' : '/'
        path += val
    })

    return path
}

export function makeFilePathArr(comps: string[], ext?: string): string {
    let index = 0
    let path = ''
    for (let comp of comps) {
        //if (!comp)
        verify(comp, `Path component null: ${comps}`)

        let name = comp.trim()
        if (name.length === 0) continue
        if (path.length !== 0) {
            if (path[path.length - 1] !== '/' && name[0] !== '/') path += '/'
        }

        path += name
        ++index
    }

    if (ext && ext.length > 0) {
        if (ext[0] !== '.') path += '.'
        path += ext
    }

    return path
}

export function makeFilePathRootArr(root: string, comps: string[]) {
    return makeFilePath(root, makeFilePathArr(comps))
}

export function makeFilePathRoot(root: string, ...comps: string[]) {
    return makeFilePath(root ? root : '/', makeFilePathArr(comps))
}

// export function getFileExt(name: string): string | undefined {
//     if (name.length === 0) return undefined

//     let pathComps = name.split('/')
//     let nameComps = pathComps[pathComps.length - 1].split('.')

//     if (nameComps.length === 0) return undefined

//     return nameComps[nameComps.length - 1]
// }

export function getFileExt(name: string): string | undefined {
    if (!name) return undefined;

    const base = name.split('/').pop();
    if (!base || base.startsWith('.') && !base.includes('.', 1)) return undefined;

    const parts = base.split('.');
    if (parts.length <= 1) return undefined;

    return parts.pop();
}

export function getFileName(name: string): string | undefined {
    let comps = name.split('/')
    return comps[comps.length - 1]
}


export function getFileDir(name: string): string | undefined {
    let comps = name.split('/')
    if (comps.length <= 1) return undefined
    comps.pop()
    return comps.join('/')
}
