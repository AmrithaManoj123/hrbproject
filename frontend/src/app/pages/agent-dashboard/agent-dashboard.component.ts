import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketListItem } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { TicketService } from '../../services/ticket.service';

// Adds a short display summary to the ticket data returned by the API.
type AgentTicketRow = TicketListItem & {
  summary: string;
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="agent-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <!-- Left navigation used by agents to move between dashboard sections. -->
      <aside class="sidebar" aria-label="Agent navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div>
            <strong>AI Support Triage</strong>
            <span>Platform</span>
          </div>
        </div>

        <nav class="side-nav">
          <a class="active" routerLink="/agent/dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
            Dashboard
          </a>
          <a routerLink="/agent/tickets">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
            My Tickets
          </a>
          <a routerLink="/agent/tickets">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/></svg>
            All Tickets
          </a>
          <a routerLink="/agent/sla-alerts">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            SLA Alerts
            <span class="nav-alert">3</span>
          </a>
          <a routerLink="/agent/reports">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M6 20V9h4v11"/><path d="M14 20V4h4v16"/></svg>
            Reports
          </a>
        </nav>

        <button class="logout" type="button" (click)="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="agent-main">
        <!-- Top bar shows page title, notifications, and the logged-in agent identity. -->
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()"><span></span><span></span><span></span></button>
          <h1>Agent Dashboard</h1>
          <div class="top-actions">
            <button class="notification" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span>3</span>
            </button>
            <div class="profile">
              <div class="avatar" aria-hidden="true">{{ initials }}</div>
              <div>
                <strong>{{ displayName }}</strong>
                <span>Finance Team</span>
              </div>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        <div class="content">
          <!-- Welcome row gives the agent a quick time/context cue. -->
          <div class="welcome-row">
            <section class="welcome">
              <h2>Welcome back, {{ firstName }}!</h2>
              <p>Here's what's happening with your tickets today.</p>
            </section>

            <button class="date-button" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M4 6h16v16H4z"/><path d="M4 10h16"/></svg>
              {{ todayLabel }}
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>

          <!-- Summary cards double as shortcuts for common ticket filters. -->
          <section class="stats-grid" aria-label="Agent ticket summary">
            @for (card of summaryCards; track card.label) {
              <article class="summary-card" [class]="card.tone">
                <div class="summary-icon">
                  @if (card.tone === 'open') {
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1 13H7z"/><path d="M8 7l1-3h6l1 3"/><path d="M9 12h6"/></svg>
                  } @else if (card.tone === 'due') {
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 2"/></svg>
                  } @else if (card.tone === 'overdue') {
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v6"/><path d="M12 17h.01"/></svg>
                  } @else if (card.tone === 'resolved') {
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/></svg>
                  } @else {
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6 4 4 6-8"/><path d="M15 7h5v5"/></svg>
                  }
                </div>
                <div>
                  <span>{{ card.label }}</span>
                  <strong>{{ card.value }}</strong>
                </div>
                <button type="button" (click)="applySummary(card.tone)">{{ card.action }}</button>
              </article>
            }
          </section>

          <!-- Main ticket table with search, filters, sorting, and pagination. -->
          <section class="tickets-panel">
            <header class="panel-toolbar">
              <h2>My Assigned Tickets</h2>
              <div class="toolbar-actions">
                <label class="search-box">
                  <input name="search" [(ngModel)]="searchTerm" (ngModelChange)="page = 1" placeholder="Search tickets...">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                </label>
                <button class="filter-button" type="button" (click)="toggleUrgentFilter()" [class.active-filter]="showOnlyUrgent">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                  SLA risk
                </button>
                @if (hasActiveFilters) {
                  <button class="clear-button" type="button" (click)="clearFilters()">Clear</button>
                }
                <label class="sort-select">
                  <span>Sort by:</span>
                  <select name="sortMode" [(ngModel)]="sortMode" (ngModelChange)="page = 1">
                    <option value="priority">Priority (High to Low)</option>
                    <option value="sla">SLA Due Soon</option>
                    <option value="created">Newest First</option>
                  </select>
                </label>
              </div>
            </header>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA Remaining</th>
                    <th>SLA Due</th>
                    <th>Created On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ticket of visibleTickets; track ticket.id) {
                    <tr class="clickable-row" tabindex="0" (click)="openTicket(ticket.id)" (keydown.enter)="openTicket(ticket.id)">
                      <td><a [routerLink]="['/agent/tickets', ticket.id]">#TKT-{{ ticket.id }}</a></td>
                      <td>
                        <strong>{{ ticket.title }}</strong>
                        <span>{{ ticket.summary }}</span>
                      </td>
                      <td>
                        <strong>{{ ticket.customerName }}</strong>
                        <span>{{ ticket.customerEmail }}</span>
                      </td>
                      <td><span class="pill" [class]="priorityClass(ticket.priority)">{{ ticket.priority ?? 'LOW' }}</span></td>
                      <td><span class="pill status-pill">{{ prettyStatus(ticket.status) }}</span></td>
                      <td>
                        <div class="sla" [class]="slaClass(ticket)">
                          <strong>{{ slaRemaining(ticket) }}</strong>
                          <span><i [style.width.%]="slaProgress(ticket)"></i></span>
                        </div>
                      </td>
                      <td>
                        <strong>{{ ticket.slaDueAt ? formatDate(ticket.slaDueAt) : '-' }}</strong>
                        <span>{{ ticket.slaDueAt ? formatTime(ticket.slaDueAt) : 'Pending' }}</span>
                      </td>
                      <td>
                        <strong>{{ formatDate(ticket.createdAt) }}</strong>
                        <span>{{ formatTime(ticket.createdAt) }}</span>
                      </td>
                      <td>
                        <a class="more-button" [routerLink]="['/agent/tickets', ticket.id]" aria-label="Open ticket">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                        </a>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="empty-state">No assigned tickets match your filters.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <footer class="panel-footer">
              <span>Showing {{ showingStart }} to {{ showingEnd }} of {{ filteredTickets.length }} tickets</span>
              <div class="pager" aria-label="Pagination">
                <button type="button" [disabled]="page === 1" (click)="page = page - 1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
                @for (pageNumber of pages; track pageNumber) {
                  <button [class.active]="pageNumber === page" type="button" (click)="page = pageNumber">{{ pageNumber }}</button>
                }
                <button type="button" [disabled]="page >= totalPages" (click)="page = page + 1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
              <label class="rows-select">
                <span>Rows per page:</span>
                <select name="rowsPerPage" [(ngModel)]="rowsPerPage" (ngModelChange)="page = 1">
                  <option [ngValue]="5">5</option>
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="20">20</option>
                </select>
              </label>
            </footer>
          </section>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #08173d; background: #f5f8fc; }
    .agent-shell { min-height: 100vh; display: grid; grid-template-columns: 292px minmax(0, 1fr); background: #f5f8fc; transition: grid-template-columns 220ms ease; }
    .agent-shell.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 30px 24px; color: #fff; background: linear-gradient(180deg, #002d5e 0%, #00264f 46%, #00376e 100%); box-sizing: border-box; overflow: hidden; transition: transform 220ms ease, opacity 180ms ease; }
    .agent-shell.sidebar-collapsed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .sidebar-brand { display: flex; align-items: center; gap: 16px; margin-bottom: 54px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.24; }
    .sidebar-brand strong { font-size: 20px; font-weight: 800; }
    .sidebar-brand span { margin-top: 5px; font-size: 20px; color: rgba(255,255,255,.94); }
    .bot-mark { position: relative; width: 58px; height: 58px; flex: 0 0 auto; border: 4px solid #fff; border-bottom-color: transparent; border-radius: 50%; }
    .bot-mark::before, .bot-mark::after { content: ""; position: absolute; top: 22px; width: 10px; height: 22px; border-radius: 999px; background: #fff; }
    .bot-mark::before { left: -8px; }
    .bot-mark::after { right: -8px; }
    .bot-mark span { position: absolute; left: 10px; top: 18px; width: 32px; height: 24px; border-radius: 12px; background: #fff; }
    .bot-mark i { position: absolute; top: 27px; width: 6px; height: 6px; border-radius: 50%; background: #0057d8; z-index: 1; }
    .bot-mark i:first-of-type { left: 20px; }
    .bot-mark i:last-of-type { right: 20px; }
    .side-nav { display: grid; gap: 17px; }
    .side-nav a, .logout { min-height: 64px; display: flex; align-items: center; gap: 18px; padding: 0 16px; border: 0; border-radius: 10px; color: #fff; font-size: 19px; font-weight: 800; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { background: linear-gradient(135deg, #0877df, #0056d5); box-shadow: 0 14px 24px rgba(0, 18, 52, .2); }
    .nav-alert { min-width: 27px; height: 27px; display: grid; place-items: center; margin-left: auto; border-radius: 50%; background: #ff3b3b; font-size: 14px; }
    .logout { margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,.16); border-radius: 0; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg { width: 26px; height: 26px; }
    .agent-main { min-width: 0; }
    .topbar { height: 104px; display: flex; align-items: center; gap: 38px; padding: 0 39px; border-bottom: 1px solid #d9e1ec; background: #fff; box-sizing: border-box; }
    .menu-button { width: 40px; height: 40px; display: grid; align-content: center; gap: 7px; padding: 0; border: 0; color: #08173d; background: transparent; cursor: pointer; }
    .menu-button span { width: 28px; height: 3px; border-radius: 999px; background: currentColor; }
    .topbar h1 { margin: 0; font-size: 34px; line-height: 1.1; letter-spacing: 0; }
    .top-actions { display: flex; align-items: center; gap: 30px; margin-left: auto; }
    .notification { position: relative; width: 44px; height: 44px; display: grid; place-items: center; border: 0; color: #08173d; background: transparent; cursor: pointer; }
    .notification svg { width: 27px; height: 27px; }
    .notification span { position: absolute; right: 3px; top: 3px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #f1192c; font-size: 12px; font-weight: 800; }
    .profile { display: flex; align-items: center; gap: 14px; }
    .avatar { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #3762a9, #0e7c74); font-size: 20px; font-weight: 900; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 18px; line-height: 1.1; }
    .profile span { margin-top: 7px; color: #4f5e7a; font-size: 14px; }
    .profile svg { width: 22px; height: 22px; }
    .content { padding: 33px 37px 40px; }
    .welcome-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
    .welcome h2 { margin: 0; font-size: 29px; line-height: 1.2; letter-spacing: 0; }
    .welcome p { margin: 12px 0 0; color: #4c5975; font-size: 18px; }
    .date-button { min-width: 226px; height: 54px; display: flex; align-items: center; justify-content: center; gap: 13px; padding: 0 16px; border: 1px solid #cbd6e7; border-radius: 8px; color: #08173d; font-weight: 700; background: #fff; cursor: pointer; }
    .date-button svg { width: 22px; height: 22px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 20px; margin-bottom: 29px; }
    .summary-card { min-height: 186px; display: grid; grid-template-columns: 72px 1fr; grid-template-rows: 1fr auto; column-gap: 18px; padding: 27px 24px 22px; border: 1px solid #dce4ef; border-radius: 9px; background: #fff; box-shadow: 0 8px 20px rgba(30, 50, 85, .08); box-sizing: border-box; }
    .summary-icon { width: 68px; height: 68px; display: grid; place-items: center; border-radius: 12px; }
    .summary-icon svg { width: 36px; height: 36px; }
    .summary-card span { color: #08173d; font-size: 16px; }
    .summary-card strong { display: block; margin-top: 18px; font-size: 36px; line-height: 1; }
    .summary-card button { grid-column: 1 / -1; justify-self: start; margin-top: 20px; padding: 0; border: 0; color: #0058dd; font-weight: 800; background: transparent; cursor: pointer; }
    .summary-card button:hover, .summary-card button:focus-visible { color: #003f9e; text-decoration: underline; }
    .open .summary-icon { color: #075de2; background: #e9f1ff; }
    .due .summary-icon { color: #f47c00; background: #fff0dc; }
    .overdue .summary-icon { color: #f1192c; background: #ffe5e5; }
    .resolved .summary-icon { color: #168635; background: #e5f7e8; }
    .response .summary-icon { color: #6b2dd5; background: #eee7ff; }
    .tickets-panel { overflow: hidden; border: 1px solid #dce4ef; border-radius: 10px; background: #fff; box-shadow: 0 10px 24px rgba(30, 50, 85, .08); }
    .panel-toolbar { min-height: 96px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 22px 25px; border-bottom: 1px solid #dce4ef; box-sizing: border-box; }
    .panel-toolbar h2 { margin: 0; font-size: 26px; letter-spacing: 0; }
    .toolbar-actions { display: flex; align-items: center; gap: 22px; }
    .search-box, .filter-button, .clear-button, .sort-select, .rows-select select { height: 52px; border: 1px solid #cbd6e7; border-radius: 8px; background: #fff; box-sizing: border-box; }
    .search-box { width: 304px; display: flex; align-items: center; gap: 12px; padding: 0 17px; }
    .search-box input { width: 100%; min-width: 0; border: 0; outline: 0; color: #08173d; background: transparent; }
    .search-box svg { width: 24px; height: 24px; }
    .filter-button { display: flex; align-items: center; gap: 12px; padding: 0 22px; color: #08173d; font-weight: 800; cursor: pointer; }
    .filter-button.active-filter { color: #0058dd; border-color: #0058dd; background: #f3f7ff; }
    .filter-button svg { width: 19px; height: 19px; }
    .clear-button { padding: 0 18px; color: #d21f32; font-weight: 900; cursor: pointer; }
    .filter-button:hover, .clear-button:hover, .date-button:hover, .more-button:hover, .pager button:not(:disabled):hover { border-color: #0058dd; background: #f3f7ff; }
    button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid rgba(0, 88, 221, .24); outline-offset: 2px; }
    .sort-select { width: 318px; display: flex; align-items: center; gap: 7px; padding: 0 17px; }
    .sort-select span { color: #08173d; font-weight: 800; white-space: nowrap; }
    .sort-select select, .rows-select select { width: 100%; min-width: 0; border: 0; outline: 0; color: #08173d; background: transparent; font-weight: 700; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; min-width: 1140px; border-collapse: collapse; }
    th, td { padding: 21px 25px; border-bottom: 1px solid #dfe6f0; text-align: left; vertical-align: middle; }
    th { color: #08173d; font-size: 15px; font-weight: 900; background: #fbfcfe; }
    td { color: #08173d; font-size: 15px; }
    td > strong { display: block; font-size: 15px; font-weight: 700; }
    td > span { display: block; max-width: 310px; overflow: hidden; margin-top: 8px; color: #4f5e7a; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
    td a { color: #0058dd; font-weight: 800; text-decoration: none; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f7faff; }
    .clickable-row:focus-visible { outline: 3px solid rgba(0, 88, 221, .24); outline-offset: -3px; }
    .pill { display: inline-flex; align-items: center; min-height: 32px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 900; }
    .priority-critical, .priority-high { color: #e70012; border: 1px solid #ff606b; background: #fff4f4; }
    .priority-medium { color: #f06a00; border: 1px solid #ffa44c; background: #fff7ed; }
    .priority-low { color: #008a2e; border: 1px solid #80ca97; background: #eef9f0; }
    .status-pill { color: #0058dd; border: 1px solid #9bbbfb; background: #f3f7ff; }
    .sla strong { color: #008a2e; font-size: 17px; }
    .sla span { width: 142px; height: 6px; display: block; overflow: hidden; margin-top: 12px; border-radius: 999px; background: #d3dbe7; }
    .sla i { display: block; height: 100%; border-radius: inherit; background: #16a23a; }
    .sla.urgent strong { color: #f40017; }
    .sla.urgent i { background: #f40017; }
    .sla.warning strong { color: #ff7000; }
    .sla.warning i { background: #ff7000; }
    .more-button { width: 47px; height: 47px; display: grid; place-items: center; border: 1px solid #cbd6e7; border-radius: 8px; color: #08173d; background: #fff; cursor: pointer; text-decoration: none; box-sizing: border-box; }
    .more-button svg { width: 24px; height: 24px; }
    .empty-state { padding: 40px 25px; color: #63708b; text-align: center; }
    .panel-footer { min-height: 90px; display: grid; grid-template-columns: 1fr auto 250px; align-items: center; gap: 24px; padding: 0 25px; box-sizing: border-box; }
    .panel-footer > span, .rows-select span { color: #67738d; font-size: 15px; }
    .pager { display: flex; align-items: center; gap: 10px; }
    .pager button { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid transparent; border-radius: 7px; color: #08173d; background: #fff; cursor: pointer; }
    .pager button.active { color: #0058dd; border-color: #0058dd; background: #f3f7ff; }
    .pager button:disabled { color: #9ba7ba; border-color: #dce4ef; cursor: default; }
    .pager svg { width: 20px; height: 20px; }
    .rows-select { display: flex; align-items: center; justify-content: flex-end; gap: 14px; }
    .rows-select select { width: 96px; padding: 0 15px; }
    @media (max-width: 1280px) {
      .agent-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .side-nav { grid-template-columns: repeat(5, minmax(140px, 1fr)); }
      .logout { min-height: 52px; margin-top: 18px; padding-top: 18px; }
      .stats-grid { grid-template-columns: repeat(3, minmax(180px, 1fr)); }
      .panel-toolbar { align-items: flex-start; flex-direction: column; }
      .toolbar-actions { width: 100%; flex-wrap: wrap; }
    }
    @media (max-width: 760px) {
      .topbar, .welcome-row, .panel-footer { align-items: flex-start; flex-direction: column; }
      .topbar { height: auto; padding: 20px; }
      .top-actions { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 22px 15px; }
      .side-nav, .stats-grid { grid-template-columns: 1fr; }
      .toolbar-actions, .search-box, .sort-select, .date-button { width: 100%; }
      .filter-button { width: 100%; justify-content: center; }
      .clear-button { width: 100%; }
      .panel-footer { display: flex; padding: 18px; }
      .rows-select { width: 100%; justify-content: space-between; }
    }
  `]
})
export class AgentDashboardComponent implements OnInit {
  // Dashboard-level metrics returned from the backend.
  stats: any;

  // Raw ticket list loaded from the ticket API.
  tickets: TicketListItem[] = [];

  // Total ticket count reported by the backend, useful if server-side paging is expanded later.
  totalCount = 0;

  // Text entered in the search box.
  searchTerm = '';

  // Controls which ordering rule is applied to the ticket table.
  sortMode = 'priority';

  // Number of rows shown on each table page.
  rowsPerPage = 5;

  // Current page number in the local table pager.
  page = 1;

  // When true, only tickets near or past SLA are displayed.
  showOnlyUrgent = false;

  // Stores the summary-card filter currently applied to the table.
  statusFilter = '';

  // Controls whether the sidebar is hidden.
  sidebarCollapsed = false;

  constructor(
    // AuthService is public because the template reads the current user.
    public readonly auth: AuthService,

    // DashboardService loads aggregate statistics for the cards.
    private readonly dashboard: DashboardService,

    // TicketService loads the tickets displayed in the table.
    private readonly ticketApi: TicketService,

    private readonly router: Router
  ) {}

  // Name shown in the profile section; falls back when no user is loaded yet.
  get displayName() {
    return this.auth.user()?.fullName ?? 'Agent Smith';
  }

  // First name is used in the welcome message.
  get firstName() {
    return this.displayName.split(' ')[0] || 'Agent';
  }

  // Initials are displayed in the circular avatar.
  get initials() {
    return this.displayName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AS';
  }

  // Human-readable date label for the date button.
  get todayLabel() {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
  }

  // Counts tickets whose SLA deadline falls on today's date.
  get dueToday() {
    const today = new Date().toDateString();
    return this.tickets.filter(ticket => ticket.slaDueAt && new Date(ticket.slaDueAt).toDateString() === today).length;
  }

  // Counts tickets whose SLA deadline has already passed.
  get overdue() {
    return this.tickets.filter(ticket => ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date()).length;
  }

  // Uses backend stats when available, with a local fallback from the loaded tickets.
  get resolvedToday() {
    return this.stats?.resolvedToday ?? this.tickets.filter(ticket => ticket.status === 'RESOLVED').length;
  }

  // Data source for the five summary cards at the top of the dashboard.
  get summaryCards() {
    return [
      { label: 'Open Tickets', value: this.stats?.openTickets ?? this.tickets.filter(ticket => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length, action: 'View all', tone: 'open' },
      { label: 'Due Today', value: this.dueToday, action: 'View due today', tone: 'due' },
      { label: 'Overdue', value: this.overdue, action: 'View overdue', tone: 'overdue' },
      { label: 'Resolved Today', value: this.resolvedToday, action: 'View reports', tone: 'resolved' },
      { label: 'Avg. Response Time', value: '18m', action: 'View analytics', tone: 'response' }
    ];
  }

  // Returns only the rows for the current page after filtering and sorting.
  get visibleTickets(): AgentTicketRow[] {
    const start = (this.page - 1) * this.rowsPerPage;
    return this.filteredTickets.slice(start, start + this.rowsPerPage);
  }

  // Applies all active filters and sorting rules to the ticket list.
  get filteredTickets(): AgentTicketRow[] {
    const search = this.searchTerm.trim().toLowerCase();
    const rows = this.tickets.map(ticket => this.toRow(ticket)).filter(ticket => {
      if (this.showOnlyUrgent && !['urgent', 'warning'].includes(this.slaClass(ticket))) return false;
      if (this.statusFilter === 'resolved' && ticket.status !== 'RESOLVED') return false;
      if (this.statusFilter === 'open' && ['RESOLVED', 'CLOSED'].includes(ticket.status)) return false;
      if (this.statusFilter === 'due' && (!ticket.slaDueAt || new Date(ticket.slaDueAt).toDateString() !== new Date().toDateString())) return false;
      if (this.statusFilter === 'overdue' && (!ticket.slaDueAt || new Date(ticket.slaDueAt) >= new Date())) return false;
      if (!search) return true;
      return ticket.title.toLowerCase().includes(search)
        || ticket.customerName.toLowerCase().includes(search)
        || ticket.customerEmail.toLowerCase().includes(search)
        || ticket.status.toLowerCase().includes(search)
        || String(ticket.id).includes(search);
    });

    // Sort by the selected mode; priority sorting also uses SLA due date as a tie-breaker.
    rows.sort((left, right) => {
      if (this.sortMode === 'sla') return new Date(left.slaDueAt ?? '9999-12-31').getTime() - new Date(right.slaDueAt ?? '9999-12-31').getTime();
      if (this.sortMode === 'created') return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      return this.priorityRank(left.priority) - this.priorityRank(right.priority)
        || new Date(left.slaDueAt ?? '9999-12-31').getTime() - new Date(right.slaDueAt ?? '9999-12-31').getTime();
    });

    return rows;
  }

  // Number of pages available for the filtered ticket set.
  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredTickets.length / this.rowsPerPage));
  }

  // Page numbers rendered by the pager controls.
  get pages() {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  // First visible row number shown in the table footer.
  get showingStart() {
    return this.filteredTickets.length ? (this.page - 1) * this.rowsPerPage + 1 : 0;
  }

  // Last visible row number shown in the table footer.
  get showingEnd() {
    return Math.min(this.page * this.rowsPerPage, this.filteredTickets.length);
  }

  // Controls whether the Clear button should appear.
  get hasActiveFilters() {
    return !!this.searchTerm.trim() || this.showOnlyUrgent || !!this.statusFilter;
  }

  // Load dashboard stats and the first batch of tickets when the component opens.
  ngOnInit() {
    this.dashboard.stats().subscribe(stats => this.stats = stats);
    this.ticketApi.list({ pageSize: 50 }).subscribe(response => {
      this.tickets = response.items;
      this.totalCount = response.totalCount;
      this.page = 1;
    });
  }

  // Hide or show the sidebar without leaving the dashboard.
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  // Toggle the SLA risk filter and reset other status filters.
  toggleUrgentFilter() {
    this.showOnlyUrgent = !this.showOnlyUrgent;
    this.statusFilter = '';
    this.page = 1;
  }

  // Reset every table filter back to the default view.
  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.showOnlyUrgent = false;
    this.page = 1;
  }

  // Apply a filter when the user clicks one of the summary cards.
  applySummary(tone: string) {
    this.page = 1;
    this.showOnlyUrgent = false;
    this.statusFilter = tone === 'open' || tone === 'due' || tone === 'resolved' || tone === 'overdue' ? tone : '';
    if (tone === 'response') this.sortMode = 'created';
  }

  openTicket(ticketId: number) {
    this.router.navigate(['/agent/tickets', ticketId]);
  }

  // Converts API status values like IN_PROGRESS into readable labels.
  prettyStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  // Maps ticket priority to the CSS class that styles the priority pill.
  priorityClass(priority?: string) {
    if (priority === 'CRITICAL') return 'priority-critical';
    if (priority === 'HIGH') return 'priority-high';
    if (priority === 'MEDIUM') return 'priority-medium';
    return 'priority-low';
  }

  // Returns the remaining SLA time shown in the ticket table.
  slaRemaining(ticket: TicketListItem) {
    if (!ticket.slaDueAt) return '-';
    const remainingMs = new Date(ticket.slaDueAt).getTime() - Date.now();
    const absoluteMinutes = Math.max(0, Math.floor(Math.abs(remainingMs) / 60000));
    const hours = Math.floor(absoluteMinutes / 60);
    const minutes = absoluteMinutes % 60;
    const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${Math.floor(Math.abs(remainingMs) / 1000) % 60}s`;
    return remainingMs < 0 ? 'Overdue' : label;
  }

  // Calculates the progress bar percentage based on priority-specific SLA windows.
  slaProgress(ticket: TicketListItem) {
    if (!ticket.slaDueAt) return 0;
    const remainingMs = new Date(ticket.slaDueAt).getTime() - Date.now();
    if (remainingMs <= 0) return 100;
    const totalMs = this.priorityWindowMs(ticket.priority);
    return Math.max(10, Math.min(100, 100 - remainingMs / totalMs * 100));
  }

  // Returns a CSS class when a ticket is close to or past its SLA deadline.
  slaClass(ticket: TicketListItem) {
    if (!ticket.slaDueAt) return '';
    const remainingMs = new Date(ticket.slaDueAt).getTime() - Date.now();
    if (remainingMs <= 60 * 60 * 1000) return 'urgent';
    if (remainingMs <= 3 * 60 * 60 * 1000) return 'warning';
    return '';
  }

  // Formats timestamps into the date style used in the table.
  formatDate(value: string) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  // Formats timestamps into the time style used in the table.
  formatTime(value: string) {
    return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  }

  // Converts an API ticket into the row shape expected by the template.
  private toRow(ticket: TicketListItem): AgentTicketRow {
    return {
      ...ticket,
      summary: this.summaryFor(ticket.title)
    };
  }

  // Creates a short placeholder preview based on common ticket title keywords.
  private summaryFor(title: string) {
    if (title.toLowerCase().includes('payment')) return 'I was charged twice for the same transaction...';
    if (title.toLowerCase().includes('invoice')) return 'I have not received my invoice for...';
    if (title.toLowerCase().includes('password')) return 'I tried resetting my password but...';
    if (title.toLowerCase().includes('dark')) return 'It would be great to have a dark mode...';
    return 'Customer needs help with this support request...';
  }

  // Lower rank values mean higher priority during sorting.
  private priorityRank(priority?: string) {
    return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[priority ?? 'LOW'] ?? 3;
  }

  // Defines the expected SLA window for each priority level.
  private priorityWindowMs(priority?: string) {
    if (priority === 'CRITICAL') return 15 * 60 * 1000;
    if (priority === 'HIGH') return 60 * 60 * 1000;
    if (priority === 'MEDIUM') return 4 * 60 * 60 * 1000;
    return 8 * 60 * 60 * 1000;
  }
}
