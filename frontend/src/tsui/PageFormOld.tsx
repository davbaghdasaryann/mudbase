import React from 'react'
import {Container, Grid, Box, Typography, Breakpoint, useTheme} from '@mui/material'

interface PageFormProps {
    title: string
    size: Breakpoint
    children: React.ReactNode
}

export default function PageForm(props: PageFormProps) {
    const theme = useTheme();

    return (
        <Container
            maxWidth={props.size}
            sx={{
                border: theme.tsui?.form?.border,
            }}
        >
            <Typography variant='h3' align='center'>
                {props.title}
            </Typography>

            {props.children}
            
        </Container>
    )
}
