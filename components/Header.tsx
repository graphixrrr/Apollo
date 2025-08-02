export function Header() {
  return (
    <header className="gradient-bg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold">Apollo AI Replica</h1>
            </div>
          </div>
          
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="text-white hover:text-apollo-100 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </a>
              <a href="#" className="text-apollo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Contacts
              </a>
              <a href="#" className="text-apollo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                About
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
} 