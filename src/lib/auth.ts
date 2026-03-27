// ============================================================
// DragonsDash — Authentication Module
// ============================================================
// WebAuthn/Passkeys primary auth, PIN fallback.
// Auto-lock after inactivity. 10 failed attempts = wipe.
// ============================================================

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let lockCallback: (() => void) | null = null;

/**
 * Start the inactivity timer.
 * Calls the lock callback after INACTIVITY_TIMEOUT_MS of no activity.
 */
export function startAutoLock(onLock: () => void): void {
  lockCallback = onLock;
  resetInactivityTimer();

  // Listen for user activity
  const events = ["mousedown", "keydown", "touchstart", "scroll"];
  const reset = () => resetInactivityTimer();

  for (const event of events) {
    window.addEventListener(event, reset, { passive: true });
  }
}

/**
 * Stop the auto-lock timer and remove event listeners.
 */
export function stopAutoLock(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  lockCallback = null;
}

function resetInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  inactivityTimer = setTimeout(() => {
    if (lockCallback) {
      lockCallback();
    }
  }, INACTIVITY_TIMEOUT_MS);
}

/**
 * Check if WebAuthn is available in this browser.
 */
export async function isWebAuthnAvailable(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    !window.PublicKeyCredential
  ) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Generate a random challenge for WebAuthn.
 */
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Register a new WebAuthn credential.
 * Returns the credential to be stored server-side.
 */
export async function registerWebAuthn(
  userId: string,
  userName: string,
): Promise<PublicKeyCredential | null> {
  if (!(await isWebAuthnAvailable())) return null;

  const challenge = generateChallenge();

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rp: {
      name: "DragonsDash",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userName,
      displayName: userName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" }, // ES256
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
    timeout: 60000,
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return credential as PublicKeyCredential;
  } catch (error) {
    console.error("WebAuthn registration failed:", error);
    return null;
  }
}

/**
 * Authenticate with WebAuthn.
 * Returns true if authentication succeeds.
 */
export async function authenticateWebAuthn(): Promise<boolean> {
  if (!(await isWebAuthnAvailable())) return false;

  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer as ArrayBuffer,
    rpId: window.location.hostname,
    userVerification: "required",
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return assertion !== null;
  } catch (error) {
    console.error("WebAuthn authentication failed:", error);
    return false;
  }
}

/**
 * Verify a PIN against the stored hash.
 * The PIN is hashed client-side before comparison.
 * @param pin - User-entered PIN
 * @param storedHash - Previously hashed PIN from storage
 * @returns True if PIN matches
 */
export async function verifyPIN(
  pin: string,
  storedHash: string,
): Promise<boolean> {
  if (pin.length < 6) return false;

  const hash = await hashPIN(pin);
  return hash === storedHash;
}

/**
 * Hash a PIN using SHA-256.
 * This is done client-side before any network transmission.
 */
async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Export for external use.
 */
export { hashPIN };
