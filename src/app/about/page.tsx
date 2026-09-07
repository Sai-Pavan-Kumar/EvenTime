import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "About EvenTime | The dictionary for events",
  description: "EvenTime brings events from across the internet and offline notice boards into one single timeline.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">About EvenTime</span>
        </div>

        {/* Canonical Card matching AboutEvenTimeScreen */}
        <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-slate-200/80 shadow-sm">
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight mb-1">
            EvenTime
          </h1>
          <p className="text-slate-500 font-medium text-base mb-6">
            The dictionary for events.
          </p>

          <div className="h-px bg-slate-100 mb-6" />

          {/* Section: The Problem */}
          <section className="mb-7">
            <h2 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-3">
              The Problem
            </h2>
            <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
              <p>
                Networking matters. Whether you are discovering a hackathon, meeting peers, or seeking collaborators, being in the right room changes everything.
              </p>
              <p>
                Today, finding those rooms is fragmented. Organizers list events across different ticketing platforms like Lu.ma or Meetup, while others share links through private groups. More often than not, you only learn an event took place after seeing photos posted on social media.
              </p>
              <p>
                Juggling multiple platforms just to know what is happening this weekend shouldn't be your job.
              </p>
            </div>
          </section>

          {/* Section: One Single Timeline */}
          <section className="mb-7">
            <h2 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-3">
              One Single Timeline
            </h2>
            <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
              <p>
                EvenTime brings events from across the internet into one place.
              </p>
              <p>
                Instead of searching multiple websites, you browse one feed. EvenTime is community-driven: anyone who knows about an upcoming event can publish it. There are no complicated barriers—everyone who publishes an event is a Curator helping their city stay connected.
              </p>
              <p>
                Attendees find the events they want. Organizers get the reach they need.
              </p>
            </div>
          </section>

          {/* Section: Beyond Notice Boards */}
          <section className="mb-7">
            <h2 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-3">
              Beyond Notice Boards
            </h2>
            <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
              <p>
                College events and fests have historically lived on physical canteen boards and cafeteria walls. If you didn't walk past that board, you missed the announcement.
              </p>
              <p>
                EvenTime moves that offline communication onto the timeline:
              </p>
              <ul className="space-y-2.5 pt-1">
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">Exclusive College Events:</strong>{" "}
                    Fests and workshops restricted to your college appear in Your Campus. Students can toggle between All Events and Eligible for Me to instantly view events matching their branch and graduation year with zero card clutter.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">Open College Events:</strong>{" "}
                    Inter-college fests, hackathons, and cultural nights open to outside attendees appear city-wide in Around You.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">Seamless Publishing:</strong>{" "}
                    When onboarded students post a college fest or event, their registered college is automatically pre-filled, making hosting effortless.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section: How Feeds Work */}
          <section className="mb-7">
            <h2 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-3">
              How Feeds Work
            </h2>
            <div className="space-y-3 text-sm md:text-[15px] text-slate-700 leading-relaxed">
              <p>
                Every user chooses up to 3 cities and 6 categories from a collection of over 30 categories and 30 cities across India:
              </p>
              <ul className="space-y-2.5 pt-1">
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">For You:</strong>{" "}
                    Events in your selected cities that match your favorite categories.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">Around You:</strong>{" "}
                    Everything else happening across your chosen cities, helping you explore beyond your usual preferences.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-400 mt-1">•</span>
                  <span>
                    <strong className="font-semibold text-slate-900">Your Campus:</strong>{" "}
                    Internal events and fests exclusive to your college, with instant switching between All Events and Eligible for Me.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section: Thoughtful Details */}
          <section className="mb-7">
            <h2 className="font-heading font-bold text-lg md:text-xl text-slate-900 mb-3">
              Thoughtful Details
            </h2>
            <ul className="space-y-2.5 text-sm md:text-[15px] text-slate-700 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">24-Hour Reminders:</strong>{" "}
                  Get an automatic notification one day before your saved event begins so you never miss out.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Add to Calendar:</strong>{" "}
                  Sync any event to your device's native calendar in a single tap.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Save for Later:</strong>{" "}
                  Bookmark events you are considering to your profile.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-slate-400 mt-1">•</span>
                <span>
                  <strong className="font-semibold text-slate-900">Community Interest:</strong>{" "}
                  See how many attendees are interested in an event to gauge momentum before you go.
                </span>
              </li>
            </ul>
          </section>

          <div className="h-px bg-slate-100 my-6" />

          {/* Clean Footer matching app */}
          <div className="text-center py-2">
            <p className="text-sm font-medium text-slate-500">
              Built for humans, by{" "}
              <a
                href="https://thesurfboard.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#6C47FF] hover:underline transition-colors"
              >
                The SurfBoard
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
