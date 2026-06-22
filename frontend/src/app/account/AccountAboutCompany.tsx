'use client';

import React from 'react';
import { Box, CircularProgress, Grid, IconButton, Link, TextField, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';

import * as Api from 'api';
import { makeAccountActivitiesString } from '@/lib/account_activities';
import { aboutCompanyBottomDividerColor } from '../../theme';

const BRAND = '#00abbe';

interface AboutCompanyPageProps {
    account: Api.ApiAccount | undefined;
    onDataChanged?: () => void;
}

// ─── Inline field ────────────────────────────────────────────────────────────

interface InlineFieldProps {
    label: string;
    fieldId: string;
    value: string;
    displayonly?: boolean;
    multiline?: boolean;
    isLink?: boolean;
    gridSize?: number;
    onSave: (fieldId: string, value: string) => Promise<void>;
}

function InlineField({ label, fieldId, value, displayonly, multiline, isLink, gridSize = 6, onSave }: InlineFieldProps) {
    const [editing, setEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const [hovered, setHovered] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => { setEditValue(value); }, [value]);

    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, [editing]);

    const startEdit = () => { if (!displayonly && !saving) setEditing(true); };

    const save = async () => {
        if (editValue === value) { setEditing(false); return; }
        setSaving(true);
        try { await onSave(fieldId, editValue); }
        finally { setSaving(false); setEditing(false); }
    };

    const cancel = () => { setEditValue(value); setEditing(false); };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) { e.preventDefault(); save(); }
        if (e.key === 'Escape') cancel();
    };

    const borderColor = editing
        ? BRAND
        : hovered && !displayonly
        ? 'rgba(0,171,190,0.30)'
        : aboutCompanyBottomDividerColor;

    return (
        <Grid size={gridSize}>
            <Box
                onMouseEnter={() => !displayonly && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={!editing && !displayonly ? startEdit : undefined}
                sx={{
                    px: 1.5,
                    pt: 1.5,
                    pb: 0.75,
                    borderBottom: `2px solid ${borderColor}`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'border-color 0.2s ease, background-color 0.15s ease',
                    cursor: displayonly || editing ? 'default' : 'pointer',
                    ...(!displayonly && !editing && { '&:hover': { backgroundColor: 'rgba(0,171,190,0.03)' } }),
                }}
            >
                {/* Label */}
                <Typography
                    variant='caption'
                    sx={{
                        display: 'block',
                        color: editing ? BRAND : 'text.disabled',
                        fontSize: '0.72rem',
                        letterSpacing: '0.04em',
                        mb: 0.5,
                        transition: 'color 0.2s ease',
                        userSelect: 'none',
                    }}
                >
                    {label}
                </Typography>

                {editing ? (
                    /* ── Edit mode ── */
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <TextField
                            inputRef={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={onKeyDown}
                            multiline={multiline}
                            minRows={multiline ? 2 : undefined}
                            maxRows={multiline ? 8 : undefined}
                            variant='standard'
                            fullWidth
                            sx={{
                                '& .MuiInput-root': { fontSize: '20px', fontWeight: 600, color: 'text.primary' },
                                '& .MuiInput-underline:before': { borderBottom: 'none' },
                                '& .MuiInput-underline:after': { borderBottom: 'none' },
                                '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                            }}
                        />
                        <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', mt: 0.5 }}>
                            {saving ? (
                                <CircularProgress size={18} sx={{ color: BRAND, mx: 1 }} />
                            ) : (
                                <>
                                    <IconButton size='small' onClick={save} sx={{ color: BRAND, '&:hover': { backgroundColor: 'rgba(0,171,190,0.1)' } }}>
                                        <CheckIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size='small' onClick={cancel} sx={{ color: 'text.disabled', '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' } }}>
                                        <CloseIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </>
                            )}
                        </Box>
                    </Box>
                ) : (
                    /* ── Display mode ── */
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '34px' }}>
                        {isLink && value ? (
                            <Link
                                href={/^https?:\/\//.test(value) ? value : `https://${value}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                underline='hover'
                                onClick={e => e.stopPropagation()}
                                sx={{ fontSize: '20px', fontWeight: 600, color: BRAND }}
                            >
                                {value}
                            </Link>
                        ) : (
                            <Typography sx={{ fontSize: '20px', fontWeight: 600, color: value ? 'text.secondary' : 'text.disabled', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                {value || '—'}
                            </Typography>
                        )}

                        {!displayonly && hovered && (
                            <IconButton
                                size='small'
                                onClick={e => { e.stopPropagation(); startEdit(); }}
                                sx={{ color: 'rgba(0,171,190,0.45)', flexShrink: 0, ml: 1, '&:hover': { color: BRAND, backgroundColor: 'rgba(0,171,190,0.08)' } }}
                            >
                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        )}
                    </Box>
                )}
            </Box>
        </Grid>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutCompanyPage(props: AboutCompanyPageProps) {
    const { t } = useTranslation();
    const account = props.account;

    const activityValue = React.useMemo(() => makeAccountActivitiesString(account?.accountActivity), [account]);

    const [values, setValues] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (!account) return;
        setValues({
            companyName:   account.companyName   ?? '',
            establishedAt: account.establishedAt ?? '',
            phoneNumber:   account.phoneNumber   ?? '',
            address:       account.address       ?? '',
            lawAddress:    account.lawAddress    ?? '',
            email:         account.email         ?? '',
            website:       account.website       ?? '',
            director:      account.director      ?? '',
            companyInfo:   account.companyInfo   ?? '',
        });
    }, [account]);

    const handleSave = React.useCallback(async (fieldId: string, value: string) => {
        await Api.requestSession<any>({
            command: 'profile/update_account',
            values: { [fieldId]: value },
        });
        setValues(prev => ({ ...prev, [fieldId]: value }));
        props.onDataChanged?.();
    }, [props.onDataChanged]);

    if (!account) {
        return <Box sx={{ p: 2 }}><Typography color='text.disabled'>{t('Loading...')}</Typography></Box>;
    }

    const field = (id: string, label: string, opts?: Partial<InlineFieldProps>) => (
        <InlineField key={id} label={label} fieldId={id} value={values[id] ?? ''} onSave={handleSave} {...opts} />
    );

    return (
        <Box sx={{ width: '100%', overflowY: 'auto', pb: 3 }}>
            <Grid container spacing={0}>
                {field('companyName',   t('Company Name'),    { gridSize: 12 })}
                {field('establishedAt', t('Establish Date'))}
                {field('phoneNumber',   t('Phone Number'))}
                <InlineField label={t('TIN')}      fieldId='companyTin'      value={account.companyTin ?? ''} displayonly onSave={handleSave} />
                <InlineField label={t('Activity')} fieldId='accountActivity' value={activityValue}           displayonly onSave={handleSave} />
                {field('address',    t('Address'),       { multiline: true })}
                {field('lawAddress', t('Legal Address'), { multiline: true })}
                {field('email',   t('Email'))}
                {field('website', t('Website'), { isLink: true })}
                {field('director',    t('Director'),       { gridSize: 12 })}
                {field('companyInfo', t('About Company'),  { gridSize: 12, multiline: true })}
            </Grid>
        </Box>
    );
}
