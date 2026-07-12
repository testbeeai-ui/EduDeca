"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/useAppStore";

const phoneSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(60, "Name is too long"),
  phone: z
    .string()
    .min(10, "Enter a valid 10-digit mobile number")
    .max(10, "Enter a valid 10-digit mobile number")
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(4, "Enter the 4-digit OTP")
    .regex(/^\d{4}$/, "OTP must be 4 digits"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

interface PhoneOtpFormProps {
  title: string;
  description: string;
}

function formatPhone(phone: string) {
  return `${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export function PhoneOtpForm({ title, description }: PhoneOtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useAppStore((s) => s.signIn);
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [otpHint, setOtpHint] = useState("1234");
  const [isSending, setIsSending] = useState(false);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { name: "", phone: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const sendOtp = async (name: string, phone: string) => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setUserName(name.trim());
    setPhoneNumber(phone);
    setOtpHint("1234");
    setPhase("otp");
    setIsSending(false);
  };

  const onPhoneSubmit = phoneForm.handleSubmit(async (data) => {
    await sendOtp(data.name, data.phone);
  });

  const onOtpSubmit = otpForm.handleSubmit(async (data) => {
    if (data.otp !== otpHint) {
      otpForm.setError("otp", { message: "Invalid OTP. Please try again." });
      return;
    }
    signIn(userName, phoneNumber);
    const redirectPath = searchParams.get("redirect") || "/home";
    router.replace(redirectPath);
  });

  if (phase === "otp") {
    return (
      <form onSubmit={onOtpSubmit} className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Verify OTP</h2>
          <p className="text-muted-foreground">
            Enter the code sent to <span className="text-foreground">+91 {formatPhone(phoneNumber)}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">One-time password</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="••••"
            className="h-14 text-center text-2xl tracking-[0.4em]"
            {...otpForm.register("otp")}
          />
          {otpForm.formState.errors.otp && (
            <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-14 w-full rounded-2xl text-base"
          disabled={otpForm.formState.isSubmitting}
        >
          Verify & Enter
        </Button>

        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setPhase("phone");
              otpForm.reset();
            }}
          >
            <ArrowLeft className="size-3.5" />
            Change number
          </button>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => void sendOtp(userName, phoneNumber)}
            disabled={isSending}
          >
            Resend OTP
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={onPhoneSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Aarav Mehta"
          className="h-12 rounded-2xl"
          {...phoneForm.register("name")}
        />
        {phoneForm.formState.errors.name && (
          <p className="text-sm text-destructive">{phoneForm.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Mobile number</Label>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-input/50 px-4">
          <span className="shrink-0 text-sm font-medium text-muted-foreground">IN +91</span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98765 43210"
            className="border-0 bg-transparent px-0 focus-visible:ring-0"
            {...phoneForm.register("phone")}
          />
        </div>
        {phoneForm.formState.errors.phone && (
          <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full rounded-2xl text-base"
        disabled={isSending || phoneForm.formState.isSubmitting}
      >
        {isSending ? "Sending OTP…" : "Send OTP & Enter"}
      </Button>
    </form>
  );
}
