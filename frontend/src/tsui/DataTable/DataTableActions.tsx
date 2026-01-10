import React from 'react';

import {GridRowParams, GridActionsCellItem, GridColDef, GridValidRowModel, GridRowModel} from '@mui/x-data-grid';
import {GridRenderCellParams} from '@mui/x-data-grid';

import DetailsIcon from '@mui/icons-material/EditOutlined';

import {Stack} from '@mui/material';

import TableActionButton from '../Buttons/TableActionButton';
import {PageDataTableAction} from '../PageDataTable';

interface DataTableActionCellProps<RT extends GridValidRowModel> {
    cell: GridRenderCellParams<RT>;
    col: GridColDef<RT>;
    actions: PageDataTableAction<RT>[];
}

export function DataTableActionsCell<RT extends GridValidRowModel>(props: DataTableActionCellProps<RT>) {
    if (props.actions.length === 0) return <></>;

    if (props.actions.length === 1) {
        return <DataTableActionButton cell={props.cell} action={props.actions[0]} />;
    }

    return (
        <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
            {props.actions.map((action, index) => (
                <DataTableActionButton key={index} cell={props.cell} action={action} />
            ))}
        </Stack>
    );
}

// function getActions<RT>(cell: GridRowParams<RT>,
//     cparm: PageDataTableColumn<RT>,) {

//     return cparm.actions!.map((action, index) => (<ActionButtonCellItem cell={cell} action={action}/>))
// }

interface ActionButtonRenderProps<RT extends GridValidRowModel> {
    cell: GridRenderCellParams<RT>;
    action: PageDataTableAction<RT>;
}

export function DataTableActionButton<RT extends GridValidRowModel>(props: ActionButtonRenderProps<RT>) {
    const action = props.action;
    const row = props.cell.row as GridRowModel<RT>;

    // let actionType = action.getTypeHandler ? action.getTypeHandler(row) : undefined;

    // if (!actionType && action.getViewHandler) actionType = 'view';
    // if (!actionType && action.getDetailsHandler) actionType = 'details';
    // if (!actionType && action.getEditHandler) actionType = 'edit';

    // console.log(actionType);

    // switch (actionType) {
    //     case 'view':
    //         if (action.getViewHandler) {
    //             const parm = action.getViewHandler(row);
    //             return <TableActionButton type={actionType} icon={action.icon} onClick={parm.onClick} target={parm.target} href={parm.href} />;
    //         }
    //         break;

    //     case 'details':
    //         if (action.getDetailsHandler) {
    //             return (
    //                 <TableActionButton
    //                     type={actionType}
    //                     icon={action.icon}
    //                     onClick={() => action.getDetailsHandler!(row)}
    //                 />
    //             );
    //         }
    //         break;

    //     case 'edit':
    //         if (action.getEditHandler) {
    //             const parm = action.getEditHandler(row);
    //             //console.debug(parm)
    //             return <TableActionButton type={actionType} icon={action.icon} onClick={parm.onClick} target={parm.target} href={parm.href} />;
    //         }
    //         break;
    //     default:
    //         break;
    // }

    if (action.onAction) {
        // const parm = action.getHandler(row);
        // return <TableActionButton type={actionType} icon={action.icon} onClick={() => action.getHandler!(row)} />;
        return <TableActionButton type={props.action.type} icon={action.icon} onClick={() => action.onAction!(row)}/>;
    }

    if (action.makeHref) {
        let href = action.makeHref(row);
        let target = action.makeTarget ? action.makeTarget(row) : undefined;
        return <TableActionButton type={props.action.type} icon={action.icon} target={target} href={href}/>;
    }

    return <p>Invalid Action</p>;

    // if (props.action.getViewHandler) {
    //     const viewParams = props.action.getViewHandler(row)
    //     return <TableActionButton type='view' target={viewParams.target} href={viewParams.href} />
    // }

    // if (props.action.getDetailsHandler) {
    //     return <TableActionButton type='details' onClick={() => props.action.getDetailsHandler!(props.cell.row)} />
    // }

    // return <></>
}

// function ActionButtonCellItem<RT extends GridValidRowModel>(props: {
//     cell: GridRowParams<RT>;
//     action: PageDataTableAction<RT>;
// }) {
//     return <GridActionsCellItem icon={<DetailsIcon />} label='' showInMenu={false} />;
// }
