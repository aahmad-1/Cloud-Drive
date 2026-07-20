import mongoose, { Document, Schema } from "mongoose"

interface IUser extends Document {
    username: string
    password: string
    profilePicture?: string
}

const userSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicture: { type: String, required: false }
})

const User: mongoose.Model<IUser> = mongoose.model<IUser>("User", userSchema)

export { User, IUser }