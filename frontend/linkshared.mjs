#! /usr/bin/env zx

import fs from 'fs';
import path from 'path/posix';


const tstoolkitDir = path.resolve("../../tstoolkit");
const sharedDir = path.resolve("../shared");
const targetDir = path.resolve("./src");

fs.rmSync(`${targetDir}/tsfront`, {recursive: true, force: true});
fs.rmSync(`${targetDir}/tsui`, {recursive: true, force: true});
fs.rmSync(`${targetDir}/tslib`, {recursive: true, force: true});

fs.symlinkSync(`${tstoolkitDir}/tsfront`, `${targetDir}/tsfront`);
fs.symlinkSync(`${tstoolkitDir}/tsui`, `${targetDir}/tsui`);
fs.symlinkSync(`${tstoolkitDir}/tslib`, `${targetDir}/tslib`);


fs.rmSync(`${targetDir}/tsmudbase`, {recursive: true, force: true});
fs.symlinkSync(`${sharedDir}/tsmudbase`, `${targetDir}/tsmudbase`);


// const { createHardLink } = await import(`${tstoolkitDir}/scripts/linkshared.mjs`);


// createHardLink(`${tstoolkitDir}/tsfront`, `${targetDir}/tsfront`);
// createHardLink(`${tstoolkitDir}/tsui`, `${targetDir}/tsui`);
// createHardLink(`${tstoolkitDir}/tslib`, `${targetDir}/tslib`);

