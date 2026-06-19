'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import ChronologicalCreateDialog, { ChronologicalSourceType } from './ChronologicalCreateDialog';

export default function ChronologicalAnalysisPage() {
    const { t } = useTranslation();
    const [createOpen, setCreateOpen] = useState(false);

    const handleContinue = (type: ChronologicalSourceType) => {
        setCreateOpen(false);
        // sub-modal per type — next step
    };

    return (
        <PageContents title='Chronological Analytics'>
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
                <TimelineIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                    {t('No analytics created yet')}
                </Typography>
                <PageButton
                    variant='outlined'
                    label='Create'
                    size='large'
                    sx={{
                        borderRadius: '25px',
                        height: '40px',
                        mt: 1,
                        '&:hover': {
                            backgroundColor: mainPrimaryColor,
                            color: '#ffffff',
                            borderColor: mainPrimaryColor,
                        },
                    }}
                    onClick={() => setCreateOpen(true)}
                />
            </Box>

            <ChronologicalCreateDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onContinue={handleContinue}
            />
        </PageContents>
    );
}
