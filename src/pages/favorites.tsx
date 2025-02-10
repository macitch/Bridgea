import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

const Favorites = () => {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Favorites</h1>
      <p>View and manage your favorite links.</p>
    </div>
  );
};

Favorites.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};

export default Favorites;