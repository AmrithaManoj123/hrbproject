import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketListItem } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';

type ReviewTicket = {
  id: number;
  title: string;
  customer: string;
  email: string;
  category: string;
  confidence: number;
  priority: string;
  createdDate: string;
  createdTime: string;
  createdAt: string;
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="review-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <aside class="sidebar" aria-label="Admin navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div><strong>AI Support Triage</strong><span>Platform</span></div>
        </div>

        <nav class="side-nav">
          @for (item of navItems; track item.label) {
            <a [routerLink]="item.path" [class.active]="item.active">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                @if (item.icon === 'home') { <path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/> }
                @if (item.icon === 'ticket') { <path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/> }
                @if (item.icon === 'team') { <circle cx="8" cy="8" r="3"/><path d="M3 21v-1a5 5 0 0 1 10 0v1"/><circle cx="17" cy="10" r="2"/><path d="M21 21v-1a4 4 0 0 0-4-4"/> }
                @if (item.icon === 'category') { <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/> }
                @if (item.icon === 'review') { <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/><path d="M11 8v4"/><path d="M11 15h.01"/> }
                @if (item.icon === 'report') { <path d="M4 20h16"/><path d="M6 20V9h4v11"/><path d="M14 20V4h4v16"/> }
                @if (item.icon === 'sla') { <circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/> }
                @if (item.icon === 'settings') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21h-3v-.6a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H4v-3h.6a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.6V3h3v.6a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.6 1h.6v3h-.6a1.8 1.8 0 0 0-1.6 1z"/> }
              </svg>
              {{ item.label }}
              @if (item.badge) { <span class="nav-alert">{{ item.badge }}</span> }
            </a>
          }
        </nav>

        <button class="logout" type="button" (click)="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="review-main">
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()"><span></span><span></span><span></span></button>
          <div class="title-copy">
            <h1>Review Queue</h1>
            <p>Tickets that need manual review (AI confidence &lt; 60%). Please review and classify.</p>
          </div>
          <div class="top-actions">
            <button class="notification" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span>3</span>
            </button>
            <div class="profile">
              <div class="avatar">{{ initials }}</div>
              <div><strong>{{ displayName }}</strong><span>Administrator</span></div>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        <div class="content">
          <section class="stats-grid" aria-label="Review queue summary">
            <article class="summary-card needs">
              <div class="summary-icon"><svg viewBox="0 0 24 24"><path d="M9 4h6"/><path d="M10 2h4v4h-4z"/><path d="M6 5h12v16H6z"/><path d="M12 10v5"/><path d="M12 18h.01"/></svg></div>
              <div><span>Needs Review</span><strong>{{ reviewTickets.length }}</strong></div><button type="button" (click)="priorityFilter = 'All Priorities'">View all</button>
            </article>
            <article class="summary-card high">
              <div class="summary-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v6"/><path d="M12 16h.01"/></svg></div>
              <div><span>High Priority</span><strong>{{ highPriorityCount }}</strong></div><button type="button" (click)="priorityFilter = 'HIGH'">View high priority</button>
            </article>
            <article class="summary-card oldest">
              <div class="summary-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg></div>
              <div><span>Oldest in Queue</span><strong>{{ oldestAge }}</strong></div><button type="button" (click)="sortMode = 'Sort by: Oldest First'">View oldest</button>
            </article>
            <article class="summary-card reviewed">
              <div class="summary-icon"><svg viewBox="0 0 24 24"><path d="M5 20V9h3v11"/><path d="M11 20V5h3v15"/><path d="M17 20V2h3v18"/></svg></div>
              <div><span>Reviewed Today</span><strong>{{ reviewedToday }}</strong></div><button type="button" routerLink="/admin/reports">View report</button>
            </article>
          </section>

          <section class="queue-panel">
            <header class="filters">
              <label class="search-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                <input name="search" [(ngModel)]="searchTerm" placeholder="Search tickets...">
              </label>
              <label class="select-box">
                <select name="category" [(ngModel)]="categoryFilter">
                  <option>All Categories</option>
                  @for (category of categories; track category) { <option>{{ category }}</option> }
                </select>
              </label>
              <label class="select-box">
                <select name="priority" [(ngModel)]="priorityFilter"><option>All Priorities</option><option>HIGH</option><option>MEDIUM</option></select>
              </label>
              <label class="select-box sort">
                <select name="sort" [(ngModel)]="sortMode"><option>Sort by: Oldest First</option><option>Sort by: Highest Confidence</option><option>Sort by: Priority</option></select>
              </label>
              <button class="filter-button" type="button" (click)="clearFilters()" [disabled]="!hasActiveFilters">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                Reset
              </button>
            </header>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Title</th><th>Customer</th><th>Predicted Category</th><th>Confidence</th><th>Priority</th><th>Created On</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  @for (ticket of visibleTickets; track ticket.id) {
                    <tr>
                      <td><a [routerLink]="['/admin/tickets', ticket.id]">#TKT-{{ ticket.id }}</a></td>
                      <td>{{ ticket.title }}</td>
                      <td><strong>{{ ticket.customer }}</strong><span>{{ ticket.email }}</span></td>
                      <td>{{ ticket.category }}</td>
                      <td><b [class.warning]="ticket.confidence >= 50">{{ ticket.confidence }}%</b></td>
                      <td><span class="pill" [class.medium]="ticket.priority === 'MEDIUM'">{{ ticket.priority }}</span></td>
                      <td><strong>{{ ticket.createdDate }}</strong><span>{{ ticket.createdTime }}</span></td>
                      <td>
                        <div class="actions">
                          <button class="review-button" type="button" [routerLink]="['/admin/tickets', ticket.id]">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/></svg>
                            Review
                          </button>
                          <a class="drop-button" [routerLink]="['/admin/tickets', ticket.id]" aria-label="Open ticket details">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8" class="empty-state">No tickets need review for these filters.</td></tr>
                  }
                </tbody>
              </table>
            </div>

            <footer class="panel-footer">
              <span>Showing {{ visibleTickets.length ? 1 : 0 }} to {{ visibleTickets.length }} of {{ reviewTickets.length }} tickets</span>
              <div class="pager">
                <button type="button" disabled aria-label="Previous page"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
                <button class="active" type="button">1</button>
                <button type="button" disabled aria-label="Next page"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #071747; background: #f6f9fd; }
    .review-shell { min-height: 100vh; display: grid; grid-template-columns: 292px minmax(0, 1fr); background: #f6f9fd; transition: grid-template-columns 220ms ease; }
    .review-shell.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 28px 20px; color: #fff; background: linear-gradient(180deg, #002d5e 0%, #00264f 46%, #00376e 100%); box-sizing: border-box; overflow: hidden; transition: transform 220ms ease, opacity 180ms ease; }
    .review-shell.sidebar-collapsed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .sidebar-brand { display: flex; align-items: center; gap: 15px; margin-bottom: 48px; padding-left: 4px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.22; }
    .sidebar-brand strong { font-size: 20px; font-weight: 900; }
    .sidebar-brand span { margin-top: 6px; font-size: 20px; color: rgba(255,255,255,.94); }
    .bot-mark { position: relative; width: 58px; height: 58px; flex: 0 0 auto; border: 4px solid #fff; border-bottom-color: transparent; border-radius: 50%; }
    .bot-mark::before, .bot-mark::after { content: ""; position: absolute; top: 22px; width: 9px; height: 23px; border-radius: 999px; background: #fff; }
    .bot-mark::before { left: -8px; } .bot-mark::after { right: -8px; }
    .bot-mark span { position: absolute; left: 10px; top: 18px; width: 32px; height: 24px; border-radius: 12px; background: #fff; }
    .bot-mark i { position: absolute; top: 27px; width: 6px; height: 6px; border-radius: 50%; background: #0057d8; z-index: 1; }
    .bot-mark i:first-of-type { left: 20px; } .bot-mark i:last-of-type { right: 20px; }
    .side-nav { display: grid; gap: 18px; }
    .side-nav a, .logout { min-height: 56px; display: flex; align-items: center; gap: 20px; padding: 0 16px; border: 0; border-radius: 8px; color: #fff; font-size: 18px; font-weight: 800; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { background: linear-gradient(135deg, #0877df, #0056d5); box-shadow: 0 14px 24px rgba(0, 18, 52, .2); }
    .nav-alert { min-width: 28px; height: 28px; display: grid; place-items: center; margin-left: auto; border-radius: 50%; background: #ff3038; font-size: 14px; }
    .logout { margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,.18); border-radius: 0; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg { width: 25px; height: 25px; }
    .review-main { min-width: 0; }
    .topbar { height: 112px; display: flex; align-items: center; gap: 36px; padding: 0 38px; border-bottom: 1px solid #d9e1ec; background: #fff; box-sizing: border-box; }
    .menu-button { width: 40px; height: 40px; display: grid; align-content: center; gap: 7px; padding: 0; border: 0; color: #071747; background: transparent; cursor: pointer; }
    .menu-button span { width: 27px; height: 3px; border-radius: 999px; background: currentColor; }
    .title-copy h1 { margin: 0; font-size: 32px; letter-spacing: 0; }
    .title-copy p { margin: 12px 0 0; color: #17213e; font-size: 16px; }
    .top-actions { display: flex; align-items: center; gap: 28px; margin-left: auto; }
    .notification { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 0; color: #071747; background: transparent; cursor: pointer; }
    .notification svg { width: 26px; height: 26px; }
    .notification span { position: absolute; right: 3px; top: 2px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #f1192c; font-size: 12px; font-weight: 900; }
    .profile { display: flex; align-items: center; gap: 14px; padding-left: 22px; border-left: 1px solid #d6deea; }
    .avatar { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #285ea8, #0a7d72); font-weight: 900; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 18px; line-height: 1.1; }
    .profile span { margin-top: 7px; color: #4f5e7a; font-size: 14px; }
    .profile svg { width: 22px; height: 22px; }
    .content { padding: 36px 34px 46px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px; }
    .summary-card { min-height: 176px; display: grid; grid-template-columns: 72px 1fr; grid-template-rows: 1fr auto; column-gap: 24px; padding: 28px 28px 24px; border: 1px solid #dce4ef; border-radius: 10px; background: #fff; box-shadow: 0 8px 20px rgba(30,50,85,.08); box-sizing: border-box; }
    .summary-icon { width: 72px; height: 72px; display: grid; place-items: center; border-radius: 10px; }
    .summary-icon svg { width: 36px; height: 36px; }
    .summary-card span { color: #293450; font-size: 15px; }
    .summary-card strong { display: block; margin-top: 17px; font-size: 34px; line-height: 1; }
    .summary-card button { grid-column: 1 / -1; justify-self: start; margin-top: 18px; padding: 0; border: 0; color: #0058dd; font-weight: 800; background: transparent; cursor: pointer; }
    .needs .summary-icon { color: #ff8b1a; background: #fff0dc; }
    .high .summary-icon { color: #f1192c; background: #ffe1e1; }
    .oldest .summary-icon { color: #6b2dd5; background: #eee7ff; }
    .reviewed .summary-icon { color: #0b68e8; background: #e7f0ff; }
    .queue-panel { overflow: hidden; border: 1px solid #dce4ef; border-radius: 10px; background: #fff; box-shadow: 0 10px 24px rgba(30,50,85,.08); }
    .filters { min-height: 108px; display: grid; grid-template-columns: minmax(300px, 1fr) 235px 210px 250px 120px; gap: 22px; align-items: center; padding: 0 26px; border-bottom: 1px solid #dce4ef; box-sizing: border-box; }
    .search-box, .select-box, .filter-button { height: 53px; display: flex; align-items: center; border: 1px solid #cbd6e7; border-radius: 7px; background: #fff; box-sizing: border-box; }
    .search-box { gap: 14px; padding: 0 17px; }
    .search-box svg { width: 23px; height: 23px; color: #53617c; }
    .search-box input, .select-box select { width: 100%; min-width: 0; border: 0; outline: 0; color: #071747; font: inherit; background: transparent; }
    .select-box { padding: 0 15px; }
    .filter-button { justify-content: center; gap: 11px; color: #071747; font-weight: 800; cursor: pointer; }
    .filter-button:disabled { color: #9aa6ba; cursor: default; background: #f7f9fc; }
    .filter-button svg { width: 20px; height: 20px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; min-width: 1120px; border-collapse: collapse; }
    th, td { padding: 26px 28px; border-bottom: 1px solid #dfe6f0; color: #071747; font-size: 16px; text-align: left; vertical-align: middle; }
    th { font-size: 15px; font-weight: 900; background: #fbfcfe; }
    td a { color: #0058dd; font-weight: 800; text-decoration: none; }
    td strong, td span { display: block; }
    td span { margin-top: 8px; color: #5f6b84; font-size: 14px; }
    td b { color: #f1192c; font-size: 17px; }
    td b.warning { color: #ff7000; }
    .pill { display: inline-flex; align-items: center; min-height: 34px; padding: 0 18px; border: 1px solid #ff606b; border-radius: 5px; color: #f1192c; background: #fff4f4; font-size: 14px; font-weight: 900; }
    .pill.medium { border-color: #ffa44c; color: #ff7000; background: #fff7ed; }
    .actions { display: inline-flex; overflow: hidden; border: 1px solid #0058dd; border-radius: 6px; }
    .review-button, .drop-button { height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; border: 0; color: #0058dd; font-weight: 900; background: #fff; cursor: pointer; text-decoration: none; }
    .review-button { min-width: 112px; }
    .drop-button { width: 42px; border-left: 1px solid #0058dd; }
    .review-button svg, .drop-button svg { width: 18px; height: 18px; }
    .panel-footer { min-height: 96px; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; color: #62708a; font-size: 15px; }
    .pager { display: flex; align-items: center; gap: 18px; }
    .pager button { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid #dce4ef; border-radius: 6px; color: #071747; background: #fff; cursor: pointer; }
    .pager button.active { color: #0058dd; border-color: #0058dd; background: #f3f7ff; }
    .pager button:disabled { color: #b4bdcd; cursor: default; }
    .pager svg { width: 19px; height: 19px; }
    .empty-state { padding: 42px 28px; color: #62708a; text-align: center; }
    .summary-card button:hover, .review-button:hover, .drop-button:hover, .filter-button:not(:disabled):hover, .pager button:not(:disabled):hover { background: #f3f7ff; }
    button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid rgba(0, 88, 221, .24); outline-offset: 2px; }
    @media (max-width: 1280px) {
      .review-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .side-nav { grid-template-columns: repeat(4, minmax(150px, 1fr)); display: grid; }
      .logout { min-height: 52px; margin-top: 16px; padding-top: 16px; }
      .stats-grid { grid-template-columns: repeat(2, minmax(220px, 1fr)); }
      .filters { grid-template-columns: 1fr 1fr; padding: 22px; }
    }
    @media (max-width: 760px) {
      .topbar { height: auto; align-items: flex-start; flex-direction: column; padding: 20px; }
      .top-actions { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 18px 14px; }
      .side-nav, .stats-grid, .filters { grid-template-columns: 1fr; }
      .panel-footer { align-items: flex-start; flex-direction: column; justify-content: center; gap: 16px; padding: 20px 28px; }
    }
  `]
})
export class ReviewQueueComponent implements OnInit {
  searchTerm = '';
  categoryFilter = 'All Categories';
  priorityFilter = 'All Priorities';
  sortMode = 'Sort by: Oldest First';
  sidebarCollapsed = false;

  readonly navItems = [
    { label: 'Dashboard', icon: 'home', path: '/admin/dashboard' },
    { label: 'Tickets', icon: 'ticket', path: '/admin/tickets' },
    { label: 'Review Queue', icon: 'review', path: '/admin/review-queue', active: true, badge: 5 },
    { label: 'Agents', icon: 'team', path: '/admin/agents' },
    { label: 'Teams', icon: 'team', path: '/admin/teams' },
    { label: 'Categories', icon: 'category', path: '/admin/categories' },
    { label: 'SLA Monitoring', icon: 'sla', path: '/admin/sla-monitoring' },
    { label: 'Reports', icon: 'report', path: '/admin/reports' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' }
  ];

  tickets: ReviewTicket[] = [];

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly ticketApi: TicketService
  ) {}

  ngOnInit() {
    this.ticketApi.list({ pageSize: 100 }).subscribe(response => {
      this.tickets = response.items
        .filter(ticket => ticket.requiresAgentReview || (ticket.aiConfidenceScore ?? 1) < 0.6)
        .map(ticket => this.toReviewTicket(ticket));
    });
  }

  get displayName() {
    return this.auth.user()?.fullName ?? 'Admin User';
  }

  get initials() {
    return this.displayName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AU';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  get visibleTickets() {
    const search = this.searchTerm.trim().toLowerCase();
    const rows = this.reviewTickets.filter(ticket => {
      const matchesSearch = !search
        || ticket.title.toLowerCase().includes(search)
        || ticket.customer.toLowerCase().includes(search)
        || ticket.email.toLowerCase().includes(search)
        || String(ticket.id).includes(search);
      const matchesPriority = this.priorityFilter === 'All Priorities' || ticket.priority === this.priorityFilter;
      const matchesCategory = this.categoryFilter === 'All Categories' || ticket.category === this.categoryFilter;
      return matchesSearch && matchesPriority && matchesCategory;
    });

    return rows.sort((left, right) => {
      if (this.sortMode === 'Sort by: Highest Confidence') return right.confidence - left.confidence;
      if (this.sortMode === 'Sort by: Priority') return this.priorityRank(left.priority) - this.priorityRank(right.priority);
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }

  get reviewTickets() {
    return this.tickets;
  }

  get categories() {
    return [...new Set(this.reviewTickets.map(ticket => ticket.category).filter(Boolean))];
  }

  get highPriorityCount() {
    return this.reviewTickets.filter(ticket => ['CRITICAL', 'HIGH'].includes(ticket.priority)).length;
  }

  get hasActiveFilters() {
    return !!this.searchTerm.trim()
      || this.categoryFilter !== 'All Categories'
      || this.priorityFilter !== 'All Priorities'
      || this.sortMode !== 'Sort by: Oldest First';
  }

  clearFilters() {
    this.searchTerm = '';
    this.categoryFilter = 'All Categories';
    this.priorityFilter = 'All Priorities';
    this.sortMode = 'Sort by: Oldest First';
  }

  get reviewedToday() {
    return 0;
  }

  get oldestAge() {
    if (!this.reviewTickets.length) return '0m';
    const oldest = this.reviewTickets.reduce((left, right) => new Date(left.createdAt) < new Date(right.createdAt) ? left : right);
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(oldest.createdAt).getTime()) / 60000));
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  }

  private toReviewTicket(ticket: TicketListItem): ReviewTicket {
    return {
      id: ticket.id,
      title: ticket.title,
      customer: ticket.customerName,
      email: ticket.customerEmail,
      category: ticket.aiPredictedCategory || ticket.categoryName || 'Unknown',
      confidence: Math.round((ticket.aiConfidenceScore ?? 0) * 100),
      priority: ticket.priority ?? 'LOW',
      createdDate: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ticket.createdAt)),
      createdTime: new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(ticket.createdAt)),
      createdAt: ticket.createdAt
    };
  }

  private priorityRank(priority: string) {
    return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[priority] ?? 4;
  }
}
