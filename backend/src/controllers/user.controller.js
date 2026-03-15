const User = require('../models/User');
async function getMe(req, res) { res.json({ user: req.user.toPublicProfile() }); }
async function updateProfile(req, res) {
  try {
    const { name, username, about, avatar, settings } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) {
      const exists = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ error: 'Username taken' });
      updates.username = username;
    }
    if (about !== undefined) updates.about = about;
    if (avatar !== undefined) updates.avatar = avatar;
    if (settings !== undefined) updates.settings = { ...req.user.settings, ...settings };
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toPublicProfile() });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });
    const users = await User.find({
      $or: [{ name: { $regex: q, $options: 'i' } }, { username: { $regex: q, $options: 'i' } }, { phone: q }],
      _id: { $ne: req.user._id }, isDeleted: false
    }).select('name username avatar publicKey keyFingerprint lastSeen isOnline phone').limit(20).lean();
    res.json({ users });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function getUserProfile(req, res) {
  try {
    const user = await User.findOne({ _id: req.params.userId, isDeleted: false }).select('name username avatar about publicKey keyFingerprint lastSeen isOnline');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toPublicProfile() });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function blockUser(req, res) {
  try {
    const { userId } = req.params;
    const isBlocked = req.user.blockedUsers.includes(userId);
    if (isBlocked) await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
    else await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
    res.json({ blocked: !isBlocked });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
module.exports = { getMe, updateProfile, searchUsers, getUserProfile, blockUser };
