import React from 'react';

import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slider } from '@mui/material';

import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';

import Cropper from 'react-easy-crop';

import * as Api from 'api';
import { useTranslation } from 'react-i18next';

export const companyLogoMarginTop = 16;
export const companyLogoAvatarSize = 170;

interface CompanyLogoComponentProps {
    account: Api.ApiAccount | undefined;
    canEdit: boolean;
}

export default function CompanyLogoComponent(props: CompanyLogoComponentProps) {
    if (!props.account) {
        return (
            <Avatar
                alt='Company Logo'
                sx={{
                    width: companyLogoAvatarSize,
                    height: companyLogoAvatarSize,
                }}
            >
                <BusinessIcon fontSize='large' />
            </Avatar>
        );
    }

    return <CompanyLogoComponentBody {...props} />;
}

function CompanyLogoComponentBody(props: CompanyLogoComponentProps) {
    const { t } = useTranslation();

    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [imageSrc, setImageSrc] = React.useState<string | undefined>(Api.makeCompanyLogoUrl(props.account));

    const [open, setOpen] = React.useState(false);
    const [crop, setCrop] = React.useState({ x: 0, y: 0 });
    const [zoom, setZoom] = React.useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // Trigger file selection
    const handleEditClick = () => {
        fileInputRef.current && fileInputRef.current.click();
    };

    // Read the file as a data URL and open the cropping dialog
    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setOpen(true);
        }
    };

    const readFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    // Update cropping area pixels after cropping
    const onCropComplete = React.useCallback((croppedArea: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Handle saving the cropped image
    const handleUpload = async () => {
        try {
            if (croppedAreaPixels && imageSrc) {
                const blob = await getCroppedImg(imageSrc, croppedAreaPixels);

                const croppedImageUrl = window.URL.createObjectURL(blob);
                setImageSrc(croppedImageUrl);

                // Optionally create a File if your backend requires one
                const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });

                // Append the file to a FormData object
                const formData = new FormData();
                formData.append('file', file);

                await Api.requestSession({
                    command: 'account/upload_logo',
                    args: {
                        accountId: props.account?._id,
                    },
                    // method: 'POST',
                    body: formData,
                });

                // if (onImageChange) {
                //   onImageChange(croppedImageUrl);
                // }
                setOpen(false);
            }
        } catch (error) {
            console.error('Crop failed:', error);
        }
    };

    return (
        <>
            <Box position='relative' display='inline-block' sx={{
                        // paddingTop: `${companyLogoMarginTop}px`,
            }}>
                <Avatar
                    alt='Company Logo'
                    src={imageSrc}
                    sx={{
                        marginTop: `${companyLogoMarginTop}px`,
                        width: companyLogoAvatarSize,
                        height: companyLogoAvatarSize,
                        // backgroundColor: imageSrc ? 'transparent' : 'grey.300',
                        backgroundImage: imageSrc ? `url(${imageSrc})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: props.canEdit ? 'pointer' : undefined,
                    }}
                >
                    {!imageSrc && <BusinessIcon fontSize='large' />}
                </Avatar>

                {props.canEdit && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `${companyLogoMarginTop}px`,
                            left: 0,
                            width: companyLogoAvatarSize,
                            height: companyLogoAvatarSize,
                            bgcolor: 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                            '&:hover': {
                                opacity: 1,
                            },
                        }}
                    >
                        {' '}
                        <IconButton onClick={handleEditClick}>
                            <EditIcon sx={{ color: '#fff' }} />
                        </IconButton>
                    </Box>
                )}

                <input type='file' accept='image/*' ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
                <DialogTitle>Crop Image</DialogTitle>
                <DialogContent>
                    <Box position='relative' width='100%' height={300} bgcolor='#333'>
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                cropShape='round'
                                showGrid={false}
                                aspect={1} // Adjust the aspect ratio as needed
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </Box>
                    <Slider value={zoom} min={1} max={3} step={0.1} onChange={(e, newZoom) => setZoom(newZoom as number)} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>{t('Cancel')}</Button>
                    <Button variant='contained' onClick={handleUpload}>
                        {t('Confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

// Utility function to crop the image using a canvas element
async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    }

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas is empty');
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
            // blob.name = 'cropped.jpeg';
            // const croppedImageUrl = window.URL.createObjectURL(blob);
            // resolve(croppedImageUrl);
        }, 'image/jpeg');
    });
}
