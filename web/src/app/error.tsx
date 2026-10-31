"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section>
      <h1>Something went wrong</h1>
      <p>The page could not be shown. Your data has not been changed.</p>
      <button type="button" className="button" onClick={reset}>Try again</button>
    </section>
  );
}
