import React from 'react';

import {GridColDef, GridRenderCellParams, GridRowParams, GridValidRowModel} from '@mui/x-data-grid';
import {GridInitialStateCommunity} from '@mui/x-data-grid/models/gridStateCommunity';


import {DataTableActionsCell} from './DataTableActions';
import {PageDataTableAction, PageDataTableColumn, PageDataTableProps} from '../PageDataTable';
import { Theme } from '@mui/material';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

interface MakeColumnParams<RT extends GridValidRowModel> {
    actions?: PageDataTableAction<RT>[];
}

export function makeDataGridColumn<RT extends GridValidRowModel>(
    props: PageDataTableProps<RT>,
    pc: PageDataTableColumn<RT>,
    theme: Theme,
    params?: MakeColumnParams<RT>
) {
    let col: GridColDef<RT> = {
        field: pc.field ?? '',
        headerAlign: 'center',
        sortable: pc.sortable === true ? true : false,
        disableColumnMenu: true,
        filterable: false,
    };

    if (pc.minWidth) col.minWidth = pc.minWidth;

    if (pc.width) col.width = pc.width;

    col.flex = pc.flex;

    col.renderCell = pc.renderCell;
    col.valueGetter = pc.valueGetter;

    let actions = pc.type === 'actions' ? pc.actions : params?.actions ?? undefined;

    if (actions) {
        col.type = 'actions';
        col.width = theme.tsui.table?.actionButtonWidth ? theme.tsui.table?.actionButtonWidth * actions.length : undefined;

        // col.getActions = (params: GridRowParams<RT>) => [

        // ]

        col.renderCell = (cell: GridRenderCellParams<RT>) => (
            <DataTableActionsCell<RT> cell={cell} col={col} actions={actions!} />
        );


    }

    return col;
}

export interface GridState<Row extends GridValidRowModel> {
    columns: GridColDef<Row>[];
    initialState?: GridInitialStateCommunity;
}

export function makeDataGridColumns<Row extends GridValidRowModel>(props: PageDataTableProps<Row>, theme: Theme): GridState<Row> {
    let cols: GridColDef<Row>[] = [];

    let wasActions = false;
    let initialSortDirection: string | undefined = undefined;
    let initialSortColumn: string | undefined = undefined;

    for (let pc of props.columns) {
        let col = makeDataGridColumn(props, pc, theme);

        if (pc.label) col.headerName = i18nt(pc.label) ?? pc.label;
        if (pc.tlabel) col.headerName = pc.tlabel;

        switch (pc.type) {
            case 'image':
                //col.sortable = false
                // col.hideSortIcons = true
                // col.filterable = false
                // col.disableColumnMenu = true
                break;

            case 'date':
            case 'time':
            case 'datetime':
                col.type = pc.type === 'datetime' ? 'dateTime' : 'date';
                col.align = 'right';
                col.width = pc.width ?? (pc.type === 'datetime' ? 200 : 120);

                col.valueGetter = (cell: any) => cell.value;
                break;

            case 'actions':
                wasActions = true;
                break;

            case 'greeting':
                col.width = pc.width ?? 120;
                break;

            case 'id':
                col.width = pc.width ?? 90;
                break;

            case 'boolean':
                col.width = pc.width ?? 40;
                col.valueGetter = (cell: any) => (cell.value ? 'YES' : 'NO');
                break;

            default:
                break;
        }

        if (pc.initialSort) {
            initialSortColumn = col.field;
            initialSortDirection = pc.initialSort;
        }

        cols.push(col);
    }

    if (!wasActions && props.actions !== undefined) {
        let col = makeDataGridColumn(props, {
            type: 'actions',
            actions: props.actions,
        }, theme);

        cols.push(col);

        wasActions = true;
    }

    if (!wasActions) {
        if (props.onDetails) {
            let col = makeDataGridColumn(props, {
                type: 'actions',
                actions: [
                    {
                        //getDetailsHandler: props.onDetails,
                    },
                ],
            }, theme);

            cols.push(col);

            wasActions = true;
        }

        if (props.onView) {
            //let viewAction

            let col = makeDataGridColumn(props, {
                type: 'actions',
                actions: [
                    {
                        // getDetailsHandler: props.onDetails,
                    },
                ],
            }, theme);

            cols.push(col);

            wasActions = true;
        }
    }

    //let initialState =

    let state: GridState<Row> = {
        columns: cols,
    };

    if (props.initialState) state.initialState = props.initialState;

    if (initialSortColumn) {
        state.initialState = {
            sorting: {
                sortModel: [{field: initialSortColumn, sort: initialSortDirection === 'desc' ? 'desc' : 'asc'}],
            },
        };
    }

    return state;
}
