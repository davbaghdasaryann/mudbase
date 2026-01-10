import React from 'react';

import {Grid, Stack} from '@mui/material';

import {useTranslation, getI18n} from 'react-i18next';

import EmailIcon from '@mui/icons-material/Email';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StoreIcon from '@mui/icons-material/Store';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import AccountSelectionDialog from '../../components/AccountSelectionDialog';
import {confirmDialog} from '../../components/ConfirmationDialog';
import {getAccountNameById} from '../../tsmudbase/company_activities';
import {PageButton} from '../../tsui/Buttons/PageButton';

interface PendingUserDetailsDialog {
    user: Api.ApiPendingUser | null;
    onClose: (dataChanged: boolean) => void;
}

export default function PendingUserDetailsDialog(props: PendingUserDetailsDialog) {
    if (!props.user) return <></>;

    return <PendingUserDetailsDialogBody {...props} />;
}

const buttonWidth = 190;
const buttonXs = 3;

function PendingUserDetailsDialogBody(props: PendingUserDetailsDialog) {
    const form = F.useForm({type: 'update'});
    const user = props.user!;

    const [t] = useTranslation();

    const [accountSelect, setAccountSelect] = React.useState(false);
    const dataChanged = React.useRef(false);
    const [account, setAccount] = React.useState<Api.ApiAccount | null>(null);

    const [approveDisabled, setApproveDisabled] = React.useState(true);
    const [userCompanyActivity, setUserCompanyActivity] = React.useState<string | undefined>();

    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // console.log(user);

        if (user.accountId) {
            Api.requestSession<Api.ApiAccount>({
                command: 'account/get',
                args: {
                    accountId: user.accountId,
                },
            }).then((account) => {
                setAccount(account);
                setApproveDisabled(false);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }

        setUserCompanyActivity(getI18n().t(getAccountNameById(user.companyActivity)));
    }, []);

    const onClose = React.useCallback(() => {
        props.onClose(dataChanged.current);
    }, []);

    const onAccountSelect = React.useCallback((account: Api.ApiAccount) => {
        Api.requestSession({
            command: 'signup/set_account',
            args: {
                pendingUserId: user._id,
                accountId: account._id,
            },
        })
            .then(() => {
                setAccountSelect(false);
                dataChanged.current = true;
            })
            .finally(() => {
                setAccount(account);
            });
    }, []);

    const resendInvitation = React.useCallback(() => {
        setLoading(true);
        Api.requestSession({
            command: 'signup/send_invite',
            args: {
                pendingUserId: user._id,
            },
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    const onApprove = React.useCallback(() => {
        setLoading(true);
        Api.requestSession({
            command: 'signup/approve',
            args: {
                pendingUserId: user._id,
            },
        })
            .then(() => {
                dataChanged.current = true;
                props.onClose(dataChanged.current);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const onReject = React.useCallback(() => {
        confirmDialog(t('Are you sure?')).then((result) => {
            if (result.isConfirmed) {
                setLoading(true);
                Api.requestSession({
                    command: 'signup/reject',
                    args: {
                        pendingUserId: user._id,
                    },
                })
                    .then(() => {
                        dataChanged.current = true;
                        props.onClose(dataChanged.current);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }
        });
    }, []);

    return (
        <>
            <F.PageFormDialog
                form={form}
                size='md'
                title='Pending User'
                onClose={onClose}
                loading={loading}
                layoutContainerType='none'
                slotProps={{
                    cancelButton: {
                        label: 'Close',
                    },
                    submitButton: {
                        show: false,
                    }
                }}
            >
                <Stack direction='row' spacing={2}>
                    <Grid container flex={1} spacing={2}>
                        <F.InputText form={form} label='Email' value={user.email} displayonly xs={6} />
                        <F.InputText form={form} label='First Name' value={user.firstName} displayonly xs={3} />
                        {/* <F.InputText form={form} label='Middle Name' value={user?.middleName} readonly xs={3} /> */}
                        <F.InputText form={form} label='Last Name' value={user.lastName} displayonly xs={3} />

                        <F.InputText form={form} label='User Company' value={user.companyName} displayonly xs={6} />
                        <F.InputText form={form} label='User TIN' value={user.companyTin} displayonly xs={2} />
                        <F.InputText form={form} label='Activity' value={userCompanyActivity} displayonly xs={4} />

                        <F.InputText form={form} label='Company Number' value={account?.companyNumber} readonly xs={3} />
                        <F.InputText form={form} label='Company Name' value={account?.companyName} readonly xs={7} />
                        <F.InputText form={form} label='TIN' value={account?.companyTin} readonly xs={2} />

                        <F.InputText form={form} label='Phone Number' value={user?.phoneNumber} displayonly xs={4} />
                        <F.InputText form={form} label='User Notes' readonly xs={8} />
                    </Grid>

                    <Stack direction='column' spacing={4} alignItems='stretch' justifyItems='center' sx={{mt: 4}}>
                        <PageButton
                            label='Resend'
                            startIcon={<EmailIcon />}
                            onClick={resendInvitation}
                            variant='contained'
                            sx={{justifyContent: 'flex-start'}}
                        />
                        <PageButton
                            label='Set Company'
                            startIcon={<StoreIcon />}
                            onClickTrue={setAccountSelect}
                            variant='contained'
                            sx={{justifyContent: 'flex-start'}}
                        />
                        <PageButton
                            label='Approve'
                            startIcon={<ThumbUpAltIcon />}
                            disabled={approveDisabled}
                            variant='contained'
                            onClick={onApprove}
                            sx={{justifyContent: 'flex-start', backgroundColor: 'success.main'}}
                        />

                        <PageButton
                            label='Reject'
                            startIcon={<ThumbDownIcon />}
                            variant='contained'
                            onClick={onReject}
                            sx={{justifyContent: 'flex-start', backgroundColor: 'primary.main'}}
                        />
                    </Stack>
                </Stack>
            </F.PageFormDialog>

            <AccountSelectionDialog show={accountSelect} onClose={() => setAccountSelect(false)} onConfirm={onAccountSelect} />
        </>
    );
}
