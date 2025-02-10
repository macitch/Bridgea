import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

const Tags = () => {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Tags</h1>
      <p>Manage tags for your links.</p>
    </div>
  );
};

Tags.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};

export default Tags; // ✅ Ensure this is the only default export