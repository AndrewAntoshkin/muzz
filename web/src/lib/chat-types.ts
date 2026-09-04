import type { RoleId } from "./roles";

export type ApiPeer = {
  userId: string;
  name: string;
  roleLabel: string;
  role: RoleId;
  avatar?: string | null;
  initials?: string | null;
  bg?: string | null;
  profileHref?: string | null;
};

export type ApiMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
  time: string;
  mine: boolean;
};

export type ApiThread = {
  id: string;
  peer: ApiPeer;
  unread: boolean;
  messages: ApiMessage[];
  updatedAt: number;
};
