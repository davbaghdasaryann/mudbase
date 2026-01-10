'use client';

import React, { useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Box, Stack, Tab } from '@mui/material';
import { TabContext, TabList } from '@mui/lab';


import PageContents from '@/components/PageContents';
import AccountOffersPage from './AccountOffers';
import AboutCompanyPage from './AccountAboutCompany';
import { usePermissions } from '../../api/auth';

import * as Api from 'api';
import { useApiFetchOne } from '../../components/ApiDataFetch';

import CompanyHeaderComponent from './CompanyHeaderComponent';
import { companyLogoAvatarSize, companyLogoMarginTop } from '@/app/account/CompanyLogoComponent';
import { mainNavigationDrawerWidth } from '@/theme';


export default function AccountPage() {
    type TabValue = 'labor' | 'material' | 'aboutCompany';

    const { session, permissionsSet } = usePermissions();
    const { t } = useTranslation();

    // const defaultTab: TabValue = session?.user && permissionsSet?.has?.('OFF_CRT') ? 'labor' : 'aboutCompany';
    const defaultTab: TabValue = 'aboutCompany';

    const savedTab = typeof window !== 'undefined' ? localStorage.getItem('selectedTab') as TabValue | null : null;
    const [value, setValue] = useState<TabValue>(savedTab || defaultTab);

    useEffect(() => {
        const storedTab = localStorage.getItem('selectedTab') as TabValue | null;
        if (!storedTab) {
            localStorage.setItem('selectedTab', defaultTab);
            setValue(defaultTab);
        }
    }, [defaultTab]);


    const handleChange = (event: React.SyntheticEvent, newValue: TabValue) => {
        setValue(newValue);
        localStorage.setItem('selectedTab', newValue);
    };


    const apiData = useApiFetchOne<Api.ApiAccount>({
        api: {
            command: 'profile/get_account',
        },
    });

    // console.log(mainNavigationDrawerWidth);

    return (
        <PageContents>
            <Box sx={{
                position: 'absolute',
                backgroundColor: 'white',
                left: mainNavigationDrawerWidth + 32,
                right: 32,
                top: companyLogoMarginTop + 16 + companyLogoAvatarSize / 2,
                bottom: 4,
                zIndex: -1,
            }} />
            <CompanyHeaderComponent account={apiData.data} onDataChanged={() => apiData.invalidate()} />

            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleChange}>
                        {session?.user && permissionsSet?.has?.('OFF_VW_LOC_LBR') && <Tab label={t('My Labors')} value='labor' />}
                        {session?.user && permissionsSet?.has?.('OFF_VW_LOC_MTRL') && <Tab label={t('My Materials')} value='material' />}
                        {/* {session?.user && permissionsSet?.has?.('EST_USE') && <Tab label={t('Estimates')} value='estimates' />}
                        {session?.user && permissionsSet?.has?.('EST_USE') && <Tab label={t('Shared Estimates')} value='sharedEstimates' />} */}
                        <Tab label={t('About My Company')} value='aboutCompany' />
                    </TabList>
                </Box>
            </TabContext>

            {(value === 'labor' && permissionsSet?.has?.('OFF_VW_LOC_LBR')) && <AccountOffersPage offerType={value} accountViewId={session?.user.accountId} canEdit={true} />}
            {(value === 'material' && permissionsSet?.has?.('OFF_VW_LOC_MTRL')) && <AccountOffersPage offerType={value} accountViewId={session?.user.accountId} canEdit={true} />}
            {/* {(value === 'estimates' && session?.user && permissionsSet?.has?.('EST_USE')) && <AccountEstimatesPage />} */}
            {/* {(value === 'sharedEstimates' && session?.user && permissionsSet?.has?.('EST_USE')) && <AccountSharedEstimatesPage />} */}
            {value === 'aboutCompany' && <AboutCompanyPage account={apiData.data} />}
        </PageContents>
    );
}
