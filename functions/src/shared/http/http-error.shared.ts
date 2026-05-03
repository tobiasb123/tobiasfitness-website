import { Response } from 'express';
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * Sends a standardized HTTP error response based on thrown runtime errors.
 *
 * @param res Express response object used to send the error payload.
 * @param err Unknown thrown error to normalize into an HTTP response.
 * @returns Nothing. The response is written directly to `res`.
 */
export function sendHttpError(res: Response, err: unknown): void {
  if (err instanceof HttpsError) {
    res.status(err.httpErrorCode.status).json({ error: err.code, message: err.message });
  } else {
    res.status(500).json({ error: 'unknown', message: 'En ukendt fejl opstod' });
  }
}
