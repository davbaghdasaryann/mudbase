'use client';

import PageContents from '@/components/PageContents';
import LoginPageContents from './LoginPageContents';

export default function LoginPage() {
    return (
        <PageContents type='auth'>
            <LoginPageContents />
        </PageContents>
    );
}
