// Optional development fixtures: insert absent IDs, never reset existing data.
const fs = require('node:fs');
const path = require('node:path');

async function seedModel(model, documents) {
  for (const document of documents) {
    if (!Number.isSafeInteger(document.id)) throw new Error('Fixture ID must be an integer');
    await model.updateOne({id: document.id}, {$setOnInsert: document}, {upsert: true});
  }
}

async function main() {
  if (process.env.ALLOW_DEVELOPMENT_SEED !== '1') {
    throw new Error('Set ALLOW_DEVELOPMENT_SEED=1 only for an isolated development database');
  }
  const mongoose = require('mongoose');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo_db:27017/', {
      dbName: process.env.MONGODB_DATABASE || 'dealershipsDB', serverSelectionTimeoutMS: 10000,
    });
    const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reviews.json'), 'utf8'));
    const dealerships = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/dealerships.json'), 'utf8'));
    await seedModel(require('./review'), reviews.reviews);
    await seedModel(require('./dealership'), dealerships.dealerships);
  } finally {
    await mongoose.disconnect();
  }
}
if (require.main === module) {
  main().catch(() => {
    console.error('Development seeding failed; check opt-in, fixture files and database configuration');
    process.exitCode = 1;
  });
}
module.exports = {seedModel};
