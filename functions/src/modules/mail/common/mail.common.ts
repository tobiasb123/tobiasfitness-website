import { defineSecret } from 'firebase-functions/params';
import { HttpsError } from 'firebase-functions/v2/https';

export const mailgunApiKey = defineSecret('MAILGUN_API_KEY');

const MAILGUN_BASE_URL = 'https://api.eu.mailgun.net';
const MAILGUN_DOMAIN = 'pt.tbfitness.dk';
const MAIL_FROM = 'TBFitness <pt@tbfitness.dk>';

export const sendMail = async (mail: string, subject: string, html: string): Promise<void> => {
  const body = new URLSearchParams({ from: MAIL_FROM, to: mail, subject, html });

  const response = await fetch(`${MAILGUN_BASE_URL}/v3/${MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey.value().trim()}`).toString('base64')}`,
    },
    body,
  });

  if (!response.ok) {
    console.error('Mailgun fejl', response.status, await response.text());
    throw new HttpsError('internal', 'Mailen kunne ikke sendes');
  }
};
