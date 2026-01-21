import mongoose, { Document, Schema } from "mongoose"

export interface IUser extends Document {
	username: string
	isAdmin: boolean
	createdAt?: Date
	updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
	{
		username: {
			type: String,
			required: true,
			unique: true,
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
)

export const User = mongoose.model<IUser>("User", UserSchema)
