import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

const Categories = () => {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Categories</h1>
      <p>Organize your links into categories.</p>
    </div>
  );
};

Categories.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};

export default Categories; 