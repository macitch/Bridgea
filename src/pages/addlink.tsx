import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";

export default function AddLink() {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <h1 className="text-2xl font-bold">Add links</h1>
      <p>Store your link here.</p>
    </div>
  );
}

AddLink.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};