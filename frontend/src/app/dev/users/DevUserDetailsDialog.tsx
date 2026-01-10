import React, {useState, useRef, useCallback} from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Typography} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as Api from '@/api';
import * as F from '@/tsui/Form';
import AccountSelectionDialog from '@/components/AccountSelectionDialog';
import {InputFormField} from '../../../tsui/Form/FormElements/FormFieldContext';
import { accountActivities } from '../../../tsmudbase/company_activities';
import { PageSelect } from '../../../tsui/PageSelect';

interface DevUserDetailsDialogProps {
    user: Api.ApiUser | null;
    onClose: (dataChanged: boolean) => void;
}

export default function DevUserDetailsDialog(props: DevUserDetailsDialogProps) {
    if (!props.user) return null;
    return <PendingUserDetailsDialogBody {...props} />;
}

function PendingUserDetailsDialogBody(props: DevUserDetailsDialogProps) {
    const form = F.useForm({type: 'update-fields'});
    const user = props.user;
    const [accountSelect, setAccountSelect] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [isAccountAdmin, setIsAccountAdmin] = React.useState('');
    const dataChanged = useRef(false);

    const onFieldUpdate = React.useCallback(async (field: InputFormField) => {
      //  console.log(field);
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

    const onRemoveUser = React.useCallback(async () => {
        if (!user) return;

        try {
            await Api.requestSession({
                command: 'dev/delete_user',
                args: {
                    userId: user._id,
                },
            });
            console.log('deleted');
            dataChanged.current = true;
            setConfirmDelete(false);
            props.onClose(true);
            
        } catch (error) {}

    }, [user, props.onClose]);

    const onClose = React.useCallback(() => {
        props.onClose(dataChanged.current);
    }, []);

    return (
        <>
            <Dialog open={true} onClose={onClose} fullWidth maxWidth='md'>
                <DialogTitle>User Details</DialogTitle>

                <IconButton
                    aria-label='close'
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: 'grey.500',
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <DialogContent dividers>
                    <F.PageForm form={form} size='lg' onFieldUpdate={onFieldUpdate}>
                        <F.InputText form={form} id='email' value={user?.email} xs={6} displayonly={true} />
                        <F.InputText form={form} id='firstName' label='First Name' value={user?.firstName} displayonly={true} xsThird />
                        <F.InputText form={form} id='lastName' label='Last Name' value={user?.lastName} displayonly={true} xsThird />
                        <F.InputText form={form} id='accountId' label='AccountId' value={user?.accountId} displayonly={true} xsThird />
                        <F.FormButton form={form} label='Select Account' xs={4} onClick={() => setAccountSelect(true)} />
                        <F.FormButton form={form} label='Delete User' xs={4} onClick={() => setConfirmDelete(true)} />
                        <PageSelect
                            type='select'
                            value='Account Type'
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

                    <AccountSelectionDialog show={accountSelect} onClose={() => setAccountSelect(false)} onConfirm={onAccountSelect} />
                </DialogActions>

                <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                    <DialogTitle>Confirm</DialogTitle>
                    <DialogContent>Delete User?</DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDelete(false)} color='secondary'>
                            Cancel
                        </Button>
                        <Button onClick={onRemoveUser} color='error'>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Dialog>
        </>
    );
}
