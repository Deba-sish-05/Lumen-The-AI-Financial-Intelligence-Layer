import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import api from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const [login, setLogin] = useState({
    email: "",
    password: "",
  });

  const [signup, setSignup] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  // -------------------------------
  // LOGIN
  // -------------------------------
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email: login.email,
        password: login.password,
      });

      localStorage.setItem("access_token", res.data.access);

      toast.success("Logged in successfully!", {
        position: "bottom-right",
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid email or password", {
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------
  // SIGNUP
  // -------------------------------
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post("/auth/signup", {
        first_name: signup.first_name,
        last_name: signup.last_name,
        email: signup.email,
        phone_number: signup.phone,
        password: signup.password,
      });

      toast.success("Signup successful! You can now log in.", {
        position: "bottom-right",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Signup failed", {
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-info-blue to-insight-purple p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info-blue mb-4">
            <img src="/favicon.ico" alt="Logo" className="h-16 w-16 object-cover rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Project LUMEN</h1>
          <p className="text-muted-foreground">AI Financial Intelligence Layer</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-info-blue"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  type="text"
                  required
                  value={signup.first_name}
                  onChange={(e) => setSignup({ ...signup, first_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  type="text"
                  required
                  value={signup.last_name}
                  onChange={(e) => setSignup({ ...signup, last_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={signup.email}
                  onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  required
                  value={signup.phone}
                  onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  value={signup.password}
                  onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal to-success-green"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
