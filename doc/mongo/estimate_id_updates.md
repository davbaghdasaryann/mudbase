
Assign estimateId to subsections

```js

db.estimate_subsections.aggregate([
  {
    $lookup: {
      from: "estimate_sections",
      localField: "estimateSectionId",
      foreignField: "_id",
      as: "section"
    }
  },
  { $unwind: "$section" },
  {
    $set: {
      estimateId: "$section.estimateId"
    }
  },
  {
    $project: {
      section: 0 // optional: remove temporary joined field
    }
  },
  {
    $merge: {
      into: "estimate_subsections",
      whenMatched: "merge", // updates existing documents
      whenNotMatched: "discard"
    }
  }
]);

```


Assign estimateId to labor items

```js

db.estimate_labor_items.aggregate([
  {
    $lookup: {
      from: "estimate_subsections",
      localField: "estimateSubsectionId",
      foreignField: "_id",
      as: "subsection"
    }
  },
  { $unwind: "$subsection" },
  {
    $set: {
      estimateId: "$subsection.estimateId"
    }
  },
  {
    $project: {
      subsection: 0 // optional: remove temporary joined field
    }
  },
  {
    $merge: {
      into: "estimate_labor_items",
      whenMatched: "merge", // updates existing documents
      whenNotMatched: "discard"
    }
  }
]);

```


Assign estimateId to material items

```js

db.estimate_material_items.aggregate([
  {
    $lookup: {
      from: "estimate_subsections",
      localField: "estimateSubsectionId",
      foreignField: "_id",
      as: "subsection"
    }
  },
  { $unwind: "$subsection" },
  {
    $set: {
      estimateId: "$subsection.estimateId"
    }
  },
  {
    $project: {
      subsection: 0 // optional: remove temporary joined field
    }
  },
  {
    $merge: {
      into: "estimate_material_items",
      whenMatched: "merge", // updates existing documents
      whenNotMatched: "discard"
    }
  }
]);

```



assign estimateNumber to estimate_shares

```js
db.estimates_shares.aggregate([
  {
    $lookup: {
      from: "estimates",
      localField: "sharedEstimateId",
      foreignField: "_id",
      as: "est"
    }
  },
  { $unwind: "$est" },
  {
    $set: {
      estimateNumber: "$est.estimateNumber"
    }
  },
  { $unset: "est" },   // 👈 removes lookup result before saving back
  {
    $merge: {
      into: "estimates_shares",
      whenMatched: "merge",
      whenNotMatched: "discard"
    }
  }
])

```