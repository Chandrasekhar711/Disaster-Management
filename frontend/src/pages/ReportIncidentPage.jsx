import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../services/api.js';
import { Button } from '../components/common.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import { toast } from 'react-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Media upload method options
const UPLOAD_METHODS = {
  NONE: 'none',
  FILE_UPLOAD: 'file_upload',
  CAMERA_CAPTURE: 'camera_capture',
};

const getDisplayVerificationScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return score >= 80 ? Math.max(1, 99 - score) : score;
};

const ReportIncidentPage = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  
  // Media upload state
  const [uploadMethod, setUploadMethod] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerificationResult, setAiVerificationResult] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other',
    customType: '',
    severity: 'medium',
    location: {
      coordinates: [0, 0],
      address: '',
    },
  });

  // Create modern location marker
  const createLocationMarker = () => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-container">
          <div class="marker-pin" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5);">
            <span class="marker-icon">📍</span>
          </div>
          <div class="marker-pulse" style="background: #3b82f6;"></div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      popupAnchor: [0, -50],
    });
  };

  useEffect(() => {
    // Get user location and initialize map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { longitude, latitude } = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
        };
        setLocation({ longitude, latitude });
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude],
          },
        }));

        // Initialize map after getting location
        if (mapContainer.current && !mapInstance.current) {
          const map = L.map(mapContainer.current).setView([latitude, longitude], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          mapInstance.current = map;

          // Add initial marker
          markerRef.current = L.marker([latitude, longitude], {
            draggable: false,
            icon: createLocationMarker(),
          }).addTo(map).bindPopup('<div class="p-2 text-center"><span class="text-xl">📍</span><div class="font-bold">Your Incident Location</div><div class="text-xs text-gray-500">Click map to adjust</div></div>');

          // Handle map clicks
          map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            setFormData((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                coordinates: [lng, lat],
              },
            }));
            setLocation({ latitude: lat, longitude: lng });

            // Update marker position
            if (markerRef.current) {
              map.removeLayer(markerRef.current);
            }
            markerRef.current = L.marker([lat, lng], {
              draggable: false,
              icon: createLocationMarker(),
            }).addTo(map).bindPopup('<div class="p-2 text-center"><span class="text-xl animate-pulse">🔍</span><div class="text-sm text-gray-600">Fetching address...</div></div>').openPopup();

            // Fetch address using reverse geocoding
            await fetchAddressFromCoordinates(lat, lng);
          });
        }
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Reverse geocoding - Get address from coordinates
  const fetchAddressFromCoordinates = async (lat, lng) => {
    setIsFetchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.display_name) {
        setFormData((prev) => ({
          ...prev,
          location: {
            coordinates: [lng, lat],
            address: data.display_name,
          },
        }));

        // Update marker popup with address
        if (markerRef.current) {
          markerRef.current.bindPopup(`📍 ${data.display_name}`).openPopup();
        }

        toast.success('Address fetched successfully!');
      } else {
        toast.warning('Could not fetch address for this location');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast.error('Failed to fetch address. You can enter it manually.');
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const key = name.replace('location.', '');
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Search location using Nominatim (OpenStreetMap geocoding)
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.warning('Please enter a location to search');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        // Update form data
        setFormData((prev) => ({
          ...prev,
          location: {
            coordinates: [lng, lat],
            address: result.display_name,
          },
        }));
        setLocation({ latitude: lat, longitude: lng });

        // Update map view and marker
        if (mapInstance.current) {
          mapInstance.current.setView([lat, lng], 15);

          if (markerRef.current) {
            mapInstance.current.removeLayer(markerRef.current);
          }
          markerRef.current = L.marker([lat, lng], { draggable: false, icon: createLocationMarker() })
            .addTo(mapInstance.current)
            .bindPopup(`<div class="p-2 text-center"><span class="text-xl">📍</span><div class="font-bold text-sm">Selected Location</div><div class="text-xs text-gray-500 mt-1 max-w-48 truncate">${result.display_name}</div></div>`)
            .openPopup();
        }

        toast.success('Location found!');
      } else {
        toast.error('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle file upload selection
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setSelectedFiles(files);
    setCapturedImage(null);
    setAiVerificationResult(null);
    toast.success(`${files.length} file(s) selected`);
  };

  // Handle camera capture
  const handleCameraCapture = async (captureData) => {
    setIsVerifying(true);
    setCapturedImage(captureData);
    
    try {
      // Create form data for AI verification
      const formData = new FormData();
      formData.append('image', captureData.blob, 'camera-capture.jpg');
      
      // Send to AI verification endpoint
      const response = await incidentService.verifyImage(formData);
      const result = response.data?.data || response.data;
      
      setAiVerificationResult(result);
      setShowCamera(false);
      
      // Show verification result
      if (result.isRealImage) {
        toast.success(`✅ Image verified as real! (${result.score}% confidence)`);
      } else {
        toast.info(`⚠️ AI confidence: ${result.score}%. Report will be sent for manual verification.`);
      }
    } catch (error) {
      console.error('AI Verification error:', error);
      toast.error('Failed to verify image. Please try again.');
      setAiVerificationResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset media selection
  const resetMediaSelection = () => {
    setUploadMethod(null);
    setSelectedFiles([]);
    setCapturedImage(null);
    setAiVerificationResult(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate custom type if "other" is selected
    if (formData.type === 'other' && !formData.customType.trim()) {
      toast.error('Please enter a custom incident type');
      return;
    }

    // Validate media selection
    if (!uploadMethod) {
      toast.error('Please select a media upload option');
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (uploadMethod === UPLOAD_METHODS.NONE) {
        // Submit without media
        response = await incidentService.createIncidentWithoutMedia(formData);
      } else if (uploadMethod === UPLOAD_METHODS.FILE_UPLOAD) {
        // Submit with file upload
        const submitFormData = new FormData();
        submitFormData.append('incidentData', JSON.stringify(formData));
        selectedFiles.forEach(file => {
          submitFormData.append('media', file);
        });
        response = await incidentService.createIncidentWithMedia(submitFormData);
      } else if (uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE) {
        // Submit with camera capture
        if (!capturedImage) {
          toast.error('Please capture a photo first');
          setIsLoading(false);
          return;
        }
        const submitFormData = new FormData();
        submitFormData.append('incidentData', JSON.stringify(formData));
        submitFormData.append('cameraImage', capturedImage.blob, 'camera-capture.jpg');
        response = await incidentService.createIncidentWithCameraCapture(submitFormData);
      }

      const result = response.data;
      
      // Show success message based on routing
      if (result.data?.aiVerification) {
        const { score, routingDestination } = result.data.aiVerification;
        const displayScore = getDisplayVerificationScore(score);
        if (routingDestination === 'responding_team') {
          toast.success(`🚀 Incident verified (AI Score: ${displayScore}%) and sent directly to Responding Team!`);
        } else {
          toast.success(`📋 Incident submitted (AI Score: ${displayScore}%) and sent to Verification Team for review.`);
        }
      } else {
        toast.success(result.message || 'Incident reported successfully!');
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to report incident');
    } finally {
      setIsLoading(false);
    }
  };

  // Render AI verification result badge
  const renderAiVerificationBadge = () => {
    if (!aiVerificationResult) return null;

    const { score, isRealImage, routingRecommendation } = aiVerificationResult;
    const displayScore = getDisplayVerificationScore(score);
    const isHighScore = score >= 80;

    return (
      <div className={`mt-4 p-4 rounded-xl border-2 ${isHighScore ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            isHighScore ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
          }`}>
            {displayScore}%
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${isHighScore ? 'text-green-700' : 'text-yellow-700'}`}>
              {isRealImage ? '✅ Image Verified as Real' : '⚠️ Manual Verification Required'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {isRealImage
                ? 'Your photo passed AI verification. The report will be sent directly to the Responding Team.'
                : 'The AI needs additional verification. Your report will be reviewed by our Verification Team.'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              🎯 Routing: <span className="font-medium capitalize">{routingRecommendation?.replace('_', ' ')}</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Report an Incident</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Incident Title */}
        <div>
          <label className="label">Incident Title *</label>
          <input
            type="text"
            name="title"
            className="input"
            placeholder="Brief description of the incident"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description *</label>
          <textarea
            name="description"
            className="input min-h-[100px]"
            placeholder="Detailed description of what happened"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        {/* Location Selection */}
        <div>
          <label className="label">Select Incident Location on Map *</label>
          
          {/* Location Search */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="Search for a location (e.g., Times Square, New York)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input flex-1"
            />
            <Button
              type="button"
              onClick={handleLocationSearch}
              loading={isSearching}
              variant="primary"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div
            ref={mapContainer}
            className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden"
          ></div>
          {location && (
            <p className="text-sm text-gray-600 mt-2">
              📍 Selected location: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
              {isFetchingAddress && <span className="ml-2 text-blue-600 animate-pulse">Fetching address...</span>}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Click anywhere on the map to select incident location. Address will be auto-fetched.
          </p>
        </div>

        {/* Incident Type and Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Incident Type *</label>
            <select
              name="type"
              className="input"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="flood">Flood</option>
              <option value="fire">Fire</option>
              <option value="accident">Accident</option>
              <option value="earthquake">Earthquake</option>
              <option value="hazard">Hazard</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Severity *</label>
            <select
              name="severity"
              className="input"
              value={formData.severity}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Custom Incident Type */}
        {formData.type === 'other' && (
          <div>
            <label className="label">Enter Custom Incident Type *</label>
            <input
              type="text"
              name="customType"
              className="input"
              placeholder="e.g., Power Outage, Water Leak, etc."
              value={formData.customType}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Please specify the type of incident since you selected "Other"
            </p>
          </div>
        )}

        {/* Location Address */}
        <div>
          <label className="label">
            Location Address {isFetchingAddress && <span className="text-blue-600 text-sm">⏳ Fetching...</span>}
          </label>
          <input
            type="text"
            name="location.address"
            className="input"
            placeholder="Click on map to auto-fetch address, or enter manually"
            value={formData.location.address}
            onChange={handleChange}
            disabled={isFetchingAddress}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isFetchingAddress 
              ? '⏳ Fetching address from map location...'
              : '✅ Address auto-fills when you click on the map, or you can enter it manually'}
          </p>
        </div>

        {/* ==================== MEDIA UPLOAD SECTION ==================== */}
        <div className="border-t border-b border-gray-200 py-6 my-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📸</span>
            Media Upload
          </h2>
          <p className="text-gray-600 mb-6">
            Choose how you'd like to submit evidence for your incident report. Camera captures are verified by AI for faster processing.
          </p>

          {/* Upload Method Selection */}
          {!uploadMethod && (
            <div className="grid gap-4">
              {/* Option 1: Submit without media */}
              <button
                type="button"
                onClick={() => setUploadMethod(UPLOAD_METHODS.NONE)}
                className="flex items-center gap-4 p-5 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-2xl">
                  📝
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Submit without media</h3>
                  <p className="text-sm text-gray-500">Report the incident with text description only</p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    → Sent to Verification Team
                  </span>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Option 2: Upload media file */}
              <button
                type="button"
                onClick={() => setUploadMethod(UPLOAD_METHODS.FILE_UPLOAD)}
                className="flex items-center gap-4 p-5 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-2xl">
                  📁
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Upload media file</h3>
                  <p className="text-sm text-gray-500">Upload images or videos from your device</p>
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    → Sent to Verification Team
                  </span>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Option 3: Capture photo with camera */}
              <button
                type="button"
                onClick={() => {
                  setUploadMethod(UPLOAD_METHODS.CAMERA_CAPTURE);
                  setShowCamera(true);
                }}
                className="flex items-center gap-4 p-5 border-2 border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group bg-green-50/50"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center text-2xl">
                  📷
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Capture photo with camera</h3>
                  <p className="text-sm text-gray-500">Take a live photo for AI verification</p>
                  <div className="flex gap-2 mt-2">
                    <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      🤖 AI Verified
                    </span>
                    <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      ⚡ Faster Processing
                    </span>
                  </div>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Selected Method Display */}
          {uploadMethod && (
            <div className="space-y-4">
              {/* Method Header with Change Option */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {uploadMethod === UPLOAD_METHODS.NONE && '📝'}
                    {uploadMethod === UPLOAD_METHODS.FILE_UPLOAD && '📁'}
                    {uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE && '📷'}
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {uploadMethod === UPLOAD_METHODS.NONE && 'Submit without media'}
                      {uploadMethod === UPLOAD_METHODS.FILE_UPLOAD && 'Upload media file'}
                      {uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE && 'Camera capture'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {uploadMethod === UPLOAD_METHODS.NONE && 'Text-only submission'}
                      {uploadMethod === UPLOAD_METHODS.FILE_UPLOAD && `${selectedFiles.length} file(s) selected`}
                      {uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE && (capturedImage ? 'Photo captured' : 'Ready to capture')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetMediaSelection}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>

              {/* File Upload Interface */}
              {uploadMethod === UPLOAD_METHODS.FILE_UPLOAD && (
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                    <p className="text-gray-400 text-sm mt-1">Images or videos (max 50MB each, up to 5 files)</p>
                  </label>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <h5 className="font-medium text-gray-700 mb-3">Selected Files:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative">
                            {file.type.startsWith('image') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate rounded-b-lg">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Capture Interface */}
              {uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE && (
                <div>
                  {!capturedImage ? (
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all bg-green-50/50"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4">
                        📷
                      </div>
                      <p className="text-gray-700 font-medium">Open Camera</p>
                      <p className="text-gray-500 text-sm mt-1">Capture a photo for AI verification</p>
                    </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={capturedImage.url}
                        alt="Captured"
                        className="w-full rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          setAiVerificationResult(null);
                          setShowCamera(true);
                        }}
                        className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
                      >
                        📷 Retake
                      </button>
                    </div>
                  )}

                  {/* AI Verification Result */}
                  {renderAiVerificationBadge()}
                </div>
              )}

              {/* No Media Info */}
              {uploadMethod === UPLOAD_METHODS.NONE && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <h4 className="font-medium text-yellow-800">No Media Attached</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your report will be submitted without any photos or videos. 
                        It will be sent to our Verification Team for review before being escalated.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ==================== END MEDIA UPLOAD SECTION ==================== */}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            loading={isLoading} 
            className="flex-1"
            disabled={!uploadMethod}
          >
            {isLoading ? 'Submitting...' : 'Report Incident'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Routing Info */}
        {uploadMethod && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {uploadMethod === UPLOAD_METHODS.CAMERA_CAPTURE && aiVerificationResult?.isRealImage ? (
              <span className="text-green-600">
                🚀 Your report will be sent directly to the <strong>Responding Team</strong>
              </span>
            ) : (
              <span className="text-yellow-600">
                📋 Your report will be sent to the <strong>Verification Team</strong> for review
              </span>
            )}
          </div>
        )}
      </form>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => {
            setShowCamera(false);
            if (!capturedImage) {
              setUploadMethod(null);
            }
          }}
          isVerifying={isVerifying}
        />
      )}
    </div>
  );
};

export default ReportIncidentPage;
