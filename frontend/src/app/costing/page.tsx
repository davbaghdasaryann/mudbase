'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';

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

export default function CostingPage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <PageContents title='Costing'>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                    {t('No Costings created yet')}
                </Typography>
                <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
            </Box>
        </PageContents>
    );
}
