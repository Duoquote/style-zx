import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export function Button({ className, children, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={className}
            zx={{
                appearance: 'none',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                p: '10px 20px',
                transition: 'all 0.2s ease',
                color: 'white',
                '&:hover': {
                    opacity: 0.9,
                    transform: 'translateY(-1px)'
                },
                '&:active': {
                    transform: 'translateY(1px)'
                }
            }}
        >
            {children}
        </button>
    );
}
