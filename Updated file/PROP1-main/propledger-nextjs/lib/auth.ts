import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { User } from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  type: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate session token
export function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Create JWT token
export async function createJWT(payload: SessionUser): Promise<string> {
  return new SignJWT({
    id: payload.id,
    name: payload.name,
    email: payload.email,
    type: payload.type
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      type: payload.type as string,
    };
  } catch {
    return null;
  }
}

// Get current user from session (JWT-based)
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('propledger_session')?.value;

  if (!sessionToken) {
    return null;
  }

  // Verify JWT token
  const user = await verifyJWT(sessionToken);
  return user;
}

// Create session (JWT-based, stored in cookie)
export async function createSession(user: User): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Create JWT token with user data
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.full_name,
    email: user.email,
    type: user.user_type,
  };

  const jwtToken = await createJWT(sessionUser);

  // Set cookie with JWT
  const cookieStore = await cookies();
  cookieStore.set('propledger_session', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return jwtToken;
}

// Delete session
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('propledger_session');
}

// Require authentication middleware
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

// Check if user is agent
export function isAgent(user: SessionUser): boolean {
  return user.type === 'agent';
}

// Verify authentication for API routes
export async function verifyAuth(request: Request): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
  try {
    // Try to get session token from cookie header
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return { success: false, error: 'No session found' };
    }

    // Parse session token from cookie
    const sessionToken = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('propledger_session='))
      ?.split('=')[1];

    if (!sessionToken) {
      return { success: false, error: 'No session token found' };
    }

    // Verify JWT token
    const user = await verifyJWT(sessionToken);

    if (!user) {
      return { success: false, error: 'Invalid or expired session' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}
