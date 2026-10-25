import React from 'react';
import * as F from 'tsui/Form';
import * as Api from 'api';
import AccountSelectionDialog from './AccountSelectionDialog';
import {useSession} from 'next-auth/react';
import {usePermissions} from '../api/auth';
import {
    Box,
    Button,
    Divider,
    Radio,
    Typography,
} from '@mui/material';
import StackedLineChartIcon from '@mui/icons-material/StackedLineChart';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BusinessIcon from '@mui/icons-material/Business';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import SpeedIcon from '@mui/icons-material/Speed';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import {accountActivities, AccountActivity} from '../tsmudbase/company_activities';
import ProgressIndicator from '../tsui/ProgressIndicator';
import {useTranslation} from 'react-i18next';
import {AllowedPage, getAllowedPagesByActivities, PermissionsId, RadioPermissionChoice} from '../tsmudbase/permissions_setup';
import PageDialog from '../tsui/PageDialog';

const BRAND = '#00abbe';

const tileSx = {
    '& .MuiInputBase-root': { borderRadius: '10px', minHeight: 54 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,171,190,0.35)' },
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
    '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
} as const;

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
                        <F.InputText id='email' label='Email' validate='email' required form={form} xs={6} sx={tileSx} />
                        <F.InputText id='accountName' label='Company' required readonly form={form} value={accountData?.companyName} xs={6} sx={tileSx} />
                    </>
                ) : (
                    <F.InputText id='email' label='Email' validate='email' required form={form} xs={12} sx={tileSx} />
                )}
                {session?.user && permissionsSet?.has?.('INV_SND_LOC') ? (
                    <>
                        <F.InputText id='firstName' label='First Name' required form={form} xsHalf sx={tileSx} />
                        <F.InputText id='lastName' label='Last Name' required form={form} xsHalf sx={tileSx} />

                        <Divider sx={{ width: 1, mt: 1, mb: 2 }} />
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
                    </>
                ) : (
                    <>
                        <F.InputText id='firstName' label='First Name' required form={form} xsHalf sx={tileSx} />
                        {/* <F.InputText id='middleName' label='Middle Name' form={form} xsThird /> */}
                        <F.InputText id='lastName' label='Last Name' required form={form} xsHalf sx={tileSx} />
                    </>
                )}

                {/* <F.InputText label='Account Id' form={form} xsMax value={accountId}/> */}
            </F.PageFormDialog>

            {/* <AccountSelectionDialog show={accountsActive} onCloseFalse={setAccountsActive} onConfirm={onAccountConfirm} /> */}
        </>
    );
}
