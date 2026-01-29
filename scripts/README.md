# Validation and Verification Scripts

This folder contains utility scripts for validating, verifying, and managing the ESNTES application.

## Verification Scripts

Scripts that verify specific features and functionality:

- **verify_admin_features.py** - Verifies admin dashboard features and functionality
- **verify_calendar_refactor.py** - Validates the calendar refactoring implementation
- **verify_community_code.py** - Checks community-related code implementation
- **verify_community_edit.py** - Verifies community editing functionality
- **verify_community_form.py** - Validates community form implementation
- **verify_fix_loading.py** - Checks loading state fixes
- **verify_login.py** - Verifies login functionality
- **verify_multitenancy.py** - Validates multi-tenancy implementation
- **verify_password_reset.py** - Verifies password reset functionality

## Validation Scripts

Scripts that check database schema, roles, and user data:

- **check_pine_modules.py** - Validates Pine module configuration
- **check_roles.py** - Checks user roles in the database
- **check_schema.py** - Validates database schema structure
- **check_user_module.py** - Checks user module implementation
- **check_users.py** - Lists and validates user data

## Utility Scripts

Helper scripts for database management and fixes:

- **fix_role.py** - Fixes role-related issues in the database
- **list_users.py** - Lists all users in the system
- **migrate_and_verify.py** - Runs database migrations and verifies the result
- **reset_db.py** - Resets the database to a clean state

## Usage

Most scripts can be run directly from the command line:

```bash
# From the project root
python scripts/script_name.py

# Or from the scripts directory
cd scripts
python script_name.py
```

**Note:** Some scripts may require the backend environment to be active or specific database configurations.
