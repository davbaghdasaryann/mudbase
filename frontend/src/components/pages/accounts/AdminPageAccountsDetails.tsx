"use client";

import * as F from 'tsui/Form';
import React from 'react';
import { ApiAccount } from '../../../api';
import { FormDataProvider } from '../../FormDataProvider';

interface Props {
    accountId: string;
    accounsData: ApiAccount[];
    onClose: () => void;
    onClick: (event: any) => void;
    onSelected: (data: ApiAccount[]) => void;

}

export function AdminPageAccountsDetails(props: Props) {

    const form = F.useUpdateForm();

    const [data, setData] = React.useState<ApiAccount | null>(null);
    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if(form.error)
            return
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }
        console.log('Submit', evt.data)
        if (evt.isData()) {
            // for (const [key, value] of Object.entries(evt.data)) {
            //     for (let comp of props.accounsData) {
            //         if (comp.accountId === props.accountId) {
            //             comp[key] = value;
            //         }
            //     }
            // }

            props.onSelected(props.accounsData);
            props.onClose();
        }


    }, []);


    React.useEffect(() => {
        // for (let comp of props.accounsData) {
        //     if (comp.accountId === props.accountId) {
        //         setData(comp)
        //     }
        // }

    }, []);

    return <FormDataProvider<ApiAccount> api={{ command:'users/get'}} onData={d => {
        console.log(d)
        // for (let comp of props.accounsData) {
        //     if (comp.accountId === props.accountId) {
        //         setData(comp)
        //     }
        // }
    }} form={form}>
        <F.PageFormDialog title='Information' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

            {/* <F.InputText label='Account Name' id='accountName' value={data?.accountName} validate='off' autocomplete='given-name' form={form} xsHalf />
            <F.InputText label='Account Type' id='accountType' value={data?.accountType} validate='off' autocomplete='family-name' form={form} xsHalf />

            <F.InputGroup label='Description' form={form} />
            <F.InputText label='Account Description' id='accountDescription' value={data?.accountDescription} validate='off' maxLength={500} multiline={{ minRows: 4, maxRows: 10 }} form={form} xsMax /> */}


        </F.PageFormDialog>


    </FormDataProvider>
}

