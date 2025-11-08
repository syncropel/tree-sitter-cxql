#!/bin/bash
# Validate all CXQL examples with detailed error output

echo "🔍 Validating CXQL Examples..."
echo "================================"
echo ""

EXAMPLES_DIR="examples"
FAIL_COUNT=0
SUCCESS_COUNT=0

for file in "$EXAMPLES_DIR"/*.cxql; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Validating $filename..."
        echo "---"
        
        # Parse and capture output
        OUTPUT=$(tree-sitter parse "$file" 2>&1)
        
        # Check if output contains ERROR
        if echo "$OUTPUT" | grep -q "ERROR"; then
            echo "❌ FAIL - Parse errors found:"
            echo "$OUTPUT" | grep -A 5 "ERROR" | head -20
            FAIL_COUNT=$((FAIL_COUNT + 1))
        else
            echo "✅ PASS"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi
        echo ""
    fi
done

echo "================================"
echo "📊 Results:"
echo "  ✅ Passed: $SUCCESS_COUNT"
echo "  ❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 All examples parsed successfully!"
    exit 0
else
    echo "⚠️  Some examples failed to parse"
    exit 1
fi