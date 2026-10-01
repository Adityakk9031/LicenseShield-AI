import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional class names and de-duplicate conflicting Tailwind utilities.
 * Standard shadcn/ui helper, used by the Aceternity-style 3D card primitives.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
