import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('karavarum/task_update', async (req, res, session) => {
    const body = req.body as any;
    const id = body.id || requireQueryParam(req, 'id');
    const update: any = { updatedAt: new Date() };
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.startDate !== undefined) update.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) update.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.color !== undefined) update.color = body.color;
    if (body.status !== undefined) update.status = body.status;
    await Db.getKaravarumTasksCollection().updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId },
        { $set: update }
    );
    respondJsonData(res, { ok: true });
});
