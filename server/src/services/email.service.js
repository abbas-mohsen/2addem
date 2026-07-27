import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/* One transport, created lazily so the app boots without mail configured.
   With no SMTP credentials in development we fall back to an Ethereal test
   inbox and log the preview URL — nothing is ever sent to a real address. */
let transportPromise = null;

async function getTransport() {
  transportPromise ??= (async () => {
    if (env.SMTP_HOST) {
      return {
        transport: nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        }),
        ethereal: false,
      };
    }

    if (env.isProduction) throw new Error('SMTP_HOST is required in production');

    const account = await nodemailer.createTestAccount();
    logger.info(`Email: using Ethereal test inbox (${account.user})`);

    return {
      transport: nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      }),
      ethereal: true,
    };
  })();

  return transportPromise;
}

async function deliver({ to, subject, html, text }) {
  const { transport, ethereal } = await getTransport();

  const info = await transport.sendMail({ from: env.MAIL_FROM, to, subject, html, text });

  if (ethereal) {
    logger.info(`Email "${subject}" -> ${to} | preview: ${nodemailer.getTestMessageUrl(info)}`);
  }

  return info;
}

/* Notifications must never fail the request that triggered them, so callers
   fire and forget and failures are logged rather than thrown. */
export function sendNotification(message) {
  if (!env.EMAIL_ENABLED) return Promise.resolve();

  return deliver(message).catch((error) => {
    logger.error(`Email "${message.subject}" to ${message.to} failed: ${error.message}`);
  });
}

const wrap = (heading, body, cta) => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#fbfaf9;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e3e1de;border-radius:14px;padding:28px">
      <p style="margin:0 0 20px;font-size:17px;font-weight:600;color:#1a1817">2addem</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#1a1817">${heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:#5a5650">${body}</div>
      ${
        cta
          ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:#5b45f0;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 18px;border-radius:8px">${cta.label}</a></p>`
          : ''
      }
    </div>
    <p style="max-width:520px;margin:16px auto 0;font-size:12px;color:#a09b94">
      You are receiving this because you use 2addem. This is a portfolio project.
    </p>
  </div>
`;

const STAGE_COPY = {
  screening: 'Your application is being reviewed.',
  interview: 'You have been moved to the interview stage.',
  offer: 'An offer is being prepared for you.',
  hired: 'You got the job. Congratulations!',
  rejected: 'The team decided not to move forward this time.',
  applied: 'Your application is back in the applied stage.',
};

export function applicationReceivedEmail({ candidate, job, company }) {
  return sendNotification({
    to: candidate.email,
    subject: `Application received — ${job.title}`,
    text: `Thanks ${candidate.name}, ${company.name} has received your application for ${job.title}.`,
    html: wrap(
      `Thanks, ${candidate.name.split(' ')[0]} — your application is in`,
      `<p style="margin:0"><strong>${company.name}</strong> has received your application for
       <strong>${job.title}</strong>. You can follow its progress any time from your dashboard.</p>`,
      { url: `${env.CLIENT_URL}/applications`, label: 'Track my application' }
    ),
  });
}

export function newApplicantEmail({ recruiter, candidate, job }) {
  return sendNotification({
    to: recruiter.email,
    subject: `New applicant for ${job.title}`,
    text: `${candidate.name} applied for ${job.title}.`,
    html: wrap(
      `${candidate.name} applied for ${job.title}`,
      `<p style="margin:0">A new application just landed in your pipeline.
       ${candidate.profile?.headline ? `<br /><em>${candidate.profile.headline}</em>` : ''}</p>`,
      { url: `${env.CLIENT_URL}/recruiter/jobs/${job._id}/pipeline`, label: 'Open the pipeline' }
    ),
  });
}

export function stageChangedEmail({ candidate, job, company, stage }) {
  return sendNotification({
    to: candidate.email,
    subject: `Update on your application — ${job.title}`,
    text: `${company.name} moved your application for ${job.title} to ${stage}.`,
    html: wrap(
      `Your application moved forward`,
      `<p style="margin:0"><strong>${company.name}</strong> updated your application for
       <strong>${job.title}</strong>.</p>
       <p style="margin:12px 0 0">${STAGE_COPY[stage] ?? ''}</p>`,
      { url: `${env.CLIENT_URL}/applications`, label: 'View my applications' }
    ),
  });
}
