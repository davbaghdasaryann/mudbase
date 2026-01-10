'use client'

import React from 'react';

import PageContents from '@/components/PageContents';
import UserSignUpPagePassword from './UserSignUpPagePassword';

export default function SignUpPage() {
    return <PageContents type='auth'>
        <UserSignUpPagePassword />
    </PageContents>;
}
