import React from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { MenuTabModel } from '../models/menu-tab-models';
import { getMenuTabs } from './ReadData';

import profilepic from "@/assets/drinks/male-avatar-cartoon.jpg"

const Header = () => {
  const [menuTabs, setMenuTabs] = useState<MenuTabModel[]>([])

  React.useEffect(() => {
    setMenuTabs(getMenuTabs())
  }, [])

  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            BEVOH
            {/* <img src={logo} draggable={false} className="h-8 mx-auto select-none" alt='BaNe' /> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center gap-20 hidden md:flex">
            {menuTabs.map((item) => (
              <>
                {item.name == "Profile" ?
                  <Link key={item.name} to={item.href}>
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2">
                      <img src={profilepic} alt="User avatar" className="object-cover" />
                    </div>
                  </Link>
                  :
                  <Link key={item.name} to={item.href} className={`nav-link ${isActive(item.href) ? 'active' : ''}`}>
                    {item.name}
                  </Link>
                }
              </>
            ))}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-foreground/60 hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer + Overlay */}
        {/* Wrapper che resta montato per animazioni */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
          aria-hidden={!isMobileMenuOpen}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background border-l border-border/50 shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/50">
              <span className="text-sm tracking-wide text-foreground/70">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex items-center justify-center rounded-xl p-2 text-foreground/90 hover:text-primary hover:bg-foreground/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Links */}
            <div className="px-5 py-4 m-1 bg-black rounded-xl">
              <div className="flex flex-col gap-2">
                {menuTabs.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <>
                      {item.name == "Profile" ?
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={[
                            'relative flex items-center gap-3 rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors',
                            active
                              ? 'ring-2 ring-white/20'
                              : 'hover:bg-black',
                          ].join(' ')}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden ring-2">
                            <img src={profilepic} alt="User avatar" className="w-full h-full object-cover" />
                          </div>
                          <span>{item.name}</span>

                          {active && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />
                          )}
                        </Link>
                        :
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={[
                            'relative rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors',
                            active
                              ? 'ring-2 ring-white/20'
                              : 'hover:bg-black',
                          ].join(' ')}
                        >
                          {item.name}
                          {active && <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />}
                        </Link>
                      }
                    </>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;