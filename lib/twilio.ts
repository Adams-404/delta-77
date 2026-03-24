import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
  console.error("Twilio credentials missing in Environment Variables");
}

export const twilioClient = new Twilio(accountSid!, authToken!);
export const VERIFY_SERVICE_ID = verifyServiceSid!;
