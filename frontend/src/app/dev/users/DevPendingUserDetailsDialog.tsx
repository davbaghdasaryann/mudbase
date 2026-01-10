import React from 'react';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as Api from '@/api';
import * as F from '@/tsui/Form';
import AccountSelectionDialog from '../../../components/AccountSelectionDialog';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';
import { accountActivities } from '../../../tsmudbase/company_activities';
import { PageSelect } from '../../../tsui/PageSelect';

interface DevPendingUserDetailsDialog {
    user: Api.ApiUser | null;
    onClose: (dataChanged: boolean) => void;
}

export default function PendingUserDetailsDialog(props: DevPendingUserDetailsDialog) {
    if (!props.user) return <></>;

    return <PendingUserDetailsDialogBody {...props} />;
}

function PendingUserDetailsDialogBody(props: DevPendingUserDetailsDialog) {
    const form = F.useForm({ type: 'update-fields' });
    const user = props.user;
    const [accountSelect, setAccountSelect] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
     const [isAccountAdmin, setIsAccountAdmin] = React.useState('');
    const dataChanged = React.useRef(false);

   const onFieldUpdate = React.useCallback(async (field: InputFormField) => {
       // console.log(field);
        const newValue = field.value;
        setIsAccountAdmin(newValue);
        Api.requestSession({
            
            command: 'dev_user/set_account_admin',
            args: {
                userId: user?._id,
                isAccountAdmin: newValue,
            },
        })
            .then(() => {
                console.log('Admin status updated:');
                dataChanged.current = true;
            })
        
    }, []);



    const onRemovePendingUser = React.useCallback(() => {
        if (!user) return;

        Api.requestSession({
            command: "dev/delete_pending_user",
            args: {
                pendingUserId: user._id,
            },
        })
            .then(() => {
                console.log("deleted");
                dataChanged.current = true;
                setConfirmDelete(false);
                props.onClose(true);
            })
            
    }, [user, props.onClose]);

    const onClose = React.useCallback(() => {
        props.onClose(dataChanged.current);
    }, []);



    const onAccountSelect = React.useCallback((account: Api.ApiAccount) => {
                 Api.requestSession<any>({
                     command: 'dev_user/set_account',
                     args: {
                         userId: user?._id,
                         accountId: account._id,
                     },
                     
                 }).then(() => {
                     setAccountSelect(false);
                     dataChanged.current = true;
                 });
             }, []);


    return (
        <>
            <Dialog open={true} onClose={props.onClose} fullWidth maxWidth='md'>
                <DialogTitle>Pending User</DialogTitle>

                <IconButton
                    aria-label='close'
                    onClick={onClose}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>

                <DialogContent dividers>
                    <F.PageForm form={form} size='lg' onFieldUpdate={onFieldUpdate}>
                        <F.InputText form={form} id='email' value={user?.email} xs={6} displayonly={true} />
                        <F.InputText form={form} id='phoneNumber' label='Phone Number' value={user?.phoneNumber} displayonly={true} xs={6} />
                        <F.InputText form={form} id='firstName' label='First Name' value={user?.firstName} displayonly={true} xsThird />
                        <F.InputText form={form} id='middleName' label='Middle Name' value={user?.middleName} displayonly={true} xsThird />
                        <F.InputText form={form} id='lastName' label='Last Name' value={user?.lastName} displayonly={true} xsThird />
                        <F.InputText form={form} id='accountId' label='AccountId' value={user?.accountId} displayonly={true} xs={8} />
                        <F.FormButton form={form} label='Select Account' xs={4} onClick={() => setAccountSelect(true)} />
                        <F.FormButton form={form} label="Delete User" xs={4} onClick={() => setConfirmDelete(true)} />
                        <PageSelect
                            type='select'
                            value='Change Account Type'
                            label='Change Account Type'
                            items={accountActivities}
                        />
                        <F.InputCheckbox form={form} label='Is Account Admin' id='isAccountAdmin' xs={4} />
                    </F.PageForm>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} color='success'>
                        Accept
                    </Button>
                    <Button onClick={onClose} color='error'>
                        Reject
                    </Button>

                    <Button onClick={onClose} color='secondary'>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <AccountSelectionDialog show={accountSelect} onClose={() => setAccountSelect(false)} onConfirm={onAccountSelect} />

            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>

                <DialogTitle>Confirm</DialogTitle>
                <DialogContent>Delete User?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)} color="secondary">Cancel</Button>
                    <Button onClick={onRemovePendingUser} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}


