"use client";

import Link from "next/link";
import { ScoreBadge } from "./score-badge";
import { LayerStatusBadge } from "./layer-status-badge";
import { PipelineControls } from "./pipeline-controls";
import { HIERARCHY, FULL_RUN } from "../lib/platform-hierarchy";

/**
 * @param {object} props
 * @param {object} props.stats
 * @param {number} props.stats.topics
 * @param {number} props.stats.opportunities
 * @param {number} props.stats.signalsToday
 * @param {number} props.stats.activeSources
 * @param {object | null} props.stats.aiWinner
 * @param {object | null} props.stats.lastRun
 */
export function PlatformHierarchy({ stats }) {
  const { parent, gate, video, article, videoPublishers, articlePublishers } =
    HIERARCHY;

  return (
    <div className="hierarchy">
      <div className="hierarchy-intro muted">
        Parent library → one winner per cycle → video + article factory →
        platform publishers
      </div>

      {/* PARENT */}
      <section className="hierarchy-layer hierarchy-layer--parent">
        <div className="hierarchy-layer-head">
          <div className="hierarchy-layer-meta">
            <span className="hierarchy-role">{parent.role}</span>
            <h2 className="hierarchy-title">{parent.title}</h2>
          </div>
          <LayerStatusBadge status={parent.status} />
        </div>
        <p className="hierarchy-desc muted">{parent.description}</p>

        <div className="hierarchy-stats stat-strip">
          <div className="stat-strip-item">
            <div className="stat-value">{stats.topics}</div>
            <div className="stat-label">Topics tracked</div>
          </div>
          <div className="stat-strip-item">
            <div className="stat-value">{stats.opportunities}</div>
            <div className="stat-label">Opportunities scored</div>
          </div>
          <div className="stat-strip-item">
            <div className="stat-value">{stats.signalsToday}</div>
            <div className="stat-label">Signals today</div>
          </div>
          <div className="stat-strip-item">
            <div className="stat-value">{stats.activeSources}</div>
            <div className="stat-label">Active sources</div>
          </div>
        </div>

        {stats.lastRun && (
          <p className="meta-line hierarchy-meta">
            Last ingestion: {stats.lastRun.source.name} — {stats.lastRun.status}
            {stats.lastRun.completedAt &&
              ` · ${new Date(stats.lastRun.completedAt).toLocaleString()}`}
          </p>
        )}

        <PipelineControls
          filterGroup={parent.pipelineGroup}
          inline
          className="hierarchy-controls"
        />
      </section>

      <div className="hierarchy-connector" aria-hidden="true" />

      {/* GATE */}
      <section className="hierarchy-layer hierarchy-layer--gate">
        <div className="hierarchy-layer-head">
          <div className="hierarchy-layer-meta">
            <span className="hierarchy-role">{gate.role}</span>
            <h2 className="hierarchy-title">{gate.title}</h2>
          </div>
          <LayerStatusBadge status={gate.status} />
        </div>
        <p className="hierarchy-desc muted">{gate.description}</p>

        {stats.aiWinner ? (
          <div className="hierarchy-winner panel">
            <div className="hierarchy-winner-inner">
              <div className="score-hero score-hero--flush">
                <ScoreBadge score={stats.aiWinner.opportunityScore} />
                <Link
                  href={`/opportunities/${stats.aiWinner.id}`}
                  className="hierarchy-winner-title"
                >
                  {stats.aiWinner.topic.title}
                </Link>
              </div>
              {stats.aiWinner.topic.category && (
                <p className="meta-line">{stats.aiWinner.topic.category}</p>
              )}
              {stats.aiWinner.analysis?.aiReasoning && (
                <p className="muted hierarchy-winner-reason">
                  {stats.aiWinner.analysis.aiReasoning}
                </p>
              )}
              {stats.aiWinner.analysis?.contentStrategy?.siteAngle && (
                <p className="hierarchy-winner-angle">
                  <span className="section-label">Site angle</span>
                  {stats.aiWinner.analysis.contentStrategy.siteAngle}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="hierarchy-winner panel hierarchy-winner--empty">
            <p className="empty-state">
              No winner yet — run full pipeline or AI pick to approve one niche.
            </p>
          </div>
        )}

        <PipelineControls
          filterGroup={gate.pipelineGroup}
          inline
          className="hierarchy-controls"
        />
      </section>

      <div className="hierarchy-connector hierarchy-connector--split" aria-hidden="true" />

      {/* CHILDREN — side by side */}
      <div className="hierarchy-children">
        <section className="hierarchy-layer hierarchy-layer--child">
          <div className="hierarchy-layer-head">
            <div className="hierarchy-layer-meta">
              <span className="hierarchy-role">{video.role}</span>
              <h2 className="hierarchy-title">{video.title}</h2>
            </div>
            <LayerStatusBadge
              status={video.status}
              note={video.statusNote}
            />
          </div>
          <p className="hierarchy-desc muted">{video.description}</p>

          <PipelineControls
            filterGroup={video.pipelineGroup}
            filterTrack={video.pipelineTrack}
            inline
            className="hierarchy-controls"
          />

          <div className="hierarchy-sub">
            <div className="hierarchy-sub-head">
              <span className="hierarchy-role">{videoPublishers.role}</span>
              <span className="hierarchy-sub-title">{videoPublishers.title}</span>
              <LayerStatusBadge status={videoPublishers.status} />
            </div>
            <ul className="hierarchy-platforms">
              {videoPublishers.platforms.map((name) => (
                <li key={name} className="hierarchy-platform hierarchy-platform--planned">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="hierarchy-layer hierarchy-layer--child">
          <div className="hierarchy-layer-head">
            <div className="hierarchy-layer-meta">
              <span className="hierarchy-role">{article.role}</span>
              <h2 className="hierarchy-title">{article.title}</h2>
            </div>
            <LayerStatusBadge status={article.status} />
          </div>
          <p className="hierarchy-desc muted">{article.description}</p>

          <PipelineControls
            filterGroup={article.pipelineGroup}
            filterTrack={article.pipelineTrack}
            inline
            className="hierarchy-controls"
          />

          <div className="hierarchy-sub">
            <div className="hierarchy-sub-head">
              <span className="hierarchy-role">{articlePublishers.role}</span>
              <span className="hierarchy-sub-title">{articlePublishers.title}</span>
              <LayerStatusBadge status={articlePublishers.status} />
            </div>
            <ul className="hierarchy-platforms">
              {articlePublishers.platforms.map((name) => (
                <li key={name} className="hierarchy-platform hierarchy-platform--planned">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* FULL RUN */}
      <section className="hierarchy-layer hierarchy-layer--full">
        <div className="hierarchy-layer-head">
          <div className="hierarchy-layer-meta">
            <span className="hierarchy-role">{FULL_RUN.role}</span>
            <h2 className="hierarchy-title">{FULL_RUN.title}</h2>
          </div>
        </div>
        <p className="hierarchy-desc muted">{FULL_RUN.description}</p>
        <PipelineControls
          filterGroup={FULL_RUN.pipelineGroup}
          inline
          className="hierarchy-controls"
        />
      </section>
    </div>
  );
}
