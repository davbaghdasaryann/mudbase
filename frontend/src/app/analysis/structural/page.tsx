'use client';

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';
import { PageButton } from '@/tsui/Buttons/PageButton';

export default function StructuralAnalysisPage() {
    const { t } = useTranslation();

    return (
        <PageContents title='Structural Analytics'>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <PageButton variant='contained' label='Create' size='large' sx={{ borderRadius: '25px', height: '40px' }} />
            </Box>
        </PageContents>
    );
}
