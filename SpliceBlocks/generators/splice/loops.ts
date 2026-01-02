/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for loop blocks.
 */

// Former goog.module ID: Blockly.Splice.loops

import type {Block} from '../../core/block.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Names} from '../../core/names.js';
import {Order} from './splice_generator.js';

export function controls_repeat_ext(block: Block, generator: SpliceGenerator) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    // Internal number.
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    repeats = generator.valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
  }
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  const loopVar = generator.nameDB_!.getDistinctName('count', Names.NameType.VARIABLE);
  let endVar = repeats;
  if (!repeats.match(/^\w+$/) && !String(parseFloat(repeats)).match(/^-?\d+(\.\d+)?$/)) {
    endVar = generator.nameDB_!.getDistinctName('repeat_end', Names.NameType.VARIABLE);
    code += 'let ' + endVar + ' = ' + repeats + ';\n';
  }
  code += 'for (let ' + loopVar + ' = 0; ' + loopVar + ' < ' + endVar + '; ' + loopVar + '++) {\n' + branch + '}\n';
  return code;
}

export function controls_repeat(block: Block, generator: SpliceGenerator) {
  // Repeat n times. (internal number).
  const repeats = String(parseInt(block.getFieldValue('TIMES'), 10));
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  const loopVar = generator.nameDB_!.getDistinctName('count', Names.NameType.VARIABLE);
  code += 'for (let ' + loopVar + ' = 0; ' + loopVar + ' < ' + repeats + '; ' + loopVar + '++) {\n' + branch + '}\n';
  return code;
}

export function controls_whileUntil(block: Block, generator: SpliceGenerator) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = generator.valueToCode(block, 'BOOL', Order.LOGICAL_AND) || 'false';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
}

export function controls_for(block: Block, generator: SpliceGenerator) {
  // For loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 = generator.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
  const increment = generator.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  // In Splice, for loop is for var in start . end { }
  // But for increment, it's not directly supported, so use while.
  if (increment === '1') {
    code += 'for ' + variable0 + ' in ' + argument0 + ' . ' + argument1 + ' {\n' + branch + '}\n';
  } else {
    // For custom increment, use while loop.
    code += 'let ' + variable0 + ' = ' + argument0 + ';\n';
    code += 'while (' + variable0 + ' <= ' + argument1 + ') {\n' + branch + '  ' + variable0 + ' = ' + variable0 + ' + ' + increment + ';\n}\n';
  }
  return code;
}

export function controls_forEach(block: Block, generator: SpliceGenerator) {
  // For each loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 = generator.valueToCode(block, 'LIST', Order.ASSIGNMENT) || '[]';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  // Splice doesn't have for each, so use for loop with index.
  const listVar = generator.nameDB_!.getDistinctName('list', Names.NameType.VARIABLE);
  const indexVar = generator.nameDB_!.getDistinctName('index', Names.NameType.VARIABLE);
  code += 'let ' + listVar + ' = ' + argument0 + ';\n';
  code += 'for (let ' + indexVar + ' = 0; ' + indexVar + ' < len(' + listVar + '); ' + indexVar + '++) {\n';
  code += '  let ' + variable0 + ' = ' + listVar + '[' + indexVar + '];\n' + branch + '}\n';
  return code;
}

export function controls_flow_statements(block: Block, generator: SpliceGenerator) {
  // Flow statements: continue, break.
  const xfix = '';
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    return generator.injectId(generator.STATEMENT_PREFIX, block) + xfix + block.getFieldValue('FLOW') + ';\n';
  } else {
    return xfix + block.getFieldValue('FLOW') + ';\n';
  }
}