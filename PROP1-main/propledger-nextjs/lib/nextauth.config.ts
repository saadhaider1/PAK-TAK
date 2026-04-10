import { NextAuthOptions, type DefaultSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// Debug environment variables
console.log('=== NextAuth Configuration ===');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('================================');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ CRITICAL: Google OAuth credentials are missing!');
    console.error('Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local');
}

declare module 'next-auth' {
    interface Session extends DefaultSession {
        accessToken?: string;
    }
    interface User {
        id?: string;
        oauth_provider?: string;
        oauth_id?: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    pages: {
        signIn: '/signup',
        error: '/signup',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log('SignIn callback - user:', user?.email, 'provider:', account?.provider);

            try {
                // Only handle OAuth sign-ins (Google)
                if (account?.provider === 'google') {
                    const { db } = await import('@/lib/db');

                    // Check if user exists
                    const existingUser = await db.getUserByEmail(user.email!);

                    if (existingUser) {
                        console.log('Existing user found:', existingUser.email);
                        // Update OAuth info if needed
                        if (!existingUser.oauth_provider || !existingUser.oauth_id) {
                            // Update user with OAuth info using Supabase
                            const { createSupabaseAdminClient } = await import('@/lib/supabase');
                            const supabase = createSupabaseAdminClient();

                            await supabase
                                .from('users')
                                .update({
                                    oauth_provider: account.provider,
                                    oauth_id: account.providerAccountId,
                                    profile_picture_url: user.image,
                                    email_verified: true
                                })
                                .eq('id', existingUser.id);
                            console.log('Updated existing user with OAuth info');
                        }
                        // Store user ID and mark as existing user
                        (user as any).id = existingUser.id.toString();
                        (user as any).isExistingUser = true;
                        return true;
                    } else {
                        // NEW: Don't create user here - just mark as new user
                        // Let them complete the signup form with auto-filled data
                        console.log('New OAuth user - will complete signup form:', user.email);
                        (user as any).isExistingUser = false;
                        (user as any).oauthProvider = account.provider;
                        (user as any).oauthId = account.providerAccountId;
                        return true;
                    }
                }

                return true;
            } catch (error) {
                console.error('SignIn callback error:', error);
                // Allow sign-in even if database update fails - we'll handle it in the app
                return true;
            }
        },
        async jwt({ token, account, user, profile }) {
            console.log('JWT callback - user:', user?.email);
            if (account && user) {
                token.accessToken = account.access_token;
                token.userId = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
                token.provider = account.provider;
                token.isExistingUser = (user as any).isExistingUser;
                token.oauthProvider = (user as any).oauthProvider;
                token.oauthId = (user as any).oauthId;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            console.log('Session callback - token email:', token.email);
            if (session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).email = token.email;
                (session.user as any).name = token.name;
                (session.user as any).image = token.picture;
                (session as any).accessToken = token.accessToken;
                (session as any).provider = token.provider;
                (session as any).isExistingUser = token.isExistingUser;
                (session as any).oauthProvider = token.oauthProvider;
                (session as any).oauthId = token.oauthId;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            console.log('Redirect callback - url:', url, 'baseUrl:', baseUrl);
            // NEW: Redirect to signup page for OAuth callbacks
            // This allows the form to auto-fill with Google data
            if (url.includes('callback')) return baseUrl + '/signup';
            if (url.includes('signup')) return baseUrl + '/signup';
            // Default to signup for new users
            return baseUrl + '/signup';
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // Re-validate once a day
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
    useSecureCookies: process.env.NODE_ENV === 'production',
};

// Export function to avoid Next.js Route export issues
export function getAuthOptions() {
    return authOptions;
}
