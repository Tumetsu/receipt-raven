import { Box, styled, keyframes } from '@mui/material';
import { ReactElement, useEffect, useState } from 'react';
// Based on https://codepen.io/haniotis/pen/KwvYLO

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const stroke = keyframes`
  100% {
    stroke-dashoffset: 0;
  }
`;

const scale = keyframes`
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
`;

const AnimationContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'shouldFadeOut',
})<{ shouldFadeOut?: boolean }>(({ shouldFadeOut }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 9999,
  animation: `${shouldFadeOut ? fadeOut : fadeIn} ${shouldFadeOut ? '0.2s' : '0.3s'} ease-in-out`,
}));

const createFillAnimation = (size: number) => keyframes`
  100% {
    box-shadow: inset 0 0 0 ${size * 0.6}px #7ac142;
  }
`;

const StyledSvg = styled('svg')<{ size: number }>(({ size }) => ({
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: '50%',
  display: 'block',
  strokeWidth: 2,
  stroke: '#fff',
  strokeMiterlimit: 10,
  boxShadow: 'inset 0 0 0 #7ac142',
  animation: `${createFillAnimation(size)} 0.4s ease-in-out 0.4s forwards, ${scale} 0.3s ease-in-out 0.9s both`,
}));

const Circle = styled('circle')({
  strokeDasharray: 166,
  strokeDashoffset: 166,
  strokeWidth: 2,
  strokeMiterlimit: 10,
  stroke: '#7ac142',
  fill: 'none',
  animation: `${stroke} 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards`,
});

const Check = styled('path')({
  transformOrigin: '50% 50%',
  strokeDasharray: 48,
  strokeDashoffset: 48,
  animation: `${stroke} 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards`,
});

interface CheckmarkAnimationProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number; // Total duration in ms before fade out (after animation completes)
  size?: number; // Size of the checkmark in pixels
}

export function CheckmarkAnimation({
  show,
  onComplete,
  duration = 1200,
  size = 56,
}: CheckmarkAnimationProps): ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShouldFadeOut(false);

      // Animation completes at ~1.2s (0.9s + 0.3s for scale animation)
      // Start fade out after animation + duration
      const fadeOutTimer = setTimeout(() => {
        setShouldFadeOut(true);
      }, duration);

      // Remove from DOM after fade out completes
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) {
          onComplete();
        }
      }, duration + 200); // 200ms for fade out animation

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(removeTimer);
      };
    } else {
      setIsVisible(false);
      setShouldFadeOut(false);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimationContainer shouldFadeOut={shouldFadeOut}>
      <StyledSvg
        size={size}
        className="checkmark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
      >
        <Circle
          className="checkmark__circle"
          cx="26"
          cy="26"
          r="25"
          fill="none"
        />
        <Check
          className="checkmark__check"
          fill="none"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </StyledSvg>
    </AnimationContainer>
  );
}
