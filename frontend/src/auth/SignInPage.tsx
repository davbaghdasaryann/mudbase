import * as React from 'react';

import {AuthProvider, SignInPage, SupportedAuthProvider, AuthResponse} from '@toolpad/core/SignInPage';
import * as F from 'tsui/Form';
import {signInWithEmail} from 'api/auth';
import { useTranslation } from 'react-i18next';

export default function MagicLinkAlertSignInPage() {
    const form = F.useInputForm();
    // const navigate = useNavigate();

    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [message, setMessage] = React.useState('');
    const emailRef = React.useRef('');
    const passwordRef = React.useRef('');
    const [t]=useTranslation();

    const handleSignIn = async () => {
        console.log(emailRef.current, passwordRef.current);
        const response = await signInWithEmail(emailRef.current, passwordRef.current);
        // if (response.success) {
        //     setMessage(response.success);
        //     navigate('/');
        // } else {
        //     setMessage(response.error || 'Sign-in failed.');
        // }
    };

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        //console.log("on submit")

        if (form.error) return;
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            return;
        }
        form.setBusy();

        console.log(evt.data);
        setEmail(evt.data.login);
        setPassword(evt.data.password);
        emailRef.current = evt.data.login;
        passwordRef.current = evt.data.password;
        handleSignIn();

        // const handleSignIn = async () => {
        //     const response = await signInWithEmail(email, password);
        //     if (response.success) {
        //         console.log(response.success);
        //     } else {
        //         console.log(response.error || "Sign-in failed.");
        //     }
        // };

        // AuthApi.login(evt.data)
        //     .then((sess) => {

        //         form.clearBusy()
        //         // navigate(props.return ?? '/');
        //         // navigate(props.return ?? "/admin")
        //     })
        //     .catch((err) => form.setError(err))
    }, []);
    // }, [])

    return (
        <F.PageForm title={t('Login')} onSubmit={onSubmit} form={form} size='sm'>
            <F.InputText label={t('Email')} id='login' autocomplete='username' validate='email' required form={form} xsMax />
            <F.InputText label={t('Password')} id='password' type='password' autocomplete='current-password' required validate='not-empty' form={form} xsMax />

            <F.InputCheckbox id='rememberMe' label={t('Remember Me')} value={false} data={false} form={form} xsMax />

            <F.SubmitButton label={t('Sign In')} form={form} xsMax />

            <F.NavigateLink label={t('Register new account')} href='/signup' form={form} xsMax mt={2} />
            <F.NavigateLink prefix='forgot' label={t('login or password?')} href='/forgot' form={form} xsMax size='sm' align='right' />
        </F.PageForm>
    );

    // return (
    //     <Box>
    //         <h2>Sign In</h2>
    //         <input
    //             type="email"
    //             placeholder="Enter email"
    //             value={email}
    //             onChange={(e) => setEmail(e.target.value)}
    //         />
    //         <input
    //             type="password"
    //             placeholder="Enter password"
    //             value={password}
    //             onChange={(e) => setPassword(e.target.value)}
    //         />
    //         <button onClick={handleSignIn}>Sign In</button>
    //         {message && <p>{message}</p>}
    //     </div>
    // );
}

// export default function MagicLinkAlertSignInPage() {
//     const theme = useTheme();
//     return (
//         <AppProvider theme={theme}>
//             <SignInPage signIn={signIn} providers={providers} slotProps={{emailField: {autoFocus: false}}} />
//         </AppProvider>
//     );
// }
