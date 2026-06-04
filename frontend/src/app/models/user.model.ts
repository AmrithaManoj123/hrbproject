export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: User;
}
