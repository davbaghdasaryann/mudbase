'use client';

import React from 'react';
import { Box, CircularProgress, Grid, IconButton, Link, TextField, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import CategoryIcon from '@mui/icons-material/Category';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MarkunreadMailboxIcon from '@mui/icons-material/MarkunreadMailbox';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from 'react-i18next';

import * as Api from 'api';
import { makeAccountActivitiesString } from '@/lib/account_activities';

const BRAND = '#00abbe';
const BORDER_DEFAULT = '#e5e7eb';
const BORDER_HOVER   = 'rgba(0,171,190,0.35)';
const BORDER_ACTIVE  = BRAND;
const ICON_BG        = 'rgba(0,171,190,0.10)';

interface AboutCompanyPageProps {
    account: Api.ApiAccount | undefined;
    onDataChanged?: () => void;
}

interface InlineFieldProps {
    label: string;
    fieldId: string;
    value: string;
    icon: React.ReactElement;
    displayonly?: boolean;
    multiline?: boolean;
    isLink?: boolean;
    gridSize?: number | Record<string, number>;
    onSave: (fieldId: string, value: string) => Promise<void>;
}

function InlineField({ label, fieldId, value, icon, displayonly, multiline, isLink, gridSize = { xs: 12, sm: 6 }, onSave }: InlineFieldProps) {
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

    const borderColor = editing ? BORDER_ACTIVE : hovered && !displayonly ? BORDER_HOVER : BORDER_DEFAULT;

    return (
        <Grid size={gridSize}>
            <Box
                onMouseEnter={() => !displayonly && setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={!editing && !displayonly ? startEdit : undefined}
                sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '10px',
                    backgroundColor: editing ? 'rgba(0,171,190,0.015)' : hovered && !displayonly ? 'rgba(0,171,190,0.02)' : '#fff',
                    transition: 'border-color 0.18s ease, background-color 0.15s ease',
                    cursor: displayonly || editing ? 'default' : 'pointer',
                    minHeight: 68,
                }}
            >
                {/* Icon chip */}
                <Box sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '8px',
                    backgroundColor: editing ? 'rgba(0,171,190,0.18)' : ICON_BG,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                    transition: 'background-color 0.18s ease',
                }}>
                    {React.cloneElement(icon, { sx: { fontSize: 18, color: BRAND } } as any)}
                </Box>

                {/* Label + value */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant='caption'
                        sx={{
                            display: 'block',
                            color: editing ? BRAND : 'text.disabled',
                            fontSize: '0.70rem',
                            letterSpacing: '0.05em',
                            mb: 0.4,
                            transition: 'color 0.18s ease',
                            userSelect: 'none',
                        }}
                    >
                        {label}
                    </Typography>

                    {editing ? (
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
                                    '& .MuiInput-root': { fontSize: '0.95rem', fontWeight: 500, color: 'text.primary' },
                                    '& .MuiInput-underline:before': { borderBottom: 'none' },
                                    '& .MuiInput-underline:after': { borderBottom: 'none' },
                                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                                }}
                            />
                            <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
                                {saving ? (
                                    <CircularProgress size={18} sx={{ color: BRAND, mx: 1 }} />
                                ) : (
                                    <>
                                        <IconButton size='small' onClick={save} sx={{ color: BRAND, '&:hover': { backgroundColor: 'rgba(0,171,190,0.1)' } }}>
                                            <CheckIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                        <IconButton size='small' onClick={cancel} sx={{ color: 'text.disabled', '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' } }}>
                                            <CloseIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    </>
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '28px' }}>
                            {isLink && value ? (
                                <Link
                                    href={/^https?:\/\//.test(value) ? value : `https://${value}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    underline='hover'
                                    onClick={e => e.stopPropagation()}
                                    sx={{ fontSize: '0.95rem', fontWeight: 500, color: BRAND }}
                                >
                                    {value}
                                </Link>
                            ) : (
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: value ? 'text.secondary' : 'text.disabled', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {value || '—'}
                                </Typography>
                            )}

                            {!displayonly && hovered && (
                                <IconButton
                                    size='small'
                                    onClick={e => { e.stopPropagation(); startEdit(); }}
                                    sx={{ color: 'rgba(0,171,190,0.45)', flexShrink: 0, ml: 1, '&:hover': { color: BRAND, backgroundColor: 'rgba(0,171,190,0.08)' } }}
                                >
                                    <EditOutlinedIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>
        </Grid>
    );
}

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

    const field = (id: string, label: string, icon: React.ReactElement, opts?: Partial<InlineFieldProps>) => (
        <InlineField key={id} label={label} fieldId={id} value={values[id] ?? ''} icon={icon} onSave={handleSave} {...opts} />
    );

    return (
        <Box sx={{ width: '100%', overflowY: 'auto', pb: 3 }}>
        <Box sx={{ backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', p: { xs: 1.5, sm: 2.5 } }}>
            <Grid container spacing={1.5}>
                {field('companyName',   t('Company Name'),  <BusinessIcon />)}
                {field('phoneNumber',   t('Phone Number'),  <PhoneIcon />)}
                {field('establishedAt', t('Establish Date'), <CalendarTodayIcon />)}
                <InlineField label={t('Activity')} fieldId='accountActivity' value={activityValue} icon={<CategoryIcon />} displayonly onSave={handleSave} />
                <InlineField label={t('TIN')}      fieldId='companyTin'      value={account.companyTin ?? ''} icon={<BadgeIcon />} displayonly onSave={handleSave} />
                {field('address',    t('Address'),       <LocationOnIcon />,        { multiline: true })}
                {field('lawAddress', t('Legal Address'), <MarkunreadMailboxIcon />, { multiline: true })}
                {field('website', t('Website'), <LanguageIcon />, { isLink: true })}
                {field('email',    t('Email'),    <EmailIcon />)}
                {field('director', t('Director'), <PersonIcon />)}
                {field('companyInfo', t('About Company'), <InfoIcon />, { gridSize: 12, multiline: true })}
            </Grid>
        </Box>
        </Box>
    );
}
