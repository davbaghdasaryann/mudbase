

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Radio, Typography } from '@mui/material';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BusinessIcon from '@mui/icons-material/Business';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';

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

const BRAND = '#00abbe';

const pageIcons: Record<PermissionsId, React.ElementType> = {
    estimates: StackedLineChartIcon,
    accountLaborOfferCatalog: MenuBookOutlinedIcon,
    accountMaterialsOfferCatalog: Inventory2OutlinedIcon,
    accountInfo: BusinessIcon,
    costing: RequestQuoteOutlinedIcon,
    analytics: BarChartIcon,
    performance: SpeedIcon,
    haymnadits: CorporateFareOutlinedIcon,
};

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
        costing: 'view',
        analytics: 'view',
        performance: 'view',
        haymnadits: 'view',
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

            <Divider sx={{ width: 1, my: 2 }} />
            <Box sx={{ width: 1 }}>
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, pr: 1 }}>
                    <Typography sx={{ fontSize: '0.825rem', letterSpacing: '0.03em', color: 'text.secondary', fontWeight: 600, flex: 1 }}>
                        {t('Permissions')}
                    </Typography>
                    <Box sx={{ width: 68, textAlign: 'center', fontSize: '0.825rem', color: 'text.secondary', fontWeight: 500 }}>{t('View')}</Box>
                    <Box sx={{ width: 68, textAlign: 'center', fontSize: '0.825rem', color: 'text.secondary', fontWeight: 500 }}>{t('Edit')}</Box>
                </Box>
                {allowedPages.map((page) => {
                    const Icon = pageIcons[page.id];
                    const isBeta = page.id === 'costing' || page.id === 'analytics';
                    return (
                        <Box key={page.id} sx={{ display: 'flex', alignItems: 'center', py: 0.8, '&:not(:last-child)': { borderBottom: '1px solid rgba(0,0,0,0.05)' } }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: '8px', backgroundColor: 'rgba(0,171,190,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {Icon && <Icon sx={{ fontSize: 18, color: BRAND }} />}
                            </Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary', flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, ml: 1.5 }}>
                                {t(page.name)}
                                {isBeta && <Box component='span' sx={{ fontSize: '0.70rem', fontWeight: 600, color: BRAND, lineHeight: 1 }}>β</Box>}
                            </Typography>
                            <Box sx={{ width: 68, display: 'flex', justifyContent: 'center' }}>
                                <Radio
                                    checked={pagePermissions[page.id] === 'view' || page.allowedPermission === 'viewOnly'}
                                    onChange={() => handlePermissionChange(page.id, 'view')}
                                    disabled={page.allowedPermission === 'viewOnly'}
                                    size='small'
                                    sx={{ p: 0.5, color: '#d1d5db', '&.Mui-checked': { color: BRAND }, '&.Mui-disabled': { color: BRAND, opacity: 0.6 } }}
                                />
                            </Box>
                            <Box sx={{ width: 68, display: 'flex', justifyContent: 'center' }}>
                                {page.allowedPermission === 'viewOnly' ? (
                                    <Box sx={{ width: 20, height: 20 }} />
                                ) : (
                                    <Radio
                                        checked={pagePermissions[page.id] === 'edit'}
                                        onChange={() => handlePermissionChange(page.id, 'edit')}
                                        size='small'
                                        sx={{ p: 0.5, color: '#d1d5db', '&.Mui-checked': { color: BRAND } }}
                                    />
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </F.PageFormDialog>
    );
}


