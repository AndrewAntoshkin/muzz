import Link from "next/link";

export default function EventNotFound() {
  return (
    <div className="app-main__body">
      <main className="page-area">
        <div className="page-scroll detail-page">
          <p className="faces-empty">
            Мероприятие не найдено. <Link href="/">На главную</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
