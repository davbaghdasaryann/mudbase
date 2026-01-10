import {Request, NextFunction, Response} from 'express';


import {ExpressAuth, getSession} from '@auth/express';
// import {skipCSRFCheck} from '@auth/core';

import {authjsConfig} from './authjs/authjs_config';

import {app} from './app';


// const app = global.expressApp_;

// console.log(skipCSRFCheck);

// app.get('/api/auth/csrf', (req, res) => {
//     res.json({
//         csrfToken: 'mockedCsrfToken123', // Replace with actual logic if needed
//     });
// });

app.use('/api/auth/_log', (req, res) => {
    // console.log('Auth log:', req.body);
    res.status(200).json({success: true});
});

app.use('/api/auth/_redirect_dummy', (req, res) => {
    // log_.info(req.url, req.query);
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
    // res.status(401).json({message: 'Invalid Login'});
});

app.use('/api/auth/_redirect_error', (req, res, next) => {
    // console.log(req);

    log_.info(req.url, req.query);
    // req.url.params.error;
    // log_.error(req.query.error);

    if (res.headersSent) {
        res.status(401).json({
            error: req.query.error,
            url: `${config_.auth.frontUrl}/error`,
        });
        return;
    }

    // next();
    // res.status(401).json({message: 'Invalid Login'});
    res.status(401).json({
        message: req.t('auth.invalid_login'),
        url: `${config_.auth.frontUrl}/error`,
    });
});

// app.use('/api/auth/{*ep}', (req, res, next) => {
app.use('/api/auth/*', (req, res, next) => {
    const frontendOrigin = new URL(config_.auth.frontUrl).origin;
    // const frontendOrigin = new URL('/').origin;
    //
    // 🔥 Override req.headers.host so Auth.js generates URLs with frontend origin
    req.headers.host = frontendOrigin.replace(/^https?:\/\//, '');

    // console.log('Modified req.headers.host:', req.headers.host); //  Debugging

    try {
        next();
    } catch (error) {
        console.error('Intercepted Auth.js error:', error);
    }
});

// app.use('/api/auth/*', ExpressAuth(authConfig));

// app.use('/api/auth/{*ep}', async (req: Request, res: Response, next: NextFunction) => {
app.use('/api/auth/*', async (req: Request, res: Response, next: NextFunction) => {
    const fullUrl = `http://${req.headers.host}${req.originalUrl}`;
    const url = new URL(fullUrl);
    const pathname = url.pathname;

    switch (pathname) {
        case '/api/auth/session':
            let session = await getSession(req, authjsConfig);
            if (!session || Object.keys(session).length === 0) {
                // log_.info("redirecting");
                res.json({}); //.redirect("/login");
                return;
            }
            break;

    //     case '/api/auth/callback/credentials':
    //         console.log(url);
    // res.status(401).json({
    //     error: "invalid email or password",
    //     url: 'http://localhost:3008/error?error=Credentials&code=credentials',
    // });
    // return;
    //         break;
        case '/api/auth/signin':
            // let error = url.searchParams.get('error');
            // if (error) {
            //     console.log(url);
            //     res.status(200).json({message: "Invalid email or password"});
            //     return;
            // }
            break;
        default:
            break;
    }

    // res.header('Access-Control-Allow-Origin', 'http://localhost:3008');
    // res.header('Access-Control-Allow-Credentials', 'true');

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
