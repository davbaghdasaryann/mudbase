'use client';

import React, { useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, InputBase, Divider, Button, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import { useTranslation } from 'react-i18next';
import * as Api from '@/api';
import * as LaborsApi from 'api/labor';
import { LaborItemDisplayData } from '@/data/labor_display_data';
import DataTableComponent from '@/components/DataTableComponent';
import { formatCurrency } from '@/lib/format_currency';

interface Props {
    onClose: () => void;
    onSelect: (work: LaborItemDisplayData) => void;
}

export default function EstimateGroupLibraryDialog({ onClose, onSelect }: Props) {
    const { t } = useTranslation();
    const [searchVal, setSearchVal] = useState('');
    const [results, setResults] = useState<LaborItemDisplayData[] | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = useCallback((val?: string) => {
        const query = (val ?? searchVal).trim() || 'empty';
        setLoading(true);
        Api.requestSession<LaborsApi.ApiLaborItems[]>({
            command: 'labor/fetch_items_with_average_price',
            args: { searchVal: query, isSorting: true },
        }).then(data => {
            setResults((data ?? []).map(d => new LaborItemDisplayData(d)));
        }).finally(() => setLoading(false));
    }, [searchVal]);

    React.useEffect(() => { handleSearch('empty'); }, []);

    return (
        <Dialog
            fullScreen
            open
            onClose={onClose}
            slotProps={{ paper: { style: { padding: 5, borderRadius: '12px' } } }}
            sx={{ '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: 5 } }}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>{t('Work Library')}</DialogTitle>
            <IconButton aria-label="close" onClick={onClose} sx={(theme) => ({ position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] })}>
                <CloseIcon />
            </IconButton>
            <DialogContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Box
                        component="form"
                        onSubmit={e => { e.preventDefault(); handleSearch(); }}
                        sx={{ display: 'flex', border: '1px solid #ccc', borderRadius: 1, width: 300, backgroundColor: '#fff' }}
                    >
                        <InputBase
                            sx={{ ml: 1, flex: 1 }}
                            placeholder={t('Search')}
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                        />
                        <Divider sx={{ height: 28, m: 0.5 }} orientation='vertical' />
                        <Button onClick={() => handleSearch()}><DirectionsIcon /></Button>
                    </Box>
                </Box>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}

                {!loading && results && (
                    <DataTableComponent
                        sx={{ width: '100%' }}
                        columns={[
                            { field: 'fullCode', headerName: t('ID'), headerAlign: 'left', flex: 0.2, disableColumnMenu: true },
                            { field: 'name', headerName: t('Label'), headerAlign: 'left', flex: 0.5, disableColumnMenu: true },
                            { field: 'measurementUnitRepresentationSymbol', headerName: t('Measurement Unit'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true },
                            { field: 'averagePrice', headerName: t('Average Price'), headerAlign: 'left', flex: 0.3, disableColumnMenu: true, valueFormatter: (value: any) => formatCurrency(value) },
                            {
                                field: 'select', type: 'actions', headerName: '', flex: 0.1,
                                renderCell: (cell: any) => (
                                    <IconButton onClick={() => onSelect(cell.row as LaborItemDisplayData)}>
                                        <AddToPhotosIcon />
                                    </IconButton>
                                ),
                            },
                        ]}
                        rows={results}
                        disableRowSelectionOnClick
                        getRowId={(row: any) => row._id}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
