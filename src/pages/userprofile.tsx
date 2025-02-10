import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

export default function UserProfile() {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p>Edit your profile here.</p>
    </div>
  );
}

// Specify the layout for this page
UserProfile.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};