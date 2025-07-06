export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  google_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSession {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  avatar_url?: string;
  google_id: string;
}

export interface UserUpdateInput {
  name?: string;
  avatar_url?: string;
}