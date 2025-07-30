import React from 'react';

function AddFlexibleRestaurantForm({
  newFlexibleRestaurantName,
  setNewFlexibleRestaurantName,
  selectedFlexibleAddDate,
  setSelectedFlexibleAddDate,
  selectedFlexibleMealType,
  setSelectedFlexibleMealType,
  handleAddFlexibleRestaurant
}) {
  return (
    <div className="mb-8 p-4 sm:p-6 bg-indigo-50 rounded-lg shadow-inner border-2 border-indigo-200">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4">Grind Never Stops Schedule 📅</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add restaurants with custom deadlines for any occasion!
      </p>

      {/* Changed to flex-wrap and adjusted width/flex classes for responsiveness */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Restaurant Name"
          value={newFlexibleRestaurantName}
          onChange={(e) => setNewFlexibleRestaurantName(e.target.value)}
          // Added w-full for small screens, sm:flex-grow for larger, and min-w-0
          className="w-full sm:flex-grow p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-w-0"
        />
        {/* NEW: Wrapper div for Date and Mealtime to keep them beside each other */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto sm:flex-grow">
          <input
              type='date'
              value={selectedFlexibleAddDate}
              onChange={(e) => setSelectedFlexibleAddDate(e.target.value)}
              // Added w-full for small screens, sm:flex-grow for larger, and min-w-0
              className="w-full sm:flex-grow p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-w-0"
          />
          <select
            value={selectedFlexibleMealType}
            onChange={(e) => setSelectedFlexibleMealType(e.target.value)}
            // Added w-full for small screens, sm:flex-grow for larger, and min-w-0
            className="bg-white w-full sm:flex-grow p-3 border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-w-0"
            title="Select meal time deadline"
          >
            <option value="">--Select Meal Time--</option>
            <option value="breakfast">Breakfast (11:00 AM)</option>
            <option value="lunch">Lunch (1:00 PM)</option>
            <option value="dinner">Dinner (5:30 PM)</option>
          </select>
        </div>
        <button
          onClick={handleAddFlexibleRestaurant}
          // Added w-full for small screens, sm:w-auto to reset width on sm, and flex-shrink-0
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-300 shadow-lg flex-shrink-0"
        >
          Add Flexible Restaurant
        </button>
      </div>
    </div>
  );
}

export default AddFlexibleRestaurantForm;
