'use client';

import React from 'react';

import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';

import { useTranslation } from 'react-i18next';


import * as F from 'tsui/Form';
import * as Api from 'api';
import PageDialog from '../../tsui/PageDialog';
import { accountActivities, AccountActivity, allFinancialIds } from '../../tsmudbase/company_activities';
import PageText from '../../components/PageText';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { authSignOut } from '../../api/auth';
import { raiseError } from '@/lib/app_errors';

export default function UserSignUpPageCompany() {
    const { t } = useTranslation();
    const router = useRouter();

    const form = F.useInputForm();
    const [signUpComplete, setSignUpComplete] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>([]);
    const selectedRef = React.useRef<string[]>(selected);


    const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;

        if (allFinancialIds.includes(value)) {
            setSelected([value]);
            selectedRef.current = [value];
        } else {
            // let current = [...selectedRef.current].filter((v) => v !== "F");
            let current = selectedRef.current.filter(v => !allFinancialIds.includes(v));

            let newArr: string[] = [];
            if (current.includes(value)) {
                newArr = current.filter((v) => v !== value);
                if (newArr.length === 0) {
                    newArr = [value];
                }
            } else {
                newArr = [...current, value];
                if (newArr.length > 4) {
                    newArr = current;
                }
            }
            setSelected(newArr);
            selectedRef.current = newArr;
        }
    };



    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        setBusy(true);

        // console.log('selected', selectedRef.current, evt.data)

        // if (evt.data.companyTin.length < 8) {
        //     setBusy(false);
        //     raiseError(t('TIN must contain 8 digits'))
        //     return;
        // }
        if (selectedRef.current.length === 0 || !evt.isData()) {
            setBusy(false);
            return;
        }

        try {
            const data = {
                ...evt.data,
                accountActivity: selectedRef.current,
            };

            await Api.requestSession({ command: 'signup/company', json: data });
            setSignUpComplete(true);
        } finally {
            setBusy(false);
        }
    }, [selected]);

    // const onSubmissionClose = React.useCallback(() => {
    //     if (typeof window !== 'undefined') {
    //         window.location.href = 'about:blank';
    //         setTimeout(() => {
    //             window.close();
    //         }, 1000);
    //     }
    // }, []);

    const onSubmissionClose = React.useCallback(() => {
        authSignOut();
        router.replace("/login");
    }, [router]);

    if (signUpComplete) {
        return (
            <PageDialog type='confirm' title='signup.received_title' confirmLabel='Close' size='sm' modeless onClose={onSubmissionClose} onConfirm={onSubmissionClose}>
                <Stack direction='column' spacing={2}>
                    <PageText text='signup.signup_company_received_message' />
                    <PageText text='signup.received_instruction' />
                </Stack>
            </PageDialog>
        );
    }

    return (
        <F.PageFormDialog type='confirm' title='Create company' form={form} size='lg' onSubmit={onSubmit} onClose={()=>{router.replace('/')}} loading={busy} modeless>
            {/* <F.InputText form={form} id='country' label='Country' value={'Republic of Armenia'} readonly xsMax /> */}
            {/* <F.InputText form={form} id='region' label='Region' xsMax /> */}
            <F.InputText id='companyName' label='Company Name' required xsThird />
            <F.InputText id='director' label='Director full name' xsThird />
            <F.InputText id='establishedAt' label='Founded' xsThird />
            <F.InputText id='phoneNumber' label='Phone Number' xsThird validate='tel' />
            <F.InputText id='companyTin' label='Company TIN' required maxLength={8} xsThird />
            <F.InputText id='lawAddress' label='Legal address' required xsThird />
            <F.InputText id='address' label='Activity Address' xsThird />
            <F.InputText id='email' label='Email' xsThird validate='email' required />
            <F.InputText id='website' label='Website' xsThird />

            <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
                <FormLabel
                    component="legend"
                    sx={{ color: 'text.primary', '&.Mui-focused': { color: 'text.primary' } }}
                >
                    {t('Choose Activities')}
                </FormLabel>
                <Box display="flex" flexWrap="wrap">
                    {accountActivities.map((activity) => (
                        <FormControlLabel
                            key={activity.id}
                            value={activity.id}
                            control={
                                <Checkbox
                                    checked={selected.includes(activity.id)}
                                    onChange={handleRadioChange}
                                    size="medium"
                                />
                                // <Radio
                                //     checked={selected.includes(activity.id)}
                                //     onChange={handleRadioChange}
                                // />
                            }
                            label={t(activity.label)}
                            sx={{ mr: 2 }}  // margin-right for spacing
                        />
                    ))}
                </Box>
            </FormControl>

            <F.InputText form={form} maxLength={800} multiline={{ minRows: 3, maxRows: 4 }} id='companyInfo' label='About Company' xsMax />

            {/* <F.InputText form={form} id='webiste' label='Website' xsThird />
            <F.InputText form={form} id='companyPhone' label='Company Phone' xsThird /> */}
        </F.PageFormDialog>
    );
}
