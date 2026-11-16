import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam, getQueryParam } from '@/tsback/req/req_params';

registerApiSession('shop/listing_create', async (req, res, session) => {
    const materialId = requireQueryParam(req, 'materialId');
    const materialName = requireQueryParam(req, 'materialName');
    const materialCode = getQueryParam(req, 'materialCode') ?? '';
    const price = parseFloat(requireQueryParam(req, 'price'));
    const categoryId = getQueryParam(req, 'categoryId');
    const description = getQueryParam(req, 'description') ?? '';

    const col = Db.getShopListingsCollection();
    const doc: Db.EntityShopListing = {
        accountId: session.mongoAccountId,
        materialId: new ObjectId(materialId),
        materialName,
        materialCode,
        ...(categoryId ? { categoryId: new ObjectId(categoryId) } : {}),
        price,
        description,
        status: 'draft',
        createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
