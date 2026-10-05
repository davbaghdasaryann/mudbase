import * as Db from '../../../db';

import { requireQueryParam } from '../../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '@src/tslib/verify';

// registerHandlerSession('dev', 'fetch_accounts', async (req, res, session) => {
//  
//     let accounts = Db.getAccountsCollection();

//     let data = await accounts.find().toArray();

//     respondJsonData(res, data);
// });

registerHandlerSession('dev', 'users_in_account', async (req, res, session) => {
    let accountMongoId = new ObjectId(requireQueryParam(req, 'accountId'));
    let users = Db.getUsersCollection();

    // Find all users with the given accountId
    let userList = await users.find({ accountId: accountMongoId }).toArray();

    respondJsonData(res, userList);

    // const usersCollection = Db.getUsersCollection();
    // const accountsCollection = Db.getAccountsCollection();

    // // Find all users that have an "updatedAt" field and role === "A"
    // const users = await usersCollection.find({
    //     // updatedAt: { $exists: true },
    //     role: "A"
    // }).toArray();

    // // Cycle through each user and update the corresponding account
    // for (const user of users) {
    //     if (user.accountId) {
    //         // Update the account document with the user's _id as adminUserId
    //         await accountsCollection.updateOne(
    //             { _id: user.accountId },
    //             { $set: { adminUserId: user._id } }
    //         );
    //     }
    // }

    // respondJsonData(res, { message: "Accounts updated with adminUserId for matching users." });
    // respondJsonData(res, {});

});

registerHandlerSession('dev', 'add_account', async (req, res, session) => {

    let accountInfo = req.body;
    //   log_.info('accountInfo', accountInfo)

    let accounts = Db.getAccountsCollection();
    await accounts.insertOne(accountInfo);

    let users = Db.getUsersCollection();
    // await users.updateOne({userId: session.userId}, {$set: {account_id: accountInfo._id}});


    respondJsonData(res, 'new account added');
});




registerHandlerSession('dev', 'get_account', async (req, res, session) => {
    let accounts = Db.getAccountsCollection();
    let account = await accounts.findOne({ _id: session.mongoAccountId });

    respondJsonData(res, account);
});

// registerHandlerSession('dev', 'delete_account', async (req, res, session) => {

//     let users = Db.getAccountsCollection();

//     let account_id = requireQueryParam(req, '_id');
//     let result = await users.deleteOne({_id: new ObjectId(account_id)});
//     console.log('result', account_id);
//     respondJsonData(res, result);
// });

registerApiSession('dev/delete_account', async (req, res, session) => {

    let accounts = Db.getAccountsCollection();
    let account = req.body._id;
    let accountId = new ObjectId(account);
    const mode: string = req.body.mode || 'hard';

    if (mode === 'soft') {
        // Soft-delete: mark account as deleted, keep all data intact
        await accounts.updateOne({ _id: accountId }, { $set: { deletedAt: new Date(), isDeleted: true } });
        return respondJsonData(res, { ok: true, mode: 'soft' });
    }

    if (mode === 'with_offers') {
        // Soft-delete account + hard-delete all its offers
        await accounts.updateOne({ _id: accountId }, { $set: { deletedAt: new Date(), isDeleted: true } });
        await Db.getLaborOffersCollection().deleteMany({ accountId });
        await Db.getMaterialOffersCollection().deleteMany({ accountId });
        return respondJsonData(res, { ok: true, mode: 'with_offers' });
    }

    // Legacy hard-delete with dependency checks
    log_.info('countUsers', req.body);
    let countUsers = await Db.getUsersCollection().countDocuments({ accountId: accountId });
    verify(countUsers === 0, "Account belongs to users");

    let checkEstimates = await Db.getEstimatesCollection().countDocuments({ accountId: accountId });
    let checkSharedEstimates = await Db.getEstimatesSharesCollection().countDocuments({ sharedByAccountId: accountId });
    let checkSharedEstimates2 = await Db.getEstimatesSharesCollection().countDocuments({ sharedWithAccountId: accountId });
    let checkLaborOffers = await Db.getLaborOffersCollection().countDocuments({ accountId: accountId });
    let checkMaterialOffers = await Db.getMaterialOffersCollection().countDocuments({ accountId: accountId });

    let errorMessages = [];
    if (checkEstimates > 0) errorMessages.push("Account has made estimates (orders).");
    if (checkSharedEstimates > 0 || checkSharedEstimates2 > 0) errorMessages.push("Account has shared estimates (transactions).");
    if (checkLaborOffers > 0) errorMessages.push("Account has posted labor offers.");
    if (checkMaterialOffers > 0) errorMessages.push("Account has posted material offers.");

    if (errorMessages.length > 0) {
        verify(false, `Account cannot be deleted because: ${errorMessages.join(' ')}`);
    }

    let result = await accounts.deleteOne({ _id: accountId });
    respondJsonData(res, result);
});