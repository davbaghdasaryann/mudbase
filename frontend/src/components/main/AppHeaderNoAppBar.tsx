import {Typography, Stack} from '@mui/material';

import {useTranslation} from 'react-i18next';

import {PageContentsProps} from '../PageContents';
import AppThemeSwitcher from './AppThemeSwitcher';
import AppHeaderAccount from './AppHeaderAccount';
import AppLangSelector from './AppLangSelector';
import Env from '../../env';

export default function AppHeaderNoAppBar(props: PageContentsProps) {

    return (
        <Stack
            direction='row'
            sx={{
                position: 'absolute',
                top: 16,
                right: 40,
                left: 0,
                height: 40,
                // pr: 4,
                // width: '100%',
            }}
        >

            <Typography variant='body2' sx={{flexGrow: 1}}>
                &nbsp;
            </Typography>

            {Env.isDev && <AppLangSelector />}
            {Env.isDev && <AppThemeSwitcher />}
            <AppHeaderAccount {...props} />
        </Stack>
    );
}
