import { Link } from "wouter";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="product-page flex items-center justify-center min-h-[75vh]">
      <div className="max-w-md w-full text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl border border-[rgba(43,36,32,0.1)] shadow-sm">
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[rgba(91,107,56,0.12)] text-[#5B6B38] flex items-center justify-center">
          <Compass size={28} />
        </div>
        <span className="eyebrow section-label text-[#5B6B38]">404 / Uncharted Corner</span>
        <h1 className="headline-serif text-espresso text-3xl md:text-4xl my-3">
          This room is yet to be measured.
        </h1>
        <p className="text-[#655E57] text-sm leading-relaxed mb-8">
          The coordinates you followed lead to an unmapped space. Return to the threshold to continue designing.
        </p>
        <Link href="/" className="button primary inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Return to House Muse
        </Link>
      </div>
    </main>
  );
}

