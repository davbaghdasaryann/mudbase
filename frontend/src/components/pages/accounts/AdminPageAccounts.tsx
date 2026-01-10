import React, { act } from 'react';

import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, AppBar, Toolbar, Menu } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { ApiAccount, ApiUser } from '../../../api';
import { AddCompanyDialog } from '../../../companies/AddCompany';
import { AdminPageAccountsDetails } from './AdminPageAccountsDetails';
import DataTableComponent from '@/components/DataTableComponent';


export default function AdminPageAccounts() {

    const [selectType, setSelectType] = React.useState('');
    const handleChange = (event: SelectChangeEvent) => {
        setSelectType(event.target.value as string);
    };
    let [acounts, setAccounts] = React.useState<ApiAccount[]>();
    let [accountEditId, setAccountEditId] = React.useState<string | null>(null);
    let [accountDetailsId, setAccountDetailsId] = React.useState<string | null>(null);
    let [dataRequested, setDataRequested] = React.useState(false);
    let [addUserDialog, setOpenAddUserDialog] = React.useState(false);

    const usersRef = React.useRef<ApiAccount[]>(null);


    const [anchorEl, setAnchorEl] = React.useState(null);


    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (currentAccountEditId: string) => {
        setAccountEditId(currentAccountEditId)
        setAnchorEl(null);
    };

    const handleRemove = (currentAccountEditId: string) => {
        setAnchorEl(null);  // Close the menu

        console.log(acounts)

        // const allCompanies = [...acounts]
        // const index = allCompanies.findIndex(item => item.accountId === currentAccountEditId);
        // // arr.filter(item => item !== 3);

        // // If the item is found, remove it using splice
        // if (index !== -1) {
        //     console.log(acounts, index)
        //     allCompanies.splice(index, 1); // Removes 1 item at the found index
        // }

        // setAccounts(allCompanies);
        // usersRef.current = allCompanies;

        setDataRequested(!dataRequested);

    };


    React.useEffect(() => {
        if (usersRef.current) {
            setAccounts(usersRef.current);
        }
    }, [dataRequested]);

    if (!acounts) {
        return <></>
    }


    return <>
        <Typography sx={{ fontSize: 'xx-large', px: 3, pt: 1 }}>Total Users:&nbsp;{acounts.length}</Typography>

        <Box sx={{ px: 3, pt: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField id="outlined-basic" label="Search" placeholder="Account ID, Name etc..." variant="outlined" slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: 300 }} />
                <Box sx={{ minWidth: 120, ml: 10 }}>
                    <FormControl fullWidth>
                        <InputLabel id="select-account-type">All</InputLabel>
                        <Select
                            labelId="select-account-type-label"
                            id="select-type"
                            value={selectType}
                            label="All"
                            onChange={handleChange}
                        >
                            <MenuItem value={"Admin"}>Admin</MenuItem>
                            <MenuItem value={"Company"}>Company</MenuItem>
                            <MenuItem value={"Bank"}>Bank</MenuItem>
                            <MenuItem value={"Customer"}>Customer</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* <Button
                        variant='contained'
                        onClick={() => { setOpenAddCompanyDialog(true) }}
                        sx={{
                            // display:,
                            backgroundColor: '#00ABBE',
                            borderRadius: 1,

                            color: 'white',
                            minWidth: 110,
                            height: 35,
                            fontSize: 'small',
                            fontWeight: '900',
                            ml: "auto",
                            whiteSpace: "nowrap"
                        }}>
                        Add User
                    </Button> */}
            </Box>



            <Stack direction='column' height='100%' alignItems='center' spacing={2} sx={{ mt: 5 }}>

                <DataTableComponent
                    sx={{
                        width: '100%',
                        // color: "red"
                    }}
                    columns={[
                        { field: 'accountId', headerName: 'ID', headerAlign: 'left', flex: 0.2, disableColumnMenu:true },
                        { field: 'accountName', headerName: 'Name', headerAlign: 'left', flex:0.5, disableColumnMenu:true },
                        { field: 'accountType', headerName: 'Type', headerAlign: 'left', flex: 0.2, disableColumnMenu:true }, // width: 600 },
                        { field: 'accountStatus', headerName: 'Status', headerAlign: 'left', flex:0.2, disableColumnMenu:true }, // width: 600 },
                        { field: 'accountDescription', headerName: 'Description', headerAlign: 'left', flex: 0.3, disableColumnMenu:true }, // width: 600 },
                        {
                            field: 'info', type: 'actions', headerName: '', flex:0.2, renderCell: (cell) => {
                                return <>
                                    {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                                    <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                                        setAccountDetailsId(cell.row._id as string)
                                        handleClick(event);
                                    }
                                    }
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </>;
                            }
                        }, // width: 600 },
                    ]}
                    rows={acounts}
                    //pageSize={10}
                    //autoHeight
                    //rowsPerPageOptions={[10]}

                    autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={row => row._id!}
                />
            </Stack>



        </Box>

        {/* {addUserDialog && <AddCompanyDialog comapniesData={users} onClick={handleChange} onClose={() => { setOpenAddUserDialog(false); setDataRequested(false) }} onSelected={key => setUsers(key)} />}


            {userEditId && <TableAction userId={userEditId} comapniesData={users} onClick={handleChange} onClose={() => { setUserEditId(null); setDataRequested(false) }} onSelected={key => setUsers(key)} />} */}
        {accountEditId && <AdminPageAccountsDetails accountId={accountEditId} accounsData={acounts} onClick={handleChange} onClose={() => { setAccountEditId(null); setDataRequested(false) }} onSelected={key => setAccounts(key)} />}

        {accountDetailsId && <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
        >
            <MenuItem onClick={() => { handleEdit(accountDetailsId) }}>Edit</MenuItem>
            <MenuItem onClick={() => { handleRemove(accountDetailsId) }}>Remove</MenuItem>
        </Menu>
        }

    </>
}


