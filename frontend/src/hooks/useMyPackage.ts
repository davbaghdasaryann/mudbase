'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import * as Api from 'api';

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

let cachedPackage: MyPackage | null | undefined = undefined;

export function useMyPackage() {
    const [pkg, setPkg] = useState<MyPackage | null | undefined>(cachedPackage);

    useEffect(() => {
        if (cachedPackage !== undefined) { setPkg(cachedPackage); return; }
        Api.requestSession<MyPackage | null>({ command: 'packages/my' })
            .then(data => { cachedPackage = data; setPkg(data); })
            .catch(() => { cachedPackage = null; setPkg(null); });
    }, []);

    return pkg;
}
