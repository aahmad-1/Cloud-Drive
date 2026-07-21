export interface ICloudDocument {
    _id: string;
    title: string;
    content: string;
    ownerId: string;
    editorIds: string[];
    publicView: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}