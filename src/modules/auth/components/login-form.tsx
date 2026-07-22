"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { label: "CEO", email: "ceo@demo.com", password: "demo1234" },
  { label: "Trader", email: "trader@demo.com", password: "demo1234" },
  { label: "Admin Marketing", email: "admin@demo.com", password: "demo1234" },
  { label: "Traffic Head", email: "traffic@demo.com", password: "demo1234" },
  { label: "QC Manager", email: "qc@demo.com", password: "demo1234" },
  { label: "Finance", email: "finance@demo.com", password: "demo1234" },
];

export function LoginForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setAuthError(null);
    const result = await signIn("credentials", {
      email: data.email.toLowerCase(),
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError("Invalid email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  function fillDemo(email: string, password: string) {
    setValue("email", email);
    setValue("password", password);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {/* Email */}
      <div className="field">
        <label htmlFor="email" className="field__label">Email</label>
        <div className="input-group input-group--lg">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12s0 5.657-1.172 6.828S17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172S2 15.771 2 12Z" />
                <path strokeLinecap="round" d="m6 8l2.159 1.8c1.837 1.53 2.755 2.295 3.841 2.295s2.005-.765 3.841-2.296L18 8" />
              </g>
            </svg>
          </span>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@coaltrade.com"
            autoComplete="email"
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="field__error text-xs text-danger mt-1" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="field">
        <label htmlFor="password" className="field__label">Password</label>
        <div className="input-group input-group--lg">
          <span className="input-group__text">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 16c0-2.828 0-4.243.879-5.121C3.757 10 5.172 10 8 10h8c2.828 0 4.243 0 5.121.879C22 11.757 22 13.172 22 16s0 4.243-.879 5.121C20.243 22 18.828 22 16 22H8c-2.828 0-4.243 0-5.121-.879C2 20.243 2 18.828 2 16Z" />
                <circle cx="12" cy="16" r="2" />
                <path strokeLinecap="round" d="M6 10V8a6 6 0 1 1 12 0v2" />
              </g>
            </svg>
          </span>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="••••••••"
            autoComplete="current-password"
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="field__error text-xs text-danger mt-1" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Auth error */}
      {authError && (
        <p className="text-sm text-danger" role="alert" aria-live="polite">
          {authError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="button button--primary button--block button--lg"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner spinner--sm" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>

      {/* Demo accounts */}
      <div className="mt-2">
        <p className="text-xs text-muted-foreground mb-2">Demo accounts (click to fill):</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              className="button button--sm button--ghost button--neutral"
              onClick={() => fillDemo(a.email, a.password)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
