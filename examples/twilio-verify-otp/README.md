## 🪿 HONC Passwordless Login

This is a project created with the `create-honc-app` template.

Learn more about the HONC stack on the [website](https://honc.dev) or the main [repo](https://github.com/fiberplane/create-honc-app).

There is also an [Awesome HONC collection](https://github.com/fiberplane/awesome-honc) with further guides, use cases and examples.


### 🔐 About this example

This project demonstrates a simple OTP-based passwordless login system using:

- **Twilio Verify** for sending one-time passcodes (OTP) via SMS
- **JWTs stored in cookies** for stateless session management
- A single `/` route that dynamically shows either a login form or a session page
- A countdown timer for token/session expiration
- **Drizzle + Neon** for a minimal `users` table (no passwords or email needed!)


### Getting started

Make sure you have:

1. A [Neon](https://neon.tech) database set up
2. A [Twilio account](https://twilio.com/verify) with a Verify service created

> ⚠️ You’ll need to create a **Verify Service** in your Twilio console and copy the **Service SID**.
>
> Go to [Twilio Console > Verify](https://www.twilio.com/console/verify/services) → "Create new service" → choose "SMS" → copy the Service SID.

Then create a `.dev.vars` file and add your secrets (see: `.dev.vars.example`):

```env
DATABASE_URL=your-neon-db-url
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_SERVICE_SID=your-twilio-verify-service-sid
JWT_SECRET=your-jwt-secret
```


### Project structure

```#
├── src
│   ├── index.ts # Hono app entry point
│   ├── views.ts          # HTML views for login and session
│   └── db
│       └── schema.ts # Database schema
├── seed.ts # Optional seeding script
├── .dev.vars.example # Example .dev.vars file
├── wrangler.toml # Cloudflare Workers configuration
├── drizzle.config.ts # Drizzle configuration
├── tsconfig.json # TypeScript configuration
└── package.json
```

### Commands

Run the migrations and (optionally) seed the database:

```sh
# this is a convenience script that runs db:generate, db:migrate, and db:seed
npm run db:setup
```

Run the development server:

```sh
npm run dev
```

### Developing

When you iterate on the database schema, you'll need to generate a new migration and apply it:

```sh
npm run db:generate
npm run db:migrate
```

### Deploying

Set your `DATABASE_URL` secret (and any other secrets you need) with wrangler:

```sh
npx wrangler secret put DATABASE_URL
```

Finally, change the name of the project in `wrangler.toml` to something appropriate for your project

```toml
name = "my-neon-project"
```

Deploy with wrangler:

```sh
npm run deploy
```