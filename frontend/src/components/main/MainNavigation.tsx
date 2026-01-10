import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { NavigationItem, NavigationPageItem, type Navigation } from '@toolpad/core';

import { Toolbar, Typography, Box, ListItem, ListItemText, Collapse, List, ListItemButton, Drawer, ListItemIcon, Divider } from '@mui/material';

import Link from 'next/link';

import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ScienceIcon from '@mui/icons-material/Science';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import MailLockIcon from '@mui/icons-material/MailLock';
import DatasetIcon from '@mui/icons-material/Dataset';
import CalculateIcon from '@mui/icons-material/Calculate';
import HandymanIcon from '@mui/icons-material/Handyman';
import BusinessIcon from '@mui/icons-material/Business';
import { PageContentsProps } from '../PageContents';

import { useTranslation } from 'react-i18next';
import Env from '../../env';
import { usePermissions } from '../../api/auth';
import { isPathnameEqual } from '../../lib/urllib';
import { mainNavigationDrawerWidth } from '@/theme';

const listItemIconSize = 34;

export default function MainNavigation(props: PageContentsProps) {
    const pathname = usePathname();

    const [openItems, setOpenItems] = React.useState({});

    const { nav } = useMainNavigation();

    const handleToggle = React.useCallback((text) => {
        setOpenItems((prev) => ({ ...prev, [text]: !prev[text] }));
    }, []);

    const renderNavItems = React.useCallback((items: Navigation, path: string, depth: number) => {

        const renderPageItem = (item: NavigationPageItem, path: string, depth: number) => {
            let href = `${path}/${item.segment}`;

            return (
                <ListItem
                    sx={{
                        px: 1,
                        py: 0,
                        overflowX: 'hidden',
                    }}
                >
                    {/* <Link key={href} href={href} passHref> */}
                    <ListItemButton
                        selected={isPathnameEqual(pathname, href)}
                        component={Link}
                        href={href}
                        sx={{
                            textDecoration: 'none',
                            color: 'inherit',
                            // '&:hover': {
                            //     backgroundColor: 'rgba(112, 83, 83, 0.08)', // optional hover effect
                            // },
                        }}
                    >
                        {item.icon && (
                            <ListItemIcon
                                sx={{
                                    minWidth: listItemIconSize,
                                    mr: 1.2,
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                        )}
{/* 
                        <Textfit mode='single'>
                            {' '} */}
                            <ListItemText primary={item.title} />
                        {/* </Textfit> */}
                    </ListItemButton>
                    {/* </Link> */}
                </ListItem>
            );
        };

        const renderPageItemChildren = (item: NavigationPageItem, path: string, depth: number) => {
            return (
                <>
                    <ListItem
                        sx={{
                            px: 1,
                            py: 0,
                            overflowX: 'hidden',
                        }}
                    >
                        <ListItemButton onClick={() => handleToggle(item.title)} selected={pathname === `${path}/${item.segment}`}>
                            {item.icon && (
                                <ListItemIcon
                                    sx={{
                                        minWidth: listItemIconSize,
                                        mr: 1.2,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                            )}

                            <ListItemText primary={item.title} />
                            {openItems[item.title!] ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                    </ListItem>
                    <Collapse in={openItems[item.title!]} timeout='auto' unmountOnExit>
                        <List component='div' disablePadding sx={{ mb: depth === 0 ? 4 : 1, pl: 2 * (depth + 1) }}>
                            {renderNavItems(item.children!, `${path}/${item.segment}`, depth + 1)}
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
    }, []);

    return (
        <Drawer
            variant='permanent'
            sx={{
                width: mainNavigationDrawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: mainNavigationDrawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar />
            <List>{renderNavItems(nav, '', 0)}</List>
        </Drawer>
    );
}

function useMainNavigation() {
    const [nav, setNav] = React.useState<Navigation>([]);

    const { t, i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
    const { session, status, permissionsSet } = usePermissions();

    React.useEffect(() => {
        const handleLanguageChanged = (lng) => {
            setCurrentLanguage(lng);
        };
        i18n.on('languageChanged', handleLanguageChanged);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, [i18n]);

    React.useEffect(() => {
        let navigation: Navigation = [];

        if (session?.user && permissionsSet?.has('DASH_USE')) {
            navigation.push({
                segment: 'dashboard',
                title: t('Dashboard'),
                icon: <DashboardIcon />,
            });
        }

        if (session?.user && permissionsSet?.has('USR_FCH')) {
            navigation.push({
                segment: 'users',
                title: t('Users'),
                icon: <PeopleAltIcon />,
            });
        }

        navigation.push({
            segment: 'account',
            title: t('Account'),
            // icon: <ManageAccountsIcon />,
            icon: <BusinessIcon />,
        });

        if (session?.user && permissionsSet?.has('ACC_FCH')) {
            navigation.push({
                segment: 'accounts',
                title: t('Accounts'),
                // icon: <ManageAccountsIcon />,
                icon: <BusinessIcon />,
            });
        }

        navigation.push({
            segment: 'catalog',
            title: t('Catalogs'),
            icon: <DatasetIcon />,
        });

        if (Env.isDev) {
            navigation.push({
                kind: 'divider',
            });

            navigation.push({
                segment: 'estimates',
                title: t('Estimates'),
                icon: <CalculateIcon />,
            });

            navigation.push({
                segment: 'invites',
                title: t('Invites'),
                // icon: <MailLockIcon />,
                icon: <ContactMailIcon />,
            });

            navigation.push({
                segment: 'offers',
                title: t('Offers'),
                icon: <LocalOfferIcon />,
            });

            navigation.push({
                segment: 'dev',
                title: 'Dev',
                icon: <DatasetIcon />,
            });
        }

        // {
        //     segment: '?segment=labor_catalog',
        //     title: 'Labor Catalog',
        //     icon: <CleaningServicesIcon />,
        // },

        // {
        //     segment: '?segment=materials_catalog',
        //     title: 'Materials Catalog',
        //     icon: <ScienceIcon />,
        // },

        setNav(navigation);
    }, [currentLanguage]);

    return { nav };
}
