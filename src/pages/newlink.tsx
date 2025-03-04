import React, { useState, useReducer, useMemo, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, getDocs, query, where, serverTimestamp, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { useAuth } from "@/context/AuthProvider";
import { motion } from "framer-motion"; 

// Helper function to build searchTerms (unchanged)
function buildSearchTerms({
  title,
  tags,
  categories,
  description,
  url,
}: {
  title: string;
  tags: string[];
  categories: string[];
  description: string;
  url: string;
}) {
  return `${title} ${tags.join(" ")} ${categories.join(" ")} ${description} ${url}`.toLowerCase();
}

// Reducer for form state (unchanged)
interface FormState {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  tagInput: string;
  mainCategory: string;
  isFavorite: boolean;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: any }
  | { type: "ADD_TAG"; tag: string }
  | { type: "REMOVE_TAG"; index: number };

const initialState: FormState = {
  url: "",
  title: "",
  description: "",
  imageUrl: "",
  tags: [],
  tagInput: "",
  mainCategory: "",
  isFavorite: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "ADD_TAG":
      return { ...state, tags: [...state.tags, action.tag], tagInput: "" };
    case "REMOVE_TAG":
      return { ...state, tags: state.tags.filter((_, i) => i !== action.index) };
    default:
      return state;
  }
}

// Type guard for error handling (unchanged)
function isErrorWithMessage(err: unknown): err is Error {
  return err instanceof Error || (typeof err === "object" && err !== null && "message" in err);
}

// MinimalForm Component (Unchanged, but included for completeness)
interface MinimalFormProps {
  url: string;
  setUrl: (url: string) => void;
  error: string;
  loading: boolean;
  onLoadMetadata: () => void;
}

function MinimalForm({ url, setUrl, error, loading, onLoadMetadata }: MinimalFormProps) {
  return (
    <div className="flex h-[calc(100vh-60px)] rounded-md items-center justify-center">
      <div className="bg-[var(--grey,#f1f1f1)] p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-[var(--black,#000000)] text-center font-urbanist">Add a New Link</h2>
        {error && <p className="text-red-500 text-center text-lg font-urbanist">{error}</p>}
        <div className="flex flex-col gap-4 mt-4">
          <input
            type="text"
            placeholder="Paste your link here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-12 px-4 rounded-md bg-[var(--white,#ffffff)] focus:ring-2 focus:ring-blue-500 border border-gray-300 font-urbanist"
            autoComplete="url"
            aria-label="URL input"
          />
          <button
            onClick={onLoadMetadata}
            disabled={loading}
            className="w-full h-12 bg-[var(--orange,#ff6523)] text-[var(--white,#ffffff)] rounded-lg font-bold hover:bg-[var(--orangeLightOut,#f0b2a6)] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 font-urbanist"
            aria-label="Add link button"
          >
            {loading ? "Loading..." : "Add Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// CategoryEditor Component (Unchanged, but included for completeness)
interface CategoryEditorProps {
  mainCategory: string;
  setMainCategory: (category: string) => void;
  categorySuggestions: string[];
}

function CategoryEditor({ mainCategory, setMainCategory, categorySuggestions }: CategoryEditorProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(mainCategory);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = useMemo(
    () => categorySuggestions.filter((s) => s.toLowerCase().includes(input.toLowerCase())),
    [categorySuggestions, input]
  );

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleBlur = () => {
    if (!input.trim()) {
      setError("Main category is required.");
    } else {
      setMainCategory(input.trim());
      setError("");
      setEditing(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xl font-medium text-[var(--black,#000000)] mb-2 font-urbanist" htmlFor="mainCategory">
        Main Category
      </label>
      {editing ? (
        <div className="relative">
          <input
            ref={inputRef}
            id="mainCategory"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            onBlur={handleBlur}
            className={`w-full h-12 px-4 py-3 border rounded-lg bg-[var(--white,#ffffff)] focus:ring-2 focus:ring-orange-500 focus:border-transparent ${error ? "border-red-500" : "border-gray-300"} font-urbanist`}
            aria-label="Main category input"
            aria-describedby={error ? "category-error" : undefined}
            autoComplete="off"
          />
          {error && (
            <p id="category-error" className="text-red-500 text-sm mt-1 font-urbanist">
              {error}
            </p>
          )}
          {filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 bg-[var(--white,#ffffff)] border border-gray-300 rounded mt-1 max-h-40 overflow-auto w-full shadow-md">
              {filteredSuggestions.map((suggestion) => (
                <motion.li
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setMainCategory(suggestion);
                    setError("");
                    setEditing(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200 font-urbanist"
                  role="option"
                  aria-label={`Select category ${suggestion}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {suggestion}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div
          className="flex items-center cursor-pointer border border-gray-300 rounded-lg bg-[var(--white,#ffffff)] p-3 hover:bg-gray-50 transition-colors duration-200"
          onClick={() => setEditing(true)}
          aria-label="Edit main category"
        >
          <span className="text-lg font-medium text-[var(--black,#000000)] font-urbanist">{mainCategory || "No category set"}</span>
          <span className="ml-2 text-gray-500 hover:text-gray-700">✏️</span>
        </div>
      )}
    </div>
  );
}

// TagManager Component (Unchanged, but included for completeness)
interface TagManagerProps {
  tags: string[];
  tagInput: string;
  dispatch: React.Dispatch<FormAction>;
  categorySuggestions: string[]; // Added for tag suggestions
}

function TagManager({ tags, tagInput, dispatch, categorySuggestions }: TagManagerProps) {
  const [tagError, setTagError] = useState<string>("");
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (!trimmed) {
        setTagError("Tag cannot be empty.");
      } else if (tags.includes(trimmed)) {
        setTagError("Tag already exists.");
      } else {
        dispatch({ type: "ADD_TAG", tag: trimmed });
        setTagError("");
      }
    }
  };

  const filteredSuggestions = useMemo(
    () => categorySuggestions.filter((s) => s.toLowerCase().includes(tagInput.toLowerCase())),
    [categorySuggestions, tagInput]
  );

  return (
    <div className="w-full">
      <label className="block text-xl font-medium text-[var(--black,#000000)] mb-2 font-urbanist" htmlFor="tagsInput">
        Tags
      </label>
      <div className="flex flex-wrap gap-3 mt-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center bg-[var(--orange,#ff6523)] px-4 py-2 rounded-full text-[var(--white,#ffffff)] text-lg font-medium transition-transform duration-200 hover:scale-105"
            role="listitem"
            aria-label={`Tag: ${tag}`}
          >
            <span className="font-urbanist">{tag}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_TAG", index })}
              className="ml-3 text-[var(--white,#ffffff)] hover:text-gray-200 text-xl transition-colors duration-200"
              aria-label={`Remove tag ${tag}`}
              title="Remove tag"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <input
          id="tagsInput"
          type="text"
          placeholder="Add a tag (press Enter or ,)"
          value={tagInput}
          onChange={(e) => {
            dispatch({ type: "SET_FIELD", field: "tagInput", value: e.target.value });
            setTagError("");
          }}
          onKeyDown={handleKeyDown}
          className={`mt-4 w-full px-4 py-2 border rounded-lg bg-[var(--white,#ffffff)] focus:ring-2 focus:ring-orange-500 focus:border-transparent ${tagError ? "border-red-500" : "border-gray-300"} font-urbanist`}
          aria-label="Add tag input"
          aria-describedby={tagError ? "tag-error" : undefined}
          autoComplete="off"
        />
        {tagError && (
          <p id="tag-error" className="text-red-500 text-sm mt-1 font-urbanist">
            {tagError}
          </p>
        )}
        {filteredSuggestions.length > 0 && (
          <ul className="absolute z-10 bg-[var(--white,#ffffff)] border border-gray-300 rounded mt-1 max-h-40 overflow-auto w-full shadow-md">
            {filteredSuggestions.map((suggestion) => (
              <motion.li
                key={suggestion}
                onClick={() => {
                  dispatch({ type: "ADD_TAG", tag: suggestion });
                  dispatch({ type: "SET_FIELD", field: "tagInput", value: "" });
                  setTagError("");
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors duration-200 font-urbanist"
                role="option"
                aria-label={`Suggest tag ${suggestion}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {suggestion}
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// FullForm Component (Updated to Accept imageLoading Prop)
interface FullFormProps {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  categorySuggestions: string[];
  error: string;
  loading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  imageLoading: boolean; // Prop to indicate image loading state
  metadataLoading: boolean; // Existing prop
}

function FullForm({ state, dispatch, categorySuggestions, error, loading, onSubmit, imageLoading, metadataLoading }: FullFormProps) {
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    url: "",
  });

  const validateField = (field: keyof FormState, value: string) => {
    let error = "";
    switch (field) {
      case "title":
        if (!value.trim()) error = "Title is required.";
        break;
      case "description":
        if (!value.trim()) error = "Description is required.";
        break;
      case "url":
        if (!value.trim()) error = "URL is required.";
        if (!/^(https?:\/\/)/.test(value)) error = "Please enter a valid URL starting with http:// or https://";
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleInputChange = (field: keyof FormState, value: string) => {
    dispatch({ type: "SET_FIELD", field, value });
    validateField(field, value);
  };

  return (
    <div className="flex h-[calc(100vh-60px)]">
      <div className="flex-1 p-8 flex flex-col justify-between bg-[var(--grey,#f1f1f1)] rounded-xl shadow-lg">
        <form onSubmit={onSubmit} className="h-full flex flex-col gap-6">
          {/* Two-Column Layout with Mobile Stacking */}
          <div className="flex-1 flex flex-col md:flex-row gap-6 h-full">
            {/* Left Column: 50% Width for Title, Description, Tags, Category */}
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              {/* Title Field */}
              <div className="w-full">
                <label className="block text-xl font-medium text-[var(--black,#000000)] mb-2 font-urbanist" htmlFor="titleInput">
                  Title
                </label>
                <input
                  id="titleInput"
                  type="text"
                  value={state.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full h-12 px-4 py-3 border rounded-lg bg-[var(--white,#ffffff)] focus:ring-2 focus:ring-orange-500 focus:border-transparent ${fieldErrors.title ? "border-red-500" : "border-gray-300"} font-urbanist`}
                  placeholder="Enter the title"
                  aria-label="Title input"
                  aria-describedby={fieldErrors.title ? "title-error" : undefined}
                  autoComplete="title"
                />
                {fieldErrors.title && (
                  <p id="title-error" className="text-red-500 text-sm mt-1 font-urbanist">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="w-full">
                <label className="block text-xl font-medium text-[var(--black,#000000)] mb-2 font-urbanist" htmlFor="descriptionInput">
                  Description
                </label>
                <textarea
                  id="descriptionInput"
                  value={state.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`w-full h-32 px-4 py-3 border rounded-lg bg-[var(--white,#ffffff)] focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${fieldErrors.description ? "border-red-500" : "border-gray-300"} font-urbanist`}
                  placeholder="Enter a description"
                  aria-label="Description input"
                  aria-describedby={fieldErrors.description ? "description-error" : undefined}
                  autoComplete="description"
                />
                {fieldErrors.description && (
                  <p id="description-error" className="text-red-500 text-sm mt-1 font-urbanist">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Tags Field */}
              <TagManager tags={state.tags} tagInput={state.tagInput} dispatch={dispatch} categorySuggestions={categorySuggestions} />

              {/* Main Category Field */}
              <div className="w-full">
                <CategoryEditor
                  mainCategory={state.mainCategory}
                  setMainCategory={(value) => dispatch({ type: "SET_FIELD", field: "mainCategory", value })}
                  categorySuggestions={categorySuggestions}
                />
              </div>
            </div>

            {/* Right Column: 50% Width for Image and Add Link Button */}
            <div className="w-full md:w-1/2 flex flex-col gap-6 h-full">
              {/* Image Preview: 50% width, 85% height with loading and error handling */}
              <div className="h-[85%] flex items-center justify-center p-4 relative">
                {state.imageUrl ? (
                  <>
                    <motion.img
                      src={state.imageUrl}
                      alt="Link Preview"
                      className="w-full h-full object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder-image.jpg"; // Fallback image
                        // Notify NewLink to update imageLoading state via prop or context if needed
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      aria-label="Link preview image"
                    />
                    {imageLoading && (
                      <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg"></div> // Skeleton loader
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                    <p className="text-lg text-gray-500 font-urbanist">No image available</p>
                  </div>
                )}
                {metadataLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 rounded-lg">
                    <span className="text-white font-urbanist">Loading...</span>
                  </div>
                )}
              </div>

              {/* Add Link Button: 50% width, 15% height, styled like NewLinkButton (no icon) */}
              <div className="h-[15%] flex items-center justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full max-w-md h-full bg-[var(--orange,#ff6523)] text-[var(--white,#ffffff)] rounded-lg font-bold hover:bg-[var(--orangeLightOut,#f0b2a6)] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors duration-200 font-urbanist"
                  aria-label="Submit link"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2 animate-spin">◌</span> Saving...
                    </span>
                  ) : (
                    "Add Link"
                  )}
                </button>
                {error && (
                  <p className="text-red-500 text-center mt-2 text-lg font-urbanist" role="alert">
                    {error}
                  </p>
                )}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 rounded-lg">
                    <span className="text-white font-urbanist">Saving...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Component (Updated to Manage imageLoading State Internally)
export default function NewLink() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [showFullForm, setShowFullForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false); // Ensure this state is defined and managed
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  const router = useRouter();
  const { user } = useAuth();

  const handleLoadMetadata = async () => {
    const urlPattern = /^(https?:\/\/)/;
    if (!state.url.trim() || !urlPattern.test(state.url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setMetadataLoading(true);
    setError("");
    try {
      const [metadataRes, snapshot] = await Promise.all([
        fetch(`/api/getMetadata?url=${encodeURIComponent(state.url)}`),
        user ? getDocs(query(collection(db, "links"), where("userId", "==", user.uid))) : Promise.resolve(null),
      ]);

      const data = await metadataRes.json();
      dispatch({ type: "SET_FIELD", field: "title", value: data.title || "" });
      dispatch({ type: "SET_FIELD", field: "description", value: data.description || "" });
      setImageLoading(true); // Set image loading to true before fetching
      dispatch({ type: "SET_FIELD", field: "imageUrl", value: data.imageUrl || "" });
      dispatch({ type: "SET_FIELD", field: "tags", value: data.tags && data.tags.length > 0 ? data.tags : [] });

      if (data.categories && data.categories.length > 0) {
        const firstMain = data.categories[0].split(" → ")[0];
        dispatch({ type: "SET_FIELD", field: "mainCategory", value: firstMain });
      }

      if (snapshot) {
        const cats: string[] = [];
        (snapshot as QuerySnapshot<DocumentData>).forEach((doc) => {
          const docData = doc.data();
          if (docData.categories && Array.isArray(docData.categories)) {
            docData.categories.forEach((cat: string) => {
              if (!cats.includes(cat)) cats.push(cat);
            });
          }
          if (docData.tags && Array.isArray(docData.tags)) {
            docData.tags.forEach((tag: string) => {
              if (!cats.includes(tag)) cats.push(tag);
            });
          }
        });
        setCategorySuggestions(cats);
      }

      setShowFullForm(true);
    } catch (err) {
      console.error("Error fetching metadata:", err);
      if (isErrorWithMessage(err)) {
        setError(err.message || "Error fetching metadata. Check your URL and try again.");
      } else {
        setError("Error fetching metadata. Check your URL and try again.");
      }
    } finally {
      setMetadataLoading(false);
      setImageLoading(false); // Clear image loading when metadata is done, regardless of success/failure
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!state.url.trim()) {
      setError("URL is required.");
      return;
    }
    if (!state.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!state.mainCategory.trim()) {
      setError("Main category is required.");
      return;
    }
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    setLoading(true);
    try {
      const searchTerms = buildSearchTerms({
        title: state.title,
        tags: state.tags,
        categories: [state.mainCategory],
        description: state.description,
        url: state.url,
      });

      await addDoc(collection(db, "links"), {
        url: state.url,
        title: state.title,
        description: state.description,
        imageUrl: state.imageUrl,
        categories: [state.mainCategory],
        tags: state.tags,
        isFavorite: state.isFavorite,
        userId: user.uid,
        createdAt: serverTimestamp(),
        searchTerms,
      });
      router.push("/dashboard"); // Redirect as requested, no success message
    } catch (err) {
      console.error("Error adding link:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!showFullForm ? (
        <MinimalForm
          url={state.url}
          setUrl={(url) => dispatch({ type: "SET_FIELD", field: "url", value: url })}
          error={error}
          loading={metadataLoading}
          onLoadMetadata={handleLoadMetadata}
        />
      ) : (
        <FullForm
          state={state}
          dispatch={dispatch}
          categorySuggestions={categorySuggestions}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          imageLoading={imageLoading} // Pass imageLoading prop
          metadataLoading={metadataLoading} // Pass metadataLoading prop
        />
      )}
    </>
  );
}

NewLink.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};