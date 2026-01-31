import React from 'react';

import {useTheme} from '@mui/material/styles';
import {IconButton, Tooltip} from '@mui/material';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import * as GD from '@/data/global_dispatch';

export default function AppThemeSwitcher() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`} arrow>
            <IconButton
                onClick={() => GD.pubsub_.dispatch(GD.colorModeListenerId, {})}
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    transition: 'all 0.3s ease-in-out',
                    border: (theme) =>
                        `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                        transform: 'rotate(180deg)',
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                        borderColor: (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                    },
                }}
            >
                {isDark ? (
                    <LightModeIcon sx={{ fontSize: 20, color: '#FDB813' }} />
                ) : (
                    <DarkModeIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                )}
            </IconButton>
        </Tooltip>
    );
}


// import React from 'react';

// import {useColorScheme, useTheme} from '@mui/material/styles';

// import IconButton from '@mui/material/IconButton';
// import Tooltip from '@mui/material/Tooltip';
// import DarkModeIcon from '@mui/icons-material/DarkMode';
// import LightModeIcon from '@mui/icons-material/LightMode';

// import * as GD from '@/data/global_dispatch';

// export default function AppThemeSwitcher() {
//     const theme = useTheme();
    
//     const toggleMode = React.useCallback(() => {
//         GD.pubsub_.dispatch(GD.colorModeListenerId, {});
//     }, []);

//     return (
//         <Tooltip title={`${theme.palette.mode === 'dark' ? 'Light' : 'Dark'} mode`} enterDelay={1000}>
//             <div>
//                 <IconButton
//                     aria-label={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}
//                     onClick={toggleMode}
//                     sx={{mt: 0.5}}
//                     // sx={{
//                     //   color: (theme.vars ?? theme).palette.primary.dark,
//                     // }}
//                 >
//                     {theme.palette.mode !== 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
//                 </IconButton>
//             </div>
//         </Tooltip>
//     );
// }
