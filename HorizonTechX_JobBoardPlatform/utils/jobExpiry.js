const JobListing = require('../models/JobListing');

async function expirePastDueJobs() {
  const now = new Date();
  await JobListing.updateMany(
    { status: 'active', closingDate: { $lt: now } },
    { $set: { status: 'expired' } }
  );
}

function isJobExpired(job) {
  if (job.status === 'expired') return true;
  if (job.closingDate && new Date(job.closingDate) < new Date()) return true;
  return false;
}

function isJobAcceptingApplications(job) {
  if (!job) return false;
  if (job.status !== 'active') return false;
  if (isJobExpired(job)) return false;
  return true;
}

module.exports = { expirePastDueJobs, isJobExpired, isJobAcceptingApplications };
