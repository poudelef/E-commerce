"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-muted">{error.message || "Please try again."}</p>
      <button type="button" onClick={reset} className="mt-5 rounded-full bg-primary px-5 py-2.5 font-bold text-white">
        Try again
      </button>
    </main>
  );
}
