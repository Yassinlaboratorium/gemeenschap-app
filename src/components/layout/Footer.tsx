import Link from 'next/link'
import { MapPin, Mail, Phone } from 'lucide-react'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

const SOCIALS = [
  { href: 'https://www.facebook.com/degemeenschapvzw', icon: FacebookIcon, label: 'Facebook' },
  { href: 'https://www.instagram.com/degemeenschap.vzw', icon: InstagramIcon, label: 'Instagram' },
  { href: 'https://www.tiktok.com/@degemeenschap.vzw', icon: TikTokIcon, label: 'TikTok' },
  { href: 'https://www.linkedin.com/company/degemeenschap', icon: LinkedInIcon, label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="bg-dark border-t border-[#2a2a2a] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xs">DG</span>
              </div>
              <span className="font-black text-white tracking-tight text-lg">DE GEMEENSCHAP</span>
            </div>
            <p className="text-[#a0a0a0] text-sm leading-relaxed max-w-xs">
              for a collective future — jeugdhuis voor jongeren van Sint-Niklaas en omgeving.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIALS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-[#2a2a2a] flex items-center justify-center text-[#a0a0a0] hover:text-primary hover:border-primary/30 hover:bg-primary/10 transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Contact</p>
            <div className="space-y-2.5">
              <a
                href="mailto:info@degemeenschap.be"
                className="flex items-center gap-2.5 text-sm text-[#a0a0a0] hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0 text-primary/60" />
                info@degemeenschap.be
              </a>
              <a
                href="tel:+32485573117"
                className="flex items-center gap-2.5 text-sm text-[#a0a0a0] hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                +32 485 57 31 17
              </a>
              <div className="flex items-center gap-2.5 text-sm text-[#a0a0a0]">
                <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                Mercatorstraat 24, Sint-Niklaas
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] mt-10 pt-6 text-center">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} DE GEMEENSCHAP vzw — Sint-Niklaas</p>
        </div>
      </div>
    </footer>
  )
}
