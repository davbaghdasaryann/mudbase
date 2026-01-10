import React from 'react';

import {Stack, Box, useTheme} from '@mui/material';

interface PageToolbarProps {
    children: React.ReactNode;
}

export default function PageToolbar(props: PageToolbarProps) {
    const theme = useTheme();

    return (
        <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{
                width: 1,
                height: theme.tsui?.page?.toolbarHeight,
            }}
        >
            {props.children}
        </Stack>
    );
}
