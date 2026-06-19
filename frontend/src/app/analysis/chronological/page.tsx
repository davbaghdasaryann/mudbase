'use client';

import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';
import { mainPrimaryColor } from '@/theme';
import ChronologicalCreateDialog, { ChronologicalSourceType } from './ChronologicalCreateDialog';
import ChronologicalListDialog from './ChronologicalListDialog';
import ChronologicalDateRangeDialog from './ChronologicalDateRangeDialog';

type DialogState = 'none' | 'create' | ChronologicalSourceType | 'daterange';

interface SelectionParams {
    sourceType: ChronologicalSourceType;
    itemId: string;
    itemName: string;
}

export default function ChronologicalAnalysisPage() {
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<DialogState>('none');
    const [selection, setSelection] = useState<SelectionParams | null>(null);

    const listType = (dialog !== 'none' && dialog !== 'create' && dialog !== 'daterange')
        ? dialog as ChronologicalSourceType
        : null;

    const handleCreate = (itemId: string, itemName: string) => {
        if (!listType) return;
        setSelection({ sourceType: listType, itemId, itemName });
        setDialog('daterange');
    };

    return (
        <PageContents title='Chronological Analytics'>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: 2,
                    pb: 8,
                }}
            >
                <TimelineIcon sx={{ fontSize: 90, color: '#00ABBE', opacity: 0.25 }} />
                <Typography variant='h6' color='text.secondary' sx={{ fontWeight: 400 }}>
                    {t('No analytics created yet')}
                </Typography>
                <PageButton
                    variant='outlined'
                    label='Create'
                    size='large'
                    sx={{
                        borderRadius: '25px',
                        height: '40px',
                        mt: 1,
                        '&:hover': {
                            backgroundColor: mainPrimaryColor,
                            color: '#ffffff',
                            borderColor: mainPrimaryColor,
                        },
                    }}
                    onClick={() => setDialog('create')}
                />
            </Box>

            <ChronologicalCreateDialog
                open={dialog === 'create'}
                onClose={() => setDialog('none')}
                onContinue={(type) => setDialog(type)}
            />

            <ChronologicalListDialog
                open={listType !== null}
                type={listType}
                onClose={() => setDialog('none')}
                onPrevious={() => setDialog('create')}
                onCreate={handleCreate}
            />

            <ChronologicalDateRangeDialog
                open={dialog === 'daterange'}
                sourceType={selection?.sourceType ?? ''}
                itemId={selection?.itemId ?? null}
                itemName={selection?.itemName ?? ''}
                onClose={() => setDialog('none')}
                onPrevious={() => setDialog(selection?.sourceType ?? 'create')}
            />
        </PageContents>
    );
}
