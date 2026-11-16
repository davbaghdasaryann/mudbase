import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { verify } from '@/tslib/verify';

registerApiSession('shop/listing_delete', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const col = Db.getShopListingsCollection();
    const listing = await col.findOne({ _id: new ObjectId(id) });
    verify(listing, 'Listing not found');
    const isOwner = listing!.accountId?.toString() === session.mongoAccountId?.toString();
    const isSuperAdmin = session.permissions?.includes('ALL') || session.permissions?.includes('ACC_FCH');
    verify(isOwner || isSuperAdmin, 'Permission denied');
    await col.deleteOne({ _id: new ObjectId(id) });
    respondJsonData(res, { ok: true });
});
