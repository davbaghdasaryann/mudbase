import { registerApiSession } from '@/server/register';
import { ObjectId } from 'mongodb';

import * as Db from '@/db';

import { getReqParam, requireQueryParam } from '../../../tsback/req/req_params';
import { respondJson, respondJsonData } from '../../../tsback/req/req_response';
import { DbFindParams, requireMongoIdParam } from '../../../tsback/mongodb/mongodb_params';
import { verify } from '../../../tslib/verify';
import { validatePositiveInteger } from '../../../tslib/validate';
import { updateLaborItemStats } from '@/api/catalog/labors/labor_item';
import { captureSnapshotsForItem } from '@/api/dashboard/snapshot/snapshot_utils';

const laborOfferSelectFields = [
    'price', 'laborHours', 'measurementUnitMongoId' //🔴 TODO: this will need us in version 2 🔴
    // 'price', 'measurementUnitMongoId'
];



registerApiSession('labor/fetch_offers', async (req, res, session) => {
    let laborItemId = requireMongoIdParam(req, 'laborItemId');

    let searchVal = requireQueryParam(req, 'searchVal');
    let calledFromPage = getReqParam(req, 'calledFromPage');
    
    let accountIdStr = getReqParam(req, 'accountViewId');
    let accountId: ObjectId | undefined = undefined
    if (accountIdStr) {
        accountId = new ObjectId(getReqParam(req, 'accountViewId'));
    }

    let laborOffersColl = Db.getLaborOffersCollection();

    let matchingCodeArray = [];
    matchingCodeArray.push(
        {
            itemId: laborItemId
        },
    )

    // log_.info('calledFromPage', calledFromPage)
    if (calledFromPage === 'offers') {
        matchingCodeArray.push(
            {
                accountId: accountId ?? session.mongoAccountId
            },

        )
    } else {
        matchingCodeArray.push(
            {
                isArchived: false
            }
        )

    }

    // log_.info('matchingCodeArray', matchingCodeArray)
    let pipeline: any[] = [
        {
            $match: {
                $and: matchingCodeArray
            }
        },
        // Filter to show: (isActive:true) OR (user's own offer regardless of isActive)
        ...(calledFromPage !== 'offers' ? [
            {
                $match: {
                    $or: [
                        {isActive: true},
                        {accountId: session.mongoAccountId}
                    ]
                }
            }
        ] : []),
        {
            $lookup: {
                from: 'labor_items',
                let: { itemIdVar: '$itemId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$itemIdVar'] },
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
                itemData: { $ne: [] },
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
                let: { accountIdVar: '$accountId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$accountIdVar'] },
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
        }
    ];

    if (searchVal !== 'empty') {
        pipeline.splice(1, 1, {
            $lookup: {
                from: 'labor_items',
                let: { itemIdVar: '$itemId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$itemIdVar'] },
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
                    { 'itemData.fullCode': { $regex: searchVal, $options: 'i' } },
                    { 'itemData.name': { $regex: searchVal, $options: 'i' } },
                ],
            },
        });

        const measurementUnitIndex = pipeline.findIndex(stage =>
            stage.$lookup && stage.$lookup.from === 'measurement_unit'
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
                let: { accountIdVar: '$accountId' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$accountIdVar'] },
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
                'accountMadeOfferData.isDev': { $ne: true },
            },
        });
    }


    const data = await laborOffersColl.aggregate(pipeline).toArray();

    // log_.info('session.accountMongoId', session.mongoAccountId, data);

    respondJsonData(res, data);
});


registerApiSession('labor/get_offer', async (req, res, session) => {

    let laborOfferId = requireMongoIdParam(req, 'offerId');
    let laborOffers = Db.getLaborOffersCollection();

    let data: Db.EntityLaborOffers[] = [];

    let options = new DbFindParams(req, {
        select: laborOfferSelectFields,
    });

    let laborOffer = await laborOffers.findOne({ _id: laborOfferId }, options.getFindOptions());

    respondJsonData(res, laborOffer);
});


registerApiSession('labor/add_offer', async (req, res, session) => {
    let laborItemId = requireMongoIdParam(req, 'laborItemId');
    let laborOfferMeasurementUnitMongoId = requireMongoIdParam(req, 'laborOfferMeasurementUnitMongoId');
    let laborOfferLaborHours = parseFloat(requireQueryParam(req, 'laborOfferLaborHours')); //🔴 TODO: this will need us in version 2 🔴
    // laborOfferLaborHours = Math.round(laborOfferLaborHours * 100) / 100;


    let laborOfferPriceString = requireQueryParam(req, 'laborOfferPrice');
    let laborOfferCurrency = requireQueryParam(req, 'laborOfferCurrency');

    // let laborOfferUnitWorkload = parseInt(requireQueryParam(req, 'laborOfferUnitWorkload'));
    let laborOfferAnonymous = requireQueryParam(req, 'laborOfferAnonymous');
    let laborOfferPublic = requireQueryParam(req, 'laborOfferPublic');

    verify(validatePositiveInteger(laborOfferPriceString), req.t('validate.integer'))
    let laborOfferPrice = parseInt(laborOfferPriceString)


    let laborOffers = Db.getLaborOffersCollection();

    let labor = await laborOffers.findOne({
        itemId: laborItemId,
        accountId: session.mongoAccountId
    });
    let hasAlreadyOffered = !!labor; // !! this converts the result to true or false;

    verify(!hasAlreadyOffered, req.t('validate.already_offered'))


    let newLaborOffer = {} as Db.EntityLaborOffers

    let isAnonymous: boolean
    if (laborOfferAnonymous === 'true') {
        isAnonymous = true
    } else {
        isAnonymous = false
    }

    let isPublic: boolean
    if (laborOfferPublic === 'true') {
        isPublic = true
    } else {
        isPublic = false
    }


    newLaborOffer.isActive = true;
    newLaborOffer.itemId = laborItemId
    if (session.mongoUserId) {
        newLaborOffer.userId = session.mongoUserId
    }
    if (session.mongoAccountId) {
        newLaborOffer.accountId = session.mongoAccountId
    }
    newLaborOffer.createdAt = new Date;
    newLaborOffer.updatedAt = newLaborOffer.createdAt;
    newLaborOffer.anonymous = isAnonymous;
    newLaborOffer.public = isPublic;
    newLaborOffer.price = laborOfferPrice;
    newLaborOffer.currency = laborOfferCurrency;
    newLaborOffer.laborHours = laborOfferLaborHours; //🔴 TODO: this will need us in version 2 🔴
    newLaborOffer.measurementUnitMongoId = laborOfferMeasurementUnitMongoId;

    newLaborOffer.isArchived = false; //new


    verify(newLaborOffer.accountId && newLaborOffer.userId, req.t('auth.session_error'));


    const result = await laborOffers.insertOne(newLaborOffer);
    const newAddedLaborOfferId = result.insertedId;



    let updatedLaborOffer = await laborOffers.findOne({ _id: newAddedLaborOfferId }) as Db.EntityLaborOffers;
    let laborPricesJournal = Db.getLaborPricesJournalCollection();

    let addingLaborOfferPricesJournal: Db.EntityLaborPricesJournal = {} as Db.EntityLaborPricesJournal;

    addingLaborOfferPricesJournal.itemId = updatedLaborOffer._id
    addingLaborOfferPricesJournal.price = updatedLaborOffer.price
    addingLaborOfferPricesJournal.currency = updatedLaborOffer.currency
    addingLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
    addingLaborOfferPricesJournal.measurementUnitMongoId = updatedLaborOffer.measurementUnitMongoId
    addingLaborOfferPricesJournal.userId = updatedLaborOffer.userId;
    addingLaborOfferPricesJournal.date = updatedLaborOffer.updatedAt;

    addingLaborOfferPricesJournal.isArchived = false; //new

    laborPricesJournal.insertOne(addingLaborOfferPricesJournal);

    await updateLaborItemStats(laborItemId);
    await captureSnapshotsForItem(laborItemId, 'labor');

    respondJson(res, result);
});


registerApiSession('labor/update_offer', async (req, res, session) => {
    let laborOfferId = requireMongoIdParam(req, 'laborOfferId');
    let laborOfferPriceString = requireQueryParam(req, 'laborOfferPrice');
    let laborOfferCurrency = requireQueryParam(req, 'laborOfferCurrency');
    laborOfferCurrency = 'AMD' //TODO then it will take from database

    let laborOfferPrice: number | undefined = undefined;
    log_.info('laborOfferPriceString', laborOfferPriceString)
    if (laborOfferPriceString !== 'undefined') {
        verify(validatePositiveInteger(laborOfferPriceString), req.t('validate.integer'))
        laborOfferPrice = parseInt(laborOfferPriceString)
    }

    let laborOfferLaborHoursString = requireQueryParam(req, 'laborOfferLaborHours'); //🔴 TODO: this will need us in version 2 🔴
    let laborOfferLaborHours: number | undefined = undefined;
    if (laborOfferLaborHoursString !== 'undefined') {
        laborOfferLaborHours = parseFloat(laborOfferLaborHoursString);
        // laborOfferLaborHours = Math.round(laborOfferLaborHours * 100) / 100;
    }

    let laborOfferAnonymous = requireQueryParam(req, 'laborOfferAnonymous');
    let laborOfferPublic = requireQueryParam(req, 'laborOfferPublic');
    let laborOfferisActive = requireQueryParam(req, 'isActive');


    let isAnonymous: boolean
    if (laborOfferAnonymous === 'true') {
        isAnonymous = true
    } else {
        isAnonymous = false
    }

    let isPublic: boolean
    if (laborOfferPublic === 'true') {
        isPublic = true
    } else {
        isPublic = false
    }

    let isActive: boolean
    if (laborOfferisActive === 'false') {
        isActive = false
    } else {
        isActive = true
    }



    // Build the update object conditionally.
    const updateData: Partial<Db.EntityLaborOffers> = {
        // Always update these fields:
        anonymous: isAnonymous,
        public: isPublic,
        isActive: isActive,
        updatedAt: new Date(),
    };

    // Only update price and currency if a new price is provided.
    if (laborOfferPrice !== undefined) {
        updateData.price = laborOfferPrice;
        updateData.currency = laborOfferCurrency;
    }

    // Only update laborHours if provided.
    if (laborOfferLaborHours !== undefined) {
        updateData.laborHours = laborOfferLaborHours;
    }



    let laborOffers = Db.getLaborOffersCollection();

    const result = await laborOffers.updateOne({ _id: laborOfferId }, { $set: updateData });


    let updatedLaborOffer = (await laborOffers.findOne({ _id: laborOfferId }))!;
    let laborPricesJournal = Db.getLaborPricesJournalCollection();

    let addingLaborOfferPricesJournal = {} as Db.EntityLaborPricesJournal;

    addingLaborOfferPricesJournal.itemId = updatedLaborOffer._id
    addingLaborOfferPricesJournal.price = updatedLaborOffer.price
    addingLaborOfferPricesJournal.currency = updatedLaborOffer.currency
    addingLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
    addingLaborOfferPricesJournal.userId = updatedLaborOffer.userId;
    addingLaborOfferPricesJournal.date = updatedLaborOffer.updatedAt;

    laborPricesJournal.insertOne(addingLaborOfferPricesJournal);

    await updateLaborItemStats(updatedLaborOffer.itemId);
    await captureSnapshotsForItem(updatedLaborOffer.itemId, 'labor');

    respondJson(res, result);
});


registerApiSession('labor/archive_offer', async (req, res, session) => {
    let laborOfferId = requireMongoIdParam(req, 'itemOfferId');
    
    let laborOffersColl = Db.getLaborOffersCollection();

    const result = await laborOffersColl.updateOne(
        {
            _id: laborOfferId
        },
        {
            $set: {
                isArchived: true,
                archivedAt: new Date()
            }
        }
    );


    let updatedLaborOffer = await laborOffersColl.findOne({ _id: laborOfferId }) as Db.EntityLaborOffers;
    let laborPricesJournal = Db.getLaborPricesJournalCollection();

    let archiveLaborOfferPricesJournal = {} as Db.EntityLaborPricesJournal;

    archiveLaborOfferPricesJournal.itemId = updatedLaborOffer._id
    archiveLaborOfferPricesJournal.price = updatedLaborOffer.price
    archiveLaborOfferPricesJournal.currency = updatedLaborOffer.currency
    archiveLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
    archiveLaborOfferPricesJournal.measurementUnitMongoId = updatedLaborOffer.measurementUnitMongoId
    archiveLaborOfferPricesJournal.userId = updatedLaborOffer.userId;

    archiveLaborOfferPricesJournal.isArchived = updatedLaborOffer.isArchived;
    archiveLaborOfferPricesJournal.archivedAt = updatedLaborOffer.archivedAt;

    laborPricesJournal.insertOne(archiveLaborOfferPricesJournal);

    await updateLaborItemStats(updatedLaborOffer.itemId);
    await captureSnapshotsForItem(updatedLaborOffer.itemId, 'labor');

    respondJsonData(res, result);
})

registerApiSession('labor/unarchive_offer', async (req, res, session) => {
    let laborOfferId = requireMongoIdParam(req, 'itemOfferId');

    let laborOffersColl = Db.getLaborOffersCollection();
    
    const result = await laborOffersColl.updateOne(
        {
            _id: laborOfferId
        },
        {
            $set: {
                isArchived: false,
                unarchivedAt: new Date()
            }
        }
    );

    let updatedLaborOffer = (await laborOffersColl.findOne({ _id: laborOfferId }))!;
    let laborPricesJournal = Db.getLaborPricesJournalCollection();

    let unarchiveLaborOfferPricesJournal = {} as Db.EntityLaborPricesJournal;

    unarchiveLaborOfferPricesJournal.itemId = updatedLaborOffer._id
    unarchiveLaborOfferPricesJournal.price = updatedLaborOffer.price
    unarchiveLaborOfferPricesJournal.currency = updatedLaborOffer.currency
    unarchiveLaborOfferPricesJournal.laborHours = updatedLaborOffer.laborHours //🔴 TODO: this will need us in version 2 🔴
    unarchiveLaborOfferPricesJournal.measurementUnitMongoId = updatedLaborOffer.measurementUnitMongoId
    unarchiveLaborOfferPricesJournal.userId = updatedLaborOffer.userId;

    unarchiveLaborOfferPricesJournal.isArchived = updatedLaborOffer.isArchived;
    unarchiveLaborOfferPricesJournal.unarchivedAt = updatedLaborOffer.unarchivedAt;

    laborPricesJournal.insertOne(unarchiveLaborOfferPricesJournal);

    await updateLaborItemStats(updatedLaborOffer.itemId);
    await captureSnapshotsForItem(updatedLaborOffer.itemId, 'labor');

    respondJson(res, result);
})

