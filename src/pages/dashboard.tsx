import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      <div className="flex gap-2">
        {[...new Array(4)].map((_, i) => (
          <div key={`first-array-${i}`} className="h-20 w-full rounded-lg bg-white" />
        ))}
      </div>
    </div>
  );
}

Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};