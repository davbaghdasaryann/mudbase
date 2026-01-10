import * as GD from '@/data/global_dispatch';

export function raiseError(error: Error | string | unknown) {
    console.error(error);

    if (error instanceof Error) {
        GD.pubsub_.dispatch(GD.errorListenerId, error);
        return;
    }

    if (typeof error === "string") {
        GD.pubsub_.dispatch(GD.errorListenerId, new Error(error));
        return;
    }

    GD.pubsub_.dispatch(GD.errorListenerId, new Error(error as string));
}



