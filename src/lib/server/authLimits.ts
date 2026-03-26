/** Bound auth payloads — keeps Redis JSON small and avoids expensive PBKDF2 on huge strings. */
export const MAX_EMAIL_LENGTH = 254;
export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MAX_PASSWORD_BYTES = 256;
export const MAX_LOGIN_IDENTIFIER_LENGTH = 254;
