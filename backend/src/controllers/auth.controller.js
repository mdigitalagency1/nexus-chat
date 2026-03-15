const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { setOTP, getOTP, deleteOTP } = require('../config/redis');
const { generateOTP, sendSMSOTP } = require('../services/otp.service');
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';
function signToken(userId) { return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES }); }
async function sendOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+[1-9]\d{9,14}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone. Use E.164 e.g. +919876543210' });
    const otp = generateOTP();
    await setOTP(phone, otp);
    if (process.env.NODE_ENV === 'production') { await sendSMSOTP(phone, otp); }
    else { console.log('[DEV] OTP for ' + phone + ': ' + otp); }
    const resp = { success: true, message: 'OTP sent', expiresIn: 600 };
    if (process.env.NODE_ENV !== 'production') resp.devOTP = otp;
    res.json(resp);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to send OTP' }); }
}
async function verifyOTP(req, res) {
  try {
    const { phone, otp, publicKey } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
    const stored = await getOTP(phone);
    if (!stored || stored !== otp.toString()) return res.status(401).json({ error: 'Invalid or expired OTP' });
    await deleteOTP(phone);
    let user = await User.findOne({ phone, isDeleted: false });
    const isNewUser = !user;
    if (!user) { user = await User.create({ phone, publicKey: publicKey || null, isVerified: true }); }
    else if (publicKey) { user.publicKey = publicKey; await user.save(); }
    res.json({ success: true, token: signToken(user._id), isNewUser, user: user.toPublicProfile() });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Verification failed' }); }
}
async function refreshToken(req, res) {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) return res.status(401).json({ error: 'User not found' });
    res.json({ token: signToken(user._id) });
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
}
async function registerPublicKey(req, res) {
  try {
    const { publicKey, keyFingerprint } = req.body;
    if (!publicKey) return res.status(400).json({ error: 'Public key required' });
    await User.findByIdAndUpdate(req.user._id, { publicKey, keyFingerprint });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
}
module.exports = { sendOTP, verifyOTP, refreshToken, registerPublicKey };
