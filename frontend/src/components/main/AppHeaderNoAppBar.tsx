import { Typography, Stack, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

import { PageContentsProps } from '../PageContents';
import AppThemeSwitcher from './AppThemeSwitcher';
import AppHeaderAccount from './AppHeaderAccount';
import AppLangSelector from './AppLangSelector';
import Env from '../../env';
import ImgElement from '../../tsui/DomElements/ImgElement';
import { usePermissions } from '../../api/auth';
import { useMobileDrawer } from './MobileDrawerContext';

import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import DatasetIcon from '@mui/icons-material/Dataset';
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function AppHeaderNoAppBar(props: PageContentsProps) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { openDrawer } = useMobileDrawer();
    const { session, permissionsSet } = usePermissions();

    // Map pathnames to icons (matching navigation)
    const getPageIcon = () => {
        const currentPath = pathname?.split('/')[1]; // Get first segment after /

        switch (currentPath) {
            case 'dashboard':
                return <DashboardIcon sx={{ height: 30, width: 30 }} />;
            case 'catalog':
                return <ImgElement src='/images/icons/libraries.svg' sx={{ height: 30 }} />;
            case 'estimates':
                return <ImgElement src='/images/icons/estimates.svg' sx={{ height: 30 }} />;
            case 'users':
                return <ImgElement src='/images/icons/users.svg' sx={{ height: 30 }} />;
            case 'account':
            case 'account_view':
                return <ImgElement src='/images/icons/company.svg' sx={{ height: 25 }} />;
            case 'accounts':
                return <BusinessIcon sx={{ height: 30, width: 30 }} />;
            case 'dev':
                return <DatasetIcon sx={{ height: 30, width: 30 }} />;
            case 'analysis':
                return <AnalyticsIcon sx={{ height: 30, width: 30 }} />;
            default:
                return null;
        }
    };

    const pageIcon = getPageIcon();

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
                    height: { xs: 56, md: 64 },
                    px: { xs: 1.5, sm: 2, md: 3 },
                    backgroundColor: 'transparent',
                }}
            >
                {isMobile && (
                    <IconButton color='inherit' aria-label='open menu' onClick={openDrawer} sx={{ mr: 0.5 }}>
                        <MenuIcon />
                    </IconButton>
                )}
                {props.title && (
                    <Stack direction='row' alignItems='center' spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                        {pageIcon && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {pageIcon}
                            </Box>
                        )}
                        <Typography
                            variant='h6'
                            sx={{
                                fontWeight: 600,
                                color: (theme) => theme.palette.text.primary,
                                letterSpacing: '0.02em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {t(props.title)}
                        </Typography>
                    </Stack>
                )}
                {!props.title && <Box sx={{ flexGrow: 1 }} />}

                <AppLangSelector />
                <AppThemeSwitcher />
                <AppHeaderAccount {...props} />
            </Stack>
        </Box>
    );
}
