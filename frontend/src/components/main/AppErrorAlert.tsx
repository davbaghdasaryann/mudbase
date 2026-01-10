import React from 'react';

import {Alert, Snackbar} from '@mui/material';
import * as GD from '@/data/global_dispatch';

export default function AppErrorAlert() {
    const [showError, setShowError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const handleError = (error: Error) => {
            console.log(error);
            setShowError(error.message);
        };

        GD.pubsub_.addListener(GD.errorListenerId, handleError);

        return () => {
            GD.pubsub_.removeListener(GD.errorListenerId, handleError);
        };
    }, []);

    const handleClose = React.useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return; // Prevent closing when clicking outside
        setShowError(null);
    }, []);

    if (!showError) return null;

    return (
        <Snackbar
            open={true}
            autoHideDuration={10000} // 10 seconds
            onClose={handleClose}
            anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            sx={{
                width: 1,
            }}

        >
            <Alert severity='error' variant='filled' onClose={handleClose} sx={{
                width: '80%',
            }}>
                {showError}
            </Alert>
        </Snackbar>
    );
}
