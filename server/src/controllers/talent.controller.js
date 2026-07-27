import mongoose from 'mongoose';
import { SavedCandidate } from '../models/SavedCandidate.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPageMeta, sendData, sendList } from '../utils/respond.js';

const CANDIDATE_FIELDS = 'name email avatarUrl profile.headline profile.location profile.skills';

export const listPool = asyncHandler(async (req, res) => {
  const { q, tag, page, limit } = req.query;

  const filter = { company: req.user.company };
  if (tag) filter.tags = tag.toLowerCase();

  let entries = await SavedCandidate.find(filter)
    .populate('candidate', CANDIDATE_FIELDS)
    .populate('savedBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  /* Filtering on the populated candidate's name cannot be expressed in the
     initial query, so a text search is applied after population. Talent pools
     are small; this stays cheap. */
  if (q) {
    const needle = q.toLowerCase();
    entries = entries.filter(
      (entry) =>
        entry.candidate?.name?.toLowerCase().includes(needle) ||
        entry.candidate?.profile?.headline?.toLowerCase().includes(needle) ||
        entry.note?.toLowerCase().includes(needle)
    );
  }

  const total = entries.length;
  const items = entries.slice((page - 1) * limit, page * limit);

  sendList(res, items, buildPageMeta({ page, limit, total }));
});

export const savedCandidateIds = asyncHandler(async (req, res) => {
  const entries = await SavedCandidate.find({ company: req.user.company })
    .select('candidate')
    .lean();

  sendData(res, { candidateIds: entries.map((entry) => String(entry.candidate)) });
});

export const saveCandidate = asyncHandler(async (req, res) => {
  const { candidateId, sourceApplication, note, tags } = req.body;

  if (!mongoose.isValidObjectId(candidateId)) throw ApiError.badRequest('Invalid candidate');

  const candidate = await User.findOne({ _id: candidateId, role: 'candidate' }).lean();
  if (!candidate) throw ApiError.notFound('Candidate not found');

  const existing = await SavedCandidate.findOne({
    company: req.user.company,
    candidate: candidateId,
  });
  if (existing) throw ApiError.conflict('This candidate is already in your talent pool');

  const entry = await SavedCandidate.create({
    company: req.user.company,
    candidate: candidateId,
    savedBy: req.user._id,
    sourceApplication: sourceApplication || null,
    note,
    tags: [...new Set(tags.map((tag) => tag.toLowerCase()))],
  });

  sendData(res, { entry: await entry.populate('candidate', CANDIDATE_FIELDS) }, 201);
});

async function findOwnedEntry(entryId, user) {
  if (!mongoose.isValidObjectId(entryId)) throw ApiError.notFound('Not in your talent pool');

  const entry = await SavedCandidate.findOne({ _id: entryId, company: user.company });
  if (!entry) throw ApiError.notFound('Not in your talent pool');

  return entry;
}

export const updateSaved = asyncHandler(async (req, res) => {
  const entry = await findOwnedEntry(req.params.id, req.user);

  if (req.body.note !== undefined) entry.note = req.body.note;
  if (req.body.tags) entry.tags = [...new Set(req.body.tags.map((tag) => tag.toLowerCase()))];
  await entry.save();

  sendData(res, { entry: await entry.populate('candidate', CANDIDATE_FIELDS) });
});

export const removeSaved = asyncHandler(async (req, res) => {
  const entry = await findOwnedEntry(req.params.id, req.user);
  await entry.deleteOne();

  sendData(res, { deleted: true });
});
