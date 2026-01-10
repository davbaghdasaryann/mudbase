import PageContents from '@/components/PageContents';
import RegisterInvitationPageContents from './RegisterInvitationPageContents';

export default function RegisterApprovedPage() {
    return (
        <PageContents type='auth'>
            <RegisterInvitationPageContents />
        </PageContents>
    );
}
