import path from 'path/posix';
import fs from 'fs';
import yaml from 'js-yaml';

import {defineConfig} from 'drizzle-kit';
// import { makeFilePath } from './src/tslib/filename';

// export class Setup {
//     configDir = path.join(path.dirname(__dirname), 'config');
//     configFile = 'config-mudbase.yaml';

//     apiVersionMajor = 1;
//     apiVer = `v${this.apiVersionMajor}`;
//     apiRoot = `/api/${this.apiVer}`;

//     constructor() {
//         let configDirs = ['/srv/etc', '.', path.join(path.dirname(__dirname), 'config')];
//         for (let dir of configDirs) {
//             let configPath = makeFilePath(dir, this.configFile);
//             if (fs.existsSync(configPath)) {
//                 this.configDir = dir;
//                 break;
//             }
//         }
//     }
// }


//let setup = new Setup();

//let configPath = makeFilePath(setup.configDir, setup.configFile);
let configPath = 'config/config-mudbase.yaml';

let configData = fs.readFileSync(configPath, 'utf-8');

let config = yaml.load(configData.toString(), {
    filename: configPath,
}) as any;


let sessdb = config.auth.sessdb;
let dburl = `mysql://${sessdb.user}:${sessdb.pswd}@${sessdb.host}:${sessdb.port}/${sessdb.dbse}`;

console.log("Sessions Database: ", dburl);


export default defineConfig({
    schema: './src/drizzle/schema.ts', // Path to your schema
    out: './src/drizzle/migrations', // Where migrations are stored
    dialect: 'mysql', // Ensure you're using MySQL
    dbCredentials: {
        url:dburl,
    },
});
