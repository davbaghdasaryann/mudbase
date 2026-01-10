import {assertAlertThrow, assertNotEmpty} from './assert';

export function makeFilePathArr(comps: string[], ext?: string): string
{
    //console.debug(comps);

    let index = 0;
    let path = '';
    for (let comp of comps) {
        //if (!comp)
        assertNotEmpty(comp, `Path component null: ${comps}`);

        let name = comp.trim();
        if (name.length === 0)
            continue;
        if (path.length !== 0) {
            if (path[path.length-1] !== '/' && name[0] !== '/')
                path += '/';
        }

        path += name;
        ++index;
    }

    if (ext && ext.length > 0) {
        if (ext[0] !== '.')
            path += '.';
        path += ext;
    }

    return path;
}

export function makeFilePathRootArr(root: string, comps: string[]) {
    return makeFilePath(root, makeFilePathArr(comps));
}


export function makeFilePathRoot(root: string, ...comps: string[]) {
    return makeFilePath(root ? root : '/', makeFilePathArr(comps));
}

export function makeFilePath(...comps: string[]) {
    return makeFilePathArr(comps);
}


/*
export function makeFilePathExt(...comps: string[])
{
    let total = comps.length;
    var current = 0;
    let path = "";

    comps.forEach((val: string, index: number) => {
        if (path.length !== 0)
            path += index === total - 1 ? "." : "/";
        path += val;
    });

    return path;
    //return comps.join("/") + "." + ext;
}
*/
