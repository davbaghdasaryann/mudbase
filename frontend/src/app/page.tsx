"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LandingPage from './intro/page';

export default function RootPage() {
    const { status } = useSession();
    const router = useRouter();

    React.useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/dashboard-builder');
        }
    }, [status]);

    if (status === 'loading' || status === 'authenticated') return null;

    return <LandingPage />;
}

