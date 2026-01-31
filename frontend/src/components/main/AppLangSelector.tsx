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
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    border: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    '&:hover': {
                        transform: 'scale(1.05)',
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                    },
                }}
            >
                <Flag code={langItem.countryCode} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </IconButton>
            <Menu
                id='language-menu'
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            borderRadius: 2,
                            minWidth: 180,
                            boxShadow: (theme) =>
                                theme.palette.mode === 'dark'
                                    ? '0 8px 24px rgba(0, 0, 0, 0.5)'
                                    : '0 8px 24px rgba(0, 0, 0, 0.12)',
                        }
                    }
                }}
            >
                {languages.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang)}
                        sx={{
                            borderRadius: 1,
                            mx: 0.5,
                            my: 0.25,
                            '&:hover': {
                                backgroundColor: (theme) =>
                                    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Flag code={lang.countryCode} style={{ width: 28, height: 20, borderRadius: 4 }} />
                        </ListItemIcon>
                        <ListItemText sx={{ml: 1}}>{lang.label}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
