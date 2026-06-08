import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TicketListItem } from '../../models/ticket.model';
import { AdminDataService, CategoryOption, TeamOption, UserOption } from '../../services/admin-data.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { TicketService } from '../../services/ticket.service';

type StatCard = { label: string; value: string | number; tone: string };

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="workbench">
      <aside class="sidebar" aria-label="Workspace navigation">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div><strong>AI Support Triage</strong><span>Platform</span></div>
        </div>
        @for (item of navItems; track item.path) {
          <a [routerLink]="item.path" [class.active]="item.path === currentPath">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              @if (item.icon === 'dashboard') { <path d="M4 13h6V4H4z"/><path d="M14 20h6V4h-6z"/><path d="M4 20h6v-3H4z"/> }
              @if (item.icon === 'ticket') { <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M9 10h6"/><path d="M9 15h6"/> }
              @if (item.icon === 'review') { <path d="M4 4h14v14H4z"/><path d="m8 12 2 2 4-5"/><circle cx="18" cy="18" r="3"/> }
              @if (item.icon === 'team') { <circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><path d="M11 20v-1a5 5 0 0 1 10 0v1"/> }
              @if (item.icon === 'category') { <path d="M6 6h14"/><path d="M6 12h14"/><path d="M6 18h14"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/> }
              @if (item.icon === 'agent') { <circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><circle cx="17" cy="10" r="2"/><path d="M21 20v-1a4 4 0 0 0-4-4"/> }
              @if (item.icon === 'report') { <path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 17h6"/><path d="M9 13h3"/> }
              @if (item.icon === 'sla') { <circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/> }
              @if (item.icon === 'settings') { <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21h-3v-.6a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H4v-3h.6a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.6V3h3v.6a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.6 1h.6v3h-.6a1.8 1.8 0 0 0-1.6 1z"/> }
            </svg>
            <span>{{ item.label }}</span>
            @if (item.badge) {
              <b class="nav-badge">{{ item.badge }}</b>
            }
          </a>
        }
        <button class="logout" type="button" (click)="logout()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>
          Logout
        </button>
      </aside>

      <section class="main">
        <header class="topbar">
          <div>
            <h1>{{ title }}</h1>
            <p>{{ subtitle }}</p>
          </div>
          <div class="top-actions">
            <label class="search">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input name="search" [(ngModel)]="searchTerm" placeholder="Search">
            </label>
            <div class="profile">
              <div class="avatar">{{ initials }}</div>
              <div><strong>{{ auth.user()?.fullName || 'User' }}</strong><span>{{ auth.user()?.role || 'workspace' }}</span></div>
            </div>
          </div>
        </header>

        <section class="cards">
          @for (card of statCards; track card.label) {
            <article [class]="card.tone">
              <div class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M9 12h6"/></svg></div>
              <div><span>{{ card.label }}</span><strong>{{ card.value }}</strong></div>
            </article>
          }
        </section>

        @if (mode === 'settings') {
          <section class="panel">
            <header><h2>Settings</h2></header>
            <div class="table-wrap"><table>
              <thead><tr><th>Setting</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td>API Base</td><td>http://localhost:5000/api</td></tr>
                <tr><td>Signed in as</td><td>{{ auth.user()?.fullName || 'User' }}</td></tr>
                <tr><td>Role</td><td>{{ auth.user()?.role || 'unknown' }}</td></tr>
                <tr><td>Configured Teams</td><td>{{ teams.length }}</td></tr>
                <tr><td>Configured Categories</td><td>{{ categories.length }}</td></tr>
              </tbody>
            </table></div>
          </section>
        } @else if (mode === 'categories') {
          <section class="panel">
            <header><h2>Categories</h2><button type="button" (click)="addCategory()">Add Category</button></header>
            <div class="table-wrap"><table>
              <thead><tr><th>Name</th><th>Default Team</th><th>Actions</th></tr></thead>
              <tbody>
                @for (category of filteredCategories; track category.id) {
                  <tr>
                    <td><strong>{{ category.name }}</strong></td>
                    <td><span class="soft-pill">{{ category.defaultTeamName || 'Unmapped' }}</span></td>
                    <td class="actions"><button type="button" (click)="editCategory(category)">Edit</button><button type="button" class="danger" (click)="deleteCategory(category)">Delete</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="3" class="empty-state">No categories match your search.</td></tr>
                }
              </tbody>
            </table></div>
          </section>
        } @else if (mode === 'agents') {
          <section class="panel">
            <header><h2>Agents</h2></header>
            <div class="table-wrap"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Open Tickets</th><th>Resolved Today</th><th>Avg Resolution</th></tr></thead>
              <tbody>
                @for (agent of filteredAgents; track agent.id) {
                  <tr>
                    <td><div class="person"><span>{{ initialsFor(agent.fullName) }}</span><strong>{{ agent.fullName }}</strong></div></td>
                    <td>{{ agent.email }}</td>
                    <td>{{ agentMetric(agent.id, 'openTickets') }}</td>
                    <td>{{ agentMetric(agent.id, 'resolvedToday') }}</td>
                    <td>{{ agentMetric(agent.id, 'avgResolutionHours') }}h</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty-state">No agents match your search.</td></tr>
                }
              </tbody>
            </table></div>
          </section>
        } @else {
          <section class="panel">
            <header>
              <h2>{{ tableTitle }}</h2>
              <label class="select">
                <select name="status" [(ngModel)]="statusFilter">
                  <option value="">All Statuses</option>
                  <option>NEW</option><option>CLASSIFIED</option><option>PRIORITIZED</option><option>ASSIGNED</option><option>IN_PROGRESS</option><option>WAITING_CUSTOMER</option><option>RESOLVED</option><option>CLOSED</option>
                </select>
              </label>
            </header>
            <div class="table-wrap"><table>
              <thead><tr><th>ID</th><th>Title</th><th>Customer</th><th>Category</th><th>Priority</th><th>Status</th><th>SLA</th><th>Created</th></tr></thead>
              <tbody>
                @for (ticket of filteredTickets; track ticket.id) {
                  <tr>
                    <td><a [routerLink]="ticketLink(ticket)">#TKT-{{ ticket.id }}</a></td>
                    <td>{{ ticket.title }}</td>
                    <td><strong>{{ ticket.customerName }}</strong><span>{{ ticket.customerEmail }}</span></td>
                    <td><span class="soft-pill">{{ ticket.categoryName || ticket.aiPredictedCategory || 'Pending' }}</span></td>
                    <td><span class="pill" [class]="priorityClass(ticket.priority)">{{ ticket.priority || 'PENDING' }}</span></td>
                    <td><span class="status-pill" [class]="statusClass(ticket.status)">{{ prettyStatus(ticket.status) }}</span></td>
                    <td [class.overdue]="isOverdue(ticket)">{{ slaText(ticket) }}</td>
                    <td>{{ formatDate(ticket.createdAt) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="8" class="empty-state">No tickets match your filters.</td></tr>
                }
              </tbody>
            </table></div>
          </section>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#08173d; background:#f5f8fc; }
    .workbench { min-height:100vh; display:grid; grid-template-columns:292px minmax(0,1fr); background:#f5f8fc; }
    .sidebar { position:sticky; top:0; height:100vh; display:flex; flex-direction:column; gap:12px; padding:30px 22px; color:#fff; background:linear-gradient(180deg,#002d5e 0%,#00264f 48%,#00376e 100%); box-sizing:border-box; }
    .sidebar-brand { display:flex; align-items:center; gap:15px; margin-bottom:34px; }
    .sidebar-brand strong, .sidebar-brand span { display:block; line-height:1.22; }
    .sidebar-brand strong { font-size:20px; font-weight:900; }
    .sidebar-brand span { margin-top:5px; font-size:19px; color:rgba(255,255,255,.9); }
    .bot-mark { position:relative; width:56px; height:56px; flex:0 0 auto; border:4px solid #fff; border-bottom-color:transparent; border-radius:50%; }
    .bot-mark::before, .bot-mark::after { content:""; position:absolute; top:21px; width:9px; height:22px; border-radius:999px; background:#fff; }
    .bot-mark::before { left:-8px; } .bot-mark::after { right:-8px; }
    .bot-mark span { position:absolute; left:10px; top:17px; width:30px; height:23px; border-radius:12px; background:#fff; }
    .bot-mark i { position:absolute; top:26px; width:6px; height:6px; border-radius:50%; background:#0057d8; z-index:1; }
    .bot-mark i:first-of-type { left:19px; } .bot-mark i:last-of-type { right:19px; }
    .sidebar a, .sidebar button { min-height:54px; display:flex; align-items:center; gap:15px; padding:0 14px; border:0; border-radius:8px; color:#fff; background:transparent; text-decoration:none; font:inherit; font-weight:800; cursor:pointer; }
    .sidebar a span { flex:1; }
    .nav-badge { min-width:24px; height:24px; display:grid; place-items:center; border-radius:999px; color:#fff; background:#ef242e; font-size:13px; line-height:1; }
    .sidebar a.active { background:linear-gradient(135deg,#0877df,#0056d5); box-shadow:0 14px 24px rgba(0,18,52,.2); }
    .sidebar svg { width:23px; height:23px; flex:0 0 auto; }
    .logout { margin-top:auto; padding-top:22px; border-top:1px solid rgba(255,255,255,.16); border-radius:0; }
    .main { min-width:0; }
    .topbar { min-height:104px; display:flex; align-items:center; justify-content:space-between; gap:24px; padding:0 36px; border-bottom:1px solid #dce4ef; background:#fff; box-sizing:border-box; }
    h1, h2, p { margin:0; }
    h1 { font-size:34px; line-height:1.1; letter-spacing:0; }
    h2 { font-size:24px; letter-spacing:0; }
    p { margin-top:8px; color:#5c6882; }
    svg { fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:2; }
    .top-actions { display:flex; align-items:center; gap:22px; margin-left:auto; }
    .search, .select { min-height:48px; display:flex; align-items:center; border:1px solid #cbd6e7; border-radius:8px; background:#fff; box-sizing:border-box; }
    .search { width:310px; gap:12px; padding:0 15px; }
    .search svg { width:22px; height:22px; color:#56637e; }
    input, select { width:100%; border:0; outline:0; color:#08173d; font:inherit; background:transparent; }
    .profile { display:flex; align-items:center; gap:13px; padding-left:20px; border-left:1px solid #d6deea; }
    .avatar, .person span { display:grid; place-items:center; border-radius:50%; color:#fff; background:linear-gradient(135deg,#3762a9,#0e7c74); font-weight:900; }
    .avatar { width:50px; height:50px; }
    .profile strong, .profile span { display:block; }
    .profile span { margin-top:5px; color:#5c6882; font-size:13px; text-transform:capitalize; }
    .cards { display:grid; grid-template-columns:repeat(4,minmax(170px,1fr)); gap:20px; padding:28px 36px 0; }
    .cards article, .panel { border:1px solid #dce4ef; border-radius:10px; background:#fff; box-shadow:0 8px 20px rgba(30,50,85,.08); }
    .cards article { min-height:132px; display:grid; grid-template-columns:58px 1fr; align-items:center; gap:17px; padding:22px; box-sizing:border-box; }
    .card-icon { width:56px; height:56px; display:grid; place-items:center; border-radius:12px; color:#0058dd; background:#eaf3ff; }
    .card-icon svg { width:29px; height:29px; }
    .cards article.sla .card-icon, .cards article.overdue .card-icon { color:#d21f32; background:#ffe8ea; }
    .cards article.open .card-icon { color:#0a8a44; background:#e8f8f0; }
    .cards article.resolved .card-icon { color:#6b2dd5; background:#eee7ff; }
    .cards span { color:#5c6882; font-weight:800; }
    .cards strong { display:block; margin-top:9px; font-size:32px; line-height:1; }
    .panel { overflow:hidden; margin:26px 36px 36px; }
    .panel header { min-height:82px; display:flex; align-items:center; justify-content:space-between; gap:18px; padding:0 24px; border-bottom:1px solid #dce4ef; }
    .panel header button, .actions button { min-height:40px; padding:0 16px; border:0; border-radius:7px; color:#fff; background:#075ed1; font-weight:900; cursor:pointer; }
    .actions { display:flex; gap:10px; }
    .actions .danger { background:#d21f32; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; min-width:900px; border-collapse:collapse; }
    th, td { padding:19px 24px; border-bottom:1px solid #e1e8f2; text-align:left; vertical-align:middle; }
    th { color:#22304d; font-size:14px; font-weight:900; background:#fbfcfe; }
    td { font-size:15px; }
    td span { display:block; margin-top:5px; color:#5c6882; font-size:13px; }
    td a { color:#0058dd; font-weight:900; text-decoration:none; }
    .pill { display:inline-flex; min-height:30px; align-items:center; padding:0 12px; border-radius:6px; color:#0058dd; border:1px solid #9bbbfb; background:#f3f7ff; font-size:13px; font-weight:900; }
    .priority-critical, .priority-high { color:#d21f32; border-color:#ff7f89; background:#fff4f4; }
    .priority-medium { color:#df6900; border-color:#ffba70; background:#fff7ed; }
    .priority-low { color:#0a8a44; border-color:#8bd3a8; background:#eef9f0; }
    .status-pill, .soft-pill { display:inline-flex; min-height:30px; align-items:center; padding:0 12px; border-radius:6px; font-size:13px; font-weight:900; }
    .status-pill { color:#0058dd; border:1px solid #9bbbfb; background:#f3f7ff; }
    .status-resolved, .status-closed { color:#0a8a44; border-color:#8bd3a8; background:#eef9f0; }
    .status-waiting { color:#df6900; border-color:#ffba70; background:#fff7ed; }
    .soft-pill { color:#34425e; border:1px solid #d5deeb; background:#f8fafd; }
    .person { display:flex; align-items:center; gap:12px; }
    .person span { width:38px; height:38px; font-size:13px; }
    .overdue { color:#d21f32; font-weight:900; }
    .empty-state { padding:42px 24px; color:#67738d; text-align:center; }
    @media (max-width: 1180px) { .workbench { grid-template-columns:1fr; } .sidebar { position:static; height:auto; } .cards { grid-template-columns:repeat(2,minmax(170px,1fr)); } }
    @media (max-width: 760px) { .topbar { align-items:flex-start; flex-direction:column; padding:20px; } .top-actions { width:100%; align-items:stretch; flex-direction:column; margin-left:0; } .profile { padding-left:0; border-left:0; } .search { width:100%; } .cards { grid-template-columns:1fr; padding:18px; } .panel { margin:18px; } .panel header { align-items:flex-start; flex-direction:column; padding:18px; } .select { width:100%; } }
  `]
})
export class WorkbenchComponent implements OnInit {
  tickets: TicketListItem[] = [];
  categories: CategoryOption[] = [];
  teams: TeamOption[] = [];
  agents: UserOption[] = [];
  agentMetrics: any[] = [];
  stats: any;
  searchTerm = '';
  statusFilter = '';

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly ticketsApi: TicketService,
    private readonly adminData: AdminDataService,
    private readonly dashboard: DashboardService
  ) {}

  get currentPath() {
    return this.router.url.split('?')[0];
  }

  get isAdmin() {
    return this.auth.user()?.role === 'admin';
  }

  get initials() {
    return this.initialsFor(this.auth.user()?.fullName ?? 'User');
  }

  logout() {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  get mode() {
    const path = this.currentPath;
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/sla')) return 'sla';
    if (path.includes('/settings')) return 'settings';
    return 'tickets';
  }

  get title() {
    if (this.mode === 'categories') return 'Categories';
    if (this.mode === 'agents') return 'Agents';
    if (this.mode === 'reports') return 'Reports';
    if (this.mode === 'sla') return 'SLA Monitoring';
    if (this.mode === 'settings') return 'Settings';
    return this.isAdmin ? 'Tickets' : 'My Tickets';
  }

  get subtitle() {
    if (this.mode === 'reports') return 'Operational performance and ticket trends.';
    if (this.mode === 'sla') return 'Tickets ordered by SLA risk and overdue state.';
    if (this.mode === 'categories') return 'Manage routing categories and default teams.';
    if (this.mode === 'agents') return 'Monitor agent workload and performance.';
    if (this.mode === 'settings') return 'Review local prototype configuration.';
    return 'Search, inspect, and route support tickets.';
  }

  get tableTitle() {
    return this.mode === 'sla' ? 'SLA Risk Queue' : 'Tickets';
  }

  get navItems() {
    return this.isAdmin
      ? [
          { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
          { label: 'Tickets', path: '/admin/tickets', icon: 'ticket' },
          { label: 'Review Queue', path: '/admin/review-queue', icon: 'review', badge: 5 },
          { label: 'Agents', path: '/admin/agents', icon: 'agent' },
          { label: 'Teams', path: '/admin/teams', icon: 'team' },
          { label: 'Categories', path: '/admin/categories', icon: 'category' },
          { label: 'SLA Monitoring', path: '/admin/sla-monitoring', icon: 'sla' },
          { label: 'Reports', path: '/admin/reports', icon: 'report' },
          { label: 'Settings', path: '/admin/settings', icon: 'settings' }
        ]
      : [
          { label: 'Dashboard', path: '/agent/dashboard', icon: 'dashboard' },
          { label: 'My Tickets', path: '/agent/tickets', icon: 'ticket' },
          { label: 'SLA Alerts', path: '/agent/sla-alerts', icon: 'sla' },
          { label: 'Reports', path: '/agent/reports', icon: 'report' }
        ];
  }

  get statCards(): StatCard[] {
    const overdue = this.tickets.filter(ticket => this.isOverdue(ticket)).length;
    return [
      { label: 'Total Tickets', value: this.stats?.totalTickets ?? this.tickets.length, tone: 'total' },
      { label: 'Open Tickets', value: this.stats?.openTickets ?? this.tickets.filter(ticket => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length, tone: 'open' },
      { label: 'Resolved Today', value: this.stats?.resolvedToday ?? 0, tone: 'resolved' },
      { label: this.mode === 'sla' ? 'Overdue' : 'SLA Compliance', value: this.mode === 'sla' ? overdue : `${this.stats?.slaCompliancePercent ?? 100}%`, tone: this.mode === 'sla' ? 'overdue' : 'sla' }
    ];
  }

  get filteredTickets() {
    const search = this.searchTerm.trim().toLowerCase();
    return this.tickets
      .filter(ticket => !this.statusFilter || ticket.status === this.statusFilter)
      .filter(ticket => {
        if (!search) return true;
        return ticket.title.toLowerCase().includes(search)
          || ticket.customerName.toLowerCase().includes(search)
          || ticket.customerEmail.toLowerCase().includes(search)
          || String(ticket.id).includes(search);
      })
      .sort((left, right) => {
        if (this.mode === 'sla') return new Date(left.slaDueAt ?? '9999-12-31').getTime() - new Date(right.slaDueAt ?? '9999-12-31').getTime();
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }

  get filteredCategories() {
    const search = this.searchTerm.trim().toLowerCase();
    return this.categories.filter(category => !search || category.name.toLowerCase().includes(search) || category.defaultTeamName?.toLowerCase().includes(search));
  }

  get filteredAgents() {
    const search = this.searchTerm.trim().toLowerCase();
    return this.agents.filter(agent => !search || agent.fullName.toLowerCase().includes(search) || agent.email.toLowerCase().includes(search));
  }

  ngOnInit() {
    forkJoin({
      ticketPage: this.ticketsApi.list({ pageSize: 100 }),
      categories: this.adminData.categories(),
      teams: this.adminData.teams(),
      agents: this.adminData.agents(),
      stats: this.dashboard.stats(),
      agentMetrics: this.isAdmin ? this.dashboard.agents() : this.dashboard.stats()
    }).subscribe(data => {
      this.tickets = data.ticketPage.items;
      this.categories = data.categories;
      this.teams = data.teams;
      this.agents = data.agents;
      this.stats = data.stats;
      this.agentMetrics = Array.isArray(data.agentMetrics) ? data.agentMetrics : [];
    });
  }

  addCategory() {
    const name = window.prompt('Category name');
    if (!name?.trim()) return;
    const teamId = this.pickTeamId();
    if (!teamId) return;
    this.adminData.createCategory(name, teamId).subscribe(category => this.categories = [...this.categories, category]);
  }

  editCategory(category: CategoryOption) {
    const name = window.prompt('Category name', category.name);
    if (!name?.trim()) return;
    const teamId = this.pickTeamId(category.defaultTeamId);
    if (!teamId) return;
    this.adminData.updateCategory(category.id, name, teamId).subscribe(updated => {
      this.categories = this.categories.map(item => item.id === updated.id ? updated : item);
    });
  }

  deleteCategory(category: CategoryOption) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    this.adminData.deleteCategory(category.id).subscribe(() => this.categories = this.categories.filter(item => item.id !== category.id));
  }

  ticketLink(ticket: TicketListItem) {
    return [this.isAdmin ? '/admin/tickets' : '/agent/tickets', ticket.id];
  }

  agentMetric(agentId: string, key: string) {
    return this.agentMetrics.find(metric => metric.agentId === agentId)?.[key] ?? 0;
  }

  initialsFor(name: string) {
    return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }

  priorityClass(priority?: string) {
    if (priority === 'CRITICAL') return 'priority-critical';
    if (priority === 'HIGH') return 'priority-high';
    if (priority === 'MEDIUM') return 'priority-medium';
    return 'priority-low';
  }

  statusClass(status: string) {
    if (status === 'RESOLVED') return 'status-resolved';
    if (status === 'CLOSED') return 'status-closed';
    if (status === 'WAITING_CUSTOMER') return 'status-waiting';
    return '';
  }

  prettyStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  isOverdue(ticket: TicketListItem) {
    return !!ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(ticket.status);
  }

  slaText(ticket: TicketListItem) {
    if (!ticket.slaDueAt) return 'Pending';
    if (this.isOverdue(ticket)) return 'Overdue';
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ticket.slaDueAt));
  }

  private pickTeamId(current?: number) {
    const listing = this.teams.map(team => `${team.id}: ${team.name}`).join('\n');
    const value = window.prompt(`Default team id:\n${listing}`, String(current ?? this.teams[0]?.id ?? ''));
    return Number(value);
  }
}
