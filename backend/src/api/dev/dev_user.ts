import { ObjectId } from 'mongodb';

import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';

import { authjsCreateUser, authjsSignUp } from '@src/authjs/authjs_signup';
import * as Db from '@src/db';
import { requireQueryParam, getReqParam } from '@tsback/req/req_params';
import { verify } from '../../tslib/verify';
import { authjsChangePassword } from '../../authjs/authjs_lib';
import { combineUserPermissions } from '../../permissions/roles_setup';
import { getAllowedPagesByActivities, PermissionsId, RadioPermissionChoice } from '@/tsmudbase/permissions_setup';
import { AccountActivity } from '@/tsmudbase/company_activities';

registerApiSession('dev/add_user', async (req, res) => {
    await authjsSignUp(req, res);
});

registerApiSession('dev/fetch_users', async (req, res, session) => {
    // session.assertPermission(Permissions.UsersFetchAll);

    let users = Db.getUsersCollection();

    const data = await users.find({}, { projection: { password: 0 } }).toArray();

    respondJsonData(res, data);
});

registerApiSession('dev/delete_user', async (req, res, session) => {

    let users = Db.getUsersCollection();

    let userId = requireQueryParam(req, 'userId');
    let mongoUserId = new ObjectId(userId);

    let errorMessages = [];

    let countOffers = await Db.getMaterialOffersCollection().countDocuments({ userId: mongoUserId });
    if (countOffers > 0) {
        errorMessages.push("User has posted material offers.");
    }

    let countLaborOffers = await Db.getLaborOffersCollection().countDocuments({ userId: mongoUserId });
    if (countLaborOffers > 0) {
        errorMessages.push("User has posted labor offers.");
    }

    let countLaborPricesJournal = await Db.getLaborPricesJournalCollection().countDocuments({ userId: mongoUserId });
    if (countLaborPricesJournal > 0) {
        errorMessages.push("User has labor prices recorded in the journal.");
    }

    let countMaterialPricesJournal = await Db.getMaterialPricesJournalCollection().countDocuments({ userId: mongoUserId });
    if (countMaterialPricesJournal > 0) {
        errorMessages.push("User has material prices recorded in the journal.");
    }

    let countEstimates = await Db.getEstimatesCollection().countDocuments({ userId: mongoUserId });
    if (countEstimates > 0) {
        errorMessages.push("User has created estimates.");
    }

    let checkEstimates = await Db.getEstimatesCollection().countDocuments({ createdByUserId: mongoUserId });
    let checkSharedEstimates = await Db.getEstimatesSharesCollection().countDocuments({ sharedByUserId: mongoUserId });
    if (checkEstimates > 0) {
        errorMessages.push("User has created estimates.");
    }
    if (checkSharedEstimates > 0) {
        errorMessages.push("User has shared estimates.");
    }

    if (errorMessages.length > 0) {
        verify(false, `User cannot be deleted because: ${errorMessages.join(' ')}`);
    }

    log_.info(userId);

    let result = await users.deleteOne({ _id: mongoUserId });

    console.log('result', userId);

    respondJsonData(res, result);
});


registerApiSession('dev/delete_pending_user', async (req, res, session) => {

    let userId = requireQueryParam(req, 'pendingUserId');
    let mongoUserId = new ObjectId(userId);

    //   let user = await users.findOne({_id: mongoUserId});

    let pendingUsers = Db.getPendingUsersCollection();

    let result = await pendingUsers.deleteOne({ _id: mongoUserId });

    respondJsonData(res, result);
});




registerApiSession('dev_user/set_account', async (req, res, session) => {

    let userId = new ObjectId(requireQueryParam(req, 'userId'));
    console.log(userId)
    let accountId = new ObjectId(requireQueryParam(req, 'accountId'));

    let users = Db.getUsersCollection();

    await users.updateOne({ _id: userId }, { $set: { accountId: accountId } });

    respondJsonData(res, {});
});


registerApiSession('dev_user/set_account_admin', async (req, res, session) => {
    let userId = new ObjectId(requireQueryParam(req, 'userId'));
    log_.info(userId)
    let isAccountAdmin = requireQueryParam(req, 'isAccountAdmin');

    let users = Db.getUsersCollection();

    await users.updateOne({ _id: userId }, { $set: { isAccountAdmin: isAccountAdmin } });

    respondJsonData(res, {});
});


registerApiSession('dev_user/set_password', async (req, res, session) => {

    let userEmail = getReqParam(req, "email");
    let userId = getReqParam(req, "userId");
    let password = requireQueryParam(req, "password");

    let users = Db.getUsersCollection();
    let user: Db.EntityUser | null = null;


    if (userEmail)
        user = await users.findOne({ email: userEmail });

    if (userId)
        user = await users.findOne({ _id: new ObjectId(userId) });

    verify(user, req.t('auth.user_not_found'));

    let mongoUserId = user?._id;

    let result = await authjsChangePassword(user?._id?.toString()!, password);


    // let userId = new ObjectId(requireQueryParam(req, 'userId'));
    // log_.info(userId)
    // let isAccountAdmin = requireQueryParam(req, 'isAccountAdmin');


    // await users.updateOne({ _id: userId }, { $set: { isAccountAdmin: isAccountAdmin } });

    respondJsonData(res, result);
});


registerApiSession('dev/all_users_permissions_update', async (req, res, session) => {
    const usersCollection = Db.getUsersCollection();
    const accountsCollection = Db.getAccountsCollection();

    const allUsers = await usersCollection.find({}).toArray();

    for (const user of allUsers) {

        const account = await accountsCollection.findOne({ _id: user.accountId });
        if (!user.role || !account?.accountActivity) {
            continue;
        }
        // verify(user.role, `No user role found for user ${user._id} with accountId ${accountId}`)
        // verify(user.chosenPermissions, `No user permissions found for user ${user._id} with accountId ${accountId}`)
        // verify(account, `No account found for user ${user._id} with accountId ${accountId}`)

        let permissionsStr = '';
        if (user.chosenPermissions) {
            permissionsStr = combineUserPermissions(user.role!, account!.accountActivity!, user.chosenPermissions);
        } else {
            permissionsStr = combineUserPermissions(user.role!, account!.accountActivity!);
        }

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { permissions: permissionsStr } }
        );
    }

    log_.info('all_users_permissions_update done')
    respondJsonData(res, {});
});

// registerApiSession('dev/all_users_permissions_update', async (req, res, session) => {
//     const usersCollection = Db.getUsersCollection();
//     const accountsCollection = Db.getAccountsCollection();

//     // 1) Fetch all users
//     const allUsers = await usersCollection.find({}).toArray();

//     for (const user of allUsers) {
//         // 2) If the user has no accountId or no accountActivity, skip them
//         if (!user.accountId) continue;
//         if (user.role === 'S') continue

//         const account = await accountsCollection.findOne({ _id: user.accountId });
//         if (!account?.accountActivity) continue;

//         // 3) Prepare a variable to hold whichever chosenPermissions we end up using:
//         let chosenPermsForCombine: Record<PermissionsId, RadioPermissionChoice>;
//             console.log('userrrrrrrrrrrrr: ', user)

//         if (user.chosenPermissions) {
//             // 3a) If they already have chosenPermissions, use it directly:
//             chosenPermsForCombine = user.chosenPermissions as Record<PermissionsId, RadioPermissionChoice>;
//         } else {
//             log_.info('I am hereeeeeeeeeeeee: ')
//             // 3b) Otherwise, we need to build a new chosenPermissions based on accountActivity:
//             //     - “edit” for pages where allowedPermission === “viewOrEdit”
//             //     - “view” for pages where allowedPermission === “viewOnly”
//             //
//             //    (getAllowedPagesByActivities will filter out any page whose merged permission is “none”.)
//             const allowedPages = getAllowedPagesByActivities({ accountActivity: account.accountActivity as AccountActivity[] });
//             // PRE-FILL all possible pages with default “view” (so TS knows all keys exist)
//             const newChosen: Record<PermissionsId, RadioPermissionChoice> = {
//                 estimates: 'view',
//                 accountLaborOfferCatalog: 'view',
//                 accountMaterialsOfferCatalog: 'view',
//                 accountInfo: 'view',
//             };

//             // Now override to “edit” where appropriate
//             allowedPages.forEach((page) => {
//                 if (page.allowedPermission === 'viewOrEdit') {
//                     newChosen[page.id] = 'edit';
//                 }
//                 // If it was viewOnly, it stays as “view”
//             });

//             // 3c) Save this back to the user document as chosenPermissions
//             await usersCollection.updateOne(
//                 { _id: user._id },
//                 { $set: { chosenPermissions: newChosen } }
//             );

//             chosenPermsForCombine = newChosen;
//         }

//         // 4) Now call combineUserPermissions(...) with whichever chosenPermsForCombine we now have:
//         //    (Assumes combineUserPermissions(role: string, activities: AccountActivity[], chosen: Record<…>) returns the final “permissions” string.)
//         const permissionsStr = combineUserPermissions(
//             user.role!,
//             account.accountActivity as AccountActivity[],
//             chosenPermsForCombine
//         );

//         // 5) Update the user’s “permissions” field
//         await usersCollection.updateOne(
//             { _id: user._id },
//             { $set: { permissions: permissionsStr } }
//         );
//     }

//     log_.info('all_users_permissions_update done');
//     return respondJsonData(res, {});
// });

registerApiSession('dev/move_from_pednings_to_users', async (req, res, session) => {
    const pendingNotVerifiedUserEmail = getReqParam(req, "email");


    const pendingUsers = Db.getPendingUsersCollection()
    const pendingUserInfo = await pendingUsers.findOne({ pendingNotVerifiedUserEmail })
    verify(pendingUserInfo, 'No pending user found with that email')
    verify(!pendingUserInfo?.emailVerified, 'That user is already verified')

    await pendingUsers.deleteOne({ pendingNotVerifiedUserEmail })
    const newUserData = {
        email: pendingUserInfo!.email,
        ...(pendingUserInfo?.password && { password: pendingUserInfo.password }),
        ...(pendingUserInfo?.firstName && { firstName: pendingUserInfo.firstName }),
        ...(pendingUserInfo?.lastName && { lastName: pendingUserInfo.lastName }),
        ...(pendingUserInfo?.phoneNumber && { phoneNumber: pendingUserInfo.phoneNumber }),
        permissions: '',
        isActive: true,
    }

    if (newUserData) {
        await authjsCreateUser(newUserData, true)
    }

    respondJsonData(res, { verified: 1 })
});