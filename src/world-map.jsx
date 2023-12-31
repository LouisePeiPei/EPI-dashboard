import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  ZoomableGroup,
  Geographies,
  Geography,
} from 'react-simple-maps';
import Papa from 'papaparse';
import { scaleLinear } from 'd3-scale';
import { interpolateRdYlGn, interpolateRdYlBu } from 'd3-scale-chromatic';


const WorldMap = () => {
  const [co2Data, setCO2Data] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2008'); // Default selected year
  const [selectedCSV, setSelectedCSV] = useState('per-capita-emissions.csv'); // Default selected CSV

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        const response = await fetch(`data/${selectedCSV}`);
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);

        // Parse CSV data using PapaParse with header: true to treat the first row as headers
        const parsedData = Papa.parse(csv, { header: true });

        // Set the parsed data to state
        setCO2Data(parsedData.data);
      } catch (error) {
        console.error('Error fetching or parsing data:', error);
      }
    };

    fetchCSVData();
  }, [selectedCSV]);

  const [selectedColorSystem, setSelectedColorSystem] = useState('redGreen');

  // New function to get color scale based on the selected color system
  const getColorScale = () => {
    const co2Values = co2Data
        .map((item) => parseFloat(item[selectedYear]))
        .filter((value) => !isNaN(value));

    const minValue = Math.min(...co2Values);
    const maxValue = Math.max(...co2Values);

    // Color scales for red/green and blue/white systems
    const colorScales = {
      redGreen: scaleLinear().domain([minValue, maxValue]).range([interpolateRdYlGn(0), interpolateRdYlGn(1)]),
      blueWhite: scaleLinear().domain([minValue, maxValue]).range(['blue', 'white']), // Update the color range for blue/white
    };

    // Return the appropriate color scale based on the selectedColorSystem state
    return colorScales[selectedColorSystem];
  };

  const getFillColor = (countryName) => {
    // Find CO2 emission data for the current country by name and selected year
    const countryCO2 = co2Data.find((item) => item['country'] === countryName);

    if (!countryCO2 || isNaN(parseFloat(countryCO2[selectedYear]))) {
      console.warn(`No or invalid CO2 data found for ${countryName}`);
      return '#D3D3D3'; // Fallback color for countries without CO2 data or invalid values (grey color)
    }

    const co2Value = parseFloat(countryCO2[selectedYear]);

    const colorScale = getColorScale();
    // Get color from the color scale based on CO2 value
    return colorScale(co2Value);
  };


  const handleColorSystemChange = (event) => {
    setSelectedColorSystem(event.target.value);
  };

  // Options for color system selection
  const colorSystemOptions = [
    { value: 'redGreen', label: 'Red/Green' },
    { value: 'blueWhite', label: 'Blue/White' },
  ];


  // Dropdown selector for choosing color system
  const colorSystemSelector = (
      <select value={selectedColorSystem} onChange={handleColorSystemChange}>
        {colorSystemOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
        ))}
      </select>
  );

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const handleCSVChange = (event) => {
    setSelectedCSV(event.target.value);
  };

  const yearOptions = [];
  for (let year = 1750; year <= 2019; year++) {
    yearOptions.push(
        <option key={year} value={year.toString()}>
          {year}
        </option>
    );
  }

  const csvOptions = [
    { value: 'per-capita-emissions.csv', label: 'Per Capita Emissions' },
    { value: 'country-data.csv', label: 'Coming soon' },
  ];

  const csvSelector = (
      <select value={selectedCSV} onChange={handleCSVChange}>
        {csvOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
        ))}
      </select>
  );

  const [tooltipContent, setTooltipContent] = useState(null);

// Function to handle mouse enter event
  const handleMouseEnter = (geo, e) => {
    const { name } = geo.properties;
    setTooltipContent(name);
  };

// Function to handle mouse leave event
  const handleMouseLeave = () => {
    setTooltipContent(null);
  };


  return (
      <div style={{ width: '100%', height: '100vh', textAlign: 'center' }}>
        <div style={{ marginBottom: '10px' }}>
          {/* Add CSV selector */}
          {csvSelector}
          {colorSystemSelector}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span style={{ marginRight: '10px' }}>1750</span>
          {/* Replace select with range input */}
          <input
              type="range"
              min="1750"
              max="2019"
              value={selectedYear}
              onChange={handleYearChange}
              style={{ width: '80%', display: 'inline-block' }}
          />
          <span style={{ marginLeft: '10px' }}>2019</span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <p>Selected Year: {selectedYear}</p>
        </div>
        <ComposableMap
            projection="geoMercator"
            projectionConfig={{}}
            style={{ width: '100%', height: 'calc(100% - 80px)' }}
        >
          <ZoomableGroup>
            <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
              {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryName = geo.properties.name;

                    let fillColor = getFillColor(countryName);

                    return (
                        <React.Fragment key={geo.rsmKey}>
                          <Geography
                              geography={geo}
                              onMouseEnter={(e) => handleMouseEnter(geo, e)}
                              onMouseLeave={handleMouseLeave}
                              fill={fillColor}
                              stroke="#D6D6DA"
                          />
                          {tooltipContent === countryName && geo.centroid && ( // Added a check for geo.centroid
                              <text
                                  x={geo.centroid[0]}
                                  y={geo.centroid[1]}
                                  style={{ fontFamily: 'Arial', fontSize: 12, pointerEvents: 'none' }}
                                  textAnchor="middle"
                                  fill="#333"
                              >
                                {countryName}
                              </text>
                          )}
                        </React.Fragment>
                    );
                  })
              }
            </Geographies>

          </ZoomableGroup>
        </ComposableMap>
      </div>
  );
};

export default WorldMap;