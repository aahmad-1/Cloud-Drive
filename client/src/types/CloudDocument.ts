export interface ICloudDocument {
    _id: string;
    title: string;
    content: string;
    ownerId: string;
    ownerUsername: string;
    editorIds: string[];
    publicView: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}