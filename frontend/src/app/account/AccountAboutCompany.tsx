import React from 'react';

import * as Api from 'api';
import * as F from 'tsui/Form';
import {aboutCompanyBottomDividerColor} from '../../theme';
import { makeAccountActivitiesString } from '@/lib/account_activities';

interface AboutCompanyPageProps {
    account: Api.ApiAccount | undefined;
}

export default function AboutCompanyPage(props: AboutCompanyPageProps) {
    const form = F.useForm({type: 'displayonly'});
    const account = props.account;

    const accountActivityValue = React.useMemo(() => makeAccountActivitiesString(account?.accountActivity), [account]);

    // const onFieldUpdate = React.useCallback(
    //     async (field: InputFormField) => {
    //         await Api.requestSession<any>({
    //             command: 'profile/update_account',
    //             values: {
    //                 [field.id!]: field.value,
    //             },
    //         });
    //     },
    //     [account]
    // );

    return (
        <F.PageForm
            form={form}
            loading={account === undefined}
            formSx={{width: 1, height: 1}}
            // onFieldUpdate={onFieldUpdate}
            slotProps={{
                rootBox: {
                    sx: {
                        overflowY: 'auto',
                    },
                },
                paper: {
                    sx: {
                        border: 'none',
                        boxShadow: 'none',
                    },
                },
                grid: {
                    columnSpacing: 0,
                    sx: {
                        // borderBottom: `2px solid red`,
                    },
                },
                gridItem: {
                    sx: {
                        borderBottom: `2px solid ${aboutCompanyBottomDividerColor}`,
                        // borderBottom: `6px solid red`,
                    },
                },
                textField: {
                    sx: {
                        input: {
                            fontSize: '20px',
                            fontWeight: 600,
                        },

                        '& .MuiInputBase-input': {
                            fontSize: '20px',
                            fontWeight: 600,
                        },
                    },
                },
            }}
        >
            <F.InputText id='companyName' label='Company Name' value={account?.companyName} xsMax />

            <F.InputText id='establishedAt' label='Establish Date' value={account?.establishedAt} xsHalf />
            <F.InputText id='phoneNumber' label='Phone Number' value={account?.phoneNumber} xsHalf />

            <F.InputText id='companyTin' label='TIN' value={account?.companyTin} xsHalf displayonly />
            <F.InputText id='accountActivity' label='Activity' value={accountActivityValue} displayonly multiline={{minRows: 1, maxRows: 10}} xsHalf />

            <F.InputText id='address' label='Address' value={account?.address} multiline={{minRows: 1, maxRows: 10}} xsHalf />
            <F.InputText id='lawAddress' label='Legal Address' value={account?.lawAddress} multiline={{minRows: 1, maxRows: 10}} xsHalf />

            <F.InputText id='email' label='Email' value={account?.email} xsHalf />

            <F.InputText type='link' id='website' label='Website' value={account?.website} xsHalf />
            <F.InputText id='director' label='Director' value={account?.director} xsMax />
            <F.InputText id='companyInfo' label='About Company' value={account?.companyInfo} maxLength={800} multiline={{minRows: 3, maxRows: 10}} xsMax />
        </F.PageForm>
    );
}

