// import { instrument } from "@fiberplane/hono-otel";
import { createFiberplane, createOpenAPISpec } from "@fiberplane/hono";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import { users } from "./db/schema";
import twilio from 'twilio';
import { sign, verify } from 'hono/jwt';
import { renderLoginPage, renderWelcomePage } from './views'

type Bindings = {
  DATABASE_URL: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_SERVICE_SID: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', async (c) => {
  const token = c.req.header('Cookie')?.match(/token=([^;]+)/)?.[1]
  let phone = '';
  let exp = 0;

  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET)
      phone = typeof payload.phone === 'string' ? payload.phone : ''
      exp = payload.exp ?? 0
    } catch (err) {}
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Honc! 🪿</title>
    </head>
    <body>
      <h1>Honc! 🪿</h1>
      ${phone && exp ? renderWelcomePage(phone, exp) : renderLoginPage()}
    </body>
    </html>
  `);
});

// Request OTP
app.post('/auth/request', async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);
  const { phone } = await c.req.json();
  if (!phone) return c.json({ error: 'Phone number required' }, 400);

  const client = twilio(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN);

  // Ensure user exists
  await db.insert(users).values({ phone }).onConflictDoNothing();

  try {
    await client.verify.v2.services(c.env.TWILIO_SERVICE_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });

    return c.json({ message: 'OTP sent' });
  } catch (err) {
    return c.json({ error: 'Failed to send OTP' }, 500);
  }
});

// Verify OTP
app.post('/auth/verify', async (c) => {
  const { phone, code } = await c.req.json()
  if (!phone || !code) return c.json({ error: 'Phone and code required' }, 400)

  const client = twilio(c.env.TWILIO_ACCOUNT_SID, c.env.TWILIO_AUTH_TOKEN)
  const result = await client.verify.v2.services(c.env.TWILIO_SERVICE_SID)
    .verificationChecks
    .create({ to: phone, code })

  if (result.status !== 'approved') {
    return c.json({ error: 'Invalid code' }, 401)
  }

  const token = await sign(
    {
      phone,
      exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 mins
    },
    c.env.JWT_SECRET
  )

  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Strict; Secure`)
  return c.json({ message: 'Verified', redirectTo: '/' })
})



app.post('/logout', (c) => {
  // Overwrite the token cookie with an expired one
  c.header('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure');
  return c.redirect('/');
});

app.get("/api/users", async (c) => {
  const sql = neon(c.env.DATABASE_URL);
  const db = drizzle(sql);

  return c.json({
    users: await db.select().from(users),
  });
});

/**
 * Serve a simplified api specification for your API
 * As of writing, this is just the list of routes and their methods.
 */
app.get("/openapi.json", c => {
  // @ts-expect-error - @fiberplane/hono is in beta and still not typed correctly
  return c.json(createOpenAPISpec(app, {
    openapi: "3.0.0",
    info: {
      title: "Honc D1 App",
      version: "1.0.0",
    },
  }))
});

/**
 * Mount the Fiberplane api explorer to be able to make requests against your API.
 * 
 * Visit the explorer at `/fp`
 */
app.use("/fp/*", createFiberplane({
  app,
  openapi: { url: "/openapi.json" }
}));

export default app;

// Export the instrumented app if you've wired up a Fiberplane-Hono-OpenTelemetry trace collector
//
// export default instrument(app);
