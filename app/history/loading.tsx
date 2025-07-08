import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/AppLayout"

export default function HistoryLoading() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="skeleton h-8 w-64" />
            <div className="skeleton h-4 w-48" />
          </div>
          <div className="skeleton h-10 w-32" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardHeader>
            <div className="skeleton h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton h-4 w-16" />
                  <div className="skeleton h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List Skeleton */}
        <Card>
          <CardHeader>
            <div className="skeleton h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" text="Loading transaction history..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
