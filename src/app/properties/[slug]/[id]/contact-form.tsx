"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Phone, Mail, Calendar } from "lucide-react"

interface ContactFormProps {
  propertyId: string
  proertyData: any
}

export default function ContactForm({ propertyId, proertyData }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const message = formData.get('message') as string
    const propertyData = proertyData

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, message, propertyData })
      })

      if (!response.ok) {
        throw new Error('Failed to submit form')
      }

      const data = await response.json()
      if (data.status === 'success') {
        setIsSubmitted(true)
      } else {
        throw new Error(data.error || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <h3 className="font-semibold text-green-600 mb-2">Thank You!</h3>
        <p className="text-sm text-muted-foreground">Your message has been sent. The agent will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="I'm interested in this property..."
            className="resize-none"
            rows={4}
            defaultValue={`I'm interested in this property (ID: ${propertyId}). Please contact me with more information.`}
            required
          />
        </div>
        <div className="flex items-start space-x-2">
          <Checkbox id="consent" />
          <Label htmlFor="consent" className="text-sm font-normal">
            I consent to being contacted about real estate opportunities.
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Message"}
      </Button>

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
          <Button variant="link" className="h-auto p-0 text-sm">
            Schedule a Tour
          </Button>
        </div>
      </div>
    </form>
  )
}
