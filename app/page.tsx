"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchPublicCaseStudies,
  getSignedReadUrl,
  type PublicCaseStudy,
} from "../lib/api";

type CaseStudyWithImages = PublicCaseStudy & {
  signedImageUrls: string[];
};

export default function HomePage() {
  const [items, setItems] = useState<CaseStudyWithImages[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const caseStudies = await fetchPublicCaseStudies();
        const withSignedUrls = await Promise.all(
          caseStudies.map(async (caseStudy) => {
            const signedImageUrls = await Promise.all(
              (caseStudy.images ?? []).map(async (image) => {
                try {
                  return await getSignedReadUrl(image.r2Key);
                } catch {
                  return "";
                }
              })
            );
            return { ...caseStudy, signedImageUrls: signedImageUrls.filter(Boolean) };
          })
        );
        setItems(withSignedUrls);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load portfolio.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  return (
    <main className="stack">
      <h1>Portfolio</h1>
      <p>Live case studies from Worker API + D1.</p>
      <div className="panel stack">
        <Link href="/admin/login">Go to Admin Login</Link>
        <Link href="/admin/case-studies">Go to Case Studies</Link>
      </div>

      {loading && <p>Loading portfolio...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading &&
        !error &&
        sortedItems.map((item) => {
          const totalWeeks = Math.max(
            1,
            item.timelineSteps.reduce((sum, step) => sum + step.durationWeeks, 0)
          );
          return (
            <article className="panel stack" key={item.id}>
              <div className="row wrap">
                <h2 style={{ margin: 0 }}>{item.title}</h2>
                <span>{item.categories.join(" · ")}</span>
              </div>
              <p>{item.shortDescription}</p>
              {item.signedImageUrls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.signedImageUrls[0]}
                  alt={item.images?.[0]?.alt || item.title}
                  style={{
                    width: "100%",
                    maxHeight: "280px",
                    objectFit: "cover",
                    borderRadius: "10px",
                    border: "1px solid #2b3852",
                  }}
                />
              ) : null}

              <div className="timeline-track">
                {item.timelineSteps.map((step) => (
                  <div
                    key={step.id || `${item.id}-${step.sortOrder}-${step.name}`}
                    className="timeline-segment"
                    style={{ flexGrow: step.durationWeeks, borderColor: item.accentColor }}
                    title={`${step.name} (${step.durationWeeks} wk)`}
                  >
                    <div className="timeline-name">{step.name}</div>
                    <div className="timeline-duration">{step.durationWeeks} wk</div>
                  </div>
                ))}
              </div>
              <small>Total timeline: {totalWeeks} weeks</small>
            </article>
          );
        })}
    </main>
  );
}
