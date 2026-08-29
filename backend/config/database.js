import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    return conn;
  } catch (error) {
    console.warn(`Local MongoDB connection failed (${error.message}). Starting in-memory MongoDB server...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Connected to in-memory MongoDB at: ${uri}`);
      return conn;
    } catch (inMemErr) {
      console.error(`Failed to connect to fallback MongoDB: ${inMemErr.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
