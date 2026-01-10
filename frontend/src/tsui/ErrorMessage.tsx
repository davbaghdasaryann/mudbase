
import { Alert, Box } from '@mui/material';

interface ErrorMessageProps {
    message?: string;
    error?: Error;
    type?: 'page' | 'dialog'; 
};

export default function ErrorMessage(props: ErrorMessageProps) {
    let messageText = props.message ?? props.error ? props.error?.message : 'Unknown Error';

    return <Box sx={{ 
        display: 'flex',  
        justifyContent: 'center' 
    }}>
        <Alert severity="error">{messageText}</Alert>
    </Box>

}

