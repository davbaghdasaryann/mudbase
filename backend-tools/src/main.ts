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
    // privateKey: fs.readFileSync('/home/andrei/Documents/mudbase/prod-mudbase-dev2.pem'), // Path to your private key
    privateKey: fs.readFileSync(privateKey),
};

const forwardOptions: ForwardOptions = {
	dstAddr: 'mudbase-test.ciru9tthaqm7.eu-central-1.rds.amazonaws.com',
    dstPort: 5432,

}

// const sshConfig: SshOptions = {
//     username: 'dev2-user', // SSH username
//     host: '18.197.61.131', // SSH server IP
//     port: 22, // SSH port (default 22)
//     privateKey: require('fs').readFileSync('/home/andrei/Documents/mudbase/prod-mudbase-dev2.pem'), // Path to your private key
//     dstHost: '18.197.61.131', // Database host (on remote server)
//     dstPort: 5432, // PostgreSQL port on remote server
//     localHost: '127.0.0.1', // Localhost for tunnel
//     localPort: 6543 // Port that will be forwarded locally
// };


export default async function main(program: Command) {

    try {
        verify(program.args.length >= 1, 'Command argument is required');

        let [server, conn] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);
        log_.info("tunnel created");

        // connectToRemoteDatabase();
        // const sqldb = new RemoteDatabaseConnection(
        //     '192.168.5.8',  // IP address
        //     5432,           // Default PostgreSQL port
        //     'mbadmin',
        //     'evotek12',
        //     'mudbase'
        //   );
    
          const sqldb = new PgDb(
            // 'mudbase-test.ciru9tthaqm7.eu-central-1.rds.amazonaws.com',
            // '18.197.61.131',
            // 5432,
            '127.0.0.1',  // IP address
            6432,           // Default PostgreSQL port
            'dev2readonly',
            'Mw9t67s2dQ',
            'mudbasedb'
          );

        let cmd = program.args[0];
        let opts = program.opts();

        await dbInitConfig(config_.db);
        
        // const mongoDatabase = mongoClient_!.db(dbName);

        //Delete all documents of specific collection
        // await deleteAllDocuments("labor_offers");

        //Delete documents with specified fields
        //Delete documents with the specific criteria
        // const criteria = { 
        //     $or: [
        //     { updatedAt: { $exists: true } },  // Field doesn't exist

        //     ]
        // };
        // await deleteDocumentsByFields("accounts", criteria);


        // await insertMeasurement(mongoDatabase, sqldb);

        // await insertAccounts(sqldb);

        // await insertUsers(sqldb);

        // await createAccountsAndAssignToUsers();

        // await AddRequiredFieldsToAccounts(sqldb);
        await AddRequiredFieldsToUsers(sqldb);

        //Insert labors
        // await insertLaborCategories(mongoDatabase, sqldb);
        // await insertLaborSubcategories(mongoDatabase, sqldb);
        // await insertLaborItems(mongoDatabase, sqldb);
        // await insertLaborOffers(sqldb);


        //Insert materials
        // await insertMaterialCategory(mongoDatabase, sqldb);
        // await insertMaterialSubcategory(mongoDatabase, sqldb);
        // await insertMaterialItem(mongoDatabase, sqldb);

 
        //Create mongoDb indexes

        // await CreateUserIndexes("users");
        // await CreatePendingUsersIndexes("pending_users");
        // await CreateLaborCategoryIndexes("labor_categories");
        // await CreateLaborSubcategoryIndexes("labor_subcategories");
        // await CreateLaborItemsIndexes("labor_items");
        // await CreateLaborOffersIndexes("labor_offers");
        // await CreateLaborPricesJournalIndexes("labor_prices_journal");
        // await CreateMaterialCategoryIndexes("material_categories");
        // await CreateMaterialSubcategoryIndexes("material_subcategories");
        // await CreateMaterialItemsIndexes("material_items");
        // await CreateMaterialOffersIndexes("material_offers");
        // await CreateEstimatesIndexes("estimates");
        // await CreateEstimateSectionsIndexes("estimate_sections");
        // await CreateEstimateSubsectionsIndexes("estimate_subsections");
        // await CreateEstimateLaborItemsIndexes("estimate_labor_items");
        // await CreateEstimateMaterialItemsIndexes("estimate_material_items");
        // await CreateAccountIndexes("accounts");//TODO: change email index to unique
        // await CreateEstimatesSharesIndexes("estimates_shares");

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

        // // Disconnect from server
        // await connection.close(); 

        default:
            break;
        }


    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    }
    // finally {
    //     await sqldb.disconnect();
    // }
}


