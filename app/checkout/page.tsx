import { Suspense } from "react";
import CheckoutPage from "@/components/checkout-page";
import LocalizedText from "@/components/i18n/localized-text";

function CheckoutFallback() {
  return (
    <div className="auth-shell">
      <div className="auth-card"><LocalizedText>Checkout wird geladen …</LocalizedText></div>
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
