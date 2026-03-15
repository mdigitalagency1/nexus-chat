function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }
async function sendSMSOTP(phone, otp) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: 'Your Nexus code: ' + otp + '. Valid 10 mins.',
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
module.exports = { generateOTP, sendSMSOTP };
