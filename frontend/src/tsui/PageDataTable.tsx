import React from 'react';

import {DataGrid, GridRowId, GridRowParams, GridValidRowModel} from '@mui/x-data-grid';
import {GridRenderCellParams} from '@mui/x-data-grid';
import {GridInitialStateCommunity} from '@mui/x-data-grid/models/gridStateCommunity';

import {ActionButtonProps, ActionButtonType} from './Buttons/TableActionButton';
import ProgressIndicator from './ProgressIndicator';

import ErrorMessage from './ErrorMessage';
import {ComponentViewAction} from './Types/ComponentActions';
import {GridState, makeDataGridColumns} from './DataTable/DataTableColumns';
import {SvgIconProps, Typography, useTheme} from '@mui/material';

export type DataTableFieldType =
    | 'text'
    | 'date'
    | 'time'
    | 'datetime'
    | 'actions'
    | 'image'
    | 'greeting'
    | 'boolean'
    | 'id';


// interface ActionHandlerResult {
//     onClick?: () => void;
//     target?: string;
//     href?: string;
// };

export interface PageDataTableAction<Row extends GridValidRowModel> extends ActionButtonProps {
    icon?: React.JSXElementConstructor<SvgIconProps>;
    onAction?: (row: Row) => void;
    makeTarget?: (row: Row) => string;
    makeHref?: (row: Row) => string;


    // getTypeHandler?: (row: Row) => ActionButtonType;
    // getHandler?: (row: Row) => ActionHandlerResult;
    // getDetailsHandler?: (row: Row) => void;
    // getViewHandler?: (row: Row) => ActionHandlerResult;
    // getEditHandler?: (row: Row) => ActionHandlerResult;
}

export interface PageDataTableColumn<Row extends GridValidRowModel> {
    type?: DataTableFieldType;

    field?: string;

    label?: string;
    tlabel?: string;

    width?: number;
    minWidth?: number;
    flex?: number;

    sortable?: boolean;
    initialSort?: string;

    actions?: PageDataTableAction<Row>[];

    renderCell?: (params: GridRenderCellParams<Row>) => React.ReactNode;
    // valueGetter?: (params: GridValueGetterParams<RT, any>) => any;
    // valueFormatter?: (params: GridValueFormatterParams<any>) => any;
    valueGetter?: (params: any) => any;
    valueFormatter?: (params: any) => any;
}

type DetailsComponent = React.FC<{
    onCloseDetails: (d: null) => void;
}>;

// interface DetailsComponent extends React.ReactElement {
//     onCloseDetails: (d: null) => void
// }

export interface PageDataTableProps<Row extends GridValidRowModel = any> {
    columns: PageDataTableColumn<Row>[];
    rows: Row[] | undefined | null;
    actions?: PageDataTableAction<Row>[];
    noRowsOverlay?: React.JSXElementConstructor<any>;

    getRowId: (row: Row) => GridRowId;
    initialState?: GridInitialStateCommunity;

    onDetails?: (row: Row) => void;
    // detailsComponent?: DetailsComponent
    detailsComponent?: React.ReactNode;

    onView?: ComponentViewAction<Row>;

    error?: Error | null;

    columnHeaderHeight?: number;
}

export default function PageDataTable<RT extends GridValidRowModel = any>(props: PageDataTableProps<RT>) {
    if (props.error) return <ErrorMessage error={props.error} />;

    if (props.rows === undefined || props.rows === null) {
        return <ProgressIndicator title='Loading...' />;
    }

    if (props.detailsComponent) return <DataTableGridDetails table={props} />;

    return <DataTableGrid table={props} />;
}

function DataTableGridDetails<Row extends GridValidRowModel>(props: DataGridProps<Row>) {
    const [detailsRow, setDetailsRow] = React.useState<Row | null>(null);

    const DetailsComponent = props.table.detailsComponent!;

    // console.debug(detailsRow, props.table.detailsComponent)
    //console.debug('details component', DetailsComponent);

    return (
        <>
            <DataTableGrid table={props.table} onDetails={(row) => setDetailsRow(row)} />

            {/* {detailsRow && <>{DetailsComponent}</>} */}
            {/* {detailsRow && <DetailsComponent onCloseDetails={setDetailsRow}/>} */}
            {/* {detailsRow && <TableDetailsComponent<Row> onCloseDetails={setDetailsRow} component={DetailsComponent}/>} */}

            {/* {detailsRow && <>{props.table.detailsComponent}</>} */}
            {/* {detailsRow && <DetailsComponent/>} */}
        </>
    );
}

interface TableDetailsComponentProps<Row> {
    onCloseDetails: (d: null) => void;

    component: React.FC<{
        onCloseDetails: (d: null) => void;
    }>;
    // type DetailsComponent = React.FC<{
    //     onCloseDetails: (d: null) => void,
    // }>
}

function TableDetailsComponent<Row>(props: TableDetailsComponentProps<Row>) {
    const Component = props.component;
    return <Component onCloseDetails={props.onCloseDetails} />;
}

interface DataGridProps<Row extends GridValidRowModel> {
    table: PageDataTableProps<Row>;
    onDetails?: (row: Row) => void;
}

function DataTableGrid<Row extends GridValidRowModel>(props: DataGridProps<Row>) {
    const [state, setState] = React.useState<GridState<Row>>();
    const theme = useTheme();

    React.useEffect(() => {
        setState(makeDataGridColumns<Row>(props.table, theme));
    }, [theme, props.table]);

    const handleDoubleClick = React.useCallback((parm: GridRowParams<Row>) => {
        let onDetails = props.onDetails ?? props.table.onDetails;
        onDetails && onDetails(parm.row);
    }, []);

    if (!state) return <></>;

    return (
        <DataGrid
            columns={state.columns}
            rows={props.table.rows!}
            getRowId={props.table.getRowId}
            // Layout
            rowHeight={theme.tsui.table?.rowHeight}
            autoPageSize={true}
            // Behavious
            disableRowSelectionOnClick={true}
            //disableMultipleSelection={true}

            // showCellRightBorder={true}
            // showColumnRightBorder={true}
            onRowDoubleClick={handleDoubleClick}
            initialState={state.initialState}
            localeText={{ noRowsLabel: 'No Data' }}
            // components={{
            //     NoRowsOverlay: props.table.noRowsOverlay
            //         ? props.table.noRowsOverlay
            //         : () => <Typography align='center'>No Data</Typography>,
            // }}

            columnHeaderHeight={props.table.columnHeaderHeight ?? 56}
            
            sx={{
                width: 1,
                height: 1,

                '& .MuiDataGrid-row': {
                    '&:nth-of-type(2n+1)': {
                        backgroundColor: theme.tsui?.table?.oddRowColor,
                    },

                    '&:hover': {
                        backgroundColor: theme.tsui?.table?.rowHoverColor,
                    },

                },
            }}
        />
    );
}
