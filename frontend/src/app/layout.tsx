import React from 'react';
import {LinearProgress} from '@mui/material';
import Script from 'next/script';

import Providers from '@/app/providers';

import {defaultThemeMode, GlobalStyles} from '@/theme';
import { setupGA_ID_, setupHtmlMetadata_ } from '@/app/setup';

export const metadata = setupHtmlMetadata_;

export default async function RootLayout({children}: {children: React.ReactNode}) {
    // TODO: choose language

    return (
        // <html lang='en' data-toolpad-color-scheme={defaultThemeMode}>
        <html lang='en' suppressHydrationWarning>
            <head>
                <Script id='toolpad-mode' strategy='beforeInteractive'>
                    {`
                        try {
                            localStorage.setItem('toolpad-mode', ${defaultThemeMode});
                        } catch (_) {}
                    `}
                </Script>

                <Script src={`https://www.googletagmanager.com/gtag/js?id=${setupGA_ID_}`} strategy='afterInteractive' />
                <Script id='gtag-init' strategy='afterInteractive'>
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${setupGA_ID_}', {
                            page_path: window.location.pathname,
                        });
                    `}
                </Script>
            </head>
            <GlobalStyles />
            <body>
                <React.Suspense fallback={<LinearProgress />}>
                    <Providers>
                        <main>{children}</main>
                    </Providers>
                </React.Suspense>
            </body>
        </html>
    );
}
