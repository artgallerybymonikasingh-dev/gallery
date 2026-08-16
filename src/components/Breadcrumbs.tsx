import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ label: "Home", href: "/" }, ...items];

  return (
    <nav aria-label="Breadcrumb" className="mb-4 overflow-x-auto sm:mb-6">
      <ol className="flex items-center gap-1.5 whitespace-nowrap text-sm text-neutral-500">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-royal-gold">/</span>}
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="max-w-[40vw] truncate hover:text-royal-maroon sm:max-w-none">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="max-w-[40vw] truncate font-medium text-royal-ink sm:max-w-none"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
