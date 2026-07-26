/* Thin console wrapper so application code never calls console directly and the
   transport can be swapped for pino/winston without touching call sites. */
const stamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => process.stdout.write(`[${stamp()}] INFO  ${args.join(' ')}\n`),
  warn: (...args) => process.stdout.write(`[${stamp()}] WARN  ${args.join(' ')}\n`),
  error: (...args) => process.stderr.write(`[${stamp()}] ERROR ${args.join(' ')}\n`),
};
