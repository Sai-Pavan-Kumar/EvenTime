// Edge-compatible HMAC using Web Crypto API
export async function generateHMAC(data: string): Promise<string> {
  const secret = process.env.OG_SECRET || "default_dev_secret_key_12345";
  
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  
  // Convert ArrayBuffer to Hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}