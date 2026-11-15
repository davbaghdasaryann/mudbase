import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam, getQueryParam } from '@/tsback/req/req_params';

registerApiSession('shop/category_create', async (req, res, session) => {
    session.assertPermission('ACC_FCH');
    const name = requireQueryParam(req, 'name');
    const parentIdParam = getQueryParam(req, 'parentId');
    const col = Db.getShopCategoriesCollection();
    const filter = parentIdParam ? { parentId: new ObjectId(parentIdParam) } : { parentId: { $exists: false } };
    const displayIndex = await col.countDocuments(filter);
    const doc: Db.EntityShopCategory = {
        name,
        ...(parentIdParam ? { parentId: new ObjectId(parentIdParam) } : {}),
        displayIndex,
        createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
