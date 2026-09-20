import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('comparative/save_state', async (req, res, session) => {
    const { analysisType, estimateId, activeTab, selectedCompanies, submittedSelection, enteredDataCompanies, enteredDataCellValues } = req.body as Partial<Db.EntityComparativeState>;

    const col = Db.getComparativeStateCollection();
    await col.updateOne(
        { accountId: session.mongoAccountId, userId: session.mongoUserId },
        {
            $set: {
                accountId: session.mongoAccountId,
                userId: session.mongoUserId,
                analysisType: analysisType ?? 'market',
                estimateId: estimateId ?? null,
                activeTab: activeTab ?? 'general',
                selectedCompanies: selectedCompanies ?? [],
                submittedSelection: submittedSelection ?? null,
                enteredDataCompanies: enteredDataCompanies ?? [],
                enteredDataCellValues: enteredDataCellValues ?? {},
                updatedAt: new Date(),
            },
        },
        { upsert: true }
    );
    respondJsonData(res, { ok: true });
});
