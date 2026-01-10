import { getStateCollection } from "./entities/entity_state";

export async function genStateIntValue(name: string) {
    // console.log("db state: ", name);

    let state = getStateCollection();

    let result = await state.findOneAndUpdate(
        {name: name},
        {$inc: {intValue: 1}},
        {
            returnDocument: 'before',
            upsert: true,
        }
    );

    // console.log("state result: ", result);

    if (!result) throw new Error(`Invalid database state: ${name}`);

    return result.intValue;
}

