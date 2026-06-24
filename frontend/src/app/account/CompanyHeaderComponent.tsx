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
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'center', sm: 'flex-end' }}
                spacing={{ xs: 1, sm: 4 }}
                sx={{
                    w: 1,
                    pl: { xs: 2, sm: 5 },
                    pr: 2,
                    pb: { xs: 1, sm: 0 },
                }}
            >
                <CompanyLogoComponent
                    account={account}
                    canEdit={canEdit} />
                <Typography
                    sx={{
                        position: 'relative',
                        bottom: { xs: 0, sm: 28 },
                        fontSize: { xs: '1.2rem', sm: '2.125rem' },
                        fontWeight: 600,
                        textAlign: { xs: 'center', sm: 'left' },
                    }}
                >
                    {account?.companyName}
                </Typography>
                <SpacerComponent />
                <PageButton show={editEnabled} title='Edit' variant='text' onClickTrue={setEditAccount} sx={{ position: 'relative', bottom: { xs: 0, sm: 30 } }} />
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
