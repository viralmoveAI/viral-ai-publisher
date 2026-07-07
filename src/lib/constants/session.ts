/**
 * Standardized cookie name using Google/W3C cookie prefixes.
 *
 * __Host- prefix enforces:
 *  - Secure flag must be set
 *  - No Domain attribute allowed
 *  - Path must be "/"
 *
 * In development (HTTP), browsers reject __Host- cookies,
 * so we fall back to a plain name.
 */
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-session" : "session";
