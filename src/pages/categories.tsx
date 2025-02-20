import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthProvider";

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

const Categories = () => {
  const [linksByCategory, setLinksByCategory] = useState<Record<string, Link[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUserLinks() {
      if (!user) return;
      setLoading(true);
      try {
        // Query only links where the userId equals the current user's uid.
        const q = query(collection(db, "links"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const links: Link[] = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Link));
        
        // Group links by category. If a link has multiple categories, add it to each group.
        const grouped: Record<string, Link[]> = {};
        links.forEach((link) => {
          if (link.categories && link.categories.length > 0) {
            link.categories.forEach((cat) => {
              if (!grouped[cat]) {
                grouped[cat] = [];
              }
              grouped[cat].push(link);
            });
          } else {
            if (!grouped["Uncategorized"]) {
              grouped["Uncategorized"] = [];
            }
            grouped["Uncategorized"].push(link);
          }
        });
        setLinksByCategory(grouped);
      } catch (error) {
        console.error("Error fetching links:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserLinks();
  }, [user]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 flex-1 w-full h-screen p-4 overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      {Object.keys(linksByCategory).length === 0 && <p>No links available.</p>}
      {Object.keys(linksByCategory).map((category) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-2">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linksByCategory[category].map((link) => (
              <div key={link.id} className="border p-4 rounded-lg">
                {link.imageUrl && (
                  <img
                    src={link.imageUrl}
                    alt={link.title}
                    className="w-full h-40 object-cover rounded"
                  />
                )}
                <h3 className="font-bold mt-2">{link.title}</h3>
                <p className="text-sm">{link.description}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline mt-2 block"
                >
                  Visit Link
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

Categories.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};

export default Categories;