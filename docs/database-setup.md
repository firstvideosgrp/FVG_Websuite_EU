# Appwrite Database Setup for FirstVideos Group

This document outlines the necessary steps to configure the Appwrite backend for the FirstVideos Group website. Follow these instructions to set up the database, collections, attributes, and users required for the application to function correctly.

## 1. Prerequisites

- An active [Appwrite Cloud](https://cloud.appwrite.io/) account.
- A new Appwrite Project created.

Once you have your project, you will need its **Project ID** and the **API Endpoint**.

## 2. Update `constants.ts`

Before proceeding, open the `constants.ts` file in the source code. You will need to replace the placeholder values with the actual IDs you create in the following steps.

```typescript
// src/constants.ts

export const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1"; // Or your self-hosted endpoint
export const APPWRITE_PROJECT_ID = "YOUR_PROJECT_ID";
export const APPWRITE_DATABASE_ID = "YOUR_DATABASE_ID";
export const PROJECTS_COLLECTION_ID = "YOUR_PROJECTS_COLLECTION_ID";
export const ABOUT_COLLECTION_ID = "YOUR_ABOUT_COLLECTION_ID";
export const SITE_SETTINGS_COLLECTION_ID = "YOUR_SETTINGS_COLLECTION_ID";
export const MEDIA_METADATA_COLLECTION_ID = "YOUR_MEDIA_METADATA_COLLECTION_ID";
export const APPWRITE_STORAGE_BUCKET_ID = "YOUR_STORAGE_BUCKET_ID";
export const CONTACT_FORM_FUNCTION_ID = "YOUR_CONTACT_FUNCTION_ID"; // e.g., 'sendContactMail'
export const TEST_EMAIL_FUNCTION_ID = "YOUR_TEST_FUNCTION_ID"; // e.g., 'sendTestMail'
```

## 3. Database Creation

1.  From your Appwrite project dashboard, navigate to the **Databases** section in the left-hand menu.
2.  Click **Create database**.
3.  Name your database (e.g., `fvgwebdata`).
4.  Copy the generated **Database ID** and paste it into `constants.ts` for `APPWRITE_DATABASE_ID`.

## 4. Collection Setup

We need four collections: "About", "Projects", "Settings", and "MediaMetadata".

### 4.1. About Collection

This collection will store the content for the "About Us" section of the website. It's designed to hold a single document.

-   **Name**: `About`
-   **Collection ID**: Copy the generated ID and paste it into `constants.ts` for `ABOUT_COLLECTION_ID`.

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
-   **Collection ID**: Copy the generated ID and paste it into `constants.ts` for `PROJECTS_COLLECTION_ID`.

#### Attributes

Create the following attributes for the `Projects` collection:

| Key           | Type     | Size | Required | Array | Notes                                               |
| :------------ | :------- | :--- | :------- | :---- | :-------------------------------------------------- |
| `title`       | String   | 255  | Yes      | No    |                                                     |
| `description` | String   | 1000 | Yes      | No    |                                                     |
| `posterUrl`   | URL      | 2048 | Yes      | No    | URL to the poster image.                            |
| `releaseYear` | Integer  | -    | Yes      | No    | Set min/max if desired.                             |
| `projectType` | String   | 50   | Yes      | No    | e.g., 'Movie', 'Short', 'Series'                    |
| `status`      | String   | 50   | Yes      | No    | e.g., 'Upcoming', 'In Production', 'Released'       |
| `dueDate`     | Datetime | -    | No       | No    | Required for 'Upcoming' or 'In Production' status    |
| `synopsis`    | String   | 5000 | No       | No    | Detailed movie synopsis.                            |
| `castAndCrew` | String   | 5000 | No       | No    | JSON string for cast & crew members array.          |


#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.3. Site Settings Collection

This collection stores the global settings for the website, such as title and theme colors. It should only contain a single document.

-   **Name**: `Settings`
-   **Collection ID**: Copy the generated ID and paste it into `constants.ts` for `SITE_SETTINGS_COLLECTION_ID`.

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


#### Settings (Permissions)

-   **Permissions**:
    -   Select **Read Access** and choose **role:all** (Any).
    -   Select **Write Access** and choose **role:member** (Users).

### 4.4. Media Metadata Collection

This collection stores metadata for each file uploaded to the Storage bucket, most importantly its category.

-   **Name**: `MediaMetadata`
-   **Collection ID**: Copy the generated ID and paste it into `constants.ts` for `MEDIA_METADATA_COLLECTION_ID`.

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

## 5. Storage (Media Bucket) Setup

The media library requires a storage bucket to store uploaded image files.

1.  From your Appwrite project dashboard, navigate to the **Storage** section in the left-hand menu.
2.  Click **Create bucket**.
3.  Name your bucket (e.g., `fvg_media`).
4.  Copy the generated **Bucket ID** and paste it into `constants.ts` for `APPWRITE_STORAGE_BUCKET_ID`.
5.  Go to the **Settings** tab for your new bucket.
6.  Under **Permissions**, set the following:
    -   Click **Add Role**. Select **Read Access** and choose **role:all** (Any). This allows anyone to view the images on your public website.
    -   Click **Add Role**. Select **Create Access** and choose **role:member** (Users). This allows logged-in admins to upload files.
    -   Click **Add Role**. Select **Update Access** and choose **role:member** (Users).
    -   Click **Add Role**. Select **Delete Access** and choose **role:member** (Users). This allows logged-in admins to delete files.
7.  You can also configure file size limits and allowed extensions in the settings if desired.

## 6. Server-Side Functions for Email (Crucial)

To securely send emails, you must create **two server-side Appwrite Functions**: one for the public contact form and one for sending test emails from the admin panel.

### 6.1. Contact Form Function (`sendContactMail`)

This function handles submissions from the public "Contact Us" form.

1.  Go to the **Functions** section and click **Create function**. Name it `sendContactMail` and choose a runtime (e.g., Node.js).
2.  Copy the **Function ID** and paste it into `constants.ts` for `CONTACT_FORM_FUNCTION_ID`.
3.  **Permissions**: In the function's Settings tab, give **role:all** (Any) execute access.
4.  **Code**: Implement the function logic. It should:
    -   Receive a payload with `name`, `email`, and `message`.
    -   Initialize the Appwrite Node SDK and fetch the site settings document.
    -   Use a library like `nodemailer` to send an email using the fetched SMTP settings (`mailSmtp...`).
    -   **Crucially, construct the email like this:**
        -   `To`: The `mailContactRecipient` from your settings.
        -   `From`: `"Sender Name" <sender@yourdomain.com>`. Use the `name` from the payload as the "Sender Name" and the `mailSenderEmail` from your settings as the email address.
        -   `Reply-To`: The `email` from the payload. This ensures replies go to the person who filled out the form.
        -   `Subject`: Something like `New Contact Submission from ${name}`.
        -   `Body`: The `message` from the payload.
5.  Deploy the function.

### 6.2. Test Email Function (`sendTestMail`)

This function is triggered from the admin panel to verify SMTP settings.

1.  Go to the **Functions** section and click **Create function**. Name it `sendTestMail` and choose a runtime.
2.  Copy the **Function ID** and paste it into `constants.ts` for `TEST_EMAIL_FUNCTION_ID`.
3.  **Permissions**: In the function's Settings tab, give **role:member** (Users) execute access. Only logged-in admins should be able to trigger this.
4.  **Code**: Implement the function logic. It should:
    -   Receive a payload with `recipientEmail`.
    -   Initialize the Appwrite Node SDK and fetch the site settings document.
    -   Use a library like `nodemailer` to send a **pre-defined test email** using the fetched SMTP settings.
    -   `To`: The `recipientEmail` from the payload.
    -   `From`: The `mailSenderEmail` from your settings.
    -   `Subject`: "Test Email from FirstVideos Group"
    -   `Body`: "This is a test email to confirm your SMTP settings are configured correctly."
5.  Deploy the function.

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
        -   Leave all other `mail...` fields blank initially. They will be configured via the admin panel.
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