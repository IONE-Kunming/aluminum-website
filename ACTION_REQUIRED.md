# Action Required: Update Firebase Credentials and Clean Up Branches

> **📧 Your New Firebase Service Account Credentials**
> 
> I have received your new Firebase service account credentials. For security reasons, I have NOT committed them to the repository. You will need to manually update them in GitHub Secrets and Codespaces using the credentials you provided to me.
> 
> **The credentials you gave me will be used in Steps 1 and 2 below.**

## 🔐 Step 1: Update Firebase Service Account Secret

You have provided a new Firebase service account credential. Here's how to update it securely:

### Option A: Using GitHub CLI (Recommended)

1. **Install GitHub CLI** (if not already installed):
   - Visit: https://cli.github.com/
   - Follow installation instructions for your OS

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

3. **Save your service account JSON** to a temporary file:
   ```bash
   # Create a temporary file (on your local machine)
   # Replace the content below with your actual service account JSON
   cat > /tmp/firebase-service-account.json << 'EOF'
   {
     "type": "service_account",
     "project_id": "gen-lang-client-0988357303",
     "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
     "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-fbsvc@gen-lang-client-0988357303.iam.gserviceaccount.com",
     "client_id": "YOUR_CLIENT_ID_HERE",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gen-lang-client-0988357303.iam.gserviceaccount.com",
     "universe_domain": "googleapis.com"
   }
   EOF
   
   # Note: Use the new service account credentials you generated
   ```

4. **Update GitHub Actions Secret**:
   ```bash
   gh secret set FIREBASE_SERVICE_ACCOUNT --repo IONE-Kunming/aluminum-website < /tmp/firebase-service-account.json
   ```

5. **Clean up the temporary file**:
   ```bash
   rm /tmp/firebase-service-account.json
   ```

### Option B: Using GitHub Web UI

1. Go to: https://github.com/IONE-Kunming/aluminum-website/settings/secrets/actions
2. Find `FIREBASE_SERVICE_ACCOUNT` or click **New repository secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the complete JSON (the one you provided)
5. Click **Update secret** or **Add secret**

### Option C: Use the Automated Script

```bash
# Clone the repository and run the script
git clone https://github.com/IONE-Kunming/aluminum-website.git
cd aluminum-website
./scripts/update-firebase-secret.sh
```

## 🌐 Step 2: Update Codespaces Secret

1. Go to: https://github.com/settings/codespaces
2. Click **New secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the same JSON from above
5. Repository access: Select `IONE-Kunming/aluminum-website`
6. Click **Add secret**

## 🧪 Step 3: Test the Secret

After updating, test that workflows can authenticate:

1. Go to: https://github.com/IONE-Kunming/aluminum-website/actions
2. Select any workflow (e.g., "Deploy with Category Migration")
3. Click **Run workflow**
4. Monitor the logs for successful authentication

## 🧹 Step 4: Clean Up Branches

You currently have 65+ branches. Here's how to clean them up:

### Understanding Current State

- **main** - Primary branch (commit: 82e2692)
- **copilot/fix-bulk-import-file-download** - PR #62 (merged ✅)
- **copilot/update-dashboard-and-filters** - PR #61 (merged ✅)
- **copilot/merge-last-two-pull-requests** - Current working branch (this PR)

All other branches are old and can be deleted.

### Option A: Delete All Branches Except Main (Recommended)

**⚠️ WARNING**: This will delete ALL branches except `main`. The last 2 PRs (#61 and #62) are already merged.

Using GitHub CLI:
```bash
# List all branches except main
gh api repos/IONE-Kunming/aluminum-website/branches --paginate --jq '.[].name | select(. != "main")' > branches-to-delete.txt

# Review the list
cat branches-to-delete.txt

# Delete all branches (BE CAREFUL!)
while read branch; do
  echo "Deleting $branch..."
  gh api -X DELETE "repos/IONE-Kunming/aluminum-website/git/refs/heads/$branch" || echo "Failed to delete $branch"
done < branches-to-delete.txt
```

### Option B: Delete Specific Branches via Web UI

1. Go to: https://github.com/IONE-Kunming/aluminum-website/branches
2. Click the trash icon next to each branch you want to delete
3. Keep only:
   - `main`
   - Optionally keep the last 2 PR branches if needed for reference

### Option C: Keep Last 2 PR Branches and Main

If you want to keep the branches from PR #61 and #62:

```bash
# Delete all branches except main and the last 2 PR branches
gh api repos/IONE-Kunming/aluminum-website/branches --paginate --jq '.[].name | select(. != "main" and . != "copilot/fix-bulk-import-file-download" and . != "copilot/update-dashboard-and-filters")' | while read branch; do
  echo "Deleting $branch..."
  gh api -X DELETE "repos/IONE-Kunming/aluminum-website/git/refs/heads/$branch"
done
```

## 📋 Summary

### What We've Done:
1. ✅ Created secure documentation for Firebase credentials (SECRETS_SETUP.md)
2. ✅ Added credential files to .gitignore to prevent accidental commits
3. ✅ Created automated script for updating secrets (scripts/update-firebase-secret.sh)
4. ✅ Verified no credentials are hardcoded in the codebase
5. ✅ Current branch is synced with latest main (includes PR #61 and #62)

### What You Need to Do:
1. ⏳ Update `FIREBASE_SERVICE_ACCOUNT` secret in GitHub Actions (Step 1)
2. ⏳ Update `FIREBASE_SERVICE_ACCOUNT` secret in Codespaces (Step 2)
3. ⏳ Test workflows to ensure authentication works (Step 3)
4. ⏳ Delete old branches to clean up repository (Step 4)

### Important Notes:
- ⚠️ **NEVER** commit the service account JSON to the repository
- ✅ The workflows are already configured to use `secrets.FIREBASE_SERVICE_ACCOUNT`
- ✅ Local scripts will work with either environment variable or `serviceAccountKey.json` file
- ✅ The `.gitignore` is updated to prevent accidental credential commits

## 🔒 Security Checklist

- [ ] Service account secret updated in GitHub Actions
- [ ] Service account secret updated in Codespaces
- [ ] Verified no credential files in repository
- [ ] Tested workflows successfully authenticate
- [ ] Deleted or secured any local copies of the service account file

## Need Help?

If you encounter any issues:
1. Check SECRETS_SETUP.md for detailed troubleshooting
2. Review GitHub Actions logs for specific error messages
3. Verify the JSON format is correct (no extra spaces or formatting issues)
4. Ensure the service account has proper permissions in Firebase Console
