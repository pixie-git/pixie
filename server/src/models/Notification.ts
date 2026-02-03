import mongoose, { Document, Schema } from "mongoose"

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId
    title: string
    message: string
    isRead: boolean
    createdAt: Date
    updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
)

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema)
