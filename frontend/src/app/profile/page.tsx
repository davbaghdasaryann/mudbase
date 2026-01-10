// import UserProfilePage from './UserProfilePage';

import UserProfilePageContents from '@/app/profile/UserProfilePage';
import PageContents from '@/components/PageContents';

export default function UserProfilePage() {
    return (
        <PageContents title='Profile'>
            <UserProfilePageContents />
        </PageContents>
    );
}
// export default UserProfilePage;
