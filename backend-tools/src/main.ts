import fs from 'fs';
import {Command} from 'commander';
import {createTunnel, ServerOptions, TunnelOptions, SshOptions, ForwardOptions} from 'tunnel-ssh';

import {verify} from './tslib/verify';
import { dbInitConfig } from './tsback/mongodb/mongodb_init';


import { Client } from 'pg';

import {ObjectId} from 'mongodb';

import {PgDb} from './sqldb'

import {
    deleteAllDocuments, 
    deleteDocumentsByFields,
    insertAccounts,
    insertUsers,
    createAccountsAndAssignToUsers,
    insertLaborCategories,
    insertLaborSubcategories, 
    insertLaborItems, 
    insertLaborOffers,
    insertMeasurement,
    insertMaterialCategory,
    insertMaterialSubcategory,
    insertMaterialItem,
    AddRequiredFieldsToAccounts,
    AddRequiredFieldsToUsers,
} from './categories'


import { 
        CreateUserIndexes,
        CreateAccountIndexes,
        CreatePendingUsersIndexes,
        CreateLaborCategoryIndexes,
        CreateLaborSubcategoryIndexes,
        CreateLaborItemsIndexes,
        CreateLaborOffersIndexes,
        CreateLaborPricesJournalIndexes,
        CreateMaterialCategoryIndexes,
        CreateMaterialSubcategoryIndexes,
        CreateMaterialItemsIndexes,
        CreateMaterialOffersIndexes,
        CreateEstimatesIndexes,
        CreateEstimateSectionsIndexes,
        CreateEstimateSubsectionsIndexes,
        CreateEstimateLaborItemsIndexes,
        CreateEstimateMaterialItemsIndexes,
        CreateEstimatesSharesIndexes,

} from './dbIndex';

const dbName = 'mudbase'; 

process.on('uncaughtException', (err) => {
    console.error('Uncaught error', err);
    process.exit(1); //mandatory (as per the Node.js docs)
});

const tunnelOptions: TunnelOptions = {
	autoClose: true,
    reconnectOnError: false,
}

const serverOptions: ServerOptions = {
	host:'127.0.0.1',
	port: 6432
}

let privateKey = process.cwd() + '/config/prod-mudbase-dev2.pem';
console.log(privateKey);

const sshOptions: SshOptions = {
	host: '18.197.61.131',
	port: 22,
	username: 'dev2-user',
	password: 'Mw9t67s2dQ',
    privateKey: fs.readFileSync(privateKey),
};

const forwardOptions: ForwardOptions = {
	dstAddr: 'mudbase-test.ciru9tthaqm7.eu-central-1.rds.amazonaws.com',
    dstPort: 5432,
}

export default async function main(program: Command) {

    try {
        verify(program.args.length >= 1, 'Command argument is required');

        let [server, conn] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);
        log_.info("tunnel created");

        const sqldb = new PgDb(
            '127.0.0.1',  // IP address
            6432,           // Default PostgreSQL port
            'dev2readonly',
            'Mw9t67s2dQ',
            'mudbasedb'
        );

        let cmd = program.args[0];
        let opts = program.opts();

        await dbInitConfig(config_.db);

        await AddRequiredFieldsToUsers(sqldb);

        switch (cmd) {
        case "test":
            log_.info("test worked");
            break;

        case "labor":
            await insertLaborCategories(sqldb);
            await insertLaborSubcategories(sqldb);
            await insertLaborItems(sqldb);
            await insertLaborOffers(sqldb);
            break;

        case "material": 
            await insertMaterialCategory(sqldb);
            await insertMaterialSubcategory(sqldb);
            await insertMaterialItem(sqldb);
            break;

        case "user": 
            await insertUsers(sqldb);
            break;

        case "measurement":
            await insertMeasurement(sqldb);
            break;

        default:
            break;
        }


    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    }
}


