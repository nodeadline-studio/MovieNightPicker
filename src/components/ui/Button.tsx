import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = `
    relative flex items-center justify-center font-semibold 
    transition-all duration-300 ease-out rounded-2xl 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    transform hover:scale-[1.02] active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    shadow-lg hover:shadow-xl
  `;
  
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
      hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
      text-white focus:ring-purple-500 hover:shadow-purple-500/25
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
      before:rounded-2xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-gradient-to-r from-pink-500 to-rose-500 
      hover:from-pink-400 hover:to-rose-400
      text-white focus:ring-pink-500 hover:shadow-pink-500/25
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent 
      before:rounded-2xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    outline: `
      bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30
      text-white focus:ring-white/50 backdrop-blur-sm
    `,
    ghost: `
      text-gray-300 hover:text-white hover:bg-white/10 
      focus:ring-white/50 backdrop-blur-sm
    `,
  };
  
  const sizeStyles = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && <span>{icon}</span>}
      {children}
      </span>
    </button>
  );
};

export default Button;