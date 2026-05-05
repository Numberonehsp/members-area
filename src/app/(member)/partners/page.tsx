"use client";

import { useState, useEffect } from "react";

type Partner = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  offer: string;
  website: string;
  is_active: boolean;
  display_order: number;
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch("/api/partners");
        if (!res.ok) throw new Error("Failed to load partners");
        const json = await res.json();
        // Only show active partners
        const active = (json.data ?? []).filter((p: Partner) => p.is_active);
        setPartners(active);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPartners();
  }, []);

  // Build categories dynamically from active partners
  const categories = [
    "All",
    ...Array.from(new Set(partners.map((p) => p.category).filter(Boolean))),
  ];

  const filtered =
    activeCategory === "All"
      ? partners
      : partners.filter((p) => p.category === activeCategory);

  return (
    <div>
      {/* Page header */}
      <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">
        Partners
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-[0.95] mb-3">
        Gym Partners
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Exclusive offers and discounts for Number One HSP members.
      </p>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">Loading partners…</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-bg-card border border-border-light rounded-2xl p-10 text-center">
          <p className="text-text-secondary text-sm">No partners available at the moment.</p>
        </div>
      ) : (
        <>
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategory === cat
                    ? "bg-brand text-white border-brand"
                    : "bg-bg-card border-border-light text-text-secondary hover:text-text-primary hover:border-brand/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Partners grid */}
          {filtered.length === 0 ? (
            <div className="bg-bg-card border border-border-light rounded-2xl p-10 text-center">
              <p className="text-text-secondary text-sm">No partners in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-bg-card border border-border-light rounded-2xl shadow-sm relative overflow-hidden p-5 flex flex-col"
                >
                  {/* Teal top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand via-brand to-transparent" />

                  {/* Emoji */}
                  <span className="text-4xl leading-none mb-3 block">{partner.emoji}</span>

                  {/* Category badge */}
                  <span className="inline-block self-start px-2 py-0.5 rounded-full text-[10px] font-medium border border-border-light text-text-secondary mb-2">
                    {partner.category}
                  </span>

                  {/* Name */}
                  <h2 className="font-semibold text-text-primary text-sm mb-2">
                    {partner.name}
                  </h2>

                  {/* Description */}
                  <p className="text-xs text-text-secondary leading-snug line-clamp-3 mb-3 flex-1">
                    {partner.description}
                  </p>

                  {/* Offer highlight */}
                  <div className="rounded-lg px-3 py-2 mb-4 text-xs text-brand font-medium bg-brand/10 border border-brand/20">
                    🎁 {partner.offer}
                  </div>

                  {/* Visit Website button */}
                  {partner.website && (
                    <a
                      href={`https://${partner.website.replace(/^https?:\/\//, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs font-medium border border-border-light text-text-secondary rounded-lg py-2 transition-colors hover:bg-brand hover:border-brand hover:text-white"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
