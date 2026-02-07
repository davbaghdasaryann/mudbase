import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/snapshot/snapshot_capture', async (req, res, session) => {
    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    // Round timestamp to nearest 30-minute interval
    const now = new Date();
    const roundedTime = new Date(
        Math.floor(now.getTime() / (30 * 60 * 1000)) * (30 * 60 * 1000)
    );

    // Fetch all widgets
    const widgets = await widgetsColl.find({}).toArray();

    let capturedCount = 0;

    for (const widget of widgets) {
        let value: number | null = null;
        let metadata: any = {};

        try {
            // Fetch current value based on data source
            switch (widget.dataSource) {
                case 'estimates': {
                    const estimatesColl = Db.getEstimatesCollection();
                    const estimateId = typeof widget.dataSourceConfig.estimateId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.estimateId)
                        : widget.dataSourceConfig.estimateId;

                    const estimate = await estimatesColl.findOne({ _id: estimateId });
                    if (estimate) {
                        value = estimate.totalCost || 0;
                        metadata.estimateName = estimate.name;
                        log_.info(`[Snapshot] Estimate ${estimate.name}: ${value}`);
                    } else {
                        log_.warn(`[Snapshot] Estimate not found: ${estimateId}`);
                    }
                    break;
                }
                case 'materials': {
                    const materialItemsColl = Db.getMaterialItemsCollection();
                    const itemId = typeof widget.dataSourceConfig.itemId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.itemId)
                        : widget.dataSourceConfig.itemId;

                    const item = await materialItemsColl.findOne({ _id: itemId });
                    if (item) {
                        value = item.averagePrice || 0;
                        metadata.itemName = item.name;
                    }
                    break;
                }
                case 'labor': {
                    const laborItemsColl = Db.getLaborItemsCollection();
                    const itemId = typeof widget.dataSourceConfig.itemId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.itemId)
                        : widget.dataSourceConfig.itemId;

                    const item = await laborItemsColl.findOne({ _id: itemId });
                    if (item) {
                        value = item.averagePrice || 0;
                        metadata.itemName = item.name;
                    }
                    break;
                }
                case 'eci': {
                    const eciEstimatesColl = Db.getEciEstimatesCollection();
                    const estimatesColl = Db.getEstimatesCollection();
                    const estimateId = typeof widget.dataSourceConfig.estimateId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.estimateId)
                        : widget.dataSourceConfig.estimateId;

                    const eciEstimate = await eciEstimatesColl.findOne({ _id: estimateId });

                    if (eciEstimate?.estimateId) {
                        const estimate = await estimatesColl.findOne({
                            _id: eciEstimate.estimateId
                        });
                        if (estimate) {
                            // Calculate cost per area for ECI
                            const constructionArea = eciEstimate.constructionArea || 1;
                            value = (estimate.totalCost || 0) / constructionArea;
                            metadata.estimateName = eciEstimate.name;
                        }
                    }
                    break;
                }
            }

            if (value !== null) {
                await snapshotsColl.insertOne({
                    widgetId: widget._id!,
                    timestamp: roundedTime,
                    value,
                    metadata
                });
                capturedCount++;
            }
        } catch (error) {
            console.error(`Error capturing snapshot for widget ${widget._id}:`, error);
            // Continue with next widget
        }
    }

    respondJsonData(res, {
        ok: true,
        capturedCount,
        timestamp: roundedTime,
        totalWidgets: widgets.length
    });
});
