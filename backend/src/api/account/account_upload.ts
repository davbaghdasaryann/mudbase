import {ObjectId} from 'mongodb';

import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';

import * as Db from '../../db';
import {requireQueryParam} from '../../tsback/req/req_params';
import {registerApiSession} from '../../server/register';
import {respondJsonData} from '../../tsback/req/req_response';
import {DbFindParams} from '../../tsback/mongodb/mongodb_params';
import {verifyObject} from '../../tslib/verify';
import {makeFilePath} from '../../tslib/filename';

const storage = multer.memoryStorage();
const upload = multer({storage});
expressApp_.use(`${setup_.apiRoot}/account/upload_logo`, upload.single('file'));

registerApiSession('account/upload_logo', async (req, res, session) => {
    let accountId = requireQueryParam(req, 'accountId');
    let mongoAccountId = new ObjectId(accountId);

    verifyObject(req.file, 'No file uploaded');

    let accounts = Db.getAccountsCollection();

    let account = await accounts.findOne({_id: mongoAccountId});
    account = verifyObject(account, 'Invalid account')!;

    // console.log(req);

    let options = new DbFindParams(req, {
        // select: userSelectFields,
        // allowed: getUserProfileFetchFields(),
    });

    // let result = await accounts.findOne({_id: accountId}, options.getFindOptions());
    // let basename = account.accountNumber ?? account._id;
    let basename = accountId;
    let logoFilename = `${basename}_logo.webp`;

    if (config_.local?.static) {
        let accountStaticDir = makeFilePath(config_.local.static, 'accounts', basename);

        if (!fs.existsSync(accountStaticDir)) fs.mkdirSync(accountStaticDir, {recursive: true});

        let logoFilePath = makeFilePath(accountStaticDir, logoFilename);

        await sharp(req.file!.buffer!)
            .resize({width: 300, height: 300, fit: 'cover'})
            .toFormat('webp')
            .toFile(logoFilePath);

        let result = await accounts.updateOne(
            {_id: mongoAccountId},
            {$set: {companyLogo: logoFilename}}
        );
    }

    respondJsonData(res, {companyLogo: logoFilename});
});
