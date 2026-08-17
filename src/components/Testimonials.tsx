export type Testimonial = {
  id: string;
  name: string | null;
  message: string;
  contextLine: string;
};

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <div className="mt-10 sm:mt-14">
      <h2 className="font-serif text-xl font-semibold tracking-tight text-royal-maroon sm:text-2xl">
        What people say
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {testimonials.map((t, index) => (
          <div
            key={t.id}
            className="animate-card-in rounded-lg border border-royal-gold/25 bg-white p-4 shadow-sm"
            style={{ animationDelay: `${Math.min(index, 10) * 60}ms` }}
          >
            <p className="text-sm text-neutral-700 sm:text-base">&ldquo;{t.message}&rdquo;</p>
            <p className="mt-2 text-xs text-neutral-500">
              <span className="font-medium text-royal-ink">{t.name || "Anonymous"}</span> — {t.contextLine}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
