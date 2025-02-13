import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthProvider";

export default function NewLink() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch metadata from the API route when the URL is updated
  useEffect(() => {
    async function fetchMetadata() {
      if (!url.trim()) return;
      try {
        const res = await fetch(`/api/link-metadata?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || "");
        }
      } catch (err) {
        console.error("Error fetching metadata:", err);
      }
    }
    fetchMetadata();
  }, [url]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "links"), {
        url,
        title,
        description,
        imageUrl,
        categories: categories.split(",").map((cat) => cat.trim()),
        isFavorite,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      router.push("/links");
    } catch (err) {
      console.error("Error adding link: ", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-[500px]">
        <div className="text-left mb-4">
          <h2 className="text-2xl text-black font-bold">Add a New Link</h2>
          <p className="text-base text-gray-700">
            Save your favorite link for easy access.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Field */}
          <div>
            <input
              type="text"
              placeholder="Enter URL"
              value={url}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
              required
            />
          </div>
          {/* Title Field (auto-loaded or manual) */}
          <div>
            <input
              type="text"
              placeholder="Title (auto-loaded or enter manually)"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
            />
          </div>
          {/* Additional fields (description, imageUrl, etc.) go here */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-white rounded-xl font-bold bg-black hover:text-black hover:bg-orange-500"
          >
            {loading ? "Saving..." : "Add Link"}
          </button>
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}

NewLink.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};