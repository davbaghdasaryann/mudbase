import * as Api from '@/api'

export function makeUserFullName(user: Api.ApiPendingUser | null | undefined) {
    if (!user) return undefined;

    let fullName = '';
    if (user.firstName)
        fullName += user.firstName;

    if (user.lastName) {
        if (fullName.length > 0) fullName += ' ';
        fullName += user.lastName;
    }

    return fullName;
}
