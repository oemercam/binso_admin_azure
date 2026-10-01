"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/ui/brand-logo";
import { apiFetch } from "@/lib/client/runtime";
import {useLocale} from "@/components/locale-provider";

function Frame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const {t}=useLocale();
  return (
    <div className="auth-shell">
      <Link href="/" className="auth-logo auth-logo-image">
        <BrandLogo />
      </Link>

      <div className="auth-card">
        <div className="auth-intro">
          <h1>{t(title)}</h1>
        </div>

        {children}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const {t}=useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await apiFetch("/api/auth/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setSent(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Anfrage fehlgeschlagen.")
      );
    }
  }

  return (
    <Frame title="Passwort zurücksetzen">
      {sent ? (
        <div className="auth-success">
          <p>{t("Wenn ein Konto zu dieser E-Mail besteht, wurde ein Link versendet.")}</p>
          <Link href="/login">{t("Zur Anmeldung")}</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>{t("E-Mail")}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button className="marketing-primary auth-submit">
            {t("Link senden")}
          </button>

          <Link href="/login">{t("Anmelden")}</Link>
        </form>
      )}
    </Frame>
  );
}

export function ResetPasswordPage() {
  const {t}=useLocale();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await apiFetch("/api/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      setDone(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("Passwort konnte nicht geändert werden.")
      );
    }
  }

  return (
    <Frame title="Neues Passwort">
      {done ? (
        <div className="auth-success">
          <p>{t("Das Passwort wurde geändert. Alle bisherigen Sitzungen wurden beendet.")}</p>
          <Link href="/login">{t("Jetzt anmelden")}</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label>
            <span>{t("Neues Passwort")}</span>
            <input
              type="password"
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <small>{t("Mindestens 12 Zeichen.")}</small>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="marketing-primary auth-submit"
            disabled={!token}
          >
            {t("Passwort speichern")}
          </button>
        </form>
      )}
    </Frame>
  );
}

export function VerifyEmailPage() {
  const {t}=useLocale();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [state, setState] = useState<"loading" | "ok" | "error">(
    () => (token ? "loading" : "error")
  );

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    void apiFetch("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then(() => setState("ok"))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState("error");
      });

    return () => controller.abort();
  }, [token]);

  return (
    <Frame title="E-Mail bestätigen">
      {state === "loading" ? (
        <p>{t("Bestätigung wird geprüft …")}</p>
      ) : state === "ok" ? (
        <div className="auth-success">
          <p>{t("Deine E-Mail-Adresse wurde bestätigt.")}</p>
          <Link href="/dashboard">{t("Weiter zu Binso One")}</Link>
        </div>
      ) : (
        <div className="auth-error">
          {t("Der Link ist ungültig oder abgelaufen.")}
        </div>
      )}
    </Frame>
  );
}