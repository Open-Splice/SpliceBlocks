/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Splice code generator class, including helper methods for
 * generating Splice for blocks.
 */

// Former goog.module ID: Blockly.Splice

import type {Block} from '../../core/block.js';
import type {Workspace} from '../../core/workspace.js';
import {CodeGenerator} from '../../core/generator.js';
import {inputTypes} from '../../core/inputs/input_types.js';
import {Names} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import * as Variables from '../../core/variables.js';

/**
 * Order of operation ENUMs.
 * Based on Splice operator precedence.
 */
// prettier-ignore
export enum Order {
  ATOMIC = 0,             // 0 "" ...
  COLLECTION = 1,         // arrays
  STRING_CONVERSION = 1,  // `expression...`
  MEMBER = 2.1,           // . []
  FUNCTION_CALL = 2.2,    // ()
  EXPONENTIATION = 3,     // ** (if added)
  UNARY_SIGN = 4,         // + -
  BITWISE_NOT = 4,        // ~ (if added)
  MULTIPLICATIVE = 5,     // * / %
  DIVISION = 5,           // / (same as MULTIPLICATIVE)
  ADDITIVE = 6,           // + -
  BITWISE_SHIFT = 7,      // << >> (if added)
  BITWISE_AND = 8,        // & (if added)
  BITWISE_XOR = 9,        // ^ (if added)
  BITWISE_OR = 10,        // | (if added)
  RELATIONAL = 11,        // > >= < <=
  EQUALITY = 12,          // == !=
  LOGICAL_NOT = 13,       // !
  LOGICAL_AND = 14,       // &&
  LOGICAL_OR = 15,        // ||
  CONDITIONAL = 16,       // if else
  ASSIGNMENT = 17,        // =
  NONE = 99,              // (...)
}

/**
 * Splice code generator class.
 */
export class SpliceGenerator extends CodeGenerator {
  /** List of outer-inner pairings that do NOT require parentheses. */
  ORDER_OVERRIDES: [Order, Order][] = [
    // (foo()).bar -> foo().bar
    // (foo())[0] -> foo()[0]
    [Order.FUNCTION_CALL, Order.MEMBER],
    // (foo())() -> foo()()
    [Order.FUNCTION_CALL, Order.FUNCTION_CALL],
    // (foo.bar).baz -> foo.bar.baz
    // (foo.bar)[0] -> foo.bar[0]
    // (foo[0]).bar -> foo[0].bar
    // (foo[0])[1] -> foo[0][1]
    [Order.MEMBER, Order.MEMBER],
    // (foo.bar)() -> foo.bar()
    // (foo[0])() -> foo[0]()
    [Order.MEMBER, Order.FUNCTION_CALL],

    // not (not foo) -> not not foo
    [Order.LOGICAL_NOT, Order.LOGICAL_NOT],
    // a && (b && c) -> a && b && c
    [Order.LOGICAL_AND, Order.LOGICAL_AND],
    // a || (b || c) -> a || b || c
    [Order.LOGICAL_OR, Order.LOGICAL_OR],
  ];

  /**
   * Empty blocks are not allowed in Splice.
   */
  PASS: string = ''; // Initialised by init().

  /** @param name Name of the language the generator is for. */
  constructor(name = 'Splice') {
    super(name);
    this.isInitialized = false;

    // Copy Order values onto instance for backwards compatibility
    for (const key in Order) {
      const value = Order[key];
      if (typeof value === 'number') {
        (this as any)[key] = value;
      }
    }
  }

  /**
   * Initialise the database of variable names.
   * @param workspace Workspace to generate code from.
   */
  init(workspace: Workspace) {
    super.init(workspace);

    if (!this.nameDB_) {
      this.nameDB_ = new Names(this.RESERVED_WORDS_);
    }

    this.nameDB_.reset();
    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    this.PASS = this.INDENT + '// pass\n';

    // Add user variables, but only ones that are being used.
    const defvars = [];
    const variables = Variables.allUsedVarModels(workspace);
    for (let i = 0; i < variables.length; i++) {
      defvars.push('let ' + this.getVariableName(variables[i].getId()) + ' = "";');
    }

    (this as any).definitions_['variables'] = defvars.join('\n');

    this.isInitialized = true;
  }

  /**
   * Prepend the generated code with the variable definitions.
   * @param code Generated code.
   * @return Completed code.
   */
  finish(code: string): string {
    // Convert the definitions dictionary into a list.
    const definitions = Object.values(this.definitions_);
    // Call Blockly.CodeGenerator's finish method to check that the
    // nameDB_ is not null.
    super.finish(code);
    this.isInitialized = false;

    // Do nothing special for Splice.
    return definitions.join('\n\n') + '\n\n' + code;
  }

  /**
   * Naked values are top-level blocks with outputs that aren't plugged into
   * anything.  A trailing semicolon is needed to make this legal.
   * @param line Line of generated code.
   * @return Legal line of code.
   */
  scrubNakedValue(line: string): string {
    return line + ';\n';
  }

  /**
   * Encode a string as a properly escaped Splice string, complete with
   * quotes.
   * @param string Text to encode.
   * @return Splice string.
   */
  quote_(string: string): string {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    string = string
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r');
    return '"' + string + '"';
  }

  /**
   * Encode a string as a properly escaped multiline Splice string, complete
   * with quotes.
   * @param string Text to encode.
   * @return Splice string.
   */
  multiline_quote_(string: string): string {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    const lines = string.split(/\n/g).map(this.quote_);
    return lines.join(' + \'\\n\' +\n');
  }

  /**
   * Common tasks for generating Splice from blocks.
   * Handles comments for the specified block and any connected value blocks.
   * Calls any statements following this block.
   * @param block The current block.
   * @param code The Splice code created for this block.
   * @param thisOnly True to generate code for only this statement.
   * @return Splice code with comments and subsequent blocks added.
   */
  scrub_(block: Block, code: string, thisOnly?: boolean): string {
    let commentCode = '';
    // Only collect comments for blocks that aren't inline.
    if (
      !block.outputConnection ||
      !block.outputConnection.targetConnection
    ) {
      // Collect comment for this block.
      let comment = block.getCommentText();
      if (comment) {
        comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
        commentCode += this.prefixLines(comment + '\n', '// ');
      }
      // Collect comments for all value arguments.
      // Don't collect comments for nested statements.
      for (let i = 0; i < block.inputList.length; i++) {
        if (block.inputList[i].type === inputTypes.VALUE) {
          const childBlock = block.inputList[i].connection?.targetBlock();
          if (childBlock) {
            comment = childBlock.getCommentText();
            if (comment) {
              comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
              commentCode += this.prefixLines(comment + '\n', '// ');
            }
          }
        }
      }
    }
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = thisOnly ? '' : this.blockToCode(nextBlock);
    return commentCode + code + nextCode;
  }

  /**
   * Gets a property and adjusts the value while taking into account indexing.
   * @param block The block.
   * @param atId The property ID of the element to get.
   * @param opt_delta Value to add.
   * @param opt_negate Whether to negate the value.
   * @param opt_order The highest order acting on this value.
   * @return The adjusted value or the default value if none is present.
   */
  getAdjusted(
    block: Block,
    atId: string,
    opt_delta?: number,
    opt_negate?: boolean,
    opt_order?: Order,
  ): string {
    let delta = opt_delta || 0;
    let order = opt_order || Order.NONE;
    if (block.workspace.options.oneBasedIndex) {
      delta--;
    }
    let defaultValue = this.valueToCode(block, atId, order);
    if (defaultValue !== '') {
      // Adjust the value.
      if (opt_negate) {
        defaultValue = '!' + defaultValue;
      }
      if (delta > 0) {
        defaultValue = defaultValue + ' + ' + delta;
      } else if (delta < 0) {
        defaultValue = defaultValue + ' - ' + -delta;
      }
      if (opt_order !== undefined && order >= Order.ADDITIVE) {
        defaultValue = '(' + defaultValue + ')';
      }
    }
    return defaultValue;
  }
}