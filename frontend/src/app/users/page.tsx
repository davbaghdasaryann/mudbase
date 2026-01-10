'use client';

import React, { useEffect, useState } from 'react';
import PageContents from '@/components/PageContents';
import UsersPageTab from './UsersPageTab';
import { TabContext, TabList } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PendingUsersPageTab from './PendingUsersTab';
import InvitedUsersTab from './InvitedUsersTab';
import Env from '../../env';
import { usePermissions } from '../../api/auth';
import FreeUsersTab from '@/app/users/FreeUsersTab';

export default function UserPage() {
    const { session, permissionsSet } = usePermissions();
    const { t } = useTranslation();

    type TabValue = 'current' | 'free' | 'pending' | 'invited';

    const defaultTab: TabValue = session?.user && permissionsSet?.has('PND_USR_FCH')
        ? (Env.isDev ? 'pending' : 'current')
        : 'current';

    const savedTab = typeof window !== 'undefined' ? localStorage.getItem('selectedUserTab') as TabValue | null : null;


    const [currentTab, setCurrentTab] = useState<TabValue>(savedTab || defaultTab);


    useEffect(() => {
        const storedTab = localStorage.getItem('selectedUserTab') as TabValue | null;

        if (!storedTab) {
            localStorage.setItem('selectedUserTab', defaultTab);
            setCurrentTab(defaultTab);
        }
    }, [defaultTab]);

    const handleTabChange = (event: React.SyntheticEvent, newTab: TabValue) => {
        setCurrentTab(newTab);
        localStorage.setItem('selectedUserTab', newTab);
    };

    return (
        <PageContents requiredPermission='USR_FCH' title='Users'>
            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label={t('Current')} value='current' />
                        {session?.user && permissionsSet?.has?.('PND_USR_FCH') && <Tab label={t('Free')} value='free' />}
                        {session?.user && permissionsSet?.has?.('PND_USR_FCH') && <Tab label={t('Pending')} value='pending' />}
                        {session?.user && permissionsSet?.has?.('INV_FCH') && <Tab label={t('Invited')} value='invited' />}
                    </TabList>
                </Box>
            </TabContext>

            {currentTab === 'current' && <UsersPageTab />}
            {currentTab === 'free' && permissionsSet.has?.('PND_USR_FCH') && <FreeUsersTab />}
            {currentTab === 'pending' && permissionsSet.has?.('PND_USR_FCH') && <PendingUsersPageTab />}
            {currentTab === 'invited' && permissionsSet.has?.('INV_FCH') && <InvitedUsersTab />}
        </PageContents>
    );
}
