'use client';

import { useState, useEffect } from 'react';
import * as Api from 'api';
import { usePermissions } from '@/api/auth';

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
}

const cache = new Map<string, MyPackage | null>();

export function useMyPackage() {
    const { session } = usePermissions();
    const accountId = (session?.user as any)?.accountId as string | undefined;

    const [pkg, setPkg] = useState<MyPackage | null | undefined>(
        accountId !== undefined ? cache.get(accountId) : undefined
    );

    useEffect(() => {
        if (!accountId) return;
        if (cache.has(accountId)) { setPkg(cache.get(accountId)!); return; }
        Api.requestSession<MyPackage | null>({ command: 'packages/my' })
            .then(data => { cache.set(accountId, data); setPkg(data); })
            .catch(() => { cache.set(accountId, null); setPkg(null); });
    }, [accountId]);

    return pkg;
}
