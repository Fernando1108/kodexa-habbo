// Auth group layout — minimal wrapper.
// Background effects (aurora, grid-bg, stars) are handled per-page
// to allow page-specific opacity/color tuning without double-rendering fixed elements.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
