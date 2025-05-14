# nest-queue

[![npm version](https://img.shields.io/npm/v/@furkanogutcu/nest-queue.svg)](https://www.npmjs.com/package/@furkanogutcu/nest-queue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NestJS queue management with BullMQ and Redis. Simple and type-safe.

## Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Using Custom Redis Key Prefix](#using-custom-redis-key-prefix)
  - [Using the Queue Service](#using-the-queue-service)
  - [Async Configuration](#async-configuration)
- [Development](#development)
- [License](#license)

## Installation

```bash
npm install @furkanogutcu/nest-queue
```

or

```bash
yarn add @furkanogutcu/nest-queue
```

## Features

- Easy integration with NestJS applications
- Support for Redis connection through `@furkanogutcu/nest-redis`
- BullMQ-based queue management with a simplified API
- Global or modular registration options
- Configurable queue options with BullMQ compatibility
- Custom Redis key prefix support
- Synchronous and asynchronous module configuration
- Type-safe interface with TypeScript

## Usage

### Basic Example

```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@furkanogutcu/nest-queue';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    QueueModule.register({
      redis: {
        url: 'redis://localhost:6379',
      },
      queues: [
        { name: 'emails' },
        {
          name: 'notifications',
          options: {
            defaultJobOptions: {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 1000,
              },
            },
          },
        },
      ],
      isGlobal: true, // optional
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### Using Custom Redis Key Prefix

By default, BullMQ creates Redis keys with the format `bull:QUEUE_NAME`. You can customize this prefix in three ways:

#### 1. Module-level prefix

Set a default prefix for all queues in the module:

```typescript
QueueModule.register({
  redis: {
    url: 'redis://localhost:6379',
  },
  redisKeyPrefix: 'myapp', // All queues will use this prefix by default
  queues: [
    { name: 'emails' }, // Will create Redis keys like "myapp:emails"
    { name: 'notifications' }, // Will create Redis keys like "myapp:notifications"
  ],
});
```

#### 2. Individual queue prefix

Set a prefix for specific queues:

```typescript
QueueModule.register({
  redis: {
    url: 'redis://localhost:6379',
  },
  queues: [
    {
      name: 'emails',
      options: {
        prefix: 'mail-service', // This will create Redis keys like "mail-service:emails"
      },
    },
    {
      name: 'notifications',
      options: {
        prefix: 'notification-service', // This will create Redis keys like "notification-service:notifications"
        defaultJobOptions: {
          attempts: 3,
        },
      },
    },
  ],
});
```

#### 3. Programmatic queue creation

Set a prefix when creating a queue with the service:

```typescript
const customQueue = this.queueService.create('metrics', {
  prefix: 'analytics', // This will create Redis keys like "analytics:metrics"
});
```

### Using the Queue Service

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '@furkanogutcu/nest-queue';

@Injectable()
export class AppService {
  constructor(private readonly queueService: QueueService) {}

  async addJob() {
    // Get an existing queue
    const emailQueue = this.queueService.get('emails');

    await emailQueue.add('send-welcome-email', {
      userId: 1,
      email: 'user@example.com',
    });
  }

  async createCustomQueue() {
    // Create a new queue (or get existing one with the same name)
    const customQueue = this.queueService.create('custom-queue', {
      defaultJobOptions: {
        attempts: 5,
      },
    });

    return customQueue;
  }

  async getAllQueues() {
    // Get all registered queues
    const queues = this.queueService.getAll();
    return queues;
  }
}
```

### Async Configuration

For scenarios where you need to load configuration asynchronously:

#### Using connection options

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueModule } from '@furkanogutcu/nest-queue';

@Module({
  imports: [
    ConfigModule.forRoot(),
    QueueModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          url: configService.get('REDIS_URL'),
        },
        queues: [
          { name: 'emails' },
          {
            name: 'notifications',
            options: {
              defaultJobOptions: {
                attempts: configService.get('QUEUE_MAX_ATTEMPTS', 3),
              },
            },
          },
        ],
        redisKeyPrefix: configService.get('REDIS_KEY_PREFIX'),
        isGlobal: true,
      }),
    }),
  ],
})
export class AppModule {}
```

#### Using existing RedisService instance

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule, RedisService } from '@furkanogutcu/nest-redis';
import { QueueModule } from '@furkanogutcu/nest-queue';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RedisModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('REDIS_URL'),
      }),
      isGlobal: true,
    }),
    QueueModule.registerAsync({
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        redis: redisService, // Pass the existing RedisService instance
        queues: [{ name: 'emails' }, { name: 'notifications' }],
      }),
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

## Development

### Requirements

- Node.js 18+
- npm or yarn

### Getting Started

Clone the project

```bash
  git clone https://github.com/furkanogutcu/nest-queue.git
```

Go to the project directory

```bash
  cd nest-queue
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start:dev
```

## License

This project is licensed under the [MIT License](LICENSE).
