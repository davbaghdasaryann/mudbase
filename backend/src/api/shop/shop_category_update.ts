import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('shop/category_update', async (req, res, session) => {
    session.assertPermission('ACC_FCH');
    const id = requireQueryParam(req, 'id');
    const name = requireQueryParam(req, 'name');
    const col = Db.getShopCategoriesCollection();
    await col.updateOne({ _id: new ObjectId(id) }, { $set: { name } });
    respondJsonData(res, { ok: true });
});
