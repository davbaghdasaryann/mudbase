'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableBody, TableRow, TableCell,
    List, ListItem, ListItemText, Checkbox,
    Button, Typography, Box, CircularProgress, Stack,
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
    originalEstimateId: string;
    estimate: SharedEstimate;
    companies: SharedEstimateCompany[];
}

interface EstimateEntry {
    _id: string;
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
    const [entries, setEntries] = useState<EstimateEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [leftPct, setLeftPct] = useState(65);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    useEffect(() => {
        if (!open) return;
        setSelectedEstimateId(null);
        setCheckedIds(new Set());
        setLoading(true);
        Api.requestSession<EstimateEntry[]>({
            command: 'estimates_shared_by_me/fetch_grouped',
            args: {},
        })
            .then((data) => setEntries(data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [open]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;

        const onMove = (mv: MouseEvent) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((mv.clientX - rect.left) / rect.width) * 100;
            setLeftPct(Math.min(85, Math.max(15, pct)));
        };

        const onUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    const selectedEntry = entries.find((e) => String(e._id) === selectedEstimateId) ?? null;

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
            originalEstimateId: String(selectedEntry._id),
            estimate: selectedEntry.estimate,
            companies: selectedEntry.companies.filter((c) => checkedIds.has(String(c._id))).map(c => ({ ...c, _id: String(c._id) })),
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xl' fullWidth PaperProps={{ sx: { borderRadius: 2, maxWidth: 1100 } }}>
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
                    <Box
                        ref={containerRef}
                        sx={{ display: 'flex', minHeight: 380, maxHeight: 520, userSelect: dragging.current ? 'none' : undefined }}
                    >
                        {/* Left panel */}
                        <Box sx={{ width: `${leftPct}%`, overflow: 'auto', flexShrink: 0 }}>
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
                                            key={String(entry._id)}
                                            hover
                                            onClick={() => handleSelectEstimate(String(entry._id))}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedEstimateId === String(entry._id)
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

                        {/* Drag handle */}
                        <Box
                            onMouseDown={onMouseDown}
                            sx={{
                                width: 5,
                                flexShrink: 0,
                                cursor: 'col-resize',
                                backgroundColor: '#e0e0e0',
                                transition: 'background-color 0.15s',
                                '&:hover': { backgroundColor: mainPrimaryColor },
                            }}
                        />

                        {/* Right panel */}
                        <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
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
                                            key={String(company._id)}
                                            secondaryAction={
                                                <Checkbox
                                                    checked={checkedIds.has(String(company._id))}
                                                    onChange={() => toggleCompany(String(company._id))}
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
                    </Box>
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
