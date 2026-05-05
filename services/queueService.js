const MAX_CONCURRENT = 2;     // parallel jobs
const RETRY_LIMIT = 2;        // retries bei Fehlern

let queue = [];
let activeCount = 0;

// ================= ADD JOB =================

function addToQueue(job) {

  return new Promise((resolve, reject) => {

    queue.push({
      job,
      resolve,
      reject,
      retries: 0
    });

    processQueue();
  });
}

// ================= PROCESS =================

async function processQueue() {

  if (activeCount >= MAX_CONCURRENT) return;
  if (!queue.length) return;

  const item = queue.shift();

  activeCount++;

  try {

    console.log("📦 START JOB | Active:", activeCount);

    const result = await item.job();

    item.resolve(result);

    console.log("✅ JOB DONE");

  } catch (err) {

    console.log("❌ JOB ERROR:", err.message);

    // 🔁 Retry Logic
    if (item.retries < RETRY_LIMIT) {

      item.retries++;

      console.log("🔁 RETRY:", item.retries);

      queue.push(item);

    } else {

      console.log("🚫 JOB FAILED FINAL");

      item.reject(err);
    }

  } finally {

    activeCount--;

    processQueue(); // next job
  }
}

// ================= BULK =================

async function addBulk(jobs = []) {

  const promises = jobs.map(job => addToQueue(job));

  return Promise.allSettled(promises);
}

// ================= CLEAR =================

function clearQueue() {
  queue = [];
}

// ================= STATUS =================

function getQueueStatus() {
  return {
    pending: queue.length,
    active: activeCount
  };
}

// ================= EXPORT =================

module.exports = {
  addToQueue,
  addBulk,
  clearQueue,
  getQueueStatus
};