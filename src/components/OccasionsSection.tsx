import React from "react";
import {
  Cake,
  School,
  Church,
  Users,
  Calendar,
  GraduationCap,
  HeartHandshake,
  Sparkles,
} from "lucide-react";

interface OccasionItem {
  title: string;
  icon: React.ElementType;
  color: string;
}

const OccasionsSection: React.FC = () => {
  const occasions: OccasionItem[] = [
    {
      title: "Birthday Parties",
      icon: Cake,
      color: "from-pink-500 to-rose-500",
    },
    {
      title: "School Events",
      icon: School,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Church Functions",
      icon: Church,
      color: "from-purple-500 to-indigo-500",
    },
    {
      title: "Community Gatherings",
      icon: Users,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Holiday Parties",
      icon: Calendar,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Graduation Parties",
      icon: GraduationCap,
      color: "from-yellow-500 to-amber-500",
    },
    {
      title: "Fundraisers",
      icon: HeartHandshake,
      color: "from-teal-500 to-cyan-500",
    },
    {
      title: "And More!",
      icon: Sparkles,
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="py-4 mx-6">
      <h2 className="text-3xl font-bold text-center mb-12 text-white">
        Perfect For Any Occasion
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {occasions.map((occasion, index) => {
          const Icon = occasion.icon;
          return (
            <div
              key={index}
              className="min-h-[150px] max-h-[150px] group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div
                className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))`,
                }}
              />

              <div className="relative p-6 flex flex-col items-center gap-3">
                <div
                  className={`p-3 rounded-full bg-gradient-to-br ${occasion.color} transform transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="font-semibold text-gray-800 text-center group-hover:text-primary-purple transition-colors duration-300">
                  {occasion.title}
                </h3>
              </div>

              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary-purple/20 rounded-xl transition-colors duration-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OccasionsSection;
