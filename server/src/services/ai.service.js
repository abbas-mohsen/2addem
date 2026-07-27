/* ---------------------------------------------------------------------------
 * TODO: AI job-ad generation is NOT implemented.
 *
 * This module deliberately makes no network call and contains no model logic.
 * It assembles a deterministic template from the recruiter's own input so the
 * end-to-end flow (button -> request -> populated form) can be built and tested
 * without a provider.
 *
 * To wire this up for real, replace generateJobDraft's body with a call to the
 * Anthropic Messages API:
 *
 *   import Anthropic from '@anthropic-ai/sdk';
 *   const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
 *   const message = await client.messages.create({
 *     model: '<current Claude model id>',
 *     max_tokens: 2000,
 *     messages: [{ role: 'user', content: buildPrompt(input) }],
 *   });
 *
 * Keep the return shape below so the client needs no changes, add
 * ANTHROPIC_API_KEY to the env schema, and rate-limit the route — generation is
 * far more expensive than the rest of the API.
 * ------------------------------------------------------------------------- */

const SENIORITY_HINTS = {
  junior: 'You will have room to learn, with review and pairing built into how the team works.',
  mid: 'You will own features end to end and help shape how the team builds them.',
  senior: 'You will set technical direction and raise the bar for everyone around you.',
  lead: 'You will lead a small team, balancing delivery with the growth of the people on it.',
};

const REMOTE_HINTS = {
  onsite: 'This role is based in the office',
  hybrid: 'This role mixes office and home',
  remote: 'This role is fully remote',
};

export function generateJobDraft({ title, companyName, seniority, remote, location, skills = [] }) {
  const skillList = skills.filter(Boolean);
  const primarySkills = skillList.slice(0, 3).join(', ');
  const where = `${REMOTE_HINTS[remote] ?? REMOTE_HINTS.onsite}${location ? `, based out of ${location}` : ''}.`;

  const description = [
    `${companyName} is looking for a ${title}.`,
    '',
    SENIORITY_HINTS[seniority] ?? SENIORITY_HINTS.mid,
    where,
    '',
    primarySkills
      ? `Day to day you will work with ${primarySkills}, alongside a small team that reviews each other's work and ships often.`
      : 'You will work alongside a small team that reviews each other\'s work and ships often.',
    '',
    'Replace this draft with the specifics only you know: what the team is actually building, why the role is open, and what the first three months look like.',
  ].join('\n');

  const responsibilities = [
    `Own ${primarySkills ? `${skillList[0]} work` : 'delivery'} across the product`,
    'Work with design and product to turn problems into shipped features',
    'Review teammates\' code and help keep the codebase healthy',
    seniority === 'lead' || seniority === 'senior'
      ? 'Mentor engineers and set technical direction'
      : 'Grow your skills with support from the wider team',
  ];

  const requirements = [
    seniority === 'junior'
      ? 'Some professional or project experience, and a real appetite to learn'
      : `Solid experience in a comparable ${title.toLowerCase()} role`,
    ...skillList.slice(0, 4).map((skill) => `Practical experience with ${skill}`),
    'Clear written communication — much of the work happens in writing',
  ];

  return {
    // The client shows this verbatim; it must never look like finished copy.
    disclaimer:
      'Generated from a local template, not an AI model. Treat it as a starting point and rewrite it in your own voice.',
    isStub: true,
    draft: { description, responsibilities, requirements },
  };
}
