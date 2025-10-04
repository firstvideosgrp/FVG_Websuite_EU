// All configuration is now managed via environment variables.
// See the .env.example file for a list of required variables.
// For local development, create a .env file and populate it.
// For deployment, configure these in your hosting provider's settings (e.g., Vercel).

// FIX: Prefixed all environment variables with `REACT_APP_`.
// This is a standard security measure for React applications to expose variables to the browser during the build process.
// The hosting environment (like Vercel) will only include variables with this prefix in the client-side bundle.
export const APPWRITE_ENDPOINT = process.env.REACT_APP_APPWRITE_ENDPOINT!;
export const APPWRITE_PROJECT_ID = process.env.REACT_APP_APPWRITE_PROJECT_ID!;
export const APPWRITE_DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID!;
export const PROJECTS_COLLECTION_ID = process.env.REACT_APP_PROJECTS_COLLECTION_ID!;
export const ABOUT_COLLECTION_ID = process.env.REACT_APP_ABOUT_COLLECTION_ID!;
export const SITE_SETTINGS_COLLECTION_ID = process.env.REACT_APP_SITE_SETTINGS_COLLECTION_ID!;
export const MEDIA_METADATA_COLLECTION_ID = process.env.REACT_APP_MEDIA_METADATA_COLLECTION_ID!;
export const CAST_COLLECTION_ID = process.env.REACT_APP_CAST_COLLECTION_ID!;
export const CREW_COLLECTION_ID = process.env.REACT_APP_CREW_COLLECTION_ID!;
export const PRODUCTION_PHASES_COLLECTION_ID = process.env.REACT_APP_PRODUCTION_PHASES_COLLECTION_ID!;
export const PHASE_STEPS_COLLECTION_ID = process.env.REACT_APP_PHASE_STEPS_COLLECTION_ID!;
export const SLATE_ENTRIES_COLLECTION_ID = process.env.REACT_APP_SLATE_ENTRIES_COLLECTION_ID!;
export const TASKS_COLLECTION_ID = process.env.REACT_APP_TASKS_COLLECTION_ID!;
export const DEPARTMENTS_COLLECTION_ID = process.env.REACT_APP_DEPARTMENTS_COLLECTION_ID!;
export const DEPARTMENT_ROLES_COLLECTION_ID = process.env.REACT_APP_DEPARTMENT_ROLES_COLLECTION_ID!;
export const DEPARTMENT_CREW_COLLECTION_ID = process.env.REACT_APP_DEPARTMENT_CREW_COLLECTION_ID!;
export const PROJECT_DEPARTMENT_CREW_COLLECTION_ID = process.env.REACT_APP_PROJECT_DEPARTMENT_CREW_COLLECTION_ID!;
export const APPWRITE_STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID!;
export const CONTACT_FORM_FUNCTION_ID = process.env.REACT_APP_CONTACT_FORM_FUNCTION_ID!;
export const TEST_EMAIL_FUNCTION_ID = process.env.REACT_APP_TEST_EMAIL_FUNCTION_ID!;
