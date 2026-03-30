import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
