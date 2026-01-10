'use client';

import {companyLogoAvatarSize, companyLogoMarginTop} from '../account/CompanyLogoComponent';
import {useApiFetchOne} from '../../components/ApiDataFetch';
import {useSearchParams} from 'next/navigation';
import {raiseError} from '../../lib/app_errors';
import * as Api from 'api';
import React, {useState} from 'react';
import {Box, Tab} from '@mui/material';
import {mainNavigationDrawerWidth} from '@/theme';
import AboutCompanyPage from '@/app/account/AccountAboutCompany';
import CompanyHeaderComponent from '@/app/account/CompanyHeaderComponent';
import {TabContext, TabList} from '@mui/lab';
import AccountOffersPage from '@/app/account/AccountOffers';
import {useTranslation} from 'react-i18next';

type TabValue = 'labor' | 'material' | 'aboutCompany';

export default function AccountViewPageContents() {
    const {t} = useTranslation();

    const searchParams = useSearchParams();

    const apiData = useApiFetchOne<Api.ApiAccount>({});

    const [value, setValue] = useState<TabValue>('aboutCompany');
    const [accountViewId, setAccountViewId] = useState<string | undefined>();

    React.useEffect(() => {
        let accountId = searchParams.get('accountId');

        if (!accountId) {
            raiseError('Account id is missing');
            return;
        }

        apiData.setApi({
            command: 'account/get',
            args: {accountId: accountId},
        });

        setAccountViewId(accountId);
    }, []);

    const handleChange = (_: any, newValue: TabValue) => {
        setValue(newValue);
        // localStorage.setItem('selectedTab', newValue);
    };

    return (
        <>
            <Box
                sx={{
                    position: 'absolute',
                    backgroundColor: 'white',
                    left: mainNavigationDrawerWidth + 32,
                    right: 32,
                    top: companyLogoMarginTop + 16 + companyLogoAvatarSize / 2,
                    bottom: 4,
                    zIndex: -1,
                }}
            />
            <CompanyHeaderComponent canEdit={false} account={apiData.data} onDataChanged={() => apiData.invalidate()} />

            <TabContext value={value}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <TabList onChange={handleChange}>
                        {accountViewId && <Tab label={t('Labor')} value='labor' />}
                        {accountViewId && <Tab label={t('Materials')} value='material' />}
                        <Tab label={t('About Company')} value='aboutCompany' />
                    </TabList>
                </Box>
            </TabContext>

            {value === 'labor' && accountViewId && <AccountOffersPage offerType={value} accountViewId={accountViewId} />}
            {value === 'material' && accountViewId && <AccountOffersPage offerType={value} accountViewId={accountViewId} />}

            {value === 'aboutCompany' && <AboutCompanyPage account={apiData.data} />}
        </>
    );

    // return (
    //     <>
    //         <Box
    //             sx={{
    //                 position: 'absolute',
    //                 backgroundColor: 'white',
    //                 left: mainNavigationDrawerWidth + 32,
    //                 right: 32,
    //                 top: companyLogoMarginTop + 16 + companyLogoAvatarSize / 2,
    //                 bottom: 4,
    //                 zIndex: -1,
    //             }}
    //         />

    //         <Stack
    //             direction='row'
    //             alignItems='flex-end'
    //             sx={{
    //                 w: 1,
    //                 pl: 5,
    //                 pr: 2,
    //             }}
    //         >
    //             <CompanyLogoComponent account={apiData.data} canEdit={false} />
    //         </Stack>

    //         {/* <AccountAboutCompanyView account={apiData.data} /> */}
    //         <AboutCompanyPage account={apiData.data} />
    //     </>
    // );
}
