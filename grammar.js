/**
 * Tree-sitter Grammar for CXQL (Context Query Language)
 * Phase 1: Foundation - Tokens & Literals
 *
 * This phase covers:
 * - Program structure
 * - Comments
 * - Identifiers
 * - Keywords
 * - Number literals (integer, float, scientific)
 * - String literals
 * - Boolean literals
 * - Null literal
 * - Variable references
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
    // EXPRESSIONS (Phase 1: Primary expressions only)
    // ============================================

    _expression: ($) =>
      choice(
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.variable_reference
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
