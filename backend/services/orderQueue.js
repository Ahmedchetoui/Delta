const { createOrder, OrderServiceError } = require('./orderService');

const QUEUE_NAME = 'delta-orders';
const JOB_TIMEOUT_MS = parseInt(process.env.ORDER_JOB_TIMEOUT_MS || '25000', 10);
const WAIT_TIMEOUT_MS = parseInt(process.env.ORDER_WAIT_TIMEOUT_MS || '28000', 10);
const CONCURRENCY = parseInt(process.env.ORDER_QUEUE_CONCURRENCY || '3', 10);

let queue = null;
let worker = null;
let queueEvents = null;
let redisConnection = null;
let mode = 'memory';

class InMemoryOrderQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.active = 0;
    this.pending = [];
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.pending.push({ task, resolve, reject });
      this.drain();
    });
  }

  drain() {
    while (this.active < this.concurrency && this.pending.length > 0) {
      const { task, resolve, reject } = this.pending.shift();
      this.active += 1;

      Promise.resolve()
        .then(task)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }
}

const memoryQueue = new InMemoryOrderQueue(CONCURRENCY);

function initOrderQueue() {
  if (!process.env.REDIS_URL) {
    console.log(`📋 File commandes: mémoire (concurrence ${CONCURRENCY}) — définir REDIS_URL pour Redis/BullMQ`);
    mode = 'memory';
    return;
  }

  try {
    const { Queue, Worker, QueueEvents } = require('bullmq');
    const IORedis = require('ioredis');

    redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queue = new Queue(QUEUE_NAME, { connection: redisConnection });
    queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redisConnection.duplicate(),
    });

    worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { orderData, userId } = job.data;
        return createOrder(orderData, userId);
      },
      {
        connection: redisConnection.duplicate(),
        concurrency: CONCURRENCY,
      }
    );

    worker.on('failed', (job, error) => {
      console.error(`❌ Job commande ${job?.id} échoué:`, error.message);
    });

    mode = 'redis';
    console.log(`📋 File commandes: Redis/BullMQ (concurrence ${CONCURRENCY})`);
  } catch (error) {
    console.error('⚠️ Impossible d\'initialiser Redis/BullMQ — fallback mémoire:', error.message);
    mode = 'memory';
  }
}

async function processOrder(orderData, userId = null) {
  if (mode === 'redis' && queue && queueEvents) {
    const job = await queue.add(
      'create-order',
      { orderData, userId },
      {
        removeOnComplete: 100,
        removeOnFail: 200,
        attempts: 1,
      }
    );

    try {
      return await job.waitUntilFinished(queueEvents, WAIT_TIMEOUT_MS);
    } catch (error) {
      const message = error.message || 'Erreur lors de la création de la commande';

      if (message.includes('timed out') || message.includes('timeout')) {
        throw new OrderServiceError(
          'Le serveur est très sollicité. Réessayez dans quelques instants.',
          503
        );
      }

      if (message.includes('Stock insuffisant') || message.includes('non disponibles')) {
        throw new OrderServiceError(message, 400);
      }

      if (message.includes('couleur')) {
        throw new OrderServiceError(message, 400);
      }

      throw new OrderServiceError(message, 500);
    }
  }

  return memoryQueue.enqueue(() => createOrder(orderData, userId));
}

async function closeOrderQueue() {
  const closers = [];
  if (worker) closers.push(worker.close());
  if (queueEvents) closers.push(queueEvents.close());
  if (queue) closers.push(queue.close());
  if (redisConnection) closers.push(redisConnection.quit());
  await Promise.allSettled(closers);
}

function getQueueMode() {
  return mode;
}

module.exports = {
  initOrderQueue,
  processOrder,
  closeOrderQueue,
  getQueueMode,
};
