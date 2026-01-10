#! /usr/bin/env zx

//import 'zx/globals';

import fs from "fs";

$.stdio = 'inherit';

let deployRoot = '/srv/mudbase/frontend';
let deployTarget = `${deployRoot}/build`;

try {
    fs.rmSync('build', {recursive: true, force: true})
    fs.rmSync('node_modules', {recursive: true, force: true})


    // Relink tstoolkit
    await $`zx linkshared.mjs`;


    await $`yarn`;
    await $`yarn build`;

    // fs.mkdirSync(backupsDir, {recursive: true});
    // await $`7z a ${backupsDir}/${deployName}-${timestamp}.7z build`;

    fs.rmSync(deployTarget, {force: true, recursive: true});

    fs.renameSync('build', deployTarget);
    
    fs.rmSync('node_modules', {recursive: true, force: true})

} catch(err) {
    console.error(err);
    process.exit(1);
}
