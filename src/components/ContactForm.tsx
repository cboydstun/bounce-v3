"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getProducts } from "@/utils/api";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { trackFormStart, trackFormSubmit } from "@/utils/trackInteraction";
import { trackContactForm } from "@/utils/trackConversion";
import {
  initFormTracking,
  trackFieldInteraction,
  trackFormCompletion,
} from "@/utils/formEngagementTracking";

interface Specification {
  name: string;
  value: string | string[];
  _id: string;
}

interface Bouncer {
  _id: string;
  name: string;
  images: Array<{ url: string; alt: string }>;
  specifications: Specification[];
}

interface FormData {
  bouncer: string;
  email: string;
  partyDate: string;
  partyZipCode: string;
  phone: string;
  message: string;
  sourcePage: string;
  consentToContact: boolean;
}

interface FormErrors {
  bouncer?: string;
  email?: string;
  partyDate?: string;
  partyZipCode?: string;
  phone?: string;
}

interface ContactFormProps {
  initialBouncerId?: string;
}

const ContactForm = ({ initialBouncerId }: ContactFormProps) => {
  const router = useRouter();
  const formInitialized = useRef(false);

  // Initialize form tracking on mount
  useEffect(() => {
    if (!formInitialized.current) {
      // Count total interactive fields (excluding checkboxes)
      const totalFields = 5; // bouncer, email, partyDate, partyZipCode, phone
      initFormTracking("contact-form", totalFields);
      formInitialized.current = true;
    }
  }, []);
  const [formData, setFormData] = useState<FormData>({
    bouncer: "",
    email: "",
    partyDate: "",
    partyZipCode: "",
    phone: "",
    message: "",
    sourcePage: "contact",
    consentToContact: false,
  });

  const [bouncers, setBouncers] = useState<Bouncer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  useEffect(() => {
    const fetchBouncers = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getProducts();

        // Extract products array from the response
        const productsArray = data.products || [];

        const filteredBouncers = productsArray.filter((product: Bouncer) => {
          const typeSpec = product.specifications?.find(
            (spec) => spec.name === "Type",
          );
          if (!typeSpec) return false;

          if (Array.isArray(typeSpec.value)) {
            return typeSpec.value.some((v) => v === "WET" || v === "DRY");
          }
          return typeSpec.value === "WET" || typeSpec.value === "DRY";
        });

        setBouncers(filteredBouncers);

        // Set selected bouncer name if initialBouncerId is provided
        if (initialBouncerId) {
          const selectedBouncer = filteredBouncers.find(
            (b: Bouncer) => b._id === initialBouncerId,
          );
          if (selectedBouncer) {
            setFormData((prev) => ({
              ...prev,
              bouncer: selectedBouncer.name,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching bouncers:", error);
        setLoadError("Failed to load bouncers. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBouncers();
  }, [initialBouncerId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

    if (!formData.bouncer) newErrors.bouncer = "Please select a bouncer";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.partyDate) {
      newErrors.partyDate = "Party date is required";
    }

    if (!formData.partyZipCode) {
      newErrors.partyZipCode = "Party zip code is required";
    }

    // Simplified phone validation - just check if it has some digits if provided
    if (formData.phone && formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !formData.consentToContact) return;

    // Track form completion with detailed data
    trackFormCompletion("contact-form", formData);

    // Track form submission interaction
    trackFormSubmit("contact-form", undefined, {
      formType: "contact",
      bouncer: formData.bouncer,
    });

    try {
      // Direct fetch call instead of using createContact from api.ts
      const response = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit form: ${response.status}`);
      }

      // Track conversion event
      trackContactForm(formData.bouncer);

      // Redirect to success page instead of showing inline message
      router.push("/contact-form-success");
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Track form start when user first interacts with the form
    // Only track once when the form is empty
    if (
      formData.bouncer === "" &&
      formData.email === "" &&
      formData.partyDate === "" &&
      formData.partyZipCode === "" &&
      formData.phone === "" &&
      formData.message === ""
    ) {
      trackFormStart("contact-form");
    }

    // Track field interaction
    trackFieldInteraction("contact-form", name, "change", value);

    if (name === "bouncer") {
      const selectedBouncer = bouncers.find((b: Bouncer) => b._id === value);
      if (selectedBouncer) {
        setFormData((prev) => ({
          ...prev,
          bouncer: selectedBouncer.name, // Store the name instead of _id
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[800px] mx-auto bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-secondary-blue/20 shadow-lg p-8 space-y-6"
    >
      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center text-lg animate-fade-in">
          🎊 Woohoo! Your message is on its way! We&apos;ll be in touch super
          soon! 🌟
        </div>
      )}

      {submitStatus === "error" && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl text-center text-lg animate-fade-in">
          👋 Oops! Something went wrong. Please call{" "}
          <a href="tel:5122100194">
            <strong>(512)-210-0194</strong>
          </a>{" "}
          for a reward!🙏
        </div>
      )}

      {/* Bouncer Selection */}
      <div>
        <label
          id="bouncer-label"
          htmlFor="bouncer-select"
          className="block text-lg font-medium text-gray-700 mb-2"
        >
          🎪 Select a Bouncer
        </label>
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : loadError ? (
          <div className="text-red-500">{loadError}</div>
        ) : (
          <select
            id="bouncer-select"
            name="bouncer"
            value={bouncers.find((b) => b.name === formData.bouncer)?._id || ""} // Match by name to _id for select value
            onChange={handleChange}
            aria-labelledby="bouncer-label"
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          >
            <option value="">Choose a bouncer...</option>
            {bouncers.map((bouncer) => {
              const typeSpec = bouncer.specifications.find(
                (spec) => spec.name === "Type",
              );
              const type = Array.isArray(typeSpec?.value)
                ? typeSpec.value.join("/")
                : typeSpec?.value;
              return (
                <option key={bouncer._id} value={bouncer._id}>
                  {bouncer.name} ({type})
                </option>
              );
            })}
          </select>
        )}
        {errors.bouncer && (
          <p className="text-red-500 text-sm mt-1">{errors.bouncer}</p>
        )}
      </div>

      {/* Contact Details */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            📧 Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
            placeholder="your@email.com"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="partyDate"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            📅 When&apos;s the Big Day?
          </label>
          <input
            type="date"
            id="partyDate"
            name="partyDate"
            value={formData.partyDate}
            onChange={handleChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          />
          {errors.partyDate && (
            <p className="text-red-500 text-sm mt-1">{errors.partyDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="partyZipCode"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            📍 Party Zip Code
          </label>
          <input
            type="text"
            id="partyZipCode"
            name="partyZipCode"
            value={formData.partyZipCode}
            onChange={handleChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
            placeholder="Where's the party at?"
            autoComplete="postal-code"
          />
          {errors.partyZipCode && (
            <p className="text-red-500 text-sm mt-1">{errors.partyZipCode}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            📞 Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
            placeholder="Your phone number"
            autoComplete="tel"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Message Field */}
      <div>
        <label
          htmlFor="message"
          className="block text-lg font-medium text-gray-700 mb-2"
        >
          💭 Tell Us About Your Dream Party&apos;!
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full rounded-lg border-2 border-secondary-blue/20 shadow-sm focus:border-primary-purple focus:ring-primary-purple p-3"
          placeholder="Share your party vision with us..."
        />
      </div>

      {/* Consent Checkbox */}
      <div className="bg-secondary-blue/5 p-4 rounded-lg">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            id="consentToContact"
            name="consentToContact"
            checked={formData.consentToContact}
            onChange={handleChange}
            className="mt-1 rounded border-2 border-secondary-blue/20 text-primary-purple focus:ring-primary-purple"
          />
          <span className="text-sm text-gray-700">
            I agree to calls, texts, and emails about my party rental inquiry 📱
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!formData.consentToContact}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 ${
          formData.consentToContact
            ? "bg-gradient-to-r from-blue-400 to-purple-600 text-white hover:from-blue-500 hover:to-purple-700 shadow-md hover:shadow-lg"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Contact Now 🎉
      </button>
    </form>
  );
};

export default ContactForm;
