module.exports = grammar({
  name: "cxql",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [[$.block, $.record_literal]],

  rules: {
    // ============================================================================
    // Program Structure
    // ============================================================================

    program: ($) => repeat($._statement),

    _statement: ($) =>
      choice(
        $.let_statement,
        $.connect_statement, // NEW: Phase 8
        $.expression_statement
      ),

    let_statement: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $._expression)
      ),

    // NEW: Phase 8 - Connect statement
    connect_statement: ($) =>
      seq(
        "connect",
        "(",
        field("source", $._expression),
        ",",
        "as",
        "=",
        field("alias", $.string_literal),
        ")"
      ),

    expression_statement: ($) => $._expression,

    // ============================================================================
    // Expressions
    // ============================================================================

    _expression: ($) =>
      choice(
        $.pipe_expression,
        $.arrow_expression,
        $.binary_expression,
        $.unary_expression,
        $.logical_not_expression,
        $._primary_expression
      ),

    // Pipe operator (Level 6 - same as addition)
    pipe_expression: ($) =>
      prec.left(
        6,
        seq(field("left", $._expression), "|", field("right", $._expression))
      ),

    // Arrow functions (Level 0 - lowest precedence, right associative)
    arrow_expression: ($) =>
      prec.right(
        0,
        seq(
          field("parameter", $.identifier),
          "=>",
          field("body", $._expression)
        )
      ),

    // Binary expressions with precedence levels
    binary_expression: ($) =>
      choice(
        // Level 7: Multiplicative (highest)
        prec.left(
          7,
          seq(
            field("left", $._expression),
            field("operator", choice("*", "/", "%")),
            field("right", $._expression)
          )
        ),
        // Level 6: Additive
        prec.left(
          6,
          seq(
            field("left", $._expression),
            field("operator", choice("+", "-")),
            field("right", $._expression)
          )
        ),
        // Level 5: Comparison
        prec.left(
          5,
          seq(
            field("left", $._expression),
            field("operator", choice("<", ">", "<=", ">=")),
            field("right", $._expression)
          )
        ),
        // Level 4: Equality
        prec.left(
          4,
          seq(
            field("left", $._expression),
            field("operator", choice("==", "!=")),
            field("right", $._expression)
          )
        ),
        // Level 2: Logical AND
        prec.left(
          2,
          seq(
            field("left", $._expression),
            field("operator", "and"),
            field("right", $._expression)
          )
        ),
        // Level 1: Logical OR (lowest)
        prec.left(
          1,
          seq(
            field("left", $._expression),
            field("operator", "or"),
            field("right", $._expression)
          )
        )
      ),

    // Unary minus (Level 8 - higher than multiplication)
    unary_expression: ($) =>
      prec.right(8, seq("-", field("operand", $._expression))),

    // Logical NOT (Level 3 - between equality and AND)
    logical_not_expression: ($) =>
      prec.right(3, seq("not", field("operand", $._expression))),

    // ============================================================================
    // Primary Expressions
    // ============================================================================

    _primary_expression: ($) =>
      choice(
        $.member_expression,
        $.function_call,
        $.parenthesized_expression,
        $.list_literal,
        $.record_literal,
        $.block,
        $.if_expression,
        $.fstring_literal, // NEW: Phase 8
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.variable_reference
      ),

    // Member access (Level 10 - highest precedence)
    member_expression: ($) =>
      prec(
        10,
        seq(
          field("object", $._primary_expression),
          ".",
          field("property", $.identifier)
        )
      ),

    // Function call (Level 9)
    function_call: ($) =>
      prec(
        9,
        seq(
          field("function", $._primary_expression),
          field("arguments", $.argument_list)
        )
      ),

    argument_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            choice($._expression, $.keyword_argument),
            repeat(seq(",", choice($._expression, $.keyword_argument))),
            optional(",")
          )
        ),
        ")"
      ),

    keyword_argument: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._expression)),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // ============================================================================
    // Composite Literals
    // ============================================================================

    list_literal: ($) =>
      seq(
        "[",
        optional(
          seq($._expression, repeat(seq(",", $._expression)), optional(","))
        ),
        "]"
      ),

    record_literal: ($) =>
      prec.dynamic(
        1,
        seq(
          "{",
          optional(
            seq($.property, repeat(seq(",", $.property)), optional(","))
          ),
          "}"
        )
      ),

    property: ($) =>
      seq(
        field("key", choice($.identifier, $.string_literal)),
        ":",
        field("value", $._expression)
      ),

    // ============================================================================
    // Control Flow
    // ============================================================================

    block: ($) => seq("{", optional($._block_body), "}"),

    _block_body: ($) =>
      choice(
        repeat1($.let_statement),
        seq(repeat1($.let_statement), field("result", $._expression)),
        field("result", $._expression)
      ),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $.block),
        field("consequent", $.block),
        optional(seq("else", field("alternative", $.block)))
      ),

    // ============================================================================
    // NEW: Phase 8 - F-String Literals
    // ============================================================================

    fstring_literal: ($) =>
      seq('$"', repeat(choice($.fstring_text, $.fstring_interpolation)), '"'),

    fstring_text: ($) => token.immediate(prec(1, /[^{"]+/)),

    fstring_interpolation: ($) =>
      seq("{", field("expression", $._expression), "}"),

    // ============================================================================
    // Simple Literals
    // ============================================================================

    identifier: ($) => /[a-zA-Z][a-zA-Z0-9_-]*/,

    number_literal: ($) => {
      const decimal = /[0-9]+/;
      const exponent = seq(/[eE]/, optional(/[+-]/), decimal);
      return token(
        choice(
          decimal,
          seq(decimal, ".", decimal, optional(exponent)),
          seq(decimal, exponent)
        )
      );
    },

    string_literal: ($) =>
      token(seq('"', repeat(choice(/[^"\\]/, /\\./)), '"')),

    boolean_literal: ($) => choice("true", "false"),

    null_literal: ($) => "null",

    variable_reference: ($) => seq("$", $.identifier),

    // ============================================================================
    // Comments
    // ============================================================================

    comment: ($) => token(seq("#", /.*/)),
  },
});
