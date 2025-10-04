// All configuration is now managed via environment variables.
// See the .env.example file for a list of required variables.
// For local development, create a .env file and populate it.
// For deployment, configure these in your hosting provider's settings (e.g., Vercel).

export const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT!;
export const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID!;
export const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
export const PROJECTS_COLLECTION_ID = process.env.PROJECTS_COLLECTION_ID!;
export const ABOUT_COLLECTION_ID = process.env.ABOUT_COLLECTION_ID!;
export const SITE_SETTINGS_COLLECTION_ID = process.env.SITE_SETTINGS_COLLECTION_ID!;
export const MEDIA_METADATA_COLLECTION_ID = process.env.MEDIA_METADATA_COLLECTION_ID!;
export const CAST_COLLECTION_ID = process.env.CAST_COLLECTION_ID!;
export const CREW_COLLECTION_ID = process.env.CREW_COLLECTION_ID!;
export const PRODUCTION_PHASES_COLLECTION_ID = process.env.PRODUCTION_PHASES_COLLECTION_ID!;
export const PHASE_STEPS_COLLECTION_ID = process.env.PHASE_STEPS_COLLECTION_ID!;
export const SLATE_ENTRIES_COLLECTION_ID = process.env.SLATE_ENTRIES_COLLECTION_ID!;
export const TASKS_COLLECTION_ID = process.env.TASKS_COLLECTION_ID!;
export const DEPARTMENTS_COLLECTION_ID = process.env.DEPARTMENTS_COLLECTION_ID!;
export const DEPARTMENT_ROLES_COLLECTION_ID = process.env.DEPARTMENT_ROLES_COLLECTION_ID!;
export const DEPARTMENT_CREW_COLLECTION_ID = process.env.DEPARTMENT_CREW_COLLECTION_ID!;
export const PROJECT_DEPARTMENT_CREW_COLLECTION_ID = process.env.PROJECT_DEPARTMENT_CREW_COLLECTION_ID!;
export const APPWRITE_STORAGE_BUCKET_ID = process.env.APPWRITE_STORAGE_BUCKET_ID!;
export const CONTACT_FORM_FUNCTION_ID = process.env.CONTACT_FORM_FUNCTION_ID!;
export const TEST_EMAIL_FUNCTION_ID = process.env.TEST_EMAIL_FUNCTION_ID!;
