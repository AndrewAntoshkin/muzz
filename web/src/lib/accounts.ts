import { and, asc, desc, eq, inArray, lte, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "@/db";
import { parseAccess, type AccessId } from "@/lib/access";
import { displayName, initialsOf, newId, professionForRole, roleLabel, translitLogin } from "@/lib/identity";
import { DEMO_LOGIN, DEMO_PASSWORD, hashPassword, toSessionUser, type SessionUser } from "@/lib/auth";
import type { ApiMessage, ApiPeer, ApiThread } from "@/lib/chat-types";
import { getOwnedFile, toStoredFile } from "@/lib/files";
import { PENDING_PROFILE_HINT } from "@/lib/people-flags";
import type { RoleId } from "@/lib/roles";

export type { ApiMessage, ApiPeer, ApiThread };

const { users, people, chatThreads, chatThreadMembers, chatMessages, files } = schema;

async function userByLogin(login: string) {
  const rows = await db.select().from(users).where(eq(users.login, login)).limit(1);
  return rows[0] ?? null;
}

async function userById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur; i++) {
    if (typeof cur === "object" && (cur as { code?: string }).code === "23505") return true;
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}

function loginCandidate(base: string, attempt: number) {
  if (attempt === 0) return base;
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `${base.slice(0, 40)}${attempt < 3 ? attempt + 1 : suffix}`;
}

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  role: RoleId;
  password: string;
}) {
  const firstName = input.firstName.trim().replace(/\s+/g, " ");
  const lastName = input.lastName.trim().replace(/\s+/g, " ");
  if (!firstName || !lastName) throw new Error("Укажите имя и фамилию");
  if (firstName.length > 60 || lastName.length > 60) throw new Error("Слишком длинное имя");
  if (!["actor", "casting", "agent"].includes(input.role)) throw new Error("Некорректная роль");

  const baseLogin = translitLogin(firstName, lastName);
  const name = displayName(firstName, lastName);
  const id = newId("usr");
  const passwordHash = await hashPassword(input.password);

  // Логин и slug занимаем вставкой, а не проверкой: параллельные регистрации
  // однофамильцев не падают, а просто берут следующий вариант.
  for (let attempt = 0; attempt < 8; attempt++) {
    const login = loginCandidate(baseLogin, attempt);
    const personSlug = login.replace(/\./g, "-");
    try {
      await db.transaction(async (tx) => {
        await tx.insert(people).values({
          slug: personSlug,
          name,
          role: roleLabel(input.role),
          profession: professionForRole(input.role),
          city: "Москва",
          bio: null,
          imageUrl: null,
          verified: false,
          hint: PENDING_PROFILE_HINT,
          initials: initialsOf(name),
          card: null,
        });
        await tx.insert(users).values({
          id,
          login,
          firstName,
          lastName,
          role: input.role,
          access: "user",
          passwordHash,
          isDemo: false,
          personSlug,
        });
      });
      return {
        user: toSessionUser({
          id,
          login,
          firstName,
          lastName,
          role: input.role,
          access: "user",
          isDemo: false,
          personSlug,
        }),
        login,
        password: input.password,
      };
    } catch (err) {
      if (isUniqueViolation(err)) continue;
      throw err;
    }
  }
  throw new Error("Не удалось создать логин, попробуйте ещё раз");
}

export async function findUserByLogin(login: string) {
  return userByLogin(login.trim().toLowerCase());
}

export async function findUserById(id: string) {
  return userById(id);
}

export type AdminUserRow = {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  role: RoleId;
  access: AccessId;
  isDemo: boolean;
  personSlug: string | null;
  createdAt: Date;
};

export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      login: users.login,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      access: users.access,
      isDemo: users.isDemo,
      personSlug: users.personSlug,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(1000);
  return rows.map((row) => ({
    ...row,
    access: parseAccess(row.access),
  }));
}

export async function updateUserAsAdmin(
  id: string,
  patch: { access?: AccessId; role?: RoleId },
) {
  const existing = await userById(id);
  if (!existing) return null;
  await db
    .update(users)
    .set({
      ...(patch.access ? { access: patch.access } : {}),
      ...(patch.role ? { role: patch.role } : {}),
    })
    .where(eq(users.id, id));
  return userById(id);
}

export async function ensureDemoUser() {
  const existing = await userByLogin(DEMO_LOGIN);
  if (existing) return existing;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const id = newId("usr");
  await db.insert(users).values({
    id,
    login: DEMO_LOGIN,
    firstName: "Андрей",
    lastName: "Антошкин",
    role: "actor",
    access: "admin",
    passwordHash,
    isDemo: true,
    personSlug: "vzmetnev",
  });
  return userByLogin(DEMO_LOGIN);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/** Сколько последних сообщений и диалогов отдаём за раз: история не растёт бесконечно. */
const THREAD_LIMIT = 100;
const MESSAGES_PER_THREAD = 100;

/**
 * Список диалогов одним набором запросов (вместо N+1 на каждый диалог):
 * диалоги → собеседники → последние сообщения → файлы.
 */
export async function listThreadsForUser(me: SessionUser): Promise<ApiThread[]> {
  const threads = await db
    .select({ id: chatThreads.id, updatedAt: chatThreads.updatedAt, lastReadAt: chatThreadMembers.lastReadAt })
    .from(chatThreadMembers)
    .innerJoin(chatThreads, eq(chatThreads.id, chatThreadMembers.threadId))
    .where(eq(chatThreadMembers.userId, me.id))
    .orderBy(desc(chatThreads.updatedAt))
    .limit(THREAD_LIMIT);
  if (!threads.length) return [];
  const threadIds = threads.map((t) => t.id);

  const ranked = db
    .select({
      id: chatMessages.id,
      threadId: chatMessages.threadId,
      senderId: chatMessages.senderId,
      text: chatMessages.text,
      fileId: chatMessages.fileId,
      createdAt: chatMessages.createdAt,
      rn: sql<number>`row_number() over (partition by ${chatMessages.threadId} order by ${chatMessages.createdAt} desc)`.as("rn"),
    })
    .from(chatMessages)
    .where(inArray(chatMessages.threadId, threadIds))
    .as("ranked");

  const [peerRows, msgRows] = await Promise.all([
    db
      .select({
        threadId: chatThreadMembers.threadId,
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        personSlug: users.personSlug,
        avatar: people.imageUrl,
        initials: people.initials,
        bg: people.bg,
      })
      .from(chatThreadMembers)
      .innerJoin(users, eq(users.id, chatThreadMembers.userId))
      .leftJoin(people, eq(people.slug, users.personSlug))
      .where(and(inArray(chatThreadMembers.threadId, threadIds), ne(chatThreadMembers.userId, me.id))),
    db
      .select()
      .from(ranked)
      .where(lte(ranked.rn, MESSAGES_PER_THREAD))
      .orderBy(asc(ranked.createdAt)),
  ]);

  const fileIds = Array.from(new Set(msgRows.map((m) => m.fileId).filter((id): id is string => Boolean(id))));
  const fileRows = fileIds.length ? await db.select().from(files).where(inArray(files.id, fileIds)) : [];
  const fileMap = new Map(fileRows.map((row) => [row.id, row]));

  const peerByThread = new Map<string, ApiPeer>();
  for (const row of peerRows) {
    if (peerByThread.has(row.threadId)) continue;
    const name = `${row.firstName} ${row.lastName}`.trim();
    peerByThread.set(row.threadId, {
      userId: row.userId,
      name,
      roleLabel: roleLabel(row.role),
      role: row.role,
      avatar: row.avatar ?? null,
      initials: row.initials || initialsOf(name),
      bg: row.bg ?? null,
      profileHref: row.personSlug ? `/people/${row.personSlug}` : null,
    });
  }

  const msgsByThread = new Map<string, typeof msgRows>();
  for (const m of msgRows) {
    const list = msgsByThread.get(m.threadId);
    if (list) list.push(m);
    else msgsByThread.set(m.threadId, [m]);
  }

  const out: ApiThread[] = [];
  for (const thread of threads) {
    const peer = peerByThread.get(thread.id);
    if (!peer) continue;
    const msgs = msgsByThread.get(thread.id) ?? [];
    const lastRead = thread.lastReadAt?.getTime() ?? 0;
    out.push({
      id: thread.id,
      peer,
      unread: msgs.some((m) => m.senderId !== me.id && m.createdAt.getTime() > lastRead),
      updatedAt: thread.updatedAt.getTime(),
      messages: msgs.map((m) => {
        const attached = m.fileId ? fileMap.get(m.fileId) : null;
        return {
          id: m.id,
          senderId: m.senderId,
          text: m.text,
          createdAt: m.createdAt.getTime(),
          time: formatTime(m.createdAt),
          mine: m.senderId === me.id,
          file: attached && attached.status === "ready" ? toStoredFile(attached) : null,
        };
      }),
    });
  }
  return out;
}

/** Самое свежее обновление среди диалогов пользователя: дешёвая проверка «есть ли новое». */
export async function latestThreadUpdate(userId: string): Promise<number> {
  const [row] = await db
    .select({ latest: sql<Date | null>`max(${chatThreads.updatedAt})` })
    .from(chatThreadMembers)
    .innerJoin(chatThreads, eq(chatThreads.id, chatThreadMembers.threadId))
    .where(eq(chatThreadMembers.userId, userId));
  return row?.latest ? new Date(row.latest).getTime() : 0;
}

/** У профиля нет аккаунта — написать некому. Клиент показывает приглашение в «Кадр» вместо тупика. */
export class NoAccountError extends Error {
  constructor() {
    super("У этого профиля пока нет аккаунта в «Кадре»");
    this.name = "NoAccountError";
  }
}

export async function openThreadWithPerson(me: SessionUser, personSlug: string) {
  const peers = await db.select().from(users).where(eq(users.personSlug, personSlug)).limit(1);
  const peerUser = peers[0];
  if (!peerUser) throw new NoAccountError();
  if (peerUser.id === me.id) throw new Error("Нельзя писать себе");

  const pairKey = [me.id, peerUser.id].sort().join(":");
  return db.transaction(async (tx) => {
    // Один диалог на пару людей, даже если оба нажали «написать» одновременно.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${pairKey}))`);
    const theirs = alias(chatThreadMembers, "theirs");
    const [existing] = await tx
      .select({ threadId: chatThreadMembers.threadId })
      .from(chatThreadMembers)
      .innerJoin(theirs, eq(theirs.threadId, chatThreadMembers.threadId))
      .where(and(eq(chatThreadMembers.userId, me.id), eq(theirs.userId, peerUser.id)))
      .limit(1);
    if (existing) return existing.threadId;

    const threadId = newId("thr");
    await tx.insert(chatThreads).values({ id: threadId });
    await tx.insert(chatThreadMembers).values([
      { threadId, userId: me.id, lastReadAt: new Date() },
      { threadId, userId: peerUser.id, lastReadAt: null },
    ]);
    return threadId;
  });
}

export async function openFileOutbox(me: SessionUser) {
  // «Исходящие файлы» — диалог из одного участника (самого пользователя).
  const solo = await db.execute(sql`
    select m.thread_id
    from chat_thread_members m
    where m.user_id = ${me.id}
      and (select count(*) from chat_thread_members x where x.thread_id = m.thread_id) = 1
    limit 1
  `);
  const existing = (solo as unknown as { thread_id: string }[])[0];
  if (existing) return existing.thread_id;
  const threadId = newId("thr");
  await db.insert(chatThreads).values({ id: threadId });
  await db.insert(chatThreadMembers).values({ threadId, userId: me.id, lastReadAt: new Date() });
  return threadId;
}

export async function sendChatFile(me: SessionUser, personSlug: string, text: string, fileId: string) {
  // Файл без адресата — в личное «Избранное»; но если адресат указан и аккаунта нет, молча прятать файл нельзя.
  const threadId = personSlug ? await openThreadWithPerson(me, personSlug) : await openFileOutbox(me);
  const message = await sendChatMessage(me, threadId, text, fileId);
  return { threadId, message };
}

export async function sendChatMessage(me: SessionUser, threadId: string, text: string, fileId?: string) {
  const body = text.trim();
  if (body.length > 4000) throw new Error("Сообщение слишком длинное");
  let file = null as ReturnType<typeof toStoredFile> | null;
  if (fileId) {
    const row = await getOwnedFile(fileId, me.id);
    if (!row || row.status !== "ready") throw new Error("Файл ещё не загружен");
    file = toStoredFile(row);
  }
  if (!body && !file) throw new Error("Пустое сообщение");
  const members = await db
    .select()
    .from(chatThreadMembers)
    .where(and(eq(chatThreadMembers.threadId, threadId), eq(chatThreadMembers.userId, me.id)))
    .limit(1);
  if (!members[0]) throw new Error("Чат не найден");

  const id = newId("msg");
  const createdAt = new Date();
  await db.insert(chatMessages).values({
    id,
    threadId,
    senderId: me.id,
    text: body,
    fileId: file?.id ?? null,
    createdAt,
  });
  await db.update(chatThreads).set({ updatedAt: createdAt }).where(eq(chatThreads.id, threadId));
  await db
    .update(chatThreadMembers)
    .set({ lastReadAt: createdAt })
    .where(and(eq(chatThreadMembers.threadId, threadId), eq(chatThreadMembers.userId, me.id)));

  return {
    id,
    senderId: me.id,
    text: body,
    createdAt: createdAt.getTime(),
    time: formatTime(createdAt),
    mine: true,
    file,
  } satisfies ApiMessage;
}

export async function markThreadRead(me: SessionUser, threadId: string) {
  await db
    .update(chatThreadMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(chatThreadMembers.threadId, threadId), eq(chatThreadMembers.userId, me.id)));
}

export async function findUserByPersonSlug(personSlug: string) {
  const rows = await db.select().from(users).where(eq(users.personSlug, personSlug)).limit(1);
  return rows[0] ?? null;
}
