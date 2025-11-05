import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="dashboard-shell">
      {children}
      </section>
  );
}