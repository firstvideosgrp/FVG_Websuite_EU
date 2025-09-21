// FIX: Imported the `Models` namespace to resolve reference errors below.
import { Client, Account, Databases, ID, Query, Models, Storage, Functions } from 'appwrite';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, ABOUT_COLLECTION_ID, SITE_SETTINGS_COLLECTION_ID, APPWRITE_STORAGE_BUCKET_ID, MEDIA_METADATA_COLLECTION_ID, CONTACT_FORM_FUNCTION_ID, TEST_EMAIL_FUNCTION_ID, CAST_COLLECTION_ID, CREW_COLLECTION_ID } from '../constants';
import type { AboutContent, Project, SiteSettings, MediaFile, MediaMetadata, MediaCategory, CastMember, CrewMember } from '../types';

const client = new Client();

client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Authentication
// FIX: Added types to function parameters.
export const login = (email: string, password: string) => account.createEmailPasswordSession(email, password);
export const logout = () => account.deleteSession('current');
export const getCurrentUser = () => account.get();

// About Content
export const getAboutContent = async (): Promise<AboutContent | null> => {
    try {
        // FIX: Using a generic (<AboutContent>) with listDocuments ensures type safety and resolves the casting error on the return statement.
        const response = await databases.listDocuments<AboutContent>(APPWRITE_DATABASE_ID, ABOUT_COLLECTION_ID, [Query.limit(1)]);
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Failed to fetch about content:", error);
        return null;
    }
};

export const updateAboutContent = (documentId: string, content: string) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, ABOUT_COLLECTION_ID, documentId, { content });
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
    try {
        // FIX: Using a generic (<Project>) with listDocuments ensures type safety and resolves the casting error on the return statement.
        const response = await databases.listDocuments<Project>(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, [Query.orderDesc('releaseYear')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return [];
    }
};

export const createProject = (data: Omit<Project, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, ID.unique(), data);
};

export const updateProject = (documentId: string, data: Partial<Omit<Project, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, documentId, data);
};

export const deleteProject = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, PROJECTS_COLLECTION_ID, documentId);
};

// Cast
export const getCast = async (): Promise<CastMember[]> => {
    try {
        const response = await databases.listDocuments<CastMember>(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, [Query.limit(500), Query.orderAsc('name')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch cast members:", error);
        return [];
    }
};

export const createCastMember = (data: Omit<CastMember, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, ID.unique(), data);
};

export const updateCastMember = (documentId: string, data: Partial<Omit<CastMember, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, documentId, data);
};

export const deleteCastMember = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, CAST_COLLECTION_ID, documentId);
};

// Crew
export const getCrew = async (): Promise<CrewMember[]> => {
    try {
        const response = await databases.listDocuments<CrewMember>(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, [Query.limit(500), Query.orderAsc('name')]);
        return response.documents;
    } catch (error) {
        console.error("Failed to fetch crew members:", error);
        return [];
    }
};

export const createCrewMember = (data: Omit<CrewMember, keyof Models.Document>) => {
    return databases.createDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, ID.unique(), data);
};

export const updateCrewMember = (documentId: string, data: Partial<Omit<CrewMember, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, documentId, data);
};

export const deleteCrewMember = (documentId: string) => {
    return databases.deleteDocument(APPWRITE_DATABASE_ID, CREW_COLLECTION_ID, documentId);
};

// Site Settings
export const getSiteSettings = async (): Promise<SiteSettings | null> => {
    try {
        const response = await databases.listDocuments<SiteSettings>(APPWRITE_DATABASE_ID, SITE_SETTINGS_COLLECTION_ID, [Query.limit(1)]);
        return response.documents.length > 0 ? response.documents[0] : null;
    } catch (error) {
        console.error("Failed to fetch site settings:", error);
        return null;
    }
};

export const updateSiteSettings = (documentId: string, data: Partial<Omit<SiteSettings, keyof Models.Document>>) => {
    return databases.updateDocument(APPWRITE_DATABASE_ID, SITE_SETTINGS_COLLECTION_ID, documentId, data);
};

// Contact Form Email
/**
 * Executes a server-side Appwrite Function to send an email.
 * This is the secure way to handle email sending, as it prevents
 * SMTP credentials from being exposed on the client-side.
 * The server-side function is responsible for fetching the mail settings
 * from the database and using an SMTP client to dispatch the email.
 * @param payload The contact form data.
 */
export const sendContactEmail = (payload: { name: string; email: string; message: string; }) => {
    return functions.createExecution(CONTACT_FORM_FUNCTION_ID, JSON.stringify(payload));
};

/**
 * Executes a server-side Appwrite Function to send a test email.
 * This function uses the saved SMTP settings to send a predefined
 * message to the specified recipient to verify the configuration.
 * @param payload The test email data.
 */
export const sendTestEmail = (payload: { recipientEmail: string }) => {
    return functions.createExecution(TEST_EMAIL_FUNCTION_ID, JSON.stringify(payload));
};


// Storage / Media
export const listFiles = async (): Promise<MediaFile[]> => {
    try {
        const [storageFilesResponse, metadataDocsResponse] = await Promise.all([
            storage.listFiles(APPWRITE_STORAGE_BUCKET_ID),
            databases.listDocuments<MediaMetadata>(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, [Query.limit(5000)])
        ]);
        
        const metadataMap = new Map<string, MediaMetadata>();
        for (const doc of metadataDocsResponse.documents) {
            metadataMap.set(doc.fileId, doc);
        }

        const mergedFiles: MediaFile[] = storageFilesResponse.files.map(file => {
            const metadata = metadataMap.get(file.$id);
            return {
                ...file,
                category: metadata?.category || 'Image', // Fallback for legacy files
                name: metadata?.name || file.name,
            };
        });

        return mergedFiles.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    } catch (error) {
        console.error("Failed to list files:", error);
        return [];
    }
};

export const uploadFile = async (file: File, category: MediaCategory) => {
    const storageFile = await storage.createFile(APPWRITE_STORAGE_BUCKET_ID, ID.unique(), file);
    try {
        await databases.createDocument(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, ID.unique(), {
            fileId: storageFile.$id,
            category: category,
            name: file.name
        });
    } catch (dbError) {
        // If DB write fails, delete the orphaned storage file to keep things clean
        console.error("Failed to create media metadata, cleaning up storage file.", dbError);
        await storage.deleteFile(APPWRITE_STORAGE_BUCKET_ID, storageFile.$id);
        throw dbError; // re-throw the error
    }
    return storageFile;
};

// FIX: As per user request, switched from `getFilePreview` to `getFileView` to resolve issues with image rendering.
// The `getFileView` method provides a direct link to view the file in the browser.
// Note that this method does not support width and height parameters for thumbnail generation.
export const getFilePreviewUrl = (fileId: string, width?: number, height?: number): string => {
    // width and height arguments are kept for compatibility with existing calls, but are unused by getFileView.
    return storage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId).toString();
};

export const deleteFile = async (fileId: string) => {
    // FIX: Refactored the deletion process to be sequential and more robust.
    // The previous `Promise.all` implementation would fail the entire operation
    // if metadata deletion failed, even if file storage deletion could succeed.
    // This new approach prioritizes deleting the file from storage.

    // 1. Delete the file from storage first. This is the primary action.
    // If it fails, an exception is thrown, and the UI will correctly show an error.
    await storage.deleteFile(APPWRITE_STORAGE_BUCKET_ID, fileId);

    // 2. After successfully deleting the file, attempt to clean up its metadata.
    try {
        const metadataDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, [
            Query.equal('fileId', fileId),
            Query.limit(1)
        ]);

        // If a corresponding metadata document exists, delete it.
        if (metadataDocs.documents.length > 0) {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, MEDIA_METADATA_COLLECTION_ID, metadataDocs.documents[0].$id);
        }
    } catch (dbError) {
        // 3. If metadata cleanup fails, log it as a warning but do not throw an error.
        // The main goal of deleting the file was successful, so we should still
        // allow the UI to reflect that. The metadata document is now orphaned but can be cleaned up manually if needed.
        console.warn(`File ${fileId} was successfully deleted from storage, but its metadata document could not be removed.`, dbError);
    }
};