'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { mainPrimaryColor } from '@/theme';

interface Props {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
}

export default function AddEnteredCompanyDialog({ open, onClose, onAdd }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    const handleConfirm = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setName('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 600 }}>{t('Add Company')}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    size='small'
                    label={t('Company Name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} sx={{ color: 'text.secondary' }}>{t('Cancel')}</Button>
                <Button onClick={handleConfirm} disabled={!name.trim()} sx={{ color: mainPrimaryColor, fontWeight: 600 }}>{t('Add')}</Button>
            </DialogActions>
        </Dialog>
    );
}
