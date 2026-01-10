import React from 'react';
import {Box, Stack, CircularProgress, Typography, Backdrop, Dialog, DialogProps} from '@mui/material';
import {useTranslateLabel} from './I18n/TranslateLabel';

export interface ProgressIndicatorProps {
    show?: boolean;
    title?: string;
    tlabel?: string;
    background?: 'data' | 'dialog' | 'backdrop';
    onClose?: () => void;
}

export default function ProgressIndicator(props: ProgressIndicatorProps) {
    if (!props.show) return null;
    return <ProgressIndicatorBody {...props} />;
}

function ProgressIndicatorBody(props: ProgressIndicatorProps) {
    const {label} = useTranslateLabel(props, 'Loading...');
    let color = 'inherit';

    const onCloseDialog: DialogProps['onClose'] = React.useCallback(
        (_event, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                return;
            }
            props.onClose?.();
        },
        [props.onClose]
    );


    if (props.background === 'backdrop') {
        return (
            <Backdrop open sx={{zIndex: 1300}}>
                <CircularProgress color='inherit' />
            </Backdrop>
        );
    }


    if (props.background === 'dialog') {
        return (
            <Dialog open onClose={onCloseDialog} PaperProps={{sx: {width: 240, p: 2}}}>
                <Stack spacing={2} alignItems='center' justifyContent='center'>
                    <Typography align='center' sx={{fontSize: 'x-large', color}}>
                        {label}
                    </Typography>
                    <CircularProgress sx={{'& svg': {color}}} />
                </Stack>
            </Dialog>
        );
    }

    return (
        <Box display='flex' justifyContent='center' sx={{mt: 2}}>
            <Stack direction='column' spacing={2} justifyContent='center' alignItems='center'>
                <Typography align='center' sx={{fontSize: 'x-large', color}}>
                    {label}
                </Typography>
                <CircularProgress sx={{'& svg': {color}}} />
            </Stack>
        </Box>
    );
}
