import Link from "next/link";

export default function PersonNotFound() {
  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page">
          <p className="faces-empty">
            Профиль не найден. <Link href="/faces">К каталогу</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
