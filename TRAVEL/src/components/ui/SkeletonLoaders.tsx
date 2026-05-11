"use client";

export default function SkeletonTripCard() {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-6 space-y-4">
        <div className="h-4 bg-gray-100 rounded-full w-3/4" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-100 rounded-full w-1/4" />
          <div className="h-8 bg-gray-100 rounded-full w-1/3" />
        </div>
      </div>
    </div>
  );
}
