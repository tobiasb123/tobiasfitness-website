import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { Auth } from 'firebase/auth';
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

  getAuth(): Auth {
    return this.auth;
  }

  async httpGet<TResult>(name: string, options: { auth?: boolean } = {}): Promise<TResult> {
    const url = `${this.functionsBaseUrl}/${name}`;
    const headers = await this.buildHeaders(options.auth);
    return firstValueFrom(this.http.get<TResult>(url, { headers })).catch((error) => {
      throw this.normalizeHttpError(error);
    });
  }

  async httpPost<TBody, TResult>(name: string, body: TBody): Promise<TResult> {
    const url = `${this.functionsBaseUrl}/${name}`;
    const headers = await this.buildHeaders(true);
    return firstValueFrom(this.http.post<TResult>(url, body, { headers })).catch((error) => {
      throw this.normalizeHttpError(error);
    });
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

  private async buildHeaders(withAuth = false): Promise<Record<string, string>> {
    if (!withAuth || !this.auth.currentUser) {
      return {};
    }
    const token = await this.auth.currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }
}
