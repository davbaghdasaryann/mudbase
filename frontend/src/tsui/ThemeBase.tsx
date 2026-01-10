import * as CSS from 'csstype';

import * as Form from './Form';
import * as UE from './UiElements'
import { SxProps, Theme } from '@mui/material';



export interface TsUiTheme {
    page?: TsUiPageTheme;
    table?: TsUiTableTheme;
    form?: TsUiThemeForm;
    dialog?: SxProps<Theme>;
};

export interface TsUiPageTheme {
    toolbarHeight?: number;
};

export interface TsUiTableTheme {
    rowHeight?: number;
    oddRowColor?: string;
    rowHoverColor?: string;
    actionButtonWidth?: number;
    actionButtonHeight?: number;
};

export interface TsUiThemeForm {
    border?: CSS.Property.Border | number;
    gridSpacing?: number;
    textFieldDisplayBorder?: CSS.Property.Border | number;
    textFieldPaddingLeft?: CSS.Property.PaddingLeft;
    textFieldBorderRadius?: CSS.Property.BorderRadius;
};

export interface TsUiDialogTheme {
    border?: CSS.Property.Border | number;
    boxShadow?: string;
};


export function makeDialogThemeSx(dialog: TsUiDialogTheme | undefined): SxProps<Theme> {
    if (dialog === undefined) return {};

    return {
        border: dialog.border,
        boxShadow: dialog.boxShadow,
    }
}


export type GetButtonWidthFunc = (size?: Form.FormSizeType) => number;


export class ThemeBase {
    static isDark = true;

    static muiPrimaryMain = this.isDark ? '#90caf9' : '#1976d2';
    static muiPrimaryLight = this.isDark ? '#e3f2fd' : '#42a5f5';
    static muiPrimaryDark = this.isDark ? '#42a5f5' : '#1565c0';

    static muiBackground = this.isDark ? '#121212' : '#f0f0f0';

    indicatorColor = ThemeBase.muiPrimaryMain;

    // Forms
    formPadding = 1;
    getFormButtonSize?: GetButtonWidthFunc;


    dialog = new ThemeDialog();
    dialogTextColor?: string;


    pageToolbarHeight?: number;


    // Tables
    tableRowHeight?: number;
    tableOddRowColor?: string;
    tableActionButtonWidth?: number;
    tableActionButtonHeight?: number;



    textField = new ThemeTextField();
    // cancelButton = new ThemeButton();
    // submitButton = new ThemeButton();


    formGridSpacing = 2; //device.mobile() ? 1.2 : 2;


}

class ThemeDialog {
    height?: number | string = '90%';
    background?: UE.UiBackground;
    backgroundImage?: string;
    border?: UE.UiBorder;
    boxShadow?: string;

    sx() {
        return  {
            ...this.border ? this.border.sx() : {},
            ...this.background ? this.background.sx() : {},
            boxShadow: this.boxShadow,
            backgroundImage: this.backgroundImage,
        }
    }
}

class ThemeTextField {
    paddingLeft?: number | string;
    borderRadius?: number | string;
}

// class ThemeButton {
//     background?: UE.UiBackground;
//     border?: UE.UiBorder;
//     boxShadow?: string;

//     sx() {
//         return  {
//             ...this.border ? this.border.sx() : {},
//             ...this.background ? this.background.sx() : {},
//             boxShadow: theme_.dialog.boxShadow,
//         }
//     }
// }
