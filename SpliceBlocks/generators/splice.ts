/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Instantiate a SpliceGenerator and populate it with the
 * complete set of block generator functions for Splice.  This is the
 * entrypoint for splice_compressed.js.
 */

// Former goog.module ID: Blockly.Splice.all

import * as lists from './splice/lists.js';
import * as logic from './splice/logic.js';
import * as loops from './splice/loops.js';
import * as math from './splice/math.js';
import * as procedures from './splice/procedures.js';
import {SpliceGenerator} from './splice/splice_generator.js';
import * as text from './splice/text.js';
import * as variables from './splice/variables.js';
import * as variablesDynamic from './splice/variables_dynamic.js';

export * from './splice/splice_generator.js';

/**
 * Splice code generator instance.
 * @type {!SpliceGenerator}
 */
export const spliceGenerator = new SpliceGenerator();

// Add reserved words.  This list should include all words mentioned
// in RESERVED WORDS: comments in the imports above.
spliceGenerator.addReservedWords('math,random,Number');

// Install per-block-type generator functions:
const generators = {
  ...lists,
  ...logic,
  ...loops,
  ...math,
  ...procedures,
  ...text,
  ...variables,
  ...variablesDynamic,
};
for (const name in generators) {
  (spliceGenerator.forBlock as any)[name] = (generators as any)[name];
}