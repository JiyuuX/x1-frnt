'use client'
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Plot from 'react-plotly.js';
import { toast } from 'react-toastify';
import Plotly from 'plotly.js-dist';

// Define the type for plot data
interface PlotDataItem {
  Label: string;
  X: string;
  Y: string;
  Size: string;
  Color: string;
}

const ProjectMapPage = () => {
  const params = useParams();
  const projectTitle = decodeURIComponent(params.projectTitle as string);

  const [data, setData] = useState<PlotDataItem[]>([]);
  const [labelSize, setLabelSize] = useState(12);
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1);
  const [shapeColor, setShapeColor] = useState('#FFFFFF'); // Defaulting to white
  const [backgroundColor, setBackgroundColor] = useState('black'); // Defaulting to black
  const [labelColor, setLabelColor] = useState('#FFFFFF'); // Defaulting to white
  const [shapes, setShapes] = useState<Plotly.Shape[]>([]);
  const [shapeHistory, setShapeHistory] = useState<Plotly.Shape[][]>([]);
  const [dragMode, setDragMode] = useState<'pan' | 'select'>('pan');
  const [userEmail, setUserEmail] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [searchLabel, setSearchLabel] = useState('');
  const [highlightedLabel, setHighlightedLabel] = useState<string | null>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const toggleSettings = () => {
    setIsSettingsVisible(!isSettingsVisible);
  };

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/users/me/', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        } else {
          throw new Error('Failed to fetch user email');
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/user-project-data/${encodeURIComponent(projectTitle)}/`);
        if (!response.ok) {
          throw new Error('API request failed');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error fetching data');
      }
    };

    fetchData();
  }, [projectTitle]);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/get-csrf-token/', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } else {
          throw new Error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        toast.error('Error fetching CSRF token');
      }
    };

    fetchCsrfToken();
  }, []);

  const fetchShapes = async () => {
    try {
      const encodedProjectTitle = encodeURIComponent(projectTitle);
      const encodedUserEmail = encodeURIComponent(userEmail);
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/load-shapes/${encodedProjectTitle}/?userEmail=${encodedUserEmail}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const shapesData = await response.json();
        setShapes(shapesData);
        toast.success("Shapes fetched successfully");
      } else {
        throw new Error('Failed to fetch shapes');
      }
    } catch (error) {
      console.error('Error fetching shapes:', error);
    }
  };
  

  useEffect(() => {
    fetchShapes();
  }, [projectTitle, userEmail]);

  const plotData: Plotly.Data[] = data.map(item => {
    const isHighlighted = 
      highlightedLabel === null || 
      (item.Label && highlightedLabel && item.Label.toLowerCase() === highlightedLabel.toLowerCase());
  
    const textColor = isHighlighted ? labelColor : '#333333'; // Use labelColor instead of a hardcoded value
  
    return {
      type: 'scatter',
      mode: 'markers+text',
      text: [item.Label || ''],  // Label boşsa en azından boş bir string veriyoruz
      textposition: 'top center',
      textfont: { size: labelSize, color: textColor },
      x: [parseFloat(item.X) || 0],  // x değeri undefined ise 0 veriyoruz
      y: [parseFloat(item.Y) || 0],  // y değeri undefined ise 0 veriyoruz
      marker: {
        size: (parseFloat(item.Size) || 0) * 200 * nodeSizeMultiplier,  // size değeri undefined ise 0 veriyoruz
        color: item.Color || '#000000',  // color değeri undefined ise siyah veriyoruz
        opacity: isHighlighted ? 1 : 0.1, // Opacity logic
      },
    };
  });
  

  const layout: Partial<Plotly.Layout> = {
    showlegend: false,
    xaxis: {
      range: [0, 1],
      title: 'X Axis',
      color: labelColor, // Update X-axis color
    },
    yaxis: {
      range: [0, 1],
      title: 'Y Axis',
      color: labelColor, // Update Y-axis color
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
    plot_bgcolor: backgroundColor, // Use backgroundColor
    shapes: shapes as Plotly.Shape[],
    dragmode: dragMode,
    newshape: {
      line: {
        color: shapeColor,
        width: 2,
      },
    },
    uirevision: data.length, // Burada data.length gibi bir değere göre `uirevision` güncelleniyor
  };

  const plotConfig: Partial<Plotly.Config> = {
    scrollZoom: true,
    displaylogo:false,
    modeBarButtonsToAdd: [
      'drawline' as any,  
      'drawopenpath' as any,
      'drawclosedpath' as any,
      'drawcircle' as any,
      'drawrect' as any,
      'eraseshape' as any
    ],
  };

  const handleRelayout = (event: any) => {
    const updatedDragMode = event.dragmode || dragMode;
    setDragMode(updatedDragMode);

    if (event.shapes) {
      const updatedShapes = event.shapes;
      setShapes(updatedShapes);
      setShapeHistory([...shapeHistory, updatedShapes]);
    }
  };

  const undoLastShape = () => {
    if (shapeHistory.length > 0) {
      const newShapeHistory = shapeHistory.slice(0, -1);
      setShapes(newShapeHistory[newShapeHistory.length - 1] || []);
      setShapeHistory(newShapeHistory);
    }
  };

  useEffect(() => {
    const handleUndo = (event: any) => {
      if (event.ctrlKey && event.key === 'z') {
        undoLastShape();
      }
    };

    window.addEventListener('keydown', handleUndo);

    return () => {
      window.removeEventListener('keydown', handleUndo);
    };
  }, [shapeHistory]);

  useEffect(() => {
    const handleDelete = (event: any) => {
      if (event.key === 'Delete') {
        undoLastShape();
      }
    };

    window.addEventListener('keydown', handleDelete);

    return () => {
      window.removeEventListener('keydown', handleDelete);
    };
  }, [shapeHistory]);

  const saveShapes = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/save-shapes/${encodeURIComponent(projectTitle)}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          userEmail: userEmail,
          shapes: shapes,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Shapes saved successfully');
      } else {
        throw new Error('Failed to save shapes');
      }
    } catch (error) {
      console.error('Error saving shapes:', error);
      toast.error('Error saving shapes');
    }
  };

  const searchLabelHandler = async () => {
    if (searchLabel.trim() === '') {
      setHighlightedLabel(null);
      toast.error('Label is empty');
    } else {
      const foundItem = data.find(item => 
        item.Label &&
        searchLabel &&
        item.Label.toLowerCase() === searchLabel.toLowerCase()
      );

      if (foundItem) {
        setHighlightedLabel(searchLabel);
      } else {
        // Eğer etiket bulunamazsa Django'ya istek gönder
        try {
          const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/search-label/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ label: searchLabel }),
            credentials: 'include',
          });

          if (response.ok) {
            const result = await response.json();
            if (result.length > 0) {
              // Gelen verinin formatını kontrol et
              const formattedResult = result.map((item: any) => ({
                Label: item.label,
                X: item.x.toFixed(2),
                Y: item.y.toFixed(2),
                Size: item.size.toFixed(2),
                Color: item.color || 'red', // Varsayılan renk
              }));
              setData(prevData => [...prevData, ...formattedResult]); // Gelen veriyi mevcut dataya ekle
              setHighlightedLabel(searchLabel);
              toast.success('Label found and added to the plot');
            } else {
              toast.error('Label Does Not Exist in Database');
            }
          } else {
            throw new Error('API request failed');
          }
        } catch (error) {
          console.error('Error fetching label from database:', error);
          toast.error('Error fetching label from database');
        }
      }
    }
  };
  
  return (
    <div className="absolute w-full h-full flex">
      <div className="absolute inset-0">
        <Plot
          data={plotData}
          layout={layout}
          config={plotConfig}
          onRelayout={handleRelayout}
          useResizeHandler={true}
          className="w-full h-full"
        />
      </div>
      <div className="absolute top-0 left-0 p-4 text-white">
        <h1 className="text-lg font-bold">Project: {projectTitle}</h1>
      </div>

      <div className="absolute bottom-0 left-0 p-4 flex flex-col items-start">
        <button
          onClick={toggleSettings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isSettingsVisible ? 'Hide Settings' : 'Show Settings'}
        </button>

        {isSettingsVisible && (
          <div className="mt-4 p-4 bg-gray-900 bg-opacity-80 rounded-lg shadow-lg w-80">
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Label Size:</label>
              <input
                type="range"
                min="10"
                max="30"
                value={labelSize}
                onChange={(e) => setLabelSize(parseInt(e.target.value))}
                className="w-full bg-gray-700 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Node Size Multiplier:</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={nodeSizeMultiplier}
                onChange={(e) => setNodeSizeMultiplier(parseFloat(e.target.value))}
                className="w-full bg-gray-700 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Shape Color:</label>
              <input
                type="color"
                value={shapeColor}
                onChange={(e) => setShapeColor(e.target.value)}
                className="w-full p-1 border border-gray-600 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Background Color:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full p-1 border border-gray-600 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Label Color:</label>
              <input
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                className="w-full p-1 border border-gray-600 rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-medium mb-1">Search Label:</label>
              <input
                type="text"
                value={searchLabel}
                onChange={(e) => setSearchLabel(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={searchLabelHandler}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Search
              </button>
              <button
                onClick={saveShapes}
                className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md transition hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Save Shapes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMapPage;
