import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import LeadPipeline from '../components/LeadPipeline.jsx';
import LeadTable from '../components/LeadTable.jsx';
import SourceBreakdown from '../components/SourceBreakdown.jsx';
import StatCard from '../components/StatCard.jsx';
import {
  IconArrowRight,
  IconLeads,
  IconPlus,
  IconSparkle,
  IconTarget,
  IconTrendUp,
  IconTrophy,
  IconUsers,
  IconXCircle,
} from '../components/Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeads } from '../context/LeadsContext.jsx';
import {
  buildPipeline,
  buildSourceBreakdown,
  sortNewest,
} from '../services/leads.js';
import { formatRelative } from '../utils/format.js';

/** Shimmering background while the first real stats arrive. */
export default function Dashboard() {
  const { user } = useAuth();
  const {
    leads,
    stats,
    isLoading,
    isStatsLoading,
    statsError,
    openAdd,
    reloadStats,
  } = useLeads();

  const pipeline = useMemo(() => buildPipeline(leads), [leads]);
  const sources = useMemo(() => buildSourceBreakdown(leads), [leads]);
  const recentLeads = useMemo(() => sortNewest(leads, 6), [leads]);
  const activity = useMemo(() => sortNewest(leads, 4), [leads]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const openPipeline = stats ? stats.totalLeads - stats.lostLeads : 0;
  const busy = isStatsLoading && !stats;

  const greeting =
    stats && stats.qualifiedLeads > 0
      ? `${firstName} — ${stats.qualifiedLeads} lead${
          stats.qualifiedLeads === 1 ? ' is' : 's are'
        } ready for a decision.`
      : `${firstName} — no qualified leads are waiting right now.`;

  if (isLoading && leads.length === 0) return <DashboardSkeleton />;

  return (
    <>
      {/* Gradient-accented summary band — the dashboard's main brand moment. */}
      <section className="dash-hero" aria-labelledby="dash-hero-title">
        <div className="dash-hero__text">
          <span className="dash-hero__eyebrow">
            <span className="dash-hero__dot" aria-hidden="true" />
            Live workspace
          </span>
          <h2 className="dash-hero__title" id="dash-hero-title">
            Good morning, {greeting}
          </h2>
          <p>
            You have {heroNumber(stats?.newLeads)} new lead
            {plural(stats?.newLeads)} waiting on first contact and{' '}
            {heroNumber(stats?.contactedLeads)} contacted lead
            {plural(stats?.contactedLeads)} moving through the funnel.
          </p>
          <div className="dash-hero__actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn--primary" onClick={openAdd}>
              <IconPlus size={16} />
              Add Lead
            </button>
            <Link className="btn btn--secondary" to="/leads">
              View all leads
              <IconArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="dash-hero__metrics">
          <div className="dash-hero__metric">
            <p className="dash-hero__metric-value">{heroNumber(openPipeline)}</p>
            <p className="dash-hero__metric-label">Open pipeline</p>
          </div>
          <div className="dash-hero__metric">
            <p className="dash-hero__metric-value">{heroNumber(stats?.wonLeads)}</p>
            <p className="dash-hero__metric-label">Won</p>
          </div>
          <div className="dash-hero__metric">
            <p className="dash-hero__metric-value">{heroNumber(stats?.conversionRate)}%</p>
            <p className="dash-hero__metric-label">Conversion rate</p>
          </div>
        </div>
      </section>

      {statsError ? (
        <div className="alert alert--error action-alert" role="alert">
          <p className="alert__text">Could not refresh dashboard statistics: {statsError}</p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={reloadStats}>
            Retry
          </button>
        </div>
      ) : null}

      <section aria-labelledby="dash-stats-title">
        <h2 className="sr-only" id="dash-stats-title">
          Key metrics
        </h2>
        <div className="dash-grid" aria-live="polite">
          {busy ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Leads" value={stats?.totalLeads ?? 0} icon={IconUsers} hint="all time" />
              <StatCard label="New Leads" value={stats?.newLeads ?? 0} icon={IconSparkle} />
              <StatCard label="Contacted" value={stats?.contactedLeads ?? 0} icon={IconLeads} />
              <StatCard label="Qualified" value={stats?.qualifiedLeads ?? 0} icon={IconTarget} soft />
              <StatCard label="Won" value={stats?.wonLeads ?? 0} icon={IconTrophy} />
              <StatCard label="Lost" value={stats?.lostLeads ?? 0} icon={IconXCircle} soft />
              <StatCard
                label="Conversion Rate"
                value={`${stats?.conversionRate ?? 0}%`}
                icon={IconTrendUp}
                hint="won vs. all leads"
              />
            </>
          )}
        </div>
      </section>

      <div className="dash-columns">
        <div className="dash-stack">
          <section className="card" aria-labelledby="recent-leads-title">
            <div className="card__header">
              <div>
                <h2 className="t-section" id="recent-leads-title">
                  Recent Leads
                </h2>
                <p className="t-meta">Your {recentLeads.length} most recently added.</p>
              </div>
              <div className="card__header-actions">
                <Link className="btn btn--secondary btn--sm" to="/leads">
                  View all
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </div>
            <LeadTable leads={recentLeads} variant="compact" onAddLead={openAdd} />
          </section>

          <section className="card" aria-labelledby="activity-title">
            <div className="card__header">
              <div>
                <h2 className="t-section" id="activity-title">
                  Latest activity
                </h2>
                <p className="t-meta">A quick look at what changed most recently.</p>
              </div>
            </div>
            <div className="timeline">
              {activity.length === 0 ? (
                <p className="t-meta" style={{ padding: '6px 20px 18px' }}>
                  Add a lead to see activity here.
                </p>
              ) : (
                activity.map((lead) => (
                  <Link
                    to={`/leads/${lead.id}`}
                    className="timeline__item timeline__item--link"
                    key={`activity-${lead.id}`}
                  >
                    <span className="timeline__marker" aria-hidden="true">
                      <IconLeads size={15} />
                    </span>
                    <div className="truncate">
                      <p className="timeline__text">
                        <strong>{lead.name}</strong> was added from{' '}
                        {lead.source} and marked as <strong>{lead.status}</strong>.
                      </p>
                      <p className="timeline__time">
                        {lead.company} · {formatRelative(lead.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="dash-stack">
          <section className="card" aria-labelledby="pipeline-title">
            <div className="card__header">
              <div>
                <h2 className="t-section" id="pipeline-title">
                  Lead pipeline
                </h2>
                <p className="t-meta">Click a stage to filter the leads list.</p>
              </div>
            </div>
            <LeadPipeline
              stages={pipeline.stages}
              outcomes={pipeline.outcomes}
              total={leads.length}
            />
            <p className="pipeline__footnote">Counts update live as leads change status.</p>
          </section>

          <section className="card" aria-labelledby="sources-title">
            <div className="card__header">
              <div>
                <h2 className="t-section" id="sources-title">
                  Leads by source
                </h2>
                <p className="t-meta">Click a source to filter the leads list.</p>
              </div>
            </div>
            <SourceBreakdown sources={sources} total={leads.length} />
          </section>
        </div>
      </div>
    </>
  );
}

function MetricSkeleton() {
  return (
    <article className="stat-card" aria-hidden="true">
      <div className="skeleton skeleton--line" style={{ width: 40 }} />
      <div className="skeleton skeleton--metric" style={{ marginTop: 14 }} />
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" />
      <div className="skeleton skeleton--block" />
    </div>
  );
}

function heroNumber(value) {
  return value ?? 0;
}

function plural(count) {
  return count === 1 ? '' : 's';
}