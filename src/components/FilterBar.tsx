interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterClass: string;
  setFilterClass: (val: string) => void;
  filterMajor: string;
  setFilterMajor: (val: string) => void;
  filterGender: string;
  setFilterGender: (val: string) => void;
  uniqueClasses: string[];
  uniqueMajors: string[];
  onReset: () => void;
}

export const FilterBar = (props: FilterBarProps) => {
  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Cari nama siswa..."
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-500"
          value={props.searchQuery}
          onChange={(e) => props.setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          className="px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 cursor-pointer font-bold text-gray-900"
          value={props.filterClass} 
          onChange={(e) => props.setFilterClass(e.target.value)}
        >
          <option value="" className="font-bold">Semua Kelas</option>
          {props.uniqueClasses.map(c => <option key={c} value={c} className="font-bold">{c}</option>)}
        </select>

        <select 
          className="px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 cursor-pointer font-bold text-gray-900"
          value={props.filterMajor} 
          onChange={(e) => props.setFilterMajor(e.target.value)}
        >
          <option value="" className="font-bold">Semua Jurusan</option>
          {props.uniqueMajors.map(m => <option key={m} value={m} className="font-bold">{m}</option>)}
        </select>

        <select 
          className="px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 cursor-pointer font-bold text-gray-900"
          value={props.filterGender} 
          onChange={(e) => props.setFilterGender(e.target.value)}
        >
          <option value="" className="font-bold">Semua Gender</option>
          <option value="Laki-laki" className="font-bold">Laki-laki</option>
          <option value="Perempuan" className="font-bold">Perempuan</option>
        </select>
        
        <button 
          onClick={props.onReset}
          className="px-6 py-3 text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition-colors font-black shrink-0 border border-red-200 shadow-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );
};