import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';

import * as Db from '@/db';
import { registerApiSession } from '@/server/register';
import { respondJsonData } from '@/tsback/req/req_response';
import { makeFilePath } from '@/tslib/filename';

const storage = multer.memoryStorage();
const upload = multer({ storage });
expressApp_.use(`${setup_.apiRoot}/profile/upload_avatar`, upload.single('file'));

registerApiSession('profile/upload_avatar', async (req, res, session) => {
    if (!req.file) throw new Error('No file uploaded');

    const userId = session.userId;
    const avatarFilename = `${userId}_avatar.webp`;

    if (config_.local?.static) {
        const userStaticDir = makeFilePath(config_.local.static, 'users', userId);
        if (!fs.existsSync(userStaticDir)) fs.mkdirSync(userStaticDir, { recursive: true });

        const avatarFilePath = makeFilePath(userStaticDir, avatarFilename);
        await sharp(req.file.buffer)
            .resize({ width: 300, height: 300, fit: 'cover' })
            .toFormat('webp')
            .toFile(avatarFilePath);

        await Db.getUsersCollection().updateOne(
            { _id: session.mongoUserId },
            { $set: { profileAvatar: avatarFilename } }
        );
    }

    respondJsonData(res, { profileAvatar: avatarFilename });
});
