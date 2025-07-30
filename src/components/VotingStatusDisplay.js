import React from 'react';

function VotingStatusDisplay({ winner, message, votingDeadline, type }) {
  return (
    <div className={`mb-6 p-4 rounded-lg shadow-sm ${type === 'sunday' ? 'bg-red-100' : 'bg-green-100'}`}>
      <h3 className={`text-xl font-bold mb-2 ${type === 'sunday' ? 'text-red-700' : 'text-green-700'}`}>
        {type === 'sunday' ? 'Sunday Voting Status' : 'Flexible Voting Status'}
      </h3>
      {winner ? (
        <p className={`text-lg font-bold text-center animate-pulse ${type === 'sunday' ? 'text-red-800' : 'text-green-800'}`}>
          {message}
        </p>
      ) : (
        <p className="text-lg font-semibold text-gray-700 text-center">
          {message || (type === 'sunday' ? 'Voting is ongoing for Sunday!' : 'Voting is ongoing for flexible restaurants!')}
        </p>
      )}
      {votingDeadline && !winner && (
        <p className="text-md text-gray-600 text-center mt-2">
          Next voting session ends: {votingDeadline.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default VotingStatusDisplay;
