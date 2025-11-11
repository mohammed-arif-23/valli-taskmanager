/**
 * Calculate points awarded based on submission status and rounding policy
 * Points are immutable once calculated and stored
 * 
 * @param {string} status - Submission status: 'completed', 'partial', 'not_started'
 * @param {number} defaultPoints - Default points for the task
 * @param {object} roundingPolicy - Policy object with method and partial_ratio
 * @returns {number} Points to award
 */
function calculatePoints(status, defaultPoints, roundingPolicy) {
  if (status === 'completed') {
    return defaultPoints;
  }

  if (status === 'partial') {
    const { method, partial_ratio } = roundingPolicy;
    const partialPoints = defaultPoints * partial_ratio;

    if (method === 'half_up') {
      return Math.ceil(partialPoints);
    }

    // Default to ceiling if method not recognized
    return Math.ceil(partialPoints);
  }

  if (status === 'not_started') {
    return 0;
  }

  throw new Error(`Invalid status: ${status}`);
}

module.exports = {
  calculatePoints,
};
