import {registerApiSession} from '@/server/register';

import * as Db from '@/db';

import {getReqParam, requireQueryParam} from '@/tsback/req/req_params';
import {respondJson, respondJsonData} from '@/tsback/req/req_response';
import {DbFindParams, getMongoIdParam, requireMongoIdParam} from '@/tsback/mongodb/mongodb_params';
import {verify} from '@/tslib/verify';
import {validatePositiveInteger} from '@/tslib/validate';
import {updateMaterialItemStats} from '@/api/catalog/materials';

const materialOfferSelectFields = ['price', 'measurementUnitMongoId'];

registerApiSession('material/fetch_offers', async (req, res, session) => {
    let materialItemId = requireMongoIdParam(req, 'materialItemId');

    let searchVal = requireQueryParam(req, 'searchVal');
    let calledFromPage = getReqParam(req, 'calledFromPage');
    let accountId = getMongoIdParam(req, 'accountViewId');

    let materialOffers = Db.getMaterialOffersCollection();

    let matchingCodeArray = [];
    matchingCodeArray.push({
        itemId: materialItemId,
    });

    // log_.info('calledFromPage', calledFromPage)

    if (calledFromPage === 'offers') {
        matchingCodeArray.push({
            accountId: accountId ?? session.mongoAccountId,
        });
    } else {
        matchingCodeArray.push({
            isArchived: false,
        });

        matchingCodeArray.push({
            price: {$ne: 0},
        });
    }

    let pipeline: any[] = [
        {
            $match: {
                $and: matchingCodeArray,
            },
        },
        {
            $lookup: {
                from: 'material_items',
                let: {itemIdVar: '$itemId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$_id', '$$itemIdVar']},
                        },
                    },
                    {
                        $project: {
                            fullCode: 1,
                            name: 1,
                            _id: 0,
                        },
                    },
                ],
                as: 'itemData',
            },
        },
        {
            $match: {
                itemData: {$ne: []},
            },
        },
        {
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'measurementUnitData',
            },
        },
        {
            $lookup: {
                from: 'accounts',
                let: {accountIdVar: '$accountId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$_id', '$$accountIdVar']},
                        },
                    },
                    {
                        $project: {
                            companyName: 1,
                            isDev: 1,
                            _id: 0,
                        },
                    },
                ],
                as: 'accountMadeOfferData',
            },
        },
    ];

    if (searchVal !== 'empty') {
        pipeline.splice(1, 1, {
            $lookup: {
                from: 'material_items',
                let: {itemIdVar: '$itemId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$_id', '$$itemIdVar']},
                        },
                    },
                    {
                        $project: {
                            fullCode: 1,
                            name: 1,
                            _id: 0,
                        },
                    },
                ],
                as: 'itemData',
            },
        });

        pipeline.splice(2, 0, {
            $match: {
                $or: [
                    {'itemData.fullCode': {$regex: searchVal, $options: 'i'}},
                    {'itemData.name': {$regex: searchVal, $options: 'i'}},
                ],
            },
        });

        const measurementUnitIndex = pipeline.findIndex(
            (stage) => stage.$lookup && stage.$lookup.from === 'measurement_unit'
        );
        if (measurementUnitIndex !== -1) {
            pipeline.splice(measurementUnitIndex, 1);
        }

        pipeline.push({
            $lookup: {
                from: 'measurement_unit',
                localField: 'measurementUnitMongoId',
                foreignField: '_id',
                as: 'measurementUnitData',
            },
        });

        pipeline.push({
            $lookup: {
                from: 'accounts',
                let: {accountIdVar: '$accountId'},
                pipeline: [
                    {
                        $match: {
                            $expr: {$eq: ['$_id', '$$accountIdVar']},
                        },
                    },
                    {
                        $project: {
                            companyName: 1,
                            isDev: 1,
                            _id: 0,
                        },
                    },
                ],
                as: 'accountMadeOfferData',
            },
        });
    }

    if (process.env.NODE_ENV === 'production') {
        pipeline.push({
            $match: {
                'accountMadeOfferData.isDev': {$ne: true},
            },
        });
    }

    const data = await materialOffers.aggregate(pipeline).toArray();

    respondJsonData(res, data);
});

registerApiSession('material/get_offer', async (req, res, session) => {
    let materialOfferId = requireMongoIdParam(req, 'offerId');
    let materialOffersColl = Db.getMaterialOffersCollection();

    let options = new DbFindParams(req, {
        select: materialOfferSelectFields,
    });

    let materialOffer = await materialOffersColl.findOne(
        {_id: materialOfferId},
        options.getFindOptions()
    );

    respondJsonData(res, materialOffer);
});

registerApiSession('material/add_offer', async (req, res, session) => {
    let materialItemId = requireMongoIdParam(req, 'materialItemId');
    let materialOfferPriceString = requireQueryParam(req, 'materialOfferPrice');
    let materialOfferCurrency = requireQueryParam(req, 'materialOfferCurrency');
    let materialOfferMeasurementUnitMongoId = requireMongoIdParam(
        req,
        'materialOfferMeasurementUnitMongoId'
    );
    let materialOfferAnonymous = requireQueryParam(req, 'materialOfferAnonymous');
    let materialOfferPublic = requireQueryParam(req, 'materialOfferPublic');

    verify(validatePositiveInteger(materialOfferPriceString), req.t('validate.integer'));
    let materialOfferPrice = parseInt(materialOfferPriceString);

    let materialOffersColl = Db.getMaterialOffersCollection();

    let material = await materialOffersColl.findOne({
        itemId: materialItemId,
        accountId: session.mongoAccountId,
    });
    let hasAlreadyOffered = !!material; // !! this converts the result to true or false;

    verify(!hasAlreadyOffered, req.t('validate.already_offered'));

    let newMaterialOffer = {} as Db.EntityMaterialOffer;

    let isAnonymous: boolean;
    if (materialOfferAnonymous === 'true') {
        isAnonymous = true;
    } else {
        isAnonymous = false;
    }

    let isPublic: boolean;
    if (materialOfferPublic === 'true') {
        isPublic = true;
    } else {
        isPublic = false;
    }

    newMaterialOffer.isActive = true;
    newMaterialOffer.itemId = materialItemId;
    if (session.mongoUserId) {
        newMaterialOffer.userId = session.mongoUserId;
    }
    if (session.mongoAccountId) {
        newMaterialOffer.accountId = session.mongoAccountId;
    }
    newMaterialOffer.createdAt = new Date();
    newMaterialOffer.updatedAt = newMaterialOffer.createdAt;
    newMaterialOffer.anonymous = isAnonymous;
    newMaterialOffer.public = isPublic;
    newMaterialOffer.price = materialOfferPrice;
    newMaterialOffer.currency = materialOfferCurrency;
    newMaterialOffer.measurementUnitMongoId = materialOfferMeasurementUnitMongoId;

    newMaterialOffer.isArchived = false; // new

    const result = await materialOffersColl.insertOne(newMaterialOffer);
    const newAddedMaterialOfferId = result.insertedId;

    // let updatedMaterialOffer = await materialOffersColl.findOne({ _id: newAddedMaterialOfferId });
    let materialPricesJournalColl = Db.getMaterialPricesJournalCollection();

    let addingMaterialOfferPricesJournal = {} as Db.EntityMaterialPricesJournal;

    addingMaterialOfferPricesJournal.itemId = newAddedMaterialOfferId;
    addingMaterialOfferPricesJournal.price = newMaterialOffer.price;
    addingMaterialOfferPricesJournal.currency = newMaterialOffer.currency;
    addingMaterialOfferPricesJournal.measurementUnitMongoId =
        newMaterialOffer.measurementUnitMongoId;
    addingMaterialOfferPricesJournal.userId = newMaterialOffer.userId;
    addingMaterialOfferPricesJournal.date = newMaterialOffer.updatedAt;

    addingMaterialOfferPricesJournal.isArchived = newMaterialOffer.isArchived;

    materialPricesJournalColl.insertOne(addingMaterialOfferPricesJournal);

    await updateMaterialItemStats(materialItemId);

    respondJson(res, result);
});

registerApiSession('material/update_offer', async (req, res, session) => {
    let materialOfferId = requireMongoIdParam(req, 'materialOfferId');
    let materialOfferPriceString = requireQueryParam(req, 'materialOfferPrice');
    let materialOfferCurrency = requireQueryParam(req, 'materialOfferCurrency');
    let materialOfferAnonymous = requireQueryParam(req, 'materialOfferAnonymous');
    let materialOfferPublic = requireQueryParam(req, 'materialOfferPublic');
    let materialOfferisActive = requireQueryParam(req, 'isActive');

    verify(validatePositiveInteger(materialOfferPriceString), req.t('validate.integer'));
    let materialOfferPrice = parseInt(materialOfferPriceString);

    let isAnonymous = materialOfferAnonymous === 'true';

    let isPublic: boolean;
    if (materialOfferPublic === 'true') {
        isPublic = true;
    } else {
        isPublic = false;
    }

    let isActive: boolean;
    if (materialOfferisActive === 'false') {
        isActive = false;
    } else {
        isActive = true;
    }

    let materialOffers = Db.getMaterialOffersCollection();

    await materialOffers.updateOne(
        {
            _id: materialOfferId,
        },
        {
            $set: {
                anonymous: isAnonymous,
                public: isPublic,
                isActive: isActive,
                ...(materialOfferPrice && {price: materialOfferPrice}), // if price exists add
                ...(materialOfferCurrency && {currency: materialOfferCurrency}), // if currency exists add
                // ...(materialOfferMeasurementUnitMongoId && { measurementUnitMongoId: materialOfferMeasurementUnitMongoId }), // if normative_expand exists add
                updatedAt: new Date(),
            },
        }
    );

    let updatedMaterialOffer = (await materialOffers.findOne({
        _id: materialOfferId,
    })) as Db.EntityMaterialOffer;
    let materialPricesJournal = Db.getMaterialPricesJournalCollection();

    let addingMaterialOfferPricesJournal = {} as Db.EntityMaterialPricesJournal;

    addingMaterialOfferPricesJournal.itemId = updatedMaterialOffer._id;
    addingMaterialOfferPricesJournal.price = updatedMaterialOffer.price;
    addingMaterialOfferPricesJournal.currency = updatedMaterialOffer.currency;
    addingMaterialOfferPricesJournal.userId = updatedMaterialOffer.userId;
    addingMaterialOfferPricesJournal.date = updatedMaterialOffer.updatedAt;

    materialPricesJournal.insertOne(addingMaterialOfferPricesJournal);

    log_.info(updatedMaterialOffer);
    await updateMaterialItemStats(updatedMaterialOffer.itemId);

    respondJson(res, updatedMaterialOffer);
});

registerApiSession('material/archive_offer', async (req, res, session) => {
    let materialOfferId = requireMongoIdParam(req, 'itemOfferId');
    let materialOffers = Db.getMaterialOffersCollection();

    const result = await materialOffers.updateOne(
        {
            _id: materialOfferId,
        },
        {
            $set: {
                isArchived: true,
                archivedAt: new Date(),
            },
        }
    );

    let updatedMaterialOffer = (await materialOffers.findOne({
        _id: materialOfferId,
    })) as Db.EntityMaterialOffer;
    let materialPricesJournal = Db.getMaterialPricesJournalCollection();

    let archiveMaterialOfferPricesJournal = {} as Db.EntityMaterialPricesJournal;

    archiveMaterialOfferPricesJournal.itemId = updatedMaterialOffer._id;
    archiveMaterialOfferPricesJournal.price = updatedMaterialOffer.price;
    archiveMaterialOfferPricesJournal.currency = updatedMaterialOffer.currency;
    archiveMaterialOfferPricesJournal.measurementUnitMongoId =
        updatedMaterialOffer.measurementUnitMongoId;
    archiveMaterialOfferPricesJournal.userId = updatedMaterialOffer.userId;

    archiveMaterialOfferPricesJournal.isArchived = updatedMaterialOffer.isArchived;
    archiveMaterialOfferPricesJournal.archivedAt = updatedMaterialOffer.archivedAt;

    materialPricesJournal.insertOne(archiveMaterialOfferPricesJournal);

    await updateMaterialItemStats(updatedMaterialOffer.itemId);

    respondJson(res, result);
});

registerApiSession('material/unarchive_offer', async (req, res, session) => {
    let materialOfferId = requireMongoIdParam(req, 'itemOfferId');
    let materialOffers = Db.getMaterialOffersCollection();

    const result = await materialOffers.updateOne(
        {
            _id: materialOfferId,
        },
        {
            $set: {
                isArchived: false,
                archivedAt: new Date(),
            },
        }
    );

    let updatedMaterialOffer = (await materialOffers.findOne({
        _id: materialOfferId,
    })) as Db.EntityMaterialOffer;
    let materialPricesJournal = Db.getMaterialPricesJournalCollection();

    let unarchiveMaterialOfferPricesJournal: Db.EntityMaterialPricesJournal =
        {} as Db.EntityMaterialPricesJournal;

    unarchiveMaterialOfferPricesJournal.itemId = updatedMaterialOffer._id;
    unarchiveMaterialOfferPricesJournal.price = updatedMaterialOffer.price;
    unarchiveMaterialOfferPricesJournal.currency = updatedMaterialOffer.currency;
    unarchiveMaterialOfferPricesJournal.measurementUnitMongoId =
        updatedMaterialOffer.measurementUnitMongoId;
    unarchiveMaterialOfferPricesJournal.userId = updatedMaterialOffer.userId;

    unarchiveMaterialOfferPricesJournal.isArchived = updatedMaterialOffer.isArchived;
    unarchiveMaterialOfferPricesJournal.unarchivedAt = updatedMaterialOffer.unarchivedAt;

    materialPricesJournal.insertOne(unarchiveMaterialOfferPricesJournal);

    await updateMaterialItemStats(updatedMaterialOffer.itemId);

    respondJson(res, result);
});
