import { ObjectId } from 'mongodb';

import * as Db from '../../db';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { verify } from '../../tslib/verify';
import { Permissions } from '../../tsmudbase/permissions_setup';

registerApiSession('account/delete', async (req, res, session) => {
    session.assertPermission(Permissions.UsersFetchAll);

    const accountId = new ObjectId(requireQueryParam(req, 'accountId'));
    const mode: string = requireQueryParam(req, 'mode') ?? 'soft';
    const accounts = Db.getAccountsCollection();

    const account = await accounts.findOne({ _id: accountId });
    verify(account, 'Account not found');

    if (mode === 'with_offers') {
        // Soft-delete account, deactivate users, hard-delete all offers
        await accounts.updateOne({ _id: accountId }, { $set: { deletedAt: new Date(), isDeleted: true } });
        await Db.getUsersCollection().updateMany({ accountId }, { $set: { isActive: false } });
        await Db.getLaborOffersCollection().deleteMany({ accountId });
        await Db.getMaterialOffersCollection().deleteMany({ accountId });
        return respondJsonData(res, { ok: true, mode: 'with_offers' });
    }

    // Default: soft-delete only, keep offers
    await accounts.updateOne({ _id: accountId }, { $set: { deletedAt: new Date(), isDeleted: true } });
    await Db.getUsersCollection().updateMany({ accountId }, { $set: { isActive: false } });
    respondJsonData(res, { ok: true, mode: 'soft' });
});
