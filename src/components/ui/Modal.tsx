"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactModal, { Styles } from "react-modal";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "center" | "bottom-left" | "sticky" | "follow-scroll"; // Added follow-scroll option
  onAfterOpen?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onAfterOpen,
  children,
  className = "",
  position = "center",
}) => {
  // Track scroll position
  const [scrollY, setScrollY] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const modalRef = useRef<HTMLDivElement>(null);

  // Capture initial scroll position when modal opens
  useEffect(() => {
    if (isOpen && position === "follow-scroll") {
      setScrollY(window.scrollY);
      setViewportHeight(window.innerHeight);

      // Update position on scroll
      const handleScroll = () => {
        setScrollY(window.scrollY);
      };

      // Update viewport height on resize
      const handleResize = () => {
        setViewportHeight(window.innerHeight);
      };

      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [isOpen, position]);

  // Calculate modal position based on scroll
  const getModalStyles = () => {
    if (position === "follow-scroll") {
      // Calculate a position that keeps the modal in view
      // Start with the initial scroll position
      let topPosition = scrollY;

      // Ensure the modal stays in viewport
      const modalHeight = modalRef.current?.offsetHeight || 300; // Fallback height
      const maxTop = Math.max(scrollY + viewportHeight - modalHeight - 20, 0);
      const minTop = scrollY + 300;

      // Keep modal within viewport bounds
      topPosition = Math.min(maxTop, Math.max(minTop, topPosition));

      return {
        content: {
          top: `${topPosition}px`,
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translateX(-50%)",
          padding: "20px",
          borderRadius: "8px",
          maxHeight: `${viewportHeight * 0.9}px`,
          overflow: "auto",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
        },
      } as Styles;
    }

    // Default centered modal style
    return {
      content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        padding: "20px",
        borderRadius: "8px",
      },
      overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
      },
    } as Styles;
  };

  const customStyles = getModalStyles();

  return (
    <ReactModal
      isOpen={isOpen}
      onAfterOpen={onAfterOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Modal"
      contentRef={(node) => {
        modalRef.current = node;
      }}
    >
      {children}
    </ReactModal>
  );
};

export default Modal;
