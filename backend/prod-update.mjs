#! /usr/bin/env zx

//import 'zx/globals';

import fs from "fs";

$.stdio = 'inherit';

let toolkitDir = '../../tstoolkit';

let deployName = 'mudbase';
let deployRoot = '/srv/mudbase/backend';
//let deployTarget = `${deployRoot}/build`;
let backupsDir = `${deployRoot}/backup`;
let templatesDir = `${deployRoot}/templates`;

try {
    let date = new Date();
    let timestamp = makeTimestamp(date);

    // Remove current build and packages
    fs.rmSync('build', {recursive: true, force: true})
    fs.rmSync('node_modules', {recursive: true, force: true})


    // Relink tstoolkit
    await $`zx linkshared.mjs`;


    // Build the packcage
    await $`yarn`;
    await $`yarn build`;

    // fs.mkdirSync(backupsDir, {recursive: true});
    //await $`7z a ${backupsDir}/${deployName}-${timestamp}.7z build node_modules`;

    fs.rmSync(`${deployRoot}/build`, {force: true, recursive: true});
    fs.rmSync(`${deployRoot}/node_modules`, {force: true, recursive: true});

    fs.rmSync(`${deployRoot}/templates`, {force: true, recursive: true});
    fs.rmSync(`${deployRoot}/locales`, {force: true, recursive: true});

    await $`sudo pm2 stop ${deployName}`;

    fs.renameSync('build', `${deployRoot}/build`);
    fs.renameSync('node_modules', `${deployRoot}/node_modules`);
    fs.cpSync('templates', `${deployRoot}/templates`, {recursive: true});
    fs.cpSync('locales', `${deployRoot}/locales`, {recursive: true});

    // Add package.json (for pm2 to recognize that it's a module)
    fs.copyFileSync('package.json', `${deployRoot}/build/package.json`);

    await $`sudo pm2 start ${deployName}`;
    await $`sudo pm2 status`;

} catch(err) {
    console.error(err);
    process.exit(1);
}


function makeTimestamp(date) {
    let year = date.getFullYear();
    let mo = date.getMonth();
    let dy = date.getDate();

    let hr = date.getHours();
    let mn = date.getMinutes();
    let sc = date.getSeconds();

    let timestamp = `${year}${pad(mo, 2)}${pad(dy, 2)}${pad(hr, 2)}${pad(mn, 2)}${pad(sc, 2)}`;

    return timestamp;
}


function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}
