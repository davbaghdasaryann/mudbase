import {Breakpoint, SxProps} from '@mui/system';

import {Theme} from '@mui/material';

export type PageDialogType = 'panel' | 'confirm' | 'close' | 'yes-no' | 'cancel-confirm';

export interface PageDialogTitle {
    text?: string;
    ttext?: string; // translated text
    name?: string; // field name
    tname?: string; // translated field name
    value?: string; // field value
    tvalue?: string; // translate field value

    valueSx?: SxProps<Theme>;
}

export interface PageDialogStyleProps {
    // Styling
    size?: Breakpoint;
    modeless?: boolean;
    hideBackdrop?: boolean;
}

export interface PageDialogProps extends PageDialogStyleProps {
    type?: PageDialogType;

    title?: string | PageDialogTitle;
    ttitle?: string;

    fromComp?: boolean;

    errorMessage?: string | null;

    loading?: boolean;
    dataLoading?: boolean;

    cancelButton?: boolean;
    cancelButtonLabel?: string;

    onCancel?: () => void;
    onClose?: () => void;
    onCloseFalse?: (p: boolean) => void;
    onCloseNull?: (p: null) => void;

    confirmButton?: boolean;
    confirmLabel?: string;
    confirmButtonSx?: SxProps<Theme>;
    onConfirm?: () => void;

    // contentsForm?: FormHookInstance;
    // contentsFormProps?: FormProps;
    // form?: FormHookInstance;

    children?: React.ReactNode;
}
