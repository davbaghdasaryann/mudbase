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
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function AppHeaderNoAppBar(props: PageContentsProps) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { openDrawer } = useMobileDrawer();
    const { session, permissionsSet } = usePermissions();

    // Map pathnames to icons (matching navigation)
    const getPageIcon = () => {
        if (pathname === '/analysis/structural') return <AccountTreeIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
        if (pathname === '/analysis/comparative') return <CompareArrowsIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
        if (pathname === '/analysis/chronological') return <TimelineIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;

        const currentPath = pathname?.split('/')[1]; // Get first segment after /

        switch (currentPath) {
            case '': // root path renders DashboardBuilderPage
            case 'dashboard':
            case 'dashboard-builder':
                return <DashboardIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
            case 'catalog':
                return <ImgElement src='/images/icons/libraries.svg' sx={{ height: 30, filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)' }} />;
            case 'estimates':
                return <ImgElement src='/images/icons/estimates.svg' sx={{ height: 30, filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)' }} />;
            case 'users':
                return <ImgElement src='/images/icons/users.svg' sx={{ height: 30, filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)' }} />;
            case 'account':
            case 'account_view':
                return <ImgElement src='/images/icons/company.svg' sx={{ height: 25, filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)' }} />;
            case 'accounts':
                return <BusinessIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
            case 'schedule':
                return <CalendarMonthIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
            case 'dev':
                return <DatasetIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
            case 'analysis':
                return <BarChartIcon sx={{ height: 30, width: 30, color: '#00ABBE' }} />;
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
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 4px 24px rgba(0, 171, 190, 0.10), inset 0 -1px 0 rgba(0, 171, 190, 0.18)',
            }}
        >
            <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{
                    height: { xs: 56, md: 64 },
                    px: { xs: 1.5, sm: 2, md: 3 },
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
                                color: '#00ABBE',
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
                {/* <AppThemeSwitcher /> */}
                <AppHeaderAccount {...props} />
            </Stack>
        </Box>
    );
}
