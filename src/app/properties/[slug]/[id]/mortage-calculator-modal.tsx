"use client"

import { useState, useEffect } from "react"
import { Calculator, DollarSign, Percent, Calendar, PieChart, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface MortgageCalculatorModalProps {
  propertyPrice: number
  propertyTaxRate?: number
  insuranceRate?: number
  hoaFees?: number
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  buttonText?: string
  buttonClassName?: string
}

export default function MortgageCalculatorModal({
  propertyPrice,
  propertyTaxRate = 0.0125, // Default 1.25%
  insuranceRate = 0.0035, // Default 0.35%
  hoaFees = 0, // Default $0/month
  buttonVariant = "default",
  buttonText = "Calculate Mortgage",
  buttonClassName = "w-full",
}: MortgageCalculatorModalProps) {
  // State for user inputs
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [loanTerm, setLoanTerm] = useState(30)
  const [interestRate, setInterestRate] = useState(6.5)
  const [showAmortization, setShowAmortization] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("monthly")

  // Calculated values
  const [downPayment, setDownPayment] = useState(propertyPrice * 0.2)
  const [loanAmount, setLoanAmount] = useState(propertyPrice * 0.8)
  const [monthlyPrincipalInterest, setMonthlyPrincipalInterest] = useState(0)
  const [monthlyPropertyTax, setMonthlyPropertyTax] = useState(0)
  const [monthlyInsurance, setMonthlyInsurance] = useState(0)
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0)
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([])

  // Total cost calculations
  const [totalPrincipal, setTotalPrincipal] = useState(loanAmount)
  const [totalInterest, setTotalInterest] = useState(0)
  const [totalPropertyTax, setTotalPropertyTax] = useState(0)
  const [totalInsurance, setTotalInsurance] = useState(0)
  const [totalHOA, setTotalHOA] = useState(0)
  const [totalCost, setTotalCost] = useState(0)

  // Calculate mortgage details when inputs change
  useEffect(() => {
    // Update down payment and loan amount when percentage changes
    const newDownPayment = (propertyPrice * downPaymentPercent) / 100
    const newLoanAmount = propertyPrice - newDownPayment
    setDownPayment(newDownPayment)
    setLoanAmount(newLoanAmount)

    // Calculate monthly principal and interest payment
    const monthlyRate = interestRate / 100 / 12
    const numberOfPayments = loanTerm * 12
    const monthlyPI =
      (newLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    setMonthlyPrincipalInterest(monthlyPI)

    // Calculate property tax and insurance
    const monthlyTax = (propertyPrice * propertyTaxRate) / 12
    const monthlyIns = (propertyPrice * insuranceRate) / 12

    setMonthlyPropertyTax(monthlyTax)
    setMonthlyInsurance(monthlyIns)

    // Calculate total monthly payment (PITI + HOA)
    const total = monthlyPI + monthlyTax + monthlyIns + hoaFees
    setTotalMonthlyPayment(total)

    // Calculate total costs over the life of the loan
    const totalInterestCost = monthlyPI * numberOfPayments - newLoanAmount
    const totalTaxCost = monthlyTax * numberOfPayments
    const totalInsuranceCost = monthlyIns * numberOfPayments
    const totalHOACost = hoaFees * numberOfPayments
    const totalLoanCost = newLoanAmount + totalInterestCost + totalTaxCost + totalInsuranceCost + totalHOACost

    setTotalInterest(totalInterestCost)
    setTotalPropertyTax(totalTaxCost)
    setTotalInsurance(totalInsuranceCost)
    setTotalHOA(totalHOACost)
    setTotalCost(totalLoanCost)

    // Generate amortization schedule (first 5 years)
    if (showAmortization && isOpen) {
      generateAmortizationSchedule(newLoanAmount, monthlyRate, monthlyPI, numberOfPayments)
    }
  }, [
    propertyPrice,
    downPaymentPercent,
    loanTerm,
    interestRate,
    propertyTaxRate,
    insuranceRate,
    hoaFees,
    showAmortization,
    isOpen,
  ])

  // Generate amortization schedule
  const generateAmortizationSchedule = (
    loan: number,
    monthlyRate: number,
    monthlyPayment: number,
    totalPayments: number,
  ) => {
    let balance = loan
    const schedule = []

    // Only show first 5 years (60 months) for performance
    const paymentsToShow = Math.min(60, totalPayments)

    for (let i = 1; i <= paymentsToShow; i++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment

      schedule.push({
        payment: i,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        balance: balance > 0 ? balance : 0,
      })
    }

    setAmortizationSchedule(schedule)
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClassName}>
          <Calculator className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Mortgage Calculator
            </DialogTitle>
            <Tabs defaultValue="monthly" value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="total">Total Cost</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DialogDescription>Estimate your monthly mortgage payments for this property</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Home Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Home Price</span>
              </div>
              <span className="font-semibold">{formatCurrency(propertyPrice)}</span>
            </div>
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Down Payment</span>
              </div>
              <span className="font-semibold">
                {downPaymentPercent}% ({formatCurrency(downPayment)})
              </span>
            </div>
            <Slider
              value={[downPaymentPercent]}
              min={5}
              max={50}
              step={1}
              onValueChange={(value) => setDownPaymentPercent(value[0])}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span>
              <span>20%</span>
              <span>35%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Loan Term</span>
              </div>
              <Select value={loanTerm.toString()} onValueChange={(value) => setLoanTerm(Number.parseInt(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Interest Rate</span>
              </div>
              <span className="font-semibold">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              min={2}
              max={10}
              step={0.125}
              onValueChange={(value) => setInterestRate(value[0])}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2%</span>
              <span>4%</span>
              <span>6%</span>
              <span>8%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Loan Amount */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Loan Amount</span>
              <span className="font-semibold">{formatCurrency(loanAmount)}</span>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "monthly" ? (
            <>
              {/* Monthly Payment Breakdown - Already exists */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Payment Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                      <span className="text-sm">Principal & Interest</span>
                    </div>
                    <span className="font-medium">{formatCurrency(monthlyPrincipalInterest)}/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                      <span className="text-sm">Property Taxes</span>
                    </div>
                    <span className="font-medium">{formatCurrency(monthlyPropertyTax)}/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      <span className="text-sm">Home Insurance</span>
                    </div>
                    <span className="font-medium">{formatCurrency(monthlyInsurance)}/mo</span>
                  </div>
                  {hoaFees > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-400"></div>
                        <span className="text-sm">HOA Fees</span>
                      </div>
                      <span className="font-medium">{formatCurrency(hoaFees)}/mo</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Payment</span>
                    <span className="font-bold text-lg">{formatCurrency(totalMonthlyPayment)}/mo</span>
                  </div>
                </div>
              </div>

              {/* Visual Payment Breakdown - Already exists */}
              <div>
                <h4 className="text-sm font-medium mb-2">Payment Distribution</h4>
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary"
                    style={{ width: `${(monthlyPrincipalInterest / totalMonthlyPayment) * 100}%` }}
                  ></div>
                  <div
                    className="bg-blue-400"
                    style={{ width: `${(monthlyPropertyTax / totalMonthlyPayment) * 100}%` }}
                  ></div>
                  <div
                    className="bg-green-400"
                    style={{ width: `${(monthlyInsurance / totalMonthlyPayment) * 100}%` }}
                  ></div>
                  {hoaFees > 0 && (
                    <div className="bg-orange-400" style={{ width: `${(hoaFees / totalMonthlyPayment) * 100}%` }}></div>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>P&I</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                    <span>Taxes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    <span>Insurance</span>
                  </div>
                  {hoaFees > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                      <span>HOA</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Total Cost Breakdown */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Total Cost Breakdown ({loanTerm} years)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary"></div>
                      <span className="text-sm">Principal (Loan Amount)</span>
                    </div>
                    <span className="font-medium">{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <span className="text-sm">Interest</span>
                    </div>
                    <span className="font-medium">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                      <span className="text-sm">Property Taxes</span>
                    </div>
                    <span className="font-medium">{formatCurrency(totalPropertyTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                      <span className="text-sm">Home Insurance</span>
                    </div>
                    <span className="font-medium">{formatCurrency(totalInsurance)}</span>
                  </div>
                  {hoaFees > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-orange-400"></div>
                        <span className="text-sm">HOA Fees</span>
                      </div>
                      <span className="font-medium">{formatCurrency(totalHOA)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Cost</span>
                    <span className="font-bold text-lg">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Visual Total Cost Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-2">Cost Distribution</h4>
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  <div className="bg-primary" style={{ width: `${(loanAmount / totalCost) * 100}%` }}></div>
                  <div className="bg-red-400" style={{ width: `${(totalInterest / totalCost) * 100}%` }}></div>
                  <div className="bg-blue-400" style={{ width: `${(totalPropertyTax / totalCost) * 100}%` }}></div>
                  <div className="bg-green-400" style={{ width: `${(totalInsurance / totalCost) * 100}%` }}></div>
                  {hoaFees > 0 && (
                    <div className="bg-orange-400" style={{ width: `${(totalHOA / totalCost) * 100}%` }}></div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Principal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    <span>Interest</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                    <span>Taxes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                    <span>Insurance</span>
                  </div>
                  {hoaFees > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-400"></div>
                      <span>HOA</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional insights */}
              <div className="mt-4 p-4 border border-muted rounded-lg">
                <h4 className="font-medium mb-2">Cost Insights</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      You'll pay <span className="font-semibold">{formatCurrency(totalInterest)}</span> in interest over
                      the life of this loan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      That's <span className="font-semibold">{Math.round((totalInterest / loanAmount) * 100)}%</span> of
                      your loan amount.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      Your total cost is{" "}
                      <span className="font-semibold">{Math.round((totalCost / propertyPrice) * 100)}%</span> of the
                      property price.
                    </span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Amortization Schedule Toggle */}
          <div className="flex-col">
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              onClick={() => setShowAmortization(!showAmortization)}
            >
              <span>Amortization Schedule</span>
              {showAmortization ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {/* Amortization Table */}
            {showAmortization && amortizationSchedule.length > 0 && (
              <div className="w-full mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-right py-2">Principal</th>
                      <th className="text-right py-2">Interest</th>
                      <th className="text-right py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.map((payment, index) => (
                      <tr key={index} className="border-b border-muted">
                        <td className="py-2">{payment.payment}</td>
                        <td className="text-right py-2">{formatCurrency(payment.principalPayment)}</td>
                        <td className="text-right py-2">{formatCurrency(payment.interestPayment)}</td>
                        <td className="text-right py-2">{formatCurrency(payment.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loanTerm * 12 > 60 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing first 5 years of payments. Full schedule has {loanTerm * 12} payments.
                  </p>
                )}
              </div>
            )}

            <div className="w-full mt-4">
              <Button className="w-full">Get Pre-Approved</Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              This calculator provides estimates only. Contact a mortgage professional for accurate rates and terms.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
