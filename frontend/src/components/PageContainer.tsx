import React from 'react'

import { Container } from '@mui/material';

interface PageContainerProps {
    children: React.ReactNode;
};

export function PageContainer(props: PageContainerProps) {
    return <Container>
        {props.children}
    </Container>
}
