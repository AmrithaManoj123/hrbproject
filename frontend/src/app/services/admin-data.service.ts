import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type CategoryOption = { id: number; name: string; defaultTeamId: number; defaultTeamName?: string };
export type TeamOption = { id: number; name: string; description?: string; memberCount: number };
export type UserOption = { id: string; fullName: string; email: string; role: string };

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  constructor(private readonly http: HttpClient) {}

  categories() {
    return this.http.get<CategoryOption[]>(`${environment.apiUrl}/categories`);
  }

  teams() {
    return this.http.get<TeamOption[]>(`${environment.apiUrl}/teams`);
  }

  agents() {
    return this.http.get<UserOption[]>(`${environment.apiUrl}/users`, { params: { role: 'agent' } });
  }

  createTeam(name: string, description: string) {
    return this.http.post<TeamOption>(`${environment.apiUrl}/teams`, { name, description });
  }

  updateTeam(id: number, name: string, description: string) {
    return this.http.put<TeamOption>(`${environment.apiUrl}/teams/${id}`, { name, description });
  }

  deleteTeam(id: number) {
    return this.http.delete(`${environment.apiUrl}/teams/${id}`);
  }

  createCategory(name: string, defaultTeamId: number) {
    return this.http.post<CategoryOption>(`${environment.apiUrl}/categories`, { name, defaultTeamId });
  }

  updateCategory(id: number, name: string, defaultTeamId: number) {
    return this.http.put<CategoryOption>(`${environment.apiUrl}/categories/${id}`, { name, defaultTeamId });
  }

  deleteCategory(id: number) {
    return this.http.delete(`${environment.apiUrl}/categories/${id}`);
  }
}
