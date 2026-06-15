'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from './ChooseEstimationDialog';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';

export default function StructuralAnalysisPage() {
    const { t } = useTranslation();
    const hasData = false;
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        // TODO: use selected estimate
    };

    const outlinedCreateSx = {
        borderRadius: '25px',
        height: '40px',
        mt: 1,
        '&:hover': {
            backgroundColor: mainPrimaryColor,
            color: '#ffffff',
            borderColor: mainPrimaryColor,
        },
    };

    return (
        <PageContents title='Structural Analytics'>
            {hasData && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <PageButton variant='contained' label='Create' size='large' sx={{ borderRadius: '25px', height: '40px' }} onClick={() => setDialogOpen(true)} />
                </Box>
            )}

            {!hasData && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                        gap: 2,
                        pb: 8,
                    }}
                >
                    <AccountTreeIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {t('No analytics created yet')}
                    </Typography>
                    <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                </Box>
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
