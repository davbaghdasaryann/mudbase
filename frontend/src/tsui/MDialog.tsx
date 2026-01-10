import React from 'react';

import {Box, Breakpoint, Dialog, DialogActions, DialogContent, DialogProps, Paper, PaperProps, Typography, TypographyProps} from '@mui/material';
import {Skeleton} from '@mui/material';
import {SxProps, Theme, useTheme} from '@mui/material';

import DialogCaption from './DialogCaption';
import {DialogButton} from './Buttons/DialogButton';
import {handleModalClose} from './Types/ModalCloseParams';
import {PageDialogTitle, PageDialogType} from './PageDialogProps';
import {ButtonSlotProps} from '@/tsui/Buttons/PageButton';
import {combineSx} from '@/tsui/Mui/SxPropsUtil';

export interface MDialogSlotProps {
    dialog?: DialogProps;
    paper?: PaperProps;
    cancelButton?: ButtonSlotProps;
    confirmButton?: ButtonSlotProps;
}

export interface MDialogStatusProps {
    icon?: React.ReactNode;
    text?: string;
    color?: TypographyProps['color'];
}

export interface MDialogProps {
    mount?: boolean;
    show?: boolean;
    type?: PageDialogType;

    title?: string | PageDialogTitle;
    ttitle?: string;

    loading?: boolean;

    status?: MDialogStatusProps;

    // Style
    size?: Breakpoint;
    modeless?: boolean;
    hideBackdrop?: boolean;

    onClose?: () => void;
    onCloseFalse?: (p: boolean) => void;
    onCloseNull?: (p: null) => void;

    onConfirm?: () => void;

    slotProps?: MDialogSlotProps;

    children?: React.ReactNode;
}

export default function MDialog(props: MDialogProps) {
    if (props.show === false || props.mount === false) return null;
    return <MDialogBody {...props} />;
}

function MDialogBody(props: MDialogProps) {
    const theme = useTheme();

    const cancelButtonLabel = React.useMemo(() => makeCancelButtonLabel(props), [props]);
    const confirmButtonLabel = React.useMemo(() => makeConfirmButtonLabel(props), [props]);

    const showActionButtons = !!cancelButtonLabel || !!confirmButtonLabel || props.status !== undefined;

    const paperProps = props.slotProps?.paper ?? ({} as PaperProps);
    const dialogWidth = {xs: '90%', md: theme.breakpoints.values[props.size ?? 'sm']};
    const paperSx: SxProps<Theme> = {
        width: dialogWidth,
        minWidth: dialogWidth,
    };
    paperProps.sx = combineSx(paperSx, paperProps.sx);

    const handleDialogClose = React.useCallback((_, reason) => {
        if (reason !== 'backdropClick' && props.modeless !== true) {
            handleModalClose(props);
        }
    }, []);

    const handleConfirm = React.useCallback(() => {
        props.onConfirm && props.onConfirm();

        if (props.modeless !== true) {
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
                <MDialogContent {...props} />
            </DialogContent>

            {showActionButtons && (
                <DialogActions sx={{py: 2, px: 2, pointerEvents: 'auto'}}>
                    {props.status && (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flex: 1}}>
                            {props.status.icon && <Box component='span'>{props.status.icon}</Box>}
                            <Typography color={props.status.color}>{props.status.text}</Typography>
                        </Box>
                    )}

                    <DialogButton
                        show={!!cancelButtonLabel}
                        disabled={props.loading}
                        label={cancelButtonLabel}
                        onClick={() => handleModalClose(props)}
                        sx={props.slotProps?.cancelButton?.sx}
                    />
                    <DialogButton
                        show={!!confirmButtonLabel}
                        disabled={props.loading}
                        label={confirmButtonLabel}
                        onClick={() => handleConfirm()}
                        default
                        sx={props.slotProps?.confirmButton?.sx}
                    />
                </DialogActions>
            )}
        </Dialog>
    );
}

function MDialogContent(props: MDialogProps) {
    if (props.loading) {
        return <Skeleton>{props.children}</Skeleton>;
    }

    return <>{props.children}</>;
}

function makeCancelButtonLabel(props: MDialogProps) {
    if (props.slotProps?.cancelButton?.label) return props.slotProps?.cancelButton?.label;
    if (props.type === 'panel' || props.type === 'confirm') return undefined;
    if (props.type === 'close') return 'Close';
    if (props.type === 'yes-no') return 'No';
    return 'Cancel';
}

function makeConfirmButtonLabel(props: MDialogProps) {
    // if (props.confirmButton === false) return undefined;
    if (props.slotProps?.confirmButton?.label) return props.slotProps?.confirmButton?.label;
    if (props.type === 'panel') return undefined;
    if (props.type === 'close') return undefined;
    if (props.type === 'yes-no') return 'Yes';
    return 'Confirm';
}
