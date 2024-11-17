'use client';

import { FormEvent, useState } from "react";

export default function Home() {
  const [glyphsOption, setGlyphsOption] = useState<'allGlyphs' | 'selectedGlyphs'>('allGlyphs');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGlyphs, setSelectedGlyphs] = useState('');
  const [errors, setErrors] = useState<{
    file?: string;
    glyphs?: string;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    size: '',
    minSize: '',
    emRange: '',
    pxRange: '2', // default value
    aemRange: { outermost: '', innermost: '' },
    apxRange: { outermost: '', innermost: '' },
    pxAlign: 'vertical', // default value
    emPadding: '',
    pxPadding: '',
    outerEmPadding: '',
    outerPxPadding: '',
    aemPadding: { left: '', bottom: '', right: '', top: '' },
    apxPadding: { left: '', bottom: '', right: '', top: '' },
    aouterEmPadding: { left: '', bottom: '', right: '', top: '' },
    aouterPxPadding: { left: '', bottom: '', right: '', top: '' },
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const updateConfig = (path: string, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const parts = path.split('.');
      let current: Record<string, unknown> = newConfig;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = value;
      return newConfig;
    });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    
    // Reset errors
    setErrors({});
    setUploadError(null);
    const newErrors: {file?: string; glyphs?: string} = {};

    // Validate file
    if (!selectedFile) {
      newErrors.file = 'Please select a font file';
    } else if (!selectedFile.name.match(/\.(ttf|otf)$/)) {
      newErrors.file = 'Please select a valid font file (.ttf or .otf)';
    }

    // Validate glyphs if selectedGlyphs option is chosen
    if (glyphsOption === 'selectedGlyphs' && !selectedGlyphs.trim()) {
      newErrors.glyphs = 'Please enter at least one glyph';
    }

    // If there are errors, set them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Proceed with upload
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      
      // Add the file
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // Add glyphs configuration
      formData.append('glyphsOption', glyphsOption);
      if (glyphsOption === 'selectedGlyphs') {
        formData.append('selectedGlyphs', selectedGlyphs);
      }

      // Add all config values, handling nested objects
      Object.entries(config).forEach(([key, value]) => {
        if (typeof value === 'object') {
          // For nested objects, stringify them
          formData.append(key, JSON.stringify(value));
        } else if (value !== '') { // Only append if value is not empty
          formData.append(key, value.toString());
        }
      });

      // Log FormData contents for debugging
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await fetch('https://msdf-api.kansei.graphics/api/generate', {
        method: 'POST',
        body: formData,
        // Remove the Content-Type header - browser will set it automatically with boundary
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload file');
      }

      const data = await response.json();
      
      // Download the arfont file
      if (data.output.font) {
        setIsDownloading(true);
        const fontResponse = await fetch(data.output.font);
        const blob = await fontResponse.blob();
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = data.output.font.split('/').pop() || 'font.arfont';
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        setIsDownloading(false);
      }

      console.log('Upload and download successful');
      
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      setIsDownloading(false);
    }
  }

  // Update the input and select classes to include dark background styles
  const inputClasses = `bg-gray-800 border ${errors.file ? 'border-red-500' : 'border-gray-700'} rounded-md p-2 text-white`;
  const selectClasses = "bg-gray-800 border border-gray-700 rounded-md p-2 pe-10 text-white appearance-none";

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center sm:items-start max-w-4xl mx-auto">
        <div className="flex flex-col gap-2 text-2xl font-bold">MSDF ARFont Generator</div>
        <div className="flex-col gap-2">
          This is a tool to generate MSDF Artery fonts from a font file. It uses the{" "}
          <a 
            href="https://github.com/Chlumsky/msdf-atlas-gen"
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            msdf-atlas-gen tool
          </a>
          {" "}to generate the atlas and then the msdf-bmfont tool to generate the font files.
        </div>
        
        <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
          {uploadError && (
            <div className="text-red-500 text-sm">{uploadError}</div>
          )}
          <div className="flex flex-col gap-1">
            <input 
              className={inputClasses}
              type="file" 
              accept=".ttf,.otf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            {errors.file && (
              <span className="text-red-500 text-sm">{errors.file}</span>
            )}
          </div>

          <div className="border border-gray-700 rounded-md p-4 bg-gray-900">
            <h3 className="text-lg font-semibold mb-4 text-white">Glyph Configuration</h3>
            
            {/* Glyphs Selection */}
            <div className="mb-4">
              <div className="flex flex-row gap-2">
                <select 
                  className={selectClasses}
                  value={glyphsOption}
                  onChange={(e) => setGlyphsOption(e.target.value as 'allGlyphs' | 'selectedGlyphs')}
                >
                  <option value="allGlyphs">All glyphs</option>
                  <option value="basicGlyphs">Basic glyphs</option>
                  <option value="selectedGlyphs">Selected glyphs</option>
                </select>
              </div>

              {glyphsOption === 'selectedGlyphs' && (
                <div className="flex flex-col gap-1">
                  <input 
                    className={`bg-gray-800 border ${errors.glyphs ? 'border-red-500' : 'border-gray-700'} rounded-md p-2 text-white`}
                    type="text" 
                    placeholder="Enter glyphs (e.g., ABC123!@#)"
                    value={selectedGlyphs}
                    onChange={(e) => setSelectedGlyphs(e.target.value)}
                  />
                  {errors.glyphs && (
                    <span className="text-red-500 text-sm">{errors.glyphs}</span>
                  )}
                </div>
              )}
            </div>

            {/* Basic Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Left Column - Basic Settings */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-300">
                  Size (pixels per em)
                  <input
                    type="number"
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                    value={config.size}
                    onChange={(e) => updateConfig('size', e.target.value)}
                    placeholder="Em size"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Minimum Size
                  <input
                    type="number"
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                    value={config.minSize}
                    onChange={(e) => updateConfig('minSize', e.target.value)}
                    placeholder="Minimum em size"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Em Range
                  <input
                    type="number"
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                    value={config.emRange}
                    onChange={(e) => updateConfig('emRange', e.target.value)}
                    placeholder="Distance field range in em's"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Pixel Range
                  <input
                    type="number"
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                    value={config.pxRange}
                    onChange={(e) => updateConfig('pxRange', e.target.value)}
                    placeholder="Distance field range in pixels"
                  />
                </label>

                <label className="text-sm text-gray-300">
                  Pixel Alignment
                  <select
                    className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                    value={config.pxAlign}
                    onChange={(e) => updateConfig('pxAlign', e.target.value)}
                  >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </label>
              </div>

              {/* Right Column - Range Settings */}
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-gray-300">
                  Asymmetric Em Range
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                      value={config.aemRange.outermost}
                      onChange={(e) => updateConfig('aemRange.outermost', e.target.value)}
                      placeholder="Outermost"
                    />
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                      value={config.aemRange.innermost}
                      onChange={(e) => updateConfig('aemRange.innermost', e.target.value)}
                      placeholder="Innermost"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Padding Settings Section */}
            <div className="border border-gray-700 rounded-md p-4 bg-gray-800">
              <h4 className="text-md font-semibold mb-4 text-white">Padding Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - Basic Em Padding */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">
                    Em Padding
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                      value={config.emPadding}
                      onChange={(e) => updateConfig('emPadding', e.target.value)}
                      placeholder="Padding in em's"
                    />
                  </label>

                  <label className="text-sm text-gray-300">
                    Outer Em Padding
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                      value={config.outerEmPadding}
                      onChange={(e) => updateConfig('outerEmPadding', e.target.value)}
                      placeholder="Outer padding in em's"
                    />
                  </label>
                </div>

                {/* Right Column - Basic Pixel Padding */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">
                    Pixel Padding
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                      value={config.pxPadding}
                      onChange={(e) => updateConfig('pxPadding', e.target.value)}
                      placeholder="Padding in pixels"
                    />
                  </label>

                  <label className="text-sm text-gray-300">
                    Outer Pixel Padding
                    <input
                      type="number"
                      className="bg-gray-800 border border-gray-700 rounded-md p-2 w-full text-white mt-1"
                      value={config.outerPxPadding}
                      onChange={(e) => updateConfig('outerPxPadding', e.target.value)}
                      placeholder="Outer padding in pixels"
                    />
                  </label>
                </div>
              </div>

              {/* Advanced Padding Settings - Initially Hidden */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-300">Advanced Padding Settings</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Asymmetric Em Padding */}
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-300">
                      Asymmetric Em Padding
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {['left', 'bottom', 'right', 'top'].map(side => (
                          <input
                            key={side}
                            type="number"
                            className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                            value={config.aemPadding[side as keyof typeof config.aemPadding]}
                            onChange={(e) => updateConfig(`aemPadding.${side}`, e.target.value)}
                            placeholder={side.charAt(0).toUpperCase() + side.slice(1)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Asymmetric Pixel Padding */}
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-300">
                      Asymmetric Pixel Padding
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {['left', 'bottom', 'right', 'top'].map(side => (
                          <input
                            key={side}
                            type="number"
                            className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                            value={config.apxPadding[side as keyof typeof config.apxPadding]}
                            onChange={(e) => updateConfig(`apxPadding.${side}`, e.target.value)}
                            placeholder={side.charAt(0).toUpperCase() + side.slice(1)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed" 
            type="submit"
            disabled={isUploading || isDownloading}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            ) : isDownloading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </div>
            ) : (
              'Generate Font'
            )}
          </button>
        </form>
      </main>
      <footer className="mt-8 flex gap-6 flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
