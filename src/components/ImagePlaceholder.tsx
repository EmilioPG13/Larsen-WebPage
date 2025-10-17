import React from 'react';

interface ImagePlaceholderProps {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
  icon?: string;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ 
  width = 400, 
  height = 300, 
  text = "Imagen próximamente",
  className = "",
  icon = "🖼️"
}) => {
  return (
    <div 
      className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="text-center">
        <div className="text-4xl mb-2 opacity-50">{icon}</div>
        <p className="text-gray-500 font-medium text-sm">{text}</p>
      </div>
    </div>
  );
};

export default ImagePlaceholder;
