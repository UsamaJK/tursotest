import { z } from 'zod';

export const Level = z.enum(['A1','A2','B1','B2','C1','C2']);

const optionSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required').max(300),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0).max(100).default(0)
});

export const questionCreateSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required').max(1000),
  tag: Level,
  allowMultiple: z.boolean().default(false),
  options: z.array(optionSchema).min(2, 'At least two options are required').max(8)
}).superRefine((val, ctx) => {
  const correctCount = val.options.filter(o => o.isCorrect).length;
  if (!val.allowMultiple && correctCount !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Exactly one option must be marked correct', path: ['options'] });
  }
  if (val.allowMultiple && correctCount < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mark at least one option correct', path: ['options'] });
  }
});

export const questionUpdateSchema = questionCreateSchema.partial().extend({
  id: z.string().cuid()
});