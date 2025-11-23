const { generateRecurringTasks } = require('../../lib/generation');

export default async function handler(req, res) {
  console.log('Cron job request received. Headers:', req.headers);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { secret } = req.headers;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await generateRecurringTasks(new Date(), { force: false });
    console.log('Cron job executed successfully.', result);
    res.status(200).json({ message: 'Daily tasks generated successfully.', result });
  } catch (error) {
    console.error('Error in cron job execution:', error);
    res.status(500).json({ message: 'Error generating daily tasks.' });
  }
}
