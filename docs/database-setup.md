# Appwrite Database Setup for FirstVideos Group

This document outlines the necessary steps to configure the Appwrite backend for the FirstVideos Group website. Follow these instructions to set up the database, collections, attributes, and users required for the application to function correctly.

## 1. Prerequisites

- An active [Appwrite Cloud](https://cloud.appwrite.io/) account.
- A new Appwrite Project created.

Once you have your project, you will need its **Project ID** and the **API Endpoint**.

## 2. Configure Application Settings

This project uses a central configuration file (`src/constants.ts`) to manage all Appwrite-related IDs and endpoints. You must edit this file directly with the values from your Appwrite project.

### How to Set Up Configuration

1.  Open the file `src/constants.ts` in your code editor.
2.  You will see a list of constants with placeholder values (e.g., `'YOUR_PROJECT_ID'`).
3.  As you create your database, collections, and storage bucket in the following steps, replace the placeholder strings with the actual IDs provided by Appwrite.

**Example `src/constants.ts`:**
```typescript
// Appwrite Configuration
// IMPORTANT: Replace these placeholder values with your actual Appwrite project details.
// You can find these details in your Appwrite project's settings dashboard.

export const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'; // Your Appwrite endpoint
export const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID'; // Replace with your actual project ID
// ... and so on for all other constants.
```

Make sure to fill in all the required values before running the application. The application will show an error on startup if the main configuration values haven't been changed.

---

## 3. Database Creation

1.  From your Appwrite project dashboard, navigate to the **Databases** section in the left-hand menu.
2.  Click **Create database**.
3.  Name your database (e.g., `fvgwebdata`).
4.  Copy the generated **Database ID** and add it to `src/constants.ts` for `APPWRITE_DATABASE_ID`.

## 4. Collection Setup

We need fourteen collections: "About", "Projects", "Settings", "MediaMetadata", "Cast", "Crew", "ProductionPhases", "PhaseSteps", "SlateEntries", "ProductionTasks", "Departments", "DepartmentRoles", "DepartmentCrew", and "ProjectDepartmentCrew".

### 4.1. About Collection

This collection will store the content for the "About Us" section of the website. It's designed to hold a single document.

-   **Name**: `About`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `ABOUT_COLLECTION_ID`.

#### Attributes

Create the following attribute for the `About` collection:

| Key       | Type   | Size | Required | Array |
| :-------- | :----- | :--- | :------- | :---- |
| `content` | String | 1000 | Yes      | No    |

#### Settings (Permissions)

Go to the **Settings** tab for the `About` collection to set permissions.

-   **Permissions**:
    -   Click **Add Role**. Select **Read Access** and choose **role:all** (Any).
    -   Click **Add Role** again. Select **Write Access** and choose **role:member** (Users).

### 4.2. Projects Collection

This collection stores the individual projects showcased on the website.

-   **Name**: `Projects`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `PROJECTS_COLLECTION_ID`.

#### Attributes

Create the following attributes for the `Projects` collection:

| Key                  | Type    | Size | Required | Array | Notes                                               |
| :------------------- | :------ | :--- | :------- | :---- | :-------------------------------------------------- |
| `title`              | String  | 255  | Yes      | No    |                                                     |
| `description`        | String  | 1000 | Yes      | No    |                                                     |
| `posterUrl`          | URL     | 2048 | Yes      | No    | URL to the poster image.                            |
| `releaseYear`        | Integer | -    | Yes      | No    | Set min/max if desired.                             |
| `projectType`        | String  | 50   | Yes      | No    | e.g., 'Movie', 'Short', 'Series'                    |
| `status`             | String  | 50   | Yes      | No    | e.g., 'Upcoming', 'In Production', 'Released'       |
| `isRework`           | Boolean | -    | No       | No    | Indicates if the project is a rework.               |
| `dueDate`            | Datetime| -    | No       | No    | Required for 'Upcoming' or 'In Production' status    |
| `synopsis`           | String  | 5000 | No       | No    | Detailed movie synopsis.                            |
| `cast`               | String  | -    | No       | Yes   | Array of Cast document IDs.                         |
| `crew`               | String  | -    | No       | Yes   | Array of Crew document IDs.                         |
| `language`           | String  | 255  | No       | No    | Main language of the project.                       |
| `runtime`            | Integer | -    | No       | No    | Project runtime in minutes.                         |
| `hasSubtitles`       | Boolean | -    | No       | No    | Whether subtitles are available.                    |
| `mainSubtitleLanguage`| String | 255 | No       | No    | Main language of the subtitles.                     |
| `directors`          | String  | -    | No       | Yes   | Array of Crew document IDs for directors.           |
| `producers`          | String  | -    | No       | Yes   | Array of Crew document IDs for producers.           |
| `rating`             | String  | 50   | No       | No    | e.g., "PG-13", "7.8/10".                            |
| `genres`             | String  | 50   | No       | Yes   | Array of genres, e.g., ["Action", "Sci-Fi"].        |
| `departments`        | String  | -    | No       | Yes   | Array of Department document IDs.                   |


#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.3. Site Settings Collection

This collection stores the global settings for the website, such as title and theme colors. It should only contain a single document.

-   **Name**: `Settings`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `SITE_SETTINGS_COLLECTION_ID`.

#### Attributes

| Key                  | Type    | Size | Required | Array | Notes                               |
| :------------------- | :------ | :--- | :------- | :---- | :---------------------------------- |
| `siteTitle`          | String  | 255  | Yes      | No    | e.g., "FirstVideos Group"           |
| `primaryColor`       | String  | 7    | Yes      | No    | Hex color code, e.g., #22d3ee       |
| `secondaryColor`     | String  | 7    | Yes      | No    | Hex color code, e.g., #f3f4f6       |
| `adminTitle`         | String  | 255  | Yes      | No    | e.g., "FirstVideos Admin"           |
| `footerText`         | String  | 500  | Yes      | No    | Supports `{year}` placeholder       |
| `siteVersion`        | String  | 50   | No       | No    | e.g., "1.0.0"                       |
| `socialLinks`        | String  | 5000 | No       | No    | JSON string of social links         |
| `footerLinks`        | String  | 5000 | No       | No    | JSON string of footer links         |
| `mailEnabled`        | Boolean | -    | No       | No    | Enables/disables all mail functions.|
| `mailSenderEmail`    | String  | 255  | No       | No    | Email address to send from.         |
| `mailContactRecipient`| String | 255 | No       | No    | Destination for contact form emails.|
| `mailSmtpHost`       | String  | 255  | No       | No    | SMTP server hostname.               |
| `mailSmtpPort`       | Integer | -    | No       | No    | SMTP server port.                   |
| `mailSmtpEncryption` | String  | 10   | No       | No    | 'none', 'ssl', or 'tls'             |
| `mailSmtpUsername`   | String  | 255  | No       | No    | SMTP authentication username.       |
| `mailSmtpPassword`   | String  | 255  | No       | No    | SMTP authentication password.       |
| `heroBackgroundImageUrl` | URL | 2048 | No   | No    | URL for the hero section background.|
| `heroTitle`          | String  | 255  | No       | No    | Main headline for the hero section. |
| `heroDescription`    | String  | 1000 | No       | No    | Paragraph for the hero section.     |
| `heroButtonText`     | String  | 100  | No       | No    | Call-to-action button text.         |
| `heroUseImage`       | Boolean | -    | No       | No    | Use image for hero background.      |
| `heroUsePlexus`      | Boolean | -    | No       | No    | Use plexus effect for hero background.|
| `logoLightUrl`       | URL     | 2048 | No       | No    | URL for the light theme logo.       |
| `logoDarkUrl`        | URL     | 2048 | No       | No    | URL for the dark theme logo.        |
| `customBeepSoundUrl` | URL     | 2048 | No       | No    | URL for the custom slate beep sound.|


#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.4. Media Metadata Collection

This collection stores metadata for each file uploaded to the Storage bucket, most importantly its category.

-   **Name**: `MediaMetadata`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `MEDIA_METADATA_COLLECTION_ID`.

#### Attributes

| Key        | Type   | Size | Required | Array | Notes                                     |
| :--------- | :----- | :--- | :------- | :---- | :---------------------------------------- |
| `fileId`   | String | 255  | Yes      | No    | Corresponds to the file's `$id` in Storage. |
| `category` | String | 50   | Yes      | No    | e.g., 'Image', 'Poster', 'Video'          |
| `name`     | String | 255  | Yes      | No    | The original filename.                    |

#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

#### Indexes

It's recommended to create an index to improve query performance when deleting files.

1.  Go to the **Indexes** tab for the `MediaMetadata` collection.
2.  Click **Create index**.
3.  **Key**: `fileId_index`
4.  **Type**: `key`
5.  **Attributes**: Select `fileId`.
6.  Click **Create**.

### 4.5. Cast Collection

This collection stores a global list of all cast members.

-   **Name**: `Cast`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `CAST_COLLECTION_ID`.

#### Attributes

| Key        | Type   | Size | Required | Array | Notes                               |
| :--------- | :----- | :--- | :------- | :---- | :---------------------------------- |
| `name`     | String | 255  | Yes      | No    | Cast member's full name.            |
| `role`     | String | 255  | Yes      | No    | Default role (e.g., "Actor").       |
| `bio`      | String | 5000 | No       | No    | A short biography for the member.   |

#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.6. Crew Collection

This collection stores a global list of all crew members.

-   **Name**: `Crew`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `CREW_COLLECTION_ID`.

#### Attributes

| Key        | Type   | Size | Required | Array | Notes                               |
| :--------- | :----- | :--- | :------- | :---- | :---------------------------------- |
| `name`     | String | 255  | Yes      | No    | Crew member's full name.            |
| `role`     | String | 255  | Yes      | No    | Job title (e.g., "Director").       |
| `bio`      | String | 5000 | No       | No    | A short biography for the member.   |

#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.7. Production Phases Collection

This collection stores the production phases for each project.

-   **Name**: `ProductionPhases`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `PRODUCTION_PHASES_COLLECTION_ID`.

#### Attributes

| Key         | Type     | Size | Required | Array | Notes                                        |
| :---------- | :------- | :--- | :------- | :---- | :------------------------------------------- |
| `projectId` | String   | 255  | Yes      | No    | ID of the linked project.                    |
| `phaseName` | String   | 255  | Yes      | No    | e.g., "Pre-Production", "Filming".           |
| `status`    | String   | 50   | Yes      | No    | "Pending", "In Progress", or "Completed".    |
| `startDate` | Datetime | -    | No       | No    | The start date of the phase.                 |
| `endDate`   | Datetime | -    | No       | No    | The end date of the phase.                   |

#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

#### Indexes

Create an index to improve performance when querying phases by project.

1.  Go to the **Indexes** tab for the `ProductionPhases` collection.
2.  Click **Create index**.
3.  **Key**: `projectId_index`
4.  **Type**: `key`
5.  **Attributes**: Select `projectId`.
6.  Click **Create**.

### 4.8. Phase Steps Collection

This collection stores the individual steps within a production phase.

-   **Name**: `PhaseSteps`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `PHASE_STEPS_COLLECTION_ID`.

#### Attributes

| Key         | Type    | Size | Required | Array | Notes                                        |
| :---------- | :------ | :--- | :------- | :---- | :------------------------------------------- |
| `phaseId`   | String  | 255  | Yes      | No    | ID of the linked production phase.           |
| `stepName`  | String  | 255  | Yes      | No    | e.g., "Scriptwriting".                       |
| `description`| String | 1000 | No       | No    | A brief description of the step.             |
| `status`    | String  | 50   | Yes      | No    | "Pending", "In Progress", or "Completed".    |
| `order`     | Integer | -    | Yes      | No    | The display order of the step within a phase.|

#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

#### Indexes

Create an index to improve performance when querying steps by phase.

1.  Go to the **Indexes** tab for the `PhaseSteps` collection.
2.  Click **Create index**.
3.  **Key**: `phaseId_index`
4.  **Type**: `key`
5.  **Attributes**: Select `phaseId`.
6.  Click **Create**.

### 4.9. Slate Entries Collection

This collection stores records for the internal Timecode Slate App.

-   **Name**: `SlateEntries`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `SLATE_ENTRIES_COLLECTION_ID`.

#### Attributes

| Key          | Type    | Size | Required | Array | Notes                                     |
| :----------- | :------ | :--- | :------- | :---- | :---------------------------------------- |
| `roll`       | String  | 255  | Yes      | No    | e.g., "A001"                              |
| `scene`      | String  | 255  | Yes      | No    | e.g., "14B"                               |
| `take`       | Integer | -    | Yes      | No    | The take number.                          |
| `production` | String  | 255  | Yes      | No    | Name of the production/project.           |
| `director`   | String  | 255  | Yes      | No    | Name of the Director.                     |
| `dop`        | String  | 255  | Yes      | No    | Name of the Director of Photography.      |
| `note`       | String  | 1000 | No       | No    | Optional notes for the take.              |
| `date`       | Datetime| -    | Yes      | No    | The date the take was recorded.           |
| `timecode`   | String  | 255  | Yes      | No    | The logged timecode, e.g., "00:01:23:14". |

#### Settings (Permissions)

Since this is an internal-only tool, all permissions are restricted to authenticated users.

-   **Permissions**:
    -   Click **Add Role**. Select **Read Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Create Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Update Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Delete Access** and choose **role:member** (Users).

#### Indexes

Create an index to improve performance when sorting slate entries by date.

1.  Go to the **Indexes** tab for the `SlateEntries` collection.
2.  Click **Create index**.
3.  **Key**: `date_index`
4.  **Type**: `key`
5.  **Attributes**: Select `date`.
6.  Click **Create**.

### 4.10. Production Tasks Collection

This collection stores individual tasks related to productions.

-   **Name**: `ProductionTasks`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `TASKS_COLLECTION_ID`.

#### Attributes

| Key         | Type     | Size | Required | Array | Notes                                     |
| :---------- | :------- | :--- | :------- | :---- | :---------------------------------------- |
| `taskName`  | String   | 255  | Yes      | No    | The name or title of the task.            |
| `priority`  | String   | 50   | Yes      | No    | 'Low', 'Medium', 'High', or 'Critical'.   |
| `dueDate`   | Datetime | -    | Yes      | No    | When the task is due.                     |
| `assigneeId`| String   | 255  | Yes      | No    | The ID of a Cast or Crew member.          |
| `projectId` | String   | 255  | Yes      | No    | The ID of the linked project.             |
| `phaseId`   | String   | 255  | No       | No    | The ID of the linked production phase.    |
| `status`    | String   | 50   | Yes      | No    | 'Pending', 'In Progress', or 'Completed'.   |

#### Settings (Permissions)

Since this is an internal-only tool, all permissions are restricted to authenticated users.

-   **Permissions**:
    -   Click **Add Role**. Select **Read Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Create Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Update Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Delete Access** and choose **role:member** (Users).

#### Indexes

Create indexes to improve query performance.

1.  **Index 1**:
    -   **Key**: `projectId_index`
    -   **Type**: `key`
    -   **Attributes**: Select `projectId`.
2.  **Index 2**:
    -   **Key**: `dueDate_index`
    -   **Type**: `key`
    -   **Attributes**: Select `dueDate`.

### 4.11. Departments Collection

This collection stores a list of all departments within the company.

-   **Name**: `Departments`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `DEPARTMENTS_COLLECTION_ID`.

#### Attributes

| Key         | Type   | Size | Required | Array | Notes                                     |
| :---------- | :----- | :--- | :------- | :---- | :---------------------------------------- |
| `name`      | String | 255  | Yes      | No    | The name of the department (e.g., "Art"). |
| `description`| String | 1000 | No       | No    | A brief description of the department.    |
| `managerId` | String | 255  | No       | No    | The ID of a Crew member who is the manager.|

#### Settings (Permissions)
-   **Permissions**: Set Read, Create, Update, and Delete access to **role:member** (Users).

### 4.12. Department Roles Collection

This collection stores all possible roles within each department.

-   **Name**: `DepartmentRoles`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `DEPARTMENT_ROLES_COLLECTION_ID`.

#### Attributes

| Key         | Type   | Size | Required | Array | Notes                                     |
| :---------- | :----- | :--- | :------- | :---- | :---------------------------------------- |
| `departmentId`| String | 255 | Yes      | No    | The ID of the linked department.          |
| `roleName`  | String | 255  | Yes      | No    | The name of the role (e.g., "Lead Artist").|
| `description`| String | 1000 | No       | No    | A brief description of the role.          |

#### Settings (Permissions)
-   **Permissions**: Set Read, Create, Update, and Delete access to **role:member** (Users).

#### Indexes
-   Create a `key` index on the `departmentId` attribute to speed up queries for roles within a specific department.

### 4.13. Department Crew Collection

This collection acts as a link table, assigning specific crew members to roles within departments.

-   **Name**: `DepartmentCrew`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `DEPARTMENT_CREW_COLLECTION_ID`.

#### Attributes

| Key         | Type   | Size | Required | Array | Notes                                     |
| :---------- | :----- | :--- | :------- | :---- | :---------------------------------------- |
| `departmentId`| String | 255 | Yes      | No    | The ID of the linked department.          |
| `roleId`    | String | 255  | Yes      | No    | The ID of the linked department role.     |
| `crewId`    | String | 255  | Yes      | No    | The ID of the assigned crew member.       |

#### Settings (Permissions)
-   **Permissions**: Set Read, Create, Update, and Delete access to **role:member** (Users).

#### Indexes
-   Create a `key` index on the `departmentId` attribute.
-   Create a `key` index on the `roleId` attribute.

### 4.14. Project Department Crew Collection

This collection links crew members to specific roles within a department for a single project. It enables project-specific team compositions.

-   **Name**: `ProjectDepartmentCrew`
-   **Collection ID**: Copy the generated ID and add it to `src/constants.ts` for `PROJECT_DEPARTMENT_CREW_COLLECTION_ID`.

#### Attributes

| Key         | Type   | Size | Required | Array | Notes                                     |
| :---------- | :----- | :--- | :------- | :---- | :---------------------------------------- |
| `projectId` | String | 255  | Yes      | No    | The ID of the linked project.             |
| `roleId`    | String | 255  | Yes      | No    | The ID of the linked department role.     |
| `crewId`    | String | 255  | Yes      | No    | The ID of the assigned crew member.       |

#### Settings (Permissions)
-   **Permissions**: Set Read, Create, Update, and Delete access to **role:member** (Users).

#### Indexes
-   Create a `key` index on the `projectId` attribute.
-   Create a `key` index on the `roleId` attribute.

## 5. Storage (Media Bucket) Setup

The media library requires a storage bucket to store uploaded image files.

1.  From your Appwrite project dashboard, navigate to the **Storage** section in the left-hand menu.
2.  Click **Create bucket**.
3.  Name your bucket (e.g., `fvg_media`).
4.  Copy the generated **Bucket ID** and add it to `src/constants.ts` for `APPWRITE_STORAGE_BUCKET_ID`.
5.  Go to the **Settings** tab for your new bucket.
6.  Under **Permissions**, set the following:
    -   Click **Add Role**. Select **Read Access** and choose **role:all** (Any). This allows anyone to view the images on your public website.
    -   Click **Add Role**. Select **Create Access** and choose **role:member** (Users). This allows logged-in admins to upload files.
    -   Click **Add Role**. Select **Update Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Delete Access** and choose **role:member** (Users). This allows logged-in admins to delete files.
7.  You can also configure file size limits and allowed extensions in the settings if desired.

## 6. Server-Side Functions for Email (Crucial)

### 6.1. Overview

This project uses Appwrite Functions to handle all email-sending operations securely. Exposing SMTP credentials on the client-side (in the React app) would be a major security risk. By moving this logic to the backend, we ensure that sensitive information like your SMTP password is never visible to users.

There are two essential functions:
1.  **`sendContactMail`**: Handles submissions from the public "Contact Us" form.
2.  **`sendTestMail`**: Triggered from the admin panel to verify that the configured SMTP settings are working correctly.

### 6.2. Prerequisites

Before creating the functions, ensure you have the following:

1.  **Appwrite Project**: Your Appwrite project is fully set up as described in the sections above.
2.  **Node.js Runtime**: These instructions assume you will use a **Node.js** runtime for your functions (e.g., `Node.js 18.0` or higher).
3.  **Appwrite API Key**:
    -   Go to **API Keys** in your Appwrite project dashboard.
    -   Click **Create API key**.
    -   Give it a name (e.g., "Email Functions Key").
    -   Grant it the following scopes:
        -   `databases.read`
        -   `documents.read`
    -   Create the key and **copy the Secret**. You will need this for the function configuration.

### 6.3. Function 1: `sendContactMail` (Public Contact Form)

This function receives data from the public contact form, fetches mail settings from the database, and sends the email.

#### Step 1: Create the Function in Appwrite

1.  Navigate to the **Functions** section in your Appwrite dashboard.
2.  Click **Create function**.
3.  Select **Appwrite CLI** if you want to create and deploy from your terminal, or **Manual** to upload a compressed file. We will proceed with the manual method for clarity.
4.  Name the function `sendContactMail`.
5.  Choose a Node.js runtime (e.g., `Node.js 18.0`).
6.  Click **Create**.
7.  Once created, copy the **Function ID** and add it to `src/constants.ts` for `CONTACT_FORM_FUNCTION_ID`.

#### Step 2: Configure Settings

Go to the **Settings** tab for your new function.

1.  **Permissions**:
    -   Under **Execute Access**, click **Add Role**.
    -   Select **Any** (`role:all`). This is crucial, as it allows unauthenticated users from the public website to submit the form.

2.  **Variables (Environment Variables)**:
    -   This is where you'll securely store the configuration values for the function. Add the following key-value pairs. **Do not hardcode these in your function's code.**
    -   | Key                             | Value                                                              |
        | :------------------------------ | :----------------------------------------------------------------- |
        | `APPWRITE_API_KEY`              | The API key secret you created in the prerequisites.               |
        | `APPWRITE_ENDPOINT`             | Your project's API Endpoint (e.g., `https://cloud.appwrite.io/v1`). |
        | `APPWRITE_PROJECT_ID`           | Your Appwrite Project ID.                                          |
        | `APPWRITE_DATABASE_ID`          | The ID of your database (e.g., `fvgwebdata`).                      |
        | `SITE_SETTINGS_COLLECTION_ID`   | The Collection ID for your `Settings` collection.                  |

3.  **Timeout**: The default is 15 seconds. If your SMTP provider is slow, you might need to increase this to `30` seconds.

#### Step 3: Prepare the Code

On your local machine, create a new folder named `sendContactMail`. Inside it, create two files: `package.json` and `src/index.js`.

**File: `package.json`**
This file lists the function's dependencies.

```json
{
  "name": "send-contact-mail",
  "version": "1.0.0",
  "description": "Appwrite function to send contact form emails for FirstVideos Group.",
  "main": "src/index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "node-appwrite": "^12.0.1",
    "nodemailer": "^6.9.13"
  }
}
```

**File: `src/index.js`**
This is the main logic for the function.

```javascript
const { Client, Databases, Query } = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Initialize Appwrite client from environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Parse payload from the frontend
  let payload;
  try {
    payload = JSON.parse(req.payload);
  } catch (e) {
    res.json({ success: false, error: 'Invalid payload.' }, 400);
    return;
  }
  
  const { name, email, message } = payload;
  if (!name || !email || !message) {
    res.json({ success: false, error: 'Missing required fields: name, email, message.' }, 400);
    return;
  }
  
  try {
    // 1. Fetch site settings from the database
    const settingsResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.SITE_SETTINGS_COLLECTION_ID,
      [Query.limit(1)]
    );

    if (settingsResponse.total === 0) {
      throw new Error('Site settings not found in the database.');
    }
    const settings = settingsResponse.documents[0];
    
    // Check if mail is enabled in settings
    if (!settings.mailEnabled) {
        throw new Error('Mail sending is currently disabled in site settings.');
    }

    // 2. Configure Nodemailer transporter with fetched settings
    const transporter = nodemailer.createTransport({
      host: settings.mailSmtpHost,
      port: settings.mailSmtpPort,
      secure: settings.mailSmtpEncryption === 'ssl', // true for 465, false for other ports
      auth: {
        user: settings.mailSmtpUsername,
        pass: settings.mailSmtpPassword,
      },
      requireTLS: settings.mailSmtpEncryption === 'tls',
    });

    // 3. Send the email
    await transporter.sendMail({
      from: `"${name}" <${settings.mailSenderEmail}>`, // "From" uses the sender name from payload and system email
      to: settings.mailContactRecipient, // Send to the admin
      replyTo: email, // Reply-To is set to the user's email
      subject: `New Contact Form Submission from ${name}`,
      text: message,
      html: `<p>You have a new contact form submission from:</p>
             <p><b>Name:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <hr>
             <p><b>Message:</b></p>
             <p>${message.replace(/\n/g, '<br>')}</p>`,
    });

    res.json({ success: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Failed to send email:', error.message);
    res.json({ success: false, error: error.message }, 500);
  }
};
```

#### Step 4: Deploy the Function

1.  In your terminal, navigate inside the `sendContactMail` folder.
2.  Install the dependencies locally: `npm install`. This creates the `node_modules` folder.
3.  Compress the folder's contents (`src` folder, `package.json`, `package-lock.json`, `node_modules`) into a `.tar.gz` file.
    -   On macOS/Linux: `tar -czf code.tar.gz .`
    -   On Windows, use a tool like 7-Zip.
4.  Go to your function's **Deployments** tab in the Appwrite dashboard.
5.  Click **Create deployment**.
6.  Under **Upload a compressed file**, upload the `code.tar.gz` file you just created. For the **Entrypoint command**, use `node src/index.js`.
7.  Click **Create**. After a moment, your deployment will become the active one.

### 6.4. Function 2: `sendTestMail` (Admin Panel Test)

This function is similar but is triggered by a logged-in admin to test the SMTP configuration.

#### Step 1: Create and Configure

Follow the same steps as for `sendContactMail`, but with these differences:

1.  **Name**: `sendTestMail`
2.  **Function ID**: Paste the new ID into `src/constants.ts` for `TEST_EMAIL_FUNCTION_ID`.
3.  **Permissions**: Under **Execute Access**, add the role **Users** (`role:member`). This ensures only logged-in admin users can trigger it.
4.  **Variables**: Use the exact same environment variables as the `sendContactMail` function.

#### Step 2: Prepare and Deploy Code

Create a new folder `sendTestMail` and add the following files. The `package.json` can be identical to the one for `sendContactMail`.

**File: `src/index.js`**

```javascript
const { Client, Databases, Query } = require('node-appwrite');
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Parse payload
  let payload;
  try {
    payload = JSON.parse(req.payload);
  } catch (e) {
    res.json({ success: false, error: 'Invalid payload.' }, 400);
    return;
  }
  
  const { recipientEmail } = payload;
  if (!recipientEmail) {
    res.json({ success: false, error: 'Missing required field: recipientEmail.' }, 400);
    return;
  }
  
  try {
    // 1. Fetch site settings
    const settingsResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.SITE_SETTINGS_COLLECTION_ID,
      [Query.limit(1)]
    );

    if (settingsResponse.total === 0) {
      throw new Error('Site settings not found.');
    }
    const settings = settingsResponse.documents[0];
    
    // 2. Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: settings.mailSmtpHost,
      port: settings.mailSmtpPort,
      secure: settings.mailSmtpEncryption === 'ssl',
      auth: {
        user: settings.mailSmtpUsername,
        pass: settings.mailSmtpPassword,
      },
      requireTLS: settings.mailSmtpEncryption === 'tls',
    });

    // 3. Send the test email
    await transporter.sendMail({
      from: `"FirstVideos Group" <${settings.mailSenderEmail}>`,
      to: recipientEmail,
      subject: 'SMTP Configuration Test | FirstVideos Group',
      text: 'This is a test email to confirm your SMTP settings are configured correctly.',
      html: `<p>This is a test email to confirm your SMTP settings are configured correctly.</p>`,
    });

    res.json({ success: true, message: `Test email sent to ${recipientEmail}.` });
  } catch (error) {
    console.error('Failed to send test email:', error.message);
    res.json({ success: false, error: error.message }, 500);
  }
};
```

**Deploy** this function using the same compression and upload process as before.

### 6.5. Troubleshooting Common Issues

-   **Function Execution Fails / "Internal Server Error"**:
    -   Go to the function's **Logs** tab in the Appwrite dashboard. This is the most important place to find errors. The logs will show `console.error` messages and any exceptions that occurred.
-   **Permission Denied Errors**:
    -   **For API Key**: Ensure the API key has `databases.read` and `documents.read` scopes.
    -   **For `sendContactMail`**: Ensure execute permission is set to `role:all` (Any).
    -   **For `sendTestMail`**: Ensure execute permission is set to `role:member` (Users).
-   **Emails Not Being Sent (but function execution succeeds)**:
    -   The issue is likely with your SMTP provider or credentials.
    -   Double-check all `mailSmtp...` values in your Site Settings via the admin panel.
    -   Check the function logs for any specific error messages from Nodemailer (e.g., "Invalid credentials", "Connection timed out").
    -   Make sure your SMTP provider doesn't have firewall rules blocking connections from Appwrite's servers.
-   **"Environment variable not found"**:
    -   Go to the function's **Settings -> Variables** tab and ensure all required variables (`APPWRITE_API_KEY`, etc.) are present and spelled correctly. Remember to redeploy after changing variables to ensure they are applied.

## 7. Initial Data Entry (Crucial Step)

The admin dashboard is designed to *update* existing content. You must create the initial documents for settings and about content manually.

1.  **Site Settings**:
    -   Navigate to your `Settings` collection and go to the **Documents** tab.
    -   Click **Create document**.
    -   Fill in the fields with default values:
        -   `siteTitle`: `FirstVideos Group`
        -   `primaryColor`: `#22d3ee`
        -   `secondaryColor`: `#f3f4f6`
        -   `adminTitle`: `FirstVideos Admin`
        -   `footerText`: `© {year} FirstVideos Group. All Rights Reserved.`
        -   `siteVersion`: `1.0.0`
        -   `socialLinks`: `[]`
        -   `footerLinks`: `[]`
        -   `mailEnabled`: `false`
        -   `heroUseImage`: `true`
        -   `heroUsePlexus`: `false`
        -   Leave all other `mail...`, `hero...`, and `logo...` fields blank initially. They will be configured via the admin panel.
    -   Click **Create**. This single document will be updated by the admin panel.

2.  **About Content**:
    -   Navigate to your `About` collection and go to the **Documents** tab.
    -   Click **Create document**.
    -   Fill in the `content` field with some placeholder text.
    -   Click **Create**.

3.  **Projects (Optional)**:
    -   You can either add your first project manually via the Appwrite console or use the "Add New Project" button in the admin dashboard after logging in.

## 8. Create an Admin User

The admin dashboard requires an authenticated user to log in.

1.  In your Appwrite project, go to the **Auth** section.
2.  Under the **Users** tab, click **Create user**.
3.  Provide an **email** and **password**. This email and password will be used to log into the website's `/admin` page.
4.  You can skip the name and phone number fields.
5.  Click **Create**.

Your Appwrite backend is now fully configured to work with the FirstVideos Group website.
