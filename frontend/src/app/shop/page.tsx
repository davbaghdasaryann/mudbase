'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, IconButton, TextField, CircularProgress, Tooltip, Collapse,
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
const MAX_DEPTH = 5;

interface CategoryNodeProps {
    cat: ShopCategory;
    depth: number;
    allCategories: ShopCategory[];
    expanded: Set<string>;
    editingId: string | null;
    editingName: string;
    addingParentId: string;
    addingName: string;
    saving: boolean;
    onToggleExpand: (id: string) => void;
    onStartEdit: (id: string, name: string) => void;
    onEditNameChange: (name: string) => void;
    onRename: (id: string) => void;
    onCancelEdit: () => void;
    onDelete: (id: string) => void;
    onStartAdd: (parentId: string) => void;
    onAddNameChange: (name: string) => void;
    onAdd: (parentId: string) => void;
    onCancelAdd: () => void;
}

function CategoryNode({
    cat, depth, allCategories, expanded, editingId, editingName, addingParentId, addingName,
    saving, onToggleExpand, onStartEdit, onEditNameChange, onRename, onCancelEdit,
    onDelete, onStartAdd, onAddNameChange, onAdd, onCancelAdd,
}: CategoryNodeProps) {
    const { t } = useTranslation();
    const children = allCategories
        .filter(c => c.parentId === cat._id)
        .sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));
    const isExpanded = expanded.has(cat._id);
    const isEditing = editingId === cat._id;
    const indent = depth * 20;

    return (
        <Box>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                pl: `${indent + 4}px`, pr: 1, py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: depth === 0 ? 'transparent' : '#f5f5f5' },
                borderBottom: depth === 0 ? '1px solid rgba(0,171,190,0.08)' : 'none',
            }}>
                <IconButton size='small' onClick={() => onToggleExpand(cat._id)}
                    sx={{ color: children.length > 0 ? '#90a4ae' : 'transparent', flexShrink: 0, mr: 0.25 }}>
                    {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
                </IconButton>

                {isEditing ? (
                    <>
                        <TextField autoFocus size='small' value={editingName}
                            onChange={e => onEditNameChange(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') onRename(cat._id); if (e.key === 'Escape') onCancelEdit(); }}
                            variant='standard' sx={{ flex: 1 }} />
                        <IconButton size='small' onClick={() => onRename(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size='small' onClick={onCancelEdit} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                    </>
                ) : (
                    <>
                        <Typography sx={{ flex: 1, fontWeight: depth === 0 ? 600 : 400, fontSize: depth === 0 ? '0.9rem' : '0.85rem', color: depth === 0 ? '#1a1a1a' : '#424242' }}>
                            {cat.name}
                        </Typography>
                        {children.length > 0 && (
                            <Typography sx={{ fontSize: '0.7rem', color: '#b0bec5', mr: 0.5 }}>{children.length}</Typography>
                        )}
                        {depth < MAX_DEPTH - 1 && (
                            <Tooltip title={t('Add subcategory')} arrow>
                                <IconButton size='small' onClick={() => { onStartAdd(cat._id); onToggleExpand(cat._id); }}
                                    sx={{ color: '#b0bec5', '&:hover': { color: mainColor } }}>
                                    <AddIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton size='small' onClick={() => onStartEdit(cat._id, cat.name)}
                            sx={{ color: '#b0bec5', '&:hover': { color: '#607d8b' } }}>
                            <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton size='small' onClick={() => onDelete(cat._id)}
                            sx={{ color: '#b0bec5', '&:hover': { color: '#e53935' } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                    </>
                )}
            </Box>

            <Collapse in={isExpanded}>
                <Box>
                    {children.map(child => (
                        <CategoryNode key={child._id} cat={child} depth={depth + 1} allCategories={allCategories}
                            expanded={expanded} editingId={editingId} editingName={editingName}
                            addingParentId={addingParentId} addingName={addingName} saving={saving}
                            onToggleExpand={onToggleExpand} onStartEdit={onStartEdit} onEditNameChange={onEditNameChange}
                            onRename={onRename} onCancelEdit={onCancelEdit} onDelete={onDelete}
                            onStartAdd={onStartAdd} onAddNameChange={onAddNameChange} onAdd={onAdd} onCancelAdd={onCancelAdd} />
                    ))}
                    {addingParentId === cat._id && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: `${indent + 44}px`, pr: 1, py: 0.5 }}>
                            <TextField autoFocus size='small' value={addingName}
                                onChange={e => onAddNameChange(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') onAdd(cat._id); if (e.key === 'Escape') onCancelAdd(); }}
                                placeholder={t('Subcategory name')} variant='standard' sx={{ flex: 1 }} />
                            <IconButton size='small' disabled={saving} onClick={() => onAdd(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 15 }} /></IconButton>
                            <IconButton size='small' onClick={onCancelAdd} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 15 }} /></IconButton>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}

export default function ShopPage() {
    const { t } = useTranslation();
    const { permissionsSet } = usePermissions();
    const isSuperAdmin = permissionsSet?.has('ALL') || permissionsSet?.has('ACC_FCH');

    const [categories, setCategories] = useState<ShopCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [addingParentId, setAddingParentId] = useState<string>('');
    const [addingName, setAddingName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = useCallback(async () => {
        const res = await Api.requestSession<ShopCategory[]>({ command: 'shop/category_fetch_all' });
        setCategories(res ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const topLevel = categories.filter(c => !c.parentId).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));

    const handleAdd = async (parentId: string | null) => {
        if (!addingName.trim()) return;
        setSaving(true);
        const created = await Api.requestSession<ShopCategory>({
            command: 'shop/category_create',
            args: { name: addingName.trim(), ...(parentId ? { parentId } : {}) },
        });
        if (created) setCategories(prev => [...prev, created]);
        setAddingName('');
        setAddingParentId('');
        setSaving(false);
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        await Api.requestSession({ command: 'shop/category_update', args: { id, name: editingName.trim() } });
        setCategories(prev => prev.map(c => c._id === id ? { ...c, name: editingName.trim() } : c));
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        // collect all descendant ids to remove from local state
        const toDelete = new Set<string>([id]);
        const collect = (parentId: string) => {
            categories.filter(c => c.parentId === parentId).forEach(c => { toDelete.add(c._id); collect(c._id); });
        };
        collect(id);
        await Api.requestSession({ command: 'shop/category_delete', args: { id } });
        setCategories(prev => prev.filter(c => !toDelete.has(c._id)));
    };

    const toggleExpand = (id: string) => setExpanded(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const startAdd = (parentId: string) => {
        setAddingParentId(parentId);
        setAddingName('');
        setExpanded(prev => new Set([...prev, parentId]));
    };

    if (loading) return <PageContents><Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: mainColor }} /></Box></PageContents>;

    return (
        <PageContents>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <StorefrontOutlinedIcon sx={{ fontSize: 28, color: mainColor }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>{t('Shop')}</Typography>
            </Box>

            {isSuperAdmin && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryOutlinedIcon sx={{ fontSize: 20, color: '#607d8b' }} />
                            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#424242' }}>{t('Categories')}</Typography>
                        </Box>
                        <Tooltip title={t('Add category')} arrow>
                            <IconButton size='small' onClick={() => { setAddingParentId('__root__'); setAddingName(''); }}
                                sx={{ color: mainColor, bgcolor: `${mainColor}12`, '&:hover': { bgcolor: `${mainColor}22` } }}>
                                <AddIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Add root-level category */}
                    {addingParentId === '__root__' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, mb: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,171,190,0.12)' }}>
                            <TextField autoFocus size='small' value={addingName} onChange={e => setAddingName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAdd(null); if (e.key === 'Escape') setAddingParentId(''); }}
                                placeholder={t('Category name')} variant='standard' sx={{ flex: 1 }} />
                            <IconButton size='small' disabled={saving} onClick={() => handleAdd(null)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 18 }} /></IconButton>
                            <IconButton size='small' onClick={() => setAddingParentId('')} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Box>
                    )}

                    {topLevel.length === 0 && addingParentId !== '__root__' && (
                        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', py: 2 }}>{t('No categories yet')}</Typography>
                    )}

                    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,171,190,0.12)', overflow: 'hidden' }}>
                        {topLevel.map(cat => (
                            <CategoryNode key={cat._id} cat={cat} depth={0} allCategories={categories}
                                expanded={expanded} editingId={editingId} editingName={editingName}
                                addingParentId={addingParentId} addingName={addingName} saving={saving}
                                onToggleExpand={toggleExpand}
                                onStartEdit={(id, name) => { setEditingId(id); setEditingName(name); }}
                                onEditNameChange={setEditingName}
                                onRename={handleRename}
                                onCancelEdit={() => setEditingId(null)}
                                onDelete={handleDelete}
                                onStartAdd={startAdd}
                                onAddNameChange={setAddingName}
                                onAdd={handleAdd}
                                onCancelAdd={() => setAddingParentId('')} />
                        ))}
                    </Box>
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
