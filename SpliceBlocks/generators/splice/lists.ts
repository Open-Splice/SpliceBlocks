/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for list blocks.
 */

// Former goog.module ID: Blockly.Splice.lists

import type {Block} from '../../core/block.js';
import type {CreateWithBlock} from '../../blocks/lists.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Order} from './splice_generator.js';

export function lists_create_empty(block: Block, generator: SpliceGenerator) {
  // Create an empty list.
  return ['[]', Order.ATOMIC];
}

export function lists_create_with(block: Block, generator: SpliceGenerator): [string, Order] {
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  const code = '[' + elements.join(',') + ']';
  return [code, Order.ATOMIC];
}

export function lists_repeat(block: Block, generator: SpliceGenerator) {
  // Create a list with one element repeated.
  const functionName = generator.provideFunction_('lists_repeat', [
    'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(value, n) {',
    '  let arr = [];',
    '  let i = 0;',
    '  while (i < n) {',
    '    append(arr, value);',
    '    i = i + 1;',
    '  }',
    '  return arr;',
    '}',
  ]);
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'null';
  const repeatCount = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = functionName + '(' + element + ', ' + repeatCount + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_length(block: Block, generator: SpliceGenerator) {
  // String or array length.
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
  return ['len(' + list + ')', Order.FUNCTION_CALL];
}

export function lists_isEmpty(block: Block, generator: SpliceGenerator) {
  // Is the list empty?
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
  return ['len(' + list + ') == 0', Order.EQUALITY];
}

export function lists_indexOf(block: Block, generator: SpliceGenerator) {
  // Find an item in the list.
  const isFirst = block.getFieldValue('END') === 'FIRST';
  const functionName = generator.provideFunction_(
    isFirst ? 'lists_indexOf' : 'lists_lastIndexOf',
    isFirst
      ? [
          'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(list, item) {',
          '  let i = 0;',
          '  while (i < len(list)) {',
          '    if (list[i] == item) {',
          '      return i;',
          '    }',
          '    i = i + 1;',
          '  }',
          '  return -1;',
          '}',
        ]
      : [
          'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(list, item) {',
          '  let i = len(list) - 1;',
          '  while (i >= 0) {',
          '    if (list[i] == item) {',
          '      return i;',
          '    }',
          '    i = i - 1;',
          '  }',
          '  return -1;',
          '}',
        ]
  );
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || 'null';
  const list = generator.valueToCode(block, 'VALUE', Order.NONE) || '[]';
  let code = functionName + '(' + list + ', ' + item + ')';
  if (block.workspace.options.oneBasedIndex) {
    code += ' + 1';
  }
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(block: Block, generator: SpliceGenerator) {
  // Get element at index.
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  let at = generator.getAdjusted(block, 'AT');
  const code = list + '[' + at + ']';
  return [code, Order.MEMBER];
}

export function lists_setIndex(block: Block, generator: SpliceGenerator) {
  // Set element at index.
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  let at = generator.getAdjusted(block, 'AT');
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';
  return list + '[' + at + '] = ' + value + ';\n';
}

export function lists_getSublist(block: Block, generator: SpliceGenerator) {
  // Get sublist.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
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
    throw Error('Unhandled option (lists_getSublist).');
  }
  if (where2 === 'FROM_START') {
    at2 = generator.getAdjusted(block, 'AT2', 1);
  } else if (where2 === 'FROM_END') {
    at2 = generator.getAdjusted(block, 'AT2', 0, true);
  } else if (where2 === 'LAST') {
    at2 = 'len(' + list + ')';
  } else {
    throw Error('Unhandled option (lists_getSublist).');
  }
  const functionName = generator.provideFunction_('lists_getSublist', [
    'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(list, start, end) {',
    '  let result = [];',
    '  let i = start;',
    '  while (i < end) {',
    '    append(result, list[i]);',
    '    i = i + 1;',
    '  }',
    '  return result;',
    '}',
  ]);
  const code = functionName + '(' + list + ', ' + at1 + ', ' + at2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_split(block: Block, generator: SpliceGenerator) {
  // Block for splitting text into a list, or joining a list into text.
  const input = generator.valueToCode(block, 'INPUT', Order.NONE);
  const delimiter = generator.valueToCode(block, 'DELIM', Order.NONE) || '""';
  const mode = block.getFieldValue('MODE');
  let functionName;
  let code;
  if (mode === 'SPLIT') {
    functionName = generator.provideFunction_('lists_split', [
      'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(input, delim) {',
      '  // Simple split implementation',
      '  let result = [];',
      '  let current = "";',
      '  let i = 0;',
      '  while (i < len(input)) {',
      '    if (input[i] == delim) {',
      '      append(result, current);',
      '      current = "";',
      '    } else {',
      '      current = current + input[i];',
      '    }',
      '    i = i + 1;',
      '  }',
      '  append(result, current);',
      '  return result;',
      '}',
    ]);
    code = functionName + '(' + input + ', ' + delimiter + ')';
  } else if (mode === 'JOIN') {
    functionName = generator.provideFunction_('lists_join', [
      'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(input, delim) {',
      '  let result = "";',
      '  let i = 0;',
      '  while (i < len(input)) {',
      '    if (i > 0) {',
      '      result = result + delim;',
      '    }',
      '    result = result + input[i];',
      '    i = i + 1;',
      '  }',
      '  return result;',
      '}',
    ]);
    code = functionName + '(' + input + ', ' + delimiter + ')';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  return [code, Order.FUNCTION_CALL];
}

export function lists_sort(block: Block, generator: SpliceGenerator) {
  // Block for sorting a list.
  const list = generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || '[]';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');
  const functionName = generator.provideFunction_('lists_sort', [
    'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(list, type, direction) {',
    '  let copy = [];',
    '  let i = 0;',
    '  while (i < len(list)) {',
    '    append(copy, list[i]);',
    '    i = i + 1;',
    '  }',
    '  // Simple bubble sort',
    '  i = 0;',
    '  while (i < len(copy) - 1) {',
    '    let j = 0;',
    '    while (j < len(copy) - i - 1) {',
    '      let swap = false;',
    '      if (type == "NUMERIC") {',
    '        if (direction == 1) {',
    '          swap = copy[j] > copy[j + 1];',
    '        } else {',
    '          swap = copy[j] < copy[j + 1];',
    '        }',
    '      } else {',
    '        // String comparison, simplified',
    '        if (direction == 1) {',
    '          swap = copy[j] > copy[j + 1];',
    '        } else {',
    '          swap = copy[j] < copy[j + 1];',
    '        }',
    '      }',
    '      if (swap) {',
    '        let temp = copy[j];',
    '        copy[j] = copy[j + 1];',
    '        copy[j + 1] = temp;',
    '      }',
    '      j = j + 1;',
    '    }',
    '    i = i + 1;',
    '  }',
    '  return copy;',
    '}',
  ]);
  const code = functionName + '(' + list + ', "' + type + '", ' + direction + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_reverse(block: Block, generator: SpliceGenerator) {
  // Block for reversing a list.
  const list = generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || '[]';
  const functionName = generator.provideFunction_('lists_reverse', [
    'func ' + generator.FUNCTION_NAME_PLACEHOLDER_ + '(list) {',
    '  let result = [];',
    '  let i = len(list) - 1;',
    '  while (i >= 0) {',
    '    append(result, list[i]);',
    '    i = i - 1;',
    '  }',
    '  return result;',
    '}',
  ]);
  const code = functionName + '(' + list + ')';
  return [code, Order.FUNCTION_CALL];
}