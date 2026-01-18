require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../src/config/env');

const User = require('../src/models/User');
const Quiz = require('../src/models/Quiz');

const clearDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ Connected to database: ${mongoose.connection.name}`);

    // Get collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Found collections:', collections.map(c => c.name).join(', '));

    // Delete all users
    console.log('\n🗑️  Deleting all users...');
    const userResult = await User.deleteMany({});
    console.log(`   ✅ Deleted ${userResult.deletedCount} users`);

    // Delete all quizzes
    console.log('\n🗑️  Deleting all quizzes...');
    const quizResult = await Quiz.deleteMany({});
    console.log(`   ✅ Deleted ${quizResult.deletedCount} quizzes`);

    // Optionally delete all other collections (if any)
    const modelNames = mongoose.modelNames();
    const otherCollections = collections.filter(
      c => !['users', 'quizzes'].includes(c.name.toLowerCase())
    );

    if (otherCollections.length > 0) {
      console.log('\n🗑️  Deleting other collections...');
      for (const collection of otherCollections) {
        try {
          await mongoose.connection.db.collection(collection.name).deleteMany({});
          console.log(`   ✅ Cleared collection: ${collection.name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not clear ${collection.name}:`, error.message);
        }
      }
    }

    console.log('\n✅ Database cleared successfully!');
    console.log(`   - Users deleted: ${userResult.deletedCount}`);
    console.log(`   - Quizzes deleted: ${quizResult.deletedCount}`);

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
clearDatabase();
