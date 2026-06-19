'use client';

import { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Stack, CircularProgress,
    Table, TableHead, TableBody, TableRow, TableCell, TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';
import { ChronologicalSourceType } from './ChronologicalCreateDialog';
import * as Api from '@/api';
import moment from 'moment';

interface Props {
    open: boolean;
    type: ChronologicalSourceType | null;
    onClose: () => void;
}

const TYPE_TITLES: Record<ChronologicalSourceType, string> = {
    work_repository: 'Work repository',
    materials_repository: 'Materials repository',
    list_of_estimates: 'List of estimates',
    consolidated_estimates: 'Consolidated estimates',
};

const TODAY = new Date().toISOString().slice(0, 10);
const FROM_DEFAULT = '2023-01-01';

export default function ChronologicalListDialog({ open, type, onClose }: Props) {
    const { t } = useTranslation();
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(FROM_DEFAULT);
    const [toDate, setToDate] = useState(TODAY);

    useEffect(() => {
        if (!open || !type) return;
        setLoading(true);
        setRows([]);
        fetchData(type).then((data) => {
            setRows(data ?? []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [open, type]);

    const fetchData = async (type: ChronologicalSourceType): Promise<any[]> => {
        switch (type) {
            case 'work_repository':
                return Api.requestSession<any[]>({ command: 'labor/fetch_categories', args: { searchVal: '' } });
            case 'materials_repository':
                return Api.requestSession<any[]>({ command: 'material/fetch_categories', args: { searchVal: '' } });
            case 'list_of_estimates':
                return Api.requestSession<any[]>({ command: 'estimates/fetch', args: { searchVal: 'empty' } });
            case 'consolidated_estimates':
                return Api.requestSession<any[]>({ command: 'admin/fetch_all_estimates', args: {} });
            default:
                return [];
        }
    };

    const filtered = rows.filter((row) => {
        const dateField = row.createdAt ?? row.updatedAt;
        if (!dateField) return true;
        const d = new Date(dateField);
        return d >= new Date(fromDate) && d <= new Date(toDate + 'T23:59:59');
    });

    const renderTable = () => {
        if (!type) return null;

        if (type === 'work_repository' || type === 'materials_repository') {
            return (
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{t('Code')}</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '100%' }}>{t('Name')}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{t('Items')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((row, i) => (
                            <TableRow key={row._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9F9F9' } }}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell>{row.code}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{row.childrenQuantity ?? '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        if (type === 'list_of_estimates' || type === 'consolidated_estimates') {
            return (
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '100%' }}>{t('Name')}</TableCell>
                            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Total Cost')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((row, i) => (
                            <TableRow key={row._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#F9F9F9' } }}>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            );
        }

        return null;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1.5 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {type ? t(TYPE_TITLES[type]) : ''}
                    </Typography>
                    {/* Date range filter — far right */}
                    <Stack direction='row' alignItems='center' spacing={1} sx={{ ml: 'auto' }}>
                        <TextField
                            type='date'
                            size='small'
                            label={t('From')}
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            inputProps={{ min: '2023-01-01', max: TODAY }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: 150 }}
                        />
                        <TextField
                            type='date'
                            size='small'
                            label={t('To')}
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            inputProps={{ min: '2023-01-01', max: TODAY }}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={{ width: 150 }}
                        />
                    </Stack>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <Typography color='text.secondary'>{t('No data for selected period')}</Typography>
                    </Box>
                ) : renderTable()}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
