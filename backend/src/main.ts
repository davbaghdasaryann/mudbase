import http from 'http';

import './logger';
import './config';
import './i18n';
import './app';
import './app_authjs';  // must be after import './app'
import './api';

import { dbInitConfig } from './tsback/mongodb/mongodb_init';

import { drizzleMaintenance, drizzleWarmUp } from './drizzle/drizzledb';


export default async function main() {
    let port = config_.server.port;

    try {
        expressApp_.set('port', port);

        dbInitConfig(config_.db);
        await drizzleWarmUp();
        await drizzleMaintenance();


        const server = http.createServer(expressApp_);

        function onServerListening() {
            log_.info('Listenting On:', port);
        }

        server.listen(port, onServerListening);
    } catch (err) {
        log_.error(err);
        process.exit(1);
    }

    return 0;
}

process.on('uncaughtException', (err) => {
    console.error('Uncaught error', err);
    process.exit(1); //mandatory (as per the Node.js docs)
});
