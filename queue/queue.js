// ================= SIMPLE ASYNC QUEUE =================

class Queue {

  constructor({ concurrency = 1, retry = 1 } = {}) {
    this.concurrency = concurrency;
    this.retry = retry;

    this.queue = [];
    this.active = 0;
  }

  // ================= ADD =================

  add(task) {

    return new Promise((resolve, reject) => {

      this.queue.push({
        task,
        resolve,
        reject,
        attempts: 0
      });

      this.next();
    });
  }

  // ================= NEXT =================

  next() {

    if (this.active >= this.concurrency) return;
    if (!this.queue.length) return;

    const job = this.queue.shift();

    this.run(job);
  }

  // ================= RUN =================

  async run(job) {

    this.active++;

    try {

      job.attempts++;

      const result = await job.task();

      job.resolve(result);

    } catch (err) {

      console.error("❌ QUEUE ERROR:", err.message);

      // 🔁 Retry
      if (job.attempts <= this.retry) {
        console.log("🔁 Retry:", job.attempts);
        this.queue.push(job);
      } else {
        job.reject(err);
      }

    } finally {

      this.active--;

      this.next();
    }
  }

  // ================= STATUS =================

  size() {
    return this.queue.length;
  }

  running() {
    return this.active;
  }

}

module.exports = Queue;