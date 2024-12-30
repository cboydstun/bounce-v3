"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

interface Section {
  title: string;
  content: string;
  variant: "default" | "secondary";
}

const InfoSections: React.FC = () => {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = sectionRefs.current.map((ref, index) => {
      if (!ref) return null;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                ref.style.opacity = "1";
                ref.style.transform = "translateY(0)";
              }, index * 200);
              observer.unobserve(ref);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const sections: Section[] = [
    {
      title: "Choose Us",
      content:
        "When you choose our party service, we are committed to offering the highest level of customer satisfaction. From the moment you book with us, you can expect a seamless and enjoyable experience with our water slides, bounce houses, or both! Our goal is to make your event memorable and fun with our wide range of wet inflatables, dry inflatables, and bounce houses.",
      variant: "default",
    },
    {
      title: "Safe & Clean Inflatable Rentals",
      content:
        "At SATX Bounce House Rentals, we understand that planning a party can be stressful, with numerous details to consider. To ease your worries, we prioritize the safety of your guests during your event in San Antonio. We take safety seriously with our water slides, dry slides, combo units, and bounce houses. Our commitment to safety includes using high-quality, well-maintained equipment for all our party rentals. We follow strict safety protocols for our wet and dry inflatables ensuring a successful and secure event. With SATX Bounce House Rentals, you can rest easy knowing we've done everything in our power to create a fun and safe environment for your party.",
      variant: "secondary",
    },
    {
      title: "Great Customer Service for Event Rentals",
      content:
        "At SATX Bounce House Rentals, we recognize that life can be unpredictable, and plans may change. That's why we emphasize flexibility for our party rentals in San Antonio, including water slides, wet and dry combo units, and great slide options. If you encounter unexpected changes and need to adjust your rental, we will collaborate with you to find the best solution for your needs. Our commitment to exceptional customer service ensures that you can rely on us to be there when you need us. Whether it's a minor issue or a major challenge, we will do everything in our power to make things right. With SATX Bounce House Rentals, you can trust that our wet and dry inflatables, slides, and party rentals will adapt to your changing circumstances.",
      variant: "default",
    },
    {
      title: "Free Delivery & Setup for Party Rentals",
      content:
        "At SATX Bounce House Rentals, we believe in providing a hassle-free experience for our customers in San Antonio. That's why we include delivery and setup in the price of your bounce houses and slide rentals. We will collaborate with you to schedule a convenient delivery time, and our team will arrive promptly before 8 am to set up your rental. Once your event has concluded, we will return after 6 pm to pick up the slide or bounce house. With us, you won't have to worry about a thing; we've got you covered from start to finish, ensuring a smooth and enjoyable party rental experience.",
      variant: "secondary",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid md:grid-cols-2 gap-8">
        {sections.map((section, index) => (
          <div
            key={index}
            ref={el => { sectionRefs.current[index] = el; }}
            className="transition-all duration-700"
            style={{
              opacity: 0,
              transform: "translateY(2rem)",
            }}
          >
            <Card
              className={`h-full transition-all duration-300 hover:shadow-lg ${
                section.variant === "secondary" ? "bg-[rgb(247,249,252)]" : "bg-white"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary-purple">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoSections;
