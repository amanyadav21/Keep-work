
declare module 'react-masonry-css' {
  import * as React from 'react';

  export interface MasonryProps {
    breakpointCols: number | Record<string, number>;
    className?: string;
    columnClassName?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    columnAttrs?: object;
    elementType?: string;
  }

  const Masonry: React.FC<MasonryProps>;
  export default Masonry;
}
