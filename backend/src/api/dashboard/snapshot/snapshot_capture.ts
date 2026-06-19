import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

async function getEstimateStoredTotal(estimateId: ObjectId): Promise<number> {
    const estimate = await Db.getEstimatesCollection().findOne(
        { _id: estimateId },
        { projection: { totalCostWithOtherExpenses: 1, totalCost: 1 } }
    );
    return estimate?.totalCostWithOtherExpenses ?? estimate?.totalCost ?? 0;
}

registerApiSession('dashboard/snapshot/snapshot_capture', async (req, res, session) => {
    const widgetsColl = Db.getDashboardWidgetsCollection();
    const snapshotsColl = Db.getDashboardWidgetSnapshotsCollection();

    // Use live timestamp (e.g. 14:14) so "Snapshot Now" shows exact moment; widget_data_fetch normalizes to 30-min on refresh
    const now = new Date();

    // Fetch all widgets
    const widgets = await widgetsColl.find({}).toArray();

    let capturedCount = 0;
    const captured: Array<{ widgetId: string; timestamp: string; value: number }> = [];

    for (const widget of widgets) {
        let value: number | null = null;
        let metadata: any = {};

        try {
            // Fetch current value based on data source
            switch (widget.dataSource) {
                case 'estimates': {
                    const estimateId = typeof widget.dataSourceConfig.estimateId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.estimateId)
                        : widget.dataSourceConfig.estimateId;

                    const cost = await getEstimateStoredTotal(estimateId);
                    if (cost > 0) {
                        value = cost;
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
                    const eciEstimateId = typeof widget.dataSourceConfig.estimateId === 'string'
                        ? new ObjectId(widget.dataSourceConfig.estimateId)
                        : widget.dataSourceConfig.estimateId;

                    const eciEstimate = await Db.getEciEstimatesCollection().findOne({ _id: eciEstimateId });
                    if (eciEstimate?.estimateId) {
                        const cost = await getEstimateStoredTotal(eciEstimate.estimateId);
                        if (cost > 0) {
                            const area = eciEstimate.constructionArea || 1;
                            value = cost / area;
                        }
                    }
                    break;
                }
            }

            if (value !== null && widget._id) {
                await snapshotsColl.insertOne({
                    widgetId: widget._id,
                    timestamp: now,
                    value,
                    metadata
                });
                capturedCount++;
                captured.push({
                    widgetId: widget._id.toString(),
                    timestamp: now.toISOString(),
                    value
                });
            }
        } catch (error) {
            console.error(`Error capturing snapshot for widget ${widget._id}:`, error);
            // Continue with next widget
        }
    }

    respondJsonData(res, {
        ok: true,
        capturedCount,
        timestamp: now.toISOString(),
        totalWidgets: widgets.length,
        captured
    });
});
