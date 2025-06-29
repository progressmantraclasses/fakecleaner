// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState, useRef, useEffect } from 'react';
import * as echarts from 'echarts';

const App: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: string;
    rows: number;
    columns: number;
  } | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [activeTab, setActiveTab] = useState('cleaned');
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [cleaningOptions, setCleaningOptions] = useState({
    removeDuplicates: true,
    missingValues: 'mean',
    standardizeFormats: true
  });
  const [isProcessed, setIsProcessed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv') {
        handleFile(droppedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        
        // Create preview data (first 5 rows)
        const preview = lines.slice(0, 5).map(line => line.split(','));
        
        setFileInfo({
          name: file.name,
          size: formatFileSize(file.size),
          rows: lines.length - 1, // Excluding header
          columns: headers.length
        });
        
        setPreviewData(preview);
      }
    };
    
    reader.readAsText(file);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleProcessData = () => {
    setProcessingStatus('Processing');
    setProcessingProgress(0);
    
    // Simulate processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setProcessingStatus('Completed');
          setIsProcessed(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleDownload = (type: 'cleaned' | 'fake') => {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Simulate download
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleMissingValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCleaningOptions({
      ...cleaningOptions,
      missingValues: e.target.value
    });
  };

  const handleToggleChange = (option: 'removeDuplicates' | 'standardizeFormats') => {
    setCleaningOptions({
      ...cleaningOptions,
      [option]: !cleaningOptions[option as keyof typeof cleaningOptions]
    });
  };

  useEffect(() => {
    if (chartRef.current && isProcessed) {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      const chart = echarts.init(chartRef.current);
      chartInstance.current = chart;
      
      const option = {
        animation: false,
        title: {
          text: 'Data Quality Analysis',
          left: 'center'
        },
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: 'Data Quality',
            type: 'pie',
            radius: '60%',
            data: [
              { value: 93, name: 'Complete' },
              { value: 5, name: 'Missing Values' },
              { value: 2, name: 'Duplicates' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
      
      chart.setOption(option);
      
      const handleResize = () => {
        chart.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [isProcessed]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-broom text-blue-600 text-2xl mr-2"></i>
          <h1 className="text-xl font-bold text-gray-800">FakeCleaner</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-800 cursor-pointer">
            <i className="fas fa-moon text-lg"></i>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-300 ease-in-out !rounded-button whitespace-nowrap">
            <i className="fas fa-question-circle mr-2"></i>
            Help
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Upload Section */}
        {!file && (
          <div 
            className={`mt-8 border-2 border-dashed ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ease-in-out`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv" 
              onChange={handleFileInputChange} 
            />
            <div className="flex flex-col items-center justify-center">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <i className="fas fa-cloud-upload-alt text-blue-600 text-4xl"></i>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Drag & Drop CSV file here</h2>
              <p className="text-gray-500 mb-4">or</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition duration-300 ease-in-out !rounded-button whitespace-nowrap">
                Browse Files
              </button>
              <p className="text-sm text-gray-500 mt-4">Supported file type: CSV</p>
            </div>
          </div>
        )}

        {/* File Information Panel */}
        {file && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">File Information</h2>
                
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-file-csv text-blue-600 mr-2"></i>
                    <span className="font-medium text-gray-700">File Name:</span>
                  </div>
                  <p className="text-gray-600 ml-6">{fileInfo?.name}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-weight text-blue-600 mr-2"></i>
                    <span className="font-medium text-gray-700">File Size:</span>
                  </div>
                  <p className="text-gray-600 ml-6">{fileInfo?.size}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-table text-blue-600 mr-2"></i>
                    <span className="font-medium text-gray-700">Rows:</span>
                  </div>
                  <p className="text-gray-600 ml-6">{fileInfo?.rows}</p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-columns text-blue-600 mr-2"></i>
                    <span className="font-medium text-gray-700">Columns:</span>
                  </div>
                  <p className="text-gray-600 ml-6">{fileInfo?.columns}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Preview</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {previewData[0]?.map((header, index) => (
                          <th 
                            key={index}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td 
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cleaning Options Dashboard */}
        {file && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Cleaning Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-clone text-blue-600 mr-2"></i>
                      <h3 className="font-medium text-gray-700">Remove Duplicates</h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={cleaningOptions.removeDuplicates}
                        onChange={() => handleToggleChange('removeDuplicates')}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">Estimated duplicates: <span className="font-medium text-blue-600">24 rows</span></p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center mb-4">
                    <i className="fas fa-exclamation-triangle text-blue-600 mr-2"></i>
                    <h3 className="font-medium text-gray-700">Handle Missing Values</h3>
                  </div>
                  <select 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={cleaningOptions.missingValues}
                    onChange={handleMissingValueChange}
                  >
                    <option value="mean">Replace with Mean</option>
                    <option value="median">Replace with Median</option>
                    <option value="mode">Replace with Mode</option>
                    <option value="remove">Remove Rows</option>
                    <option value="zero">Replace with Zero</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-magic text-blue-600 mr-2"></i>
                      <h3 className="font-medium text-gray-700">Standardize Formats</h3>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={cleaningOptions.standardizeFormats}
                        onChange={() => handleToggleChange('standardizeFormats')}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">Standardize dates, numbers, and text formats</p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-4">
                <button className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg transition duration-300 ease-in-out !rounded-button whitespace-nowrap">
                  Preview Changes
                </button>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition duration-300 ease-in-out !rounded-button whitespace-nowrap"
                  onClick={handleProcessData}
                >
                  Process Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Status Section */}
        {processingStatus && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Processing Status</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20" viewBox="0 0 100 100">
                      <circle 
                        className="text-gray-200" 
                        strokeWidth="8" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                      />
                      <circle 
                        className="text-blue-600" 
                        strokeWidth="8" 
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (processingProgress / 100) * 251.2} 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="40" 
                        cx="50" 
                        cy="50" 
                      />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-700">{processingProgress}%</span>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <h3 className="font-medium text-gray-700 mb-1">
                      {processingStatus === 'Completed' ? 'Processing Complete' : 'Processing Data'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {processingStatus === 'Completed' 
                        ? 'Your data has been processed successfully' 
                        : 'Estimated time remaining: 10 seconds'}
                    </p>
                  </div>
                </div>
                
                {processingStatus !== 'Completed' && (
                  <button className="text-red-600 hover:text-red-700 font-medium cursor-pointer !rounded-button whitespace-nowrap">
                    <i className="fas fa-times-circle mr-2"></i>
                    Cancel
                  </button>
                )}
              </div>
              
              {processingStatus === 'Processing' && (
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span className="text-sm text-gray-600">Reading file data</span>
                    </div>
                    <div className="flex items-center">
                      <i className={`fas ${processingProgress >= 30 ? 'fa-check-circle text-green-500' : 'fa-circle text-gray-300'} mr-2`}></i>
                      <span className="text-sm text-gray-600">Analyzing data structure</span>
                    </div>
                    <div className="flex items-center">
                      <i className={`fas ${processingProgress >= 60 ? 'fa-check-circle text-green-500' : 'fa-circle text-gray-300'} mr-2`}></i>
                      <span className="text-sm text-gray-600">Applying cleaning operations</span>
                    </div>
                    <div className="flex items-center">
                      <i className={`fas ${processingProgress >= 90 ? 'fa-check-circle text-green-500' : 'fa-circle text-gray-300'} mr-2`}></i>
                      <span className="text-sm text-gray-600">Generating fake data</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Display */}
        {isProcessed && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'cleaned'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } cursor-pointer whitespace-nowrap`}
                    onClick={() => setActiveTab('cleaned')}
                  >
                    Cleaned Data
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'fake'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } cursor-pointer whitespace-nowrap`}
                    onClick={() => setActiveTab('fake')}
                  >
                    Fake Data
                  </button>
                </nav>
              </div>
              
              <div className="mt-6">
                {activeTab === 'cleaned' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-4">Cleaned Data Preview</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {previewData[0]?.map((header, index) => (
                                <th 
                                  key={index}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.slice(1).map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                  <td 
                                    key={cellIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Showing 4 of {fileInfo?.rows} rows
                        </div>
                        <div className="flex space-x-2">
                          <button className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer !rounded-button whitespace-nowrap">
                            Previous
                          </button>
                          <button className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer !rounded-button whitespace-nowrap">
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                      <h3 className="font-medium text-gray-700 mb-4">Data Quality Analysis</h3>
                      <div ref={chartRef} className="w-full h-64"></div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-700 mb-3">Changes Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Duplicates Removed</span>
                            <span className="text-sm font-medium text-gray-700">24</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Missing Values Handled</span>
                            <span className="text-sm font-medium text-gray-700">37</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Formats Standardized</span>
                            <span className="text-sm font-medium text-gray-700">15</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <h3 className="font-medium text-gray-700 mb-4">Fake Data Preview</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {previewData[0]?.map((header, index) => (
                                <th 
                                  key={index}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {/* Fake data rows - would be generated in a real app */}
                            {Array(4).fill(0).map((_, rowIndex) => (
                              <tr key={rowIndex}>
                                {previewData[0]?.map((_, cellIndex) => (
                                  <td 
                                    key={cellIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {cellIndex === 0 ? `Sample ${rowIndex + 1}` : `Value ${rowIndex + 1}-${cellIndex}`}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Showing 4 of 100 generated rows
                        </div>
                        <div className="flex space-x-2">
                          <button className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer !rounded-button whitespace-nowrap">
                            Previous
                          </button>
                          <button className="border border-gray-300 rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer !rounded-button whitespace-nowrap">
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                      <h3 className="font-medium text-gray-700 mb-4">Fake Data Settings</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Rows to Generate
                          </label>
                          <input 
                            type="number" 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data Distribution
                          </label>
                          <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Similar to Original</option>
                            <option>Normal Distribution</option>
                            <option>Random Distribution</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Include Outliers
                          </label>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">Yes</span>
                          </label>
                        </div>
                        
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-300 ease-in-out mt-4 !rounded-button whitespace-nowrap">
                          Regenerate Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Download Section */}
        {isProcessed && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <i className="fas fa-file-download text-blue-600 text-xl"></i>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-800">Download Cleaned Data</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Format
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>CSV (.csv)</option>
                  <option>Excel (.xlsx)</option>
                  <option>JSON (.json)</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>File size: approximately {fileInfo?.size}</p>
              </div>
              
              {isDownloading ? (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Downloading... {downloadProgress}%</span>
                    <button className="text-red-600 hover:text-red-700 cursor-pointer !rounded-button whitespace-nowrap">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-300 ease-in-out !rounded-button whitespace-nowrap"
                  onClick={() => handleDownload('cleaned')}
                >
                  <i className="fas fa-download mr-2"></i>
                  Download Cleaned Data
                </button>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <i className="fas fa-magic text-purple-600 text-xl"></i>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-gray-800">Download Fake Data</h3>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Format
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>CSV (.csv)</option>
                  <option>Excel (.xlsx)</option>
                  <option>JSON (.json)</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                <p>File size: approximately 1.2 MB</p>
              </div>
              
              {isDownloading ? (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Downloading... {downloadProgress}%</span>
                    <button className="text-red-600 hover:text-red-700 cursor-pointer !rounded-button whitespace-nowrap">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-sm transition duration-300 ease-in-out !rounded-button whitespace-nowrap"
                  onClick={() => handleDownload('fake')}
                >
                  <i className="fas fa-download mr-2"></i>
                  Download Fake Data
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <i className="fas fa-broom text-blue-400 text-2xl mr-2"></i>
                <h2 className="text-xl font-bold">FakeCleaner</h2>
              </div>
              <p className="text-gray-400 text-sm">
                A powerful tool for cleaning and generating fake data for testing and development purposes.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <i className="fas fa-check text-blue-400 mr-2"></i>
                  Data Cleaning
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-blue-400 mr-2"></i>
                  Fake Data Generation
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-blue-400 mr-2"></i>
                  Format Standardization
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-blue-400 mr-2"></i>
                  Data Quality Analysis
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition duration-200 cursor-pointer">Documentation</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition duration-200 cursor-pointer">API Reference</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition duration-200 cursor-pointer">Tutorials</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition duration-200 cursor-pointer">Blog</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <i className="fas fa-envelope text-blue-400 mr-2"></i>
                  support@fakecleaner.com
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone text-blue-400 mr-2"></i>
                  +1 (555) 123-4567
                </li>
              </ul>
              
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition duration-200 cursor-pointer">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-200 cursor-pointer">
                  <i className="fab fa-github text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition duration-200 cursor-pointer">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 FakeCleaner. All rights reserved.
            </p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-200 cursor-pointer">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-200 cursor-pointer">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition duration-200 cursor-pointer">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
