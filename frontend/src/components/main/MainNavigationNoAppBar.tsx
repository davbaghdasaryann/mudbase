import React from 'react';
import {usePathname} from 'next/navigation';

import {NavigationPageItem, type Navigation} from '@toolpad/core';

import {Box, ListItem, ListItemText, Collapse, List, ListItemButton, Drawer, ListItemIcon, Divider, useTheme, useMediaQuery, Stack, Tooltip} from '@mui/material';

import Link from 'next/link';

import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

import BarChartIcon from '@mui/icons-material/BarChart';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import DatasetIcon from '@mui/icons-material/Dataset';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

import {PageContentsProps} from '../PageContents';

import {useTranslation} from 'react-i18next';
import Env from '../../env';
import {usePermissions} from '../../api/auth';
import {isPathnameEqual} from '../../lib/urllib';
import ImgElement from '../../tsui/DomElements/ImgElement';
import {facebookUrl, instagramUrl, telegramUrl, youtubeChannelUrl} from '@/theme';
import {useMobileDrawer} from './MobileDrawerContext';

export const drawerWidth = 300;
const listItemIconSize = 34;

export default function MainNavigationNoAppBar(props: PageContentsProps) {
    const theme = useTheme();
    const pathname = usePathname();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { open: mobileOpen, closeDrawer } = useMobileDrawer();
    const { t } = useTranslation();

    const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (isMobile) closeDrawer();
    }, [pathname, isMobile, closeDrawer]);

    // Auto-open any accordion whose child path matches the current pathname.
    // Never auto-close — only manual toggle closes it.
    React.useEffect(() => {
        if (pathname.startsWith('/analysis/')) {
            setOpenItems(prev => prev['analysis'] ? prev : { ...prev, analysis: true });
        }
        if (pathname.startsWith('/settings/')) {
            setOpenItems(prev => prev['settings'] ? prev : { ...prev, settings: true });
        }
    }, [pathname]);

    const {nav} = useMainNavigation();
    const { permissionsSet } = usePermissions();
    const isSuperAdmin = permissionsSet?.has('ALL') || permissionsSet?.has('USR_FCH_ALL') || permissionsSet?.has('ACC_FCH');

    const [iconColor, setIconColor] = React.useState(theme.palette.mode === 'dark' ? 'white' : 'black');

    React.useEffect(() => {
        setIconColor(theme.palette.mode === 'dark' ? 'white' : 'black');
    }, [theme]);

    const handleToggle = React.useCallback((segment: string) => {
        setOpenItems((prev) => ({...prev, [segment]: !prev[segment]}));
    }, []);

    const renderNavItems = React.useCallback(
        (items: Navigation, path: string, depth: number) => {
            const renderPageItem = (item: NavigationPageItem, path: string, depth: number) => {
                const segment = item.segment!;
                const href = `${path}/${segment}`;
                const isActive = isPathnameEqual(pathname, href);

                // Visually disabled with "Coming soon" tooltip — page/route still exists
                if (segment === 'schedule') {
                    return (
                        <ListItem sx={{ px: 1, py: 0, overflowX: 'hidden' }}>
                            <ListItemButton
                                disableRipple
                                sx={{
                                    opacity: 0.38,
                                    cursor: 'default',
                                    borderRadius: 1,
                                    color: iconColor,
                                    '& .MuiListItemIcon-root': { color: iconColor },
                                    '&:hover': { backgroundColor: 'transparent' },
                                }}
                            >
                                {item.icon && <ListItemIcon sx={{ minWidth: listItemIconSize, mr: 1.2 }}>{item.icon}</ListItemIcon>}
                                <ListItemText
                                    primary={
                                        <Tooltip
                                            title={t('Coming soon')}
                                            placement='right'
                                            slotProps={{
                                                popper: { sx: { zIndex: 2000 } },
                                                tooltip: {
                                                    sx: {
                                                        backgroundColor: 'rgba(0,171,190,0.12)',
                                                        backdropFilter: 'blur(8px)',
                                                        color: '#00ABBE',
                                                        border: '1px solid rgba(0,171,190,0.25)',
                                                        borderRadius: '20px',
                                                        fontSize: '0.72rem',
                                                        px: 1.5,
                                                        py: 0.4,
                                                        boxShadow: 'none',
                                                    },
                                                },
                                            }}
                                        >
                                            <Box component='span' sx={{ display: 'inline-block' }}>{item.title}</Box>
                                        </Tooltip>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                }

                const handleClick = (e: React.MouseEvent) => {
                    if (isActive) {
                        // Already on this page — force full reload to reset to initial state
                        e.preventDefault();
                        window.location.href = href;
                        return;
                    }
                    if (isMobile) closeDrawer();
                };

                return (
                    <ListItem sx={{px: 1, py: 0, overflowX: 'hidden'}}>
                        <ListItemButton
                            selected={isActive}
                            component={Link}
                            href={href}
                            onClick={handleClick}
                            sx={{
                                textDecoration: 'none',
                                color: iconColor,
                                // Force icon container and SVG icons to be black at rest
                                '& .MuiListItemIcon-root': { color: iconColor },
                                '& .MuiSvgIcon-root': { color: iconColor },
                                // Active state: teal text, icon, svg, and img
                                '&.Mui-selected': { backgroundColor: 'transparent', color: '#00abbe' },
                                '&.Mui-selected .MuiListItemIcon-root': { color: '#00abbe' },
                                '&.Mui-selected .MuiSvgIcon-root': { color: '#00abbe' },
                                '&.Mui-selected img': { filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)' },
                                '&.Mui-selected:hover': { backgroundColor: 'rgba(0, 171, 190, 0.08)' },
                            }}
                        >
                            {item.icon && <ListItemIcon sx={{minWidth: listItemIconSize, mr: 1.2}}>{item.icon}</ListItemIcon>}
                            <ListItemText primary={item.title} />
                        </ListItemButton>
                    </ListItem>
                );
            };

            const renderPageItemChildren = (item: NavigationPageItem, path: string, depth: number) => {
                const segment = item.segment!;
                const href = `${path}/${segment}`;
                return (
                    <>
                        <ListItem sx={{px: 1, py: 0, overflowX: 'hidden'}}>
                            <ListItemButton
                                onClick={() => handleToggle(segment)}
                                selected={isPathnameEqual(pathname, href)}
                                sx={{
                                    color: iconColor,
                                    '& .MuiListItemIcon-root': { color: iconColor },
                                    '& .MuiSvgIcon-root': { color: iconColor },
                                    '&.Mui-selected': { backgroundColor: 'transparent', color: '#00abbe' },
                                    '&.Mui-selected .MuiListItemIcon-root': { color: '#00abbe' },
                                    '&.Mui-selected .MuiSvgIcon-root': { color: '#00abbe' },
                                    '&.Mui-selected:hover': { backgroundColor: 'rgba(0, 171, 190, 0.08)' },
                                }}
                            >
                                {item.icon && <ListItemIcon sx={{minWidth: listItemIconSize, mr: 1.2}}>{item.icon}</ListItemIcon>}
                                <ListItemText primary={item.title} />
                                {openItems[segment] ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>

                        <Collapse in={!!openItems[segment]} timeout='auto' unmountOnExit>
                            <List component='div' disablePadding sx={{mb: 1, pl: 2 * (depth + 1)}}>
                                {renderNavItems(item.children!, href, depth + 1)}
                            </List>
                        </Collapse>
                    </>
                );
            };

            return items.map((item, index) => {
                if (item.kind === 'page' || item.kind === undefined) {
                    return (
                        <React.Fragment key={`${depth}-${index}`}>
                            {item.children ? renderPageItemChildren(item, path, depth) : renderPageItem(item, path, depth)}
                        </React.Fragment>
                    );
                }

                if (item.kind === 'divider') {
                    return <Divider key={`${depth}-${index}`} />;
                }

                return <React.Fragment key={`${depth}-${index}`} />;
            });
        },
        [iconColor, pathname, openItems, handleToggle, isMobile, closeDrawer]
    );

    const drawerContent = (
        <>
            <Link href='/' onClick={isMobile ? closeDrawer : undefined}>
                <Box sx={{p: 2, cursor: 'pointer'}}>
                    <ImgElement src='/images/mudbase_header_title.svg' sx={{ml: 1, height: 30}} />
                </Box>
            </Link>

            <List sx={{ pb: 0 }}>{renderNavItems(nav, '', 0)}</List>

            <List sx={{ px: 1, pt: 0, pb: 0 }}>
                {([
                    { labelKey: 'Guide', icon: <AutoStoriesOutlinedIcon /> },
                    ...(!isSuperAdmin ? [
                        { labelKey: 'Packages', icon: <Inventory2OutlinedIcon /> },
                        { labelKey: 'Risk Monitoring', icon: <MonitorHeartOutlinedIcon /> },
                    ] : []),
                ] as { labelKey: string; icon: React.ReactNode }[]).map((item) => (
                    <ListItem key={item.labelKey} sx={{ px: 0, py: 0 }}>
                        <ListItemButton
                            disableRipple
                            sx={{
                                opacity: 0.38,
                                cursor: 'default',
                                borderRadius: 1,
                                color: iconColor,
                                '& .MuiListItemIcon-root': { color: iconColor },
                                '&:hover': { backgroundColor: 'transparent' },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: listItemIconSize, mr: 1.2 }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={
                                    <Tooltip
                                        title={t('Coming soon')}
                                        placement='right'
                                        slotProps={{
                                            popper: { sx: { zIndex: 2000 } },
                                            tooltip: {
                                                sx: {
                                                    backgroundColor: 'rgba(0,171,190,0.12)',
                                                    backdropFilter: 'blur(8px)',
                                                    color: '#00ABBE',
                                                    border: '1px solid rgba(0,171,190,0.25)',
                                                    borderRadius: '20px',
                                                    fontSize: '0.72rem',
                                                    px: 1.5,
                                                    py: 0.4,
                                                    boxShadow: 'none',
                                                },
                                            },
                                        }}
                                    >
                                        <Box component='span' sx={{ display: 'inline-block' }}>{t(item.labelKey)}</Box>
                                    </Tooltip>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Stack component='nav' spacing={1.5} sx={{mb: 0.8, mt: 'auto', width: '100%'}}>
                <Divider />
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={4} sx={{width: '100%'}}>
                    <Link href={facebookUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/facebook_nav_bar.svg' sx={{height: 25, transition: 'filter 0.2s', filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)', '&:hover': {filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(75%) contrast(103%)'}}} />
                    </Link>
                    <Link href={telegramUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/telegram_nav_bar.svg' sx={{height: 25, transition: 'filter 0.2s', filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)', '&:hover': {filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(75%) contrast(103%)'}}} />
                    </Link>
                    <Link href={instagramUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/instagram_nav_bar.svg' sx={{height: 25, transition: 'filter 0.2s', filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)', '&:hover': {filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(75%) contrast(103%)'}}} />
                    </Link>
                    <Link href={youtubeChannelUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/youtube_nav_bar.svg' sx={{height: 25, transition: 'filter 0.2s', filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(91%) contrast(103%)', '&:hover': {filter: 'brightness(0) saturate(100%) invert(56%) sepia(63%) saturate(1127%) hue-rotate(149deg) brightness(75%) contrast(103%)'}}} />
                    </Link>
                </Stack>
            </Stack>
        </>
    );

    const drawerPaperGlass = {
        background: '#ffffff',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '2px 0 20px rgba(0,171,190,0.08)',
        borderRight: 0,
    };

    if (isMobile) {
        return (
            <Drawer
                variant='temporary'
                open={mobileOpen}
                onClose={closeDrawer}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', top: 0, left: 0, ...drawerPaperGlass },
                }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer
            variant='permanent'
            sx={{
                display: { xs: 'none', md: 'block' },
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', top: 0, left: 0, ...drawerPaperGlass },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}

function useMainNavigation() {
    const [nav, setNav] = React.useState<Navigation>([]);
    const {t, i18n} = useTranslation();
    const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
    const {session, permissionsSet} = usePermissions();

    React.useEffect(() => {
        const onLang = (lng: string) => setCurrentLanguage(lng);
        i18n.on('languageChanged', onLang);
        return () => i18n.off('languageChanged', onLang);
    }, [i18n]);

    React.useEffect(() => {
        const navigation: Navigation = [];

        // Check if user is superadmin based on admin-specific permissions
        const isSuperAdmin = session?.user && (
            permissionsSet?.has('ALL') ||
            permissionsSet?.has('USR_FCH_ALL') ||
            permissionsSet?.has('ACC_FCH')
        );

        // Superadmin sees old dashboard with system stats
        if (isSuperAdmin) {
            navigation.push({segment: 'dashboard', title: t('Dashboard'), icon: <DashboardIcon />});
        }
        // Regular users see widget builder
        else if (session?.user) {
            navigation.push({segment: 'dashboard-builder', title: t('Dashboard'), icon: <DashboardIcon />});
        }

        navigation.push({segment: 'schedule', title: t('Schedule'), icon: <CalendarMonthIcon />});

        navigation.push({
            segment: 'catalog',
            title: t('Catalogs'),
            icon: <ImgElement src='/images/icons/libraries.svg' sx={{height: 30}} />,
        });

        if (session?.user && permissionsSet?.has('EST_USE')) {
            navigation.push({segment: 'estimates', title: t('Estimates'), icon: <ImgElement src='/images/icons/estimates.svg' sx={{height: 30}} />});
            navigation.push({
                segment: 'analysis',
                title: t('Analytics'),
                icon: <BarChartIcon />,
                children: [
                    {segment: 'structural', title: t('Structural'), icon: <AccountTreeIcon />},
                    {segment: 'comparative', title: t('Comparative'), icon: <CompareArrowsIcon />},
                    {segment: 'chronological', title: t('Chronological'), icon: <TimelineIcon />},
                ],
            });
        }

        if (isSuperAdmin) {
            navigation.push({segment: 'admin-estimates', title: t('All Estimations'), icon: <ImgElement src='/images/icons/estimates.svg' sx={{height: 30}} />});
        }

        if (session?.user && permissionsSet?.has('USR_FCH')) {
            navigation.push({segment: 'users', title: t('Users'), icon: <ImgElement src='/images/icons/users.svg' sx={{height: 30}} />});
        }

        navigation.push({segment: 'account', title: t('My Company'), icon: <BusinessOutlinedIcon /> });

        if (session?.user && permissionsSet?.has('ACC_FCH')) {
            navigation.push({segment: 'accounts', title: t('Accounts'), icon: <SupervisorAccountOutlinedIcon />});
        }

        if (isSuperAdmin) {
            navigation.push({
                segment: 'settings',
                title: t('Settings'),
                icon: <SettingsOutlinedIcon />,
                children: [
                    { segment: 'packages', title: t('Packages'), icon: <Inventory2OutlinedIcon /> },
                    { segment: 'payments', title: t('Payments'), icon: <PaymentsOutlinedIcon /> },
                ],
            });
        }

        if (Env.isDev) {
            navigation.push({kind: 'divider'});
            // navigation.push({segment: 'invites', title: t('Invites'), icon: <ContactMailIcon />});
            // navigation.push({segment: 'offers', title: t('Offers'), icon: <LocalOfferIcon />});
            navigation.push({segment: 'dev', title: 'Dev', icon: <DatasetIcon />});
        }

        setNav(navigation);
    }, [currentLanguage, session, permissionsSet]);

    return {nav};
}
