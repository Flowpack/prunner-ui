import classNames from "classnames";
import React from "react";
import Spinner from "./Spinner";

const IconButton = ({
  onClick,
  disabled = false,
  title,
  loading = false,
  danger = false,
  children,
}) => {
  return (
    <button
      className={
        classNames(
          "text-white text-sm transition-colors flex justify-center items-center",
          {
            "hover:bg-gray-500": !danger,
            "hover:bg-red": danger
          }
        )
      }
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
      className={`bg-blue transition-all duration-300 ${disabled
        ? "bg-opacity-30 bg-gray"
        : "hover:bg-opacity-60"
        } py-2 px-3 relative`}
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
