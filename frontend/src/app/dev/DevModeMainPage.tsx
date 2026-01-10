'use client'

import React from 'react';

import PageContents from '../../components/PageContents';
import * as F from 'tsui/Form';
import { Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';


export default function DevModeMain() {
    const router = useRouter();

    return <PageContents type='dev'>
        <Typography sx={{ textAlign: 'center', fontSize: 35 }}>
            WELCOME TO THE DEVELOPER MODE, SIGN UP OR SIGN IN ON EXISTING ACCOUNT
        </Typography>
        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/join') }}
        >
            Sign Up
        </Button>

        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/login') }}
        >
            Sign In
        </Button>

        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/users') }}
        >
            Users list
        </Button>

        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/accounts') }}
        >
            Accounts list
        </Button>

        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/change_password') }}
        >
            Change Password
        </Button>
        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/remove_data') }}
        >
            Remove Data
        </Button>
        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/send_email') }}
        >
            Send Email
        </Button>
        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/component_simulator') }}
        >
            Component Simulator
        </Button>

        <Button
            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev/pdf_estimation') }}
        >
           Pdf Estimation
        </Button>
    </PageContents>;
}