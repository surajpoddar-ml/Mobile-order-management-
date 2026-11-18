import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Filter, RefreshCw, ChevronRight, 
  Building2, Users, IndianRupee, AlertCircle, CheckCircle, ArrowLeft,
  Globe2, Compass, Layers, ShieldCheck, X
} from 'lucide-react';
import api from '../../services/api';

export default function GeographicalManagement() {
  const [activeTab, setActiveTab] = useState('states'); // 'states' | 'districts' | 'areas'
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'STATES' | 'UTS'

  // Modal state
  const [showAddDistrict, setShowAddDistrict] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictCode, setNewDistrictCode] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaPincode, setNewAreaPincode] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoading(true);
    try {
      const res = await api.distribution.getStates();
      if (res.success) {
        setStates(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setActiveTab('districts');
    setLoading(true);
    try {
      const res = await api.distribution.getDistricts(state.id);
      if (res.success) {
        setDistricts(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching districts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    setActiveTab('areas');
    setLoading(true);
    try {
      const res = await api.distribution.getAreas(district.id);
      if (res.success) {
        setAreas(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDistrict = async (e) => {
    e.preventDefault();
    if (!selectedState) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.createDistrict({
        stateId: selectedState.id,
        name: newDistrictName.trim(),
        code: newDistrictCode.trim() || undefined
      });
      if (res.success) {
        setActionSuccess(`District "${newDistrictName.trim()}" added successfully!`);
        setNewDistrictName('');
        setNewDistrictCode('');
        setShowAddDistrict(false);
        handleStateSelect(selectedState);
      } else {
        setActionError(res.message || 'Failed to create district');
      }
    } catch (err) {
      setActionError(err.message || 'Server error creating district');
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    if (!selectedDistrict) return;
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.distribution.createArea({
        districtId: selectedDistrict.id,
        name: newAreaName.trim(),
        pincode: newAreaPincode.trim() || undefined
      });
      if (res.success) {
        setActionSuccess(`Area "${newAreaName.trim()}" added successfully!`);
        setNewAreaName('');
        setNewAreaPincode('');
        setShowAddArea(false);
        handleDistrictSelect(selectedDistrict);
      } else {
        setActionError(res.message || 'Failed to create area');
      }
    } catch (err) {
      setActionError(err.message || 'Server error creating area');
    }
  };

  const filteredStates = states.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'STATES') return matchesSearch && !s.isUnionTerritory;
    if (filterType === 'UTS') return matchesSearch && s.isUnionTerritory;
    return matchesSearch;
  });

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.code && d.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.pincode && a.pincode.includes(searchTerm))
  );

  // Quick stats computed
  const totalStatesCount = states.filter(s => !s.isUnionTerritory).length;
  const totalUtsCount = states.filter(s => s.isUnionTerritory).length;
  const totalDistrictsAggregate = states.reduce((sum, s) => sum + (parseInt(s.totalDistricts) || 0), 0);
  const totalActiveNetworkAccounts = states.reduce((sum, s) => sum + (parseInt(s.totalActiveAccounts) || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Mini Stat Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Indian States</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalStatesCount || 28}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Sovereign Territories</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Compass className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Union Territories</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalUtsCount || 8}</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Central Administrations</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mapped Districts</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalDistrictsAggregate || 788}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Pan-India Network</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Partners</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalActiveNetworkAccounts}</div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Assigned Dealers</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header & Interactive Breadcrumbs */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-500 mb-2">
              <button 
                onClick={() => { setActiveTab('states'); setSelectedState(null); setSelectedDistrict(null); }}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'states' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Republic of India</span>
              </button>

              {selectedState && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button 
                    onClick={() => { setActiveTab('districts'); setSelectedDistrict(null); }}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition ${
                      activeTab === 'districts' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedState.name}</span>
                  </button>
                </>
              )}

              {selectedDistrict && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedDistrict.name}</span>
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>
                {activeTab === 'states' && 'Official India Master Geography (28 States & 8 UTs)'}
                {activeTab === 'districts' && `Districts under ${selectedState?.name}`}
                {activeTab === 'areas' && `Registered Areas / Localities of ${selectedDistrict?.name}`}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'states' && 'Browse, search, and manage all Indian sovereign state and central territory distribution tiers.'}
              {activeTab === 'districts' && 'Supervise registered district administrative divisions and assigned tier distributors.'}
              {activeTab === 'areas' && 'Maintain local territory coverage, area-level distributors, and retail delivery pincodes.'}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            {activeTab === 'districts' && (
              <button
                onClick={() => setShowAddDistrict(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition hover:shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add District</span>
              </button>
            )}
            {activeTab === 'areas' && (
              <button
                onClick={() => setShowAddArea(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition hover:shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Add Area</span>
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === 'states') fetchStates();
                else if (activeTab === 'districts') handleStateSelect(selectedState);
                else if (activeTab === 'areas') handleDistrictSelect(selectedDistrict);
              }}
              className="p-2.5 text-slate-600 hover:text-blue-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              title="Refresh Territory Master"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'states' 
                  ? 'Search by State name or code...' 
                  : activeTab === 'districts' 
                    ? 'Search district name or code...' 
                    : 'Search locality or pincode...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          {activeTab === 'states' && (
            <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-100/80 p-1 rounded-xl">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  filterType === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Regions ({states.length || 36})
              </button>
              <button
                onClick={() => setFilterType('STATES')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  filterType === 'STATES' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                States (28)
              </button>
              <button
                onClick={() => setFilterType('UTS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  filterType === 'UTS' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Union Territories (8)
              </button>
            </div>
          )}

          {(activeTab === 'districts' || activeTab === 'areas') && (
            <button
              onClick={() => {
                if (activeTab === 'areas') {
                  setActiveTab('districts');
                  setSelectedDistrict(null);
                } else {
                  setActiveTab('states');
                  setSelectedState(null);
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {activeTab === 'areas' ? 'Districts' : 'States'}</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 animate-slideDown">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. STATES / UTs VIEW */}
      {activeTab === 'states' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">State / Union Territory</th>
                  <th className="py-3.5 px-3 text-center">Designation</th>
                  <th className="py-3.5 px-3 text-center">Districts</th>
                  <th className="py-3.5 px-3 text-center">State Dists</th>
                  <th className="py-3.5 px-3 text-center">Dist. Dists</th>
                  <th className="py-3.5 px-3 text-center">Area Dists</th>
                  <th className="py-3.5 px-3 text-center">Retailers</th>
                  <th className="py-3.5 px-3 text-center">Network Accounts</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Settled (₹)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStates.map((state) => (
                  <tr key={state.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-6 flex items-center justify-center text-[10px] bg-slate-100 text-slate-600 font-mono font-bold rounded">
                          {state.code}
                        </span>
                        <span className="font-semibold text-slate-900">{state.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                        state.isUnionTerritory 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {state.isUnionTerritory ? 'Union Territory' : 'State'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{state.totalDistricts}</td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-600">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                        {state.totalStateDistributors}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-600">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100">
                        {state.totalDistrictDistributors}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-cyan-600">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-100">
                        {state.totalAreaDistributors}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                        {state.totalRetailers}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 font-bold">{state.totalActiveAccounts}</span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-slate-600 font-semibold">{state.totalAccounts}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">
                      ₹{parseFloat(state.totalOutstanding || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ₹{parseFloat(state.totalCollected || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStateSelect(state)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition"
                      >
                        <span>Districts</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. DISTRICTS VIEW */}
      {activeTab === 'districts' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-4 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Showing {filteredDistricts.length} registered districts in {selectedState?.name}</span>
            </span>
            <span className="text-[11px] text-blue-700 font-semibold">Click "Areas" to drill down to retail localities</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">District Name</th>
                  <th className="py-3.5 px-3 text-center">Code</th>
                  <th className="py-3.5 px-3 text-center">Areas Registered</th>
                  <th className="py-3.5 px-3 text-center">District Dists</th>
                  <th className="py-3.5 px-3 text-center">Area Dists</th>
                  <th className="py-3.5 px-3 text-center">Retailers</th>
                  <th className="py-3.5 px-3 text-center">Active Accounts</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Settled (₹)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDistricts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 font-medium">
                      No districts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredDistricts.map((d) => (
                    <tr key={d.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                      <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-500 font-bold">{d.code || '-'}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{d.totalAreas || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">{d.totalDistrictDistributors || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-cyan-600">{d.totalAreaDistributors || 0}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">{d.totalRetailers || 0}</td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">{d.totalActiveAccounts || 0}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">₹{parseFloat(d.totalOutstanding || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{parseFloat(d.totalCollected || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDistrictSelect(d)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg transition"
                        >
                          <span>Areas</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. AREAS VIEW */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Showing {filteredAreas.length} localities in {selectedDistrict?.name}, {selectedState?.name}</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Area / Locality Name</th>
                  <th className="py-3.5 px-4 text-center">Pincode</th>
                  <th className="py-3.5 px-4 text-center">Area Distributors</th>
                  <th className="py-3.5 px-4 text-center">Retailers</th>
                  <th className="py-3.5 px-4 text-center">Active Accounts</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Settled (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-slate-600">No areas registered in this district yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click "Add Area" above to register new delivery zones.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((a) => (
                    <tr key={a.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.name}</td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] font-bold text-slate-700 bg-slate-50">{a.pincode || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-cyan-600">{a.totalAreaDistributors || 0}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{a.totalRetailers || 0}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-bold">{a.totalActiveAccounts || 0}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">₹{parseFloat(a.totalOutstanding || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{parseFloat(a.totalCollected || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add District Modal */}
      {showAddDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add District to {selectedState?.name}</h3>
              </div>
              <button 
                onClick={() => setShowAddDistrict(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDistrict} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">District Name *</label>
                <input
                  type="text"
                  required
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  placeholder="e.g. Pune, Thane, Surat"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">District Code (Optional)</label>
                <input
                  type="text"
                  value={newDistrictCode}
                  onChange={(e) => setNewDistrictCode(e.target.value)}
                  placeholder="e.g. PU, TH, SU"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDistrict(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition"
                >
                  Save District
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {showAddArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Add Locality to {selectedDistrict?.name}</h3>
              </div>
              <button 
                onClick={() => setShowAddArea(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateArea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Area / Locality Name *</label>
                <input
                  type="text"
                  required
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Andheri West, Shivaji Nagar"
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Postal Pincode</label>
                <input
                  type="text"
                  value={newAreaPincode}
                  onChange={(e) => setNewAreaPincode(e.target.value)}
                  placeholder="e.g. 400058"
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddArea(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                >
                  Save Locality
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
