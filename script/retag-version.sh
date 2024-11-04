#!/bin/bash

# Get version number
echo "Enter version number to retag: "
read VERSION

# Confirm action
echo "This will delete and recreate tag '$VERSION'. Are you sure? (y/N)"
read CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Operation cancelled"
    exit 1
fi

# Delete remote tag
echo "Deleting remote tag..."
git push --delete origin $VERSION 2>/dev/null || echo "Remote tag doesn't exist"

# Delete local tag
echo "Deleting local tag..."
git tag -d $VERSION 2>/dev/null || echo "Local tag doesn't exist"

# Create new tag
echo "Creating new tag..."
git tag $VERSION

# Push changes and new tag
echo "Pushing changes..."
git push
git push origin $VERSION

echo "Successfully retagged version $VERSION" 