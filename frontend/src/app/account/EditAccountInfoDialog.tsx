import React from 'react';

import { useTranslation } from 'react-i18next';

import * as F from '@/tsui/Form';
import * as Api from 'api';
import {Box, Checkbox, FormControl, FormControlLabel, FormLabel, Typography} from '@mui/material';
import {accountActivities, AccountActivity, allFinancialIds} from '../../tsmudbase/company_activities';
import {raiseError} from '../../lib/app_errors';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import PageDialog from '../../tsui/PageDialog';

interface EditAccountInfoDialogProps {
    show?: boolean;
    account: Api.ApiAccount | undefined;
    onClose: () => void;
    onDataChanged: () => void;
}

export default function EditAccountInfoDialog(props: EditAccountInfoDialogProps) {
    if (props.show === false || !props.account) return <></>;
    return <EditAccountInfoDialogBody {...props} />;
}

function EditAccountInfoDialogBody(props: EditAccountInfoDialogProps) {
    const {t} = useTranslation();
    
    const form = F.useForm({type: 'update'});
    const [progIndic, setProgIndic] = React.useState(false);

    // This state controls whether the note dialog is shown.
    const [activityChangeDialog, setActivityChangeDialog] = React.useState(false);
    // This flag is set when the note is shown for the first time and prevents it from showing again.
    const [activityDialogShown, setActivityDialogShown] = React.useState(false);

    const account = props.account;

    const [selectedActivitiesMap, setSelectedActivitiesMap] = React.useState<Record<AccountActivity, boolean>>({
        A: false,
        F: false,
        C: false,
        I: false,
        V: false,
        B: false,
        D: false,
    });

    // Update default activity selection if the account prop is available.
    React.useEffect(() => {
        if (account?.accountActivity) {
            console.log(account.accountActivity);

            const newMap: Record<AccountActivity, boolean> = {
                A: false,
                F: false,
                C: false,
                I: false,
                V: false,
                B: false,
                D: false,
            };
            account.accountActivity.forEach((act) => {
                newMap[act] = true;
            });
            setSelectedActivitiesMap(newMap);
        }
    }, [account]);

    const latestSelectedActivitiesRef = React.useRef(selectedActivitiesMap);
    React.useEffect(() => {
        latestSelectedActivitiesRef.current = selectedActivitiesMap;
    }, [selectedActivitiesMap]);

    // Modified handler that shows the note dialog only on the first click.
    const handleActivityToggle = (activityId: AccountActivity) => {
        // If the dialog has not yet been shown, trigger it and mark that it’s been shown.
        if (!activityDialogShown) {
            setActivityChangeDialog(true);
            setActivityDialogShown(true);
            // Do not change the toggle until after the note has been acknowledged.
            return;
        }

        // Proceed with toggling the activity.
        setSelectedActivitiesMap((prev) => {
            const newMap = {...prev};

            if (allFinancialIds.includes(activityId)) {
                Object.keys(newMap).forEach((key) => {
                    newMap[key as AccountActivity] = key === activityId;
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

    const onSubmit = React.useCallback(
        async (evt: F.InputFormEvent) => {
            setProgIndic(true);
            let data: any = evt.data;
            const {tin, ...valuesWithoutTin} = data;

            // console.log('evt.data', evt.data, valuesWithoutTin);

            const selectedActivitiesArr = Object.keys(latestSelectedActivitiesRef.current).filter(
                (key) => !!latestSelectedActivitiesRef.current[key as AccountActivity]
            ) as AccountActivity[];

            if (selectedActivitiesArr.length < 1) {
                raiseError('Please select at least one activity.');
                return;
            }
            valuesWithoutTin.accountActivity = selectedActivitiesArr;
            // console.log('valuesWithoutTin', valuesWithoutTin);

            await Api.requestSession<any>({
                command: 'profile/update_account',
                values: valuesWithoutTin,
            }).finally(() => {
                props.onDataChanged();
                setProgIndic(false);
                setActivityDialogShown(false);
                props.onClose();
            });
        },
        [props]
    );

    // Show a progress indicator if needed.
    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />;
    }

    // If the note dialog should be shown, render it.
    // if (activityChangeDialog) {
    //     return (
    //         <PageDialog type='panel' title={t('Notification')} size='sm' onConfirm={() => { }} onClose={() => { setActivityChangeDialog(false) }} >
    //             <Typography>
    //                 {t('Please note that in the event of a change or addition to the type of activity of the organization, the user account will be temporarily deactivated. If the change involves a change in the terms of the subscription package, the user account will be activated only after the new subscription package is approved.')}
    //             </Typography>
    //         </PageDialog >
    //     );
    // }

    // Otherwise, render the main form.
    return (
        <F.PageFormDialog
            show={props.show}
            title={t('Edit Account Information')}
            form={form}
            size='lg'
            onSubmit={onSubmit}
            onClose={() => {
                props.onClose(), setActivityDialogShown(false);
            }}
        >
            {activityChangeDialog && (
                <PageDialog
                    type='panel'
                    title={t('Notification')}
                    size='sm'
                    onConfirm={() => {}}
                    onClose={() => {
                        setActivityChangeDialog(false);
                    }}
                >
                    <Typography>
                        {t('user_account_change_warning')}
                    </Typography>
                </PageDialog>
            )}

            <F.InputText label='Company Name' id='companyName' required value={account?.companyName} xsHalf />
            <F.InputText label='Founded' id='establishedAt' value={account?.establishedAt} xsHalf />

            <F.InputText label='TIN' id='tin' value={account?.companyTin} xsHalf readonly />
            <F.InputText label='Phone Number' id='phoneNumber' value={account?.phoneNumber} xsHalf />
            <F.InputText label='Email' id='email' value={account?.email} xsHalf />
            <F.InputText label='Address' id='address' value={account?.address} xsHalf />
            <F.InputText label='Legal Address' id='lawAddress' value={account?.lawAddress} xsHalf />
            <F.InputText label='Website' id='website' value={account?.website} xsHalf />
            <F.InputText label='Director' id='director' value={account?.director} xsHalf />
            <F.InputText label='Description' id='companyInfo' value={account?.companyInfo} xsHalf />

            <FormControl component='fieldset' sx={{mt: 2}}>
                <FormLabel component='legend' sx={{color: 'text.primary', '&.Mui-focused': {color: 'text.primary'}}}>
                    {t('Choose Activities')}
                </FormLabel>
                <Box display='flex' flexWrap='wrap'>
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
        </F.PageFormDialog>
    );
}
