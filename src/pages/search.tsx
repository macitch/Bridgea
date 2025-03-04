import React, { useState, useEffect } from 'react';
// Import Next.js router for handling navigation and query parameters.
import { useRouter } from 'next/router';
// Import Firestore functions to perform queries.
import { collection, query, orderBy, startAt, endAt, getDocs, where } from 'firebase/firestore';
// Import the Firestore database instance.
import { db } from '@/provider/Google/firebase';
// Import the authentication hook to get user data.
import { useAuth } from '@/context/AuthProvider';
// Import the DashboardLayout to wrap the page.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

/**
 * SearchPage component allows a user to search through their saved links.
 * It leverages Firebase Firestore to query the "links" collection based on
 * the search query provided via the URL's query parameters.
 */
const SearchPage = () => {
  // Retrieve userData from the auth context.
  const { userData } = useAuth();

  // Get the Next.js router instance to work with URL query parameters.
  const router = useRouter();

  // Extract the "query" parameter from the URL.
  // If it's a string, use it directly; otherwise, attempt to retrieve it from an object.
  const { query: queryParam } = router;
  const searchQuery =
    typeof queryParam === 'string'
      ? queryParam
      : (queryParam.query as string) || '';

  // Local state to store search results and track whether a search was performed.
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * useEffect hook that runs when:
   * - The search query changes.
   * - User data updates.
   * - The router is ready (i.e., query parameters are available).
   *
   * This hook performs the following:
   * 1. If the search query is empty, it fetches all links for the current user.
   * 2. Otherwise, it queries the "links" collection filtering by the lowercased
   *    search query using Firestore's startAt and endAt.
   */
  useEffect(() => {
    const performSearch = async () => {
      // Mark that a search has been initiated.
      setHasSearched(true);

      // Get the current user's UID. If not available, log an error.
      const currentUid = userData?.uid;
      if (!currentUid) {
        console.error("User is not authenticated.");
        return;
      }

      try {
        // Check if the search query is empty.
        if (!searchQuery.trim()) {
          // If empty, query all links for the current user.
          const allQuery = query(
            collection(db, "links"),
            where("userId", "==", currentUid)
          );
          const snapshot = await getDocs(allQuery);
          const allResults = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setResults(allResults);
        } else {
          // Otherwise, perform a filtered search on the "searchTerms" field.
          const searchQueryRef = query(
            collection(db, "links"),
            where("userId", "==", currentUid),
            orderBy("searchTerms"),
            // Use startAt and endAt to get documents that match the search query (case-insensitive).
            startAt(searchQuery.toLowerCase()),
            endAt(searchQuery.toLowerCase() + "\uf8ff")
          );
          const snapshot = await getDocs(searchQueryRef);
          const filteredResults = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setResults(filteredResults);
        }
      } catch (error) {
        // Log any errors that occur during the search process.
        console.error("Search failed:", error);
      }
    };

    // Run the search only when the router is ready (i.e., query parameters are available).
    if (router.isReady) {
      performSearch();
    }
  }, [searchQuery, userData, router.isReady]);

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Display the search query in the heading */}
      <h2 className="text-xl font-bold mb-4">Search Results for &quot;{searchQuery}&quot;</h2>
      <div>
        {/* If a search was performed, but no results are found, show a message */}
        {hasSearched && searchQuery && results.length === 0 && (
          <p className="text-gray-500">No results found.</p>
        )}
        {/* Render each result as a simple div showing the link title */}
        {results.map((result) => (
          <div key={result.id} className="py-1 border-b border-gray-200">
            {result.title || "Untitled"}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * getLayout is a Next.js pattern that allows you to wrap pages in a custom layout.
 * Here, the SearchPage is wrapped inside DashboardLayout.
 *
 * @param page - The page content that needs to be wrapped.
 * @returns The page wrapped with DashboardLayout.
 */
SearchPage.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SearchPage;