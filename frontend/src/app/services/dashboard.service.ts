import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  stats() {
    return this.http.get(`${environment.apiUrl}/dashboard/stats`);
  }

  agents() {
    return this.http.get(`${environment.apiUrl}/dashboard/agents`);
  }
}
