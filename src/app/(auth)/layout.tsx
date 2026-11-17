import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-shell">
      <Link className="auth-brand" href="/" aria-label="AirX home">
        <span className="brand-mark">A</span><span>AirX<span className="brand-light"> Platform</span></span>
      </Link>
      <section className="auth-card">{children}</section>
      <p className="auth-footer">Secure AirX workspace access</p>
    </main>
  );
}

