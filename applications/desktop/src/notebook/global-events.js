/* @flow strict */

import type { Store } from "redux";

import { is } from "immutable";
import { selectors } from "@nteract/core";

import type { AppState, KernelRef, ContentRef } from "@nteract/core";

import { killKernelImmediately } from "./epics/zeromq-kernels";

export function unload(store: Store<AppState, Action>) {
  const state = store.getState();

  state.core.entities.kernels.byRef.forEach((kernel, kernelRef) => {
    // Skip if kernel unknown
    if (!kernel || !kernel.type) {
      return;
    }

    if (kernel.type === "zeromq") {
      try {
        killKernelImmediately(kernel);
      } catch (e) {
        alert(`Trouble shutting down - ${e.message}`);
      }
    } else if (kernel.type === "websocket") {
      alert("Need to implement a way to shutdown websocket kernels on desktop");
    }
  });
}

export function beforeUnload(
  contentRef: ContentRef,
  store: Store<AppState, Action>,
  e: *
) {
  const state = store.getState();
  const model = selectors.model(state, { contentRef });

  if (!model || model.type !== "notebook") {
    // No model on the page, don't block them
    return;
  }

  if (selectors.notebook.isDirty(model)) {
    // Will prevent closing "will-prevent-unload"
    e.returnValue = true;
  }
}

export function initGlobalHandlers(
  contentRef: ContentRef,
  store: Store<AppState, Action>
) {
  window.onbeforeunload = beforeUnload.bind(null, contentRef, store);
  window.onunload = unload.bind(null, store);
}
