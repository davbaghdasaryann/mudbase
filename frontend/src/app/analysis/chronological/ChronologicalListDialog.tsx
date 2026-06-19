'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, CircularProgress,
    Table, TableHead, TableBody, TableRow, TableCell, TextField, Radio, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';
import { ChronologicalSourceType } from './ChronologicalCreateDialog';
import WidgetItemHierarchyPicker from '@/components/dashboard/WidgetItemHierarchyPicker';
import * as Api from '@/api';
import moment from 'moment';

interface Props {
    open: boolean;
    type: ChronologicalSourceType | null;
    onClose: () => void;
    onPrevious: () => void;
}

const TYPE_TITLES: Record<ChronologicalSourceType, string> = {
    work_repository: 'Work repository',
    materials_repository: 'Materials repository',
    list_of_estimates: 'List of estimates',
    consolidated_estimates: 'Consolidated estimates',
};

const TODAY = new Date().toISOString().slice(0, 10);
const FROM_DEFAULT = '2023-01-01';

export default function ChronologicalListDialog({ open, type, onClose, onPrevious }: Props) {
    const { t } = useTranslation();
    const [estimates, setEstimates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState(FROM_DEFAULT);
    const [toDate, setToDate] = useState(TODAY);

    const isRepository = type === 'work_repository' || type === 'materials_repository';
    const isEstimates = type === 'list_of_estimates' || type === 'consolidated_estimates';

    useEffect(() => {
        if (!open || !isEstimates) return;
        setLoading(true);
        setEstimates([]);
        const command = type === 'list_of_estimates' ? 'estimates/fetch' : 'admin/fetch_all_estimates';
        Api.requestSession<any[]>({ command, args: { searchVal: 'empty' } })
            .then((data) => { setEstimates(data ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [open, type]);

    const filteredEstimates = estimates.filter((row) => {
        const d = row.createdAt ? new Date(row.createdAt) : null;
        if (!d) return true;
        return d >= new Date(fromDate) && d <= new Date(toDate + 'T23:59:59');
    });

    const dateFilter = (
        <Stack direction='row' alignItems='center' spacing={1}>
            <TextField
                type='date'
                size='small'
                label={t('From')}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                inputProps={{ min: '2023-01-01', max: TODAY }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 148 }}
            />
            <TextField
                type='date'
                size='small'
                label={t('To')}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                inputProps={{ min: '2023-01-01', max: TODAY }}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 148 }}
            />
        </Stack>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {type ? t(TYPE_TITLES[type]) : ''}
                    </Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {dateFilter}
                        <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: isRepository ? 2 : 0, minHeight: 380 }}>
                {/* Work / Materials repository — full hierarchy picker */}
                {isRepository && type && (
                    <WidgetItemHierarchyPicker
                        catalogType={type === 'work_repository' ? 'labor' : 'material'}
                        selectedId={selectedItemId}
                        onSelect={(item) => setSelectedItemId(item._id)}
                    />
                )}

                {/* Estimates list */}
                {isEstimates && (
                    loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress size={32} />
                        </Box>
                    ) : filteredEstimates.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                        </Box>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: 48 }}>{t('No.')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Total Cost')}</TableCell>
                                    <TableCell sx={{ width: 48 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEstimates.map((row, i) => (
                                    <TableRow
                                        key={row._id}
                                        hover
                                        onClick={() => setSelectedItemId(row._id)}
                                        sx={{
                                            cursor: 'pointer',
                                            backgroundColor: selectedItemId === row._id
                                                ? `${mainPrimaryColor}22`
                                                : i % 2 === 1 ? '#F5F5F5' : '#fff',
                                            '&.MuiTableRow-hover:hover': { backgroundColor: `${mainPrimaryColor}15 !important` },
                                        }}
                                    >
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {row.createdAt ? moment(row.createdAt).format('DD.MM.YYYY') : '—'}
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {row.totalCostWithOtherExpenses != null
                                                ? Math.round(row.totalCostWithOtherExpenses).toLocaleString()
                                                : row.totalCost != null ? Math.round(row.totalCost).toLocaleString() : '—'}
                                        </TableCell>
                                        <TableCell align='right' sx={{ pr: 1 }}>
                                            <Radio
                                                checked={selectedItemId === row._id}
                                                onChange={() => setSelectedItemId(row._id)}
                                                size='small'
                                                sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={onPrevious} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Previous')}
                </Button>
                <Button
                    variant='contained'
                    onClick={onClose}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor, '&:hover': { backgroundColor: '#007a6e' } }}
                >
                    {t('Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
