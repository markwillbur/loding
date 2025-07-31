import React, { useState } from 'react';

function RestaurantCard({ restaurant, userId, userNickname, handleVote, type, userSundayRestaurantsCount, getNextSunday11AM, handleDelete, hasVotedForOtherSundayRestaurant }) { // Added hasVotedForOtherSundayRestaurant
  const hasVoted = (restaurant.votes || []).includes(userId);
  const isVotingClosed = restaurant.deadline && new Date() > restaurant.deadline;
  const isSundayAddFirstDisabled = type === 'sunday' && userSundayRestaurantsCount === 0; // This check is mostly for the add button now
  const isAddedByUser = restaurant.addedBy === userNickname; // Check if the current user added the restaurant

  const [isDeleting, setIsDeleting] = useState(false); // Local state for delete loading

  // Wrapper function for handleDelete to manage local loading state
  const onDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await handleDelete(restaurant.id);
    } catch (error) {
      console.error("Error during delete operation:", error);
      // Error message will be handled by the modal in App.js
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine if the vote button should be disabled for Sunday restaurants based on new rules
  const isSundayVoteDisabled = () => {
    if (isVotingClosed) return true; // Always disabled if voting is closed
    if (type !== 'sunday') return false; // These rules only apply to Sunday restaurants

    if (isAddedByUser) {
      return true; // User auto-votes for their own listed restaurant, cannot vote again
    }

    // For non-listed Sunday restaurants:
    // If user hasn't voted for THIS restaurant AND has already voted for ANOTHER non-listed one
    if (!hasVoted && hasVotedForOtherSundayRestaurant) {
      return true;
    }

    // If no Sunday restaurants are added by the user, they can't vote for any
    if (userSundayRestaurantsCount === 0) {
      return true;
    }

    return false;
  };

  // Determine button text for Sunday restaurants
  const getSundayButtonText = () => {
    if (isVotingClosed) return 'Voting Closed';
    if (isAddedByUser) return 'Auto-voted (Your List)';
    if (hasVoted) return 'Unvote';
    if (hasVotedForOtherSundayRestaurant) return 'Only 1 Non-listed Vote';
    if (userSundayRestaurantsCount === 0) return 'Add first to vote';
    return 'Vote';
  };


  return (
    <div
      className="bg-white p-5 rounded-lg shadow-md flex flex-col justify-between border border-gray-200 hover:shadow-lg transition duration-300"
    >
      <div>
        <h4 className="text-lg font-semibold text-indigo-800 mb-2">{restaurant.name}</h4>
        <p className="text-gray-600 text-sm mb-2">
          Votes: <span className="font-bold text-lg text-green-600">{restaurant.votes ? restaurant.votes.length : 0}</span>
        </p>
        {restaurant.deadline && (
          <p className="text-gray-500 text-xs mb-3">
            Voting ends: {restaurant.deadline.toLocaleString()}
          </p>
        )}
        <p className="text-gray-500 text-xs mb-3">
          Added by: <span className="font-mono break-all">{isAddedByUser ? 'You' : restaurant.addedBy}</span>
        </p>
      </div>
      <div className="flex flex-col space-y-2 mt-4">
        <button
          onClick={() => handleVote(restaurant.id, restaurant.votes || [], type)}
          className={`w-full py-2 rounded-md font-semibold transition duration-300 shadow-md
            ${hasVoted && type !== 'sunday' // For flexible, red if voted
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }
            ${type === 'sunday' && isAddedByUser && 'bg-gray-500 text-white cursor-not-allowed'}
            ${type === 'sunday' && !isAddedByUser && hasVoted && 'bg-red-500 text-white hover:bg-red-600'}
            ${type === 'sunday' && !isAddedByUser && !hasVoted && hasVotedForOtherSundayRestaurant && 'bg-gray-500 text-white cursor-not-allowed'}
            ${type === 'sunday' && userSundayRestaurantsCount === 0 && 'bg-gray-500 text-white cursor-not-allowed'}
          `}
          disabled={type === 'sunday' ? isSundayVoteDisabled() : isVotingClosed}
        >
          {type === 'sunday' ? getSundayButtonText() : (hasVoted ? 'Unvote' : 'Vote')}
          {type !== 'sunday' && isVotingClosed && ' (Voting Closed)'}
        </button>

        {/* Delete button, only visible if user created the restaurant */}
        {isAddedByUser && (
          <button
            onClick={onDeleteClick}
            className="w-full py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}

export default RestaurantCard;
