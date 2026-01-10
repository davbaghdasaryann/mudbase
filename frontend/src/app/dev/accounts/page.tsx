"use client"

import React, { act } from 'react';
import PageContents from '@/components/PageContents';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, TextField, Typography, AppBar, Toolbar, Menu, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { AccountsPageAccountDetails } from '../../accounts/AccountsPageAccountDetails';
import { ApiAccount } from '../../../api';
// import { adminNavigation_ } from '../../AdminPageNavigation';
import * as Api from 'api';
import { useRouter } from 'next/navigation';
import RemoveAccount from '@mui/icons-material/Delete';
import CreateAccountDialog from '@/components/AccountCreateDialog';
import { useApiFetchMany } from '@/components/ApiDataFetch';
import { PageButton } from '@/tsui/Buttons/PageButton';
import DataTableComponent from '@/components/DataTableComponent';
import EditIcon from '@mui/icons-material/Edit';

export default function DevPageAccounts() {

    const apiData = useApiFetchMany<Api.ApiAccount>({
        api: {
            command: 'accounts/fetch',
        },
    });

    const mounted = React.useRef(false);

    const [selectType, setSelectType] = React.useState('');
    const handleChange = (event: SelectChangeEvent) => {
        setSelectType(event.target.value as string);
    };
    const [accounts, setAccounts] = React.useState<Api.ApiAccount[] | null>(null);
    const [accountEditId, setAccountEditId] = React.useState<string | null>(null);
    const [accountDetails, setAccountDetails] = React.useState<ApiAccount | null>(null);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [addUserDialog, setOpenAddUserDialog] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState(false);
    const [editedAccount, setEditedAccount] = React.useState<Api.ApiAccount | null>(null);
    const [createAccount, setCreateAccount] = React.useState(false);


    // const usersRef = React.useRef<ApiAccount[]>(null);
    const router = useRouter();

    const [anchorEl, setAnchorEl] = React.useState(null);


    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (currentCompanyEditId: string) => {
        setAccountEditId(currentCompanyEditId)
        setAnchorEl(null);
    };



    const handleRemove = (evt: ApiAccount) => {
        setAnchorEl(null);
        Api.requestSession<any>({
            command: 'dev/delete_account',
            json: evt
        })
            .then(devAccounts => {
                for(let d of devAccounts){
                    console.log(d)

                }
                setConfirmDelete(false);
                // alert(devAccounts.length)
            })
        setDataRequested(!dataRequested);


    };



    const handleUsersCount = (evt: ApiAccount) => {
        setAnchorEl(null);
        Api.requestSession<any>({
            command: 'dev/users_in_account',
            args: { accountId: evt._id }
        })
            .then(devUsersCount => {
                console.log(devUsersCount)
            })
    };



    //  const onRemoveUser = React.useCallback(async () => {
    //         if (!user) return;

    //         try {
    //             await Api.requestSession({
    //                 command: 'dev/delete_user',
    //                 args: {
    //                     userId: user._id,
    //                 },
    //             });
    //             console.log('deleted');
    //             dataChanged.current = true;
    //             setConfirmDelete(false);
    //             props.onClose(true);

    //         } catch (error) {}

    //     }, [user, props.onClose]);


    React.useEffect(() => {
        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<Api.ApiAccount[]>({
                command: 'dev/fetch_accounts',
                // args: { estimateName: estimateName }
            })
                .then(data => {
                    if (mounted.current) {
                        // let accountsData: Api.ApiAccount[] = [];
                        // console.log('data', data)
                        // for (let accountData of data) {
                        //     accountsData.push(new AccountDisplayData(accountData));
                        // }
                        // console.log('accountsData', accountsData)

                        setAccounts(data)
                    }
                    // setProgIndic(false)

                })
            setDataRequested(true);

            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);

    if (!accounts) {
        return <PageContents >

            <Typography sx={{ fontSize: 'xx-large', px: 3, pt: 1 }}>Total Accounts:</Typography>

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

                </Box>
            </Box>
        </PageContents>
    }

    return <PageContents >

        <Typography sx={{ fontSize: 'xx-large', px: 3, pt: 1 }}>Total Accounts:&nbsp;{accounts.length}</Typography>

        <PageButton label='Add Account' size='large' onClickTrue={setCreateAccount} />
        <Button

            variant='outlined'
            sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
            size='medium'

            onClick={() => { router.replace('/dev') }}
        >
            Return to Developer Mode Main Page
        </Button>

        <CreateAccountDialog
            show={createAccount}
            onClose={(changed) => {
                setCreateAccount(false);
                if (changed) apiData.invalidate();
            }}
        />
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
            </Box>

            <Stack direction='column' height='100%' alignItems='center' spacing={2} sx={{ mt: 5 }}>

                <DataTableComponent
                    sx={{
                        width: '100%',
                    }}
                    columns={[
                        { field: '_id', headerName: 'Account ID', width: 120 },
                        // { field: 'country', headerName: 'Country', headerAlign: 'left', width: 150, disableColumnMenu: true },
                        // { field: 'region', headerName: 'Region', headerAlign: 'left', width: 150, disableColumnMenu: true },
                        { field: 'companyName', headerName: 'Company Name', minWidth: 200, flex: 1 },
                        // { field: 'lawAddress', headerName: 'Legal Address', headerAlign: 'left', minWidth: 250, disableColumnMenu:true },
                        // { field: 'address', headerName: 'Address', headerAlign: 'left', minWidth: 250, disableColumnMenu:true },
                        // { field: 'tin', headerName: 'TIN', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        // { field: 'tel', headerName: 'Telephone', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        { field: 'email', headerName: 'Email', headerAlign: 'left', flex: 1, disableColumnMenu:true },
                        // { field: 'name', headerName: 'First Name', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        // { field: 'surname', headerName: 'Surname', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        // { field: 'login', headerName: 'Login', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        // { field: 'establishDate', headerName: 'Establish Date', headerAlign: 'left', width: 150, disableColumnMenu:true },
                        // { field: 'website', headerName: 'Website', headerAlign: 'left', minWidth: 200, disableColumnMenu:true },
                        // { field: 'director', headerName: 'Director', headerAlign: 'left', width: 200, disableColumnMenu:true },
                        // { field: 'companyInfo', headerName: 'Company Info', headerAlign: 'left', minWidth: 300, flex: 1, disableColumnMenu:true },
                        {
                            field: 'Delete Account',
                            type: 'actions',
                            headerName: 'Delete Account',
                            flex: 1,
                            minWidth: 200,

                            renderCell: (cell) => {

                                return (
                                    <>
                                        <IconButton onClick={() => { setConfirmDelete(true); setAccountDetails(cell.row) }} color='primary'>
                                            <RemoveAccount />
                                        </IconButton>
                                    </>
                                );
                            },
                        },
                        {
                            field: 'Users Count',
                            type: 'actions',
                            headerName: 'Users Count',
                            flex: 1,
                            minWidth: 200,

                            renderCell: (cell) => {

                                return (
                                    <>
                                        <IconButton onClick={() => { handleUsersCount(cell.row) }} color='primary'>
                                            <EditIcon />
                                        </IconButton>
                                    </>
                                );
                            },
                        },
                        // {
                        //     field: 'info', type: 'actions', headerName: '', width: 80, renderCell: (cell) => {
                        //         return <>
                        //             {/* <IconButton onClick={() => setCompanyDetailsId(cell.id as string)}> */}
                        //             <IconButton onClick={(event: React.MouseEvent<HTMLElement>) => {
                        //                 setAccountDetailsId(cell.id as string)
                        //                 handleClick(event);
                        //             }
                        //             }
                        //             >
                        //                 <MoreVertIcon />
                        //             </IconButton>
                        //         </>;
                        //     }
                        // }, // width: 600 },
                    ]}

                    rows={accounts}
                    // autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={row => row._id}


                />
            </Stack>

        </Box>

        {/* {accountDetailsId && <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
        >
            <MenuItem onClick={() => { handleEdit(accountDetailsId) }}>Edit</MenuItem>
            <MenuItem onClick={() => { handleRemove(accountDetailsId) }}>Remove</MenuItem>
        </Menu>
        } */}

        {accountDetails && <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
            <DialogTitle>Confirm</DialogTitle>
            <DialogContent>Delete Account?</DialogContent>
            <DialogActions>
                <Button onClick={() => setConfirmDelete(false)} color='secondary'>
                    Cancel
                </Button>
                <Button onClick={() => handleRemove(accountDetails)} color='error'>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
        }
    </PageContents>
}
