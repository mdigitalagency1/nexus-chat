const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group'], required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    lastRead: { type: Date, default: new Date(0) },
    isMuted: { type: Boolean, default: false }
  }],
  name: { type: String, maxlength: 60 },
  description: { type: String, maxlength: 200 },
  avatar: { url: String, thumbnail: String, color: { type: String, default: '#7c3aed' } },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteLink: { type: String, unique: true, sparse: true },
  lastMessage: { content: String, senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, type: String, createdAt: Date },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
chatSchema.index({ 'participants.user': 1 });

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text','image','video','audio','file','voice_note','system','call_log'], default: 'text' },
  encryptedContent: [{
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ciphertext: String,
    iv: String,
    authTag: String,
    ephemeralPublicKey: String
  }],
  media: { url: String, thumbnailUrl: String, mimeType: String, size: Number, duration: Number, fileName: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String, createdAt: { type: Date, default: Date.now } }],
  readBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now } }],
  deliveredTo: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, deliveredAt: { type: Date, default: Date.now } }],
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
messageSchema.index({ chatId: 1, createdAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);
module.exports = { Chat, Message };
