import React from 'react';

import {Modal, Box, useTheme, SxProps, Theme} from '@mui/material';

import ProgressIndicator, {ProgressIndicatorProps} from './ProgressIndicator';

export default function ProgressModal(props: ProgressIndicatorProps) {
    if (props.show === false) return <></>;
    return <ProgressModalBody {...props} />;
}

function ProgressModalBody(props: ProgressIndicatorProps) {
    const theme = useTheme();
    // const [propsSx, setPropsSx] = React.useState<SxProps<Theme>>(theme.tsui?.dialog ?? {});

    const handleClose = React.useCallback((_, reason) => {
        if (reason !== 'backdropClick') {
            //handleModalClose(props);
        }
    }, []);

    return (
        <Modal open={true} onClose={handleClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    p: 4,
                    // boxShadow: theme.tsui?.dialog?.boxShadow,
                    // border: theme.tsui?.dialog?.border,
                    // ...propsSx,
                    ...theme.tsui?.dialog ?? {},
                }}
            >
                <ProgressIndicator {...props} />
            </Box>
        </Modal>
    );
}
