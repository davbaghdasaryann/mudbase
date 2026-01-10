import * as Db from '../../../db';

import { requireQueryParam } from '../../../tsback/req/req_params';
import { registerHandlerSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { verify } from '../../../tslib/verify';



registerHandlerSession('estimate', 'rename_section', async (req, res, session) => {
    let estimateSectionNewName = requireQueryParam(req, 'estimateSectionNewName');
    let estimateSectionId = new ObjectId(requireQueryParam(req, 'estimateSectionId'));

    estimateSectionNewName = estimateSectionNewName.trim();
    if (estimateSectionNewName === '') {
        verify(estimateSectionNewName, req.t('required.name'));
    }

    let estimateSections = Db.getEstimateSectionsCollection();


    let result = await estimateSections.updateOne(
        { _id: estimateSectionId },
        {
            $set: {
                name: estimateSectionNewName
            },
        }
    );



    respondJsonData(res, 'renamed');
});
