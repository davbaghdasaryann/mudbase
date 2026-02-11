'use client';

import AdminEstimatesPageContents from '@/app/admin-estimates/AdminEstimatesPageContents';
import PageContents from '@/components/PageContents';

export default function AdminEstimatesPage() {
    return (
        <PageContents title='All Estimations' requiredPermission='USR_FCH_ALL'>
            <AdminEstimatesPageContents />
        </PageContents>
    );
}
