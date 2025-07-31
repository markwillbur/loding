import React from 'react';

function AddSundayRestaurantForm({
  newSundayRestaurantName,
  setNewSundayRestaurantName,
  newSundayRestaurantDescription,
  setNewSundayRestaurantDescription,
  handleAddSundayRestaurant,
  userSundayRestaurantsCount,
  getNextSunday11AM
}) {
  return (
    <div className="mb-8 p-4 sm:p-6 bg-teal-50 rounded-lg shadow-inner border-2 border-teal-200">
      <h2 className="text-2xl font-bold text-teal-700 mb-4">San tayo mag Sunday Loding </h2>
      <p className="text-sm text-gray-600 mb-4">
        Voting for this Sunday's meal ends automatically on{' '}
        <span className="font-semibold text-teal-800">{getNextSunday11AM().toLocaleString()}</span>.
        You can add up to 2 restaurants for this week.
      </p>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Restaurant Name for Sunday"
          value={newSundayRestaurantName}
          onChange={(e) => setNewSundayRestaurantName(e.target.value)}
          className="flex-grow p-3 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
        />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <textarea
          placeholder="Optional description (Church muna 12:00PM tas alampong after...)"
          value={newSundayRestaurantDescription}
          onChange={(e) => setNewSundayRestaurantDescription(e.target.value)}
          className="flex-grow p-3 border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"

        />
      </div>
      <div>
        <button
          onClick={handleAddSundayRestaurant}
          className="w-full px-6 py-3 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 transition duration-300 shadow-lg flex-shrink-0"
          disabled={userSundayRestaurantsCount >= 2}
        >
          Add Sunday Restaurant ({userSundayRestaurantsCount}/2)
        </button>
      </div>
    </div>
  );
}

export default AddSundayRestaurantForm;
