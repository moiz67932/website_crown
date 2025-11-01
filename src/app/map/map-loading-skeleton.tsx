import { Skeleton } from "../../components/ui/skeleton"
import { MapPin } from "lucide-react"

export default function MapLoadingSkeleton() {
  return (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-sm">
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
          <MapPin className="h-8 w-8 text-slate-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-300 rounded-full animate-ping"></div>
        </div>
        <Skeleton className="h-6 w-48 mx-auto mb-2 bg-slate-200" />
        <Skeleton className="h-4 w-32 mx-auto bg-slate-200" />

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Skeleton className="h-2 w-full bg-slate-200" />
          <Skeleton className="h-2 w-full bg-slate-200" />
          <Skeleton className="h-2 w-full bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
