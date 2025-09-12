const cron = require('node-cron');
const dailyQuestionService = require('./dailyQuestionService');

class CronService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Start all cron jobs
   */
  startAllJobs() {
    this.startDailyQuestionGeneration();
    console.log('All cron jobs started successfully');
  }

  /**
   * Start daily question generation job
   * Runs every day at 12:00 AM IST
   */
  startDailyQuestionGeneration() {
    // Run at 12:00 AM every day (IST timezone)
    const job = cron.schedule('26 12 * * *', async () => {
      console.log('Starting daily question generation...');
      try {
        await dailyQuestionService.generateDailyQuestions();
        console.log('Daily questions generated successfully');
      } catch (error) {
        console.error('Error in daily question generation cron job:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    });

    this.jobs.set('dailyQuestions', job);
    job.start();

    console.log('Daily question generation cron job started (runs at 12:00 AM IST)');

    // Generate questions immediately for testing (remove in production)
    // Uncomment the line below to generate questions right now for testing
    // dailyQuestionService.generateDailyQuestions();
  }

  /**
   * Stop all cron jobs
   */
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });
    return status;
  }
}

module.exports = new CronService();