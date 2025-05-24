# nest-queue

[![npm version](https://img.shields.io/npm/v/@furkanogutcu/nest-queue.svg)](https://www.npmjs.com/package/@furkanogutcu/nest-queue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

NestJS queue management with BullMQ and Redis. Simple and type-safe.

## Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [Basic Example](#basic-example)
  - [Setting Redis Key Prefix](#setting-redis-key-prefix)
  - [Setting Default Queue Options](#setting-default-queue-options)
  - [Using the Queue Service](#using-the-queue-service)
  - [Creating and Using Workers](#creating-and-using-workers)
  - [Async Configuration](#async-configuration)
  - [Bull Board UI](#bull-board-ui)
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
- Synchronous and asynchronous module configuration
- Type-safe interface with TypeScript
- Worker decorators for easy queue processing
- Bull Board UI integration for queue monitoring

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
      config: {
        // Set default options for all queues
        defaultQueueOptions: {
          prefix: 'myapp', // Set Redis key prefix for all queues
          defaultJobOptions: {
            attempts: 3,
            removeOnComplete: 100,
            removeOnFail: 200,
          },
        },
      },
      queues: [
        { name: 'emails' }, // Will use default options
        {
          name: 'notifications',
          options: {
            // Queue-specific options override defaults
            prefix: 'notification-service', // Override the default prefix
            defaultJobOptions: {
              attempts: 5, // Override the default attempts
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

### Setting Redis Key Prefix

By default, BullMQ creates Redis keys with the format `bull:QUEUE_NAME`. You can customize this prefix in three ways:

#### 1. Module-level prefix

Set a default prefix for all queues in the module:

```typescript
QueueModule.register({
  redis: {
    url: 'redis://localhost:6379',
  },
  config: {
    defaultQueueOptions: {
      prefix: 'myapp', // All queues will use this prefix by default
    },
  },
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

### Setting Default Queue Options

You can define default options that will be applied to all queues in your application through the `config.defaultQueueOptions` property. These defaults will be used unless overridden at the queue level.

This is useful when you want to apply consistent settings across your queues, such as Redis key prefix, retry attempts, job removal policies, or rate limiting.

```typescript
QueueModule.register({
  redis: {
    url: 'redis://localhost:6379',
  },
  config: {
    // Default options for ALL queues
    defaultQueueOptions: {
      prefix: 'myapp', // Default Redis key prefix for all queues
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
      limiter: {
        max: 50,
        duration: 10000,
      },
    },
  },
  queues: [
    {
      name: 'low-priority',
      // This queue will use all the default options
    },
    {
      name: 'high-priority',
      options: {
        // Override specific defaults while keeping others
        defaultJobOptions: {
          attempts: 5,
          priority: 2,
          // backoff, removeOnComplete and removeOnFail from defaults are preserved
        },
        // limiter and prefix from defaults are preserved
      },
    },
    {
      name: 'custom-queue',
      options: {
        // Completely custom options that ignore all defaults
        prefix: 'custom',
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: false,
        },
        limiter: null, // Disable rate limiting for this queue
      },
    },
  ],
});
```

The `defaultQueueOptions` accepts all standard BullMQ queue options including:

- `prefix`: Default Redis key prefix for all queues (replaces the old redisKeyPrefix option)
- `defaultJobOptions`: Default settings for jobs added to the queues
- `limiter`: Default rate limiting settings
- Any other valid BullMQ QueueOptions

### Using the Queue Service

The `QueueService` provides methods to interact with your queues. It allows you to add jobs, create new queues, and get existing ones.

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '@furkanogutcu/nest-queue';

@Injectable()
export class AppService {
  constructor(private readonly queueService: QueueService) {}

  async addJob() {
    // Get an existing queue
    const emailQueue = this.queueService.get('emails');

    // Add a job to the queue
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
        removeOnComplete: true,
        removeOnFail: false,
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

### Creating and Using Workers

Workers are responsible for processing jobs from queues. This library provides decorators to easily create and register workers.

> **🔄 Dependency Injection Support**: Workers are fully integrated with NestJS dependency injection. When you register a worker as a provider, it will be instantiated by NestJS with all its dependencies properly injected. The library uses a self-registration pattern where workers automatically register themselves in the internal registry during module initialization, ensuring single instance usage and proper DI support.

#### 1. Create a Worker

```typescript
import { Worker, BaseWorker, Job } from '@furkanogutcu/nest-queue';
import { Injectable } from '@nestjs/common';

@Worker('emails', {
  concurrency: 5, // Optional: Process 5 jobs at a time
  limiter: {
    // Optional: Rate limiting
    max: 100, // Maximum number of jobs to process
    duration: 1000, // Time window in milliseconds
  },
})
@Injectable()
export class EmailWorker extends BaseWorker {
  constructor(
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    // Process the job with injected dependencies
    const { email, userId } = job.data;

    // Use injected services
    const user = await this.userService.findById(userId);
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    console.log(`Email sent to ${email} for user ${userId}`);

    // Return result if needed
    return { status: 'sent', timestamp: new Date() };
  }
}
```

#### 2. Register the Worker in a Module

```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@furkanogutcu/nest-queue';
import { EmailWorker } from './email.worker';

@Module({
  imports: [
    QueueModule.register({
      redis: {
        url: 'redis://localhost:6379',
      },
      queues: [{ name: 'emails' }],
    }),
  ],
  providers: [EmailWorker], // Register the worker
})
export class AppModule {}
```

#### 3. Add Jobs to be Processed

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '@furkanogutcu/nest-queue';

@Injectable()
export class EmailService {
  constructor(private readonly queueService: QueueService) {}

  async sendWelcomeEmail(userId: number, email: string): Promise<void> {
    const emailQueue = this.queueService.get('emails');

    await emailQueue.add(
      'welcome-email',
      {
        userId,
        email,
        template: 'welcome',
      },
      {
        // Job-specific options (override queue defaults)
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        // Add job to delayed queue (execute after 5 seconds)
        delay: 5000,
      },
    );
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
        config: {
          defaultQueueOptions: {
            prefix: configService.get('REDIS_KEY_PREFIX'),
            defaultJobOptions: {
              attempts: configService.get('QUEUE_DEFAULT_ATTEMPTS', 3),
              removeOnComplete: configService.get('QUEUE_REMOVE_ON_COMPLETE', 100),
              removeOnFail: configService.get('QUEUE_REMOVE_ON_FAIL', 200),
            },
          },
        },
        queues: [
          { name: 'emails' }, // Will use default options
          {
            name: 'notifications',
            options: {
              // Queue-specific options override defaults
              defaultJobOptions: {
                attempts: configService.get('NOTIFICATIONS_QUEUE_ATTEMPTS', 5),
              },
            },
          },
        ],
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

### Bull Board UI

You can enable the Bull Board UI to monitor and manage your queues:

```typescript
import { Module } from '@nestjs/common';
import { QueueModule } from '@furkanogutcu/nest-queue';

@Module({
  imports: [
    QueueModule.register({
      redis: {
        url: 'redis://localhost:6379',
      },
      queues: [{ name: 'emails' }, { name: 'notifications' }],
      // Configure Bull Board UI
      bullBoard: {
        route: 'admin/queues', // Will be accessible at /admin/queues
      },
    }),
  ],
})
export class AppModule {}
```

Then in your main.ts file, set up the Bull Board UI:

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { QueueService } from '@furkanogutcu/nest-queue';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get the QueueService to set up Bull Board
  const queueService = app.get(QueueService);
  queueService.bullBoard.setup(app);

  await app.listen(3000);
}
bootstrap();
```

#### Protecting Bull Board UI with Authentication

You can add authentication to the Bull Board UI to restrict access:

```typescript
QueueModule.register({
  redis: {
    url: 'redis://localhost:6379',
  },
  queues: [{ name: 'emails' }, { name: 'notifications' }],
  bullBoard: {
    route: 'admin/queues',
    // Add authentication
    auth: {
      username: 'admin',
      password: 'securepassword',
    },
  },
});
```

When the `auth` option is provided, the Bull Board UI will require Basic HTTP Authentication with the specified username and password.

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
