'use client'

import React from 'react';

import PageContents from '@/components/PageContents';
import UserSignUpPagePassword from '../signup/UserSignUpPagePassword';
import UserSignUpPageCompany from './UserSignUpPageCompany';

export default function SignUpCompanyPage() {
    return <PageContents type='auth'>
        <UserSignUpPageCompany />
    </PageContents>;
}
