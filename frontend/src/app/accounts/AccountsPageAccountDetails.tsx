'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormControlLabel, Radio, FormControl, FormLabel, Box, Checkbox } from '@mui/material';

import * as F from '@/tsui/Form';
import * as Api from '@/api';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import { accountActivities, AccountActivity, allFinancialIds } from '../../tsmudbase/company_activities';
import { raiseError } from '@/lib/app_errors';
import ProgressIndicator from '@/tsui/ProgressIndicator';

interface AccountsPageAccountDetailsProps {
    account?: Api.ApiAccount | null;
    onClose: (changed: boolean) => void;
}

export function AccountsPageAccountDetails(props: AccountsPageAccountDetailsProps) {
    if (!props.account) return <></>;
    return <AccountsPageAccountDetailsBody {...props} />;
}

function AccountsPageAccountDetailsBody(props: AccountsPageAccountDetailsProps) {
    const form = F.useForm({ type: 'input' });
    const [t] = useTranslation();
    const account = props.account;
    const [progIndic, setProgIndic] = React.useState(false)

    // Create a mapping for selected activities.
    // Initialize with all false, then set true for those already in account.accountActivity.
    const initialSelectedMap: Record<AccountActivity, boolean> = {
        A: false,
        F: false,
        C: false,
        I: false,
        V: false,
        B: false,
        D: false,
    };
    if (account?.accountActivity && account.accountActivity.length > 0) {
        account.accountActivity.forEach((act) => {
            initialSelectedMap[act] = true;
        });
    }
    const [selectedActivitiesMap, setSelectedActivitiesMap] = React.useState<Record<AccountActivity, boolean>>(initialSelectedMap);
    const latestSelectedActivitiesRef = React.useRef(selectedActivitiesMap);

    // // Helper: compute an array of selected activities from the map.
    // const getSelectedActivities = (): AccountActivity[] => {
    //     return Object.keys(selectedActivitiesMap).filter(
    //         (key) => selectedActivitiesMap[key as AccountActivity]
    //     ) as AccountActivity[];
    // };

    // React.useEffect(() => {
    //     const updated = Object.keys(selectedActivitiesMap).filter(
    //         (key) => !!selectedActivitiesMap[key as AccountActivity]
    //     ) as AccountActivity[];
    //     console.log('Updated selected activities:', updated);
    // }, [selectedActivitiesMap]);

    // Handler for toggling an activity using radio-styled buttons.
    const handleActivityToggle = (activityId: AccountActivity) => {
        setSelectedActivitiesMap((prev) => {
            const newMap = { ...prev };

            if (allFinancialIds.includes(activityId)) {
                Object.keys(newMap).forEach((key) => {
                    newMap[key as AccountActivity] = (key === activityId);
                });
            } else {
                allFinancialIds.forEach((v) => {
                    if (prev[v]) {
                        newMap[v] = false;
                    }
                });
                newMap[activityId] = !prev[activityId];

                const selectedCount = Object.values(newMap).filter((v) => v).length;

                if (selectedCount === 0) {
                    newMap[activityId] = true;
                }

                if (selectedCount > 4) {
                    newMap[activityId] = prev[activityId];
                }
            }

            return newMap;
        });
    };

    const onFieldUpdate = React.useCallback(async (field: InputFormField) => {
        console.log(field);
    }, []);

    const onClose = React.useCallback((changed?: boolean) => {
        console.log('changed', changed)
        props.onClose(changed ?? false);
    }, []);

    React.useEffect(() => {
        latestSelectedActivitiesRef.current = selectedActivitiesMap;
    }, [selectedActivitiesMap]);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        setProgIndic(true)

        let data: any = evt.data;
        const selectedActivitiesArr = Object.keys(latestSelectedActivitiesRef.current).filter(
            (key) => !!latestSelectedActivitiesRef.current[key as AccountActivity]
        ) as AccountActivity[];

        if (selectedActivitiesArr.length < 1) {
            raiseError("Please select at least one activity.");
            return;
        }

        data.accountActivity = selectedActivitiesArr;
        console.log('Submit', data);

        if (data) {
            Api.requestSession<Api.ApiAccount[]>({
                command: 'accounts/update_account',
                json: data,
                args: { _id: account?._id },
            }).then((res) => {
                console.log('backend data ', res);
            }).finally(() => {
                onClose(true);
                setProgIndic(false)

            });
        }
    }, []);


    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />;
    }

    return (
        <F.PageFormDialog title='Account' form={form} onSubmit={onSubmit} onFieldUpdate={onFieldUpdate} onClose={onClose}>
            <F.InputText id='companyName' label='Name' value={account?.companyName} xsHalf />
            <F.InputText id='establishedAt' label={t('Establish Date')} value={account?.establishedAt} xsHalf />
            <F.InputText id='phoneNumber' label={t('Phone Number')} value={account?.phoneNumber} xsHalf />
            <F.InputText id='companyTin' label={t('TIN')} value={account?.companyTin} xsHalf />

            {/* <F.Section form={form} label='Choose Activities' /> */}
            <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormLabel component="legend" sx={{ color: 'text.primary', '&.Mui-focused': { color: 'text.primary' } }}>
                    {t('Choose Activities')}
                </FormLabel>
                <Box display="flex" flexWrap="wrap">
                    {accountActivities.map((activity) => (
                        <FormControlLabel
                            key={activity.id}
                            control={
                                <Checkbox
                                    value={activity.id}
                                    checked={selectedActivitiesMap[activity.id as AccountActivity]}
                                    onChange={() => handleActivityToggle(activity.id as AccountActivity)}
                                />
                                // <Radio
                                //     checked={selectedActivitiesMap[activity.id as AccountActivity]}
                                //     onClick={() => handleActivityToggle(activity.id as AccountActivity)}
                                // />
                            }
                            label={t(activity.label)}
                        />
                    ))}
                </Box>
            </FormControl>

            <F.InputText form={form} id='address' label={t('Address')} value={account?.address} xsHalf />
            <F.InputText form={form} id='lawAddress' label={t('Legal Address')} value={account?.lawAddress} xsHalf />
            <F.InputText form={form} id='email' label={t('Email')} value={account?.email} xsHalf />
            <F.InputText form={form} id='website' label={t('Website')} value={account?.website} xsHalf />
            <F.InputText form={form} id='director' label={t('Director')} value={account?.director} xsMax />
            <F.InputText form={form} id='companyInfo' label={t('About Company')} value={account?.companyInfo} xsMax />
        </F.PageFormDialog>
    );
}


