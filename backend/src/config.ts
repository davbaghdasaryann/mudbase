import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {createStream} from 'rotating-file-stream';

import {logger} from './logger';

import {ConfigDatabase} from './tsback/config/config_database';
import {ConfigServer} from './tsback/config/config_server';
import {ConfigAws} from './tsback/config/config_aws';
import {ConfigEmail} from './tsback/config/config_email';

import {makeFilePath} from '@tslib/filename';
import {ConfigDev} from './tsback/config/config_dev';

//
// Get __dirname and __filename in ESM
//
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import { resolveHomeDir } from './tscli/oslib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ConfigAuth {
    supertokensConnectionUrl: string;
    frontUrl: string;
    sessdb: ConfigDatabase;
    authSecret: string;
}

export interface Config {
    server: ConfigServer;
    db: ConfigDatabase;
    aws: ConfigAws;
    auth: ConfigAuth;
    email: ConfigEmail;
    local: ConfigLocalData;
    dev?: ConfigDev;

    // Development / Production environments
    env: string;
    isDev: boolean;
    isProd: boolean;
}

interface ConfigLocalData {
    log?: string;
    templates?: string;
    locales?: string;
    static?: string;
    // images: string;
    // uploads: string;
}

export class Setup {
    configDir = path.join(path.dirname(__dirname), 'config');
    configFile = 'config-mudbase.yaml';

    apiVersionMajor = 1;
    apiVer = `v${this.apiVersionMajor}`;
    apiRoot = `/api/${this.apiVer}`;

    constructor() {
        let configDirs = ['/srv/etc', '/srv/mudbase/config', '.', path.join(path.dirname(__dirname), 'config')];
        for (let dir of configDirs) {
            let configPath = makeFilePath(dir, this.configFile);
            if (fs.existsSync(configPath)) {
                this.configDir = dir;
                break;
            }
        }
    }

    getTemplatesDir() {
        let templatesDir = path.join(path.dirname(__dirname), 'templates');
        if (config_.local?.templates)
            templatesDir = config_.local?.templates;
        return templatesDir;
    }

    getTemplatePath(templateName: string) {
        return makeFilePath(this.getTemplatesDir(), templateName);
    }

    getLocalesDir() {
        let localesDir = path.join(path.dirname(__dirname), 'locales');
        if (config_.local?.locales)
            localesDir = config_.local?.locales;
        return localesDir;
    }
}

function loadConfig(): Config {
    let configPath = makeFilePath(setup_.configDir, setup_.configFile);
    logger.info('Loading Config:', configPath);

    let config = loadConfigImpl();

    config.env = config.env ?? 'prod';
    config.isDev = config.env === 'dev' || config.env === 'development';
    config.isProd = !config.isDev;

    process.env.NODE_ENV = config.isDev ? 'development' : 'production';
    // process.env.NODE_ENV = 'production';

    if (config.isProd) {
        logger.settings.minLevel = 5;
        logger.settings.hideLogPositionForProduction = true;
    }

    if (config.local?.log) {

        const pad = (num: number) => (num > 9 ? '' : '0') + num;
        const logNameGenerator = (time: number | Date, index?: number) => {
            let logFile = config.local.log + '/';

            if (time instanceof Date) {
                let yearMonth = time.getFullYear() + '' + pad(time.getMonth() + 1);
                let day = pad(time.getDate());
                logFile += `${yearMonth}/mudbase-${yearMonth}${day}`;
            } else {
                logFile += 'mudbase';
            }

            if (index !== undefined)
                logFile += `-${index}`;

            logFile += '.log';
        
            return logFile;
        };
        

        // const stream = createStream(makeFilePath(config.local.log, 'mudbase.log'), {
        const stream = createStream(logNameGenerator, {
            size: '10M', // rotate every 10 MegaBytes written
            interval: '1d', // rotate daily
            // intervalBoundary: true,
            compress: 'gzip', // compress rotated files
        });

        logger.attachTransport((logObj) => {
            stream.write(JSON.stringify(logObj) + '\n');
        });
    }

    return config;
}

export function loadConfigImpl(): Config {
    let configPath = makeFilePath(setup_.configDir, setup_.configFile);

    let configData = fs.readFileSync(configPath, 'utf-8');

    let config = yaml.load(configData.toString(), {
        filename: configPath,
    }) as Config;

    if (config.local?.static) config.local.static = resolveHomeDir(config.local.static);

    return config;
}

global.setup_ = new Setup();
global.config_ = loadConfig();

export const setup = global.setup_;
export const config = global.config_;
