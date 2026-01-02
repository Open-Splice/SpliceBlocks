/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for text blocks.
 */

// Former goog.module ID: Blockly.Splice.text

import type {Block} from '../../core/block.js';
import type {CreateWithBlock} from '../../blocks/lists.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Order} from './splice_generator.js';

export function text(block: Block, generator: SpliceGenerator) {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_multiline(block: Block, generator: SpliceGenerator) {
  // Text value.
  const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(block: Block, generator: SpliceGenerator): [string, Order] {
  // Create a string made up of any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || '""';
  }
  const code = elements.join(' + ');
  return [code, Order.ADDITIVE];
}

export function text_append(block: Block, generator: SpliceGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const value = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return varName + ' = ' + varName + ' + ' + value + ';\n';
}

export function text_length(block: Block, generator: SpliceGenerator) {
  // String or array length.
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || '""';
  return ['len(' + text + ')', Order.FUNCTION_CALL];
}

export function text_isEmpty(block: Block, generator: SpliceGenerator) {
  // Is the string null or array empty?
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || '""';
  return ['len(' + text + ') == 0', Order.EQUALITY];
}

export function text_indexOf(block: Block, generator: SpliceGenerator) {
  // Search the text for a substring.
  const operator = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const substring = generator.valueToCode(block, 'FIND', Order.NONE) || '""';
  const text = generator.valueToCode(block, 'VALUE', Order.NONE) || '""';
  const code = text + '.' + operator + '(' + substring + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Order.ADDITIVE];
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_charAt(block: Block, generator: SpliceGenerator) {
  // Get letter at index.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder = where === 'RANDOM' ? Order.NONE : Order.NONE;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || '""';
  let at;
  if (where === 'FROM_START') {
    at = generator.getAdjusted(block, 'AT');
  } else if (where === 'FROM_END') {
    at = generator.getAdjusted(block, 'AT', 1, true);
  } else if (where === 'FIRST') {
    at = '0';
  } else if (where === 'LAST') {
    at = '-1';
  } else if (where === 'RANDOM') {
    const functionName = generator.provideFunction_('text_random_letter', [
      'function ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(text) {',
      '  const length = text.length;',
      '  const position = Math.floor(Math.random() * length);',
      '  return text[position];',
      '}',
    ]);
    const code = functionName + '(' + text + ')';
    return [code, Order.FUNCTION_CALL];
  } else {
    throw Error('Unhandled option (text_charAt).');
  }
  const code = text + '[' + at + ']';
  return [code, Order.MEMBER];
}

export function text_getSubstring(block: Block, generator: SpliceGenerator) {
  // Get substring.
  const text = generator.valueToCode(block, 'STRING', Order.NONE) || '""';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let at1;
  let at2;
  if (where1 === 'FROM_START') {
    at1 = generator.getAdjusted(block, 'AT1');
  } else if (where1 === 'FROM_END') {
    at1 = generator.getAdjusted(block, 'AT1', 1, true);
  } else if (where1 === 'FIRST') {
    at1 = '0';
  } else {
    throw Error('Unhandled option (text_getSubstring).');
  }
  if (where2 === 'FROM_START') {
    at2 = generator.getAdjusted(block, 'AT2', 1);
  } else if (where2 === 'FROM_END') {
    at2 = generator.getAdjusted(block, 'AT2', 0, true);
  } else if (where2 === 'LAST') {
    at2 = '';
  } else {
    throw Error('Unhandled option (text_getSubstring).');
  }
  const code = text + '.substring(' + at1 + ', ' + at2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_changeCase(block: Block, generator: SpliceGenerator) {
  // Change capitalization.
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  let code;
  if (block.getFieldValue('CASE') === 'UPPERCASE') {
    code = text + '.toUpperCase()';
  } else if (block.getFieldValue('CASE') === 'LOWERCASE') {
    code = text + '.toLowerCase()';
  } else if (block.getFieldValue('CASE') === 'TITLECASE') {
    const functionName = generator.provideFunction_('text_toTitleCase', [
      'function ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(str) {',
      '  return str.replace(/\\b\\w/g, l => l.toUpperCase());',
      '}',
    ]);
    code = functionName + '(' + text + ')';
  } else {
    throw Error('Unknown case type: ' + block.getFieldValue('CASE'));
  }
  return [code, Order.FUNCTION_CALL];
}

export function text_trim(block: Block, generator: SpliceGenerator) {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': '.trimStart()',
    'RIGHT': '.trimEnd()',
    'BOTH': '.trim()',
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return [text + operator, Order.FUNCTION_CALL];
}

export function text_print(block: Block, generator: SpliceGenerator) {
  // Print statement.
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return 'print(' + msg + ');\n';
}

export function text_prompt_ext(block: Block, generator: SpliceGenerator) {
  // Prompt function.
  const functionName = generator.provideFunction_('text_prompt', [
    'function ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(msg) {',
    '  if (msg) {',
    '    return window.prompt(msg);',
    '  } else {',
    '    return window.prompt("");',
    '  }',
    '}',
  ]);
  const msg = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const code = functionName + '(' + msg + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_prompt(block: Block, generator: SpliceGenerator) {
  // Prompt function (internal message).
  const msg = generator.quote_(block.getFieldValue('TEXT'));
  const code = 'input(' + msg + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_count(block: Block, generator: SpliceGenerator) {
  // Count occurrences of a substring.
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const sub = generator.valueToCode(block, 'SUB', Order.NONE) || '""';
  const functionName = generator.provideFunction_('text_count', [
    'function ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(haystack, needle) {',
    '  if (needle.length === 0) return haystack.length + 1;',
    '  let n = 0;',
    '  let i = 0;',
    '  while ((i = haystack.indexOf(needle, i)) !== -1) {',
    '    n++;',
    '    i += needle.length;',
    '  }',
    '  return n;',
    '}',
  ]);
  const code = functionName + '(' + text + ', ' + sub + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_replace(block: Block, generator: SpliceGenerator) {
  // Replace occurrences of a substring.
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const from = generator.valueToCode(block, 'FROM', Order.NONE) || '""';
  const to = generator.valueToCode(block, 'TO', Order.NONE) || '""';
  const code = text + '.replace(' + from + ', ' + to + ')';
  return [code, Order.FUNCTION_CALL];
}

export function text_reverse(block: Block, generator: SpliceGenerator) {
  // Reverse a string.
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const code = text + '.split("").reverse().join("")';
  return [code, Order.FUNCTION_CALL];
}