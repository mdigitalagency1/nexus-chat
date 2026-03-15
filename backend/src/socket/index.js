const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Chat, Message } = require('../models/Chat');
const { setUserOnline, setUserOffline, getUserSocket, getOnlineUsers } = require('../config/redis');

const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret-change-in-production';

let io;

function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).lean();
      if (!user || user.isDeleted) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log('User connected: ' + userId);
    await setUserOnline(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    const chats = await Chat.find({ 'participants.user': userId, isDeleted: false }, '_id').lean();
    chats.forEach(chat => socket.join(chat._id.toString()));
    socket.broadcast.emit('user:online', { userId });

    socket.on('message:send', async (data, ack) => {
      try {
        const { chatId, type = 'text', encryptedContent, media, replyTo, clientMsgId } = data;
        const chat = await Chat.findOne({ _id: chatId, 'participants.user': userId, isDeleted: false }).populate('participants.user', '_id publicKey');
        if (!chat) return ack?.({ error: 'Chat not found' });
        const message = await Message.create({ chatId, sender: userId, type, encryptedContent: encryptedContent || [], media: media || undefined, replyTo: replyTo || undefined });
        await message.populate('sender', 'name username avatar');
        await Chat.findByIdAndUpdate(chatId, { lastMessage: { content: type === 'text' ? 'Encrypted message' : type, senderId: userId, type, createdAt: message.createdAt } });
        io.to(chatId).emit('message:new', { ...message.toObject(), clientMsgId, chatId });
        ack?.({ success: true, messageId: message._id });
      } catch (err) { console.error('message:send error:', err); ack?.({ error: err.message }); }
    });

    socket.on('typing:start', ({ chatId }) => { socket.to(chatId).emit('typing:start', { chatId, userId }); });
    socket.on('typing:stop', ({ chatId }) => { socket.to(chatId).emit('typing:stop', { chatId, userId }); });

    socket.on('message:read', async ({ chatId, messageIds }) => {
      try {
        const now = new Date();
        await Message.updateMany({ _id: { $in: messageIds }, chatId }, { $addToSet: { readBy: { userId, readAt: now } } });
        await Chat.updateOne({ _id: chatId, 'participants.user': userId }, { $set: { 'participants.$.lastRead': now } });
        socket.to(chatId).emit('message:read', { chatId, messageIds, userId, readAt: now });
      } catch (err) { console.error('message:read error:', err); }
    });

    socket.on('message:react', async ({ chatId, messageId, emoji }) => {
      await Message.findByIdAndUpdate(messageId, { $pull: { reactions: { userId } } });
      if (emoji) await Message.findByIdAndUpdate(messageId, { $push: { reactions: { userId, emoji, createdAt: new Date() } } });
      io.to(chatId).emit('message:reaction', { messageId, userId, emoji });
    });

    socket.on('message:delete', async ({ chatId, messageId, deleteForAll }) => {
      if (deleteForAll) {
        const msg = await Message.findOne({ _id: messageId, sender: userId });
        if (msg) { msg.isDeleted = true; await msg.save(); io.to(chatId).emit('message:deleted', { messageId, chatId }); }
      } else {
        await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });
        socket.emit('message:deleted', { messageId, chatId });
      }
    });

    socket.on('call:initiate', async ({ targetUserId, chatId, callType, offer }) => {
      const targetSocket = await getUserSocket(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call:incoming', { callerId: userId, callerName: socket.user.name, callerAvatar: socket.user.avatar, chatId, callType, offer });
      else socket.emit('call:missed', { targetUserId });
    });

    socket.on('call:answer', async ({ targetUserId, answer }) => {
      const targetSocket = await getUserSocket(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call:answered', { answer, userId });
    });

    socket.on('call:ice-candidate', async ({ targetUserId, candidate }) => {
      const targetSocket = await getUserSocket(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call:ice-candidate', { candidate, userId });
    });

    socket.on('call:end', async ({ targetUserId, chatId, duration }) => {
      const targetSocket = await getUserSocket(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call:ended', { userId, duration });
    });

    socket.on('call:reject', async ({ targetUserId }) => {
      const targetSocket = await getUserSocket(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call:rejected', { userId });
    });

    socket.on('disconnect', async () => {
      console.log('User disconnected: ' + userId);
      await setUserOffline(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      socket.broadcast.emit('user:offline', { userId, lastSeen });
    });
  });

  console.log('Socket.io initialized');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocketServer, getIO };
