import PageContents from '@/components/PageContents';
import PasswordResetPageContents from './PasswordResetPageContents';


export default function RecoverPassword() {
    return (
        <PageContents type='auth'>
            <PasswordResetPageContents />
        </PageContents>
    );
}
