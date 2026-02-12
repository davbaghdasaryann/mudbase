import { AppBar, Toolbar, Typography, Button, Avatar, IconButton, Box } from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import ImgElement from '../../tsui/DomElements/ImgElement';
import { PageContentsProps } from '../PageContents';
import AppThemeSwitcher from './AppThemeSwitcher';
import AppHeaderAccount from './AppHeaderAccount';
import AppLangSelector from './AppLangSelector';
import Link from 'next/link';

export default function AppHeader(props: PageContentsProps) {
    return (
        <AppBar
            position='absolute'
            color='inherit'
            sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                displayPrint: 'none',
                backgroundColor: 'transparent',
                boxShadow: 'none',
            }}
        >
            <Toolbar sx={{ backgroundColor: 'transparent' }}>
                {/* <ImgElement src='/images/mudbase_header_title.svg' sx={{ height: 30 }} /> */}
                <Link href="/">
                    <Box sx={{ p: 2, cursor: 'pointer' }}>
                        <ImgElement src="/images/mudbase_header_title.svg" sx={{ height: 30 }} />
                    </Box>
                </Link>

                <Typography variant='h6' sx={{ flexGrow: 1 }}>
                    &nbsp;
                </Typography>

                <AppLangSelector />
                <AppThemeSwitcher />
                <AppHeaderAccount {...props} />
            </Toolbar>
        </AppBar>
    );
}
