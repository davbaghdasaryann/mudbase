'use client';

import { useTranslation } from 'react-i18next';
import PageContents from '@/components/PageContents';

export default function RentayinPage() {
    const { t } = useTranslation();
    return (
        <PageContents title={t('Rentayin')}>
            <></>
        </PageContents>
    );
}
