import { Request, Response } from 'express';

import { handleReqException } from '../tsback/req/req_exception';
import { preProcessReq } from '../tsback/req/req_preprocess';
import { ReqSession } from './session';
import { getSessionAuthJS } from '@src/authjs/authjs_get_session';

type RequestHandlerPublic = (req: Request, res: Response) => Promise<any>;
type RequestHandlerSession = (req: Request, res: Response, session: ReqSession) => Promise<any>;


export function registerApiPublic(ep: string, func: RequestHandlerPublic) {
    let callback = async (req: Request, res: Response) => {
        try {
            preProcessReq(req, res);
            return await func(req, res);
        } catch (e) {
            res.json(handleReqException(e));
        }
    };

    let url = `${setup_.apiRoot}/${ep}`;

    expressApp_.get(url, callback);
    expressApp_.post(url, callback);
}

export function registerApiSession(ep: string, func: RequestHandlerSession) {
    let callback = async (req: Request, res: Response) => {
        try {

            preProcessReq(req, res);

            let session = await getSessionAuthJS(req, res);

            // log_.info(session);

            
            if (!session)
                return;

            // log_.info(BigInt(session!.sessionId).toString(10));

            return await func(req, res, session);
        } catch (e) {
            res.json(handleReqException(e));
        }
    };

    let url = `${setup_.apiRoot}/${ep}`;

    expressApp_.get(url, callback);
    expressApp_.post(url, callback);
}






export function registerHandlerPublic(sub: string, ep: string, func: RequestHandlerPublic) {
    registerApiPublic(sub + '/' + ep, func);
}

export function registerHandlerSession(sub: string, ep: string, func: RequestHandlerSession) {
    registerApiSession(sub + '/' + ep, func);
}
