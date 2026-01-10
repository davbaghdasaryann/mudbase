import React from 'react';
import { Box, Typography, Button, SelectChangeEvent } from '@mui/material';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { accountActivities } from '../tsmudbase/company_activities';
import { t } from 'i18next';

interface CreateAccountDialogProps {
    show?: boolean;
    onClose: (changed: boolean) => void;
}

export default function CreateAccountDialog(props: CreateAccountDialogProps) {
    if (props.show === false) return <></>;
    return <CreateAccountDialogBody {...props} />;
}

function CreateAccountDialogBody(props: CreateAccountDialogProps) {
    const form = F.useForm({ type: 'input' });
    // const [userInfo, setUserInfo] = React.useState<ApiAccountInfo[]>(registerAccountList);
    // const [selectType, setSelectType] = React.useState('');
    // const [activeSection, setActiveSection] = useState<"factures" | "aboutCompany">("factures");
    // let [editUserInfoDialog, setOpenEditUserInfoDialog] = React.useState(false);
    // let [dataRequested, setDataRequested] = React.useState(false);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;

        // console.log(evt.data);

        if (!evt.isData()) return;

        // console.log('Submit', evt.data);
        // if (evt.data) {

        await Api.requestSession<any>({
            command: 'accounts/add',
            json: evt.data,
        });

        props.onClose(true);
    }, []);

    return (
        <F.PageFormDialog title={t('New Account')} form={form} size='md' onSubmit={onSubmit} onCloseFalse={props.onClose}>
            <F.InputText id='companyName' label='Company Name' required form={form} xsHalf />
            <F.InputText id='companyTin' label='TIN' required form={form} xsHalf validate='integer'/>
            <F.InputText label='Email' id='email' required form={form} xsHalf />
            <F.InputText label='Legal Address' id='lawAddress' required form={form} xsHalf />
            <F.InputText label='Address' id='address' required form={form} xsHalf />
            <F.InputText label='Phone Number' id='tel' required form={form} xsHalf />
            <F.InputText label='Establish Date' id='establishDate' form={form} xsHalf />
            <F.InputText label='Director' id='director' form={form} xsHalf />
            <F.InputText label='Website' id='website' form={form} xsHalf />
            <F.InputText label='Company Info' id='companyInfo' form={form} xsHalf />
            <F.SelectField
                id='accountActivity'
                value='Activity'
                label='Activity'
                xs={4}
                items={accountActivities}
            />
        </F.PageFormDialog>
    );
}
