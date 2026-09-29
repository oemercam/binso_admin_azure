import { Suspense } from "react";
import CheckoutPage from "@/components/checkout-page";

function CheckoutFallback() {
  return (
    <div className="auth-shell">
      <div className="auth-card">Checkout wird geladen …</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutPage />
    </Suspense>
  );
}
