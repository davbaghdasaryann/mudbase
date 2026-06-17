import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { ObjectId } from 'mongodb';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

async function computeEstimateCostFromCatalog(estimateId: ObjectId): Promise<number> {
    const laborColl = Db.getEstimateLaborItemsCollection();
    const materialColl = Db.getEstimateMaterialItemsCollection();

    const [laborItems, materialItems] = await Promise.all([
        laborColl.find({ estimateId }, { projection: { laborItemId: 1, estimatedLaborId: 1, quantity: 1, isHidden: 1 } }).toArray(),
        materialColl.find({ estimateId }, { projection: { materialItemId: 1, estimatedLaborId: 1, quantity: 1 } }).toArray()
    ]);

    const hiddenLaborIds = new Set(laborItems.filter((l: any) => l.isHidden).map((l: any) => l._id!.toString()));
    const laborIds = [...new Set(laborItems.map((l: any) => l.laborItemId))];
    const materialIds = [...new Set(materialItems.map((m: any) => m.materialItemId))];

    const [catalogLabor, catalogMaterial] = await Promise.all([
        Db.getLaborItemsCollection().find({ _id: { $in: laborIds } }, { projection: { _id: 1, averagePrice: 1 } }).toArray(),
        Db.getMaterialItemsCollection().find({ _id: { $in: materialIds } }, { projection: { _id: 1, averagePrice: 1 } }).toArray()
    ]);

    const laborPriceMap = new Map(catalogLabor.map((i: any) => [i._id.toString(), i.averagePrice ?? 0]));
    const materialPriceMap = new Map(catalogMaterial.map((i: any) => [i._id.toString(), i.averagePrice ?? 0]));

    let total = 0;
    for (const l of laborItems as any[]) {
        if (l.isHidden) continue;
        total += (l.quantity ?? 0) * (laborPriceMap.get(l.laborItemId.toString()) ?? 0);
    }
    for (const m of materialItems as any[]) {
        if (hiddenLaborIds.has(m.estimatedLaborId.toString())) continue;
        total += (m.quantity ?? 0) * (materialPriceMap.get(m.materialItemId.toString()) ?? 0);
    }
    return total;
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

                    const cost = await computeEstimateCostFromCatalog(estimateId);
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
                        const cost = await computeEstimateCostFromCatalog(eciEstimate.estimateId);
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
