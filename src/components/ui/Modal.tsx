"use client";

import React, { useEffect, useRef, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "center" | "bottom-left";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  position = "center",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Handle animation timing
  useEffect(() => {
    if (!isOpen && isAnimatingOut) {
      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isAnimatingOut]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  if (!isOpen && !isAnimatingOut) return null;

  return (
    <div
      className="fixed inset-0 overflow-y-auto z-[9999]"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className={`
        ${position === "center" 
          ? "flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0" 
          : "flex items-end justify-start min-h-screen p-4"}
      `}>
        {/* Background overlay */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${
            isAnimatingOut ? "animate-fade-out" : "animate-fade-in"
          }`}
          aria-hidden="true"
          onClick={handleClose}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        {/* Modal panel */}
        <div
          ref={modalRef}
          className={`inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all ${
            position === "center"
              ? `align-bottom sm:my-8 sm:align-middle sm:max-w-lg ${
                  isAnimatingOut ? "animate-slide-down" : "animate-slide-up"
                }`
              : `${
                  isAnimatingOut ? "animate-slide-out-bottom-left" : "animate-slide-in-bottom-left"
                }`
          } ${className}`}
        >
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
