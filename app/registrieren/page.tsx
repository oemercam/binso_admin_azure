import { Suspense } from "react";
import { RegisterPage } from "@/components/auth-pages";

function RegisterFallback() {
  return (
    <div className="auth-shell">
      <div className="auth-card">Registrierung wird geladen …</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterPage />
    </Suspense>
  );
}
