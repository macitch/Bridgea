// pages/new-link.tsx
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
  const [tags, setTags] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Fetch metadata from the API route when the URL is updated
  useEffect(() => {
    async function fetchMetadata() {
      if (!url.trim()) return;
      setMetadataLoading(true);
      try {
        console.log("Calling API route for URL:", url);
        const res = await fetch(`/api/link-metadata?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          console.log("Received metadata from API:", data);
          // Populate fields if data exists; allow manual editing afterwards
          setTitle(data.title || "");
          setDescription(data.description || "");
          setImageUrl(data.imageUrl || "");
        } else {
          console.error("Failed to fetch metadata, status:", res.status);
        }
      } catch (err) {
        console.error("Error in fetchMetadata:", err);
      } finally {
        setMetadataLoading(false);
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
      console.log("Submitting new link:", {
        url,
        title,
        description,
        imageUrl,
        categories,
        tags,
        isFavorite,
      });
      await addDoc(collection(db, "links"), {
        url,
        title,
        description,
        imageUrl,
        categories: categories.split(",").map((cat) => cat.trim()).filter(Boolean),
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        isFavorite,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log("Link added successfully");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error adding link:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100vh - 100px] items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-[500px]">
        <div className="text-left mb-4">
          <h2 className="text-2xl text-black font-bold">Add a New Link</h2>
          <p className="text-base text-gray-700">
            Save your favorite link for easy access. The metadata will auto-populate if available.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Field */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              id="url"
              type="text"
              placeholder="Enter URL"
              value={url}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
              required
            />
          </div>

          {/* Title Field */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="Title (auto-loaded or enter manually)"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
            />
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
              rows={3}
            />
          </div>

          {/* Image URL Field */}
          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              id="imageUrl"
              type="text"
              placeholder="Image URL (auto-loaded or enter manually)"
              value={imageUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
            />
          </div>

          {/* Categories Field */}
          <div>
            <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
              Categories
            </label>
            <input
              id="categories"
              type="text"
              placeholder="Enter categories separated by commas"
              value={categories}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCategories(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
            />
          </div>

          {/* Tags Field */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas"
              value={tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
              className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:border-black"
            />
          </div>

          {/* Favorite Field */}
          <div className="flex items-center">
            <input
              id="favorite"
              type="checkbox"
              checked={isFavorite}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIsFavorite(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="favorite" className="text-sm font-medium text-gray-700">
              Mark as Favorite
            </label>
          </div>

          {/* Metadata Preview Section */}
          {metadataLoading && <p className="text-gray-500 text-sm">Loading metadata...</p>}
          {imageUrl && (
            <div className="mt-4">
              <img src={imageUrl} alt="Link Preview" className="w-full rounded-lg" />
            </div>
          )}

          {/* Submit Button */}
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