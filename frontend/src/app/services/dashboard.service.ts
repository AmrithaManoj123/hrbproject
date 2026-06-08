import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  // Summary cards and charts share this endpoint so dashboard numbers stay consistent.
  stats() {
    return this.http.get(`${environment.apiUrl}/dashboard/stats`);
  }

  // Agent workload is separated from general stats because it feeds the admin table and agent capacity views.
  agents() {
    return this.http.get(`${environment.apiUrl}/dashboard/agents`);
  }
}
