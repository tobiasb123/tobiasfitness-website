import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { HttpsError, Request } from 'firebase-functions/v2/https';

/**
 * Extracts and verifies the Firebase ID token from the Authorization header.
 * Returns the decoded UID, or throws an HttpsError (401/403) on failure.
 * Intended to be used inside createAuthEndpoint where the error is caught
 * automatically.
 *
 * @param req Incoming HTTP request expected to include a Bearer token.
 * @returns The authenticated Firebase user UID.
 */
export async function requireAuth(req: Request): Promise<DecodedIdToken> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HttpsError('unauthenticated', 'Du skal være logget ind');
  }

  const idToken = authHeader.split('Bearer ')[1];

  return await getAuth()
    .verifyIdToken(idToken)
    .catch(() => {
      throw new HttpsError('permission-denied', 'Ugyldig eller udløbet adgangstoken');
    });
}
