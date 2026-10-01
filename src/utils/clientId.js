// getRandomValues is available on HTTP LAN origins where randomUUID is not.
export const createClientId = (prefix, cryptoSource = globalThis.crypto) => {
  if (typeof cryptoSource?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoSource.getRandomValues(bytes);
    const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${randomPart}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
};
