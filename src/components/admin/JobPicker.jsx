import React, { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, User } from 'lucide-react';

export default function JobPicker({ jobs, selectedId, onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.title, j.client_name, j.client_email, j.address]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }, [jobs, query]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by client, title, or address…"
          className="w-full h-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/60 pl-10 pr-4 font-body focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="font-body text-muted-foreground text-sm italic py-6 text-center">
            No jobs match your search.
          </p>
        ) : (
          filtered.map((job) => {
            const isActive = selectedId === job.id;
            return (
              <button
                key={job.id}
                onClick={() => onSelect(job)}
                className={`w-full text-left p-4 border transition-all duration-200 ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 bg-card'
                }`}
              >
                <p className="font-display font-bold text-foreground text-sm uppercase tracking-tight truncate mb-2">
                  {job.title}
                </p>
                <div className="space-y-1">
                  {job.client_name && (
                    <p className="flex items-center gap-1.5 font-body text-muted-foreground text-xs">
                      <User className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">
                        {job.client_name}
                        {job.client_email && ` · ${job.client_email}`}
                      </span>
                    </p>
                  )}
                  {job.address && (
                    <p className="flex items-center gap-1.5 font-body text-muted-foreground text-xs">
                      <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{job.address}</span>
                    </p>
                  )}
                  {job.scheduled_date && (
                    <p className="flex items-center gap-1.5 font-body text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
                      {new Date(job.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
