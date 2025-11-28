import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
}

export function Button({ className, variant = 'primary', children, ...props }: ButtonProps) {
    const isPrimary = variant === 'primary';

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
                bg: isPrimary ? '$theme.colors.primary' : '$theme.colors.secondary',
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
