import { Star } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"

const CustomerReview = () => {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 hide-scrollbar">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-4 md:p-8 relative">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 text-slate-200 dark:text-slate-600">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:w-[60px] md:h-[60px]"
                >
                  <path
                    d="M11.3 6.2H16.7L13.2 12.8V17.8H18.8V12.8H16.7L20.2 6.2V2.4H11.3V6.2ZM2.8 6.2H8.2L4.7 12.8V17.8H10.3V12.8H8.2L11.7 6.2V2.4H2.8V6.2Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="relative h-10 w-10 md:h-14 md:w-14 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-base md:text-lg text-slate-900 dark:text-neutral-100">{testimonial.name}</h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

              <blockquote className="text-gray-600 dark:text-neutral-300 italic mb-6 leading-relaxed">"{testimonial.text.substring(0,300)}..."</blockquote>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CustomerReview

const testimonials = [
  {
    name: "Jacob Oenter",
    avatar: "/client/client1.jpeg",
    text: "Recently sold my home, and I couldn’t be more grateful for the outstanding work my real estate agent did throughout the entire process. From our first meeting to closing day, they were professional, knowledgeable, and truly dedicated to getting the best outcome for me. They provided expert advice on pricing, staging, and marketing, and their strategy brought in strong interest right away. Communication was consistent and clear, and I always felt like I was in good hands. They went above and beyond, handling every detail with care and making what could have been a stressful process feel smooth and manageable. Thanks to their expertise and hard work, my home sold quickly and at a great price. I highly recommend Reza Barghlameno to anyone looking to buy or sell a home—you won’t be disappointed!",
  },
  {
    name: "Maxim Gantman",
    avatar: "/client/client2.jpeg",
    text: "I have met many realtors in my day but there’s no one I could ever trust like Reza. His passion for real estate & the extra mile he goes at every step is something truly rare. During every interaction we had with Reza he genuinely listened to our needs & concerns. He was always prepared with solutions to any challenges. I wholeheartedly recommend Reza to anyone looking for an exceptional service.",
  },
  {
    name: "Jill Conaty",
    avatar: "/client/client4.jpeg",
    text: "I have met many realtors in my day but there’s no one I could ever trust like Reza. His passion for real estate & the extra mile he goes at every step is something truly rare. During every interaction we had with Reza he genuinely listened to our needs & concerns. He was always prepared with solutions to any challenges. I wholeheartedly recommend Reza to anyone looking for an exceptional service.",
  },
  // {
  //   name: "Jacob Oenter",
  //   avatar: "/client/client1.jpeg",
  //   text: "Recently sold my home, and I couldn’t be more grateful for the outstanding work my real estate agent did throughout the entire process. From our first meeting to closing day, they were professional, knowledgeable, and truly dedicated to getting the best outcome for me. They provided expert advice on pricing, staging, and marketing, and their strategy brought in strong interest right away. Communication was consistent and clear, and I always felt like I was in good hands. They went above and beyond, handling every detail with care and making what could have been a stressful process feel smooth and manageable. Thanks to their expertise and hard work, my home sold quickly and at a great price. I highly recommend Reza Barghlameno to anyone looking to buy or sell a home—you won’t be disappointed!",
  // },
  // {
  //   name: "Maxim Gantman",
  //   avatar: "/client/client2.jpeg",
  //   text: "I have met many realtors in my day but there’s no one I could ever trust like Reza. His passion for real estate & the extra mile he goes at every step is something truly rare. During every interaction we had with Reza he genuinely listened to our needs & concerns. He was always prepared with solutions to any challenges. I wholeheartedly recommend Reza to anyone looking for an exceptional service.",
  // },
  // {
  //   name: "Jill Conaty",
  //   avatar: "/client/client4.jpeg",
  //   text: "I have met many realtors in my day but there’s no one I could ever trust like Reza. His passion for real estate & the extra mile he goes at every step is something truly rare. During every interaction we had with Reza he genuinely listened to our needs & concerns. He was always prepared with solutions to any challenges. I wholeheartedly recommend Reza to anyone looking for an exceptional service.",
  // },
]