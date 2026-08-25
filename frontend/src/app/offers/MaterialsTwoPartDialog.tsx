import React, { useRef, useState, useCallback } from 'react';
import {Dialog, DialogTitle, DialogContent, IconButton, Box, useTheme} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {t} from 'i18next';
import {MaterialsRightPaneContent} from '@/app/offers/MaterialsRightPaneContent';
import MaterialsLeftPaneContent from '@/app/offers/MaterialsLeftPaneContent';
import * as GD from '@/data/global_dispatch';

interface Props {
    onClose: () => void;
    offerType: 'labor' | 'material';
    isEstimation: boolean;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null;
    estimatedLaborId?: string | null;
    estimatedLaborName?: string | null;
    onConfirm: () => void;
}

export default function MaterialsTwoPartDialog(props: Props) {
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [splitPct, setSplitPct] = useState(50); // top pane % of total height
    const dragging = useRef(false);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((ev.clientY - rect.top) / rect.height) * 100;
            setSplitPct(Math.min(80, Math.max(20, pct)));
        };

        const onMouseUp = () => {
            dragging.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, []);

    return (
        <Dialog
            fullScreen
            open={true}
            onClose={props.onClose}
            slotProps={{ paper: { style: { padding: 5 } } }}
            sx={{ '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center', padding: 5 } }}
        >
            <DialogTitle sx={{m: 0, px: 2, py: 0.75, fontWeight: 700}}>
                {t('Add / Edit Materials')}
                <IconButton
                    aria-label='close'
                    onClick={props.onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <Box
                    ref={containerRef}
                    sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
                >
                    {/* Top pane — Add materials */}
                    <Box sx={{
                        height: `${splitPct}%`,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <MaterialsLeftPaneContent
                            offerType='material'
                            isEstimation={true}
                            estimateSubsectionId={props.estimateSubsectionId}
                            estimateSectionId={props.estimateSectionId}
                            estimatedLaborId={props.estimatedLaborId}
                            onBack={props.onClose}
                            onConfirm={() => {
                                props.onConfirm();
                                GD.pubsub_.dispatch(GD.estimateMaterialDataChangedId);
                            }}
                        />
                    </Box>

                    {/* Drag handle */}
                    <Box
                        onMouseDown={onMouseDown}
                        sx={{
                            flexShrink: 0,
                            height: '8px',
                            cursor: 'row-resize',
                            bgcolor: theme.palette.divider,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': { bgcolor: theme.palette.primary.light },
                            transition: 'background-color 0.15s',
                            userSelect: 'none',
                        }}
                    >
                        {/* three-dot grip indicator */}
                        <Box sx={{ display: 'flex', gap: '4px' }}>
                            {[0, 1, 2].map(i => (
                                <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#aaa' }} />
                            ))}
                        </Box>
                    </Box>

                    {/* Bottom pane — Edit materials */}
                    <Box sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2,
                    }}>
                        {props.estimatedLaborId && (
                            <MaterialsRightPaneContent
                                estimatedLaborName={props.estimatedLaborName || ''}
                                estimatedLaborId={props.estimatedLaborId}
                                onConfirm={props.onConfirm}
                                onClose={() => {}}
                            />
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
