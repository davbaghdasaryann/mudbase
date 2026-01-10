import React from 'react';
import {Theme, ThemeProvider} from '@mui/material/styles';
import {AppProvider} from '@toolpad/core';
import {NextAppProvider} from '@toolpad/core/nextjs';

import * as GD from '@/data/global_dispatch';
import {ColorThemeMode, createAppTheme, defaultThemeMode} from '../../theme';
import {CssBaseline} from '@mui/material';

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

export default function AppProviderWrapper({children}: {children: React.ReactNode}) {
    return (
        <>
                {children}
        </>
    );
}

/*
export default function AppProviderWrapper({children}: {children: React.ReactNode}) {
    const modeRef = React.useRef(initThemeMode());
    // const modeRef = React.useRef<ColorThemeMode>(defaultThemeMode);
    const [mode, setMode] = React.useState(modeRef.current);
    const theme = React.useMemo(() => createAppTheme(mode), [mode]);

    React.useEffect(() => {
        const handleSetMode = () => {
            let newMode = modeRef.current === 'dark' ? 'light' : 'dark' as ColorThemeMode;
            modeRef.current = newMode;
            setMode(newMode);
            updateThemeMode(newMode);
        };

        // document.documentElement.dataset.toolpadColorScheme = defaultThemeMode; 

        GD.pubsub_.addListener(GD.colorModeListenerId, handleSetMode);

        return () => {
            GD.pubsub_.removeListener(GD.colorModeListenerId, handleSetMode);
        };
    }, []);

    // const [theme, setTheme] = React.useState<Theme>();
    // const currentMode = React.useRef(defaultThemeMode);

    // React.useEffect(() => {

    //     const updateCurrentTheme = () => {
    //         localStorage.setItem('colorScheme', currentMode.current);
    //         setTheme(createAppTheme(currentMode.current));
    //         document.documentElement.style.setProperty('color-scheme', currentMode.current);
    //     };

    //     currentMode.current = localStorage.getItem('colorScheme') ?? defaultThemeMode;
    //     updateCurrentTheme();

    //     const handleSetMode = () => {
    //         let newMode = currentMode.current === 'dark' ? 'light' : 'dark';
    //         currentMode.current = newMode;
    //         updateCurrentTheme();
    //     };

    //     GD.pubsub_.addListener(GD.colorModeListenerId, handleSetMode);

    //     return () => {
    //         GD.pubsub_.removeListener(GD.colorModeListenerId, handleSetMode);
    //     };
    // }, []);

    // if (!theme) return <></>;

    return (
        <>
            <NextAppProvider theme={theme}>
                <CssBaseline />
                {children}
            </NextAppProvider>
        </>
    );
    // return (
    //     <ThemeProvider theme={theme} defaultMode={defaultThemeMode}>
    //         <CssBaseline />
    //         <AppProvider theme={theme}>{children}</AppProvider>
    //     </ThemeProvider>
    // );
}
*/