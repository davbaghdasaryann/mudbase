import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';
import { buildRentayinRows } from './rentayin_row_builder';

registerApiSession('rentayin/create', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');
    const estimateName = requireQueryParam(req, 'estimateName');

    const rows = await buildRentayinRows(estimateId, session.mongoAccountId);

    const doc: Db.EntityRentayin = {
        accountId: session.mongoAccountId,
        estimateId: new ObjectId(estimateId),
        estimateName,
        rows,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await Db.getRentayinsCollection().insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
