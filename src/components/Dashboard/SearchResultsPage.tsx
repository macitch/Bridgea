import React from "react";
import { useRouter } from "next/router";

const SearchResultsPage = () => {
  const router = useRouter();
  const query = router.query.query?.toString() ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Search Results for {query}</h1>
      {/* Display search results here */}
      <p>Implement your search functionality to display results.</p>
    </div>
  );
};

export default SearchResultsPage;