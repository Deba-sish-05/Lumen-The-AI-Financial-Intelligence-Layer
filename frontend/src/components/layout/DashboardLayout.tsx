import { ReactNode } from "react";
import { 
  LayoutDashboard, 
  Receipt, 
  Plus, 
  CreditCard, 
  FileCheck,
  FileText,
  User,
  LogOut 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Past Transactions", href: "/bills", icon: Receipt },
  { name: "Add Bill", href: "/add-bill", icon: Plus },
  { name: "Add Transaction", href: "/add-transaction", icon: CreditCard },
  { name: "GST Checker", href: "/gst-checker", icon: FileCheck },
  { name: "File ITR", href: "/itr-filing", icon: FileText },
  { name: "Profile", href: "/profile", icon: User },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 bg-card border-r border-border fixed h-full">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-info-blue flex items-center justify-center">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="h-10 w-10 rounded-lg object-cover"
            />
            </div>
            <div>
              <h2 className="font-bold text-lg">LUMEN</h2>
              <p className="text-xs text-muted-foreground">AI Financial Intelligence</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground/70 hover:bg-muted transition-colors"
                activeClassName="bg-primary text-primary-foreground hover:bg-primary"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
          
          <div className="absolute bottom-6 left-6 right-6">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3"
              onClick={() => window.location.href = "/"}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="text-sm text-muted-foreground">
                Your financial insights powered by LUMEN AI
              </p>
            </div>
            <Avatar 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/profile")}
            >
              <AvatarFallback className="bg-primary text-primary-foreground">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
