import path from 'path';
import dotenv from 'dotenv';

// Must run before any src/* module (specifically src/config/env.ts, which
// validates process.env synchronously at import time) is ever imported by
// the test file this setup file precedes.
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
