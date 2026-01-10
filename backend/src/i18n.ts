import i18next from 'i18next';
import Backend, {FsBackendOptions} from 'i18next-fs-backend';
import * as I18HttpMiddleware from 'i18next-http-middleware';

import {makeFilePath} from './tslib/filename';
import {Setup} from './config';
import {app} from './app';

let setup = new Setup();

await i18next
    .use(Backend)
    // .init<FsBackendOptions>({
    // })
    .use(I18HttpMiddleware.LanguageDetector) // Auto-detect language from request
    .init({
        // debug: true,
        fallbackLng: 'en', // Default language
        preload: ['en', 'am'], // Load languages on startup
        load: "languageOnly",
        ns: 'translation',
        defaultNS: 'translation',
        backend: {
            // loadPath: path.join(__dirname, 'locales/{{lng}}.json'), // Path to translation files
            loadPath: makeFilePath(setup.getLocalesDir(), '{{lng}}/{{ns}}.yaml'), // Path to translation files
            addPath: makeFilePath(setup.getLocalesDir(), '{{lng}}/{{ns}}.missing.yaml'),
        },
        saveMissing: true,
        detection: {
            // order: ['querystring', 'header', 'cookie'], // Define detection order
            order: ['cookie'], // Define detection order
            lookupQuerystring: 'lang', // Detect language from "lang" query parameter
            // lookupHeader: 'accept-language',
            lookupCookie: 'i18next',
            caches: ['cookie'], // Disable caching if necessary
        },
    });

export default i18next;
