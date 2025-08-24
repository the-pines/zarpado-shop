"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_API_KEY as string
);

type AddressDefaults = {
  country?: string;
  postal_code?: string;
};

function CheckoutForm({
  clientSecret,
  email,
  address,
}: {
  clientSecret: string;
  email?: string;
  address?: AddressDefaults;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      const isoCountry = address?.country === "UK" ? "GB" : address?.country;
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
          return_url: `${window.location.origin}/checkout-elements?success=true`,
          payment_method_data: {
            billing_details: {
              name: "Customer",
              email,
              phone: "+440000000000",
              address: {
                country: isoCountry,
                postal_code: address?.postal_code,
                line1: "N/A",
                city: "N/A",
                state: "N/A",
              },
            },
          },
        },
        redirect: "if_required",
      });
      if (result.error) {
        setError(result.error.message || "Payment failed");
      } else {
        setSucceeded(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    // Handle return from 3DS if redirected back with success=true
    async function checkReturn() {
      if (!stripe) return;
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      if (success === "true" && clientSecret) {
        const { paymentIntent } = await stripe.retrievePaymentIntent(
          clientSecret
        );
        if (paymentIntent && paymentIntent.status === "succeeded") {
          setSucceeded(true);
        }
      }
    }
    checkReturn();
  }, [stripe, clientSecret]);

  if (succeeded) {
    return (
      <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center'>
        <div className='mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
            <path
              d='M5 13l4 4L19 7'
              stroke='currentColor'
              className='text-emerald-400'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <h2 className='text-lg font-semibold'>Payment successful</h2>
        <p className='mt-1 text-white/70 text-sm'>
          Thanks! Your payment went through.
        </p>
        <Link
          href='/'
          className='mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white border border-white/10 btn-gradient btn-glow'
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4'>
        <h3 className='mb-2 text-sm font-medium text-white/80'>Payment</h3>
        <div className='mb-3 rounded-md border border-white/10 bg-black/10 p-3 text-xs text-white/80'>
          <div className='flex items-center justify-between'>
            <span>Country</span>
            <span className='font-medium'>
              {address?.country === "GB" || address?.country === "UK"
                ? "United Kingdom"
                : address?.country}
            </span>
          </div>
          <div className='mt-1 flex items-center justify-between'>
            <span>Postcode</span>
            <span className='font-medium'>{address?.postal_code}</span>
          </div>
        </div>
        <PaymentElement
          options={{
            fields: { billingDetails: "never" },
            paymentMethodOrder: ["card"],
          }}
        />
      </div>
      {error ? <div className='text-red-400 text-sm'>{error}</div> : null}
      <button
        type='submit'
        disabled={!stripe || submitting}
        className='btn-glow btn-gradient inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed'
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

function CheckoutElementsContent() {
  const search = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const qsPriceId = search.get("priceId") || undefined;
  const qsEmail = search.get("email") || "example@gmail.com";
  const qsCountry = search.get("country") || "GB";
  const qsPostal = search.get("postal_code") || "WS11 1AA";
  const address = {
    country: qsCountry,
    postal_code: qsPostal,
  } as AddressDefaults;

  useEffect(() => {
    async function createIntent() {
      try {
        setLoadError(null);
        let priceIdToUse: string | undefined = qsPriceId;
        if (!priceIdToUse) {
          const res = await fetch("/api/products", { cache: "no-store" });
          const data = await res.json();
          const first = data?.items?.[0];
          if (first?.priceId) priceIdToUse = first.priceId;
        }
        if (!priceIdToUse) return;
        const intentRes = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: priceIdToUse,
            email: qsEmail,
            address,
          }),
        });
        const intentData = await intentRes.json();
        if (intentRes.ok) {
          setClientSecret(intentData.clientSecret);
        } else {
          setLoadError(intentData?.error || "Failed to prepare payment");
        }
      } catch {
        setLoadError("Failed to prepare payment");
      }
    }
    createIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qsPriceId, qsEmail, qsCountry, qsPostal]);

  const options: StripeElementsOptions = useMemo(
    () => ({ clientSecret: clientSecret as string }),
    [clientSecret]
  );

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-[#0b0b23] via-[#0f0f1f] to-[#1a0f1f] text-white'>
      <div className='hero-wrap overflow-hidden'>
        <div className='hero-layer hero-gradient-a' />
        <div className='hero-layer hero-gradient-b' />
        <div className='hero-layer hero-gradient-c' />
        <div className='hero-layer shimmer opacity-10' />
        <div className='hero-layer hero-noise' />

        <header className='relative z-[1] mx-auto max-w-5xl px-6 pt-12 pb-6 text-center'>
          <h1 className='text-2xl sm:text-4xl font-semibold tracking-tight'>
            Checkout
          </h1>
          <p className='mt-3 text-balance text-white/70 text-sm sm:text-base'>
            Secure payment powered by Stripe
          </p>
        </header>
      </div>

      <main className='mx-auto max-w-md px-6 pb-24'>
        {loadError ? (
          <div className='rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300'>
            {loadError}
          </div>
        ) : !clientSecret ? (
          <div className='text-white/70'>Preparing payment…</div>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              clientSecret={clientSecret}
              email={qsEmail}
              address={address}
            />
          </Elements>
        )}
      </main>
    </div>
  );
}

export default function CheckoutElementsPage() {
  return (
    <Suspense fallback={<div className='text-white/70'>Loading…</div>}>
      <CheckoutElementsContent />
    </Suspense>
  );
}
