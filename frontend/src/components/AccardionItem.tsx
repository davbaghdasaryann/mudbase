import {Accordion, AccordionDetails, AccordionSummary, Divider, TextField, Typography} from '@mui/material';
import {Box, Stack} from '@mui/system';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React from 'react';
// import { AccardionItemType } from 'types/dataClasses';


interface AccardionItemProps{
    // item:{
    //     id: string,
    //     label: string | React.ReactNode,
    //     content: React.ReactNode
    // }
    // item: AccardionItemType
    
}
export default function AccardionItem(props:AccardionItemProps) {
    <></>
    // const [expanded, setExpanded] = React.useState<string[]>(['category']);

    // const handleAccardionChange = (panel: string) => (event: React.SyntheticEvent) => {
    //     const currentExpanded = [...expanded];

    //     if (currentExpanded.includes(panel)) {
    //         const index = currentExpanded.indexOf(panel);
    //         currentExpanded.splice(index, 1);
    //     } else {
    //         currentExpanded.push(panel);
    //     }
    //     setExpanded(currentExpanded);

    // };
    // let item = props.item

    // return (
    //     <Accordion sx={{padding:'0 20px ', border:'1px solid gray',}} key={item.id} expanded={expanded.includes(item.id)} onChange={handleAccardionChange(item.id)}>
    //         <AccordionSummary  expandIcon={<ExpandMoreIcon />} aria-controls={`${item.id}-content`} id={`${item.id}-header`}>
    //             <Typography variant='h6' >{item.label}</Typography>
    //         </AccordionSummary>
    //         <Divider/>

    //         <AccordionDetails sx={{padding:'20px 30px'}} >{item.content}</AccordionDetails>
    //     </Accordion>
    // );
}
