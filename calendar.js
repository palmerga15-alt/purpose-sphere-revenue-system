// ============================================================
// CALENDAR INTELLIGENCE MODULE
//
// FICTIONAL SAMPLE DATA ONLY. This repo publishes to public
// GitHub Pages — no real personal, medical, or appointment
// details belong here. Every event below is invented for
// demonstration, matching the convention already used by
// dashboard/finance-data.js, dashboard/billing-data.js, and
// dashboard/ip-data.js (none of which ever ship real records).
//
// A prior version of this file shipped real medical appointment
// data publicly for several months before being corrected here —
// see the commit history. If this module is ever wired to a real
// calendar source, follow the same sample/manual-local/secure-api
// adapter pattern those three modules use, so real data never
// lands directly in a public commit again.
// ============================================================
const CalendarModule = {
  name: "Calendar Intelligence",
  version: "1.0",

  status: "connected",

  events: [
    {
      title: "Sample Business Review (fictional)",
      date: "2026-11-20",
      time: "10:00 AM"
    },
    {
      title: "Sample Speaking Engagement Call (fictional)",
      date: "2026-11-24",
      time: "2:00 PM"
    },
    {
      title: "Sample Content Planning Session (fictional)",
      date: "2026-12-02",
      time: "11:30 AM"
    }
  ],
  getUpcomingEvents() {
    return this.events;
  },

  addEvent(event) {
    this.events.push(event);
  },

  display() {
    return {
      module: this.name,
      status: this.status,
      upcomingEvents: this.getUpcomingEvents()
    };
  }
};

console.log("Calendar Intelligence Module Loaded");

window.CalendarModule = CalendarModule;
