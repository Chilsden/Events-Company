"use client";

import { useEffect, useState } from "react";

/**
 * Screen-reader announcement. The visible message is already in the page; this adds the same text to a hidden live
 * region shortly after the page loads, because text that is present at load time is often not announced.
 */
export function Announcer({ text, urgent = false }: { text: string; urgent?: boolean }) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setMessage(text), 150);
    return () => clearTimeout(id);
  }, [text]);
  return (
    <div role={urgent ? "alert" : "status"} className="visually-hidden">
      {message}
    </div>
  );
}

/** Puts keyboard focus on an element after the page loads, so keyboard users carry on from the row they just used. */
export function FocusOnMount({ targetId }: { targetId: string }) {
  useEffect(() => {
    document.getElementById(targetId)?.focus();
  }, [targetId]);
  return null;
}
