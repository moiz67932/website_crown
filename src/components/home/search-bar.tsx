import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "../ui/input";
import { Search } from "lucide-react";

const SearchBar = () => {
    const propertyTypes = ["Apartment", "House", "Villa"];
    const priceRanges = [
      { value: "under-500", label: "Under $500k" },
      { value: "500-1000", label: "$500k - $1M" },
      { value: "above-1000", label: "Above $1M" }
    ];
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-4 bg-white rounded-md p-4 max-w-4xl mx-auto">
    <Input placeholder="Enter location" className="w-full md:w-1/2" />
    <Select>
      <SelectTrigger className="w-full md:w-1/6">
        <SelectValue placeholder="Property Type" />
      </SelectTrigger>
      <SelectContent>
        {propertyTypes.map(type => (
          <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Select>
      <SelectTrigger className="w-full md:w-1/6">
        <SelectValue placeholder="Price Range" />
      </SelectTrigger>
      <SelectContent>
        {priceRanges.map(range => (
          <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    <Button className="w-full md:w-auto"><Search className="mr-2 h-4 w-4" /> Search</Button>
  </div>
  );
};

export default SearchBar;