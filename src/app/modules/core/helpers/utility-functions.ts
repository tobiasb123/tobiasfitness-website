import { FirebaseError } from 'firebase/app';

export function getFirebaseError(error: FirebaseError): Error {
  switch (error.code) {
    case 'auth/invalid-credential':
      return new FirebaseError(error.code, 'Forkert email eller adgangskode');
    case 'auth/too-many-requests':
      return new FirebaseError(
        error.code,
        'Denne konto er midlertidigt deaktiveret. Aktiver den ved at nulstille din adgangskode eller prøv igen senere',
      );
    default:
      return error;
  }
}
