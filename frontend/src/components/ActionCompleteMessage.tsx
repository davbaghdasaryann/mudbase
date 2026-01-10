import {ElementType} from 'react';

import {Container, Paper, Typography, Icon, Stack} from '@mui/material';

import PageText from './PageText';
import {dialogPaperBorder} from '../theme';

interface InformativePageProps {
    show?: boolean;
    title?: string;
    icon?: ElementType;
    message?: string;
    instructions?: string;
}

export default function ActionCompleteMessage(props: InformativePageProps) {
    if (props.show === false) return <></>;

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh', // Ensure the container takes up the full viewport height
            }}
        >
            {/* <Container maxWidth='sm'> */}
            <Paper elevation={3} sx={{p: 2, textAlign: 'center', border: dialogPaperBorder}}>
                <Stack direction='column' spacing={3} alignContent='center' alignItems='center'>
                    {props.title && <PageText h4 text={props.title} sx={{}} />}

                    {props.icon && <props.icon sx={{fontSize:"5rem", color: "primary.main"}}/>}
                    {props.message && <PageText h6 text={props.message}/>}

                    {props.instructions && <PageText h6 text={props.instructions}/>}

                    {/* <PageText body text='Thanks for being with us'/> */}
                    {/* <PageText variant='body1' text='Regards, Mudbase' sx={{fontStyle: 'italic'}}/> */}
                </Stack>
            </Paper>
            {/* </Container> */}
        </div>
    );
}
