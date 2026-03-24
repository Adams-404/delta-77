import axios from 'axios';
import crypto from 'crypto';

const ISW_BASE_URL = process.env.INTERSWITCH_ENV === 'production' 
  ? 'https://api.interswitchgroup.com' 
  : 'https://sandbox.interswitchgroup.com';

if (!process.env.INTERSWITCH_CLIENT_ID || !process.env.INTERSWITCH_SECRET_KEY) {
  console.warn("Interswitch credentials missing in environment variables. Signatures will fail.");
}

/**
 * Generates the required authentication headers for Interswitch APIs.
 * Signature Algorithm: Base64(SHA-512(HTTP_METHOD + URL + Timestamp + Nonce + Client_ID + Secret_Key))
 * Authorization: Interswitch [Base64(ClientID)]
 */
export const generateInterswitchAuthHeaders = (method: string, url: string) => {
  const clientId = process.env.INTERSWITCH_CLIENT_ID;
  const secretKey = process.env.INTERSWITCH_SECRET_KEY;

  if (!clientId || !secretKey) {
    throw new Error('Interswitch configuration missing (Client ID or Secret Key)');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Signature composite string
  const signatureString = `${method.toUpperCase()}${url}${timestamp}${nonce}${clientId}${secretKey}`;
  const signature = crypto.createHash('sha512').update(signatureString).digest('base64');

  return {
    'Authorization': `Interswitch ${Buffer.from(clientId).toString('base64')}`,
    'Timestamp': timestamp,
    'Nonce': nonce,
    'Signature': signature,
    'SignatureMethod': 'SHA512',
    'Content-Type': 'application/json',
  };
};

export const interswitchClient = axios.create({
  baseURL: ISW_BASE_URL,
});
