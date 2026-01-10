import {Response} from 'express';
import * as MongoDb from 'mongodb';
import { respondJsonData } from '../req/req_response';

export function respondUpdateResult(res: Response, result: MongoDb.UpdateResult) {
    respondJsonData(res, result);
}
