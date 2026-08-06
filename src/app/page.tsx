'use client';

import Link from 'next/link';
import LandingNavigation from '@/components/public/LandingNavigation';
import HeroSection from '@/components/public/HeroSection';
import ProductDemo from '@/components/public/ProductDemo';
import HowItWorks from '@/components/public/HowItWorks';
import { BarChart, Settings, Users, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
      
      <LandingNavigation />
      
      <main>
        <HeroSection />
        
        <section id="demo" className="relative z-10 py-24 px-4 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto space-y-16">
             <div className="text-center space-y-4">
               <h3 className="text-3xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">See MarketPilot in Action</h3>
               <p className="text-lg text-slate-600 dark:text-slate-400">Experience the future of enterprise video generation</p>
             </div>
             
             <ProductDemo />
          </div>
        </section>

        <HowItWorks />

        {/* Features Section */}
        <section id="features" className="py-24 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Everything you need to scale video</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                MarketPilot replaces expensive agencies and scattered tools with a single, powerful AI-driven platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard icon={<BarChart />} title="Data-Driven" desc="Campaigns engineered for maximum engagement and ROI based on industry benchmarks." />
              <FeatureCard icon={<Settings />} title="On-Brand AI" desc="Hybrid Directors enforce your specific visual identity rules, fonts, and colors." />
              <FeatureCard icon={<Users />} title="Multi-Tenant" desc="Secure workspaces for individuals, teams, and large enterprises." />
              <FeatureCard icon={<Zap />} title="Lightning Fast" desc="Render 4K cinematic videos in minutes, not days. Fully cloud-based pipeline." />
              <FeatureCard icon={<Shield />} title="Enterprise Security" desc="Bank-grade encryption, SSO, and strict role-based access controls." />
              <FeatureCard icon={<Globe />} title="Global Reach" desc="Auto-translate and adapt campaigns for different regions instantly." />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 px-4">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
           <div className="col-span-2 md:col-span-1">
             <div className="font-bold text-xl mb-4 text-slate-900 dark:text-white">MarketPilot</div>
             <p className="text-slate-600 dark:text-slate-400 text-sm">Enterprise-grade AI video generation platform for modern marketing teams.</p>
           </div>
           <div>
             <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Product</h4>
             <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li><Link href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400">Features</Link></li>
               <li><Link href="#solutions" className="hover:text-indigo-600 dark:hover:text-indigo-400">Solutions</Link></li>
               <li><Link href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400">Pricing</Link></li>
             </ul>
           </div>
           <div>
             <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Company</h4>
             <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li><Link href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About</Link></li>
               <li><Link href="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400">Blog</Link></li>
               <li><Link href="/contact" className="hover:text-indigo-600 dark:hover:text-indigo-400">Contact</Link></li>
             </ul>
           </div>
           <div>
             <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
             <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
               <li><Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link></li>
               <li><Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">Terms of Service</Link></li>
               <li><Link href="/owner-login" className="hover:text-indigo-600 dark:hover:text-indigo-400">Owner Portal</Link></li>
             </ul>
           </div>
         </div>
         <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
           <p>© 2026 MarketPilot Inc. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 group">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  )
}
