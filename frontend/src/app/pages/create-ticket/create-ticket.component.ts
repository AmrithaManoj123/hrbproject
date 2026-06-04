import { Component } from '@angular/core';
import { forkJoin, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="ticket-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <aside class="sidebar" aria-label="Customer navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div>
            <strong>AI Support Triage</strong>
            <span>Platform</span>
          </div>
        </div>

        <nav class="side-nav">
          <a routerLink="/customer/tickets">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
            Dashboard
          </a>
          <a routerLink="/customer/dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h5"/><path d="M7 17h2"/><path d="M15 17h2"/></svg>
            My Tickets
          </a>
          <a class="active" routerLink="/customer/tickets/new">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 4h16v16H4z"/></svg>
            New Ticket
          </a>
        </nav>

        <button class="logout" type="button" (click)="auth.logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="ticket-main">
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()"><span></span><span></span><span></span></button>
          <h1>Create New Ticket</h1>
          <div class="user-tools">
            <button class="notification" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span>3</span>
            </button>
            <div class="profile">
              <div class="avatar">{{ initials }}</div>
              <div>
                <strong>{{ displayName }}</strong>
                <span>Customer</span>
              </div>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        <div class="content">
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a routerLink="/customer/dashboard">Dashboard</a>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            <span>New Ticket</span>
          </nav>

          <form class="ticket-card" (ngSubmit)="submit()">
            <header class="card-header">
              <div class="card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 4h16v16H4z"/></svg>
              </div>
              <div>
                <h2>Ticket Details</h2>
                <p>Please provide the details below. Our AI will automatically classify and prioritize your ticket.</p>
              </div>
            </header>

            <div class="form-body">
              <label class="field">
                <span>Title <strong>*</strong></span>
                <input name="title" maxlength="200" [(ngModel)]="title" placeholder="Brief summary of your issue" required>
                <em>{{ title.length }} / 200</em>
              </label>

              <label class="field">
                <span>Description <strong>*</strong></span>
                <textarea name="description" minlength="10" maxlength="5000" rows="8" [(ngModel)]="description" placeholder="Please describe your issue in detail..." required></textarea>
                <small>Provide as much information as possible so we can help you better.</small>
                <em>{{ description.length }} / 5000</em>
              </label>

              <section class="attachments" aria-label="Attachments">
                <h3>Attachments <span>(Optional)</span></h3>
                <label
                  class="drop-zone"
                  [class.dragging]="isDraggingFiles"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)">
                  <input #fileInput type="file" multiple (change)="onFilesSelected($event)">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.4 11.6-9.8 9.8a5 5 0 0 1-7.1-7.1l10.1-10.1a3.4 3.4 0 0 1 4.8 4.8L9.7 18.7a1.8 1.8 0 1 1-2.5-2.5l9-9"/></svg>
                  <span><strong>Choose Files</strong> or drag and drop</span>
                  <small>You can upload screenshots or documents (Max 3 files, 5MB each)</small>
                  <button type="button" (click)="fileInput.click()">Choose Files</button>
                </label>
                <p class="allowed">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></svg>
                  Allowed file types: JPG, PNG, PDF, DOC, DOCX, TXT
                </p>
                @if (files.length) {
                  <ul class="file-list">
                    @for (file of files; track file.name) {
                      <li>{{ file.name }} <span>{{ formatFileSize(file.size) }}</span></li>
                    }
                  </ul>
                }
              </section>

              @if (error) { <p class="error-message">{{ error }}</p> }
            </div>

            <footer class="form-actions">
              <a class="cancel-button" routerLink="/customer/dashboard">Cancel</a>
              <button class="submit-button" type="submit">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                Submit Ticket
              </button>
            </footer>
          </form>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #071747; background: #f6f9fd; }
    .ticket-shell { min-height: 100vh; display: grid; grid-template-columns: 276px minmax(0, 1fr); background: #f6f9fd; transition: grid-template-columns 220ms ease; }
    .ticket-shell.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 34px 20px 28px; color: #fff; background: linear-gradient(180deg, #004b91 0%, #00366c 48%, #012f61 100%); overflow: hidden; transition: transform 220ms ease, opacity 180ms ease; }
    .ticket-shell.sidebar-collapsed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .sidebar-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 46px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.25; }
    .sidebar-brand strong { font-size: 19px; font-weight: 800; }
    .sidebar-brand span { margin-top: 6px; color: rgba(255,255,255,.86); font-size: 20px; }
    .bot-mark { position: relative; width: 58px; height: 58px; flex: 0 0 auto; border: 4px solid #fff; border-bottom-color: transparent; border-radius: 50%; }
    .bot-mark span { position: absolute; left: 10px; top: 18px; width: 32px; height: 24px; border-radius: 12px; background: #fff; }
    .bot-mark i { position: absolute; top: 27px; width: 6px; height: 6px; border-radius: 50%; background: #0055b8; z-index: 1; }
    .bot-mark i:first-of-type { left: 20px; }
    .bot-mark i:last-of-type { right: 20px; }
    .side-nav { display: grid; gap: 16px; }
    .side-nav a, .logout { min-height: 60px; display: flex; align-items: center; gap: 18px; padding: 0 16px; border: 0; border-radius: 8px; color: #fff; font-size: 20px; font-weight: 700; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { background: linear-gradient(135deg, #0876dc, #0056b8); box-shadow: 0 14px 22px rgba(0, 29, 74, .18); }
    .logout { margin-top: auto; border-top: 1px solid rgba(255,255,255,.14); border-radius: 0; padding-top: 30px; justify-content: flex-start; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg, .topbar svg { width: 25px; height: 25px; }
    .ticket-main { min-width: 0; }
    .topbar { height: 96px; display: flex; align-items: center; gap: 34px; padding: 0 34px 0 38px; border-bottom: 1px solid #dce3ee; background: #fff; }
    .menu-button { width: 40px; height: 40px; display: grid; align-content: center; gap: 6px; padding: 0; border: 0; color: #071747; background: transparent; }
    .menu-button span { width: 26px; height: 3px; border-radius: 999px; background: currentColor; }
    .topbar h1 { margin: 0; font-size: 31px; letter-spacing: 0; }
    .user-tools { display: flex; align-items: center; gap: 28px; margin-left: auto; }
    .notification { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 0; color: #1f2a44; background: transparent; cursor: pointer; }
    .notification span { position: absolute; right: 3px; top: 2px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 999px; color: #fff; background: #f04438; font-size: 12px; font-weight: 800; }
    .profile { display: flex; align-items: center; gap: 14px; }
    .avatar { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #0755bf; font-size: 22px; font-weight: 800; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 18px; }
    .profile span { margin-top: 4px; color: #3f4b66; font-size: 15px; }
    .profile svg { width: 22px; height: 22px; }
    .content { padding: 20px 36px 30px; }
    .breadcrumbs { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; color: #5c6882; font-size: 17px; }
    .breadcrumbs a { color: #004fc4; font-weight: 700; text-decoration: none; }
    .breadcrumbs svg { width: 18px; height: 18px; }
    .ticket-card { overflow: hidden; border: 1px solid #dfe6f0; border-radius: 10px; background: #fff; box-shadow: 0 10px 24px rgba(21,45,84,.08); }
    .card-header { display: flex; align-items: center; gap: 18px; padding: 32px 28px 24px; margin: 0 26px; border-bottom: 1px solid #dfe6f0; }
    .card-icon { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 50%; color: #0755bf; background: #eaf3ff; }
    .card-icon svg { width: 30px; height: 30px; }
    .card-header h2 { margin: 0; font-size: 26px; letter-spacing: 0; }
    .card-header p { margin: 8px 0 0; color: #5c6882; font-size: 15px; }
    .form-body { display: grid; gap: 26px; padding: 30px 38px 36px; }
    .field { position: relative; display: grid; gap: 10px; color: #071747; font-size: 17px; font-weight: 800; }
    .field strong { color: #e11d48; }
    .field input, .field textarea { width: 100%; box-sizing: border-box; border: 1px solid #cfd9e8; border-radius: 8px; color: #071747; font: inherit; font-weight: 400; outline: 0; background: #fff; }
    .field input { min-height: 50px; padding: 0 18px; }
    .field textarea { min-height: 168px; padding: 16px 18px; resize: vertical; }
    .field input:focus, .field textarea:focus { border-color: #075ed1; box-shadow: 0 0 0 4px rgba(7,94,209,.1); }
    .field input::placeholder, .field textarea::placeholder { color: #67728c; }
    .field small { color: #5c6882; font-size: 15px; font-weight: 400; }
    .field em { justify-self: end; color: #5c6882; font-size: 15px; font-style: normal; font-weight: 400; }
    .attachments h3 { margin: 0 0 8px; font-size: 17px; letter-spacing: 0; }
    .attachments h3 span { color: #5c6882; font-weight: 400; }
    .drop-zone { position: relative; min-height: 86px; display: grid; grid-template-columns: 48px 1fr auto; grid-template-rows: auto auto; align-items: center; column-gap: 16px; padding: 0 20px; border: 1px dashed #c7d3e4; border-radius: 8px; color: #3a4561; background: #fff; cursor: pointer; }
    .drop-zone.dragging { border-color: #075ed1; background: #f3f8ff; box-shadow: 0 0 0 4px rgba(7,94,209,.1); }
    .drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .drop-zone svg { grid-row: 1 / 3; width: 38px; height: 38px; color: #25324f; }
    .drop-zone span { align-self: end; font-size: 17px; }
    .drop-zone span strong { color: #004fc4; }
    .drop-zone small { align-self: start; color: #5c6882; font-size: 14px; }
    .drop-zone button { position: relative; z-index: 1; grid-row: 1 / 3; min-height: 44px; padding: 0 18px; border: 1px solid #cfd9e8; border-radius: 6px; color: #004fc4; font: inherit; font-weight: 800; background: #fff; cursor: pointer; }
    .allowed { display: flex; align-items: center; gap: 10px; margin: 14px 0 0; color: #5c6882; font-size: 15px; }
    .allowed svg { width: 17px; height: 17px; }
    .file-list { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
    .file-list li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 12px; border: 1px solid #dfe6f0; border-radius: 7px; color: #071747; background: #f8fbff; }
    .file-list span { color: #5c6882; }
    .error-message { margin: 0; color: #b42318; font-weight: 800; }
    .form-actions { min-height: 94px; display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 0 28px; border-top: 1px solid #dfe6f0; background: #fff; }
    .cancel-button, .submit-button { min-height: 54px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; padding: 0 28px; border-radius: 7px; font-size: 17px; font-weight: 800; text-decoration: none; }
    .cancel-button { border: 1px solid #cfd9e8; color: #004fc4; background: #fff; }
    .submit-button { border: 0; color: #fff; background: linear-gradient(90deg, #075ed1, #0048b8); box-shadow: 0 10px 18px rgba(0,75,184,.18); cursor: pointer; }
    .submit-button svg { width: 23px; height: 23px; }
    @media (max-width: 1180px) {
      .ticket-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; padding: 18px; }
      .side-nav { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .logout { min-height: 52px; margin-top: 14px; padding-top: 14px; }
    }
    @media (max-width: 760px) {
      .topbar { height: auto; align-items: flex-start; flex-direction: column; padding: 20px; }
      .user-tools { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 18px 14px 24px; }
      .side-nav { grid-template-columns: 1fr; }
      .card-header { margin: 0 16px; padding: 24px 12px; }
      .form-body { padding: 24px 18px; }
      .drop-zone { grid-template-columns: 1fr; gap: 8px; padding: 18px; }
      .drop-zone svg, .drop-zone button { grid-row: auto; }
      .form-actions { align-items: stretch; flex-direction: column-reverse; height: auto; padding: 18px; }
      .cancel-button, .submit-button { width: 100%; box-sizing: border-box; }
    }
  `]
})
export class CreateTicketComponent {
  title = '';
  description = '';
  error = '';
  files: File[] = [];
  sidebarCollapsed = false;
  isDraggingFiles = false;

  constructor(
    private readonly tickets: TicketService,
    private readonly router: Router,
    public readonly auth: AuthService
  ) {}

  get displayName() {
    return this.auth.user()?.fullName ?? 'Customer';
  }

  get initials() {
    return this.displayName.trim().charAt(0).toUpperCase() || 'C';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.setFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFiles = false;
    this.setFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  private setFiles(selected: File[]) {
    const allowed = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'];

    if (selected.length > 3) {
      this.error = 'You can upload up to 3 files.';
      this.files = [];
      return;
    }

    const invalidFile = selected.find(file => file.size > 5 * 1024 * 1024 || !allowed.includes(file.name.split('.').pop()?.toLowerCase() ?? ''));
    if (invalidFile) {
      this.error = 'Each attachment must be JPG, PNG, PDF, DOC, DOCX, or TXT and 5MB or smaller.';
      this.files = [];
      return;
    }

    this.error = '';
    this.files = selected;
  }

  submit() {
    this.error = '';

    if (!this.title.trim() || !this.description.trim()) {
      this.error = 'Title and description are required.';
      return;
    }

    if (this.description.trim().length < 10) {
      this.error = 'Description must be at least 10 characters.';
      return;
    }

    this.tickets.create(this.title, this.description).pipe(
      switchMap(ticket => {
        if (!this.files.length) return of(ticket);
        return forkJoin(this.files.map(file => this.tickets.uploadAttachment(ticket.id, file))).pipe(
          switchMap(() => of(ticket))
        );
      })
    ).subscribe({
      next: () => this.router.navigate(['/customer/dashboard']),
      error: response => this.error = response.error?.error ?? 'Ticket creation failed'
    });
  }

  formatFileSize(size: number) {
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }
}
