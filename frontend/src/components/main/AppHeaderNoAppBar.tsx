import {Typography, Stack, Box} from '@mui/material';

import {useTranslation} from 'react-i18next';

import {PageContentsProps} from '../PageContents';
import AppThemeSwitcher from './AppThemeSwitcher';
import AppHeaderAccount from './AppHeaderAccount';
import AppLangSelector from './AppLangSelector';
import Env from '../../env';

export default function AppHeaderNoAppBar(props: PageContentsProps) {
    const {t} = useTranslation();

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                zIndex: 1100,
            }}
        >
            <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{
                    height: 64,
                    px: 3,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'rgba(18, 18, 18, 0.8)'
                            : 'rgba(255, 255, 255, 0.8)',
                    borderBottom: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                    boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                            ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                            : '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
            >
                {props.title && (
                    <Typography
                        variant='h6'
                        sx={{
                            flexGrow: 1,
                            fontWeight: 600,
                            color: (theme) => theme.palette.text.primary,
                            letterSpacing: '0.02em',
                        }}
                    >
                        {t(props.title)}
                    </Typography>
                )}
                {!props.title && <Box sx={{ flexGrow: 1 }} />}

                <AppLangSelector />
                <AppThemeSwitcher />
                <AppHeaderAccount {...props} />
            </Stack>
        </Box>
    );
}
