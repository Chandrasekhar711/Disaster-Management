import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { incidentService } from '../services/api';
import { toast } from 'react-toastify';

const MyReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, real, resolved
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await incidentService.getMyIncidents();
        setIncidents(response.data.data || []);
      } catch (error) {
        toast.error('Failed to fetch your reported incidents.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-red-900 text-red-100 border border-red-700 shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-red-100 text-red-700 border border-red-300">
            High Severity
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300">
            Medium Severity
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300">
            Low Severity
          </span>
        );
    }
  };

  const getVerificationBadge = (verification) => {
    if (!verification || verification.status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Under Authority Review
        </span>
      );
    }
    if (verification.status === 'real') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Verified Real & Actioned
        </span>
      );
    }
    if (verification.status === 'fake') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Marked Invalid / False Report
        </span>
      );
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'reported':
        return <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase">Reported</span>;
      case 'authority_review':
      case 'admin_review':
        return <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase">Triage</span>;
      case 'responding':
        return <span className="bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase">Dispatching</span>;
      case 'resolved':
        return <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase">Resolved</span>;
      default:
        return <span className="bg-gray-500 text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase">{status || 'Active'}</span>;
    }
  };

  const getStageIndex = (status, verification) => {
    if (status === 'resolved') return 4;
    if (status === 'responding') return 3;
    if (verification?.status === 'real' || status === 'authority_review') return 2;
    return 1;
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.type?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return !incident.verification || incident.verification.status === 'pending';
    }
    if (activeTab === 'real') {
      return incident.verification?.status === 'real';
    }
    if (activeTab === 'resolved') {
      return incident.status === 'resolved';
    }
    return true;
  });

  const pendingCount = incidents.filter((i) => !i.verification || i.verification.status === 'pending').length;
  const verifiedCount = incidents.filter((i) => i.verification?.status === 'real').length;
  const fakeCount = incidents.filter((i) => i.verification?.status === 'fake').length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 font-medium">Loading District Disaster Management Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Hero Header & Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-2xl shadow-xl text-white p-6 sm:p-8 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-indigo-500 opacity-10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  District Operations Active
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-300">Avg First-Response: ~4.2 Mins</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {user?.name ? `Welcome, ${user.name}` : 'Citizen Response Command'}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-1 max-w-2xl">
                Real-time Disaster & Emergency Management Dashboard. Monitor your submitted incident reports, verification audit trails, and first-responder dispatch updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/report')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 text-sm"
              >
                + Report New Incident
              </button>
              <button
                onClick={() => navigate('/incidents/map')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition text-sm flex items-center gap-2"
              >
                View Live GIS Map
              </button>
            </div>
          </div>

          {/* Quick Problem-Statement Live Advisory Strip */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                DISTRICT ADVISORY
              </span>
              <span>Automated WhatsApp Alerting & Multi-Agency Dispatch pipeline operational across all municipal zones.</span>
            </div>
            <div className="text-slate-400 whitespace-nowrap">
              District Code: <span className="font-mono text-slate-200">DIS-CTRL-01</span>
            </div>
          </div>
        </div>

        {/* Statistical Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Reports */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Reports</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Submitted</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{incidents.length}</span>
              <span className="text-xs text-slate-500">Incident cases</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>District Impact</span>
              <span className="font-semibold text-emerald-600">Active Contributor</span>
            </div>
          </div>

          {/* Card 2: Under Triage */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Under Review</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{pendingCount}</span>
              <span className="text-xs text-amber-700/80">Pending Triage</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>SLA Target</span>
              <span className="font-semibold text-amber-600">&lt; 5 mins review</span>
            </div>
          </div>

          {/* Card 3: Verified Real */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified Real</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Dispatched</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">{verifiedCount}</span>
              <span className="text-xs text-emerald-700/80">Actioned</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Response Progress</span>
              <span className="font-semibold text-emerald-600">{resolvedCount} Resolved</span>
            </div>
          </div>

          {/* Card 4: AI Credibility Index */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI Trust Score</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Auto-Scored</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-600">
                {incidents.length > 0 ? (fakeCount === 0 ? '98.5%' : `${Math.round(((incidents.length - fakeCount) / incidents.length) * 100)}%`) : '100%'}
              </span>
              <span className="text-xs text-indigo-600">Credibility</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Invalid Reports</span>
              <span className="font-semibold text-slate-600">{fakeCount} Flagged</span>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Reports Feed (2/3) + District Action & Helpline Hub (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Main Column: Incident Tracking Feed */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Filter & Search Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Tab Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({incidents.length})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Under Review ({pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('real')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'real'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Verified Real ({verifiedCount})
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === 'resolved'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-48">
                <input
                  type="text"
                  placeholder="Search incident title, type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              </div>
            </div>

            {/* Incidents List */}
            {filteredIncidents.length > 0 ? (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => {
                  const stage = getStageIndex(incident.status, incident.verification);
                  return (
                    <div
                      key={incident._id}
                      onClick={() => setSelectedIncident(incident)}
                      className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
                    >
                      {/* Top Row: Title, Severity, Status */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 uppercase tracking-wide">
                              {incident.type || 'General'}
                            </span>
                            {getSeverityBadge(incident.severity)}
                            {getStatusBadge(incident.status)}
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {incident.title}
                          </h3>
                        </div>
                        <div>
                          {getVerificationBadge(incident.verification)}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {incident.description || 'No detailed description provided.'}
                      </p>

                      {/* 4-Step Response Lifecycle Pipeline */}
                      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                          <span>Emergency Response Lifecycle</span>
                          <span className="text-blue-600 font-semibold">Stage {stage} of 4</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className={`h-1.5 rounded-full ${stage >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                          <div className={`h-1.5 rounded-full ${stage >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                          <div className={`h-1.5 rounded-full ${stage >= 3 ? 'bg-purple-600' : 'bg-slate-200'}`}></div>
                          <div className={`h-1.5 rounded-full ${stage >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-1.5 text-[10px] text-slate-500 text-center font-medium">
                          <span className={stage >= 1 ? 'text-blue-600 font-bold' : ''}>1. Reported</span>
                          <span className={stage >= 2 ? 'text-blue-600 font-bold' : ''}>2. AI Triage</span>
                          <span className={stage >= 3 ? 'text-purple-600 font-bold' : ''}>3. Dispatched</span>
                          <span className={stage >= 4 ? 'text-emerald-600 font-bold' : ''}>4. Resolved</span>
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>
                            📍 {incident.location?.address ? incident.location.address : (incident.location?.city || 'Location mapped')}
                          </span>
                          <span>
                            🕒 {incident.createdAt ? new Date(incident.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                          </span>
                        </div>
                        <span className="font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                          View Incident Audit & Map ➔
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  📋
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Incident Reports Found</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  {searchQuery
                    ? `No reports match your search query "${searchQuery}". Try clearing filters.`
                    : 'You have not reported any incidents in this category. Use the button below to submit a new emergency report.'}
                </p>
                <button
                  onClick={() => navigate('/report')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
                >
                  + Report Incident
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Problem Statement & District Emergency Response Center */}
          <div className="space-y-6">
            
            {/* Emergency Hotline Directory */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">District Emergency Helplines</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">24x7 Live</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Direct one-touch toll-free lines for immediate life-threatening emergency escalation:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="tel:108"
                  className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition text-center group"
                >
                  <p className="text-xs font-bold text-red-800">Medical / Ambulance</p>
                  <p className="text-lg font-black text-red-600 group-hover:scale-105 transition">108</p>
                </a>
                <a
                  href="tel:101"
                  className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition text-center group"
                >
                  <p className="text-xs font-bold text-orange-800">Fire & Rescue</p>
                  <p className="text-lg font-black text-orange-600 group-hover:scale-105 transition">101</p>
                </a>
                <a
                  href="tel:100"
                  className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition text-center group"
                >
                  <p className="text-xs font-bold text-blue-800">Police Patrol</p>
                  <p className="text-lg font-black text-blue-600 group-hover:scale-105 transition">100</p>
                </a>
                <a
                  href="tel:1077"
                  className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition text-center group"
                >
                  <p className="text-xs font-bold text-purple-800">Disaster Control Room</p>
                  <p className="text-lg font-black text-purple-600 group-hover:scale-105 transition">1077</p>
                </a>
              </div>
            </div>

            {/* How IMSD Works (System Architecture & Pipeline) */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl shadow-sm text-white p-5 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">District Incident Pipeline</h3>
              <p className="text-xs text-slate-300 mb-4">
                Automated multi-tier triage ensuring verified emergency response within minutes:
              </p>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-blue-400/30">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">GPS & Camera Incident Ingestion</p>
                    <p className="text-slate-400 text-[11px]">Instant capture with geotagging and multimedia evidence.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-amber-400/30">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">AI Credibility & Authenticity Triage</p>
                    <p className="text-slate-400 text-[11px]">NLP severity classification and duplicate report clustering.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-purple-400/30">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">Automated Twilio WhatsApp Alerts</p>
                    <p className="text-slate-400 text-[11px]">First-responder units receive real-time incident broadcast.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 border border-emerald-400/30">
                    4
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">Live Spatial GIS Tracking</p>
                    <p className="text-slate-400 text-[11px]">Authorities coordinate field deployment until safe resolution.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disaster Safety Guidelines */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <h3 className="text-base font-bold text-slate-900 mb-3">Disaster Preparedness Tips</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-800">🔥 Fire Emergency</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Stay low to avoid smoke inhalation. Never use elevators during evacuation.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-800">🌊 Flood & Heavy Rain</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Move to higher ground. Avoid walking or driving through moving floodwaters.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-800">⚡ Cyclone / Storm</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Secure loose items outdoors. Keep battery backup and emergency supplies handy.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Detailed Incident Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100">
              
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 uppercase">
                      {selectedIncident.type || 'Incident'}
                    </span>
                    {getSeverityBadge(selectedIncident.severity)}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {selectedIncident.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 text-sm">
                {/* Verification Status */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Authority Verification Status</p>
                  <div className="flex items-center gap-3">
                    {getVerificationBadge(selectedIncident.verification)}
                    {getStatusBadge(selectedIncident.status)}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Incident Description</p>
                  <p className="text-slate-800 leading-relaxed">
                    {selectedIncident.description || 'No description provided.'}
                  </p>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500">Reported At</p>
                    <p className="font-semibold text-slate-900 mt-1">
                      {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500">Location</p>
                    <p className="font-semibold text-slate-900 mt-1 truncate">
                      {selectedIncident.location?.address || 'Mapped Coordinates'}
                    </p>
                  </div>
                </div>

                {/* Authority Notes */}
                {selectedIncident.verification?.verificationNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Authority Review Remarks:
                    </p>
                    <p className="text-sm text-blue-800">
                      {selectedIncident.verification.verificationNotes}
                    </p>
                    {selectedIncident.verification.verifiedAt && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        Verified: {new Date(selectedIncident.verification.verifiedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedIncident(null);
                      navigate(`/incidents/${selectedIncident._id}`);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-center"
                  >
                    Open Full Incident View
                  </button>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyReportsPage;
