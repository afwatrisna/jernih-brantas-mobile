"use client";

/**
 * PLACEHOLDER — replace this file with the full home-dashboard from:
 * https://github.com/afwatrisna/jernih-brantas-mobile/pull/2
 * or local zip: jernih-refactor.zip → next-web/src/app/page.tsx
 *
 * Copy that file to: next-web/src/components/home-dashboard.tsx
 */
export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark">◒</span>
          <span>
            <b>Jernih</b>
            <small>BRANTAS · NEXT</small>
          </span>
        </span>
        <span className="demo-badge">
          <i /> REFACTOR — ACTION NEEDED
        </span>
      </header>
      <div className="workspace" style={{ padding: 24, maxWidth: 640 }}>
        <h1>Satu file lagi untuk menyelesaikan refactor</h1>
        <p>
          Modul UI dan helper sudah ada di branch ini. File{" "}
          <code>home-dashboard.tsx</code> masih placeholder karena ukuran
          payload (~29KB) belum bisa di-push penuh lewat connector.
        </p>
        <ol>
          <li>
            Ambil file lengkap dari zip refactor / artifacts{" "}
            <code>next-web/src/app/page.tsx</code>
          </li>
          <li>
            Simpan sebagai{" "}
            <code>next-web/src/components/home-dashboard.tsx</code>
          </li>
          <li>
            Commit & push ke branch <code>refactor/page-tsx-split</code>
          </li>
        </ol>
        <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 8 }}>
{`git checkout refactor/page-tsx-split
# paste full home-dashboard.tsx then:
git add next-web/src/components/home-dashboard.tsx
git commit -m "refactor(next-web): restore full home-dashboard UI"
git push origin refactor/page-tsx-split`}
        </pre>
      </div>
      <footer className="app-footer">
        Jernih Brantas · Next.js + TypeScript · <span>REFACTOR</span>
      </footer>
    </main>
  );
}
