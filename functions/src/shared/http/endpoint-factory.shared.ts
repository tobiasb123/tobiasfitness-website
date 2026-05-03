import { UserProfile } from '@models/auth';
import { Response } from 'express';
import { HttpsError, onRequest, Request } from 'firebase-functions/v2/https';
import { getUser } from '../../modules/auth/common/auth.common';
import { requireAuth } from './auth.shared';
import { sendHttpError } from './http-error.shared';

/**
 * Wraps a public (unauthenticated) onRequest handler with automatic error
 * handling. Any thrown HttpsError or unknown error is caught and
 * forwarded to sendHttpError.
 *
 * @param handler Async request handler to execute for public endpoints.
 * @returns A Firebase `onRequest` endpoint with shared error handling.
 */
export function createPublicEndpoint(handler: (req: Request, res: Response) => Promise<void>) {
  return onRequest({ cors: true }, async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (!res.headersSent) {
        sendHttpError(res, err);
      }
    }
  });
}

/**
 * Wraps an authenticated onRequest handler. Verifies the Bearer token via
 * requireAuth, fetches the user profile, and passes it to the handler. Any thrown
 * HttpsError or unknown error is caught and forwarded to sendHttpError.
 *
 * @param handler Async request handler that receives the authenticated user profile.
 * @returns A Firebase `onRequest` endpoint with auth and shared error handling.
 */
export function createAuthEndpoint(
  handler: (req: Request, res: Response, user: UserProfile) => Promise<void>,
) {
  return onRequest({ cors: true }, async (req, res) => {
    try {
      const user = await requireAuth(req);
      const profile = await getUser(user.uid);
      await handler(req, res, profile);
    } catch (err) {
      if (!res.headersSent) {
        sendHttpError(res, err);
      }
    }
  });
}

/**
 * Wraps an authenticated onRequest handler. Verifies the Bearer token via
 * requireAuth, fetches the user profile, checks for admin privileges, and passes
 * the profile to the handler. Any thrown HttpsError or unknown error is caught
 * and forwarded to sendHttpError.
 *
 * @param handler Async request handler that receives the authenticated user profile.
 * @returns A Firebase `onRequest` endpoint with auth, admin check, and shared error handling.
 */
export function createAdminEndpoint(
  handler: (req: Request, res: Response, user: UserProfile) => Promise<void>,
) {
  return createAuthEndpoint(async (req, res, user) => {
    if (!user.admin) {
      throw new HttpsError('permission-denied', 'Kun administratorer har adgang');
    }

    await handler(req, res, user);
  });
}
