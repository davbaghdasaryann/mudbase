import * as Db from '@/db';
import { registerApiSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { assertObject } from '@/tslib/assert';

registerApiSession('estimate/ensure_blank_subsection', async (req, res, session) => {
    const estimateSectionId = requireMongoIdParam(req, 'estimateSectionId');

    const sectionsCol = Db.getEstimateSectionsCollection();
    const section = assertObject(await sectionsCol.findOne({ _id: estimateSectionId }), 'Invalid section id')!;

    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const existing = await subsectionsCol.findOne({ estimateSectionId, name: '' });
    if (existing) {
        respondJsonData(res, { _id: existing._id });
        return;
    }

    const result = await subsectionsCol.insertOne({
        estimateSectionId: section._id,
        estimateId: section.estimateId,
        name: '',
    } as Db.EntityEstimateSubsection);

    respondJsonData(res, { _id: result.insertedId });
});
