import React from 'react';

import PageContents from '../../../components/PageContents';
import * as F from 'tsui/Form';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import * as Api from 'api';
import { accountRoles } from '@/data/account_roles';
import { PageSelect } from '../../../tsui/PageSelect';


export default function DevJoin() {
    // const [userInfo, setUserInfo] = React.useState<ApiUser[]>(registerAccountList);

    const form = F.useForm({ type: 'input' });
    const router = useRouter();

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;

        if (!evt.data || Object.keys(evt.data).length === 0) {
            //TODO everywhere by this way
            return;
        }

        console.log('Submit', evt.data);
        if (evt.data) {
            Api.requestPublic<any>({
                command: 'dev/add_user',
                json: evt.data,
            }).then((data) => {
                console.log('data', data);
            });
        }
    }, []);

    return (
        <PageContents type='auth'>
            <Button
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => {
                    router.replace('/dev');
                }}
            >
                Return to Developer Mode Main Page
            </Button>

            <F.PageForm title='ADD DEVELOPER MODE USER' form={form} size='sm' onSubmit={onSubmit} formSx={{ width: '50%', fontSize: '12px' }}>
                <F.InputText label='Email' id='email' required  xsQuarter />
                <F.InputText label='Name' id='firstName' required xsQuarter />
                <F.InputText label='Surname' id='lastName' required xsQuarter />
                <F.InputText label='Account Id' id='accountId' xsQuarter />
                <F.InputText label='Password' id='password' xsQuarter />
                <PageSelect label="User Type" items={accountRoles.map(el => { return { id: el.id, label: el.name } })} />
                <F.SubmitButton label='Register' xsHalf />
            </F.PageForm>
        </PageContents>
    );
}
