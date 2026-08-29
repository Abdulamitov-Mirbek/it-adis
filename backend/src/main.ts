
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
  });

  // Behind Vercel/Render/Fly the client IP arrives in X-Forwarded-For. Without
  // this every request looks like it came from the proxy, so the rate limiter
  // would bucket the whole internet together and lock out real users while
  // barely slowing an attacker.
  app.set("trust proxy", 1);

  // Baseline response headers: nosniff, frameguard, HSTS, referrer policy and
  // the removal of X-Powered-By. There were none of these before.
  app.use(
    helmet({
      // The API returns JSON, never HTML, so the default restrictive CSP costs
      // nothing here. Swagger needs inline styles, and it only runs off-prod.
      contentSecurityPolicy: IS_PRODUCTION
        ? { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }
        : false,
      crossOriginResourcePolicy: { policy: "same-site" },
    })
  );

  // CORS. FRONTEND_URL accepts a comma-separated list so the production
  // domain and any Vercel preview deployments can share one variable.
  const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // A 100 kB JSON body is far more than any DTO here needs (the largest field
  // is a 2000-character message) and stops a large-payload memory attack.
  app.useBodyParser("json", { limit: "100kb" });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Reject unknown properties outright instead of quietly dropping them.
      // Silent stripping hides the case where a client posts `isAdmin` or
      // `status` at an endpoint that never intended to accept it — the request
      // should fail loudly so it shows up, rather than half-succeeding.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      // Validation messages echo the rejected input; in production that detail
      // belongs in the server log, not in a response to an anonymous caller.
      disableErrorMessages: IS_PRODUCTION,
    })
  );

  // Swagger API docs.
  //
  // Off by default in production: the generated page is a complete map of every
  // route, including the admin ones, with their exact payload shapes — a
  // reconnaissance shortcut handed to anyone who guesses /api/docs. Set
  // ENABLE_API_DOCS=true to turn it back on deliberately.
  const docsEnabled = !IS_PRODUCTION || process.env.ENABLE_API_DOCS === "true";
  if (docsEnabled) {
    const config = new DocumentBuilder()
      .setTitle("IT ADIS API")
      .setDescription("Backend API for IT ADIS — Advanced Digital Innovation School")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("courses", "Course catalog endpoints")
      .addTag("applications", "Student application endpoints")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 IT ADIS API running on port ${port}`);
  if (docsEnabled) console.log(`📚 Swagger docs: /api/docs`);
}

bootstrap();
