const twilio = require('twilio');

const hasTwilioConfig = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );

const sendOtpSms = async ({ phone, otp }) => {
  if (!hasTwilioConfig()) {
    return { mode: 'simulation' };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `Your OFFEYR verification OTP is ${otp}. It will expire in 10 minutes.`
  });

  return { mode: 'sms' };
};

module.exports = {
  sendOtpSms
};
