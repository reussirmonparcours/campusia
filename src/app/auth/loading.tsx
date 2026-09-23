import * as React from "react";
import { Container } from "@/components/layout/container";

export default function AuthLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 sm:py-12 bg-bg-base">
      <Container size="xl">
        <div className="mx-auto max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column Skeleton (Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-6 pr-4 animate-pulse">
            <div className="h-12 w-40 bg-slate-200 rounded-md" />
            <div className="space-y-3">
              <div className="h-4 w-28 bg-slate-200 rounded-full" />
              <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-5/6 bg-slate-200 rounded" />
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-14 w-full bg-slate-200 rounded-xl" />
              <div className="h-14 w-full bg-slate-200 rounded-xl" />
              <div className="h-14 w-full bg-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Right Column Skeleton (Card) */}
          <div className="w-full lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-md rounded-2xl border border-border-default bg-white p-6 sm:p-8 shadow-strong animate-pulse space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="h-6 w-48 bg-slate-200 rounded mx-auto sm:mx-0" />
                <div className="h-4 w-64 bg-slate-100 rounded mx-auto sm:mx-0" />
              </div>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-10 w-full bg-slate-100 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-10 w-full bg-slate-100 rounded-lg" />
                </div>
                <div className="h-11 w-full bg-navy-100 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
