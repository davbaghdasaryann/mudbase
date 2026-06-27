'use client';

import React from 'react';
import { Box, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button, Slider } from '@mui/material';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Cropper from 'react-easy-crop';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import { useApiFetchOne } from '@/components/ApiDataFetch';
import UserProfileChangePasswordDialog from './UserProfileChangePasswordDialog';
import { useTranslation } from 'react-i18next';

const BRAND = '#00abbe';

const fieldSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: '#fff',
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,171,190,0.35)' },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
};

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
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas empty')), 'image/jpeg');
    });
}

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
            const file = new File([blob], 'avatar.jpeg', { type: 'image/jpeg' });
            const fd = new FormData();
            fd.append('file', file);
            const res = await Api.requestSession<{ profileAvatar: string }>({
                command: 'profile/upload_avatar',
                body: fd,
            });
            setImageSrc(URL.createObjectURL(blob));
            onUploaded(res.profileAvatar);
            setCropSrc(undefined);
        } finally {
            setUploading(false);
        }
    };

    const SIZE = 96;

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
                    {/* Circle */}
                    <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            width: SIZE, height: SIZE, borderRadius: '50%',
                            bgcolor: imageSrc ? 'transparent' : BRAND,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,171,190,0.25)',
                            fontSize: 32, fontWeight: 700, color: '#fff',
                        }}
                    >
                        {imageSrc
                            ? <img src={imageSrc} alt='avatar' onError={() => setImageSrc(undefined)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (initials || <PersonOutlineIcon sx={{ fontSize: 44 }} />)
                        }
                    </Box>
                    {/* Camera overlay */}
                    <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.38)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer',
                            '&:hover': { opacity: 1 },
                        }}
                    >
                        <CameraAltOutlinedIcon sx={{ color: '#fff', fontSize: 26 }} />
                    </Box>
                    <input ref={fileInputRef} type='file' accept='image/*' style={{ display: 'none' }} onChange={handleFile} />
                </Box>
            </Box>

            {/* Crop dialog */}
            <Dialog open={!!cropSrc} onClose={() => setCropSrc(undefined)} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>{t('Crop Photo')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ position: 'relative', width: '100%', height: 300, bgcolor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                        {cropSrc && (
                            <Cropper image={cropSrc} crop={crop} zoom={zoom} cropShape='round' showGrid={false} aspect={1}
                                onCropChange={setCrop} onZoomChange={setZoom}
                                onCropComplete={(_, pixels) => setCroppedPixels(pixels)} />
                        )}
                    </Box>
                    <Slider value={zoom} min={1} max={3} step={0.05} onChange={(_, v) => setZoom(v as number)}
                        sx={{ mt: 2, color: BRAND }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setCropSrc(undefined)} sx={{ color: 'text.secondary' }}>{t('Cancel')}</Button>
                    <Button onClick={handleUpload} disabled={uploading} variant='contained'
                        sx={{ borderRadius: '8px', bgcolor: BRAND, '&:hover': { bgcolor: '#009aaa' } }}>
                        {uploading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default function UserProfilePageContents() {
    const form = F.useForm({ type: 'update-fields' });
    const [changePasswordDialog, setChangePasswordDialog] = React.useState(false);
    const [avatarFilename, setAvatarFilename] = React.useState<string | undefined>();

    const apiData = useApiFetchOne<Api.ApiUser>({
        api: { command: 'profile/get' },
    });

    const user = apiData.data
        ? { ...apiData.data, ...(avatarFilename ? { profileAvatar: avatarFilename } : {}) }
        : apiData.data;

    const onFieldUpdate = React.useCallback(
        async (field: InputFormField) => {
            await Api.requestSession<any>({
                command: 'profile/update',
                values: { [field.id!]: field.value },
            });
        },
        []
    );

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', py: 4 }}>
                <Box sx={{
                    width: '100%', maxWidth: 560,
                    backgroundColor: '#fff',
                    borderRadius: '14px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    p: { xs: 2.5, sm: 4 },
                }}>
                    <AvatarUpload user={user ?? undefined} onUploaded={setAvatarFilename} />

                    <F.PageForm
                        form={form}
                        formContainer='none'
                        onFieldUpdate={onFieldUpdate}
                        loading={apiData.loading}
                        slotProps={{ textField: { sx: fieldSx } }}
                    >
                        <F.InputText id='email' label='Email' value={user?.email} xs={12} readonly />
                        <F.InputText id='firstName' autocomplete='name' label='First Name' value={user?.firstName} xs={12} />
                        <F.InputText id='middleName' autocomplete='given-name' label='Middle Name' value={user?.middleName} xs={12} />
                        <F.InputText id='lastName' autocomplete='family-name' label='Last Name' value={user?.lastName} xs={12} />
                        <F.InputText id='phoneNumber' autocomplete='tel' label='Phone Number' value={user?.phoneNumber} xs={12} />
                        <F.FormButton
                            label='Change Password'
                            xs={12}
                            onClickTrue={setChangePasswordDialog}
                            variant='outlined'
                            buttonSx={{
                                borderRadius: '8px',
                                borderColor: BRAND,
                                color: BRAND,
                                width: '100%',
                                '&:hover': { borderColor: BRAND, backgroundColor: 'rgba(0,171,190,0.06)' },
                            }}
                        />
                    </F.PageForm>
                </Box>
            </Box>

            <UserProfileChangePasswordDialog show={changePasswordDialog} onCloseFalse={setChangePasswordDialog} />
        </>
    );
}
