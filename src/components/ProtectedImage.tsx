"use client";

// A plain <img> with light anti-download deterrents (right-click, drag,
// iOS long-press save). Needs "use client" since onContextMenu is an event
// handler and can't be passed from a Server Component.
export default function ProtectedImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      className={className}
    />
  );
}
