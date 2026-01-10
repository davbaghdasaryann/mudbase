import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import {ConfigDatabase} from './tsback/config_database';
import {ConfigServer} from './tsback/config_server';
import {ConfigAws} from './tsback/config_aws';

import { makeFilePath } from './tslib/filename';
import { ConfigDev } from './tsback/config_dev';

// Get __dirname in ESM
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export interface ConfigAuth {
    supertokensConnectionUrl: string;
    frontUrl: string;
    db: ConfigDatabase;
};


export interface Config {
    server: ConfigServer;
    db: ConfigDatabase;
    aws: ConfigAws;
    auth: ConfigAuth;
    local: ConfigLocalData;
    dev?: ConfigDev;
}


interface ConfigLocalData {
    images: string;
    uploads: string;
}



export class Setup {
    configDir = path.join(path.dirname(__dirname), 'config');
    configFile = 'config-mudbase.yaml';

    apiVersionMajor = 1;
    apiVer = `v${this.apiVersionMajor}`;
    apiRoot = `/api/${this.apiVer}`;

    constructor() {
        let configDirs = ['/srv/etc', '.', path.join(path.dirname(__dirname), 'config')];
        for (let dir of configDirs) {
            let configPath = makeFilePath(dir, this.configFile);
            if (fs.existsSync(configPath)) {
                this.configDir = dir;
                break;
            }
        }
    }
}

export function loadConfig(): Config {
    let configPath = makeFilePath(setup_.configDir, setup_.configFile);

    // log_.info('Loading Config:', configPath);

    let configData = fs.readFileSync(configPath, 'utf-8');

    let config = yaml.load(configData.toString(), {
        filename: configPath,
    }) as Config;

    if (!config.dev) {
        log_.settings.minLevel = 6;

    }

    return config;
}

global.setup_ = new Setup();
global.config_ = loadConfig();
