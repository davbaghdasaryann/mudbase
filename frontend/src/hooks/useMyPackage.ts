'use client';

import { useState, useEffect } from 'react';
import * as Api from 'api';
import { useSession } from 'next-auth/react';

export interface MyPackage {
    _id: string;
    name: string;
    numberOfUsers: number;
    numberOfEstimations: number;
    worksCatalog: boolean;
    materialsCatalog: boolean;
    aggregatedCatalog: boolean;
    costing: boolean;
    analysis: boolean;
    performance: boolean;
    seeOffers: boolean;
    archiveEstimations: boolean;
    shareEstimations: boolean;
    duplicateEstimation: boolean;
    exportEstimation: boolean;
    exportBoQ: boolean;
    isTrial?: boolean;
    nameAm?: string;
}

// Keyed by user email so switching accounts always fetches fresh data
const cache = new Map<string, MyPackage | null>();

export function useMyPackage() {
    const { data: session, status } = useSession();
    const userKey = session?.user?.email ?? null;

    const [pkg, setPkg] = useState<MyPackage | null | undefined>(
        userKey ? cache.get(userKey) : undefined
    );

    useEffect(() => {
        if (status !== 'authenticated' || !userKey) return;
        if (cache.has(userKey)) { setPkg(cache.get(userKey)!); return; }
        Api.requestSession<MyPackage | null>({ command: 'packages/my' })
            .then(data => { cache.set(userKey, data); setPkg(data); })
            .catch(() => { cache.set(userKey, null); setPkg(null); });
    }, [status, userKey]);

    return pkg;
}
