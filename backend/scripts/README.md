# Test Data Scripts

This directory contains utility scripts for managing test data in the Sinosply application.

## Requirements

### Database Connection

These scripts require a MongoDB connection to work. The connection is configured using:

1. `.env` file in the backend root directory with a `MONGO_URI` variable
2. If no `.env` file or `MONGO_URI` is found, the scripts will use a default: `mongodb://localhost:27017/sinosply`

If you need to use a different database:

```bash
# Create or edit .env file in the backend root directory
echo "MONGO_URI=mongodb://your_server:port/your_db" > ../.env
```

## User Generation and Cleanup

### Generate Test Users

To generate 500 test users in the database:

```bash
npm run generate-users
```

This will create 500 users with the following characteristics:
- Email pattern: `test.user.X@sinosply-test.com` (where X is a number from 1-500)
- Password: `password123` (same for all test users for easy testing)
- Randomly assigned roles (mostly regular users, some staff, few admins)
- Realistic first and last names
- Random permissions based on roles
- Most are marked as verified (80%)

You can modify the script to change the number of users or other properties as needed.

### Clean Up Test Users

To remove all test users from the database:

```bash
npm run cleanup-users
```

This script will:
1. Find all users with email addresses ending with `@sinosply-test.com`
2. Delete them from the database
3. Report how many users were removed

## Notes

- Both scripts connect to the MongoDB database using your environment variables
- Only users with the specific test email domain will be affected
- These scripts are meant for development/testing environments only 