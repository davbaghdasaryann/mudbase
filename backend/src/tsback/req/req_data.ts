import {Request, Response} from 'express';

export function collectReqData(req: Request, fields: string[]) {

    let keys = Object.keys(req.body);

    let obj: any = {};

    for (let upf of fields) {
        if (req.body[upf] !== undefined) {
            obj[upf] = req.body[upf];
        }
    }

    return obj;
}

