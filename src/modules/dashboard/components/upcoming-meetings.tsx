"use client";

import Link from "next/link";
import { useUpcomingMeetings } from "../hooks/use-dashboard";
import type { MeetingItem } from "@/types";

function googleCalendarUrl(meeting: MeetingItem): string {
  const start = new Date(meeting.scheduledAt);
  const end   = new Date(start.getTime() + 60 * 60 * 1000); // 1hr default
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(meeting.title)}&dates=${fmt(start)}/${fmt(end)}`;
}

export function UpcomingMeetings() {
  const { data, isLoading } = useUpcomingMeetings();
  const meetings: MeetingItem[] = data?.data ?? [];

  return (
    <div className="card h-full">
      <div className="card__body gap-3">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow">Upcoming Meetings</p>
          <Link href="/meetings" className="link text-xs">View All →</Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-8 w-8 bg-muted rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No upcoming meetings</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {meetings.map((m) => {
              const date = new Date(m.scheduledAt);
              return (
                <li key={m.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" opacity=".4" />
                      <path d="M3 10h18M8 2v4m8-4v4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{m.participants.length} participants
                    </p>
                  </div>
                  <a
                    href={googleCalendarUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--xs button--ghost button--primary flex-shrink-0"
                    aria-label={`Add "${m.title}" to Google Calendar`}
                  >
                    + Cal
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
