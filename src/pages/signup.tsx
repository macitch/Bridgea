import { useState, useEffect, FormEvent } from "react";
import { signUp } from "../provider/Google/auth";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { motion } from "motion/react";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayname] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle sign-up form submission
  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Pass the collected fields to signUp
      await signUp(email, password, displayName, workspaceName);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex h-screen">
      {/* Left side: Contains logo and animated headline */}
      <div className="w-1/2 h-screen flex flex-col">
        {/* Top area with logo, title and description on the same line */}
        <div className="p-8 flex items-center">
          <img src="/assets/logo.svg" alt="Logo" className="w-16 h-auto mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-black">Bridgea</h1>
            <p className="text-sm text-gray-700">
              Organize Today, Discover Tomorrow.
            </p>
          </div>
        </div>
        {/* Centered animated headline */}
        <div className="flex-grow flex items-center justify-center">
          <h1 className="max-w-2xl text-center text-[64px]">
            Your space, your links,{" "}
            <span className="relative">
              organized
              <svg
                viewBox="0 0 286 73"
                fill="none"
                className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: 9999,
                  }}
                  d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                  stroke="#ff6523"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </h1>
        </div>
      </div>

      {/* Right side: Full-height SignUp Form Container */}
      <div className="w-1/2 h-screen flex items-center justify-center">
        <div className="w-full h-full p-8 space-y-6">
          {/* Form Title (centered and 400px wide) */}
          <div className="text- mb-4">
            <label className="block text-[4rem] text-[var(--black)] w-[400px] mx-auto">
              Get Access
            </label>
            <span className="block text-[1.5rem] w-[400px] mx-auto">
              Create your account and give in to your workspace.
            </span>
          </div>
          {/* Sign Up Form */}
          <form
            onSubmit={handleSignUp}
            className="space-y-4 flex flex-col items-center"
          >
            <input
              type="text"
              placeholder="Enter your first and Lastname"
              value={displayName}
              onChange={(e) => setDisplayname(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <div className="flex w-[400px] mt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-[3] h-[4.1rem] text-[var(--white)] rounded-xl font-bold bg-[var(--black)] hover:text-[var(--black)] hover:bg-[var(--orange)] ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
              <div className="w-px bg-gray-300 mx-4"></div>
              
              {/* Group container for the remaining three buttons */}
              <div className="flex flex-[3] space-x-2">
                <button
                  type="button"
                  className="group flex-1 h-[4.1rem] flex justify-center items-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="currentColor"
                    className="transition-colors duration-200 group-hover:text-[var(--orange)]"
                  >
                    <path d="M29.44,16.318c0-.993-.089-1.947-.255-2.864h-13.185v5.422h7.535c-.331,1.744-1.324,3.22-2.813,4.213v3.525h4.544c2.647-2.444,4.175-6.033,4.175-10.296Z" opacity=".4"></path>
                    <path d="M16,30c3.78,0,6.949-1.247,9.265-3.385l-4.544-3.525c-1.247,.84-2.838,1.349-4.722,1.349-3.64,0-6.733-2.456-7.84-5.765l-2.717,2.09-1.941,1.525c2.304,4.569,7.025,7.713,12.498,7.713Z"></path>
                    <path d="M8.16,18.66c-.28-.84-.445-1.731-.445-2.66s.165-1.82,.445-2.66v-3.615H3.502c-.955,1.884-1.502,4.009-1.502,6.275s.547,4.391,1.502,6.275h3.332s1.327-3.615,1.327-3.615Z" opacity=".4"></path>
                    <path d="M16,7.575c2.062,0,3.895,.713,5.358,2.087l4.009-4.009c-2.431-2.265-5.587-3.653-9.367-3.653-5.473,0-10.195,3.144-12.498,7.725l4.658,3.615c1.107-3.309,4.2-5.765,7.84-5.765Z"></path>
                  </svg>
                </button>
                <button type="button" className="group flex-1 h-[4.1rem] flex justify-center items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="currentColor"
                    className="transition-colors duration-200 group-hover:text-[var(--orange)]"
                  >
                    <path d="M16,2.345c7.735,0,14,6.265,14,14-.002,6.015-3.839,11.359-9.537,13.282-.7,.14-.963-.298-.963-.665,0-.473,.018-1.978,.018-3.85,0-1.312-.437-2.152-.945-2.59,3.115-.35,6.388-1.54,6.388-6.912,0-1.54-.543-2.783-1.435-3.762,.14-.35,.63-1.785-.14-3.71,0,0-1.173-.385-3.85,1.435-1.12-.315-2.31-.472-3.5-.472s-2.38,.157-3.5,.472c-2.677-1.802-3.85-1.435-3.85-1.435-.77,1.925-.28,3.36-.14,3.71-.892,.98-1.435,2.24-1.435,3.762,0,5.355,3.255,6.563,6.37,6.913-.403,.35-.77,.963-.893,1.872-.805,.368-2.818,.963-4.077-1.155-.263-.42-1.05-1.452-2.152-1.435-1.173,.018-.472,.665,.017,.927,.595,.332,1.277,1.575,1.435,1.978,.28,.787,1.19,2.293,4.707,1.645,0,1.173,.018,2.275,.018,2.607,0,.368-.263,.787-.963,.665-5.719-1.904-9.576-7.255-9.573-13.283,0-7.735,6.265-14,14-14Z"></path>
                  </svg>
                </button>
                <button type="button" className="group flex-1 h-[4.1rem] flex justify-center items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="currentColor"
                    className="transition-colors duration-200 group-hover:text-[var(--orange)]"
                  >
                    <path d="M18.05,16c0,5.018-4.041,9.087-9.025,9.087S0,21.018,0,16,4.041,6.913,9.025,6.913s9.025,4.069,9.025,9.087m9.901,0c0,4.724-2.02,8.555-4.513,8.555s-4.513-3.831-4.513-8.555,2.02-8.555,4.512-8.555,4.513,3.83,4.513,8.555m4.05,0c0,4.231-.71,7.664-1.587,7.664s-1.587-3.431-1.587-7.664,.71-7.664,1.587-7.664,1.587,3.431,1.587,7.664"></path>
                  </svg>
                </button>
              </div>
            </div>
          </form>

          {error && <p className="text-red-500 text-center">{error}</p>}
          {/* Sign In Link */}
          <div className="text-center text-sm text-black">
            Already have an account?{" "}
            <a href="/login" className="text-[var(--orange)] hover:underline">
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;