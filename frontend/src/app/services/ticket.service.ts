import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PaginatedResponse, TicketDetail, TicketListItem } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  constructor(private readonly http: HttpClient) {}

  list(filters: Record<string, string | number | undefined> = {}) {
    let params = new HttpParams();

    // Skip empty filters so the backend receives only the query options the current page actually selected.
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, value);
    });
    return this.http.get<PaginatedResponse<TicketListItem>>(`${environment.apiUrl}/tickets`, { params });
  }

  get(id: number) {
    return this.http.get<TicketDetail>(`${environment.apiUrl}/tickets/${id}`);
  }

  create(title: string, description: string) {
    return this.http.post<TicketListItem & { id: number }>(`${environment.apiUrl}/tickets`, { title, description });
  }

  uploadAttachment(ticketId: number, file: File) {
    // Files must use multipart form data; JSON payloads cannot carry browser File objects correctly.
    const body = new FormData();
    body.append('file', file);
    return this.http.post(`${environment.apiUrl}/tickets/${ticketId}/attachments`, body);
  }

  addComment(ticketId: number, message: string, isInternal = false) {
    return this.http.post(`${environment.apiUrl}/tickets/${ticketId}/comments`, { message, isInternal });
  }

  suggestReply(ticketId: number) {
    return this.http.post<{ reply: string }>(`${environment.apiUrl}/tickets/${ticketId}/ai-reply`, {});
  }

  changeStatus(ticketId: number, status: string) {
    return this.http.put(`${environment.apiUrl}/tickets/${ticketId}/status`, { status });
  }

  changePriority(ticketId: number, priority: string) {
    return this.http.put(`${environment.apiUrl}/tickets/${ticketId}/priority`, { priority });
  }

  changeCategory(ticketId: number, categoryId: number) {
    return this.http.put(`${environment.apiUrl}/tickets/${ticketId}/category`, { categoryId });
  }

  assign(ticketId: number, agentId: string, teamId: number) {
    return this.http.put(`${environment.apiUrl}/tickets/${ticketId}/assign`, { agentId, teamId });
  }
}
