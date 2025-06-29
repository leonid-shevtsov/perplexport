#!/bin/bash

# Script to extract unique intended_usage values from all JSON files in conversations directory

# Check if conversations directory exists
if [ ! -d "conversations" ]; then
    echo "Error: conversations directory not found"
    exit 1
fi

# Create a temporary file to store all intended_usage values
temp_file=$(mktemp)

# Find all JSON files in conversations directory and extract intended_usage values
find conversations -name "*.json" -type f | while read -r file; do
    # Extract intended_usage values from blocks array using jq
    jq -r '.entries[].blocks[].intended_usage // empty' "$file" 2>/dev/null >> "$temp_file"
done

# Create unique sorted list
if [ -s "$temp_file" ]; then
    echo "Unique intended_usage values:"
    echo "=============================="
    sort -u "$temp_file" | grep -v '^$'
    echo ""
    echo "Total unique values: $(sort -u "$temp_file" | grep -v '^$' | wc -l)"
else
    echo "No intended_usage values found in any JSON files"
fi

# Clean up temporary file
rm -f "$temp_file"
