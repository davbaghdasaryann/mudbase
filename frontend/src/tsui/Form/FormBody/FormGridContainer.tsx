import React from 'react';
import {Grid, useTheme} from '@mui/material';

import * as FT from '../FormTypes';
import { combineSx } from '@/tsui/Mui/SxPropsUtil';

// interface FormGridProps extends FT.FormPropsBase, FT.FormInputGridProps, FT.InputSxProps, FT.DataFieldsProps {
//     hidden?: boolean;
//     children?: React.ReactNode;
// }

interface FormGridProps {
    formProps?: FT.FormProps;
    children?: React.ReactNode;
}

export function FormGridContainer(props: FormGridProps) {
    const theme = useTheme();

    return (
        <Grid
            container
            spacing={theme.tsui?.form?.gridSpacing ?? 2}
            rowSpacing={props.formProps?.slotProps?.grid?.rowSpacing}
            columnSpacing={props.formProps?.slotProps?.grid?.columnSpacing}
            sx={combineSx({
                flexGrow: 1,
            }, props.formProps?.slotProps?.grid?.sx)}
        >
            {props.children}
        </Grid>
    );
}
