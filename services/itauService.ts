// Minimal Pix charge stub used by PosView.
// Replace with the real Itau integration in production.

export type PixChargeResponse = {
  pixCopiaCola: string;
  qrCodeImage: string; // data URL or image URL
  expiresAt?: string;
};

export async function createPixCharge(amount: number, description: string, pixKey: string): Promise<PixChargeResponse> {
  // Return a dummy Pix response (small SVG QR placeholder and copia/cola text).
  const copiaCola = `PIX|${amount.toFixed(2)}|${description}|${pixKey}`;
  const svg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#fff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#111">PIX</text></svg>`);
  return Promise.resolve({
    pixCopiaCola: copiaCola,
    qrCodeImage: `data:image/svg+xml;utf8,${svg}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 15).toISOString()
  });
}

export default createPixCharge;
