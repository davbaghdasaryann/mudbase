'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
    Checkbox, InputAdornment, Button, Divider, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';

import * as EstimatesApi from '@/api/estimates_shares';
import * as Api from '@/api';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { EstimateShareToAccountConfirmationDialog } from '../EstimateShareToAccountConfirmationDialog';

const BRAND = '#00ABBE';
const BRAND_DARK = '#0099aa';

// Activity labels matching backend company_activities.ts
const ACTIVITY_LABELS: Record<string, string> = {
    F: 'Bank', C: 'Credit', I: 'Insurance', A: 'Architect',
    V: 'Vendor', B: 'Builder', D: 'Developer',
};

interface Props {
    show?: boolean;
    title?: string;
    estimateId: string;
    onClose: () => void;
    onConfirm: () => void;
    calledFromPage: 'estimates' | 'sharedEstimates';
}

export default function EstimateShareToAccountSelectionDialog(props: Props) {
    if (props.show === false) return null;
    return <ShareDialogBody {...props} />;
}

function ShareDialogBody(props: Props) {
    const [t] = useTranslation();
    const [search, setSearch] = useState('');
    const [industry, setIndustry] = useState('All');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [progIndic, setProgIndic] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const apiData = useApiFetchOne<Api.ApiAccount>({
        api: { command: 'accounts/fetch_shareable_accounts_for_estimate' },
    });

    const accounts: any[] = Array.isArray(apiData.data) ? apiData.data : [];

    // Unique industry options from fetched accounts
    const industryOptions = useMemo(() => {
        const set = new Set<string>();
        for (const acc of accounts) {
            for (const act of acc.accountActivity ?? []) {
                if (ACTIVITY_LABELS[act]) set.add(act);
            }
        }
        return Array.from(set);
    }, [accounts]);

    // Client-side filter
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return accounts.filter(acc => {
            const matchSearch = !q || (acc.companyName ?? '').toLowerCase().includes(q);
            const matchIndustry = industry === 'All' || (acc.accountActivity ?? []).includes(industry);
            return matchSearch && matchIndustry;
        });
    }, [accounts, search, industry]);

    const toggleAll = () => {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map((a: any) => a._id)));
        }
    };

    const toggleOne = (id: string) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const handleSave = () => {
        if (selected.size === 0) return;
        setShowConfirm(true);
    };

    const onSubmit = useCallback(async (shareType: 'totalEstimate' | 'onlyEstimateInfo') => {
        setShowConfirm(false);
        setProgIndic(true);
        try {
            await Promise.all(
                Array.from(selected).map(accountId =>
                    Api.requestSession<EstimatesApi.ApiEstimatesShares>({
                        command: 'estimates_shares/add_full_for_share',
                        args: {
                            estimateId: props.estimateId,
                            sharedWithAccountId: accountId,
                            estimateMultiShareType: shareType,
                        },
                    })
                )
            );
        } finally {
            setProgIndic(false);
        }
        apiData.setApi({ command: 'accounts/fetch_shareable_accounts_for_estimate' });
        props.onConfirm();
    }, [selected, props.estimateId]);

    const allChecked = filtered.length > 0 && selected.size === filtered.length;
    const someChecked = selected.size > 0 && selected.size < filtered.length;

    return (
        <>
            <Dialog
                open
                onClose={props.onClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden', minHeight: 713, maxWidth: 600 } }}
            >
                {/* Header */}
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, fontSize: 18, pb: 1 }}>
                    {t('Share')}
                </DialogTitle>

                <DialogContent sx={{ px: 3, pb: 0, pt: 1 }}>
                    {progIndic && <ProgressIndicator show background="backdrop" />}

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2, mt: 2, alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder={t('Search...')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel shrink>{t('Industry')}</InputLabel>
                            <Select
                                value={industry}
                                label={t('Industry')}
                                notched
                                displayEmpty
                                onChange={e => setIndustry(e.target.value)}
                            >
                                <MenuItem value="All">{t('All')}</MenuItem>
                                {industryOptions.map(act => (
                                    <MenuItem key={act} value={act}>
                                        {t(ACTIVITY_LABELS[act] ?? act)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Company list with sticky header inside so checkboxes always share the same content width */}
                    <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {/* Companies header — sticky so it stays visible while scrolling */}
                        <Box sx={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, backgroundColor: '#f5f5f5', mb: 0.5 }}>
                            <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t('Companies')}
                            </Typography>
                            <Checkbox
                                size="small"
                                checked={allChecked}
                                indeterminate={someChecked}
                                onChange={toggleAll}
                                disabled={filtered.length === 0}
                                sx={{ p: '5px', color: BRAND, '&.Mui-checked': { color: BRAND }, '&.MuiCheckbox-indeterminate': { color: BRAND } }}
                            />
                        </Box>
                        {apiData.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress size={28} sx={{ color: BRAND }} />
                            </Box>
                        ) : filtered.length === 0 ? (
                            <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 4, fontSize: 14 }}>
                                {t('No companies found')}
                            </Typography>
                        ) : (
                            filtered.map((acc: any, idx: number) => {
                                const id = acc._id as string;
                                const isChecked = selected.has(id);
                                return (
                                    <Box
                                        key={id}
                                        onClick={() => toggleOne(id)}
                                        sx={{
                                            display: 'flex', alignItems: 'center',
                                            px: 1.5, py: 1,
                                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9',
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: '#f0faf9' },
                                            borderBottom: '1px solid #f0f0f0',
                                        }}
                                    >
                                        <Typography sx={{ flex: 1, fontSize: 14 }}>
                                            {acc.companyName}
                                        </Typography>
                                        <Checkbox
                                            size="small"
                                            checked={isChecked}
                                            onChange={() => toggleOne(id)}
                                            onClick={e => e.stopPropagation()}
                                            sx={{ p: '5px', color: '#b2e4ea', '&.Mui-checked': { color: BRAND } }}
                                        />
                                    </Box>
                                );
                            })
                        )}
                    </Box>
                </DialogContent>

                {/* Footer */}
                <Divider />
                <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={props.onClose} sx={{ color: BRAND, fontWeight: 600 }}>
                        {t('CANCEL')}
                    </Button>
                    <Button
                        variant="contained"
                        disabled={selected.size === 0}
                        onClick={handleSave}
                        sx={{ backgroundColor: BRAND, '&:hover': { backgroundColor: BRAND_DARK }, '&.Mui-disabled': { backgroundColor: '#b2e4ea', color: '#fff' }, fontWeight: 600, px: 3 }}
                    >
                        {t('SHARE')}
                    </Button>
                </DialogActions>
            </Dialog>

            {showConfirm && (
                <EstimateShareToAccountConfirmationDialog
                    title={props.title ?? t('Share')}
                    message={`${t('Are you sure you want to share it')} ${t('share_word_with')} ${selected.size} ${t('companies')}${t('share_word_with_in_armenian')} ${t('share_question_mark')}`}
                    onClose={() => setShowConfirm(false)}
                    onConfirm={onSubmit}
                />
            )}
        </>
    );
}
