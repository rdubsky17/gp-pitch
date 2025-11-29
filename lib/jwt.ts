import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'dsu_secret_key';
const encodedKey = new TextEncoder().encode(secretKey);

// user class, later add more data here
export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
}

// sign token with payload
export async function signToken(
  payload: Record<string, unknown> & JWTPayload,
  expirationTime: string = '7d' // Default to 7 days
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(encodedKey);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

