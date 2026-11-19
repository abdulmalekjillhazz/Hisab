import { getBusinessCategory } from '@/lib/business-categories';

export function BusinessCategoryIcon({
  category,
  className,
}: {
  category?: string;
  className?: string;
}) {
  const selected = getBusinessCategory(category);

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {selected.paths.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}
