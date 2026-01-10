'use client';
import React from 'react';

import {Breakpoint, Dialog, DialogActions, DialogContent, Paper, PaperProps, SxProps, useTheme} from '@mui/material';

import {isMobile} from 'react-device-detect';

import ErrorMessage from './ErrorMessage';
import ProgressIndicator from './ProgressIndicator';
import DialogCaption from './DialogCaption';
import {DialogButton} from './Buttons/DialogButton';
import {PageForm} from './Form';
import {handleModalClose} from './Types/ModalCloseParams';
import {PageDialogProps} from './PageDialogProps';

class PageDialogState {
    isModal: boolean;
    haveActions: boolean;
    // haveDialogContentEl = true;

    constructor(props: PageDialogProps) {
        this.isModal = props.type !== 'panel';
        this.haveActions = props.type !== 'panel';

        // if (props.contentsForm) {
        //     this.haveDialogContentEl = true; // false
        // }
    }
}

export default function PageDialog(props: PageDialogProps) {
    const theme = useTheme();
    const [paperProps, setPaperProps] = React.useState<Partial<PaperProps>>({});

    const stateRef = React.useRef(new PageDialogState(props));
    const st = stateRef.current;

    const [cancelButtonLabel, setCancelButtonLabel] = React.useState(makeCancelButtonLabel(props));
    const [confirmButtonLabel, setConfirmButtonLabel] = React.useState(makeConfirmButtonLabel(props));

    React.useEffect(() => {
        let dialogWidth = computeDialogWidth(props.size);

        let sx = theme.tsui.dialog ?? {};
        setPaperProps({
            sx: {
                ...sx,
                minWidth: dialogWidth,
                width: dialogWidth,
            },
        });

        // if (props.contentsFormProps) {
        //     props.contentsFormProps.form.error = undefined;
        //     props.contentsFormProps.form.registeredFields.forEach((field) => {
        //         field.error = undefined;
        //     });
        // }
    }, [props.size, theme.tsui.dialog]);

    const handleDialogClose = React.useCallback((_, reason) => {
        if (reason !== 'backdropClick' && props.modeless !== true) {
            handleModalClose(props);
        }
    }, []);

    const handleConfirm = React.useCallback(() => {
        props.onConfirm && props.onConfirm();

        if (st.isModal && props.modeless !== true) {
            handleModalClose(props);
        }
    }, []);

    return (
        <Dialog
            open={true}
            onClose={handleDialogClose}
            PaperComponent={Paper}
            slotProps={{
                paper: paperProps,
            }}
            hideBackdrop={props.modeless}
            disableEnforceFocus={props.modeless}
            sx={{pointerEvents: props.modeless ? 'none' : 'auto'}}
        >
            <DialogCaption {...props} />

            <DialogContent dividers sx={{py: 2, pointerEvents: 'auto'}}>
                <PageDialogContent {...props} />
            </DialogContent>

            {st.haveActions && props.loading !== true && (
                <DialogActions sx={{py: 2, pointerEvents: 'auto'}}>
                    {cancelButtonLabel && <DialogButton label={cancelButtonLabel} onClick={() => handleModalClose(props)} />}
                    {confirmButtonLabel && <DialogButton label={confirmButtonLabel} default onClick={handleConfirm} sx={props.confirmButtonSx} />}
                </DialogActions>
            )}
        </Dialog>
    );
}

export function computeDialogWidth(size?: Breakpoint) {
    let dialogWidth = isMobile ? '94%' : 900;

    if (!isMobile) {
        switch (size) {
            case 'xs':
                dialogWidth = 400;
                break;
            case 'sm':
                dialogWidth = 600;
                break;
            //   case 'md' || props.size === undefined) return 900;
            case 'lg':
                dialogWidth = 1200;
                break;
            case 'xl':
                dialogWidth = 1400;
                break;
            default:
                break;
        }
    }
    return dialogWidth;
}

function PageDialogContent(props: PageDialogProps) {
    if (props.errorMessage) {
        return <ErrorMessage message={props.errorMessage} />;
    }

    if (props.dataLoading) {
        return <ProgressIndicator title='Loading...' />;
    }

    // if (props.form) {
    //     return (
    //         <PageForm form={props.form} formContainer='none'>
    //             {props.children}
    //         </PageForm>
    //     );
    // }

    return <>{props.children}</>;
}

function makeCancelButtonLabel(props: PageDialogProps) {
    if (props.cancelButton === false) return undefined;
    if (props.type === 'panel' || props.type === 'confirm') return undefined;
    if (props.type === 'yes-no') return 'No';
    return 'Cancel';
}

function makeConfirmButtonLabel(props: PageDialogProps) {
    if (props.confirmButton === false) return undefined;
    if (props.confirmLabel) return props.confirmLabel;
    if (props.type === 'panel') return undefined;
    if (props.type === 'yes-no') return 'Yes';
    return 'Confirm';
}
