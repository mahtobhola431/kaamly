import { SALARY_TYPE_LABEL } from '../constants/app';
import type { SalaryType } from '../enums';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** `900` -> `₹900`. Currency values in rokdajob are whole rupees. */
export function formatRupees(amount: number): string {
  return inrFormatter.format(amount);
}

/** `{ amount: 900, type: 'PER_DAY' }` -> `₹900/day`. */
export function formatWage(amount: number, type: SalaryType): string {
  const unit = SALARY_TYPE_LABEL[type].replace('per ', '');
  return `${formatRupees(amount)}/${unit}`;
}

/** Metres from `$geoNear` -> a readable distance. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function formatExperience(years: number): string {
  if (years <= 0) return 'Fresher';
  if (years === 1) return '1 year experience';
  return `${years} years experience`;
}

/** Compact relative time that stays readable on a small screen. */
export function formatRelativeTime(value: string | Date, now: Date = new Date()): string {
  const then = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (Number.isNaN(seconds)) return '';
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

/** Masks a phone number for display before contact is established: `98****3210`. */
export function maskPhone(phone: string): string {
  if (phone.length < 10) return '**********';
  return `${phone.slice(0, 2)}****${phone.slice(-4)}`;
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Deterministic initials for avatar fallbacks. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] as string).slice(0, 2).toUpperCase();
  return `${(parts[0] as string)[0]}${(parts[parts.length - 1] as string)[0]}`.toUpperCase();
}

/** `15` -> `15 workers needed`, `1` -> `1 worker needed`. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
