import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PassStateService {
  private usingPass = signal(false);

  usingPass$ = this.usingPass;

  setUsingPass(value: boolean): void {
    this.usingPass.set(value);
  }
}
