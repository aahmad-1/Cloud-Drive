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
}

const cloudDocumentSchema: Schema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: false, default: "" },
    ownerId: { type: String, required: true },
    editorIds: [{ type: String }], // list of ids of users who are given edit permission
    publicView: { type: Boolean, required: true, default: false }, // if true, anyone with the link can view the doc (read-only)
    deleted: { type: Boolean, required: true, default: false }
}, { timestamps: true }) // helps for getting dates for createdAt and updatedAt. Don't have to use manual method of date: new Date()

const CloudDocument: mongoose.Model<ICloudDocument> = mongoose.model<ICloudDocument>("CloudDocument", cloudDocumentSchema)

export { CloudDocument, ICloudDocument }