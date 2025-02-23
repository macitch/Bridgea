import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
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

const Tags = () => {
  const [linksByTag, setLinksByTag] = useState<Record<string, Link[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUserLinks() {
      if (!user) return;
      setLoading(true);
      try {
        // Query only links belonging to the current user
        const q = query(collection(db, "links"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const links: Link[] = [];
        querySnapshot.forEach((doc) => {
          links.push({ id: doc.id, ...doc.data() } as Link);
        });

        // Group links by tag.
        // A link can have multiple tags; add it to each relevant group.
        const grouped: Record<string, Link[]> = {};
        links.forEach((link) => {
          if (link.tags && link.tags.length > 0) {
            link.tags.forEach((tag) => {
              if (!grouped[tag]) {
                grouped[tag] = [];
              }
              grouped[tag].push(link);
            });
          } else {
            if (!grouped["Untagged"]) {
              grouped["Untagged"] = [];
            }
            grouped["Untagged"].push(link);
          }
        });

        setLinksByTag(grouped);
      } catch (error) {
        console.error("Error fetching links by tag:", error);
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
      <h1 className="text-2xl font-bold mb-4">Tags</h1>
      {Object.keys(linksByTag).length === 0 && <p>No links available.</p>}
      {Object.keys(linksByTag).map((tag) => (
        <div key={tag}>
          <h2 className="text-xl font-semibold mb-2">{tag}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linksByTag[tag].map((link) => (
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

Tags.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default Tags;