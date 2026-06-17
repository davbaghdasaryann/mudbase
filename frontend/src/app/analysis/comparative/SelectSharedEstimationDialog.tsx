'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell,
    List, ListItem, ListItemText, Checkbox,
    Button, Typography, Box, Stack, CircularProgress, Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { formatDate } from '@/lib/format_date';
import { mainPrimaryColor } from '@/theme';

export interface SharedEstimate {
    _id: string;
    name: string;
    createdAt: string;
}

export interface SharedEstimateCompany {
    _id: string;
    companyName: string;
}

export interface SharedEstimationSelection {
    estimate: SharedEstimate;
    companies: SharedEstimateCompany[];
}

interface ShareRecord {
    sharedEstimateId: string;
    estimatesData: SharedEstimate;
    sharedWithAccountId: string;
    sharedWithAccountData: SharedEstimateCompany;
}

interface EstimateEntry {
    estimateId: string;
    estimate: SharedEstimate;
    companies: SharedEstimateCompany[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (selection: SharedEstimationSelection) => void;
}

export default function SelectSharedEstimationDialog({ open, onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [records, setRecords] = useState<ShareRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!open) return;
        setSelectedEstimateId(null);
        setCheckedIds(new Set());
        setLoading(true);
        Api.requestSession<ShareRecord[]>({
            command: 'estimates_shared_by_me/fetch',
            args: { searchVal: 'empty' },
        })
            .then((data) => setRecords(data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [open]);

    // Group share records into unique estimates with their company lists
    const entries = useMemo<EstimateEntry[]>(() => {
        const map = new Map<string, EstimateEntry>();
        for (const r of records) {
            if (!r.estimatesData) continue;
            const id = String(r.sharedEstimateId);
            if (!map.has(id)) {
                map.set(id, { estimateId: id, estimate: r.estimatesData, companies: [] });
            }
            if (r.sharedWithAccountData) {
                map.get(id)!.companies.push({ ...r.sharedWithAccountData, _id: String(r.sharedWithAccountId) });
            }
        }
        return Array.from(map.values());
    }, [records]);

    const selectedEntry = entries.find((e) => e.estimateId === selectedEstimateId) ?? null;

    const handleSelectEstimate = (id: string) => {
        setSelectedEstimateId(id);
        setCheckedIds(new Set());
    };

    const toggleCompany = (id: string) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleConfirm = () => {
        if (!selectedEntry) return;
        onConfirm({
            estimate: selectedEntry.estimate,
            companies: selectedEntry.companies.filter((c) => checkedIds.has(c._id)),
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
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
                    <Stack direction='row' divider={<Divider orientation='vertical' flexItem />} sx={{ minHeight: 380, maxHeight: 500 }}>
                        {/* Left: shared estimations */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Table size='small' stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 40, background: '#fff' }}>{t('No.')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, background: '#fff' }}>{t('Name')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', background: '#fff' }}>{t('Date')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((entry, i) => (
                                        <TableRow
                                            key={entry.estimateId}
                                            hover
                                            onClick={() => handleSelectEstimate(entry.estimateId)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedEstimateId === entry.estimateId
                                                    ? `${mainPrimaryColor}22`
                                                    : i % 2 === 1 ? '#F5F5F5' : '#ffffff',
                                                '&.MuiTableRow-hover:hover': {
                                                    backgroundColor: `${mainPrimaryColor}15 !important`,
                                                },
                                            }}
                                        >
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>{entry.estimate.name}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(entry.estimate.createdAt)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        {/* Right: companies for selected estimation */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Typography
                                variant='body2'
                                sx={{ fontWeight: 600, px: 2, py: 1.5, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}
                            >
                                {t('Companies')}
                            </Typography>
                            {selectedEntry ? (
                                <List disablePadding>
                                    {selectedEntry.companies.map((company) => (
                                        <ListItem
                                            key={company._id}
                                            secondaryAction={
                                                <Checkbox
                                                    checked={checkedIds.has(company._id)}
                                                    onChange={() => toggleCompany(company._id)}
                                                    size='small'
                                                    sx={{ color: mainPrimaryColor, '&.Mui-checked': { color: mainPrimaryColor } }}
                                                />
                                            }
                                            sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                                        >
                                            <ListItemText
                                                primary={company.companyName}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant='body2' color='text.disabled' sx={{ p: 3, textAlign: 'center' }}>
                                    {t('Select an estimation to see companies')}
                                </Typography>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant='contained'
                    disabled={!selectedEntry || checkedIds.size === 0}
                    onClick={handleConfirm}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor }}
                >
                    {t('Confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
