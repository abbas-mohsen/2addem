/* Populates the database with a small, coherent demo dataset.
 *
 *   npm run seed -w server            # add demo data, keep what is there
 *   npm run seed -w server -- --fresh # wipe every collection first
 *
 * Every account uses the same password so the demo is easy to walk through.
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Interview } from '../models/Interview.js';
import { Notification } from '../models/Notification.js';
import { SavedCandidate } from '../models/SavedCandidate.js';
import { slugify } from '../utils/slug.js';
import { logger } from '../utils/logger.js';

const PASSWORD = 'password123';
const FRESH = process.argv.includes('--fresh');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const pick = (list, index) => list[index % list.length];

const COMPANIES = [
  {
    name: 'Cedarline',
    industry: 'Fintech',
    size: '51-200',
    location: 'Beirut, Lebanon',
    website: 'https://cedarline.example.com',
    description:
      'We build payment rails for small merchants across the region. Around sixty people, most of them in Beirut, the rest remote across three time zones. We ship weekly and we write things down.',
  },
  {
    name: 'Manara Labs',
    industry: 'Developer tools',
    size: '11-50',
    location: 'Remote (EMEA)',
    website: 'https://manaralabs.example.com',
    description:
      'A small, fully remote team building observability tooling for backend teams. We are deliberate about scope and allergic to meetings that could have been a document.',
  },
  {
    name: 'Souk Analytics',
    industry: 'Data & analytics',
    size: '11-50',
    location: 'Tripoli, Lebanon',
    website: 'https://soukanalytics.example.com',
    description:
      'We turn messy retail data into decisions people actually make. Half the team came from the shops we now sell to, which keeps us honest.',
  },
];

const JOBS = [
  {
    company: 0,
    title: 'Senior Frontend Engineer',
    status: 'published',
    location: 'Beirut, Lebanon',
    remote: 'hybrid',
    employmentType: 'full-time',
    salaryMin: 36000,
    salaryMax: 54000,
    currency: 'USD',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    description:
      'You will own the merchant dashboard: the screens shopkeepers open every morning to see what sold yesterday and what they are owed today.\n\nThe existing app works but has grown awkwardly. Your first quarter is about paying that down without stopping delivery — untangling state management, getting the design system to carry its weight, and making the whole thing usable on the cheap Android phones most of our merchants actually use.',
    responsibilities: [
      'Own the merchant dashboard end to end',
      'Rebuild the design system so it carries real weight',
      'Get first paint under two seconds on mid-range Android',
      'Review code and mentor two mid-level engineers',
    ],
    requirements: [
      '5+ years building production React',
      'Comfortable with TypeScript in a large codebase',
      'You have made a slow web app fast and can explain how',
      'Clear written communication — we work across time zones',
    ],
    publishedAt: daysAgo(3),
    views: 184,
  },
  {
    company: 0,
    title: 'Backend Engineer, Payments',
    status: 'published',
    location: 'Beirut, Lebanon',
    remote: 'onsite',
    employmentType: 'full-time',
    salaryMin: 33000,
    salaryMax: 48000,
    currency: 'USD',
    skills: ['Node.js', 'PostgreSQL', 'Kafka'],
    description:
      'Payments is the part of the product that cannot be down. You will work on settlement: the nightly process that reconciles what merchants were paid against what the networks say they were owed.\n\nIt is unglamorous, high-stakes work with a very short feedback loop — when it is wrong, someone notices within hours.',
    responsibilities: [
      'Own the settlement and reconciliation services',
      'Design for correctness first, throughput second',
      'Carry the on-call pager one week in five',
    ],
    requirements: [
      'Strong Node.js and relational modelling',
      'You have debugged a money bug in production',
      'Comfortable reasoning about idempotency and retries',
    ],
    publishedAt: daysAgo(9),
    views: 97,
  },
  {
    company: 0,
    title: 'Product Designer',
    status: 'draft',
    location: 'Beirut, Lebanon',
    remote: 'hybrid',
    employmentType: 'full-time',
    salaryMin: 28000,
    salaryMax: 40000,
    currency: 'USD',
    skills: ['Figma', 'Design systems', 'User research'],
    description:
      'Draft — still deciding whether this role is design-led or research-led. Do not publish until we have agreed the split with the product team.',
    responsibilities: [],
    requirements: [],
    views: 0,
  },
  {
    company: 1,
    title: 'Platform Engineer',
    status: 'published',
    location: 'Remote',
    remote: 'remote',
    employmentType: 'full-time',
    salaryMin: 48000,
    salaryMax: 72000,
    currency: 'USD',
    freshUsd: true,
    remoteAbroad: true,
    skills: ['Go', 'Kubernetes', 'Terraform'],
    description:
      'We run a lot of ingest for a team our size. You will own the pipeline that takes customer telemetry from edge collectors through to queryable storage, and the tooling our own engineers use to debug it.\n\nFully remote, asynchronous by default. We overlap four hours a day and write everything else down.',
    responsibilities: [
      'Own the ingest pipeline and its tooling',
      'Keep p99 query latency under a second at ten times current volume',
      'Make the local development story boringly reliable',
    ],
    requirements: [
      'Production Go and Kubernetes experience',
      'You have run infrastructure you did not originally build',
      'Self-directed — this team has very little process',
    ],
    publishedAt: daysAgo(1),
    views: 241,
  },
  {
    company: 1,
    title: 'Developer Advocate',
    status: 'published',
    location: 'Remote',
    remote: 'remote',
    employmentType: 'freelance',
    salaryMin: 30000,
    salaryMax: 45000,
    currency: 'USD',
    freshUsd: true,
    remoteAbroad: true,
    skills: ['Technical writing', 'Public speaking', 'Node.js'],
    description:
      'Six-month contract with a real chance of becoming permanent. You will write the docs and demos we currently do not have, and talk to the people using us in production.\n\nWe are looking for someone who writes well and has genuinely shipped software — not one or the other.',
    responsibilities: [
      'Own documentation and worked examples',
      'Run monthly office hours with customers',
      'Feed what you hear back into the roadmap',
    ],
    requirements: [
      'You have written technical content people finished reading',
      'Enough engineering background to build the demos yourself',
    ],
    publishedAt: daysAgo(6),
    views: 128,
  },
  {
    company: 2,
    title: 'Data Analyst',
    status: 'published',
    location: 'Tripoli, Lebanon',
    remote: 'hybrid',
    employmentType: 'full-time',
    salaryMin: 22000,
    salaryMax: 32000,
    currency: 'USD',
    skills: ['SQL', 'Python', 'dbt'],
    description:
      'You will sit between our retail customers and their own data, which is usually messier than they think. Expect to spend as much time asking good questions as writing queries.\n\nThis is a strong role for someone who wants their analysis to change what a business actually does.',
    responsibilities: [
      'Build and maintain dbt models over customer data',
      'Turn recurring questions into self-serve dashboards',
      'Sit in on customer calls and translate what you hear',
    ],
    requirements: [
      'Fluent SQL and working Python',
      'You can explain a result to someone who distrusts it',
    ],
    publishedAt: daysAgo(14),
    views: 76,
  },
  {
    company: 2,
    title: 'Retail Operations Intern',
    status: 'closed',
    location: 'Tripoli, Lebanon',
    remote: 'onsite',
    employmentType: 'internship',
    salaryMin: 6000,
    salaryMax: 9000,
    currency: 'USD',
    skills: ['Excel', 'Communication'],
    description:
      'A three-month internship supporting the operations team. This role has been filled — kept here so the closed state is visible in the demo data.',
    responsibilities: [],
    requirements: [],
    publishedAt: daysAgo(60),
    views: 302,
  },
];

const CANDIDATES = [
  {
    name: 'Lara Haddad',
    headline: 'Frontend engineer · React & design systems',
    location: 'Beirut, Lebanon',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Testing Library'],
    experienceYears: 6,
    bio: 'Six years of frontend work, most recently rebuilding a booking flow that had grown past what anyone could hold in their head. I care about the boring parts: bundle size, accessibility, and making the second engineer on a codebase as productive as the first.',
  },
  {
    name: 'Karim Nassar',
    headline: 'Backend engineer · payments and reliability',
    location: 'Beirut, Lebanon',
    skills: ['Node.js', 'PostgreSQL', 'Kafka', 'Go'],
    experienceYears: 8,
    bio: 'I have spent most of my career on systems where being wrong costs money. Comfortable being the person who says the migration needs another week.',
  },
  {
    name: 'Nour Khalil',
    headline: 'Platform engineer · Kubernetes, Go, and quiet pagers',
    location: 'Remote (Beirut)',
    skills: ['Go', 'Kubernetes', 'Terraform', 'Prometheus'],
    experienceYears: 5,
    bio: 'I like inheriting infrastructure nobody wants to touch and leaving it boring. Currently remote for a European team.',
  },
  {
    name: 'Rami Aoun',
    headline: 'Data analyst · SQL, dbt, retail',
    location: 'Tripoli, Lebanon',
    skills: ['SQL', 'Python', 'dbt', 'Looker'],
    experienceYears: 3,
    bio: 'Came into analytics from three years of running a family shop, which taught me more about retail data than any course did.',
  },
  {
    name: 'Yasmina Fares',
    headline: 'Technical writer turned developer advocate',
    location: 'Remote (Zahlé)',
    skills: ['Technical writing', 'Node.js', 'Public speaking'],
    experienceYears: 4,
    bio: 'I write documentation people finish. Before that I was a backend engineer for two years, which is why the code samples work.',
  },
  {
    name: 'Omar Sleiman',
    headline: 'Junior frontend developer',
    location: 'Jounieh, Lebanon',
    skills: ['React', 'JavaScript', 'CSS'],
    experienceYears: 1,
    bio: 'Self-taught, one year into my first job. Looking for a team that reviews code properly and will tell me when I am wrong.',
  },
];

/* Who applied to what, and where each application ended up. */
const APPLICATIONS = [
  { candidate: 0, job: 0, stage: 'interview', score: 5, tags: ['strong', 'design-systems'], daysAgo: 2 },
  { candidate: 5, job: 0, stage: 'screening', score: 3, tags: ['junior'], daysAgo: 1 },
  { candidate: 2, job: 0, stage: 'rejected', score: 2, tags: [], daysAgo: 3 },
  { candidate: 1, job: 1, stage: 'offer', score: 5, tags: ['payments'], daysAgo: 7 },
  { candidate: 2, job: 3, stage: 'interview', score: 4, tags: ['remote'], daysAgo: 1 },
  { candidate: 1, job: 3, stage: 'applied', score: null, tags: [], daysAgo: 0 },
  { candidate: 4, job: 4, stage: 'hired', score: 5, tags: ['writing'], daysAgo: 20 },
  { candidate: 3, job: 5, stage: 'screening', score: 4, tags: ['retail'], daysAgo: 4 },
  { candidate: 5, job: 5, stage: 'applied', score: null, tags: [], daysAgo: 2 },
];

const NOTES = [
  'Portfolio is genuinely good — the booking flow rebuild is exactly our problem.',
  'Strong on fundamentals for one year in. Worth a second conversation.',
  'Good engineer, wrong shape for this role. Keep warm for the platform opening.',
  'Reference check came back excellent. Moving to offer.',
  'Wants full remote, which works for us. Scheduling the technical round.',
];

async function wipe() {
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Interview.deleteMany({}),
    Notification.deleteMany({}),
    SavedCandidate.deleteMany({}),
  ]);
  logger.info('Wiped all collections');
}

async function makeUser({ name, email, role, profile }) {
  const user = new User({ name, email, role, profile });
  await user.setPassword(PASSWORD);
  await user.save();
  return user;
}

async function seed() {
  await connectDatabase();

  if (FRESH) await wipe();

  const existing = await User.findOne({ email: 'admin@2addem.dev' });
  if (existing) {
    logger.warn('Demo data already present — run with --fresh to rebuild it.');
    await disconnectDatabase();
    return;
  }

  // Admins are never created through public registration, only here.
  await makeUser({
    name: 'Site Admin',
    email: 'admin@2addem.dev',
    role: 'admin',
    profile: {},
  });

  const companies = [];
  const recruiters = [];

  for (const [index, data] of COMPANIES.entries()) {
    const recruiter = await makeUser({
      name: ['Rita Chami', 'Sami Daher', 'Maya Rizk'][index],
      email: `recruiter${index + 1}@2addem.dev`,
      role: 'recruiter',
      profile: {},
    });

    const company = await Company.create({
      ...data,
      slug: slugify(data.name),
      createdBy: recruiter._id,
    });

    recruiter.company = company._id;
    await recruiter.save();

    companies.push(company);
    recruiters.push(recruiter);
  }

  const candidates = [];
  for (const [index, data] of CANDIDATES.entries()) {
    candidates.push(
      await makeUser({
        name: data.name,
        email: `candidate${index + 1}@2addem.dev`,
        role: 'candidate',
        profile: {
          headline: data.headline,
          location: data.location,
          skills: data.skills,
          experienceYears: data.experienceYears,
          bio: data.bio,
          phone: `+961 ${70 + index} ${100 + index * 7} ${200 + index * 13}`,
        },
      })
    );
  }

  const jobs = [];
  for (const data of JOBS) {
    const { company: companyIndex, ...fields } = data;
    jobs.push(
      await Job.create({
        ...fields,
        slug: slugify(`${fields.title}-${companies[companyIndex].name}`),
        company: companies[companyIndex]._id,
        createdBy: recruiters[companyIndex]._id,
      })
    );
  }

  for (const [index, data] of APPLICATIONS.entries()) {
    const job = jobs[data.job];
    const candidate = candidates[data.candidate];
    const createdAt = daysAgo(data.daysAgo);

    const application = await Application.create({
      job: job._id,
      candidate: candidate._id,
      company: job.company,
      // Seeded resumes point at a file that does not exist; the demo is about
      // the pipeline, not the download.
      resumeUrl: '/uploads/demo-resume.pdf',
      resumeName: `${slugify(candidate.name)}-cv.pdf`,
      coverLetter: `I am applying for ${job.title} because it lines up with what I have been doing for the last few years, and because I would rather work somewhere that writes its job ads like a person.`,
      stage: data.stage,
      score: data.score,
      tags: data.tags,
      notes:
        index < NOTES.length
          ? [{ author: recruiters[0]._id, body: pick(NOTES, index), createdAt }]
          : [],
      createdAt,
    });

    await Job.updateOne({ _id: job._id }, { $inc: { applicationCount: 1 } });

    // Give the two interview-stage candidates a real upcoming slot.
    if (data.stage === 'interview') {
      await Interview.create({
        application: application._id,
        job: job._id,
        company: job.company,
        candidate: candidate._id,
        scheduledFor: daysAhead(index === 0 ? 2 : 4),
        durationMins: 45,
        locationType: index === 0 ? 'video' : 'onsite',
        location:
          index === 0 ? 'https://meet.example.com/cedarline-tech' : 'Cedarline office, 4th floor',
        interviewers: [recruiters[0]._id],
        notes: 'Technical round — walk through a past project, then a short pairing exercise.',
        createdBy: recruiters[0]._id,
      });

      await Notification.create({
        user: candidate._id,
        type: 'interview_scheduled',
        message: `${companies[0].name} scheduled an interview for ${job.title}.`,
        link: '/applications',
      });
    }
  }

  // A small talent pool for the first company.
  await SavedCandidate.create([
    {
      company: companies[0]._id,
      candidate: candidates[2]._id,
      savedBy: recruiters[0]._id,
      note: 'Wrong fit for frontend, but exactly right if the platform role opens up.',
      tags: ['platform', 'keep-warm'],
    },
    {
      company: companies[0]._id,
      candidate: candidates[4]._id,
      savedBy: recruiters[0]._id,
      note: 'Writes unusually well. Worth a call when we start on docs.',
      tags: ['writing'],
    },
  ]);

  await Notification.create({
    user: recruiters[0]._id,
    type: 'application_received',
    message: `${candidates[5].name} applied for ${jobs[0].title}.`,
    link: `/recruiter/jobs/${jobs[0]._id}/pipeline`,
  });

  logger.info('Seed complete');
  logger.info('');
  logger.info(`  Admin      admin@2addem.dev        / ${PASSWORD}`);
  logger.info(`  Recruiter  recruiter1@2addem.dev   / ${PASSWORD}   (Cedarline, busiest pipeline)`);
  logger.info(`  Recruiter  recruiter2@2addem.dev   / ${PASSWORD}   (Manara Labs)`);
  logger.info(`  Candidate  candidate1@2addem.dev   / ${PASSWORD}   (Lara, interview stage)`);
  logger.info(`  Candidate  candidate2@2addem.dev   / ${PASSWORD}   (Karim, has an offer)`);
  logger.info('');
  logger.info(`  ${companies.length} companies · ${jobs.length} jobs · ${APPLICATIONS.length} applications`);
  logger.info(`  Open ${env.CLIENT_URL} to try it.`);

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
