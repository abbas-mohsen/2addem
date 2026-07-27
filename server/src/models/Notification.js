import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'application_submitted',
  'application_received',
  'stage_changed',
  'interview_scheduled',
  'interview_cancelled',
  'job_taken_down',
];

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, trim: true, maxlength: 300 },
    // Where clicking the notification should take the user.
    link: { type: String, trim: true, maxlength: 300, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The bell asks for "my unread, newest first" on every poll.
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

notificationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Notification = mongoose.model('Notification', notificationSchema);
