import {Typography} from '@mui/material';
import {Box} from '@mui/system';

interface SegmentPageWrapperProps {
    title: string;
    children: React.ReactNode;
}

export default function SegmentPageWrapper(props: SegmentPageWrapperProps) {
    return (
        <>
            <Box sx={{p: '40px'}}>
                <Typography variant='h4' component='h2'>
                    {props.title}
                </Typography>
                {props.children}
            </Box>
        </>
    );
}
