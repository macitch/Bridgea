import DashboardLayout from "@/components/Dashboard/DashboardLayout";

const Settings = () => {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p>Manage your account settings here.</p>
    </div>
  );
};

Settings.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Settings; 