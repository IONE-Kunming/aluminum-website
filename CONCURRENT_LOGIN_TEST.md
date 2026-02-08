# Concurrent Login Test Plan

## Purpose
Test that the fix for concurrent login race condition works correctly when multiple users log in simultaneously.

## Test Scenario 1: Two Users Login Simultaneously

### Setup
1. Have two different user accounts ready (User A and User B)
2. Open two different browser windows/tabs (or use two different browsers/incognito modes)
3. Navigate to the login page in both windows

### Test Steps
1. Enter User A credentials in Window 1 but DON'T submit yet
2. Enter User B credentials in Window 2 but DON'T submit yet
3. Click the "Sign In" button in BOTH windows at the same time (within 1 second)
4. Observe the behavior in both windows

### Expected Results
- User A should be successfully logged in and redirected to their appropriate dashboard in Window 1
- User B should be successfully logged in and redirected to their appropriate dashboard in Window 2
- Neither user should see "Failed to load page" error
- Neither user should get the other user's profile or dashboard
- Both users should see their own data correctly loaded

### Previous Behavior (Bug)
- First user logs in normally
- Second user gets "Failed to load page" error
- Page keeps loading without any changes

## Test Scenario 2: Sequential Login with Minimal Delay

### Setup
Same as Scenario 1

### Test Steps
1. Enter User A credentials in Window 1 and click "Sign In"
2. Immediately (within 1-2 seconds) enter User B credentials in Window 2 and click "Sign In"
3. Observe the behavior in both windows

### Expected Results
Same as Scenario 1 - both users should log in successfully with their correct profiles

## Test Scenario 3: Google Sign-In Concurrent Logins

### Setup
1. Have two different Google accounts ready
2. Open two different browser windows/tabs
3. Navigate to the login page in both windows

### Test Steps
1. Click "Continue with Google" in Window 1, select User A's Google account
2. Immediately click "Continue with Google" in Window 2, select User B's Google account
3. Complete the Google sign-in flow for both users as quickly as possible

### Expected Results
- Both users should be successfully logged in with their correct Google accounts
- Each user should see their own profile data
- No "Failed to load page" errors should occur

## Key Points to Verify

1. **Profile Data Correctness**: Each user sees only their own profile data (name, email, role)
2. **Dashboard Access**: Each user is redirected to the correct dashboard for their role
3. **No Race Condition**: No cross-contamination of user data between concurrent logins
4. **Error Handling**: If there are any errors, they should be specific and not cause infinite loading

## Technical Details of the Fix

The fix addresses two race conditions:

1. **In `onAuthStateChanged` callback**: 
   - Captures the user UID at the start of the callback
   - Only updates `this.userProfile` if the current user still matches the captured UID
   - Prevents scenario where User B's callback is triggered while User A's profile fetch is in progress

2. **In `waitForProfile()` method**:
   - Captures the expected user UID when called
   - Only resolves with a profile that matches the expected UID
   - Prevents User B from getting User A's cached profile

## Success Criteria
- All test scenarios pass without "Failed to load page" errors
- No cross-contamination of user profiles
- Both users can log in simultaneously without issues
