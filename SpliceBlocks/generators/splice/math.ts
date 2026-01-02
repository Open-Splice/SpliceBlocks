/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for math blocks.
 */

// Former goog.module ID: Blockly.Splice.math

import type {Block} from '../../core/block.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Order} from './splice_generator.js';

export function math_number(block: Block, generator: SpliceGenerator) {
  // Numeric value.
  const code = String(block.getFieldValue('NUM'));
  return [code, Order.ATOMIC];
}

export function math_arithmetic(block: Block, generator: SpliceGenerator) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': [' + ', Order.ADDITIVE],
    'MINUS': [' - ', Order.ADDITIVE],
    'MULTIPLY': [' * ', Order.MULTIPLICATIVE],
    'DIVIDE': [' / ', Order.MULTIPLICATIVE],
    'POWER': [' ** ', Order.EXPONENTIATION],
  };
  type OperatorOption = keyof typeof OPERATORS;
  const tuple = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order as any) || '0';
  const argument1 = generator.valueToCode(block, 'B', order as any) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
}

export function math_single(block: Block, generator: SpliceGenerator) {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedents.
    arg = generator.valueToCode(block, 'NUM', Order.UNARY_SIGN) || '0';
    if (arg[0] === '-') {
      // --3 is not legal in Splice.
      arg = ' (' + arg + ')';
    }
    code = '-' + arg;
    return [code, Order.UNARY_SIGN];
  }
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    // Splice doesn't have built-in trig, but assume math.sin etc.
    code = 'math.' + operator.toLowerCase() + '(' + arg + ')';
  } else if (operator === 'ROOT') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    code = 'math.sqrt(' + arg + ')';
  } else if (operator === 'LN') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    code = 'math.log(' + arg + ')';
  } else if (operator === 'LOG10') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    code = 'math.log10(' + arg + ')';
  } else if (operator === 'ABS') {
    arg = generator.valueToCode(block, 'NUM', Order.UNARY_SIGN) || '0';
    code = 'math.abs(' + arg + ')';
  } else if (operator === 'EXP') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    code = 'math.exp(' + arg + ')';
  } else if (operator === 'POW10') {
    arg = generator.valueToCode(block, 'NUM', Order.MULTIPLICATIVE) || '0';
    code = 'math.pow(10, ' + arg + ')';
  } else {
    throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_constant(block: Block, generator: SpliceGenerator) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['math.PI', Order.MEMBER],
    'E': ['math.E', Order.MEMBER],
    'GOLDEN_RATIO': ['(1 + math.sqrt(5)) / 2', Order.MULTIPLICATIVE],
    'SQRT2': ['math.sqrt(2)', Order.FUNCTION_CALL],
    'SQRT1_2': ['math.sqrt(0.5)', Order.FUNCTION_CALL],
    'INFINITY': ['Infinity', Order.ATOMIC],
  };
  type ConstantOption = keyof typeof CONSTANTS;
  return CONSTANTS[block.getFieldValue('CONSTANT') as ConstantOption];
}

export function math_number_property(block: Block, generator: SpliceGenerator) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  const number_to_check = generator.valueToCode(block, 'NUMBER_TO_CHECK', Order.MULTIPLICATIVE) || '0';
  const dropdown_property = block.getFieldValue('PROPERTY');
  let code;
  if (dropdown_property === 'EVEN') {
    code = number_to_check + ' % 2 == 0';
  } else if (dropdown_property === 'ODD') {
    code = number_to_check + ' % 2 == 1';
  } else if (dropdown_property === 'WHOLE') {
    code = number_to_check + ' % 1 == 0';
  } else if (dropdown_property === 'POSITIVE') {
    code = number_to_check + ' > 0';
  } else if (dropdown_property === 'NEGATIVE') {
    code = number_to_check + ' < 0';
  } else if (dropdown_property === 'DIVISIBLE_BY') {
    const divisor = generator.valueToCode(block, 'DIVISOR', Order.MULTIPLICATIVE) || '1';
    code = number_to_check + ' % ' + divisor + ' == 0';
  } else {
    throw Error('Unknown number property: ' + dropdown_property);
  }
  return [code, Order.EQUALITY];
}

export function math_change(block: Block, generator: SpliceGenerator) {
  // Add to a variable in place.
  const argument0 = generator.valueToCode(block, 'DELTA', Order.ADDITIVE) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + varName + ' + ' + argument0 + ';\n';
}

// Rounding functions have a single operand.
export function math_round(block: Block, generator: SpliceGenerator) {
  // Round a number.
  const operator = block.getFieldValue('OP');
  let arg = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  let code;
  if (operator === 'ROUND') {
    code = 'math.round(' + arg + ')';
  } else if (operator === 'ROUNDUP') {
    code = 'math.ceil(' + arg + ')';
  } else if (operator === 'ROUNDDOWN') {
    code = 'math.floor(' + arg + ')';
  } else {
    throw Error('Unknown round operator: ' + operator);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_on_list(block: Block, generator: SpliceGenerator) {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  let code;
  if (func === 'SUM') {
    code = 'sum(' + list + ')';
  } else if (func === 'MIN') {
    code = 'min(' + list + ')';
  } else if (func === 'MAX') {
    code = 'max(' + list + ')';
  } else if (func === 'AVERAGE') {
    code = 'average(' + list + ')';
  } else if (func === 'MEDIAN') {
    code = 'median(' + list + ')';
  } else if (func === 'MODE') {
    code = 'mode(' + list + ')';
  } else if (func === 'STD_DEV') {
    code = 'std_dev(' + list + ')';
  } else if (func === 'RANDOM') {
    code = 'random.choice(' + list + ')';
  } else {
    throw Error('Unknown operator: ' + func);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_modulo(block: Block, generator: SpliceGenerator) {
  // Remainder computation.
  const argument0 = generator.valueToCode(block, 'DIVIDEND', Order.MULTIPLICATIVE) || '0';
  const argument1 = generator.valueToCode(block, 'DIVISOR', Order.MULTIPLICATIVE) || '1';
  const code = argument0 + ' % ' + argument1;
  return [code, Order.MULTIPLICATIVE];
}

export function math_constrain(block: Block, generator: SpliceGenerator) {
  // Constrain a number between two limits.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'LOW', Order.NONE) || '0';
  const argument2 = generator.valueToCode(block, 'HIGH', Order.NONE) || 'Infinity';
  const code = 'math.max(' + argument1 + ', math.min(' + argument2 + ', ' + argument0 + '))';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_int(block: Block, generator: SpliceGenerator) {
  // Random integer between [X] and [Y].
  const argument0 = generator.valueToCode(block, 'FROM', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.NONE) || '0';
  const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function math_random_float(block: Block, generator: SpliceGenerator) {
  // Random fraction between 0 and 1.
  return ['random.random()', Order.FUNCTION_CALL];
}

export function math_atan2(block: Block, generator: SpliceGenerator) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  const argument0 = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return ['math.atan2(' + argument1 + ', ' + argument0 + ')', Order.FUNCTION_CALL];
}