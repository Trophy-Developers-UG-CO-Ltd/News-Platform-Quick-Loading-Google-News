import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().regex(/^\+\d{1,3}\s?\d{6,14}$/, "Invalid phone format. Use: +XXX XXXXXXXXX"),
  email: z.string().email("Invalid email address"),
  // companyName removed
  accountType: z.enum(["advertising", "personal", "media", "agency", "other"], {
    errorMap: () => ({ message: "Please select account type" }),
  }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept Terms & Conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          // companyName removed
          accountType: data.accountType,
          password: data.password,
          accountType: data.companyType === "advertising" ? "advertiser" : "personal",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      // Redirect to login or dashboard
      window.location.href = "/dashboard?registered=true";
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>
      <p className="text-sm text-gray-600 text-center mb-6">
        Advertising / Personal Account — MukonoTalks Publishing Platform
      </p>

      {serverError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="John Doe"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.fullName ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            placeholder="+256 123 456 789"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.phone ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">Format: +XXX XXXXXXXXX</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="you@gmail.com"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.email ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Company Name removed */}

        {/* Account Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.accountType ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("accountType")}
          >
            <option value="">Select type (Advertising/Personal/Media/Agency/Other)</option>
            <option value="advertising">Advertising Agency (Advertiser Account)</option>
            <option value="personal">Personal / Individual (Personal Account)</option>
            <option value="media">Media / Publishing (Personal Account)</option>
            <option value="agency">PR / Marketing Agency (Personal Account)</option>
            <option value="other">Other (Personal Account)</option>
          </select>
          {errors.accountType && (
            <p className="text-red-500 text-xs mt-1">{errors.accountType.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Min 8 characters"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.password ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
          <p className="text-gray-400 text-xs mt-1">Use at least 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            placeholder="Repeat password"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.confirmPassword ? "border-red-500 focus:ring-red-200 animate-shake" : "border-gray-300 focus:ring-blue-200"
            }`}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            {...register("termsAccepted")}
          />
          <label className="text-sm">
            I have read and agree to the{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms & Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
            <span className="text-red-500">*</span>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-red-500 text-xs mt-1">{errors.termsAccepted.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full py-2 px-4 rounded-[2px] font-medium transition bg-black text-white dark:bg-white dark:text-black cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}
