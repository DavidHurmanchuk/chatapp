import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:             z.enum(['development', 'production', 'test']).default('development'),
  PORT:                 z.string().default('4000').transform(Number),
  MONGODB_URI:          z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET:           z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  FRONTEND_URL:         z.string().url('FRONTEND_URL must be a valid URL'),
  BACKEND_URL:          z.string().url('BACKEND_URL must be a valid URL').optional()
                          .default('http://localhost:4000'),
  GROQ_API_KEY:         z.string().min(1, 'GROQ_API_KEY is required'),
  GOOGLE_CLIENT_ID:     z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GITHUB_CLIENT_ID:     z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach(issue => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const config = loadConfig();
export const isProd = config.NODE_ENV === 'production';