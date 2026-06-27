'use client';

import React from 'react';
import { Box, Typography, TextField, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider } from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Cropper from 'react-easy-crop';

import * as Api from '@/api';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import UserProfileChangePasswordDialog from './UserProfileChangePasswordDialog';
import { useTranslation } from 'react-i18next';

const BRAND = '#00abbe';
const BORDER_DEFAULT = '#e5e7eb';
const BORDER_HOVER = 'rgba(0,171,190,0.35)';

async function getCroppedImg(src: string, pixels: { x: number; y: number; width: number; height: number }): Promise<Blob> {
    const image = new Image();
    image.src = src;
    await new Promise(r => { image.onload = r; });
    const canvas = document.createElement('canvas');
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, pixels.width, pixels.height);
    return new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas empty')), 'image/jpeg');
    });
}

// ── Inline editable field ────────────────────────────────────────────────────
function ProfileInlineField({ label, fieldId, value, onSave, onActivate, forceClose }: {
    label: string; fieldId: string; value: string;
    onSave: (fieldId: string, value: string) => Promise<void>;
    onActivate: () => void;
    forceClose: boolean;
}) {
    const [editing, setEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const [saving, setSaving] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => { setEditValue(value); }, [value]);
    React.useEffect(() => {
        if (forceClose && editing) { setEditValue(value); setEditing(false); }
    }, [forceClose]);
    React.useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, [editing]);

    const save = async () => {
        if (editValue === value) { setEditing(false); return; }
        setSaving(true);
        try { await onSave(fieldId, editValue); }
        finally { setSaving(false); setEditing(false); }
    };

    const cancel = () => { setEditValue(value); setEditing(false); };

    const borderColor = editing ? BRAND : hovered ? BORDER_HOVER : BORDER_DEFAULT;

    return (
        <Box
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => { if (!editing && !saving) { onActivate(); setEditing(true); } }}
            sx={{
                p: 1.5,
                border: `1px solid ${borderColor}`,
                borderRadius: '10px',
                backgroundColor: editing ? 'rgba(0,171,190,0.015)' : hovered ? 'rgba(0,171,190,0.02)' : '#fafafa',
                cursor: editing ? 'default' : 'pointer',
                transition: 'border-color 0.18s ease, background-color 0.15s ease',
            }}
        >
            <Typography variant='caption' sx={{ display: 'block', color: editing ? BRAND : 'text.disabled', fontSize: '0.70rem', letterSpacing: '0.04em', mb: 0.3, userSelect: 'none', transition: 'color 0.18s ease' }}>
                {label}
            </Typography>
            {editing ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TextField
                        inputRef={inputRef}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') cancel(); }}
                        variant='standard'
                        fullWidth
                        sx={{
                            '& .MuiInput-root': { fontSize: '0.95rem', fontWeight: 500, color: 'text.primary' },
                            '& .MuiInput-underline:before': { borderBottom: 'none' },
                            '& .MuiInput-underline:after': { borderBottom: 'none' },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                        }}
                    />
                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                        {saving ? (
                            <CircularProgress size={16} sx={{ color: BRAND, m: 1 }} />
                        ) : (
                            <>
                                <IconButton size='small' onClick={e => { e.stopPropagation(); save(); }} sx={{ color: BRAND, '&:hover': { bgcolor: 'rgba(0,171,190,0.1)' } }}>
                                    <CheckIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton size='small' onClick={e => { e.stopPropagation(); cancel(); }} sx={{ color: 'text.disabled', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28 }}>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: value ? 'text.secondary' : 'text.disabled' }}>
                        {value || '—'}
                    </Typography>
                    {hovered && <EditOutlinedIcon sx={{ fontSize: 15, color: 'rgba(0,171,190,0.45)', ml: 1, flexShrink: 0 }} />}
                </Box>
            )}
        </Box>
    );
}

// ── Read-only display field ──────────────────────────────────────────────────
function ProfileDisplayField({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ p: 1.5, border: `1px solid ${BORDER_DEFAULT}`, borderRadius: '10px', backgroundColor: '#fafafa' }}>
            <Typography variant='caption' sx={{ display: 'block', color: 'text.disabled', fontSize: '0.70rem', letterSpacing: '0.04em', mb: 0.3 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: 'text.disabled' }}>{value || '—'}</Typography>
        </Box>
    );
}

// ── Avatar with upload ───────────────────────────────────────────────────────
function AvatarUpload({ user, onUploaded }: { user: Api.ApiUser | undefined; onUploaded: (filename: string) => void }) {
    const { t } = useTranslation();
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [imageSrc, setImageSrc] = React.useState<string | undefined>(Api.makeUserAvatarUrl(user));
    const [cropSrc, setCropSrc] = React.useState<string | undefined>();
    const [crop, setCrop] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [croppedPixels, setCroppedPixels] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [uploading, setUploading] = React.useState(false);

    React.useEffect(() => { setImageSrc(Api.makeUserAvatarUrl(user)); }, [user?.profileAvatar]);

    const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const reader = new FileReader();
        reader.onload = () => { setCropSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); };
        reader.readAsDataURL(e.target.files[0]);
        e.target.value = '';
    };

    const handleUpload = async () => {
        if (!cropSrc || !croppedPixels) return;
        setUploading(true);
        try {
            const blob = await getCroppedImg(cropSrc, croppedPixels);
            const fd = new FormData();
            fd.append('file', new File([blob], 'avatar.jpeg', { type: 'image/jpeg' }));
            const res = await Api.requestSession<{ profileAvatar: string }>({ command: 'profile/upload_avatar', body: fd });
            setImageSrc(URL.createObjectURL(blob));
            onUploaded(res.profileAvatar);
            setCropSrc(undefined);
        } finally { setUploading(false); }
    };

    const SIZE = 112;

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
                    <Box onClick={() => fileInputRef.current?.click()} sx={{
                        width: SIZE, height: SIZE, borderRadius: '50%',
                        bgcolor: imageSrc ? 'transparent' : BRAND,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,171,190,0.25)',
                        fontSize: 36, fontWeight: 700, color: '#fff',
                    }}>
                        {imageSrc
                            ? <img src={imageSrc} alt='avatar' onError={() => setImageSrc(undefined)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (initials || <PersonOutlineIcon sx={{ fontSize: 50 }} />)
                        }
                    </Box>
                    <Box onClick={() => fileInputRef.current?.click()} sx={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        bgcolor: 'rgba(0,0,0,0.38)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                        '&:hover': { opacity: 1 },
                    }}>
                        <CameraAltOutlinedIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <input ref={fileInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={handleFile} />
                </Box>
            </Box>

            <Dialog open={!!cropSrc} onClose={() => setCropSrc(undefined)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>{t('Crop Photo')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', width: '100%', height: 300, bgcolor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                        {cropSrc && <Cropper image={cropSrc} crop={crop} zoom={zoom} cropShape='round' showGrid={false} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setCroppedPixels(px)} />}
                    </Box>
                    <Slider value={zoom} min={1} max={3} step={0.05} onChange={(_, v) => setZoom(v as number)} sx={{ mt: 2, color: BRAND }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCropSrc(undefined)} sx={{ color: 'text.secondary' }}>{t('Cancel')}</Button>
                    <Button onClick={handleUpload} disabled={uploading} variant='contained' sx={{ borderRadius: '8px', bgcolor: BRAND, '&:hover': { bgcolor: '#009aaa' } }}>
                        {uploading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function UserProfilePageContents() {
    const { t } = useTranslation();
    const [changePasswordDialog, setChangePasswordDialog] = React.useState(false);
    const [avatarFilename, setAvatarFilename] = React.useState<string | undefined>();
    const [localValues, setLocalValues] = React.useState<Record<string, string>>({});
    const [activeFieldId, setActiveFieldId] = React.useState<string | null>(null);

    const apiData = useApiFetchOne<Api.ApiUser>({ api: { command: 'profile/get' } });
    const user = apiData.data;

    React.useEffect(() => {
        if (user) {
            setLocalValues({
                firstName:   user.firstName   ?? '',
                middleName:  user.middleName  ?? '',
                lastName:    user.lastName    ?? '',
                phoneNumber: user.phoneNumber ?? '',
            });
        }
    }, [user]);

    const mergedUser = user ? { ...user, ...(avatarFilename ? { profileAvatar: avatarFilename } : {}) } : user;

    const handleSave = React.useCallback(async (fieldId: string, value: string) => {
        await Api.requestSession<any>({ command: 'profile/update', values: { [fieldId]: value } });
        setLocalValues(prev => ({ ...prev, [fieldId]: value }));
    }, []);

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', py: 4 }}>
                <Box sx={{ width: '100%', maxWidth: 500, backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', p: { xs: 2.5, sm: 4 } }}>
                    <AvatarUpload user={mergedUser ?? undefined} onUploaded={setAvatarFilename} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <ProfileDisplayField label={t('Email')} value={user?.email ?? ''} />
                        {(['firstName', 'middleName', 'lastName', 'phoneNumber'] as const).map((id, _, arr) => (
                            <ProfileInlineField
                                key={id}
                                label={t({ firstName: 'First Name', middleName: 'Middle Name', lastName: 'Last Name', phoneNumber: 'Phone Number' }[id])}
                                fieldId={id}
                                value={localValues[id] ?? ''}
                                onSave={handleSave}
                                onActivate={() => setActiveFieldId(id)}
                                forceClose={activeFieldId !== null && activeFieldId !== id}
                            />
                        ))}

                        <Button
                            variant='outlined'
                            fullWidth
                            onClick={() => setChangePasswordDialog(true)}
                            sx={{ mt: 0.5, borderRadius: '8px', borderColor: BRAND, color: BRAND, height: 48, '&:hover': { borderColor: BRAND, bgcolor: 'rgba(0,171,190,0.06)' } }}
                        >
                            {t('Change Password')}
                        </Button>
                    </Box>
                </Box>
            </Box>

            <UserProfileChangePasswordDialog show={changePasswordDialog} onCloseFalse={setChangePasswordDialog} />
        </>
    );
}
