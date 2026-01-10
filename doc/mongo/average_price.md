

## Calculates averagePrice for material offers

``` js

db.material_offers.aggregate([
  {
    $match: {
      price: { $ne: 0 },
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
    }
  },
  {
    $group: {
      _id: "$itemId",
      avgPrice: { $avg: "$price" }
    }
  },

  { // <-- round after grouping
    $project: {
      averagePrice: { $round: "$avgPrice" }
    }
  },

  // shape to {_id: <itemId>, averagePrice: <avg>}
  {
    $merge: {
      into: "material_items",
      on: "_id",
      whenMatched: "merge",     // updates/sets averagePrice
      whenNotMatched: "discard" // ignore orphan offers
    }
  }
]);

```

``` js

await material_offers.aggregate([
    {
      $match: {
        price: { $ne: 0 },
        $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
      }
    },
    {
      $group: {
        _id: "$itemId",
        averagePrice: { $avg: "$price" }
      }
    },
    {
      $merge: {
        into: "material_items",
        on: "_id",
        whenMatched: "merge",
        whenNotMatched: "discard"
      }
    }
  ]).toArray(); // .toArray() to execute in the driver

```


## Calculates averagePrice for labor offers


``` js

db.labor_offers.aggregate([
  {
    $match: {
      price: { $ne: 0, $exists: true },
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
    }
  },
  {
    $group: {
      _id: "$itemId",
      avgPrice: { $avg: "$price" }
    }
  },

  { // <-- round after grouping
    $project: {
      averagePrice: { $round: "$avgPrice" }
    }
  },

  // shape to {_id: <itemId>, averagePrice: <avg>}
  {
    $merge: {
      into: "labor_items",
      on: "_id",
      whenMatched: "merge",     // updates/sets averagePrice
      whenNotMatched: "discard" // ignore orphan offers
    }
  }
]);

```

``` js

await labor_offers.aggregate([
    {
      $match: {
        price: { $ne: 0, $exists: true },
        $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
      }
    },
    {
      $group: {
        _id: "$itemId",
        averagePrice: { $avg: "$price" }
      }
    },
    {
      $merge: {
        into: "labor_items",
        on: "_id",
        whenMatched: "merge",
        whenNotMatched: "discard"
      }
    }
  ]).toArray(); // .toArray() to execute in the driver

```



