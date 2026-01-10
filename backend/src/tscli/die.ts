
export function die(reason?: string | number)
{
    reason && console.error(reason);

    process.exit(1);
}
