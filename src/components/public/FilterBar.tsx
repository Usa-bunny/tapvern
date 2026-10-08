"use client";

import { useState } from "react";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterClass: string;
  setFilterClass: (val: string) => void;
  filterDomicile: string;
  setFilterDomicile: (val: string) => void;
  filterGender: string;
  setFilterGender: (val: string) => void;
  uniqueClasses: string[];
  uniqueDomiciles: string[];
  onReset: () => void;
}

export const FilterBar = (props: FilterBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = Boolean(
    props.filterClass ||
    props.filterDomicile ||
    props.filterGender ||
    props.searchQuery,
  );

  return (
    <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] shadow-sm border border-gray-200/80 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama siswa..."
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-[#223024] transition-all outline-none font-bold text-primary placeholder:text-gray-400 text-sm shadow-sm"
            value={props.searchQuery}
            onChange={(e) => props.setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full sm:w-auto px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-primary rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {isExpanded ? "Sembunyikan Filter" : "Filter Lanjutan"}
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          )}
        </button>
      </div>

      {/* Collapsible Filter Section */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-all overflow-hidden ${isExpanded ? "max-h-96 opacity-100 pt-2" : "max-h-0 opacity-0 pointer-events-none"}`}
      >
        <select
          className="px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-[#223024] cursor-pointer font-bold text-primary text-sm shadow-sm"
          value={props.filterClass}
          onChange={(e) => props.setFilterClass(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {props.uniqueClasses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-[#223024] cursor-pointer font-bold text-primary text-sm shadow-sm"
          value={props.filterDomicile}
          onChange={(e) => props.setFilterDomicile(e.target.value)}
        >
          <option value="">Semua Domisili</option>
          {props.uniqueDomiciles.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            className="flex-1 px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:border-[#223024] cursor-pointer font-bold text-primary text-sm shadow-sm"
            value={props.filterGender}
            onChange={(e) => props.setFilterGender(e.target.value)}
          >
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>

          <button
            onClick={props.onReset}
            className="px-4 py-3.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-2xl transition-colors font-black border border-rose-200 text-xs cursor-pointer shrink-0"
            title="Reset Filter"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
