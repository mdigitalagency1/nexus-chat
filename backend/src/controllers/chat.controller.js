const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');
async function getChats(req, res) {
  try {
    const chats = await Chat.find({ 'participants.user': req.user._id, isDeleted: false })
      .populate('participants.user', 'name username avatar publicKey keyFingerprint lastSeen isOnline phone')
      .sort({ 'lastMessage.createdAt': -1, updatedAt: -1 }).lean();
    res.json({ chats });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function createDirectChat(req, res) {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    let chat = await Chat.findOne({
      type: 'direct', isDeleted: false,
      'participants.user': { $all: [req.user._id, userId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] }
    }).populate('participants.user', 'name username avatar publicKey keyFingerprint lastSeen isOnline');
    if (!chat) {
      chat = await Chat.create({ type: 'direct', participants: [{ user: req.user._id }, { user: userId }] });
      chat = await chat.populate('participants.user', 'name username avatar publicKey keyFingerprint lastSeen isOnline');
    }
    res.json({ chat });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function createGroupChat(req, res) {
  try {
    const { name, description, memberIds } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name required' });
    const allIds = [...new Set([req.user._id.toString(), ...(memberIds || [])])];
    const chat = await Chat.create({ type: 'group', name, description, participants: allIds.map(id => ({ user: id })), admins: [req.user._id] });
    await chat.populate('participants.user', 'name username avatar publicKey keyFingerprint');
    res.status(201).json({ chat });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const { before, limit = 50 } = req.query;
    const chat = await Chat.findOne({ _id: chatId, 'participants.user': req.user._id, isDeleted: false });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    const query = { chatId, isDeleted: false, deletedFor: { $ne: req.user._id } };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(Math.min(parseInt(limit), 100))
      .populate('sender', 'name username avatar').lean();
    res.json({ messages: messages.reverse() });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function addGroupMembers(req, res) {
  try {
    const { chatId } = req.params;
    const { userIds } = req.body;
    const chat = await Chat.findOne({ _id: chatId, type: 'group', isDeleted: false });
    if (!chat) return res.status(404).json({ error: 'Group not found' });
    if (!chat.admins.map(a => a.toString()).includes(req.user._id.toString())) return res.status(403).json({ error: 'Admins only' });
    const newP = (userIds || []).filter(id => !chat.participants.some(p => p.user.toString() === id)).map(id => ({ user: id }));
    chat.participants.push(...newP);
    await chat.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function leaveGroup(req, res) {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, type: 'group', isDeleted: false });
    if (!chat) return res.status(404).json({ error: 'Group not found' });
    chat.participants = chat.participants.filter(p => p.user.toString() !== req.user._id.toString());
    await chat.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
module.exports = { getChats, createDirectChat, createGroupChat, getMessages, addGroupMembers, leaveGroup };
