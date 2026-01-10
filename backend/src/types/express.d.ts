import 'express';
import {TFunction} from 'i18next';

// declare module 'express' {
declare module 'express-serve-static-core' {
    interface Request {
        i18n: {
            changeLanguage: (lng: string) => Promise<void>;
        };
        t: TFunction;
    }
}
