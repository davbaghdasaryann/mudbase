import React from 'react';

import { useTranslation } from 'react-i18next';

import * as Api from 'api';
import * as F from 'tsui/Form';
import { makeAccountActivitiesString } from '@/lib/account_activities';


interface AboutCompanyPageProps {
    account: Api.ApiAccount | undefined;
};

export default function AboutCompanyPage(props: AboutCompanyPageProps) {
    const form = F.useForm({ type: 'displayonly' });
    const [t] = useTranslation()


    const accountInfo = props.account;

    if(!accountInfo){
        return<></>
    }

    return (
        <F.PageForm form={form} formSx={{ width: 1, height: 1 }}>
            <F.InputText id='companyName' label='Company Name' value={accountInfo?.companyName} xsMax displayonly />

            <F.InputText id='establishedAt' label='Establish Date' value={accountInfo?.establishedAt} xsHalf displayonly />
            <F.InputText id='phoneNumber' label='Phone Number' value={accountInfo?.phoneNumber} xsHalf displayonly />

            <F.InputText id='companyTin' label='TIN' value={accountInfo?.companyTin} xsHalf displayonly />
            <F.InputText
                id='accountActivity'
                label='Activity'
                value={makeAccountActivitiesString(accountInfo?.accountActivity)}
                displayonly
                xsHalf
            />

            <F.InputText id='address' label='Address' value={accountInfo?.address} xsHalf displayonly />
            <F.InputText id='lawAddress' label='Legal Address' value={accountInfo?.lawAddress} xsHalf displayonly />

            <F.InputText id='email' label='Email' value={accountInfo?.email} xsHalf displayonly />

            {/* <Link href={accountInfo?.website}> */}
            <F.InputText type='link' id='website' label='Website' value={accountInfo?.website} xsHalf displayonly />
            {/* </Link> */}

            <F.InputText id='director' label='Director' value={accountInfo?.director} xsMax displayonly />
            {/* <F.InputText form={form} id='companyInfo' label={t('Company Info')} value={accountInfo?.companyInfo} xsMax /> */}
            <F.InputText
                maxLength={800}
                multiline={{ minRows: 3, maxRows: 4 }}
                id='companyInfo'
                label='About Company'
                value={accountInfo?.companyInfo}
                xsMax
            />

        </F.PageForm>
    );
}
