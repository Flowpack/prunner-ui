import React from "react";
import Spinner from "./Spinner";

const IconButton = ({
  onClick,
  disabled = false,
  title,
  loading = false,
  children,
}) => {
  return (
    <button
      className="text-white rounded-lg text-sm hover:bg-gray-400 bg-opacity-30 transition-colors duration-300 border-2 border-gray-400 border-opacity-30 w-6 h-6 flex justify-center items-center"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};

const TextButton = ({
  onClick,
  disabled = false,
  title,
  loading = false,
  children,
}) => {
  return (
    <button
      className={`bg-green-500 transition-all duration-300 ${
        disabled
          ? "bg-opacity-30"
          : "bg-opacity-60 hover:bg-opacity-80"
      } rounded-md py-2 px-3 relative`}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? (
        <>
          <div className="opacity-0">{children}</div>
          <div className="absolute  inset-0 flex justify-center items-center">
            <Spinner size="md" />
          </div>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export { IconButton, TextButton };
