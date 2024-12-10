import React from "react";
import Lottie from "react-lottie";
import loader from "../../public/lottie/loader.json";

interface LoadingIndicatorProps {
  size?: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = (props) => {
  const { size } = props;

  return (
    <div>
      <Lottie
        options={{
          animationData: loader,
          loop: true,
          autoplay: true,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
          },
        }}
        height={size || 200}
        width={size || 200}
      />
    </div>
  );
};

export default LoadingIndicator;
