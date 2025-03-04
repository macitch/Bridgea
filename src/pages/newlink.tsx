import React, {
  useState,
  useReducer,
  FormEvent,
  useEffect,
  useRef,
  useCallback,
} from "react";
// Next.js router is used for navigation.
import { useRouter } from "next/router";
// Import Firestore methods and the db instance.
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/provider/Google/firebase";
// Import the dashboard layout component.
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
// Custom authentication hook for current user.
import { useAuth } from "@/context/AuthProvider";
// Import motion for animations.
import { motion } from "framer-motion";
// Import an icon (ArrowRight) from lucide-react.
import { ArrowRight } from "lucide-react";

// ----------------------------------------
// Helper Function: buildSearchTerms
// ----------------------------------------
// Concatenates various fields of a link (title, tags, categories, description, and URL)
// into a single, lowercased string to facilitate searching.
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

// ----------------------------------------
// Reducer and Types for Form State
// ----------------------------------------
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

// Reducer function to update the form state based on dispatched actions.
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

// Type guard for error handling.
function isErrorWithMessage(err: unknown): err is Error {
  return err instanceof Error || (typeof err === "object" && err !== null && "message" in err);
}

// ----------------------------------------
// MinimalForm Component
// ----------------------------------------
// Renders a simple form for the initial URL input.
interface MinimalFormProps {
  url: string;
  setUrl: (url: string) => void;
  error: string;
  loading: boolean;
  onLoadMetadata: () => void;
}

function MinimalForm({ url, setUrl, error, loading, onLoadMetadata }: MinimalFormProps) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-[var(--grey)] p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center font-urbanist text-[var(--black,#000)]">
          Add a New Link
        </h2>
        {error && (
          <p className="text-red-600 italic text-sm text-center font-urbanist mt-2">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-4 mt-4">
          <input
            type="text"
            placeholder="Paste your link here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="
              w-full
              h-12
              px-4
              rounded-md
              bg-[var(--white,#fff)]
              focus:ring-2
              focus:ring-[var(--orange)]
              font-urbanist
              text-base
            "
            autoComplete="url"
            aria-label="URL input"
          />
          <button
            onClick={onLoadMetadata}
            disabled={loading}
            className="
              w-full
              h-12
              bg-[var(--orange,#ff6523)]
              text-[var(--white,#fff)]
              rounded-lg
              font-bold
              hover:bg-[var(--orangeLightOut,#f0b2a6)]
              focus:ring-2
              focus:ring-blue-500
              focus:outline-none
              transition-colors
              duration-200
              font-urbanist
            "
            aria-label="Add link button"
          >
            {loading ? "Loading..." : "Add Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------
// CategoryEditor Component
// ----------------------------------------
// Allows user to edit the main category for a link.
// Updates the parent state immediately on every change.
interface CategoryEditorProps {
  mainCategory: string;
  setMainCategory: (category: string) => void;
  categorySuggestions: string[];
}

function CategoryEditor({ mainCategory, setMainCategory }: CategoryEditorProps) {
  const [editing, setEditing] = useState(false);
  // Local state for the input value.
  const [input, setInput] = useState(mainCategory);
  const [error, setError] = useState("");
  // Reference to the input element to control focus.
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Handle change events by updating both local and parent state.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setError("");
    setMainCategory(value);
  };

  // On blur, validate and finalize the category value.
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
      <label className="block text-sm font-base text-[var(--black,#000)] mb-2">
        Category
      </label>
      {editing ? (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`
              w-full
              h-10
              px-3
              py-2
              rounded-md
              font-semibold
              bg-[var(--white)]
              focus:ring-2
              focus:ring-orange-500
              focus:border-transparent
              ${error ? "border-red-500" : "border-gray-300"}
            `}
            aria-label="Category input"
          />
          {error && (
            <p className="text-red-600 italic text-sm mt-1 font-urbanist">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div
          className="flex items-center cursor-pointer rounded-md bg-[var(--white,#fff)] px-3 py-2 hover:bg-gray-50 transition-colors duration-200"
          onClick={() => {
            setEditing(true);
            setInput(mainCategory);
          }}
          aria-label="Edit category"
        >
          <span className="text-base font-semibold text-[var(--black)] font-urbanist">
            {mainCategory || "Add your own category..."}
          </span>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------
// TagManager Component
// ----------------------------------------
// Allows users to add custom tags for a link.
interface TagManagerProps {
  tags: string[];
  tagInput: string;
  dispatch: React.Dispatch<FormAction>;
}

function TagManager({ tags, tagInput, dispatch }: TagManagerProps) {
  const [tagError, setTagError] = useState("");

  // Handle key down event to add a tag on "Enter" or comma.
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

  return (
    <div>
      <label className="block text-sm font-base text-[var(--black,#000)] mb-2 font-urbanist">
        Tags
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="
              inline-flex
              items-center
              bg-[var(--orange,#ff6523)]
              font-semibold
              text-white
              px-3
              py-1
              rounded-full
              text-sm
            "
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_TAG", index })}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Add your own tags..."
          value={tagInput}
          onChange={(e) => {
            dispatch({ type: "SET_FIELD", field: "tagInput", value: e.target.value });
            setTagError("");
          }}
          onKeyDown={handleKeyDown}
          className={`
            w-full
            h-10
            px-3
            py-2
            rounded-md
            bg-[var(--white)]
            focus:ring-2
            focus:ring-[var(--orange)]
            focus:border-transparent
            ${tagError ? "border-red-500" : "border-gray-300"}
          `}
          aria-label="Tag input"
        />
        {tagError && (
          <p className="text-red-600 italic text-sm mt-1 font-urbanist">
            {tagError}
          </p>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------
// ActionButtons Component
// ----------------------------------------
// Renders Cancel and Save buttons for the form.
function ActionButtons({
  onCancel,
  loading,
}: {
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between mt-4">
      <button
        type="button"
        onClick={onCancel}
        className="
          bg-transparent
          text-gray-600
          px-6
          py-2
          rounded-full
          font-semibold
          hover:bg-gray-300
          transition-colors
          duration-200
        "
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="
          h-10
          px-6
          py-2
          bg-[var(--orange,#ff6523)]
          text-white
          rounded-full
          font-bold
          flex
          items-center
          gap-2
          hover:bg-[var(--orangeLightOut,#f0b2a6)]
          focus:ring-2
          focus:ring-[var(--orange)]
          focus:outline-none
          transition-colors
          duration-200
        "
      >
        Save
      </button>
    </div>
  );
}

// ----------------------------------------
// FullForm Component
// ----------------------------------------
// Renders the full form for adding a new link, including fields for title, description, tags, and category.
interface FullFormProps {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  categorySuggestions: string[];
  error: string;
  loading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  imageLoading: boolean;
  metadataLoading: boolean;
}

function FullForm({
  state,
  dispatch,
  categorySuggestions,
  error,
  loading,
  onSubmit,
  imageLoading,
  metadataLoading,
}: FullFormProps) {
  // Get router instance for navigation.
  const router = useRouter();
  // Handle cancel action by redirecting to the dashboard.
  const handleCancel = () => {
    router.push("/dashboard");
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[var(--white)]">
      <div className="
        w-[1100px]
        max-w-full
        rounded-[30px]
        p-6
        shadow-lg
        flex
        flex-col
        md:flex-row
        gap-8
        bg-[var(--grey,#f1f1f1)]
      ">
        {/* Form Section */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-4">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-base text-[var(--black)] mb-1 font-urbanist">
              Title
            </label>
            <input
              type="text"
              value={state.title}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })
              }
              placeholder="What are the hurdles to Europe's peace plan for Ukraine?"
              className="
                w-full
                h-10
                px-3
                py-2
                bg-[var(--white)]
                rounded-md
                font-semibold
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--orange)]
              "
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-base text-[var(--black,#000)] mb-1 font-urbanist">
              Description
            </label>
            <textarea
              value={state.description}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "description", value: e.target.value })
              }
              placeholder="Whatever words are used to frame the plan, enormous challenges lie ahead..."
              className="
                w-full
                h-28
                px-3
                py-2
                bg-[var(--white)]
                rounded-md
                font-semibold
                focus:outline-none
                focus:ring-2
                focus:ring-[var(--orange)]
                resize-none
              "
            />
          </div>

          {/* Render TagManager to add custom tags */}
          <TagManager
            tags={state.tags}
            tagInput={state.tagInput}
            dispatch={dispatch}
          />

          {/* Render CategoryEditor to allow category editing */}
          <CategoryEditor
            mainCategory={state.mainCategory}
            setMainCategory={(val) =>
              dispatch({ type: "SET_FIELD", field: "mainCategory", value: val })
            }
            categorySuggestions={categorySuggestions}
          />

          {/* Display error messages if any */}
          {error && (
            <p className="text-red-600 italic text-sm font-urbanist">{error}</p>
          )}

          {/* Render Save/Cancel buttons */}
          <ActionButtons onCancel={handleCancel} loading={loading} />
        </form>

        {/* Image Preview Section */}
        <div className="flex flex-col items-center justify-center w-full md:w-[350px]">
          <div className="
            w-full
            h-[450px]
            rounded-md
            overflow-hidden
            relative
            flex
            items-center
            justify-center
            shadow-lg
          ">
            {state.imageUrl ? (
              <>
                <motion.img
                  src={state.imageUrl}
                  alt="Link image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                )}
              </>
            ) : (
              <p className="text-gray-700 text-base text-center font-urbanist">
                No image available
              </p>
            )}
            {metadataLoading && (
              <div className="
                absolute
                inset-0
                bg-gray-500
                bg-opacity-50
                flex
                items-center
                justify-center
              ">
                <span className="text-white font-urbanist">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------
// NewLink Component
// ----------------------------------------
// Main component that allows users to add a new link.
// It toggles between a minimal form (for URL input) and a full form for link details.
export default function NewLink() {
  // Use useReducer for form state management.
  const [state, dispatch] = useReducer(formReducer, initialState);
  // State to control whether the full form is displayed.
  const [showFullForm, setShowFullForm] = useState(false);
  // Local state for error messages.
  const [error, setError] = useState("");
  // Local state for submission loading indicator.
  const [loading, setLoading] = useState(false);
  // Local state for metadata loading indicator.
  const [metadataLoading, setMetadataLoading] = useState(false);
  // Local state for image loading indicator.
  const [imageLoading, setImageLoading] = useState(false);
  // State for suggestions derived from existing links.
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);

  // Get Next.js router instance for navigation.
  const router = useRouter();
  // Get the authenticated user from context.
  const { user } = useAuth();

  // Handler to fetch metadata using the API.
  const handleLoadMetadata = async () => {
    // Validate URL format.
    const urlPattern = /^(https?:\/\/)/;
    if (!state.url.trim() || !urlPattern.test(state.url)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setMetadataLoading(true);
    setError("");

    try {
      // Run both the metadata fetch and a query to gather existing link suggestions.
      const [metadataRes, snapshot] = await Promise.all([
        fetch(`/api/getMetadata?url=${encodeURIComponent(state.url)}`),
        user
          ? getDocs(query(collection(db, "links"), where("userId", "==", user.uid)))
          : Promise.resolve(null),
      ]);

      // Parse the metadata response.
      const data = await metadataRes.json();

      // Update form state with fetched metadata.
      dispatch({ type: "SET_FIELD", field: "title", value: data.title || "" });
      dispatch({ type: "SET_FIELD", field: "description", value: data.description || "" });
      setImageLoading(true);
      dispatch({ type: "SET_FIELD", field: "imageUrl", value: data.imageUrl || "" });
      dispatch({
        type: "SET_FIELD",
        field: "tags",
        value: data.tags && data.tags.length > 0 ? data.tags : [],
      });

      // If AI returns categories, take the first category and update form state.
      if (data.categories && data.categories.length > 0) {
        const firstMain = data.categories[0].split(" → ")[0];
        dispatch({ type: "SET_FIELD", field: "mainCategory", value: firstMain });
      }

      // If a Firestore snapshot exists, extract category suggestions.
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

      // Show the full form after metadata is loaded.
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
      setImageLoading(false);
    }
  };

  // Handler to submit the form and add the link to Firestore.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate required fields.
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
      // Build a searchTerms string from form fields.
      const searchTerms = buildSearchTerms({
        title: state.title,
        tags: state.tags,
        categories: [state.mainCategory],
        description: state.description,
        url: state.url,
      });

      // Add the new link to the Firestore "links" collection.
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

      // Redirect to the dashboard after successful submission.
      router.push("/dashboard");
    } catch (err) {
      console.error("Error adding link:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render either the minimal form or the full form based on showFullForm state.
  return (
    <div className="h-screen overflow-hidden">
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
          imageLoading={imageLoading}
          metadataLoading={metadataLoading}
        />
      )}
    </div>
  );
}

// Use DashboardLayout as the page layout for NewLink.
NewLink.getLayout = function getLayout(page: React.ReactNode) {
  return <DashboardLayout>{page}</DashboardLayout>;
};