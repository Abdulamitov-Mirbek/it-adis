"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { useRouter } from "@/i18n/navigation";
import { Button, Field, Input } from "./ui/primitives";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Someone arriving here with a live session should not have to sign in
    // twice. Waiting for isLoading avoids a flash of the form on reload.
    if (!isLoading && isAuthenticated) {
      router.replace("/admin");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
      setIsSubmitting(false);
    }
    // On success the provider navigates away, so the submitting state is left
    // on deliberately — clearing it would flicker the button back to idle
    // underneath the redirect.
  };

  return (
    <div className="relative min-h-screen grid place-items-center bg-dark px-4 py-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-3xl opacity-25"
        style={{ background: "radial-gradient(ellipse, var(--color-green-600), transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-7">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-green-500 text-dark font-bold mb-4">
            IA
          </span>
          <h1 className="font-display text-xl font-semibold text-green-50">IT ADIS Administration</h1>
          <p className="text-[13px] text-green-100/50 mt-1">
            Sign in to manage courses and applications
          </p>
        </div>

        <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label="Email address" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@itadis.edu"
                required
                autoFocus
              />
            </Field>

            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>

            {error && (
              <p
                className="rounded-lg bg-red-500/10 border border-red-500/25 px-3 py-2 text-[13px] text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        {/* The previous version printed the live administrator email and
            password on this page, in production, to anyone who loaded it. */}
        <p className="text-center text-xs text-green-100/35 mt-6">
          Authorised personnel only.
        </p>
      </div>
    </div>
  );
}
