import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'text-white'
        : 'text-neutral-400 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          VideoPlayer
        </Link>
        <nav className="flex gap-6">
          <Link to="/" className={linkClass('/')}>Home</Link>
          <Link to="/cms" className={linkClass('/cms')}>CMS</Link>
        </nav>
      </div>
    </header>
  );
}
