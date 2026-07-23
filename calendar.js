
const CalendarModule = {
  name: "Calendar Intelligence",
  version: "1.0",

  status: "connected",

events: [
  {
    title: "Metro Occupational Therapy",
    date: "2026-07-25",
    time: "4:00 PM"
  },
  {
    title: "Cardiology - Dr. Edward Morris",
    date: "2026-07-28",
    time: "10:00 AM"
  },
  {
    title: "Echocardiogram",
    date: "2026-09-03",
    time: "12:30 PM"
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
