import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Filter, RefreshCw, ChevronRight, 
  Building2, Users, IndianRupee, AlertCircle, CheckCircle, ArrowLeft
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
        setActionSuccess('District added successfully!');
        setNewDistrictName('');
        setNewDistrictCode('');
        setShowAddDistrict(false);
        // Refresh districts
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
        setActionSuccess('Area added successfully!');
        setNewAreaName('');
        setNewAreaPincode('');
        setShowAddArea(false);
        // Refresh areas
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

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              <button 
                onClick={() => { setActiveTab('states'); setSelectedState(null); setSelectedDistrict(null); }}
                className="hover:underline"
              >
                India (28 States & 8 UTs)
              </button>
              {selectedState && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  <button 
                    onClick={() => { setActiveTab('districts'); setSelectedDistrict(null); }}
                    className="hover:underline text-gray-800"
                  >
                    {selectedState.name}
                  </button>
                </>
              )}
              {selectedDistrict && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-900 font-bold">{selectedDistrict.name}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-indigo-600" />
              <span>
                {activeTab === 'states' && 'Official India Geographical Master'}
                {activeTab === 'districts' && `Districts of ${selectedState?.name}`}
                {activeTab === 'areas' && `Areas / Localities of ${selectedDistrict?.name}`}
              </span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {activeTab === 'districts' && (
              <button
                onClick={() => setShowAddDistrict(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add District</span>
              </button>
            )}
            {activeTab === 'areas' && (
              <button
                onClick={() => setShowAddArea(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition"
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
              className="p-2 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Filter & Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'states' ? 'Search State or UT...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === 'states' && (
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-xs font-medium text-gray-500">Filter:</span>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All (36)
              </button>
              <button
                onClick={() => setFilterType('STATES')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filterType === 'STATES' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                States (28)
              </button>
              <button
                onClick={() => setFilterType('UTS')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filterType === 'UTS' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {activeTab === 'areas' ? 'Districts' : 'States'}</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. STATES / UTs VIEW */}
      {activeTab === 'states' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">State / Union Territory</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Districts</th>
                  <th className="py-3.5 px-4 text-center">State Dists</th>
                  <th className="py-3.5 px-4 text-center">District Dists</th>
                  <th className="py-3.5 px-4 text-center">Area Dists</th>
                  <th className="py-3.5 px-4 text-center">Retailers</th>
                  <th className="py-3.5 px-4 text-center">Active / Total</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Collected (₹)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStates.map((state) => (
                  <tr key={state.id} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 text-center text-xs text-gray-400 font-mono">{state.code}</span>
                        <span>{state.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                        state.isUnionTerritory ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {state.isUnionTerritory ? 'Union Territory' : 'State'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">{state.totalDistricts}</td>
                    <td className="py-3 px-4 text-center font-semibold text-indigo-700">{state.totalStateDistributors}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{state.totalDistrictDistributors}</td>
                    <td className="py-3 px-4 text-center font-semibold text-cyan-700">{state.totalAreaDistributors}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">{state.totalRetailers}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-green-600 font-semibold">{state.totalActiveAccounts}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-700">{state.totalAccounts}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-700">
                      ₹{parseFloat(state.totalOutstanding || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      ₹{parseFloat(state.totalCollected || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleStateSelect(state)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <span>View Districts</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-900">
              Showing {districts.length} districts in {selectedState?.name}
            </span>
            <span className="text-xs text-indigo-600 font-medium">Click a district to view registered areas</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">District Name</th>
                  <th className="py-3.5 px-4 text-center">Code</th>
                  <th className="py-3.5 px-4 text-center">Areas Registered</th>
                  <th className="py-3.5 px-4 text-center">District Dists</th>
                  <th className="py-3.5 px-4 text-center">Area Dists</th>
                  <th className="py-3.5 px-4 text-center">Retailers</th>
                  <th className="py-3.5 px-4 text-center">Active Accounts</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Collected (₹)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {districts.map((d) => (
                  <tr key={d.id} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">{d.name}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">{d.code || '-'}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">{d.totalAreas || 0}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{d.totalDistrictDistributors || 0}</td>
                    <td className="py-3 px-4 text-center font-semibold text-cyan-700">{d.totalAreaDistributors || 0}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">{d.totalRetailers || 0}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-semibold">{d.totalActiveAccounts || 0}</td>
                    <td className="py-3 px-4 text-right font-medium text-amber-700">₹{parseFloat(d.totalOutstanding || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700">₹{parseFloat(d.totalCollected || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDistrictSelect(d)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                      >
                        <span>View Areas</span>
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

      {/* 3. AREAS VIEW */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-900">
              Showing {areas.length} areas in {selectedDistrict?.name}, {selectedState?.name}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Area / Locality Name</th>
                  <th className="py-3.5 px-4 text-center">Pincode</th>
                  <th className="py-3.5 px-4 text-center">Area Distributors</th>
                  <th className="py-3.5 px-4 text-center">Retailers</th>
                  <th className="py-3.5 px-4 text-center">Active Accounts</th>
                  <th className="py-3.5 px-4 text-right">Outstanding (₹)</th>
                  <th className="py-3.5 px-4 text-right">Collected (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {areas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">
                      No areas registered in this district yet. Click "Add Area" above to create one.
                    </td>
                  </tr>
                ) : (
                  areas.map((a) => (
                    <tr key={a.id} className="hover:bg-indigo-50/40 transition">
                      <td className="py-3 px-4 font-semibold text-gray-900">{a.name}</td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-gray-600">{a.pincode || '-'}</td>
                      <td className="py-3 px-4 text-center font-semibold text-cyan-700">{a.totalAreaDistributors || 0}</td>
                      <td className="py-3 px-4 text-center font-semibold text-emerald-700">{a.totalRetailers || 0}</td>
                      <td className="py-3 px-4 text-center text-green-600 font-semibold">{a.totalActiveAccounts || 0}</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">₹{parseFloat(a.totalOutstanding || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">₹{parseFloat(a.totalCollected || 0).toLocaleString()}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add District to {selectedState?.name}</h3>
            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded mb-3">{actionError}</div>
            )}
            <form onSubmit={handleCreateDistrict} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">District Name *</label>
                <input
                  type="text"
                  required
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">District Code (Optional)</label>
                <input
                  type="text"
                  value={newDistrictCode}
                  onChange={(e) => setNewDistrictCode(e.target.value)}
                  placeholder="e.g. PU"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg uppercase"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDistrict(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Add Area to {selectedDistrict?.name}</h3>
            {actionError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded mb-3">{actionError}</div>
            )}
            <form onSubmit={handleCreateArea} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Area / Locality Name *</label>
                <input
                  type="text"
                  required
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Andheri West"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Pincode</label>
                <input
                  type="text"
                  value={newAreaPincode}
                  onChange={(e) => setNewAreaPincode(e.target.value)}
                  placeholder="e.g. 400058"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddArea(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
                >
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

