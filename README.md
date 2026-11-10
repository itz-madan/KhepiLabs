# KhepiLabs

## Screenshot provider setup

Screenshot uploads are handled by Supabase Edge Functions. **Do not put provider private keys or API secrets in Vercel or any `VITE_*` variable.** The browser receives only short-lived upload signatures after the signed-in user is verified as a KhepiLabs admin.

### 1. ImageKit (primary)

1. Create or sign in to an account at [ImageKit](https://imagekit.io/).
2. Open the ImageKit Developer Options / API keys page in the dashboard.
3. Copy the **Public Key** and **Private Key**.
4. Open the [KhepiLabs Supabase Edge Function Secrets](https://supabase.com/dashboard/project/qohqzrtyiomtpufflois/functions/secrets) page.
5. Add these two secrets:

   ```env
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   ```

6. Save. The `imagekit-auth` Edge Function is already deployed for this project. Supabase secrets become available to deployed functions without a redeploy.

### 2. Cloudinary (alternative, signed upload)

1. Create or sign in to [Cloudinary](https://cloudinary.com/).
2. Open the [Cloudinary Console](https://console.cloudinary.com/).
3. From the Product Environment dashboard, copy **Cloud Name**, **API Key**, and **API Secret**.
4. Open the same [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/qohqzrtyiomtpufflois/functions/secrets) page.
5. Add these secrets:

   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

6. Save. The `cloudinary-auth` Edge Function must be deployed for signed Cloudinary uploads. The application does not use an unsigned upload preset.

### 3. Where to upload screenshots

1. Sign in to the KhepiLabs Admin Panel.
2. Open **Apps & Games**, then create or edit an app.
3. Find **Screenshot provider** and choose **ImageKit** or **Cloudinary**.
4. Select one or more image files (maximum 12 MB each). Uploaded image URLs are added to that app's screenshot list.
5. Save the app listing to persist the screenshot URLs.

### 4. ImageBox

ImageBox currently works as a manual hosted-URL option, not a direct API upload. Upload the image through ImageBox, copy its direct HTTPS image URL, then paste it into **Add hosted screenshot URL** in the app editor.

### Security notes

- Never add ImageKit Private Key, Cloudinary API Secret, Supabase service-role key, or any other server secret to Vercel client-side variables, source code, or Git.
- No Cloudinary upload preset or Cloudinary variables are required in Vercel for the signed upload flow.
- If a provider key is rotated, update the matching Supabase Edge Function Secret.
