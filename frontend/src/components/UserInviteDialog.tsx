import React from 'react';
import * as F from 'tsui/Form';
import * as Api from 'api';
import AccountSelectionDialog from './AccountSelectionDialog';
import {useSession} from 'next-auth/react';
import {usePermissions} from '../api/auth';
import {
    Box,
    Button,
    ToggleButton,
    ToggleButtonGroup,
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

                        <Box sx={{ mt: 2, borderRadius: '10px', bgcolor: 'rgba(0,171,190,0.03)', p: 2, width: 1 }}>
                            <Typography sx={{ fontSize: '0.70rem', letterSpacing: '0.06em', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600, mb: 1.5 }}>
                                {t('Permissions')}
                            </Typography>
                            {allowedPages.map((page) => {
                                const Icon = pageIcons[page.id];
                                const isBeta = page.id === 'costing' || page.id === 'analytics';
                                return (
                                    <Box key={page.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2, '&:not(:last-child)': { borderBottom: '1px solid rgba(0,0,0,0.05)' } }}>
                                        <Box sx={{ width: 34, height: 34, borderRadius: '8px', backgroundColor: 'rgba(0,171,190,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {Icon && <Icon sx={{ fontSize: 17, color: BRAND }} />}
                                        </Box>
                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary', flex: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {t(page.name)}
                                            {isBeta && <Box component='span' sx={{ fontSize: '0.70rem', fontWeight: 600, color: BRAND, lineHeight: 1 }}>β</Box>}
                                        </Typography>
                                        {page.allowedPermission === 'viewOnly' ? (
                                            <Box sx={{ px: 1.5, py: 0.4, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.05)', fontSize: '0.75rem', color: 'text.disabled', fontWeight: 500 }}>
                                                {t('View')}
                                            </Box>
                                        ) : (
                                            <ToggleButtonGroup
                                                value={pagePermissions[page.id] ?? 'view'}
                                                exclusive
                                                onChange={(_, v) => v && handlePermissionChange(page.id, v as RadioPermissionChoice)}
                                                size='small'
                                                sx={{
                                                    '& .MuiToggleButton-root': {
                                                        border: '1px solid #e5e7eb',
                                                        px: 1.5, py: 0.3,
                                                        fontSize: '0.75rem', fontWeight: 500,
                                                        color: 'text.secondary', textTransform: 'none',
                                                        '&:first-of-type': { borderRadius: '6px 0 0 6px' },
                                                        '&:last-of-type': { borderRadius: '0 6px 6px 0' },
                                                        '&.Mui-selected': {
                                                            backgroundColor: BRAND, color: '#fff', borderColor: BRAND,
                                                            '&:hover': { backgroundColor: '#009aaa' },
                                                        },
                                                    },
                                                }}
                                            >
                                                <ToggleButton value='view'>{t('View')}</ToggleButton>
                                                <ToggleButton value='edit'>{t('Edit')}</ToggleButton>
                                            </ToggleButtonGroup>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
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
