"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { faqs } from "@/app/faq/data";

const FaqContent = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary-blue hover:text-primary-purple transition-colors duration-300 mb-8 group"
            >
              <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>

            <h1 className="text-4xl font-bold mb-8">
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
                Frequently Asked Questions
              </span>
            </h1>

            <div className="space-y-4 text-gray-600">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors duration-300"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="font-medium text-primary-purple">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-primary-blue flex-shrink-0" />
                    ) : (
                      <Plus className="w-5 h-5 text-primary-blue flex-shrink-0" />
                    )}
                  </button>
                  {openIndex === index && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-secondary-blue/5 p-6 rounded-lg mt-12">
              <p className="text-sm">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm mt-2">
                Have more questions? Please{" "}
                <Link
                  href="/contact"
                  className="text-primary-blue hover:text-primary-purple transition-colors duration-300"
                >
                  contact us
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqContent;
