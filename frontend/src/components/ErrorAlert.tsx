import {Alert} from '@mui/material';
import {useTranslation} from 'react-i18next';

import {makeError} from '../tslib/error';

interface ErrorAlertProps {
    error: Error | string | undefined | null;
}

export function ErrorAlert(props: ErrorAlertProps) {
    if (!props.error) return <></>;
    return <ErrorAlertBody {...props} />;
}

function ErrorAlertBody(props: ErrorAlertProps) {
    const [t] = useTranslation();

    if (props.error!.toString().search('Error:') !== -1) {
        let err = props.error!.toString().split(':');

        return (
            <Alert sx={{width: '75%', ml: 1, backgroundColor: 'transparent'}} severity='error'>
                {t(err[1])}
            </Alert>
        );
    }

    return (
        <Alert sx={{width: '75%', ml: 1, backgroundColor: 'transparent'}} severity='error'>
            {makeError(t(props.error as string)).toString()}
        </Alert>
    );
}
