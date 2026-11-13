import moment from './date-time';

describe('date-time configuration', () => {
  it('uses Danish locale and Copenhagen time across daylight saving changes', () => {
    expect(moment.locale()).toBe('da');
    expect(moment('2026-03-29T00:30:00Z').format('DD-MM-YYYY HH:mm')).toBe('29-03-2026 01:30');
    expect(moment('2026-03-29T01:30:00Z').format('DD-MM-YYYY HH:mm')).toBe('29-03-2026 03:30');
    expect(moment('2026-10-25T01:30:00Z').format('DD-MM-YYYY HH:mm')).toBe('25-10-2026 02:30');
    expect(moment('2026-03-29T22:30:00Z').format('YYYY-MM-DD')).toBe('2026-03-30');
    expect(moment('2026-03-29').format('DD MMMM YYYY')).toBe('29 marts 2026');
    expect(moment('2026-02-30').isValid()).toBe(false);
  });
});
