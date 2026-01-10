import fs from 'fs';
import path from 'path';

//import { log } from './log';

export function dumpObjectJson(filename: string, obj: any) {
    let filepath = filename;

    log_.info(`Dumping: ${filepath}`);

    let str = JSON.stringify(obj, null, 2);
    fs.writeFileSync(filepath, str);
}
