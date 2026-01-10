
'use client';

import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material";
import { Stack } from "@mui/system";

interface AdminAcceptUserDialogProps{
    user: any | null; //heto kpoxem
    onAccept: (userId: string) => void;
    onClose: () => void;
}


export default function AdminAcceptUserDialog(props:AdminAcceptUserDialogProps) {
    
    return (
        <>
            <Dialog onClose={props.onClose} open={true}>
                <DialogTitle>User Details</DialogTitle>
                <DialogContent>
                    {props.user && (
                        <Stack spacing={2}>
                            <Typography>
                                <b>User ID:</b> {props.user._id}
                            </Typography>
                            <Typography>
                                <b>Email:</b> {props.user.email}
                            </Typography>
                            {/* <Typography><b>Account:</b> {props.user.account}</Typography> */}
                            {/* <Typography><b>First Name:</b> {props.user.firstname}</Typography> */}
                            {/* <Typography><b>Surname:</b> {props.user.surname}</Typography> */}
                            {/* <Typography><b>Phone:</b> {props.user.phone}</Typography> */}
                            {/* <Typography><b>Role:</b> {props.user.role}</Typography> */}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={props.onClose}>Cancel</Button>
                    {props.user && (
                        <Button onClick={() => props.onAccept(props.user._id)} variant='contained' color='success'>
                            Accept
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}
