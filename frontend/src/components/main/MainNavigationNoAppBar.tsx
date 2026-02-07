import React from 'react';
import {usePathname} from 'next/navigation';

import {NavigationPageItem, type Navigation} from '@toolpad/core';

import {Box, ListItem, ListItemText, Collapse, List, ListItemButton, Drawer, ListItemIcon, Divider, useTheme, useMediaQuery, Stack} from '@mui/material';

import Link from 'next/link';

import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import DatasetIcon from '@mui/icons-material/Dataset';
import BusinessIcon from '@mui/icons-material/Business';

import {PageContentsProps} from '../PageContents';

import {useTranslation} from 'react-i18next';
import Env from '../../env';
import {usePermissions} from '../../api/auth';
import {isPathnameEqual} from '../../lib/urllib';
import ImgElement from '../../tsui/DomElements/ImgElement';
import {facebookUrl, instagramUrl, telegramUrl} from '@/theme';
import {useMobileDrawer} from './MobileDrawerContext';

export const drawerWidth = 300;
const listItemIconSize = 34;

export default function MainNavigationNoAppBar(props: PageContentsProps) {
    const theme = useTheme();
    const pathname = usePathname();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { open: mobileOpen, closeDrawer } = useMobileDrawer();

    const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

    React.useEffect(() => {
        if (isMobile) closeDrawer();
    }, [pathname, isMobile, closeDrawer]);

    const {nav} = useMainNavigation();

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
                return (
                    <ListItem sx={{px: 1, py: 0, overflowX: 'hidden'}}>
                        <ListItemButton selected={isPathnameEqual(pathname, href)} component={Link} href={href} onClick={isMobile ? closeDrawer : undefined} sx={{textDecoration: 'none', color: iconColor}}>
                            {item.icon && <ListItemIcon sx={{minWidth: listItemIconSize, mr: 1.2, color: iconColor}}>{item.icon}</ListItemIcon>}
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
                            <ListItemButton onClick={() => handleToggle(segment)} selected={isPathnameEqual(pathname, href)}>
                                {item.icon && <ListItemIcon sx={{minWidth: listItemIconSize, mr: 1.2}}>{item.icon}</ListItemIcon>}
                                <ListItemText primary={item.title} />
                                {openItems[segment] ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                        </ListItem>

                        <Collapse in={!!openItems[segment]} timeout='auto' unmountOnExit>
                            <List component='div' disablePadding sx={{mb: depth === 0 ? 4 : 1, pl: 2 * (depth + 1)}}>
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

            <List>{renderNavItems(nav, '', 0)}</List>

            <Stack component='nav' spacing={1.5} sx={{mb: 0.8, mt: 'auto', width: '100%'}}>
                <Divider />
                <Stack direction='row' justifyContent='center' alignItems='center' spacing={4} sx={{width: '100%'}}>
                    <Link href={facebookUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/facebook_nav_bar.svg' sx={{height: 25}} />
                    </Link>
                    <Link href={telegramUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/telegram_nav_bar.svg' sx={{height: 25}} />
                    </Link>
                    <Link href={instagramUrl} target='_blank' rel='noopener noreferrer'>
                        <ImgElement src='/images/icons/instagram_nav_bar.svg' sx={{height: 25}} />
                    </Link>
                </Stack>
            </Stack>
        </>
    );

    if (isMobile) {
        return (
            <Drawer
                variant='temporary'
                open={mobileOpen}
                onClose={closeDrawer}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', top: 0, left: 0 },
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
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', top: 0, left: 0, borderRight: 0 },
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

        navigation.push({
            segment: 'catalog',
            title: t('Catalogs'),
            icon: <ImgElement src='/images/icons/libraries.svg' sx={{height: 30}} />,
        });

        if (session?.user && permissionsSet?.has('EST_USE')) {
            navigation.push({segment: 'estimates', title: t('Estimates'), icon: <ImgElement src='/images/icons/estimates.svg' sx={{height: 30}} />});
        }

        if (session?.user && permissionsSet?.has('USR_FCH')) {
            navigation.push({segment: 'users', title: t('Users'), icon: <ImgElement src='/images/icons/users.svg' sx={{height: 30}} />});
        }

        navigation.push({segment: 'account', title: t('My Account'), icon: <ImgElement src='/images/icons/company.svg' sx={{height: 25}} />});

        if (session?.user && permissionsSet?.has('ACC_FCH')) {
            navigation.push({segment: 'accounts', title: t('Accounts'), icon: <BusinessIcon />});
        }

        if (Env.isDev) {
            navigation.push({kind: 'divider'});
            // navigation.push({segment: 'invites', title: t('Invites'), icon: <ContactMailIcon />});
            // navigation.push({segment: 'offers', title: t('Offers'), icon: <LocalOfferIcon />});
            navigation.push({segment: 'dev', title: 'Dev', icon: <DatasetIcon />});
            navigation.push({
                segment: 'analysis',
                title: t('Analysis'),
                icon: <AnalyticsIcon />,
                children: [
                    {segment: 'structural', title: t('Structural'), icon: <CleaningServicesIcon />},
                    {segment: 'comparative', title: t('Comparative'), icon: <CleaningServicesIcon />},
                ],
            });
        }

        setNav(navigation);
    }, [currentLanguage, session, permissionsSet]);

    return {nav};
}
