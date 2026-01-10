'use client';

import React from 'react';

import {useRouter, useSearchParams} from 'next/navigation';

import * as AuthApi from 'api/auth';

import * as F from 'tsui/Form';
import PageContents from 'components/PageContents';
import {Typography, Divider} from '@mui/material';

interface Props {
    email: string;
    // onClose: () => void;
}

export default function JoinConfirmUserEmailPage() {
    const form = F.useForm({type: 'input'});


    const navigate = useRouter();
    const searchParams = useSearchParams();

    // const navigate = useNavigate();

    // const search = useLocation().search;
    // const urlParams = new URLSearchParams(search);

    const email = searchParams ? searchParams.get('email') : '';
    const [status, setStatus] = React.useState('');
    const [disabled, setDisabled] = React.useState(false);

    // const user = new CognitoUser({
    //     Username: email!,
    //     Pool: UserPool,
    // });

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error) return;
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            return;
        }
        // return new Promise((resolve, reject) => {
        //     user.confirmRegistration(evt.data.confirmUserEmail, true, function (err, result) {
        //         if (err) {
        //             console.log(err);
        //             reject(err);
        //         } else {
        //             resolve(result);
        //             navigate('/login');

        //         }
        //     });
        // });

        // form.setBusy();

        AuthApi.confirmUserEmail({email: email!, code: evt.data.confirmUserEmail})
            .then((sess) => {
                // form.clearBusy();
                // // navigate('/');
                // setStatus('Your verification code has been sent')
                // setDisabled(true);
                if (sess) {
                    navigate.replace('/login');
                }
                // props.onClose()
            })
            
    }, []);

    // return <PageContents title='Join verification'>
    return (
        <PageContents title='join_confirm_user_email'>
            <F.PageForm title='JOIN CONFIRM' form={form} size='lg' onSubmit={onSubmit}>
                {/* <Form.PageInputForm title='Thanks for joining' onSubmit={onSubmit} form={form} size='md' > */}
                {/* <Divider sx={{ width: '100%', p: 1 }} /> */}
                {/* <Typography sx={{ fontSize: '1.2rem', p: 2 }} >Verification email has been sent, please check your inbox!</Typography> */}
                <Typography sx={{fontSize: '1.2rem', p: 2}}>Your Verification email</Typography>

                <F.InputText
                    form={form}
                    xs={8}
                    id='confirmUserEmail'
                    label='Confirm User Email'
                    autocomplete='given-name'
                    required
                />

                {/* <Typography sx={{ width: '100%', textAlign: 'center', fontSize: '0.8rem', color: '#616161' }}>Haven't got one? click the button below</Typography> */}
                {/* <Form.SubmitButton  disabled={disabled} align="center" label='resend' form={form} xsMax/> */}
                {/* <Form.SubmitButton disabled={disabled} align="center" label='SEND' form={form} xsMax /> */}
                <Typography sx={{width: '100%', textAlign: 'center', fontSize: '0.8rem', color: 'green'}}>
                    {status}
                </Typography>
                {/* </Form.PageInputForm> */}
            </F.PageForm>
        </PageContents>
    );
}
