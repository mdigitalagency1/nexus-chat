const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true, index: true },
  name: { type: String, trim: true, maxlength: 60 },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true, maxlength: 30 },
  avatar: { url: String, thumbnail: String, color: { type: String, default: '#00ffaa' } },
  about: { type: String, default: 'Hey there! I am using Nexus.', maxlength: 140 },
  publicKey: { type: String },
  keyFingerprint: { type: String },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  pushTokens: [{ token: String, platform: String, createdAt: { type: Date, default: Date.now } }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    notifications: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    lastSeenVisibility: { type: String, default: 'everyone' }
  },
  isVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
userSchema.methods.toPublicProfile = function() {
  return { _id: this._id, name: this.name, username: this.username, avatar: this.avatar, about: this.about, publicKey: this.publicKey, keyFingerprint: this.keyFingerprint, lastSeen: this.lastSeen, isOnline: this.isOnline, phone: this.phone };
};
module.exports = mongoose.model('User', userSchema);
