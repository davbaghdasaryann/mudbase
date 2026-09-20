import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('comparative/create', async (req, res, session) => {
    const { name, analysisType, estimateId, activeTab, selectedCompanies, submittedSelection, enteredDataCompanies, enteredDataCellValues } = req.body as Partial<Db.EntityComparativeAnalysis>;

    const col = Db.getComparativeAnalysesCollection();
    const now = new Date();
    const result = await col.insertOne({
        accountId: session.mongoAccountId,
        userId: session.mongoUserId,
        name: name ?? '',
        analysisType: analysisType ?? 'market',
        estimateId: estimateId ?? null,
        activeTab: activeTab ?? 'general',
        selectedCompanies: selectedCompanies ?? [],
        submittedSelection: submittedSelection ?? null,
        enteredDataCompanies: enteredDataCompanies ?? [],
        enteredDataCellValues: enteredDataCellValues ?? {},
        createdAt: now,
        updatedAt: now,
    });
    respondJsonData(res, { _id: result.insertedId });
});
