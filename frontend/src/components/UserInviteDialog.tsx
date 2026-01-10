import React from 'react';
import * as F from 'tsui/Form';
import * as Api from 'api';
import AccountSelectionDialog from './AccountSelectionDialog';
import {useSession} from 'next-auth/react';
import {usePermissions} from '../api/auth';
import {
    Box,
    Button,
    Paper,
    Radio,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import {accountActivities, AccountActivity} from '../tsmudbase/company_activities';
import ProgressIndicator from '../tsui/ProgressIndicator';
import {useTranslation} from 'react-i18next';
import {AllowedPage, getAllowedPagesByActivities, PermissionsId, RadioPermissionChoice} from '../tsmudbase/permissions_setup';
import PageDialog from '../tsui/PageDialog';

interface UserInviteDialogProps {
    show?: boolean;
    onClose: (changed: boolean) => void;
}

export default function UserInviteDialog(props: UserInviteDialogProps) {
    if (props.show === false) return <></>;
    return <UserInviteDialogBody {...props} />;
}

function UserInviteDialogBody(props: UserInviteDialogProps) {
    const form = F.useInputForm();
    // const { data: session } = useSession();
    const {session, status, permissionsSet} = usePermissions();
    const [progIndic, setProgIndic] = React.useState(false);
    const [inviteErrMsgDialog, setInviteErrMsgDialog] = React.useState<string | null>(null);

    const accountIdRef = React.useRef<string | null>(null);
    // const [accountId, setAccountId] = React.useState<string | null>(null);
    const [accountData, setAccountData] = React.useState<Api.ApiAccount | null>(null);

    const [selectedActivities, setSelectedActivities] = React.useState<AccountActivity[]>([]);
    const selectedActivitiesRef = React.useRef<AccountActivity[]>(selectedActivities);
    const {t} = useTranslation();
    const [accountsActive, setAccountsActive] = React.useState(false);

    const allowedPages: AllowedPage[] = React.useMemo(() => getAllowedPagesByActivities({accountActivity: selectedActivities}), [selectedActivities]);

    const [pagePermissions, setPagePermissions] = React.useState<{[pageId: string]: 'view' | 'edit'}>(() => {
        const initial: Record<PermissionsId, RadioPermissionChoice> = {} as Record<PermissionsId, RadioPermissionChoice>;
        allowedPages.forEach((page) => {
            if (page.allowedPermission === 'viewOnly') {
                initial[page.id] = 'view';
            }
        });
        return initial;
    });
    const chosenPermissionsRadioRef = React.useRef<{[pageId: string]: 'view' | 'edit'}>(pagePermissions);

    React.useEffect(() => {
        chosenPermissionsRadioRef.current = pagePermissions;
    }, [pagePermissions]);

    // const [selectedActivities, setSelectedActivities] = React.useState<AccountActivity[]>([]);
    // const selectedActivitiesRef = React.useRef<AccountActivity[]>(selectedActivities);

    const onAccountConfirm = React.useCallback((account: Api.ApiAccount) => {
        accountIdRef.current = account._id;
        // setAccountId(account._id);
        setSelectedActivities(account.accountActivity);
        selectedActivitiesRef.current = account.accountActivity;
        setAccountData(account);
        setAccountsActive(false);
    }, []);

    React.useEffect(() => {
        setPagePermissions((prev) => {
            const newPermissions: {[pageId: string]: 'view' | 'edit'} = {...prev};
            allowedPages.forEach((page) => {
                if (page.allowedPermission === 'viewOnly') {
                    newPermissions[page.id] = 'view';
                } else if (!newPermissions[page.id]) {
                    // Initialize with a default value (defaulting to 'view' here) if not set.
                    newPermissions[page.id] = 'view';
                }
            });
            return newPermissions;
        });
    }, [allowedPages]);

    // Handle changes to permission (for pages with viewOrEdit permission).
    const handlePermissionChange = (pageId: PermissionsId, value: RadioPermissionChoice) => {
        setPagePermissions((prev) => {
            const newState = {...prev, [pageId]: value};
            chosenPermissionsRadioRef.current = newState;
            return newState;
        });
    };

    React.useEffect(() => {
        if (session?.user && permissionsSet?.has('INV_SND_LOC')) {
            setProgIndic(true);
            Api.requestSession<Api.ApiAccount>({
                command: 'account/get_my',
            }).then((account) => {
                onAccountConfirm(account);
                setProgIndic(false);
            });
        }
    }, []);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        console.log('pagePermissions', chosenPermissionsRadioRef.current);
        // return
        if (form.error) return;
        if (!evt.isData()) return;

        console.log('Submit', evt.data);

        if (session?.user && permissionsSet?.has('INV_SND_LOC')) {
            await Api.requestSession<any>({
                command: 'signup/local_invite',
                json: {
                    email: evt.data.email,
                    firstName: evt.data.firstName,
                    middleName: evt.data.middleName,
                    lastName: evt.data.lastName,
                    accountId: accountIdRef.current,
                    // givenActivities: selectedActivitiesRef.current,
                    chosenPermissions: chosenPermissionsRadioRef.current,
                },
            });
            // .then((result) => {
            //     console.log('result', result);
            //     // if (result.errMsg) {
            //     //     setInviteErrMsgDialog(result.errMsg)
            //     // } else {
            //     props.onClose(true);
            //     // }
            // });
        } else {
            await Api.requestSession<any>({
                command: 'signup/invite',
                json: {
                    email: evt.data.email,
                    firstName: evt.data.firstName,
                    middleName: evt.data.middleName,
                    lastName: evt.data.lastName,
                    // accountId: accountIdRef.current,
                },
            });
            // }).then((result) => {
            //     // if (result.errMsg) {
            //     //     setInviteErrMsgDialog(result.errMsg)
            //     // } else {
            //         props.onClose(true);
            //     // }
            // });
        }

        props.onClose(true);
    }, []);

    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />;
    }

    return (
        <>
            <F.PageFormDialog
                title='Invite User'
                form={form}
                size='sm'
                onSubmit={onSubmit}
                onCloseFalse={props.onClose}
                slotProps={{
                    submitButton: {
                        label: 'Invite',
                    },
                }}
            >
                {session?.user && permissionsSet?.has?.('INV_SND_LOC') ? (
                    <>
                        <F.InputText id='email' label='Email' validate='email' required form={form} xs={6} />
                        <F.InputText id='accountName' label='Company' required readonly form={form} value={accountData?.companyName} xs={6} />
                    </>
                ) : (
                    <F.InputText id='email' label='Email' validate='email' required form={form} xs={12} />
                )}
                {session?.user && permissionsSet?.has?.('INV_SND_LOC') ? (
                    <>
                        <F.InputText id='firstName' label='First Name' required form={form} xsHalf />
                        <F.InputText id='lastName' label='Last Name' required form={form} xsHalf />

                        <Paper sx={{padding: 3, width: 1, margin: 'auto'}}>
                            <Typography variant='h6' gutterBottom>
                                {t('Choose Permissions')}
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell> </TableCell>
                                            <TableCell align='center'>{t('View')}</TableCell>
                                            <TableCell align='center'>{t('Edit')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {allowedPages.map((page) => (
                                            <TableRow key={page.id}>
                                                <TableCell>{t(page.name)}</TableCell>
                                                {page.allowedPermission === 'viewOnly' ? (
                                                    // For pages with viewOnly permission, show View as selected and disabled.
                                                    <>
                                                        <TableCell align='center'>
                                                            <Radio checked disabled value='view' />
                                                        </TableCell>
                                                        <TableCell align='center'>-</TableCell>
                                                    </>
                                                ) : (
                                                    // For pages with viewOrEdit permission, allow admin to choose.
                                                    <>
                                                        <TableCell align='center'>
                                                            <Radio
                                                                checked={pagePermissions[page.id] === 'view'}
                                                                onChange={() => handlePermissionChange(page.id, 'view')}
                                                                value='view'
                                                                name={`permission-${page.id}`}
                                                            />
                                                        </TableCell>
                                                        <TableCell align='center'>
                                                            <Radio
                                                                checked={pagePermissions[page.id] === 'edit'}
                                                                onChange={() => handlePermissionChange(page.id, 'edit')}
                                                                value='edit'
                                                                name={`permission-${page.id}`}
                                                            />
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                ) : (
                    <>
                        <F.InputText id='firstName' label='First Name' required form={form} xsHalf />
                        {/* <F.InputText id='middleName' label='Middle Name' form={form} xsThird /> */}
                        <F.InputText id='lastName' label='Last Name' required form={form} xsHalf />
                    </>
                )}

                {/* <F.InputText label='Account Id' form={form} xsMax value={accountId}/> */}
            </F.PageFormDialog>

            {/* <AccountSelectionDialog show={accountsActive} onCloseFalse={setAccountsActive} onConfirm={onAccountConfirm} /> */}
        </>
    );
}
