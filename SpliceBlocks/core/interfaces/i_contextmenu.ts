/**
 * @license
 * Copyright 2025 Sinha Group
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.IContextMenu

export interface IContextMenu {
  /**
   * Show the context menu for this object.
   *
   * @param e Mouse event.
   */
  showContextMenu(e: Event): void;
}
