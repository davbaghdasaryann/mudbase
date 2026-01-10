#! /usr/bin/env node

import {program} from 'commander';

import './logger';

import {makeError} from './tslib/error';


import './config';

import main from './main';

program
    .name('hist-fetch')
    .description('SPX History Fetcher')
    .version('0.0.1', '-v --version', 'Prints current version');

program.command('test').description('Test');
program.command('labor').description('Labor');

// program.option('--config <path>', 'Configuration path');
// program.option('--date <date>', 'Requested date');
// program.option('--output <path>', 'Output file or directory');


async function mainWrapper(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let startDir = process.cwd();

        try {
            await program.parseAsync();
            await main(program);
        } catch (err) {
            process.chdir(startDir);
            reject(makeError(err));
        }
        resolve();
    });
}

mainWrapper()
    .then((result) => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
