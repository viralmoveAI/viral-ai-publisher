"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth.schema";
import { resetPassword } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(data);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot password error", err);
      // Map Firebase errors to user friendly messages
      switch (err.code) {
        case "auth/user-not-found":
          setError("No user found with this email address.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        default:
          setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-[#13131A] border-[#1E1E2D] shadow-2xl relative overflow-hidden group">
      {/* Top glowing gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
      
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Reset password
        </CardTitle>
        <CardDescription className="text-center text-slate-400">
          We'll send you an email with instructions to reset your password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-lg text-center">
              <CheckCircle className="size-8" />
              <h3 className="font-semibold text-lg">Check your inbox</h3>
              <p className="text-sm text-slate-300">
                We have sent a password reset link to your email address. Please follow the instructions in the email.
              </p>
            </div>
            
            <Button
              asChild
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 px-4 rounded-md transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] cursor-pointer"
            >
              <Link href="/login">Back to Sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register("email")}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 px-4 rounded-md transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] flex items-center justify-center gap-2 mt-6 cursor-pointer"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send recovery link"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2 text-center pb-6">
        {!success && (
          <div className="text-sm text-slate-400">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
