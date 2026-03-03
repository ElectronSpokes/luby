export interface AuthUser {
  type: 'human';
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  groups?: string[];
}

export interface AuthContext {
  user: AuthUser | null;
  userId: number | null;
}

export type AppEnv = {
  Variables: {
    auth: AuthContext;
  };
};
