import Link from "next/link";
import { Wordmark } from "./site-header";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E4E7EC] bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
        <div>
          <Wordmark />
          <p className="text-sm text-[#626875] mt-4 max-w-xs leading-relaxed">
            One AI chatbot per business — trained on your documents and website,
            embedded with a single snippet.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#858B98] mb-4">Product</p>
          <ul className="space-y-2.5 text-sm text-[#626875]">
            <li><a href="#product" className="hover:text-[#17191F] transition-colors">Product</a></li>
            <li><a href="#how" className="hover:text-[#17191F] transition-colors">How it works</a></li>
            <li><a href="#demo" className="hover:text-[#17191F] transition-colors">Live demo</a></li>
            <li><a href="#pricing" className="hover:text-[#17191F] transition-colors">Pricing</a></li>
            <li><a href="#faq" className="hover:text-[#17191F] transition-colors">FAQ</a></li>
          </ul>
        </nav>
        <nav aria-label="Account">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#858B98] mb-4">Account</p>
          <ul className="space-y-2.5 text-sm text-[#626875]">
            <li><Link href="/login" className="hover:text-[#17191F] transition-colors">Sign in</Link></li>
            <li><Link href="/register" className="hover:text-[#17191F] transition-colors">Get started</Link></li>
            <li><Link href="/dashboard" className="hover:text-[#17191F] transition-colors">Dashboard</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-[#E4E7EC]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#858B98]">© {new Date().getFullYear()} BizOS AI. All rights reserved.</p>
          <p className="text-xs text-[#858B98]">Answers grounded in your content — with sources.</p>
        </div>
      </div>
    </footer>
  );
}
