import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/utils/firebase";
import DashboardSidebar from "@/components/Dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthProvider";

export default function NewLink() {
  // URL & Metadata
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Single main category
  const [mainCategory, setMainCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryInput, setCategoryInput] = useState("");
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Control minimal vs. full form
  const [showFullForm, setShowFullForm] = useState(false);

  // Other states
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  /**
   * Minimal view: Only URL input
   */
  const handleLoadMetadata = async () => {
    if (!url.trim()) {
      setError("Please paste a URL.");
      return;
    }
    setMetadataLoading(true);
    try {
      // Fetch metadata
      const res = await fetch(`/api/link-metadata?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      setTitle(data.title || "");
      setDescription(data.description || "");
      setImageUrl(data.imageUrl || "");
      setTags(data.tags && data.tags.length > 0 ? data.tags : []);

      // Pick the first detected category
      if (data.categories && data.categories.length > 0) {
        const firstMain = data.categories[0].split(" → ")[0];
        setMainCategory(firstMain);
        setCategoryInput(firstMain);
      }

      // Fetch category suggestions from user's existing links
      if (user) {
        const q = query(collection(db, "links"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const cats: string[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          if (docData.categories && Array.isArray(docData.categories)) {
            docData.categories.forEach((cat: string) => {
              if (!cats.includes(cat)) {
                cats.push(cat);
              }
            });
          }
        });
        setCategorySuggestions(cats);
      }

      setShowFullForm(true);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      setError("Error fetching metadata. Please try again.");
    } finally {
      setMetadataLoading(false);
    }
  };

  /**
   * Inline editing for category
   */
  const handleCategoryClick = () => {
    setEditingCategory(true);
    setTimeout(() => categoryInputRef.current?.focus(), 100);
  };
  const handleCategoryBlur = () => {
    setMainCategory(categoryInput.trim());
    setEditingCategory(false);
  };
  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCategoryInput(e.target.value);
  };
  const filteredSuggestions = categorySuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(categoryInput.toLowerCase())
  );

  /**
   * Tag handlers
   */
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setTagInput("");
    }
  };
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  /**
   * Submit the link
   */
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
        categories: [mainCategory], // store as array
        tags,
        isFavorite,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Error adding link:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Minimal View (URL only)
   */
  if (!showFullForm) {
    return (
      <div className="flex h-[calc(100vh-60px)] rounded-md items-center justify-center bg-red-500">
        <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-lg">
          <h2 className="text-2xl font-semibold text-[var(--black)] text-center">Add a New Link</h2>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="flex flex-col gap-4 mt-4">
            <input
              type="text"
              placeholder="Paste your link here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full h-12 px-4 rounded-md bg-[var(--lightGrey)] focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLoadMetadata}
              disabled={metadataLoading}
              className="w-full h-12 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700"
            >
              {metadataLoading ? "Loading..." : "Add Link"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Full Form View (no large gap to the sidebar)
   */
  return (
    <div className="flex h-[calc(100vh-60px)]">
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="bg-white rounded-xl shadow-md h-full w-full p-6 flex flex-col">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Title Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100"
              />
            </div>
  
            {/* Form Content in Two Columns */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Description, Tags, Category */}
              <div className="flex flex-col justify-between">
                {/* Description */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--black)]">Description</label>
                  <textarea
                    value={description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    className="w-full h-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 resize-none"
                  />
                </div>
  
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[var(--black)]">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <div key={index} className="flex items-center bg-yellow-200 px-3 py-1 rounded-full">
                        <span className="text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 text-red-500 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
  
                {/* Main Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Main Category</label>
                  {editingCategory ? (
                    <input
                      type="text"
                      ref={categoryInputRef}
                      value={categoryInput}
                      onChange={handleCategoryChange}
                      onBlur={handleCategoryBlur}
                      className="w-full h-12 px-4 py-3 border border-gray-300 rounded-xl bg-gray-100"
                    />
                  ) : (
                    <div className="flex items-center cursor-pointer" onClick={() => setEditingCategory(true)}>
                      <span className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-100">
                        {mainCategory || "No category set"}
                      </span>
                      <span className="ml-2 text-gray-500 hover:text-gray-700">✏️</span>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Right Column: Image Preview */}
              <div className="flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Link Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </div>
            </div>
  
            {/* Submit Button */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white rounded-xl font-bold bg-black hover:text-black hover:bg-orange-500"
              >
                {loading ? "Saving..." : "Add Link"}
              </button>
              {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

NewLink.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardSidebar>{page}</DashboardSidebar>;
};
