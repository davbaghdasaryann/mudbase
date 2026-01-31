import {ObjectId} from 'mongodb';

import {registerApiSession} from '@src/server/register';
import {respondHtml, respondJsonData, respondPdf} from '@tsback/req/req_response';

import * as Db from '@/db';

import htmlPdf from 'html-pdf-node';
import HTMLtoDOCX from 'html-to-docx';
import {requireQueryParam} from '@src/tsback/req/req_params';
import {verifyObject} from '@src/tslib/verify';
import {generateEstimateHTML, generateBoQHTML} from '@/lib/estimate_pdf';
import { assertObject } from '@/tslib/assert';

registerApiSession('estimate/generate_html', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');

    // let data = await genEstimateData(estimateId);
    // let data = await genEstimateDataOptimized(estimateId);
    const estimateData = await genEstimateDataWithPipeline(estimateId);

    // log_.info(estimateData);

    const html = generateEstimateHTML(estimateData, req.t);

    respondHtml(res, html);
});

registerApiSession('estimate/generate_pdf', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');

    const data = await genEstimateDataWithPipeline(estimateId);
    const html = generateEstimateHTML(data, req.t);

    const margins = 30;
    const options: htmlPdf.Options = {
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
            top: margins,
            bottom: margins,
            left: margins,
            right: margins,
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    const file = {content: html};

    htmlPdf.generatePdf(file, options, (err: Error, buffer: Buffer) => {
        if (err) {
            console.error('=== PDF generation error (Estimation) ===');
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            console.error('Error details:', JSON.stringify(err, null, 2));
            return res.status(500).json({
                error: 'PDF generation failed',
                message: err.message,
                details: err.toString()
            });
        }
        res.status(200)
            .set({
                'Content-Type': 'application/pdf',
                'Content-Length': buffer.length,
            })
            .send(buffer);
    });
});

registerApiSession('estimate/generate_word', async (req, res, session) => {
    try {
        const estimateId = requireQueryParam(req, 'estimateId');

        const estimateData = await genEstimateDataWithPipeline(estimateId);
        const html = generateEstimateHTML(estimateData, req.t);

        console.log('=== Word generation (Estimation) ===');
        console.log('HTML length:', html.length);

        // @ts-ignore - html-to-docx doesn't have type definitions
        const buffer = await HTMLtoDOCX(html, null, {
            orientation: 'landscape',
            margins: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
            },
        });

        console.log('Final buffer length:', buffer.length);

        res.status(200)
            .set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="estimate_${estimateId}.docx"`,
            })
            .send(buffer);
    } catch (error) {
        console.error('=== Word generation error (Estimation) ===');
        console.error('Error:', error);
        res.status(500).json({ error: 'Word generation failed', message: String(error) });
    }
});

// Bill of Quantities endpoints
registerApiSession('estimate/generate_boq_html', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');

    const estimateData = await genEstimateDataWithPipeline(estimateId);
    const html = generateBoQHTML(estimateData, req.t);

    respondHtml(res, html);
});

registerApiSession('estimate/generate_boq_pdf', async (req, res, session) => {
    const estimateId = requireQueryParam(req, 'estimateId');

    const data = await genEstimateDataWithPipeline(estimateId);
    const html = generateBoQHTML(data, req.t);

    const margins = 30;
    const options: htmlPdf.Options = {
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
            top: margins,
            bottom: margins,
            left: margins,
            right: margins,
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    const file = {content: html};

    htmlPdf.generatePdf(file, options, (err: Error, buffer: Buffer) => {
        if (err) {
            console.error('=== PDF generation error (BoQ) ===');
            console.error('Error message:', err.message);
            console.error('Error stack:', err.stack);
            console.error('Error details:', JSON.stringify(err, null, 2));
            return res.status(500).json({
                error: 'PDF generation failed',
                message: err.message,
                details: err.toString()
            });
        }
        res.status(200)
            .set({
                'Content-Type': 'application/pdf',
                'Content-Length': buffer.length,
            })
            .send(buffer);
    });
});

registerApiSession('estimate/generate_boq_word', async (req, res, session) => {
    try {
        const estimateId = requireQueryParam(req, 'estimateId');

        const estimateData = await genEstimateDataWithPipeline(estimateId);
        const html = generateBoQHTML(estimateData, req.t);

        console.log('=== Word generation (BoQ) ===');
        console.log('HTML length:', html.length);

        // @ts-ignore - html-to-docx doesn't have type definitions
        const buffer = await HTMLtoDOCX(html, null, {
            orientation: 'landscape',
            margins: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
            },
        });

        console.log('Final buffer length:', buffer.length);

        res.status(200)
            .set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="boq_${estimateId}.docx"`,
            })
            .send(buffer);
    } catch (error) {
        console.error('=== Word generation error (BoQ) ===');
        console.error('Error:', error);
        res.status(500).json({ error: 'Word generation failed', message: String(error) });
    }
});

async function getSectionsData(estimatedId: ObjectId) {
    let estimateSections = Db.getEstimateSectionsCollection();

    const sectionsData = estimateSections.find({estimateId: estimatedId}).toArray();
    // log_.info('secton data', sectionsData)
    return sectionsData;
}

async function getEstimateSubSection(estimatedSectionId: ObjectId) {
    let estimateSubsections = Db.getEstimateSubsectionsCollection();
    const subsectData = estimateSubsections.find({estimateSectionId: estimatedSectionId}).toArray();

    // log_.info('subsectData', subsectData)
    return subsectData;
}

async function getEstimateLabors(estimatedSubSectionId: ObjectId) {
    let estimatedLaborCollection = Db.getEstimateLaborItemsCollection();
    const laborsData = estimatedLaborCollection
        .find({estimateSubsectionId: estimatedSubSectionId})
        .toArray();
    // log_.info('estimatedLaborItem', estimatedLaborItem)
    return laborsData;
}

async function getEstimateMaterials(estimatedLaborId: ObjectId) {
    let estimatedMaterialsCollection = Db.getEstimateMaterialItemsCollection();
    const materialData = estimatedMaterialsCollection
        .find({estimatedLaborId: estimatedLaborId})
        .toArray();

    return materialData;
}

async function getLaborItemFullCode(laborItemId: ObjectId) {
    let laborItemCollection = Db.getLaborItemsCollection();
    let laborItem = await laborItemCollection.findOne({_id: laborItemId});
    //log_.info(laborItem);
    return laborItem?.fullCode ?? '';
}

async function getMaterialItem(materialItemId: ObjectId) {
    let materialItemCollection = Db.getMaterialItemsCollection();
    let materialItem = await materialItemCollection.findOne({_id: materialItemId});
    // log_.info(materialItemId, materialItem);
    return materialItem?.fullCode ?? '';
}

async function getMeasurementUnit(mesurmentUnitId: ObjectId) {
    let mesurmentUnitCollection = Db.getMeasurementUnitCollection();
    let unit = await mesurmentUnitCollection.findOne({_id: mesurmentUnitId});
    //   log_.info(unit)
    return unit!.representationSymbol;
}

function transformArray(arr: any) {
    return arr.map((item: any) => {
        const key = Object.keys(item)[0];
        return {
            name: key,
            value: item[key],
        };
    });
}

///////////////////////////////////////////////////////////////////////////////////////////

async function genEstimateData(estimateId: string) {
    const estimatesCol = Db.getEstimatesCollection();
    const foundEstimate = await estimatesCol.findOne({_id: new ObjectId(estimateId)});
    const estimate = verifyObject(foundEstimate, `Invalid Estimate: ${estimateId}`)!;

    // log_.info(estimate);

    let expences = transformArray(estimate.otherExpenses);

    const accountsCol = Db.getAccountsCollection();
    const account = await accountsCol.findOne({
        _id: estimate.sharedWithAccountId ?? estimate.accountId,
    });

    const sections = await getSectionsData(estimate!._id);
    const structuredData = [];
    let laborTotals = [];

    for (const section of sections) {
        const sectionData = {
            section: section,
            subsections: <any>[],
        };

        const subsections = await getEstimateSubSection(section._id);

        for (const subsection of subsections) {
            const subsectionData = {
                subsection: subsection,
                labors: <any>[],
            };

            const estimateLaborItems = await getEstimateLabors(subsection._id);

            if (estimateLaborItems) {
                let laborTotal = 0;
                for (const estimateLaborItem of estimateLaborItems) {
                    estimateLaborItem.laborItemId = await getLaborItemFullCode(
                        estimateLaborItem.laborItemId
                    ); //vat ban em arel
                    estimateLaborItem.measurementUnitMongoId = await getMeasurementUnit(
                        estimateLaborItem.measurementUnitMongoId
                    ); //vat ban em arel

                    laborTotal += estimateLaborItem.changableAveragePrice;

                    const estimateMaterialItems = await getEstimateMaterials(estimateLaborItem._id);
                    for (const materialItem of estimateMaterialItems) {
                        materialItem.materialItemId = new ObjectId(await getMaterialItem(
                            materialItem.materialItemId
                        ));
                        materialItem.measurementUnitMongoId = await getMeasurementUnit(
                            materialItem.measurementUnitMongoId
                        ); //vat ban em arel
                        laborTotal += materialItem.changableAveragePrice * materialItem.quantity;
                    }

                    const laborData = {
                        labor: estimateLaborItem,
                        materials: estimateMaterialItems,
                    };
                    subsectionData.labors.push(laborData);
                    laborTotals.push(laborTotal);
                }
            }

            sectionData.subsections.push(subsectionData);
        }

        structuredData.push(sectionData);
    }
    return {
        accountName: account?.companyName,
        estimate: estimate,
        sections: structuredData,
        laborTotals: laborTotals,
        expences: expences,
    };
}

// body { font-family: sans-serif; font-size: 12px; }

async function genEstimateDataWithPipeline(estimateId: string) {
    const estimatesCol = Db.getEstimatesCollection();
    // const log = log_;

    const pipeline: object[] = [
        {$match: {_id: new ObjectId(estimateId)}},
        {
            $addFields: {
                expences: {
                    $map: {
                        input: '$otherExpenses',
                        as: 'e',
                        in: {
                            $let: {
                                vars: {
                                    pair: {$arrayElemAt: [{$objectToArray: '$$e'}, 0]},
                                },
                                in: {name: '$$pair.k', value: '$$pair.v'},
                            },
                        },
                    },
                },
            },
        },

        {
            $lookup: {
                from: 'accounts',
                localField: 'accountId',
                foreignField: '_id',
                as: 'accountInfo',
            },
        },
        {$unwind: {path: '$accountInfo', preserveNullAndEmptyArrays: true}},

        {
            $lookup: {
                from: 'accounts',
                localField: 'sharedWithAccountId',
                foreignField: '_id',
                as: 'sharedAccountInfo',
            },
        },
        {$unwind: {path: '$sharedAccountInfo', preserveNullAndEmptyArrays: true}},

        {
            $lookup: {
                from: 'estimateSections',
                let: {estId: '$_id'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$estimateId', '$$estId']}}},
                    {
                        $lookup: {
                            from: 'estimateSubsections',
                            let: {secId: '$_id'},
                            pipeline: [
                                {$match: {$expr: {$eq: ['$estimateSectionId', '$$secId']}}},
                                {
                                    $lookup: {
                                        from: 'estimateLaborItems',
                                        let: {subId: '$_id'},
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: ['$estimateSubsectionId', '$$subId'],
                                                    },
                                                },
                                            },
                                            {
                                                $lookup: {
                                                    from: 'laborItems',
                                                    localField: 'laborItemId',
                                                    foreignField: '_id',
                                                    as: 'laborItemDoc',
                                                },
                                            },
                                            {
                                                $unwind: {
                                                    path: '$laborItemDoc',
                                                    preserveNullAndEmptyArrays: true,
                                                },
                                            },
                                            {
                                                $lookup: {
                                                    from: 'measurementUnits',
                                                    localField: 'measurementUnitMongoId',
                                                    foreignField: '_id',
                                                    as: 'laborUnitDoc',
                                                },
                                            },
                                            {
                                                $unwind: {
                                                    path: '$laborUnitDoc',
                                                    preserveNullAndEmptyArrays: true,
                                                },
                                            },
                                            {
                                                $addFields: {
                                                    laborItemId: '$laborItemDoc.fullCode',
                                                    measurementUnitMongoId:
                                                        '$laborUnitDoc.representationSymbol',
                                                },
                                            },
                                            {
                                                $lookup: {
                                                    from: 'estimateMaterialItems',
                                                    let: {labId: '$_id'},
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $eq: [
                                                                        '$estimatedLaborId',
                                                                        '$$labId',
                                                                    ],
                                                                },
                                                            },
                                                        },
                                                        {
                                                            $lookup: {
                                                                from: 'materialItems',
                                                                localField: 'materialItemId',
                                                                foreignField: '_id',
                                                                as: 'materialItemDoc',
                                                            },
                                                        },
                                                        {
                                                            $unwind: {
                                                                path: '$materialItemDoc',
                                                                preserveNullAndEmptyArrays: true,
                                                            },
                                                        },
                                                        {
                                                            $lookup: {
                                                                from: 'measurementUnits',
                                                                localField:
                                                                    'measurementUnitMongoId',
                                                                foreignField: '_id',
                                                                as: 'materialUnitDoc',
                                                            },
                                                        },
                                                        {
                                                            $unwind: {
                                                                path: '$materialUnitDoc',
                                                                preserveNullAndEmptyArrays: true,
                                                            },
                                                        },
                                                        {
                                                            $addFields: {
                                                                materialItemId:
                                                                    '$materialItemDoc.fullCode',
                                                                measurementUnitMongoId:
                                                                    '$materialUnitDoc.representationSymbol',
                                                            },
                                                        },
                                                    ],
                                                    as: 'materials',
                                                },
                                            },
                                        ],
                                        as: 'labors',
                                    },
                                },
                            ],
                            as: 'subsections',
                        },
                    },
                ],
                as: 'sections',
            },
        },
        {
            $project: {
                _id: 0,
                estimate: '$$ROOT',
                accountName: '$accountInfo.companyName',
                sharedAccountName: '$sharedAccountInfo.companyName',
                expences: 1,
                sections: 1,
            },
        },
    ];

    const result = await estimatesCol.aggregate(pipeline).next();

    // log_.info(result);

    if (!result) {
        // log_.info("check");
        return genEstimateDataOptimized(estimateId);
    }
    if (!Array.isArray(result.sections) || result.sections.length === 0) {
        return genEstimateDataOptimized(estimateId);
    }


    const laborTotals: number[] = [];
    for (const section of result.sections) {
        for (const subsection of section.subsections || []) {
            for (const laborData of subsection.labors || []) {
                let total = laborData.changableAveragePrice || 0;
                for (const mat of laborData.materials || []) {
                    total += (mat.changableAveragePrice || 0) * (mat.quantity || 0);
                }
                laborTotals.push(total);
            }
        }
    }

    return {
        accountName: result.accountName,
        sharedAccountName: result.sharedAccountName,
        estimate: result.estimate,
        sections: result.sections,
        laborTotals,
        expences: result.expences,
    };
}

async function genEstimateDataOptimized(estimateId: string) {
    const estimatesCol = Db.getEstimatesCollection();
    const sectionsCol = Db.getEstimateSectionsCollection();
    const subsectionsCol = Db.getEstimateSubsectionsCollection();
    const laborsCol = Db.getEstimateLaborItemsCollection();
    const materialsCol = Db.getEstimateMaterialItemsCollection();
    const laborItemsCol = Db.getLaborItemsCollection();
    const materialItemsCol = Db.getMaterialItemsCollection();
    const unitsCol = Db.getMeasurementUnitCollection();
    const accountsCol = Db.getAccountsCollection();

    const foundEstimate = await estimatesCol.findOne({_id: new ObjectId(estimateId)});
    const estimate = assertObject(foundEstimate, "Invalid estimate")!;

    const account = await accountsCol.findOne({_id: estimate.sharedWithAccountId ?? estimate.accountId});
    // const sharedWithAccount = await accountsCol.findOne({_id: estimate.accountId});

    // const [estimate, account] = await Promise.all([
    //     estimatesCol.findOne({_id: new ObjectId(estimateId)}),
    //     (async () => {
    //         const est = await estimatesCol.findOne({_id: new ObjectId(estimateId)});
    //         return est ? accountsCol.findOne({_id: est.accountId}) : null;
    //     })(),
    // ]);
    // if (!estimate) throw new Error(`Invalid Estimate: ${estimateId}`);
    const expences = transformArray(estimate.otherExpenses);

    // 2) Bulk-fetch sections, subsections, labours, materials
    const sections = await sectionsCol.find({estimateId: estimate._id}).toArray();
    const subsections = await subsectionsCol
        .find({
            estimateSectionId: {$in: sections.map((s) => s._id)},
        })
        .toArray();

    const labors = await laborsCol
        .find({
            estimateSubsectionId: {$in: subsections.map((ss) => ss._id)},
        })
        .toArray();

    const materials = await materialsCol
        .find({
            estimatedLaborId: {$in: labors.map((l) => l._id)},
        })
        .toArray();

    // 3) Bulk-fetch the “details” docs we need to join:
    //    all labourItem, materialItem, and unit docs
    const labourItemIds = Array.from(new Set(labors.map((l) => l.laborItemId.toString()))).map(
        (id) => new ObjectId(id)
    );
    const materialItemIds = Array.from(
        new Set(materials.map((m) => m.materialItemId.toString()))
    ).map((id) => new ObjectId(id));

    const unitIds = Array.from(
        new Set([
            ...labors.map((l) => l.measurementUnitMongoId.toString()),
            ...materials.map((m) => m.measurementUnitMongoId.toString()),
        ])
    ).map((id) => new ObjectId(id));

    const [labourItems, materialItems, units] = await Promise.all([
        laborItemsCol
            .find({_id: {$in: labourItemIds}})
            .project({fullCode: 1})
            .toArray(),
        materialItemsCol
            .find({_id: {$in: materialItemIds}})
            .project({fullCode: 1})
            .toArray(),
        unitsCol
            .find({_id: {$in: unitIds}})
            .project({representationSymbol: 1})
            .toArray(),
    ]);

    // 4) Build in-memory lookup maps
    const labourItemMap = new Map(labourItems.map((d) => [d._id.toString(), d.fullCode]));
    const materialItemMap = new Map(materialItems.map((d) => [d._id.toString(), d.fullCode]));
    const unitMap = new Map(units.map((d) => [d._id.toString(), d.representationSymbol]));

    // 5) Assemble your tree
    const sectionsMap = new Map<string, {section: any; subsections: any[]}>();
    sections.forEach((s) => sectionsMap.set(s._id.toString(), {section: s, subsections: []}));

    const subsectionsMap = new Map<string, {subsection: any; labors: any[]}>();
    subsections.forEach((ss) => {
        const parent = sectionsMap.get(ss.estimateSectionId.toString())!;
        const entry = {subsection: ss, labors: []};
        subsectionsMap.set(ss._id.toString(), entry);
        parent.subsections.push(entry);
    });

    const laborsMap = new Map<string, {labor: any; materials: any[]}>();
    labors.forEach((l) => {
        const entry = {
            labor: {
                ...l,
                laborItemId: labourItemMap.get(l.laborItemId.toString()) || '',
                measurementUnitMongoId: unitMap.get(l.measurementUnitMongoId.toString()) || '',
            },
            materials: [],
        };
        laborsMap.set(l._id.toString(), entry);
        subsectionsMap.get(l.estimateSubsectionId.toString())!.labors.push(entry);
    });

    materials.forEach((m) => {
        const parent = laborsMap.get(m.estimatedLaborId.toString());
        if (!parent) return;
        parent.materials.push({
            ...m,
            materialItemId: materialItemMap.get(m.materialItemId.toString()) || '',
            measurementUnitMongoId: unitMap.get(m.measurementUnitMongoId.toString()) || '',
        });
    });

    // 6) Compute totals
    const laborTotals: number[] = [];
    for (const {labor, materials} of laborsMap.values()) {
        let total = labor.changableAveragePrice;
        for (const mat of materials) {
            total += mat.changableAveragePrice * mat.quantity;
        }
        laborTotals.push(total);
    }

    // log_.info('laborTotals genEstimateDataOptimized: ', laborTotals)

    return {
        accountName: account?.companyName,
        estimate,
        sections: Array.from(sectionsMap.values()),
        laborTotals,
        expences,
    };
}
