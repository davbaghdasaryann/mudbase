'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemButton, ListItemText,
    Button, Typography, Box, Stack, CircularProgress, IconButton, Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import ImgElement from '@/tsui/DomElements/ImgElement';
import { mainPrimaryColor } from '@/theme';

export interface CompanyOption {
    _id: string;
    companyName: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (companies: CompanyOption[]) => void;
    initialSelected?: CompanyOption[];
}

export default function SelectCompanyDialog({ open, onClose, onConfirm, initialSelected = [] }: Props) {
    const { t } = useTranslation();
    const [companies, setCompanies] = useState<CompanyOption[]>([]);
    const [selected, setSelected] = useState<CompanyOption[]>(initialSelected);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setSelected(initialSelected);
        setLoading(true);
        Api.requestSession<CompanyOption[]>({ command: 'accounts/has_labor_offer' })
            .then((data) => setCompanies(data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [open]);

    const isSelected = (id: string) => selected.some((c) => String(c._id) === id);

    const add = (company: CompanyOption) => {
        if (!isSelected(String(company._id))) {
            setSelected((prev) => [...prev, company]);
        }
    };

    const remove = (id: string) => setSelected((prev) => prev.filter((c) => String(c._id) !== id));

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction='row' alignItems='center' sx={{ position: 'relative' }}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 28 }} />
                    <Typography variant='h6' sx={{ fontWeight: 600, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                        {t('Select Company')}
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
                        {/* Left: available companies */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Typography
                                variant='body2'
                                sx={{ fontWeight: 600, px: 2, py: 1.5, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}
                            >
                                {t('Companies')}
                            </Typography>
                            <List disablePadding>
                                {companies.map((company) => (
                                    <React.Fragment key={String(company._id)}>
                                        <ListItemButton
                                            onClick={() => add(company)}
                                            disabled={isSelected(String(company._id))}
                                            sx={{ px: 2, py: 1.5 }}
                                        >
                                            <ListItemText
                                                primary={company.companyName}
                                                primaryTypographyProps={{ variant: 'body2' }}
                                            />
                                        </ListItemButton>
                                        <Divider />
                                    </React.Fragment>
                                ))}
                            </List>
                        </Box>

                        {/* Right: selected companies */}
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Typography
                                variant='body2'
                                sx={{ fontWeight: 600, px: 2, py: 1.5, color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}
                            >
                                {t('Selected')}
                            </Typography>
                            <List disablePadding>
                                {selected.map((company) => (
                                    <ListItem
                                        key={String(company._id)}
                                        secondaryAction={
                                            <IconButton edge='end' size='small' onClick={() => remove(String(company._id))}>
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        }
                                        sx={{ px: 2, py: 1 }}
                                    >
                                        <ListItemText
                                            primary={company.companyName}
                                            primaryTypographyProps={{ variant: 'body2', sx: { color: mainPrimaryColor } }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
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
                    onClick={() => onConfirm(selected)}
                    sx={{ borderRadius: '20px', px: 3, backgroundColor: mainPrimaryColor }}
                >
                    {t('Confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
