import crypto from "crypto";

function base64URLEncode(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generatePKCE() {
  const verifier = base64URLEncode(crypto.randomBytes(32));

  const challenge = base64URLEncode(
    crypto.createHash("sha256").update(verifier).digest()
  );

  return { verifier, challenge };
}
