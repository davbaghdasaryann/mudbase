

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Radio, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import * as Api from '@/api';
import * as F from 'tsui/Form';
import { useTranslation } from 'react-i18next';
import { accountActivities, AccountActivity, getAccountNameById } from '../../tsmudbase/company_activities';
import { useApiFetchOne } from '../../components/ApiDataFetch';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { raiseError } from '../../lib/app_errors';
import {
    getAllowedPagesByActivities,
    AllowedPage,
    PermissionsId,
    RadioPermissionChoice,
    ChosenPermissionsMap
} from '../../tsmudbase/permissions_setup';
import { UserRole } from '../../tsmudbase/user_roles';

interface UsersPageUserDetailsProps {
    user: Api.ApiUser | null;
    userActivity: any[] | null;
    onClose: (dataChanged: boolean) => void;
}

export function UsersPageUserDetails(props: UsersPageUserDetailsProps) {
    if (!props.user) return <></>;
    return <UsersPageUserDetailsBody {...props} />;
}

export function UsersPageUserDetailsBody(props: UsersPageUserDetailsProps) {
    // const form = F.useForm({ type: 'update-fields' });
    const form = F.useInputForm();

    const user = props.user as Api.ApiUser;
    const [t] = useTranslation();
    const [allowedPages, setAllowedPages] = useState<AllowedPage[]>([]);

    const [progIndic, setProgIndic] = React.useState(false)

    const dataChanged = React.useRef(false);

    const [pagePermissions, setPagePermissions] = useState<Record<PermissionsId, RadioPermissionChoice>>({
        estimates: 'view',
        accountLaborOfferCatalog: 'view',
        accountMaterialsOfferCatalog: 'view',
        accountInfo: 'view',
    });

    const chosenPermissionsRadioRef = React.useRef<{ [pageId: string]: 'view' | 'edit' }>(pagePermissions);




    const apiUserAccountData = useApiFetchOne<Api.ApiAccount>({
        api: {
            command: 'account/get',
            args: { accountId: user.accountId }
        },
    });

    const apiUserData = useApiFetchOne<Api.ApiUser>({
        api: {
            command: 'user/get',
            args: { userId: user._id }
        },
    });

    useEffect(() => {
        if (apiUserAccountData.data) {
            setAllowedPages(getAllowedPagesByActivities(apiUserAccountData.data));
        }
        chosenPermissionsRadioRef.current = pagePermissions;
    }, [apiUserAccountData.data]);




    useEffect(() => {
        if (apiUserData.data) {
            if (
                apiUserData.data.chosenPermissions &&
                Object.keys(apiUserData.data.chosenPermissions).length > 0
            ) {
                setPagePermissions(apiUserData.data.chosenPermissions as Record<PermissionsId, RadioPermissionChoice>);
            } else if (user.role === 'R' && allowedPages.length > 0) {
                const defaults: Record<PermissionsId, RadioPermissionChoice> = {} as Record<PermissionsId, RadioPermissionChoice>;
                allowedPages.forEach((page) => {
                    defaults[page.id] = 'view';
                });
                setPagePermissions(defaults);
            }
        }
    }, [apiUserData.data, allowedPages, user.role]);

    const handlePermissionChange = (pageId: PermissionsId, value: RadioPermissionChoice) => {
        setPagePermissions(prev => {
            const newState = { ...prev, [pageId]: value };
            chosenPermissionsRadioRef.current = newState;
            return newState;
        });
    };

    const onClose = React.useCallback(() => {
        props.onClose(dataChanged.current);
    }, []);

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        const data: any = evt.data;
        // data.userActivity = data.userActivity || [];
        data.chosenPermissions = chosenPermissionsRadioRef.current;
        // data.pagePermissions = pagePermissions;
        if (data.email) {
            delete data.email;
        }

        console.log('Submit', data);
        if (data) {
            setProgIndic(true);
            Api.requestSession<Api.ApiUser[]>({
                command: 'user/update',
                json: data,
                args: { userId: user._id },
            }).then((res) => {
                console.log('backend data ', res);
                dataChanged.current = true;
                onClose();
            }).finally(() => {
                setProgIndic(false);
            });
        }
    }, []);

    if (apiUserAccountData.loading || apiUserData.loading || progIndic) {
        return <ProgressIndicator show background='backdrop' />;
    }

    console.log('apiUserData', apiUserData.data)

    return (
        <F.PageFormDialog ignoreDataChecking title={t('User')} form={form} size='md' onSubmit={onSubmit} onClose={onClose}>
            <F.InputText form={form} id='email' label='Email' value={user?.email} xs={6} readonly />
            <F.InputText form={form} id='phoneNumber' autocomplete='tel' label='Phone Number' value={user?.phoneNumber} xs={6} />
            <F.InputText form={form} id='firstName' value={apiUserData?.data?.firstName} label='First Name' required xsThird />
            <F.InputText form={form} id='middleName' autocomplete='given-name' label='Middle Name' value={user?.middleName} xsThird />
            <F.InputText form={form} id='lastName' value={apiUserData?.data?.lastName} label='Last Name' required xsThird />

            <Paper sx={{ padding: 3, width: 1, margin: 'auto', mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    {t('Choose Permissions')}
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell> </TableCell>
                                <TableCell align="center">{t('View')}</TableCell>{/* TODO: translate */}
                                <TableCell align="center">{t('Edit')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allowedPages.map((page) => (
                                <TableRow key={page.id}>
                                    <TableCell>{t(page.name)}</TableCell>
                                    {page.allowedPermission === 'viewOnly' ? (
                                        <>
                                            <TableCell align="center">
                                                <Radio checked disabled value="view" />
                                            </TableCell>
                                            <TableCell align="center">-</TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell align="center">
                                                <Radio
                                                    checked={pagePermissions[page.id] === 'view'}
                                                    onChange={() => handlePermissionChange(page.id, 'view')}
                                                    value="view"
                                                    name={`permission-${page.id}`}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Radio
                                                    checked={pagePermissions[page.id] === 'edit'}
                                                    onChange={() => handlePermissionChange(page.id, 'edit')}
                                                    value="edit"
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
        </F.PageFormDialog>
    );
}


