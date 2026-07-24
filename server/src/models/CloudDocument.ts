import mongoose, { Document, Schema } from "mongoose"

interface ICloudDocument extends Document {
    title: string
    content: string
    ownerId: string
    editorIds: string[]
    publicView: boolean
    deleted: boolean
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    type: string // a doc can be of type "text" or "image"
    imagePath?: string
    currentlyEditingBy?: string | null 
}

const cloudDocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: false, default: "" },
    ownerId: { type: String, required: true },
    editorIds: [{ type: String }], // list of ids of users who are given edit permission
    publicView: { type: Boolean, required: true, default: false }, // if true, anyone with the link can view the doc (read-only)
    deleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, required: false, default: null },
    type: { type: String, required: true, default: "text" },
    imagePath: { type: String, required: false },
    currentlyEditingBy: { type: String, required: false, default: null } // holds the id of which user has a doc open for editing first
}, { timestamps: true }) // helps for getting dates for createdAt and updatedAt. Don't have to use manual method of date: new Date() in backend

const CloudDocument: mongoose.Model<ICloudDocument> = mongoose.model<ICloudDocument>("CloudDocument", cloudDocumentSchema)

export { CloudDocument, ICloudDocument }