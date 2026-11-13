import { AbstractControl, ValidationErrors } from '@angular/forms';
import { formatIntensity, INTENSITY_RATING_PATTERN, INTENSITY_VALUE_PATTERN, IntensityUnit, parseIntensity } from '@models/training/intensity';

export function validateIntensity(control: AbstractControl): ValidationErrors | null {
  const unit: IntensityUnit = control.get('intensityUnit')?.value;
  const value: string = control.get('intensity')?.value ?? '';
  const original: string = control.get('originalIntensity')?.value ?? '';
  if (unit === 'kg' || unit === 'time') {
    if (!value.trim() && unit === 'kg' && !original.trim()) {
      return null;
    }
    const pattern = unit === 'time' ? INTENSITY_RATING_PATTERN : INTENSITY_VALUE_PATTERN;
    return pattern.test(value.trim()) ? null : { intensity: true };
  }
  return null;
}

export function savedIntensity(value: string, unit: IntensityUnit, original: string): string {
  const parsed = parseIntensity(original);
  return parsed.unit === unit && parsed.value === value.trim()
    ? original
    : formatIntensity(value, unit);
}
