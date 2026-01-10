import {Request as ExpressReq, Response as ExpressRes, NextFunction as ExpressNext} from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import * as RequestIp from 'request-ip';

import i18next from 'i18next';
import * as I18HttpMiddleware from 'i18next-http-middleware';
import { getErrorString } from '@/tslib/error';

global.expressApp_ = express();

export const app = global.expressApp_;


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
// app.use(middleware());


// *** Internationalizaion support ***
// i18n Middleware
app.use(I18HttpMiddleware.handle(i18next));
    
// // Middleware to set language dynamically
// app.use((req: Request, _res: Response, next: NextFunction) => {
//     const lang = req.cookies?.i18next || 'en';
//     console.log("middleware lang", lang);
//     // const lang = (req.query.lang as string) || req.headers['accept-language'] || 'en';
//     req.i18n.changeLanguage(lang);
//     next();
// });



//
// Obtaining caller ip address
//
app.set('trust proxy', true);
app.use(RequestIp.mw());

//
// Body parser
//
//app.use(BodyParser.json());
// app.use(BodyParser.raw({type: 'application/octet-stream', limit: '50mb'}));
// app.use(BodyParser.raw({type: 'image/jpeg', limit: '50mb'}));
// app.use(BodyParser.raw({type: 'image/png', limit: '50mb'}));
app.use(express.json());
//app.use(express.text({type: 'text/html'}))

//app.use(BodyParser.urlencoded({extended: true}))

// your own error handler
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//     log_.error(err);
// });

// *** Error handling ***
app.use((err: any, req: ExpressReq, res: ExpressRes, next: ExpressNext) => {
    log_.info('Auth error:', err);

    if (err.message.includes('CredentialsSignin')) {
        // res.status(401).json({error: 'Invalid email or password'});
        res.status(401).json({error: getErrorString(err, 'Invalid email or password')});
        return;
    }

    res.status(500).json({error: getErrorString(err, 'Internal Server Error')});
});
