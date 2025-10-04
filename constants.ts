// All configuration is now managed via environment variables.
// See the .env.example file for a list of required variables.
// For local development, create a .env file and populate it.
// For deployment, configure these in your hosting provider's settings (e.g., Vercel).

// FIX: Switched to Vercel's standard `NEXT_PUBLIC_` prefix for environment variables.
// This ensures that variables are correctly exposed to the browser during the build process on Vercel,
// resolving the issue where they were not being read in the deployed application.
export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const PROJECTS_COLLECTION_ID = process.env.NEXT_PUBLIC_PROJECTS_COLLECTION_ID!;
export const ABOUT_COLLECTION_ID = process.env.NEXT_PUBLIC_ABOUT_COLLECTION_ID!;
export const SITE_SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_SITE_SETTINGS_COLLECTION_ID!;
export const MEDIA_METADATA_COLLECTION_ID = process.env.NEXT_PUBLIC_MEDIA_METADATA_COLLECTION_ID!;
export const CAST_COLLECTION_ID = process.env.NEXT_PUBLIC_CAST_COLLECTION_ID!;
export const CREW_COLLECTION_ID = process.env.NEXT_PUBLIC_CREW_COLLECTION_ID!;
export const PRODUCTION_PHASES_COLLECTION_ID = process.env.NEXT_PUBLIC_PRODUCTION_PHASES_COLLECTION_ID!;
export const PHASE_STEPS_COLLECTION_ID = process.env.NEXT_PUBLIC_PHASE_STEPS_COLLECTION_ID!;
export const SLATE_ENTRIES_COLLECTION_ID = process.env.NEXT_PUBLIC_SLATE_ENTRIES_COLLECTION_ID!;
export const TASKS_COLLECTION_ID = process.env.NEXT_PUBLIC_TASKS_COLLECTION_ID!;
export const DEPARTMENTS_COLLECTION_ID = process.env.NEXT_PUBLIC_DEPARTMENTS_COLLECTION_ID!;
export const DEPARTMENT_ROLES_COLLECTION_ID = process.env.NEXT_PUBLIC_DEPARTMENT_ROLES_COLLECTION_ID!;
export const DEPARTMENT_CREW_COLLECTION_ID = process.env.NEXT_PUBLIC_DEPARTMENT_CREW_COLLECTION_ID!;
export const PROJECT_DEPARTMENT_CREW_COLLECTION_ID = process.env.NEXT_PUBLIC_PROJECT_DEPARTMENT_CREW_COLLECTION_ID!;
export const APPWRITE_STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
export const CONTACT_FORM_FUNCTION_ID = process.env.NEXT_PUBLIC_CONTACT_FORM_FUNCTION_ID!;
export const TEST_EMAIL_FUNCTION_ID = process.env.NEXT_PUBLIC_TEST_EMAIL_FUNCTION_ID!;