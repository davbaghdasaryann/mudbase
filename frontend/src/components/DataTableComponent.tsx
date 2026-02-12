import React from 'react';
import {IconButton, SelectChangeEvent, SxProps, Theme, Toolbar, useTheme} from '@mui/material';
// import {DataGrid, DataGridProps} from '@mui/x-data-grid';
import {DataGridPro, DataGridProProps, GridRowsProp} from '@mui/x-data-grid-pro';

import {LicenseInfo} from '@mui/x-license';
import {useTranslation} from 'react-i18next';
import { combineSx } from '@/tsui/Mui/SxPropsUtil';

LicenseInfo.setLicenseKey('9fa015d2b917a890ae65b0903d0a2322Tz0xMDk5NTUsRT0xNzczOTY0Nzk5MDAwLFM9cHJvLExNPXN1YnNjcmlwdGlvbixQVj1pbml0aWFsLEtWPTI=');

// interface DataTableComponentProps {

// }

export default function DataTableComponent(props: DataGridProProps) {
    const theme = useTheme();
    const {t} = useTranslation();

    const dataGridSx = combineSx(props.sx, {
            '& .MuiDataGrid-actionsCell': {
                gap: '2px',
                //gap: '4px',           // shrink from 8px down to 4px (or whatever you like)
            },

            '& .MuiDataGrid-actionsCell .MuiSvgIcon-root': {
                fontSize: '24px',
                padding: 0, //'4px',
            },

            '& .MuiDataGrid-row': {
                backgroundColor: 'white',

                '&:hover': {
                    backgroundColor: theme.tsui?.table?.rowHoverColor,
                },
            },
            '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 'bold',
            },
            border: 'none', // Remove the outer border
            '& .MuiDataGrid-columnHeaders': {
                borderBottom: 'none', // Remove header bottom border
            },
            '& .MuiDataGrid-columnHeader': {
                borderRight: 'none', // Remove header right border (if any)
            },
            '& .MuiDataGrid-footerContainer': {
                borderTop: 'none', // Remove footer border if present
            },
    });

    // const [dataGridSx, setDataGridSx] = React.useState<SxProps<Theme> | undefined>(undefined);

    // React.useEffect(() => {
    //     setDataGridSx({
    //         ...props.sx,

    //         '& .MuiDataGrid-actionsCell': {
    //             gap: '2px',
    //             //gap: '4px',           // shrink from 8px down to 4px (or whatever you like)
    //         },

    //         '& .MuiDataGrid-actionsCell .MuiSvgIcon-root': {
    //             fontSize: '24px',
    //             padding: 0, //'4px',
    //         },

    //         '& .MuiDataGrid-row': {
    //             '&:nth-of-type(2n+1)': {
    //                 backgroundColor: theme.tsui?.table?.oddRowColor,
    //             },

    //             '&:hover': {
    //                 backgroundColor: theme.tsui?.table?.rowHoverColor,
    //             },
    //         },
    //         '& .MuiDataGrid-columnHeaderTitle': {
    //             fontWeight: 'bold',
    //         },
    //         border: 'none', // Remove the outer border
    //         // '& .MuiDataGrid-cell': {
    //         //     border: 'none', // Remove cell borders
    //         // },
    //         '& .MuiDataGrid-columnHeaders': {
    //             borderBottom: 'none', // Remove header bottom border
    //         },
    //         '& .MuiDataGrid-columnHeader': {
    //             borderRight: 'none', // Remove header right border (if any)
    //         },
    //         '& .MuiDataGrid-footerContainer': {
    //             borderTop: 'none', // Remove footer border if present
    //         },
    //     });
    //     // }
    // }, [theme]);

    return (
        <DataGridPro
            {...props}
            loading={props.rows === undefined}
            rows={props.rows ?? []}
            disableColumnMenu={true}
            hideFooterRowCount={true}
            hideFooter={true}
            pagination={false}
            sx={dataGridSx}
            localeText={{
                noRowsLabel: t('No rows'),
            }}

        />
    );
}
