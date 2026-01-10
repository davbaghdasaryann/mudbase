import PageContents from '@/components/PageContents';
import RegisterApprovalPageContents from './RegisterApprovedPageContents';

export default function RegisterApprovalPage() {
    return (
        <PageContents type='auth'>
            <RegisterApprovalPageContents />
        </PageContents>
    );
}
