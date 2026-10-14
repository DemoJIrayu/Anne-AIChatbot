import mongoose, { Schema, Document } from 'mongoose';

// Interface for LINE message
export interface ILineMessage extends Document {
  messageId: string;
  userId: string;
  shopId: string;
  timestamp: Date;
  type: string; // 'text', 'image', 'video', etc.
  text?: string;
  payload?: any; // Raw message payload from LINE
  reply?: string; // Auto-reply sent by bot
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Facebook message
export interface IFacebookMessage extends Document {
  messageId: string;
  userId: string;
  shopId: string;
  timestamp: Date;
  type: string; // 'text', 'image', 'video', etc.
  text?: string;
  payload?: any; // Raw message payload from Facebook
  reply?: string; // Auto-reply sent by bot
  createdAt: Date;
  updatedAt: Date;
}

// Schema for LINE messages
const LineMessageSchema: Schema = new Schema({
  messageId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  shopId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  type: { type: String, required: true },
  text: { type: String },
  payload: { type: Schema.Types.Mixed },
  reply: { type: String },
}, {
  timestamps: true,
});

// Schema for Facebook messages
const FacebookMessageSchema: Schema = new Schema({
  messageId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  shopId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  type: { type: String, required: true },
  text: { type: String },
  payload: { type: Schema.Types.Mixed },
  reply: { type: String },
}, {
  timestamps: true,
});

// Models
export const LineMessage = mongoose.model<ILineMessage>('LineMessage', LineMessageSchema);
export const FacebookMessage = mongoose.model<IFacebookMessage>('FacebookMessage', FacebookMessageSchema);