
const mimes = new Map([
    ["html", 'text/html'],
    ["txt", 'text/plain'],
    ["css", 'text/css'],
    ["gif", 'image/gif'],
    ["jpg", 'image/jpeg'],
    ["png", 'image/png'],
    ["svg", 'image/svg+xml'],
    ["js", 'application/javascript'],
]);

export function deduceMime(ext: string) {
    let type = mimes.get(ext) || 'application/octet-stream';
    return type;
}

