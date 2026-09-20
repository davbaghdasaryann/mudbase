import { ObjectId } from 'mongodb';
import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';
import { requireQueryParam } from '@/tsback/req/req_params';

registerApiSession('comparative/update', async (req, res, session) => {
    const id = requireQueryParam(req, 'id');
    const { activeTab, selectedCompanies, enteredDataCompanies, enteredDataCellValues } = req.body as Partial<Db.EntityComparativeAnalysis>;

    const col = Db.getComparativeAnalysesCollection();
    const updateFields: Partial<Db.EntityComparativeAnalysis> = { updatedAt: new Date() };
    if (activeTab !== undefined) updateFields.activeTab = activeTab;
    if (selectedCompanies !== undefined) updateFields.selectedCompanies = selectedCompanies;
    if (enteredDataCompanies !== undefined) updateFields.enteredDataCompanies = enteredDataCompanies;
    if (enteredDataCellValues !== undefined) updateFields.enteredDataCellValues = enteredDataCellValues;

    await col.updateOne(
        { _id: new ObjectId(id), accountId: session.mongoAccountId, userId: session.mongoUserId },
        { $set: updateFields }
    );
    respondJsonData(res, { ok: true });
});
