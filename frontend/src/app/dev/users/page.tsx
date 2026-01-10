'use client';

import React from 'react';

import PageContents from '@/components/PageContents';
import DevUsersPageTab from './DevUsersTab';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Button, Tab } from '@mui/material';
import { useRouter } from 'next/navigation';
import DevPendingUsersPageTab from './DevPendingUsersTab';

export default function UserPage() {
    const [currentTab, setCurrentTab] = React.useState('current');
    const router = useRouter();

    return (

        <PageContents>
            <Button
                variant='outlined'
                onClick={() => {
                    router.replace('/dev');
                }}
            >
                Return to Developer Mode Main Page
            </Button>
            <TabContext value={currentTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={(evt, newval) => setCurrentTab(newval)}>
                        <Tab label='Current' value='current' />
                        <Tab label='Pending' value='pending' />
                    </TabList>
                </Box>
            </TabContext>

            {currentTab === 'current' && <DevUsersPageTab />}
            {currentTab === 'pending' && <DevPendingUsersPageTab />}

        </PageContents>
    );
}