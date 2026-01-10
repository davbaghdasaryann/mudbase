import React from 'react';

import { Stack, Typography } from '@mui/material';
import * as Api from 'api';
import CompanyLogoComponent from './CompanyLogoComponent';
import SpacerComponent from '../../components/SpacerComponent';
import { PageButton } from '../../tsui/Buttons/PageButton';
import EditAccountInfoDialog from './EditAccountInfoDialog';
import { usePermissions } from '../../api/auth';

interface CompanyHeaderComponentProps {
    account: Api.ApiAccount | undefined;
    onDataChanged: () => void;

    canEdit?: boolean;
}

export default function CompanyHeaderComponent({
    account,
    onDataChanged,
    canEdit = true,
}: CompanyHeaderComponentProps) {
    const { session, permissionsSet } = usePermissions();

    const [editAccount, setEditAccount] = React.useState(false);

    const dataChangedFlag = React.useRef(false);
    const editEnabled = !canEdit ? false : (session?.user && permissionsSet?.has?.('ACC_PROF_EDT'));

    return (
        <>
            <Stack
                direction='row'
                alignItems='flex-end'
                spacing={4}
                sx={{
                    w: 1,
                    pl: 5,
                    pr: 2,
                }}
            >
                <CompanyLogoComponent
                    account={account}
                    canEdit={canEdit} />
                <Typography variant='h4' sx={{ position: 'relative', bottom: 28 }}>
                    {account?.companyName}
                </Typography>
                <SpacerComponent />
                <PageButton show={editEnabled} title='Edit' variant='text' onClickTrue={setEditAccount} sx={{ position: 'relative', bottom: 30 }} />
            </Stack>

            <EditAccountInfoDialog
                show={editAccount}
                onClose={() => {
                    setEditAccount(false);
                    if (dataChangedFlag.current) onDataChanged();
                }}
                account={account}
                onDataChanged={() => (dataChangedFlag.current = true)}
            />
        </>
    );
}
