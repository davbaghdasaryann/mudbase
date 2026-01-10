import {accordionBorderColor, accordionSummaryHeight, mainBackgroundColor} from '@/theme';
import {Accordion, AccordionDetails, AccordionSummary} from '@mui/material';

import {styled} from '@mui/material/styles';

export const EstimateRootAccordion = styled(Accordion)(({theme}) => ({
    backgroundColor: theme.palette.background.paper,
    margin: 0,
    '&.Mui-expanded': { margin: 0 },
}));

export const EstimateRootAccordionSummary = styled(AccordionSummary)(({theme}) => ({
    display: 'flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: '8px',
    paddingLeft: '10px',
    margin: 0,
    // p: 0,
    minHeight: accordionSummaryHeight,
    '&.Mui-expanded': {
        minHeight: accordionSummaryHeight,
    },
    // adjust the content wrapper margins
    '& .MuiAccordionSummary-content': {
        margin: 0,
    },
    '& .MuiAccordionSummary-content.Mui-expanded': {
        margin: 0,
    },
}));

export const EstimateRootAccordionDetails = styled(AccordionDetails)(({theme}) => ({
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        left: 20,
        top: 0,
        width: '2px',
        height: '100%',
        backgroundColor: theme.palette.mode === 'light' ? accordionBorderColor : theme.palette.background.paper,
        // backgroundColor: 'red',
    },

    backgroundColor: theme.palette.mode === 'light' ? mainBackgroundColor : theme.palette.background.paper,
    // backgroundColor: 'red',
    margin: 0,
    padding: 0,
}));

export const EstimateChildAccordion = styled(Accordion)(({theme}) => ({
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.default : theme.palette.background.paper,
    // backgroundColor: 'red',
    // marginLeft: 15,
    border: 'none',
    boxShadow: 'none',
    '&:before': {
        display: 'none',
    },
}));

export const EstimateSubChildAccordion = styled(Accordion)(({theme}) => ({
    backgroundColor: theme.palette.mode === 'light' ? theme.palette.background.default : theme.palette.background.paper,
    // backgroundColor: theme.palette.background.default,
    border: 'none',
    boxShadow: 'none',
    '&:before': {
        display: 'none',
    },
}));


export const EstimateSubChildAccordionDetails = styled(AccordionDetails)(({theme}) => ({
    backgroundColor: theme.palette.mode === 'light' ? mainBackgroundColor : theme.palette.background.paper,
    margin: 0,
    padding: 0,
}));
