import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('shop/category_delete', async (req, res, session) => {
    session.assertPermission('ACC_FCH');
    const id = requireQueryParam(req, 'id');
    const col = Db.getShopCategoriesCollection();
    // Delete subcategories first
    await col.deleteMany({ parentId: new ObjectId(id) });
    await col.deleteOne({ _id: new ObjectId(id) });
    respondJsonData(res, { ok: true });
});
