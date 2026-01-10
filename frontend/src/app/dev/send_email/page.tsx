'use client';

import React from 'react';

import PageContents from '@/components/PageContents';
import * as Api from '@/api';
import * as F from 'tsui/Form';
import {showDevAlert} from '@/components/DevAlert';

export default function SendingEmailPage() {
    const form = F.useForm({type: 'input'});

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.isData()) return;

        let result = await Api.requestSession<any>({
            command: 'dev/send_email',
            json: evt.data,
        });

        showDevAlert(result);
    }, []);

    return (
        <PageContents type='dev'>
            <F.PageForm form={form} onSubmit={onSubmit} size='sm'>
                <F.InputText label='Email' id='email' required validate='email' autocomplete='email' xsMax />
                <F.SubmitButton label='Send Email' xsHalf />
            </F.PageForm>
        </PageContents>
    );
}
