'use client';

import React from 'react';

import {Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material';

import {useTranslation} from 'react-i18next';
import Flag from 'react-world-flags';
import Cookies from 'js-cookie';

import {i18nextLngId} from '../../data/global_dispatch';
import { getUserStoredLanguage } from '../../i18n';

const languages = [
    {code: 'en', label: 'English', countryCode: 'GB'},
    {code: 'am', label: 'Հայերեն', countryCode: 'AM'},
    // {code: 'es', label: 'Español', countryCode: 'ES'},
    // {code: 'de', label: 'Deutsch', countryCode: 'DE'},
];


export default function AppLangSelector() {
    const {i18n} = useTranslation();
    const [lang, setLang] = React.useState(i18n.language);
    const [langItem, setLangItem] = React.useState(languages[0]);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    React.useEffect(() => {
        let lng = getUserStoredLanguage();
        // const lng = typeof window !== 'undefined' ? localStorage.getItem(i18nextLngId) : null;
        // if (lng) {
        setLang(lng);
        const currentLanguage = languages.find((lng) => lng.code === i18n.language) || languages[0];
        setLangItem(currentLanguage);
        Cookies.set('i18next', lng);

        // }
    }, []);

    React.useEffect(() => {
        // Update localStorage and state when the language changes
        const handleLanguageChanged = (lng: string) => {
            setLang(lng);
            localStorage.setItem(i18nextLngId, lng);
            const currentLanguage = languages.find((lng) => lng.code === i18n.language) || languages[0];
            setLangItem(currentLanguage);
            Cookies.set('i18next', lng); //, { expires: 7, path: '/' });

            if (typeof window !== 'undefined' ) window.location.reload();

            // console.log('Language updated to:', lng);
        };

        // Listen for language change events from i18next
        i18n.on('languageChanged', handleLanguageChanged);

        // Optionally, store the initial language
        // localStorage.setItem(i18nextLngId, i18n.language);

        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n]);

    const handleClick = React.useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = React.useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleLanguageChange = React.useCallback((lang) => {
        i18n.changeLanguage(lang.code);
        handleClose();
    }, []);

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    width: 50,
                    height: 50,
                }}
            >
                <Flag code={langItem.countryCode} />
            </IconButton>
            <Menu id='language-menu' anchorEl={anchorEl} open={open} onClose={handleClose}>
                {languages.map((lang) => (
                    <MenuItem key={lang.code} onClick={() => handleLanguageChange(lang)}>
                        <ListItemIcon>
                            <Flag code={lang.countryCode} />
                        </ListItemIcon>
                        <ListItemText sx={{ml: 2}}>{lang.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
