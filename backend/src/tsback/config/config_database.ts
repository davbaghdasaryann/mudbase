import { verifyObject } from "../../tslib/verify";
import { ConfigAuth, ConfigAuthContainer } from "./config_auth";

export type ConfigDatabaseType = 'mysql' | 'mongo' | 'mongodb' | 'dynamo' | 'dynamodb' | 'local';

export interface ConfigDatabase {
    type: ConfigDatabaseType;
    prot?: string;
    host?: string;
    port?: number;
    user?: string;
    pswd?: string;
    dbse?: string;
    parm?: any;

    auth?: string;

    path?: string;
}

export function processConfigDatabase(db?: ConfigDatabase, authContainer?: ConfigAuthContainer) {
    if (!db) return;

    if (db.auth) {
        let auth = verifyObject(authContainer, "Auth container is missing");
        
        let a = verifyObject(auth.get(db.auth), `Auth item not found: ${db.auth}`);

        db.user = a.user;
        db.pswd = a.pswd;
    }

    // if (db.type === 'mongo' || db.type === 'mongodb') {
    //     if (!db.asrc) db.asrc = 'admin'; // admin is the default authentication source
    // }
}
