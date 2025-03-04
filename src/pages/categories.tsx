import React, { useState, useEffect, useRef, useCallback } from "react";
// Import layout component for dashboard pages.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
// Import Firestore functions and database instance.
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
// Import authentication hook.
import { useAuth } from "@/context/AuthProvider";
// Import various icons from lucide-react.
import {
  EllipsisVertical,
  MoveUpRight,
  Rows2,
  Grid2X2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
// Import utility to merge Tailwind CSS classes.
import { cn } from "@/utils/twMerge";

// Define the shape of a Link document.
type Link = {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
  userId: string;
  createdAt: any;
};

// Define a Category object that groups links and tracks its collapsed state.
interface Category {
  name: string;
  links: Link[];
  isCollapsed: boolean;
}

export default function Categories() {
  // Retrieve authenticated user from context.
  const { user } = useAuth();
  // State flag for loading indicator.
  const [loading, setLoading] = useState<boolean>(true);
  // State to store the chosen sort option.
  // Options: "date", "title", "category"
  const [sortOption, setSortOption] = useState<"date" | "title" | "category">("date");
  // State to track which link's "More" menu is open.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // State for the array of grouped categories.
  const [categories, setCategories] = useState<Category[]>([]);
  // State to toggle between grid and list (table) views.
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Ref used to detect clicks outside the More menu, so that it can be closed.
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Callback function that closes the More menu if the click happens outside.
  const closeMenuOnOutsideClick = useCallback((e: MouseEvent) => {
    if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
      setOpenMenuId(null);
    }
  }, []);

  // Set up an event listener on the document to close the More menu on outside clicks.
  useEffect(() => {
    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
    };
  }, [closeMenuOnOutsideClick]);

  // Effect to fetch user links from Firestore and group them by category.
  useEffect(() => {
    async function fetchUserLinks() {
      // If no user is authenticated, do nothing.
      if (!user) return;
      setLoading(true);

      try {
        // Create a Firestore query to get links for the current user,
        // ordered by creation date in descending order.
        const q = query(
          collection(db, "links"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        // Map Firestore documents to Link objects.
        const links: Link[] = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Link)
        );

        // Group links by each category.
        const grouped: Record<string, Link[]> = {};
        links.forEach((link) => {
          if (link.categories && link.categories.length > 0) {
            // If a link has one or more categories, add it to each group.
            link.categories.forEach((cat) => {
              if (!grouped[cat]) grouped[cat] = [];
              grouped[cat].push(link);
            });
          } else {
            // If no categories, assign link to "Uncategorized" group.
            if (!grouped["Uncategorized"]) grouped["Uncategorized"] = [];
            grouped["Uncategorized"].push(link);
          }
        });

        // Convert grouped object into an array of Category objects.
        const newCategories: Category[] = Object.keys(grouped).map((cat) => ({
          name: cat,
          links: grouped[cat],
          isCollapsed: false, // Default to expanded state.
        }));

        // Update state with the newly grouped categories.
        setCategories(newCategories);
      } catch (error) {
        console.error("Error fetching links:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserLinks();
  }, [user]);

  // Sorting logic for categories.
  let sortedCategories: Category[] = [...categories];

  // 1) If the sort option is "category", sort categories alphabetically.
  if (sortOption === "category") {
    sortedCategories.sort((a, b) => a.name.localeCompare(b.name));
  }

  // 2) If the sort option is "title", sort links within each category by title.
  // For "date", we rely on Firestore order.
  sortedCategories = sortedCategories.map((cat) => {
    if (sortOption === "title") {
      const sortedLinks = [...cat.links].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
      return { ...cat, links: sortedLinks };
    }
    return cat;
  });

  // Function to toggle the collapsed state of a category.
  const toggleCategory = (catName: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.name === catName ? { ...cat, isCollapsed: !cat.isCollapsed } : cat
      )
    );
  };

  // Handlers for "More" menu actions.
  const handleShare = (linkId: string) => alert(`Share link ID: ${linkId}`);
  const handleEdit = (linkId: string) => alert(`Edit link ID: ${linkId}`);
  const handleDelete = (linkId: string) => alert(`Delete link ID: ${linkId}`);

  // Toggle the More menu for a specific link.
  const toggleMenu = (linkId: string) => {
    setOpenMenuId((prev) => (prev === linkId ? null : linkId));
  };

  // If still loading data, display a loading message.
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  // If there are no categories (i.e., no links), display an appropriate message.
  if (sortedCategories.length === 0) {
    return <div className="p-4">No links available.</div>;
  }

  return (
    <div className="flex flex-col gap-2 flex-1 w-full min-h-screen p-4 bg-white">
      {/* Top Bar: Contains sort options and a view toggle button, aligned to the right. */}
      <div className="flex justify-end items-center gap-2 mb-2">
        {/* Dropdown for selecting sort option */}
        <div className="relative inline-block">
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as "date" | "title" | "category")
            }
            className={cn(
              "appearance-none", // Remove default dropdown arrow.
              "inline-flex items-center justify-center",
              "h-12 px-4 pr-12", // Extra padding on the right for the custom icon.
              "rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
              "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-orange-500"
            )}
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="category">Alphabetic</option>
          </select>
          {/* Custom dropdown arrow icon */}
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
        </div>
        {/* Button to toggle view mode between grid and list */}
        <button
          onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
          className={cn(
            "flex items-center justify-center", 
            "w-12 h-12", 
            "rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
            "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200"
          )}
          aria-label="Toggle view"
        >
          {viewMode === "grid" ? (
            <Grid2X2 className="w-5 h-5" />
          ) : (
            <Rows2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Render each category */}
      {sortedCategories.map((cat) => (
        <div key={cat.name} className="mb-3">
          {/* Category heading with name and a chevron to indicate collapsed state */}
          <div
            className="flex items-center justify-between cursor-pointer bg-[var(--grey)] p-3 rounded-md"
            onClick={() => toggleCategory(cat.name)}
          >
            <span className="text-lg font-bold">{cat.name}</span>
            {/* Chevron icon changes direction based on collapsed state */}
            {cat.isCollapsed ? (
              <ChevronUp className="w-6 h-6 text-[var(--black)]" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[var(--black)]" />
            )}
          </div>

          {/* Display category content if not collapsed */}
          {!cat.isCollapsed &&
            (viewMode === "grid" ? (
              /* GRID VIEW: Display links in a responsive grid layout */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {cat.links.map((link) => (
                  <div
                    key={link.id}
                    className="relative bg-[var(--grey)] rounded-2xl shadow p-4 flex flex-col"
                  >
                    {/* Image container */}
                    <div className="relative">
                      {link.imageUrl ? (
                        <img
                          src={link.imageUrl}
                          alt={link.title || "Link image"}
                          className="w-full h-64 object-cover rounded-xl"
                        />
                      ) : (
                        // Placeholder if no image available.
                        <div className="bg-gray-400 w-full h-64 flex items-center justify-center text-white rounded-xl">
                          No Image
                        </div>
                      )}
                      {/* Button to open the link in a new tab */}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] text-[var(--orange)] hover:bg-[var(--orange)] hover:text-white shadow"
                      >
                        <MoveUpRight className="w-5 h-5" />
                      </a>
                    </div>

                    {/* Title and description */}
                    <div className="mt-4">
                      <h2 className="text-xl font-semibold">
                        {link.title || "Untitled Link"}
                      </h2>
                      <p className="text-gray-600 mt-1 flex-1">
                        {link.description || "No description provided."}
                      </p>
                    </div>

                    {/* Tags and More menu */}
                    <div className="mt-4 flex items-center justify-between">
                      {/* Display link tags if available */}
                      {link.tags && link.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {link.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border text-[var(--orange)] px-2 py-1 rounded-full text-xs hover:bg-[var(--orange)] hover:text-white"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div />
                      )}
                      {/* More menu button */}
                      <div className="relative" ref={moreMenuRef}>
                        <button
                          onClick={() => toggleMenu(link.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--orange)] hover:bg-[var(--orange)] hover:text-white"
                        >
                          <EllipsisVertical className="w-5 h-5" />
                        </button>
                        {/* Dropdown menu for additional actions */}
                        {openMenuId === link.id && (
                          <ul className="absolute right-0 mt-2 w-28 bg-white shadow-md rounded z-10">
                            <li>
                              <button
                                onClick={() => handleShare(link.id)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Share
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleEdit(link.id)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDelete(link.id)}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Delete
                              </button>
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST (TABLE) VIEW: Display links in a table format */
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 w-1/4">URL Title</th>
                      <th className="p-3 w-1/2">Description Title</th>
                      <th className="p-3 w-1/6">Tags</th>
                      <th className="p-3 w-1/6">Open Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.links.map((link) => (
                      <tr
                        key={link.id}
                        className="border-b last:border-none hover:bg-gray-50"
                      >
                        <td className="p-3 align-top">
                          {link.title || "Untitled Link"}
                        </td>
                        <td className="p-3 align-top">
                          {link.description || "No description provided."}
                        </td>
                        <td className="p-3 align-top">
                          {link.tags && link.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {link.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs border border-[var(--orange)] text-[var(--orange)] rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No tags
                            </span>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              inline-flex
                              items-center
                              gap-1
                              px-3
                              py-2
                              bg-[var(--white)]
                              text-[var(--orange)]
                              border
                              border-[var(--orange)]
                              rounded-full
                              hover:bg-[var(--orange)]
                              hover:text-white
                              transition-colors
                              duration-200
                            "
                          >
                            <MoveUpRight className="w-4 h-4" />
                            Open
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

// Use the DashboardLayout as the layout for this page.
Categories.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};