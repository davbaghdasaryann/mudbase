'use client';

import EstimatesPageContents from '@/app/estimates/EstimatesPageContents';
import PageContents from '@/components/PageContents';

export default function EstimatesPage() {
    return (
        <PageContents title='Estimates' requiredPermission='EST_USE'>
            <EstimatesPageContents />
        </PageContents>
    );
}
