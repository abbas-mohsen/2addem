import mongoose from 'mongoose';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { APPLICATION_STAGES } from '../models/Application.js';
import { JOB_STATUSES } from '../models/Job.js';

const emptyCounts = (keys) => Object.fromEntries(keys.map((key) => [key, 0]));

/* One pass per collection rather than a query per counter — the dashboard is
   the most-loaded recruiter page. */
export async function getCompanyStats(companyId) {
  const company = new mongoose.Types.ObjectId(String(companyId));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [jobRows, stageRows, recentCount, viewRow, topJobs] = await Promise.all([
    Job.aggregate([
      { $match: { company } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { company, status: 'active' } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ company, createdAt: { $gte: sevenDaysAgo } }),
    Job.aggregate([
      { $match: { company } },
      { $group: { _id: null, views: { $sum: '$views' }, applications: { $sum: '$applicationCount' } } },
    ]),
    Job.find({ company, status: 'published' })
      .select('title slug applicationCount views publishedAt')
      .sort({ applicationCount: -1, publishedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const jobsByStatus = { ...emptyCounts(JOB_STATUSES) };
  for (const row of jobRows) jobsByStatus[row._id] = row.count;

  const applicationsByStage = { ...emptyCounts(APPLICATION_STAGES) };
  for (const row of stageRows) applicationsByStage[row._id] = row.count;

  const totals = viewRow[0] ?? { views: 0, applications: 0 };
  const activeApplications = Object.values(applicationsByStage).reduce((sum, n) => sum + n, 0);

  return {
    jobs: {
      total: Object.values(jobsByStatus).reduce((sum, n) => sum + n, 0),
      ...jobsByStatus,
    },
    applications: {
      total: totals.applications,
      active: activeApplications,
      last7Days: recentCount,
      byStage: applicationsByStage,
    },
    views: totals.views,
    // Views to applications, the number recruiters actually act on.
    conversionRate: totals.views > 0 ? Number((totals.applications / totals.views).toFixed(3)) : 0,
    topJobs,
  };
}
