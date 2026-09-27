import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('karavarum/task_create', async (req, res, session) => {
    const body = req.body as any;
    const title = body.title || requireQueryParam(req, 'title');
    const startDate = new Date(body.startDate || requireQueryParam(req, 'startDate'));
    const endDate = body.endDate ? new Date(body.endDate) : undefined;
    const projectId = body.projectId ? new ObjectId(body.projectId) : undefined;

    const doc: Db.EntityKaravarumTask = {
        accountId: session.mongoAccountId!,
        projectId,
        title,
        description: body.description,
        startDate,
        endDate,
        color: body.color,
        status: body.status ?? 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await Db.getKaravarumTasksCollection().insertOne(doc);
    respondJsonData(res, { _id: result.insertedId, ...doc });
});
