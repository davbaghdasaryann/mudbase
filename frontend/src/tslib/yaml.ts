import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

export function loadYaml<T>(filename: string) {

    let data = fs.readFileSync(filename, 'utf-8')
    let obj = yaml.load(data.toString(), {
        filename: filename,
        schema: yaml.DEFAULT_SCHEMA,
    })

    return obj as T
}
