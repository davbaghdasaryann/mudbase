#! /usr/bin/env zx

import fs from 'fs';
import path from 'path/posix';


const tstoolkitDir = path.resolve("../../tstoolkit");
const sharedDir = path.resolve("../shared");
const targetDir = path.resolve("./src");


fs.rmSync(`${targetDir}/tsback`, {recursive: true, force: true});
fs.rmSync(`${targetDir}/tscli`, {recursive: true, force: true});
fs.rmSync(`${targetDir}/tslib`, {recursive: true, force: true});

fs.symlinkSync(`${tstoolkitDir}/tsback`, `${targetDir}/tsback`);
fs.symlinkSync(`${tstoolkitDir}/tscli`, `${targetDir}/tscli`);
fs.symlinkSync(`${tstoolkitDir}/tslib`, `${targetDir}/tslib`);


fs.rmSync(`${targetDir}/tsmudbase`, {recursive: true, force: true});
fs.symlinkSync(`${sharedDir}/tsmudbase`, `${targetDir}/tsmudbase`);


// const { createHardLink } = await import(`${tstoolkitDir}/scripts/linkshared.mjs`);


// createHardLink(`${tstoolkitDir}/tsback`, `${targetDir}/tsback`);
// createHardLink(`${tstoolkitDir}/tscli`, `${targetDir}/tscli`);
// createHardLink(`${tstoolkitDir}/tslib`, `${targetDir}/tslib`);

// fs.rmSync("src/tsback/token.ts");
// fs.rmSync("src/tsback/aws", {recursive: true, force: true});

// fs.rmSync("src/tsback/req/req_session.ts");
// fs.rmSync("src/tsback/req/req_token.ts");

