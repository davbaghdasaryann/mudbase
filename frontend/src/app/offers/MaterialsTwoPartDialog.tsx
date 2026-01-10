import React, { useEffect } from 'react';
import {Dialog, DialogTitle, DialogContent, IconButton, Box, useTheme} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {t} from 'i18next';
import {MaterialsRightPaneContent} from '@/app/offers/MaterialsRightPaneContent';
import MaterialsLeftPaneContent from '@/app/offers/MaterialsLeftPaneContent';
import * as GD from '@/data/global_dispatch';

interface Props {
    onClose: () => void;
    offerType: 'labor' | 'material';
    isEstimation: boolean;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null;

    estimatedLaborId?: string | null;

    estimatedLaborName?: string | null;

    onConfirm: () => void;
}

export default function MaterialsTwoPartDialog(props: Props) {
    const theme = useTheme();

    // // Debugging
    // useEffect(() => {
    //     console.log('MartialsTwoparts');
    // }, []);


    return (
        <Dialog
            fullScreen
            open={true}
            onClose={props.onClose}
            slotProps={{
                paper: {
                    style: {
                        padding: 5,
                    },
                },
            }}
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 5,
                },
            }}
            // PaperProps={{
            //     sx: {
            //         height: "100%",
            //         p: 2,
            //     },
            // }}
            // sx={{
            //     "& .MuiDialog-container": {
            //         alignItems: "center",
            //         justifyContent: "center",
            //         p: 2,
            //     },
            // }}
        >
            <DialogTitle sx={{m: 0, p: 2}}>
                {t('Add / Edit Materials')}
                <IconButton
                    aria-label='close'
                    onClick={props.onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        height: '100%',
                        '& > .pane': {
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        },
                    }}
                >
                    <Box
                        className='pane'
                        sx={{
                            borderRight: `1px solid ${theme.palette.divider}`,
                            p: 2,
                            // overflow: "auto",
                        }}
                    >
                        <MaterialsLeftPaneContent
                            offerType='material'
                            isEstimation={true}
                            estimateSubsectionId={props.estimateSubsectionId}
                            estimateSectionId={props.estimateSectionId}
                            estimatedLaborId={props.estimatedLaborId}
                            onConfirm={() => {
                                props.onConfirm();
                                GD.pubsub_.dispatch(GD.estimateMaterialDataChangedId);
                            }}
                        />
                    </Box>

                    <Box
                        className='pane'
                        sx={{
                            p: 2,
                        }}
                    >
                        {props.estimatedLaborId && props.estimatedLaborName && (
                            <MaterialsRightPaneContent
                                estimatedLaborName={props.estimatedLaborName}
                                estimatedLaborId={props.estimatedLaborId}
                                onConfirm={props.onConfirm}
                                onClose={() => {}}
                            />
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
