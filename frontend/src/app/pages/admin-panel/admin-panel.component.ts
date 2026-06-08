import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

type StatCard = {
  label: string;
  value: string;
  note: string;
  tone: string;
  trend: 'up' | 'down';
};

@Component({
  standalone: true,
  imports: [RouterLink, BaseChartDirective, MatButtonModule],
  template: `
    <main class="admin-shell" [class.sidebar-collapsed]="sidebarCollapsed">
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
            <a [class.active]="item.active" [routerLink]="item.path">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                @if (item.icon === 'home') { <path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/> }
                @if (item.icon === 'ticket') { <path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M9 9h6"/><path d="M9 15h6"/> }
                @if (item.icon === 'review') { <path d="M4 4h14v14H4z"/><path d="m8 12 2 2 4-5"/><circle cx="18" cy="18" r="3"/> }
                @if (item.icon === 'agent') { <circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1"/><circle cx="17" cy="10" r="2"/><path d="M21 20v-1a4 4 0 0 0-4-4"/> }
                @if (item.icon === 'team') { <circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><path d="M11 20v-1a5 5 0 0 1 10 0v1"/> }
                @if (item.icon === 'category') { <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/> }
                @if (item.icon === 'sla') { <circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/> }
                @if (item.icon === 'report') { <path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 17h6"/><path d="M9 13h3"/> }
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

      <section class="admin-main">
        <header class="topbar">
          <button
            class="menu-button"
            type="button"
            aria-label="Toggle navigation"
            [attr.aria-expanded]="!sidebarCollapsed"
            (click)="toggleSidebar()"><span></span><span></span><span></span></button>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, Admin! Here's an overview of your support system.</p>
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
          <div class="date-row">
            <button class="date-button" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M4 6h16v16H4z"/><path d="M4 10h16"/></svg>
              May 6 - May 12, 2024
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </div>

          <section class="stats-grid" aria-label="Admin summary">
            @for (card of statCards; track card.label) {
              <article class="summary-card" [class]="card.tone">
                <div class="summary-icon">
                  @if (card.tone === 'total') { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M9 12h6"/></svg> }
                  @if (card.tone === 'open') { <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m8 12 3 3 5-6"/></svg> }
                  @if (card.tone === 'sla') { <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 2"/></svg> }
                  @if (card.tone === 'resolution') { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6 4 4 6-8"/><path d="M15 7h5v5"/></svg> }
                  @if (card.tone === 'agents') { <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><circle cx="17" cy="10" r="2.5"/><path d="M21 20v-1a4 4 0 0 0-4-4"/></svg> }
                </div>
                <div>
                  <span>{{ card.label }}</span>
                  <strong>{{ card.value }}</strong>
                  <small [class.down]="card.trend === 'down'">{{ card.note }}</small>
                </div>
              </article>
            }
          </section>

          <section class="charts-grid">
            <article class="chart-card line-card">
              <header><h2>Tickets Over Time</h2><button mat-button type="button">Last 7 Days <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button></header>
              <canvas class="chart-canvas" baseChart [data]="ticketsLineData" [options]="lineOptions" [type]="'line'" aria-label="Tickets over time chart"></canvas>
              <div class="legend"><i></i> Tickets</div>
            </article>

            <article class="chart-card donut-card">
              <h2>Tickets by Category</h2>
              <div class="donut-layout">
                <canvas class="donut-canvas" baseChart [data]="categoryDoughnutData" [options]="doughnutOptions" [type]="'doughnut'" aria-label="Tickets by category chart"></canvas>
                <ul>
                  @for (item of categoryBreakdown; track item.name) {
                    <li><i [style.background]="item.color"></i><span>{{ item.name }} ({{ item.percent }}%)</span><strong>{{ item.count }}</strong></li>
                  }
                </ul>
              </div>
            </article>

            <article class="chart-card donut-card">
              <h2>Tickets by Priority</h2>
              <div class="donut-layout">
                <canvas class="donut-canvas" baseChart [data]="priorityDoughnutData" [options]="doughnutOptions" [type]="'doughnut'" aria-label="Tickets by priority chart"></canvas>
                <ul>
                  @for (item of priorityBreakdown; track item.name) {
                    <li><i [style.background]="item.color"></i><span>{{ item.name }} ({{ item.percent }}%)</span><strong>{{ item.count }}</strong></li>
                  }
                </ul>
              </div>
            </article>

            <article class="chart-card line-card compliance">
              <h2>SLA Compliance Over Time</h2>
              <canvas class="chart-canvas" baseChart [data]="slaLineData" [options]="percentLineOptions" [type]="'line'" aria-label="SLA compliance chart"></canvas>
              <div class="legend green"><i></i> SLA Compliance (%)</div>
            </article>
          </section>

          <section class="tables-grid">
            <article class="table-card workload-card">
              <header><h2>Agent Workload</h2><button type="button" routerLink="/admin/agents">View All Agents</button></header>
              <table>
                <thead><tr><th>Agent</th><th>Team</th><th>Open Tickets</th><th>In Progress</th><th>Resolved Today</th><th>SLA Compliance</th></tr></thead>
                <tbody>
                  @for (agent of workloadRows; track agent.name) {
                    <tr>
                      <td><span class="agent-photo">{{ agent.initials }}</span><strong>{{ agent.name }}</strong></td>
                      <td>{{ agent.team }}</td>
                      <td class="danger">{{ agent.open }}</td>
                      <td>{{ agent.progress }}</td>
                      <td class="success">{{ agent.resolved }}</td>
                      <td><span class="score">{{ agent.sla }}%</span></td>
                    </tr>
                  }
                </tbody>
              </table>
              <footer><span>Showing 1 to 5 of {{ agents.length || 24 }} agents</span><div class="pager"><button type="button" disabled>‹</button><button class="active" type="button">1</button><button type="button" routerLink="/admin/agents">2</button><button type="button" routerLink="/admin/agents">3</button><button type="button" routerLink="/admin/agents">›</button></div></footer>
            </article>

            <article class="table-card review-card">
              <header><h2>Review Queue (Needs Admin Review)</h2><button type="button" routerLink="/admin/review-queue">View All</button></header>
              <table>
                <thead><tr><th>ID</th><th>Title</th><th>Predicted Category</th><th>Confidence</th><th>Created On</th><th>Action</th></tr></thead>
                <tbody>
                  @for (ticket of reviewRows; track ticket.id) {
                    <tr>
                      <td>#TKT-{{ ticket.id }}</td>
                      <td>{{ ticket.title }}</td>
                      <td>(Unknown)</td>
                      <td>{{ ticket.confidence }}%</td>
                      <td>{{ ticket.date }}</td>
                      <td><button class="review-button" type="button" [routerLink]="['/admin/tickets', ticket.id]">Review</button></td>
                    </tr>
                  }
                </tbody>
              </table>
              <footer><span>Showing 1 to 5 of 5 tickets</span><div class="pager"><button type="button" disabled>‹</button><button class="active" type="button">1</button><button type="button" disabled>›</button></div></footer>
            </article>
          </section>

          <section class="bottom-grid">
            <article class="alert-panel">
              <header><h2>SLA Breach Alerts</h2><button type="button" routerLink="/admin/sla-monitoring">View All</button></header>
              <div class="alert-row">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>
                <div><strong>12 tickets breached SLA</strong><span>Oldest breach: 2h 35m ago</span></div>
                <b>›</b>
              </div>
            </article>

            <article class="alert-panel">
              <header><h2>Top Overdue Tickets</h2><button type="button" routerLink="/admin/sla-monitoring">View All</button></header>
              <div class="alert-row">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17h16"/><path d="M7 17v-5a5 5 0 0 1 10 0v5"/><path d="M9 12h6"/></svg>
                <div><strong>2 tickets are overdue</strong><span>Oldest overdue: 1h 20m</span></div>
                <b>›</b>
              </div>
            </article>

            <article class="quick-panel">
              <h2>System Quick Actions</h2>
              <div class="quick-actions">
                @for (action of quickActions; track action.label) {
                  <button type="button" [routerLink]="action.path">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      @if (action.icon === 'agent') { <circle cx="10" cy="8" r="3"/><path d="M4 20v-1a6 6 0 0 1 12 0v1"/><path d="M19 8v6"/><path d="M16 11h6"/> }
                      @if (action.icon === 'team') { <circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20v-1a5 5 0 0 1 10 0v1"/><path d="M11 20v-1a5 5 0 0 1 10 0v1"/> }
                      @if (action.icon === 'category') { <path d="m12 3 8 5v8l-8 5-8-5V8z"/><path d="M12 8v8"/><path d="M8 12h8"/> }
                      @if (action.icon === 'report') { <path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 14h6"/><path d="M9 18h6"/> }
                    </svg>
                    {{ action.label }}
                  </button>
                }
              </div>
            </article>
          </section>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #08173d; background: #f5f8fc; }
    .admin-shell { min-height: 100vh; display: grid; grid-template-columns: 280px minmax(0, 1fr); background: #f5f8fc; transition: grid-template-columns 220ms ease; }
    .admin-shell.sidebar-collapsed { grid-template-columns: 0 minmax(0, 1fr); }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 24px 18px 28px; color: #fff; background: linear-gradient(180deg, #002d5e 0%, #00264f 46%, #00376e 100%); box-sizing: border-box; overflow: hidden; transition: transform 220ms ease, opacity 180ms ease; }
    .admin-shell.sidebar-collapsed .sidebar { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .sidebar-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 40px; padding-left: 6px; }
    .sidebar-brand strong, .sidebar-brand span { display: block; line-height: 1.22; }
    .sidebar-brand strong { font-size: 20px; font-weight: 900; }
    .sidebar-brand span { margin-top: 5px; font-size: 20px; color: rgba(255,255,255,.94); }
    .bot-mark { position: relative; width: 58px; height: 58px; flex: 0 0 auto; border: 4px solid #1d75ff; border-bottom-color: transparent; border-radius: 50%; background: #fff; }
    .bot-mark::before, .bot-mark::after { content: ""; position: absolute; top: 22px; width: 9px; height: 23px; border-radius: 999px; background: #1d75ff; }
    .bot-mark::before { left: -8px; } .bot-mark::after { right: -8px; }
    .bot-mark span { position: absolute; left: 11px; top: 18px; width: 30px; height: 24px; border-radius: 12px; background: #dcecff; }
    .bot-mark i { position: absolute; top: 27px; width: 6px; height: 6px; border-radius: 50%; background: #0057d8; z-index: 1; }
    .bot-mark i:first-of-type { left: 20px; } .bot-mark i:last-of-type { right: 20px; }
    .side-nav { display: grid; gap: 12px; }
    .side-nav a, .logout { min-height: 54px; display: flex; align-items: center; gap: 18px; padding: 0 16px; border: 0; border-radius: 8px; color: #fff; font-size: 17px; font-weight: 800; text-decoration: none; background: transparent; cursor: pointer; }
    .side-nav a.active { background: linear-gradient(135deg, #0877df, #0056d5); box-shadow: 0 14px 24px rgba(0, 18, 52, .2); }
    .nav-alert { min-width: 26px; height: 26px; display: grid; place-items: center; margin-left: auto; border-radius: 50%; background: #ff3038; font-size: 13px; }
    .logout { margin-top: auto; padding-top: 28px; border-top: 1px solid rgba(255,255,255,.18); border-radius: 0; }
    svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
    .side-nav svg, .logout svg { width: 24px; height: 24px; }
    .admin-main { min-width: 0; }
    .topbar { height: 96px; display: flex; align-items: center; gap: 34px; padding: 0 38px; border-bottom: 1px solid #d9e1ec; background: #fff; box-sizing: border-box; }
    .menu-button { width: 38px; height: 38px; display: grid; align-content: center; gap: 6px; padding: 0; border: 0; color: #08173d; background: transparent; cursor: pointer; }
    .menu-button span { width: 24px; height: 3px; border-radius: 999px; background: currentColor; }
    .topbar h1 { margin: 0; font-size: 29px; line-height: 1.1; letter-spacing: 0; }
    .topbar p { margin: 16px 0 0; color: #17213e; font-size: 15px; }
    .top-actions { display: flex; align-items: center; gap: 25px; margin-left: auto; }
    .notification { position: relative; width: 42px; height: 42px; display: grid; place-items: center; border: 0; color: #08173d; background: transparent; cursor: pointer; }
    .notification svg { width: 24px; height: 24px; }
    .notification span { position: absolute; right: 3px; top: 2px; min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #f1192c; font-size: 12px; font-weight: 800; }
    .profile { display: flex; align-items: center; gap: 13px; padding-left: 22px; border-left: 1px solid #d6deea; }
    .avatar { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(135deg, #285ea8, #0a7d72); font-size: 17px; font-weight: 900; }
    .profile strong, .profile span { display: block; }
    .profile strong { font-size: 16px; line-height: 1.1; }
    .profile span { margin-top: 6px; color: #4f5e7a; font-size: 13px; }
    .profile svg { width: 21px; height: 21px; }
    .content { padding: 24px 24px 28px; }
    .date-row { display: flex; justify-content: flex-end; margin: -60px 0 22px; }
    .date-button { min-width: 242px; height: 48px; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 0 15px; border: 1px solid #cbd6e7; border-radius: 8px; color: #08173d; font-weight: 800; background: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(30,50,85,.04); }
    .date-button svg { width: 20px; height: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(5, minmax(170px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .summary-card { min-height: 150px; display: grid; grid-template-columns: 72px 1fr; gap: 18px; align-items: center; padding: 20px 22px; border: 1px solid #dce4ef; border-radius: 9px; background: #fff; box-shadow: 0 8px 20px rgba(30,50,85,.08); box-sizing: border-box; }
    .summary-icon { width: 68px; height: 68px; display: grid; place-items: center; border-radius: 12px; }
    .summary-icon svg { width: 34px; height: 34px; }
    .summary-card span { display: block; color: #293450; font-size: 15px; }
    .summary-card strong { display: block; margin-top: 15px; font-size: 33px; line-height: 1; }
    .summary-card small { display: block; margin-top: 16px; color: #009b45; font-size: 13px; font-weight: 800; }
    .summary-card small.down { color: #f1192c; }
    .total .summary-icon { color: #075de2; background: #e9f1ff; }
    .open .summary-icon { color: #168635; background: #e5f7e8; }
    .sla .summary-icon { color: #f47c00; background: #fff0dc; }
    .resolution .summary-icon { color: #6b2dd5; background: #eee7ff; }
    .agents .summary-icon { color: #0a918c; background: #e2f7f5; }
    .charts-grid { display: grid; grid-template-columns: 1.12fr 1.03fr 1fr 1.12fr; gap: 12px; margin-bottom: 16px; }
    .chart-card, .table-card, .alert-panel, .quick-panel { border: 1px solid #dce4ef; border-radius: 9px; background: #fff; box-shadow: 0 8px 20px rgba(30,50,85,.07); }
    .chart-card { min-height: 330px; padding: 18px 20px; box-sizing: border-box; }
    .chart-card header, .table-card header, .alert-panel header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    h2 { margin: 0; font-size: 15px; letter-spacing: 0; }
    .chart-card header button, .table-card header button, .alert-panel header button { min-height: 32px; border: 1px solid #d6dfec; border-radius: 6px; color: #0058dd; font-weight: 800; background: #fff; cursor: pointer; }
    .chart-card header button svg { width: 14px; height: 14px; margin-left: 4px; }
    .chart-canvas { width: 100% !important; height: 255px !important; margin-top: 13px; }
    .legend { display: flex; align-items: center; justify-content: center; gap: 8px; color: #0d1836; font-size: 12px; }
    .legend i { width: 15px; height: 6px; border-radius: 999px; background: #0b74ff; }
    .legend.green i { background: #1aa34a; }
    .donut-layout { display: grid; grid-template-columns: 190px 1fr; align-items: center; gap: 18px; margin-top: 28px; }
    .donut-canvas { width: 150px !important; height: 150px !important; justify-self: center; }
    .donut-card ul { display: grid; gap: 16px; margin: 0; padding: 0; list-style: none; }
    .donut-card li { display: grid; grid-template-columns: 10px 1fr auto; gap: 10px; align-items: center; color: #0d1836; font-size: 12px; }
    .donut-card li i { width: 10px; height: 10px; border-radius: 50%; }
    .donut-card li strong { font-size: 12px; }
    .tables-grid { display: grid; grid-template-columns: 1fr 1.14fr; gap: 12px; margin-bottom: 16px; }
    .table-card { overflow: hidden; }
    .table-card header { min-height: 48px; padding: 0 16px; border-bottom: 1px solid #e0e7f1; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 13px 18px; border-bottom: 1px solid #e0e7f1; text-align: left; white-space: nowrap; }
    th { color: #0d1836; font-size: 12px; font-weight: 900; background: #fbfcfe; }
    td { color: #0d1836; font-size: 12px; }
    td strong { font-size: 12px; }
    .agent-photo { width: 27px; height: 27px; display: inline-grid; place-items: center; margin-right: 8px; border-radius: 50%; color: #fff; background: #a86d42; font-size: 10px; font-weight: 900; vertical-align: middle; }
    .danger { color: #f1192c; font-weight: 900; }
    .success { color: #009b45; font-weight: 900; }
    .score { display: inline-flex; min-height: 25px; align-items: center; padding: 0 10px; border-radius: 999px; color: #00863c; background: #dff8e7; font-weight: 900; }
    .review-button { min-height: 29px; padding: 0 16px; border: 1px solid #0065ff; border-radius: 5px; color: #0058dd; font-weight: 900; background: #fff; cursor: pointer; }
    .table-card footer { min-height: 57px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; color: #63708b; font-size: 13px; }
    .pager { display: flex; align-items: center; gap: 10px; }
    .pager button { width: 31px; height: 31px; border: 1px solid transparent; border-radius: 6px; color: #08173d; background: #fff; cursor: pointer; }
    .pager button.active { color: #0058dd; border-color: #0058dd; background: #f3f7ff; }
    .pager button:disabled { color: #9aa6ba; border-color: #dce4ef; cursor: default; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr 1.82fr; gap: 12px; }
    .alert-panel, .quick-panel { padding: 18px; box-sizing: border-box; }
    .alert-panel header button { border: 0; padding: 0; }
    .alert-row { min-height: 72px; display: grid; grid-template-columns: 32px 1fr 18px; align-items: center; gap: 14px; margin-top: 18px; padding: 0 16px; border: 1px solid #ffd0d0; border-radius: 7px; color: #f1192c; background: #fff4f4; }
    .alert-row svg { width: 26px; height: 26px; }
    .alert-row strong, .alert-row span { display: block; }
    .alert-row span { margin-top: 6px; color: #6b3c3c; font-size: 13px; }
    .alert-row b { font-size: 28px; }
    .quick-actions { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 14px; margin-top: 24px; }
    .quick-actions button { min-height: 66px; display: flex; align-items: center; justify-content: center; gap: 12px; border: 1px solid #cbd6e7; border-radius: 8px; color: #08173d; font-weight: 900; background: #fff; cursor: pointer; }
    .quick-actions svg { width: 25px; height: 25px; color: #0058dd; }
    .chart-card header button:hover, .table-card header button:hover, .alert-panel header button:hover, .review-button:hover, .pager button:not(:disabled):hover, .quick-actions button:hover { border-color: #0058dd; background: #f3f7ff; }
    button:focus-visible, a:focus-visible { outline: 3px solid rgba(0, 88, 221, .24); outline-offset: 2px; }
    @media (max-width: 1350px) {
      .admin-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .side-nav { grid-template-columns: repeat(3, minmax(150px, 1fr)); }
      .logout { min-height: 50px; margin-top: 16px; padding-top: 16px; }
      .date-row { margin-top: 0; }
      .stats-grid { grid-template-columns: repeat(3, minmax(170px, 1fr)); }
      .charts-grid { grid-template-columns: repeat(2, minmax(280px, 1fr)); }
      .tables-grid, .bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 760px) {
      .topbar { height: auto; align-items: flex-start; flex-direction: column; padding: 20px; }
      .top-actions { width: 100%; justify-content: space-between; margin-left: 0; }
      .content { padding: 16px; }
      .side-nav, .stats-grid, .charts-grid, .quick-actions { grid-template-columns: 1fr; }
      .date-button { width: 100%; }
      .donut-layout { grid-template-columns: 1fr; }
      .table-card { overflow-x: auto; }
      .table-card footer { align-items: flex-start; flex-direction: column; gap: 12px; padding: 14px 18px; }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  stats: any;
  agents: any[] = [];
  sidebarCollapsed = false;

  readonly navItems = [
    { label: 'Dashboard', icon: 'home', active: true, path: '/admin/dashboard' },
    { label: 'Tickets', icon: 'ticket', path: '/admin/tickets' },
    { label: 'Review Queue', icon: 'review', badge: 5, path: '/admin/review-queue' },
    { label: 'Agents', icon: 'agent', path: '/admin/agents' },
    { label: 'Teams', icon: 'team', path: '/admin/teams' },
    { label: 'Categories', icon: 'category', path: '/admin/categories' },
    { label: 'SLA Monitoring', icon: 'sla', path: '/admin/sla-monitoring' },
    { label: 'Reports', icon: 'report', path: '/admin/reports' },
    { label: 'Settings', icon: 'settings', path: '/admin/settings' }
  ];

  readonly quickActions = [
    { label: 'Add Agent', icon: 'agent', path: '/admin/agents' },
    { label: 'Add Team', icon: 'team', path: '/admin/teams' },
    { label: 'Add Category', icon: 'category', path: '/admin/categories' },
    { label: 'Generate Report', icon: 'report', path: '/admin/reports' }
  ];

  readonly categoryBreakdown = [
    { name: 'Billing', percent: 30, count: 374, color: '#0b74ff' },
    { name: 'Technical', percent: 28, count: 349, color: '#16b6c4' },
    { name: 'Account', percent: 18, count: 225, color: '#2cc6bb' },
    { name: 'Feature Request', percent: 12, count: 150, color: '#7b8ca4' },
    { name: 'General', percent: 12, count: 150, color: '#ffb01f' }
  ];

  readonly priorityBreakdown = [
    { name: 'Critical', percent: 8, count: 100, color: '#f12b2b' },
    { name: 'High', percent: 29, count: 362, color: '#ff8b1a' },
    { name: 'Medium', percent: 42, count: 524, color: '#ffba21' },
    { name: 'Low', percent: 21, count: 262, color: '#2cbf62' }
  ];

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#e0e7f1' }, ticks: { color: '#0d1836', font: { size: 11 } } },
      y: { min: 0, grid: { color: '#e0e7f1' }, ticks: { color: '#0d1836', font: { size: 11 } } }
    },
    elements: { line: { tension: 0.35, borderWidth: 4 }, point: { radius: 4, hoverRadius: 5 } }
  };

  readonly percentLineOptions: ChartConfiguration<'line'>['options'] = {
    ...this.lineOptions,
    scales: {
      x: this.lineOptions?.scales?.['x'],
      y: {
        min: 0,
        max: 100,
        grid: { color: '#e0e7f1' },
        ticks: { color: '#0d1836', callback: value => `${value}%`, font: { size: 11 } }
      }
    }
  };

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  };

  readonly ticketsLineData: ChartConfiguration<'line'>['data'] = {
    labels: ['May 6', 'May 7', 'May 8', 'May 9', 'May 10', 'May 11', 'May 12'],
    datasets: [{
      data: [95, 210, 160, 245, 310, 355, 398],
      borderColor: '#0b74ff',
      backgroundColor: 'rgba(11, 116, 255, .12)',
      pointBackgroundColor: '#0b74ff',
      fill: true
    }]
  };

  readonly slaLineData: ChartConfiguration<'line'>['data'] = {
    labels: ['May 6', 'May 7', 'May 8', 'May 9', 'May 10', 'May 11', 'May 12'],
    datasets: [{
      data: [74, 82, 86, 89, 93, 94, 96],
      borderColor: '#1aa34a',
      backgroundColor: 'rgba(26, 163, 74, .12)',
      pointBackgroundColor: '#1aa34a',
      fill: true
    }]
  };

  readonly categoryDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.categoryBreakdown.map(item => item.name),
    datasets: [{
      data: this.categoryBreakdown.map(item => item.count),
      backgroundColor: this.categoryBreakdown.map(item => item.color),
      borderWidth: 0
    }]
  };

  readonly priorityDoughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.priorityBreakdown.map(item => item.name),
    datasets: [{
      data: this.priorityBreakdown.map(item => item.count),
      backgroundColor: this.priorityBreakdown.map(item => item.color),
      borderWidth: 0
    }]
  };

  readonly reviewRows = [
    { id: 1248, title: 'Refund not processed', confidence: 45, date: 'May 12, 2024' },
    { id: 1245, title: 'Unable to login to account', confidence: 52, date: 'May 12, 2024' },
    { id: 1242, title: 'Error on checkout page', confidence: 48, date: 'May 11, 2024' },
    { id: 1238, title: 'Account verification issue', confidence: 55, date: 'May 11, 2024' },
    { id: 1231, title: 'App keeps crashing', confidence: 40, date: 'May 10, 2024' }
  ];

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
    private readonly dashboard: DashboardService
  ) {}

  get displayName() {
    return this.auth.user()?.fullName ?? 'Admin User';
  }

  get initials() {
    return this.displayName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AU';
  }

  get displayTotal() {
    return new Intl.NumberFormat('en').format(this.stats?.totalTickets || 1248);
  }

  get statCards(): StatCard[] {
    return [
      { label: 'Total Tickets', value: this.displayTotal, note: '↑ 12.5% vs last 7 days', tone: 'total', trend: 'up' },
      { label: 'Open Tickets', value: String(this.stats?.openTickets ?? 312), note: '↑ 8.2% vs last 7 days', tone: 'open', trend: 'up' },
      { label: 'SLA Compliance', value: `${this.stats?.slaCompliancePercent ?? 94.6}%`, note: '↑ 3.1% vs last 7 days', tone: 'sla', trend: 'up' },
      { label: 'Avg. Resolution Time', value: this.formatResolution(), note: '↑ 15m vs last 7 days', tone: 'resolution', trend: 'down' },
      { label: 'Active Agents', value: String(this.agents.length || 24), note: `of ${Math.max(this.agents.length || 24, 28)} total agents`, tone: 'agents', trend: 'up' }
    ];
  }

  get workloadRows() {
    const fallback = [
      ['Agent Smith', 'Finance Team', 18, 6, 12, 96.2],
      ['Agent Johnson', 'Technical Team', 15, 5, 10, 93.1],
      ['Agent Williams', 'Account Team', 12, 4, 8, 94.5],
      ['Agent Brown', 'Product Team', 9, 3, 6, 97.3],
      ['Agent Davis', 'Technical Team', 7, 2, 5, 95.8]
    ];

    const source = this.agents.length
      ? this.agents.slice(0, 5).map((agent, index) => [
          agent.agentName,
          fallback[index]?.[1] ?? 'Support Team',
          agent.openTickets,
          Math.max(1, Math.floor(agent.openTickets / 3)),
          agent.resolvedToday,
          92 + index + 0.2
        ])
      : fallback;

    return source.map(row => ({
      name: String(row[0]),
      initials: String(row[0]).split(' ').map(part => part[0]).join('').slice(0, 2),
      team: String(row[1]),
      open: Number(row[2]),
      progress: Number(row[3]),
      resolved: Number(row[4]),
      sla: Number(row[5]).toFixed(1)
    }));
  }

  ngOnInit() {
    // Load dashboard data once the admin page opens; fallback values keep the layout useful while the API responds.
    this.dashboard.stats().subscribe(stats => this.stats = stats);
    this.dashboard.agents().subscribe((agents: any) => this.agents = agents);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    // The component owns the navigation decision; AuthService owns the actual session cleanup.
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  private formatResolution() {
    const hours = Number(this.stats?.avgResolutionHours ?? 4.53);
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  }
}
