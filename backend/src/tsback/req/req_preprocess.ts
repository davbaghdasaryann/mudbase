import {Request, Response} from 'express';

export function preProcessReq(req: Request, res: Response) {
    //let ip = req.header('x-forwarded-for') || req.socket.remoteAddress;
    //let ip = req.clientIp;
    //req.socket.remoteAddress

    // if (config_.dev) {
    //     log_.info(`[${ip}] ${req.path}`);
    // }
    if (config_.dev) {
        log_.info(`${req.path}`);
    }
    //res.set("Cache-Control", "no-cache");
}
