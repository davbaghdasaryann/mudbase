import { Collection, ObjectId } from 'mongodb';

export interface EntityFavoriteGroup {
    _id: ObjectId;
    accountId: ObjectId;
    name: string;
    createdAt: Date;
}

export function getFavoriteGroupsCollection(): Collection<EntityFavoriteGroup> {
    return mongoDb_.collection('favorite_groups');
}

export function favoriteGroupToApi(favoriteGroup: any) {
    let api = { ...favoriteGroup } as EntityFavoriteGroup;
    return api;
}
