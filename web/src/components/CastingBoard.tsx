"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "./useWorkspace";

const PIN_POOL = [
  { slug: "vzmetnev", name: "Александр Взметнев", photo: "/assets/actors/vzmetnev-kinopoisk.jpg" },
  { slug: "lerman-olga", name: "Ольга Лерман", photo: "/assets/actors/akter1/lerman-olga.png" },
  { slug: "ustyugov-aleksandr", name: "Александр Устюгов", photo: "/assets/actors/akter1/ustyugov-aleksandr.jpg" },
  { slug: "shilovskaya-aglaya", name: "Аглая Шиловская", photo: "/assets/actors/akter1/shilovskaya-aglaya.jpg" },
  { slug: "metelkin-aleksandr", name: "Александр Метелкин", photo: "/assets/actors/akter1/metelkin-aleksandr.jpg" },
  { slug: "kutepova-polina", name: "Полина Кутепова", photo: "/assets/actors/akter1/kutepova-polina.jpg" },
  { slug: "hmelnickaya-alyona", name: "Алёна Хмельницкая", photo: "/assets/actors/akter1/hmelnickaya-alyona.jpg" },
  { slug: "horinyak-viktor", name: "Виктор Хориняк", photo: "/assets/actors/akter1/horinyak-viktor.png" },
] as const;

export function CastingBoard({
  projectSlug,
  editable = true,
}: {
  projectSlug: string;
  editable?: boolean;
}) {
  const { boards, addPin, removePin, updatePin } = useWorkspace();
  const [picker, setPicker] = useState(false);
  const [character, setCharacter] = useState("");
  const [picked, setPicked] = useState<(typeof PIN_POOL)[number] | null>(null);

  const pins = useMemo(
    () => boards.filter((p) => p.projectSlug === projectSlug),
    [boards, projectSlug],
  );
  const pinned = new Set(pins.map((p) => p.actorSlug));
  const available = PIN_POOL.filter((p) => !pinned.has(p.slug));

  function confirmAdd() {
    if (!picked) return;
    addPin({
      projectSlug,
      actorSlug: picked.slug,
      actorName: picked.name,
      photo: picked.photo,
      character: character.trim() || "персонаж",
    });
    setPicked(null);
    setCharacter("");
    setPicker(false);
  }

  return (
    <section className="detail-block casting-board">
      <div className="detail-block__head">
        <h2 className="detail-block__title">Доска ансамбля</h2>
        {editable ? (
          picker ? (
            <button type="button" className="detail-block__link" onClick={() => setPicker(false)}>
              Отмена
            </button>
          ) : (
            <button type="button" className="detail-block__link" onClick={() => setPicker(true)}>
              Добавить
            </button>
          )
        ) : null}
      </div>

      <div className="casting-board__grid">
        {pins.length ? (
          pins.map((pin) => (
            <article key={pin.id} className="casting-pin">
              <div className="casting-pin__photo">
                <img src={pin.photo} alt="" />
                {editable ? (
                  <button type="button" className="casting-pin__off" onClick={() => removePin(pin.id)} aria-label="Убрать с доски">
                    ×
                  </button>
                ) : null}
              </div>
              <div className="casting-pin__meta">
                <div className="casting-pin__name">{pin.actorName}</div>
                {editable ? (
                  <input
                    className="casting-pin__role"
                    value={pin.character}
                    onChange={(e) => updatePin(pin.id, { character: e.target.value })}
                    aria-label="Персонаж"
                  />
                ) : (
                  <div className="casting-pin__role">{pin.character}</div>
                )}
              </div>
            </article>
          ))
        ) : (
          <p className="casting-board__empty">Пока пусто — добавьте актёра на доску.</p>
        )}
      </div>

      {picker && editable ? (
        <div className="casting-board__picker">
          <div className="casting-board__pool">
            {available.map((person) => (
              <button
                type="button"
                key={person.slug}
                className={`casting-board__pick${picked?.slug === person.slug ? " is-on" : ""}`}
                onClick={() => setPicked(person)}
              >
                <img src={person.photo} alt="" />
                <span>{person.name}</span>
              </button>
            ))}
            {!available.length ? <p className="casting-board__empty">Все из подборки уже на доске.</p> : null}
          </div>
          <div className="casting-board__form">
            <input
              type="text"
              placeholder="Персонаж, например «Марина · главная»"
              value={character}
              onChange={(e) => setCharacter(e.target.value)}
            />
            <button type="button" className="btn-primary btn-sm" disabled={!picked} onClick={confirmAdd}>
              Добавить
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
