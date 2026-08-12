import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNeonAuth } from '@neondatabase/auth/next/server';

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

export async function getCurrentUser() {
  const { data } = await auth.getSession();
  if (!data?.user) return null;
  
  const [user] = await db.select().from(users).where(eq(users.id, data.user.id));
  if (!user) {
    const [newUser] = await db.insert(users).values({
      id: data.user.id,
      name: data.user.name || 'Anonymous',
    }).returning();
    return newUser;
  }
  return user;
}
