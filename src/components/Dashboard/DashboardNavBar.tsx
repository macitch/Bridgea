import React, { useState, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import SearchBar from '../UI/SearchBar';
import UserMenu from '../UI/UserMenu';
import { FirestoreUser } from '@/models/users';
import { useAuth } from '@/context/AuthProvider';
import { logout } from '@/provider/Google/auth';
import { collection, query, orderBy, startAt, endAt, getDocs, where } from "firebase/firestore";
import { db } from '@/provider/Google/firebase';
import debounce from 'lodash.debounce';
import { useRouter } from 'next/router';

export default function DashboardNavbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { userData } = useAuth();
  const router = useRouter();
  const avatarUrl = userData?.photoURL || "/assets/logo.png";

  const user: FirestoreUser = {
    displayName: userData?.displayName || "Loading",
    email: userData?.email || "Loading",
    createdAt: new Date(),
    photoURL: avatarUrl,
  };

  const debouncedSearch = useMemo(() => {
    return debounce((value: string) => {
      console.log("Debounced search triggered with value:", value);
      handleSearch(value);
    }, 300);
  }, [userData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log("Search input changed:", value);
    debouncedSearch(value);
  };

  const handleSearch = async (value: string) => {
    console.log('Starting search for:', value);
    setHasSearched(true);

    if (!value.trim()) {
      console.log("Search term is empty. Exiting search.");
      setSearchResults([]);
      return;
    }

    try {
      const currentUid = userData?.uid;
      if (!currentUid) {
        console.error("User is not authenticated.");
        return;
      }
      
      const q = query(
        collection(db, "links"),
        where("userId", "==", currentUid),
        orderBy("searchTerms"),
        startAt(value.toLowerCase()),
        endAt(value.toLowerCase() + "\uf8ff")
      );
      console.log("Firestore query constructed:", q);

      const snapshot = await getDocs(q);
      console.log("Firestore snapshot received. Document count:", snapshot.docs.length);

      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("Search results parsed:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Navigate to the SearchPage and pass the search query as a URL parameter.
  const handleResultClick = (result: any) => {
    console.log(`Clicked on result: ${result.title || "Untitled"}`);
    router.push(`/search?query=${encodeURIComponent(result.title || searchTerm)}`);
  };

  const handleProfile = () => {
    console.log('Navigating to profile page.');
    // Insert profile navigation logic here.
  };

  const handleLogout = async () => {
    console.log('Initiating logout process.');
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="w-full h-full flex items-center px-4 justify-between bg-[var(--white)] rounded-tl-2xl">
      <div className="relative flex items-center space-x-2">
        <SearchBar
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
          onSearch={(value: string) => {
            debouncedSearch.cancel();
            console.log("Enter key pressed. Immediate search with value:", value);
            handleSearch(value);
            router.push(`/search?query=${encodeURIComponent(value)}`);
          }}
        />

        {searchTerm && hasSearched && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {searchResults.length === 0 ? (
              <p className="p-2 text-gray-500">No results found.</p>
            ) : (
              searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {result.title || "Untitled"}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-gray-800">
          <MessageCircle className="w-5 h-5" />
        </button>
        <UserMenu
          user={user}
          onProfile={handleProfile}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}