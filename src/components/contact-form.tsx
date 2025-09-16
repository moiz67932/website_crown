"use client";

import type React from "react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ContactFormProps {
  propertyId: string;
  proertyData: any; // typo kept for compatibility with current props
  city?: string;
  state?: string;
  county?: string;
}

export default function ContactForm({
  propertyId,
  proertyData,
  city,
  state,
  county,
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef<number>(Date.now()); // anti-bot timer

  const defaults = {
    city: city ?? proertyData?.city ?? "",
    state: state ?? proertyData?.state ?? "CA",
    county: county ?? proertyData?.county ?? "",
  };

  // helpful tags for CRM routing
  const tags = useMemo(() => {
    const t: string[] = ["pdp"]; // product detail page
    if (proertyData?.property_type) {
      t.push(String(proertyData.property_type).toLowerCase());
    }
    t.push(`prop:${propertyId}`);
    return t;
  }, [proertyData, propertyId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    // anti-spam: required hidden honeypot + time on page
    const msOnPage = Date.now() - startRef.current;
    fd.set("__top", String(msOnPage));
    if (!fd.has("company")) fd.set("company", ""); // honeypot must exist & be empty

    const name = (fd.get("name") as string) || "";
    const email = (fd.get("email") as string) || "";
    const phone = (fd.get("phone") as string) || "";
    const message =
      (fd.get("message") as string) ||
      `I'm interested in this property (ID: ${propertyId}). Please contact me with more information.`;

    const payload: any = {
      // LeadPayload names used by /api/leads
      firstName: name.split(" ")[0] ?? "",
      lastName: name.split(" ").slice(1).join(" ") || "",
      fullName: name || undefined,
      email,
      phone,
      message,
      city: (fd.get("city") as string) || defaults.city,
      state: (fd.get("state") as string) || defaults.state,
      county: (fd.get("county") as string) || defaults.county,
      budgetMax: fd.get("budgetMax") ? Number(fd.get("budgetMax")) : undefined,
      timeframe: (fd.get("timeframe") as string) || "30d",
      wantsTour: fd.get("wantsTour") === "on",
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
      tags,
      // anti-spam passthroughs read by the API
      __top: msOnPage,
      company: fd.get("company"),
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to submit form");
      setIsSubmitted(true);

      // Fire-and-handle email notification in parallel to keep Lofty integration intact.
      try {
        const emailRes = await fetch('/api/send-lead-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const emailJson = await emailRes.json().catch(() => ({}));
        if (!emailRes.ok) {
          // don't block user, but surface a friendly error for admins
          setError(`Email failed to send: ${emailJson?.error || emailRes.statusText}`);
        }
      } catch (emailErr: any) {
        setError(`Email failed to send: ${emailErr?.message || String(emailErr)}`);
      }
    } catch (err: any) {
      setError(err?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold text-green-600 mb-2">Thank you!</h3>
        <p className="text-sm text-muted-foreground">
          Your message has been sent. The agent will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* honeypot for bots (must remain empty) */}
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="name">Your Name</Label>
          <Input id="name" name="name" placeholder="John Doe" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="john@example.com" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" placeholder="(123) 456-7890" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={defaults.city} />
          </div>
            <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={defaults.state} />
          </div>
          <div>
            <Label htmlFor="county">County</Label>
            <Input id="county" name="county" defaultValue={defaults.county} />
          </div>
        </div>

        <div>
          <Label htmlFor="budgetMax">Budget max</Label>
          <Input id="budgetMax" name="budgetMax" placeholder="750000" inputMode="numeric" />
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            className="resize-none"
            rows={4}
            defaultValue={`I'm interested in this property (ID: ${propertyId}). Please contact me with more information.`}
            required
          />
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox id="wantsTour" name="wantsTour" />
          <Label htmlFor="wantsTour" className="text-sm font-normal">
            I want to schedule a tour
          </Label>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox id="consent" required />
          <Label htmlFor="consent" className="text-sm font-normal">
            I consent to being contacted about real estate opportunities.
          </Label>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <Button
        type="submit"
        className="w-full cursor-pointer bg-brand-sunsetBlush hover:bg-brand-sunsetBlush/90 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>

      <div className="flex items-center gap-2">
        <Avatar className="w-25 h-25">
          <AvatarImage src={"/agent.jpg"} />
          <AvatarFallback>Reza Barghlameno</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">Reza Barghlameno</h3>
          <p className="text-sm text-muted-foreground">eXp of California</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        <div className="flex items-center text-sm">
          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Call: 1 858-305-4362</span>
        </div>
        <div className="flex items-center text-sm">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>Email: reza@crowncoastal.com</span>
        </div>
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <Button variant="link" className="h-auto p-0 text-sm cursor-pointer">
            Schedule a Tour
          </Button>
        </div>
      </div>
    </form>
  );
}
