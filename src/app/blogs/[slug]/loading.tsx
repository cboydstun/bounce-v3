export default function Loading() {
  return (
    <div className="w-full bg-secondary-blue/5 py-12">
      <div className="container mx-auto px-4">
        <article className="bg-white rounded-xl shadow-lg p-8 mb-12 animate-pulse">
          <div className="w-full h-[400px] bg-gray-200 rounded-xl mb-8" />
          
          <div className="space-y-4 mb-8">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
            <div className="h-10 w-3/4 bg-gray-200 rounded-lg" />
            <div className="flex justify-between">
              <div className="flex gap-4">
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                <div className="h-6 w-24 bg-gray-200 rounded-full" />
              </div>
              <div className="flex gap-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full" />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg" />
              ))}
            </div>

            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full" />
              ))}
            </div>

            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full" />
              ))}
            </div>

            <div className="border-t pt-6">
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 w-16 bg-gray-200 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
