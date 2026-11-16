'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, IconButton, TextField, CircularProgress, Tooltip, Collapse,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select,
    FormControl, InputLabel, InputAdornment, List, ListItemButton, ListItemText,
    Chip, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import SearchIcon from '@mui/icons-material/Search';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
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

interface MaterialItem {
    _id: string;
    name: string;
    fullCode: string;
    measurementUnitData?: { unitShortName?: string }[];
}

interface ShopListing {
    _id: string;
    materialName: string;
    materialCode: string;
    price: number;
    description?: string;
    categoryId?: string;
    status: 'draft' | 'published';
    createdAt: string;
}

const mainColor = '#00abbe';
const MAX_DEPTH = 5;

// ─── Category tree node ───────────────────────────────────────────────────────

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
                            variant='standard' inputProps={{ style: { fontSize: '0.875rem' } }} sx={{ flex: 1 }} />
                        <IconButton size='small' onClick={() => onRename(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size='small' onClick={onCancelEdit} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                    </>
                ) : (
                    <>
                        <Typography sx={{ flex: 1, fontWeight: depth === 0 ? 600 : 400, fontSize: depth === 0 ? '0.9rem' : '0.85rem', color: depth === 0 ? '#1a1a1a' : '#424242' }}>
                            {cat.name}
                        </Typography>
                        {children.length > 0 && <Typography sx={{ fontSize: '0.7rem', color: '#b0bec5', mr: 0.5 }}>{children.length}</Typography>}
                        {depth < MAX_DEPTH - 1 && (
                            <Tooltip title={t('Add subcategory')} arrow>
                                <IconButton size='small' onClick={() => onStartAdd(cat._id)}
                                    sx={{ color: '#b0bec5', '&:hover': { color: mainColor } }}>
                                    <AddIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <IconButton size='small' onClick={() => onStartEdit(cat._id, cat.name)} sx={{ color: '#b0bec5', '&:hover': { color: '#607d8b' } }}><EditIcon sx={{ fontSize: 15 }} /></IconButton>
                        <IconButton size='small' onClick={() => onDelete(cat._id)} sx={{ color: '#b0bec5', '&:hover': { color: '#e53935' } }}><DeleteOutlineIcon sx={{ fontSize: 15 }} /></IconButton>
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
                                placeholder={t('Subcategory name')} variant='standard'
                                inputProps={{ style: { fontSize: '0.875rem' } }} sx={{ flex: 1 }} />
                            <IconButton size='small' disabled={saving} onClick={() => onAdd(cat._id)} sx={{ color: '#4caf50' }}><CheckIcon sx={{ fontSize: 15 }} /></IconButton>
                            <IconButton size='small' onClick={onCancelAdd} sx={{ color: '#bbb' }}><CloseIcon sx={{ fontSize: 15 }} /></IconButton>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
}

// ─── Flat category path label ─────────────────────────────────────────────────

function buildCategoryPath(id: string, all: ShopCategory[]): string {
    const parts: string[] = [];
    let current: ShopCategory | undefined = all.find(c => c._id === id);
    while (current) {
        parts.unshift(current.name);
        current = current.parentId ? all.find(c => c._id === current!.parentId) : undefined;
    }
    return parts.join(' › ');
}

// ─── Add Listing Dialog ───────────────────────────────────────────────────────

interface AddListingDialogProps {
    open: boolean;
    categories: ShopCategory[];
    onClose: () => void;
    onCreated: () => void;
}

function AddListingDialog({ open, categories, onClose, onCreated }: AddListingDialogProps) {
    const { t } = useTranslation();
    const [materialName, setMaterialName] = useState('');
    const [linkedMaterial, setLinkedMaterial] = useState<MaterialItem | null>(null);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [librarySearch, setLibrarySearch] = useState('');
    const [libraryResults, setLibraryResults] = useState<MaterialItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            setMaterialName(''); setLinkedMaterial(null); setLibraryOpen(false);
            setLibrarySearch(''); setLibraryResults([]);
            setCategoryId(''); setPrice(''); setDescription(''); setSaving(false);
        }
    }, [open]);

    const searchLibrary = useCallback(async (q: string) => {
        if (!q.trim()) { setLibraryResults([]); return; }
        setSearching(true);
        const res = await Api.requestSession<MaterialItem[]>({ command: 'material/fetch_items', args: { searchVal: q.trim() } });
        setLibraryResults(res ?? []);
        setSearching(false);
    }, []);

    const handleLibrarySearchChange = (val: string) => {
        setLibrarySearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => searchLibrary(val), 350);
    };

    const handleSelectFromLibrary = (m: MaterialItem) => {
        setLinkedMaterial(m);
        setMaterialName(m.name);
        setLibraryOpen(false);
        setLibrarySearch('');
        setLibraryResults([]);
    };

    const flatCategories = (cats: ShopCategory[], result: { id: string; label: string }[] = [], depth = 0, parentId?: string): { id: string; label: string }[] => {
        cats.filter(c => c.parentId === parentId).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0)).forEach(c => {
            result.push({ id: c._id, label: '\u00a0'.repeat(depth * 3) + c.name });
            flatCategories(cats, result, depth + 1, c._id);
        });
        return result;
    };

    const canSave = materialName.trim() && price && parseFloat(price) > 0;

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        await Api.requestSession({
            command: 'shop/listing_create',
            args: {
                materialName: materialName.trim(),
                ...(linkedMaterial ? { materialId: linkedMaterial._id, materialCode: linkedMaterial.fullCode ?? '' } : {}),
                price,
                ...(categoryId ? { categoryId } : {}),
                description,
            },
        });
        setSaving(false);
        onCreated();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem', pb: 1 }}>{t('Add listing')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>

                {/* Material name — free text + optional library link */}
                <Box sx={{ position: 'relative' }}>
                    <TextField fullWidth size='small' label={t('Material')} value={materialName}
                        onChange={e => { setMaterialName(e.target.value); if (linkedMaterial && e.target.value !== linkedMaterial.name) setLinkedMaterial(null); }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position='end'>
                                    <Tooltip title={t('Pick from library')} arrow>
                                        <IconButton size='small' onClick={() => setLibraryOpen(v => !v)}
                                            sx={{ color: libraryOpen ? mainColor : '#b0bec5', '&:hover': { color: mainColor } }}>
                                            <LibraryBooksOutlinedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }} />

                    {/* Library picker dropdown */}
                    {libraryOpen && (
                        <Paper sx={{ position: 'absolute', zIndex: 10, width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', mt: 0.5 }}>
                            <Box sx={{ p: 1 }}>
                                <TextField autoFocus fullWidth size='small' placeholder={t('Search library...')} value={librarySearch}
                                    onChange={e => handleLibrarySearchChange(e.target.value)}
                                    InputProps={{ startAdornment: <InputAdornment position='start'>{searching ? <CircularProgress size={14} /> : <SearchIcon sx={{ fontSize: 16, color: '#bbb' }} />}</InputAdornment> }} />
                            </Box>
                            <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
                                {libraryResults.length === 0 && librarySearch && !searching && (
                                    <ListItemButton disabled><ListItemText primary={t('No results')} primaryTypographyProps={{ fontSize: '0.8rem', color: '#aaa' }} /></ListItemButton>
                                )}
                                {libraryResults.map(m => (
                                    <ListItemButton key={m._id} onClick={() => handleSelectFromLibrary(m)}>
                                        <ListItemText primary={m.name} secondary={m.fullCode} primaryTypographyProps={{ fontSize: '0.85rem' }} secondaryTypographyProps={{ fontSize: '0.75rem' }} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {/* Library link badge */}
                    {linkedMaterial && (
                        <Chip icon={<LibraryBooksOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                            label={linkedMaterial.fullCode || linkedMaterial.name} size='small'
                            onDelete={() => setLinkedMaterial(null)}
                            sx={{ mt: 0.75, bgcolor: `${mainColor}18`, color: mainColor, fontWeight: 600, fontSize: '0.72rem' }} />
                    )}
                </Box>

                {/* Category */}
                <FormControl fullWidth size='small'>
                    <InputLabel>{t('Category')}</InputLabel>
                    <Select value={categoryId} label={t('Category')} onChange={e => setCategoryId(e.target.value)}>
                        <MenuItem value=''><em>{t('None')}</em></MenuItem>
                        {flatCategories(categories).map(({ id, label }) => (
                            <MenuItem key={id} value={id} sx={{ fontSize: '0.875rem' }}>{label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Price */}
                <TextField fullWidth size='small' label={t('Price')} type='number' value={price}
                    onChange={e => setPrice(e.target.value)}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }} />

                {/* Description */}
                <TextField fullWidth size='small' label={t('Description')} value={description}
                    onChange={e => setDescription(e.target.value)} multiline rows={2} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#888' }}>{t('Cancel')}</Button>
                <Button variant='contained' disabled={!canSave || saving} onClick={handleSave}
                    sx={{ bgcolor: mainColor, '&:hover': { bgcolor: '#0099aa' } }}>
                    {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : t('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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

    // User listing state
    const [listings, setListings] = useState<ShopListing[]>([]);
    const [listingsLoading, setListingsLoading] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const fetchCategories = useCallback(async () => {
        const res = await Api.requestSession<ShopCategory[]>({ command: 'shop/category_fetch_all' });
        setCategories(res ?? []);
        setLoading(false);
    }, []);

    const fetchListings = useCallback(async () => {
        setListingsLoading(true);
        const res = await Api.requestSession<ShopListing[]>({ command: 'shop/listing_fetch_all' });
        setListings(res ?? []);
        setListingsLoading(false);
    }, []);

    useEffect(() => {
        fetchCategories();
        if (!isSuperAdmin) fetchListings();
    }, [fetchCategories, fetchListings, isSuperAdmin]);

    const topLevel = categories.filter(c => !c.parentId).sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0));

    const handleAdd = async (parentId: string | null) => {
        if (!addingName.trim()) return;
        setSaving(true);
        await Api.requestSession<ShopCategory>({
            command: 'shop/category_create',
            args: { name: addingName.trim(), ...(parentId ? { parentId } : {}) },
        });
        setAddingName('');
        setAddingParentId('');
        await fetchCategories();
        setSaving(false);
    };

    const handleRename = async (id: string) => {
        if (!editingName.trim()) return;
        await Api.requestSession({ command: 'shop/category_update', args: { id, name: editingName.trim() } });
        setCategories(prev => prev.map(c => c._id === id ? { ...c, name: editingName.trim() } : c));
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
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

    const handleDeleteListing = async (id: string) => {
        await Api.requestSession({ command: 'shop/listing_delete', args: { id } });
        setListings(prev => prev.filter(l => l._id !== id));
    };

    if (loading) return <PageContents title='Shop'><Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} sx={{ color: mainColor }} /></Box></PageContents>;

    // ── Superadmin view ──
    if (isSuperAdmin) return (
        <PageContents title='Shop'>
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

                {addingParentId === '__root__' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, mb: 1, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,171,190,0.12)' }}>
                        <TextField autoFocus size='small' value={addingName} onChange={e => setAddingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(null); if (e.key === 'Escape') setAddingParentId(''); }}
                            placeholder={t('Category name')} variant='standard'
                            inputProps={{ style: { fontSize: '0.875rem' } }} sx={{ flex: 1 }} />
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
        </PageContents>
    );

    // ── Regular user (supplier) view ──
    return (
        <PageContents title='Shop'>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryOutlinedIcon sx={{ fontSize: 20, color: '#607d8b' }} />
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#424242' }}>{t('My Listings')}</Typography>
                </Box>
                <Tooltip title={t('Add listing')} arrow>
                    <IconButton size='small' onClick={() => setAddDialogOpen(true)}
                        sx={{ color: mainColor, bgcolor: `${mainColor}12`, '&:hover': { bgcolor: `${mainColor}22` } }}>
                        <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {listingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} sx={{ color: mainColor }} /></Box>
            ) : listings.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 1.5 }}>
                    <InventoryOutlinedIcon sx={{ fontSize: 40, color: '#ddd' }} />
                    <Typography sx={{ color: '#bbb', fontSize: '0.9rem' }}>{t('No listings yet')}</Typography>
                    <Button variant='outlined' size='small' startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}
                        sx={{ mt: 1, borderColor: mainColor, color: mainColor, '&:hover': { borderColor: '#0099aa', bgcolor: `${mainColor}08` } }}>
                        {t('Add listing')}
                    </Button>
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {listings.map(listing => (
                        <Box key={listing._id} sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid rgba(0,171,190,0.08)', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {listing.materialName}
                                </Typography>
                                {listing.categoryId && (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#90a4ae', mt: 0.25 }}>
                                        {buildCategoryPath(listing.categoryId, categories)}
                                    </Typography>
                                )}
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: mainColor, flexShrink: 0 }}>
                                {listing.price.toLocaleString()}
                            </Typography>
                            <Chip label={t(listing.status)} size='small'
                                sx={{ bgcolor: listing.status === 'published' ? '#e8f5e9' : '#f5f5f5', color: listing.status === 'published' ? '#388e3c' : '#757575', fontWeight: 600, fontSize: '0.7rem' }} />
                            <IconButton size='small' onClick={() => handleDeleteListing(listing._id)} sx={{ color: '#b0bec5', '&:hover': { color: '#e53935' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            <AddListingDialog
                open={addDialogOpen}
                categories={categories}
                onClose={() => setAddDialogOpen(false)}
                onCreated={() => { setAddDialogOpen(false); fetchListings(); }}
            />
        </PageContents>
    );
}
