import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page">
          <h1 className="detail-hero__title">Страница не найдена</h1>
          <p className="agency-empty">Такой страницы нет или она была удалена.</p>
          <p>
            <Link href="/" className="link-accent">
              На главную
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
