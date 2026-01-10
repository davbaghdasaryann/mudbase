import fs from 'fs';


export async function loadFile(path: string) {
}

export async function loadFileJson(path: string) {
    let data = fs.readFileSync(path);
    return JSON.parse(data.toString());
}


