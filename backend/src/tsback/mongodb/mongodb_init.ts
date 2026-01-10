import {MongoClient, Document} from 'mongodb';

import {ConfigDatabase} from '../config/config_database';

global.dbInitialized_ = false;
global.mongoClient_ = null;

export function dbInitConfig(dbConfig: ConfigDatabase): Promise<void> {
    if (global.mongoClient_) {
        return new Promise<void>((resolve, reject) => {
            resolve();
        });
    }

    let urlParams = new URLSearchParams();
    let haveAuthSource = false;

    if (dbConfig.parm) {
        for (let key of Object.keys(dbConfig.parm)) {
            urlParams.append(key, dbConfig.parm[key]);
            if (key === 'authSource') haveAuthSource = true;
        }
    }

    if (!haveAuthSource) {
        urlParams.append('authSource', 'admin');
    }

    let prot = dbConfig.prot ?? 'mongodb';
    let host = dbConfig.host ?? 'localhost';

    let u = new URL(prot + '://' + dbConfig.host!);
    u.protocol = prot;
    u.host = host;

    if (dbConfig.port) {
        u.port = dbConfig.port.toString();
    }

    if (dbConfig.user) {
        u.username = dbConfig.user;
    }

    if (dbConfig.pswd) {
        u.password = dbConfig.pswd;
    }

    u.search = urlParams.toString();

    let urlString = u.toString();

    global.log_.info(`${dbConfig.type}::Connecting to`, dbConfig.host, '...');
    //log_.debug(`${dbConfig.type}::URL '${urlString}'`);

    global.mongoClient_ = new MongoClient(urlString, {
        retryReads: true,
        retryWrites: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 17_000, // fail fast if cluster unreachable
        connectTimeoutMS: 17_000,
        heartbeatFrequencyMS: 40_000,
    });

    return new Promise<void>((resolve, reject) => {
        let client = global.mongoClient_!;
        client
            .connect()
            .then((client) => {
                global.mongoDb_ = client.db(dbConfig.dbse!);

                global.mongoDb_
                    .command({ping: 1})
                    .then((value: Document) => {
                        global.dbInitialized_ = true;
                        log_.info('Database initialized:', JSON.stringify(value));
                        resolve();
                    })
                    .catch((err) => {
                        log_.error('Database ping error:', err);
                        process.exit(1);
                    });
            })
            .catch((err) => {
                global.log_.error('Database connect error:', err);
                process.exit(1);
            });
    });
}

export function dbInit(config: ConfigDatabase) {
    global.dbInitPromise_ = dbInitConfig(config);

    return global.dbInitPromise_;
}
