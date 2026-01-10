import React from 'react';

import {useTheme} from '@mui/material/styles';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import * as GD from '@/data/global_dispatch';
import ToolbarActionIcon from '../ToolbarActionIcon';

export default function AppThemeSwitcher() {
    const theme = useTheme();

    return (
        <ToolbarActionIcon
            onClick={() => GD.pubsub_.dispatch(GD.colorModeListenerId, {})}
            icon={theme.palette.mode !== 'dark' ? DarkModeIcon : LightModeIcon}
        />
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
