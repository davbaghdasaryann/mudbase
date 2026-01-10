import * as Db from '../../db';

import { requireQueryParam } from '../../tsback/req/req_params';
import { registerApiSession, registerHandlerSession } from '../../server/register';
import { respondJsonData } from '../../tsback/req/req_response';
import { ObjectId } from 'mongodb';



registerApiSession('measurement_unit/fetch', async (req, res, session) => {
    let measurementUnitList = Db.getMeasurementUnitCollection();

    // let user = await users.findOne({userId: session.userId}) as Db.EntityUser;

    // user = verifyObject(user, "User not found");

    // let cards = Db.getCardsCollection();

    let cursor = measurementUnitList.find();
    let data: Db.EntityMeasurementUnit[] = [];

    await cursor.forEach((item) => {
        data.push(Db.measurementUnitToApi(item));
    });

    respondJsonData(res, data);
});
