import React, { useState } from "react";
import { Star, Sparkles, Users, TrendingUp } from "lucide-react";

interface Stats {
  averageRating: number;
  roundedRating: number;
  totalReviews: number;
  satisfactionRate: number;
}

const StatsSection: React.FC<{ stats: Stats }> = ({ stats }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const renderStars = (rating: number) => {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <Star
            key={`star-${i}`}
            className={`w-5 h-5 transition-all duration-300 transform ${
              i < rating
                ? "text-yellow-400 fill-yellow-400 scale-110"
                : "text-gray-300"
            }`}
          />
        ))}
      </>
    );
  };

  const cards = [
    {
      icon: <Sparkles className="w-8 h-8 text-yellow-400" />,
      title: "Overall Rating",
      value: `${stats?.averageRating} / 5` || "0.0",
      subComponent: (
        <div className="flex justify-center gap-1 mb-3 group-hover:gap-3 transition-all duration-300">
          {renderStars(stats?.roundedRating || 0)}
        </div>
      ),
      gradient: "from-blue-400/20 to-indigo-500/20",
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Verified Reviews",
      value: stats?.totalReviews || "0",
      subComponent: (
        <div className="text-blue-400 font-medium">From Real Customers</div>
      ),
      gradient: "from-blue-400/20 to-indigo-500/20",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-400" />,
      title: "Satisfaction Rate",
      value: `${stats?.satisfactionRate || "0"}%`,
      subComponent: (
        <div className="text-green-400 font-medium">Would Recommend</div>
      ),
      gradient: "from-blue-400/20 to-indigo-500/20",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 mb-16">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative overflow-hidden bg-white/5 backdrop-blur-lg p-8 rounded-2xl 
            transform transition-all duration-500 hover:scale-105 
            border border-white/10 group`}
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} 
            opacity-50 transition-opacity duration-300 
            group-hover:opacity-100`}
          />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              {card.icon}
              <div className="text-white/60 text-sm font-medium">
                {card.title}
              </div>
            </div>

            <div
              className="text-5xl font-bold text-white mb-4 
              tracking-tight transition-all duration-300 
              group-hover:scale-110 group-hover:text-transparent 
              group-hover:bg-clip-text group-hover:bg-gradient-to-r 
              from-white to-white/60"
            >
              {card.value}
            </div>

            {card.subComponent}
          </div>

          {/* Animated border */}
          <div
            className={`absolute inset-0 border-2 border-transparent 
            rounded-2xl transition-all duration-500 
            ${hoveredCard === index ? "border-white/20" : ""}`}
          />
        </div>
      ))}
    </div>
  );
};

export default StatsSection;
