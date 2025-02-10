import React, { useMemo, FC } from 'react';
import BackgroundItem from '../../assets/backgroundItem.svg'; 
import styles from '../../styles/ShapedBackground.module.css'; 

const AnimatedBackground: FC = () => {
  const shapes = useMemo(() => {
    const colors = ['#925FFF', '#fb3640', '#1fd9ad'];

    return Array.from({ length: 10 }).map((_, index) => {
      const size = Math.floor(Math.random() * 50 + 20);
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const rotate = Math.random() * 360;

      const flipX = Math.random() > 0.5 ? 'scaleX(-1)' : '';
      const flipY = Math.random() > 0.5 ? 'scaleY(-1)' : '';

      return (
        <div
          key={index}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            position: 'absolute',
            top: `${top}%`,
            left: `${left}%`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${rotate}deg) ${flipX} ${flipY}`,
          }}
        >
          <BackgroundItem 
            fill={color} 
            className={styles.shape} 
            width={size} 
            height={size} 
          />
        </div>
      );
    });
  }, []);

  return <div className={styles.background}>{shapes}</div>;
};

export default AnimatedBackground;