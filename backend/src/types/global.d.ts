import {Express} from 'express';
import {MongoClient, Db as MongoDb} from 'mongodb';

import {Logger} from '../tsback/logger';

import {Config, Setup} from '../config';

declare global {
    var config_: Config;
    var setup_: Setup;
    var log_: Logger;

    var expressApp_: Express;

    var dbInitialized_: boolean;
    var dbInitPromise_: Promise<void>;

    var mongoClient_: MongoClient | null;
    var mongoDb_: MongoDb;
}

declare var config_: Config;
declare var setup_: Setup;
declare var log_: Logger;

declare var expressApp_: Express;

declare var dbInitialized_: boolean;
declare var dbInitPromise_: Promise<void>;

declare var mongoClient_: MongoClient | null;
declare var mongoDb_: MongoDb;

export {};
