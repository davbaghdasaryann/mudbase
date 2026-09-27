import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('karavarum/tasks_fetch', async (req, res, session) => {
    const projectId = (req.query as any).projectId as string | undefined;
    const query: any = { accountId: session.mongoAccountId };
    if (projectId) query.projectId = new ObjectId(projectId);
    const tasks = await Db.getKaravarumTasksCollection()
        .find(query)
        .sort({ startDate: 1 })
        .toArray();
    respondJsonData(res, tasks);
});
