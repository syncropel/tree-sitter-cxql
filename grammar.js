// tree-sitter-cxql/grammar.js

module.exports = grammar({
  name: "cxql",

  // Tell Tree-sitter that whitespace and comments can appear anywhere.
  extras: ($) => [/\s/, $.comment],

  // Define any rule ambiguities here later if they arise during development.
  conflicts: ($) => [],

  rules: {
    // The entry point of the grammar: a file can contain multiple statements.
    source_file: ($) => repeat($._statement),

    // A statement can be a pipeline or a shell keyword statement.
    _statement: ($) =>
      choice(
        $.pipeline,
        $.let_statement,
        $.connect_statement,
        $.if_statement,
        $.with_statement
      ),

    // A pipeline is one or more function calls separated by a pipe.
    pipeline: ($) => seq($.function_call, repeat(seq("|", $.function_call))),

    // --- Core Command Structure ---
    function_call: ($) =>
      seq(
        field("name", $.path_expression),
        repeat(field("argument", $._argument))
      ),

    path_expression: ($) =>
      seq($.identifier, repeat(seq(choice(".", "/"), $.identifier))),

    // An argument can be a positional subject, a named argument, or a labeled block.
    _argument: ($) =>
      choice(
        alias($._value, $.positional_argument), // The first value is the positional subject.
        $.named_argument,
        $.labeled_block
      ),

    named_argument: ($) =>
      seq(field("key", $.identifier), ":", field("value", $._value)),

    // --- Labeled Blocks ---
    labeled_block: ($) =>
      seq(
        field("label", choice("where", "with", "set", "using", "params")),
        optional(seq(":", field("type", $.identifier))),
        field("body", $.record) // A labeled block's content is always a record.
      ),

    // --- Dynamic Content (F-strings) ---
    fstring: ($) =>
      seq('$"', repeat(choice($.fstring_text, $.fstring_interpolation)), '"'),

    fstring_text: ($) => token(prec(1, /[^"{]+/)), // Match any text that isn't a quote or '{'

    fstring_interpolation: ($) =>
      seq(
        "{",
        $.pipeline, // A full sub-pipeline can be executed inside an f-string.
        "}"
      ),

    // --- Shell Keywords ---
    let_statement: ($) =>
      seq(
        "let",
        field("variable", $.variable),
        "=",
        field("value", $.pipeline)
      ),

    connect_statement: ($) =>
      seq(
        "connect",
        field("source", $._value),
        "--as",
        field("alias", $.identifier)
      ),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression_block),
        field("then", $.statement_block),
        optional(seq("else", field("else", $.statement_block)))
      ),

    with_statement: ($) =>
      seq(
        "with",
        field("alias", $.identifier),
        field("body", $.statement_block)
      ),

    expression_block: ($) => seq("{", $.pipeline, "}"),
    statement_block: ($) => seq("{", repeat($._statement), "}"),

    // --- Value Literals ---
    _value: ($) =>
      choice(
        $.string,
        $.number,
        $.boolean,
        $.null,
        $.variable,
        $.list,
        $.record,
        $.fstring
      ),

    string: ($) =>
      token(
        choice(
          seq('"', repeat(/[^"\\]|\\./), '"'), // Double-quoted string
          seq("'", repeat(/[^'\\]|\\./), "'") // Single-quoted string
        )
      ),

    number: ($) => token(/-?\d+(\.\d+)?/),

    boolean: ($) => token(choice("true", "false")),

    null: ($) => token("null"),

    variable: ($) => token(/\$[a-zA-Z_][a-zA-Z0-9_]*/),

    list: ($) => seq("[", sepBy(",", $._value), "]"),

    record: ($) => seq("{", sepBy(",", $.record_pair), "}"),

    record_pair: ($) =>
      seq(
        field("key", choice($.identifier, $.string)),
        ":",
        field("value", $._value)
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_-]*/,

    comment: ($) => token(seq("#", /.*/)),
  },
});

// Helper function for comma-separated lists
function sepBy(sep, rule) {
  return optional(seq(rule, repeat(seq(sep, rule)), optional(sep)));
}
