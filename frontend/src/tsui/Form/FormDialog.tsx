import React, {useCallback, useEffect} from 'react';

import {Box, Dialog, DialogActions, DialogContent, Paper, PaperProps, Typography, useTheme} from '@mui/material';

import {computeFormAtts} from './FormBody/FormImpl';
import {computeDialogWidth} from '../PageDialog';

import * as FT from './FormTypes';
import {PageDialogProps, PageDialogStyleProps} from '../PageDialogProps';
import {handleModalClose} from '../Types/ModalCloseParams';
import DialogCaption from '../DialogCaption';
import {DialogButton} from '../Buttons/DialogButton';
import {processFormSubmit} from './FormBody/FormProcessSubmit';
import {combineSx} from '../Mui/SxPropsUtil';
import {FormBodyContentsProvider} from './FormContext/FormContextProvider';
import {MDialogStatusProps} from '@/tsui/MDialog';

interface PageFormDialogProps extends FT.FormProps, PageDialogStyleProps {
    onCancel?: () => void;
    status?: MDialogStatusProps;
}

export function PageFormDialog(props: PageFormDialogProps) {
    if (props.render === false || props.show === false) return null;

    return <PageFormDialogBody {...props}>{props.children}</PageFormDialogBody>;
}

function PageFormDialogBody(props: PageFormDialogProps) {
    const theme = useTheme();

    const [updateTick, setUpdateTick] = React.useState(0);
    const forceUpdate = React.useCallback(() => setUpdateTick((t) => t + 1), []);

    const [paperProps, setPaperProps] = React.useState<Partial<PaperProps>>({});
    const cancelButtonLabel = React.useMemo(() => makeCancelButtonLabel(props), []);
    const confirmButtonLabel = React.useMemo(() => makeConfirmButtonLabel(props), []);

    const formAtts = computeFormAtts(props);
    const form = props.form;

    useEffect(() => {
        form.clearError();

        let dialogWidth = computeDialogWidth(props.size);
        let psx = {
            minWidth: dialogWidth,
            width: dialogWidth,
            display: 'flex',
            flexDirection: 'column',
            // height: 'auto',
            // maxHeight: `calc(100vh - ${theme.spacing(4)})`,
        };

        form.onFieldUpdate = props.onFieldUpdate;

        setPaperProps((prev) => ({
            ...prev,
            sx: combineSx(theme.tsui?.dialog, psx),
        }));
        // setPaperProps(combineSx(theme.tsui?.dialog, psx) as SxProps<Theme>);

        return () => {
            form.onFieldUpdate = undefined;
        };
    }, []);

    const handleDialogClose = useCallback((_: any, reason: string) => {
        // console.log(
        if (reason !== 'backdropClick' && props.modeless !== true) {
            props.onCancel?.();
            handleModalClose(props);
        }
    }, []);

    const onCancelButton = useCallback(() => {
        props.onCancel?.();
        handleModalClose(props);
    }, []);

    const handleSubmit = useCallback(() => {
        processFormSubmit(props).then((result) => {
            if (result.errorsCount !== 0) forceUpdate();

            if (result.errorsCount === 0 && props.modeless !== true && props.ignoreDataChecking !== true) {
                handleModalClose(props);
            }
        });

        // // console.log(st.isModal, props.modeless);

        // if (st.isModal && props.modeless !== true) {
        //     handleModalClose(props);
        // }
    }, []);

    const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // prevent full-page reload
        handleSubmit();
    }, []);

    const showActionButtons = !!cancelButtonLabel || !!confirmButtonLabel;

    return (
        // <Box display='block' component='form' id={form.formId} onSubmit={handleFormSubmit}>
        <Dialog
            open={true}
            onClose={handleDialogClose}
            PaperComponent={Paper}
            slotProps={{
                paper: {
                    component: 'form',
                    id: form.formId,
                    onSubmit: handleFormSubmit,
                    sx: paperProps.sx,
                },
            }}
            hideBackdrop={props.modeless}
            disableEnforceFocus={props.modeless}
            scroll='paper'
            sx={{
                pointerEvents: props.modeless ? 'none' : 'auto',
            }}
        >
            <DialogCaption {...props} />

            <DialogContent dividers sx={{py: 2, pointerEvents: 'auto', overflowY: 'auto', flex: 1}}>
                <FormBodyContentsProvider formProps={props} formAtts={formAtts}>
                    {props.children}
                </FormBodyContentsProvider>
            </DialogContent>

            {showActionButtons && (
                <DialogActions sx={{py: 2, pointerEvents: 'auto', flexShrink: 0}}>
                    {props.status && (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flex: 1}}>
                            {props.status.icon && <Box component='span'>{props.status.icon}</Box>}
                            <Typography color={props.status.color}>{props.status.text}</Typography>
                        </Box>
                    )}

                    <DialogButton show={!!cancelButtonLabel} disabled={props.loading} label={cancelButtonLabel} onClick={onCancelButton} sx={props.slotProps?.cancelButton?.sx} />
                    <DialogButton show={!!confirmButtonLabel} type='submit' disabled={props.loading} label={confirmButtonLabel} default sx={props.slotProps?.submitButton?.sx} />
                </DialogActions>
            )}
        </Dialog>
    );
}

function makeCancelButtonLabel(props: PageFormDialogProps) {
    if (props.slotProps?.cancelButton?.show === false) return undefined;
    if (props.slotProps?.cancelButton?.label) return props.slotProps?.submitButton?.label;
    if (props.type === 'panel') return undefined;
    if (props.type === 'yes-no') return 'No';
    return 'Cancel';
}

function makeConfirmButtonLabel(props: PageFormDialogProps) {
    if (props.slotProps?.submitButton?.show === false) return undefined;
    if (props.slotProps?.submitButton?.label) return props.slotProps?.submitButton?.label;
    if (props.type === 'panel') return undefined;
    if (props.type === 'yes-no') return 'Yes';
    return 'Confirm';
}
