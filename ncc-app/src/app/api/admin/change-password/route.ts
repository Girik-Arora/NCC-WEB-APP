import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// Prevent Next.js from statically pre-rendering this route at build time
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in .env.local' },
        { status: 500 }
      );
    }

    const { uid, newPassword } = await req.json();

    if (!uid || !newPassword) {
      return NextResponse.json({ error: 'Missing uid or newPassword' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Change the user's password directly
    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
