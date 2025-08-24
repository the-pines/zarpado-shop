import Image from "next/image";
import { headers } from "next/headers";
import { BuyButton } from "@/components/BuyButton";

type ProductItem = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  priceId: string;
  currency: string;
  unitAmount: number | null;
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function getProducts(): Promise<ProductItem[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/products`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items as ProductItem[];
}

export default async function Home() {
  const products = await getProducts();
  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-[#0b0b23] via-[#0f0f1f] to-[#1a0f1f] text-white'>
      <div className='hero-wrap overflow-hidden'>
        {/* Full-bleed animated layers */}
        <div className='hero-layer hero-gradient-a' />
        <div className='hero-layer hero-gradient-b' />
        <div className='hero-layer hero-gradient-c' />
        <div className='hero-layer shimmer opacity-10' />
        <div className='hero-layer hero-noise' />

        {/* QR pinned to very top-right without background */}
        <a
          href='https://usemonadpay.com'
          target='_blank'
          rel='noopener noreferrer'
          className='hidden sm:block absolute right-6 md:right-12 top-1.5 md:top-3 z-[2]'
          aria-label='Open Monad Pay'
        >
          <Image
            src='/qr_code.png'
            alt='Monad Pay QR'
            width={180}
            height={180}
            priority
          />
        </a>

        <header className='relative z-[1] mx-auto max-w-5xl px-6 pt-12 pb-6 text-center'>
          <h1 className='text-2xl sm:text-4xl font-semibold tracking-tight'>
            Zarpado
          </h1>
          <p className='mt-3 text-balance text-white/70 text-sm sm:text-base'>
            To buy an item: <br />
            1. Sign up for Monad Pay at usemonadpay.com <br />
            2. Click an item on this page <br />
            3. Use the card details in the Monad Pay app <br />
            4. Get your item!
          </p>
        </header>
      </div>

      <main className='mx-auto max-w-6xl px-6 pb-24'>
        <section className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {products.map((p) => (
            <article
              key={p.id}
              className='group rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transition hover:bg-white/10'
            >
              <div className='relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black/20'>
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex h-full items-center justify-center text-white/40'>
                    No image
                  </div>
                )}
              </div>
              <h3 className='mt-3 text-lg font-medium'>{p.name}</h3>
              {p.description ? (
                <p className='mt-1 line-clamp-2 text-sm text-white/60'>
                  {p.description}
                </p>
              ) : null}
              <div className='mt-2 flex items-center justify-between'>
                <span className='text-sm font-semibold'>
                  {typeof p.unitAmount === "number"
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: p.currency.toUpperCase(),
                      }).format(p.unitAmount / 100)
                    : "—"}
                </span>
                <div className='flex items-center gap-2'>
                  <BuyButton
                    priceId={p.priceId}
                    email='example@gmail.com'
                    address={{ country: "GB", postal_code: "WS11 1AA" }}
                  />
                  {/* Custom checkout link removed; BuyButton now routes there directly */}
                </div>
              </div>
            </article>
          ))}
          {products.length === 0 && (
            <div className='col-span-full text-center text-white/60'>
              No products found. Ensure Stripe products with active prices
              exist.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
