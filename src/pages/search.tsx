import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { collection, query, orderBy, startAt, endAt, getDocs, where } from 'firebase/firestore';
import { db } from '@/provider/Google/firebase';
import { useAuth } from '@/context/AuthProvider';
import DashboardLayout from "@/components/Dashboard/DashboardLayout";

/**
 * SearchPage component allows a user to search through their saved links.
 * It leverages Firebase Firestore to query the "links" collection.
 */
const SearchPage = () => {
  // Get user data from authentication context.
  const { userData } = useAuth();
  
  // Access Next.js router to work with query parameters.
  const router = useRouter();
  
  // Extract the search query from the router query parameters.
  // If the query parameter is a string, use it directly.
  // Otherwise, attempt to extract a specific 'query' key from the query object.
  const { query: queryParam } = router;
  const searchQuery = typeof queryParam === 'string' 
    ? queryParam 
    : (queryParam.query as string) || '';

  // Local state to store search results and track if a search has been performed.
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * useEffect hook that runs when:
   * - The search query changes.
   * - User data updates.
   * - The router is ready (i.e., query parameters are available).
   *
   * It performs the search by querying Firestore based on the current searchQuery.
   */
  useEffect(() => {
    const performSearch = async () => {
      // Indicate that a search has been initiated.
      setHasSearched(true);

      // Get the current user's UID from the authentication context.
      const currentUid = userData?.uid;
      if (!currentUid) {
        console.error("User is not authenticated.");
        return;
      }

      try {
        if (!searchQuery.trim()) {
          // If the search query is empty, fetch all links for the current user.
          const allQuery = query(
            collection(db, "links"),
            where("userId", "==", currentUid)
          );
          // Retrieve all documents that match the query.
          const snapshot = await getDocs(allQuery);
          // Map the documents to an array of result objects.
          const allResults = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Update the state with the fetched results.
          setResults(allResults);
        } else {
          // Otherwise, perform a search on the "searchTerms" field.
          // Convert the search query to lowercase for case-insensitive search.
          const searchQueryRef = query(
            collection(db, "links"),
            where("userId", "==", currentUid),
            orderBy("searchTerms"),
            // Use startAt and endAt to filter documents matching the query string.
            startAt(searchQuery.toLowerCase()),
            endAt(searchQuery.toLowerCase() + "\uf8ff")
          );
          // Retrieve the filtered documents.
          const snapshot = await getDocs(searchQueryRef);
          // Map the documents to an array of result objects.
          const filteredResults = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          // Update the state with the search results.
          setResults(filteredResults);
        }
      } catch (error) {
        // Log any errors that occur during the search.
        console.error("Search failed:", error);
      }
    };

    // Only perform the search once the router is ready (ensuring query params are available).
    if (router.isReady) {
      performSearch();
    }
  }, [searchQuery, userData, router.isReady]);

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Display the search query in the heading */}
      <h2 className="text-xl font-bold mb-4">Search Results for &quot;{searchQuery}&quot;</h2>
      <div>
        {/* If a search has been performed, and no results are found, display a message */}
        {hasSearched && searchQuery && results.length === 0 && (
          <p className="text-gray-500">No results found.</p>
        )}
        {/* Map over the results and render each link's title */}
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