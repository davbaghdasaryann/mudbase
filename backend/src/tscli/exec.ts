import { spawnSync } from "child_process";

//import {log} from './log';

interface ExecOptions {
};

export function execShell(cmd: string, args: string[])
{
    //log.info(`${cmd} ${args.join(' ')}`);
    //execSync(cmd);

    let child = spawnSync(cmd, args, {
        stdio: [null, process.stdout, process.stderr],
        shell: process.platform === 'win32' ? true : undefined,
    });

    if (child.status) {
        process.exit(child.status);
    }

    if (child.error) {
        console.error(child.error);
        process.exit(1);
    }
}
