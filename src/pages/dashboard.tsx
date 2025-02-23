import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { useRouter } from 'next/router';
import { useAuth } from "@/context/AuthProvider";
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/provider/Google/firebase";

export default function Dashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<any[]>([]);

  // Redirect if not logged in or workspace missing
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (userData && (!userData.workspaceName || userData.workspaceName.trim() === "")) {
        router.replace("/start");
      }
    }
  }, [user, userData, loading, router]);

  // Fetch links for the current user from Firestore
  useEffect(() => {
    if (user) {
      // Query: Get links where userId equals current user's uid and order them by creation date descending.
      const linksQuery = query(
        collection(db, "links"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(linksQuery, (snapshot) => {
        const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched links from Firebase:", linksData);
        setLinks(linksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!userData) {
    return <p>Loading user profile...</p>;
  }

  return (
    <div className="flex flex-col gap-4 flex-1 w-full h-svh p-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome to {userData.workspaceName}</h1>
      </div>

      <div className="mt-6">
        {/* Tabs Navigation */}
        <div className="border-b mb-4">
          <ul className="flex">
            <li className="mr-4 pb-2 border-b-2 border-orange-500 font-bold">
              Recent Added
            </li>
            {/* Additional tabs can be added here */}
          </ul>
        </div>

        {/* Recent Added Tab Content */}
        <div>
          {links.length === 0 ? (
            <p>No links added yet.</p>
          ) : (
            <ul className="space-y-4">
              {links.map(link => (
                <li key={link.id} className="p-4 border rounded-lg bg-[var(--white)]">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-semibold text-lg"
                  >
                    {link.title || link.url}
                  </a>
                  {link.description && (
                    <p className="text-gray-700 mt-2">{link.description}</p>
                  )}
                  {link.imageUrl && (
                    <img
                      src={link.imageUrl}
                      alt={link.title || "Link image"}
                      className="mt-2 max-h-40 object-cover rounded"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

Dashboard.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};