module.exports = grammar({
  name: "cxql",

  extras: ($) => [
    /\s/, // Whitespace
    $.comment,
  ],

  word: ($) => $.identifier,

  rules: {
    // === Program Structure ===
    program: ($) => repeat($._statement),

    _statement: ($) => $.expression_statement,

    expression_statement: ($) => $._expression,

    // === Expressions (Precedence Climbing) ===
    _expression: ($) =>
      choice(
        $.binary_expression, // Phase 3
        $.unary_expression, // Phase 4: Arithmetic unary (-)
        $.logical_not_expression, // Phase 4: Logical not
        $._primary_expression // Phase 1, 2, 4
      ),

    // Phase 4: Arithmetic unary operator (-)
    // Precedence 8: Higher than all binary operators
    unary_expression: ($) =>
      prec.right(8, seq("-", field("operand", $._expression))),

    // Phase 4: Logical not operator
    // Precedence 3: Between equality (4) and logical AND (2)
    // Lower than comparison, so "not x > 10" parses as "not (x > 10)"
    logical_not_expression: ($) =>
      prec.right(3, seq("not", field("operand", $._expression))),

    // Phase 3: Binary operators
    binary_expression: ($) =>
      choice(
        // Level 7 (highest): Multiplicative
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
        // Level 1 (lowest): Logical OR
        prec.left(
          1,
          seq(
            field("left", $._expression),
            field("operator", "or"),
            field("right", $._expression)
          )
        )
      ),

    // Phase 2: Primary expressions (HIDDEN)
    _primary_expression: ($) =>
      choice(
        $.function_call, // Phase 4: Check function call BEFORE identifier
        $.parenthesized_expression,
        $.list_literal,
        $.record_literal,
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.variable_reference
      ),

    // Phase 4: Function call
    function_call: ($) =>
      prec(
        9,
        seq(
          field("function", sep1($.identifier, ".")),
          field("arguments", $.argument_list)
        )
      ),

    // Phase 4: Argument list
    argument_list: ($) =>
      seq(
        "(",
        optional(
          seq(
            choice($.keyword_argument, $._expression),
            repeat(seq(",", choice($.keyword_argument, $._expression))),
            optional(",") // Trailing comma
          )
        ),
        ")"
      ),

    // Phase 4: Keyword argument (name=value)
    keyword_argument: ($) =>
      seq(field("name", $.identifier), "=", field("value", $._expression)),

    // Phase 2: Parenthesized expression
    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    // Phase 2: List literal
    list_literal: ($) =>
      seq(
        "[",
        optional(
          seq(
            $._expression,
            repeat(seq(",", $._expression)),
            optional(",") // Trailing comma
          )
        ),
        "]"
      ),

    // Phase 2: Record literal
    record_literal: ($) =>
      seq(
        "{",
        optional(
          seq($.property, repeat(seq(",", $.property)), optional(",")) // Trailing comma
        ),
        "}"
      ),

    // Phase 2: Property (key: value)
    property: ($) =>
      seq(
        field("key", choice($.identifier, $.string_literal)),
        ":",
        field("value", $._expression)
      ),

    // === Literals (Phase 1) ===

    identifier: ($) => token(seq(/[a-zA-Z]/, repeat(/[a-zA-Z0-9_-]/))),

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

    // === Comments (Phase 1) ===
    comment: ($) => token(seq("#", /.*/)),
  },
});

// Helper function: sep1 (one or more with separator)
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
