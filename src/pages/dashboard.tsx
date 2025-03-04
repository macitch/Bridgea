import React, { useState, useEffect, useRef, useCallback } from "react";
// Import the dashboard layout component.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
// Import Firestore functions and db instance.
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
// Import authentication hook to get the current user.
import { useAuth } from "@/context/AuthProvider";
// Import a Node.js library to check if a URL is reachable from the client.
import isReachable from "is-reachable"; // npm install is-reachable
// Import an icon for the open link action.
import { MoveUpRight } from "lucide-react";
// Import the Next.js router for navigation.
import { useRouter } from "next/router";

// Define the shape of a Link document retrieved from Firestore.
type Link = {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
  userId: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  isActive?: boolean;
  isFavorite: boolean;  

};

// Define a Category object that groups links and tracks its collapsed state.
interface Category {
  name: string;
  links: Link[];
  isCollapsed: boolean;
}

// Dashboard component definition.
export default function Dashboard() {
  // Retrieve authentication state including the current user, additional user data, and loading flag.
  const { user, userData, loading } = useAuth();
  // Get Next.js router instance for navigation.
  const router = useRouter();
  // State to store the list of links fetched from Firestore.
  const [links, setLinks] = useState<Link[]>([]);

  // ---------------------------
  // Redirect based on auth state
  // ---------------------------
  useEffect(() => {
    // Once loading is finished, check the auth state.
    if (!loading) {
      // If no user is authenticated, redirect to the login page.
      if (!user) {
        router.replace("/login");
      }
      // If user data is available but workspaceName is missing or empty, redirect to the start page.
      else if (userData && (!userData.workspaceName || userData.workspaceName.trim() === "")) {
        router.replace("/start");
      }
    }
  }, [user, userData, loading, router]);

  // ---------------------------
  // Fetch links from Firestore
  // ---------------------------
  useEffect(() => {
    if (user) {
      // Create a Firestore query to retrieve links for the current user, ordered by creation date (newest first).
      const linksQuery = query(
        collection(db, "links"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      // Set up a real-time listener on the query.
      const unsubscribe = onSnapshot(linksQuery, (snapshot) => {
        // Map the Firestore documents to an array of Link objects.
        const linksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Link[];
        console.log("Fetched links from Firestore:", linksData);
        // Update local state with the fetched links.
        setLinks(linksData);
      });
      // Cleanup the listener when the component unmounts or user changes.
      return () => unsubscribe();
    }
  }, [user]);

  // ---------------------------
  // Check reachability for each link
  // ---------------------------
  useEffect(() => {
    async function checkLinksReachability() {
      // If there are no links, do nothing.
      if (links.length === 0) return;

      // For each link, check if the URL is reachable using the isReachable library.
      const updated = await Promise.all(
        links.map(async (link) => {
          try {
            const reachable = await isReachable(link.url);
            return { ...link, isActive: reachable };
          } catch (error) {
            // In case of error, mark the link as inactive.
            return { ...link, isActive: false };
          }
        })
      );
      // Update the links state with reachability information.
      setLinks(updated);
    }
    // Run the reachability check once after the links array is populated.
    checkLinksReachability();
    // We use links.length as dependency to run only when links are first loaded.
  }, [links.length]); 

  // If auth is loading, show a loading message.
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  // If userData is not available yet, show a user profile loading message.
  if (!userData) {
    return <div className="p-4">Loading user profile...</div>;
  }

  // ---------------------------
  // Data Processing
  // ---------------------------
  // Sort links by creation date in descending order.
  // Use optional chaining to safely access createdAt.seconds.
  const recentLinks = [...links].sort(
    (a, b) => ((b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  );
  // Take the first 6 links for the "Recent Added" section.
  const displayRecentLinks = recentLinks.slice(0, 6);

  // Filter links based on their reachability status.
  // If isActive is undefined, treat it as active.
  const activeLinks = links.filter((link) => link.isActive !== false);
  const inactiveLinks = links.filter((link) => link.isActive === false);
  // Filter links marked as favorite.
  const favoriteLinks = links.filter((link) => link.isFavorite);

  // Create sets for unique categories and tags across all links.
  const categoriesSet = new Set<string>();
  const tagsSet = new Set<string>();
  links.forEach((link) => {
    link.categories?.forEach((cat) => categoriesSet.add(cat));
    link.tags?.forEach((tag) => tagsSet.add(tag));
  });

  // Calculate various statistics.
  const totalLinks = links.length;
  const categoryCount = categoriesSet.size;
  const tagCount = tagsSet.size;
  const favoriteCount = favoriteLinks.length;
  const activeCount = activeLinks.length;
  const inactiveCount = inactiveLinks.length;

  // ---------------------------
  // UI Components
  // ---------------------------
  // StatsCards: Displays top-level statistics (Total Links, Categories, Tags, Favorites).
  const StatsCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
      <div className="bg-[var(--grey)] rounded-xl p-4 flex flex-col items-center shadow">
        <span className="text-2xl font-bold text-[var(--orange)]">{totalLinks}</span>
        <span className="text-gray-500 text-sm">Total Links</span>
      </div>
      <div className="bg-[var(--grey)] rounded-xl p-4 flex flex-col items-center shadow">
        <span className="text-2xl font-bold text-[var(--orange)]">{categoryCount}</span>
        <span className="text-gray-500 text-sm">Categories</span>
      </div>
      <div className="bg-[var(--grey)] rounded-xl p-4 flex flex-col items-center shadow">
        <span className="text-2xl font-bold text-[var(--orange)]">{tagCount}</span>
        <span className="text-gray-500 text-sm">Tags</span>
      </div>
      <div className="bg-[var(--grey)] rounded-xl p-4 flex flex-col items-center shadow">
        <span className="text-2xl font-bold text-[var(--orange)]">{favoriteCount}</span>
        <span className="text-gray-500 text-sm">Favorites</span>
      </div>
    </div>
  );

  // RecentAdded: Renders a card view of recently added links.
  const RecentAdded = ({ links }: { links: Link[] }) => (
    <div className="bg-[var(--grey)] rounded-xl p-6 shadow flex-1">
      <h2 className="text-xl font-bold mb-4 text-[var(--black)]">Recent Added</h2>
      <div className="grid grid-cols-2 gap-4">
        {links.map((link) => (
          <div key={link.id} className="bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-bold text-gray-800">
              {link.title || "Untitled"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {link.description || "No description"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // LinkCheck: Renders a table that displays link statuses (Active/Deleted).
  const LinkCheck = ({ links }: { links: Link[] }) => (
    <div className="bg-[var(--grey)] rounded-xl p-6 shadow flex-1">
      <h2 className="text-xl font-bold mb-4 text-[var(--black)]">Link Status</h2>
      <table className="w-full text-left border-collapse">
        <thead className="bg-white">
          <tr>
            <th className="p-3 text-sm font-semibold text-[var(--black)] w-3/4">
              URL Title
            </th>
            <th className="p-3 text-sm font-semibold text-[var(--black)] w-1/4">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id} className="border-b last:border-none">
              <td className="p-3 text-sm text-[var(--black)]">
                {link.title || "Untitled Link"}
              </td>
              <td className="p-3 text-sm">
                {link.isActive !== false ? (
                  <span className="text-[var(--green)]">Active</span>
                ) : (
                  <span className="text-[var(--red)]">Deleted</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ---------------------------
  // Render the Dashboard UI
  // ---------------------------
  return (
    <div className="flex flex-col gap-8 flex-1 w-full p-8 bg-white">
      {/* Top row: Stats widget displaying overall link statistics */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <StatsCards />
        </div>
      </div>

      {/* Middle row: Display the "Recent Added" cards and Link Status table */}
      <div className="flex flex-col lg:flex-row gap-6">
        <RecentAdded links={displayRecentLinks} />
        <LinkCheck links={links} />
      </div>

      {/* Bottom row: Additional widgets or charts can be added here if needed */}
      <div>
        {/* Placeholder for future components */}
      </div>
    </div>
  );
}

// Use DashboardLayout as the page layout.
Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};