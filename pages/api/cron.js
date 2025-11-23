const { Agenda } = require('agenda');

const agenda = new Agenda({ db: { address: process.env.MONGODB_URI } });

export default async function handler(req, res) {
  console.log('Cron job request received. Headers:', req.headers);
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { secret } = req.headers;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await agenda.start();
  await agenda.every('1 day', 'crop-job');

  res.status(200).json({ message: 'Cron job scheduled' });
}
