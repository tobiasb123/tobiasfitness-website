export type IntensityUnit = 'kg' | 'time' | 'bodyweight' | 'legacy-time' | 'legacy';
export type RepsType = 'reps' | 'time';

export function isRepsType(value: unknown): value is RepsType {
  return value === 'reps' || value === 'time';
}

export interface ParsedIntensity {
  unit: IntensityUnit;
  value: string;
}

export const INTENSITY_VALUE_PATTERN = /^\d+(?:[.,]\d+)?$/;
export const INTENSITY_RATING_PATTERN = /^(?:[1-9]|10)$/;

export function isTimeUnit(unit: IntensityUnit): boolean {
  return unit === 'time' || unit === 'legacy-time';
}

export function intensityLabel(unit: IntensityUnit): string {
  return unit === 'kg' ? 'Vægt' : 'Intensitet';
}

export function repsLabel(unit: IntensityUnit, repsType?: RepsType): string {
  if (isTimeUnit(unit) || (unit === 'kg' && repsType === 'time')) {
    return 'Tid';
  }
  return unit === 'kg' ? 'Reps' : 'Reps/Tid';
}

export function parseIntensity(intensity: string): ParsedIntensity {
  const text = intensity.trim();
  if (/^kropsvægt$/i.test(text)) {
    return { unit: 'bodyweight', value: '' };
  }

  const rating = /^([1-9]|10)\s*\/\s*10$/.exec(text);
  if (rating) {
    return { unit: 'time', value: rating[1] };
  }

  const match = /^(\d+(?:[.,]\d+)?)\s*(kg|sek\.?|sec\.?|s|seconds?)$/i.exec(text);
  if (match) {
    return match[2].toLowerCase() === 'kg'
      ? { unit: 'kg', value: match[1] }
      : { unit: 'legacy-time', value: text };
  }

  if (!text || INTENSITY_VALUE_PATTERN.test(text)) {
    return { unit: 'kg', value: text };
  }

  return { unit: 'legacy', value: text };
}

export function formatIntensity(value: string, unit: IntensityUnit): string {
  if (unit === 'bodyweight') {
    return 'Kropsvægt';
  }
  if (unit === 'legacy' || unit === 'legacy-time') {
    return value.trim();
  }
  const trimmed = value.trim();
  return trimmed ? (unit === 'kg' ? `${trimmed} kg` : `${trimmed}/10`) : '';
}

export function isValueOnlyIntensityUpdate(previous: string, next: string): boolean {
  const current = parseIntensity(previous);
  const updated = parseIntensity(next);
  return (current.unit === 'kg' || current.unit === 'time')
    && updated.unit === current.unit
    && next.trim() !== updated.value
    && (updated.unit === 'time'
      ? INTENSITY_RATING_PATTERN.test(updated.value)
      : INTENSITY_VALUE_PATTERN.test(updated.value));
}
