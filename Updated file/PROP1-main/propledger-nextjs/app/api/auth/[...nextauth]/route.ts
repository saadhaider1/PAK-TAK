import NextAuth from 'next-auth';
import { getAuthOptions } from '@/lib/nextauth.config';

const handler = NextAuth(getAuthOptions());

export { handler as GET, handler as POST };
