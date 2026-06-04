import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketDetail } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';

type TimelineStep = {
  label: string;
  time: string;
  note: string;
  state: 'done' | 'current' | 'pending';
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="detail-shell">
      <aside class="sidebar" aria-label="Customer navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div>
            <strong>AI Support Triage</strong>
            <span>Platform</span>
          </div>
        </div>

        <nav class="side-nav">
          <a routerLink="/customer/dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
            Dashboard
          </a>
          <a class="active" routerLink="/customer/tickets">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h5"/><path d="M7 17h2"/><path d="M15 17h2"/></svg>
            My Tickets
          </a>
          <a routerLink="/customer/tickets/new">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 4h16v16H4z"/></svg>
            New Ticket
          </a>
        </nav>

        <button class="logout" type="button" (click)="auth.logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="detail-main">
        <header class="topbar">
          <a class="back-button" routerLink="/customer/dashboard" aria-label="Back to dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </a>
          <h1>Ticket Detail</h1>
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

        @if (ticket) {
          <div class="content">
            <nav class="breadcrumbs" aria-label="Breadcrumb">
              <a routerLink="/customer/dashboard">Dashboard</a>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
              <a routerLink="/customer/tickets">My Tickets</a>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
              <span>#TKT-{{ ticket.id }}</span>
            </nav>

            <section class="ticket-hero">
              <div class="hero-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M7 7h10"/><path d="M7 12h6"/><path d="M7 17h4"/><path d="M5 3h14v18H5z"/></svg>
              </div>
              <div class="hero-copy">
                <div class="hero-title">
                  <h2>{{ ticket.title }}</h2>
                  <span class="pill" [class]="priorityClass(ticket.priority)">{{ ticket.priority ?? 'PENDING' }}</span>
                  <span class="pill" [class]="statusClass(ticket.status)">{{ prettyStatus(ticket.status) }}</span>
                </div>
                <div class="hero-meta">
                  <span>Ticket ID: <strong>#TKT-{{ ticket.id }}</strong></span>
                  <i></i>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M5 4h14v18H5z"/></svg>
                    Created on: {{ formatDateTime(ticket.createdAt) }}
                  </span>
                  <i></i>
                  <span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    Last updated: {{ relativeDate(ticket.updatedAt || ticket.createdAt) }}
                  </span>
                </div>
              </div>
            </section>

            <div class="detail-grid">
              <section class="ai-card card">
                <h3>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></svg>
                  AI Classification
                </h3>
                <dl>
                  <dt>Category</dt>
                  <dd>{{ categoryName }}</dd>
                  <dt>Confidence Score</dt>
                  <dd class="score-row"><span>{{ confidence }}%</span></dd>
                </dl>
                <div class="meter"><span [style.width.%]="confidence"></span></div>
                <p>This was automatically classified by AI</p>
              </section>

              <div class="middle-column">
                <section class="assignment-card card">
                  <h3>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 11h5"/><path d="M18.5 8.5v5"/></svg>
                    Assignment
                  </h3>
                  <div class="agent-row">
                    <div class="agent-avatar">{{ agentInitials }}</div>
                    <div>
                      <span>Assigned Agent</span>
                      <strong>{{ ticket.assignedAgent?.fullName ?? 'Unassigned' }}</strong>
                    </div>
                  </div>
                  <div class="team-row">
                    <span>Team</span>
                    <strong>{{ ticket.assignedTeam?.name ?? 'Pending Assignment' }}</strong>
                  </div>
                </section>

                <section class="sla-card card">
                  <h3>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2"/><path d="M9 2h6"/></svg>
                    SLA Information
                  </h3>
                  <div class="sla-grid">
                    <div>
                      <span>SLA Due In</span>
                      <strong>{{ slaRemaining }}</strong>
                    </div>
                    <div>
                      <span>SLA Deadline</span>
                      <strong>{{ ticket.slaDueAt ? formatDateTime(ticket.slaDueAt) : '-' }}</strong>
                    </div>
                  </div>
                </section>
              </div>

              <section class="timeline-card card">
                <h3>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
                  Ticket Status
                </h3>
                <ol class="timeline">
                  @for (step of timelineSteps; track step.label) {
                    <li [class]="step.state">
                      <div class="node">
                        @if (step.state === 'done') {
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>
                        }
                      </div>
                      <div>
                        <div class="timeline-row">
                          <strong>{{ step.label }}</strong>
                          <span>{{ step.time }}</span>
                        </div>
                        <p>{{ step.note }}</p>
                      </div>
                    </li>
                  }
                </ol>
              </section>

              <section class="details-card card">
                <nav class="tabs" aria-label="Ticket sections">
                  <button type="button" class="active">Details</button>
                  <button type="button">Comments ({{ ticket.comments.length }})</button>
                  <button type="button">History</button>
                </nav>
                <div class="description">
                  <h3>Description</h3>
                  <p>{{ ticket.description }}</p>
                </div>
                <div class="attachments">
                  <h3>Attachments</h3>
                  @for (attachment of ticket.attachments; track attachment.id) {
                    <a class="attachment-row" [href]="attachment.downloadUrl">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6v20h12V6z"/><path d="M14 2v4h4"/></svg>
                      <span>{{ attachment.fileName }} <small>({{ formatFileSize(attachment.fileSize) }})</small></span>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                    </a>
                  } @empty {
                    <p class="empty-text">No attachments uploaded.</p>
                  }
                </div>
              </section>

              <section class="comment-card card">
                <h3>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
                  Add a Comment
                </h3>
                <form (ngSubmit)="addComment()">
                  <textarea name="message" [(ngModel)]="message" placeholder="Type your message here..."></textarea>
                  <div class="comment-actions">
                    <button class="attach-button" type="button">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l8.5-8.5"/></svg>
                      Attach file
                    </button>
                    <button class="send-button" type="submit">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                      Send Comment
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #071747; background: #f6f9fd; }
    .detail-shell { min-height: 100vh; display: grid; grid-template-columns: 268px 1fr; background: #f6f9fd; }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 30px 24px 28px; color: #fff; background: linear-gradient(180deg, #003c78 0%, #002e63 50%, #012b5a 100%); }
    .sidebar-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 48px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.25; }
    .sidebar-brand strong { font-size: 18px; font-weight: 800; }
    .sidebar-brand span { margin-top: 5px; color: rgba(255,255,255,.9); font-size: 18px; }
    .bot-mark { position: relative; width: 52px; height: 52px; flex: 0 0 auto; border: 3px solid #fff; border-bottom-color: transparent; border-radius: 50%; }
    .bot-mark span { position: absolute; left: 9px; top: 16px; width: 29px; height: 22px; border-radius: 11px; background: #fff; }
    .bot-mark i { position: absolute; top: 24px; width: 5px; height: 5px; border-radius: 50%; background: #0055b8; z-index: 1; }
    .bot-mark i:first-of-type { left: 18px; }
    .bot-mark i:last-of-type { right: 18px; }
    .side-nav { display: grid; gap: 16px; }
    .side-nav a, .logout { min-height: 52px; display: flex; align-items: center; gap: 18px; padding: 0 4px; border: 0; border-radius: 8px; color: #fff; font-size: 18px; font-weight: 700; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { color: #fff; }
    .logout { margin-top: auto; border-top: 1px solid rgba(255,255,255,.16); border-radius: 0; padding-top: 30px; justify-content: flex-start; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg, .topbar svg { width: 24px; height: 24px; }
    .detail-main { min-width: 0; }
    .topbar { height: 92px; display: flex; align-items: center; gap: 22px; padding: 0 30px 0 34px; border-bottom: 1px solid #dce3ee; background: #fff; }
    .back-button { width: 34px; height: 34px; display: grid; place-items: center; color: #071747; text-decoration: none; }
    .topbar h1 { margin: 0; font-size: 30px; letter-spacing: 0; }
    .user-tools { display: flex; align-items: center; gap: 26px; margin-left: auto; }
    .notification { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 0; color: #1f2a44; background: transparent; cursor: pointer; }
    .notification span { position: absolute; right: 3px; top: 2px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 999px; color: #fff; background: #f04438; font-size: 12px; font-weight: 800; }
    .profile { display: flex; align-items: center; gap: 14px; }
    .avatar { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #0755bf; font-size: 22px; font-weight: 800; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 17px; }
    .profile span { margin-top: 4px; color: #3f4b66; font-size: 14px; }
    .profile svg { width: 22px; height: 22px; }
    .content { padding: 18px 32px 22px; }
    .breadcrumbs { display: flex; align-items: center; gap: 13px; margin-bottom: 20px; color: #5c6882; font-size: 15px; }
    .breadcrumbs a { color: #004fc4; font-weight: 700; text-decoration: none; }
    .breadcrumbs svg { width: 17px; height: 17px; }
    .ticket-hero { display: flex; align-items: center; gap: 28px; min-height: 116px; padding: 16px 28px; border: 1px solid #dfe6f0; border-radius: 10px; background: #fff; box-shadow: 0 8px 20px rgba(21,45,84,.08); }
    .hero-icon { width: 64px; height: 64px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 12px; color: #0755bf; background: #eaf3ff; }
    .hero-icon svg { width: 30px; height: 30px; }
    .hero-copy { min-width: 0; }
    .hero-title { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
    .hero-title h2 { margin: 0; font-size: 26px; letter-spacing: 0; }
    .hero-meta { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; margin-top: 24px; color: #3f4b66; font-size: 16px; }
    .hero-meta strong { color: #004fc4; }
    .hero-meta i { width: 1px; height: 18px; background: #dfe6f0; }
    .hero-meta svg { width: 18px; height: 18px; margin-right: 8px; vertical-align: -4px; }
    .pill { display: inline-flex; align-items: center; min-height: 30px; padding: 0 16px; border-radius: 7px; font-size: 14px; font-weight: 800; }
    .priority-high { color: #fff; border: 1px solid #e11d48; background: #e11d48; }
    .priority-medium { color: #df6b00; border: 1px solid #ffc27d; background: #fff7ed; }
    .priority-low { color: #008846; border: 1px solid #91dcaf; background: #eefbf3; }
    .priority-pending { color: #46546c; border: 1px solid #b9c3d2; background: #f5f7fa; }
    .status-assigned { color: #004bd0; border: 1px solid #9cc0ff; background: #f4f8ff; }
    .status-progress { color: #0089b5; border: 1px solid #99dceb; background: #effcff; }
    .status-resolved { color: #00823a; border: 1px solid #91dcaf; background: #eefbf3; }
    .status-closed { color: #46546c; border: 1px solid #b9c3d2; background: #f5f7fa; }
    .status-open { color: #9b5a00; border: 1px solid #f1c77d; background: #fff8ed; }
    .detail-grid { display: grid; grid-template-columns: minmax(300px, 1.05fr) minmax(260px, .95fr) minmax(360px, 1.25fr); gap: 16px; margin-top: 18px; }
    .card { border: 1px solid #dfe6f0; border-radius: 10px; background: #fff; box-shadow: 0 8px 20px rgba(21,45,84,.08); }
    .card h3 { display: flex; align-items: center; gap: 10px; margin: 0; font-size: 16px; letter-spacing: 0; }
    .card h3 svg { width: 20px; height: 20px; color: #005bd6; }
    .ai-card { min-height: 276px; padding: 20px 24px; }
    .ai-card dl { margin: 28px 0 0; }
    .ai-card dt { margin-top: 26px; color: #3f4b66; font-size: 15px; }
    .ai-card dd { margin: 8px 0 0; color: #004fc4; font-size: 20px; font-weight: 800; }
    .score-row { display: flex; justify-content: flex-end; color: #071747 !important; font-size: 17px !important; }
    .meter { height: 8px; margin-top: 8px; overflow: hidden; border-radius: 999px; background: #dce4ef; }
    .meter span { display: block; height: 100%; border-radius: inherit; background: #18aeb7; }
    .ai-card p { margin: 20px 0 0; color: #3f4b66; font-size: 14px; }
    .middle-column { display: grid; gap: 16px; }
    .assignment-card, .sla-card { padding: 20px; }
    .agent-row { display: flex; align-items: center; gap: 14px; margin-top: 24px; }
    .agent-avatar { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #0f766e, #0755bf); font-weight: 800; }
    .agent-row span, .team-row span, .sla-grid span { display: block; color: #3f4b66; font-size: 14px; }
    .agent-row strong, .team-row strong, .sla-grid strong { display: block; margin-top: 6px; font-size: 18px; }
    .team-row { margin-top: 16px; }
    .sla-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .sla-grid strong { font-size: 16px; }
    .sla-grid div:first-child strong { color: #e11d48; font-size: 23px; }
    .timeline-card { grid-row: span 2; padding: 20px 22px; }
    .timeline { display: grid; gap: 0; margin: 22px 0 0; padding: 0; list-style: none; }
    .timeline li { position: relative; display: grid; grid-template-columns: 28px 1fr; gap: 14px; padding-bottom: 20px; }
    .timeline li::before { content: ""; position: absolute; left: 11px; top: 24px; bottom: 0; width: 2px; background: #dce4ef; }
    .timeline li:last-child::before { display: none; }
    .node { width: 20px; height: 20px; display: grid; place-items: center; margin-top: 1px; border: 2px solid #d0dae8; border-radius: 50%; background: #fff; color: #fff; z-index: 1; }
    .done .node { border-color: #0aa36f; background: #0aa36f; }
    .current .node { border: 4px solid #005bd6; }
    .node svg { width: 13px; height: 13px; }
    .timeline-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; color: #3f4b66; font-size: 14px; }
    .timeline-row strong { color: #008558; font-size: 14px; }
    .current .timeline-row strong { color: #004fc4; }
    .pending .timeline-row strong { color: #3f4b66; }
    .timeline p { margin: 8px 0 0; color: #3f4b66; font-size: 13px; }
    .details-card { grid-column: span 2; overflow: hidden; }
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid #dfe6f0; }
    .tabs button { min-height: 48px; padding: 0 18px; border: 0; border-bottom: 3px solid transparent; color: #24304d; font: inherit; font-weight: 700; background: transparent; cursor: pointer; }
    .tabs button.active { color: #004fc4; border-bottom-color: #004fc4; }
    .description, .attachments { padding: 18px; }
    .description { border-bottom: 1px solid #e7ecf3; }
    .description h3, .attachments h3 { margin: 0 0 12px; font-size: 14px; }
    .description p { margin: 0; color: #071747; line-height: 1.7; white-space: pre-wrap; }
    .attachment-row { min-height: 46px; display: grid; grid-template-columns: 24px 1fr 24px; align-items: center; gap: 12px; margin-top: 10px; padding: 0 10px; border-radius: 7px; color: #004fc4; text-decoration: none; background: #f6f8fb; }
    .attachment-row small, .empty-text { color: #5c6882; }
    .comment-card { grid-column: 3; padding: 18px; }
    .comment-card form { display: grid; gap: 14px; margin-top: 16px; }
    .comment-card textarea { min-height: 66px; padding: 14px; border: 1px solid #cfd9e8; border-radius: 8px; color: #071747; font: inherit; resize: vertical; outline: 0; }
    .comment-actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .attach-button, .send-button { min-height: 40px; display: inline-flex; align-items: center; gap: 9px; border: 0; font: inherit; font-weight: 700; background: transparent; cursor: pointer; }
    .attach-button { color: #24304d; }
    .send-button { padding: 0 18px; border-radius: 7px; color: #fff; background: linear-gradient(90deg, #075ed1, #0048b8); box-shadow: 0 10px 18px rgba(0,75,184,.18); }
    .attach-button svg, .send-button svg { width: 19px; height: 19px; }
    @media (max-width: 1180px) {
      .detail-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .side-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); display: grid; }
      .logout { min-height: 52px; margin-top: 14px; padding-top: 14px; }
      .detail-grid { grid-template-columns: 1fr 1fr; }
      .timeline-card, .comment-card { grid-column: span 2; grid-row: auto; }
    }
    @media (max-width: 760px) {
      .topbar { height: auto; align-items: flex-start; flex-direction: column; padding: 20px; }
      .user-tools { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 18px 14px; }
      .side-nav, .detail-grid { grid-template-columns: 1fr; }
      .ticket-hero { align-items: flex-start; flex-direction: column; }
      .details-card, .timeline-card, .comment-card { grid-column: auto; }
      .hero-meta, .comment-actions { align-items: flex-start; flex-direction: column; }
      .hero-meta i { display: none; }
      .send-button { width: 100%; justify-content: center; }
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  ticket?: TicketDetail;
  message = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tickets: TicketService,
    public readonly auth: AuthService
  ) {}

  get displayName() {
    return this.auth.user()?.fullName ?? 'Customer';
  }

  get initials() {
    return this.displayName.trim().charAt(0).toUpperCase() || 'C';
  }

  get agentInitials() {
    const agent = this.ticket?.assignedAgent?.fullName ?? 'Agent';
    return agent.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  get categoryName() {
    return this.ticket?.category?.name ?? this.ticket?.aiPredictedCategory ?? 'Pending';
  }

  get confidence() {
    return Math.round((this.ticket?.aiConfidenceScore ?? 0) * 100);
  }

  get slaRemaining() {
    if (!this.ticket?.slaDueAt) return '-';
    const remainingMs = new Date(this.ticket.slaDueAt).getTime() - Date.now();
    if (remainingMs <= 0) return 'Overdue';
    const minutes = Math.floor(remainingMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  get timelineSteps(): TimelineStep[] {
    const created = this.ticket ? this.formatDateTime(this.ticket.createdAt) : '-';
    const updated = this.ticket ? this.formatDateTime(this.ticket.updatedAt || this.ticket.createdAt) : '-';
    const status = this.ticket?.status ?? 'NEW';
    const done = ['NEW', 'CLASSIFIED', 'PRIORITIZED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const statusIndex = done.indexOf(status);
    const completedThrough = statusIndex >= 0 ? statusIndex : 3;

    return [
      { label: 'NEW', time: created, note: 'Ticket created', state: 'done' },
      { label: 'CLASSIFIED', time: created, note: `AI classified as ${this.categoryName} (${this.confidence}% confidence)`, state: completedThrough >= 1 ? 'done' : 'pending' },
      { label: 'PRIORITIZED', time: updated, note: `Priority set to ${this.ticket?.priority ?? 'PENDING'}`, state: completedThrough >= 2 ? 'done' : 'pending' },
      { label: 'ASSIGNED', time: updated, note: this.ticket?.assignedAgent ? `Assigned to ${this.ticket.assignedAgent.fullName}` : 'Pending assignment', state: completedThrough >= 3 ? 'done' : 'pending' },
      { label: 'IN_PROGRESS', time: status === 'IN_PROGRESS' ? updated : '-', note: status === 'IN_PROGRESS' ? 'Work in progress' : 'Pending', state: status === 'IN_PROGRESS' ? 'current' : completedThrough > 4 ? 'done' : 'pending' },
      { label: 'RESOLVED', time: status === 'RESOLVED' ? updated : '-', note: status === 'RESOLVED' ? 'Resolved' : 'Pending', state: status === 'RESOLVED' || status === 'CLOSED' ? 'done' : 'pending' },
      { label: 'CLOSED', time: status === 'CLOSED' ? updated : '-', note: status === 'CLOSED' ? 'Closed' : 'Pending', state: status === 'CLOSED' ? 'done' : 'pending' }
    ];
  }

  ngOnInit() {
    this.load();
  }

  addComment() {
    if (!this.ticket || !this.message.trim()) return;
    this.tickets.addComment(this.ticket.id, this.message).subscribe(() => {
      this.message = '';
      this.load();
    });
  }

  prettyStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  statusClass(status: string) {
    if (status === 'ASSIGNED') return 'status-assigned';
    if (status === 'IN_PROGRESS') return 'status-progress';
    if (status === 'RESOLVED') return 'status-resolved';
    if (status === 'CLOSED') return 'status-closed';
    return 'status-open';
  }

  priorityClass(priority?: string) {
    if (priority === 'HIGH') return 'priority-high';
    if (priority === 'MEDIUM') return 'priority-medium';
    if (priority === 'LOW') return 'priority-low';
    return 'priority-pending';
  }

  formatDateTime(value: string) {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(value));
  }

  relativeDate(value: string) {
    const elapsedMs = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.floor(elapsedMs / 60000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.tickets.get(id).subscribe(ticket => this.ticket = ticket);
      return;
    }

    this.tickets.list({ pageSize: 1 }).subscribe(response => {
      const firstTicket = response.items[0];
      if (!firstTicket) return;
      this.tickets.get(firstTicket.id).subscribe(ticket => this.ticket = ticket);
    });
  }
}
