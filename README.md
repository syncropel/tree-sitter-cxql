# CXQL Tree-sitter Grammar - Complete Setup Guide

## Quick Start

```bash
cd ~/repositories/syncropel/tree-sitter-cxql

# Install dependencies (if not already installed)
npm install -g tree-sitter-cli

# Generate parser
tree-sitter generate

# Run all tests
tree-sitter test

# Validate examples
chmod +x validate-examples.sh
./validate-examples.sh
```

## Project Structure

```
tree-sitter-cxql/
├── grammar.js                 # Grammar definition
├── src/                       # Generated parser (don't edit)
├── test/corpus/               # Test suites
│   ├── 01-basics.txt
│   ├── 02-primary-expressions.txt
│   ├── 03-operators.txt
│   ├── 04-unary-calls.txt
│   ├── 05-statements.txt
│   ├── 06-arrows-pipes.txt
│   ├── 07-member-access.txt
│   ├── 08-fstrings-connect.txt
│   └── 09-integration.txt
├── examples/                   # Real-world examples
│   ├── README.md
│   ├── 01-data-pipeline.cxql
│   ├── 02-api-integration.cxql
│   ├── 03-data-transformation.cxql
│   ├── 04-basic-features.cxql
│   └── 05-advanced-functional.cxql
└── validate-examples.sh       # Example validation script
```

## Testing Workflow

### 1. Unit Tests (Test Corpus)

Run all tests:

```bash
tree-sitter test
```

Run specific phase:

```bash
tree-sitter test -f 01-basics
tree-sitter test -f 08-fstrings
```

Run specific test by name:

```bash
tree-sitter test -f "Member Access - Chained"
```

**Current Status:** ✅ 238+ tests passing (100%)

### 2. Integration Tests

Run end-to-end integration tests:

```bash
tree-sitter test -f 09-integration
```

These test complex real-world scenarios:

- Complete data pipelines
- Nested operations
- Multiple connections
- All features combined

### 3. Example Validation

Validate all examples parse correctly:

```bash
./validate-examples.sh
```

Parse specific example:

```bash
tree-sitter parse examples/01-data-pipeline.cxql
```

Parse with detailed output:

```bash
tree-sitter parse examples/01-data-pipeline.cxql --debug
```

## Development Workflow

### Making Grammar Changes

1. **Edit grammar.js**

   ```bash
   vim grammar.js
   ```

2. **Regenerate parser**

   ```bash
   tree-sitter generate
   ```

3. **Test changes**

   ```bash
   tree-sitter test
   ```

4. **Validate examples**

   ```bash
   ./validate-examples.sh
   ```

5. **Commit if all pass**
   ```bash
   git add -A
   git commit -m "Description of changes"
   ```

### Adding New Features

1. **Update grammar.js**

   - Add new rule
   - Set precedence
   - Update conflicts if needed

2. **Write tests first** (TDD approach)

   ```bash
   # Add tests to appropriate corpus file
   vim test/corpus/NN-feature.txt
   ```

3. **Implement feature**

   ```bash
   tree-sitter generate
   tree-sitter test
   ```

4. **Add example**
   ```bash
   # Create example showing real usage
   vim examples/NN-feature-name.cxql
   ./validate-examples.sh
   ```

## Test Coverage

### Phase 1-8: Core Features (232 tests)

- ✅ Literals and identifiers
- ✅ Collections (lists, records)
- ✅ Operators (arithmetic, logical, comparison)
- ✅ Functions and member access
- ✅ Control flow (if, blocks, let)
- ✅ Functional features (arrows, pipes)
- ✅ F-strings and connections

### Phase 9: Integration (6+ tests)

- ✅ Complete data pipelines
- ✅ Nested operations
- ✅ Real-world patterns
- ✅ Edge cases

### Examples (5 files)

- ✅ Data pipeline (database + aggregations)
- ✅ API integration (external services)
- ✅ Data transformation (analytics)
- ✅ Basic features (language tour)
- ✅ Advanced functional (patterns)

## Performance

**Average parse speed:** ~7,800 bytes/ms

This is excellent performance for a tree-sitter parser.

## Debugging Tips

### Test Failing?

1. **See actual parse tree:**

   ```bash
   echo 'your code' | tree-sitter parse --
   ```

2. **Compare with expected:**

   - Check test expectations in corpus file
   - Ensure they match actual output

3. **Debug with file:**
   ```bash
   cat > /tmp/test.cxql << 'EOF'
   your code here
   EOF
   tree-sitter parse /tmp/test.cxql
   ```

### Grammar Not Generating?

1. **Check for syntax errors:**

   ```bash
   tree-sitter generate
   # Read error messages carefully
   ```

2. **Check for conflicts:**
   - Look for "Warning: unnecessary conflicts"
   - Check precedence values are integers
   - Ensure no infinite recursion

### Example Not Parsing?

1. **Parse it directly:**

   ```bash
   tree-sitter parse examples/failing-example.cxql
   ```

2. **Check for error nodes:**

   - Look for `(ERROR ...)` in output
   - The error location shows where parsing failed

3. **Test smaller pieces:**
   ```bash
   echo 'isolated expression' | tree-sitter parse --
   ```

## Grammar Stats

- **Total rules:** 29
- **Precedence levels:** 11 (0-10)
- **Conflicts declared:** 1 (block vs record)
- **Dynamic precedence:** 1 (record preferred)
- **Test coverage:** 238+ tests
- **Example programs:** 5

## Language Features

### Complete ✅

- Literals (numbers, strings, booleans, null)
- Variables and references
- Collections (lists, records)
- All operators with correct precedence
- Function calls (positional + keyword args)
- Member access (chained: `a.b.c`)
- Control flow (if/else, blocks, let)
- Arrow functions (`x => expr`)
- Pipeline operator (`|`)
- F-strings (`$"text {expr}"`)
- Connect statements
- Comments

### Potential Extensions 🔮

- Index access (`arr[0]`)
- Slice syntax (`arr[1:5]`)
- Optional chaining (`obj?.prop`)
- Spread operator (`...list`)
- Pattern matching
- Type annotations

## Resources

- **Tree-sitter docs:** https://tree-sitter.github.io/tree-sitter/
- **Grammar DSL:** https://tree-sitter.github.io/tree-sitter/creating-parsers
- **Test format:** See test/corpus/\*.txt files
- **Example grammars:** Python, JavaScript, Rust

## Contributing

When contributing:

1. ✅ Write tests first
2. ✅ Update examples if relevant
3. ✅ Run full test suite
4. ✅ Validate all examples
5. ✅ Update documentation
6. ✅ Ensure 100% pass rate

## Next Steps

**Grammar is production-ready!** Consider:

1. **Syntax Highlighting**

   - Create `queries/highlights.scm`
   - Define highlight patterns

2. **LSP Integration**

   - Build language server
   - Use grammar for parsing

3. **Editor Plugins**

   - Neovim/VS Code integration
   - Use tree-sitter for syntax

4. **WASM Build**

   - Compile to WASM
   - Use in browser tools

5. **Language Implementation**
   - Use parser in interpreter
   - Build CXQL runtime

---

**Status:** ✅ Grammar complete, all tests passing, examples validated

**Version:** 1.0 - Production Ready
