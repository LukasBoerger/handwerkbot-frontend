export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
}

export interface AuthResponse {
  token: string;
  tenantId: number;
  user: AuthUser;
}
