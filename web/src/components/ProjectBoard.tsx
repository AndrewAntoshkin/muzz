"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { withRole } from "@/lib/roles";
import { decodeSlug } from "@/lib/workspace";
import { ConfirmDialog } from "./ConfirmDialog";
import { useWorkspace } from "./useWorkspace";

const CARD_W = 390;
const CARD_H = 203;
const GAP = 30;
const START_X = 80;
const START_Y = 96;
const COLS = 3;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const GRID = 32;

type Tool = "select" | "pan";
type DragItem = { id: string; kind: "role" | "actor"; x: number; y: number };
type Camera = { x: number; y: number; z: number };

function slot(i: number) {
  return {
    x: START_X + (i % COLS) * (CARD_W + GAP),
    y: START_Y + Math.floor(i / COLS) * (CARD_H + GAP + 24),
  };
}

function clampZoom(n: number) {
  const snapped = Math.round(n / ZOOM_STEP) * ZOOM_STEP;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(snapped.toFixed(2))));
}

function BoardIcon({ name, size = 16 }: { name: string; size?: number }) {
  return (
    <span className="project-board__icon" style={{ width: size, height: size }}>
      <img src={`/assets/board/${name}.svg`} alt="" width={size} height={size} />
    </span>
  );
}

export function ProjectBoard({
  slug,
  onClose,
}: {
  slug: string;
  onClose?: () => void;
}) {
  const {
    ready,
    role,
    boards,
    shortlist,
    roleLayout,
    addPin,
    removePin,
    clearPins,
    updatePin,
    updateRoleLayout,
    getProject,
    castingsForProject,
  } = useWorkspace();
  const projectSlug = decodeSlug(slug);
  const project = getProject(projectSlug);
  const castings = castingsForProject(projectSlug);
  const pins = useMemo(
    () => boards.filter((p) => p.projectSlug === projectSlug),
    [boards, projectSlug],
  );
  const savedRoles = useMemo(
    () => roleLayout.filter((r) => r.projectSlug === projectSlug),
    [roleLayout, projectSlug],
  );

  const [tool, setTool] = useState<Tool>("select");
  const [camera, setCamera] = useState<Camera>({ x: 48, y: 72, z: 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [query, setQuery] = useState("");
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef(camera);
  const panDragRef = useRef<{ pointerId: number; x: number; y: number; camX: number; camY: number } | null>(null);
  const spaceRef = useRef(false);
  cameraRef.current = camera;
  const panning = tool === "pan" || spaceDown;

  const roleCards = useMemo(
    () =>
      castings.map((c, i) => {
        const pos = slot(i);
        const saved = savedRoles.find((r) => r.castingSlug === c.slug);
        const id = `role:${c.slug}`;
        const live = drag?.id === id ? drag : null;
        return {
          id,
          slug: c.slug,
          title: c.roleLabel || c.title,
          text: c.text,
          photo: c.media,
          x: live?.x ?? saved?.x ?? pos.x,
          y: live?.y ?? saved?.y ?? pos.y,
        };
      }),
    [castings, savedRoles, drag],
  );

  const actorCards = useMemo(
    () =>
      pins.map((pin, i) => {
        const pos = slot(roleCards.length + i);
        const live = drag?.id === pin.id ? drag : null;
        return {
          pin,
          x: live?.x ?? pin.x ?? pos.x,
          y: live?.y ?? pin.y ?? pos.y,
        };
      }),
    [pins, roleCards.length, drag],
  );

  const onBoard = new Set(pins.map((p) => p.actorSlug));
  const available = shortlist.filter((p) => {
    if (onBoard.has(p.slug)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.meta || "").toLowerCase().includes(q);
  });

  const faces = pins.slice(0, 4);

  function viewportCenter() {
    const el = stageRef.current;
    const cam = cameraRef.current;
    if (!el) return slot(roleCards.length + pins.length);
    return {
      x: (el.clientWidth / 2 - cam.x) / cam.z - CARD_W / 2,
      y: (el.clientHeight / 2 - cam.y) / cam.z - CARD_H / 2,
    };
  }

  function addFromShortlist(person: (typeof shortlist)[number]) {
    const pos = viewportCenter();
    addPin({
      projectSlug,
      actorSlug: person.slug,
      actorName: person.name,
      photo: person.photo,
      character: person.meta || "кандидат",
      x: pos.x,
      y: pos.y,
    });
    setPicker(false);
    setQuery("");
  }

  function applyZoom(next: number, origin?: { x: number; y: number }) {
    const el = stageRef.current;
    const cam = cameraRef.current;
    const z = clampZoom(next);
    if (z === cam.z) return;
    const ox = origin?.x ?? (el ? el.clientWidth / 2 : 0);
    const oy = origin?.y ?? (el ? el.clientHeight / 2 : 0);
    setCamera({
      x: ox - ((ox - cam.x) / cam.z) * z,
      y: oy - ((oy - cam.y) / cam.z) * z,
      z,
    });
  }

  function fitZoom() {
    const el = stageRef.current;
    if (!el) return;
    const boxes = [
      ...roleCards.map((c) => ({ x: c.x, y: c.y })),
      ...actorCards.map((c) => ({ x: c.x, y: c.y })),
    ];
    if (!boxes.length) {
      setCamera({ x: 48, y: 72, z: 1 });
      return;
    }
    const minX = Math.min(...boxes.map((b) => b.x));
    const minY = Math.min(...boxes.map((b) => b.y));
    const maxX = Math.max(...boxes.map((b) => b.x + CARD_W));
    const maxY = Math.max(...boxes.map((b) => b.y + CARD_H));
    const pad = 120;
    const z = clampZoom(
      Math.min(el.clientWidth / (maxX - minX + pad * 2), el.clientHeight / (maxY - minY + pad * 2), 1),
    );
    setCamera({
      x: el.clientWidth / 2 - ((minX + maxX) / 2) * z,
      y: el.clientHeight / 2 - ((minY + maxY) / 2) * z,
      z,
    });
  }

  function isPanEvent(e: ReactPointerEvent) {
    return tool === "pan" || spaceRef.current || e.button === 1;
  }

  function onCardPointerDown(
    e: ReactPointerEvent<HTMLElement>,
    item: { id: string; kind: "role" | "actor"; x: number; y: number },
  ) {
    if (isPanEvent(e)) return;
    e.stopPropagation();
    e.preventDefault();
    setSelected(item.id);
    setPicker(false);
    setMenu(false);
    const startX = e.clientX;
    const startY = e.clientY;
    const z = cameraRef.current.z;
    const move = (ev: PointerEvent) => {
      setDrag({
        ...item,
        x: item.x + (ev.clientX - startX) / z,
        y: item.y + (ev.clientY - startY) / z,
      });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const nx = item.x + (ev.clientX - startX) / z;
      const ny = item.y + (ev.clientY - startY) / z;
      setDrag(null);
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) <= 4) return;
      if (item.kind === "actor") updatePin(item.id, { x: nx, y: ny });
      else updateRoleLayout(projectSlug, item.id.slice(5), { x: nx, y: ny });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onStagePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest(".project-board__chrome, .project-board__picker, .project-board__menu")) {
      return;
    }
    setPicker(false);
    setMenu(false);
    if (isPanEvent(e)) {
      e.preventDefault();
      const cam = cameraRef.current;
      panDragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, camX: cam.x, camY: cam.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    if (!(e.target as HTMLElement).closest(".project-board-card")) setSelected(null);
  }

  function onStagePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const start = panDragRef.current;
    if (!start || e.pointerId !== start.pointerId) return;
    setCamera((cam) => ({
      ...cam,
      x: start.camX + (e.clientX - start.x),
      y: start.camY + (e.clientY - start.y),
    }));
  }

  function onStagePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (panDragRef.current?.pointerId === e.pointerId) panDragRef.current = null;
  }

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect();
        applyZoom(cam.z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP), {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        return;
      }
      setCamera({ ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement && !!el.closest("input, textarea, [contenteditable]");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (picker || menu) {
          setPicker(false);
          setMenu(false);
          return;
        }
        onClose?.();
        return;
      }
      if (e.code !== "Space" || e.repeat || typing(e.target)) return;
      e.preventDefault();
      spaceRef.current = true;
      setSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceRef.current = false;
      setSpaceDown(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onClose, picker, menu]);

  if (!ready) {
    return <div className="project-board"><p className="project-board__empty">Загрузка…</p></div>;
  }
  if (!project) {
    return (
      <div className="project-board">
        <p className="project-board__empty">Проект не найден.</p>
        {onClose ? (
          <button type="button" className="btn-secondary" onClick={onClose}>Закрыть</button>
        ) : (
          <Link href={withRole("/projects", role)} className="btn-secondary">К проектам</Link>
        )}
      </div>
    );
  }

  const grid = GRID * camera.z;

  return (
    <div ref={boardRef} className={`project-board${panning ? " is-pan" : ""}`}>
      <div className="project-board__chrome project-board__chrome--title">
        <p className="project-board__name">{project.title}</p>
      </div>

      <div className="project-board__chrome project-board__chrome--zoom" onPointerDown={(e) => e.stopPropagation()}>
        <div className="project-board__zoom">
          <button type="button" aria-label="Мельче" onClick={() => applyZoom(camera.z - ZOOM_STEP)}>
            <BoardIcon name="minus" size={14} />
          </button>
          <span>{Math.round(camera.z * 100)}%</span>
          <button type="button" aria-label="Крупнее" onClick={() => applyZoom(camera.z + ZOOM_STEP)}>
            <BoardIcon name="plus-sm" size={14} />
          </button>
        </div>
        <button type="button" className="project-board__field project-board__field--icon" onClick={fitZoom} aria-label="Вместить">
          <BoardIcon name="maximize" size={16} />
        </button>
        {onClose ? (
          <button type="button" className="project-board__field project-board__field--icon" onClick={onClose} aria-label="Закрыть доску">
            <span className="project-board__close">×</span>
          </button>
        ) : null}
      </div>

      <div
        className="project-board__stage"
        ref={stageRef}
        style={{
          backgroundSize: `${grid}px ${grid}px`,
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={onStagePointerUp}
        onPointerCancel={onStagePointerUp}
      >
        <div
          className="project-board__world"
          style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}
        >
            {roleCards.map((card) => (
              <article
                key={card.id}
                className={`project-board-card project-board-card--role${selected === card.id ? " is-on" : ""}`}
                style={{ left: card.x, top: card.y }}
                onPointerDown={(e) => onCardPointerDown(e, { id: card.id, kind: "role", x: card.x, y: card.y })}
              >
                <span className="project-board-card__photo">
                  {card.photo ? <img src={card.photo} alt="" /> : null}
                </span>
                <span className="project-board-card__text">
                  <strong>{card.title}</strong>
                  <em>{card.text}</em>
                </span>
              </article>
            ))}

            {actorCards.map(({ pin, x, y }) => {
              const on = selected === pin.id;
              return (
                <article
                  key={pin.id}
                  className={`project-board-card project-board-card--actor${pin.chosen ? " is-chosen" : " is-candidate"}${on ? " is-on" : ""}`}
                  style={{ left: x, top: y }}
                  onPointerDown={(e) => onCardPointerDown(e, { id: pin.id, kind: "actor", x, y })}
                >
                  {on ? (
                    <div className="project-board-card__acts" onPointerDown={(e) => e.stopPropagation()}>
                      {!pin.chosen ? (
                        <button type="button" onClick={() => updatePin(pin.id, { chosen: true })}>
                          Выбрать
                        </button>
                      ) : null}
                      <button type="button" className="is-ghost" onClick={() => removePin(pin.id)}>
                        Убрать
                      </button>
                    </div>
                  ) : null}
                  <span className="project-board-card__photo">
                    {pin.photo ? <img src={pin.photo} alt="" /> : null}
                  </span>
                  <span className="project-board-card__text">
                    <strong>{pin.actorName}</strong>
                    <em>{pin.character}</em>
                  </span>
                  <Link
                    href={withRole(`/people/${pin.actorSlug}`, role)}
                    className="project-board-card__profile"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onClose}
                  >
                    Профиль
                  </Link>
                </article>
              );
            })}
        </div>
      </div>

      <div className="project-board__chrome project-board__dock" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`project-board__tool${picker ? " is-on" : ""}`}
          aria-label="Добавить из шортлиста"
          onClick={() => {
            setPicker((v) => !v);
            setMenu(false);
          }}
        >
          <BoardIcon name="plus" size={16} />
        </button>
        <span className="project-board__rule" />
        <button
          type="button"
          className={`project-board__tool${tool === "select" ? " is-on" : ""}`}
          aria-label="Выбор"
          onClick={() => {
            setTool("select");
            setPicker(false);
            setMenu(false);
          }}
        >
          <BoardIcon name="cursor" size={16} />
        </button>
        <button
          type="button"
          className={`project-board__tool${tool === "pan" ? " is-on" : ""}`}
          aria-label="Перемещение"
          onClick={() => {
            setTool("pan");
            setPicker(false);
            setMenu(false);
          }}
        >
          <BoardIcon name="hand" size={16} />
        </button>
        <span className="project-board__rule" />
        <button
          type="button"
          className={`project-board__tool${menu ? " is-on" : ""}`}
          aria-label="Ещё"
          onClick={() => {
            setMenu((v) => !v);
            setPicker(false);
          }}
        >
          <BoardIcon name="dots" size={16} />
        </button>

        {picker ? (
          <div className="project-board__picker">
            <div className="project-board__picker-head">
              <strong>Шортлист</strong>
              <span>Актёры, которых вы отобрали сами</span>
            </div>
            <input
              type="search"
              placeholder="Имя"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="project-board__pool">
              {available.map((person) => (
                <button type="button" key={person.slug} className="project-board__pick" onClick={() => addFromShortlist(person)}>
                  <img src={person.photo} alt="" />
                  <span>
                    <b>{person.name}</b>
                    {person.meta ? <i>{person.meta}</i> : null}
                  </span>
                </button>
              ))}
              {!available.length ? (
                <p className="project-board__empty">
                  {query ? "Никого не нашлось." : "Все из шортлиста уже на доске."}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {menu ? (
          <div className="project-board__menu">
            <Link href={withRole(`/projects/${project.slug}`, role)} onClick={onClose}>Страница проекта</Link>
            {faces.length ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmClear(true);
                  setMenu(false);
                }}
              >
                Убрать всех актёров
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {confirmClear ? (
        <ConfirmDialog
          title="Убрать всех актёров с доски?"
          confirmLabel="Убрать всех"
          danger
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            void clearPins(projectSlug);
            setConfirmClear(false);
          }}
        >
          С доски исчезнут {pins.length} карточек. Шорт-лист и отклики не изменятся.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

export function ProjectBoardModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="project-board-overlay" role="dialog" aria-modal="true" aria-label="Доска проекта">
      <button type="button" className="project-board-overlay__scrim" aria-label="Закрыть доску" onClick={onClose} />
      <div className="project-board-overlay__frame">
        <ProjectBoard slug={slug} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}

export function ProjectBoardLink({
  slug,
  title = "Доска проекта",
  lead = "Подбор актеров из шортлиста",
}: {
  slug: string;
  title?: string;
  lead?: string;
}) {
  const { boards, role } = useWorkspace();
  const [open, setOpen] = useState(false);
  const pins = boards.filter((p) => p.projectSlug === slug).slice(0, 4);
  if (role !== "casting") return null;
  return (
    <>
      <button type="button" className="project-board-entry" onClick={() => setOpen(true)}>
        <span className="project-board-entry__text">
          <strong>{title}</strong>
          <em>{lead}</em>
        </span>
        {pins.length ? (
          <span className="project-board-entry__faces">
            {pins.map((p) => (
              <span key={p.id} className="project-board-entry__face">
                <img src={p.photo} alt="" />
              </span>
            ))}
          </span>
        ) : null}
      </button>
      {open ? <ProjectBoardModal slug={slug} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function ProjectBoardRoute({ slug }: { slug: string }) {
  const router = useRouter();
  const { ready, role } = useWorkspace();
  const href = withRole(`/projects/${decodeSlug(slug)}`, role);
  useEffect(() => {
    if (ready && role !== "casting") router.replace(href);
  }, [ready, role, href, router]);
  if (!ready || role !== "casting") return null;
  return <ProjectBoardModal slug={slug} onClose={() => router.push(href)} />;
}
