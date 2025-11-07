module.exports = grammar({
  name: "cxql",

  extras: ($) => [
    /\s/, // Whitespace
    $.comment,
  ],

  word: ($) => $.identifier,

  // Explicitly declare the conflict between block and record_literal
  // This allows the GLR parser to explore both possibilities for {}
  conflicts: ($) => [[$.block, $.record_literal]],

  rules: {
    // === Program Structure ===
    program: ($) => repeat($._statement),

    // Phase 5: Expanded to include let statements
    _statement: ($) =>
      choice(
        $.let_statement, // Phase 5: NEW
        $.expression_statement // Existing
      ),

    expression_statement: ($) => $._expression,

    // Phase 5: Let statement
    // Syntax: let name = value
    let_statement: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("value", $._expression)
      ),

    // === Expressions (Precedence Climbing) ===
    _expression: ($) =>
      choice(
        $.binary_expression, // Phase 3
        $.unary_expression, // Phase 4: Arithmetic unary (-)
        $.logical_not_expression, // Phase 4: Logical not
        $._primary_expression // Phase 1, 2, 4, 5
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
        $.record_literal, // Phase 2: Record literal (for {key: value})
        $.block, // Phase 5: Block expression (for {statements; expr})
        $.if_expression, // Phase 5: If expression
        $.identifier,
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.null_literal,
        $.variable_reference
      ),

    // Phase 5: Block expression
    // A block contains let statements and/or a final expression
    // Syntax: { let x = 1  let y = 2  x + y }
    block: ($) => seq("{", optional($._block_body), "}"),

    // Block body distinguishes statements from final expression
    _block_body: ($) =>
      choice(
        // Just let statements (no final expression)
        repeat1($.let_statement),
        // Let statements followed by final expression
        seq(repeat1($.let_statement), field("result", $._expression)),
        // Just a final expression (no statements)
        field("result", $._expression)
      ),

    // Phase 5: If expression
    // Syntax: if { condition } { consequent } else { alternative }
    if_expression: ($) =>
      seq(
        "if",
        field("condition", $.block),
        field("consequent", $.block),
        optional(seq("else", field("alternative", $.block)))
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
    // Syntax: {key: value, key2: value2}
    // Distinguished from block by presence of colons
    // Dynamic precedence: prefer record_literal over block when ambiguous (e.g., {})
    record_literal: ($) =>
      prec.dynamic(
        1, // CHANGED: Dynamic precedence to prefer over block in conflicts
        seq(
          "{",
          optional(
            seq($.property, repeat(seq(",", $.property)), optional(","))
          ),
          "}"
        )
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
