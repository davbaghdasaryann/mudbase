'use client';


import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface DeleteConfirmationDialogProps {
  onClose: () => void;
  onConfirm: () => void;
  userName?: string; // Optional user name for better message
}

export default function DeleteConfirmationDialog(props:DeleteConfirmationDialogProps){
  return (
    <Dialog open={true} onClose={props.onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          {props.userName
            ? `Are you sure you want to delete user "${props.userName}"?`
            : 'Are you sure you want to delete this user?'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={props.onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

