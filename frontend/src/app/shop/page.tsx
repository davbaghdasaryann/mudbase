'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, IconButton, TextField, Button, Collapse,
    List, ListItem, ListItemText, ListItemIcon, CircularProgress, Tooltip,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import PageContents from '@/components/PageContents';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/api/auth';
import * as Api from 'api';

interface ShopCategory {
    _id: string;
    name: string;
    parentId?: string;
    displayIndex?: number;
}

const mainColor = '#00abbe';

export default function ShopPage() {
    const { t } = useTranslation();
    const { permissionsSet } = usePermissions();
    const isSuperAdmin = permissionsSet?.has('ALL') || permissionsSet?.has('ACC_FCH');

    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [addingParentId, setAddingParentId] = useState<string | null | 'root'>('none');
    const [addingName, setAddingName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        const res = await Api.requestSession<ShopCategory[]>({ command: 'shop/category_fetch_all' });
        setCategories(res ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const topLevel = categories.filter(c => !c.parentId).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    const subOf = (parentId: string) => categories.filter(c => c.parentId === parentId).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));

    const handleAddCategory = async (parentId: string | null) => {
        if (!addingName.trim()) return;
        setSaving(true);
        const created = await Api.requestSession<ShopCategory>({
            command: 'shop/category_create',
            args: { name: addingName.trim(), ...(parentId ? { parentId } : {}) },
        });
        if (created) {
            setCategories(prev => [...prev, created]);
            if (parentId) setExpanded(prev => new Set([...prev, parentId]));
        }
        setAddingName('');
        setAddingParentId('none');
        setSaving(false);
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        await Api.requestSession({ command: 'shop/category_update', args: { id, name: editingName.trim() } });
        setCategories(prev => prev.map(c => c._id === id ? { ...c, name: editingName.trim() } : c));
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        await Api.requestSession({ command: 'shop/category_delete', args: { id } });
        setCategories(prev => prev.filter(c => c._id !== id && c.parentId !== id));
    };

    const toggleExpand = (id: string) => setExpanded(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const cardSx = { bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,171,190,0.12)', mb: 1 };

    if (loading) return <PageContents><Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: mainColor }} /></Box></PageContents>;

    return (
        <PageContents>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StorefrontOutlinedIcon sx={{ fontSize: 28, color: mainColor }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                    {t('Shop')}
                </Typography>
            </Box>

            {isSuperAdmin && (
                <Box>
                    {/* Section title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryOutlinedIcon sx={{ fontSize: 20, color: '#607d8b' }} />
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#424242' }}>
                                {t('Categories')}
                            </Typography>
                        </Box>
                        <Tooltip title={t('Add category')} arrow>
                            <IconButton size='small' onClick={() => { setAddingParentId('root'); setAddingName(''); }}
                                sx={{ color: mainColor, bgcolor: `${mainColor}12`, '&:hover': { bgcolor: `${mainColor}22` } }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Add top-level category */}
                    {addingParentId === 'root' && (
                        <Box sx={{ ...cardSx, display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, mb: 2 }}>
                            <TextField autoFocus size='small' value={addingName} onChange={e => setAddingName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(null); if (e.key === 'Escape') setAddingParentId('none'); }}
                                placeholder={t('Category name')} variant='standard' sx={{ flex: 1 }} />
                            <IconButton size='small' disabled={saving} onClick={() => handleAddCategory(null)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 18 }} /></IconButton>
                            <IconButton size='small' onClick={() => setAddingParentId('none')} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Box>
                    )}

                    {/* Category list */}
                    {topLevel.length === 0 && addingParentId !== 'root' && (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No categories yet')}</Typography>
                    )}

                    {topLevel.map(cat => {
                        const subs = subOf(cat._id);
                        const isExpanded = expanded.has(cat._id);
                        const isEditing = editingId === cat._id;
                        return (
                            <Box key={cat._id} sx={cardSx}>
                                {/* Category row */}
                                <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.75, gap: 0.5 }}>
                                    <IconButton size='small' onClick={() => toggleExpand(cat._id)} sx={{ color: '#90a4ae', mr: 0.5 }}>
                                        {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ChevronRightIcon sx={{ fontSize: 18 }} />}
                                    </IconButton>
                                    {isEditing ? (
                                        <>
                                            <TextField autoFocus size='small' value={editingName} onChange={e => setEditingName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleRename(cat._id); if (e.key === 'Escape') setEditingId(null); }}
                                                variant='standard' sx={{ flex: 1 }} />
                                            <IconButton size='small' onClick={() => handleRename(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 18 }} /></IconButton>
                                            <IconButton size='small' onClick={() => setEditingId(null)} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <Typography sx={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</Typography>
                                            {subs.length > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#90a4ae', mr: 1 }}>{subs.length}</Typography>}
                                            <Tooltip title={t('Add subcategory')} arrow>
                                                <IconButton size='small' onClick={() => { setAddingParentId(cat._id); setAddingName(''); setExpanded(prev => new Set([...prev, cat._id])); }}
                                                    sx={{ color: '#90a4ae', '&:hover': { color: mainColor } }}><AddIcon sx={{ fontSize: 16 }} /></IconButton>
                                            </Tooltip>
                                            <IconButton size='small' onClick={() => { setEditingId(cat._id); setEditingName(cat.name); }}
                                                sx={{ color: '#90a4ae', '&:hover': { color: '#607d8b' } }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                                            <IconButton size='small' onClick={() => handleDelete(cat._id)}
                                                sx={{ color: '#90a4ae', '&:hover': { color: '#e53935' } }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
                                        </>
                                    )}
                                </Box>

                                {/* Subcategories */}
                                <Collapse in={isExpanded}>
                                    <Box sx={{ pl: 5, pb: 0.5 }}>
                                        {subs.map(sub => (
                                            <Box key={sub._id} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, gap: 0.5, borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}>
                                                <SubdirectoryArrowRightIcon sx={{ fontSize: 14, color: '#bdbdbd', mr: 0.5, flexShrink: 0 }} />
                                                {editingId === sub._id ? (
                                                    <>
                                                        <TextField autoFocus size='small' value={editingName} onChange={e => setEditingName(e.target.value)}
                                                            onKeyDown={e => { if (e.key === 'Enter') handleRename(sub._id); if (e.key === 'Escape') setEditingId(null); }}
                                                            variant='standard' sx={{ flex: 1 }} />
                                                        <IconButton size='small' onClick={() => handleRename(sub._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 16 }} /></IconButton>
                                                        <IconButton size='small' onClick={() => setEditingId(null)} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Typography sx={{ flex: 1, fontSize: '0.85rem', color: '#424242' }}>{sub.name}</Typography>
                                                        <IconButton size='small' onClick={() => { setEditingId(sub._id); setEditingName(sub.name); }}
                                                            sx={{ color: '#bdbdbd', '&:hover': { color: '#607d8b' } }}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                                                        <IconButton size='small' onClick={() => handleDelete(sub._id)}
                                                            sx={{ color: '#bdbdbd', '&:hover': { color: '#e53935' } }}><DeleteOutlineIcon sx={{ fontSize: 14 }} /></IconButton>
                                                    </>
                                                )}
                                            </Box>
                                        ))}
                                        {/* Add subcategory inline */}
                                        {addingParentId === cat._id && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
                                                <SubdirectoryArrowRightIcon sx={{ fontSize: 14, color: '#bdbdbd', mr: 0.5 }} />
                                                <TextField autoFocus size='small' value={addingName} onChange={e => setAddingName(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(cat._id); if (e.key === 'Escape') setAddingParentId('none'); }}
                                                    placeholder={t('Subcategory name')} variant='standard' sx={{ flex: 1 }} />
                                                <IconButton size='small' disabled={saving} onClick={() => handleAddCategory(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 16 }} /></IconButton>
                                                <IconButton size='small' onClick={() => setAddingParentId('none')} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {!isSuperAdmin && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10 }}>
                    <Typography sx={{ color: '#bbb', fontSize: '0.9rem' }}>{t('Coming soon')}</Typography>
                </Box>
            )}
        </PageContents>
    );
}
