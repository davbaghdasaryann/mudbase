import {Request as ExpressReq, Response as ExpressRes} from 'express';
import {verify} from '../../tslib/verify';

//
// Requests
//
export function getReqParam(req: ExpressReq, name: string): string | undefined {
    let value = req.query[name];
    if (!value && req.body) value = req.body[name];
    if (!value) return undefined;
    return (value as string).trim();
}

export function getQueryParam(req: ExpressReq, name: string): string | undefined {
    let value = req.query[name];
    if (!value && req.body) value = req.body[name];
    if (!value) return undefined;
    return (value as string).trim();
}

export function requireQueryParam(req: ExpressReq, name: string) {
    let value = getQueryParam(req, name);
    if (!value) throw new Error(`Query parameter missing [${req.path}]: ${name}`);
    return (value as string).trim();
}

export function requireQueryIntParam(req: ExpressReq, name: string): number {
    let value = req.query[name];
    verify(value !== undefined, `Query parameter missing [${req.path}]: ${name}`);
    verify(typeof value === 'string', `Query param is not string [${req.path}]: ${name}`);

    // if (value === undefined) throw new Error(`Query parameter missing [${req.path}]: ${name}`);
    // if (typeof value !== 'string')
    let ival = parseInt(value as string);
    verify(!isNaN(ival), `Query param is not integer [${req.path}]: ${name}`);

    return ival;
}


export function getReqToken(req: ExpressReq): string | undefined {
    if (req.query.token) {
        return req.query.token as string;
    }

    if (req.headers.authorization) {
        let bearer = req.headers.authorization.split(' ', 2);
        if (bearer.length >= 2 && bearer[1].length > 0) {
            return bearer[1] as string;
        }
    }

    return undefined;
}
