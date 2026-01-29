#!/usr/bin/env python3
"""
Script to add logging statements to all backend router files.
This adds import logging and logger = logging.getLogger(__name__) to each router.
"""

import os
import re

# List of router files to update
ROUTER_FILES = [
    "backend/calendar/router.py",
    "backend/communication/router.py",
    "backend/compliance/router.py",
    "backend/dashboard/router.py",
    "backend/documents/router.py",
    "backend/finance/router.py",
    "backend/maintenance/router.py",
    "backend/property/router.py",
    "backend/user/router.py",
    "backend/vendor/router.py",
    "backend/violations/router.py",
    "backend/voting/router.py",
]

def add_logging_import(file_path):
    """Add logging import and logger initialization to a router file."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if logging is already imported
    if 'import logging' in content:
        print(f"✓ {file_path} already has logging import")
        return False
    
    # Find the router = APIRouter() line
    router_pattern = r'(router = APIRouter\(\))'
    
    if not re.search(router_pattern, content):
        print(f"✗ {file_path} - Could not find 'router = APIRouter()' line")
        return False
    
    # Add logging import after other imports and before router initialization
    # Find the last import statement
    import_pattern = r'(from .+ import .+|import .+)'
    imports = list(re.finditer(import_pattern, content))
    
    if not imports:
        print(f"✗ {file_path} - Could not find import statements")
        return False
    
    last_import_end = imports[-1].end()
    
    # Insert logging import and logger initialization
    logging_code = "\nimport logging\n\nlogger = logging.getLogger(__name__)\n"
    
    new_content = content[:last_import_end] + logging_code + content[last_import_end:]
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    print(f"✓ {file_path} - Added logging import and logger")
    return True

def main():
    """Main function to process all router files."""
    print("Adding logging to backend router files...\n")
    
    updated = 0
    skipped = 0
    errors = 0
    
    for router_file in ROUTER_FILES:
        if not os.path.exists(router_file):
            print(f"✗ {router_file} - File not found")
            errors += 1
            continue
        
        try:
            if add_logging_import(router_file):
                updated += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"✗ {router_file} - Error: {e}")
            errors += 1
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Updated: {updated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
