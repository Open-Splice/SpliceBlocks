/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for dynamic variable blocks.
 */

// Former goog.module ID: Blockly.Splice.variablesDynamic

import type {Block} from '../../core/block.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Order} from './splice_generator.js';

export function variables_get_dynamic(block: Block, generator: SpliceGenerator) {
  // Dynamic variable getter.
  const code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
}

export function variables_set_dynamic(block: Block, generator: SpliceGenerator) {
  // Dynamic variable setter.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + argument0 + ';\n';
}