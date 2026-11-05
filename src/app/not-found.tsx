import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-muted">That link does not match anything in the store.</p>
      <Link href="/" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 font-bold text-white">
        Back to shop
      </Link>
    </main>
  );
}
