import { getFileName } from "./filename";

export function getBoolParam(value: string | undefined | null): boolean {
    if (!value)
        return false;

    return parseInt(value) !== 0;
}

export function getUrlName(urlString: string | undefined) {
    if (!urlString) return ''
    
    let url = new URL(urlString)
    return getFileName(url.pathname)
}
