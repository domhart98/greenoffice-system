"use client";

import ButtonSpinner from "../button_spinner";

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading: boolean;
  children: React.ReactNode;
}

export default function LoadingButton({
  loading,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={className}
    >
      <span className="flex items-center justify-center gap-2">
        {loading && <ButtonSpinner />}
        {children}
      </span>
    </button>
  );
}