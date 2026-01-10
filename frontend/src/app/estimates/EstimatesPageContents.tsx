'use client';

import React, {useCallback, useEffect} from 'react';
import {TabContext, TabList} from '@mui/lab';
import {Tab, Box} from '@mui/material';
import {useTranslation} from 'react-i18next';

import {usePermissions} from '@/api/auth';

import AccountSharedEstimatesWithMeTab from './AccountSharedEstimatesWithMeTab';
import AccountEstimatesTab from './AccountEstimatesTab';
import AccountSharedEstimatesByMeTab from '@/app/estimates/AccountSharedEstimatesByMeTab';

type TabValue = 'estimates' | 'sharedEstimates' | 'estimateOffers';

export default function EstimatesPageContents() {
    const {session, permissionsSet} = usePermissions();
    const {t} = useTranslation();

    // console.log('permissionsSet', permissionsSet)

    const permEstUse = permissionsSet?.has?.('EST_USE') ?? false;
    const hasSharedEstimatesByMe = permEstUse && permissionsSet?.has?.('EST_SHR');
    const hasSharedEstimatesWithMe = permissionsSet?.has?.('EST_SHR_VW_RCV') || permissionsSet?.has?.('EST_SHR_RCV_VW_RSHR');

    const defaultTab: TabValue = 'estimates';

    const savedTab = typeof window !== 'undefined' ? (localStorage.getItem('selectedEstimateTab') as TabValue | null) : null;
    const [value, setValue] = React.useState<TabValue>(savedTab || defaultTab);

    // useEffect(() => {
    //     console.log("Estimates page");
    // }, []);

    // useEffect(() => {
    //     const storedTab = localStorage.getItem('selectedEstimateTab') as TabValue | null;
    //     if (!storedTab) {
    //         localStorage.setItem('selectedEstimateTab', defaultTab);
    //         setValue(defaultTab);
    //     }
    // }, [defaultTab]);

    const handleChange = useCallback((event: React.SyntheticEvent, newValue: TabValue) => {
        setValue(newValue);
        localStorage.setItem('selectedEstimateTab', newValue);
    }, []);

    return (
        <>
            <TabContext value={value}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <TabList onChange={handleChange}>
                        {permEstUse && <Tab label={t('My Estimates')} value='estimates' />}
                        {hasSharedEstimatesByMe && <Tab label={t('Shared Estimates')} value='sharedEstimates' />}
                        {hasSharedEstimatesWithMe && <Tab label={t('Estimate Offers')} value='estimateOffers' />}
                    </TabList>
                </Box>
            </TabContext>

            {value === 'estimates' && permEstUse && <AccountEstimatesTab />}
            {value === 'sharedEstimates' && hasSharedEstimatesByMe && <AccountSharedEstimatesByMeTab />}
            {value === 'estimateOffers' && hasSharedEstimatesWithMe && <AccountSharedEstimatesWithMeTab />}
        </>
    );
}
