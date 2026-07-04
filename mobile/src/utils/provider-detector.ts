import { BankType } from '../types/verification';

/**
 * Detect provider based on transaction reference pattern
 */
export function detectProvider(reference: string): BankType {
  const ref = reference.toUpperCase().trim();

  if (ref.startsWith('FT') || /^\d+$/.test(ref)) return 'cbe';
  if (ref.startsWith('BOA')) return 'boa';
  if (ref.startsWith('TELE') || ref.startsWith('DET') || ref.startsWith('T')) return 'telebirr';
  if (ref.startsWith('MPESA') || ref.startsWith('MP')) return 'mpesa';
  if (ref.startsWith('CBE-BIRR') || ref.startsWith('CBEBIRR')) return 'cbebirr';
  if (ref.startsWith('DASHEN') || ref.startsWith('DS')) return 'dashen';
  if (ref.startsWith('AWASH') || ref.startsWith('AW')) return 'awash';
  if (ref.startsWith('SIINQEE') || ref.startsWith('SQ')) return 'siinqee';
  if (ref.includes('ebirr.com') || ref.startsWith('KAAFI') || ref.startsWith('KF')) return 'kaafiebirr';

  return 'cbe'; // default fallback
}
