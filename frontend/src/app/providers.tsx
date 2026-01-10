'use client';

import React from 'react';

import {SessionProvider} from 'next-auth/react';
import {usePathname} from 'next/navigation';

import {I18nextProvider, useTranslation} from 'react-i18next';
import i18n from '../i18n';

import Cookies from 'js-cookie';
import {getUserStoredLanguage} from '../i18n';

import * as GD from '@/data/global_dispatch';
import {ColorThemeMode, createAppTheme, defaultThemeMode} from '@/theme';
import {CssBaseline, LinearProgress} from '@mui/material';

import '@/theme';
import {NextAppProvider} from '@toolpad/core/nextjs';
import Env from '@/env';
import createCache from '@emotion/cache';
import {CacheProvider} from '@emotion/react';

const publicRoutes = ['/login', '/join', '/signup', '/images'];

function updateThemeMode(mode: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('colorScheme', mode);
    document.documentElement.style.setProperty('color-scheme', mode);
}

function initThemeMode() {
    if (typeof localStorage === 'undefined') return defaultThemeMode;
    let mode = localStorage.getItem('colorScheme') ?? defaultThemeMode;
    updateThemeMode(mode);
    return mode;
}

export default function Providers({children, session}: {children: React.ReactNode; session?: any}) {
    const [mounted, setMounted] = React.useState(false);

    const pathname = usePathname();
    const normalizedPath = pathname?.replace(/\/+$/, '') || '/';

    const isPublicPage = publicRoutes.includes(normalizedPath);

    const modeRef = React.useRef(initThemeMode());
    // const modeRef = React.useRef<ColorThemeMode>(defaultThemeMode);
    const [mode, setMode] = React.useState(modeRef.current);
    const theme = React.useMemo(() => createAppTheme(mode), [mode]);

    React.useEffect(() => {
        // Set default language
        let lng = getUserStoredLanguage();
        Cookies.set('i18next', lng);

        // console.log("Language is set to", lng);
        // initTheme();

        const handleSetColorMode = () => {
            let newMode = modeRef.current === 'dark' ? 'light' : ('dark' as ColorThemeMode);
            modeRef.current = newMode;
            setMode(newMode);
            updateThemeMode(newMode);
        };

        // document.documentElement.dataset.toolpadColorScheme = defaultThemeMode;

        GD.pubsub_.addListener(GD.colorModeListenerId, handleSetColorMode);

        const disableImageInteractions = (event: MouseEvent) => {
            if ((event.target as HTMLElement)?.tagName === 'IMG') {
                event.preventDefault();
            }
        };

        document.addEventListener('contextmenu', disableImageInteractions);
        document.addEventListener('dragstart', disableImageInteractions);

        if (Env.isProd) {
            console.log = console.info = console.debug = () => {};
        }

        setMounted(true);

        return () => {
            GD.pubsub_.removeListener(GD.colorModeListenerId, handleSetColorMode);

            document.removeEventListener('contextmenu', disableImageInteractions);
            document.removeEventListener('dragstart', disableImageInteractions);
        };
    }, []);

    // console.log(pathname, isPublicPage)

    if (isPublicPage) {
        return (
            <NextAppProvider theme={theme}>
                <CssBaseline />
                <EmotionCacheProvider>{mounted ? <I18nProvider>{children}</I18nProvider> : <LinearProgress />}</EmotionCacheProvider>
            </NextAppProvider>
        );
    }

    return (
        <NextAppProvider theme={theme}>
            <CssBaseline />
            <SessionProvider session={session}>
                <EmotionCacheProvider>{mounted ? <I18nProvider>{children}</I18nProvider> : <LinearProgress />}</EmotionCacheProvider>
            </SessionProvider>
        </NextAppProvider>
    );
}

const I18nProvider = ({children}: {children: React.ReactNode}) => {
    const {t, ready} = useTranslation();

    if (!ready) return <LinearProgress />;

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};


const muiCache = createCache({
    key: 'mui',
    prepend: true,
});

export function EmotionCacheProvider({children}: {children: React.ReactNode}) {
    return <CacheProvider value={muiCache}>{children}</CacheProvider>;
}
