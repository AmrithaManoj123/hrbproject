import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketListItem } from '../../models/ticket.model';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="dashboard-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <aside class="sidebar" aria-label="Customer navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true">
            <span></span>
            <i></i>
            <i></i>
          </div>
          <div>
            <strong>AI Support Triage</strong>
            <span>Platform</span>
          </div>
        </div>

        <nav class="side-nav">
          <a class="active" routerLink="/customer/dashboard">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>
            Dashboard
          </a>
          <a routerLink="/customer/tickets">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h5"/><path d="M7 17h2"/><path d="M15 17h2"/></svg>
            My Tickets
          </a>
          <a routerLink="/customer/tickets/new">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/><path d="M4 4h16v16H4z"/></svg>
            New Ticket
          </a>
        </nav>

        <button class="logout" type="button" (click)="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="dashboard-main">
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()">
            <span></span><span></span><span></span>
          </button>
          <h1>Customer Dashboard</h1>
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
          <section class="welcome">
            <h2>Welcome back, {{ firstName }}!</h2>
            <p>Here's what's happening with your support tickets.</p>
          </section>

          <section class="stats-grid" aria-label="Ticket summary">
            <article class="summary-card total">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10"/><path d="M7 12h7"/><path d="M7 17h4"/><path d="M5 3h14v18H5z"/></svg>
              </div>
              <div>
                <span>Total Tickets</span>
                <strong>{{ totalCount }}</strong>
              </div>
              <button type="button" [class.active]="statusFilter === 'ALL'" [attr.aria-pressed]="statusFilter === 'ALL'" (click)="applyStatus('ALL', ticketsPanel)">View all tickets</button>
            </article>

            <article class="summary-card open">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6h5"/></svg>
              </div>
              <div>
                <span>Open Tickets</span>
                <strong>{{ openCount }}</strong>
              </div>
              <button type="button" [class.active]="statusFilter === 'OPEN'" [attr.aria-pressed]="statusFilter === 'OPEN'" (click)="applyStatus('OPEN', ticketsPanel)">View open tickets</button>
            </article>

            <article class="summary-card resolved">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
              </div>
              <div>
                <span>Resolved Tickets</span>
                <strong>{{ resolvedCount }}</strong>
              </div>
              <button type="button" [class.active]="statusFilter === 'RESOLVED'" [attr.aria-pressed]="statusFilter === 'RESOLVED'" (click)="applyStatus('RESOLVED', ticketsPanel)">View resolved</button>
            </article>

            <article class="summary-card closed">
              <div class="summary-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14"/><path d="M7 7v13h10V7"/><path d="M9 7l1-3h4l1 3"/><path d="M10 12h4"/></svg>
              </div>
              <div>
                <span>Closed Tickets</span>
                <strong>{{ closedCount }}</strong>
              </div>
              <button type="button" [class.active]="statusFilter === 'CLOSED'" [attr.aria-pressed]="statusFilter === 'CLOSED'" (click)="applyStatus('CLOSED', ticketsPanel)">View closed</button>
            </article>
          </section>

          <section class="tickets-panel" #ticketsPanel>
            <div class="panel-toolbar">
              <h2>My Tickets</h2>
              <div class="filters">
                <label class="search-box">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                  <input name="search" [(ngModel)]="searchTerm" (ngModelChange)="page = 1" placeholder="Search tickets...">
                </label>
                <label class="status-select">
                  <span class="sr-only">Filter by status</span>
                  <select name="status" [(ngModel)]="statusFilter" (ngModelChange)="page = 1">
                    <option value="ALL">All Status</option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created On</th>
                    <th>Last Updated</th>
                    <th aria-label="Open ticket"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (ticket of visibleTickets; track ticket.id) {
                    <tr>
                      <td><a [routerLink]="['/customer/tickets', ticket.id]">#TKT-{{ ticket.id }}</a></td>
                      <td>{{ ticket.title }}</td>
                      <td><span class="pill" [class]="statusClass(ticket.status)">{{ prettyStatus(ticket.status) }}</span></td>
                      <td><span class="pill" [class]="priorityClass(ticket.priority)">{{ ticket.priority ?? 'LOW' }}</span></td>
                      <td>{{ formatDate(ticket.createdAt) }}</td>
                      <td>{{ relativeDate(ticket.createdAt) }}</td>
                      <td>
                        <a class="row-link" [routerLink]="['/customer/tickets', ticket.id]" aria-label="View ticket">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                        </a>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="7" class="empty-state">No tickets match your filters.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <footer class="panel-footer">
              <span>Showing {{ showingStart }} to {{ showingEnd }} of {{ filteredTickets.length }} entries</span>
              <div class="pager" aria-label="Pagination">
                <button type="button" [disabled]="page === 1" (click)="page = page - 1" aria-label="Previous page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
                @for (pageNumber of pages; track pageNumber) {
                  <button [class.active]="pageNumber === page" type="button" (click)="page = pageNumber">{{ pageNumber }}</button>
                }
                <button type="button" [disabled]="page >= totalPages" (click)="page = page + 1" aria-label="Next page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
              <a class="create-button" routerLink="/customer/tickets/new">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                Create New Ticket
              </a>
            </footer>
          </section>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      color: #071747;
      background: #f6f9fd;
    }

    .dashboard-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 276px minmax(0, 1fr);
      background: #f6f9fd;
      transition: grid-template-columns 220ms ease;
    }

    .dashboard-shell.sidebar-collapsed {
      grid-template-columns: 0 minmax(0, 1fr);
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 34px 22px 28px;
      color: #ffffff;
      background: linear-gradient(180deg, #004b91 0%, #00366c 48%, #012f61 100%);
      box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.12);
      overflow: hidden;
      transition: transform 220ms ease, opacity 180ms ease;
    }

    .dashboard-shell.sidebar-collapsed .sidebar {
      transform: translateX(-100%);
      opacity: 0;
      pointer-events: none;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 42px;
    }

    .sidebar-brand strong,
    .sidebar-brand span {
      display: block;
      line-height: 1.25;
    }

    .sidebar-brand strong {
      font-size: 19px;
      font-weight: 800;
    }

    .sidebar-brand span {
      margin-top: 6px;
      color: rgba(255, 255, 255, 0.86);
      font-size: 20px;
    }

    .bot-mark {
      position: relative;
      width: 58px;
      height: 58px;
      flex: 0 0 auto;
      border: 4px solid #ffffff;
      border-bottom-color: transparent;
      border-radius: 50%;
    }

    .bot-mark span {
      position: absolute;
      left: 10px;
      top: 18px;
      width: 32px;
      height: 24px;
      border-radius: 12px;
      background: #ffffff;
    }

    .bot-mark i {
      position: absolute;
      top: 27px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0055b8;
      z-index: 1;
    }

    .bot-mark i:first-of-type {
      left: 20px;
    }

    .bot-mark i:last-of-type {
      right: 20px;
    }

    .side-nav {
      display: grid;
      gap: 14px;
    }

    .side-nav a,
    .logout {
      min-height: 70px;
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 0 18px;
      border: 0;
      border-radius: 10px;
      color: #ffffff;
      font-size: 20px;
      font-weight: 700;
      text-decoration: none;
      background: transparent;
      cursor: pointer;
    }

    .side-nav a.active {
      background: linear-gradient(135deg, #0876dc, #0056b8);
      box-shadow: 0 14px 22px rgba(0, 29, 74, 0.18);
    }

    .side-nav svg,
    .logout svg,
    .topbar svg,
    .summary-card svg,
    .panel-toolbar svg,
    .row-link svg,
    .pager svg,
    .create-button svg {
      width: 25px;
      height: 25px;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
    }

    .logout {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 0;
      padding-top: 30px;
      justify-content: flex-start;
    }

    .dashboard-main {
      min-width: 0;
    }

    .topbar {
      height: 103px;
      display: flex;
      align-items: center;
      gap: 34px;
      padding: 0 34px 0 38px;
      border-bottom: 1px solid #dce3ee;
      background: #ffffff;
    }

    .menu-button {
      width: 40px;
      height: 40px;
      display: grid;
      align-content: center;
      gap: 6px;
      padding: 0;
      border: 0;
      color: #071747;
      background: transparent;
    }

    .menu-button span {
      width: 26px;
      height: 3px;
      border-radius: 999px;
      background: currentColor;
    }

    .topbar h1 {
      margin: 0;
      font-size: 31px;
      letter-spacing: 0;
    }

    .user-tools {
      display: flex;
      align-items: center;
      gap: 28px;
      margin-left: auto;
    }

    .notification {
      position: relative;
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border: 0;
      color: #1f2a44;
      background: transparent;
      cursor: pointer;
    }

    .notification span {
      position: absolute;
      right: 3px;
      top: 2px;
      min-width: 18px;
      height: 18px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      color: #ffffff;
      background: #f04438;
      font-size: 12px;
      font-weight: 800;
    }

    .profile {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .avatar {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: #ffffff;
      background: #0755bf;
      font-size: 22px;
      font-weight: 800;
    }

    .profile strong,
    .profile span {
      display: block;
    }

    .profile strong {
      font-size: 18px;
    }

    .profile span {
      margin-top: 4px;
      color: #3f4b66;
      font-size: 15px;
    }

    .profile svg {
      width: 22px;
      height: 22px;
    }

    .content {
      padding: 38px 38px 32px;
    }

    .welcome h2 {
      margin: 0;
      font-size: 30px;
      letter-spacing: 0;
    }

    .welcome p {
      margin: 12px 0 0;
      color: #3f4b66;
      font-size: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(180px, 1fr));
      gap: 24px;
      margin-top: 28px;
    }

    .summary-card {
      min-height: 132px;
      display: grid;
      grid-template-columns: 62px 1fr;
      grid-template-rows: 1fr auto;
      column-gap: 24px;
      padding: 24px;
      border: 1px solid #e0e6ef;
      border-radius: 9px;
      background: #ffffff;
      box-shadow: 0 8px 18px rgba(21, 45, 84, 0.08);
    }

    .summary-icon {
      width: 62px;
      height: 62px;
      display: grid;
      place-items: center;
      border-radius: 12px;
    }

    .summary-card span {
      color: #111827;
      font-size: 16px;
    }

    .summary-card strong {
      display: block;
      margin-top: 14px;
      font-size: 36px;
      line-height: 1;
    }

    .summary-card button {
      grid-column: 1 / -1;
      justify-self: start;
      margin-top: 22px;
      padding: 0;
      border: 0;
      color: #005bd6;
      font: inherit;
      font-weight: 700;
      background: transparent;
      cursor: pointer;
    }
    .summary-card button:hover, .summary-card button:focus-visible {
      color: #003f9e;
      text-decoration: underline;
    }
    .summary-card button.active {
      color: #003f9e;
      text-decoration: underline;
    }

    .total .summary-icon { color: #045ed8; background: #eaf3ff; }
    .open .summary-icon { color: #0a8f3d; background: #dbf4e7; }
    .resolved .summary-icon { color: #5d2abb; background: #f0e9fb; }
    .closed .summary-icon { color: #e36a00; background: #fff1da; }

    .tickets-panel {
      margin-top: 26px;
      overflow: hidden;
      border: 1px solid #dfe6f0;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: 0 10px 24px rgba(21, 45, 84, 0.08);
    }

    .panel-toolbar {
      min-height: 88px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 20px 24px;
      border-bottom: 1px solid #dfe6f0;
    }

    .panel-toolbar h2 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 0;
    }

    .filters {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .search-box,
    .status-select {
      height: 50px;
      display: flex;
      align-items: center;
      border: 1px solid #cfd9e8;
      border-radius: 7px;
      background: #ffffff;
    }

    .search-box {
      width: 322px;
      gap: 12px;
      padding: 0 16px;
      color: #5f6b84;
    }

    .search-box input,
    .status-select select {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: 0;
      color: #0c173b;
      font: inherit;
      background: transparent;
    }

    .search-box input::placeholder {
      color: #71809b;
    }

    .status-select {
      width: 196px;
      padding: 0 14px;
    }

    .status-select select {
      font-weight: 700;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      min-width: 960px;
      border-collapse: collapse;
      background: #ffffff;
    }

    th,
    td {
      padding: 18px 30px;
      border-bottom: 1px solid #e3e8f0;
      color: #071747;
      font-size: 16px;
      text-align: left;
      white-space: nowrap;
    }

    th {
      color: #202638;
      font-weight: 800;
      background: #fbfcfe;
    }

    td a {
      color: #071747;
      text-decoration: none;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 7px;
      font-size: 14px;
      font-weight: 800;
    }

    .status-assigned { color: #004bd0; border: 1px solid #9cc0ff; background: #f4f8ff; }
    .status-progress { color: #0089b5; border: 1px solid #99dceb; background: #effcff; }
    .status-resolved { color: #00823a; border: 1px solid #91dcaf; background: #eefbf3; }
    .status-closed { color: #46546c; border: 1px solid #b9c3d2; background: #f5f7fa; }
    .status-open { color: #9b5a00; border: 1px solid #f1c77d; background: #fff8ed; }
    .priority-high { color: #f04438; border: 1px solid #ff9a96; background: #fff5f5; }
    .priority-medium { color: #df6b00; border: 1px solid #ffc27d; background: #fff7ed; }
    .priority-low { color: #008846; border: 1px solid #91dcaf; background: #eefbf3; }

    .row-link {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      color: #1f2a44;
    }

    .empty-state {
      padding: 34px 30px;
      color: #71809b;
      text-align: center;
    }

    .panel-footer {
      min-height: 88px;
      display: grid;
      grid-template-columns: 1fr auto 220px;
      align-items: center;
      gap: 28px;
      padding: 20px 24px;
    }

    .panel-footer > span {
      color: #7a879f;
      font-size: 16px;
    }

    .pager {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pager button {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: 1px solid transparent;
      border-radius: 7px;
      color: #071747;
      font: inherit;
      background: #ffffff;
      cursor: pointer;
    }

    .pager button:disabled {
      color: #a9b4c5;
      border-color: #dce4ef;
      cursor: default;
    }

    .pager button.active {
      color: #005bd6;
      border-color: #005bd6;
      background: #f4f8ff;
    }
    .pager button:not(:disabled):hover,
    .row-link:hover {
      border-color: #005bd6;
      border-radius: 7px;
      background: #f4f8ff;
    }
    button:focus-visible,
    a:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 3px solid rgba(0, 88, 221, .24);
      outline-offset: 2px;
    }

    .create-button {
      min-height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      border-radius: 7px;
      color: #ffffff;
      font-weight: 800;
      text-decoration: none;
      background: linear-gradient(90deg, #075ed1, #0048b8);
      box-shadow: 0 10px 18px rgba(0, 75, 184, 0.18);
    }

    @media (max-width: 1180px) {
      .dashboard-shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        height: auto;
        padding: 18px;
      }

      .side-nav {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .logout {
        min-height: 52px;
        margin-top: 14px;
        padding-top: 14px;
      }

      .stats-grid {
        grid-template-columns: repeat(2, minmax(180px, 1fr));
      }
    }

    @media (max-width: 760px) {
      .topbar,
      .panel-toolbar,
      .panel-footer {
        align-items: flex-start;
        flex-direction: column;
      }

      .topbar {
        height: auto;
        padding: 20px;
      }

      .user-tools {
        width: 100%;
        justify-content: space-between;
        margin-left: 0;
      }

      .content {
        padding: 24px 16px;
      }

      .stats-grid,
      .side-nav {
        grid-template-columns: 1fr;
      }

      .filters {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
      }

      .search-box,
      .status-select {
        width: auto;
      }

      .panel-footer {
        display: flex;
      }

      .create-button {
        width: 100%;
      }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  tickets: TicketListItem[] = [];
  searchTerm = '';
  statusFilter = 'ALL';
  page = 1;
  rowsPerPage = 5;
  sidebarCollapsed = false;

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly ticketsApi: TicketService
  ) {}

  get displayName() {
    return this.auth.user()?.fullName ?? 'Customer';
  }

  get firstName() {
    return this.displayName.split(' ')[0] || 'Customer';
  }

  get initials() {
    return this.displayName.trim().charAt(0).toUpperCase() || 'C';
  }

  get totalCount() {
    return this.tickets.length;
  }

  get openCount() {
    return this.tickets.filter(ticket => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
  }

  get resolvedCount() {
    return this.tickets.filter(ticket => ticket.status === 'RESOLVED').length;
  }

  get closedCount() {
    return this.tickets.filter(ticket => ticket.status === 'CLOSED').length;
  }

  get visibleTickets() {
    const start = (this.page - 1) * this.rowsPerPage;
    return this.filteredTickets.slice(start, start + this.rowsPerPage);
  }

  get filteredTickets() {
    const search = this.searchTerm.trim().toLowerCase();

    return this.tickets.filter(ticket => {
      const matchesStatus = this.statusFilter === 'ALL'
        || (this.statusFilter === 'OPEN' && !['RESOLVED', 'CLOSED'].includes(ticket.status))
        || ticket.status === this.statusFilter;
      const matchesSearch = !search
        || ticket.title.toLowerCase().includes(search)
        || String(ticket.id).includes(search)
        || ticket.status.toLowerCase().includes(search)
        || (ticket.priority ?? '').toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredTickets.length / this.rowsPerPage));
  }

  get pages() {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get showingStart() {
    return this.filteredTickets.length ? (this.page - 1) * this.rowsPerPage + 1 : 0;
  }

  get showingEnd() {
    return Math.min(this.page * this.rowsPerPage, this.filteredTickets.length);
  }

  ngOnInit() {
    // Customers only need their ticket list here; counts and filters are derived locally from that list.
    this.ticketsApi.list().subscribe(response => this.tickets = response.items);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    // The dashboard handles the redirect, while AuthService keeps storage and signal state consistent.
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  applyStatus(status: string, panel?: HTMLElement) {
    // Summary cards act as shortcuts into the ticket table, so reset search/paging when a card is chosen.
    this.statusFilter = status;
    this.searchTerm = '';
    this.page = 1;
    panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    return 'priority-low';
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  relativeDate(value: string) {
    const elapsedMs = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.floor(elapsedMs / 60000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  }
}
