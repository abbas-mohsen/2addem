/* Client-side mirrors of the server's zod rules. The server stays the
   authority; these exist so the message a user sees is translated. */

export function isUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/* Matches the phone rule in server/src/validators/auth.validator.js. */
export const PHONE_PATTERN = /^[+0-9 ()-]*$/;
