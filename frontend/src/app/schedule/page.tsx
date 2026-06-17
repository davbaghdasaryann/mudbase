'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import { mainPrimaryColor } from '@/theme';

export default function SchedulePage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    return (
        <PageContents title='Schedule'>
            {!selectedEstimate && (
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
                    <CalendarMonthIcon sx={{ fontSize: 90, color: mainPrimaryColor, opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {t('No schedules created yet')}
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
                        onClick={() => setDialogOpen(true)}
                    />
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
