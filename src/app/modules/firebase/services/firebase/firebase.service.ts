import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { firstValueFrom } from 'rxjs';
import { FIREBASE_AUTH } from '../../tokens/firebase-auth.token';
import { FIREBASE_FUNCTIONS_BASE_URL } from '../../tokens/firebase-functions-base-url.token';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(FIREBASE_AUTH);
  private functionsBaseUrl = inject(FIREBASE_FUNCTIONS_BASE_URL);
  private http = inject(HttpClient);
  private authInitializedPromise: Promise<void> | null = null;

  getAuth(): Auth {
    return this.auth;
  }

  async httpGet<TResult>(name: string): Promise<TResult> {
    await this.waitForAuthInitialization();
    const url = `${this.functionsBaseUrl}/${name}`;
    const headers = await this.buildHeaders();
    return firstValueFrom(this.http.get<TResult>(url, { headers })).catch((error) => {
      throw this.normalizeHttpError(error);
    });
  }

  async httpPost<TBody, TResult>(name: string, body: TBody): Promise<TResult> {
    await this.waitForAuthInitialization();
    const url = `${this.functionsBaseUrl}/${name}`;
    const headers = await this.buildHeaders();
    return firstValueFrom(this.http.post<TResult>(url, body, { headers })).catch((error) => {
      throw this.normalizeHttpError(error);
    });
  }

  private waitForAuthInitialization(): Promise<void> {
    if (!this.authInitializedPromise) {
      this.authInitializedPromise = new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(this.auth, () => {
          unsubscribe();
          resolve();
        });
      });
    }

    return this.authInitializedPromise;
  }

  private normalizeHttpError(error: unknown): Error {
    if (!(error instanceof HttpErrorResponse)) {
      return error instanceof Error ? error : new Error('En ukendt fejl opstod');
    }

    const errorBody = error.error as { error?: string; message?: string } | undefined;
    const message = errorBody?.message ?? error.message ?? 'En ukendt fejl opstod';
    const code = errorBody?.error ?? `http/${error.status || 'unknown'}`;

    return new FirebaseError(code, message);
  }

  private async buildHeaders(): Promise<Record<string, string>> {
    if (!this.auth.currentUser) {
      return {};
    }
    const token = await this.auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
}
