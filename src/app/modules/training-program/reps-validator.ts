import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { INTENSITY_VALUE_PATTERN } from '@models/training/intensity';

export function repsValidator(original: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (value === original || !value.trim() || INTENSITY_VALUE_PATTERN.test(value.trim())) {
      return null;
    }
    return { numericReps: true };
  };
}
