import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { exponentialBackoff } from '../utils/firebaseHelpers';

// Removed showCustomModal from props as errors will be inline
function AuthForm({ auth, db }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [displayError, setDisplayError] = useState(''); // New state for inline error messages

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDisplayError(''); // Clear previous errors on new submission

    try {
      if (isLoginMode) {
        // Login existing user
        await exponentialBackoff(() => signInWithEmailAndPassword(auth, email, password));
        // No inline success message for login, user is redirected
      } else {
        // --- Signup Logic ---
        if (password !== confirmPassword) {
          setDisplayError('Passwords do not match.');
          setLoading(false);
          return;
        }

        if (!nickname.trim()) {
          setDisplayError('Please enter a nickname.');
          setLoading(false);
          return;
        }

        // Register new user
        const userCredential = await exponentialBackoff(() => createUserWithEmailAndPassword(auth, email, password));
        const user = userCredential.user;

        // Store additional user data (nickname) in Firestore
        if (db && user) {
          await exponentialBackoff(() => setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            nickname: nickname.trim(),
            createdAt: Timestamp.now(),
          }));
          // No inline success message for signup, user is redirected
        } else {
          console.warn("Firestore instance (db) or user not available after signup. Nickname not saved.");
          // This case might still show a modal if App.js passes showCustomModal to AuthForm
          // But for inline errors, we'd handle it here.
          setDisplayError("Account created, but failed to save nickname. Please contact support.");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.'
            break;
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          default:
            errorMessage = `Authentication failed: ${errorMessage}`;
        }
      }
      setDisplayError(errorMessage); // Set the inline error message
    } finally {
      setLoading(false);
    }
  };

   return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-blue-200 flex items-center justify-center p-4 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-teal-800 mb-6">
          LODING {isLoginMode ? 'Login' : 'Sign Up'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Inline Error Display */}
          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
              <span className="block sm:inline">{displayError}</span>
            </div>
          )}
          {!isLoginMode && (
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required={!isLoginMode}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            />
          </div>
          {/* Confirm Password field - only for Signup mode */}
          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLoginMode}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              // Clear all fields and errors when switching modes
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setNickname('');
              setDisplayError(''); // Clear error message
            }}
            className="text-teal-600 hover:text-teal-800 font-medium transition duration-200"
            disabled={loading}
          >
            {isLoginMode ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthForm;
