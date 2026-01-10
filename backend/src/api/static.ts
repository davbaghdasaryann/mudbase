import {Request, Response} from 'express';
import fs from 'fs';
import {makeFilePath} from '../tslib/filename';

// expressApp_.use(`${setup_.apiRoot}/account/upload_logo`, upload.single('file'));

// expressApp_.get('/api/static/{*file}', async (req: Request, res: Response) => {
expressApp_.get('/api/static/*', async (req: Request, res: Response) => {
    const staticRoot = config_.local?.static;

    if (!staticRoot) {
        res.status(500).send('Static backend endpoint is not configured');
        return;
    }

    const fileName = req.params[0];
    // const fileName = req.params.file;

    const filePath = makeFilePath(staticRoot, fileName);

    try {
        fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
        res.status(500).send('Error sending file');
        return;
    }

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).send('Error sending file');
        }
    });

    //fs.accessSync(
});
