import {Request, NextFunction, Response} from 'express';


import {ExpressAuth, getSession} from '@auth/express';
import {authjsConfig} from './authjs/authjs_config';

import {app} from './app';

app.use('/api/auth/_log', (req, res) => {
    res.status(200).json({success: true});
});

app.use('/api/auth/_redirect_dummy', (req, res) => {
    res.status(200).json({
        success: true,
        url: `${config_.auth.frontUrl}/`,
    });
});

app.use('/api/auth/_redirect_signin', (req, res, next) => {
    log_.info(req.url);


    if (res.headersSent) {
        next();
        return;
    }

    let error = req.query.error;
    if (error) {
        res.status(401).json({
            error: error,
            url: `${config_.auth.frontUrl}/login`,
        });
        return;
    }

    res.status(200).json({success: true});
});

app.use('/api/auth/_redirect_error', (req, res, next) => {
    log_.info(req.url, req.query);

    if (res.headersSent) {
        res.status(401).json({
            error: req.query.error,
            url: `${config_.auth.frontUrl}/error`,
        });
        return;
    }

    res.status(401).json({
        message: req.t('auth.invalid_login'),
        url: `${config_.auth.frontUrl}/error`,
    });
});

app.use('/api/auth/*', (req, res, next) => {
    const frontendOrigin = new URL(config_.auth.frontUrl).origin;
    // 🔥 Override req.headers.host so Auth.js generates URLs with frontend origin
    req.headers.host = frontendOrigin.replace(/^https?:\/\//, '');

    try {
        next();
    } catch (error) {
        console.error('Intercepted Auth.js error:', error);
    }
});

app.use('/api/auth/*', async (req: Request, res: Response, next: NextFunction) => {
    const fullUrl = `http://${req.headers.host}${req.originalUrl}`;
    const url = new URL(fullUrl);
    const pathname = url.pathname;

    switch (pathname) {
        case '/api/auth/session':
            let session = await getSession(req, authjsConfig);
            if (!session || Object.keys(session).length === 0) {
                res.json({});
                return;
            }
            break;

        case '/api/auth/signin':
            break;
        default:
            break;
    }

    ExpressAuth(authjsConfig)(req, res, next);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Auth error:', err);

    if (err.message.includes('CredentialsSignin')) {
        res.status(401).json({error: 'Invalid email or password'});
        return;
    }

    res.status(500).json({error: 'Internal Server Error'});
});
