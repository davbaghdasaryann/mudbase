import {Response} from 'express';

import * as Mime from '../../tslib/mimetypes';


//
// Responses
//

export function respondJson(res: Response, body: any) {
    return res.type(Mime.MimeTypeJson).json(body)
}

export function respondHtml(res: Response, body: string | Buffer) {
    return res.type(Mime.MimeTypeHtml).send(body);
}

export function respondYaml(res: Response, body: string) {
    return res.type(Mime.MimeTypeYaml).send(body)
}

export function respondPdf(res: Response, body: string | Buffer) {
    return res.type(Mime.MimeTypePdf).send(body);
}



export function respondJsonData(res: Response, body?: any) {
    return respondJson(res, body ?? {});
}

export function respondJsonNotAuthorized(res: Response, err: Error | string | unknown) {
    let message = 'Unknown Error!';
    let name = 'Error';

    if (err instanceof Error) {
        name = err.name;
        message = err.message;
    } else if (typeof err === 'string') {
        message = err;
    }

    return res
        .status(401)
        .type(Mime.MimeTypeJson)
        .json({
            error: {code: 2, name: name, message: message},
        });
}

export function respondJsonError(res: Response, err: Error | string | unknown) {
    let message = 'Unknown Error!';
    let name = 'Error';

    if (err instanceof Error) {
        name = 'Error';
        message = err.message;
    } else if (typeof err === 'string') {
        message = err;
    }

    return respondJson(res, {
        error: {code: 2, name: name, message: message},
    });
}

export function assertRespondJson(condition: any, res: Response, err: Error | string | unknown) {
    if (!condition) {
        return respondJsonError(res, err);
    }
    return res;
}
