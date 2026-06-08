import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TicketDetail } from '../../models/ticket.model';
import { AdminDataService, CategoryOption, TeamOption, UserOption } from '../../services/admin-data.service';
import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <main class="agent-detail">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="bot-mark" aria-hidden="true"><span></span><i></i><i></i></div>
          <div><strong>AI Support Triage</strong><span>Platform</span></div>
        </div>
        <a [routerLink]="homePath"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>Dashboard</a>
        <a class="active" [routerLink]="ticketsPath"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>{{ isAdmin ? 'Tickets' : 'My Tickets' }}</a>
        <button type="button" (click)="logout()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3"/><path d="M9 12h12"/><path d="m17 8 4 4-4 4"/></svg>Logout</button>
      </aside>

      <section class="content">
        <header class="topbar">
          <a [routerLink]="ticketsPath" class="back" aria-label="Back to tickets"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></a>
          <h1>{{ isAdmin ? 'Admin Ticket Detail' : 'Agent Ticket Detail' }}</h1>
          <div class="profile"><div class="avatar">{{ initials }}</div><span>{{ auth.user()?.fullName || 'Agent' }}</span></div>
        </header>

        @if (ticket) {
          <section class="hero-card">
            <div>
              <h2>{{ ticket.title }}</h2>
              <p>Ticket ID: #TKT-{{ ticket.id }} · Created {{ formatDate(ticket.createdAt) }}</p>
            </div>
            <div class="badges">
              <span class="pill" [class]="priorityClass(ticket.priority)">{{ ticket.priority || 'PENDING' }}</span>
              <span class="pill status-pill">{{ prettyStatus(ticket.status) }}</span>
            </div>
          </section>

          <section class="grid">
            <article class="panel">
              <h3>AI Classification</h3>
              <dl>
                <dt>Category</dt><dd>{{ ticket.category?.name || ticket.aiPredictedCategory || 'Pending' }}</dd>
                <dt>Confidence</dt><dd>{{ confidence }}%</dd>
                <dt>Assigned Agent</dt><dd>{{ ticket.assignedAgent?.fullName || 'Unassigned' }}</dd>
                <dt>SLA Due</dt><dd>{{ ticket.slaDueAt ? formatDate(ticket.slaDueAt) : 'Pending' }}</dd>
              </dl>
            </article>

            <article class="panel controls">
              <h3>Agent Actions</h3>
              <label>Status
                <select name="status" [(ngModel)]="status">
                  <option>IN_PROGRESS</option>
                  <option>WAITING_CUSTOMER</option>
                  <option>RESOLVED</option>
                </select>
              </label>
              <button type="button" (click)="changeStatus()">Update Status</button>

              <label>Priority
                <select name="priority" [(ngModel)]="priority">
                  <option>CRITICAL</option>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
              </label>
              <button type="button" (click)="changePriority()">Override Priority</button>

              <label>Category
                <select name="category" [(ngModel)]="categoryId">
                  @for (category of categories; track category.id) {
                    <option [ngValue]="category.id">{{ category.name }}</option>
                  }
                </select>
              </label>
              <button type="button" (click)="changeCategory()">Override Category</button>

              <div class="assign-row">
                <label>Team
                  <select name="team" [(ngModel)]="teamId">
                    @for (team of teams; track team.id) {
                      <option [ngValue]="team.id">{{ team.name }}</option>
                    }
                  </select>
                </label>
                <label>Agent
                  <select name="agent" [(ngModel)]="agentId">
                    @for (agent of agents; track agent.id) {
                      <option [ngValue]="agent.id">{{ agent.fullName }}</option>
                    }
                  </select>
                </label>
              </div>
              <button type="button" (click)="reassign()">Reassign Ticket</button>
              @if (message) { <p class="message">{{ message }}</p> }
            </article>
          </section>

          <section class="grid lower">
            <article class="panel">
              <h3>Description</h3>
              <p>{{ ticket.description }}</p>

              <h3>Attachments</h3>
              @for (attachment of ticket.attachments; track attachment.id) {
                <a class="attachment" [href]="attachment.downloadUrl" target="_blank">{{ attachment.fileName }} <span>{{ formatFileSize(attachment.fileSize) }}</span></a>
              } @empty {
                <p class="muted">No attachments uploaded.</p>
              }
            </article>

            <article class="panel">
              <h3>Comments</h3>
              @for (comment of ticket.comments; track comment.id) {
                <div class="comment" [class.internal]="comment.isInternal">
                  <strong>{{ comment.authorName }}</strong>
                  <p>{{ comment.message }}</p>
                  @if (comment.isInternal) { <span>Internal note</span> }
                </div>
              } @empty {
                <p class="muted">No comments yet.</p>
              }

              <div class="ai-reply">
                <div>
                  <h3>AI Suggested Reply</h3>
                  <p class="muted">Powered by Gemini 2.5 Flash through OpenRouter.</p>
                </div>
                <button type="button" [disabled]="generatingReply" (click)="generateReply()">
                  {{ generatingReply ? 'Generating...' : 'Generate AI Reply' }}
                </button>
                @if (suggestedReply) {
                  <textarea name="suggestedReply" [(ngModel)]="suggestedReply"></textarea>
                  <button type="button" class="secondary-button" (click)="useSuggestedReply()">Use as Comment</button>
                }
                @if (aiError) { <p class="error-message">{{ aiError }}</p> }
              </div>

              <form class="comment-form" (ngSubmit)="addComment()">
                <textarea name="comment" [(ngModel)]="comment" placeholder="Type a reply or internal note..."></textarea>
                <label class="check"><input type="checkbox" name="internal" [(ngModel)]="isInternal"> Internal note</label>
                <button type="submit">Add Comment</button>
              </form>
            </article>
          </section>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:#08173d; background:#f5f8fc; }
    .agent-detail { min-height:100vh; display:grid; grid-template-columns:292px minmax(0,1fr); }
    .sidebar { position:sticky; top:0; height:100vh; display:flex; flex-direction:column; gap:14px; padding:30px 22px; color:#fff; background:linear-gradient(180deg,#002d5e 0%,#00264f 48%,#00376e 100%); box-sizing:border-box; }
    .sidebar-brand { display:flex; align-items:center; gap:15px; margin-bottom:36px; }
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
    .sidebar a.active { background:linear-gradient(135deg,#0877df,#0056d5); box-shadow:0 14px 24px rgba(0,18,52,.2); }
    .sidebar button { margin-top:auto; padding-top:22px; border-top:1px solid rgba(255,255,255,.16); border-radius:0; }
    svg { fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:2; }
    .sidebar svg { width:23px; height:23px; flex:0 0 auto; }
    .content { min-width:0; }
    .topbar { height:104px; display:flex; align-items:center; gap:24px; padding:0 36px; border-bottom:1px solid #dce4ef; background:#fff; box-sizing:border-box; }
    .back { width:42px; height:42px; display:grid; place-items:center; border:1px solid #cbd6e7; border-radius:8px; color:#08173d; text-decoration:none; background:#fff; }
    .back svg { width:22px; height:22px; }
    h1 { margin:0; font-size:32px; letter-spacing:0; }
    .profile { display:flex; align-items:center; gap:12px; margin-left:auto; font-weight:800; }
    .avatar { width:48px; height:48px; display:grid; place-items:center; border-radius:50%; color:#fff; background:linear-gradient(135deg,#3762a9,#0e7c74); font-weight:900; }
    .hero-card, .panel { border:1px solid #dce4ef; border-radius:10px; background:#fff; box-shadow:0 10px 24px rgba(30,50,85,.08); }
    .hero-card { display:flex; justify-content:space-between; gap:20px; margin:28px 36px 20px; padding:28px 30px; }
    h2, h3, p { margin-top:0; }
    h2 { margin-bottom:10px; font-size:28px; letter-spacing:0; }
    h3 { margin-bottom:18px; font-size:20px; letter-spacing:0; }
    .hero-card p { color:#5c6882; }
    .badges { display:flex; align-items:center; gap:12px; }
    .pill { display:inline-flex; min-height:32px; align-items:center; padding:0 14px; border-radius:6px; color:#0058dd; border:1px solid #9bbbfb; background:#f3f7ff; font-weight:900; }
    .priority-critical, .priority-high { color:#d21f32; border-color:#ff7f89; background:#fff4f4; }
    .priority-medium { color:#df6900; border-color:#ffba70; background:#fff7ed; }
    .priority-low { color:#0a8a44; border-color:#8bd3a8; background:#eef9f0; }
    .status-pill { color:#0058dd; border-color:#9bbbfb; background:#f3f7ff; }
    .grid { display:grid; grid-template-columns:1fr 1.2fr; gap:20px; margin:0 36px 20px; }
    .lower { grid-template-columns:1fr 1fr; }
    .panel { padding:26px; }
    dl { display:grid; grid-template-columns:160px 1fr; gap:12px; }
    dt { color:#63708b; } dd { margin:0; font-weight:800; }
    .controls { display:grid; gap:14px; }
    label { display:grid; gap:7px; font-weight:800; }
    select, textarea { width:100%; box-sizing:border-box; border:1px solid #cbd6e7; border-radius:7px; color:#08173d; font:inherit; background:#fff; }
    select { min-height:42px; padding:0 10px; }
    textarea { min-height:96px; padding:12px; resize:vertical; }
    button { min-height:42px; border:0; border-radius:7px; color:#fff; background:#075ed1; font-weight:900; cursor:pointer; }
    .assign-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .attachment { display:flex; justify-content:space-between; margin:8px 0; padding:12px; border-radius:7px; color:#0058dd; background:#f5f8ff; text-decoration:none; font-weight:800; }
    .attachment span, .muted { color:#63708b; font-weight:500; }
    .comment { padding:13px; border:1px solid #dce4ef; border-radius:8px; margin-bottom:10px; }
    .comment.internal { background:#fff8ed; }
    .comment p { margin:7px 0; }
    .comment span, .message { color:#0b7a3a; font-weight:800; }
    .comment-form { display:grid; gap:10px; margin-top:14px; }
    .check { display:flex; align-items:center; gap:8px; }
    .ai-reply { display:grid; gap:12px; margin:18px 0; padding:16px; border:1px solid #bdd0f3; border-radius:8px; background:#f7faff; }
    .ai-reply h3 { margin-bottom:6px; }
    .ai-reply button:disabled { opacity:.7; cursor:wait; }
    .secondary-button { color:#075ed1; border:1px solid #9bbbfb; background:#fff; }
    .error-message { margin:0; color:#b42318; font-weight:800; }
    @media (max-width: 980px) { .agent-detail { grid-template-columns:1fr; } .grid,.lower,.hero-card { grid-template-columns:1fr; margin-left:16px; margin-right:16px; } .sidebar { position:static; height:auto; } .topbar { height:auto; align-items:flex-start; flex-direction:column; padding:20px; } .profile { margin-left:0; } }
  `]
})
export class AgentTicketDetailComponent implements OnInit {
  ticket?: TicketDetail;
  categories: CategoryOption[] = [];
  teams: TeamOption[] = [];
  agents: UserOption[] = [];
  status = 'IN_PROGRESS';
  priority = 'MEDIUM';
  categoryId?: number;
  teamId?: number;
  agentId?: string;
  comment = '';
  isInternal = true;
  message = '';
  suggestedReply = '';
  generatingReply = false;
  aiError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly tickets: TicketService,
    private readonly adminData: AdminDataService,
    public readonly auth: AuthService
  ) {}

  get confidence() {
    return Math.round((this.ticket?.aiConfidenceScore ?? 0) * 100);
  }

  get initials() {
    return (this.auth.user()?.fullName ?? 'Agent').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  get isAdmin() {
    return this.auth.user()?.role === 'admin';
  }

  get homePath() {
    return this.isAdmin ? '/admin/dashboard' : '/agent/dashboard';
  }

  get ticketsPath() {
    return this.isAdmin ? '/admin/tickets' : '/agent/tickets';
  }

  ngOnInit() {
    // Load lookup data first so status/category/team controls are ready when the ticket arrives.
    forkJoin({
      categories: this.adminData.categories(),
      teams: this.adminData.teams(),
      agents: this.adminData.agents()
    }).subscribe(data => {
      this.categories = data.categories;
      this.teams = data.teams;
      this.agents = data.agents;
      this.load();
    });
  }

  logout() {
    // This page decides where the user goes after logout; AuthService clears the stored identity.
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  changeStatus() {
    // Status changes are followed by a reload so the detail page reflects backend workflow rules.
    if (!this.ticket) return;
    this.tickets.changeStatus(this.ticket.id, this.status).subscribe(() => this.afterAction('Status updated.'));
  }

  changePriority() {
    if (!this.ticket) return;
    this.tickets.changePriority(this.ticket.id, this.priority).subscribe(() => this.afterAction('Priority updated.'));
  }

  changeCategory() {
    if (!this.ticket || !this.categoryId) return;
    this.tickets.changeCategory(this.ticket.id, this.categoryId).subscribe(() => this.afterAction('Category updated.'));
  }

  reassign() {
    if (!this.ticket || !this.teamId || !this.agentId) return;
    this.tickets.assign(this.ticket.id, this.agentId, this.teamId).subscribe(() => this.afterAction('Ticket reassigned.'));
  }

  addComment() {
    if (!this.ticket || !this.comment.trim()) return;
    this.tickets.addComment(this.ticket.id, this.comment.trim(), this.isInternal).subscribe(() => {
      this.comment = '';
      this.afterAction('Comment added.');
    });
  }

  generateReply() {
    if (!this.ticket) return;
    this.aiError = '';
    this.generatingReply = true;
    this.tickets.suggestReply(this.ticket.id).subscribe({
      next: response => {
        this.suggestedReply = response.reply;
        this.generatingReply = false;
      },
      error: error => {
        this.aiError = error?.error?.error ?? 'Could not generate an AI reply.';
        this.generatingReply = false;
      }
    });
  }

  useSuggestedReply() {
    this.comment = this.suggestedReply;
    this.isInternal = false;
  }

  prettyStatus(status: string) {
    return status.replace(/_/g, ' ');
  }

  priorityClass(priority?: string) {
    if (priority === 'CRITICAL') return 'priority-critical';
    if (priority === 'HIGH') return 'priority-high';
    if (priority === 'MEDIUM') return 'priority-medium';
    return 'priority-low';
  }

  formatDate(value: string) {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  }

  formatFileSize(size: number) {
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private afterAction(message: string) {
    this.message = message;
    this.load();
  }

  private load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tickets.get(id).subscribe(ticket => {
      this.ticket = ticket;
      this.status = ticket.status === 'ASSIGNED' ? 'IN_PROGRESS' : ticket.status;
      this.priority = ticket.priority ?? 'MEDIUM';
      this.categoryId = ticket.category?.id ?? this.categories[0]?.id;
      this.teamId = ticket.assignedTeam?.id ?? this.teams[0]?.id;
      this.agentId = ticket.assignedAgent?.id ?? this.agents[0]?.id;
    });
  }
}
