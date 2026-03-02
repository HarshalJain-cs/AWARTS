import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../env.js';

const secret = new TextEncoder().encode(env.CLI_JWT_SECRET);

export async function signCLIToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1y')
    .sign(secret);
}

export async function verifyCLIToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
