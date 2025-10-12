import React from 'react';
import type { PricingTier } from '../types';

interface PricingSectionProps {
  tiers: PricingTier[];
}

const PricingCard: React.FC<{ tier: PricingTier }> = ({ tier }) => {
    const isFeatured = tier.isFeatured;
    return (
        <div className={`relative flex flex-col p-8 rounded-2xl shadow-lg transition-transform duration-300 ${isFeatured ? 'bg-[var(--bg-card)] border-2 border-[var(--primary-color)] scale-105' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)]'}`}>
            {isFeatured && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                    <span className="bg-[var(--primary-color)] text-gray-900 text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                        Most Popular
                    </span>
                </div>
            )}
            <h3 className="text-2xl font-bold text-center text-[var(--text-primary)]">{tier.title}</h3>
            <p className="mt-4 text-center text-[var(--text-secondary)]">{tier.description}</p>
            <div className="mt-6 text-center text-[var(--text-primary)]">
                <span className="text-5xl font-black tracking-tight">{tier.price}</span>
                <span className="text-base font-semibold ml-1">{tier.currency}</span>
            </div>
            <ul className="mt-8 space-y-4 flex-grow">
                {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mr-3 mt-1 flex-shrink-0"></i>
                        <span className="text-[var(--text-secondary)]">{feature}</span>
                    </li>
                ))}
            </ul>
            <a href={tier.buttonUrl || '#'} target="_blank" rel="noopener noreferrer" className={`block w-full text-center mt-10 px-6 py-3 rounded-lg font-semibold transition-colors duration-300 ${isFeatured ? 'bg-[var(--primary-color)] text-gray-900 hover:brightness-110' : 'bg-[var(--primary-color)]/20 text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-gray-900'}`}>
                {tier.buttonText}
            </a>
        </div>
    );
};

const PricingSection: React.FC<PricingSectionProps> = ({ tiers }) => {
  if (tiers.length === 0) {
    return null; // Don't render the section if there are no tiers
  }

  return (
    <section id="pricing" className="py-20 md:py-32 bg-[var(--bg-primary)]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-[var(--text-primary)]">
            Our <span className="text-[var(--primary-color)]">Plans</span>
          </h2>
          <div className="w-24 h-1 bg-[var(--primary-color)] mx-auto mt-4"></div>
          <p className="max-w-2xl mx-auto mt-6 text-lg text-[var(--text-secondary)]">
            Choose the perfect plan to bring your vision to life. We offer flexible options tailored for every production scale.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.sort((a, b) => a.order - b.order).map(tier => (
                <PricingCard key={tier.$id} tier={tier} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
