'use client';

import { useState } from 'react';
import { Box, Button, Tab, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { TabContext, TabList } from '@mui/lab';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import CostingTable from './CostingTable';
import { mainPrimaryColor } from '@/theme';
import * as EstimatesApi from '@/api/estimate';
import { formatCurrencyRounded } from '@/lib/format_currency';

export interface CostHistoryEntry {
    id: string;
    workName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    total: number;
    addedAt: Date;
}

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

type TabValue = 'main' | 'history';

export default function CostingPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<TabValue>('main');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [costHistory, setCostHistory] = useState<CostHistoryEntry[]>([]);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    const handleCostAdded = (entry: CostHistoryEntry) => {
        setCostHistory(prev => [entry, ...prev]);
    };

    return (
        <PageContents title='Costing'>
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                {/* Tabs */}
                <TabContext value={tab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <TabList onChange={(_, v) => setTab(v as TabValue)}>
                            <Tab label={t('Main')} value='main' />
                            <Tab label={t('Costs History')} value='history' />
                        </TabList>
                    </Box>
                </TabContext>

                {/* Main tab */}
                {tab === 'main' && (
                    <>
                        {!selectedEstimate && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                                    {t('No Costings created yet')}
                                </Typography>
                                <PageButton variant='outlined' label='Create' size='large' sx={outlinedCreateSx} onClick={() => setDialogOpen(true)} />
                            </Box>
                        )}

                        {selectedEstimate && (
                            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                                <Button
                                    startIcon={<ArrowBackIcon fontSize='small' />}
                                    size='small'
                                    onClick={() => setSelectedEstimate(null)}
                                    sx={{ color: 'text.secondary', pl: 0, mb: 1.5, '&:hover': { background: 'transparent', color: 'primary.main' } }}
                                >
                                    {t('Back')}
                                </Button>
                                <Typography sx={{ fontWeight: 600, fontSize: '1.5rem', mb: 3 }}>
                                    {selectedEstimate.name}
                                </Typography>
                                <CostingTable estimate={selectedEstimate} onCostAdded={handleCostAdded} />
                            </Box>
                        )}
                    </>
                )}

                {/* Costs History tab */}
                {tab === 'history' && (
                    <>
                        {costHistory.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                                <RequestQuoteOutlinedIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                                    {t('No costs added yet')}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ overflow: 'auto' }}>
                                <Table size='small' sx={{ minWidth: 600 }}>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f0fbfc' }}>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Description of Work')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Unit')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Quantity')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Unit Price')}</TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Total')}</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: mainPrimaryColor }}>{t('Date of Creation')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {costHistory.map(entry => (
                                            <TableRow key={entry.id} hover>
                                                <TableCell>{entry.workName}</TableCell>
                                                <TableCell>{entry.unit}</TableCell>
                                                <TableCell align='right'>{entry.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell align='right'>{formatCurrencyRounded(entry.unitPrice)}</TableCell>
                                                <TableCell align='right' sx={{ fontWeight: 600, color: mainPrimaryColor }}>{formatCurrencyRounded(entry.total)} AMD</TableCell>
                                                <TableCell sx={{ color: '#888', fontSize: '0.8rem' }}>{entry.addedAt.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </>
                )}

            </Box>

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />
        </PageContents>
    );
}
