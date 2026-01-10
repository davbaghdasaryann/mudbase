import * as Db from '../../../db';

import { getReqParam, requireQueryParam } from '../../../tsback/req/req_params';
import { registerApiSession } from '../../../server/register';
import { respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { DbUpdateParams } from '@src/tsback/mongodb/mongodb_params';
import { getAccountUpdateFields, getProfileUpdateFields } from '@src/permissions/db_get_fields';


registerApiSession('dev/remove_estimate_labor_items', async (req, res, session) => {

    let collection = Db.getEstimateLaborItemsCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_estimate_material_items', async (req, res, session) => {

    let collection = Db.getEstimateMaterialItemsCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_estimate_sections', async (req, res, session) => {

    let collection = Db.getEstimateSectionsCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_estimate_subsections', async (req, res, session) => {

    let collection = Db.getEstimateSubsectionsCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});


registerApiSession('dev/remove_estimates', async (req, res, session) => {

    let collection = Db.getEstimatesCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_estimates_shares', async (req, res, session) => {

    let collection = Db.getEstimatesSharesCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_labor_offers', async (req, res, session) => {

    let collection = Db.getLaborOffersCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});

registerApiSession('dev/remove_material_offers', async (req, res, session) => {

    let collection = Db.getMaterialOffersCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});


registerApiSession('dev/remove_labor_prices_journal', async (req, res, session) => {

    let collection = Db.getLaborPricesJournalCollection();

    let result = await collection.deleteMany();

    respondJsonData(res, result);

});




