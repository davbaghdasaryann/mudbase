'use client';

import { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, CircularProgress } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import ChooseEstimationDialog from '@/app/analysis/structural/ChooseEstimationDialog';
import * as EstimatesApi from '@/api/estimate';
import * as Api from '@/api';
import { mainPrimaryColor } from '@/theme';

interface LaborRow {
    _id: string;
    laborOfferItemName: string;
    quantity: number;
    unitSymbol?: string;
    sectionName?: string;
    subsectionName?: string;
}

export default function SchedulePage() {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEstimate, setSelectedEstimate] = useState<EstimatesApi.ApiEstimate | null>(null);
    const [worksOpen, setWorksOpen] = useState(false);
    const [laborRows, setLaborRows] = useState<LaborRow[]>([]);
    const [laborLoading, setLaborLoading] = useState(false);

    const handleSelect = (estimate: EstimatesApi.ApiEstimate) => {
        setDialogOpen(false);
        setSelectedEstimate(estimate);
    };

    const handleChooseWork = async () => {
        if (!selectedEstimate) return;
        setWorksOpen(true);
        setLaborLoading(true);
        try {
            const rows = await Api.requestSession<LaborRow[]>({
                command: 'estimate/fetch_labor_for_analysis',
                args: { estimateId: String(selectedEstimate._id) },
            });
            setLaborRows(rows ?? []);
        } catch {
            setLaborRows([]);
        } finally {
            setLaborLoading(false);
        }
    };

    return (
        <PageContents title='Schedule' sx={{ pb: 1 }}>
            {!selectedEstimate ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 2, pb: 8 }}>
                    <CalendarMonthIcon sx={{ fontSize: 90, color: mainPrimaryColor, opacity: 0.25 }} />
                    <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                        {t('No schedules created yet')}
                    </Typography>
                    <PageButton
                        variant='outlined'
                        label='Create'
                        size='large'
                        sx={{ borderRadius: '25px', height: '40px', mt: 1, '&:hover': { backgroundColor: mainPrimaryColor, color: '#ffffff', borderColor: mainPrimaryColor } }}
                        onClick={() => setDialogOpen(true)}
                    />
                </Box>
            ) : (
                <Box>
                    {/* Estimation header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0', mb: 2 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
                                {t('Estimation')}
                            </Typography>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {selectedEstimate.name}
                            </Typography>
                        </Box>
                        <Button
                            size='small'
                            startIcon={<WorkOutlineIcon sx={{ fontSize: 16 }} />}
                            onClick={handleChooseWork}
                            variant='contained'
                            sx={{ borderRadius: '20px', textTransform: 'none', bgcolor: mainPrimaryColor, '&:hover': { bgcolor: '#007f8c' }, px: 2, fontSize: '0.82rem', flexShrink: 0 }}
                        >
                            {t('Choose a work')}
                        </Button>
                        <PageButton variant='outlined' label='Change' size='small' sx={{ borderRadius: '20px', flexShrink: 0 }} onClick={() => setDialogOpen(true)} />
                    </Box>
                </Box>
            )}

            <ChooseEstimationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSelect={handleSelect}
            />

            {/* Works modal */}
            <Dialog open={worksOpen} onClose={() => setWorksOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${mainPrimaryColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WorkOutlineIcon sx={{ fontSize: 20, color: mainPrimaryColor }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a1a', lineHeight: 1.2 }}>{t('Choose a work')}</Typography>
                            {selectedEstimate && <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.1 }}>{selectedEstimate.name}</Typography>}
                        </Box>
                        <IconButton size='small' onClick={() => setWorksOpen(false)} sx={{ color: '#bbb', '&:hover': { color: '#555' }, ml: 0.5 }}>
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <Divider sx={{ mx: 3, mt: 2, mb: 0 }} />

                <DialogContent sx={{ px: 3, pt: 1.5, pb: 1 }}>
                    {laborLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} sx={{ color: mainPrimaryColor }} />
                        </Box>
                    ) : laborRows.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <Typography variant='body2' color='text.secondary'>{t('No works found')}</Typography>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {laborRows.map((row, index) => (
                                <Box
                                    key={row._id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.2,
                                        bgcolor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                                        borderRadius: 1.5, cursor: 'pointer',
                                        border: '1px solid transparent',
                                        '&:hover': { bgcolor: `${mainPrimaryColor}0d`, border: `1px solid ${mainPrimaryColor}33` },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, minWidth: 24 }}>{index + 1}</Typography>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.laborOfferItemName}
                                        </Typography>
                                        {(row.sectionName || row.subsectionName) && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {[row.sectionName, row.subsectionName].filter(Boolean).join(' › ')}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#555', whiteSpace: 'nowrap' }}>
                                        {row.quantity} {row.unitSymbol}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setWorksOpen(false)} sx={{ borderRadius: '20px', color: '#888' }}>{t('Cancel')}</Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}
