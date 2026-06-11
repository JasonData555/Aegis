// Single centered column — max 760px, 24px padding mobile / 40px desktop.
// Aegis is a personal document read top to bottom, not a dashboard.

export default function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[760px] px-6 md:px-10 ${className}`}>
      {children}
    </div>
  );
}
