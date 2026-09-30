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
}

export function useMyPackage() {
    const { status } = useSession();
    const [pkg, setPkg] = useState<MyPackage | null | undefined>(undefined);

    useEffect(() => {
        if (status !== 'authenticated') return;
        Api.requestSession<MyPackage | null>({ command: 'packages/my' })
            .then(data => setPkg(data))
            .catch(() => setPkg(null));
    }, [status]);

    return pkg;
}
