import { z } from 'zod';

const SUPPORTED_DATE_MIN = '2000-01-01';
const SUPPORTED_DATE_MAX = '2099-12-31';

export const supportedDate = z.iso.date().refine((date) => date >= SUPPORTED_DATE_MIN && date <= SUPPORTED_DATE_MAX, {
  error: `날짜는 ${SUPPORTED_DATE_MIN} ~ ${SUPPORTED_DATE_MAX} 범위여야 한다`,
});
