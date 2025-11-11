require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
    console.log('\n🎉 Everything looks good! You can now run:');
    console.log('   npm run seed    - to seed the database');
    console.log('   npm run dev     - to start the app');
    console.log('   npm run worker  - to start the background worker');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('1. Check your MONGODB_URI in .env.local');
    console.log('2. Ensure your IP is whitelisted in MongoDB Atlas');
    console.log('3. Verify your username and password are correct');
    console.log('4. See SETUP_ATLAS.md for detailed setup instructions');
    process.exit(1);
  }
}

testConnection();
