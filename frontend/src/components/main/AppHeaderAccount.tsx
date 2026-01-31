import React from 'react';

import {Button, Divider, MenuList, Stack, Typography} from '@mui/material';

import {useSession} from 'next-auth/react';

import {useRouter} from 'next/navigation';

import {Account, AccountPopoverFooter, AccountPreview, SignOutButton} from '@toolpad/core';
import {AuthenticationContext, SessionContext, Session} from '@toolpad/core/AppProvider';

import Logout from '@mui/icons-material/Logout';

import {PageContentsProps} from '../PageContents';
import {authSignOut, usePermissions} from '../../api/auth';

import {useTranslation} from 'react-i18next';

export default function AppHeaderAccount(props: PageContentsProps) {
    if (props.type === 'auth' || props.type === 'public') return <></>;
    return <AppHeaderAccountBody {...props} />;
}

function AppHeaderAccountBody(props: PageContentsProps) {
    // const {data: session} = useSession();
    const {session, status, permissionsSet} = usePermissions();

    const router = useRouter();
    const [t] = useTranslation();

    const authentication = React.useMemo(() => {
        return {
            signIn: () => {
                router.replace('/login');
            },
            signOut: () => {
                authSignOut();
            },
        };
    }, []);

    // console.log(session?.user);

    // const handleProfileNameChange = (user: Api.ApiUser) => {
    //     if (session) {
    //         console.log(user);
    //         let name = user.firstName!;
    //         let newSession = {...session};
    //         newSession.user.name = "aa";
    //         update(newSession);

    //         //update({ ...session, user: { ...session.user, name } });
    //     }

    //     setForceRender((prev) => prev + 1);
    // };

    // React.useEffect(() => {

    //     GD.pubsub_.addListener(GD.profileNameUpdateListenerId, handleProfileNameChange);

    //     return () => {
    //         GD.pubsub_.removeListener(GD.profileNameUpdateListenerId, handleProfileNameChange);
    //     };

    // }, []);

    const initials = initialsFromName(session?.user?.name);

    return (
        <AuthenticationContext.Provider value={authentication}>
            <SessionContext.Provider value={session}>
                <Account
                    // key={forceRender}
                    localeText={{
                        accountSignOutLabel: t('Sign Out'),
                    }}
                    slots={{
                        popoverContent: CustomMenu,
                    }}
                    slotProps={{
                        preview: {
                            slotProps: {
                                avatarIconButton: {
                                    sx: {
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                        },
                                    },
                                },
                                avatar: {
                                    children: initials || undefined,
                                    sx: {
                                        bgcolor: (theme) => theme.palette.primary.main,
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        border: (theme) =>
                                            `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                                    },
                                },
                            },
                        },

                        popover: {
                            slotProps: {
                                paper: {
                                    sx: {
                                        borderRadius: 2,
                                        mt: 1,
                                        boxShadow: (theme) =>
                                            theme.palette.mode === 'dark'
                                                ? '0 8px 24px rgba(0, 0, 0, 0.5)'
                                                : '0 8px 24px rgba(0, 0, 0, 0.12)',
                                    },
                                },
                            },
                        },

                        signInButton: {
                            color: 'success',
                        },

                        signOutButton: {
                            startIcon: <Logout />,
                        },
                    }}
                />
            </SessionContext.Provider>
        </AuthenticationContext.Provider>
    );
}

function initialsFromName(name: string | null | undefined) {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }

function CustomMenu() {
    // const handleSignOut = React.useCallback(() => {}, []);
    const router = useRouter();
    const [t] = useTranslation();

    return (
        <Stack direction='column'>
            <AccountPreview variant='expanded' />

            <Divider />
            {/* <Typography variant='body2' mx={2} mt={1}>
                Accounts
            </Typography> */}

            <Button
                variant='text'
                sx={{textTransform: 'uppercase', display: 'flex', mx: 'auto'}}
                // size='small'
                // startIcon={<AddIcon />}
                // disableElevation
                onClick={() => {
                    router.replace('/profile/');
                }}
            >
                {t('Profile')}
            </Button>

            {/* <MenuList>
                {accounts.map((account) => (
                    <MenuItem
                        key={account.id}
                        component='button'
                        sx={{
                            justifyContent: 'flex-start',
                            width: '100%',
                            columnGap: 2,
                        }}
                    >
                        <ListItemIcon>
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: '0.95rem',
                                    bgcolor: account.color,
                                }}
                                src={account.image ?? ''}
                                alt={account.name ?? ''}
                            >
                                {account.name[0]}
                            </Avatar>
                        </ListItemIcon>
                        <ListItemText
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                width: '100%',
                            }}
                            primary={account.name}
                            secondary={account.email}
                            primaryTypographyProps={{variant: 'body2'}}
                            secondaryTypographyProps={{variant: 'caption'}}
                        />
                    </MenuItem>
                ))}
                <Divider />
                <Button
                    variant='text'
                    sx={{textTransform: 'capitalize', display: 'flex', mx: 'auto'}}
                    size='small'
                    startIcon={<AddIcon />}
                    disableElevation
                >
                    Add new
                </Button>
            </MenuList> */}

            <Divider />

            <AccountPopoverFooter>
                <SignOutButton variant='text' />
            </AccountPopoverFooter>
        </Stack>
    );
}
