/**
 * Test script to verify points update when submission status changes
 * 
 * Run this with: node test-points-update.js
 */

const { calculatePoints } = require('./lib/points');

// Test scenarios
const testCases = [
  {
    name: 'Partial to Completed',
    oldStatus: 'partial',
    newStatus: 'completed',
    defaultPoints: 100,
    roundingPolicy: { method: 'half_up', partial_ratio: 0.5 },
  },
  {
    name: 'Not Started to Completed',
    oldStatus: 'not_started',
    newStatus: 'completed',
    defaultPoints: 100,
    roundingPolicy: { method: 'half_up', partial_ratio: 0.5 },
  },
  {
    name: 'Not Started to Partial',
    oldStatus: 'not_started',
    newStatus: 'partial',
    defaultPoints: 100,
    roundingPolicy: { method: 'half_up', partial_ratio: 0.5 },
  },
  {
    name: 'Completed to Partial (downgrade)',
    oldStatus: 'completed',
    newStatus: 'partial',
    defaultPoints: 100,
    roundingPolicy: { method: 'half_up', partial_ratio: 0.5 },
  },
];

console.log('Testing Points Calculation\n');
console.log('='.repeat(60));

testCases.forEach((test) => {
  const oldPoints = calculatePoints(test.oldStatus, test.defaultPoints, test.roundingPolicy);
  const newPoints = calculatePoints(test.newStatus, test.defaultPoints, test.roundingPolicy);
  
  console.log(`\n${test.name}`);
  console.log(`  Old Status: ${test.oldStatus} → ${oldPoints} points`);
  console.log(`  New Status: ${test.newStatus} → ${newPoints} points`);
  console.log(`  Change: ${newPoints - oldPoints > 0 ? '+' : ''}${newPoints - oldPoints} points`);
});

console.log('\n' + '='.repeat(60));
console.log('\nAll calculations completed successfully!');
