import {getI18n} from 'react-i18next';

import { AccountActivity, getAccountNameById } from "@/tsmudbase/company_activities";


export function makeAccountActivitiesString(accountActivity: AccountActivity[] | AccountActivity | undefined) {
    if (accountActivity === undefined) return '';

    let activities: AccountActivity[] = [];
    if (typeof accountActivity === 'string') {
        activities = accountActivity.split(',') as AccountActivity[];
    } else if (Array.isArray(accountActivity)) {
        activities = accountActivity;
    }
    return activities.map((id) => getI18n().t(getAccountNameById(id.trim()))).join(', ');
}
