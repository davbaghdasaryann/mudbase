import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
// import Backend from 'i18next-http-backend';
// import LanguageDetector from "i18next-browser-languagedetector";
import {i18n as nextI18NextConfig} from 'next-i18next';


// Import translations manually
import enTranslation from '@/locales/en/translation.json';
import amTranslation from '@/locales/am/translation.json';
import { i18nextLngId } from './data/global_dispatch';

export function getUserStoredLanguage() {
    if (typeof window === 'undefined')
        return 'en';

    let storedLang = localStorage.getItem(i18nextLngId);
    if (storedLang) return storedLang;

    return 'am';

    // const userLanguageCanonical = navigator.language || navigator.languages[0];
    // const userLanguage = userLanguageCanonical.split('-')[0];
    // if (userLanguage !== 'en')
    //     return 'am';
    // return userLanguage;
}


// const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem(i18nextLngId) : null;

export const i18nEnabled = true;

i18n
    // .use(Backend) // Load translations from /public/locales
    //   .use(LanguageDetector) // Detect browser language
    .use(initReactI18next) // Pass instance to react-i18next
    .init({
        ...nextI18NextConfig,
        // lng: storedLanguage || 'en',
        lng: getUserStoredLanguage(),
        fallbackLng: 'en',
        // debug: process.env.NODE_ENV === 'development', // Enable debug only in development
        interpolation: {
            escapeValue: false, // React already escapes XSS
        },
        resources: {
            en: {translation: enTranslation},
            am: {translation: amTranslation},
        },
    });

export default i18n;

