import {useTranslation as useI18nTranslation, getI18n} from 'react-i18next';

import {i18nEnabled} from '@/i18n';


// let i18nEnabled_ = false;

// try {
//     // const {i18n} = require('i18next');
//     const {i18nEnabled} = require('@/i18n');
//     // console.log(i18nEnabled);
//     i18nEnabled_ = !!i18nEnabled;
// } catch (e) {
//     // i18nEnabled_ = false;
// }

export function useSafeTranslation(namespace?: string) {
    // console.log(i18nEnabled_);
    if (i18nEnabled) {
        return useI18nTranslation(namespace);
    }

    // Dummy t function
    const t = (key: string, _?: any) => key;

    return {t, i18n: null};
}

export function i18nt(text: string | undefined) {
    if (!i18nEnabled) return text;
    
    if (!text) return text;
    let i18t = getI18n();
    if (!i18t || !i18t.t) return text;
    return i18t.t(text);
}
