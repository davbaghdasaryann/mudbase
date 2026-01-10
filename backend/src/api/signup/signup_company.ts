import { verify } from '@tslib/verify';

import * as Db from '../../db';
import { registerApiPublic, registerApiSession } from '../../server/register';
import { validateEmail } from '@src/tslib/validate';
import { respondJsonData, respondJsonError } from '../../tsback/req/req_response';
import { checkRequiredProperties } from './signup_invite';
import { requireQueryParam } from '../../tsback/req/req_params';
import { DbInsertParams } from '../../tsback/mongodb/mongodb_params';
import { Fields } from '../../permissions/db_fields_setup';
import { hashPassword } from '../../authjs/authjs_lib';
import { loadEmailTemplate } from '../../lib/email';
import { generateInvitationId } from '../../lib/invitation';

import { UserRole } from '../../tsmudbase/user_roles';
import { AccountActivity } from '../../tsmudbase/company_activities';
import { getAllowedPagesByActivities, PermissionsId, RadioPermissionChoice } from '@/tsmudbase/permissions_setup';

registerApiSession('signup/company', async (req, res, session) => {
    // log_.info('req.body', req.body)


    const body = req.body as Db.EntityAccount;

    verify(body.companyTin, 'Company TIN is required');
    verify(body.email, 'Email is required');

    const accountsCollection = Db.getAccountsCollection();
    const existingAccount = await accountsCollection.findOne({
        $or: [
            { companyTin: body.companyTin },
            { email: body.email },
            { companyName: body.companyName }
        ]
    });
    verify(!existingAccount, 'Account already exists');

    const selectedActivities: AccountActivity[] | undefined = body.accountActivity;

    // const userRole: UserRole = 'A';

    // let combinedPermissions: string[] = [];
    // if (Array.isArray(selectedActivities)) {
    //     for (const activity of selectedActivities) {
    //         // Call your function to get permissions for the given role and activity.
    //         const perms = userPermissionsSetUp(userRole, activity);
    //         // Merge and remove duplicates.
    //         combinedPermissions = [...new Set([...combinedPermissions, ...perms])];
    //     }
    // }
    // // Combine the permissions into a single comma-separated string.
    // const permissionsStr = combinedPermissions.join(',');


    const users = Db.getUsersCollection();

    let user = await users.findOne({ _id: session.mongoUserId })
    verify(user, `User not found ${session.mongoUserId ?? 'not'}`);

    log_.info('body', body)
    // Construct a new account using the provided fields.
    const newAccount: Db.EntityAccount = {
        companyName: body.companyName ?? '',
        companyTin: body.companyTin ?? '',
        email: body.email ?? '',
        // Optionally add other fields if provided:
        country: body.country ?? '',
        region: body.region ?? '',
        lawAddress: body.lawAddress ?? '',
        address: body.address ?? '',
        phoneNumber: body.phoneNumber ?? '',
        name: user?.firstName ?? '',
        surname: user?.lastName ?? '',
        login: user?.email ?? '',
        password: user?.password ?? '',
        establishedAt: body.establishedAt ?? '',
        webiste: body.webiste ?? '',
        director: body.director ?? '',
        companyInfo: body.companyInfo ?? '',
        createdAt: new Date(),
        accountNumber: await Db.generateNewAccountId(),
        accountActivity: selectedActivities,
        // permissions: permissionsStr,
        adminUserId: session.mongoUserId,
        isActive: false,
    };

    const insertResult = await accountsCollection.insertOne(newAccount);
    newAccount._id = insertResult.insertedId;



    const allowedPages = getAllowedPagesByActivities({ accountActivity: selectedActivities! });
    const chosenPermissions: Record<PermissionsId, RadioPermissionChoice> = {
        estimates: 'view',
        accountLaborOfferCatalog: 'view',
        accountMaterialsOfferCatalog: 'view',
        accountInfo: 'view',
    };
    allowedPages.forEach(page => {
        if (page.allowedPermission === 'viewOrEdit') {
            chosenPermissions[page.id] = 'edit';
        }
    });

    await users.updateOne(
        { _id: session.mongoUserId },
        {
            $set: {
                accountId: newAccount._id,
                role: 'A',
                chosenPermissions: chosenPermissions
            }
        }
    );

    // await users.updateOne({ _id: session.mongoUserId }, { $set: { accountId: newAccount._id, role: 'A' } })



    return respondJsonData(res, newAccount);
});


