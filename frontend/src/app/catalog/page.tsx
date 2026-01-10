'use client';

import React, {useEffect, useState} from 'react';


import {Box, Tab} from '@mui/material';
import {TabContext, TabList} from '@mui/lab';

import {useTranslation} from 'react-i18next';

import PageContents from '../../components/PageContents';
import {MaterialItemDisplayData} from '../../data/material_display_data';
import {LaborItemDisplayData} from '../../data/labor_display_data';
import {usePermissions} from '../../api/auth';
import CatalogAccordionNew from '@/components/catalog/CatalogAccordionNew';

export default function CatalogsPage() {
    const {session, status, permissionsSet} = usePermissions();

    const [t] = useTranslation();
    type TabValue = 'labor' | 'material';

    const savedTab = typeof window !== 'undefined' ? (localStorage.getItem('selectedCatalogTab') as TabValue | null) : null;
    const defaultTab: TabValue = session?.user && permissionsSet?.has?.('CAT_LBR_VW') ? 'labor' : 'material';

    const [catalogItems, setCatalogItems] = useState<LaborItemDisplayData[] | MaterialItemDisplayData[] | null>(null);
    const [catalogType, setCatalogType] = useState<TabValue>(savedTab || defaultTab);
    const [value, setValue] = useState<TabValue>(savedTab || defaultTab);

    useEffect(() => {
        const storedTab = localStorage.getItem('selectedCatalogTab') as TabValue | null;
        if (!storedTab) {
            localStorage.setItem('selectedCatalogTab', defaultTab);
            setValue(defaultTab);
            setCatalogType(defaultTab);
        }
    }, [defaultTab]);

    const handleChange = (event: React.SyntheticEvent, newValue: TabValue) => {
        setValue(newValue);
        setCatalogType(newValue);
        setCatalogItems(null);
        localStorage.setItem('selectedCatalogTab', newValue);
    };

    return (
        <PageContents title='Catalogs'>
            <TabContext value={value}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <TabList onChange={handleChange}>
                        {session?.user && permissionsSet?.has?.('CAT_LBR_VW') && <Tab label={t('Labor')} value='labor' />}
                        {session?.user && permissionsSet?.has?.('CAT_MTRL_VW') && <Tab label={t('Materials')} value='material' />}
                    </TabList>
                </Box>
            </TabContext>

            {/* {!catalogItems && <CatalogAccordion key={catalogType} catalogType={catalogType} />} */}
            {!catalogItems && <CatalogAccordionNew key={catalogType} catalogType={catalogType} />}
        </PageContents>
    );
}
