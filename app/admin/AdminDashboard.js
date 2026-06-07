"use client";

import "./admin.css";

import { AdminProvider, useAdmin } from "./AdminContext";
import GuestDrawer from "./components/GuestDrawer";
import GuestsView from "./components/GuestsView";
import MessagesView from "./components/MessagesView";
import OverviewView from "./components/OverviewView";
import Sidebar from "./components/Sidebar";
import SeatingView from "./components/SeatingView";

function ActiveSection() {
  const { activeSection } = useAdmin();

  switch (activeSection) {
    case "guests":
      return <GuestsView />;
    case "seating":
      return <SeatingView />;
    case "messages":
      return <MessagesView />;
    default:
      return <OverviewView />;
  }
}

function Shell() {
  const { selectedRow } = useAdmin();

  return (
    <div className={selectedRow ? "admin-shell has-drawer" : "admin-shell"}>
      <Sidebar />
      <main className="admin-content">
        <ActiveSection />
      </main>
      <GuestDrawer />
    </div>
  );
}

export default function AdminDashboard({ submissions, tables }) {
  return (
    <AdminProvider submissions={submissions} tables={tables}>
      <Shell />
    </AdminProvider>
  );
}
