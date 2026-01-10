import * as Db from '../../db';

import _ from 'lodash';

import {getReqParam, requireQueryParam} from '../../tsback/req/req_params';
import {registerApiSession} from '../../server/register';
import {respondJsonData} from '../../tsback/req/req_response';
import {ObjectId} from 'mongodb';
import {verify} from '../../tslib/verify';
import {AccountActivity} from '../../tsmudbase/company_activities';
import {combineUserPermissions, userPermissionsSetUp} from '../../permissions/roles_setup';
import {authjsLogoutUser} from '../../authjs/authjs_lib';

registerApiSession('accounts/has_labor_offer', async (req, res, session) => {
    const laborOffers = Db.getLaborOffersCollection();
    const accounts = Db.getAccountsCollection();

    const distinctAccountIds: ObjectId[] = await laborOffers.distinct('accountId');

    const filter: any = {_id: {$in: distinctAccountIds}};
    // In production, exclude any account where isDev === true
    if (process.env.NODE_ENV === 'production') {
        filter.isDev = {$ne: true};
    }

    // Query the accounts collection with the built filter
    const data = await accounts.find(filter).toArray();

    respondJsonData(res, data);
});

registerApiSession('accounts/has_material_offer', async (req, res, session) => {
    const materialOffers = Db.getMaterialOffersCollection();
    const accounts = Db.getAccountsCollection();

    const distinctAccountIds: ObjectId[] = await materialOffers.distinct('accountId');

    const filter: any = {_id: {$in: distinctAccountIds}};
    // In production, exclude any account where isDev === true
    if (process.env.NODE_ENV === 'production') {
        filter.isDev = {$ne: true};
    }

    // Query the accounts collection with the built filter
    const data = await accounts.find(filter).toArray();

    respondJsonData(res, data);
});

registerApiSession('accounts/done_estimate_share', async (req, res, session) => {
    const accountId = session.mongoAccountId;

    const estimatesSharesCollection = Db.getEstimatesSharesCollection();
    const accountsCollection = Db.getAccountsCollection();

    const shareRecords = await estimatesSharesCollection
        .find({sharedWithAccountId: accountId})
        .toArray();

    log_.info('shareRecords', shareRecords);

    const sharedByIds = shareRecords.map((record) => record.sharedByAccountId);

    // Remove duplicates from the array.
    const uniqueSharedByIds = [...new Set(sharedByIds)];

    const accountsData = await accountsCollection.find({_id: {$in: uniqueSharedByIds}}).toArray();

    respondJsonData(res, accountsData);
});

registerApiSession('accounts/with_estimates_shared_by_me', async (req, res, session) => {
    const myAccountId = session.mongoAccountId;
    const sharesColl = Db.getEstimatesSharesCollection();
    const accColl = Db.getAccountsCollection();

    // 1) find all share‐records where *you* are the sharer
    const shareRecords = await sharesColl
        .find({
            sharedByAccountId: myAccountId,
            deleted: {$ne: true},
        })
        .toArray();

    // log_.info("my shareRecords", shareRecords);

    // 2) extract the set of distinct target account IDs
    const sharedWithIds = shareRecords.map((r) => r.sharedWithAccountId.toHexString());
    const uniqueIds = Array.from(new Set(sharedWithIds)).map((id) => new ObjectId(id));

    // 3) fetch those account documents
    const accountsData = await accColl.find({_id: {$in: uniqueIds}}).toArray();

    // 4) return them
    respondJsonData(res, accountsData);
});

registerApiSession('accounts/fetch_active', async (req, res, session) => {
    let search = getReqParam(req, 'search');
    let select = getReqParam(req, 'select');

    if (select === 'all') {
        select = undefined;
    }

    let accounts = Db.getAccountsCollection();

    let query: any = {isActive: true};

    if (process.env.NODE_ENV === 'production') {
        query.isDev = {$ne: true};
    }

    if (select) {
        query.accountActivity = {$in: [select]};
    }

    if (search) {
        query.$or = [
            {companyName: {$regex: search, $options: 'i'}},
            {companyTin: {$regex: search, $options: 'i'}},
        ];
    }

    let cursor = accounts.find(query);
    const data = await cursor.toArray();

    respondJsonData(res, data);
});

registerApiSession('accounts/fetch_inactive', async (req, res, session) => {
    let search = getReqParam(req, 'search');
    let select = getReqParam(req, 'select');

    if (select === 'all') {
        select = undefined;
    }

    let accounts = Db.getAccountsCollection();

    let cursor;

    let query: any = {isActive: false};

    if (process.env.NODE_ENV === 'production') {
        query.isDev = {$ne: true};
    }

    if (select) {
        query.accountActivity = {$in: [select]};
    }
    if (search) {
        query.$or = [
            {companyName: {$regex: search, $options: 'i'}},
            {companyTin: {$regex: search, $options: 'i'}},
        ];
    }
    cursor = accounts.find(query);
    const data = await cursor.toArray();

    respondJsonData(res, data);
});

registerApiSession('accounts/fetch_shareable_accounts_for_estimate', async (req, res, session) => {
    // let accountActivity = getReqParam(req, 'accountActivity');
    log_.info('session', session);
    // Ensure accountActivity is defined
    // verify(accountActivity, "accountActivity parameter is required");

    // Cast accountActivity to AccountActivity so TS knows it's one of the valid values.

    let accountActivity: AccountActivity[] = [];

    if (session.permissionsSet?.has('EST_SHR_WITH_BLDR')) {
        accountActivity.push('B');
    } else if (session.permissionsSet?.has('EST_SHR_WITH_BNK_AND_BLDR')) {
        accountActivity.push('B');
        accountActivity.push('F');
        accountActivity.push('C');
        accountActivity.push('I');
    } else if (session.permissionsSet?.has('EST_SHR_WITH_BNK_AND_ARCH')) {
        accountActivity.push('F');
        accountActivity.push('C');
        accountActivity.push('I');
        accountActivity.push('A');
    } else {
        accountActivity.push('F');
        accountActivity.push('C');
        accountActivity.push('I');
    }

    log_.info('accountActivity', accountActivity);
    // const role = accountActivity as AccountActivity[];

    let search = getReqParam(req, 'search');

    let accounts = Db.getAccountsCollection();

    const devFilter: any = {};
    if (process.env.NODE_ENV === 'production') {
        devFilter.isDev = {$ne: true};
    }

    let query: any;
    if (!search) {
        query = {
            accountActivity: {$in: accountActivity},
            ...devFilter,
        };
    } else {
        query = {
            ...devFilter,
            $or: [
                {accountActivity: {$in: accountActivity}},
                {companyName: {$regex: search, $options: 'i'}},
                {companyTin: {$regex: search, $options: 'i'}},
            ],
        };
    }

    const cursor = accounts.find(query);

    const data = await cursor.toArray();

    respondJsonData(res, data);
});

registerApiSession('accounts/add', async (req, res, session) => {
    let accounts = Db.getAccountsCollection();
    log_.info('req.body', req.body);

    verify(!_.isEmpty(req.body), req.t('req.empty_data'));

    //new addition
    verify(req.body.companyTin, 'Company TIN is required');
    verify(req.body.email, 'Email is required');

    const accountsCollection = Db.getAccountsCollection();
    const existingAccount = await accountsCollection.findOne({
        $or: [{companyTin: req.body.companyTin}, {email: req.body.email}],
    });
    verify(!existingAccount, 'Account already exists');
    //

    // TODO: only required fields

    let newAccountData = req.body as Db.EntityAccount;

    newAccountData.createdAt = new Date();
    newAccountData.accountNumber = await Db.generateNewAccountId();
    newAccountData.isActive = false;

    const result = await accounts.insertOne(newAccountData);

    verify(result.acknowledged, req.t('insert.fail'));

    newAccountData._id = result.insertedId;

    respondJsonData(res, newAccountData);
});

registerApiSession('accounts/update_account', async (req, res, session) => {
    let accountMongoId = new ObjectId(requireQueryParam(req, '_id'));
    let accounts = Db.getAccountsCollection();
    log_.info(req.body);

    let updateUserPermissions = false;
    let newAccountActivity;

    if (req.body.accountActivity) {
        newAccountActivity = req.body.accountActivity; // should be an array of strings like ['A', 'F', ...]
        // Get current account document
        const currentAccount = await accounts.findOne({_id: accountMongoId});
        verify(currentAccount, 'auth.account_not_found');

        if (
            !currentAccount?.accountActivity ||
            !arraysEqual(currentAccount?.accountActivity, newAccountActivity)
        ) {
            updateUserPermissions = true;
        }
    }

    // let result = await accounts.updateOne({ _id: accountMongoId }, { $set: req.body });

    let result = await accounts.updateOne({_id: accountMongoId}, {$set: req.body});

    if (updateUserPermissions) {
        let usersCollection = Db.getUsersCollection();
        const users = await usersCollection.find({accountId: accountMongoId}).toArray();
        for (const user of users) {
            let permissionsStr: string = combineUserPermissions(user.role!, newAccountActivity);

            await usersCollection.updateOne(
                {_id: user._id},
                {
                    $set: {permissions: permissionsStr},
                    $unset: {chosenPermissions: ''},
                }
            );

            authjsLogoutUser(user._id.toString());
        }
    }

    respondJsonData(res, result);
});

export function arraysEqual<T>(arr1: T[], arr2: T[], comparator?: (a: T, b: T) => number): boolean {
    if (arr1.length !== arr2.length) return false;

    const sorted1 = [...arr1].sort(comparator);
    const sorted2 = [...arr2].sort(comparator);

    for (let i = 0; i < sorted1.length; i++) {
        if (sorted1[i] !== sorted2[i]) return false;
    }
    return true;
}
