import { auth, signIn } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, TrendingUp, BarChart3, Shield, Zap } from "lucide-react";
import { redirect } from "next/navigation";

const SignIn = async () => {
  const session = await auth();
  if (session && session.user && session.user.email) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Trading Platform
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Professional trading tools at your fingertips
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-Time Charts</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced charting tools with live market data and technical
                  indicators
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Execution</h3>
                <p className="text-sm text-muted-foreground">
                  Lightning-fast order execution with minimal slippage
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure & Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Bank-level security with encrypted connections and data
                  protection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl border-2">
            <CardHeader className="space-y-3 text-center pb-6">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your trading account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  "use server";
                  await signIn("resend", formData);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      required
                      className="flex h-12 w-full rounded-lg border border-input bg-background pl-11 pr-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We{"'"}ll send you a magic link to sign in securely
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Mail className="h-5 w-5" />
                  <span>Sign In with Email</span>
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  By signing in, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Branding */}
        <div className="md:hidden text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Trading Platform</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Professional trading tools at your fingertips
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
