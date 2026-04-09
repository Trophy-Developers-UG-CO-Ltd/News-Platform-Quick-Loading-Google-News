// prisma.config.ts
// Prisma 7+ configuration for MongoDB connection
import { definePrismaConfig } from '@prisma/internals';

export default definePrismaConfig({
  datasource: {
    provider: 'mongodb',
    url: process.env.MONGO_URI,
  },
});
