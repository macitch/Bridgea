import React, { useState, useEffect, useRef, useCallback } from "react";
// Import the dashboard layout component.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
// Import Firestore functions and the db instance for querying links.
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
// Import the authentication hook to access the current user.
import { useAuth } from "@/context/AuthProvider";
// Import various icons from lucide-react used for UI elements.
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

// Define the structure of a Link document.
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

// Define a TagGroup object to group links by tag and track whether the group is collapsed.
interface TagGroup {
  tag: string;
  links: Link[];
  isCollapsed: boolean;
}

export default function Tags() {
  // Retrieve the authenticated user from context.
  const { user } = useAuth();
  // Local state to track loading status while fetching links.
  const [loading, setLoading] = useState<boolean>(true);
  // Local state to track sort option. Options:
  // "date": default order by creation date,
  // "title": sort links alphabetically within each group,
  // "tag": sort groups alphabetically.
  const [sortOption, setSortOption] = useState<"date" | "title" | "tag">("date");
  // Local state to track which link's More menu is currently open.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Local state for the grouped tag data.
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  // Local state to toggle between grid and list views.
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Ref used to detect clicks outside the More menu, so that it can be closed.
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Callback to close the More menu if a click is detected outside of it.
  const closeMenuOnOutsideClick = useCallback((e: MouseEvent) => {
    if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
      setOpenMenuId(null);
    }
  }, []);

  // Set up an event listener on the document for outside clicks to close the More menu.
  useEffect(() => {
    document.addEventListener("mousedown", closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener("mousedown", closeMenuOnOutsideClick);
  }, [closeMenuOnOutsideClick]);

  // Fetch the user's links from Firestore and group them by tag.
  useEffect(() => {
    async function fetchUserLinks() {
      if (!user) return;
      setLoading(true);
      try {
        // Query the "links" collection for documents matching the current user's UID,
        // ordered by creation date (newest first).
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

        // Group links by each tag found in the link's "tags" array.
        // If a link has no tags, group it under "Untagged".
        const groups: Record<string, Link[]> = {};
        links.forEach((link: Link) => {
          if (link.tags && link.tags.length > 0) {
            link.tags.forEach((tag: string) => {
              if (!groups[tag]) {
                groups[tag] = [];
              }
              groups[tag].push(link);
            });
          } else {
            if (!groups["Untagged"]) {
              groups["Untagged"] = [];
            }
            groups["Untagged"].push(link);
          }
        });
        // Convert the groups object into an array of TagGroup objects.
        const newGroups: TagGroup[] = Object.keys(groups).map((tag: string) => ({
          tag,
          links: groups[tag],
          isCollapsed: false,
        }));
        // Update the state with the new tag groups.
        setTagGroups(newGroups);
      } catch (error) {
        console.error("Error fetching links by tag:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserLinks();
  }, [user]);

  // ---------------------------
  // Sorting Logic
  // ---------------------------
  // Create a copy of tagGroups for sorting.
  let sortedGroups: TagGroup[] = [...tagGroups];

  // If sort option is "tag", sort the groups alphabetically by tag name.
  if (sortOption === "tag") {
    sortedGroups.sort((a, b) => a.tag.localeCompare(b.tag));
  }

  // For each tag group, if sort option is "title", sort the links alphabetically by title.
  sortedGroups = sortedGroups.map((group: TagGroup) => {
    if (sortOption === "title") {
      const sortedLinks = [...group.links].sort((a: Link, b: Link) =>
        (a.title || "").localeCompare(b.title || "")
      );
      return { ...group, links: sortedLinks };
    }
    return group;
  });

  // Toggle the collapsed state of a tag group when its header is clicked.
  const toggleGroup = (tag: string) => {
    setTagGroups((prev) =>
      prev.map((group: TagGroup) =>
        group.tag === tag ? { ...group, isCollapsed: !group.isCollapsed } : group
      )
    );
  };

  // ---------------------------
  // More Menu Actions
  // ---------------------------
  // Handlers for actions in the More menu (e.g., Share, Edit, Delete).
  const handleShare = (linkId: string) => alert(`Share link ID: ${linkId}`);
  const handleEdit = (linkId: string) => alert(`Edit link ID: ${linkId}`);
  const handleDelete = (linkId: string) => alert(`Delete link ID: ${linkId}`);

  // Toggle the More menu for a given link.
  const toggleMenu = (linkId: string) => {
    setOpenMenuId((prev) => (prev === linkId ? null : linkId));
  };

  // If still loading, display a loading message.
  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  // If no tag groups are available, display a message.
  if (sortedGroups.length === 0) {
    return <div className="p-4">No links available.</div>;
  }

  return (
    <div className="flex flex-col gap-2 flex-1 w-full min-h-screen p-4 bg-white">
      {/* Top Bar: Contains the sort filter dropdown and the view toggle button. */}
      <div className="flex justify-end items-center gap-2 mb-2">
        {/* Dropdown to select sort option */}
        <div className="relative inline-block">
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value as "date" | "title" | "tag")
            }
            className={cn(
              "appearance-none inline-flex items-center justify-center",
              "h-12 px-4 pr-12 rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
              "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-orange-500"
            )}
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="tag">Alphabetic</option>
          </select>
          {/* Custom dropdown arrow icon */}
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
        </div>
        {/* Button to toggle between grid and list view */}
        <button
          onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
          className={cn(
            "flex items-center justify-center",
            "w-12 h-12 rounded-full border-2 border-[var(--grey)] bg-white text-gray-600",
            "hover:text-gray-800 hover:bg-[var(--grey)] transition-all duration-200"
          )}
          aria-label="Toggle view"
        >
          {viewMode === "grid" ? (
            <Grid2X2 className="w-5 h-5 p-1" />
          ) : (
            <Rows2 className="w-5 h-5 p-1" />
          )}
        </button>
      </div>

      {/* Render each tag group */}
      {sortedGroups.map((group: TagGroup) => (
        <div key={group.tag} className="mb-3">
          {/* Tag Group Header */}
          <div
            className="flex items-center justify-between cursor-pointer bg-[var(--grey)] p-3 rounded-md"
            onClick={() => toggleGroup(group.tag)}
          >
            <span className="text-lg font-bold">{group.tag}</span>
            {/* Display chevron icon based on whether the group is collapsed */}
            {group.isCollapsed ? (
              <ChevronUp className="w-6 h-6 text-[var(--black)]" />
            ) : (
              <ChevronDown className="w-6 h-6 text-[var(--black)]" />
            )}
          </div>

          {/* Group Content: Render in grid view or list view based on viewMode */}
          {!group.isCollapsed &&
            (viewMode === "grid" ? (
              // GRID VIEW: Render links in a responsive grid layout.
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {group.links.map((link: Link) => (
                  <div
                    key={link.id}
                    className="relative bg-[var(--grey)] rounded-2xl shadow p-4 flex flex-col"
                  >
                    {/* Image Section */}
                    <div className="relative">
                      {link.imageUrl ? (
                        <img
                          src={link.imageUrl}
                          alt={link.title || "Link image"}
                          className="w-full h-64 object-cover rounded-xl"
                        />
                      ) : (
                        // Display placeholder if no image is available.
                        <div className="bg-gray-400 w-full h-64 flex items-center justify-center text-white rounded-xl">
                          No Image
                        </div>
                      )}
                      {/* Category Badge: Display the first category or "Uncategorized" */}
                      <div className="absolute top-4 right-4 bg-[var(--orange)] text-[var(--white)] px-3 py-1 text-xs font-semibold rounded-full shadow">
                        {link.categories && link.categories.length > 0
                          ? link.categories[0]
                          : "Uncategorized"}
                      </div>
                      {/* Open Link Button */}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--white)] text-[var(--orange)] hover:bg-[var(--orange)] hover:text-white shadow"
                      >
                        <MoveUpRight className="w-5 h-5" />
                      </a>
                    </div>
                    {/* Title and Description Section */}
                    <div className="mt-4">
                      <h2 className="text-xl font-semibold">
                        {link.title || "Untitled Link"}
                      </h2>
                      <p className="text-gray-600 mt-1 flex-1">
                        {link.description || "No description provided."}
                      </p>
                    </div>
                    {/* More Menu for additional actions */}
                    <div className="flex items-center">
                      <div className="relative ml-auto" ref={moreMenuRef}>
                        <button
                          onClick={() => toggleMenu(link.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--orange)] hover:bg-[var(--orange)] hover:text-white"
                        >
                          <EllipsisVertical className="w-5 h-5" />
                        </button>
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
              // LIST VIEW: Render tag group links in a table format.
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    {/* Table headers can be added here if needed */}
                  </thead>
                  <tbody>
                    {group.links.map((link: Link) => (
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
                          {link.categories && link.categories.length > 0
                            ? link.categories.join(", ")
                            : "No Category"}
                        </td>
                        <td className="p-3 align-top">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-[var(--white)] text-[var(--orange)] border border-[var(--orange)] rounded-full hover:bg-[var(--orange)] hover:text-white transition-colors duration-200"
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
            ))}
        </div>
      ))}
    </div>
  );
}

// Wrap the Tags page in the DashboardLayout.
Tags.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};