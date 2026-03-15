const { createClient } = require('redis');
let client = null;
async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = createClient({ url });
  client.on('error', (err) => console.error('Redis error:', err));
  client.on('connect', () => console.log('Redis connected'));
  await client.connect();
  return client;
}
function getRedis() { if (!client) throw new Error('Redis not initialized'); return client; }
async function setOTP(phone, otp) { await getRedis().setEx('otp:' + phone, 600, otp); }
async function getOTP(phone) { return getRedis().get('otp:' + phone); }
async function deleteOTP(phone) { return getRedis().del('otp:' + phone); }
async function setUserOnline(userId, socketId) { await getRedis().hSet('online_users', userId.toString(), socketId); }
async function setUserOffline(userId) { await getRedis().hDel('online_users', userId.toString()); }
async function getUserSocket(userId) { return getRedis().hGet('online_users', userId.toString()); }
async function getOnlineUsers() { return getRedis().hGetAll('online_users'); }
module.exports = { connectRedis, getRedis, setOTP, getOTP, deleteOTP, setUserOnline, setUserOffline, getUserSocket, getOnlineUsers };
