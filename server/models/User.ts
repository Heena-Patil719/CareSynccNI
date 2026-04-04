import bcrypt from "bcrypt";
import mongoose from "mongoose";
import type { HydratedDocument, Model } from "mongoose";

export const mongoRoles = ["admin", "editor", "viewer"] as const;
export type MongoUserRole = (typeof mongoRoles)[number];

export interface UserDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  organization?: string;
  jobTitle?: string;
  role: MongoUserRole;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<UserDocument, Record<string, never>, UserMethods>;

const { Schema, model, models } = mongoose;

const userSchema = new Schema<UserDocument, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: mongoRoles,
      default: "viewer",
      required: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(
  this: HydratedDocument<UserDocument, UserMethods>,
  candidate: string,
) {
  return bcrypt.compare(candidate, this.password);
};

const User = (models.User as UserModel | undefined) ?? model<UserDocument, UserModel>("User", userSchema);

export default User;
