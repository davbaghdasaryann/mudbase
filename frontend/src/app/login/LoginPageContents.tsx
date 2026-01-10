'use client';

import * as React from 'react';
import { Box, Button, IconButton, InputAdornment, Link, Typography } from '@mui/material';

import { useRouter } from 'next/navigation';
import { AuthProvider, SignInPage, SupportedAuthProvider, AuthResponse } from '@toolpad/core/SignInPage';
import * as Api from 'api';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { signInWithEmail } from '../../api/auth';
import { useTranslation } from 'react-i18next';
import { dialogPaperBorder, mainPrimaryColor, toolpadTextFieldSx } from '../../theme';

export default function LoginPageContents() {
    const router = useRouter();
    const [t] = useTranslation();
    const navigatePageUrlRef = React.useRef<string | null>(null);
    const lsKeysToRemove = ['selectedTab', 'selectedAccountsTab', 'selectedCatalogTab', 'selectedUserTab', 'selectedEstimateTab'];

    const [showPassword, setShowPassword] = React.useState(false);

    const handleTogglePasswordVisibility = React.useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);


    const processSignIn = React.useCallback((provider: AuthProvider, formData?: any, callbackUrl?: string): Promise<AuthResponse> => {
        const handleSignInSuccess = () => {
            if (navigatePageUrlRef.current) {
                router.replace(navigatePageUrlRef.current);
            } else if (callbackUrl) {
                lsKeysToRemove.forEach((key) => localStorage.removeItem(key));
                router.replace(callbackUrl);
            }
        };

        const promise = new Promise<AuthResponse>((resolve, reject) => {
            // console.log(provider);
            // console.log(callbackUrl);
            // console.log(formData.get("email"));
            // console.log(formData.get("password"));

            setTimeout(() => {
                if (provider.id === 'credentials') {
                    let email = formData.get('email');
                    let password = formData.get('password');

                    Api.requestPublic({
                        command: 'user/has_account',
                        args: { email: email },
                    }).then((res: any) => {
                        if (!res.hasAccount) {
                            navigatePageUrlRef.current = '/signup_company';
                        } else if (!res.isAccountActive) {
                            navigatePageUrlRef.current = null;
                            resolve({ error: 'Your account has not been activated by the Super Admin yet' });
                            return;
                        } else {
                            navigatePageUrlRef.current = null;
                        }
                    });

                    signInWithEmail(email, password).then((res) => {
                        console.log('response', res);

                        if (!res?.ok) {
                            resolve({ error: t('Invalid login') });
                            return;
                        }

                        resolve({
                            success: 'Sign In Success!!',
                        });
                        handleSignInSuccess();
                    });
                }

                // console.log(`Sign in with ${provider.id}`);
                // resolve({
                //     success: 'Check your email for a verification link.',
                // });
            }, 500);
        });
        return promise;
    }, []);

                    // title: () => <Typography variant='h5'>{t('Login to Mudbase')}</Typography>,
                    // subtitle: () => <Typography variant='h6'>&nbsp;</Typography>,

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                '& .MuiContainer-root': {
                    maxWidth: '800px !important', // Adjust width as needed
                    width: '100%',
                },

                // '& > .MuiBox-root > .MuiContainer-root > .MuiBox-root': {
                //     border: dialogPaperBorder, // Adjust the border style as needed
                // },
                '& .MuiContainer-root > .MuiStack-root': {
                    border: dialogPaperBorder, // Adjust the border style as needed
                },
            }}
        >
            <SignInPage
                signIn={processSignIn}
                providers={providers}

                slots={{
                    forgotPasswordLink: () => <Link href='/auth/password_recovery'>{t('Forgot password?')}</Link>,
                    signUpLink: () => <Link href='/signup'>{t('Sign Up')}</Link>,
                }}
                slotProps={{
                    emailField: {
                        autoFocus: true,
                        sx: toolpadTextFieldSx,
                    },
                    passwordField: {
                        type: showPassword ? 'text' : 'password',
                        sx: toolpadTextFieldSx,
                        InputProps: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleTogglePasswordVisibility} edge="end">
                                        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                    },

                    submitButton: {
                        sx: {
                            backgroundColor: mainPrimaryColor,
                            border: 'none',
                            color: 'white',
                            my: 2,
                        }
                    },
                }}
                localeText={{
                    providerSignInTitle: () => t("Login to Mudbase"),
                    signInTitle: t('Login'),
                    signInSubtitle: undefined,
                    email: t('Email'),
                    password: t('Password'),
                    signInRememberMe: t('Remember Me'),
                }}
                sx={{
                    minWidth: 500,
                }}
            />
        </Box>
    );
}

const providers: { id: SupportedAuthProvider; name: string }[] = [
    { id: 'credentials', name: 'Email and Password' },
    // {id: 'google', name: 'Google'},
    // {id: 'apple', name: 'Apple'},
    // {id: 'facebook', name: 'Facebook'},
    // { id: 'passkey', name: 'Passkey'},
];
