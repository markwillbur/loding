import React from 'react';

function AddSundayRestaurantForm({
  newSundayRestaurantName,
  setNewSundayRestaurantName,
  handleAddSundayRestaurant,
  userSundayRestaurantsCount,
  getNextSunday11AM
}) {
  return (
    <div className="mb-8 p-4 sm:p-6 bg-red-50 rounded-lg shadow-inner border-2 border-red-200">
      <h2 className="text-2xl font-bold text-red-700 mb-4">San tayo mag Sunday Loding </h2>
      <p className="text-sm text-gray-600 mb-4">
        Voting for this Sunday's meal ends automatically on{' '}
        <span className="font-semibold text-red-800">{getNextSunday11AM().toLocaleString()}</span>.
        You can add up to 2 restaurants for this week.
      </p>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Restaurant Name for Sunday"
          value={newSundayRestaurantName}
          onChange={(e) => setNewSundayRestaurantName(e.target.value)}
          className="flex-grow p-3 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-200"
        />
        <button
          onClick={handleAddSundayRestaurant}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition duration-300 shadow-lg flex-shrink-0"
          disabled={userSundayRestaurantsCount >= 2}
        >
          Add Sunday Restaurant ({userSundayRestaurantsCount}/2)
        </button>
      </div>
    </div>
  );
}

export default AddSundayRestaurantForm;
