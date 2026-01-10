import React from 'react'

import LoginForgotPageContents from './LoginForgotPage';

import PageContents from "@/components/PageContents";


export default function LoginForgotPage() {

    return (
        <PageContents type='public' title='Forgot Login'>
            <LoginForgotPageContents />
        </PageContents>
    );
}
