'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell,
    Button, Typography, Box, Stack, CircularProgress, Radio,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as EstimatesApi from '@/api/estimate';
import { formatDate } from '@/lib/format_date';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (estimate: EstimatesApi.ApiEstimate) => void;
}

export default function ChooseEstimationDialog({ open, onClose, onSelect }: Props) {
    const { t } = useTranslation();
    const [estimates, setEstimates] = useState<EstimatesApi.ApiEstimate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setSelectedId(null);
        Api.requestSession<EstimatesApi.ApiEstimate[]>({
            command: 'estimates/fetch',
            args: { searchVal: 'empty' },
        }).then((data) => {
            setEstimates(data ?? []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [open]);

    const selected = estimates.find((e) => e._id === selectedId);

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction='row' alignItems='center' spacing={2}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, flex: 1, textAlign: 'center', pr: 4 }}>
                        {t('Choose an Estimation')}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: 60 }}>{t('No.')}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{t('Name')}</TableCell>
                                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{t('Date of Creation')}</TableCell>
                                <TableCell sx={{ width: 48 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {estimates.map((estimate, index) => (
                                <TableRow
                                    key={estimate._id}
                                    onClick={() => setSelectedId(estimate._id)}
                                    hover
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: selectedId === estimate._id
                                            ? `${mainPrimaryColor}22`
                                            : index % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                        '&.MuiTableRow-hover:hover': {
                                            backgroundColor: `${mainPrimaryColor}15 !important`,
                                        },
                                    }}
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{estimate.name}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {formatDate(estimate.createdAt)}
                                    </TableCell>
                                    <TableCell align='right' sx={{ pr: 1 }}>
                                        <Radio
                                            checked={selectedId === estimate._id}
                                            onChange={() => setSelectedId(estimate._id)}
                                            size='small'
                                            sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant='contained'
                    disabled={!selected}
                    onClick={() => selected && onSelect(selected)}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor }}
                >
                    {t('Select')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
