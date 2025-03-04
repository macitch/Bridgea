import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

// UserProfile component displays a simple profile page.
// This page allows the user to edit their profile.
export default function UserProfile() {
  return (
    // Main container with a flexible column layout, full width,
    // and a custom height class (h-svh).
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      {/* Page header */}
      <h1 className="text-2xl font-bold">Profile</h1>
      {/* Brief description or instruction */}
      <p>Edit your profile here.</p>
    </div>
  );
}

// Wrap the UserProfile page with DashboardSidebar as its layout.
UserProfile.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};