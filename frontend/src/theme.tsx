'use client';

import {Global, css} from '@emotion/react';
import {createTheme, CSSInterpolation, SxProps, Theme} from '@mui/material/styles';
import type {} from '@mui/x-data-grid-pro/themeAugmentation';
import {Mode} from '@mui/system/cssVars/useCurrentColorScheme';

import {TsUiTheme} from '@/tsui/ThemeBase';

// Extend the theme with custom properties
declare module '@mui/material/styles' {
    interface Theme {
        tsui: TsUiTheme;
    }
    interface ThemeOptions {
        tsui?: TsUiTheme;
    }
}

import '@fontsource-variable/noto-sans-armenian';
// import '@fontsource-variable/noto-sans-armenian/300.css';
// import '@fontsource-variable/noto-sans-armenian/400.css';
// import '@fontsource-variable/noto-sans-armenian/500.css';
// import '@fontsource-variable/noto-sans-armenian/600.css';
// import '@fontsource-variable/noto-sans-armenian/700.css';


import '@fontsource/roboto';

// import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


export type ColorThemeMode = 'light' | 'dark';

export const defaultThemeMode: ColorThemeMode = 'light';

export const toolpadTextFieldSx: SxProps<Theme> = {
    pt: 1,
    pb: 2,
};

export const mainNavigationDrawerWidth = 280;

export const mainBackgroundColor = '#F5F9F9';
// export const dialogPaperBorder = '2px solid #90caf9';
export const dialogPaperBorder = '2px solid #00ABBE';
export const mainPrimaryColor = '#00ABBE';
export const mainIconColor = '#1CA461';
export const accordionBorderColor = '#D9D9D9';
export const aboutCompanyBottomDividerColor = '#F5F9F9'; //dce0e0

export const materialIconHeight = 23;
export const accordionSummaryHeight = 50;
export const filtersSelecteWidth = 250;
export const actionColumnWidth3 = 110;

export const facebookUrl = 'https://www.facebook.com/mudbase.armenia';
export const instagramUrl = 'https://www.instagram.com/mudbase_armenia';
// export const instagramUrl = 'https://www.instagram.com/mudbase_armenia?igsh=MTAyMnRyamdtb2pwZA%3D%3D&utm_source=qr'
export const telegramUrl = 'https://t.me/mudbase';
export const youtubeUrl = 'https://www.youtube.com/watch?v=5gPErNk6-eM';

const globalFonts = ['Noto Sans Armenian Variable', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Oxygen', 'Helvetica', 'Arial', 'sans-serif'];

const codeFonts = ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'];

export const globalStyles = {
    '*': {
        draggable: false,
    },

    body: {
        margin: 0,
        padding: 0,
        fontFamily: globalFonts.join(','),

        fontSmooth: 'auto',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',

        backgroundColor: defaultThemeMode === 'light' ? '#fafafa' : '#121212',

        //backgroundColor: '#000000',
        // backgroundColor: '#242c37',

        // backgroundRepeat: 'no-repeat',
        // backgroundSize: 'cover',
        // backgroundAttachment: 'fixed',
        // backgroundImage: 'url("/images/page-background.png")',
        // background: `linear-gradient(to right, #3D3E42 , #2C2D31 , #1B1C21)`
        // background: `linear-gradient(to right, #1B1C21 , #2C2D31 , #3D3E42)`,
    },

    code: {
        fontFamily: codeFonts.join(','),
    },

    '.swal2-container': {
        zIndex: 2000, // ensure this is higher than the MUI Dialog's z-index
    },
};

export function GlobalStyles() {
    return <Global styles={css(globalStyles)} />;
}

export var theme: Theme;

export function createAppTheme(mode: Mode | string) {
    // console.log(mode);

    // console.log("Color Theme: ", ThemeInstance.isDark);

    theme = createTheme({
        typography: {
            fontFamily: globalFonts.join(','),
        },

        cssVariables: {
            colorSchemeSelector: 'data-toolpad-color-scheme',
        },

        // colorSchemes: { dark: true, light: true },

        palette: {
            mode: mode === 'dark' ? 'dark' : 'light',
            text: {
                primary: mode === 'dark' ? '#ffffff' : '#000000',
                secondary: mode === 'dark' ? '#ffffff' : '#000000',
            },
            primary: {
                main: mode === 'dark' ? '#90caf9' : mainPrimaryColor,
            },
            background: {
                default: mode === 'dark' ? '#121212' : mainBackgroundColor,
                paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
        },

        components: {
            // MuiCssBaseline: {
            //     styleOverrides: {
            //       body: {
            //         lineHeight: 1.5,
            //       },
            //     },
            //   },

            MuiButton: {
                styleOverrides: {
                    contained: {
                        color: mode === 'dark' ? 'black' : 'white',
                    },
                },
            },

            MuiDialog: {
                styleOverrides: {
                    paper: {
                        border: dialogPaperBorder,
                    },
                },
            },

            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        textAlign: 'center',
                    },
                },
            },

            // MuiTooltip: {
            //     defaultProps: {
            //         enterDelay: 100,
            //         enterNextDelay: 100,
            //         leaveDelay: 0,
            //     },
            // },

            MuiDataGrid: {
                styleOverrides: {
                  columnHeader: {
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      justifyContent: 'center',
                    },
                  },
                },
              },
            //   MuiDataGridPro: {
            //     styleOverrides: {
            //       columnHeader: {
            //         '& .MuiDataGrid-columnHeaderTitleContainer': {
            //           justifyContent: 'center',
            //         },
            //       },
            //     },
            //   },

            // MuiDataGridPro: {
            //     styleOverrides: {
            //         root: {
            //             '& .MuiDataGrid-cell--actions .MuiSvgIcon-root': {
            //                 fontSize: '38px',
            //             },
            //         },
            //     },
            // },
        },

        tsui: {
            table: {
                oddRowColor: mode === 'dark' ? '#181818' : '#f0f0f0',
                rowHoverColor: mode === 'dark' ? '#101010' : '#e0e0e0',
            },
            form: {
                // textFieldBorderRadius: '10px',
                textFieldDisplayBorder: 'none',
            },

            // dialog: {
            //     border: dialogPaperBorder,
            // },
        },
    });

    return theme;
}

// global.theme_ = new ThemeInstance();

// export function initTheme() { }

// export default global.theme_;
