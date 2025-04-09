"use client";

import { useEffect } from "react";
import ReactModal from "react-modal";

export default function ReactModalSetup() {
  useEffect(() => {
    // Just use document.body as the app element
    ReactModal.setAppElement(document.body);
  }, []);

  return null;
}
