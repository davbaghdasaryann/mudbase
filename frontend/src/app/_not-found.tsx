'use client';

import {Typography} from '@mui/material';
import PageContents from '../components/PageContents';
import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <PageContents type='public'>
            <Typography variant='h2'>404 - Page Not Found</Typography>
            <Typography variant='body1'>Sorry, the page you are looking for does not exist.</Typography>
            <Link href='/'>Go back home</Link>
        </PageContents>
    );
}
