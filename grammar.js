/**
 * Tree-sitter Grammar for CXQL (Context Query Language)
 * Phase 2: Primary Expressions & Lists/Records
 *
 * This phase covers:
 * Phase 1:
 * - Program structure
 * - Comments
 * - Identifiers
 * - Keywords
 * - Number literals (integer, float, scientific)
 * - String literals
 * - Boolean literals
 * - Null literal
 * - Variable references
 *
 * Phase 2 (NEW):
 * - Parenthesized expressions
 * - List literals (with trailing commas, nested)
 * - Record literals (with string keys, trailing commas, nested)
 */

module.exports = grammar({
  name: "cxql",

  // Tokens to hide from the syntax tree (whitespace and comments)
  extras: ($) => [
    /\s/, // Whitespace (space, tab, newline, carriage return)
    $.comment, // Comments are defined below and included here to be invisible
  ],

  rules: {
    // ============================================
    // PROGRAM STRUCTURE
    // ============================================

    // A CXQL program is a sequence of statements
    program: ($) => repeat($._statement),

    // Statements (Phase 1: only expression statements)
    // Hidden node (underscore prefix) - just a wrapper, don't show in tree
    _statement: ($) =>
      choice(
        $.expression_statement
        // Future phases will add: let_statement, connect_statement
      ),

    // Expression as a statement
    expression_statement: ($) => $._expression,

    // ============================================
    // EXPRESSIONS
    // ============================================

    _expression: ($) =>
      choice(
        // Phase 1: Literals and identifiers
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.variable_reference,
        // Phase 2: Primary expressions (NEW)
        $.parenthesized_expression,
        $.list_literal,
        $.record_literal
        // Future phases will add: binary_expression, unary_expression,
        // function_call, member_expression, pipe_expression, etc.
      ),

    // ============================================
    // IDENTIFIERS
    // ============================================

    // Valid identifiers: start with letter, continue with letter/digit/underscore/hyphen
    // Examples: hello, my_variable, kebab-case-name, user123
    identifier: ($) => /[a-zA-Z][a-zA-Z0-9_-]*/,

    // ============================================
    // PRIMARY EXPRESSIONS (Phase 2)
    // ============================================

    // Parenthesized expression: (expr)
    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // List literal: [], [1], [1, 2, 3], [1, 2, 3,]
    list_literal: ($) =>
      seq(
        "[",
        optional(
          seq(
            $._expression,
            repeat(seq(",", $._expression)),
            optional(",") // Trailing comma is allowed
          )
        ),
        "]"
      ),

    // Record literal: {}, {key: value}, {key1: val1, key2: val2,}
    record_literal: ($) =>
      seq(
        "{",
        optional(
          seq(
            $.property,
            repeat(seq(",", $.property)),
            optional(",") // Trailing comma is allowed
          )
        ),
        "}"
      ),

    // Property in record: key: value
    // Keys can be identifiers or string literals
    property: ($) =>
      seq(
        field("key", choice($.identifier, $.string_literal)),
        ":",
        field("value", $._expression)
      ),

    // ============================================
    // LITERALS
    // ============================================

    // Number literals: integers, floats, and scientific notation
    number_literal: ($) => {
      const decimal = /[0-9]+/;
      const exponent = seq(/[eE]/, optional(/[+-]/), decimal);

      return token(
        choice(
          // Float: 3.14, -2.5, 0.0
          // Scientific with decimal: 1.5e10, -3.14e5
          seq(optional("-"), decimal, ".", decimal, optional(exponent)),
          // Integer with optional exponent: 42, -10, 0, 2e-3, 1e10
          seq(optional("-"), decimal, optional(exponent))
        )
      );
    },

    // String literals: double-quoted with escape sequences
    // Examples: "hello", "hello world", "with \"quotes\"", "with\nnewlines"
    string_literal: ($) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              /[^"\\]/, // Any character except quote or backslash
              /\\./ // Escape sequence: backslash followed by any character
            )
          ),
          '"'
        )
      ),

    // Boolean literals: true or false
    boolean_literal: ($) => choice("true", "false"),

    // Null literal
    null_literal: ($) => "null",

    // ============================================
    // VARIABLE REFERENCES
    // ============================================

    // Variable references: $ followed by identifier
    // Examples: $x, $my_var, $user_id
    variable_reference: ($) => seq("$", $.identifier),

    // ============================================
    // COMMENTS (defined to be used in extras)
    // ============================================

    // Single-line comments: # to end of line
    // Using underscore for unused parameter following tree-sitter convention
    comment: (_) => token(seq("#", /.*/)),
  },
});
