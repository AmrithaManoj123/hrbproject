import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminDataService, CategoryOption, TeamOption, UserOption } from '../../services/admin-data.service';

type TeamRow = {
  id: number;
  key: string;
  name: string;
  description: string;
  category: string;
  lead: string;
  agents: number;
  status: 'Active' | 'Inactive';
  tone: string;
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="teams-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <aside class="sidebar" aria-label="Admin navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div>
            <strong>AI Support Triage</strong>
            <span>Platform</span>
          </div>
        </div>

        <nav class="side-nav">
          @for (item of navItems; track item.label) {
            <a [class.active]="item.label === 'Teams'" [routerLink]="item.path">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                @if (item.icon === 'dashboard') { <path d="M4 13h6V4H4z"/><path d="M14 20h6V4h-6z"/><path d="M4 20h6v-3H4z"/> }
                @if (item.icon === 'ticket') { <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M9 10h6"/><path d="M9 15h6"/> }
                @if (item.icon === 'plus-ticket') { <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M12 9v6"/><path d="M9 12h6"/> }
                @if (item.icon === 'teams') { <circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><path d="M11 20v-1a5 5 0 0 1 10 0v1"/> }
                @if (item.icon === 'list') { <path d="M6 6h14"/><path d="M6 12h14"/><path d="M6 18h14"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/> }
                @if (item.icon === 'review') { <path d="M4 4h14v14H4z"/><path d="m8 12 2 2 4-5"/><circle cx="18" cy="18" r="3"/> }
                @if (item.icon === 'agents') { <circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><circle cx="17" cy="10" r="2"/><path d="M21 20v-1a4 4 0 0 0-4-4"/> }
                @if (item.icon === 'sla') { <circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/> }
                @if (item.icon === 'report') { <path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 17h6"/><path d="M9 13h3"/> }
                @if (item.icon === 'settings') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21h-3v-.6a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H4v-3h.6a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.6V3h3v.6a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.6 1h.6v3h-.6a1.8 1.8 0 0 0-1.6 1z"/> }
              </svg>
              {{ item.label }}
              @if (item.badge) { <span class="nav-badge">{{ item.badge }}</span> }
            </a>
          }
        </nav>

        <button class="logout" type="button" (click)="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="teams-main">
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()"><span></span><span></span><span></span></button>
          <div>
            <h1>Teams</h1>
            <p>Manage your teams and their settings.</p>
          </div>
          <div class="top-actions">
            <button class="notification" type="button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
              <span>3</span>
            </button>
            <div class="profile">
              <div class="avatar">{{ initials }}</div>
              <div>
                <strong>{{ displayName }}</strong>
                <span>Administrator</span>
              </div>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        <div class="content">
          <div class="actions-row">
            <button class="add-button" type="button" (click)="addTeam()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              Add Team
            </button>
          </div>

          <section class="teams-card">
            <div class="filters-row">
              <label class="search-box">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
                <input name="search" [(ngModel)]="searchTerm" placeholder="Search teams...">
              </label>
              <div class="filter-actions">
                <label class="status-filter">
                  <span class="sr-only">Status</span>
                  <select name="status" [(ngModel)]="statusFilter">
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <button class="filter-button" type="button" (click)="clearFilters()" [disabled]="!hasActiveFilters">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>
                  Reset
                </button>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Description</th>
                    <th>Default Category</th>
                    <th>Team Lead</th>
                    <th>Agents</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (team of visibleTeams; track team.id) {
                    <tr>
                      <td>
                        <div class="team-cell">
                          <span class="team-avatar" [class]="team.tone">{{ team.key }}</span>
                          <strong>{{ team.name }}</strong>
                        </div>
                      </td>
                      <td class="description">{{ team.description }}</td>
                      <td><span class="category-pill" [class]="team.tone">{{ team.category }}</span></td>
                      <td>
                        <div class="lead-cell">
                          <span class="lead-avatar">{{ leadInitials(team.lead) }}</span>
                          {{ team.lead }}
                        </div>
                      </td>
                      <td>{{ team.agents }}</td>
                      <td><span class="status-pill" [class.inactive]="team.status === 'Inactive'"><i></i>{{ team.status }}</span></td>
                      <td>
                        <div class="row-actions">
                          <button class="edit" type="button" aria-label="Edit team" (click)="editTeam(team)">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="m16.5 3.5 4 4L8 20H4v-4z"/></svg>
                          </button>
                          <button class="delete" type="button" aria-label="Delete team" (click)="deleteTeam(team)">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty-state">No teams match your filters.</td></tr>
                  }
                </tbody>
              </table>
            </div>

            <footer class="table-footer">
              <span>Showing {{ visibleTeams.length ? 1 : 0 }} to {{ visibleTeams.length }} of {{ teams.length }} teams</span>
              <div class="pager">
                <button type="button" disabled aria-label="Previous page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>
                <button class="active" type="button">1</button>
                <button type="button" disabled aria-label="Next page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #071747; background: #f6f9fd; }
    .teams-shell { min-height: 100vh; display: grid; grid-template-columns: 250px minmax(0, 1fr); background: #f6f9fd; transition: grid-template-columns 220ms ease; }
    .teams-shell.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 30px 14px 28px; color: #fff; background: linear-gradient(180deg, #003a75 0%, #002f65 50%, #003b74 100%); box-sizing: border-box; overflow: hidden; transition: transform 220ms ease, opacity 180ms ease; }
    .teams-shell.sidebar-collapsed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .sidebar-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 42px; padding-left: 6px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.25; }
    .sidebar-brand strong { font-size: 18px; font-weight: 900; }
    .sidebar-brand span { margin-top: 6px; color: rgba(255,255,255,.9); font-size: 18px; }
    .bot-mark { position: relative; width: 52px; height: 52px; flex: 0 0 auto; border: 3px solid #1d75ff; border-bottom-color: transparent; border-radius: 50%; background: #fff; }
    .bot-mark::before, .bot-mark::after { content: ""; position: absolute; top: 19px; width: 8px; height: 21px; border-radius: 999px; background: #1d75ff; }
    .bot-mark::before { left: -7px; } .bot-mark::after { right: -7px; }
    .bot-mark span { position: absolute; left: 10px; top: 16px; width: 28px; height: 22px; border-radius: 11px; background: #dcecff; }
    .bot-mark i { position: absolute; top: 24px; width: 5px; height: 5px; border-radius: 50%; background: #0057d8; z-index: 1; }
    .bot-mark i:first-of-type { left: 18px; } .bot-mark i:last-of-type { right: 18px; }
    .side-nav { display: grid; gap: 10px; }
    .side-nav a, .logout { min-height: 50px; display: flex; align-items: center; gap: 16px; padding: 0 14px; border: 0; border-radius: 8px; color: #fff; font-size: 16px; font-weight: 800; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { background: linear-gradient(135deg, #0876dc, #0056c8); box-shadow: 0 14px 22px rgba(0, 20, 64, .2); }
    .nav-badge { min-width: 24px; height: 24px; display: grid; place-items: center; margin-left: auto; border-radius: 50%; background: #ff2734; font-size: 12px; }
    .logout { margin-top: auto; min-height: 58px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.17); border-radius: 0; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg { width: 23px; height: 23px; }
    .teams-main { min-width: 0; }
    .topbar { height: 120px; display: flex; align-items: center; gap: 30px; padding: 0 34px; border-bottom: 1px solid #dce3ee; background: #fff; box-sizing: border-box; }
    .menu-button { width: 38px; height: 38px; display: grid; align-content: center; gap: 6px; padding: 0; border: 0; color: #071747; background: transparent; cursor: pointer; }
    .menu-button span { width: 25px; height: 3px; border-radius: 999px; background: currentColor; }
    .topbar h1 { margin: 0; font-size: 32px; line-height: 1.15; letter-spacing: 0; }
    .topbar p { margin: 12px 0 0; color: #4d5b76; font-size: 16px; }
    .top-actions { display: flex; align-items: center; gap: 24px; margin-left: auto; }
    .notification { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 0; color: #071747; background: transparent; cursor: pointer; }
    .notification svg { width: 24px; height: 24px; }
    .notification span { position: absolute; right: 3px; top: 2px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #f02836; font-size: 12px; font-weight: 900; }
    .profile { display: flex; align-items: center; gap: 14px; }
    .avatar { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #0755bf; font-size: 22px; font-weight: 900; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 17px; line-height: 1.15; }
    .profile span { margin-top: 5px; color: #4d5b76; font-size: 14px; }
    .profile svg { width: 21px; height: 21px; }
    .content { padding: 26px 28px; }
    .actions-row { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .add-button { min-width: 152px; height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; border: 0; border-radius: 7px; color: #fff; font-size: 16px; font-weight: 900; background: #0458c8; box-shadow: 0 10px 18px rgba(0,75,184,.18); cursor: pointer; }
    .add-button svg { width: 23px; height: 23px; }
    .teams-card { overflow: hidden; border: 1px solid #dce4ef; border-radius: 10px; background: #fff; box-shadow: 0 10px 24px rgba(21,45,84,.08); }
    .filters-row { min-height: 92px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 24px; border-bottom: 1px solid #e0e7f1; }
    .search-box { width: 316px; height: 46px; display: flex; align-items: center; gap: 14px; padding: 0 14px; border: 1px solid #cbd6e7; border-radius: 6px; color: #071747; background: #fff; box-sizing: border-box; }
    .search-box svg { width: 22px; height: 22px; }
    .search-box input { width: 100%; min-width: 0; border: 0; outline: 0; color: #071747; font: inherit; background: transparent; }
    .search-box input::placeholder { color: #60708d; }
    .filter-actions { display: flex; align-items: center; gap: 26px; }
    .status-filter, .filter-button { height: 46px; border: 1px solid #cbd6e7; border-radius: 6px; background: #fff; }
    .status-filter { width: 162px; display: flex; align-items: center; padding: 0 12px; box-sizing: border-box; }
    .status-filter select { width: 100%; border: 0; outline: 0; color: #071747; font: inherit; font-weight: 800; background: transparent; }
    .filter-button { min-width: 122px; display: inline-flex; align-items: center; justify-content: center; gap: 12px; color: #071747; font: inherit; font-weight: 800; cursor: pointer; }
    .filter-button:disabled { color: #9aa6ba; cursor: default; background: #f7f9fc; }
    .filter-button svg { width: 22px; height: 22px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; min-width: 1050px; border-collapse: collapse; }
    th, td { padding: 27px 24px; border-bottom: 1px solid #e0e7f1; color: #071747; text-align: left; white-space: nowrap; }
    th { padding-top: 20px; padding-bottom: 20px; font-size: 14px; font-weight: 900; background: #fbfcfe; }
    td { font-size: 15px; }
    .team-cell, .lead-cell { display: flex; align-items: center; gap: 16px; }
    .team-avatar { width: 40px; height: 40px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 50%; font-size: 17px; font-weight: 900; }
    .team-cell strong { font-size: 15px; }
    .description { max-width: 250px; color: #3f4b66; line-height: 1.55; white-space: normal; }
    .lead-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #334155, #0f766e); font-size: 12px; font-weight: 900; }
    .category-pill, .status-pill { display: inline-flex; align-items: center; min-height: 32px; padding: 0 13px; border-radius: 6px; font-size: 14px; font-weight: 800; }
    .status-pill { gap: 9px; color: #167a38; border: 1px solid #a9dfc0; background: #effbf4; }
    .status-pill i { width: 10px; height: 10px; border-radius: 50%; background: #24b326; }
    .status-pill.inactive { color: #526074; border-color: #c8d1df; background: #f7f8fa; }
    .status-pill.inactive i { background: #71809b; }
    .finance { color: #005bd6; border-color: #a9c9ff; background: #eaf3ff; }
    .technical { color: #6d2fd5; border-color: #d1b7ff; background: #f1eaff; }
    .account { color: #0a8f58; border-color: #a8dfc7; background: #e8f8f0; }
    .product { color: #f47c00; border-color: #ffd38a; background: #fff3dd; }
    .operations { color: #0a65d8; border-color: #b9d5ff; background: #edf5ff; }
    .hr { color: #e91e63; border-color: #ffbdd5; background: #fff0f6; }
    .row-actions { display: flex; align-items: center; gap: 24px; }
    .row-actions button { width: 28px; height: 28px; display: grid; place-items: center; padding: 0; border: 0; background: transparent; cursor: pointer; }
    .row-actions svg { width: 22px; height: 22px; }
    .row-actions .edit { color: #005bd6; }
    .row-actions .delete { color: #ff1f2d; }
    .empty-state { padding: 42px 24px; color: #60708d; text-align: center; }
    .table-footer { min-height: 90px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 0 24px; color: #60708d; font-size: 15px; }
    .pager { display: flex; align-items: center; gap: 16px; }
    .pager button { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid #d7e0ed; border-radius: 6px; color: #071747; font: inherit; background: #fff; cursor: pointer; }
    .pager button svg { width: 19px; height: 19px; }
    .pager button:disabled { color: #a7b2c5; cursor: default; }
    .pager button.active { color: #005bd6; border-color: #005bd6; background: #f4f8ff; }
    .add-button:hover, .filter-button:not(:disabled):hover, .pager button:not(:disabled):hover { border-color: #005bd6; background: #f4f8ff; }
    .add-button:hover { color: #fff; background: #064aab; }
    .row-actions button:hover { border-radius: 6px; background: #f3f7ff; }
    button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible { outline: 3px solid rgba(0, 88, 221, .24); outline-offset: 2px; }
    @media (max-width: 1180px) {
      .teams-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .side-nav { grid-template-columns: repeat(3, minmax(150px, 1fr)); display: grid; }
      .logout { margin-top: 16px; padding-top: 16px; }
    }
    @media (max-width: 760px) {
      .topbar { height: auto; align-items: flex-start; flex-direction: column; padding: 20px; }
      .top-actions { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 16px; }
      .side-nav { grid-template-columns: 1fr; }
      .filters-row { align-items: stretch; flex-direction: column; padding: 18px; }
      .search-box, .status-filter, .filter-button { width: 100%; }
      .filter-actions { flex-direction: column; gap: 12px; }
      .table-footer { align-items: flex-start; flex-direction: column; padding: 18px; }
    }
  `]
})
export class TeamsComponent implements OnInit {
  searchTerm = '';
  statusFilter = 'All';
  sidebarCollapsed = false;

  readonly navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { label: 'Tickets', icon: 'ticket', path: '/admin/tickets' },
    { label: 'Review Queue', icon: 'review', badge: 5, path: '/admin/review-queue' },
    { label: 'Agents', icon: 'agents', path: '/admin/agents' },
    { label: 'Teams', icon: 'teams', path: '/admin/teams' },
    { label: 'Categories', icon: 'list', path: '/admin/categories' },
    { label: 'SLA Monitoring', icon: 'sla', path: '/admin/sla-monitoring' },
    { label: 'Reports', icon: 'report', path: '/admin/reports' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' }
  ];

  teams: TeamRow[] = [];
  private categories: CategoryOption[] = [];
  private agents: UserOption[] = [];

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly adminData: AdminDataService
  ) {}

  ngOnInit() {
    // Teams, categories, and agents are loaded together because the table combines all three concepts.
    this.loadTeams();
  }

  get displayName() {
    return this.auth.user()?.fullName ?? 'Admin User';
  }

  get initials() {
    return this.displayName.trim().charAt(0).toUpperCase() || 'A';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    // Teams owns the logout button action; AuthService owns the session reset.
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  get visibleTeams() {
    const search = this.searchTerm.trim().toLowerCase();
    return this.teams.filter(team => {
      const statusMatches = this.statusFilter === 'All' || team.status === this.statusFilter;
      const searchMatches = !search
        || team.name.toLowerCase().includes(search)
        || team.description.toLowerCase().includes(search)
        || team.category.toLowerCase().includes(search)
        || team.lead.toLowerCase().includes(search);
      return statusMatches && searchMatches;
    });
  }

  get hasActiveFilters() {
    return !!this.searchTerm.trim() || this.statusFilter !== 'All';
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'All';
  }

  leadInitials(name: string) {
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  addTeam() {
    const name = window.prompt('Team name');
    if (!name?.trim()) return;
    const description = window.prompt('Team description', '') ?? '';
    this.adminData.createTeam(name, description).subscribe(() => this.loadTeams());
  }

  editTeam(team: TeamRow) {
    const name = window.prompt('Team name', team.name);
    if (!name?.trim()) return;
    const description = window.prompt('Team description', team.description) ?? '';
    this.adminData.updateTeam(team.id, name, description).subscribe(() => this.loadTeams());
  }

  deleteTeam(team: TeamRow) {
    if (!window.confirm(`Delete ${team.name}?`)) return;
    this.adminData.deleteTeam(team.id).subscribe(() => this.loadTeams());
  }

  private loadTeams() {
    // Fetch related admin data in parallel so team rows can show category and lead names together.
    forkJoin({
      teams: this.adminData.teams(),
      categories: this.adminData.categories(),
      agents: this.adminData.agents()
    }).subscribe(({ teams, categories, agents }) => {
      this.categories = categories;
      this.agents = agents;
      this.teams = teams.map((team, index) => this.toRow(team, index));
    });
  }

  private toRow(team: TeamOption, index: number): TeamRow {
    const category = this.categories.find(item => item.defaultTeamId === team.id);
    const lead = this.agents[index % Math.max(this.agents.length, 1)]?.fullName ?? 'Unassigned';
    const tone = this.toneFor(category?.name ?? team.name);
    return {
      id: team.id,
      key: this.keyFor(team.name),
      name: team.name,
      description: team.description || 'No description provided',
      category: category?.name ?? 'Unmapped',
      lead,
      agents: team.memberCount,
      status: 'Active',
      tone
    };
  }

  private keyFor(name: string) {
    return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  private toneFor(value: string) {
    const normalized = value.toLowerCase();
    if (normalized.includes('billing') || normalized.includes('finance')) return 'finance';
    if (normalized.includes('technical') || normalized.includes('engineering')) return 'technical';
    if (normalized.includes('account')) return 'account';
    if (normalized.includes('feature') || normalized.includes('product')) return 'product';
    if (normalized.includes('hr')) return 'hr';
    return 'operations';
  }
}
