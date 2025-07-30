// Utility function for exponential backoff
export const exponentialBackoff = async (fn, retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'unavailable' || error.code === 'resource-exhausted' || error.code === 'internal') {
        console.warn(`Retrying due to Firebase error: ${error.code}. Attempt ${i + 1}/${retries}`);
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
      } else {
        throw error; // Re-throw if it's not a transient error
      }
    }
  }
  throw new Error('Max retries exceeded');
};
