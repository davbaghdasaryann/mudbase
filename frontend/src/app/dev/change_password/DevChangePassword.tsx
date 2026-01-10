import React from 'react';

import PageContents from '@/components/PageContents';
import * as F from 'tsui/Form';
import * as Api from 'api';
import { showDevAlert } from '../../../components/DevAlert';

export default function DevChangePassword() {
    const form = F.useForm({type: 'input'});

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.isData()) return;

        let result = await Api.requestSession<any>({
            command: 'dev_user/set_password',
            json: evt.data,
        });

        showDevAlert(result);
    }, []);

    return (
        <PageContents type='dev'>
            <F.PageForm form={form} onSubmit={onSubmit}>
                <F.InputText label='Email' id='email' required validate='email' xsMax />
                <F.InputText label='Password' id='password' required type='password' xsMax />
                <F.SubmitButton label='Submit' xsHalf />
            </F.PageForm>
        </PageContents>
    );
}
