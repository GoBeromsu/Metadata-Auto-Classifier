#!/bin/bash

# Get new version number
echo "Enter new version number: "
read VERSION

# Update manifest.json
sed -i 's/"version": ".*"/"version": "'$VERSION'"/' manifest.json

# Update versions.json
MINAPP=$(grep '"minAppVersion"' manifest.json | sed 's/.*: "\(.*\)".*/\1/')
jq '. + {"'$VERSION'": "'$MINAPP'"}' versions.json > versions.json.tmp && mv versions.json.tmp versions.json

# Commit changes
git add manifest.json versions.json
git commit -m "Bump version to $VERSION"

# Create and push tag
git tag $VERSION
git push origin $VERSION