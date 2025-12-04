"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface FiltersProps {
  currentFilters: {
    city?: string;
    county?: string;
    minPrice?: string;
    maxPrice?: string;
    beds?: string;
    baths?: string;
    propertyType?: string;
    status?: string;
    sortBy?: string;
  };
}

export default function PropertiesFilterClient({ currentFilters }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (key: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();

    Object.entries(localFilters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "Any") {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearFilters = () => {
    setLocalFilters({});
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Object.values(localFilters).some(
    (v) => v && v !== "all" && v !== "Any"
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 mb-8 shadow-md border border-neutral-200 dark:border-slate-700">
      {/* Quick Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {/* City Search */}
        <div className="relative">
          <Input
            placeholder="City..."
            value={localFilters.city || ""}
            onChange={(e) => updateFilters("city", e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        </div>

        {/* Property Type */}
        <Select
          value={localFilters.propertyType || "all"}
          onValueChange={(value) => updateFilters("propertyType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Residential">Residential</SelectItem>
            <SelectItem value="ResidentialLease">For Rent</SelectItem>
            <SelectItem value="Land">Land</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>

        {/* Bedrooms */}
        <Select
          value={localFilters.beds || "Any"}
          onValueChange={(value) => updateFilters("beds", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Beds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any">Any Beds</SelectItem>
            <SelectItem value="1+">1+</SelectItem>
            <SelectItem value="2+">2+</SelectItem>
            <SelectItem value="3+">3+</SelectItem>
            <SelectItem value="4+">4+</SelectItem>
            <SelectItem value="5+">5+</SelectItem>
          </SelectContent>
        </Select>

        {/* Bathrooms */}
        <Select
          value={localFilters.baths || "Any"}
          onValueChange={(value) => updateFilters("baths", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Baths" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Any">Any Baths</SelectItem>
            <SelectItem value="1+">1+</SelectItem>
            <SelectItem value="2+">2+</SelectItem>
            <SelectItem value="3+">3+</SelectItem>
            <SelectItem value="4+">4+</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={localFilters.sortBy || "recommended"}
          onValueChange={(value) => updateFilters("sortBy", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recommended">Recommended</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="area-desc">Largest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-primary-600 dark:text-primary-400"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showAdvanced ? "Hide" : "Show"} Advanced Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-neutral-200 dark:border-slate-700">
          <Input
            placeholder="Min Price"
            type="number"
            value={localFilters.minPrice || ""}
            onChange={(e) => updateFilters("minPrice", e.target.value)}
          />
          <Input
            placeholder="Max Price"
            type="number"
            value={localFilters.maxPrice || ""}
            onChange={(e) => updateFilters("maxPrice", e.target.value)}
          />
          <Input
            placeholder="County"
            value={localFilters.county || ""}
            onChange={(e) => updateFilters("county", e.target.value)}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={applyFilters}
          disabled={isPending}
          className="flex-1 md:flex-none"
        >
          {isPending ? "Applying..." : "Apply Filters"}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(localFilters).map(([key, value]) => {
            if (!value || value === "all" || value === "Any") return null;

            return (
              <div
                key={key}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
              >
                <span className="font-medium capitalize">{key}:</span>
                <span>{value}</span>
                <button
                  onClick={() => updateFilters(key, "")}
                  className="hover:text-primary-900 dark:hover:text-primary-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
