import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { displayName, initialsOf, newId, professionForRole, roleLabel, translitLogin } from "@/lib/identity";
import { DEMO_LOGIN, DEMO_PASSWORD, hashPassword, toSessionUser, type SessionUser } from "@/lib/auth";
import type { ApiMessage, ApiPeer, ApiThread } from "@/lib/chat-types";
import type { RoleId } from "@/lib/roles";

export type { ApiMessage, ApiPeer, ApiThread };

const { users, people, chatThreads, chatThreadMembers, chatMessages } = schema;

async function userByLogin(login: string) {
  const rows = await db.select().from(users).where(eq(users.login, login)).limit(1);
  return rows[0] ?? null;
}

async function userById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

async function personBySlug(slug: string) {
  const rows = await db.select().from(people).where(eq(people.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function ensureUniqueLogin(base: string) {
  let login = base;
  for (let i = 0; i < 20; i++) {
    const hit = await userByLogin(login);
    if (!hit) return login;
    login = `${base}${i + 2}`;
  }
  return `${base}_${Date.now().toString(36)}`;
}

export async function ensureUniquePersonSlug(base: string) {
  let slug = base;
  for (let i = 0; i < 20; i++) {
    const hit = await personBySlug(slug);
    if (!hit) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  role: RoleId;
  password: string;
}) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) throw new Error("Укажите имя и фамилию");
  if (!["actor", "casting", "agent"].includes(input.role)) throw new Error("Некорректная роль");

  const login = await ensureUniqueLogin(translitLogin(firstName, lastName));
  const slugBase = login.replace(/\./g, "-");
  const personSlug = await ensureUniquePersonSlug(slugBase);
  const name = displayName(firstName, lastName);
  const id = newId("usr");
  const passwordHash = await hashPassword(input.password);

  await db.insert(people).values({
    slug: personSlug,
    name,
    role: roleLabel(input.role),
    profession: professionForRole(input.role),
    city: "Москва",
    bio: null,
    imageUrl: null,
    verified: false,
    hint: "Профиль с регистрации",
    initials: initialsOf(name),
    card: null,
  });

  await db.insert(users).values({
    id,
    login,
    firstName,
    lastName,
    role: input.role,
    passwordHash,
    isDemo: false,
    personSlug,
  });

  return {
    user: toSessionUser({
      id,
      login,
      firstName,
      lastName,
      role: input.role,
      isDemo: false,
      personSlug,
    }),
    login,
    password: input.password,
  };
}

export async function findUserByLogin(login: string) {
  return userByLogin(login.trim().toLowerCase());
}

export async function ensureDemoUser() {
  const existing = await userByLogin(DEMO_LOGIN);
  if (existing) return existing;
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const id = newId("usr");
  await db.insert(users).values({
    id,
    login: DEMO_LOGIN,
    firstName: "Демо",
    lastName: "Кадр",
    role: "actor",
    passwordHash,
    isDemo: true,
    personSlug: "vzmetnev",
  });
  return userByLogin(DEMO_LOGIN);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

async function peerForUser(userId: string): Promise<ApiPeer | null> {
  const row = await userById(userId);
  if (!row) return null;
  let avatar: string | null = null;
  let initials: string | null = initialsOf(`${row.firstName} ${row.lastName}`);
  let bg: string | null = null;
  if (row.personSlug) {
    const person = await personBySlug(row.personSlug);
    if (person) {
      avatar = person.imageUrl;
      initials = person.initials || initials;
      bg = person.bg;
    }
  }
  return {
    userId: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
    roleLabel: roleLabel(row.role),
    role: row.role,
    avatar,
    initials,
    bg,
    profileHref: row.personSlug ? `/people/${row.personSlug}` : null,
  };
}

export async function listThreadsForUser(me: SessionUser): Promise<ApiThread[]> {
  const memberships = await db
    .select()
    .from(chatThreadMembers)
    .where(eq(chatThreadMembers.userId, me.id));
  if (!memberships.length) return [];

  const threadIds = memberships.map((m) => m.threadId);
  const threads = await db
    .select()
    .from(chatThreads)
    .where(inArray(chatThreads.id, threadIds))
    .orderBy(desc(chatThreads.updatedAt));

  const out: ApiThread[] = [];
  for (const thread of threads) {
    const members = await db
      .select()
      .from(chatThreadMembers)
      .where(eq(chatThreadMembers.threadId, thread.id));
    const other = members.find((m) => m.userId !== me.id);
    if (!other) continue;
    const peer = await peerForUser(other.userId);
    if (!peer) continue;
    const mine = members.find((m) => m.userId === me.id);
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.threadId, thread.id))
      .orderBy(chatMessages.createdAt);
    const lastRead = mine?.lastReadAt?.getTime() ?? 0;
    const unread = msgs.some((m) => m.senderId !== me.id && m.createdAt.getTime() > lastRead);
    out.push({
      id: thread.id,
      peer,
      unread,
      updatedAt: thread.updatedAt.getTime(),
      messages: msgs.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        createdAt: m.createdAt.getTime(),
        time: formatTime(m.createdAt),
        mine: m.senderId === me.id,
      })),
    });
  }
  return out;
}

export async function openThreadWithPerson(me: SessionUser, personSlug: string) {
  const peers = await db.select().from(users).where(eq(users.personSlug, personSlug)).limit(1);
  const peerUser = peers[0];
  if (!peerUser) {
    throw new Error(
      "У этого профиля ещё нет аккаунта — написать можно только зарегистрированному пользователю",
    );
  }
  if (peerUser.id === me.id) throw new Error("Нельзя писать себе");

  const mine = await db
    .select({ threadId: chatThreadMembers.threadId })
    .from(chatThreadMembers)
    .where(eq(chatThreadMembers.userId, me.id));
  for (const row of mine) {
    const others = await db
      .select()
      .from(chatThreadMembers)
      .where(and(eq(chatThreadMembers.threadId, row.threadId), eq(chatThreadMembers.userId, peerUser.id)))
      .limit(1);
    if (others[0]) return row.threadId;
  }

  const threadId = newId("thr");
  await db.insert(chatThreads).values({ id: threadId });
  await db.insert(chatThreadMembers).values([
    { threadId, userId: me.id, lastReadAt: new Date() },
    { threadId, userId: peerUser.id, lastReadAt: null },
  ]);
  return threadId;
}

export async function sendChatMessage(me: SessionUser, threadId: string, text: string) {
  const body = text.trim();
  if (!body) throw new Error("Пустое сообщение");
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
