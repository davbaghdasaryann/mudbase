'use client';

import React from 'react';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import * as F from '@/tsui/Form';
import * as Api from '@/api';

import ActionCompleteMessage from '@/components/ActionCompleteMessage';
import { dialogPaperBorder } from '@/theme';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from '@mui/system';

export default function LoginForgotPageContents() {
    const form = F.useInputForm();
    const { t } = useTranslation();

    const [msgSent, setMsgSent] = React.useState(false);
    // const [msgSent, setMsgSent] = React.useState(true);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        form.setBusy();
        let email = evt.data['email']!;
        await Api.requestPublic({
            command: 'auth/send_password_reset_email',
            args: { email: email },
        });

        form.clearBusy();
        setMsgSent(true);
    }, []);

    if (msgSent) {
        return (
            <ActionCompleteMessage title={t('Forgot Password')} icon={CheckCircleOutlineIcon} message={t('Excellent!')} instructions={t('auth.password_reset_link_sent')} />
        );
    }

    return (
        <F.PageForm
            onSubmit={onSubmit}
            form={form}
            size='sm'
            title='Recover Login'
            formSx={{
                border: dialogPaperBorder,
            }}
            titleSx={{
                fontSize: 25,
                fontWeight: 'bold'
            }}
        >
            <F.Label form={form} label='recover_login_text' />

            <F.InputText maxLength={100} label='Email' id='email' autocomplete='email' validate='email' required form={form} xsMax />
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ width: '100%', mt: 2, p: 0 }}
            >
                <Box sx={{ m: 0, p: 0 }}>
                    <F.NavigateLink
                        label="Register new account"
                        href="/signup"
                        form={form}
                    />
                </Box>
                <Box sx={{ m: 0, p: 0 }}>
                    <F.SubmitButton label="Send" />
                </Box>
            </Stack>
        </F.PageForm>
    );
}
