/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Splice for procedure blocks.
 */

// Former goog.module ID: Blockly.Splice.procedures

import type {Block} from '../../core/block.js';
import type {SpliceGenerator} from './splice_generator.js';
import {Order} from './splice_generator.js';

export function procedures_defreturn(block: Block, generator: SpliceGenerator) {
  // Define a procedure with a return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  let xfix1 = '';
  if (generator.STATEMENT_PREFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
  }
  let branch = generator.statementToCode(block, 'STACK');
  let returnValue = generator.valueToCode(block, 'RETURN', Order.NONE) || '';
  let xfix2 = '';
  if (branch && returnValue) {
    // After any statements, we must have a return.
    xfix2 = xfix1 + 'return ' + returnValue + ';\n';
  } else if (returnValue) {
    // If we have a return, but no statements, just return the value.
    xfix2 = xfix1 + 'return ' + returnValue + ';\n';
  } else if (branch) {
    // If we have statements, but no return, add a void return.
    xfix2 = xfix1 + 'return;\n';
  } else {
    // No statements or return, just a void return.
    xfix2 = xfix1 + 'return;\n';
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.getVariableName(variables[i]);
  }
  let code = 'func ' + funcName + '(' + args.join(', ') + ') {\n' + branch + xfix2 + '}';
  code = generator.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  (generator as any).definitions_['%' + funcName] = code;
  return null;
}

export function procedures_defnoreturn(block: Block, generator: SpliceGenerator) {
  // Define a procedure with no return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  let xfix1 = '';
  if (generator.STATEMENT_PREFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
  }
  let branch = generator.statementToCode(block, 'STACK');
  let code = 'func ' + funcName + '(';
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.getVariableName(variables[i]);
  }
  code += args.join(', ') + ') {\n' + branch + xfix1 + '}\n';
  code = generator.scrub_(block, code);
  (generator as any).definitions_['%' + funcName] = code;
  return null;
}

export function procedures_callreturn(block: Block, generator: SpliceGenerator) {
  // Call a procedure with a return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
}

export function procedures_callnoreturn(block: Block, generator: SpliceGenerator) {
  // Call a procedure with no return value.
  const funcName = generator.getProcedureName(block.getFieldValue('NAME'));
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null';
  }
  return funcName + '(' + args.join(', ') + ');\n';
}

export function procedures_ifreturn(block: Block, generator: SpliceGenerator) {
  // Conditionally return value from a procedure.
  const condition = generator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
  let code = 'if (' + condition + ') {\n';
  if (generator.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += generator.prefixLines(
      generator.injectId(generator.STATEMENT_SUFFIX, block),
      generator.INDENT,
    );
  }
  if (block.getInput('RETURN')) {
    const value = generator.valueToCode(block, 'VALUE', Order.NONE) || 'null';
    code += generator.INDENT + 'return ' + value + ';\n';
  } else {
    code += generator.INDENT + 'return;\n';
  }
  code += '}\n';
  return code;
}