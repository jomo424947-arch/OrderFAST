import { uuidv7 } from 'uuidv7';

/**
 * Generates a time-ordered UUID v7
 * Compliant with RFC 9562
 */
export function generateId(): string {
  return uuidv7();
}
