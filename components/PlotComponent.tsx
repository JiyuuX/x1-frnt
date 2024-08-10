// components/PlotComponent.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js-dist';

interface PlotComponentProps {
  data: Plotly.Data[];
  layout: Partial<Plotly.Layout>;
  config: Partial<Plotly.Config>;
  onRelayout: (event: any) => void;
}

const PlotComponent: React.FC<PlotComponentProps> = ({ data, layout, config, onRelayout }) => {
  return (
    <Plot
      data={data}
      layout={layout}
      config={config}
      onRelayout={onRelayout}
      useResizeHandler={true}
      className="w-full h-full"
    />
  );
};

export default PlotComponent;
