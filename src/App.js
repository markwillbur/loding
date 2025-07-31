import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, getDoc, deleteDoc } from 'firebase/firestore';

// Import refactored components and utilities
import { convertFirestoreTimestampToDate, getNextSunday11AM, getUpcomingMonday12AM, areDatesSameDayHourMinute, getMealDeadline, isSameDay } from './utils/dateHelpers';
import { exponentialBackoff } from './utils/firebaseHelpers';
import Modal from './components/Modal';
import RestaurantCard from './components/RestaurantCard';
import AddSundayRestaurantForm from './components/AddSundayRestaurantForm';
import AddFlexibleRestaurantForm from './components/AddFlexibleRestaurantForm';
import VotingStatusDisplay from './components/VotingStatusDisplay';
import AuthForm from './components/AuthForm';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState(null);

  const [sundayRestaurants, setSundayRestaurants] = useState([]);
  const [flexibleRestaurants, setFlexibleRestaurants] = useState([]); // All flexible restaurants
  const [filteredFlexibleRestaurants, setFilteredFlexibleRestaurants] = useState([]); // Filtered for view

  const [newSundayRestaurantName, setNewSundayRestaurantName] = useState('');
  const [newFlexibleRestaurantName, setNewFlexibleRestaurantName] = useState('');
  const [selectedFlexibleMealType, setSelectedFlexibleMealType] = useState('');
  // State for the date selected when adding a flexible restaurant
  const [selectedFlexibleAddDate, setSelectedFlexibleAddDate] = useState('');
  // State for the date selected in the calendar view, defaults to current date
  const [selectedFlexibleViewDate, setSelectedFlexibleViewDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format

  const [sundayVotingDeadline, setSundayVotingDeadline] = useState(null);
  const [flexibleVotingDeadline, setFlexibleVotingDeadline] = useState(null);

  const [sundayWinner, setSundayWinner] = useState(null);
  const [flexibleWinner, setFlexibleWinner] = useState(null);

  const [sundayMessage, setSundayMessage] = useState('');
  const [flexibleMessage, setFlexibleMessage] = useState('');

  const [userSundayRestaurantsCount, setUserSundayRestaurantsCount] = useState(0);
  // NEW: State to track if user has voted for a non-listed Sunday restaurant
  const [hasVotedForOtherSundayRestaurant, setHasVotedForOtherSundayRestaurant] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const showCustomModal = (content) => {
    setModalContent(content);
    setShowModal(true);
  };

  // Initialize Firebase and set up authentication
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authentication = getAuth(app);
        setDb(firestore);
        setAuth(authentication);

        const unsubscribeAuth = onAuthStateChanged(authentication, (user) => {
          if (user) {
            setUserId(user.uid);
            setIsLoggedIn(true);
            console.log("Auth State Changed: User logged in, UID:", user.uid);
          } else {
            setUserId(null);
            setIsLoggedIn(false);
            setUserNickname(null); // Clear nickname on logout
            console.log("Auth State Changed: No user logged in. Redirecting to AuthForm.");
          }
          setIsAuthReady(true);
          console.log("Auth Ready:", true, "Current userId:", user ? user.uid : 'N/A');
        });

        return () => unsubscribeAuth();
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        showCustomModal(`Failed to initialize app: ${error.message}`);
      }
    };

    initializeFirebase();
  }, []);


  // Fetch user nickname when db and userId become available
  useEffect(() => {
    const fetchUserNickname = async () => {
      if (db && userId && isLoggedIn) { // Only fetch if db is ready, user is set, and logged in
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await exponentialBackoff(() => getDoc(userDocRef));
          if (userDocSnap.exists()) {
            setUserNickname(userDocSnap.data().nickname);
          } else {
            console.log("User document not found in Firestore for UID:", userId);
            // Fallback to email if available, otherwise UID
            setUserNickname(auth.currentUser?.email || userId);
          }
        } catch (fetchError) {
          console.error("Error fetching user nickname:", fetchError);
          setUserNickname(auth.currentUser?.email || userId); // Fallback on error
        }
      } else {
        setUserNickname(null); // Clear nickname if not logged in or db/userId not ready
      }
    };

    fetchUserNickname();
  }, [db, userId, isLoggedIn, auth]); // Depend on db, userId, isLoggedIn, and auth


  // Handle user logout
  const handleLogout = async () => {
    if (auth) {
      try {
        await exponentialBackoff(() => signOut(auth));
        showCustomModal('Logged out successfully!');
      } catch (error) {
        console.error("Error logging out:", error);
        showCustomModal(`Failed to log out: ${error.message}`);
      }
    }
  };


  // Determine the winner based on current time and votes for a given list of restaurants
  const determineWinner = useCallback((currentRestaurants, type) => {
    const now = new Date();
    const activeVotingRestaurants = currentRestaurants.filter(r => r.deadline && r.deadline > now);

    if (activeVotingRestaurants.length > 0) {
      if (type === 'sunday') {
        setSundayWinner(null);
        setSundayMessage('Voting is still active for this Sunday!');
        setSundayVotingDeadline(getNextSunday11AM());
      } else {
        setFlexibleWinner(null);
        setFlexibleMessage('Voting is still active for some flexible restaurants!');
        const earliestDeadline = activeVotingRestaurants.reduce((minDate, r) =>
          (r.deadline && (!minDate || r.deadline < minDate)) ? r.deadline : minDate, null
        );
        setFlexibleVotingDeadline(earliestDeadline);
      }
    } else {
      const pastDeadlineRestaurants = currentRestaurants.filter(r => r.deadline && r.deadline <= now);

      if (pastDeadlineRestaurants.length > 0) {
        let maxVotes = -1;
        let winningRestaurant = null;

        pastDeadlineRestaurants.forEach(restaurant => {
          const votesCount = restaurant.votes ? restaurant.votes.length : 0;
          if (votesCount > maxVotes) {
            maxVotes = votesCount;
            winningRestaurant = restaurant;
          } else if (votesCount === maxVotes && winningRestaurant) {
            if (restaurant.createdAt && restaurant.createdAt.toDate && winningRestaurant.createdAt && winningRestaurant.createdAt.toDate && restaurant.createdAt.toDate() < winningRestaurant.createdAt.toDate()) {
              winningRestaurant = restaurant;
            }
          }
        });

        if (winningRestaurant) {
          if (type === 'sunday') {
            setSundayWinner(winningRestaurant);
            setSundayMessage(`🎉 ${winningRestaurant.name} wins with ${maxVotes} votes! 🎉`);
          } else {
            setFlexibleWinner(winningRestaurant);
            setFlexibleMessage(`🎉 ${winningRestaurant.name} wins with ${maxVotes} votes! 🎉`);
          }
        } else {
          if (type === 'sunday') {
            setSundayWinner(null);
            setSundayMessage('No winner determined for this Sunday yet. Add restaurants!');
          } else {
            setFlexibleWinner(null);
            setFlexibleMessage('No winner determined for flexible restaurants yet. Add restaurants and set deadlines!');
          }
        }
      } else {
        if (type === 'sunday') {
          setSundayWinner(null);
          setSundayMessage('No voting sessions have ended for this Sunday yet.');
        } else {
          setFlexibleWinner(null);
          setFlexibleMessage('No voting sessions have ended for flexible restaurants yet.');
        }
      }
    }
  }, []);

  // Fetch restaurants from Firestore and set up real-time listener
  useEffect(() => {
    if (!db || !userId || !isLoggedIn) {
      console.log("Firestore useEffect skipped: db, userId, or isLoggedIn not ready.", {db, userId, isLoggedIn});
      setSundayRestaurants([]);
      setFlexibleRestaurants([]);
      setFilteredFlexibleRestaurants([]);
      setUserSundayRestaurantsCount(0);
      setHasVotedForOtherSundayRestaurant(false); // Reset this too
      return;
    }
    console.log("Firestore useEffect running: db, userId, isLoggedIn are ready.", {db, userId, isLoggedIn});

    const restaurantsColRef = collection(db, `restaurants`);

    const unsubscribe = onSnapshot(restaurantsColRef, (snapshot) => {
      const allFetchedRestaurants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: convertFirestoreTimestampToDate(doc.data().deadline),
        createdAt: convertFirestoreTimestampToDate(doc.data().createdAt)
      }));

      const currentUpcomingMonday = getUpcomingMonday12AM();
      const currentNextSunday = getNextSunday11AM();
      const currentWeekMondayId = currentUpcomingMonday.getTime();

      const currentSundayRestaurants = allFetchedRestaurants.filter(r =>
        r.type === 'sunday' &&
        r.weekId === currentWeekMondayId &&
        r.deadline && areDatesSameDayHourMinute(r.deadline, currentNextSunday)
      );
      setSundayRestaurants(currentSundayRestaurants);

      const userAddedCount = currentSundayRestaurants.filter(r => r.addedBy === userId).length;
      setUserSundayRestaurantsCount(userAddedCount);

      // NEW: Check if user has voted for any non-listed Sunday restaurant
      const userHasVotedForAnyNonListedSunday = currentSundayRestaurants.some(r =>
        r.addedBy !== userId && // Not their own listed restaurant
        (r.votes || []).includes(userId) // User has voted for it
      );
      setHasVotedForOtherSundayRestaurant(userHasVotedForAnyNonListedSunday);


      const currentFlexibleRestaurants = allFetchedRestaurants.filter(r => r.type === 'flexible');
      setFlexibleRestaurants(currentFlexibleRestaurants);

      determineWinner(currentSundayRestaurants, 'sunday');
      determineWinner(currentFlexibleRestaurants, 'flexible');

    }, (error) => {
      console.error("Error fetching restaurants:", error);
      showCustomModal(`Failed to load restaurants: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, isLoggedIn, determineWinner]);

  // Filter flexible restaurants whenever flexibleRestaurants or selectedFlexibleViewDate changes
  useEffect(() => {
    const viewDate = new Date(selectedFlexibleViewDate);
    const filtered = flexibleRestaurants.filter(r =>
      r.deadline && isSameDay(r.deadline, viewDate)
    );
    setFilteredFlexibleRestaurants(filtered);
  }, [flexibleRestaurants, selectedFlexibleViewDate]);


  // Add a new restaurant for the Sunday feature
  const handleAddSundayRestaurant = async () => {
    if (!db || !userId || !isLoggedIn) {
      showCustomModal('You must be logged in to add a restaurant.');
      console.warn("Attempted to add Sunday restaurant before logged in.");
      return;
    }

    if (!newSundayRestaurantName.trim()) {
      showCustomModal('Please enter a restaurant name for Sunday.');
      return;
    }
    if (userSundayRestaurantsCount >= 2) {
      showCustomModal('You can only add up to 2 restaurants for the Sunday feature.');
      return;
    }

    const sundayDeadline = getNextSunday11AM();
    const currentWeekMondayId = getUpcomingMonday12AM().getTime();

    try {
      const restaurantsColRef = collection(db, `restaurants`);
      await exponentialBackoff(() => addDoc(restaurantsColRef, {
        name: newSundayRestaurantName.trim(),
        votes: [userId], // User's vote is added by default
        createdAt: Timestamp.now(),
        deadline: sundayDeadline,
        type: 'sunday',
        addedBy: userNickname,
        weekId: currentWeekMondayId,
      }));
      setNewSundayRestaurantName('');
      showCustomModal('Sunday restaurant added successfully! Your vote has been automatically cast.');
    } catch (e) {
      console.error("Error adding Sunday restaurant: ", e);
      showCustomModal(`Failed to add Sunday restaurant: ${e.message}`);
    }
  };

  // Add a new restaurant for the flexible feature
  const handleAddFlexibleRestaurant = async () => {
    if (!db || !userId || !isLoggedIn) {
      showCustomModal('You must be logged in to add a restaurant.');
      console.warn("Attempted to add Flexible restaurant before logged in.");
      return;
    }

    if (!newFlexibleRestaurantName.trim() || !selectedFlexibleMealType || !selectedFlexibleAddDate) {
      showCustomModal('Please enter a restaurant name, select a date, and select a meal type.');
      return;
    }

    const baseDateForDeadline = new Date(selectedFlexibleAddDate);
    const calculatedDeadlineDate = getMealDeadline(selectedFlexibleMealType, baseDateForDeadline);

    if (!calculatedDeadlineDate) {
      showCustomModal('Invalid meal type or date selected. Please choose Breakfast, Lunch, or Dinner.');
      return;
    }

    try {
      const restaurantsColRef = collection(db, `restaurants`);
      await exponentialBackoff(() => addDoc(restaurantsColRef, {
        name: newFlexibleRestaurantName.trim(),
        votes: [],
        createdAt: Timestamp.now(),
        deadline: calculatedDeadlineDate,
        type: 'flexible',
        addedBy: userNickname,
      }));
      setNewFlexibleRestaurantName('');
      setSelectedFlexibleMealType('');
      setSelectedFlexibleAddDate('');
      showCustomModal('Flexible restaurant added successfully!');
    } catch (e) {
      console.error("Error adding flexible restaurant: ", e);
      showCustomModal(`Failed to add flexible restaurant: ${e.message}`);
    }
  };

  // Handle voting for a restaurant
  const handleVote = async (restaurantId, currentVotes, restaurantType) => {
    if (!db || !userId || !isLoggedIn) {
      showCustomModal('You must be logged in to vote.');
      console.warn("Attempted to vote before logged in.");
      return;
    }

    const restaurantRef = doc(db, `restaurants`, restaurantId);
    const hasVoted = currentVotes.includes(userId);

    if (restaurantType === 'sunday') {
      const targetRestaurant = sundayRestaurants.find(r => r.id === restaurantId);

      if (targetRestaurant && targetRestaurant.addedBy === userId) {
        showCustomModal('You automatically vote for restaurants you add. You cannot unvote your own listed restaurant.');
        return; // Prevent voting/unvoting on own listed restaurant
      }

      // Logic for non-listed Sunday restaurants
      if (!hasVoted) { // User wants to vote for a non-listed Sunday restaurant
        // Find if the user has already voted for ANY other non-listed Sunday restaurant
        const existingVoteForOtherSundayRestaurant = sundayRestaurants.find(r =>
          r.type === 'sunday' &&
          r.addedBy !== userId && // Not their own listed restaurant
          (r.votes || []).includes(userId) // User has voted for it
        );

        if (existingVoteForOtherSundayRestaurant) {
          showCustomModal('You can only vote for one restaurant you did not list for Sunday. Unvote your current choice first.');
          return; // Prevent voting for a second non-listed restaurant
        }
      }
    }

    // Proceed with vote/unvote for both Sunday (if allowed) and Flexible restaurants
    try {
      if (hasVoted) {
        await exponentialBackoff(() => updateDoc(restaurantRef, {
          votes: arrayRemove(userId)
        }));
        showCustomModal('Vote removed!');
      } else {
        await exponentialBackoff(() => updateDoc(restaurantRef, {
          votes: arrayUnion(userId)
        }));
        showCustomModal('Vote cast!');
      }
    } catch (e) {
      console.error("Error updating vote: ", e);
      showCustomModal(`Failed to cast vote: ${e.message}`);
    }
  };

  // Handle deleting a restaurant
  const handleDeleteRestaurant = async (restaurantId) => {
    if (!db || !userId || !isLoggedIn) {
      showCustomModal('You must be logged in to delete a restaurant.');
      console.warn("Attempted to delete restaurant before logged in.");
      return;
    }

    try {
      const restaurantRef = doc(db, `restaurants`, restaurantId);
      await exponentialBackoff(() => deleteDoc(restaurantRef));
      showCustomModal('Restaurant deleted successfully!');
    } catch (e) {
      console.error("Error deleting restaurant: ", e);
      showCustomModal(`Failed to delete restaurant: ${e.message}`);
    }
  };

  // Main render logic
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-4 sm:p-6 flex flex-col items-center font-inter">
      {/* This Modal is now rendered at the top level, always available */}
      {showModal && <Modal content={modalContent} onClose={() => setShowModal(false)} />}

      {/* Conditionally render one of the main views based on auth state */}
      {!isAuthReady ? (
        // Loading screen
        <div className="flex items-center justify-center h-full text-2xl text-indigo-800 font-semibold">
          Loading application...
        </div>
      ) : !isLoggedIn ? (
        // AuthForm if not logged in and auth is ready
        <AuthForm auth={auth} showCustomModal={showCustomModal} db={db} />
      ) : (
        // Main app content ONLY if logged in AND auth is ready
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max_w_4xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-800">
              LODING 🍽️
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 shadow-md"
            >
              Logout
            </button>
          </div>
          <p className="text-center text-gray-600 mb-6">
            San tayo kain mga LODS? Vote tayo dito para wala ng ebas!
          </p>

          {userId && (
            <div className="text-center text-sm text-gray-500 mb-4 p-2 bg-indigo-50 rounded-lg">
              <span> Hi, {userNickname}. PROTEIN LODING NA TAYO LODS!</span>
            </div>
          )}

          {/* Sunday Feature Section */}
          <AddSundayRestaurantForm
            newSundayRestaurantName={newSundayRestaurantName}
            setNewSundayRestaurantName={setNewSundayRestaurantName}
            handleAddSundayRestaurant={handleAddSundayRestaurant}
            userSundayRestaurantsCount={userSundayRestaurantsCount}
            getNextSunday11AM={getNextSunday11AM}
          />

          <VotingStatusDisplay
            type="sunday"
            winner={sundayWinner}
            message={sundayMessage}
            votingDeadline={sundayVotingDeadline}
          />

          <div className="p-4 bg-red-50 rounded-lg shadow-inner mb-8">
            <h3 className="text-xl font-bold text-gray-700 mb-4">Sunday Restaurants</h3>
            {sundayRestaurants.length === 0 ? (
              <p className="text-center text-gray-500">No restaurants added for this Sunday yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sundayRestaurants
                  .sort((a, b) => (b.votes ? b.votes.length : 0) - (a.votes ? a.votes.length : 0))
                  .map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      userId={userId}
                      userNickname={userNickname}
                      handleVote={handleVote}
                      type="sunday"
                      userSundayRestaurantsCount={userSundayRestaurantsCount}
                      getNextSunday11AM={getNextSunday11AM}
                      handleDelete={handleDeleteRestaurant}
                      hasVotedForOtherSundayRestaurant={hasVotedForOtherSundayRestaurant}
                    />
                  ))}
            </div>
          )}
        </div>

        {/* Flexible Feature Section */}
        <AddFlexibleRestaurantForm
          newFlexibleRestaurantName={newFlexibleRestaurantName}
          setNewFlexibleRestaurantName={setNewFlexibleRestaurantName}
          selectedFlexibleMealType={selectedFlexibleMealType}
          setSelectedFlexibleMealType={setSelectedFlexibleMealType}
          selectedFlexibleAddDate={selectedFlexibleAddDate}
          setSelectedFlexibleAddDate={setSelectedFlexibleAddDate}
          handleAddFlexibleRestaurant={handleAddFlexibleRestaurant}
          userNickname={userNickname}
        />

        <VotingStatusDisplay
          type="flexible"
          winner={flexibleWinner}
          message={flexibleMessage}
          votingDeadline={flexibleVotingDeadline}
        />

        {/* Flexible Restaurants Calendar View */}
        <div className="p-4 sm:p-6 bg-gray-50 rounded-lg shadow-inner mt-8">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">View Flexible Restaurants by Date</h2>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            <label htmlFor="viewDate" className="text-lg font-medium text-gray-700">Select Date:</label>
            <input
              type="date"
              id="viewDate"
              value={selectedFlexibleViewDate}
              onChange={(e) => setSelectedFlexibleViewDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 flex-shrink-0"
              title="Select date to view restaurants"
            />
          </div>

          <h3 className="text-xl font-bold text-gray-700 mb-4">Restaurants for {new Date(selectedFlexibleViewDate).toLocaleDateString()}</h3>
          {filteredFlexibleRestaurants.length === 0 ? (
            <p className="text-center text-gray-500">No restaurants listed for this day.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredFlexibleRestaurants
                .sort((a, b) => (b.votes ? b.votes.length : 0) - (a.votes ? a.votes.length : 0))
                .map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    userId={userId}
                    userNickname={userNickname}
                    handleVote={handleVote}
                    type="flexible"
                    handleDelete={handleDeleteRestaurant}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

export default App;
