// Import the DashboardLayout component to wrap the Favorites page.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

// Favorites component: Displays a header and description for the Favorites section.
const Favorites = () => {
  return (
    // Main container with flex layout, gap between items, full width, and a custom height (h-svh).
    <div className="flex flex-col gap-2 flex-1 w-full h-svh">
      {/* Page header */}
      <h1 className="text-2xl font-bold">Favorites</h1>
      {/* Description text */}
      <p>View and manage your favorite links.</p>
    </div>
  );
};

// Define a custom getLayout function to wrap this page with the DashboardLayout.
// This pattern allows each page to specify its own layout.
Favorites.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

// Export the Favorites component as default.
export default Favorites;