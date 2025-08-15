"use client";

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-blue-100 text-sm">{desc}</p>
    </div>
  );
}

export default function AppHero() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="mx-auto h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            PartyPad Mobile App
          </h1>
          <p className="text-xl md:text-2xl mb-2">
            The Ultimate Tool for Bounce House Contractors
          </p>
          <p className="text-blue-100 text-lg">
            Private Access - For SATX Bounce Contractors Only
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          <FeatureCard
            icon="📍"
            title="Discover Tasks"
            desc="Find nearby party setups based on your location"
          />
          <FeatureCard
            icon="⚡"
            title="Real-time Updates"
            desc="Instant notifications for new tasks and updates"
          />
          <FeatureCard
            icon="💰"
            title="QuickBooks Sync"
            desc="Seamless accounting and payment integration"
          />
          <FeatureCard
            icon="📸"
            title="Photo Reports"
            desc="Document your work with photo uploads"
          />
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">
            What's New in Version 1.0.0-alpha.2
          </h2>
          <ul className="text-left space-y-2 text-blue-100">
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Enhanced push notifications with audio alerts
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Improved offline support and data sync
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Better location-based task discovery
            </li>
            <li className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              Streamlined QuickBooks integration
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
