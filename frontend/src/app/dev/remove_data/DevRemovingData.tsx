import React from "react";
import * as Api from "api";
import PageContents from "@/components/PageContents";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useRouter } from "next/navigation";

export default function DevRemovingData() {
    const [confirmRemove, setConfirmRemove] = React.useState(false);
    const [removeCommand, setRemoveCommand] = React.useState<string | null>(null);
    const [confirmationMessage, setConfirmationMessage] = React.useState<string>("");
    const router = useRouter();

    const onRemoveData = React.useCallback(async () => {
        if (!removeCommand) return;

        try {
            await Api.requestSession({ command: removeCommand });
            console.log('Data removed:', removeCommand);
            setConfirmRemove(false);
        } catch (error) {
            console.error("Failed to remove data:", error);
        }
    }, [removeCommand]);

    const openConfirmationDialog = (command: string, message: string) => {
        setRemoveCommand(command);
        setConfirmationMessage(message);
        setConfirmRemove(true);
    };

    return (
        <PageContents>
            <Button
                variant='outlined'
                onClick={() => router.replace('/dev')}
            >
                Return to Developer Mode Main Page
            </Button>

            <Button
                id="Estimates"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimate_labor_items', "Are you sure you want to remove all estimate labor items?")}
            >
                Clear Estimate labor items
            </Button>

            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimate_material_items', "Are you sure you want to remove all estimate materaial items?")}
            >
                Clear Estimate material items
            </Button>

            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimate_sections', "Are you sure you want to remove all estimate sections?")}
            >
                Clear Estimate sections
            </Button>

            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimate_subsections', "Are you sure you want to remove all estimate subsections?")}
            >
                Clear Estimate subsections
            </Button>
            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimates', "Are you sure you want to remove all estimates?")}
            >
                Clear Estimates
            </Button>

            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_estimates_shares', "Are you sure you want to remove all estimates shares?")}
            >
                Clear Estimates shares
            </Button>

            <Button
                id="Offers"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_labor_offers', "Are you sure you want to remove all labor offers?")}
            >
                Clear Labor offers
            </Button>

            <Button
                id="Labor_prices"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_labor_prices_journal', "Are you sure you want to remove all labour prices?")}
            >
                Clear Labor Prices Journal
            </Button>

            <Button
                id="Labor_prices"
                variant='outlined'
                sx={{ textTransform: 'capitalize', display: 'flex', mx: 'auto', marginTop: 5, fontSize: 20 }}
                size='medium'
                onClick={() => openConfirmationDialog('dev/remove_material_offers', "Are you sure you want to remove all material offers?")}
            >
                Clear Material Offers
            </Button>


            <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)}>
                <DialogTitle>Confirm</DialogTitle>
                <DialogContent>{confirmationMessage}</DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmRemove(false)} color='secondary'>
                        Cancel
                    </Button>
                    <Button onClick={onRemoveData} color='error'>
                        Remove
                    </Button>
                </DialogActions>
            </Dialog>
        </PageContents>
    );
}